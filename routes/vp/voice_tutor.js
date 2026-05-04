/**
 * AI Voice Tutor — text + voice chat with the LLM router.
 *
 *   POST /api/vp/voice-tutor/text         — { question, lang, lesson_id? } -> { answer }
 *   POST /api/vp/voice-tutor/voice        — multipart audio + form fields  -> { transcript, answer, audio_b64? }
 *   GET  /api/vp/voice-tutor/history      — recent interactions for the user
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const llm = require('../../services/vp/llm_router');
const sarvam = require('../../services/vp/sarvam');
const culture = require('../../services/vp/cultural_injector');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const LANG_NAME = { en: 'English', hi: 'Hindi', ta: 'Tamil' };

function buildSystemPrompt(lang = 'en', lessonContext) {
    const langName = LANG_NAME[lang] || 'English';
    const ctx = lessonContext ? `\n\nCurrent lesson context:\n${String(lessonContext).slice(0, 1500)}` : '';
    return (
        `You are a structured CBSE/State-board academic tutor for school students (Class 8-12). ` +
        `Explain step by step using precise academic language. Avoid informal analogies. ` +
        `When solving a problem, show numbered steps and the final answer. ` +
        `Keep answers concise (under 220 words) unless the student asks for more depth. ` +
        `Reply in ${langName}.${ctx}`
    );
}

async function getLessonContext(pool, lessonId, lang = 'en') {
    if (!lessonId) return null;
    try {
        const [rows] = await pool.query('SELECT title, body_i18n FROM vp_lessons WHERE id = ?', [lessonId]);
        const r = rows[0];
        if (!r) return null;
        let body = r.body_i18n;
        try { body = typeof body === 'string' ? JSON.parse(body) : body; } catch { /* ignore */ }
        const text = body?.[lang] || body?.en || Object.values(body || {})[0] || '';
        return `${r.title}\n\n${String(text).slice(0, 1200)}`;
    } catch { return null; }
}

module.exports = function voiceTutorRoutes(pool, authenticate) {
    const router = express.Router();

    router.post('/voice-tutor/text', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const { question, lang = 'en', lesson_id = null } = req.body || {};
        if (!question || !String(question).trim()) {
            return res.status(400).json({ error: 'question required' });
        }
        try {
            const ctx = await getLessonContext(pool, lesson_id, lang);
            const out = await llm.llmChat({
                messages: [
                    { role: 'system', content: buildSystemPrompt(lang, ctx) },
                    { role: 'user', content: String(question) }
                ],
                temperature: 0.3,
                maxTokens: 700,
                cacheKey: `vp-tutor:${sid}:${lang}:${lesson_id || ''}:${String(question).slice(0, 80)}`
            });
            const answer = culture.inject(out.text || '');

            await pool.query(
                `INSERT INTO vp_voice_queries (id, student_id, lesson_id, mode, lang, question, answer, provider)
                 VALUES (?,?,?,?,?,?,?,?)`,
                [uuidv4(), sid, lesson_id || null, 'text', lang, String(question).slice(0, 4000), answer.slice(0, 8000), out.provider]
            );
            await pool.query('UPDATE vp_user_prefs SET xp_points = xp_points + 2 WHERE student_id = ?', [sid]);

            res.json({ answer, provider: out.provider });
        } catch (err) {
            console.error('[vp] tutor text:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/voice-tutor/voice', authenticate, upload.single('audio'), async (req, res) => {
        const sid = String(req.user.id);
        const lang = String(req.body?.lang || 'en');
        const lessonId = req.body?.lesson_id || null;
        const speakBack = req.body?.speak_back !== 'false';
        if (!req.file) return res.status(400).json({ error: 'audio file required' });

        try {
            // 1. STT
            const stt = await sarvam.sttFromBuffer(req.file.buffer, req.file.mimetype, lang);
            const transcript = (stt.text || '').trim();
            if (!transcript) {
                return res.json({ transcript: '', answer: 'I could not hear anything. Please try again.', audio_b64: '' });
            }

            // 2. LLM
            const ctx = await getLessonContext(pool, lessonId, lang);
            const out = await llm.llmChat({
                messages: [
                    { role: 'system', content: buildSystemPrompt(lang, ctx) },
                    { role: 'user', content: transcript }
                ],
                temperature: 0.3,
                maxTokens: 600
            });
            const answer = culture.inject(out.text || '');

            // 3. TTS (best-effort)
            let tts = { audioBase64: '', mimeType: 'audio/wav', provider: 'none' };
            if (speakBack) {
                tts = await sarvam.ttsToBase64(answer, lang);
            }

            await pool.query(
                `INSERT INTO vp_voice_queries (id, student_id, lesson_id, mode, lang, question, answer, provider)
                 VALUES (?,?,?,?,?,?,?,?)`,
                [uuidv4(), sid, lessonId || null, 'voice', lang, transcript.slice(0, 4000), answer.slice(0, 8000), out.provider]
            );
            await pool.query('UPDATE vp_user_prefs SET xp_points = xp_points + 2 WHERE student_id = ?', [sid]);

            res.json({
                transcript,
                answer,
                provider: out.provider,
                stt_provider: stt.provider,
                tts_provider: tts.provider,
                audio_b64: tts.audioBase64,
                audio_mime: tts.mimeType
            });
        } catch (err) {
            console.error('[vp] tutor voice:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/voice-tutor/history', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT id, lesson_id, mode, lang, question, answer, provider, created_at
                 FROM vp_voice_queries WHERE student_id = ?
                 ORDER BY created_at DESC LIMIT 50`,
                [sid]
            );
            res.json({ items: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
