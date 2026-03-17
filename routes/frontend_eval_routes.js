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
const archiver = require('archiver');

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

async function createZipFromDirectory(dirPath) {
    const filePairs = [];
    async function walk(dir, prefix) {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
            const full = path.join(dir, e.name);
            const arc = prefix ? `${prefix}/${e.name}` : e.name;
            if (e.isDirectory()) await walk(full, arc);
            else filePairs.push({ full, arc });
        }
    }
    await walk(dirPath, '');
    return new Promise((resolve, reject) => {
        const chunks = [];
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('data', chunk => chunks.push(chunk));
        archive.on('error', reject);
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        for (const { full, arc } of filePairs) archive.file(full, { name: arc });
        archive.finalize();
    });
}

async function createZipFromCodeEditorFiles(codeFiles) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('data', chunk => chunks.push(chunk));
        archive.on('error', err => reject(err));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        
        // Add each code file to the archive
        for (const codeFile of codeFiles) {
            const fileName = sanitizeSegment(codeFile.name || 'file.txt');
            archive.append(Buffer.from(codeFile.content || '', 'utf8'), { name: fileName });
        }
        
        archive.finalize();
    });
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

function getExistingSubmissionProjectRoot(row) {
    const existingExtracted = row.extracted_path ? path.resolve(row.extracted_path) : null;
    if (existingExtracted && fs.existsSync(existingExtracted)) {
        return existingExtracted;
    }

    if (row.stored_path) {
        const projectFromStoredPath = path.resolve(path.join(row.stored_path, 'project'));
        if (fs.existsSync(projectFromStoredPath)) {
            return projectFromStoredPath;
        }
    }

    const localByIdPath = path.join(API_UPLOAD_ROOT, String(row.id || ''), 'project');
    if (fs.existsSync(localByIdPath)) {
        return localByIdPath;
    }

    return null;
}

async function hasSubmissionReplaySource(pool, row) {
    if (getExistingSubmissionProjectRoot(row)) {
        return true;
    }

    const zipBuffer = await getZipFromDatabase(pool, row.id);
    if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
        return true;
    }

    if (row.stored_path && fs.existsSync(row.stored_path)) {
        try {
            const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
            return entries.some(entry => entry.isFile() && /\.zip$/i.test(entry.name));
        } catch {
            return false;
        }
    }

    return false;
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

async function readSubmissionFileContent(pool, submissionId, row, sanitizedPath) {
    const basePath = row.extracted_path ? path.resolve(row.extracted_path) : null;

    if (basePath) {
        const fullPath = path.resolve(path.join(basePath, sanitizedPath));
        if (!fullPath.startsWith(basePath)) {
            const err = new Error('Access denied');
            err.statusCode = 403;
            throw err;
        }
        if (fs.existsSync(fullPath)) {
            return await fsp.readFile(fullPath, 'utf8');
        }
    }

    try {
        const zipBuffer = await getZipFromDatabase(pool, submissionId);
        if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
            return await readFileFromZipBuffer(zipBuffer, sanitizedPath);
        }
    } catch (dbErr) {
        console.log(`Database file read fallback: ${dbErr.message}`);
    }

    if (row.stored_path && fs.existsSync(row.stored_path)) {
        try {
            const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
            const zipEntry = entries.find(entry => entry.isFile() && /\.zip$/i.test(entry.name));
            if (zipEntry) {
                return await readFileFromZip(path.join(row.stored_path, zipEntry.name), sanitizedPath);
            }
        } catch (zipErr) {
            console.log(`Stored ZIP read fallback: ${zipErr.message}`);
        }
    }

    const err = new Error('File not found');
    err.statusCode = 404;
    throw err;
}

async function extractZipBuffer(zipBuffer, destinationPath) {
    const { Readable } = require('stream');
    await ensureDir(destinationPath);
    await new Promise((resolve, reject) => {
        Readable.from(zipBuffer)
            .pipe(unzipper.Extract({ path: destinationPath }))
            .on('close', resolve)
            .on('error', reject);
    });
}

async function gatherSourceSnippets(rootDir, files) {
    const interestingFiles = files.filter(file => /\.(html?|css|js|jsx|ts|tsx|json|md)$/i.test(file.relPath));
    const htmlFiles = interestingFiles.filter(file => /\.html?$/i.test(file.relPath)).slice(0, 6);
    const cssFiles = interestingFiles.filter(file => /\.css$/i.test(file.relPath)).slice(0, 5);
    const jsFiles = interestingFiles.filter(file => /\.(js|jsx|ts|tsx)$/i.test(file.relPath)).slice(0, 5);
    const selectedPaths = new Set([...htmlFiles, ...cssFiles, ...jsFiles].map(file => file.relPath));
    const remainingFiles = interestingFiles.filter(file => !selectedPaths.has(file.relPath));
    const interesting = [...htmlFiles, ...cssFiles, ...jsFiles, ...remainingFiles].slice(0, 16);
    const totalInterestingSize = interesting.reduce((sum, file) => sum + Number(file.size || 0), 0);
    const useExtendedSnippets = interesting.length <= 5 && totalInterestingSize <= 120 * 1024;
    const snippetCharLimit = useExtendedSnippets ? 12000 : 1800;
    const snippets = [];
    for (const file of interesting) {
        try {
            const raw = await fsp.readFile(file.fullPath, 'utf8');
            snippets.push({
                path: file.relPath,
                content: trimContent(raw, snippetCharLimit),
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

function inferRequirementProfile(requirementsText) {
    const text = normalizeText(requirementsText);
    return {
        expectsResponsive: /responsive|mobile|media query|breakpoint|viewport/.test(text),
        expectsJs: /javascript|\bjs\b|dom|event|interaction|dynamic|validation|fetch|api call|localstorage|sessionstorage/.test(text),
        expectsCss: /css|style|ui|ux|layout|typography|color|animation|transition|hover|flex|grid/.test(text),
        expectsFramework: /react|vue|angular|next\.?js|component/.test(text),
        expectsApi: /api|fetch|axios|endpoint|json/.test(text),
        expectsForms: /form|input|submit|validation/.test(text),
    };
}

function countPattern(raw, pattern) {
    return (raw.match(pattern) || []).length;
}

function requirementPatternMatch(requirementLine, sourceText, normalizedSource) {
    const line = normalizeText(requirementLine);
    const raw = String(sourceText || '');

    const hasColorEvidence =
        /\b(bgcolor|text|link|vlink|alink)\s*=/i.test(raw) ||
        /\b(color|background-color)\s*:/i.test(raw) ||
        /style\s*=\s*["'][^"']*\b(color|background-color)\s*:/i.test(raw);

    if (/(?:apply|use|add|include|set)\s+(?:html\s+)?colou?rs?\b|\b(?:text|font|background)\s+colou?rs?\b/.test(line)) {
        return hasColorEvidence;
    }

    if (/\bstyle|styling|css\b/.test(line)) {
        const hasStylingEvidence =
            /<style\b/i.test(raw) ||
            /\bclass\s*=/i.test(raw) ||
            /\.css\b/i.test(raw) ||
            /\b(color|background|margin|padding|border|font|display|flex|grid)\s*:/i.test(raw);
        if (hasStylingEvidence) return true;
    }

    if (/html document structure|proper html/.test(line)) {
        return /<!doctype\s+html>/i.test(raw) && /<html\b/i.test(raw) && /<head\b/i.test(raw) && /<body\b/i.test(raw);
    }
    if (/at least\s*\d+\s*headings?|\bheadings?\b/.test(line)) {
        const required = Number((line.match(/at least\s*(\d+)/) || [])[1] || 1);
        const headingCount = (raw.match(/<h[1-6]\b/gi) || []).length;
        return headingCount >= required;
    }
    if (/\bparagraphs?\b/.test(line)) {
        const required = Number((line.match(/(?:at least|write)\s*(\d+)/) || [])[1] || 1);
        const pCount = (raw.match(/<p\b/gi) || []).length;
        return pCount >= required;
    }
    if (/bold|italic|underline/.test(line)) {
        const hasBold = /<b\b|<strong\b/i.test(raw) || normalizedSource.includes('font-weight') || normalizedSource.includes('bold');
        const hasItalic = /<i\b|<em\b/i.test(raw) || normalizedSource.includes('font-style') || normalizedSource.includes('italic');
        const hasUnderline = /<u\b/i.test(raw) || normalizedSource.includes('text-decoration') || normalizedSource.includes('underline');
        return hasBold && hasItalic && hasUnderline;
    }
    if (/horizontal rule|line breaks?|\bhr\b|\bbr\b/.test(line)) {
        return /<hr\b/i.test(raw) && /<br\b/i.test(raw);
    }

    const countMatch = line.match(/(?:at least|minimum(?:\s+of)?|add|create|build|include|use)\s*(\d+)/i);
    if (countMatch) {
        const required = Number(countMatch[1] || 0);
        const countMatchers = [
            { key: /headings?|titles?/, pattern: /<h[1-6]\b/gi },
            { key: /paragraphs?/, pattern: /<p\b/gi },
            { key: /sections?/, pattern: /<section\b/gi },
            { key: /buttons?/, pattern: /<button\b/gi },
            { key: /inputs?|fields?|textbox|textarea|select/, pattern: /<(input|textarea|select)\b/gi },
            { key: /images?|photos?/, pattern: /<img\b/gi },
            { key: /links?|anchors?/, pattern: /<a\b/gi },
            { key: /list items?|bullets?/, pattern: /<li\b/gi },
            { key: /cards?/, pattern: /class\s*=\s*["'][^"']*card/gi },
        ];
        for (const matcher of countMatchers) {
            if (matcher.key.test(line)) {
                return countPattern(raw, matcher.pattern) >= required;
            }
        }
    }

    const featureMatchers = [
        { key: /navigation|navbar|menu/, test: /<nav\b|class\s*=\s*["'][^"']*(nav|navbar|menu)/i },
        { key: /footer/, test: /<footer\b/i },
        { key: /header/, test: /<header\b/i },
        { key: /form|validation/, test: /<form\b|required\b|pattern\s*=|checkvalidity\(/i },
        { key: /table/, test: /<table\b/i },
        { key: /flexbox|flex layout|display flex/, test: /display\s*:\s*flex|\bflex\b/i },
        { key: /grid/, test: /display\s*:\s*grid|\bgrid-template\b/i },
        { key: /animation/, test: /@keyframes|animation\s*:/i },
        { key: /transition|hover effect|hover/, test: /transition\s*:|:hover/i },
        { key: /media query|responsive/, test: /@media\b/i },
        { key: /api|fetch|axios|endpoint/, test: /\bfetch\(|axios\.|xmlhttprequest|\/api\//i },
        { key: /local storage|localstorage/, test: /localStorage/i },
        { key: /event listener|onclick|onsubmit/, test: /addEventListener|\bonclick=|\bonsubmit=/i },
    ];
    for (const matcher of featureMatchers) {
        if (matcher.key.test(line) && matcher.test.test(raw)) {
            return true;
        }
    }

    return false;
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
        let matched = requirementPatternMatch(line, sourceText, normalizedSource);
        if (tokens.length) {
            const hits = tokens.filter(token => normalizedSource.includes(token)).length;
            matched = matched || hits / tokens.length >= 0.5 || normalizedSource.includes(normalizedLine.slice(0, Math.min(normalizedLine.length, 24)));
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

    // Balanced penalties for missing requirements
    if (mustMissing >= 1) nextScore = Math.min(nextScore, 75);
    if (mustMissing >= 2) nextScore = Math.min(nextScore, 62);
    if (mustMissing >= 3) nextScore = Math.min(nextScore, 45);
    if (mustMissing >= 4 || mustMissing >= requirementCount * 0.8) nextScore = Math.min(nextScore, 30);

    // Additional penalties based on coverage percentage
    if (mustScore < 70) nextScore -= 6;
    if (mustScore < 50) nextScore -= 12;
    if (mustScore < 30) nextScore -= 20;
    if (totalScore < 50) nextScore -= 8;
    if (totalScore < 30) nextScore -= 15;

    // Penalty for high missing ratio
    const missingRatio = totalMissing / requirementCount;
    if (missingRatio > 0.7) nextScore -= 18;
    else if (missingRatio > 0.5) nextScore -= 12;
    else if (missingRatio > 0.3) nextScore -= 6;

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
            const presentationalAttrCount = (content.match(/\b(bgcolor|align|border|text|link|vlink|alink)\s*=/gi) || []).length;
            if (presentationalAttrCount > 0) {
                htmlIssues.push(`${snippet.path}: ${presentationalAttrCount} deprecated presentational HTML attributes detected`);
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
    const profile = inferRequirementProfile(requirementsText);
    const mediaQueries = (joined.match(/@media/g) || []).length;
    const semanticTags = (joined.match(/<(header|main|section|nav|footer|article|aside)\b/g) || []).length;
    const eventHandlers = (joined.match(/addEventListener|\bonclick=|\bonsubmit=|\bfetch\(|axios\.|XMLHttpRequest/g) || []).length;
    const comments = (joined.match(/\/\*|\/\/|<!--/g) || []).length;
    const coverage = requirementCoverageScore(sourceText, requirementsText, rubricWeights);

    const coverageBoost = Math.round(coverage.score * 0.7);
    const jsEvidence = Math.min(30, stats.jsCount * 8 + eventHandlers * 5);
    const cssEvidence = Math.min(28, stats.cssCount * 9 + (joined.includes('style') ? 6 : 0));
    const responsiveEvidence = Math.min(34,
        mediaQueries * 12 +
        (joined.includes('viewport') ? 8 : 0) +
        ((joined.includes('flex') || joined.includes('grid')) ? 8 : 0)
    );

    let structure = Math.min(100, 25
        + (stats.hasIndexHtml ? 18 : 0)
        + (stats.hasPackageJson ? 6 : 0)
        + Math.min(stats.fileCount * 3, 16)
        + Math.round(coverage.score * 0.35));

    let functionality = Math.min(100, 18
        + (stats.hasIndexHtml || stats.hasPackageJson ? 8 : 0)
        + jsEvidence
        + Math.round(coverage.score * 0.45));

    let uiUx = Math.min(100, 20
        + cssEvidence
        + Math.min(semanticTags * 6, 18)
        + (joined.includes('aria-') ? 8 : 0)
        + Math.round(coverage.score * 0.3));

    let responsiveness = Math.min(100, 20 + responsiveEvidence + Math.round(coverage.score * 0.25));

    let codeQuality = Math.min(100, 22
        + Math.min(comments * 4, 12)
        + Math.min(stats.jsCount * 7, 18)
        + (joined.includes('const ') || joined.includes('let ') ? 12 : 0)
        + (joined.includes('async ') || joined.includes('await ') ? 8 : 0)
        + (stats.fileCount > 8 ? 6 : 0)
        + Math.round(coverage.score * 0.2));

    // Dynamic expectations: only penalize dimensions that task actually demands.
    if (!profile.expectsJs) {
        functionality = Math.max(functionality, Math.min(100, 30 + coverageBoost));
    } else if (stats.jsCount === 0 && eventHandlers === 0) {
        functionality = Math.min(functionality, 45);
    }

    if (!profile.expectsCss) {
        uiUx = Math.max(uiUx, Math.min(100, 28 + coverageBoost));
    } else if (stats.cssCount === 0 && !joined.includes('style=')) {
        uiUx = Math.min(uiUx, 50);
    }

    if (!profile.expectsResponsive) {
        responsiveness = Math.max(responsiveness, Math.min(100, 25 + Math.round(coverage.score * 0.55)));
    } else if (mediaQueries === 0 && !joined.includes('viewport')) {
        responsiveness = Math.min(responsiveness, 48);
    }

    if (profile.expectsFramework && stats.framework === 'static-html' && !stats.hasPackageJson) {
        functionality = Math.min(functionality, 45);
        codeQuality = Math.min(codeQuality, 55);
    }

    // Global floor driven by requirement coverage to avoid unrealistic collapse.
    if (coverage.totalCount > 0) {
        const softFloor = Math.round(coverage.score * 0.45);
        structure = Math.max(structure, softFloor);
        functionality = Math.max(functionality, softFloor);
        uiUx = Math.max(uiUx, softFloor);
        responsiveness = Math.max(responsiveness, softFloor);
        codeQuality = Math.max(codeQuality, softFloor);
    }

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
    let overallScore = applyRequirementPenalty(rawOverallScore, coverage);
    if (stats.framework === 'static-html' && coverage.totalCount > 0 && (coverage.mustScore ?? coverage.score) >= 80) {
        overallScore = Math.max(overallScore, Math.round((coverage.score * 0.75) + 5));
    }
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

    const prompt = `You are a balanced frontend evaluator for student project submissions.

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
1. Requirements are the highest priority. Evaluate only against what is explicitly asked in this task.
2. You MUST inspect the submission holistically across HTML, CSS, and JavaScript. Do not judge from HTML alone.
3. Check whether the HTML actually connects to the CSS and JS files, and whether those files contain real implementation. If CSS or JS files are missing, mostly empty, unused, or disconnected from the HTML, do not give credit for them.
4. Trace concrete implementation evidence such as linked stylesheets, selectors, classes, ids, media queries, DOM queries, event listeners, validation logic, and interactive behavior before awarding marks.
5. Be reasonably fair. If the student has implemented styling in CSS files and behavior in JavaScript files, count that evidence even when the HTML itself is simple.
6. Deprecated presentational HTML should be treated as a quality issue. Examples include bgcolor, align, border, font, center, marquee, blink, and similar old HTML styling patterns.
7. If CSS and JavaScript files clearly support the requested features, award meaningful credit for them. Do not require every feature to appear directly inside the HTML file.
8. Do NOT heavily penalize missing JavaScript, responsiveness, framework setup, or API integration unless those are explicitly required by the task.
9. Do not reward folder structure, package.json, or superficial styling unless requested features are actually implemented well.
10. When a requirement can be satisfied through HTML, CSS, or JavaScript, consider the combined evidence from all three before marking it missing.
11. The breakdown should reflect real implementation evidence, not assumptions.
12. Call out missing requirements explicitly in issues and recommendations.

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
            model: 'llama3.1-8b',
            temperature: 0.2,
            max_tokens: 900,
        });
        const raw = (aiResp.choices?.[0]?.message?.content || '{}').replace(/```json\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(raw);
        const localWeightedScore = Math.round(
            (localBreakdown.structure * 0.18) +
            (localBreakdown.functionality * 0.3) +
            (localBreakdown.uiUx * 0.18) +
            (localBreakdown.responsiveness * 0.16) +
            (localBreakdown.codeQuality * 0.18)
        );
        const aiBaseScore = Math.round(parsed.overallScore || localWeightedScore || 0);
        const blendedScore = Math.round((aiBaseScore * 0.6) + (localWeightedScore * 0.4));
        let penalizedScore = applyRequirementPenalty(blendedScore, localBreakdown.coverage);
        const coverage = localBreakdown.coverage || { score: 0, totalCount: 0 };
        if (stats.framework === 'static-html' && coverage.totalCount > 0 && coverage.score >= 60) {
            // Keep simple HTML tasks from collapsing to unrealistic single-digit scores.
            penalizedScore = Math.max(penalizedScore, Math.round(coverage.score * 0.55));
        }
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
                       s.runtime_summary, s.submitted_at, s.stored_path, s.extracted_path, t.title AS test_title,
                       u.name AS student_name, u.email AS student_email
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                LEFT JOIN users u ON u.id = s.student_id
                ORDER BY s.submitted_at DESC
            `);
            const submissions = await Promise.all(rows.map(async row => {
                const re_evaluation_available = await hasSubmissionReplaySource(pool, row);
                return {
                    ...row,
                    re_evaluation_available,
                };
            }));
            res.json({
                success: true,
                submissions: submissions.map(({ stored_path, extracted_path, ...row }) => row),
            });
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
            const content = await readSubmissionFileContent(pool, id, row, sanitizedPath);
            
            res.json({ success: true, content });
        } catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: err.message });
        }
    });

    router.post('/admin/frontend-evals/submissions/:id/re-evaluate', authenticate, requireAdmin, async (req, res, next) => {
        if (req.params.id === 'bulk') return next();
        let tempRoot = null;
        try {
            const { id } = req.params;

            const [[row]] = await pool.query(`
                SELECT s.*, t.title, t.description, t.requirements, t.rubric_json
                FROM frontend_eval_submissions s
                INNER JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.id = ?
            `, [id]);

            if (!row) {
                return res.status(404).json({ success: false, error: 'Submission not found' });
            }

            let extractedRoot = getExistingSubmissionProjectRoot(row);

            if (!extractedRoot) {
                tempRoot = path.join(os.tmpdir(), 'frontend-evals-admin-reeval', `${id}-${Date.now()}`);
                const tempProjectRoot = path.join(tempRoot, 'project');

                let zipBuffer = await getZipFromDatabase(pool, id);

                if (!zipBuffer && row.stored_path && fs.existsSync(row.stored_path)) {
                    const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
                    const zipEntry = entries.find(entry => entry.isFile() && /\.zip$/i.test(entry.name));
                    if (zipEntry) {
                        zipBuffer = await fsp.readFile(path.join(row.stored_path, zipEntry.name));
                    }
                }

                if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
                    await extractZipBuffer(zipBuffer, tempProjectRoot);
                    extractedRoot = tempProjectRoot;
                }
            }

            if (!extractedRoot) {
                return res.status(409).json({
                    success: false,
                    code: 'SUBMISSION_FILES_UNAVAILABLE',
                    error: 'Unable to locate submission files for re-evaluation. Please submit again.',
                });
            }

            const test = {
                id: row.test_id,
                title: row.title,
                description: row.description,
                requirements: row.requirements,
                rubric_json: row.rubric_json,
            };

            const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
            const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

            await pool.query(
                `UPDATE frontend_eval_submissions
                 SET score = ?, runtime_status = ?, runtime_summary = ?, runtime_output = ?,
                     report_json = ?, breakdown_json = ?, file_tree_json = ?, lint_results = ?, confidence_score = ?
                 WHERE id = ?`,
                [
                    report.overallScore,
                    runtimeStatus,
                    report.runtime.summary || '',
                    report.runtime.output || '',
                    JSON.stringify(report),
                    JSON.stringify(report.breakdown),
                    JSON.stringify(report.fileTree),
                    JSON.stringify(report.lintResults || {}),
                    report.confidenceScore || 0,
                    id,
                ]
            );

            const [[updated]] = await pool.query(`
                SELECT s.*, t.title AS test_title, t.description AS test_description, t.requirements,
                       u.name AS student_name, u.email AS student_email
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                LEFT JOIN users u ON u.id = s.student_id
                WHERE s.id = ?
            `, [id]);

            if (updated) {
                updated.report_json = safeJsonParse(updated.report_json, {});
                updated.breakdown_json = safeJsonParse(updated.breakdown_json, {});
                updated.file_tree_json = safeJsonParse(updated.file_tree_json, []);
                updated.lint_results = safeJsonParse(updated.lint_results, null);
            }

            res.json({ success: true, submission: updated || null });
        } catch (err) {
            console.error('[frontend-evals][admin] re-evaluate error:', err);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (tempRoot) {
                try { await fsp.rm(tempRoot, { recursive: true, force: true }); } catch {}
            }
        }
    });

    router.post('/admin/frontend-evals/submissions/bulk/re-evaluate', authenticate, requireAdmin, async (req, res) => {
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or empty submission IDs' });
            }

            let updated = 0;
            for (const id of ids) {
                let tempRoot = null;
                try {
                    const [[row]] = await pool.query(`
                        SELECT s.*, t.title, t.description, t.requirements, t.rubric_json
                        FROM frontend_eval_submissions s
                        INNER JOIN frontend_eval_tests t ON t.id = s.test_id
                        WHERE s.id = ?
                    `, [id]);

                    if (!row) continue;

                    let extractedRoot = null;
                    const existingExtracted = row.extracted_path ? path.resolve(row.extracted_path) : null;
                    if (existingExtracted && fs.existsSync(existingExtracted)) {
                        extractedRoot = existingExtracted;
                    }

                    if (!extractedRoot && row.stored_path) {
                        const projectFromStoredPath = path.resolve(path.join(row.stored_path, 'project'));
                        if (fs.existsSync(projectFromStoredPath)) {
                            extractedRoot = projectFromStoredPath;
                        }
                    }

                    if (!extractedRoot) {
                        const localByIdPath = path.join(API_UPLOAD_ROOT, id, 'project');
                        if (fs.existsSync(localByIdPath)) extractedRoot = localByIdPath;
                    }

                    if (!extractedRoot) {
                        tempRoot = path.join(os.tmpdir(), 'frontend-evals-admin-bulk-reeval', `${id}-${Date.now()}`);
                        const tempProjectRoot = path.join(tempRoot, 'project');

                        let zipBuffer = await getZipFromDatabase(pool, id);

                        if (!zipBuffer && row.stored_path && fs.existsSync(row.stored_path)) {
                            const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
                            const zipEntry = entries.find(entry => entry.isFile() && /\.zip$/i.test(entry.name));
                            if (zipEntry) {
                                zipBuffer = await fsp.readFile(path.join(row.stored_path, zipEntry.name));
                            }
                        }

                        if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
                            await extractZipBuffer(zipBuffer, tempProjectRoot);
                            extractedRoot = tempProjectRoot;
                        }
                    }

                    if (!extractedRoot) continue;

                    const test = {
                        id: row.test_id,
                        title: row.title,
                        description: row.description,
                        requirements: row.requirements,
                        rubric_json: row.rubric_json,
                    };

                    const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
                    const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

                    await pool.query(
                        `UPDATE frontend_eval_submissions
                         SET score = ?, runtime_status = ?, runtime_summary = ?, runtime_output = ?,
                             report_json = ?, breakdown_json = ?, file_tree_json = ?, lint_results = ?, confidence_score = ?
                         WHERE id = ?`,
                        [
                            report.overallScore,
                            runtimeStatus,
                            report.runtime.summary || '',
                            report.runtime.output || '',
                            JSON.stringify(report),
                            JSON.stringify(report.breakdown),
                            JSON.stringify(report.fileTree),
                            JSON.stringify(report.lintResults || {}),
                            report.confidenceScore || 0,
                            id,
                        ]
                    );

                    updated++;
                } catch (err) {
                    console.error(`[frontend-evals][admin] bulk re-evaluate error for submission ${id}:`, err);
                } finally {
                    if (tempRoot) {
                        try { await fsp.rm(tempRoot, { recursive: true, force: true }); } catch {}
                    }
                }
            }

            res.json({ success: true, updated, total: ids.length });
        } catch (err) {
            console.error('[frontend-evals][admin] bulk re-evaluate error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/admin/frontend-evals/submissions/bulk/delete', authenticate, requireAdmin, async (req, res) => {
        try {
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or empty submission IDs' });
            }

            let deleted = 0;
            for (const id of ids) {
                try {
                    const [[row]] = await pool.query(
                        'SELECT stored_path FROM frontend_eval_submissions WHERE id = ?',
                        [id]
                    );

                    if (!row) continue;

                    await pool.query('DELETE FROM frontend_eval_submissions WHERE id = ?', [id]);

                    await deleteZipFromDatabase(pool, id);

                    if (row.stored_path) {
                        try { await fsp.rm(row.stored_path, { recursive: true, force: true }); } catch {}
                    }

                    deleted++;
                } catch (err) {
                    console.error(`[frontend-evals][admin] bulk delete error for submission ${id}:`, err);
                }
            }

            res.json({ success: true, deleted, total: ids.length });
        } catch (err) {
            console.error('[frontend-evals][admin] bulk delete error:', err);
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
                       s.stored_path, s.extracted_path,
                       t.title AS test_title
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.student_id = ?
                ORDER BY s.submitted_at DESC
            `, [studentId]);
            const submissions = await Promise.all(rows.map(async row => {
                const re_evaluation_available = await hasSubmissionReplaySource(pool, row);
                return {
                    ...row,
                    re_evaluation_available,
                };
            }));
            res.json({
                success: true,
                submissions: submissions.map(({ stored_path, extracted_path, ...row }) => row),
            });
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

    router.post('/frontend-evals/submissions/:id/re-evaluate', authenticate, async (req, res, next) => {
        if (req.params.id === 'bulk') return next();
        let tempRoot = null;
        try {
            const studentId = String(req.user.id);
            const { id } = req.params;

            const [[row]] = await pool.query(`
                SELECT s.*, t.title, t.description, t.requirements, t.rubric_json
                FROM frontend_eval_submissions s
                INNER JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.id = ? AND s.student_id = ?
            `, [id, studentId]);

            if (!row) {
                return res.status(404).json({ success: false, error: 'Submission not found' });
            }

            let extractedRoot = getExistingSubmissionProjectRoot(row);

            if (!extractedRoot) {
                tempRoot = path.join(os.tmpdir(), 'frontend-evals-reeval', `${id}-${Date.now()}`);
                const tempProjectRoot = path.join(tempRoot, 'project');

                let zipBuffer = await getZipFromDatabase(pool, id);

                if (!zipBuffer && row.stored_path && fs.existsSync(row.stored_path)) {
                    const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
                    const zipEntry = entries.find(entry => entry.isFile() && /\.zip$/i.test(entry.name));
                    if (zipEntry) {
                        zipBuffer = await fsp.readFile(path.join(row.stored_path, zipEntry.name));
                    }
                }

                if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
                    await extractZipBuffer(zipBuffer, tempProjectRoot);
                    extractedRoot = tempProjectRoot;
                }
            }

            if (!extractedRoot) {
                return res.status(409).json({
                    success: false,
                    code: 'SUBMISSION_FILES_UNAVAILABLE',
                    error: 'Unable to locate submission files for re-evaluation. Please submit again.',
                });
            }

            const test = {
                id: row.test_id,
                title: row.title,
                description: row.description,
                requirements: row.requirements,
                rubric_json: row.rubric_json,
            };

            const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
            const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

            await pool.query(
                `UPDATE frontend_eval_submissions
                 SET score = ?, runtime_status = ?, runtime_summary = ?, runtime_output = ?,
                     report_json = ?, breakdown_json = ?, file_tree_json = ?, lint_results = ?, confidence_score = ?
                 WHERE id = ? AND student_id = ?`,
                [
                    report.overallScore,
                    runtimeStatus,
                    report.runtime.summary || '',
                    report.runtime.output || '',
                    JSON.stringify(report),
                    JSON.stringify(report.breakdown),
                    JSON.stringify(report.fileTree),
                    JSON.stringify(report.lintResults || {}),
                    report.confidenceScore || 0,
                    id,
                    studentId,
                ]
            );

            const [[updated]] = await pool.query(`
                SELECT s.*, t.title AS test_title, t.description AS test_description, t.requirements
                FROM frontend_eval_submissions s
                LEFT JOIN frontend_eval_tests t ON t.id = s.test_id
                WHERE s.id = ? AND s.student_id = ?
            `, [id, studentId]);

            if (updated) {
                updated.report_json = safeJsonParse(updated.report_json, {});
                updated.breakdown_json = safeJsonParse(updated.breakdown_json, {});
                updated.file_tree_json = safeJsonParse(updated.file_tree_json, []);
                updated.lint_results = safeJsonParse(updated.lint_results, null);
            }

            res.json({ success: true, submission: updated || null });
        } catch (err) {
            console.error('[frontend-evals] re-evaluate error:', err);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (tempRoot) {
                try { await fsp.rm(tempRoot, { recursive: true, force: true }); } catch {}
            }
        }
    });

    // Custom middleware to handle both multipart (files) and JSON (code-editor) submissions
    const handleSubmissionUpload = (req, res, next) => {
        const contentType = req.get('content-type') || '';
        if (contentType.includes('application/json')) {
            // For JSON submissions (code editor), just let it pass through
            next();
        } else {
            // For multipart submissions (file/zip upload), use multer
            upload.any()(req, res, next);
        }
    };

    router.post('/frontend-evals/tests/:id/submit', authenticate, handleSubmissionUpload, async (req, res) => {
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
            
            // Validate submission type
            if (!['zip', 'files', 'code-editor'].includes(submissionType)) {
                return res.status(400).json({ success: false, error: 'submissionType must be zip, files, or code-editor' });
            }

            // For code-editor submissions, validate that files array exists in body
            if (submissionType === 'code-editor') {
                if (!Array.isArray(req.body.files) || req.body.files.length === 0) {
                    return res.status(400).json({ success: false, error: 'No code files provided' });
                }
            } else {
                // For file/zip uploads, validate that files were uploaded
                if (!files.length) {
                    return res.status(400).json({ success: false, error: 'No files uploaded' });
                }
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
            } else if (submissionType === 'code-editor') {
                // Handle code editor submission
                const codeFiles = req.body.files || [];
                if (!Array.isArray(codeFiles) || codeFiles.length === 0) {
                    return res.status(400).json({ success: false, error: 'No code files provided' });
                }
                
                extractedRoot = path.join(submissionRoot, 'project');
                await ensureDir(extractedRoot);
                
                // Write code files to disk
                for (const codeFile of codeFiles) {
                    const fileName = sanitizeSegment(codeFile.name || 'file.txt');
                    const filePath = path.join(extractedRoot, fileName);
                    await fsp.writeFile(filePath, codeFile.content || '', 'utf8');
                }
                
                // Create ZIP and save to database
                try {
                    const zipBuffer = await createZipFromCodeEditorFiles(codeFiles);
                    const savedToDb = await saveZipToDatabase(pool, submissionId, zipBuffer);
                    if (savedToDb) {
                        console.log(`✅ Code Editor ZIP saved to database for submission ${submissionId}`);
                    } else {
                        console.warn(`⚠️ Code Editor ZIP not saved to database (storage disabled), using local filesystem only`);
                    }
                } catch (err) {
                    console.error(`Failed to save code editor ZIP: ${err.message}`);
                    // Continue with submission even if database save fails - files are on disk
                }
            } else {
                let relativePaths = req.body.relativePaths || [];
                if (!Array.isArray(relativePaths)) relativePaths = [relativePaths];
                extractedRoot = await writeUploadedFiles(submissionRoot, files, relativePaths);
                // Save ZIP to database so re-evaluation works from any server
                try {
                    const dirZip = await createZipFromDirectory(extractedRoot);
                    const savedToDb = await saveZipToDatabase(pool, submissionId, dirZip);
                    if (savedToDb) console.log(`✅ Files ZIP saved to database for submission ${submissionId}`);
                } catch (zipErr) {
                    console.error(`Failed to save files ZIP to database: ${zipErr.message}`);
                }
            }

            const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
            const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

            // Determine original name based on submission type
            let originalName = 'project';
            if (submissionType === 'code-editor') {
                originalName = `Code Editor (${req.body.files?.length || 1} files)`;
            } else if (files[0]?.originalname) {
                originalName = files[0].originalname;
            }

            const insertSubmissionSql = `INSERT INTO frontend_eval_submissions
                 (id, test_id, student_id, submission_type, original_name, stored_path, extracted_path,
                  score, runtime_status, runtime_summary, runtime_output, report_json, breakdown_json, file_tree_json, lint_results, confidence_score)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const insertParams = [
                submissionId,
                testId,
                studentId,
                submissionType,
                originalName,
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
            ];

            try {
                await pool.query(insertSubmissionSql, insertParams);
            } catch (dbErr) {
                // Backward compatibility for old DB schemas where enum is only ('zip','files').
                if (submissionType === 'code-editor' && /submission_type/i.test(String(dbErr?.message || ''))) {
                    const fallbackParams = [...insertParams];
                    fallbackParams[3] = 'files';
                    await pool.query(insertSubmissionSql, fallbackParams);
                } else {
                    throw dbErr;
                }
            }

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

    router.post('/frontend-evals/submissions/bulk/re-evaluate', authenticate, async (req, res) => {
        try {
            const studentId = String(req.user.id);
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or empty submission IDs' });
            }

            let updated = 0;
            for (const id of ids) {
                let tempRoot = null;
                try {
                    const [[row]] = await pool.query(`
                        SELECT s.*, t.title, t.description, t.requirements, t.rubric_json
                        FROM frontend_eval_submissions s
                        INNER JOIN frontend_eval_tests t ON t.id = s.test_id
                        WHERE s.id = ? AND s.student_id = ?
                    `, [id, studentId]);

                    if (!row) continue;

                    let extractedRoot = null;
                    const existingExtracted = row.extracted_path ? path.resolve(row.extracted_path) : null;
                    if (existingExtracted && fs.existsSync(existingExtracted)) {
                        extractedRoot = existingExtracted;
                    }

                    if (!extractedRoot && row.stored_path) {
                        const projectFromStoredPath = path.resolve(path.join(row.stored_path, 'project'));
                        if (fs.existsSync(projectFromStoredPath)) {
                            extractedRoot = projectFromStoredPath;
                        }
                    }

                    if (!extractedRoot) {
                        const localByIdPath = path.join(API_UPLOAD_ROOT, id, 'project');
                        if (fs.existsSync(localByIdPath)) extractedRoot = localByIdPath;
                    }

                    if (!extractedRoot) {
                        tempRoot = path.join(os.tmpdir(), 'frontend-evals-bulk-reeval', `${id}-${Date.now()}`);
                        const tempProjectRoot = path.join(tempRoot, 'project');

                        let zipBuffer = await getZipFromDatabase(pool, id);

                        if (!zipBuffer && row.stored_path && fs.existsSync(row.stored_path)) {
                            const entries = await fsp.readdir(row.stored_path, { withFileTypes: true });
                            const zipEntry = entries.find(entry => entry.isFile() && /\.zip$/i.test(entry.name));
                            if (zipEntry) {
                                zipBuffer = await fsp.readFile(path.join(row.stored_path, zipEntry.name));
                            }
                        }

                        if (zipBuffer && Buffer.isBuffer(zipBuffer)) {
                            await extractZipBuffer(zipBuffer, tempProjectRoot);
                            extractedRoot = tempProjectRoot;
                        }
                    }

                    if (!extractedRoot) continue;

                    const test = {
                        id: row.test_id,
                        title: row.title,
                        description: row.description,
                        requirements: row.requirements,
                        rubric_json: row.rubric_json,
                    };

                    const report = await analyzeSubmission({ extractedRoot, test, cerebrasChat });
                    const runtimeStatus = report.runtime.success ? 'passed' : report.runtime.attempted ? 'failed' : 'skipped';

                    await pool.query(
                        `UPDATE frontend_eval_submissions
                         SET score = ?, runtime_status = ?, runtime_summary = ?, runtime_output = ?,
                             report_json = ?, breakdown_json = ?, file_tree_json = ?, lint_results = ?, confidence_score = ?
                         WHERE id = ? AND student_id = ?`,
                        [
                            report.overallScore,
                            runtimeStatus,
                            report.runtime.summary || '',
                            report.runtime.output || '',
                            JSON.stringify(report),
                            JSON.stringify(report.breakdown),
                            JSON.stringify(report.fileTree),
                            JSON.stringify(report.lintResults || {}),
                            report.confidenceScore || 0,
                            id,
                            studentId,
                        ]
                    );

                    updated++;
                } catch (err) {
                    console.error(`[frontend-evals] bulk re-evaluate error for submission ${id}:`, err);
                } finally {
                    if (tempRoot) {
                        try { await fsp.rm(tempRoot, { recursive: true, force: true }); } catch {}
                    }
                }
            }

            res.json({ success: true, updated, total: ids.length });
        } catch (err) {
            console.error('[frontend-evals] bulk re-evaluate error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/frontend-evals/submissions/bulk/delete', authenticate, async (req, res) => {
        try {
            const studentId = String(req.user.id);
            const { ids } = req.body;

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, error: 'Invalid or empty submission IDs' });
            }

            let deleted = 0;
            for (const id of ids) {
                try {
                    const [[row]] = await pool.query(
                        'SELECT stored_path FROM frontend_eval_submissions WHERE id = ? AND student_id = ?',
                        [id, studentId]
                    );

                    if (!row) continue;

                    await pool.query('DELETE FROM frontend_eval_submissions WHERE id = ? AND student_id = ?', [id, studentId]);

                    // Delete from database storage if enabled
                    await deleteZipFromDatabase(pool, id);

                    // Delete local files
                    if (row.stored_path) {
                        try { await fsp.rm(row.stored_path, { recursive: true, force: true }); } catch {}
                    }

                    deleted++;
                } catch (err) {
                    console.error(`[frontend-evals] bulk delete error for submission ${id}:`, err);
                }
            }

            res.json({ success: true, deleted, total: ids.length });
        } catch (err) {
            console.error('[frontend-evals] bulk delete error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
