/**
 * Career Hub — LLM-powered match across careers, scholarships, mentors.
 *
 *   GET  /api/vp/career-hub/profile         — what the matcher will see
 *   POST /api/vp/career-hub/match           — { kind: 'career'|'scholarship'|'mentor', lang }
 *   GET  /api/vp/career-hub/history         — recent matches
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const llm = require('../../services/vp/llm_router');
const { buildStudentProfile } = require('../../services/vp/profile_builder');

const LANG_NAME = { en: 'English', hi: 'Hindi', ta: 'Tamil' };

const KIND_TABLE = {
    career: { table: 'vp_careers', cols: 'id, title, domain, summary, avg_salary, education, skills_json',
              describe: r => `${r.title} (${r.domain || 'general'}) — ${r.summary} | Skills: ${tryArr(r.skills_json).join(', ')}` },
    scholarship: { table: 'vp_scholarships', cols: 'id, title, provider, eligibility, amount, url',
                   describe: r => `${r.title} (${r.provider || ''}) — ${r.eligibility} | Amount: ${r.amount || 'N/A'}` },
    mentor: { table: 'vp_mentors', cols: 'id, name, expertise, bio, languages, availability',
              describe: r => `${r.name} — ${r.expertise} | ${r.bio} | Languages: ${r.languages}` }
};

function tryArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { const o = JSON.parse(v); return Array.isArray(o) ? o : []; } catch { return []; }
}

module.exports = function careerHubRoutes(pool, authenticate) {
    const router = express.Router();

    router.get('/career-hub/profile', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const p = await buildStudentProfile(pool, sid);
            res.json({ summary: p.summary });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/career-hub/match', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        const kind = String(req.body?.kind || 'career');
        const lang = String(req.body?.lang || 'en');
        const limit = Math.min(10, Math.max(3, Number(req.body?.limit) || 5));
        const cfg = KIND_TABLE[kind];
        if (!cfg) return res.status(400).json({ error: 'kind must be career|scholarship|mentor' });

        try {
            const profile = await buildStudentProfile(pool, sid);
            const [items] = await pool.query(`SELECT ${cfg.cols} FROM ${cfg.table}`);
            if (!items.length) return res.json({ matches: [], message: 'catalog empty' });

            const catalog = items.map((r, i) => `${i + 1}. [${r.id}] ${cfg.describe(r)}`).join('\n');

            // 1. ranking pass
            const rankRes = await llm.llmJson({
                messages: [
                    {
                        role: 'system',
                        content: `You are a career-counselling matcher for Indian school students. ` +
                                 `Read the student's performance summary and the catalog. ` +
                                 `Return ONLY JSON of the form {"matches":["<id1>","<id2>",...]} with the top ${limit} ids ` +
                                 `most aligned to the student's strengths and goals. No prose.`
                    },
                    {
                        role: 'user',
                        content: `Student summary:\n${profile.summary}\n\nCatalog (kind=${kind}):\n${catalog}\n\nReply with JSON only.`
                    }
                ],
                temperature: 0.2,
                maxTokens: 400,
                cacheKey: `career-rank:${sid}:${kind}:${profile.summary.length}`
            });

            const rawIds = Array.isArray(rankRes.json?.matches) ? rankRes.json.matches : [];
            const validIds = rawIds.map(String).filter(id => items.some(i => i.id === id));
            const finalIds = validIds.length ? validIds.slice(0, limit) : items.slice(0, limit).map(i => i.id);
            const matchedItems = finalIds.map(id => items.find(i => i.id === id)).filter(Boolean);

            // 2. explanation pass
            const langName = LANG_NAME[lang] || 'English';
            const expRes = await llm.llmJson({
                messages: [
                    {
                        role: 'system',
                        content: `Explain in ${langName} why each item below matches the student. Reference specific scores ` +
                                 `from the summary. Return JSON: {"explanations":{"<id>":"<2-sentence reason>"}}.`
                    },
                    {
                        role: 'user',
                        content: `Student summary:\n${profile.summary}\n\nMatched ${kind}s:\n` +
                                 matchedItems.map(r => `[${r.id}] ${cfg.describe(r)}`).join('\n') +
                                 `\n\nReply JSON only.`
                    }
                ],
                temperature: 0.3,
                maxTokens: 700
            });
            const explanations = expRes.json?.explanations || {};

            const matches = matchedItems.map(r => ({ ...r, explanation: explanations[r.id] || '' }));

            await pool.query(
                `INSERT INTO vp_match_history (id, student_id, kind, result_json, explanations_json, lang)
                 VALUES (?,?,?,?,?,?)`,
                [uuidv4(), sid, kind, JSON.stringify(finalIds), JSON.stringify(explanations), lang]
            );

            res.json({ matches, kind, lang, provider: rankRes.provider });
        } catch (err) {
            console.error('[vp] career match:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/career-hub/history', authenticate, async (req, res) => {
        const sid = String(req.user.id);
        try {
            const [rows] = await pool.query(
                `SELECT id, kind, result_json, explanations_json, lang, created_at
                 FROM vp_match_history WHERE student_id = ?
                 ORDER BY created_at DESC LIMIT 30`, [sid]
            );
            res.json({ items: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
