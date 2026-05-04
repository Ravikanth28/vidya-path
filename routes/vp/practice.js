/**
 * Practice Picker — recommended (BKT-driven) and all-completed.
 *
 *   GET /api/vp/practice/recommended
 *   GET /api/vp/practice/completed
 */
const express = require('express');
const ml = require('../../services/vp/ml_client');

module.exports = function practiceRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/practice/recommended', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [masteries] = await pool.query(
                `SELECT m.concept_id, m.p_mastery, m.next_due, c.title, c.subject
                 FROM vp_student_mastery m
                 JOIN vp_concepts c ON c.id = m.concept_id
                 WHERE m.student_id = ?`, [sid]
            );

            const out = await ml.bktNextLessons({
                student_id: sid,
                masteries: masteries.map(m => ({
                    concept_id: m.concept_id,
                    p_mastery: Number(m.p_mastery),
                    title: m.title,
                    subject: m.subject
                })),
                threshold: 0.85,
                limit: 8
            });

            const conceptIds = (out.recommendations || []).map(r => r.concept_id).filter(Boolean);
            let lessons = [];
            if (conceptIds.length) {
                const [rows] = await pool.query(
                    `SELECT l.id, l.title, l.subject, l.concept_id, COALESCE(p.mastery_pct, 0) AS mastery_pct
                     FROM vp_lessons l
                     LEFT JOIN vp_lesson_progress p ON p.lesson_id = l.id AND p.student_id = ?
                     WHERE l.concept_id IN (?)`,
                    [sid, conceptIds]
                );
                lessons = rows;
            } else {
                // Cold start — pick any lesson the student hasn't completed
                const [rows] = await pool.query(
                    `SELECT l.id, l.title, l.subject, l.concept_id, COALESCE(p.mastery_pct, 0) AS mastery_pct
                     FROM vp_lessons l
                     LEFT JOIN vp_lesson_progress p ON p.lesson_id = l.id AND p.student_id = ?
                     WHERE COALESCE(p.status, 'not_started') <> 'completed'
                     ORDER BY l.subject, l.ordering LIMIT 8`, [sid]
                );
                lessons = rows;
            }

            res.json({ items: lessons, source: out.fallback ? 'js-fallback' : 'ml-sidecar' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/practice/completed', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT l.id, l.title, l.subject, p.mastery_pct, p.updated_at
                 FROM vp_lesson_progress p
                 JOIN vp_lessons l ON l.id = p.lesson_id
                 WHERE p.student_id = ? AND p.status = 'completed'
                 ORDER BY p.updated_at DESC`, [sid]
            );
            res.json({ items: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
