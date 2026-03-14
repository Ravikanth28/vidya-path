const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const API_UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'frontend-evals');
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const RUNTIME_TIMEOUT_MS = 45000;

function safeJsonParse(value, fallback) {
    try {
        if (value == null || value === '') return fallback;
        if (typeof value === 'object') return value;
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function sanitizeSegment(name) {
    return String(name || 'file')
        .replace(/[<>:"|?*\x00-\x1F]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/[\\/]+/g, '_')
        .slice(0, 120);
}

async function ensureDir(dirPath) {
    await fsp.mkdir(dirPath, { recursive: true });
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

function normalizeScriptCommand(cmd) {
    return String(cmd || '').trim().toLowerCase();
}

async function expandZip(zipPath, destinationPath) {
    await ensureDir(destinationPath);
    const command = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destinationPath.replace(/'/g, "''")}' -Force`;
    await execFileAsync('powershell', ['-NoProfile', '-Command', command], { windowsHide: true });
}

async function buildFileTree(rootDir, currentDir = rootDir) {
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });
    const children = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) continue;
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            children.push({
                type: 'dir',
                name: entry.name,
                path: relPath,
                children: await buildFileTree(rootDir, fullPath),
            });
        } else {
            const stat = await fsp.stat(fullPath);
            children.push({
                type: 'file',
                name: entry.name,
                path: relPath,
                size: stat.size,
            });
        }
    }
    return children;
}

async function collectProjectFiles(rootDir) {
    const files = [];
    async function walk(currentDir) {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) continue;
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else {
                const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                const stat = await fsp.stat(fullPath);
                files.push({ fullPath, relPath, size: stat.size });
            }
        }
    }
    await walk(rootDir);
    return files;
}

function trimContent(content, maxChars = 1800) {
    const normalized = String(content || '').replace(/\u0000/g, '');
    return normalized.length > maxChars ? normalized.slice(0, maxChars) + '\n...[truncated]' : normalized;
}

async function gatherSourceSnippets(rootDir, files) {
    const interesting = files.filter(file => /\.(html?|css|js|jsx|ts|tsx|json|md)$/i.test(file.relPath)).slice(0, 14);
    const snippets = [];
    for (const file of interesting) {
        try {
            const raw = await fsp.readFile(file.fullPath, 'utf8');
            snippets.push({
                path: file.relPath,
                content: trimContent(raw),
            });
        } catch {
            // ignore unreadable file
        }
    }
    return snippets;
}

function summarizeStats(files, packageJson) {
    const htmlFiles = files.filter(file => /\.html?$/i.test(file.relPath));
    const cssFiles = files.filter(file => /\.css$/i.test(file.relPath));
    const jsFiles = files.filter(file => /\.(js|jsx|ts|tsx)$/i.test(file.relPath));
    const hasIndexHtml = files.some(file => /(^|\/)index\.html?$/i.test(file.relPath));
    const hasResponsiveHints = files.some(file => /(^|\/)(style|styles|app|main).*\.css$/i.test(file.relPath));
    const hasPackageJson = Boolean(packageJson);
    const dependencies = Object.keys(packageJson?.dependencies || {});
    const devDependencies = Object.keys(packageJson?.devDependencies || {});
    const scripts = packageJson?.scripts || {};
    const framework =
        dependencies.includes('react') ? 'react' :
            dependencies.includes('vue') ? 'vue' :
                dependencies.includes('angular') ? 'angular' :
                    hasIndexHtml ? 'static-html' : 'unknown';

    return {
        fileCount: files.length,
        htmlCount: htmlFiles.length,
        cssCount: cssFiles.length,
        jsCount: jsFiles.length,
        hasIndexHtml,
        hasPackageJson,
        hasResponsiveHints,
        framework,
        dependencies,
        devDependencies,
        scripts,
    };
}

function computeLocalBreakdown(stats, sourceText, requirementsText) {
    const joined = sourceText.toLowerCase();
    const requirements = String(requirementsText || '').toLowerCase();
    const mediaQueries = (joined.match(/@media/g) || []).length;
    const semanticTags = (joined.match(/<(header|main|section|nav|footer|article|aside)\b/g) || []).length;
    const eventHandlers = (joined.match(/addEventListener|\bonclick=|\bonsubmit=|\bfetch\(|axios\.|XMLHttpRequest/g) || []).length;
    const comments = (joined.match(/\/\*|\/\/|<!--/g) || []).length;
    const requirementHits = requirements
        ? requirements.split(/\n+/).map(line => line.trim()).filter(Boolean).filter(line => joined.includes(line.slice(0, 20))).length
        : 0;

    const structure = Math.min(100, 35
        + (stats.hasIndexHtml ? 20 : 0)
        + (stats.hasPackageJson ? 10 : 0)
        + Math.min(stats.cssCount * 6, 18)
        + Math.min(stats.jsCount * 6, 18));

    const functionality = Math.min(100, 28
        + (stats.hasIndexHtml || stats.hasPackageJson ? 18 : 0)
        + Math.min(eventHandlers * 8, 24)
        + Math.min(requirementHits * 8, 18));

    const uiUx = Math.min(100, 30
        + Math.min(stats.cssCount * 10, 25)
        + Math.min(semanticTags * 6, 18)
        + (joined.includes('aria-') ? 8 : 0));

    const responsiveness = Math.min(100, 20
        + Math.min(mediaQueries * 18, 45)
        + (joined.includes('viewport') ? 15 : 0)
        + (joined.includes('flex') || joined.includes('grid') ? 12 : 0));

    const codeQuality = Math.min(100, 30
        + Math.min(comments * 4, 12)
        + Math.min(stats.jsCount * 8, 20)
        + (joined.includes('const ') || joined.includes('let ') ? 12 : 0)
        + (joined.includes('async ') || joined.includes('await ') ? 8 : 0));

    return {
        structure,
        functionality,
        uiUx,
        responsiveness,
        codeQuality,
    };
}

async function tryRuntimeEvaluation(projectRoot, packageJson, stats) {
    const result = {
        attempted: false,
        success: false,
        mode: stats.framework,
        summary: '',
        output: '',
    };

    if (stats.hasIndexHtml) {
        result.summary = 'Static entry detected via index.html. Project appears directly previewable in a browser.';
    }

    if (!packageJson) return result;

    const scripts = packageJson.scripts || {};
    const hasNodeModules = fs.existsSync(path.join(projectRoot, 'node_modules'));
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const preferredScript = ['build', 'test', 'start'].find(name => scripts[name]);
    if (!preferredScript || !hasNodeModules) {
        result.summary = result.summary || 'package.json found, but runtime execution was skipped because dependencies are not installed or scripts are unavailable.';
        return result;
    }

    result.attempted = true;
    try {
        const { stdout, stderr } = await execFileAsync(npmBin, ['run', preferredScript], {
            cwd: projectRoot,
            timeout: RUNTIME_TIMEOUT_MS,
            windowsHide: true,
            maxBuffer: 1024 * 1024,
        });
        result.success = true;
        result.summary = `Runtime check succeeded using \`npm run ${preferredScript}\`.`;
        result.output = trimContent((stdout || '') + '\n' + (stderr || ''), 2500);
    } catch (error) {
        result.success = false;
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        result.summary = `Runtime check failed while running \`npm run ${preferredScript}\`.`;
        result.output = trimContent(`${stdout}\n${stderr}\n${error.message || ''}`, 2500);
    }

    return result;
}

function fallbackAiReport(localBreakdown, stats, runtimeResult) {
    const overallScore = Math.round(
        (localBreakdown.structure * 0.18) +
        (localBreakdown.functionality * 0.24) +
        (localBreakdown.uiUx * 0.2) +
        (localBreakdown.responsiveness * 0.16) +
        (localBreakdown.codeQuality * 0.22)
    );
    return {
        overallScore,
        breakdown: localBreakdown,
        summary: runtimeResult.success
            ? 'Project structure is solid and the runtime check succeeded.'
            : 'Project was analyzed successfully. Runtime verification was limited, so the score is based mostly on structure and source review.',
        strengths: [
            stats.hasIndexHtml ? 'Contains a clear frontend entry point.' : 'Project includes source files for frontend implementation.',
            stats.cssCount > 0 ? 'Uses dedicated styling files for presentation.' : 'JavaScript logic is present for interaction.',
            localBreakdown.responsiveness >= 60 ? 'Shows responsive design indicators.' : 'Folder structure is organized enough for review.',
        ].filter(Boolean),
        issues: [
            !runtimeResult.success ? 'Runtime verification could not be fully confirmed from the server environment.' : null,
            localBreakdown.responsiveness < 55 ? 'Responsive design evidence is limited.' : null,
            localBreakdown.codeQuality < 55 ? 'Code quality signals are inconsistent across files.' : null,
        ].filter(Boolean),
        recommendations: [
            'Add a concise README with setup and run instructions.',
            'Improve responsive handling for smaller screens and viewport states.',
            'Break large scripts into smaller reusable modules where possible.',
        ],
    };
}

async function generateAiFrontendReport({ cerebrasChat, test, stats, fileTree, snippets, localBreakdown, runtimeResult }) {
    if (!cerebrasChat) return fallbackAiReport(localBreakdown, stats, runtimeResult);

    const prompt = `You are a strict frontend evaluator for student project submissions.

Admin use case:
Title: ${test.title}
Description: ${test.description || 'N/A'}
Requirements:
${test.requirements || 'No explicit requirements provided'}

Detected project stats:
${JSON.stringify({
        framework: stats.framework,
        fileCount: stats.fileCount,
        htmlCount: stats.htmlCount,
        cssCount: stats.cssCount,
        jsCount: stats.jsCount,
        hasIndexHtml: stats.hasIndexHtml,
        hasPackageJson: stats.hasPackageJson,
        scripts: stats.scripts,
    }, null, 2)}

Local score hints:
${JSON.stringify(localBreakdown, null, 2)}

Runtime analysis:
${JSON.stringify(runtimeResult, null, 2)}

File tree:
${JSON.stringify(fileTree, null, 2)}

Important file snippets:
${JSON.stringify(snippets, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "overallScore": 0-100,
  "breakdown": {
    "structure": 0-100,
    "functionality": 0-100,
    "uiUx": 0-100,
    "responsiveness": 0-100,
    "codeQuality": 0-100
  },
  "summary": "2-4 sentence summary",
  "strengths": ["..."],
  "issues": ["..."],
  "recommendations": ["..."]
}`;

    try {
        const aiResp = await cerebrasChat([{ role: 'user', content: prompt }], {
            model: 'gpt-oss-120b',
            temperature: 0.2,
            max_tokens: 900,
        });
        const raw = (aiResp.choices?.[0]?.message?.content || '{}').replace(/```json\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(raw);
        return {
            overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore || 0))),
            breakdown: {
                structure: Math.max(0, Math.min(100, Math.round(parsed.breakdown?.structure || localBreakdown.structure))),
                functionality: Math.max(0, Math.min(100, Math.round(parsed.breakdown?.functionality || localBreakdown.functionality))),
                uiUx: Math.max(0, Math.min(100, Math.round(parsed.breakdown?.uiUx || localBreakdown.uiUx))),
                responsiveness: Math.max(0, Math.min(100, Math.round(parsed.breakdown?.responsiveness || localBreakdown.responsiveness))),
                codeQuality: Math.max(0, Math.min(100, Math.round(parsed.breakdown?.codeQuality || localBreakdown.codeQuality))),
            },
            summary: parsed.summary || '',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
            issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 6) : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6) : [],
        };
    } catch {
        return fallbackAiReport(localBreakdown, stats, runtimeResult);
    }
}

async function analyzeSubmission({ extractedRoot, test, cerebrasChat }) {
    const files = await collectProjectFiles(extractedRoot);
    let packageJson = null;
    const packageFile = files.find(file => /(^|\/)package\.json$/i.test(file.relPath));
    const htmlEntryFile = files.find(file => /(^|\/)index\.html?$/i.test(file.relPath));
    if (packageFile) {
        try {
            packageJson = JSON.parse(await fsp.readFile(packageFile.fullPath, 'utf8'));
        } catch {
            packageJson = null;
        }
    }
    const detectedProjectRoot = packageFile
        ? path.dirname(packageFile.fullPath)
        : htmlEntryFile
            ? path.dirname(htmlEntryFile.fullPath)
            : extractedRoot;

    const fileTree = await buildFileTree(extractedRoot);
    const snippets = await gatherSourceSnippets(extractedRoot, files);
    const snippetText = snippets.map(item => `${item.path}\n${item.content}`).join('\n\n');
    const stats = summarizeStats(files, packageJson);
    const localBreakdown = computeLocalBreakdown(stats, snippetText, test.requirements);
    const runtimeResult = await tryRuntimeEvaluation(detectedProjectRoot, packageJson, stats);
    const aiReport = await generateAiFrontendReport({ cerebrasChat, test, stats, fileTree, snippets, localBreakdown, runtimeResult });

    return {
        overallScore: aiReport.overallScore,
        breakdown: aiReport.breakdown,
        summary: aiReport.summary,
        strengths: aiReport.strengths,
        issues: aiReport.issues,
        recommendations: aiReport.recommendations,
        runtime: runtimeResult,
        stats,
        fileTree,
        snippets,
    };
}

async function writeUploadedFiles(baseDir, files, relativePaths) {
    const extractedDir = path.join(baseDir, 'project');
    await ensureDir(extractedDir);
    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const relativePath = String(relativePaths[index] || file.originalname || `file-${index}`).replace(/\\/g, '/');
        const safeParts = relativePath.split('/').filter(Boolean).map(sanitizeSegment);
        const targetPath = path.join(extractedDir, ...safeParts);
        await ensureDir(path.dirname(targetPath));
        await fsp.writeFile(targetPath, file.buffer);
    }
    return extractedDir;
}

function createUploadMiddleware() {
    return multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: MAX_UPLOAD_BYTES,
            files: 300,
        },
    });
}

module.exports = function frontendEvalRoutes(pool, authenticate, cerebrasChat) {
    const router = express.Router();
    const upload = createUploadMiddleware();

    router.get('/admin/frontend-evals/tests', authenticate, requireAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT t.*,
                       COUNT(DISTINCT a.student_id) AS assigned_count,
                       COUNT(DISTINCT s.id) AS submissions_count
                FROM frontend_eval_tests t
                LEFT JOIN frontend_eval_assignments a ON a.test_id = t.id
                LEFT JOIN frontend_eval_submissions s ON s.test_id = t.id
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `);
            res.json({ success: true, tests: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/admin/frontend-evals/tests', authenticate, requireAdmin, async (req, res) => {
        try {
            const id = uuidv4();
            const {
                title,
                description,
                requirements,
                attempt_limit,
            } = req.body;
            if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
            await pool.query(
                `INSERT INTO frontend_eval_tests
                 (id, title, description, requirements, status, attempt_limit, created_by)
                 VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
                [id, title, description || '', requirements || '', attempt_limit != null ? Number(attempt_limit) : null, String(req.user.id)]
            );
            res.json({ success: true, id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.put('/admin/frontend-evals/tests/:id', authenticate, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, requirements, attempt_limit } = req.body;
            await pool.query(
                `UPDATE frontend_eval_tests
                 SET title = ?, description = ?, requirements = ?, attempt_limit = ?
                 WHERE id = ?`,
                [title, description || '', requirements || '', attempt_limit != null ? Number(attempt_limit) : null, id]
            );
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.delete('/admin/frontend-evals/tests/:id', authenticate, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM frontend_eval_submissions WHERE test_id = ?', [id]);
            await pool.query('DELETE FROM frontend_eval_assignments WHERE test_id = ?', [id]);
            await pool.query('DELETE FROM frontend_eval_tests WHERE id = ?', [id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/admin/frontend-evals/tests/:id/go-live', authenticate, requireAdmin, async (req, res) => {
        try {
            await pool.query(`UPDATE frontend_eval_tests SET status = 'active', activated_at = NOW() WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/admin/frontend-evals/tests/:id/end', authenticate, requireAdmin, async (req, res) => {
        try {
            await pool.query(`UPDATE frontend_eval_tests SET status = 'ended', ended_at = NOW() WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.put('/admin/frontend-evals/tests/:id/assign', authenticate, requireAdmin, async (req, res) => {
        try {
            const { student_ids } = req.body;
            const { id } = req.params;
            if (!Array.isArray(student_ids)) {
                return res.status(400).json({ success: false, error: 'student_ids must be an array' });
            }
            await pool.query('DELETE FROM frontend_eval_assignments WHERE test_id = ?', [id]);
            if (student_ids.length) {
                const values = student_ids.map(studentId => [id, String(studentId)]);
                await pool.query(
                    'INSERT INTO frontend_eval_assignments (test_id, student_id) VALUES ?',
                    [values]
                );
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/admin/frontend-evals/tests/:id/assignments', authenticate, requireAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT student_id FROM frontend_eval_assignments WHERE test_id = ? ORDER BY assigned_at ASC',
                [req.params.id]
            );
            res.json({ success: true, student_ids: rows.map(row => String(row.student_id)) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/admin/frontend-evals/submissions', authenticate, requireAdmin, async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT s.id, s.test_id, s.student_id, s.submission_type, s.score, s.runtime_status,
                       s.runtime_summary, s.submitted_at, t.title AS test_title,
                       u.name AS student_name, u.email AS student_email
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                LEFT JOIN users u ON u.id = s.student_id
                ORDER BY s.submitted_at DESC
            `);
            res.json({ success: true, submissions: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/admin/frontend-evals/submissions/:id', authenticate, requireAdmin, async (req, res) => {
        try {
            const [[row]] = await pool.query(`
                SELECT s.*, t.title AS test_title, t.description AS test_description, t.requirements,
                       u.name AS student_name, u.email AS student_email
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                LEFT JOIN users u ON u.id = s.student_id
                WHERE s.id = ?
            `, [req.params.id]);
            if (!row) return res.status(404).json({ success: false, error: 'Submission not found' });
            row.report_json = safeJsonParse(row.report_json, {});
            row.breakdown_json = safeJsonParse(row.breakdown_json, {});
            row.file_tree_json = safeJsonParse(row.file_tree_json, []);
            res.json({ success: true, submission: row });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/frontend-evals/my-tests', authenticate, async (req, res) => {
        try {
            const studentId = String(req.user.id);
            const [rows] = await pool.query(`
                SELECT t.*,
                       COUNT(DISTINCT s.id) AS attempts_used
                FROM frontend_eval_tests t
                INNER JOIN frontend_eval_assignments a ON a.test_id = t.id AND a.student_id = ?
                LEFT JOIN frontend_eval_submissions s ON s.test_id = t.id AND s.student_id = ?
                WHERE t.status = 'active'
                GROUP BY t.id
                ORDER BY t.activated_at DESC, t.created_at DESC
            `, [studentId, studentId]);
            res.json({ success: true, tests: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/frontend-evals/my-submissions', authenticate, async (req, res) => {
        try {
            const studentId = String(req.user.id);
            const [rows] = await pool.query(`
                SELECT s.id, s.test_id, s.submission_type, s.score, s.runtime_status, s.runtime_summary, s.submitted_at,
                       t.title AS test_title
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.student_id = ?
                ORDER BY s.submitted_at DESC
            `, [studentId]);
            res.json({ success: true, submissions: rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/frontend-evals/submissions/:id', authenticate, async (req, res) => {
        try {
            const studentId = String(req.user.id);
            const [[row]] = await pool.query(`
                SELECT s.*, t.title AS test_title, t.description AS test_description, t.requirements
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.id = ? AND s.student_id = ?
            `, [req.params.id, studentId]);
            if (!row) return res.status(404).json({ success: false, error: 'Submission not found' });
            row.report_json = safeJsonParse(row.report_json, {});
            row.breakdown_json = safeJsonParse(row.breakdown_json, {});
            row.file_tree_json = safeJsonParse(row.file_tree_json, []);
            res.json({ success: true, submission: row });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/frontend-evals/tests/:id/submit', authenticate, upload.any(), async (req, res) => {
        let submissionRoot = null;
        try {
            const studentId = String(req.user.id);
            const testId = req.params.id;
            const [[test]] = await pool.query(`
                SELECT t.*
                FROM frontend_eval_tests t
                INNER JOIN frontend_eval_assignments a ON a.test_id = t.id AND a.student_id = ?
                WHERE t.id = ? AND t.status = 'active'
            `, [studentId, testId]);

            if (!test) {
                return res.status(404).json({ success: false, error: 'Active assigned frontend evaluation not found' });
            }

            const [[attemptRow]] = await pool.query(
                'SELECT COUNT(*) AS attempts FROM frontend_eval_submissions WHERE test_id = ? AND student_id = ?',
                [testId, studentId]
            );
            if (test.attempt_limit != null && Number(attemptRow.attempts) >= Number(test.attempt_limit)) {
                return res.status(400).json({ success: false, error: `Attempt limit reached (${test.attempt_limit})` });
            }

            const files = req.files || [];
            const submissionType = String(req.body.submissionType || '').toLowerCase();
            if (!files.length) {
                return res.status(400).json({ success: false, error: 'No files uploaded' });
            }
            if (!['zip', 'files'].includes(submissionType)) {
                return res.status(400).json({ success: false, error: 'submissionType must be zip or files' });
            }

            const submissionId = uuidv4();
            submissionRoot = path.join(API_UPLOAD_ROOT, submissionId);
            await ensureDir(submissionRoot);

            let extractedRoot;
            if (submissionType === 'zip') {
                const zipFile = files[0];
                const zipPath = path.join(submissionRoot, sanitizeSegment(zipFile.originalname || 'project.zip'));
                await fsp.writeFile(zipPath, zipFile.buffer);
                extractedRoot = path.join(submissionRoot, 'project');
                await expandZip(zipPath, extractedRoot);
            } else {
                let relativePaths = req.body.relativePaths || [];
                if (!Array.isArray(relativePaths)) relativePaths = [relativePaths];
                extractedRoot = await writeUploadedFiles(submissionRoot, files, relativePaths);
            }

            const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
            const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

            await pool.query(
                `INSERT INTO frontend_eval_submissions
                 (id, test_id, student_id, submission_type, original_name, stored_path, extracted_path,
                  score, runtime_status, runtime_summary, runtime_output, report_json, breakdown_json, file_tree_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    submissionId,
                    testId,
                    studentId,
                    submissionType,
                    files[0]?.originalname || 'project',
                    submissionRoot,
                    extractedRoot,
                    report.overallScore,
                    runtimeStatus,
                    report.runtime.summary || '',
                    report.runtime.output || '',
                    JSON.stringify(report),
                    JSON.stringify(report.breakdown),
                    JSON.stringify(report.fileTree),
                ]
            );

            res.json({
                success: true,
                submissionId,
                score: report.overallScore,
                report,
            });
        } catch (err) {
            console.error('[frontend-evals] submit error:', err);
            if (submissionRoot) {
                try { await fsp.rm(submissionRoot, { recursive: true, force: true }); } catch {}
            }
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
