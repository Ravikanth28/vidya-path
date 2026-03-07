/**
 * Company Round Test Routes
 * Admin creates company-specific first-round tests with configurable sections:
 *   aptitude | verbal | logical | reasoning | technical_mcq | pseudocode | debug | coding | sql
 *
 * Features:
 *  - Section-based question bank (manual entry + AI generation)
 *  - Card actions: Assign, Live/End, Attempts, Delete, Report
 *  - Proctoring config per test
 *  - Local code execution (Python, JS, C, C++, Java) + sql.js for SQL
 *  - Full evaluation + per-section score breakdown
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// ─── sql.js for local SQL evaluation ────────────────────────────────────────
let initSqlJs = null;
try { initSqlJs = require('sql.js'); } catch (e) { console.warn('sql.js not available for company rounds:', e.message); }

// ─── Section definitions ─────────────────────────────────────────────────────
const SECTION_DEFS = {
    aptitude:     { label: 'Aptitude',      icon: '🧮', kind: 'mcq',  desc: 'Quantitative & mathematical reasoning' },
    verbal:       { label: 'Verbal',        icon: '📝', kind: 'mcq',  desc: 'English language & comprehension' },
    logical:      { label: 'Logical',       icon: '🧠', kind: 'mcq',  desc: 'Logical patterns & sequences' },
    reasoning:    { label: 'Reasoning',     icon: '🔍', kind: 'mcq',  desc: 'Abstract & analytical reasoning' },
    technical_mcq:{ label: 'Technical MCQ', icon: '💻', kind: 'mcq',  desc: 'CS concepts, theory & technology' },
    pseudocode:   { label: 'Pseudo Code',   icon: '📋', kind: 'mcq',  desc: 'Trace pseudocode & predict output' },
    debug:        { label: 'Debugging',     icon: '🐛', kind: 'code', desc: 'Find & fix bugs in code snippets' },
    coding:       { label: 'Coding',        icon: '⌨️',  kind: 'code', desc: 'Write solutions from scratch' },
    sql:          { label: 'SQL',           icon: '🗄️',  kind: 'sql',  desc: 'SQL queries on structured schemas' }
};

// ─── Cerebras AI helpers ─────────────────────────────────────────────────────
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';

function getCerebrasKey() {
    const k = process.env.CEREBRAS_API_KEY || process.env.cereberas_api_key;
    if (k) return k;
    for (let i = 1; i <= 4; i++) {
        const ki = process.env[`CEREBRAS_API_KEY_${i}`];
        if (ki) return ki;
    }
    return null;
}

async function callAI(messages, maxTokens = 4096) {
    const key = getCerebrasKey();
    if (!key) throw new Error('No Cerebras API key configured');
    const resp = await fetch(CEREBRAS_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-oss-120b', messages, temperature: 0.7, max_tokens: maxTokens })
    });
    if (!resp.ok) throw new Error(`Cerebras API ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
}

function parseAIJson(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch {}
    const cb = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (cb) { try { return JSON.parse(cb[1].trim()); } catch {} }
    const jm = text.match(/(\[[\s\S]*?]|\{[\s\S]*?\})/s);
    if (jm) { try { return JSON.parse(jm[1]); } catch {} }
    return null;
}

// ─── AI question generation per section ──────────────────────────────────────
async function generateQuestionsAI({ section, companyName, count, difficulty, topic }) {
    const def = SECTION_DEFS[section];
    if (!def) throw new Error(`Unknown section: ${section}`);

    if (def.kind === 'mcq') {
        const sectionContext = {
            aptitude:      'quantitative aptitude, arithmetic, percentages, ratios, time & work, profit & loss, geometry',
            verbal:        'reading comprehension, sentence correction, vocabulary, grammar, fill in the blanks, synonyms/antonyms',
            logical:       'number series, letter series, coding-decoding, odd one out, analogies, directions',
            reasoning:     'blood relations, puzzles, seating arrangements, syllogism, data sufficiency, assumptions',
            technical_mcq: `technical CS concepts relevant to ${companyName} hiring: OOP, DSA, OS, DBMS, networking, programming`,
            pseudocode:    'pseudocode tracing - given pseudocode snippet, predict the output or identify the algorithm'
        }[section];

        const prompt = `You are a placement test expert creating ${count} ${difficulty} multiple-choice questions for ${companyName} first round assessment.
Section: ${def.label} (${sectionContext})${topic ? `\nTopic focus: ${topic}` : ''}

Return ONLY a JSON array of ${count} questions. Each object must have:
- "question": the question text (clear and unambiguous)  
- "options": array of exactly 4 strings like ["A) option1", "B) option2", "C) option3", "D) option4"]
- "correct_answer": single letter "A", "B", "C", or "D"
- "explanation": brief explanation of why the answer is correct

JSON array:`;

        const raw = await callAI([{ role: 'user', content: prompt }], 3000);
        const questions = parseAIJson(raw);
        if (!Array.isArray(questions)) throw new Error('AI did not return a valid array');
        return questions.slice(0, count).map(q => ({
            ...q,
            section,
            question_type: 'mcq',
            options: Array.isArray(q.options) ? q.options : []
        }));
    }

    if (def.kind === 'code') {
        const isDebug = section === 'debug';
        const prompt = isDebug
            ? `Create ${count} ${difficulty} debugging problems for ${companyName} first round.
Each problem: a short code snippet with a subtle bug that the candidate must fix.${topic ? `\nTopic: ${topic}` : ''}

Return ONLY a JSON array. Each object:
- "question": "Debug the following code to fix: [describe what it should do, include Example Input/Output matching test cases]"
- "code_snippet": "the buggy code in Python (default language)"
- "starter_code": same as code_snippet (candidate starts from buggy code)
- "language": "Python"
- "test_cases": array of {input, expected_output} — at least 2 test cases. CRITICAL: "input" must be raw stdin (newline-separated lines, NOT comma-separated). E.g. if program reads n then array: "3\\n1 2 3" not "3, 1, 2, 3".
- "explanation": what the bug was and how to fix it

JSON array:`
            : `Create ${count} ${difficulty} coding problems for ${companyName} first round.${topic ? `\nTopic: ${topic}` : ''}

Return ONLY a JSON array. Each object:
- "question": clear problem statement. Include an Example section with the EXACT stdin lines shown (e.g. Input:\\n7\\n1 2 3 4 5\\nOutput:\\n2). Each example must match the test cases exactly.
- "starter_code": A COMPLETE, RUNNABLE Python starter template. Must include:
  1. All necessary imports (sys, etc.)
  2. The solution function stub with correct parameters and a 'pass' or placeholder return
  3. A main block that reads ALL input from stdin correctly using sys.stdin / input(), calls the function, and prints the result
  4. Must be valid Python that runs without errors even before the student fills in the solution
  Example starter_code for a two-sum problem:
  "import sys\\n\\ndef two_sum(nums, target):\\n    # Write your solution here\\n    pass\\n\\nif __name__ == '__main__':\\n    n = int(input())\\n    nums = list(map(int, input().split()))\\n    target = int(input())\\n    print(two_sum(nums, target))"
- "language": "Python"
- "test_cases": array of {input, expected_output} — at least 3 test cases. CRITICAL: "input" must be raw stdin string exactly as a program reads it from standard input — multiple lines separated by \\n, NOT comma-separated. Example: if program reads n on line 1 and n numbers on line 2, input must be "5\\n1 2 3 4 5" (NOT "5, 1, 2, 3, 4, 5"). The problem's Example Input shown in "question" must EXACTLY match the first test case's "input" field.
- "explanation": approach, time complexity, and example trace

JSON array:`;

        const raw = await callAI([{ role: 'user', content: prompt }], 3000);
        const questions = parseAIJson(raw);
        if (!Array.isArray(questions)) throw new Error('AI did not return a valid array');
        return questions.slice(0, count).map(q => ({
            ...q,
            section,
            question_type: 'code',
            test_cases: Array.isArray(q.test_cases) ? q.test_cases : []
        }));
    }

    if (def.kind === 'sql') {
        const prompt = `Create ${count} ${difficulty} SQL problems for ${companyName} first round assessment.${topic ? `\nTopic: ${topic}` : ''}

Return ONLY a JSON array. Each object:
- "question": clear SQL task description  
- "sql_schema": complete CREATE TABLE + INSERT statements (SQLite compatible, no backticks, use TEXT/INTEGER/REAL/NUMERIC)
- "expected_output": the correct query result in pipe-separated format: "col1|col2\\nval1|val2"
- "explanation": the correct SQL query with explanation

JSON array:`;

        const raw = await callAI([{ role: 'user', content: prompt }], 3000);
        const questions = parseAIJson(raw);
        if (!Array.isArray(questions)) throw new Error('AI did not return a valid array');
        return questions.slice(0, count).map(q => ({
            ...q,
            section,
            question_type: 'sql'
        }));
    }

    throw new Error(`Unsupported section kind: ${def.kind}`);
}

// ─── Code execution helper (local subprocess) ────────────────────────────────
async function runCodeLocally(code, language, stdin) {
    const tmpDir = os.tmpdir();
    const runId = uuidv4().slice(0, 8);
    const cleanupFiles = [];

    const spawnWithTimeout = (cmd, args, input, timeout = 10000) => {
        const { spawn } = require('child_process');
        return new Promise((resolve) => {
            let stdout = '', stderr = '';
            const proc = spawn(cmd, args, { timeout });
            proc.stdout.on('data', d => { stdout += d.toString(); });
            proc.stderr.on('data', d => { stderr += d.toString(); });
            if (input) { proc.stdin.write(input); proc.stdin.end(); }
            const timer = setTimeout(() => {
                try { proc.kill('SIGTERM'); } catch {}
                resolve({ stdout, stderr, exitCode: 1, timedOut: true });
            }, timeout);
            proc.on('close', (code) => {
                clearTimeout(timer);
                resolve({ stdout, stderr, exitCode: code || 0 });
            });
            proc.on('error', (err) => {
                clearTimeout(timer);
                resolve({ stdout: '', stderr: err.message, exitCode: 1 });
            });
        });
    };

    try {
        let result;
        if (language === 'Python') {
            const fp = path.join(tmpDir, `crt_${runId}.py`);
            fs.writeFileSync(fp, code); cleanupFiles.push(fp);
            result = await spawnWithTimeout('python', [fp], stdin);
        } else if (language === 'JavaScript') {
            const fp = path.join(tmpDir, `crt_${runId}.js`);
            fs.writeFileSync(fp, code); cleanupFiles.push(fp);
            result = await spawnWithTimeout('node', [fp], stdin);
        } else if (language === 'Java') {
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            const cls = classMatch ? classMatch[1] : 'Main';
            const dir = path.join(tmpDir, `crt_java_${runId}`);
            fs.mkdirSync(dir, { recursive: true });
            const fp = path.join(dir, `${cls}.java`);
            fs.writeFileSync(fp, code); cleanupFiles.push(dir);
            const compile = await spawnWithTimeout('javac', [fp], '');
            if (compile.exitCode !== 0) return { output: compile.stderr || 'Compile error', exitCode: 1 };
            result = await spawnWithTimeout('java', ['-cp', dir, cls], stdin);
        } else if (language === 'C') {
            const sp = path.join(tmpDir, `crt_${runId}.c`);
            const op = path.join(tmpDir, `crt_${runId}${os.platform() === 'win32' ? '.exe' : ''}`);
            fs.writeFileSync(sp, code); cleanupFiles.push(sp, op);
            const compile = await spawnWithTimeout('gcc', [sp, '-o', op, '-lm'], '');
            if (compile.exitCode !== 0) return { output: compile.stderr || 'Compile error', exitCode: 1 };
            result = await spawnWithTimeout(op, [], stdin);
        } else if (language === 'C++') {
            const sp = path.join(tmpDir, `crt_${runId}.cpp`);
            const op = path.join(tmpDir, `crt_${runId}${os.platform() === 'win32' ? '.exe' : ''}`);
            fs.writeFileSync(sp, code); cleanupFiles.push(sp, op);
            const compile = await spawnWithTimeout('g++', [sp, '-o', op, '-lm'], '');
            if (compile.exitCode !== 0) return { output: compile.stderr || 'Compile error', exitCode: 1 };
            result = await spawnWithTimeout(op, [], stdin);
        } else {
            return { output: `Unsupported language: ${language}`, exitCode: 1 };
        }
        return { output: (result.stdout + result.stderr).trim() || '(no output)', exitCode: result.exitCode, timedOut: result.timedOut };
    } finally {
        for (const f of cleanupFiles) {
            try { if (fs.existsSync(f)) { const stat = fs.statSync(f); if (stat.isDirectory()) fs.rmSync(f, { recursive: true }); else fs.unlinkSync(f); } } catch {}
        }
    }
}

// ─── SQL execution helper ─────────────────────────────────────────────────────
function sanitizeForSQLite(sql) {
    if (!sql) return '';
    return sql
        .replace(/ENGINE\s*=\s*\w+/gi,' ').replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi,' ')
        .replace(/AUTO_INCREMENT\s*=\s*\d+/gi,' ').replace(/\bAUTO_INCREMENT\b/gi,' ')
        .replace(/`([^`]+)`/g,'"$1"').replace(/\bTINYINT\s*\(\s*1\s*\)/gi,'INTEGER')
        .replace(/\b(BOOLEAN|BOOL)\b/gi,'INTEGER').replace(/\b(DECIMAL|NUMERIC)\s*\(\s*\d+\s*(,\s*\d+\s*)?\)/gi,'NUMERIC')
        .replace(/\b(DOUBLE|FLOAT)\b/gi,'REAL').replace(/\b(DATETIME|TIMESTAMP)\b/gi,'TEXT')
        .replace(/\b(MEDIUM|LONG|TINY)TEXT\b/gi,'TEXT').replace(/\b(MEDIUM|TINY|BIG|SMALL)INT\b(\s*\(\s*\d+\s*\))?/gi,'INTEGER')
        .replace(/\bINT\s*\(\s*\d+\s*\)/gi,'INTEGER').replace(/\bVARCHAR\s*\(\s*\d+\s*\)/gi,'TEXT')
        .replace(/\bCHAR\s*\(\s*\d+\s*\)/gi,'TEXT').replace(/\bENUM\s*\([^)]+\)/gi,'TEXT')
        .replace(/\bUNSIGNED\b/gi,' ').replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi,' ')
        .replace(/\bCOMMENT\s+'[^']*'/gi,' ');
}

async function executeSQLLocal(schema, query) {
    if (!initSqlJs) return { success: false, error: 'sql.js not available', results: [] };
    try {
        const SQL = await initSqlJs();
        const db = new SQL.Database();
        if (schema && schema.trim()) {
            const clean = sanitizeForSQLite(schema);
            const stmts = clean.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
            for (const stmt of stmts) {
                try { db.run(stmt + ';'); } catch (e) { /* ignore schema errors */ }
            }
        }
        const cleanQ = sanitizeForSQLite(query || '');
        const results = db.exec(cleanQ);
        db.close();
        return { success: true, results };
    } catch (err) {
        return { success: false, error: err.message, results: [] };
    }
}

function sqlResultsToText(results) {
    if (!results || results.length === 0) return '';
    const rs = results[0];
    if (!rs || !rs.values || rs.values.length === 0) return '(no rows)';
    return rs.values.map(row => row.map(v => (v === null ? 'NULL' : String(v))).join('|')).join('\n');
}

function compareSQLResultsLocal(actual, expectedText) {
    const norm = v => { if (v === null || v === undefined) return ''; const s = String(v).trim(); const n = Number(s.replace(/,/g,'')); return !isNaN(n) && s !== '' ? String(parseFloat(n)) : s.toLowerCase(); };
    const expectedLines = (expectedText||'').trim().split('\n').map(l=>l.trim()).filter(l=>l.length>0);
    const actualEmpty = !actual||actual.length===0||!actual[0].values||actual[0].values.length===0;
    const expectedEmpty = expectedLines.length===0||(expectedLines.length===1&&expectedLines[0].toLowerCase().includes('no rows'));
    if (actualEmpty && expectedEmpty) return true;
    if (actualEmpty || expectedEmpty) return false;
    const rs = actual[0]; const actualRows = rs.values.map(r=>r.map(norm));
    const parseLine = l => l.includes('|') ? l.split('|').map(v=>norm(v)) : l.split(/\s{2,}/).map(v=>norm(v)).filter(v=>v.length>0);
    const expectedRows = expectedLines.map(parseLine);
    if (actualRows.length !== expectedRows.length) return false;
    return actualRows.every((ar,i)=> { const er=expectedRows[i]; return er.every((ec,j)=>ec===''||ec===ar[j]); });
}

// ─── safeParse ────────────────────────────────────────────────────────────────
const safeParse = (val, fb = null) => {
    if (val === null || val === undefined) return fb;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return fb; }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  REGISTER ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
function registerCompanyRoundRoutes(app, pool) {

    // ─── ADMIN: Section list ─────────────────────────────────────────────────
    app.get('/api/crt/sections', (req, res) => {
        res.json(Object.entries(SECTION_DEFS).map(([key, def]) => ({ key, ...def })));
    });

    // ─── ADMIN: List all tests ───────────────────────────────────────────────
    app.get('/api/crt/tests', async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT t.*,
                    (SELECT COUNT(*) FROM crt_attempts a WHERE a.test_id = t.id) AS total_attempts,
                    (SELECT COUNT(*) FROM crt_attempts a WHERE a.test_id = t.id AND a.status = 'completed') AS completed_attempts,
                    (SELECT AVG(a.overall_score) FROM crt_attempts a WHERE a.test_id = t.id AND a.status = 'completed') AS avg_score,
                    (SELECT COUNT(*) FROM crt_questions q WHERE q.test_id = t.id) AS total_questions
                FROM crt_tests t ORDER BY t.created_at DESC
            `);
            res.json(rows.map(r => ({
                ...r,
                sections: safeParse(r.sections, []),
                assigned_students: safeParse(r.assigned_students, []),
                proctoring_config: safeParse(r.proctoring_config, {})
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Create test ──────────────────────────────────────────────────
    app.post('/api/crt/tests', async (req, res) => {
        try {
            const {
                company_name, title, description, sections, difficulty = 'medium',
                duration_minutes = 60, max_attempts = 1, pass_percentage = 60,
                proctoring_config = {}, section_time_limits = {}
            } = req.body;

            if (!company_name?.trim() || !title?.trim()) return res.status(400).json({ error: 'Company name and title required' });
            if (!Array.isArray(sections) || sections.length === 0) return res.status(400).json({ error: 'Select at least one section' });

            const invalidSections = sections.filter(s => !SECTION_DEFS[s]);
            if (invalidSections.length > 0) return res.status(400).json({ error: `Invalid sections: ${invalidSections.join(', ')}` });

            const [result] = await pool.query(
                `INSERT INTO crt_tests (company_name, title, description, sections, difficulty, duration_minutes, max_attempts, pass_percentage, proctoring_config, section_time_limits, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [company_name.trim(), title.trim(), description || '', JSON.stringify(sections),
                 difficulty, duration_minutes, max_attempts, pass_percentage,
                 JSON.stringify(proctoring_config), JSON.stringify(section_time_limits), req.user?.id || null]
            );
            res.json({ success: true, testId: result.insertId });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Update test metadata ─────────────────────────────────────────
    app.put('/api/crt/tests/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, difficulty, duration_minutes, max_attempts, pass_percentage, proctoring_config, section_time_limits } = req.body;
            await pool.query(
                `UPDATE crt_tests SET title=COALESCE(?,title), description=COALESCE(?,description),
                 difficulty=COALESCE(?,difficulty), duration_minutes=COALESCE(?,duration_minutes),
                 max_attempts=COALESCE(?,max_attempts), pass_percentage=COALESCE(?,pass_percentage),
                 proctoring_config=COALESCE(?,proctoring_config),
                 section_time_limits=COALESCE(?,section_time_limits)
                 WHERE id=?`,
                [title, description, difficulty, duration_minutes, max_attempts, pass_percentage,
                 proctoring_config ? JSON.stringify(proctoring_config) : null,
                 section_time_limits ? JSON.stringify(section_time_limits) : null, id]
            );
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Toggle live/end ───────────────────────────────────────────────
    app.put('/api/crt/tests/:id/toggle', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT is_active FROM crt_tests WHERE id = ?', [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Test not found' });
            const newState = !rows[0].is_active;
            await pool.query('UPDATE crt_tests SET is_active = ? WHERE id = ?', [newState, req.params.id]);
            res.json({ success: true, is_active: newState });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Delete test ──────────────────────────────────────────────────
    app.delete('/api/crt/tests/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM crt_answers WHERE attempt_id IN (SELECT id FROM crt_attempts WHERE test_id = ?)', [id]);
            await pool.query('DELETE FROM crt_attempts WHERE test_id = ?', [id]);
            await pool.query('DELETE FROM crt_questions WHERE test_id = ?', [id]);
            await pool.query('DELETE FROM crt_tests WHERE id = ?', [id]);
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Assign students ──────────────────────────────────────────────
    app.put('/api/crt/tests/:id/assign', async (req, res) => {
        try {
            const { student_ids } = req.body;
            await pool.query('UPDATE crt_tests SET assigned_students = ? WHERE id = ?',
                [JSON.stringify(Array.isArray(student_ids) ? student_ids : []), req.params.id]);
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Get students list ─────────────────────────────────────────────
    app.get('/api/crt/students', async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT id, name, email FROM users WHERE role = 'student' ORDER BY name ASC");
            res.json(rows);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Get questions for a test ─────────────────────────────────────
    app.get('/api/crt/tests/:id/questions', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM crt_questions WHERE test_id = ? ORDER BY section, id', [req.params.id]);
            res.json(rows.map(r => ({
                ...r,
                options: safeParse(r.options, []),
                test_cases: safeParse(r.test_cases, [])
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Add question manually ────────────────────────────────────────
    app.post('/api/crt/tests/:id/questions', async (req, res) => {
        try {
            const { id: testId } = req.params;
            const {
                section, question_type, question, options, correct_answer, explanation,
                code_snippet, starter_code, test_cases, language, sql_schema, expected_output
            } = req.body;

            if (!section || !question) return res.status(400).json({ error: 'Section and question are required' });
            if (!SECTION_DEFS[section]) return res.status(400).json({ error: 'Invalid section' });

            const [result] = await pool.query(
                `INSERT INTO crt_questions (test_id, section, question_type, question, options, correct_answer,
                 explanation, code_snippet, starter_code, test_cases, language, sql_schema, expected_output)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [testId, section, question_type || 'mcq', question,
                 JSON.stringify(options || []), correct_answer || '', explanation || '',
                 code_snippet || '', starter_code || '',
                 JSON.stringify(test_cases || []), language || 'Python',
                 sql_schema || '', expected_output || '']
            );
            res.json({ success: true, questionId: result.insertId });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Delete question ───────────────────────────────────────────────
    app.delete('/api/crt/tests/:testId/questions/:qid', async (req, res) => {
        try {
            await pool.query('DELETE FROM crt_questions WHERE id = ? AND test_id = ?', [req.params.qid, req.params.testId]);
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: AI generate questions for a section ──────────────────────────
    app.post('/api/crt/tests/:id/ai-generate', async (req, res) => {
        try {
            const { id: testId } = req.params;
            const { section, count = 5, difficulty = 'medium', topic = '' } = req.body;

            // Get test company name for context
            const [tests] = await pool.query('SELECT company_name FROM crt_tests WHERE id = ?', [testId]);
            if (tests.length === 0) return res.status(404).json({ error: 'Test not found' });
            const { company_name } = tests[0];

            const questions = await generateQuestionsAI({ section, companyName: company_name, count, difficulty, topic });

            // Bulk insert generated questions
            let inserted = 0;
            for (const q of questions) {
                try {
                    await pool.query(
                        `INSERT INTO crt_questions (test_id, section, question_type, question, options, correct_answer,
                         explanation, code_snippet, starter_code, test_cases, language, sql_schema, expected_output)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [testId, section, q.question_type || 'mcq', q.question || '',
                         JSON.stringify(q.options || []), q.correct_answer || '',
                         q.explanation || '', q.code_snippet || '', q.starter_code || '',
                         JSON.stringify(q.test_cases || []), q.language || 'Python',
                         q.sql_schema || '', q.expected_output || '']
                    );
                    inserted++;
                } catch (qErr) { console.warn('Question insert error:', qErr.message); }
            }
            res.json({ success: true, inserted, total: questions.length });
        } catch (err) {
            console.error('AI Generate error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // ─── ADMIN: View attempts for a test ─────────────────────────────────────
    app.get('/api/crt/tests/:id/attempts', async (req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, student_id, student_name, status, overall_score, section_scores, started_at, completed_at,
                        proctoring_violations
                 FROM crt_attempts WHERE test_id = ? ORDER BY started_at DESC`,
                [req.params.id]
            );
            res.json(rows.map(r => ({
                ...r,
                section_scores: safeParse(r.section_scores, {}),
                proctoring_violations: safeParse(r.proctoring_violations, [])
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ─── ADMIN: Test-level analytics / report ────────────────────────────────
    app.get('/api/crt/tests/:id/analytics', async (req, res) => {
        try {
            const [tests] = await pool.query('SELECT * FROM crt_tests WHERE id = ?', [req.params.id]);
            if (tests.length === 0) return res.status(404).json({ error: 'Test not found' });
            const test = tests[0];
            test.sections = safeParse(test.sections, []);

            const [attempts] = await pool.query(
                'SELECT overall_score, section_scores, status FROM crt_attempts WHERE test_id = ?',
                [req.params.id]
            );
            const completed = attempts.filter(a => a.status === 'completed');

            const avgScore = completed.length > 0
                ? completed.reduce((s, a) => s + (a.overall_score || 0), 0) / completed.length : 0;

            const passCount = completed.filter(a => a.overall_score >= (test.pass_percentage || 60)).length;

            // Per-section averages
            const sectionAvg = {};
            for (const s of test.sections) {
                const vals = completed.map(a => {
                    const ss = safeParse(a.section_scores, {});
                    return ss[s]?.score || 0;
                });
                sectionAvg[s] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            }

            res.json({
                test: { ...test, proctoring_config: safeParse(test.proctoring_config, {}) },
                stats: {
                    total_attempts: attempts.length,
                    completed_attempts: completed.length,
                    avg_score: Math.round(avgScore * 10) / 10,
                    pass_count: passCount,
                    fail_count: completed.length - passCount,
                    pass_rate: completed.length > 0 ? Math.round(passCount / completed.length * 100) : 0,
                    section_averages: sectionAvg
                }
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    //  STUDENT: TAKE TEST
    // ═══════════════════════════════════════════════════════════════════════════

    // Get tests assigned to me (student)
    app.get('/api/crt/student/tests', async (req, res) => {
        try {
            const studentId = req.user?.id || req.query.studentId;
            if (!studentId) return res.status(400).json({ error: 'Student ID required' });

            const [rows] = await pool.query(
                `SELECT t.*, 
                    (SELECT COUNT(*) FROM crt_attempts a WHERE a.test_id = t.id AND a.student_id = ?) AS my_attempts,
                    (SELECT MAX(a.overall_score) FROM crt_attempts a WHERE a.test_id = t.id AND a.student_id = ? AND a.status = 'completed') AS my_best_score,
                    (SELECT COUNT(*) FROM crt_questions q WHERE q.test_id = t.id) AS total_questions
                 FROM crt_tests t
                 WHERE t.is_active = 1
                 ORDER BY t.created_at DESC`,
                [studentId, studentId]
            );

            // Filter: only assigned students can see the test (or all if assigned_students is empty/null)
            const sid = String(studentId); // IDs can be UUIDs or string-prefixed, never parseInt
            const filtered = rows.filter(t => {
                const assigned = safeParse(t.assigned_students, []);
                if (!assigned || assigned.length === 0) return true; // no restriction = visible to all
                return assigned.some(id => String(id) === sid);
            });

            res.json(filtered.map(r => ({
                ...r,
                sections: safeParse(r.sections, []),
                proctoring_config: safeParse(r.proctoring_config, {})
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Start an attempt (student)
    app.post('/api/crt/tests/:id/start', async (req, res) => {
        try {
            const testId = req.params.id;
            const studentId = req.user?.id || req.body.studentId;
            const studentName = req.user?.name || req.body.studentName || 'Student';
            if (!studentId) return res.status(400).json({ error: 'Student ID required' });

            const [tests] = await pool.query('SELECT * FROM crt_tests WHERE id = ?', [testId]);
            if (tests.length === 0) return res.status(404).json({ error: 'Test not found' });
            const test = tests[0];
            if (!test.is_active) return res.status(400).json({ error: 'Test is not active' });

            // Check attempt limit
            if (test.max_attempts > 0) {
                const [[{ cnt }]] = await pool.query(
                    'SELECT COUNT(*) as cnt FROM crt_attempts WHERE test_id = ? AND student_id = ?',
                    [testId, studentId]
                );
                if (cnt >= test.max_attempts) {
                    return res.status(400).json({ error: `Maximum attempts (${test.max_attempts}) reached` });
                }
            }

            // Get questions (grouped by section, without correct_answer for student)
            const [questions] = await pool.query(
                'SELECT id, section, question_type, question, options, code_snippet, starter_code, test_cases, language, sql_schema FROM crt_questions WHERE test_id = ? ORDER BY section, id',
                [testId]
            );

            const [attempt] = await pool.query(
                'INSERT INTO crt_attempts (test_id, student_id, student_name) VALUES (?, ?, ?)',
                [testId, studentId, studentName]
            );

            const sections = safeParse(test.sections, []);
            const questionsBySection = {};
            for (const sec of sections) questionsBySection[sec] = [];
            for (const q of questions) {
                if (!questionsBySection[q.section]) questionsBySection[q.section] = [];
                questionsBySection[q.section].push({
                    ...q,
                    options: safeParse(q.options, []),
                    test_cases: safeParse(q.test_cases, [])
                });
            }

            res.json({
                success: true,
                attemptId: attempt.insertId,
                test: {
                    id: test.id, company_name: test.company_name, title: test.title,
                    duration_minutes: test.duration_minutes, difficulty: test.difficulty,
                    sections, pass_percentage: test.pass_percentage,
                    proctoring_config: safeParse(test.proctoring_config, {}),
                    section_time_limits: safeParse(test.section_time_limits, {})
                },
                questionsBySection
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Student: Run code (during testing — not evaluated yet)
    app.post('/api/crt/attempt/:aid/run-code', async (req, res) => {
        try {
            const { code, language = 'Python', stdin = '' } = req.body;
            if (!code) return res.status(400).json({ error: 'Code required' });
            const result = await runCodeLocally(code, language, stdin);
            res.json({ output: result.output, exitCode: result.exitCode, timedOut: result.timedOut });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Student: Run SQL (during testing — not evaluated)
    app.post('/api/crt/attempt/:aid/run-sql', async (req, res) => {
        try {
            const { query, schema = '' } = req.body;
            if (!query) return res.status(400).json({ error: 'Query required' });
            const result = await executeSQLLocal(schema, query);
            if (!result.success) return res.json({ output: `Error: ${result.error}`, success: false });
            const text = sqlResultsToText(result.results);
            res.json({ output: text || '(no rows returned)', success: true, results: result.results });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Student: Submit entire test ─────────────────────────────────────────────
    app.post('/api/crt/attempt/:aid/submit', async (req, res) => {
        try {
            const { aid } = req.params;
            const { answers, proctoring_violations = [], section_time_spent = {} } = req.body;
            // answers format: { questionId: { student_answer, language?, code?, query? } }

            const [attempts] = await pool.query('SELECT * FROM crt_attempts WHERE id = ?', [aid]);
            if (attempts.length === 0) return res.status(404).json({ error: 'Attempt not found' });
            const attempt = attempts[0];
            if (attempt.status === 'completed') return res.status(400).json({ error: 'Already submitted' });

            // Get all questions for this test (with answers)
            const [questions] = await pool.query('SELECT * FROM crt_questions WHERE test_id = ?', [attempt.test_id]);

            // Get test sections and pass_percentage
            const [tests] = await pool.query('SELECT sections, pass_percentage FROM crt_tests WHERE id = ?', [attempt.test_id]);
            const testSections = safeParse(tests[0].sections, []);
            const passPercentage = tests[0].pass_percentage || 60;

            // Evaluate each question
            const sectionStats = {}; // { section: { correct, total, score } }
            for (const sec of testSections) sectionStats[sec] = { correct: 0, total: 0, score: 0 };

            let totalScore = 0;
            let totalQuestions = questions.length;
            const sectionScoreSum = {}; // accumulate qScore per section for accurate section %

            for (const q of questions) {
                const ans = (answers || {})[q.id] || {};
                const sec = q.section;
                if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, total: 0, score: 0 };
                sectionStats[sec].total++;

                let isCorrect = false;
                let qScore = 0;
                let executionResult = null;

                if (q.question_type === 'mcq') {
                    const studentAns = (ans.student_answer || '').trim().toUpperCase();
                    const correctAns = (q.correct_answer || '').trim().toUpperCase();
                    isCorrect = studentAns === correctAns && studentAns !== '';
                    qScore = isCorrect ? 100 : 0;

                } else if (q.question_type === 'code') {
                    // Execute code against test cases
                    const code = ans.code || ans.student_answer || '';
                    const lang = ans.language || safeParse(q.language, 'Python') || 'Python';
                    const testCases = safeParse(q.test_cases, []);
                    let passedCases = 0;

                    if (code.trim() && testCases.length > 0) {
                        for (const tc of testCases) {
                            try {
                                const result = await runCodeLocally(code, lang, String(tc.input || ''));
                                const actual = (result.output || '').trim();
                                const expected = String(tc.expected_output || '').trim();
                                if (actual === expected) passedCases++;
                            } catch {}
                        }
                        qScore = Math.round((passedCases / testCases.length) * 100);
                        isCorrect = passedCases === testCases.length;
                        executionResult = { passedCases, totalCases: testCases.length };
                    }

                } else if (q.question_type === 'sql') {
                    const query = ans.query || ans.student_answer || '';
                    const schema = q.sql_schema || '';
                    if (query.trim()) {
                        const result = await executeSQLLocal(schema, query);
                        isCorrect = result.success && compareSQLResultsLocal(result.results, q.expected_output || '');
                        qScore = isCorrect ? 100 : (result.success ? 50 : 0); // partial credit for running
                        executionResult = {
                            success: result.success,
                            output: result.success ? sqlResultsToText(result.results) : result.error,
                            isCorrect
                        };
                    }
                }

                if (isCorrect) sectionStats[sec].correct++;
                sectionScoreSum[sec] = (sectionScoreSum[sec] || 0) + qScore;
                totalScore += qScore;

                // Save answer record
                try {
                    await pool.query(
                        `INSERT INTO crt_answers (attempt_id, question_id, section, student_answer, is_correct, score, execution_result)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [aid, q.id, sec,
                         ans.student_answer || ans.code || ans.query || '',
                         isCorrect ? 1 : 0, qScore,
                         executionResult ? JSON.stringify(executionResult) : null]
                    );
                } catch (ansErr) { console.warn('Answer insert err:', ansErr.message); }
            }

            // Compute per-section scores (use average qScore for partial credit on code/sql)
            for (const sec of Object.keys(sectionStats)) {
                const s = sectionStats[sec];
                s.score = s.total > 0 ? Math.round((sectionScoreSum[sec] || 0) / s.total) : 0;
                s.time_spent = section_time_spent[sec] || 0;
            }

            // Compute overall score
            const overallScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;

            // Update attempt
            await pool.query(
                `UPDATE crt_attempts SET status = 'completed', completed_at = NOW(),
                 overall_score = ?, section_scores = ?, proctoring_violations = ? WHERE id = ?`,
                [overallScore, JSON.stringify(sectionStats), JSON.stringify(proctoring_violations), aid]
            );

            res.json({
                success: true,
                overall_score: overallScore,
                section_scores: sectionStats,
                passed: overallScore >= passPercentage,
                pass_percentage: passPercentage,
                section_time_spent
            });
        } catch (err) {
            console.error('Submit error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Student: Get attempt report
    app.get('/api/crt/attempt/:aid/report', async (req, res) => {
        try {
            const [attempts] = await pool.query(
                `SELECT a.*, t.company_name, t.title, t.sections, t.pass_percentage, t.difficulty, t.duration_minutes
                 FROM crt_attempts a JOIN crt_tests t ON a.test_id = t.id WHERE a.id = ?`,
                [req.params.aid]
            );
            if (attempts.length === 0) return res.status(404).json({ error: 'Attempt not found' });
            const attempt = attempts[0];

            // Get answers with question details
            const [answers] = await pool.query(
                `SELECT ans.*, q.question, q.section, q.question_type, q.correct_answer, q.explanation,
                        q.options, q.test_cases, q.code_snippet, q.sql_schema, q.expected_output
                 FROM crt_answers ans JOIN crt_questions q ON ans.question_id = q.id
                 WHERE ans.attempt_id = ? ORDER BY q.section, q.id`,
                [req.params.aid]
            );

            res.json({
                attempt: {
                    ...attempt,
                    sections: safeParse(attempt.sections, []),
                    section_scores: safeParse(attempt.section_scores, {}),
                    proctoring_violations: safeParse(attempt.proctoring_violations, [])
                },
                answers: answers.map(a => ({
                    ...a,
                    options: safeParse(a.options, []),
                    test_cases: safeParse(a.test_cases, []),
                    execution_result: safeParse(a.execution_result, null)
                }))
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Student: Get my attempts across all CRT tests
    app.get('/api/crt/student/history', async (req, res) => {
        try {
            const studentId = req.user?.id || req.query.studentId;
            if (!studentId) return res.status(400).json({ error: 'Student ID required' });
            const [rows] = await pool.query(
                `SELECT a.id, a.test_id, a.status, a.overall_score, a.started_at, a.completed_at, a.section_scores,
                        t.company_name, t.title, t.sections, t.pass_percentage
                 FROM crt_attempts a JOIN crt_tests t ON a.test_id = t.id
                 WHERE a.student_id = ? ORDER BY a.started_at DESC`,
                [studentId]
            );
            res.json(rows.map(r => ({
                ...r,
                sections: safeParse(r.sections, []),
                section_scores: safeParse(r.section_scores, {})
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // Diagnostic: check which compilers are available on this server
    app.get('/api/crt/diag/compilers', async (req, res) => {
        const { execFile } = require('child_process');
        const check = (cmd, args) => new Promise(resolve => {
            execFile(cmd, args, { timeout: 5000 }, (err, stdout, stderr) => {
                resolve({ available: !err || (!err.code && err.code !== 'ENOENT'), version: (stdout || stderr || err?.message || '').trim().split('\n')[0] });
            });
        });
        const results = await Promise.all([
            check('javac', ['-version']).then(r => ({ name: 'Java (javac)', ...r })),
            check('python3', ['--version']).then(r => ({ name: 'Python3', ...r })),
            check('python', ['--version']).then(r => ({ name: 'Python', ...r })),
            check('node', ['--version']).then(r => ({ name: 'Node.js', ...r })),
            check('gcc', ['--version']).then(r => ({ name: 'C (gcc)', ...r })),
            check('g++', ['--version']).then(r => ({ name: 'C++ (g++)', ...r })),
        ]);
        res.json({ platform: process.platform, results });
    });

    console.log('✅ Company Round Test routes registered');
}

module.exports = registerCompanyRoundRoutes;
