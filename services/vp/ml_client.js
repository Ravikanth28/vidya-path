/**
 * HTTP client for the Python ML sidecar (ml_sidecar/main.py, default :8000).
 * Every method has a JS-side fallback so the platform keeps working when
 * the sidecar is offline (degraded mode).
 */
const axios = require('axios');

const ML_BASE = process.env.ML_SIDECAR_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT = Number(process.env.ML_SIDECAR_TIMEOUT_MS) || 6000;

async function call(path, body) {
    try {
        const { data } = await axios.post(`${ML_BASE}${path}`, body, { timeout: ML_TIMEOUT });
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

// ── IRT 3-PL ────────────────────────────────────────────────────────────────
function irtProb(theta, a, b, c) {
    const z = a * (theta - b);
    return c + (1 - c) / (1 + Math.exp(-z));
}

function irtMle(responses, init = 0) {
    // responses: [{a,b,c,correct(0/1)}]
    let theta = init;
    for (let iter = 0; iter < 30; iter++) {
        let num = 0, den = 0;
        for (const r of responses) {
            const a = r.a ?? 1, b = r.b ?? 0, c = r.c ?? 0.2;
            const p = irtProb(theta, a, b, c);
            const pStar = (p - c) / Math.max(1 - c, 1e-6);
            const w = pStar * (1 - pStar);
            num += a * (r.correct - p);
            den += a * a * w;
        }
        if (Math.abs(den) < 1e-6) break;
        const step = num / den;
        theta += Math.max(-1, Math.min(1, step));
        if (Math.abs(step) < 1e-4) break;
    }
    return Math.max(-3, Math.min(3, theta));
}

async function irtEstimate({ responses, prior_theta = 0 }) {
    const r = await call('/irt/estimate', { responses, prior_theta });
    if (r.ok) return r.data;
    const theta = irtMle(responses, prior_theta);
    const p = responses.length ? responses.reduce((s, q) => s + irtProb(theta, q.a ?? 1, q.b ?? 0, q.c ?? 0.2), 0) / responses.length : 0.5;
    return { theta, prob: p, fallback: true };
}

// ── BKT (Bayesian Knowledge Tracing) ────────────────────────────────────────
function bktUpdate({ p_mastery = 0.1, correct = 0, p_learn = 0.1, p_slip = 0.1, p_guess = 0.2 }) {
    const pT = p_mastery;
    const pL = p_learn;
    const pS = p_slip;
    const pG = p_guess;
    let pTGivenObs;
    if (correct) {
        const num = pT * (1 - pS);
        const den = pT * (1 - pS) + (1 - pT) * pG;
        pTGivenObs = den > 0 ? num / den : pT;
    } else {
        const num = pT * pS;
        const den = pT * pS + (1 - pT) * (1 - pG);
        pTGivenObs = den > 0 ? num / den : pT;
    }
    return pTGivenObs + (1 - pTGivenObs) * pL;
}

async function bktUpdateRemote(payload) {
    const r = await call('/bkt/update', payload);
    if (r.ok) return r.data;
    return { p_mastery: bktUpdate(payload), fallback: true };
}

async function bktNextLessons({ student_id, masteries, threshold = 0.85, limit = 5 }) {
    const r = await call('/bkt/next-lessons', { student_id, masteries, threshold, limit });
    if (r.ok) return r.data;
    const sorted = (Array.isArray(masteries) ? [...masteries] : [])
        .filter(m => (m.p_mastery ?? 0) < threshold)
        .sort((a, b) => (a.p_mastery ?? 0) - (b.p_mastery ?? 0))
        .slice(0, limit);
    return { recommendations: sorted, fallback: true };
}

// ── Bandit (epsilon-greedy item selection) ──────────────────────────────────
async function banditSelect({ student_id, theta = 0, candidates = [], epsilon = 0.1 }) {
    const r = await call('/bandit/select', { student_id, theta, candidates, epsilon });
    if (r.ok) return r.data;
    if (!candidates.length) return { selected: null, reason: 'no candidates', fallback: true };
    if (Math.random() < epsilon) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return { selected: pick, reason: 'explore', fallback: true };
    }
    let best = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
        const a = c.a ?? 1, b = c.b ?? 0, cParam = c.c ?? 0.2;
        const p = irtProb(theta, a, b, cParam);
        const info = a * a * (p - cParam) * (1 - p) / Math.max(p, 1e-6);
        if (info > bestScore) { bestScore = info; best = c; }
    }
    return { selected: best, reason: 'exploit', fallback: true };
}

// ── SRS (SM-2) ──────────────────────────────────────────────────────────────
function sm2Schedule({ ease = 2.5, interval = 0, reps = 0, quality }) {
    const q = Math.max(0, Math.min(5, Number(quality)));
    let nextEase = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (nextEase < 1.3) nextEase = 1.3;
    let nextInterval, nextReps;
    if (q < 3) {
        nextReps = 0;
        nextInterval = 1;
    } else {
        nextReps = reps + 1;
        if (nextReps === 1) nextInterval = 1;
        else if (nextReps === 2) nextInterval = 6;
        else nextInterval = Math.round(interval * nextEase);
    }
    const nextDue = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
    return { ease: nextEase, interval: nextInterval, reps: nextReps, next_due: nextDue.toISOString() };
}

async function srsSchedule(payload) {
    const r = await call('/srs/schedule', payload);
    if (r.ok) return r.data;
    return { ...sm2Schedule(payload), fallback: true };
}

async function health() {
    try {
        const { data } = await axios.get(`${ML_BASE}/health`, { timeout: 2000 });
        return { ok: true, ...data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

module.exports = { irtEstimate, bktUpdateRemote, bktNextLessons, banditSelect, srsSchedule, health, irtProb };
