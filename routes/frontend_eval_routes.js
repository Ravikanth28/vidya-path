const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { execFile } = require('child_process');
const { promisify } = require('util');
const unzipper = require('unzipper');

const execFileAsync = promisify(execFile);

const API_UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'frontend-evals');
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const RUNTIME_TIMEOUT_MS = 45000;

// Storage strategy: 'hybrid' (DB + local), 'database' (cloud-ready), 'local' (dev-only)
const STORAGE_STRATEGY = process.env.STORAGE_STRATEGY || 'hybrid';
const USE_DATABASE_STORAGE = ['hybrid', 'database'].includes(STORAGE_STRATEGY);

function safeJsonParse(value, fallback) {
    try {
        if (value == null || value === '') return fallback;
        if (typeof value === 'object') return value;
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

async function initializeStorageTable(pool) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submission_file_storage (
                submission_id VARCHAR(255) PRIMARY KEY,
                zip_content LONGBLOB NOT NULL,
                file_size INT NOT NULL,
                stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_submission_id (submission_id)
            )
        `);
        console.log('✅ File storage table ready');
    } catch (err) {
        console.error('⚠️ File storage table init:', err.message);
    }
}

async function saveZipToDatabase(pool, submissionId, zipBuffer) {
    if (!USE_DATABASE_STORAGE) return false;
    try {
        await pool.query(
            'INSERT INTO submission_file_storage (submission_id, zip_content, file_size) VALUES (?, ?, ?)',
            [submissionId, zipBuffer, zipBuffer.length]
        );
        return true;
    } catch (err) {
        console.error(`Failed to save ZIP to database: ${err.message}`);
        return false;
    }
}

async function getZipFromDatabase(pool, submissionId) {
    if (!USE_DATABASE_STORAGE) return null;
    try {
        const [[row]] = await pool.query(
            'SELECT zip_content FROM submission_file_storage WHERE submission_id = ?',
            [submissionId]
        );
        return row?.zip_content || null;
    } catch {
        return null;
    }
}

async function deleteZipFromDatabase(pool, submissionId) {
    if (!USE_DATABASE_STORAGE) return;
    try {
        await pool.query('DELETE FROM submission_file_storage WHERE submission_id = ?', [submissionId]);
    } catch (err) {
        console.error(`Failed to delete from storage table: ${err.message}`);
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

async function readFileFromZip(zipPath, filePath) {
    try {
        return await new Promise((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Parse())
                .on('entry', (entry) => {
                    const entryPath = entry.path.replace(/\\/g, '/');
                    if (entryPath === filePath || entryPath.endsWith('/' + filePath) || (entryPath.startsWith('project/') && entryPath.substring(8) === filePath)) {
                        let data = '';
                        entry.on('data', chunk => data += chunk.toString('utf8'));
                        entry.on('end', () => resolve(data));
                    } else {
                        entry.autodrain();
                    }
                })
                .on('error', reject);
        });
    } catch (err) {
        throw new Error(`Failed to read from ZIP: ${err.message}`);
    }
}

async function readFileFromZipBuffer(zipBuffer, filePath) {
    try {
        const { Readable } = require('stream');
        return await new Promise((resolve, reject) => {
            const stream = Readable.from(zipBuffer);
            stream
                .pipe(unzipper.Parse())
                .on('entry', (entry) => {
                    const entryPath = entry.path.replace(/\\/g, '/');
                    if (entryPath === filePath || entryPath.endsWith('/' + filePath) || (entryPath.startsWith('project/') && entryPath.substring(8) === filePath)) {
                        let data = '';
                        entry.on('data', chunk => data += chunk.toString('utf8'));
                        entry.on('end', () => resolve(data));
                    } else {
                        entry.autodrain();
                    }
                })
                .on('error', reject);
        });
    } catch (err) {
        throw new Error(`Failed to read from ZIP buffer: ${err.message}`);
    }
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

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractRequirementLines(requirementsText) {
    return String(requirementsText || '')
        .split(/\n+/)
        .map(line => line.replace(/^[-*\d.)\s]+/, '').trim())
        .filter(Boolean)
        .filter(line => line.length >= 6);
}

function requirementCoverageScore(sourceText, requirementsText, rubricWeights = {}) {
    const normalizedSource = normalizeText(sourceText);
    const lines = extractRequirementLines(requirementsText);
    if (!lines.length) return { score: 0, matchedCount: 0, totalCount: 0, mustScore: 100, niceScore: 100, missing: [] };

    let mustHit = 0, mustTotal = 0, niceHit = 0, niceTotal = 0;
    const missing = [];

    for (const line of lines) {
        const weight = rubricWeights[line] === 'nice' ? 'nice' : 'must';
        const normalizedLine = normalizeText(line);
        const tokens = normalizedLine.split(' ').filter(token => token.length >= 4);
        let matched = false;
        if (tokens.length) {
            const hits = tokens.filter(token => normalizedSource.includes(token)).length;
            matched = hits / tokens.length >= 0.5 || normalizedSource.includes(normalizedLine.slice(0, Math.min(normalizedLine.length, 24)));
        }
        if (matched) {
            if (weight === 'must') mustHit++; else niceHit++;
        } else {
            missing.push({ text: line, weight });
        }
        if (weight === 'must') mustTotal++; else niceTotal++;
    }

    const mustScore = mustTotal ? Math.round((mustHit / mustTotal) * 100) : 100;
    const niceScore = niceTotal ? Math.round((niceHit / niceTotal) * 100) : 100;
    const score = Math.round(mustScore * 0.75 + niceScore * 0.25);
    const matchedCount = mustHit + niceHit;
    const totalCount = lines.length;
    return { score, matchedCount, totalCount, mustScore, niceScore, missing };
}

function applyRequirementPenalty(score, coverage) {
    if (!coverage || !coverage.totalCount) return Math.max(0, Math.round(score));

    let nextScore = Number(score || 0);
    const mustScore = coverage.mustScore ?? coverage.score ?? 0;
    const totalScore = coverage.score ?? 0;
    const mustMissing = Array.isArray(coverage.missing)
        ? coverage.missing.filter(item => item.weight !== 'nice').length
        : 0;
    const totalMissing = Array.isArray(coverage.missing) ? coverage.missing.length : 0;
    const requirementCount = coverage.totalCount || 1;

    // Harsh penalties for missing requirements
    if (mustMissing >= 1) nextScore = Math.min(nextScore, 45);
    if (mustMissing >= 2) nextScore = Math.min(nextScore, 30);
    if (mustMissing >= 3) nextScore = Math.min(nextScore, 15);
    if (mustMissing >= 4 || mustMissing >= requirementCount * 0.5) nextScore = Math.min(nextScore, 5);

    // Additional penalties based on coverage percentage
    if (mustScore < 70) nextScore -= 12;
    if (mustScore < 50) nextScore -= 20;
    if (mustScore < 30) nextScore -= 30;
    if (totalScore < 50) nextScore -= 15;
    if (totalScore < 30) nextScore -= 25;

    // Penalty for high missing ratio
    const missingRatio = totalMissing / requirementCount;
    if (missingRatio > 0.7) nextScore -= 35;
    else if (missingRatio > 0.5) nextScore -= 25;
    else if (missingRatio > 0.3) nextScore -= 15;

    return Math.max(0, Math.round(nextScore));
}

function runStaticLintChecks(snippets) {
    const htmlIssues = [];
    const cssWarnings = [];
    const jsWarnings = [];

    for (const snippet of snippets) {
        const content = snippet.content || '';
        const ext = String(snippet.path || '').split('.').pop().toLowerCase();

        if (ext === 'html' || ext === 'htm') {
            if (!content.match(/<!doctype/i)) {
                htmlIssues.push(`${snippet.path}: Missing <!DOCTYPE html> declaration`);
            }
            if (!content.match(/<html[^>]*lang=/i)) {
                htmlIssues.push(`${snippet.path}: Missing lang attribute on <html> (accessibility)`);
            }
            const inlineStyleCount = (content.match(/\bstyle\s*=/gi) || []).length;
            if (inlineStyleCount > 5) {
                htmlIssues.push(`${snippet.path}: ${inlineStyleCount} inline style attributes (consider CSS classes)`);
            }
            if (content.match(/<(font|center|marquee|blink)\b/i)) {
                htmlIssues.push(`${snippet.path}: Deprecated HTML tags detected`);
            }
            if (!content.match(/<meta[^>]*charset/i)) {
                htmlIssues.push(`${snippet.path}: Missing charset meta tag`);
            }
        }

        if (ext === 'css') {
            const importantCount = (content.match(/!important/g) || []).length;
            if (importantCount > 3) {
                cssWarnings.push(`${snippet.path}: ${importantCount} !important overrides (specificity concern)`);
            }
        }

        if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
            if (content.includes('eval(')) {
                jsWarnings.push(`${snippet.path}: eval() usage detected (security risk)`);
            }
            const varCount = (content.match(/\bvar\b/g) || []).length;
            if (varCount > 3) {
                jsWarnings.push(`${snippet.path}: ${varCount} var declarations (prefer const/let)`);
            }
            const looseEqCount = (content.match(/[^!=<>]==[^=]/g) || []).length;
            if (looseEqCount > 3) {
                jsWarnings.push(`${snippet.path}: ${looseEqCount} loose equality checks (use === instead)`);
            }
            const consoleCount = (content.match(/console\.log\(/g) || []).length;
            if (consoleCount > 5) {
                jsWarnings.push(`${snippet.path}: ${consoleCount} console.log statements (remove for production)`);
            }
            if (content.includes('document.write(')) {
                jsWarnings.push(`${snippet.path}: document.write() usage detected`);
            }
        }
    }

    const totalIssues = htmlIssues.length + cssWarnings.length + jsWarnings.length;
    const lintScore = Math.max(10, 100 - totalIssues * 10);
    return { htmlIssues, cssWarnings, jsWarnings, totalIssues, lintScore };
}

function computeConfidenceScore({ aiUsed, runtimeResult, lintResults, stats, coverage }) {
    let score = 0;
    if (stats.hasIndexHtml || stats.hasPackageJson) score += 8;
    if (stats.fileCount >= 3) score += 5;
    if (stats.fileCount >= 8) score += 3;
    if (aiUsed) score += 18; else score += 5;
    if (runtimeResult.attempted && runtimeResult.success) score += 18;
    else if (runtimeResult.success) score += 10;
    else if (runtimeResult.attempted) score += 3;
    if (Array.isArray(runtimeResult.smokeTests) && runtimeResult.smokeTests.length) {
        const passed = runtimeResult.smokeTests.filter(t => t.success).length;
        score += Math.min(12, passed * 6);
    }
    if (coverage && coverage.totalCount > 0) {
        // Lower confidence if coverage is poor
        if (coverage.score < 50) score -= 15;
        else if (coverage.score < 70) score -= 8;
        score += Math.round(coverage.score * 0.08);
    }
    if (lintResults) {
        score = Math.max(0, score + (5 - lintResults.totalIssues));
    }
    return Math.min(100, Math.max(0, Math.round(score)));
}

function computeLocalBreakdown(stats, sourceText, requirementsText, rubricWeights = {}) {
    const joined = sourceText.toLowerCase();
    const mediaQueries = (joined.match(/@media/g) || []).length;
    const semanticTags = (joined.match(/<(header|main|section|nav|footer|article|aside)\b/g) || []).length;
    const eventHandlers = (joined.match(/addEventListener|\bonclick=|\bonsubmit=|\bfetch\(|axios\.|XMLHttpRequest/g) || []).length;
    const comments = (joined.match(/\/\*|\/\/|<!--/g) || []).length;
    const coverage = requirementCoverageScore(sourceText, requirementsText, rubricWeights);

    const structure = Math.min(100, 24
        + (stats.hasIndexHtml ? 18 : 0)
        + (stats.hasPackageJson ? 8 : 0)
        + Math.min(stats.cssCount * 5, 14)
        + Math.min(stats.jsCount * 5, 14)
        + Math.round(coverage.score * 0.05));

    const functionality = Math.min(100, 12
        + (stats.hasIndexHtml || stats.hasPackageJson ? 8 : 0)
        + Math.min(eventHandlers * 7, 22)
        + Math.round(coverage.score * 0.6));

    const uiUx = Math.min(100, 18
        + Math.min(stats.cssCount * 8, 18)
        + Math.min(semanticTags * 6, 18)
        + (joined.includes('aria-') ? 8 : 0)
        + Math.round(coverage.score * 0.18));

    const responsiveness = Math.min(100, 20
        + Math.min(mediaQueries * 18, 45)
        + (joined.includes('viewport') ? 15 : 0)
        + (joined.includes('flex') || joined.includes('grid') ? 12 : 0));

    const codeQuality = Math.min(100, 20
        + Math.min(comments * 4, 12)
        + Math.min(stats.jsCount * 7, 18)
        + (joined.includes('const ') || joined.includes('let ') ? 12 : 0)
        + (joined.includes('async ') || joined.includes('await ') ? 8 : 0)
        + (stats.fileCount > 8 ? 6 : 0));

    // Severe penalty for very poor coverage
    if (coverage.totalCount >= 3 && (coverage.mustScore ?? coverage.score) < 40) {
        return {
            structure: Math.max(5, structure - 30),
            functionality: Math.max(5, functionality - 40),
            uiUx: Math.max(5, uiUx - 25),
            responsiveness: Math.max(5, responsiveness - 20),
            codeQuality: Math.max(5, codeQuality - 25),
            coverage,
        };
    }

    // Moderate penalty for poor coverage
    if (coverage.totalCount >= 1 && (coverage.mustScore ?? coverage.score) < 70) {
        return {
            structure: Math.max(10, structure - 20),
            functionality: Math.max(10, functionality - 30),
            uiUx: Math.max(10, uiUx - 15),
            responsiveness: Math.max(10, responsiveness - 10),
            codeQuality: Math.max(10, codeQuality - 15),
            coverage,
        };
    }

    return {
        structure,
        functionality,
        uiUx,
        responsiveness,
        codeQuality,
        coverage,
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

    const candidateScripts = ['build', 'test', 'lint'].filter(name => scripts[name]);
    const smokeTests = [];
    if (!candidateScripts.length || !hasNodeModules) {
        result.summary = result.summary || 'package.json found, but runtime execution was skipped because dependencies are not installed or no recognized scripts are available.';
        result.smokeTests = smokeTests;
        return result;
    }

    result.attempted = true;
    const scriptsToTry = candidateScripts.slice(0, 2);
    for (const scriptName of scriptsToTry) {
        const smokeStart = Date.now();
        try {
            const { stdout, stderr } = await execFileAsync(npmBin, ['run', scriptName], {
                cwd: projectRoot,
                timeout: RUNTIME_TIMEOUT_MS,
                windowsHide: true,
                maxBuffer: 1024 * 1024,
            });
            const duration = Date.now() - smokeStart;
            smokeTests.push({ script: scriptName, success: true, duration, output: trimContent((stdout || '') + (stderr || ''), 600) });
            if (!result.success) {
                result.success = true;
                result.output = trimContent((stdout || '') + '\n' + (stderr || ''), 2500);
            }
        } catch (error) {
            const duration = Date.now() - smokeStart;
            smokeTests.push({ script: scriptName, success: false, duration, output: trimContent(`${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`, 600) });
            if (!result.output) {
                result.output = trimContent(`${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`, 2500);
            }
        }
    }
    result.smokeTests = smokeTests;
    const anySuccess = smokeTests.some(t => t.success);
    const scriptNames = smokeTests.map(t => `\`npm run ${t.script}\``).join(', ');
    if (anySuccess) {
        result.summary = `Smoke-run checks passed for ${scriptNames}.`;
    } else {
        result.summary = `Smoke-run checks were attempted (${scriptNames}) but encountered errors.`;
    }
    return result;
}

function fallbackAiReport(localBreakdown, stats, runtimeResult) {
    const rawOverallScore = Math.round(
        (localBreakdown.structure * 0.18) +
        (localBreakdown.functionality * 0.3) +
        (localBreakdown.uiUx * 0.18) +
        (localBreakdown.responsiveness * 0.16) +
        (localBreakdown.codeQuality * 0.18)
    );
    const coverage = localBreakdown.coverage || { score: 0, matchedCount: 0, totalCount: 0, missing: [] };
    const overallScore = applyRequirementPenalty(rawOverallScore, coverage);
    const coverageLine = coverage.totalCount
        ? `Requirement coverage: ${coverage.matchedCount}/${coverage.totalCount} (${coverage.score}%).`
        : 'Requirement coverage was not measurable from the prompt content.';

    return {
        overallScore: Math.max(0, overallScore),
        breakdown: {
            structure: Math.max(0, Math.round(localBreakdown.structure)),
            functionality: Math.max(0, Math.round(localBreakdown.functionality)),
            uiUx: Math.max(0, Math.round(localBreakdown.uiUx)),
            responsiveness: Math.max(0, Math.round(localBreakdown.responsiveness)),
            codeQuality: Math.max(0, Math.round(localBreakdown.codeQuality)),
        },
        summary: runtimeResult.success
            ? `Project structure is solid and the runtime check succeeded. ${coverageLine}`
            : `Project was analyzed successfully. Runtime verification was limited, so the score is based mostly on structure and source review. ${coverageLine}`,
        strengths: [
            stats.hasIndexHtml ? 'Contains a clear frontend entry point.' : 'Project includes source files for frontend implementation.',
            stats.cssCount > 0 ? 'Uses dedicated styling files for presentation.' : 'JavaScript logic is present for interaction.',
            localBreakdown.responsiveness >= 60 ? 'Shows responsive design indicators.' : 'Folder structure is organized enough for review.',
            coverage.score >= 70 ? 'Most requested features appear to be represented in the source.' : null,
        ].filter(Boolean),
        issues: [
            !runtimeResult.success ? 'Runtime verification could not be fully confirmed from the server environment.' : null,
            localBreakdown.responsiveness < 55 ? 'Responsive design evidence is limited.' : null,
            localBreakdown.codeQuality < 55 ? 'Code quality signals are inconsistent across files.' : null,
            coverage.totalCount > 0 && coverage.score < 60 ? 'Several requested features seem missing or only partially implemented.' : null,
            overallScore < 40 ? 'Submission quality is below acceptable standards - many requirements not met.' : null,
        ].filter(Boolean),
        recommendations: [
            'Add a concise README with setup and run instructions.',
            'Improve responsive handling for smaller screens and viewport states.',
            'Break large scripts into smaller reusable modules where possible.',
            ...(coverage.missing || []).slice(0, 3).map(item => `Implement requirement clearly: ${typeof item === 'string' ? item : item.text}`),
        ],
    };
}

async function generateAiFrontendReport({ cerebrasChat, test, stats, fileTree, snippets, localBreakdown, runtimeResult, rubricWeights = {} }) {
    if (!cerebrasChat) return fallbackAiReport(localBreakdown, stats, runtimeResult);

    const prompt = `You are a very strict frontend evaluator for student project submissions.

Admin use case:
Title: ${test.title}
Description: ${test.description || 'N/A'}
Requirements (with rubric weights – must = high priority, nice = lower priority):
${test.requirements || 'No explicit requirements provided'}

Rubric weights:
${Object.keys(rubricWeights).length ? JSON.stringify(rubricWeights) : 'All requirements are must-have (no weights configured)'}

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

Scoring rules you MUST follow:
1. Requirements are the highest priority. Missing must-have requirements must sharply reduce the score.
2. A project that misses multiple must-have requirements must NOT receive a passing-looking score just because the UI looks polished or files exist.
3. If one must-have requirement is clearly missing, overallScore should usually stay below 60.
4. If two or more must-have requirements are missing or only weakly evidenced, overallScore should usually stay below 50.
5. If the submission is mostly boilerplate, incomplete, or generic without satisfying the requested use case, score it harshly.
6. Do not reward folder structure, package.json, or superficial styling unless the requested features are actually implemented.
7. The breakdown should reflect real implementation, not assumptions.
8. Call out missing requirements explicitly in issues and recommendations.

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
        const penalizedScore = applyRequirementPenalty(Math.round(parsed.overallScore || 0), localBreakdown.coverage);
        return {
            overallScore: Math.max(0, Math.min(100, penalizedScore)),
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
    const rubricWeights = safeJsonParse(test.rubric_json, {});
    const localBreakdown = computeLocalBreakdown(stats, snippetText, test.requirements, rubricWeights);
    const lintResults = runStaticLintChecks(snippets);
    const runtimeResult = await tryRuntimeEvaluation(detectedProjectRoot, packageJson, stats);
    const aiUsed = Boolean(cerebrasChat);
    const aiReport = await generateAiFrontendReport({ cerebrasChat, test, stats, fileTree, snippets, localBreakdown, runtimeResult, rubricWeights });
    const confidenceScore = computeConfidenceScore({ aiUsed, runtimeResult, lintResults, stats, coverage: localBreakdown.coverage });
    const smokeTests = Array.isArray(runtimeResult.smokeTests) ? runtimeResult.smokeTests : [];
    const validationSignals = {
        aiUsed,
        lintScore: lintResults.lintScore,
        lintIssues: lintResults.totalIssues,
        smokePassed: smokeTests.filter(test => test.success).length,
        smokeTotal: smokeTests.length,
        runtimeAttempted: Boolean(runtimeResult.attempted),
        runtimeSuccess: Boolean(runtimeResult.success),
    };

    return {
        overallScore: aiReport.overallScore,
        breakdown: aiReport.breakdown,
        summary: aiReport.summary,
        strengths: aiReport.strengths,
        issues: aiReport.issues,
        recommendations: aiReport.recommendations,
        coverage: localBreakdown.coverage,
        rubricWeights,
        validationSignals,
        runtime: runtimeResult,
        lintResults,
        confidenceScore,
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
    // Auto-migrate new columns and initialize storage (safe – errors ignored if already exists)
    Promise.all([
        pool.query('ALTER TABLE frontend_eval_tests ADD COLUMN rubric_json TEXT DEFAULT NULL').catch(() => {}),
        pool.query('ALTER TABLE frontend_eval_submissions ADD COLUMN lint_results TEXT DEFAULT NULL').catch(() => {}),
        pool.query('ALTER TABLE frontend_eval_submissions ADD COLUMN confidence_score INT DEFAULT NULL').catch(() => {}),
        initializeStorageTable(pool),
    ]).catch(() => {});

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
                rubric_json,
            } = req.body;
            if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
            await pool.query(
                `INSERT INTO frontend_eval_tests
                 (id, title, description, requirements, status, attempt_limit, created_by, rubric_json)
                 VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
                [id, title, description || '', requirements || '', attempt_limit != null ? Number(attempt_limit) : null, String(req.user.id), rubric_json != null ? JSON.stringify(rubric_json) : null]
            );
            res.json({ success: true, id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.put('/admin/frontend-evals/tests/:id', authenticate, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, requirements, attempt_limit, rubric_json } = req.body;
            await pool.query(
                `UPDATE frontend_eval_tests
                 SET title = ?, description = ?, requirements = ?, attempt_limit = ?, rubric_json = ?
                 WHERE id = ?`,
                [title, description || '', requirements || '', attempt_limit != null ? Number(attempt_limit) : null, rubric_json != null ? JSON.stringify(rubric_json) : null, id]
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
            row.lint_results = safeJsonParse(row.lint_results, null);
            res.json({ success: true, submission: row });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.delete('/admin/frontend-evals/submissions/:id', authenticate, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const [[row]] = await pool.query('SELECT stored_path FROM frontend_eval_submissions WHERE id = ?', [id]);
            if (!row) return res.status(404).json({ success: false, error: 'Submission not found' });
            
            await pool.query('DELETE FROM frontend_eval_submissions WHERE id = ?', [id]);
            
            // Delete from database storage if enabled
            await deleteZipFromDatabase(pool, id);
            
            // Delete local files
            if (row.stored_path) {
                try { await fsp.rm(row.stored_path, { recursive: true, force: true }); } catch {}
            }
            
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/admin/frontend-evals/submissions/:id/file', authenticate, requireAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { filePath } = req.query;
            
            if (!filePath) return res.status(400).json({ success: false, error: 'File path is required' });
            
            const [[row]] = await pool.query('SELECT stored_path, extracted_path, submission_type FROM frontend_eval_submissions WHERE id = ?', [id]);
            if (!row) return res.status(404).json({ success: false, error: 'Submission not found' });
            
            const sanitizedPath = String(filePath).replace(/\.\./g, '').replace(/[<>:"|?*\x00-\x1F]/g, '');
            let content;
            
            // For individual files submission, read directly from extracted_path
            if (row.submission_type === 'files' || !row.submission_type) {
                const fullPath = path.resolve(path.join(row.extracted_path, sanitizedPath));
                const basePath = path.resolve(row.extracted_path);
                
                if (!fullPath.startsWith(basePath)) {
                    return res.status(403).json({ success: false, error: 'Access denied' });
                }
                
                if (!fs.existsSync(fullPath)) {
                    return res.status(404).json({ success: false, error: 'File not found' });
                }
                
                content = await fsp.readFile(fullPath, 'utf8');
            } 
            // For ZIP submission, try database first, then ZIP file, then extracted files
            else if (row.submission_type === 'zip') {
                let zipBuffer = null;
                
                // Try database first (handles hosted/cloud scenarios)
                try {
                    zipBuffer = await getZipFromDatabase(pool, id);
                    if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
                        content = await readFileFromZipBuffer(zipBuffer, sanitizedPath);
                    }
                } catch (dbErr) {
                    console.log(`Database read fallback: ${dbErr.message}`);
                }
                
                // If database failed, try local ZIP file
                if (!content) {
                    const zipPath = path.join(row.stored_path, 'project.zip');
                    try {
                        if (fs.existsSync(zipPath)) {
                            content = await readFileFromZip(zipPath, sanitizedPath);
                        }
                    } catch (zipErr) {
                        // Fallback to extracted files
                        console.log(`ZIP read fallback: ${zipErr.message}`);
                    }
                }
                
                // Final fallback: extracted files
                if (!content) {
                    const fullPath = path.resolve(path.join(row.extracted_path, sanitizedPath));
                    const basePath = path.resolve(row.extracted_path);
                    
                    if (!fullPath.startsWith(basePath)) {
                        return res.status(403).json({ success: false, error: 'Access denied' });
                    }
                    
                    if (!fs.existsSync(fullPath)) {
                        return res.status(404).json({ success: false, error: 'File not found' });
                    }
                    
                    content = await fsp.readFile(fullPath, 'utf8');
                }
            }
            
            res.json({ success: true, content });
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
            row.lint_results = safeJsonParse(row.lint_results, null);
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
                
                // Also save to database for cloud hosting
                const savedToDb = await saveZipToDatabase(pool, submissionId, zipFile.buffer);
                if (savedToDb) {
                    console.log(`✅ ZIP saved to database for submission ${submissionId}`);
                }
                
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
                  score, runtime_status, runtime_summary, runtime_output, report_json, breakdown_json, file_tree_json, lint_results, confidence_score)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    JSON.stringify(report.lintResults || {}),
                    report.confidenceScore || 0,
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
