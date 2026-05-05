/**
 * Smart Study — syllabus upload, AI topic extraction, notes generation,
 * test generation, grading with weak-area detection and YouTube links.
 *
 *   POST /study/upload                          — multipart upload (PDF/image/text)
 *   GET  /study/syllabi                         — list student's syllabi
 *   GET  /study/syllabi/:id                     — syllabus + units + topics
 *   POST /study/syllabi/:id/topics/:tid/notes   — generate notes for a topic
 *   GET  /study/syllabi/:id/topics/:tid/notes   — poll notes status
 *   POST /study/test/generate                   — generate MCQ test for selected topics
 *   POST /study/test/:testId/submit             — submit answers → score + recommendations
 *   DELETE /study/syllabi/:id                   — delete a syllabus
 */
const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const { llmJson, llmChat } = require('../../services/vp/llm_router');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

module.exports = function syllabusRoutes(pool, authenticate) {
    const router = express.Router();

    // ── helpers ──────────────────────────────────────────────────────────────
    function parseJson(v) {
        if (!v) return null;
        if (typeof v === 'object') return v;
        try { return JSON.parse(v); } catch { return null; }
    }

    /**
     * Parse the `notes` column as a per-difficulty map:
     *   { easy: { status, content }, medium: { status, content }, hard: { status, content } }
     * Handles legacy plain-text notes (treated as medium→ready).
     */
    function parseNotesMap(raw) {
        if (!raw) return {};
        if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
        try {
            const p = JSON.parse(raw);
            if (p && typeof p === 'object' && !Array.isArray(p)) return p;
        } catch {}
        // Legacy: plain text stored directly — expose as medium/ready
        return { medium: { status: 'ready', content: String(raw) } };
    }

    function mergeWavBase64(b64Array) {
        if (!b64Array || !b64Array.length) return '';
        if (b64Array.length === 1) return b64Array[0];
        const bufs = b64Array.map(b => Buffer.from(b, 'base64'));
        const pcmChunks = bufs.map(buf => {
            for (let i = 0; i < buf.length - 8; i++) {
                if (buf.toString('ascii', i, i + 4) === 'data') return buf.slice(i + 8);
            }
            return buf.slice(44);
        });
        const totalPcm = pcmChunks.reduce((s, c) => s + c.length, 0);
        const out = Buffer.alloc(44 + totalPcm);
        bufs[0].copy(out, 0, 0, 44);
        out.writeUInt32LE(36 + totalPcm, 4);
        out.writeUInt32LE(totalPcm, 40);
        let off = 44;
        for (const pcm of pcmChunks) { pcm.copy(out, off); off += pcm.length; }
        return out.toString('base64');
    }

    const EXPLAIN_LANG_NAMES = {
        'en-IN': 'English', 'hi-IN': 'Hindi', 'ta-IN': 'Tamil',
        'te-IN': 'Telugu', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam',
        'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'mr-IN': 'Marathi'
    };

    async function extractText(file) {
        const mime = file.mimetype || '';
        if (mime === 'application/pdf') {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(file.buffer);
            return data.text || '';
        }
        if (mime.startsWith('image/')) {
            // Use vision-capable LLM call (Groq llama-vision / NVIDIA)
            const base64 = file.buffer.toString('base64');
            const result = await llmChat({
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract ALL text visible in this syllabus image. List every unit, chapter, topic and subtopic you can see.' },
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
                    ]
                }],
                maxTokens: 2000
            });
            return result.text || '';
        }
        // Plain text / DOCX fallback — read as UTF-8
        return file.buffer.toString('utf-8');
    }

    async function parseIntroUnits(rawText, title, subject) {
        const result = await llmJson({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert syllabus parser. Extract the unit/chapter structure from the given text. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: `Parse this syllabus into units and topics. Return JSON in this EXACT format (no markdown, no extra text):
{
  "units": [
    {
      "unit_number": 1,
      "title": "Unit 1 title",
      "topics": ["Topic A", "Topic B", "Topic C"]
    }
  ]
}

Syllabus title: ${title}
Subject: ${subject || 'General'}

Syllabus text:
${rawText.slice(0, 8000)}`
                }
            ],
            maxTokens: 2500,
            temperature: 0.2
        });
        return result.json;
    }

    // ── POST /study/upload ────────────────────────────────────────────────────
    router.post('/study/upload', authenticate, upload.single('file'), async (req, res) => {
        const sid   = String(req.user.id);
        const title   = (req.body.title || '').trim();
        const subject = (req.body.subject || '').trim();

        if (!req.file)  return res.status(400).json({ error: 'File is required' });
        if (!title)     return res.status(400).json({ error: 'Title is required' });

        const id = uuidv4();
        try {
            await pool.query(
                'INSERT INTO vp_syllabi (id, student_id, title, subject, status) VALUES (?,?,?,?,?)',
                [id, sid, title, subject, 'processing']
            );
            res.json({ ok: true, id, status: 'processing' });

            // Background: extract text → parse → store units/topics
            const fileBuffer = req.file.buffer;
            const fileMime   = req.file.mimetype;
            setImmediate(async () => {
                try {
                    const rawText = await extractText({ buffer: fileBuffer, mimetype: fileMime });
                    if (!rawText.trim()) throw new Error('No text could be extracted from the file');

                    await pool.query(
                        'UPDATE vp_syllabi SET raw_text=? WHERE id=?',
                        [rawText.slice(0, 60000), id]
                    );

                    const parsed = await parseIntroUnits(rawText, title, subject);
                    if (!parsed?.units?.length) throw new Error('Could not identify any units in the syllabus');

                    for (const unit of parsed.units) {
                        const uid = uuidv4();
                        await pool.query(
                            'INSERT INTO vp_syllabus_units (id, syllabus_id, unit_number, title) VALUES (?,?,?,?)',
                            [uid, id, Number(unit.unit_number) || 1, String(unit.title || 'Unit').slice(0, 255)]
                        );
                        for (const topic of (unit.topics || [])) {
                            await pool.query(
                                'INSERT INTO vp_syllabus_topics (id, unit_id, syllabus_id, title) VALUES (?,?,?,?)',
                                [uuidv4(), uid, id, String(topic).slice(0, 255)]
                            );
                        }
                    }

                    await pool.query("UPDATE vp_syllabi SET status='ready' WHERE id=?", [id]);
                } catch (err) {
                    await pool.query(
                        "UPDATE vp_syllabi SET status='error', error_msg=? WHERE id=?",
                        [err.message.slice(0, 500), id]
                    );
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── GET /study/syllabi ───────────────────────────────────────────────────
    router.get('/study/syllabi', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                'SELECT id, title, subject, status, error_msg, created_at FROM vp_syllabi WHERE student_id=? ORDER BY created_at DESC',
                [sid]
            );
            res.json({ syllabi: rows });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── GET /study/syllabi/:id ───────────────────────────────────────────────
    router.get('/study/syllabi/:id', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [[syl]] = await pool.query(
                'SELECT id, title, subject, status, error_msg, created_at FROM vp_syllabi WHERE id=? AND student_id=?',
                [req.params.id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Not found' });

            const [units]  = await pool.query(
                'SELECT id, unit_number, title FROM vp_syllabus_units WHERE syllabus_id=? ORDER BY unit_number',
                [syl.id]
            );
            const [topics] = await pool.query(
                'SELECT id, unit_id, title, notes, notes_status FROM vp_syllabus_topics WHERE syllabus_id=? ORDER BY id',
                [syl.id]
            );

            res.json({
                ...syl,
                units: units.map(u => ({
                    ...u,
                    topics: topics.filter(t => t.unit_id === u.id)
                }))
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── DELETE /study/syllabi/:id ────────────────────────────────────────────
    router.delete('/study/syllabi/:id', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [[syl]] = await pool.query(
                'SELECT id FROM vp_syllabi WHERE id=? AND student_id=?',
                [req.params.id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Not found' });

            // Cascade manually (no FK enforcement guaranteed)
            const [units] = await pool.query('SELECT id FROM vp_syllabus_units WHERE syllabus_id=?', [syl.id]);
            for (const u of units) {
                await pool.query('DELETE FROM vp_syllabus_topics WHERE unit_id=?', [u.id]);
            }
            await pool.query('DELETE FROM vp_syllabus_units WHERE syllabus_id=?', [syl.id]);
            await pool.query('DELETE FROM vp_smart_tests WHERE syllabus_id=?', [syl.id]);
            await pool.query('DELETE FROM vp_syllabi WHERE id=?', [syl.id]);

            res.json({ ok: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── POST /study/syllabi/:id/topics/:tid/notes — generate ────────────────
    // Body: { difficulty: 'easy' | 'medium' | 'hard' }  (default: 'medium')
    router.post('/study/syllabi/:id/topics/:tid/notes', authenticate, async (req, res) => {
        const sid        = String(req.user.id);
        const difficulty = ['easy', 'medium', 'hard'].includes(req.body?.difficulty)
            ? req.body.difficulty : 'medium';
        const force = !!req.body?.force;

        try {
            const [[syl]] = await pool.query(
                'SELECT id, title, subject FROM vp_syllabi WHERE id=? AND student_id=?',
                [req.params.id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Syllabus not found' });

            const [[topic]] = await pool.query(
                'SELECT id, title, notes, notes_status FROM vp_syllabus_topics WHERE id=? AND syllabus_id=?',
                [req.params.tid, req.params.id]
            );
            if (!topic) return res.status(404).json({ error: 'Topic not found' });

            const map = parseNotesMap(topic.notes);

            // Already generated — return immediately (unless force regenerate)
            if (map[difficulty]?.status === 'ready' && !force) {
                return res.json({ ok: true, status: 'ready', difficulty, notes_map: map });
            }

            // Mark as generating for this difficulty
            map[difficulty] = { status: 'generating' };
            await pool.query(
                "UPDATE vp_syllabus_topics SET notes=?, notes_status='generating' WHERE id=?",
                [JSON.stringify(map), topic.id]
            );
            res.json({ ok: true, status: 'generating', difficulty });

            // ── background generation ───────────────────────────────────────
            const PROMPTS = {
                easy: `Generate SIMPLE, BEGINNER-FRIENDLY study notes for the topic: "${topic.title}"
Subject / Course: ${syl.subject || syl.title}

TARGET LENGTH: Exactly 1 A4 page (approximately 500-600 words total). Be concise — do not exceed this length.

Write at a basic, introductory level suitable for complete beginners. Use plain language, real-world analogies, and avoid jargon.

Structure your notes as:

📌 OVERVIEW
(2-3 plain-English sentences explaining what this topic is about)

🔑 KEY IDEAS
(4-5 simple bullet points — the most important things to remember)

💡 SIMPLE ANALOGY
(A relatable real-world comparison that makes this easy to understand)

📝 BASIC DEFINITIONS
(Define the 3-5 most important terms in very simple words)

✅ REMEMBER THIS
(3 short memory tips or mnemonics to help recall)

Keep it short, friendly, and accessible for a beginner. Stop at 1 page.`,

                medium: `Generate COMPREHENSIVE, EXAM-READY study notes for the topic: "${topic.title}"
Subject / Course: ${syl.subject || syl.title}

TARGET LENGTH: 3 to 4 A4 pages (approximately 1500-2400 words total). Be thorough and detailed to fill this length.

Structure your notes as:

📌 OVERVIEW
(Clear 4-5 sentence introduction covering the full scope of the topic)

🔑 KEY CONCEPTS
(All core concepts in well-organized bullet points with explanations — cover thoroughly)

📐 IMPORTANT FORMULAS & DEFINITIONS
(All relevant formulas, equations, and precise definitions with context and explanation)

🔬 WORKED EXAMPLES
(3-4 step-by-step solved examples showing application with detailed steps)

❓ COMMON EXAM QUESTIONS
(6-8 typical exam questions students should be able to answer)

💡 QUICK REVISION TIPS
(6-8 memory tricks, shortcuts, and strategies for the exam)

Make it thorough, accurate, and exam-focused. Aim for 3-4 full pages of content.`,

                hard: `Generate ADVANCED, IN-DEPTH study notes for the topic: "${topic.title}"
Subject / Course: ${syl.subject || syl.title}

TARGET LENGTH: 5 to 6 A4 pages (approximately 2500-3600 words total). Be exhaustive and comprehensive to fill this length.

Write at an advanced level suitable for competitive exams and deep mastery of the subject.

Structure your notes as:

📌 ADVANCED OVERVIEW
(Precise, comprehensive introduction covering the full theoretical scope — 5-6 sentences)

🔑 CORE CONCEPTS & THEORY
(Complete theoretical framework with in-depth explanations, derivations and proofs where applicable — cover every sub-concept)

📐 FORMULAS, THEOREMS & PROOFS
(All formulas with full derivations, edge cases, special conditions, exceptions, and worked proofs)

⚡ ADVANCED APPLICATIONS
(4-5 complex real-world applications, non-trivial scenarios, and advanced use cases with detailed explanation)

🔬 DETAILED WORKED EXAMPLES
(3-4 complex step-by-step solved examples with thorough explanation of each step)

🧠 HIGHER-ORDER THINKING QUESTIONS
(8-10 complex analysis, synthesis, and evaluation level questions with brief answer outlines)

🔗 CONNECTIONS & DEPENDENCIES
(How this topic interconnects with other advanced topics in the subject — detailed mapping)

💡 EXPERT INSIGHTS & PITFALLS
(Subtle points students often miss, common mistakes, misconceptions, and expert-level tips — be comprehensive)

Make it rigorous, exhaustive, and suitable for advanced competitive exam preparation. Aim for 5-6 full pages of content.`
            };

            setImmediate(async () => {
                try {
                    const result = await llmChat({
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert tutor. Generate well-structured, detailed study notes with clear headings and formatting.'
                            },
                            { role: 'user', content: PROMPTS[difficulty] }
                        ],
                        maxTokens: difficulty === 'hard' ? 5000 : difficulty === 'medium' ? 3200 : 900,
                        temperature: 0.35
                    });

                    // Re-read to avoid overwriting concurrent generations
                    const [[fresh]] = await pool.query(
                        'SELECT notes FROM vp_syllabus_topics WHERE id=?', [topic.id]
                    );
                    const freshMap = parseNotesMap(fresh?.notes || null);
                    freshMap[difficulty] = { status: 'ready', content: result.text };

                    const overallStatus = Object.values(freshMap).some(v => v.status === 'ready')
                        ? 'ready' : 'generating';

                    await pool.query(
                        'UPDATE vp_syllabus_topics SET notes=?, notes_status=? WHERE id=?',
                        [JSON.stringify(freshMap), overallStatus, topic.id]
                    );
                } catch (err) {
                    const [[fresh]] = await pool.query(
                        'SELECT notes FROM vp_syllabus_topics WHERE id=?', [topic.id]
                    );
                    const freshMap = parseNotesMap(fresh?.notes || null);
                    freshMap[difficulty] = { status: 'error' };
                    await pool.query(
                        "UPDATE vp_syllabus_topics SET notes=?, notes_status='error' WHERE id=?",
                        [JSON.stringify(freshMap), topic.id]
                    );
                }
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── GET /study/syllabi/:id/topics/:tid/notes — poll ─────────────────────
    router.get('/study/syllabi/:id/topics/:tid/notes', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [[syl]] = await pool.query(
                'SELECT id FROM vp_syllabi WHERE id=? AND student_id=?',
                [req.params.id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Not found' });

            const [[topic]] = await pool.query(
                'SELECT id, title, notes, notes_status FROM vp_syllabus_topics WHERE id=? AND syllabus_id=?',
                [req.params.tid, req.params.id]
            );
            if (!topic) return res.status(404).json({ error: 'Topic not found' });

            const notes_map = parseNotesMap(topic.notes);
            res.json({ ...topic, notes_map });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── POST /study/syllabi/:id/topics/:tid/notes/explain ────────────────────
    // Generates a conversational audio explanation of the notes using LLM + Sarvam TTS
    router.post('/study/syllabi/:id/topics/:tid/notes/explain', authenticate, async (req, res) => {
        const sid        = String(req.user.id);
        const difficulty = ['easy','medium','hard'].includes(req.body?.difficulty) ? req.body.difficulty : 'medium';
        const language   = req.body?.language || 'en-IN';

        try {
            const [[syl]] = await pool.query(
                'SELECT id, title, subject FROM vp_syllabi WHERE id=? AND student_id=?',
                [req.params.id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Syllabus not found' });

            const [[topic]] = await pool.query(
                'SELECT id, title, notes FROM vp_syllabus_topics WHERE id=? AND syllabus_id=?',
                [req.params.tid, req.params.id]
            );
            if (!topic) return res.status(404).json({ error: 'Topic not found' });

            const map      = parseNotesMap(topic.notes);
            const noteData = map[difficulty];
            if (!noteData?.content) return res.status(400).json({ error: 'Notes not ready. Generate notes first.' });

            const langName = EXPLAIN_LANG_NAMES[language] || 'English';
            const diffLabel = difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced';

            // ── LLM: generate conversational explanation ───────────────────
            const { text: explanationText } = await llmChat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an enthusiastic, friendly tutor. Always respond ONLY in ${langName}. Speak naturally as if talking face-to-face to a ${diffLabel}-level student.`
                    },
                    {
                        role: 'user',
                        content: `Using these study notes about "${topic.title}" (${syl.subject || syl.title}):\n\n${noteData.content}\n\nCreate a natural spoken explanation that:\n- Sounds like a real teacher talking, NOT reading notes\n- Uses simple language, real-world analogies, and stories\n- Flows naturally from one idea to the next\n- Highlights the 3-4 most important concepts\n- Is 300-450 words (2-3 minutes when spoken)\n\nIMPORTANT: Write ONLY in ${langName}. No bullet points, no headers, no asterisks — only flowing paragraphs.`
                    }
                ],
                maxTokens: 700,
                temperature: 0.72
            });

            // ── TTS: split into ≤1400-char chunks, call Sarvam ────────────
            const sarvam = require('../../services/vp/sarvam');
            const chunks  = [];
            const sents   = explanationText.split(/(?<=[।.!?])\s+/);
            let   cur     = '';
            for (const s of sents) {
                if ((cur + ' ' + s).trim().length > 1400) { if (cur.trim()) chunks.push(cur.trim()); cur = s; }
                else cur = cur ? cur + ' ' + s : s;
            }
            if (cur.trim()) chunks.push(cur.trim());

            const audioB64s = [];
            for (const chunk of chunks) {
                const { audioBase64 } = await sarvam.ttsToBase64(chunk, language);
                if (audioBase64) audioB64s.push(audioBase64);
            }

            const mergedAudio = mergeWavBase64(audioB64s);

            res.json({
                ok: true,
                explanation_text: explanationText,
                audio_b64:        mergedAudio || '',
                audio_mime:       'audio/wav',
                tts_available:    !!mergedAudio,
                language
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── POST /study/test/generate ────────────────────────────────────────────
    router.post('/study/test/generate', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { syllabus_id, topic_ids, num_questions = 10 } = req.body || {};

        if (!syllabus_id || !Array.isArray(topic_ids) || !topic_ids.length) {
            return res.status(400).json({ error: 'syllabus_id and topic_ids[] required' });
        }

        try {
            const [[syl]] = await pool.query(
                'SELECT id, title, subject FROM vp_syllabi WHERE id=? AND student_id=?',
                [syllabus_id, sid]
            );
            if (!syl) return res.status(404).json({ error: 'Syllabus not found' });

            const ph = topic_ids.map(() => '?').join(',');
            const [topics] = await pool.query(
                `SELECT id, title FROM vp_syllabus_topics WHERE id IN (${ph}) AND syllabus_id=?`,
                [...topic_ids, syllabus_id]
            );
            if (!topics.length) return res.status(400).json({ error: 'No valid topics found' });

            const topicList  = topics.map(t => `"${t.title}"`).join(', ');
            const topicIndex = topics.map(t => `${t.id}: ${t.title}`).join('\n');
            const n = Math.min(Number(num_questions) || 10, 20);

            const result = await llmJson({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert exam paper setter. Generate multiple-choice questions. Return ONLY valid JSON, no markdown.'
                    },
                    {
                        role: 'user',
                        content: `Generate exactly ${n} multiple choice questions covering these topics:
${topicList}

Subject: ${syl.subject || syl.title}

Topic ID reference:
${topicIndex}

Return JSON in this EXACT format:
{
  "questions": [
    {
      "id": 1,
      "topic_id": "<exact topic id from the reference above>",
      "topic": "<topic name>",
      "question": "Full question text?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "answer": "A",
      "explanation": "Why this answer is correct"
    }
  ]
}

Rules:
- Each question must have EXACTLY 4 options prefixed A) B) C) D)
- "answer" must be A, B, C, or D
- Mix easy, medium, and hard questions
- Cover all selected topics as evenly as possible`
                    }
                ],
                maxTokens: 4000,
                temperature: 0.45
            });

            const parsed = result.json;
            if (!Array.isArray(parsed?.questions) || !parsed.questions.length) {
                return res.status(500).json({ error: 'LLM did not return valid questions' });
            }

            const testId = uuidv4();
            await pool.query(
                'INSERT INTO vp_smart_tests (id, syllabus_id, student_id, topic_ids, questions) VALUES (?,?,?,?,?)',
                [testId, syllabus_id, sid, JSON.stringify(topic_ids), JSON.stringify(parsed.questions)]
            );

            // Strip answers before sending to student
            const forStudent = parsed.questions.map(q => ({
                id: q.id,
                topic_id: q.topic_id,
                topic: q.topic,
                question: q.question,
                options: q.options
            }));

            res.json({ ok: true, test_id: testId, questions: forStudent, total: forStudent.length });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── POST /study/test/:testId/submit ──────────────────────────────────────
    router.post('/study/test/:testId/submit', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { answers } = req.body || {}; // { "1": "A", "2": "C", ... }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'answers object required' });
        }

        try {
            const [[test]] = await pool.query(
                'SELECT id, syllabus_id, questions FROM vp_smart_tests WHERE id=? AND student_id=?',
                [req.params.testId, sid]
            );
            if (!test) return res.status(404).json({ error: 'Test not found' });

            const questions = parseJson(test.questions) || [];

            // Grade every question
            let score = 0;
            const topicStats = {};
            const gradedQuestions = questions.map(q => {
                const given   = String(answers[String(q.id)] || '').toUpperCase().trim();
                const correct = String(q.answer || '').toUpperCase().trim();
                const isRight = given === correct && given !== '';

                if (!topicStats[q.topic_id]) {
                    topicStats[q.topic_id] = { topic_id: q.topic_id, topic: q.topic, correct: 0, total: 0 };
                }
                topicStats[q.topic_id].total++;
                if (isRight) { score++; topicStats[q.topic_id].correct++; }

                return { ...q, student_answer: given, is_correct: isRight };
            });

            // Weak = below 50% in that topic
            const weakTopics = Object.values(topicStats).filter(t => t.correct / t.total < 0.5);

            // Build YouTube recommendations
            const [[syl]] = await pool.query(
                'SELECT title, subject FROM vp_syllabi WHERE id=?',
                [test.syllabus_id]
            );
            const subjectStr = (syl?.subject || syl?.title || 'General').trim();

            const recommendations = weakTopics.map(t => ({
                topic_id:       t.topic_id,
                topic:          t.topic,
                score_pct:      Math.round((t.correct / t.total) * 100),
                youtube_url:    `https://www.youtube.com/results?search_query=${encodeURIComponent(t.topic + ' ' + subjectStr + ' explained')}`,
                search_query:   `${t.topic} ${subjectStr} explained`
            }));

            // LLM-enhanced suggestions for weak topics
            if (weakTopics.length) {
                try {
                    const rec = await llmJson({
                        messages: [{
                            role: 'user',
                            content: `A student scored poorly on these topics: ${weakTopics.map(t => t.topic).join(', ')} (subject: ${subjectStr}).
For each topic suggest one specific YouTube search query to find the best tutorial video.
Return JSON: {"suggestions": [{"topic": "<name>", "query": "<youtube search query>"}]}`
                        }],
                        maxTokens: 400,
                        temperature: 0.3
                    });
                    const suggestions = rec.json?.suggestions || [];
                    recommendations.forEach(r => {
                        const match = suggestions.find(s => s.topic?.toLowerCase().includes(r.topic?.toLowerCase().split(' ')[0]?.toLowerCase()));
                        if (match?.query) {
                            r.youtube_url  = `https://www.youtube.com/results?search_query=${encodeURIComponent(match.query)}`;
                            r.search_query = match.query;
                        }
                    });
                } catch { /* keep defaults */ }
            }

            const attemptId = uuidv4();
            await pool.query(
                'INSERT INTO vp_smart_attempts (id, test_id, student_id, answers, score, total, weak_topics, recommendations) VALUES (?,?,?,?,?,?,?,?)',
                [attemptId, test.id, sid, JSON.stringify(answers), score, questions.length,
                    JSON.stringify(weakTopics), JSON.stringify(recommendations)]
            );

            res.json({
                ok:             true,
                attempt_id:     attemptId,
                score,
                total:          questions.length,
                pct:            Math.round((score / questions.length) * 100),
                graded:         gradedQuestions,
                topic_stats:    Object.values(topicStats),
                weak_topics:    weakTopics,
                recommendations
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
