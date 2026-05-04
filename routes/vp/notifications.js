/**
 * In-app notifications (VidyaPath).
 *
 *   GET  /api/vp/notifications              — unread by default; ?all=1 for full list
 *   POST /api/vp/notifications/:id/read
 *   POST /api/vp/notifications/read-all
 */
const express = require('express');

module.exports = function notifRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/notifications', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const all = req.query.all === '1';
        try {
            const sql = all
                ? 'SELECT id, kind, title, body, data_json, is_read, created_at FROM vp_notifications WHERE student_id = ? ORDER BY created_at DESC LIMIT 100'
                : 'SELECT id, kind, title, body, data_json, is_read, created_at FROM vp_notifications WHERE student_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 50';
            const [rows] = await pool.query(sql, [sid]);
            const [count] = await pool.query(
                'SELECT COUNT(*) AS unread FROM vp_notifications WHERE student_id = ? AND is_read = 0',
                [sid]
            );
            res.json({ items: rows, unread: Number(count[0]?.unread || 0) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/notifications/:id/read', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            await pool.query(
                'UPDATE vp_notifications SET is_read = 1 WHERE id = ? AND student_id = ?',
                [req.params.id, sid]
            );
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/notifications/read-all', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            await pool.query(
                'UPDATE vp_notifications SET is_read = 1 WHERE student_id = ? AND is_read = 0', [sid]
            );
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
