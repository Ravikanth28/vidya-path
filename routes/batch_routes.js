/**
 * Batch Management Routes
 * Admin uploads a single Excel/CSV file.
 * - If Excel (.xlsx/.xls): each SHEET becomes its own batch (sheet name = batch name).
 * - If CSV: the uploaded file name (minus extension) is the batch name.
 * Students are matched by email, name, or ID against registered users.
 */

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const XLSX = require('xlsx');

// Multer setup — store file in memory for parsing
const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream',
        ];
        const ext = (file.originalname || '').toLowerCase();
        if (allowed.includes(file.mimetype) || ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV or Excel (.xlsx / .xls) files are allowed'), false);
        }
    }
});

/**
 * Build lookup maps from DB students for matching
 */
function buildStudentMaps(allStudents) {
    const emailToId = {};
    const nameToId = {};
    for (const s of allStudents) {
        if (s.email) emailToId[s.email.toLowerCase().trim()] = String(s.id);
        if (s.name) nameToId[s.name.toLowerCase().trim()] = String(s.id);
    }
    return { emailToId, nameToId };
}

/**
 * Given a 2D array of rows (first row = header), match students and return IDs
 */
function matchStudentsFromRows(rows, allStudents, emailToId, nameToId) {
    if (!rows || rows.length < 2) return { matched: [], unmatched: 0 };

    const headers = rows[0].map(h => String(h || '').trim().toLowerCase().replace(/['"]/g, ''));
    const emailCol = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const nameCol = headers.findIndex(h => h.includes('name') || h.includes('student'));
    const idCol = headers.findIndex(h => h === 'id' || h === 'student_id' || h === 'studentid');

    const matchedIds = new Set();
    let unmatched = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(cell => !cell || String(cell).trim() === '')) continue; // skip empty rows

        let found = false;

        // Try email column
        if (emailCol >= 0 && row[emailCol]) {
            const email = String(row[emailCol]).toLowerCase().trim();
            if (emailToId[email]) { matchedIds.add(emailToId[email]); found = true; }
        }

        // Try ID column
        if (!found && idCol >= 0 && row[idCol]) {
            const sid = String(row[idCol]).trim();
            if (allStudents.find(s => String(s.id) === sid)) { matchedIds.add(sid); found = true; }
        }

        // Try name column
        if (!found && nameCol >= 0 && row[nameCol]) {
            const name = String(row[nameCol]).toLowerCase().trim();
            if (nameToId[name]) { matchedIds.add(nameToId[name]); found = true; }
        }

        // Fallback: try every cell value
        if (!found) {
            for (const cell of row) {
                const v = String(cell || '').toLowerCase().trim();
                if (!v) continue;
                if (emailToId[v]) { matchedIds.add(emailToId[v]); found = true; break; }
                if (nameToId[v]) { matchedIds.add(nameToId[v]); found = true; break; }
            }
        }

        if (!found) unmatched++;
    }

    return { matched: Array.from(matchedIds), unmatched };
}

module.exports = function (pool, authenticate, authorize) {

    const router = require('express').Router();

    // ─── Ensure batch table ──────────────────────────────────────────────
    async function ensureBatchTables() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS student_batches (
                    id VARCHAR(50) PRIMARY KEY,
                    batch_name VARCHAR(200) NOT NULL,
                    student_ids JSON NOT NULL,
                    student_count INT DEFAULT 0,
                    source_filename VARCHAR(255) DEFAULT NULL,
                    sheet_name VARCHAR(200) DEFAULT NULL,
                    created_by VARCHAR(50),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_batch_name (batch_name)
                )
            `);
            console.log('✅ student_batches table ready');
        } catch (e) {
            console.warn('⚠️ student_batches table init:', e.message);
        }
    }
    ensureBatchTables();

    // ─── GET /api/batches — list all batches ──────────────────────────────
    router.get('/batches', authenticate, authorize('admin'), async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM student_batches ORDER BY created_at DESC');
            const batches = rows.map(r => {
                let ids = r.student_ids;
                if (typeof ids === 'string') {
                    try { ids = JSON.parse(ids); } catch { ids = []; }
                }
                return {
                    ...r,
                    student_ids: Array.isArray(ids) ? ids : [],
                };
            });
            res.json({ success: true, batches });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ─── POST /api/batches — upload file → auto-create batches ───────────
    //
    //  If Excel: each sheet → one batch (sheet name = batch name)
    //  If CSV:   one batch with file name as batch name
    //            (or use req.body.batch_name if provided)
    //
    router.post('/batches', authenticate, authorize('admin'), fileUpload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Please upload a CSV or Excel file' });
            }

            // Get all students for matching
            const [allStudents] = await pool.query("SELECT id, name, email FROM users WHERE role = 'student'");
            const { emailToId, nameToId } = buildStudentMaps(allStudents);

            const filename = req.file.originalname || 'upload';
            const ext = filename.toLowerCase().split('.').pop();
            const isExcel = ext === 'xlsx' || ext === 'xls';

            const createdBatches = [];

            if (isExcel) {
                // ─── Excel: each sheet → separate batch ──────────────────
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

                if (workbook.SheetNames.length === 0) {
                    return res.status(400).json({ error: 'Excel file has no sheets' });
                }

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                    if (rows.length < 2) continue; // skip empty sheets (header only or empty)

                    const { matched, unmatched } = matchStudentsFromRows(rows, allStudents, emailToId, nameToId);

                    const id = uuidv4();
                    await pool.query(
                        'INSERT INTO student_batches (id, batch_name, student_ids, student_count, source_filename, sheet_name, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [id, sheetName, JSON.stringify(matched), matched.length, filename, sheetName, req.user.id]
                    );

                    createdBatches.push({
                        id,
                        batch_name: sheetName,
                        student_count: matched.length,
                        unmatched,
                        sheet_name: sheetName,
                    });
                }

            } else {
                // ─── CSV: single batch ───────────────────────────────────
                const batchName = (req.body.batch_name || '').trim() || filename.replace(/\.\w+$/, '');
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                const { matched, unmatched } = matchStudentsFromRows(rows, allStudents, emailToId, nameToId);

                const id = uuidv4();
                await pool.query(
                    'INSERT INTO student_batches (id, batch_name, student_ids, student_count, source_filename, sheet_name, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [id, batchName, JSON.stringify(matched), matched.length, filename, null, req.user.id]
                );

                createdBatches.push({
                    id,
                    batch_name: batchName,
                    student_count: matched.length,
                    unmatched,
                });
            }

            if (createdBatches.length === 0) {
                return res.status(400).json({ error: 'No valid data found in the uploaded file. Sheets need at least a header row and one data row.' });
            }

            res.status(201).json({
                success: true,
                filename,
                is_excel: isExcel,
                batches_created: createdBatches.length,
                batches: createdBatches,
            });
        } catch (err) {
            console.error('Batch create error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // ─── PUT /api/batches/:id — update batch name or re-upload ───────────
    router.put('/batches/:id', authenticate, authorize('admin'), fileUpload.single('file'), async (req, res) => {
        try {
            const { id } = req.params;
            const { batch_name } = req.body;

            // If file provided, re-parse (only first sheet / CSV data) and update student list
            if (req.file) {
                const [allStudents] = await pool.query("SELECT id, name, email FROM users WHERE role = 'student'");
                const { emailToId, nameToId } = buildStudentMaps(allStudents);

                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                const { matched } = matchStudentsFromRows(rows, allStudents, emailToId, nameToId);

                await pool.query(
                    'UPDATE student_batches SET batch_name = COALESCE(?, batch_name), student_ids = ?, student_count = ?, source_filename = ? WHERE id = ?',
                    [batch_name?.trim() || null, JSON.stringify(matched), matched.length, req.file.originalname, id]
                );
                return res.json({ success: true, matched: matched.length });
            }

            // Only update name
            if (batch_name) {
                await pool.query('UPDATE student_batches SET batch_name = ? WHERE id = ?', [batch_name.trim(), id]);
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ─── DELETE /api/batches/:id ──────────────────────────────────────────
    router.delete('/batches/:id', authenticate, authorize('admin'), async (req, res) => {
        try {
            await pool.query('DELETE FROM student_batches WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ─── GET /api/batches/:id — single batch detail ──────────────────────
    router.get('/batches/:id', authenticate, authorize('admin'), async (req, res) => {
        try {
            const [[batch]] = await pool.query('SELECT * FROM student_batches WHERE id = ?', [req.params.id]);
            if (!batch) return res.status(404).json({ error: 'Batch not found' });

            let studentIds = batch.student_ids;
            if (typeof studentIds === 'string') {
                try { studentIds = JSON.parse(studentIds); } catch { studentIds = []; }
            }
            if (!Array.isArray(studentIds)) studentIds = [];

            let students = [];
            if (studentIds.length > 0) {
                const placeholders = studentIds.map(() => '?').join(',');
                const [rows] = await pool.query(
                    `SELECT id, name, email FROM users WHERE id IN (${placeholders})`,
                    studentIds
                );
                students = rows;
            }

            res.json({
                success: true,
                batch: { ...batch, student_ids: studentIds, students }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
