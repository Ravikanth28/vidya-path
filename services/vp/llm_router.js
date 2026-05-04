/**
 * VidyaPath LLM Router
 *
 * Per-request fallback chain: Cerebras -> Groq -> NVIDIA NIM -> deterministic mock.
 * - 30s backoff applied per provider on 429 / 5xx.
 * - Cerebras key rotation across CEREBRAS_API_KEY / CEREBRAS_API_KEY_1..4.
 * - Identical-prompt cache via utils/cache.js (60s window).
 *
 * Public API:
 *   llmChat({ messages, temperature, maxTokens, jsonMode, cacheKey })
 *   llmJson({ messages, ... })          // expects valid JSON, retries once
 *   evaluateShortAnswer({ question, expected, studentAnswer, rubric, lang })
 */
const axios = require('axios');
const { cacheManager } = require('../../utils/cache');

const PROVIDER_BACKOFF_MS = 30_000;
const CACHE_WINDOW_MS = 60_000;

const CEREBRAS_KEYS = [
    process.env.CEREBRAS_API_KEY,
    process.env.CEREBRAS_API_KEY_1,
    process.env.CEREBRAS_API_KEY_2,
    process.env.CEREBRAS_API_KEY_3,
    process.env.CEREBRAS_API_KEY_4
].filter(Boolean);

const GROQ_KEY = process.env.GROQ_API_KEY;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || process.env.NVIDIA_NIM_API_KEY;

const PROVIDER_STATE = {
    cerebras: { backoffUntil: 0, keyIndex: 0 },
    groq: { backoffUntil: 0 },
    nvidia: { backoffUntil: 0 }
};

function nowMs() { return Date.now(); }
function inBackoff(state) { return state.backoffUntil > nowMs(); }
function trip(state, ms = PROVIDER_BACKOFF_MS) { state.backoffUntil = nowMs() + ms; }
function isRateOrServer(err) {
    const s = err?.response?.status;
    return s === 429 || (s >= 500 && s < 600);
}

function buildHeaders(provider, key) {
    return {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
    };
}

async function callCerebras({ messages, temperature, maxTokens, jsonMode }) {
    if (!CEREBRAS_KEYS.length) throw new Error('cerebras: no keys');
    const state = PROVIDER_STATE.cerebras;
    if (inBackoff(state)) throw new Error('cerebras: in backoff');
    const url = 'https://api.cerebras.ai/v1/chat/completions';
    const body = {
        model: process.env.CEREBRAS_MODEL || 'llama3.3-70b',
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    let lastErr;
    for (let i = 0; i < CEREBRAS_KEYS.length; i++) {
        const idx = (state.keyIndex + i) % CEREBRAS_KEYS.length;
        const key = CEREBRAS_KEYS[idx];
        try {
            const { data } = await axios.post(url, body, {
                headers: buildHeaders('cerebras', key),
                timeout: 30_000
            });
            state.keyIndex = (idx + 1) % CEREBRAS_KEYS.length;
            const text = data?.choices?.[0]?.message?.content || '';
            return { provider: 'cerebras', text };
        } catch (err) {
            lastErr = err;
            if (!isRateOrServer(err)) break;
        }
    }
    trip(state);
    throw lastErr || new Error('cerebras: exhausted');
}

async function callGroq({ messages, temperature, maxTokens, jsonMode }) {
    if (!GROQ_KEY) throw new Error('groq: no key');
    const state = PROVIDER_STATE.groq;
    if (inBackoff(state)) throw new Error('groq: in backoff');
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    try {
        const { data } = await axios.post(url, body, {
            headers: buildHeaders('groq', GROQ_KEY),
            timeout: 30_000
        });
        const text = data?.choices?.[0]?.message?.content || '';
        return { provider: 'groq', text };
    } catch (err) {
        if (isRateOrServer(err)) trip(state);
        throw err;
    }
}

async function callNvidia({ messages, temperature, maxTokens, jsonMode }) {
    if (!NVIDIA_KEY) throw new Error('nvidia: no key');
    const state = PROVIDER_STATE.nvidia;
    if (inBackoff(state)) throw new Error('nvidia: in backoff');
    const url = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const body = {
        model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024,
        stream: false
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    try {
        const { data } = await axios.post(url, body, {
            headers: buildHeaders('nvidia', NVIDIA_KEY),
            timeout: 45_000
        });
        const text = data?.choices?.[0]?.message?.content || '';
        return { provider: 'nvidia', text };
    } catch (err) {
        if (isRateOrServer(err)) trip(state);
        throw err;
    }
}

function deterministicMock({ messages, jsonMode }) {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    if (jsonMode) {
        return { provider: 'mock', text: JSON.stringify({ ok: true, note: 'mock', echo: String(last).slice(0, 120) }) };
    }
    const stripped = String(last).split('\n').slice(0, 2).join(' ').trim();
    const reply =
        `(Offline tutor) I understand you're asking about "${stripped.slice(0, 140)}". ` +
        `Step 1: Read the lesson summary. Step 2: Identify the key concept. Step 3: Try a worked example. ` +
        `Once a provider key is configured I can answer in full.`;
    return { provider: 'mock', text: reply };
}

/**
 * Run a chat completion with provider fallback.
 * Returns { provider, text }.
 */
async function llmChat(opts = {}) {
    const { messages, temperature, maxTokens, jsonMode = false, cacheKey } = opts;
    if (!Array.isArray(messages) || !messages.length) {
        throw new Error('llmChat: messages required');
    }

    if (cacheKey) {
        const cached = cacheManager.get(`llm:${cacheKey}`);
        if (cached) return cached;
    }

    const order = [callCerebras, callGroq, callNvidia];
    let lastErr;
    for (const fn of order) {
        try {
            const out = await fn({ messages, temperature, maxTokens, jsonMode });
            if (cacheKey) cacheManager.set(`llm:${cacheKey}`, out, CACHE_WINDOW_MS);
            return out;
        } catch (err) {
            lastErr = err;
        }
    }
    const out = deterministicMock({ messages, jsonMode });
    if (cacheKey) cacheManager.set(`llm:${cacheKey}`, out, CACHE_WINDOW_MS);
    return out;
}

function tryParseJson(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch { /* try to extract */ }
    const m = String(text).match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
}

/**
 * llmJson — like llmChat but enforces JSON parse, with one retry that nudges
 * the model to emit valid JSON.
 */
async function llmJson(opts) {
    const first = await llmChat({ ...opts, jsonMode: true });
    let parsed = tryParseJson(first.text);
    if (parsed !== null) return { ...first, json: parsed };

    const retryMessages = [
        ...opts.messages,
        { role: 'assistant', content: first.text },
        { role: 'user', content: 'That was not valid JSON. Reply ONLY with valid JSON, no prose, no code fences.' }
    ];
    const second = await llmChat({ ...opts, messages: retryMessages, jsonMode: true });
    parsed = tryParseJson(second.text);
    return { ...second, json: parsed ?? {} };
}

/**
 * Grade a short answer with a rubric. Returns
 * { score (0-10), feedback, strengths[], improvements[] }.
 */
async function evaluateShortAnswer({ question, expected, studentAnswer, rubric, lang = 'en', maxScore = 10 }) {
    const langName = ({ en: 'English', hi: 'Hindi', ta: 'Tamil' })[lang] || 'English';
    const messages = [
        {
            role: 'system',
            content:
                'You are a strict CBSE/State-board teacher grading a student short answer. ' +
                'Return ONLY valid JSON with keys: score (number), feedback (string), strengths (string[]), improvements (string[]). ' +
                `Reply in ${langName}. score is 0-${maxScore} based on the rubric.`
        },
        {
            role: 'user',
            content:
                `Question: ${question}\n\n` +
                `Expected answer (reference): ${expected || '(not provided)'}\n\n` +
                `Rubric: ${rubric || `0-${maxScore} based on factual accuracy, completeness, clarity.`}\n\n` +
                `Student answer: ${studentAnswer}\n\n` +
                'Return JSON only.'
        }
    ];
    const out = await llmJson({ messages, temperature: 0.2, maxTokens: 600 });
    const j = out.json || {};
    return {
        score: Math.max(0, Math.min(maxScore, Number(j.score ?? 0))),
        feedback: String(j.feedback || '').slice(0, 1200),
        strengths: Array.isArray(j.strengths) ? j.strengths.slice(0, 5).map(String) : [],
        improvements: Array.isArray(j.improvements) ? j.improvements.slice(0, 5).map(String) : [],
        provider: out.provider
    };
}

function providerStatus() {
    const t = nowMs();
    return {
        cerebras: { configured: !!CEREBRAS_KEYS.length, keys: CEREBRAS_KEYS.length, inBackoff: PROVIDER_STATE.cerebras.backoffUntil > t },
        groq: { configured: !!GROQ_KEY, inBackoff: PROVIDER_STATE.groq.backoffUntil > t },
        nvidia: { configured: !!NVIDIA_KEY, inBackoff: PROVIDER_STATE.nvidia.backoffUntil > t }
    };
}

module.exports = { llmChat, llmJson, evaluateShortAnswer, providerStatus };
