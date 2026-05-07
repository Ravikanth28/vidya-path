/**
 * VidyaPath Admin Routes — CRUD for lessons, quiz items, concepts.
 *
 *   GET    /api/vp/admin/concepts           — list all concepts
 *   POST   /api/vp/admin/concepts           — create concept
 *   PUT    /api/vp/admin/concepts/:id       — update concept
 *   DELETE /api/vp/admin/concepts/:id       — delete concept
 *
 *   GET    /api/vp/admin/lessons            — list all lessons (with concept title)
 *   POST   /api/vp/admin/lessons            — create lesson
 *   PUT    /api/vp/admin/lessons/:id        — update lesson
 *   DELETE /api/vp/admin/lessons/:id        — delete lesson
 *
 *   GET    /api/vp/admin/quiz-items         — list all quiz items (optional ?lesson_id=)
 *   POST   /api/vp/admin/quiz-items         — create quiz item
 *   PUT    /api/vp/admin/quiz-items/:id     — update quiz item
 *   DELETE /api/vp/admin/quiz-items/:id     — delete quiz item
 *
 *   GET    /api/vp/admin/stats              — overview counts
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { seedVpCatalog } = require('./seed');

module.exports = function vpAdminRoutes(pool, authenticate) {
    const router = express.Router();

    const requireAdmin = (req, res, next) => {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
    };

    // ── requireAdmin guard ─────────────────────────────────────────────────────
    router.use(authenticate, requireAdmin);

    // ── Stats ──────────────────────────────────────────────────────────────────
    router.get('/admin/stats', async (_req, res) => {
        try {
            const [[{ lessons }]] = await pool.query('SELECT COUNT(*) AS lessons FROM vp_lessons');
            const [[{ quiz_items }]] = await pool.query('SELECT COUNT(*) AS quiz_items FROM vp_quiz_items');
            const [[{ concepts }]] = await pool.query('SELECT COUNT(*) AS concepts FROM vp_concepts');
            const [[{ students }]] = await pool.query('SELECT COUNT(DISTINCT student_id) AS students FROM vp_lesson_progress');
            const [[{ completions }]] = await pool.query("SELECT COUNT(*) AS completions FROM vp_lesson_progress WHERE status='completed'");
            res.json({ lessons, quiz_items, concepts, students, completions });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── Seed trigger ───────────────────────────────────────────────────────────
    router.post('/admin/seed', async (_req, res) => {
        try {
            await seedVpCatalog(pool);
            const [[{ lessons }]] = await pool.query('SELECT COUNT(*) AS lessons FROM vp_lessons');
            const [[{ quiz_items }]] = await pool.query('SELECT COUNT(*) AS quiz_items FROM vp_quiz_items');
            const [[{ concepts }]] = await pool.query('SELECT COUNT(*) AS concepts FROM vp_concepts');
            res.json({ ok: true, message: 'Seed complete (INSERT IGNORE — safe to re-run)', lessons, quiz_items, concepts });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── Concepts ───────────────────────────────────────────────────────────────
    router.get('/admin/concepts', async (_req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM vp_concepts ORDER BY subject, title');
            res.json({ concepts: rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/admin/concepts', async (req, res) => {
        const { subject, title, grade_min = 8, grade_max = 14 } = req.body || {};
        if (!subject || !title) return res.status(400).json({ error: 'subject and title required' });
        const id = uuidv4();
        try {
            await pool.query(
                'INSERT INTO vp_concepts (id, subject, title, grade_min, grade_max) VALUES (?,?,?,?,?)',
                [id, subject.trim(), title.trim(), grade_min, grade_max]
            );
            res.json({ ok: true, id });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.put('/admin/concepts/:id', async (req, res) => {
        const { subject, title, grade_min, grade_max } = req.body || {};
        try {
            await pool.query(
                'UPDATE vp_concepts SET subject=COALESCE(?,subject), title=COALESCE(?,title), grade_min=COALESCE(?,grade_min), grade_max=COALESCE(?,grade_max) WHERE id=?',
                [subject || null, title || null, grade_min ?? null, grade_max ?? null, req.params.id]
            );
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.delete('/admin/concepts/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM vp_concepts WHERE id=?', [req.params.id]);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Lessons ────────────────────────────────────────────────────────────────
    router.get('/admin/lessons', async (_req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT l.*, c.title AS concept_title
                 FROM vp_lessons l
                 LEFT JOIN vp_concepts c ON c.id = l.concept_id
                 ORDER BY l.subject, l.ordering, l.title`
            );
            res.json({ lessons: rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/admin/lessons', async (req, res) => {
        const { concept_id, subject, title, body_en, ordering = 0, grade = 8 } = req.body || {};
        if (!subject || !title) return res.status(400).json({ error: 'subject and title required' });
        const id = uuidv4();
        const body_i18n = JSON.stringify({ en: body_en || '' });
        try {
            await pool.query(
                'INSERT INTO vp_lessons (id, concept_id, subject, title, body_i18n, ordering, grade) VALUES (?,?,?,?,?,?,?)',
                [id, concept_id || null, subject.trim(), title.trim(), body_i18n, ordering, grade]
            );
            res.json({ ok: true, id });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.put('/admin/lessons/:id', async (req, res) => {
        const { concept_id, subject, title, body_en, ordering, grade } = req.body || {};
        try {
            const fields = [];
            const vals = [];
            if (subject    !== undefined) { fields.push('subject=?');    vals.push(subject); }
            if (title      !== undefined) { fields.push('title=?');      vals.push(title); }
            if (concept_id !== undefined) { fields.push('concept_id=?'); vals.push(concept_id || null); }
            if (ordering   !== undefined) { fields.push('ordering=?');   vals.push(ordering); }
            if (grade      !== undefined) { fields.push('grade=?');      vals.push(grade); }
            if (body_en    !== undefined) {
                // Merge with existing i18n, only overwrite 'en'
                const [[row]] = await pool.query('SELECT body_i18n FROM vp_lessons WHERE id=?', [req.params.id]);
                const existing = row ? (typeof row.body_i18n === 'string' ? JSON.parse(row.body_i18n) : row.body_i18n) || {} : {};
                existing.en = body_en;
                fields.push('body_i18n=?');
                vals.push(JSON.stringify(existing));
            }
            if (!fields.length) return res.status(400).json({ error: 'nothing to update' });
            vals.push(req.params.id);
            await pool.query(`UPDATE vp_lessons SET ${fields.join(',')} WHERE id=?`, vals);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.delete('/admin/lessons/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM vp_quiz_items WHERE lesson_id=?', [req.params.id]);
            await pool.query('DELETE FROM vp_lessons WHERE id=?', [req.params.id]);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Quiz Items ─────────────────────────────────────────────────────────────
    router.get('/admin/quiz-items', async (req, res) => {
        const lesson_id = req.query.lesson_id;
        try {
            let sql = `SELECT q.*, l.title AS lesson_title
                       FROM vp_quiz_items q
                       LEFT JOIN vp_lessons l ON l.id = q.lesson_id`;
            const params = [];
            if (lesson_id) { sql += ' WHERE q.lesson_id = ?'; params.push(lesson_id); }
            sql += ' ORDER BY q.subject, q.created_at DESC';
            const [rows] = await pool.query(sql, params);
            res.json({ items: rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/admin/quiz-items', async (req, res) => {
        const { lesson_id, concept_id, subject, kind = 'mcq', prompt_en, options, answer_key, a = 1, b = 0, c = 0.2, is_diagnostic = 0 } = req.body || {};
        if (!subject || !prompt_en) return res.status(400).json({ error: 'subject and prompt_en required' });
        const id = uuidv4();
        const prompt_i18n = JSON.stringify({ en: prompt_en });
        const options_i18n = options ? JSON.stringify({ en: options }) : null;
        try {
            await pool.query(
                `INSERT INTO vp_quiz_items (id, lesson_id, concept_id, subject, kind, prompt_i18n, options_i18n, answer_key, a, b, c, is_diagnostic)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [id, lesson_id || null, concept_id || null, subject.trim(), kind, prompt_i18n, options_i18n, answer_key || null, a, b, c, is_diagnostic ? 1 : 0]
            );
            res.json({ ok: true, id });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.put('/admin/quiz-items/:id', async (req, res) => {
        const { lesson_id, concept_id, subject, kind, prompt_en, options, answer_key, a, b, c, is_diagnostic } = req.body || {};
        try {
            const fields = [];
            const vals = [];
            if (lesson_id    !== undefined) { fields.push('lesson_id=?');    vals.push(lesson_id || null); }
            if (concept_id   !== undefined) { fields.push('concept_id=?');   vals.push(concept_id || null); }
            if (subject      !== undefined) { fields.push('subject=?');      vals.push(subject); }
            if (kind         !== undefined) { fields.push('kind=?');         vals.push(kind); }
            if (answer_key   !== undefined) { fields.push('answer_key=?');   vals.push(answer_key); }
            if (a            !== undefined) { fields.push('a=?');            vals.push(a); }
            if (b            !== undefined) { fields.push('b=?');            vals.push(b); }
            if (c            !== undefined) { fields.push('c=?');            vals.push(c); }
            if (is_diagnostic !== undefined) { fields.push('is_diagnostic=?'); vals.push(is_diagnostic ? 1 : 0); }
            if (prompt_en    !== undefined) {
                const [[row]] = await pool.query('SELECT prompt_i18n FROM vp_quiz_items WHERE id=?', [req.params.id]);
                const existing = row ? (typeof row.prompt_i18n === 'string' ? JSON.parse(row.prompt_i18n) : row.prompt_i18n) || {} : {};
                existing.en = prompt_en;
                fields.push('prompt_i18n=?'); vals.push(JSON.stringify(existing));
            }
            if (options !== undefined) {
                const [[row]] = await pool.query('SELECT options_i18n FROM vp_quiz_items WHERE id=?', [req.params.id]);
                const existing = row ? (typeof row.options_i18n === 'string' ? JSON.parse(row.options_i18n) : row.options_i18n) || {} : {};
                existing.en = options;
                fields.push('options_i18n=?'); vals.push(JSON.stringify(existing));
            }
            if (!fields.length) return res.status(400).json({ error: 'nothing to update' });
            vals.push(req.params.id);
            await pool.query(`UPDATE vp_quiz_items SET ${fields.join(',')} WHERE id=?`, vals);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.delete('/admin/quiz-items/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM vp_quiz_items WHERE id=?', [req.params.id]);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Student Progress (read-only view of existing student data) ─────────────
    // GET /api/vp/admin/student-progress?subject=&status=&student_id=
    router.get('/admin/student-progress', async (req, res) => {
        const { subject, status, student_id } = req.query;
        try {
            let sql = `
                SELECT
                    p.student_id,
                    u.name   AS student_name,
                    u.email  AS student_email,
                    l.id     AS lesson_id,
                    l.title  AS lesson_title,
                    l.subject,
                    p.status,
                    p.mastery_pct,
                    p.updated_at
                FROM vp_lesson_progress p
                JOIN vp_lessons  l ON l.id = p.lesson_id
                LEFT JOIN users  u ON u.id = p.student_id
                WHERE 1=1`;
            const params = [];
            if (subject)    { sql += ' AND l.subject = ?';     params.push(subject); }
            if (status)     { sql += ' AND p.status = ?';      params.push(status); }
            if (student_id) { sql += ' AND p.student_id = ?';  params.push(student_id); }
            sql += ' ORDER BY p.updated_at DESC LIMIT 500';
            const [rows] = await pool.query(sql, params);
            res.json({ rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/vp/admin/student-ability?subject=&student_id=
    router.get('/admin/student-ability', async (req, res) => {
        const { subject, student_id } = req.query;
        try {
            let sql = `
                SELECT
                    a.student_id,
                    u.name  AS student_name,
                    u.email AS student_email,
                    a.subject,
                    a.theta,
                    a.n_responses,
                    a.updated_at
                FROM vp_student_ability a
                LEFT JOIN users u ON u.id = a.student_id
                WHERE 1=1`;
            const params = [];
            if (subject)    { sql += ' AND a.subject = ?';     params.push(subject); }
            if (student_id) { sql += ' AND a.student_id = ?';  params.push(student_id); }
            sql += ' ORDER BY a.updated_at DESC LIMIT 500';
            const [rows] = await pool.query(sql, params);
            res.json({ rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/vp/admin/student-mastery?concept_id=&student_id=
    router.get('/admin/student-mastery', async (req, res) => {
        const { concept_id, student_id } = req.query;
        try {
            let sql = `
                SELECT
                    m.student_id,
                    u.name      AS student_name,
                    u.email     AS student_email,
                    c.title     AS concept_title,
                    c.subject,
                    m.p_mastery,
                    m.ease,
                    m.interval_days,
                    m.reps,
                    m.next_due,
                    m.updated_at
                FROM vp_student_mastery m
                JOIN vp_concepts c ON c.id = m.concept_id
                LEFT JOIN users  u ON u.id = m.student_id
                WHERE 1=1`;
            const params = [];
            if (concept_id) { sql += ' AND m.concept_id = ?'; params.push(concept_id); }
            if (student_id) { sql += ' AND m.student_id = ?'; params.push(student_id); }
            sql += ' ORDER BY m.updated_at DESC LIMIT 500';
            const [rows] = await pool.query(sql, params);
            res.json({ rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/vp/admin/attempts?subject=&student_id=&lesson_id=
    router.get('/admin/attempts', async (req, res) => {
        const { subject, student_id, lesson_id } = req.query;
        try {
            let sql = `
                SELECT
                    a.id,
                    a.student_id,
                    u.name      AS student_name,
                    l.title     AS lesson_title,
                    a.subject,
                    a.correct,
                    a.score,
                    a.time_taken_ms,
                    a.attempted_at
                FROM vp_attempts a
                LEFT JOIN users    u ON u.id = a.student_id
                LEFT JOIN vp_lessons l ON l.id = a.lesson_id
                WHERE 1=1`;
            const params = [];
            if (subject)    { sql += ' AND a.subject = ?';     params.push(subject); }
            if (student_id) { sql += ' AND a.student_id = ?';  params.push(student_id); }
            if (lesson_id)  { sql += ' AND a.lesson_id = ?';   params.push(lesson_id); }
            sql += ' ORDER BY a.attempted_at DESC LIMIT 500';
            const [rows] = await pool.query(sql, params);
            res.json({ rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Student Diagnostics ────────────────────────────────────────────────────
    // GET /api/vp/admin/student-diagnostics
    //   Returns one row per student who has a diagnostic state, joined with their
    //   latest attempt summary and user info.
    router.get('/admin/student-diagnostics', async (req, res) => {
        const { student_id } = req.query;
        try {
            // Derive the latest attempt per student as a subquery in FROM
            // (TiDB does not support subqueries inside ON conditions)
            let sql = `
                SELECT
                    u.id            AS student_id,
                    u.name          AS student_name,
                    u.email         AS student_email,
                    ds.diagnostic_done,
                    ds.completed_at,
                    ds.result_json,
                    COALESCE(tc.tests_taken, 0) AS tests_taken
                FROM vp_diagnostic_state ds
                JOIN users u ON u.id = ds.student_id
                LEFT JOIN (
                    SELECT student_id, COUNT(*) AS tests_taken
                    FROM vp_diagnostic_attempts
                    GROUP BY student_id
                ) tc ON tc.student_id = ds.student_id
                WHERE 1=1`;
            const params = [];
            if (student_id) { sql += ' AND ds.student_id = ?'; params.push(student_id); }
            sql += ' ORDER BY ds.completed_at DESC';
            const [rows] = await pool.query(sql, params);
            // Parse result_json if it's a string
            const out = rows.map(r => ({
                ...r,
                result_json: r.result_json
                    ? (typeof r.result_json === 'string' ? (() => { try { return JSON.parse(r.result_json); } catch { return {}; } })() : r.result_json)
                    : null
            }));
            res.json({ rows: out });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/vp/admin/student-diagnostics/:studentId
    //   Returns all diagnostic attempts for a single student plus their ability/mastery.
    router.get('/admin/student-diagnostics/:studentId', async (req, res) => {
        const sid = req.params.studentId;
        try {
            const [[user]] = await pool.query(
                'SELECT id, name, email, created_at FROM users WHERE id = ?', [sid]
            );
            if (!user) return res.status(404).json({ error: 'Student not found' });

            const [[diagState]] = await pool.query(
                'SELECT diagnostic_done, completed_at, result_json FROM vp_diagnostic_state WHERE student_id = ?', [sid]
            );
            const [attempts] = await pool.query(
                `SELECT id, mode, status, score, total_marks, created_at, submitted_at,
                        answers_json, subject, report_json, personalized_plan_json
                 FROM vp_diagnostic_attempts
                 WHERE student_id = ?
                 ORDER BY created_at DESC`, [sid]
            );
            const [ability] = await pool.query(
                'SELECT subject, theta, n_responses, updated_at FROM vp_student_ability WHERE student_id = ?', [sid]
            );
            const [mastery] = await pool.query(
                `SELECT c.title AS concept_title, c.subject, m.p_mastery, m.reps, m.next_due, m.updated_at
                 FROM vp_student_mastery m
                 JOIN vp_concepts c ON c.id = m.concept_id
                 WHERE m.student_id = ?
                 ORDER BY m.updated_at DESC`, [sid]
            );
            const [lessonProgress] = await pool.query(
                `SELECT l.title, l.subject, p.status, p.mastery_pct, p.updated_at
                 FROM vp_lesson_progress p
                 JOIN vp_lessons l ON l.id = p.lesson_id
                 WHERE p.student_id = ?
                 ORDER BY p.updated_at DESC`, [sid]
            );
            // Latest personalized plan
            const [[latestPlan]] = await pool.query(
                `SELECT plan_json, summary_json, title, created_at
                 FROM vp_personalized_plans
                 WHERE student_id = ?
                 ORDER BY created_at DESC LIMIT 1`, [sid]
            );

            const parseJson = v => {
                if (!v) return null;
                if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
                return v;
            };

            res.json({
                student: user,
                diagnostic_state: diagState ? { ...diagState, result_json: parseJson(diagState.result_json) } : null,
                attempts: attempts.map(a => ({
                    ...a,
                    answers_json: parseJson(a.answers_json),
                    report_json: parseJson(a.report_json),
                    personalized_plan_json: parseJson(a.personalized_plan_json)
                })),
                ability,
                mastery,
                lesson_progress: lessonProgress,
                plan: latestPlan ? {
                    title: latestPlan.title,
                    created_at: latestPlan.created_at,
                    summary: parseJson(latestPlan.summary_json),
                    detail: parseJson(latestPlan.plan_json)
                } : null
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
