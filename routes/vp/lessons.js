/**
 * Lessons — list, detail, progress.
 *
 *   GET  /api/vp/lessons                       — list with filter (status, subject, q)
 *   GET  /api/vp/lessons/:id                   — lesson detail (i18n body)
 *   POST /api/vp/lessons/:id/progress          — set status / position / mastery
 *   POST /api/vp/lessons/:id/complete          — mark complete (audio finished)
 */
const express = require('express');

function pickLang(json, lang = 'en') {
    if (!json) return null;
    try {
        const o = typeof json === 'string' ? JSON.parse(json) : json;
        if (!o || typeof o !== 'object') return null;
        return o[lang] || o.en || Object.values(o)[0] || null;
    } catch { return null; }
}

module.exports = function lessonsRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/lessons', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lang = String(req.query.lang || 'en');
        const status = req.query.status; // not_started | in_progress | completed
        const subject = req.query.subject;
        const q = (req.query.q || '').toString().toLowerCase();

        try {
            const params = [sid];
            let sql = `SELECT l.id, l.subject, l.title, l.body_i18n, l.ordering, l.grade,
                              l.concept_id,
                              COALESCE(p.status, 'not_started') AS status,
                              COALESCE(p.mastery_pct, 0)        AS mastery_pct,
                              COALESCE(p.last_position, 0)      AS last_position
                       FROM vp_lessons l
                       LEFT JOIN vp_lesson_progress p
                         ON p.lesson_id = l.id AND p.student_id = ?
                       WHERE l.title NOT LIKE '% - Practice Test %'`;
            if (subject) { sql += ' AND l.subject = ?'; params.push(subject); }
            sql += ' ORDER BY l.subject, l.ordering, l.title';

            const [rows] = await pool.query(sql, params);
            let items = rows.map(r => ({
                id: r.id,
                subject: r.subject,
                title: r.title,
                concept_id: r.concept_id,
                status: r.status,
                mastery_pct: Number(r.mastery_pct),
                last_position: Number(r.last_position),
                preview: (pickLang(r.body_i18n, lang) || '').slice(0, 160)
            }));
            if (status) items = items.filter(i => i.status === status);
            if (q)      items = items.filter(i => (i.title + ' ' + i.preview).toLowerCase().includes(q));

            // Group by subject for the UI
            const grouped = {};
            for (const it of items) {
                grouped[it.subject] = grouped[it.subject] || [];
                grouped[it.subject].push(it);
            }
            res.json({ items, grouped });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/lessons/:id', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lang = String(req.query.lang || 'en');
        try {
            const [rows] = await pool.query(
                `SELECT l.*, p.status, p.mastery_pct, p.last_position
                 FROM vp_lessons l
                 LEFT JOIN vp_lesson_progress p ON p.lesson_id = l.id AND p.student_id = ?
                 WHERE l.id = ?`,
                [sid, req.params.id]
            );
            const r = rows[0];
            if (!r) return res.status(404).json({ error: 'Lesson not found' });
            res.json({
                id: r.id,
                subject: r.subject,
                title: r.title,
                concept_id: r.concept_id,
                body: pickLang(r.body_i18n, lang),
                bodies: typeof r.body_i18n === 'string' ? JSON.parse(r.body_i18n) : r.body_i18n,
                script: pickLang(r.script_i18n, lang),
                audio_url: pickLang(r.audio_url_i18n, lang),
                difficulty: r.difficulty || 'medium',
                status: r.status || 'not_started',
                mastery_pct: Number(r.mastery_pct || 0),
                last_position: Number(r.last_position || 0)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/lessons/:id/progress', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { status, mastery_pct, last_position } = req.body || {};
        try {
            await pool.query(
                `INSERT INTO vp_lesson_progress (student_id, lesson_id, status, mastery_pct, last_position)
                 VALUES (?,?,?,?,?)
                 ON DUPLICATE KEY UPDATE
                   status = COALESCE(VALUES(status), status),
                   mastery_pct = COALESCE(VALUES(mastery_pct), mastery_pct),
                   last_position = COALESCE(VALUES(last_position), last_position)`,
                [sid, req.params.id, status || null, mastery_pct ?? null, last_position ?? null]
            );
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/lessons/:id/complete', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            await pool.query(
                `INSERT INTO vp_lesson_progress (student_id, lesson_id, status, last_position)
                 VALUES (?,?, 'completed', 100)
                 ON DUPLICATE KEY UPDATE status = 'completed', last_position = 100`,
                [sid, req.params.id]
            );
            await pool.query(
                'UPDATE vp_user_prefs SET xp_points = xp_points + 5 WHERE student_id = ?',
                [sid]
            );
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
