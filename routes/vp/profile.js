/**
 * VidyaPath profile — student-side profile read/write + mastery overview.
 *
 *   GET  /api/vp/profile        — name, grade, board, lang, xp, theta-by-subject, top-mastery
 *   PUT  /api/vp/profile        — { name?, grade?, board?, state?, lang? }
 *   GET  /api/vp/profile/mastery — full per-concept mastery list
 */
const express = require('express');

module.exports = function profileRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/profile', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            // Fetch user from the existing users table (best effort).
            let userRow = {};
            try {
                const [u] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [sid]);
                userRow = u[0] || {};
            } catch { /* table may differ */ }

            const [prefRows] = await pool.query(
                `SELECT lang, grade, board, state, diagnostic_done, xp_points
                 FROM vp_user_prefs WHERE student_id = ?`, [sid]
            );
            let prefs = prefRows[0];
            if (!prefs) {
                await pool.query(
                    `INSERT IGNORE INTO vp_user_prefs (student_id) VALUES (?)`, [sid]
                );
                prefs = { lang: 'en', grade: 9, board: 'CBSE', state: null, diagnostic_done: 0, xp_points: 0 };
            }

            const [ability] = await pool.query(
                'SELECT subject, theta, n_responses FROM vp_student_ability WHERE student_id = ?', [sid]
            );
            const [mastery] = await pool.query(
                `SELECT c.id, c.title, c.subject, m.p_mastery
                 FROM vp_student_mastery m
                 JOIN vp_concepts c ON c.id = m.concept_id
                 WHERE m.student_id = ?
                 ORDER BY m.p_mastery DESC LIMIT 8`, [sid]
            );

            res.json({
                user: { id: sid, name: userRow.name || req.user.name || 'Student', email: userRow.email || req.user.email },
                prefs,
                ability: ability.map(a => ({ subject: a.subject, theta: Number(a.theta), n: Number(a.n_responses) })),
                mastery: mastery.map(m => ({
                    concept_id: m.id, title: m.title, subject: m.subject,
                    p_mastery: Number(m.p_mastery), pct: Math.round(Number(m.p_mastery) * 100)
                }))
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.put('/profile', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { name, grade, board, state, lang } = req.body || {};
        try {
            await pool.query(
                `INSERT INTO vp_user_prefs (student_id, grade, board, state, lang)
                 VALUES (?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE
                   grade = COALESCE(?, grade),
                   board = COALESCE(?, board),
                   state = COALESCE(?, state),
                   lang = COALESCE(?, lang)`,
                [sid, grade ?? 9, board ?? 'CBSE', state ?? null, lang ?? 'en',
                 grade ?? null, board ?? null, state ?? null, lang ?? null]
            );
            if (typeof name === 'string' && name.trim()) {
                try {
                    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), sid]);
                } catch { /* not critical */ }
            }
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/profile/mastery', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT c.id, c.title, c.subject, m.p_mastery, m.next_due, m.reps
                 FROM vp_student_mastery m
                 JOIN vp_concepts c ON c.id = m.concept_id
                 WHERE m.student_id = ?
                 ORDER BY c.subject, c.title`, [sid]
            );
            res.json({
                items: rows.map(r => ({
                    concept_id: r.id, title: r.title, subject: r.subject,
                    p_mastery: Number(r.p_mastery), pct: Math.round(Number(r.p_mastery) * 100),
                    next_due: r.next_due, reps: Number(r.reps)
                }))
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
