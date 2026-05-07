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
const llmRouter = require('../../services/vp/llm_router');

const DIAGNOSTIC_UPLOAD_MAX_MB = 25;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: DIAGNOSTIC_UPLOAD_MAX_MB * 1024 * 1024 }
});

const LANGUAGE_LABELS = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    bn: 'Bengali',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    or: 'Odia',
    pa: 'Punjabi',
    te: 'Telugu',
    ur: 'Urdu'
};

const DIAGNOSTIC_UI_TEXT = {
    test: {
        question: 'Question',
        marks: 'mark(s)',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        exitTest: 'Exit Test',
        writeDetailedAnswer: 'Write your detailed answer...',
        writeAnswer: 'Write your answer...',
        listening: 'Listening...',
        speak: 'Speak',
        stop: 'Stop',
        studentChoiceDiagnostic: 'Student Choice Diagnostic',
        teacherDiagnosticTest: 'Teacher Diagnostic Test'
    },
    result: {
        resultLanguage: 'Result Language',
        updatingLanguage: 'Updating language...',
        accuracy: 'accuracy',
        diagnosticComplete: 'Diagnostic complete',
        score: 'Score',
        stage: 'Stage',
        weakTopics: 'Weak topics',
        yourImprovementPlan: 'Your Improvement Plan',
        target: 'Target',
        days: 'days',
        topicWisePersonalizedPlan: 'Topic-wise personalized plan',
        questionWiseReport: 'Question-wise report',
        topic: 'Topic',
        notAnswered: 'Not answered',
        hide: 'Hide',
        show: 'Show',
        yourAnswer: 'Your answer',
        expected: 'Expected',
        openPersonalizedStudy: 'Open Personalized Study',
        browseLessons: 'Browse lessons',
        takeAnotherDiagnostic: 'Take another diagnostic',
        backToDiagnostic: 'Back to Diagnostic',
        regenerateWithAI: 'Regenerate with AI',
        generating: 'Generating...',
        couldNotRegeneratePlan: 'Could not regenerate plan. Please try again.',
        couldNotChangeLanguage: 'Could not change result language. Please try again.',
        generateLessonsFromWeakTopics: 'Generate Lessons From Weak Topics',
        generatingLessons: 'Generating lessons...',
        lessonsReady: 'Weak-topic lessons are ready in Smart Study.',
        couldNotGenerateLessons: 'Could not generate lessons. Please try again.',
        openLessons: 'Open Lessons',
        mastery: 'Mastery'
    }
};

module.exports = function diagnosticRoutes(pool, authenticate) {
    const router = express.Router();
    const requireAdmin = (req, res, next) => {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
    };

    const handleSyllabusUpload = (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (!err) return next();
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: `File too large. Max ${DIAGNOSTIC_UPLOAD_MAX_MB}MB allowed.` });
            }
            return res.status(400).json({ error: err.message || 'Invalid upload payload.' });
        });
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

    router.get('/diagnostic/has-attempted', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [[row]] = await pool.query(
                `SELECT COUNT(*) AS cnt FROM vp_diagnostic_attempts WHERE student_id = ? AND status = 'submitted'`,
                [sid]
            );
            res.json({ hasAttempted: Number(row?.cnt || 0) > 0 });
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

    router.post('/diagnostic/syllabus-upload', authenticate, handleSyllabusUpload, async (req, res) => {
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

    router.get('/diagnostic/ui-text', authenticate, async (req, res) => {
        const lang = normalizeLanguageCode(req.query.language || 'en');
        try {
            const payload = deepClone(DIAGNOSTIC_UI_TEXT);
            const localized = await localizeObjectForLanguage(payload, lang);
            res.json({ ok: true, language: lang, text: localized });
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
            selected_topics = [],
            scope = 'subject',
            education_level = 'school',
            college_year = null,
            semester = null,
            syllabus_scope = 'whole_syllabus',
            unit_name = '',
            syllabus_text = ''
        } = req.body || {};

        const isCollege = String(education_level).toLowerCase() === 'college';
        const normalizedSubject = String(subject || '').trim();
        if (!normalizedSubject) {
            return res.status(400).json({ error: 'subject is required' });
        }
        const gradeNum = Number(isCollege ? college_year : grade);
        const semesterNum = semester == null || semester === '' ? null : Number(semester);
        const selectedTopics = (Array.isArray(selected_topics) ? selected_topics : [])
            .map(t => String(t || '').trim())
            .filter(Boolean)
            .filter((v, i, arr) => arr.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i)
            .slice(0, 12);
        if (isCollege) {
            if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 4) {
                return res.status(400).json({ error: 'college year must be between 1 and 4' });
            }
            if (!Number.isFinite(semesterNum) || semesterNum < 1 || semesterNum > 8) {
                return res.status(400).json({ error: 'semester must be between 1 and 8' });
            }
            const expectedYear = Math.ceil(semesterNum / 2);
            if (expectedYear !== gradeNum) {
                return res.status(400).json({ error: 'selected semester does not match selected year' });
            }
            if (!String(syllabus_text || '').trim() && !String(topic || unit_name || '').trim() && !selectedTopics.length) {
                return res.status(400).json({ error: 'upload syllabus or provide unit/topic for college diagnostic' });
            }
        } else if (!Number.isFinite(gradeNum) || gradeNum < 8 || gradeNum > 12) {
            return res.status(400).json({ error: 'grade must be between 8 and 12' });
        }

        const difficultyProfile = resolveDifficultyProfile({
            educationLevel: isCollege ? 'college' : 'school',
            grade: gradeNum,
            collegeYear: isCollege ? gradeNum : null,
            semester: isCollege ? semesterNum : null
        });

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

            // Priority: explicit topic > selected topics > unit (when unit-wise) > no explicit context
            const effectiveTopic = topicInput
                || (selectedTopics.length ? selectedTopics.join(', ') : '')
                || (syllabus_scope === 'unit_wise' ? unitInput : '');

            const questionPaper = await buildQuestionPaper(candidates, {
                subject: normalizedSubject,
                topic: effectiveTopic,
                grade: gradeNum,
                language,
                educationLevel: isCollege ? 'college' : 'school',
                syllabusKeywords,
                syllabusScope: syllabus_scope,
                collegeYear: isCollege ? gradeNum : null,
                semester: isCollege ? semesterNum : null,
                selectedTopics,
                difficultyProfile,
                questionContext: {
                    topicInput,
                    unitInput,
                    hasSyllabus: !!String(syllabus_text || '').trim()
                }
            });

            const localizedQuestionPaper = await localizeQuestionPaperForLanguage(questionPaper, language);

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
                    JSON.stringify(localizedQuestionPaper)
                ]
            );

            res.json({
                ok: true,
                attempt_id: attemptId,
                mode: 'student_choice',
                question_paper: stripAnswers(localizedQuestionPaper)
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
                const localizedReport = await localizeObjectForLanguage(toJSON(row.report_json, {}), row.language || 'en');
                const localizedPlan = await localizeObjectForLanguage(toJSON(row.personalized_plan_json, null), row.language || 'en');
                return res.json({
                    ok: true,
                    already_submitted: true,
                    report: localizedReport,
                    personalized_plan: localizedPlan
                });
            }

            const questionPaper = toJSON(row.question_paper_json, []);
            const evaluation = evaluateDiagnostic(questionPaper, answers);
            const plan = await buildPersonalizedPlan({
                report: evaluation.report,
                subject: row.subject,
                topic: row.topic,
                scope: row.scope,
                grade: row.grade,
                language: row.language || 'en'
            });

            await finalizeDiagnosticAttempt(pool, {
                sid,
                attemptId: attempt_id,
                row,
                answers,
                evaluation,
                plan
            });

            const localizedReport = await localizeObjectForLanguage(evaluation.report, row.language || 'en');
            const localizedPlan = await localizeObjectForLanguage(plan, row.language || 'en');

            res.json({ ok: true, report: localizedReport, personalized_plan: localizedPlan });
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
                const localizedReport = await localizeObjectForLanguage(toJSON(row.report_json, {}), row.language || 'en');
                const localizedPlan = await localizeObjectForLanguage(toJSON(row.personalized_plan_json, null), row.language || 'en');
                return res.json({
                    ok: true,
                    already_submitted: true,
                    report: localizedReport,
                    personalized_plan: localizedPlan
                });
            }

            const questionPaper = toJSON(row.question_paper_json, []);
            const evaluation = evaluateDiagnostic(questionPaper, answers);
            const plan = await buildPersonalizedPlan({
                report: evaluation.report,
                subject: row.subject,
                topic: row.topic,
                scope: row.scope,
                grade: row.grade,
                language: row.language || 'en'
            });

            await finalizeDiagnosticAttempt(pool, {
                sid,
                attemptId: attempt_id,
                row,
                answers,
                evaluation,
                plan
            });

            const localizedReport = await localizeObjectForLanguage(evaluation.report, row.language || 'en');
            const localizedPlan = await localizeObjectForLanguage(plan, row.language || 'en');

            res.json({ ok: true, report: localizedReport, personalized_plan: localizedPlan });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/diagnostic/attempts/:id/localized', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lang = normalizeLanguageCode(req.query.language || 'en');
        try {
            const [[row]] = await pool.query(
                `SELECT id, language, report_json, personalized_plan_json
                 FROM vp_diagnostic_attempts
                 WHERE id = ? AND student_id = ?`,
                [req.params.id, sid]
            );
            if (!row) return res.status(404).json({ error: 'attempt not found' });

            const baseReport = toJSON(row.report_json, {});
            const basePlan = toJSON(row.personalized_plan_json, null);
            const localizedReport = await localizeObjectForLanguage(baseReport, lang);
            const localizedPlan = await localizeObjectForLanguage(basePlan, lang);

            res.json({ ok: true, language: lang, report: localizedReport, personalized_plan: localizedPlan });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/diagnostic/attempts/:id/generate-lessons', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const lang = normalizeLanguageCode(req.body?.language || req.query.language || 'en');
        try {
            const [[row]] = await pool.query(
                `SELECT id, subject, grade, topic, language, report_json
                 FROM vp_diagnostic_attempts
                 WHERE id = ? AND student_id = ? AND status = 'submitted'`,
                [req.params.id, sid]
            );
            if (!row) return res.status(404).json({ error: 'submitted attempt not found' });

            const report = toJSON(row.report_json, {});
            const weakTopics = Array.isArray(report?.weak_topics) && report.weak_topics.length
                ? report.weak_topics.slice(0, 6)
                : [{ topic: row.topic || row.subject || 'Core Concepts', percentage: Number(report?.percentage || 0) }];

            const createdLessons = [];
            for (const weak of weakTopics) {
                const topicName = String(weak.topic || row.subject || 'Core Concepts').trim();
                if (!topicName) continue;
                const lesson = await createWeakTopicLesson(pool, {
                    subject: row.subject || 'General',
                    topic: topicName,
                    grade: row.grade,
                    language: 'en',
                    weaknessPercentage: Number(weak.percentage || 0)
                });
                if (lesson) createdLessons.push(lesson);
            }

            const focusTopic = String(weakTopics?.[0]?.topic || row.topic || row.subject || 'Core Concepts').trim();
            const focusLesson = createdLessons.find(l => String(l.title || '').toLowerCase() === focusTopic.toLowerCase()) || createdLessons[0] || null;
            const sourceNotes = String(focusLesson?.body_en || buildSimpleEnglishLessonTemplate({
                subject: row.subject || 'General',
                topic: focusTopic,
                grade: row.grade,
                weaknessPercentage: Number(weakTopics?.[0]?.percentage || 0)
            }));

            const practiceTests = [];
            for (let idx = 1; idx <= 3; idx += 1) {
                const qSet = await generatePracticeQuestionSet({
                    subject: row.subject || 'General',
                    topic: focusTopic,
                    notesText: sourceNotes,
                    testIndex: idx
                });
                const practiceLesson = await upsertPracticeTestLesson(pool, {
                    subject: row.subject || 'General',
                    topic: focusTopic,
                    grade: row.grade,
                    testIndex: idx,
                    questionSet: qSet
                });
                practiceTests.push(practiceLesson);
            }

            res.json({
                ok: true,
                created: createdLessons.length,
                lessons: createdLessons.map(({ body_en, ...rest }) => rest),
                practice_tests_created: practiceTests.length,
                practice_tests: practiceTests
            });
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

    // Regenerate AI plan for an existing submitted attempt
    router.post('/diagnostic/plan/regenerate', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { attempt_id } = req.body || {};
        if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });

        try {
            const [[row]] = await pool.query(
                `SELECT id, student_id, subject, topic, scope, grade, report_json, status
                 FROM vp_diagnostic_attempts
                 WHERE id = ? AND student_id = ? AND status = 'submitted'`,
                [attempt_id, sid]
            );
            if (!row) return res.status(404).json({ error: 'submitted attempt not found' });

            const report = toJSON(row.report_json, {});
            if (!report || !Object.keys(report).length) {
                return res.status(400).json({ error: 'no report data found for this attempt' });
            }

            const plan = await buildPersonalizedPlan({
                report,
                subject: row.subject,
                topic: row.topic,
                scope: row.scope,
                grade: row.grade,
                language: row.language || 'en'
            });

            // Update the attempt row and the plans table
            await pool.query(
                `UPDATE vp_diagnostic_attempts SET personalized_plan_json = ? WHERE id = ?`,
                [JSON.stringify(plan), attempt_id]
            );
            await pool.query(
                `UPDATE vp_personalized_plans SET plan_json = ?, title = ? WHERE attempt_id = ?`,
                [JSON.stringify(plan), plan.title, attempt_id]
            );

            res.json({ ok: true, personalized_plan: plan });
        } catch (err) {
            console.error('[vp] plan regenerate:', err);
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

function normalizeLanguageCode(code) {
    const c = String(code || 'en').toLowerCase().trim();
    return LANGUAGE_LABELS[c] ? c : 'en';
}

function languageLabel(code) {
    const c = normalizeLanguageCode(code);
    return LANGUAGE_LABELS[c] || 'English';
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function shouldTranslateValue({ key, value }) {
    if (typeof value !== 'string') return false;
    const text = value.trim();
    if (!text) return false;
    if (/^https?:\/\//i.test(text)) return false;
    if (/^[0-9a-f-]{16,}$/i.test(text)) return false;
    const skipKeys = new Set([
        'id', 'qid', 'attempt_id', 'test_id', 'student_id', 'kind',
        'scope', 'education_level', 'file_name', 'created_at', 'submitted_at'
    ]);
    if (skipKeys.has(String(key || ''))) return false;
    return true;
}

function collectTranslatableStrings(node, paths = [], path = []) {
    if (Array.isArray(node)) {
        node.forEach((item, idx) => collectTranslatableStrings(item, paths, [...path, idx]));
        return paths;
    }
    if (!node || typeof node !== 'object') return paths;

    for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && shouldTranslateValue({ key: k, value: v })) {
            paths.push({ path: [...path, k], value: v });
        } else if (v && typeof v === 'object') {
            collectTranslatableStrings(v, paths, [...path, k]);
        }
    }
    return paths;
}

function setByPath(obj, path, value) {
    let cur = obj;
    for (let i = 0; i < path.length - 1; i += 1) {
        cur = cur[path[i]];
    }
    cur[path[path.length - 1]] = value;
}

async function translateStringBatch(strings, languageCode) {
    const lang = normalizeLanguageCode(languageCode);
    if (lang === 'en') return strings;
    if (!strings.length) return [];

    const result = [];
    const chunkSize = 80;
    for (let i = 0; i < strings.length; i += chunkSize) {
        const chunk = strings.slice(i, i + chunkSize);
        try {
            const response = await llmRouter.llmJson({
                messages: [
                    {
                        role: 'system',
                        content: `Translate given texts to ${languageLabel(lang)}. Return only valid JSON.`
                    },
                    {
                        role: 'user',
                        content:
                            `Translate each item to ${languageLabel(lang)} and preserve original intent.\n` +
                            `Do not translate numbers, urls, or IDs.\n` +
                            `Return exact JSON shape: {"translated": ["..."]}.\n` +
                            `Input: ${JSON.stringify(chunk)}`
                    }
                ],
                temperature: 0.1,
                maxTokens: 2500
            });
            const translated = Array.isArray(response?.json?.translated) ? response.json.translated : [];
            if (translated.length === chunk.length) {
                result.push(...translated.map(x => String(x ?? '')));
            } else {
                result.push(...chunk);
            }
        } catch {
            result.push(...chunk);
        }
    }
    return result;
}

async function localizeObjectForLanguage(payload, languageCode) {
    const lang = normalizeLanguageCode(languageCode);
    if (lang === 'en' || !payload || typeof payload !== 'object') return payload;

    const cloned = deepClone(payload);
    const refs = collectTranslatableStrings(cloned);
    if (!refs.length) return cloned;

    const translated = await translateStringBatch(refs.map(r => r.value), lang);
    refs.forEach((ref, idx) => setByPath(cloned, ref.path, translated[idx] ?? ref.value));
    return cloned;
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

/**
 * Generate a full set of diagnostic questions using AI.
 * Returns { mcq: [...], short: [...], long: [...] }
 * Falls back to empty arrays on failure (caller handles fallback).
 */
async function generateAiQuestionSet({
    subject,
    topic,
    grade,
    language = 'en',
    needMcq = 15,
    needShort = 1,
    needLong = 1,
    levelLabel = null,
    difficultyGuidance = null,
    selectedTopics = []
}) {
    const effectiveLevelLabel = levelLabel || `Grade ${grade}`;
    const topics = (Array.isArray(selectedTopics) ? selectedTopics : []).map(t => String(t || '').trim()).filter(Boolean);
    const topicCoverageRule = topics.length > 1
        ? `- Cover all selected topics with balanced spread: ${topics.join(', ')}\n`
        : '';
    const lang = normalizeLanguageCode(language);
    const langNote = lang !== 'en' ? ` Respond in ${languageLabel(lang)}.` : '';
    const messages = [
        {
            role: 'system',
            content:
                `You are an expert ${subject} teacher writing a diagnostic test for ${effectiveLevelLabel} students.` +
                ` Your task is to generate questions SPECIFICALLY about "${topic}" — every question must reference real facts, formulas, processes, or definitions from this topic.` +
                (difficultyGuidance ? ` Keep difficulty profile: ${difficultyGuidance}.` : '') +
                ` Return ONLY valid JSON. No prose, no markdown fences.${langNote}`
        },
        {
            role: 'user',
            content:
                `Generate a question set about "${topic}" in ${subject} for ${effectiveLevelLabel} students.\n\n` +
                `Return this exact JSON shape:\n` +
                `{\n` +
                `  "mcq": [ /* ${needMcq} items */ { "text": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "answer_key": "<exact option text>" } ],\n` +
                `  "short": [ /* ${needShort} item */ { "text": "...", "answer_key": "key points as comma-separated terms" } ],\n` +
                `  "long":  [ /* ${needLong} item */  { "text": "...", "answer_key": "key points as comma-separated terms" } ]\n` +
                `}\n\n` +
                `Rules:\n` +
                `- Every MCQ option must be unique and plausible; answer_key must be the EXACT full text of the correct option\n` +
                `- Short question: ask for a specific explanation, definition, or process within "${topic}"\n` +
                `- Long question: ask for a detailed analysis, comparison, or application within "${topic}"\n` +
                topicCoverageRule +
                `- NO generic questions — every question must name "${topic}" or its specific sub-concepts`
        }
    ];

    const result = await llmRouter.llmJson({ messages, temperature: 0.4, maxTokens: 4000 });
    const j = result.json || {};

    const normMcq = (Array.isArray(j.mcq) ? j.mcq : [])
        .filter(q => q?.text && Array.isArray(q.options) && q.options.length >= 3 && q.answer_key)
        .map(q => ({ type: 'mcq', text: String(q.text).trim(), options: q.options.map(String), answer_key: String(q.answer_key), topic, subject, a: 1, b: 0, c: 0.2 }));

    const normShort = (Array.isArray(j.short) ? j.short : [])
        .filter(q => q?.text)
        .map(q => ({ type: 'short', text: String(q.text).trim(), options: [], answer_key: String(q.answer_key || topic), topic, subject }));

    const normLong = (Array.isArray(j.long) ? j.long : [])
        .filter(q => q?.text)
        .map(q => ({ type: 'long', text: String(q.text).trim(), options: [], answer_key: String(q.answer_key || topic), topic, subject }));

    return { mcq: normMcq, short: normShort, long: normLong };
}

async function localizeQuestionPaperForLanguage(questionPaper, languageCode) {
    const lang = normalizeLanguageCode(languageCode);
    if (lang === 'en') return questionPaper;

    const localized = await localizeObjectForLanguage(questionPaper, lang);
    return Array.isArray(localized) ? localized : questionPaper;
}

function resolveDifficultyProfile({ educationLevel = 'school', grade = null, collegeYear = null, semester = null }) {
    if (educationLevel === 'college') {
        const sem = Number(semester || 1);
        const yr = Number(collegeYear || 1);
        const score = Math.max(1, Math.min(8, sem || ((yr - 1) * 2 + 1)));
        if (score <= 2) {
            return {
                levelLabel: `College Year ${yr} Semester ${sem}`,
                difficultyGuidance: 'easy-to-medium conceptual questions with foundational applications'
            };
        }
        if (score <= 5) {
            return {
                levelLabel: `College Year ${yr} Semester ${sem}`,
                difficultyGuidance: 'medium difficulty with problem-solving and applied concept questions'
            };
        }
        return {
            levelLabel: `College Year ${yr} Semester ${sem}`,
            difficultyGuidance: 'high difficulty with analytical, scenario-based, and advanced application questions'
        };
    }

    const g = Number(grade || 8);
    if (g <= 9) {
        return {
            levelLabel: `Class ${g}`,
            difficultyGuidance: 'easy-to-medium school-level questions focusing on concept clarity'
        };
    }
    if (g <= 11) {
        return {
            levelLabel: `Class ${g}`,
            difficultyGuidance: 'medium-to-high school-level questions with deeper reasoning'
        };
    }
    return {
        levelLabel: `Class ${g}`,
        difficultyGuidance: 'high school board-exam style difficulty with strong conceptual application'
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

async function buildQuestionPaper(candidates, {
    subject,
    topic,
    grade,
    language,
    educationLevel = 'school',
    syllabusKeywords = [],
    syllabusScope = 'whole_syllabus',
    collegeYear = null,
    semester = null,
    selectedTopics = [],
    difficultyProfile = null,
    questionContext = {}
}) {

    const topicInput = String(questionContext.topicInput || '').trim();
    const unitInput = String(questionContext.unitInput || '').trim();
    const hasSyllabus = !!questionContext.hasSyllabus;

    const normalizedSelectedTopics = (Array.isArray(selectedTopics) ? selectedTopics : [])
        .map(t => String(t || '').trim())
        .filter(Boolean)
        .slice(0, 12);

    // Context priority: topic > selected topics > unit-wise unit > whole syllabus keywords > fallback subject
    const resolvedContext = topicInput
        ? { kind: 'topic', value: topicInput }
        : (normalizedSelectedTopics.length)
            ? { kind: 'topics', value: normalizedSelectedTopics.join(', ') }
        : (syllabusScope === 'unit_wise' && unitInput)
            ? { kind: 'unit', value: unitInput }
            : (hasSyllabus && syllabusKeywords.length)
                ? { kind: 'syllabus', value: syllabusKeywords[0] }
                : { kind: 'fallback', value: topic || subject || 'Core Concepts' };

    const filteredCandidates = normalizedSelectedTopics.length
        ? (candidates || []).filter(c => {
            const t = String(c.topic || '').toLowerCase();
            return normalizedSelectedTopics.some(sel => t.includes(String(sel).toLowerCase()));
        })
        : (candidates || []);

    const mcqCandidates = shuffle(
        (filteredCandidates || [])
            .filter(c => ['mcq', 'tf'].includes(c.type))
            .filter(c => Array.isArray(c.options) && c.options.length >= 3)
    );
    const shortCandidates = shuffle((filteredCandidates || []).filter(c => c.type === 'short'));

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

    const needMcq = 15 - oneMark.length;
    const needShort = shortCandidates.length >= 1 ? 0 : 1;
    const needLong  = shortCandidates.length >= 2 ? 0 : 1;

    if (needMcq > 0 || needShort > 0 || needLong > 0) {
        try {
            const aiSet = await generateAiQuestionSet({
                subject,
                topic: resolvedContext.value,
                grade,
                language,
                levelLabel: difficultyProfile?.levelLabel,
                difficultyGuidance: difficultyProfile?.difficultyGuidance,
                selectedTopics: normalizedSelectedTopics,
                needMcq: needMcq > 0 ? needMcq : 0,
                needShort,
                needLong
            });
            if (needMcq > 0) oneMark.push(...aiSet.mcq.slice(0, needMcq).map(q => ({ ...q, qid: `q-${uuidv4()}`, marks: 1 })));
            if (needShort > 0 && aiSet.short.length) shortCandidates.push(...aiSet.short);
            if (needLong  > 0 && aiSet.long.length)  shortCandidates.push(...aiSet.long);
        } catch (e) {
            console.warn('[vp] AI question generation failed:', e.message);
        }
    }

    while (oneMark.length < 15) {
        const idx = oneMark.length + 1;
        const stem = `${resolvedContext.value}: choose the most accurate statement (${idx}).`;
        const correct = `B) Correct explanation for ${resolvedContext.value}`;
        oneMark.push({
            qid: `q-${uuidv4()}`,
            marks: 1,
            type: 'mcq',
            subject,
            topic: resolvedContext.value,
            text: stem,
            options: [
                `A) Unrelated statement about ${subject}`,
                correct,
                'C) Common misconception',
                'D) Incomplete explanation'
            ],
            answer_key: correct,
            a: 1,
            b: 0,
            c: 0.2
        });
    }

    const twoMarkBase = shortCandidates[0] || { type: 'short', subject, topic: resolvedContext.value, text: `Explain a key concept of ${resolvedContext.value} with an example.`, options: [], answer_key: resolvedContext.value };
    const fiveMarkBase = shortCandidates[1] || { type: 'long', subject, topic: resolvedContext.value, text: `Describe the main principles of ${resolvedContext.value} and their real-world applications.`, options: [], answer_key: resolvedContext.value };

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
            semester,
            context_kind: resolvedContext.kind,
            context_value: resolvedContext.value
        }
    }));
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

async function buildPersonalizedPlan({ report, subject, topic, scope, grade, language = 'en' }) {
    const weakTopics = (report.weak_topics || []).length
        ? report.weak_topics
        : [{ topic: topic || subject || 'Core Concepts', percentage: report.percentage || 0 }];

    const stage       = report.stage || 'Foundation';
    const percentage  = Number(report.percentage || 0);
    const topicList   = weakTopics.slice(0, 6);

    // ── AI: overall 4-week plan + per-topic focus ──────────────────────────────
    let aiPlan = null;
    try {
        const lang = normalizeLanguageCode(language);
        const langInstruction = lang !== 'en' ? ` Return all text in ${languageLabel(lang)}.` : '';
        const topicSummary = topicList.map(t =>
            `${t.topic} (score: ${t.percentage ?? 0}%, correct: ${t.score ?? '?'}/${t.total ?? '?'})`
        ).join('; ');

        const messages = [
            {
                role: 'system',
                content:
                    `You are an expert ${subject} teacher writing a personalised 4-week improvement plan for a Grade ${grade || ''} student.` +
                    ` The student just completed a diagnostic test. Analyse their weak areas and produce a concrete, actionable plan.` +
                    langInstruction +
                    ` Return ONLY valid JSON \u2014 no prose, no markdown fences.`
            },
            {
                role: 'user',
                content:
                    `Student diagnostic results:\n` +
                    `- Subject: ${subject}\n` +
                    `- Stage: ${stage}\n` +
                    `- Overall accuracy: ${percentage}%\n` +
                    `- Weak topics: ${topicSummary}\n\n` +
                    `Generate a plan with this exact JSON shape:\n` +
                    `{\n` +
                    `  "weekly_goals": ["Week 1: <specific goal>", "Week 2: ...", "Week 3: ...", "Week 4: ..."],\n` +
                    `  "topic_plans": [\n` +
                    `    {\n` +
                    `      "topic": "<topic name>",\n` +
                    `      "why_struggle": "<1-2 sentences: specific reason the student struggles based on their score>",\n` +
                    `      "weekly_focus": [\n` +
                    `        "Week 1: <specific task for this topic>",\n` +
                    `        "Week 2: <specific task>",\n` +
                    `        "Week 3: <specific task>"\n` +
                    `      ],\n` +
                    `      "daily_tasks": ["<actionable task 1>", "<actionable task 2>", "<actionable task 3>"]\n` +
                    `    }\n` +
                    `  ]\n` +
                    `}\n\n` +
                    `Rules:\n` +
                    `- weekly_goals must address the student's ACTUAL weak topics (${topicList.map(t => t.topic).join(', ')})\n` +
                    `- Each topic_plan must be for one of the weak topics listed above\n` +
                    `- daily_tasks must be concrete and specific to that topic\n` +
                    `- Do NOT use generic phrases like "strengthen fundamentals" — name the actual concepts`
            }
        ];

        const result = await llmRouter.llmJson({ messages, temperature: 0.3, maxTokens: 3000 });
        const j = result.json || {};
        if (Array.isArray(j.weekly_goals) && Array.isArray(j.topic_plans)) {
            aiPlan = j;
        }
    } catch (e) {
        console.warn('[vp] AI plan generation failed, using fallback:', e.message);
    }

    // Merge AI-generated content with static resources/notes per topic
    const topicPlans = topicList.map((t, idx) => {
        const tName = String(t.topic || 'Core Concepts');
        const cur   = Number(t.percentage || 0);
        const target = Math.min(100, Math.max(cur + 20, 70));
        const resources = getResourceBundle({ subject, topic: tName, grade });
        const notesText = buildQuickNotes({ subject, topic: tName, grade });

        // Use AI plan for this topic if available
        const aiTp = aiPlan?.topic_plans?.find(p =>
            String(p.topic || '').toLowerCase().includes(tName.toLowerCase()) ||
            tName.toLowerCase().includes(String(p.topic || '').toLowerCase())
        ) || aiPlan?.topic_plans?.[idx];

        return {
            rank: idx + 1,
            topic: tName,
            current_pct: cur,
            target_pct: target,
            why_struggle: aiTp?.why_struggle ||
                `Accuracy in ${tName} is ${cur}%. Needs better concept clarity and structured practice.`,
            weekly_focus: (aiTp?.weekly_focus?.length ? aiTp.weekly_focus : [
                `Week 1: Build fundamentals of ${tName} with examples and notes.`,
                `Week 2: Practice 20 MCQs and 6 descriptive questions on ${tName}.`,
                `Week 3: Timed revision + mini test for ${tName}.`
            ]),
            daily_tasks: (aiTp?.daily_tasks?.length ? aiTp.daily_tasks : [
                `Read notes for ${tName} (25 mins).`,
                `Solve 10 one-mark and 2 short-answer questions on ${tName}.`,
                'Maintain an error log and retry mistakes.'
            ]),
            resources,
            notes: {
                file_name: `${slugify(tName)}-notes.txt`,
                content: notesText
            }
        };
    });

    const weeklyGoals = aiPlan?.weekly_goals?.length ? aiPlan.weekly_goals : [
        `Week 1: Strengthen fundamentals for ${subject || 'selected subject'}`,
        'Week 2: Topic-wise targeted practice on weak areas',
        'Week 3: Mixed-level problem solving with timed attempts',
        'Week 4: Full diagnostic retest and final revision'
    ];

    return {
        title: `${subject || 'Subject'} detailed personalized improvement plan`,
        stage,
        target_score: Math.min(100, percentage + 20),
        horizon_days: 28,
        weekly_goals: weeklyGoals,
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

async function extractPdfText(buffer) {
    let mod;
    try {
        mod = require('pdf-parse');
    } catch {
        throw new Error('PDF upload support is unavailable on server (pdf-parse missing).');
    }

    // pdf-parse v1 style: callable function export
    if (typeof mod === 'function') {
        const out = await mod(buffer);
        return String(out?.text || '');
    }
    if (mod && typeof mod.default === 'function') {
        const out = await mod.default(buffer);
        return String(out?.text || '');
    }
    if (mod && typeof mod.pdfParse === 'function') {
        const out = await mod.pdfParse(buffer);
        return String(out?.text || '');
    }

    // pdf-parse v2 style: class export with parser.getText()
    const PDFParseCtor = mod && typeof mod.PDFParse === 'function' ? mod.PDFParse : null;
    if (PDFParseCtor) {
        const parser = new PDFParseCtor({ data: buffer });
        try {
            const out = await parser.getText();
            return String(out?.text || '');
        } finally {
            if (typeof parser.destroy === 'function') {
                await parser.destroy().catch(() => {});
            }
        }
    }

    throw new Error('Unsupported pdf-parse module export format on server.');
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
        const text = await extractPdfText(file.buffer);
        const questions = pdfTextToQuestions(text);
        return { questions };
    }
    throw new Error('Unsupported file format. Use PDF, CSV, or Excel.');
}

async function parseSyllabusUpload(file) {
    const ext = (file.originalname || '').toLowerCase().split('.').pop();
    if (ext === 'txt' || ext === 'md') {
        const text = file.buffer.toString('utf8');
        const units = extractUnits(text);
        const keywords = extractKeywordsFromText(text, 30);
        return {
            syllabus_text: text,
            units,
            keywords,
            topics: extractTopicsFromText(text, units, keywords)
        };
    }
    if (ext === 'csv') {
        const text = file.buffer.toString('utf8');
        const rows = parseCSV(text);
        const flat = rows.map(r => r.join(' ')).join('\n');
        const units = extractUnits(flat);
        const keywords = extractKeywordsFromText(flat, 30);
        return {
            syllabus_text: flat,
            units,
            keywords,
            topics: extractTopicsFromText(flat, units, keywords)
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
        const units = extractUnits(text);
        const keywords = extractKeywordsFromText(text, 30);
        return {
            syllabus_text: text,
            units,
            keywords,
            topics: extractTopicsFromText(text, units, keywords)
        };
    }
    if (ext === 'pdf') {
        const text = await extractPdfText(file.buffer);
        const units = extractUnits(text);
        const keywords = extractKeywordsFromText(text, 30);
        return {
            syllabus_text: text,
            units,
            keywords,
            topics: extractTopicsFromText(text, units, keywords)
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

function extractTopicsFromText(text, units = [], keywords = []) {
    const topics = [];
    const seen = new Set();

    const addTopic = (raw) => {
        const cleaned = String(raw || '')
            .replace(/^[-*\d.()\s]+/, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        if (!cleaned || cleaned.length < 3 || cleaned.length > 80) return;
        const key = cleaned.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        topics.push(cleaned);
    };

    for (const u of units || []) {
        const m = String(u).match(/^(?:unit|module|chapter)\s*\d+\s*[:\-]?\s*(.*)$/i);
        if (m && m[1]) addTopic(m[1]);
    }

    const lines = String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const ln of lines) {
        if (/^(unit|module|chapter)\s*\d+/i.test(ln)) continue;
        if (ln.includes(':')) {
            const rhs = ln.split(':').slice(1).join(':').trim();
            addTopic(rhs);
        }
        if (ln.includes(',')) {
            ln.split(',').forEach(addTopic);
        } else {
            addTopic(ln);
        }
        if (topics.length >= 40) break;
    }

    for (const k of (keywords || [])) {
        addTopic(k);
        if (topics.length >= 40) break;
    }

    return topics.slice(0, 40);
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

async function generateLessonBody({ subject, topic, grade, language = 'en', weaknessPercentage = 0 }) {
    const fallbackBody = buildSimpleEnglishLessonTemplate({ subject, topic, grade, weaknessPercentage });

    try {
        const gradeLabel = grade ? `Grade/Year ${grade}` : 'secondary level';
        const out = await llmRouter.llmChat({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a highly qualified subject teacher writing professional, exam-ready self-study notes for students. ' +
                        'Your notes must be factually correct, detailed, and teach ACTUAL content about the topic — not placeholder text. ' +
                        'Use clear markdown headings (##), bullet points (- ), numbered steps, and bold for key terms. ' +
                        'Do NOT use placeholder phrases like "write one line here" or "study each part". ' +
                        'Write real facts, real definitions, real examples specific to this topic. ' +
                        'Length: 1400 to 2000 words. No tables.'
                },
                {
                    role: 'user',
                    content:
                        `Write professional study notes for topic: "${topic}" in subject: "${subject}" for ${gradeLabel} students.\n` +
                        `The student scored only ${weaknessPercentage}% so these notes must clearly explain the topic from basics to exam level.\n\n` +
                        `Use EXACTLY these sections in order:\n` +
                        `## Overview\n(2-3 sentences explaining what ${topic} is and why it matters in ${subject})\n\n` +
                        `## Learning Goals\n(4 specific learning outcomes a student will achieve)\n\n` +
                        `## Key Concepts\n(5-8 core concepts/definitions/rules with REAL content. Be specific and factual.)\n\n` +
                        `## Worked Example 1\n(A step-by-step solved problem or explanation with real numbers/words for ${topic})\n\n` +
                        `## Worked Example 2\n(Another solved example showing a different aspect of ${topic})\n\n` +
                        `## Common Mistakes\n(5 specific mistakes students make in ${topic} and how to avoid each)\n\n` +
                        `## Revision Checklist\n(5 checkpoints a student can use to self-assess mastery of ${topic})\n\n` +
                        `## Quick Recap\n(3-4 sentence summary of ${topic} for last-minute revision)`
                }
            ],
            temperature: 0.4,
            maxTokens: 4500
        });
        if (out?.provider === 'mock') return fallbackBody;
        const text = String(out.text || '').trim();
        return text.length >= 800 ? text : fallbackBody;
    } catch {
        return fallbackBody;
    }
}

function buildSimpleEnglishLessonTemplate({ subject, topic, grade, weaknessPercentage = 0 }) {
    const level = grade ? `Grade/Year ${grade}` : 'Current level';
    return [
        `# ${topic}`,
        '',
        `Subject: ${subject}`,
        `Level: ${level}`,
        `Current topic score: ${weaknessPercentage}%`,
        '',
        '## Overview',
        `${topic} is an important part of ${subject}. This lesson is written in simple English so you can understand it quickly and revise it easily.`,
        '',
        '## Learning Goals',
        `- Understand what ${topic} means in clear words.`,
        `- Learn the core ideas and steps used in ${topic}.`,
        `- Solve exam-style questions related to ${topic}.`,
        `- Avoid common mistakes while writing answers about ${topic}.`,
        '',
        '## Key Concepts',
        `1. Definition: Write what ${topic} is in one line and then in your own words.`,
        `2. Core idea: Explain why ${topic} is used and where it is applied.`,
        `3. Components: Break ${topic} into smaller parts and study each part separately.`,
        `4. Rules/process: Note important rules, formulas, or procedures linked with ${topic}.`,
        '',
        '## Worked Example 1',
        `- Problem setup: Identify what is asked in a basic ${topic} question.`,
        '- Step 1: List known data/keywords.',
        '- Step 2: Choose the right method/rule.',
        '- Step 3: Solve carefully and check logic.',
        '- Final check: Verify if the answer matches the question.',
        '',
        '## Worked Example 2 (Application)',
        `- Apply ${topic} to a real or practical situation.`,
        '- Explain each step in plain language.',
        '- Mention why this approach is correct.',
        '',
        '## Common Mistakes',
        '- Skipping definitions and writing only final answers.',
        '- Using the wrong formula/rule without checking assumptions.',
        '- Not explaining intermediate steps clearly.',
        '- Ignoring units, constraints, or edge cases.',
        '',
        '## Practice Set',
        '- 15 MCQs: concept checks and application checks.',
        '- 2 short-answer questions: 3-5 lines each.',
        '- 1 long-answer question: detailed explanation with steps.',
        '',
        '## Revision Checklist',
        `- Can you explain ${topic} to a friend in simple words?`,
        '- Can you solve one easy and one medium problem without help?',
        '- Can you list top 5 mistakes and how to avoid them?',
        '- Can you answer one long question with structure (intro, steps, conclusion)?',
        '',
        '## Quick Recap',
        `${topic} becomes easy when you learn the concept first, then practice step by step, and finally revise mistakes. Keep answers clear, structured, and example-driven.`
    ].join('\n');
}

function buildPracticeQuestionSetFallback({ subject, topic, testIndex }) {
    const mcq = Array.from({ length: 15 }).map((_, i) => {
        const n = i + 1;
        const stem = `Practice Test ${testIndex}: In ${topic}, what is the best explanation for concept ${n}?`;
        const correct = `C) Correct concept-based explanation for ${topic} item ${n}`;
        return {
            text: stem,
            options: [
                `A) Unrelated definition for ${subject}`,
                `B) Partially correct but missing key step`,
                correct,
                'D) Common misconception'
            ],
            answer_key: correct
        };
    });
    const short = {
        text: `Explain the core idea of ${topic} and write one practical example.`,
        answer_key: `${topic}, core idea, practical example`
    };
    const long = {
        text: `Write a detailed answer on ${topic}: definition, key steps, common mistakes, and one solved example.`,
        answer_key: `${topic}, definition, key steps, mistakes, solved example`
    };
    return { mcq, short, long };
}

async function generatePracticeQuestionSet({ subject, topic, notesText, testIndex }) {
    const fallback = buildPracticeQuestionSetFallback({ subject, topic, testIndex });
    try {
        const out = await llmRouter.llmJson({
            messages: [
                {
                    role: 'system',
                    content: 'You create practice tests in simple English. Return ONLY valid JSON.'
                },
                {
                    role: 'user',
                    content:
                        `Create Practice Test ${testIndex} for topic "${topic}" in subject "${subject}" based on notes below.\n` +
                        'Return exact JSON: {"mcq":[15 items],"short":{"text":"...","answer_key":"..."},"long":{"text":"...","answer_key":"..."}}\n' +
                        'Each MCQ item must include text, options (4), answer_key (exact option text).\n' +
                        `Notes:\n${String(notesText || '').slice(0, 8000)}`
                }
            ],
            temperature: 0.35,
            maxTokens: 3200
        });
        if (out?.provider === 'mock') return fallback;
        const j = out.json || {};
        const mcq = Array.isArray(j.mcq) ? j.mcq.filter(q => q?.text && Array.isArray(q.options) && q.options.length >= 4 && q.answer_key).slice(0, 15) : [];
        if (mcq.length < 15) return fallback;
        const short = j.short?.text ? j.short : fallback.short;
        const long = j.long?.text ? j.long : fallback.long;
        return {
            mcq: mcq.map(x => ({ text: String(x.text), options: x.options.map(String).slice(0, 4), answer_key: String(x.answer_key) })),
            short: { text: String(short.text), answer_key: String(short.answer_key || '') },
            long: { text: String(long.text), answer_key: String(long.answer_key || '') }
        };
    } catch {
        return fallback;
    }
}

async function upsertPracticeTestLesson(pool, { subject, topic, grade, testIndex, questionSet }) {
    const normalizedSubject = String(subject || 'General').trim();
    const title = `${topic} - Practice Test ${testIndex}`;

    let lessonId;
    const [[existing]] = await pool.query(
        'SELECT id FROM vp_lessons WHERE subject = ? AND title = ? LIMIT 1',
        [normalizedSubject, title]
    );
    if (existing) {
        lessonId = existing.id;
    } else {
        const [[maxOrderRow]] = await pool.query(
            'SELECT COALESCE(MAX(ordering), 0) AS max_order FROM vp_lessons WHERE subject = ?',
            [normalizedSubject]
        );
        lessonId = uuidv4();
        const body = {
            en: `Practice Test ${testIndex} for ${topic}. Attempt the quiz and review mistakes after submission.`
        };
        await pool.query(
            'INSERT INTO vp_lessons (id, concept_id, subject, title, body_i18n, ordering, grade) VALUES (?,?,?,?,?,?,?)',
            [lessonId, null, normalizedSubject, title, JSON.stringify(body), Number(maxOrderRow?.max_order || 0) + 1, grade ? Number(grade) : 8]
        );
    }

    await pool.query('DELETE FROM vp_quiz_items WHERE lesson_id = ? AND is_diagnostic = 0', [lessonId]);

    for (const q of questionSet.mcq.slice(0, 15)) {
        await pool.query(
            `INSERT INTO vp_quiz_items (id, lesson_id, concept_id, subject, kind, prompt_i18n, options_i18n, answer_key, rubric_i18n, a, b, c, is_diagnostic)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
            [
                uuidv4(),
                lessonId,
                null,
                normalizedSubject,
                'mcq',
                JSON.stringify({ en: String(q.text || '') }),
                JSON.stringify({ en: (q.options || []).map(String) }),
                String(q.answer_key || ''),
                null,
                1,
                0,
                0.2
            ]
        );
    }

    await pool.query(
        `INSERT INTO vp_quiz_items (id, lesson_id, concept_id, subject, kind, prompt_i18n, options_i18n, answer_key, rubric_i18n, a, b, c, is_diagnostic)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
        [
            uuidv4(),
            lessonId,
            null,
            normalizedSubject,
            'short',
            JSON.stringify({ en: String(questionSet.short?.text || '') }),
            null,
            String(questionSet.short?.answer_key || ''),
            JSON.stringify({ en: 'Grade on concept clarity, correctness, and concise explanation.' }),
            1,
            0,
            0.2
        ]
    );

    await pool.query(
        `INSERT INTO vp_quiz_items (id, lesson_id, concept_id, subject, kind, prompt_i18n, options_i18n, answer_key, rubric_i18n, a, b, c, is_diagnostic)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
        [
            uuidv4(),
            lessonId,
            null,
            normalizedSubject,
            'short',
            JSON.stringify({ en: String(questionSet.long?.text || '') }),
            null,
            String(questionSet.long?.answer_key || ''),
            JSON.stringify({ en: 'Grade on depth, structure, key concepts, and example usage.' }),
            1.2,
            0,
            0.2
        ]
    );

    return { id: lessonId, title, subject: normalizedSubject };
}

async function createWeakTopicLesson(pool, { subject, topic, grade, language = 'en', weaknessPercentage = 0 }) {
    const normalizedSubject = String(subject || 'General').trim();
    const normalizedTopic = String(topic || 'Core Concepts').trim();
    const lessonTitle = normalizedTopic;

    const [[existing]] = await pool.query(
        'SELECT id, title, subject FROM vp_lessons WHERE subject = ? AND title = ? LIMIT 1',
        [normalizedSubject, lessonTitle]
    );
    if (existing) {
        const [[existingBodyRow]] = await pool.query('SELECT body_i18n FROM vp_lessons WHERE id = ? LIMIT 1', [existing.id]);
        const bodyObj = toJSON(existingBodyRow?.body_i18n, {});
        return { id: existing.id, title: existing.title, subject: existing.subject, reused: true, body_en: bodyObj?.en || '' };
    }

    const bodyPrimary = await generateLessonBody({
        subject: normalizedSubject,
        topic: normalizedTopic,
        grade,
        language,
        weaknessPercentage
    });
    const bodyMap = { en: bodyPrimary };

    const lang = normalizeLanguageCode(language);
    if (lang !== 'en') {
        const localized = await localizeObjectForLanguage({ body: bodyPrimary }, lang);
        bodyMap.en = bodyPrimary;
        bodyMap[lang] = localized?.body || bodyPrimary;
    }

    const [[maxOrderRow]] = await pool.query(
        'SELECT COALESCE(MAX(ordering), 0) AS max_order FROM vp_lessons WHERE subject = ?',
        [normalizedSubject]
    );
    const lessonId = uuidv4();
    await pool.query(
        'INSERT INTO vp_lessons (id, concept_id, subject, title, body_i18n, ordering, grade) VALUES (?,?,?,?,?,?,?)',
        [lessonId, null, normalizedSubject, lessonTitle, JSON.stringify(bodyMap), Number(maxOrderRow?.max_order || 0) + 1, grade ? Number(grade) : 8]
    );

    return { id: lessonId, title: lessonTitle, subject: normalizedSubject, reused: false, body_en: bodyMap.en || '' };
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
