/**
 * Diagnostic test — one-time IRT 3-PL placement assessment.
 *
 *   GET  /api/vp/diagnostic/state          — has the student done it?
 *   GET  /api/vp/diagnostic/items          — fetch the diagnostic question bank
 *   POST /api/vp/diagnostic/submit         — submit answers, score with IRT, write theta
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ml = require('../../services/vp/ml_client');

module.exports = function diagnosticRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/diagnostic/state', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                'SELECT diagnostic_done, completed_at, result_json FROM vp_diagnostic_state WHERE student_id = ?',
                [sid]
            );
            const r = rows[0];
            res.json({
                done: !!(r?.diagnostic_done),
                completed_at: r?.completed_at || null,
                result: r?.result_json || null
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/items', authenticate, async (req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, subject, kind, prompt_i18n, options_i18n, a, b, c
                 FROM vp_quiz_items WHERE is_diagnostic = 1
                 ORDER BY subject, b ASC LIMIT 30`
            );
            const items = rows.map(r => ({
                id: r.id,
                subject: r.subject,
                kind: r.kind,
                prompt: tryPick(r.prompt_i18n),
                options: tryPick(r.options_i18n) || [],
                a: Number(r.a), b: Number(r.b), c: Number(r.c)
            }));
            res.json({ items, total: items.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/submit', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
        if (!answers.length) return res.status(400).json({ error: 'answers[] required' });

        try {
            const ids = answers.map(a => a.item_id).filter(Boolean);
            const [items] = await pool.query(
                'SELECT id, subject, answer_key, a, b, c FROM vp_quiz_items WHERE id IN (?)',
                [ids.length ? ids : ['__none__']]
            );
            const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

            // Group responses by subject for IRT
            const bySubject = {};
            const attempts = [];
            for (const a of answers) {
                const it = itemMap[a.item_id];
                if (!it) continue;
                const correct = String(a.answer ?? '').trim().toLowerCase() === String(it.answer_key ?? '').trim().toLowerCase() ? 1 : 0;
                bySubject[it.subject] = bySubject[it.subject] || [];
                bySubject[it.subject].push({ a: Number(it.a), b: Number(it.b), c: Number(it.c), correct });
                attempts.push({
                    id: uuidv4(),
                    student_id: sid,
                    item_id: it.id,
                    lesson_id: null,
                    subject: it.subject,
                    student_answer: String(a.answer ?? ''),
                    correct,
                    score: correct
                });
            }

            // Estimate theta per subject via ML sidecar (with JS fallback)
            const result = {};
            for (const [subject, responses] of Object.entries(bySubject)) {
                const est = await ml.irtEstimate({ responses, prior_theta: 0 });
                result[subject] = { theta: est.theta, n: responses.length, correctness: responses.filter(r => r.correct).length / responses.length };

                await pool.query(
                    `INSERT INTO vp_student_ability (student_id, subject, theta, n_responses)
                     VALUES (?,?,?,?)
                     ON DUPLICATE KEY UPDATE theta = VALUES(theta), n_responses = VALUES(n_responses)`,
                    [sid, subject, Number(est.theta).toFixed(3), responses.length]
                );
            }

            // Persist attempts
            for (const a of attempts) {
                await pool.query(
                    `INSERT INTO vp_attempts (id, student_id, item_id, lesson_id, subject, student_answer, correct, score)
                     VALUES (?,?,?,?,?,?,?,?)`,
                    [a.id, a.student_id, a.item_id, a.lesson_id, a.subject, a.student_answer, a.correct, a.score]
                );
            }

            // Mark diagnostic done
            await pool.query(
                `INSERT INTO vp_diagnostic_state (student_id, diagnostic_done, completed_at, result_json)
                 VALUES (?, 1, NOW(), ?)
                 ON DUPLICATE KEY UPDATE diagnostic_done = 1, completed_at = NOW(), result_json = VALUES(result_json)`,
                [sid, JSON.stringify(result)]
            );
            await pool.query(
                `INSERT INTO vp_user_prefs (student_id, diagnostic_done) VALUES (?, 1)
                 ON DUPLICATE KEY UPDATE diagnostic_done = 1`,
                [sid]
            );

            // Notify
            await pool.query(
                `INSERT INTO vp_notifications (id, student_id, kind, title, body, data_json)
                 VALUES (?,?,?,?,?,?)`,
                [uuidv4(), sid, 'diagnostic_done', 'Placement complete',
                 'Your diagnostic results are ready. Personalised lessons are unlocked.',
                 JSON.stringify(result)]
            );

            res.json({ ok: true, result });
        } catch (err) {
            console.error('[vp] diagnostic submit:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

function tryPick(json, lang = 'en') {
    if (!json) return null;
    try {
        const o = typeof json === 'string' ? JSON.parse(json) : json;
        return o?.[lang] ?? o?.en ?? Object.values(o)[0] ?? null;
    } catch { return null; }
}
