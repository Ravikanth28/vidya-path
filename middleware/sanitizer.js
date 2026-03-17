/**
 * Input Sanitization Middleware
 * Prevents XSS, HTML injection, and malicious code injection
 */

/**
 * Sanitize string input - removes HTML and dangerous content
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    // Remove HTML tags, keep only text
    // Note: We only remove actual HTML tags (e.g. <p>, <div/>), not single angle brackets
    // used in SQL comparisons (e.g. salary > 50000) or templates (e.g. List<String>)
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove script tags
        .replace(/<[a-zA-Z/][^>]*>/g, '')  // Improved: Only match <tag>, </tag>, or <tag/> (must start with letter or /)
        .trim()
        .substring(0, 10000);  // Limit to 10KB
}

/**
 * Sanitize object/JSON recursively
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    // Fields that contain source code — must NOT be sanitized (they need <stdio.h>, <iostream>, etc.)
    const codeFields = ['code', 'sqlSchema', 'sql_schema', 'defaultCode', 'default_code',
        'testCode', 'test_code', 'solutionCode', 'solution_code', 'starterCode', 'starter_code',
        'htmlCode', 'cssCode', 'jsCode', 'source_code', 'expected_output', 'stdin'];
    for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive fields and source code fields
        if (['password', 'token', 'secret', 'apiKey', 'apiSecret'].includes(key.toLowerCase())) {
            sanitized[key] = value;  // Don't sanitize passwords/tokens
        } else if (codeFields.includes(key)) {
            sanitized[key] = value;  // Don't sanitize source code (needs <stdio.h>, <vector>, etc.)
        } else if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Express middleware: Sanitize all incoming request data
 */
function sanitizeMiddleware(req, res, next) {
    try {
        const isFrontendEvalCodeSubmit = req.method === 'POST' && /^\/api\/frontend-evals\/tests\/[^/]+\/submit$/i.test(req.path);
        if (isFrontendEvalCodeSubmit) {
            return next();
        }

        // Skip sanitization entirely for code execution endpoints
        // (source code contains <stdio.h>, <iostream>, <vector>, etc. that look like HTML tags)
        const skipPaths = ['/api/run', '/api/submit', '/api/run-with-tests', '/api/hints',
            '/api/problems', '/api/evaluate', '/api/ai-review'];
        if (skipPaths.some(p => req.path.startsWith(p))) {
            return next();
        }

        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        console.error('[Sanitizer] Error during sanitization:', error.message);
        res.status(400).json({ error: 'Invalid input format' });
    }
}

/**
 * Escape HTML special characters (for display)
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = {
    sanitizeMiddleware,
    sanitizeString,
    sanitizeObject,
    escapeHtml
};
