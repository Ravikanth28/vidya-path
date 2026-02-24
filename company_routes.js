/**
 * Company Feature Routes - Backend API for company-specific interviews & roadmaps
 * Handles: Company test CRUD, interactive AI interviews, roadmap generation, reports
 */
const {
    generateCompanyRoadmap,
    generateCompanyQuestionBank,
    generateCompanyInterviewQuestion,
    evaluateCompanyInterview
} = require('./ai_service');

function registerCompanyRoutes(app, pool) {

    // Helper: mysql2 auto-parses JSON columns, so we handle both string & object
    const safeParse = (val, fallback = null) => {
        if (val === null || val === undefined) return fallback;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch { return fallback; }
    };

    // ════════════════════════════════════════
    //  COMPANY ROADMAPS
    // ════════════════════════════════════════

    // Get roadmap for any company (generate dynamically if not exists)
    app.get('/api/company/roadmap/:companyName', async (req, res) => {
        try {
            const companyName = decodeURIComponent(req.params.companyName).trim();
            if (!companyName) return res.status(400).json({ error: 'Company name required' });

            // Check DB cache first
            const [rows] = await pool.query(
                'SELECT roadmap_json FROM company_roadmaps WHERE company_name = ?',
                [companyName]
            );

            if (rows.length > 0 && rows[0].roadmap_json) {
                const data = safeParse(rows[0].roadmap_json);
                if (data && data.company_overview) return res.json(data);
            }

            // Not found or empty → generate using AI
            console.log(`🤖 Generating roadmap for: ${companyName}`);
            const roadmap = await generateCompanyRoadmap(companyName);

            // Save to DB (upsert)
            await pool.query(
                'INSERT INTO company_roadmaps (company_name, roadmap_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE roadmap_json = VALUES(roadmap_json)',
                [companyName, JSON.stringify(roadmap)]
            );

            res.json(roadmap);
        } catch (err) {
            console.error('Roadmap API error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Get list of companies that have roadmaps
    app.get('/api/company/list', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT company_name FROM company_roadmaps ORDER BY company_name ASC');
            res.json(rows.map(r => r.company_name));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Generate question bank for a company + year
    app.get('/api/company/question-bank/:companyName/:year', async (req, res) => {
        try {
            const companyName = decodeURIComponent(req.params.companyName).trim();
            const year = parseInt(req.params.year) || new Date().getFullYear();
            if (!companyName) return res.status(400).json({ error: 'Company name required' });

            console.log(`📝 Generating question bank for: ${companyName} (${year})`);
            const questionBank = await generateCompanyQuestionBank(companyName, year);
            res.json(questionBank);
        } catch (err) {
            console.error('Question bank API error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // ════════════════════════════════════════
    //  ADMIN: MANAGE COMPANY INTERVIEWS
    // ════════════════════════════════════════

    // Create a company interview test
    app.post('/api/company/interviews/create', async (req, res) => {
        try {
            const { company_name, title, description, duration_minutes, difficulty, skills_covered, max_attempts } = req.body;

            if (!company_name || !title) {
                return res.status(400).json({ error: 'Company name and title are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO company_interviews (company_name, title, description, duration_minutes, difficulty, skills_covered, max_attempts, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    company_name,
                    title,
                    description || '',
                    parseInt(duration_minutes) || 60,
                    difficulty || 'medium',
                    JSON.stringify(skills_covered || []),
                    parseInt(max_attempts) || 0,
                    req.user?.id || null
                ]
            );

            res.json({ success: true, id: result.insertId });
        } catch (err) {
            console.error('Create company test error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Update max attempts for a test
    app.put('/api/company/interviews/:id/update-limits', async (req, res) => {
        try {
            const { max_attempts } = req.body;
            await pool.query('UPDATE company_interviews SET max_attempts = ? WHERE id = ?', [parseInt(max_attempts) || 0, req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Assign students to a test
    app.put('/api/company/interviews/:id/assign', async (req, res) => {
        try {
            const { student_ids } = req.body;
            await pool.query('UPDATE company_interviews SET assigned_students = ? WHERE id = ?', [JSON.stringify(student_ids || []), req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get all students (for assignment modal)
    app.get('/api/company/students', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT id, name, email FROM users WHERE role = "student" ORDER BY name ASC');
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get ALL company interviews (admin view - includes inactive)
    app.get('/api/company/interviews/all', async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT ci.*, 
                    (SELECT COUNT(*) FROM company_interview_attempts WHERE test_id = ci.id) as total_attempts,
                    (SELECT COUNT(*) FROM company_interview_attempts WHERE test_id = ci.id AND status = 'completed') as completed_attempts,
                    (SELECT COALESCE(AVG(overall_score), 0) FROM company_interview_attempts WHERE test_id = ci.id AND status = 'completed') as avg_score
                FROM company_interviews ci
                ORDER BY ci.created_at DESC
            `);
            res.json(rows.map(r => ({
                ...r,
                skills_covered: typeof r.skills_covered === 'string' ? JSON.parse(r.skills_covered) : (r.skills_covered || [])
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get active company interviews (student view)
    app.get('/api/company/interviews', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM company_interviews WHERE is_active = TRUE ORDER BY created_at DESC');
            res.json(rows.map(r => ({
                ...r,
                skills_covered: typeof r.skills_covered === 'string' ? JSON.parse(r.skills_covered) : (r.skills_covered || [])
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Toggle test active/inactive
    app.put('/api/company/interviews/:id/toggle', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('UPDATE company_interviews SET is_active = NOT is_active WHERE id = ?', [id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Delete a company test
    app.delete('/api/company/interviews/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // Delete attempts first (FK cascade should handle this, but be safe)
            await pool.query('DELETE FROM company_interview_attempts WHERE test_id = ?', [id]);
            await pool.query('DELETE FROM company_interviews WHERE id = ?', [id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get all attempts for a specific test (admin view)
    app.get('/api/company/interviews/:testId/attempts', async (req, res) => {
        try {
            const { testId } = req.params;
            const [rows] = await pool.query(
                `SELECT id, student_id, student_name, current_stage, overall_score, status, 
                        started_at, updated_at,
                        evaluation_report
                 FROM company_interview_attempts 
                 WHERE test_id = ? 
                 ORDER BY started_at DESC`,
                [testId]
            );
            res.json(rows.map(r => ({
                ...r,
                evaluation_report: safeParse(r.evaluation_report)
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get all attempts for a student
    app.get('/api/company/interviews/student/:studentId/history', async (req, res) => {
        try {
            const { studentId } = req.params;
            const [rows] = await pool.query(
                `SELECT a.id, a.test_id, a.overall_score, a.status, a.started_at, a.evaluation_report, a.interview_progress,
                        c.company_name, c.title, c.difficulty
                 FROM company_interview_attempts a
                 JOIN company_interviews c ON a.test_id = c.id
                 WHERE a.student_id = ?
                 ORDER BY a.started_at DESC`,
                [studentId]
            );
            res.json(rows.map(r => ({
                ...r,
                evaluation_report: safeParse(r.evaluation_report)
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Get single attempt report (for both admin and student)
    app.get('/api/company/interviews/attempt/:attemptId/report', async (req, res) => {
        try {
            const { attemptId } = req.params;
            const [rows] = await pool.query(
                `SELECT a.*, c.company_name, c.title, c.difficulty, c.duration_minutes
                 FROM company_interview_attempts a
                 JOIN company_interviews c ON a.test_id = c.id
                 WHERE a.id = ?`,
                [attemptId]
            );
            if (rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
            const attempt = rows[0];
            res.json({
                ...attempt,
                evaluation_report: safeParse(attempt.evaluation_report),
                chat_history: safeParse(attempt.chat_history, [])
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ════════════════════════════════════════
    //  STUDENT: INTERACTIVE INTERVIEW
    // ════════════════════════════════════════

    // Start a new interactive interview session
    app.post('/api/company/interviews/:testId/start', async (req, res) => {
        try {
            const { testId } = req.params;
            const rawId = req.user?.id || req.body.studentId;
            const studentId = rawId;
            const studentName = req.user?.name || req.body.studentName || 'Student';

            if (!studentId) return res.status(400).json({ error: 'Valid Student ID required' });

            // 1. Get test info
            const [tests] = await pool.query('SELECT * FROM company_interviews WHERE id = ?', [parseInt(testId)]);
            if (tests.length === 0) return res.status(404).json({ error: 'Test not found' });
            const test = tests[0];

            if (!test.is_active) return res.status(400).json({ error: 'This test is currently inactive' });

            // 2. Check attempt limit
            if (test.max_attempts > 0) {
                const [[{ count }]] = await pool.query(
                    'SELECT COUNT(*) as count FROM company_interview_attempts WHERE test_id = ? AND student_id = ?',
                    [parseInt(testId), studentId]
                );
                if (count >= test.max_attempts) {
                    return res.status(400).json({ error: `Maximum attempts (${test.max_attempts}) reached for this test` });
                }
            }

            // 3. Initial AI Greeting
            const initialAIResponse = await generateCompanyInterviewQuestion(
                test.company_name,
                [],
                'intro',
                studentName
            );

            const chatHistory = [{
                role: 'assistant',
                content: initialAIResponse.message,
                timestamp: new Date().toISOString()
            }];

            // 4. Create attempt record
            const [result] = await pool.query(
                `INSERT INTO company_interview_attempts (test_id, student_id, student_name, chat_history, current_stage)
                 VALUES (?, ?, ?, ?, 'intro')`,
                [parseInt(testId), studentId, studentName, JSON.stringify(chatHistory)]
            );

            res.json({
                success: true,
                attemptId: result.insertId,
                initialMessage: initialAIResponse.message,
                companyName: test.company_name,
                duration: test.duration_minutes,
                interview_progress: 0
            });
        } catch (err) {
            console.error('Start interview error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Interactive message exchange
    app.post('/api/company/interviews/attempt/:attemptId/message', async (req, res) => {
        try {
            const { attemptId } = req.params;
            const { message, stage } = req.body;

            if (!message) return res.status(400).json({ error: 'Message is required' });

            // 1. Get attempt state
            const [attempts] = await pool.query(
                `SELECT a.*, c.company_name 
                 FROM company_interview_attempts a 
                 JOIN company_interviews c ON a.test_id = c.id 
                 WHERE a.id = ?`,
                [attemptId]
            );
            if (attempts.length === 0) return res.status(404).json({ error: 'Session not found' });
            const attempt = attempts[0];

            let chatHistory = safeParse(attempt.chat_history, []);

            // 2. Add student message
            chatHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // 3. Get AI reply
            const currentStage = stage || attempt.current_stage;
            const aiResponse = await generateCompanyInterviewQuestion(
                attempt.company_name,
                chatHistory,
                currentStage,
                attempt.student_name
            );

            // 4. Add AI reply to history
            chatHistory.push({
                role: 'assistant',
                content: aiResponse.message,
                type: aiResponse.type,
                context: aiResponse.coding_context || aiResponse.sql_context || null,
                timestamp: new Date().toISOString()
            });

            // 5. Determine new stage from AI response
            let newStage = currentStage;
            const progress = aiResponse.interview_progress || 0;
            if (progress >= 90) newStage = 'closing';
            else if (progress >= 70) newStage = 'sql';
            else if (progress >= 45) newStage = 'coding';
            else if (progress >= 20) newStage = 'concepts';

            // 6. Update DB
            await pool.query(
                'UPDATE company_interview_attempts SET chat_history = ?, current_stage = ?, interview_progress = ? WHERE id = ?',
                [JSON.stringify(chatHistory), newStage, progress, attemptId]
            );

            res.json({
                message: aiResponse.message,
                type: aiResponse.type,
                context: aiResponse.coding_context || aiResponse.sql_context || null,
                interview_progress: aiResponse.interview_progress || progress,
                current_stage: newStage
            });

        } catch (err) {
            console.error('Interview Message Error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Finish and evaluate
    app.post('/api/company/interviews/attempt/:attemptId/finish', async (req, res) => {
        try {
            const { attemptId } = req.params;
            const { codingSubmissions, sqlSubmissions } = req.body;

            const [attempts] = await pool.query(
                `SELECT a.*, c.company_name 
                 FROM company_interview_attempts a 
                 JOIN company_interviews c ON a.test_id = c.id 
                 WHERE a.id = ?`,
                [attemptId]
            );
            if (attempts.length === 0) return res.status(404).json({ error: 'Session not found' });
            const attempt = attempts[0];

            const chatHistory = safeParse(attempt.chat_history, []);

            // AI Evaluation
            const evaluation = await evaluateCompanyInterview(
                attempt.company_name,
                chatHistory,
                codingSubmissions || [],
                sqlSubmissions || []
            );

            // Update DB
            await pool.query(
                `UPDATE company_interview_attempts 
                 SET overall_score = ?, evaluation_report = ?, status = 'completed'
                 WHERE id = ?`,
                [evaluation.overall_score || 0, JSON.stringify(evaluation), attemptId]
            );

            res.json({ success: true, evaluation });
        } catch (err) {
            console.error('Finish interview error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Delete an attempt
    app.delete('/api/company/interviews/attempt/:attemptId', async (req, res) => {
        try {
            await pool.query('DELETE FROM company_interview_attempts WHERE id = ?', [req.params.attemptId]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

}

module.exports = registerCompanyRoutes;
