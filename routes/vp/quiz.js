/**
 * Adaptive Quiz — bandit-driven item selection, IRT theta update,
 * BKT mastery update, SRS review scheduling, AI grading for short answer.
 *
 *   GET  /api/vp/quiz/lesson/:lessonId/start        — start quiz session, return first batch
 *   POST /api/vp/quiz/next                          — pick next item by bandit
 *   POST /api/vp/quiz/answer                        — submit one answer, get feedback
 *   POST /api/vp/quiz/lesson/:lessonId/finish       — finalise session, update theta
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ml = require('../../services/vp/ml_client');
const llm = require('../../services/vp/llm_router');

function pickLang(json, lang = 'en') {
    if (!json) return null;
    try {
        const o = typeof json === 'string' ? JSON.parse(json) : json;
        return o?.[lang] ?? o?.en ?? Object.values(o)[0] ?? null;
    } catch { return null; }
}

async function getTheta(pool, sid, subject) {
    const [rows] = await pool.query(
        'SELECT theta FROM vp_student_ability WHERE student_id = ? AND subject = ?',
        [sid, subject]
    );
    return rows[0] ? Number(rows[0].theta) : 0;
}

async function getMastery(pool, sid, conceptId) {
    const [rows] = await pool.query(
        'SELECT p_mastery, ease, interval_days, reps FROM vp_student_mastery WHERE student_id = ? AND concept_id = ?',
        [sid, conceptId]
    );
    return rows[0] || { p_mastery: 0.1, ease: 2.5, interval_days: 0, reps: 0 };
}

module.exports = function quizRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/quiz/lesson/:lessonId/start', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lessonId = req.params.lessonId;
        try {
            const [lr] = await pool.query('SELECT subject, concept_id FROM vp_lessons WHERE id = ?', [lessonId]);
            const lesson = lr[0];
            if (!lesson) return res.status(404).json({ error: 'lesson not found' });

            const [items] = await pool.query(
                `SELECT id, subject, kind, prompt_i18n, options_i18n, a, b, c
                 FROM vp_quiz_items WHERE lesson_id = ? AND is_diagnostic = 0`,
                [lessonId]
            );
            const theta = await getTheta(pool, sid, lesson.subject);
            const mastery = await getMastery(pool, sid, lesson.concept_id);

            res.json({
                session_id: uuidv4(),
                lesson_id: lessonId,
                subject: lesson.subject,
                concept_id: lesson.concept_id,
                theta,
                mastery: Number(mastery.p_mastery),
                items: items.map(r => ({
                    id: r.id,
                    kind: r.kind,
                    prompt: pickLang(r.prompt_i18n, req.query.lang || 'en'),
                    options: pickLang(r.options_i18n, req.query.lang || 'en') || [],
                    a: Number(r.a), b: Number(r.b), c: Number(r.c)
                }))
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/quiz/next', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { lesson_id, exclude = [] } = req.body || {};
        if (!lesson_id) return res.status(400).json({ error: 'lesson_id required' });
        try {
            const [lr] = await pool.query('SELECT subject FROM vp_lessons WHERE id = ?', [lesson_id]);
            if (!lr[0]) return res.status(404).json({ error: 'lesson not found' });
            const subject = lr[0].subject;

            const placeholders = exclude.length ? exclude.map(() => '?').join(',') : null;
            const sql = placeholders
                ? `SELECT id, kind, prompt_i18n, options_i18n, a, b, c FROM vp_quiz_items
                   WHERE lesson_id = ? AND is_diagnostic = 0 AND id NOT IN (${placeholders})`
                : `SELECT id, kind, prompt_i18n, options_i18n, a, b, c FROM vp_quiz_items
                   WHERE lesson_id = ? AND is_diagnostic = 0`;
            const params = placeholders ? [lesson_id, ...exclude] : [lesson_id];
            const [items] = await pool.query(sql, params);

            if (!items.length) return res.json({ done: true });

            const theta = await getTheta(pool, sid, subject);
            const candidates = items.map(r => ({ id: r.id, a: Number(r.a), b: Number(r.b), c: Number(r.c) }));
            const sel = await ml.banditSelect({ student_id: sid, theta, candidates, epsilon: 0.15 });
            const picked = items.find(i => i.id === sel?.selected?.id) || items[0];

            res.json({
                done: false,
                reason: sel?.reason,
                item: {
                    id: picked.id,
                    kind: picked.kind,
                    prompt: pickLang(picked.prompt_i18n, req.body.lang || 'en'),
                    options: pickLang(picked.options_i18n, req.body.lang || 'en') || [],
                    a: Number(picked.a), b: Number(picked.b), c: Number(picked.c)
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/quiz/answer', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { item_id, answer, time_taken_ms = 0, lang = 'en' } = req.body || {};
        if (!item_id) return res.status(400).json({ error: 'item_id required' });
        try {
            const [rows] = await pool.query(
                `SELECT id, lesson_id, concept_id, subject, kind, prompt_i18n, answer_key, rubric_i18n, a, b, c
                 FROM vp_quiz_items WHERE id = ?`, [item_id]
            );
            const it = rows[0];
            if (!it) return res.status(404).json({ error: 'item not found' });

            let correct = 0;
            let score = 0;
            let aiFeedback = null;

            if (it.kind === 'short') {
                const grade = await llm.evaluateShortAnswer({
                    question: pickLang(it.prompt_i18n, 'en'),
                    expected: it.answer_key,
                    studentAnswer: String(answer || ''),
                    rubric: pickLang(it.rubric_i18n, 'en'),
                    lang,
                    maxScore: 10
                });
                aiFeedback = grade;
                score = grade.score / 10; // normalise to 0..1
                correct = score >= 0.6 ? 1 : 0;
            } else {
                const norm = s => String(s ?? '').trim().toLowerCase();
                correct = norm(answer) === norm(it.answer_key) ? 1 : 0;
                score = correct;
            }

            // Record attempt
            await pool.query(
                `INSERT INTO vp_attempts (id, student_id, item_id, lesson_id, subject, student_answer, correct, score, ai_feedback, time_taken_ms)
                 VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), sid, it.id, it.lesson_id, it.subject, String(answer ?? ''), correct, Number(score).toFixed(3), aiFeedback ? JSON.stringify(aiFeedback) : null, Number(time_taken_ms) || 0]
            );

            // BKT mastery update for the concept
            if (it.concept_id) {
                const m = await getMastery(pool, sid, it.concept_id);
                const out = await ml.bktUpdateRemote({ p_mastery: Number(m.p_mastery), correct });
                const newP = Number(out.p_mastery ?? m.p_mastery);

                // SRS schedule (quality 0..5: scale from correctness)
                const quality = correct ? Math.min(5, 3 + Math.round(score * 2)) : 1;
                const sched = await ml.srsSchedule({
                    ease: Number(m.ease), interval: Number(m.interval_days),
                    reps: Number(m.reps), quality
                });

                await pool.query(
                    `INSERT INTO vp_student_mastery
                       (student_id, concept_id, p_mastery, ease, interval_days, reps, next_due)
                     VALUES (?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE
                       p_mastery = VALUES(p_mastery),
                       ease = VALUES(ease),
                       interval_days = VALUES(interval_days),
                       reps = VALUES(reps),
                       next_due = VALUES(next_due)`,
                    [sid, it.concept_id, newP.toFixed(4), Number(sched.ease).toFixed(3),
                     Number(sched.interval), Number(sched.reps),
                     sched.next_due ? new Date(sched.next_due) : null]
                );

                // Mirror onto lesson mastery_pct
                if (it.lesson_id) {
                    await pool.query(
                        `INSERT INTO vp_lesson_progress (student_id, lesson_id, status, mastery_pct)
                         VALUES (?,?, 'in_progress', ?)
                         ON DUPLICATE KEY UPDATE
                           mastery_pct = ?,
                           status = IF(status = 'completed', status, 'in_progress')`,
                        [sid, it.lesson_id, (newP * 100).toFixed(2), (newP * 100).toFixed(2)]
                    );
                }
            }

            res.json({
                correct,
                score,
                expected: it.kind === 'short' ? null : it.answer_key,
                feedback: aiFeedback
            });
        } catch (err) {
            console.error('[vp] quiz answer:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/quiz/lesson/:lessonId/finish', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lessonId = req.params.lessonId;
        try {
            const [lr] = await pool.query('SELECT subject, concept_id FROM vp_lessons WHERE id = ?', [lessonId]);
            const lesson = lr[0];
            if (!lesson) return res.status(404).json({ error: 'lesson not found' });

            // Pull recent attempts for this lesson
            const [attempts] = await pool.query(
                `SELECT a.correct, a.score, qi.a AS qa, qi.b AS qb, qi.c AS qc
                 FROM vp_attempts a
                 JOIN vp_quiz_items qi ON qi.id = a.item_id
                 WHERE a.student_id = ? AND a.lesson_id = ?
                 ORDER BY a.attempted_at DESC LIMIT 30`,
                [sid, lessonId]
            );
            if (!attempts.length) return res.json({ ok: true, message: 'no attempts' });

            const responses = attempts.map(a => ({
                a: Number(a.qa), b: Number(a.qb), c: Number(a.qc),
                correct: a.correct ? 1 : 0
            }));

            const prior = await getTheta(pool, sid, lesson.subject);
            const est = await ml.irtEstimate({ responses, prior_theta: prior });
            await pool.query(
                `INSERT INTO vp_student_ability (student_id, subject, theta, n_responses)
                 VALUES (?,?,?,?)
                 ON DUPLICATE KEY UPDATE theta = VALUES(theta), n_responses = n_responses + VALUES(n_responses)`,
                [sid, lesson.subject, Number(est.theta).toFixed(3), responses.length]
            );

            const totalCorrect = attempts.filter(a => a.correct).length;
            const totalScore = attempts.reduce((s, a) => s + Number(a.score), 0);
            const accuracy = totalCorrect / attempts.length;

            // Notify
            await pool.query(
                `INSERT INTO vp_notifications (id, student_id, kind, title, body, data_json)
                 VALUES (?,?,?,?,?,?)`,
                [uuidv4(), sid, 'quiz_result',
                 `Quiz finished — ${(accuracy * 100).toFixed(0)}% correct`,
                 `Your ${lesson.subject} ability updated to theta = ${Number(est.theta).toFixed(2)}.`,
                 JSON.stringify({ lesson_id: lessonId, accuracy, theta: est.theta })]
            );
            await pool.query(
                'UPDATE vp_user_prefs SET xp_points = xp_points + ? WHERE student_id = ?',
                [Math.round(totalScore * 4), sid]
            );

            res.json({
                ok: true,
                accuracy,
                attempts: attempts.length,
                theta: Number(est.theta),
                lesson_id: lessonId
            });
        } catch (err) {
            console.error('[vp] quiz finish:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
