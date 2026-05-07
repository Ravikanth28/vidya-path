/**
 * Diagnostic test — one-time IRT 3-PL placement assessment.
 *
 *   GET  /api/vp/diagnostic/state          — has the student done it?
 *   GET  /api/vp/diagnostic/items          — fetch the diagnostic question bank
 *   POST /api/vp/diagnostic/submit         — submit answers, score with IRT, write theta
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ml = require('../../services/vp/ml_client');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = function diagnosticRoutes(pool, authenticate) {
    const router = express.Router();
    const requireAdmin = (req, res, next) => {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
    };

    router.get('/diagnostic/state', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                'SELECT diagnostic_done, completed_at, result_json FROM vp_diagnostic_state WHERE student_id = ?',
                [sid]
            );
            const [[latestAttempt]] = await pool.query(
                `SELECT id, mode, status, score, total_marks, created_at, submitted_at
                 FROM vp_diagnostic_attempts
                 WHERE student_id = ?
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [sid]
            );
            const [planRows] = await pool.query(
                'SELECT COUNT(*) AS count FROM vp_personalized_plans WHERE student_id = ?',
                [sid]
            );
            const r = rows[0];
            res.json({
                done: !!(r?.diagnostic_done),
                completed_at: r?.completed_at || null,
                result: r?.result_json || null,
                latest_attempt: latestAttempt || null,
                plans_count: Number(planRows?.[0]?.count || 0)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/plans', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT id, attempt_id, test_id, title, summary_json, plan_json, created_at
                 FROM vp_personalized_plans
                 WHERE student_id = ?
                 ORDER BY created_at DESC
                 LIMIT 20`,
                [sid]
            );
            res.json({ plans: rows.map(normalizePlanRow) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/history', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT id, test_id, mode, language, grade, subject, topic, scope,
                        score, total_marks, report_json, personalized_plan_json, created_at, submitted_at
                 FROM vp_diagnostic_attempts
                 WHERE student_id = ? AND status = 'submitted'
                 ORDER BY submitted_at DESC, created_at DESC
                 LIMIT 30`,
                [sid]
            );
            res.json({
                results: rows.map(r => ({
                    id: r.id,
                    test_id: r.test_id,
                    mode: r.mode,
                    language: r.language,
                    grade: r.grade,
                    subject: r.subject,
                    topic: r.topic,
                    scope: r.scope,
                    score: Number(r.score || 0),
                    total_marks: Number(r.total_marks || 0),
                    report: toJSON(r.report_json, {}),
                    personalized_plan: toJSON(r.personalized_plan_json, null),
                    created_at: r.created_at,
                    submitted_at: r.submitted_at
                }))
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/syllabus-upload', authenticate, upload.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'file required' });
        try {
            const parsed = await parseSyllabusUpload(req.file);
            res.json({ ok: true, ...parsed });
        } catch (err) {
            res.status(400).json({ error: err.message });
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

    router.post('/diagnostic/student-choice/start', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const {
            language = 'en',
            grade,
            subject,
            topic = '',
            scope = 'subject',
            education_level = 'school',
            college_year = null,
            syllabus_scope = 'whole_syllabus',
            unit_name = '',
            syllabus_text = ''
        } = req.body || {};

        const isCollege = String(education_level).toLowerCase() === 'college';
        const normalizedSubject = String(subject || '').trim() || (isCollege ? 'General' : 'General');
        const gradeNum = Number(isCollege ? college_year : grade);
        if (isCollege) {
            if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 6) {
                return res.status(400).json({ error: 'college year must be between 1 and 6' });
            }
            if (!String(syllabus_text || '').trim() && !String(topic || unit_name || '').trim()) {
                return res.status(400).json({ error: 'upload syllabus or provide unit/topic for college diagnostic' });
            }
        } else if (!Number.isFinite(gradeNum) || gradeNum < 8 || gradeNum > 12) {
            return res.status(400).json({ error: 'grade must be between 8 and 12' });
        }

        try {
            const candidates = await getQuestionCandidates(pool, {
                subject: normalizedSubject,
                grade: gradeNum,
                topic,
                language,
                scope,
                educationLevel: isCollege ? 'college' : 'school'
            });

            const syllabusKeywords = extractKeywordsFromText(String(syllabus_text || ''), 24);
            const topicInput = String(topic || '').trim();
            const unitInput = String(unit_name || '').trim();

            // Priority: explicit topic > unit (when unit-wise) > no explicit context
            const effectiveTopic = topicInput || (syllabus_scope === 'unit_wise' ? unitInput : '');

            const questionPaper = buildQuestionPaper(candidates, {
                subject: normalizedSubject,
                topic: effectiveTopic,
                grade: gradeNum,
                language,
                educationLevel: isCollege ? 'college' : 'school',
                syllabusKeywords,
                syllabusScope: syllabus_scope,
                collegeYear: isCollege ? gradeNum : null,
                questionContext: {
                    topicInput,
                    unitInput,
                    hasSyllabus: !!String(syllabus_text || '').trim()
                }
            });

            const attemptId = uuidv4();
            await pool.query(
                `INSERT INTO vp_diagnostic_attempts
                 (id, student_id, mode, language, grade, subject, topic, scope, question_paper_json)
                 VALUES (?,?,?,?,?,?,?,?,?)`,
                [
                    attemptId,
                    sid,
                    'student_choice',
                    language,
                    gradeNum,
                    normalizedSubject,
                    effectiveTopic || null,
                    scope,
                    JSON.stringify(questionPaper)
                ]
            );

            res.json({
                ok: true,
                attempt_id: attemptId,
                mode: 'student_choice',
                question_paper: stripAnswers(questionPaper)
            });
        } catch (err) {
            console.error('[vp] student choice start:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/student-choice/submit', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { attempt_id, answers = [] } = req.body || {};
        if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });

        try {
            const [[row]] = await pool.query(
                `SELECT * FROM vp_diagnostic_attempts
                 WHERE id = ? AND student_id = ? AND mode = 'student_choice'`,
                [attempt_id, sid]
            );
            if (!row) return res.status(404).json({ error: 'attempt not found' });
            if (row.status === 'submitted') {
                return res.json({
                    ok: true,
                    already_submitted: true,
                    report: toJSON(row.report_json, {}),
                    personalized_plan: toJSON(row.personalized_plan_json, null)
                });
            }

            const questionPaper = toJSON(row.question_paper_json, []);
            const evaluation = evaluateDiagnostic(questionPaper, answers);
            const plan = buildPersonalizedPlan({
                report: evaluation.report,
                subject: row.subject,
                topic: row.topic,
                scope: row.scope,
                grade: row.grade
            });

            await finalizeDiagnosticAttempt(pool, {
                sid,
                attemptId: attempt_id,
                row,
                answers,
                evaluation,
                plan
            });

            res.json({ ok: true, report: evaluation.report, personalized_plan: plan });
        } catch (err) {
            console.error('[vp] student choice submit:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/teacher-tests', authenticate, async (req, res) => {
        const grade = req.query.grade ? Number(req.query.grade) : null;
        const subject = req.query.subject ? String(req.query.subject).trim() : null;
        const language = req.query.language ? String(req.query.language).trim() : null;

        try {
            const where = ['is_published = 1'];
            const vals = [];
            if (Number.isFinite(grade)) {
                where.push('(grade IS NULL OR grade = ?)');
                vals.push(grade);
            }
            if (subject) {
                where.push('(subject IS NULL OR subject = ?)');
                vals.push(subject);
            }
            if (language) {
                where.push('(language = ? OR language = "en")');
                vals.push(language);
            }
            const [rows] = await pool.query(
                `SELECT id, title, description, language, grade, subject, topic, scope, created_at
                 FROM vp_diagnostic_tests
                 WHERE ${where.join(' AND ')}
                 ORDER BY created_at DESC
                 LIMIT 100`,
                vals
            );
            res.json({ tests: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/teacher-tests/:id', authenticate, async (req, res) => {
        try {
            const [[row]] = await pool.query(
                `SELECT id, title, description, language, grade, subject, topic, scope, question_paper_json, is_published
                 FROM vp_diagnostic_tests WHERE id = ?`,
                [req.params.id]
            );
            if (!row || !row.is_published) return res.status(404).json({ error: 'test not found' });
            res.json({
                test: {
                    ...row,
                    question_paper: stripAnswers(toJSON(row.question_paper_json, []))
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/teacher-tests/:id/start', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [[test]] = await pool.query(
                `SELECT * FROM vp_diagnostic_tests WHERE id = ? AND is_published = 1`,
                [req.params.id]
            );
            if (!test) return res.status(404).json({ error: 'test not found' });
            const attemptId = uuidv4();
            await pool.query(
                `INSERT INTO vp_diagnostic_attempts
                 (id, student_id, test_id, mode, language, grade, subject, topic, scope, question_paper_json)
                 VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [
                    attemptId,
                    sid,
                    test.id,
                    'teacher_upload',
                    test.language || 'en',
                    test.grade || null,
                    test.subject || null,
                    test.topic || null,
                    test.scope || 'subject',
                    test.question_paper_json
                ]
            );
            res.json({
                ok: true,
                attempt_id: attemptId,
                mode: 'teacher_upload',
                test: {
                    id: test.id,
                    title: test.title,
                    subject: test.subject,
                    grade: test.grade,
                    question_paper: stripAnswers(toJSON(test.question_paper_json, []))
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/teacher-tests/submit', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { attempt_id, answers = [] } = req.body || {};
        if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });

        try {
            const [[row]] = await pool.query(
                `SELECT * FROM vp_diagnostic_attempts
                 WHERE id = ? AND student_id = ? AND mode = 'teacher_upload'`,
                [attempt_id, sid]
            );
            if (!row) return res.status(404).json({ error: 'attempt not found' });
            if (row.status === 'submitted') {
                return res.json({
                    ok: true,
                    already_submitted: true,
                    report: toJSON(row.report_json, {}),
                    personalized_plan: toJSON(row.personalized_plan_json, null)
                });
            }

            const questionPaper = toJSON(row.question_paper_json, []);
            const evaluation = evaluateDiagnostic(questionPaper, answers);
            const plan = buildPersonalizedPlan({
                report: evaluation.report,
                subject: row.subject,
                topic: row.topic,
                scope: row.scope,
                grade: row.grade
            });

            await finalizeDiagnosticAttempt(pool, {
                sid,
                attemptId: attempt_id,
                row,
                answers,
                evaluation,
                plan
            });

            res.json({ ok: true, report: evaluation.report, personalized_plan: plan });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Admin endpoints for teacher-authored diagnostic tests
    router.get('/diagnostic/admin/tests', authenticate, requireAdmin, async (_req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, title, description, source_type, language, grade, subject, topic, scope,
                        is_published, created_at, updated_at,
                        JSON_LENGTH(question_paper_json) AS question_count
                 FROM vp_diagnostic_tests
                 ORDER BY created_at DESC`
            );
            res.json({ tests: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/admin/tests/manual', authenticate, requireAdmin, async (req, res) => {
        const uid = String(req.user.id);
        const {
            title,
            description = '',
            language = 'en',
            grade = null,
            subject = null,
            topic = null,
            scope = 'subject',
            questions = []
        } = req.body || {};

        if (!title || !Array.isArray(questions) || !questions.length) {
            return res.status(400).json({ error: 'title and questions[] required' });
        }

        try {
            const normalized = normalizeTeacherQuestions(questions);
            if (!normalized.length) return res.status(400).json({ error: 'no valid questions found' });

            const id = uuidv4();
            await pool.query(
                `INSERT INTO vp_diagnostic_tests
                 (id, created_by, source_type, title, description, language, grade, subject, topic, scope, question_paper_json, is_published)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
                [
                    id,
                    uid,
                    'teacher_manual',
                    String(title).trim(),
                    description,
                    language,
                    grade ? Number(grade) : null,
                    subject,
                    topic,
                    scope,
                    JSON.stringify(normalized)
                ]
            );
            res.json({ ok: true, id, question_count: normalized.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/admin/tests/upload', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
        const uid = String(req.user.id);
        const {
            title,
            description = '',
            language = 'en',
            grade = null,
            subject = null,
            topic = null,
            scope = 'subject'
        } = req.body || {};
        if (!req.file) return res.status(400).json({ error: 'file required' });
        if (!title) return res.status(400).json({ error: 'title required' });

        try {
            const parsed = await parseDiagnosticUpload(req.file);
            const normalized = normalizeTeacherQuestions(parsed.questions || []);
            if (!normalized.length) return res.status(400).json({ error: 'unable to parse valid questions from file' });

            const id = uuidv4();
            await pool.query(
                `INSERT INTO vp_diagnostic_tests
                 (id, created_by, source_type, title, description, language, grade, subject, topic, scope, question_paper_json, is_published)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
                [
                    id,
                    uid,
                    'teacher_upload',
                    String(title).trim(),
                    description,
                    language,
                    grade ? Number(grade) : null,
                    subject,
                    topic,
                    scope,
                    JSON.stringify(normalized)
                ]
            );
            res.json({ ok: true, id, parsed: normalized.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/admin/tests/:id/publish', authenticate, requireAdmin, async (req, res) => {
        const isPublished = req.body?.is_published ? 1 : 0;
        try {
            await pool.query(
                'UPDATE vp_diagnostic_tests SET is_published = ? WHERE id = ?',
                [isPublished, req.params.id]
            );
            res.json({ ok: true, is_published: !!isPublished });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/admin/plans', authenticate, requireAdmin, async (req, res) => {
        const studentId = req.query.student_id ? String(req.query.student_id) : null;
        try {
            let sql =
                `SELECT p.id, p.student_id, u.name AS student_name, u.email AS student_email,
                        p.attempt_id, p.test_id, p.title, p.summary_json, p.plan_json, p.created_at
                 FROM vp_personalized_plans p
                 LEFT JOIN users u ON u.id = p.student_id`;
            const vals = [];
            if (studentId) {
                sql += ' WHERE p.student_id = ?';
                vals.push(studentId);
            }
            sql += ' ORDER BY p.created_at DESC LIMIT 300';
            const [rows] = await pool.query(sql, vals);
            res.json({ plans: rows.map(r => ({ ...normalizePlanRow(r), student_name: r.student_name, student_email: r.student_email })) });
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

function toJSON(v, fallback) {
    if (v == null) return fallback;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return fallback; }
}

function normalizePlanRow(row) {
    return {
        id: row.id,
        attempt_id: row.attempt_id,
        test_id: row.test_id,
        title: row.title,
        summary: toJSON(row.summary_json, {}),
        plan: toJSON(row.plan_json, {}),
        created_at: row.created_at
    };
}

async function getQuestionCandidates(pool, { subject, grade, topic, language, educationLevel = 'school' }) {
    if (educationLevel === 'college') return [];

    const vals = [subject, grade, grade, grade];
    let where =
        `qi.is_diagnostic = 0
         AND qi.subject = ?
         AND (
             l.grade IS NULL OR l.grade = ? OR
             (c.grade_min IS NOT NULL AND c.grade_max IS NOT NULL AND ? BETWEEN c.grade_min AND c.grade_max) OR
             c.id IS NULL
         )`;

    if (topic) {
        where += ' AND (LOWER(c.title) LIKE ? OR LOWER(l.title) LIKE ?)';
        const t = `%${String(topic).toLowerCase()}%`;
        vals.push(t, t);
    }

    const [rows] = await pool.query(
        `SELECT qi.id, qi.kind, qi.prompt_i18n, qi.options_i18n, qi.answer_key, qi.subject,
                qi.a, qi.b, qi.c,
                c.title AS concept_title, l.title AS lesson_title
         FROM vp_quiz_items qi
         LEFT JOIN vp_concepts c ON c.id = qi.concept_id
         LEFT JOIN vp_lessons l ON l.id = qi.lesson_id
         WHERE ${where}
         ORDER BY qi.created_at DESC
         LIMIT 300`,
        vals
    );

    return rows.map(r => ({
        id: r.id,
        type: r.kind || 'mcq',
        text: tryPick(r.prompt_i18n, language) || tryPick(r.prompt_i18n, 'en') || 'Question',
        options: tryPick(r.options_i18n, language) || tryPick(r.options_i18n, 'en') || [],
        answer_key: r.answer_key || '',
        topic: r.concept_title || r.lesson_title || subject,
        subject: r.subject,
        a: Number(r.a || 1),
        b: Number(r.b || 0),
        c: Number(r.c || 0.2)
    }));
}

function buildQuestionPaper(candidates, {
    subject,
    topic,
    grade,
    language,
    educationLevel = 'school',
    syllabusKeywords = [],
    syllabusScope = 'whole_syllabus',
    collegeYear = null,
    questionContext = {}
}) {

    const topicInput = String(questionContext.topicInput || '').trim();
    const unitInput = String(questionContext.unitInput || '').trim();
    const hasSyllabus = !!questionContext.hasSyllabus;

    // Context priority: topic > unit-wise unit > whole syllabus keywords > fallback subject
    const resolvedContext = topicInput
        ? { kind: 'topic', value: topicInput }
        : (syllabusScope === 'unit_wise' && unitInput)
            ? { kind: 'unit', value: unitInput }
            : (hasSyllabus && syllabusKeywords.length)
                ? { kind: 'syllabus', value: syllabusKeywords[0] }
                : { kind: 'fallback', value: topic || subject || 'Core Concepts' };

    const mcqCandidates = shuffle(
        (candidates || [])
            .filter(c => ['mcq', 'tf'].includes(c.type))
            .filter(c => Array.isArray(c.options) && c.options.length >= 3)
    );
    const shortCandidates = shuffle((candidates || []).filter(c => c.type === 'short'));

    const oneMark = [];
    const seen = new Set();

    for (const c of mcqCandidates) {
        const text = String(c.text || '').trim();
        if (!text || seen.has(text.toLowerCase())) continue;
        seen.add(text.toLowerCase());
        oneMark.push({
            ...c,
            qid: `q-${uuidv4()}`,
            marks: 1,
            type: c.type === 'tf' ? 'mcq' : c.type
        });
        if (oneMark.length >= 15) break;
    }

    if (oneMark.length < 15) {
        const needed = 15 - oneMark.length;
        const synth = generateSyntheticQuestions({
            subject,
            topic: resolvedContext.value,
            grade,
            educationLevel,
            collegeYear,
            keywords: syllabusKeywords,
            count: needed,
            type: 'mcq',
            seedBase: 40
        });
        oneMark.push(...synth.map(q => ({ ...q, qid: `q-${uuidv4()}`, marks: 1 })));
    }

    const twoMarkBase = shortCandidates[0] || generateSyntheticQuestions({
        subject,
        topic: resolvedContext.value,
        grade,
        educationLevel,
        collegeYear,
        keywords: syllabusKeywords,
        count: 1,
        type: 'short',
        seedBase: 101
    })[0];

    const fiveMarkBase = shortCandidates[1] || generateSyntheticQuestions({
        subject,
        topic: resolvedContext.value,
        grade,
        educationLevel,
        collegeYear,
        keywords: syllabusKeywords,
        count: 1,
        type: 'long',
        seedBase: 203
    })[0];

    const twoMark = [{
        ...twoMarkBase,
        qid: `q-${uuidv4()}`,
        marks: 2,
        type: 'short'
    }];

    const fiveMark = [{
        ...fiveMarkBase,
        qid: `q-${uuidv4()}`,
        marks: 5,
        type: 'long'
    }];

    return [...oneMark, ...twoMark, ...fiveMark].map((q, i) => ({
        ...q,
        index: i + 1,
        answer_key: q.answer_key || '',
        meta: {
            education_level: educationLevel,
            syllabus_scope: syllabusScope,
            college_year: collegeYear,
            context_kind: resolvedContext.kind,
            context_value: resolvedContext.value
        }
    }));
}

function generateSyntheticQuestions({ subject, topic, grade, educationLevel, collegeYear, keywords = [], count = 1, type = 'mcq', seedBase = 1 }) {
    const out = [];
    const baseTopic = String(topic || keywords[0] || subject || 'Core Concepts').trim();
    const keyPool = keywords.length ? keywords : [baseTopic, subject, 'concept'];

    for (let i = 0; i < count; i += 1) {
        const seed = seedBase + i;
        if (type === 'mcq') {
            out.push(generateOneMcq({ subject, baseTopic, grade, educationLevel, collegeYear, keyPool, seed }));
        } else if (type === 'short') {
            const k1 = keyPool[(seed + 1) % keyPool.length];
            out.push({
                type: 'short',
                subject,
                topic: baseTopic,
                text: `Explain the role of ${k1} in ${baseTopic} with one practical example${educationLevel === 'college' ? ' from your syllabus' : ''}.`,
                options: [],
                answer_key: `${k1},definition,example,application`
            });
        } else {
            const k1 = keyPool[(seed + 2) % keyPool.length];
            const k2 = keyPool[(seed + 4) % keyPool.length];
            out.push({
                type: 'long',
                subject,
                topic: baseTopic,
                text: `Write a detailed answer on ${baseTopic}: include concept of ${k1}, process/steps, and one real-life or industry application related to ${k2}.`,
                options: [],
                answer_key: `${k1},${k2},steps,application,example,diagram`
            });
        }
    }
    return out;
}

function generateOneMcq({ subject, baseTopic, grade, educationLevel, collegeYear, keyPool, seed }) {
    const subj = String(subject || '').toLowerCase();

    if (subj.includes('math') || baseTopic.toLowerCase().includes('algebra')) {
        const a = 2 + (seed % 7);
        const b = 3 + ((seed * 2) % 9);
        const x = 1 + (seed % 6);
        const c = a * x + b;
        const text = `Solve for x: ${a}x + ${b} = ${c}`;
        const correct = String(x);
        const opts = uniqueOptions([correct, String(x + 1), String(Math.max(0, x - 1)), String(x + 2)]);
        return { type: 'mcq', subject, topic: baseTopic, text, options: opts, answer_key: correct };
    }

    if (subj.includes('science')) {
        const k = keyPool[seed % keyPool.length];
        const text = `Which statement best explains ${k} in ${baseTopic}?`;
        const correct = `${k} describes the core principle and its measurable effect.`;
        const opts = uniqueOptions([
            correct,
            `${k} is unrelated to observations and cannot be tested.`,
            `${k} applies only in language studies.`,
            `${k} means memorizing formulas without understanding.`
        ]);
        return { type: 'mcq', subject, topic: baseTopic, text, options: opts, answer_key: correct };
    }

    if (subj.includes('program')) {
        const n = 3 + (seed % 5);
        const text = `What is the output of this expression? ${n} * (${n - 1})`;
        const correct = String(n * (n - 1));
        const opts = uniqueOptions([correct, String(n + (n - 1)), String(n * n), String((n - 1) * (n - 1))]);
        return { type: 'mcq', subject, topic: baseTopic, text, options: opts, answer_key: correct };
    }

    if (subj.includes('english')) {
        const text = `Choose the best sentence with correct grammar for ${baseTopic}.`;
        const correct = 'The student has completed the assignment and reviewed the feedback.';
        const opts = uniqueOptions([
            correct,
            'The student have complete assignment and review feedback.',
            'The student completed assignment but not reviewed it properly yesterday now.',
            'Student was complete the assignment and reviews feedbacks.'
        ]);
        return { type: 'mcq', subject, topic: baseTopic, text, options: opts, answer_key: correct };
    }

    const levelLabel = educationLevel === 'college' ? `Year ${collegeYear || ''}` : `Grade ${grade || ''}`;
    const k = keyPool[seed % keyPool.length];
    const text = `${levelLabel}: Which option is most relevant to understanding ${k} in ${baseTopic}?`;
    const correct = `Definition, key process, and one practical application of ${k}.`;
    const opts = uniqueOptions([
        correct,
        `Only memorizing the term ${k} without application.`,
        `Ignoring the concept and focusing on unrelated topics.`,
        `Learning ${k} without examples, diagrams, or context.`
    ]);
    return { type: 'mcq', subject, topic: baseTopic, text, options: opts, answer_key: correct };
}

function uniqueOptions(options) {
    const out = [];
    const seen = new Set();
    for (const o of options) {
        const t = String(o || '').trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(t);
    }
    return out.slice(0, 4);
}

function stripAnswers(questionPaper) {
    return (questionPaper || []).map(q => ({
        qid: q.qid,
        index: q.index,
        type: q.type,
        marks: q.marks,
        subject: q.subject,
        topic: q.topic,
        text: q.text,
        options: q.options || []
    }));
}

function evaluateDiagnostic(questionPaper, answersInput) {
    const byQid = {};
    for (const a of (Array.isArray(answersInput) ? answersInput : [])) {
        if (!a?.question_id) continue;
        byQid[String(a.question_id)] = String(a.answer ?? '');
    }

    let total = 0;
    let score = 0;
    const perQuestion = [];
    const topicAgg = {};

    for (const q of (questionPaper || [])) {
        const ans = byQid[q.qid] || '';
        const marks = Number(q.marks || 0);
        total += marks;

        const result = evaluateSingleQuestion(q, ans);
        score += result.score;

        const tKey = String(q.topic || q.subject || 'General');
        if (!topicAgg[tKey]) topicAgg[tKey] = { score: 0, total: 0, attempts: 0, subject: q.subject || 'General' };
        topicAgg[tKey].score += result.score;
        topicAgg[tKey].total += marks;
        topicAgg[tKey].attempts += 1;

        perQuestion.push({
            qid: q.qid,
            index: q.index,
            question: q.text,
            type: q.type,
            marks,
            obtained: Number(result.score.toFixed(2)),
            student_answer: ans,
            expected_answer: q.answer_key || null,
            correct: result.correct,
            feedback: result.feedback,
            topic: q.topic,
            subject: q.subject
        });
    }

    const percentage = total > 0 ? (score / total) * 100 : 0;
    const stage =
        percentage >= 85 ? 'Advanced' :
        percentage >= 65 ? 'Intermediate' :
        percentage >= 45 ? 'Developing' : 'Foundation';

    const topicBreakdown = Object.entries(topicAgg).map(([topic, v]) => ({
        topic,
        subject: v.subject,
        score: Number(v.score.toFixed(2)),
        total: v.total,
        percentage: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0,
        attempts: v.attempts
    })).sort((a, b) => a.percentage - b.percentage);

    const weakTopics = topicBreakdown.filter(t => t.percentage < 60).slice(0, 6);
    const meta = questionPaper?.[0]?.meta || {};

    return {
        report: {
            score: Number(score.toFixed(2)),
            total_marks: total,
            percentage: Math.round(percentage),
            stage,
            education_level: meta.education_level || 'school',
            college_year: meta.college_year || null,
            weak_topics: weakTopics,
            topic_breakdown: topicBreakdown,
            question_wise: perQuestion,
            summary: {
                attempted: perQuestion.filter(p => String(p.student_answer || '').trim()).length,
                total_questions: perQuestion.length,
                correct_like: perQuestion.filter(p => p.correct).length
            }
        }
    };
}

function evaluateSingleQuestion(question, answer) {
    const marks = Number(question.marks || 0);
    const normalized = String(answer || '').trim().toLowerCase();
    const key = String(question.answer_key || '').trim().toLowerCase();

    if (!normalized) return { score: 0, correct: false, feedback: 'No answer submitted.' };

    if (question.type === 'mcq' || question.type === 'tf') {
        const correct = normalized === key;
        return {
            score: correct ? marks : 0,
            correct,
            feedback: correct ? 'Correct choice.' : 'Incorrect option. Revise this concept.'
        };
    }

    const keywords = String(question.answer_key || '')
        .split(/[;,\n]/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8);

    if (!keywords.length) {
        const shortEnough = normalized.split(/\s+/).length >= (question.type === 'long' ? 40 : 10);
        const ratio = shortEnough ? 0.7 : 0.4;
        return {
            score: Number((marks * ratio).toFixed(2)),
            correct: ratio >= 0.6,
            feedback: shortEnough
                ? 'Good effort. Add clearer key terms for full marks.'
                : 'Answer is too brief. Add concept definition and examples.'
        };
    }

    let hit = 0;
    for (const kw of keywords) if (normalized.includes(kw)) hit += 1;
    const ratio = Math.min(1, hit / keywords.length);
    const score = Number((marks * ratio).toFixed(2));
    return {
        score,
        correct: ratio >= 0.6,
        feedback: ratio >= 0.8
            ? 'Strong answer with key points.'
            : ratio >= 0.5
                ? 'Partially correct. Include more key concepts.'
                : 'Weak answer. Revisit definitions, steps, and examples.'
    };
}

function buildPersonalizedPlan({ report, subject, topic, scope, grade }) {
    const weakTopics = (report.weak_topics || []).length
        ? report.weak_topics
        : [{ topic: topic || subject || 'Core Concepts', percentage: report.percentage || 0 }];

    const topicPlans = weakTopics.slice(0, 6).map((t, idx) => {
        const tName = String(t.topic || 'Core Concepts');
        const cur = Number(t.percentage || 0);
        const target = Math.min(100, Math.max(cur + 20, 70));
        const resources = getResourceBundle({ subject, topic: tName, grade });
        const notesText = buildQuickNotes({ subject, topic: tName, grade });
        return {
            rank: idx + 1,
            topic: tName,
            current_pct: cur,
            target_pct: target,
            why_struggle: `Accuracy in ${tName} is ${cur}%. Needs better concept clarity and structured practice.`,
            weekly_focus: [
                `Week 1: Build fundamentals of ${tName} with examples and notes.`,
                `Week 2: Practice 20 MCQs and 6 descriptive questions on ${tName}.`,
                `Week 3: Timed revision + mini test for ${tName}.`
            ],
            daily_tasks: [
                `Read notes for ${tName} (25 mins).`,
                `Solve 10 one-mark and 2 short-answer questions on ${tName}.`,
                'Maintain an error log and retry mistakes.'
            ],
            resources,
            notes: {
                file_name: `${slugify(tName)}-notes.txt`,
                content: notesText
            }
        };
    });

    return {
        title: `${subject || 'Subject'} detailed personalized improvement plan`,
        stage: report.stage,
        target_score: Math.min(100, Number(report.percentage || 0) + 20),
        horizon_days: 28,
        weekly_goals: [
            `Week 1: Strengthen fundamentals for ${subject || 'selected subject'}`,
            'Week 2: Topic-wise targeted practice on weak areas',
            'Week 3: Mixed-level problem solving with timed attempts',
            'Week 4: Full diagnostic retest and final revision'
        ],
        topic_plans: topicPlans,
        recommendations: [
            'Follow topic plans in sequence from weakest to strongest.',
            'Use resources after each practice block for reinforcement.',
            'Retake diagnostic every 3-4 weeks to track improvement.'
        ]
    };
}

async function finalizeDiagnosticAttempt(pool, { sid, attemptId, row, answers, evaluation, plan }) {
    await pool.query(
        `UPDATE vp_diagnostic_attempts
         SET answers_json = ?, report_json = ?, personalized_plan_json = ?,
             score = ?, total_marks = ?, status = 'submitted', submitted_at = NOW()
         WHERE id = ?`,
        [
            JSON.stringify(answers),
            JSON.stringify(evaluation.report),
            JSON.stringify(plan),
            evaluation.report.score,
            evaluation.report.total_marks,
            attemptId
        ]
    );

    const planId = uuidv4();
    await pool.query(
        `INSERT INTO vp_personalized_plans (id, student_id, attempt_id, test_id, title, summary_json, plan_json)
         VALUES (?,?,?,?,?,?,?)`,
        [
            planId,
            sid,
            attemptId,
            row.test_id || null,
            plan.title,
            JSON.stringify({
                stage: evaluation.report.stage,
                score: evaluation.report.score,
                total_marks: evaluation.report.total_marks,
                percentage: evaluation.report.percentage,
                weak_topics: evaluation.report.weak_topics || []
            }),
            JSON.stringify(plan)
        ]
    );

    await pool.query(
        `INSERT INTO vp_diagnostic_state (student_id, diagnostic_done, completed_at, result_json)
         VALUES (?, 1, NOW(), ?)
         ON DUPLICATE KEY UPDATE diagnostic_done = 1, completed_at = NOW(), result_json = VALUES(result_json)`,
        [
            sid,
            JSON.stringify({
                stage: evaluation.report.stage,
                percentage: evaluation.report.percentage,
                score: evaluation.report.score,
                total_marks: evaluation.report.total_marks,
                weak_topics: evaluation.report.weak_topics,
                topic_breakdown: evaluation.report.topic_breakdown,
                attempt_id: attemptId,
                generated_plan_id: planId
            })
        ]
    );

    await pool.query(
        `INSERT INTO vp_user_prefs (student_id, diagnostic_done) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE diagnostic_done = 1`,
        [sid]
    );

    await pool.query(
        `INSERT INTO vp_notifications (id, student_id, kind, title, body, data_json)
         VALUES (?,?,?,?,?,?)`,
        [
            uuidv4(),
            sid,
            'diagnostic_plan_ready',
            'Diagnostic analysis ready',
            'Your detailed report and personalized study plan are now available.',
            JSON.stringify({ attempt_id: attemptId, stage: evaluation.report.stage, percentage: evaluation.report.percentage })
        ]
    );
}

function normalizeTeacherQuestions(questions) {
    return (questions || []).map((q, idx) => {
        const marks = Number(q.marks || 1);
        const type = String(q.type || 'mcq').toLowerCase();
        return {
            qid: q.qid || `q-${uuidv4()}`,
            index: idx + 1,
            type: ['mcq', 'short', 'long', 'tf'].includes(type) ? type : 'mcq',
            marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
            subject: q.subject || 'General',
            topic: q.topic || q.subject || 'General',
            text: String(q.text || q.question || '').trim(),
            options: Array.isArray(q.options) ? q.options.map(x => String(x)) : [],
            answer_key: String(q.answer_key || q.answer || '').trim()
        };
    }).filter(q => q.text.length > 0);
}

async function parseDiagnosticUpload(file) {
    const ext = (file.originalname || '').toLowerCase().split('.').pop();
    if (ext === 'csv') {
        const text = file.buffer.toString('utf8');
        const rows = parseCSV(text);
        return { questions: rowsToQuestions(rows) };
    }
    if (ext === 'xlsx' || ext === 'xls') {
        let ExcelJS;
        try {
            ExcelJS = require('exceljs');
        } catch {
            throw new Error('Excel upload requires exceljs package on server.');
        }
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(file.buffer);
        const ws = wb.worksheets[0];
        const rows = [];
        ws.eachRow((row) => rows.push((row.values || []).slice(1).map(v => String(v ?? '').trim())));
        return { questions: rowsToQuestions(rows) };
    }
    if (ext === 'pdf') {
        let pdfParse;
        try {
            pdfParse = require('pdf-parse');
        } catch {
            throw new Error('PDF upload support is unavailable on server (pdf-parse missing). Use CSV or Excel.');
        }
        const parsed = await pdfParse(file.buffer);
        const questions = pdfTextToQuestions(parsed.text || '');
        return { questions };
    }
    throw new Error('Unsupported file format. Use PDF, CSV, or Excel.');
}

async function parseSyllabusUpload(file) {
    const ext = (file.originalname || '').toLowerCase().split('.').pop();
    if (ext === 'txt' || ext === 'md') {
        const text = file.buffer.toString('utf8');
        return {
            syllabus_text: text,
            units: extractUnits(text),
            keywords: extractKeywordsFromText(text, 30)
        };
    }
    if (ext === 'csv') {
        const text = file.buffer.toString('utf8');
        const rows = parseCSV(text);
        const flat = rows.map(r => r.join(' ')).join('\n');
        return {
            syllabus_text: flat,
            units: extractUnits(flat),
            keywords: extractKeywordsFromText(flat, 30)
        };
    }
    if (ext === 'xlsx' || ext === 'xls') {
        let ExcelJS;
        try { ExcelJS = require('exceljs'); } catch { throw new Error('Excel upload requires exceljs package on server.'); }
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(file.buffer);
        const rows = [];
        for (const ws of wb.worksheets) {
            ws.eachRow((row) => rows.push((row.values || []).slice(1).map(v => String(v ?? '').trim()).join(' ')));
        }
        const text = rows.join('\n');
        return {
            syllabus_text: text,
            units: extractUnits(text),
            keywords: extractKeywordsFromText(text, 30)
        };
    }
    if (ext === 'pdf') {
        let pdfParse;
        try { pdfParse = require('pdf-parse'); } catch { throw new Error('PDF upload support is unavailable on server (pdf-parse missing). Use TXT/CSV/Excel.'); }
        const parsed = await pdfParse(file.buffer);
        const text = String(parsed.text || '');
        return {
            syllabus_text: text,
            units: extractUnits(text),
            keywords: extractKeywordsFromText(text, 30)
        };
    }
    throw new Error('Unsupported syllabus format. Use TXT, CSV, Excel, or PDF.');
}

function extractUnits(text) {
    const lines = String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const units = [];
    for (const ln of lines) {
        if (/^(unit|module|chapter)\s*\d+/i.test(ln)) units.push(ln);
    }
    if (!units.length) {
        return lines.filter(ln => ln.length > 12 && ln.length < 90).slice(0, 12);
    }
    return units.slice(0, 20);
}

function extractKeywordsFromText(text, limit = 20) {
    const stop = new Set(['the','and','for','with','that','from','this','into','your','have','will','are','was','were','not','you','use','using','can','has','had','than','then','each','also','all','any','one','two','three','about','where','when','what','how','why','their','there','which','into','been','being','more','most','very','able','across','within','unit','module','chapter','topic']);
    const words = String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stop.has(w));
    const freq = new Map();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

function getResourceBundle({ subject, topic, grade }) {
    const q = encodeURIComponent(`${subject} ${topic} ${grade ? `grade ${grade}` : ''}`);
    return {
        youtube: [
            { title: `${topic} concept videos`, url: `https://www.youtube.com/results?search_query=${q}+explained` },
            { title: `${topic} solved problems`, url: `https://www.youtube.com/results?search_query=${q}+solved+questions` }
        ],
        books: [
            { title: `${subject} standard textbook`, ref: `${subject} foundational textbook chapters on ${topic}` },
            { title: `${subject} problem workbook`, ref: `Practice workbook section: ${topic}` }
        ],
        notes: [
            { title: `${topic} quick revision notes`, type: 'downloadable_txt' }
        ]
    };
}

function buildQuickNotes({ subject, topic, grade }) {
    return [
        `Topic: ${topic}`,
        `Subject: ${subject}`,
        `Level: ${grade ? `Grade/Year ${grade}` : 'Current level'}`,
        '',
        '1. Core idea',
        `- Write the definition of ${topic} in your own words.`,
        '',
        '2. Key points to remember',
        `- Main formula/rule for ${topic}`,
        '- Common mistakes and how to avoid them',
        '',
        '3. Practice checklist',
        '- 10 one-mark questions',
        '- 2 short-answer questions',
        '- 1 long-answer question with real-life application',
        '',
        '4. Revision strategy',
        '- Revise errors from your diagnostic report',
        '- Reattempt wrong questions after 2 days'
    ].join('\n');
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'notes';
}

function parseCSV(text) {
    return String(text || '').split(/\r?\n/).filter(Boolean).map(parseCsvLine);
}

function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            out.push(cur.trim());
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur.trim());
    return out;
}

function rowsToQuestions(rows) {
    if (!rows.length) return [];
    const header = rows[0].map(h => String(h || '').toLowerCase());
    const hasHeader = header.includes('question') || header.includes('text');
    const start = hasHeader ? 1 : 0;

    const questions = [];
    for (let i = start; i < rows.length; i += 1) {
        const r = rows[i];
        if (!r || !r.length) continue;
        const q = hasHeader
            ? mapByHeader(header, r)
            : {
                text: r[0],
                type: r[1] || 'mcq',
                marks: Number(r[2] || 1),
                answer_key: r[3] || '',
                options: (r[4] || '').split(';').map(s => s.trim()).filter(Boolean),
                topic: r[5] || '',
                subject: r[6] || 'General'
            };
        if (!q.text) continue;
        questions.push(q);
    }
    return questions;
}

function mapByHeader(header, row) {
    const pick = (keys, def = '') => {
        for (const k of keys) {
            const idx = header.indexOf(k);
            if (idx >= 0) return row[idx] || def;
        }
        return def;
    };
    return {
        text: pick(['question', 'text', 'prompt']),
        type: pick(['type', 'kind'], 'mcq'),
        marks: Number(pick(['marks', 'mark'], 1)),
        answer_key: pick(['answer', 'answer_key', 'key']),
        options: String(pick(['options', 'choices'], '')).split(';').map(s => s.trim()).filter(Boolean),
        topic: pick(['topic', 'concept']),
        subject: pick(['subject'], 'General')
    };
}

function pdfTextToQuestions(text) {
    const chunks = String(text || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const questions = [];
    for (const line of chunks) {
        if (!/[?.:]$/.test(line) && line.length < 25) continue;
        if (/answer\s*[:\-]/i.test(line)) continue;
        questions.push({
            text: line,
            type: 'short',
            marks: questions.length < 15 ? 1 : (questions.length === 15 ? 2 : 5),
            answer_key: '',
            options: [],
            topic: 'Uploaded Topic',
            subject: 'General'
        });
        if (questions.length >= 30) break;
    }
    return questions;
}

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
