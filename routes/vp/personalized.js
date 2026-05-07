/**
 * Personalized Study route — combines:
 *   • BKT concept mastery (weak areas, SRS queue)
 *   • IRT ability scores per subject
 *   • Bandit-selected next lesson
 *   • Lesson reading progress (what content has been read)
 *   • Recent quiz performance (accuracy by subject/topic)
 *   • Smart Study syllabi + topic notes + test weak areas
 *
 *   GET /api/vp/personalized   — full personalized dashboard data
 */
const express = require('express');
const ml = require('../../services/vp/ml_client');

module.exports = function personalizedRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/personalized', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            // ── 1. BKT mastery per concept (with lesson link) ──────────────────
            const [masteries] = await pool.query(
                `SELECT m.concept_id, m.p_mastery, m.next_due,
                        c.title AS concept_title, c.subject,
                        l.id AS lesson_id, l.title AS lesson_title,
                        COALESCE(lp.mastery_pct, 0) AS lesson_mastery_pct,
                        COALESCE(lp.status, 'not_started') AS lesson_status
                 FROM vp_student_mastery m
                 JOIN vp_concepts c ON c.id = m.concept_id
                 LEFT JOIN vp_lessons l ON l.concept_id = m.concept_id
                 LEFT JOIN vp_lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = ?
                 WHERE m.student_id = ?
                 ORDER BY m.p_mastery ASC`,
                [sid, sid]
            );

            // ── 2. IRT ability per subject ──────────────────────────────────────
            const [abilities] = await pool.query(
                `SELECT subject, theta, n_responses
                 FROM vp_student_ability WHERE student_id = ?
                 ORDER BY subject`,
                [sid]
            );

            // ── 3. Recent quiz performance per subject (last 60 attempts) ───────
            const [recentAttempts] = await pool.query(
                `SELECT subject, correct, score, lesson_id, attempted_at
                 FROM vp_attempts
                 WHERE student_id = ?
                 ORDER BY attempted_at DESC LIMIT 60`,
                [sid]
            );
            // Aggregate accuracy per subject
            const subjectAccuracy = {};
            for (const a of recentAttempts) {
                if (!a.subject) continue;
                if (!subjectAccuracy[a.subject]) subjectAccuracy[a.subject] = { correct: 0, total: 0 };
                subjectAccuracy[a.subject].total++;
                if (a.correct) subjectAccuracy[a.subject].correct++;
            }

            // ── 4. Lesson reading progress ──────────────────────────────────────
            const [lessonProgress] = await pool.query(
                `SELECT lp.lesson_id, lp.status, lp.mastery_pct, lp.updated_at,
                        l.title AS lesson_title, l.subject
                 FROM vp_lesson_progress lp
                 JOIN vp_lessons l ON l.id = lp.lesson_id
                 WHERE lp.student_id = ?
                 ORDER BY lp.updated_at DESC LIMIT 20`,
                [sid]
            );
            const readLessons = lessonProgress.filter(l => l.status !== 'not_started');

            // ── 5. Smart Study syllabi & topics ─────────────────────────────────
            const [syllabi] = await pool.query(
                `SELECT s.id AS syllabus_id, s.title AS syllabus_title, s.subject, s.status, s.created_at
                 FROM vp_syllabi s
                 WHERE s.student_id = ? AND s.status = 'ready'
                 ORDER BY s.created_at DESC LIMIT 6`,
                [sid]
            );

            let smartStudyTopics = [];
            if (syllabi.length) {
                const sylIds = syllabi.map(s => s.syllabus_id);
                const ph = sylIds.map(() => '?').join(',');
                const [topics] = await pool.query(
                    `SELECT t.id, t.title AS topic_title, t.notes_status,
                            u.title AS unit_title, t.syllabus_id,
                            s.title AS syllabus_title, s.subject
                     FROM vp_syllabus_topics t
                     JOIN vp_syllabus_units u ON u.id = t.unit_id
                     JOIN vp_syllabi s ON s.id = t.syllabus_id
                     WHERE t.syllabus_id IN (${ph})
                     ORDER BY t.syllabus_id, u.unit_number`,
                    sylIds
                );
                smartStudyTopics = topics;
            }

            // ── 6. Smart Study test results (weak topics from tests taken) ───────
            const [smartAttempts] = await pool.query(
                `SELECT sa.weak_topics, sa.recommendations, sa.score, sa.total,
                        sa.completed_at, st.syllabus_id,
                        s.title AS syllabus_title, s.subject
                 FROM vp_smart_attempts sa
                 JOIN vp_smart_tests st ON st.id = sa.test_id
                 JOIN vp_syllabi s ON s.id = st.syllabus_id
                 WHERE sa.student_id = ?
                 ORDER BY sa.completed_at DESC LIMIT 10`,
                [sid]
            );

            const [savedPlans] = await pool.query(
                `SELECT id, attempt_id, test_id, title, summary_json, plan_json, created_at
                 FROM vp_personalized_plans
                 WHERE student_id = ?
                 ORDER BY created_at DESC
                 LIMIT 5`,
                [sid]
            );

            // Parse JSON fields and collect unique weak topic titles
            const smartWeakTopics = [];
            const seenTopics = new Set();
            for (const a of smartAttempts) {
                let wt = [];
                try { wt = typeof a.weak_topics === 'string' ? JSON.parse(a.weak_topics) : (a.weak_topics || []); } catch {}
                for (const t of wt) {
                    const key = String(t?.topic || t?.title || t).toLowerCase();
                    if (!seenTopics.has(key)) {
                        seenTopics.add(key);
                        smartWeakTopics.push({
                            title:          t?.topic || t?.title || t,
                            syllabus_title: a.syllabus_title,
                            subject:        a.subject,
                            syllabus_id:    a.syllabus_id
                        });
                    }
                }
            }

            // ── 7. BKT weak areas (p_mastery < 0.85), worst first ──────────────
            const weakAreas = masteries
                .filter(m => Number(m.p_mastery) < 0.85)
                .map(m => ({
                    concept_id:    m.concept_id,
                    concept_title: m.concept_title,
                    subject:       m.subject,
                    p_mastery:     Number(m.p_mastery),
                    mastery_pct:   Math.round(Number(m.p_mastery) * 100),
                    lesson_id:     m.lesson_id,
                    lesson_title:  m.lesson_title,
                    lesson_status: m.lesson_status
                }))
                .slice(0, 8);

            // ── 8. SRS review queue (due today or overdue) ──────────────────────
            const today = new Date().toISOString().slice(0, 10);
            const srsQueue = masteries
                .filter(m => {
                    if (!m.next_due) return false;
                    const d = m.next_due instanceof Date
                        ? m.next_due.toISOString().slice(0, 10)
                        : String(m.next_due).slice(0, 10);
                    return d <= today;
                })
                .map(m => ({
                    concept_id:    m.concept_id,
                    concept_title: m.concept_title,
                    subject:       m.subject,
                    p_mastery:     Number(m.p_mastery),
                    lesson_id:     m.lesson_id,
                    lesson_title:  m.lesson_title
                }))
                .slice(0, 6);

            // ── 9. Bandit: pick best next lesson across all weak areas ──────────
            let banditPick = null;
            if (weakAreas.length > 0) {
                const weakSubject = weakAreas[0].subject;
                const subjectAbility = abilities.find(a => a.subject === weakSubject);
                const theta = subjectAbility ? Number(subjectAbility.theta) : 0;

                const lessonIds = weakAreas.map(w => w.lesson_id).filter(Boolean);
                let candidates = [];
                if (lessonIds.length) {
                    const ph = lessonIds.map(() => '?').join(',');
                    const [items] = await pool.query(
                        `SELECT qi.id, qi.lesson_id, qi.a, qi.b, qi.c,
                                l.title AS lesson_title, l.subject
                         FROM vp_quiz_items qi
                         JOIN vp_lessons l ON l.id = qi.lesson_id
                         WHERE qi.lesson_id IN (${ph}) AND qi.is_diagnostic = 0
                         LIMIT 40`,
                        lessonIds
                    );
                    candidates = items.map(i => ({
                        id: i.id, lesson_id: i.lesson_id,
                        lesson_title: i.lesson_title, subject: i.subject,
                        a: Number(i.a), b: Number(i.b), c: Number(i.c)
                    }));
                }

                if (candidates.length) {
                    const sel = await ml.banditSelect({ student_id: sid, theta, candidates, epsilon: 0.1 }).catch(() => null);
                    if (sel?.selected) {
                        const picked = candidates.find(c => c.id === sel.selected.id);
                        const weakRef = weakAreas.find(w => w.lesson_id === picked?.lesson_id);
                        banditPick = {
                            lesson_id:    picked?.lesson_id,
                            lesson_title: picked?.lesson_title,
                            subject:      picked?.subject,
                            reason:       sel.reason,
                            p_mastery:    weakRef?.p_mastery,
                            mastery_pct:  weakRef?.mastery_pct,
                            source:       'bandit'
                        };
                    }
                }
                // Fallback: just use weakest concept's lesson
                if (!banditPick && weakAreas[0]?.lesson_id) {
                    banditPick = {
                        lesson_id:    weakAreas[0].lesson_id,
                        lesson_title: weakAreas[0].lesson_title,
                        subject:      weakAreas[0].subject,
                        reason:       'weakest',
                        p_mastery:    weakAreas[0].p_mastery,
                        mastery_pct:  weakAreas[0].mastery_pct,
                        source:       'fallback'
                    };
                }
            }

            // ── 10. Subject summary (IRT + quiz accuracy) ──────────────────────
            const subjectSummary = abilities.map(a => {
                const subjectMasteries = masteries.filter(m => m.subject === a.subject);
                const avgMastery = subjectMasteries.length
                    ? subjectMasteries.reduce((s, m) => s + Number(m.p_mastery), 0) / subjectMasteries.length
                    : null;
                const acc = subjectAccuracy[a.subject];
                const abilityScore = Math.round(((Number(a.theta) + 3) / 6) * 100);
                return {
                    subject:        a.subject,
                    theta:          Number(a.theta),
                    ability_score:  abilityScore,
                    n_responses:    Number(a.n_responses),
                    avg_mastery:    avgMastery !== null ? Math.round(avgMastery * 100) : null,
                    concepts:       subjectMasteries.length,
                    quiz_accuracy:  acc ? Math.round((acc.correct / acc.total) * 100) : null,
                    quiz_attempts:  acc ? acc.total : 0
                };
            });

            // Also add subjects from quiz history not yet in ability table
            for (const [subj, acc] of Object.entries(subjectAccuracy)) {
                if (!subjectSummary.find(s => s.subject === subj)) {
                    subjectSummary.push({
                        subject:       subj,
                        theta:         null,
                        ability_score: null,
                        n_responses:   acc.total,
                        avg_mastery:   null,
                        concepts:      0,
                        quiz_accuracy: Math.round((acc.correct / acc.total) * 100),
                        quiz_attempts: acc.total
                    });
                }
            }

            const has_data = masteries.length > 0 || readLessons.length > 0
                || smartStudyTopics.length > 0 || recentAttempts.length > 0;

            res.json({
                ok:               true,
                has_data,
                // BKT/SRS
                weak_areas:       weakAreas,
                srs_queue:        srsQueue,
                bandit_pick:      banditPick,
                total_concepts:   masteries.length,
                mastered_count:   masteries.filter(m => Number(m.p_mastery) >= 0.85).length,
                // IRT + quiz performance
                subject_summary:  subjectSummary,
                // Lesson reading history
                read_lessons:     readLessons.slice(0, 10),
                // Smart Study
                syllabi:          syllabi,
                smart_weak_topics: smartWeakTopics.slice(0, 8),
                smart_topics_count: smartStudyTopics.length,
                smart_notes_ready:  smartStudyTopics.filter(t => t.notes_status === 'ready').length,
                diagnostic_plans: savedPlans.map(p => ({
                    id: p.id,
                    attempt_id: p.attempt_id,
                    test_id: p.test_id,
                    title: p.title,
                    summary: safeJSON(p.summary_json, {}),
                    plan: safeJSON(p.plan_json, {}),
                    created_at: p.created_at
                }))
            });
        } catch (err) {
            console.error('[vp] personalized:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

function safeJSON(v, fallback) {
    if (v == null) return fallback;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return fallback; }
}
