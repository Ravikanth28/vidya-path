const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

module.exports = function (pool, authenticate) {
    const router = express.Router();

    const uploadDir = path.join(process.cwd(), 'uploads', 'teacher_notes');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) =>
            cb(null, `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`)
    });
    const upload = multer({
        storage,
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
                             '.txt', '.png', '.jpg', '.jpeg', '.zip'];
            cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
        }
    });

    // ── POST /study/teacher-notes — teacher uploads a note ─────────────────
    router.post('/study/teacher-notes', authenticate, upload.single('file'), async (req, res) => {
        if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only teachers can upload notes' });
        }
        const { title, description, subject, batch } = req.body;
        if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
        if (!req.file)      return res.status(400).json({ error: 'File is required' });

        const id = uuidv4();
        try {
            await pool.query(
                `INSERT INTO vp_teacher_notes
                    (id, teacher_id, teacher_name, title, description, subject, batch,
                     file_name, original_name, file_type, file_size)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, req.user.id, req.user.name,
                 title.trim(), description?.trim() || '', subject?.trim() || '',
                 batch?.trim() || '', req.file.filename, req.file.originalname,
                 req.file.mimetype, req.file.size]
            );
            res.json({ ok: true, id });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── GET /study/teacher-notes — list notes ───────────────────────────────
    // Mentor: sees own uploads. Student: sees from their assigned mentor + all admins.
    router.get('/study/teacher-notes', authenticate, async (req, res) => {
        try {
            if (req.user.role === 'admin') {
                const [rows] = await pool.query(
                    `SELECT id, teacher_id, teacher_name, title, description, subject, batch,
                            original_name, file_type, file_size, created_at
                     FROM vp_teacher_notes ORDER BY created_at DESC`
                );
                return res.json({ notes: rows });
            }
            if (req.user.role === 'mentor') {
                const [rows] = await pool.query(
                    `SELECT id, teacher_name, title, description, subject, batch,
                            original_name, file_type, file_size, created_at
                     FROM vp_teacher_notes WHERE teacher_id=? ORDER BY created_at DESC`,
                    [req.user.id]
                );
                return res.json({ notes: rows });
            }

            // Student: resolve mentor and batch
            const [[user]] = await pool.query(
                'SELECT mentor_id, batch FROM users WHERE id=?', [req.user.id]
            );
            const batch = user?.batch || '';
            const mentorId = user?.mentor_id || null;

            // Show notes from: (a) assigned mentor filtered by batch, OR (b) any admin (filtered by batch)
            const [rows] = await pool.query(
                `SELECT n.id, n.teacher_name, n.title, n.description, n.subject, n.batch,
                        n.original_name, n.file_type, n.file_size, n.created_at
                 FROM vp_teacher_notes n
                 LEFT JOIN users u ON n.teacher_id = u.id
                 WHERE (
                     (? IS NOT NULL AND n.teacher_id = ? AND (n.batch IS NULL OR n.batch = '' OR n.batch = ?))
                     OR
                     (u.role = 'admin' AND (n.batch IS NULL OR n.batch = '' OR n.batch = ?))
                 )
                 ORDER BY n.created_at DESC`,
                [mentorId, mentorId, batch, batch]
            );
            res.json({ notes: rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── GET /study/teacher-notes/:id/download ──────────────────────────────
    router.get('/study/teacher-notes/:id/download', authenticate, async (req, res) => {
        try {
            const [[note]] = await pool.query(
                'SELECT * FROM vp_teacher_notes WHERE id=?', [req.params.id]
            );
            if (!note) return res.status(404).json({ error: 'Note not found' });

            if (req.user.role === 'student') {
                const [[user]] = await pool.query(
                    'SELECT mentor_id, batch FROM users WHERE id=?', [req.user.id]
                );
                // Check if uploader is admin — admin notes are accessible to all students (batch filtered)
                const [[uploader]] = await pool.query('SELECT role FROM users WHERE id=?', [note.teacher_id]);
                const isAdminNote = uploader?.role === 'admin';

                if (!isAdminNote) {
                    if (note.teacher_id !== user?.mentor_id)
                        return res.status(403).json({ error: 'Access denied' });
                }
                // Batch filter applies to both mentor and admin notes when batch is set
                if (note.batch && note.batch !== '' && user?.batch && note.batch !== user.batch)
                    return res.status(403).json({ error: 'Access denied' });
            }

            const filePath = path.join(uploadDir, note.file_name);
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

            res.download(filePath, note.original_name);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── DELETE /study/teacher-notes/:id ────────────────────────────────────
    router.delete('/study/teacher-notes/:id', authenticate, async (req, res) => {
        try {
            const isAdmin = req.user.role === 'admin';
            const [[note]] = await pool.query(
                isAdmin
                    ? 'SELECT * FROM vp_teacher_notes WHERE id=?'
                    : 'SELECT * FROM vp_teacher_notes WHERE id=? AND teacher_id=?',
                isAdmin ? [req.params.id] : [req.params.id, req.user.id]
            );
            if (!note) return res.status(404).json({ error: 'Note not found or access denied' });

            const filePath = path.join(uploadDir, note.file_name);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            await pool.query('DELETE FROM vp_teacher_notes WHERE id=?', [req.params.id]);
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
