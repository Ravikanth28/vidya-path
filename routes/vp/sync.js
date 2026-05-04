/**
 * Sync engine endpoint — replays offline-queued events.
 *
 *   POST /api/vp/sync/replay   — { events: [{kind, payload, client_ts}] }
 * Supported kinds:
 *   - lesson_progress      payload: { lesson_id, status, mastery_pct, last_position }
 *   - quiz_answer          payload: { item_id, answer, time_taken_ms, lang? }
 *   - lesson_complete      payload: { lesson_id }
 *   - voice_query          payload: { lesson_id, lang, question, answer, mode, provider }
 *
 * Each event is logged to vp_sync_events for audit.
 */
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = function syncRoutes(pool, authenticate) {
    const router = express.Router();

    router.post('/sync/replay', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const events = Array.isArray(req.body?.events) ? req.body.events : [];
        if (!events.length) return res.json({ applied: 0, results: [] });

        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const baseUrl = `${req.protocol}://${req.get('host')}/api/vp`;
        const results = [];
        let applied = 0;

        for (const evt of events) {
            const eventId = uuidv4();
            try {
                await pool.query(
                    `INSERT INTO vp_sync_events (id, student_id, kind, payload_json, client_ts)
                     VALUES (?,?,?,?,?)`,
                    [eventId, sid, evt.kind || 'unknown', JSON.stringify(evt.payload || {}),
                     evt.client_ts ? new Date(evt.client_ts) : null]
                );

                let outcome;
                switch (evt.kind) {
                    case 'lesson_progress': {
                        const p = evt.payload || {};
                        await pool.query(
                            `INSERT INTO vp_lesson_progress (student_id, lesson_id, status, mastery_pct, last_position)
                             VALUES (?,?,?,?,?)
                             ON DUPLICATE KEY UPDATE
                               status = COALESCE(VALUES(status), status),
                               mastery_pct = COALESCE(VALUES(mastery_pct), mastery_pct),
                               last_position = COALESCE(VALUES(last_position), last_position)`,
                            [sid, p.lesson_id, p.status || null, p.mastery_pct ?? null, p.last_position ?? null]
                        );
                        outcome = { ok: true };
                        break;
                    }
                    case 'lesson_complete': {
                        const p = evt.payload || {};
                        await pool.query(
                            `INSERT INTO vp_lesson_progress (student_id, lesson_id, status, last_position)
                             VALUES (?,?, 'completed', 100)
                             ON DUPLICATE KEY UPDATE status = 'completed', last_position = 100`,
                            [sid, p.lesson_id]
                        );
                        outcome = { ok: true };
                        break;
                    }
                    case 'quiz_answer': {
                        // Reuse the live endpoint so theta/BKT/SRS run uniformly.
                        const r = await axios.post(`${baseUrl}/quiz/answer`, evt.payload || {}, {
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            timeout: 15000
                        });
                        outcome = { ok: true, ...r.data };
                        break;
                    }
                    case 'voice_query': {
                        const p = evt.payload || {};
                        await pool.query(
                            `INSERT INTO vp_voice_queries (id, student_id, lesson_id, mode, lang, question, answer, provider)
                             VALUES (?,?,?,?,?,?,?,?)`,
                            [uuidv4(), sid, p.lesson_id || null, p.mode || 'text', p.lang || 'en',
                             String(p.question || '').slice(0, 4000), String(p.answer || '').slice(0, 8000), p.provider || 'offline']
                        );
                        outcome = { ok: true };
                        break;
                    }
                    default:
                        outcome = { ok: false, error: 'unknown kind' };
                }

                if (outcome?.ok) {
                    applied += 1;
                    await pool.query(
                        'UPDATE vp_sync_events SET applied = 1, applied_at = NOW() WHERE id = ?',
                        [eventId]
                    );
                }
                results.push({ kind: evt.kind, ...outcome });
            } catch (err) {
                results.push({ kind: evt.kind, ok: false, error: err.message });
            }
        }

        res.json({ applied, total: events.length, results });
    });

    router.get('/sync/ping', authenticate, (req, res) => res.json({ ok: true, ts: Date.now() }));

    return router;
};
