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
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct';

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

const LLM_TAG = '[LLM]';
function log(msg) { console.log(`${LLM_TAG} ${msg}`); }
function warn(msg) { console.warn(`${LLM_TAG} ⚠  ${msg}`); }

// Log key availability on startup
(function logStartupConfig() {
    const cerebrasCount = CEREBRAS_KEYS.length;
    const groqReady = !!GROQ_KEY;
    const nvidiaReady = !!NVIDIA_KEY;
    log(`Cerebras keys: ${cerebrasCount}  |  Groq: ${groqReady ? '✓' : '✗'}  |  NVIDIA: ${nvidiaReady ? '✓ (' + NVIDIA_MODEL + ')' : '✗'}`);
    if (!cerebrasCount && !groqReady && !nvidiaReady) {
        warn('No LLM provider keys found — all requests will use mock fallback.');
    }
})();

function buildHeaders(provider, key) {
    return {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
    };
}

async function callCerebras({ messages, temperature, maxTokens, jsonMode }) {
    if (!CEREBRAS_KEYS.length) throw new Error('cerebras: no keys');
    const state = PROVIDER_STATE.cerebras;
    if (inBackoff(state)) throw new Error(`cerebras: in backoff (${Math.ceil((state.backoffUntil - nowMs()) / 1000)}s remaining)`);
    const url = 'https://api.cerebras.ai/v1/chat/completions';
    const model = process.env.CEREBRAS_MODEL || 'llama3.1-8b';
    const body = {
        model,
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    let lastErr;
    for (let i = 0; i < CEREBRAS_KEYS.length; i++) {
        const idx = (state.keyIndex + i) % CEREBRAS_KEYS.length;
        const key = CEREBRAS_KEYS[idx];
        log(`Trying Cerebras key[${idx}] model=${model} maxTokens=${maxTokens ?? 1024}`);
        try {
            const { data } = await axios.post(url, body, {
                headers: buildHeaders('cerebras', key),
                timeout: 30_000
            });
            state.keyIndex = (idx + 1) % CEREBRAS_KEYS.length;
            const text = data?.choices?.[0]?.message?.content || '';
            log(`✓ Cerebras responded (${data?.usage?.total_tokens ?? '?'} tokens)`);
            return { provider: 'cerebras', text };
        } catch (err) {
            lastErr = err;
            warn(`Cerebras key[${idx}] failed: ${err?.response?.status ?? err.message}`);
            if (!isRateOrServer(err)) break;
        }
    }
    trip(state);
    warn(`Cerebras exhausted all keys — backing off ${PROVIDER_BACKOFF_MS / 1000}s`);
    throw lastErr || new Error('cerebras: exhausted');
}

async function callGroq({ messages, temperature, maxTokens, jsonMode }) {
    if (!GROQ_KEY) throw new Error('groq: no key');
    const state = PROVIDER_STATE.groq;
    if (inBackoff(state)) throw new Error(`groq: in backoff (${Math.ceil((state.backoffUntil - nowMs()) / 1000)}s remaining)`);
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
        model,
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    log(`Trying Groq model=${model} maxTokens=${maxTokens ?? 1024}`);
    try {
        const { data } = await axios.post(url, body, {
            headers: buildHeaders('groq', GROQ_KEY),
            timeout: 30_000
        });
        const text = data?.choices?.[0]?.message?.content || '';
        log(`✓ Groq responded (${data?.usage?.total_tokens ?? '?'} tokens)`);
        return { provider: 'groq', text };
    } catch (err) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.error?.message || err.message;
        warn(`Groq failed: ${status} — ${String(detail).slice(0, 120)}`);
        if (isRateOrServer(err)) {
            trip(state);
            warn(`Groq backing off ${PROVIDER_BACKOFF_MS / 1000}s`);
        }
        throw err;
    }
}

async function callNvidia({ messages, temperature, maxTokens, jsonMode }) {
    if (!NVIDIA_KEY) throw new Error('nvidia: no key');
    const state = PROVIDER_STATE.nvidia;
    if (inBackoff(state)) throw new Error(`nvidia: in backoff (${Math.ceil((state.backoffUntil - nowMs()) / 1000)}s remaining)`);
    const url = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const body = {
        model: NVIDIA_MODEL,
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 1024,
        stream: false
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    log(`Trying NVIDIA NIM model=${NVIDIA_MODEL} maxTokens=${maxTokens ?? 1024}`);
    try {
        const { data } = await axios.post(url, body, {
            headers: buildHeaders('nvidia', NVIDIA_KEY),
            timeout: 45_000
        });
        const text = data?.choices?.[0]?.message?.content || '';
        log(`✓ NVIDIA NIM responded (${data?.usage?.total_tokens ?? '?'} tokens)`);
        return { provider: 'nvidia', text };
    } catch (err) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail || err?.response?.data?.error?.message || err.message;
        warn(`NVIDIA failed: ${status} — ${String(detail).slice(0, 120)}`);
        if (isRateOrServer(err)) {
            trip(state);
            warn(`NVIDIA backing off ${PROVIDER_BACKOFF_MS / 1000}s`);
        }
        throw err;
    }
}

function deterministicMock({ messages, jsonMode }) {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    warn('All providers failed — using deterministic mock fallback.');
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
        if (cached) {
            log(`Cache hit for key=${cacheKey} provider=${cached.provider}`);
            return cached;
        }
    }

    const order = [
        { name: 'Cerebras', fn: callCerebras },
        { name: 'Groq',     fn: callGroq },
        { name: 'NVIDIA',   fn: callNvidia }
    ];
    let lastErr;
    for (const { name, fn } of order) {
        try {
            const out = await fn({ messages, temperature, maxTokens, jsonMode });
            if (cacheKey) cacheManager.set(`llm:${cacheKey}`, out, CACHE_WINDOW_MS);
            return out;
        } catch (err) {
            lastErr = err;
            log(`→ Falling through from ${name}: ${err.message.slice(0, 80)}`);
        }
    }
    warn('All providers exhausted — using mock fallback.');
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
