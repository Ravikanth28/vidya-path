/**
 * Sarvam AI client — STT (saarika v2) and TTS (bulbul v2).
 * Falls back to Groq Whisper for STT if Sarvam is not configured.
 *
 * Public API:
 *   sttFromBuffer(buffer, mimeType, langCode)  -> { text, lang, provider }
 *   ttsToBase64(text, langCode, speaker)       -> { audioBase64, mimeType, provider }
 */
const axios = require('axios');
const FormDataNode = typeof FormData !== 'undefined' ? FormData : require('form-data');

const SARVAM_KEY = process.env.SARVAM_API_KEY || process.env.SARVAM_API_KEY_1 || process.env.SARVAM_API_KEY_2;
const SARVAM_BASE = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';
const GROQ_KEY = process.env.GROQ_API_KEY;

const LANG_TO_BCP47 = {
    en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN',
    bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
    mr: 'mr-IN', or: 'or-IN', pa: 'pa-IN', te: 'te-IN', ur: 'ur-IN'
};

function toBcp47(lang) {
    if (!lang) return 'en-IN';
    if (lang.includes('-')) return lang;
    return LANG_TO_BCP47[lang] || 'en-IN';
}

async function sttSarvam(buffer, mimeType, langCode) {
    if (!SARVAM_KEY) throw new Error('sarvam: not configured');
    const form = new FormDataNode();
    if (typeof Blob !== 'undefined') {
        form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'speech.webm');
    } else {
        form.append('file', buffer, { filename: 'speech.webm', contentType: mimeType || 'audio/webm' });
    }
    form.append('model', process.env.SARVAM_STT_MODEL || 'saarika:v2');
    form.append('language_code', toBcp47(langCode));

    const headers = typeof form.getHeaders === 'function'
        ? { ...form.getHeaders(), 'api-subscription-key': SARVAM_KEY }
        : { 'api-subscription-key': SARVAM_KEY };

    const { data } = await axios.post(`${SARVAM_BASE}/speech-to-text`, form, {
        headers,
        timeout: 30_000,
        maxBodyLength: 25 * 1024 * 1024
    });
    return {
        text: data?.transcript || data?.text || '',
        lang: data?.language_code || toBcp47(langCode),
        provider: 'sarvam'
    };
}

async function sttGroqWhisper(buffer, mimeType) {
    if (!GROQ_KEY) throw new Error('groq-whisper: not configured');
    const form = new FormDataNode();
    if (typeof Blob !== 'undefined') {
        form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'speech.webm');
    } else {
        form.append('file', buffer, { filename: 'speech.webm', contentType: mimeType || 'audio/webm' });
    }
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'json');

    const headers = typeof form.getHeaders === 'function'
        ? { ...form.getHeaders(), Authorization: `Bearer ${GROQ_KEY}` }
        : { Authorization: `Bearer ${GROQ_KEY}` };

    const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
        headers,
        timeout: 30_000,
        maxBodyLength: 25 * 1024 * 1024
    });
    return { text: data?.text || '', lang: 'en-IN', provider: 'groq-whisper' };
}

async function sttFromBuffer(buffer, mimeType, langCode = 'en') {
    if (!buffer || !buffer.length) throw new Error('sttFromBuffer: empty buffer');
    if (SARVAM_KEY) {
        try { return await sttSarvam(buffer, mimeType, langCode); } catch { /* fall through */ }
    }
    if (GROQ_KEY) {
        try { return await sttGroqWhisper(buffer, mimeType); } catch { /* fall through */ }
    }
    return { text: '', lang: toBcp47(langCode), provider: 'none' };
}

async function ttsToBase64(text, langCode = 'en', speaker) {
    if (!text || !text.trim()) return { audioBase64: '', mimeType: 'audio/wav', provider: 'none' };
    if (!SARVAM_KEY) {
        return { audioBase64: '', mimeType: 'audio/wav', provider: 'none' };
    }

    const truncated  = String(text).slice(0, 1500);
    const langBcp47  = toBcp47(langCode);
    const useSpeaker = speaker || process.env.SARVAM_TTS_SPEAKER || 'shubh';
    const useModel   = process.env.SARVAM_TTS_MODEL || 'bulbul:v3';
    const headers    = { 'api-subscription-key': SARVAM_KEY, 'Content-Type': 'application/json' };

    // ── Try bulbul:v3 format (text field, no inputs array) ─────────────────
    try {
        const body = {
            text: truncated,
            target_language_code: langBcp47,
            speaker: useSpeaker,
            model: useModel,
            enable_preprocessing: true
        };
        const { data } = await axios.post(`${SARVAM_BASE}/text-to-speech`, body, {
            headers,
            timeout: 30_000
        });
        // v3 response may use audios[], audio, or audio_content
        const b64 =
            (Array.isArray(data?.audios)        ? data.audios[0]        : null) ||
            (typeof data?.audio === 'string'    ? data.audio            : null) ||
            (typeof data?.audio_content === 'string' ? data.audio_content : null) ||
            '';
        if (b64) return { audioBase64: b64, mimeType: 'audio/wav', provider: 'sarvam' };
    } catch { /* fall through to v2 format */ }

    // ── Fallback: bulbul:v2 format (inputs array) ───────────────────────────
    try {
        const body = {
            inputs: [truncated],
            target_language_code: langBcp47,
            speaker: useSpeaker,
            model: 'bulbul:v2',
            speech_sample_rate: 22050,
            enable_preprocessing: true
        };
        const { data } = await axios.post(`${SARVAM_BASE}/text-to-speech`, body, {
            headers,
            timeout: 30_000
        });
        const b64 = (Array.isArray(data?.audios) ? data.audios[0] : null) || '';
        if (b64) return { audioBase64: b64, mimeType: 'audio/wav', provider: 'sarvam-v2' };
    } catch { /* fall through */ }

    return { audioBase64: '', mimeType: 'audio/wav', provider: 'none' };
}

module.exports = { sttFromBuffer, ttsToBase64, toBcp47 };
