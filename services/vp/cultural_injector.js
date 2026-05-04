/**
 * Cultural injector — small post-processing on LLM output to nudge it toward
 * Indian classroom norms without rewriting content. Currency symbols, name
 * examples, and unit hints. Lossless on text that does not match patterns.
 */

const REPLACEMENTS = [
    [/\b\$(\d+(?:\.\d+)?)\b/g, '₹$1'],
    [/\bdollars?\b/gi, 'rupees'],
    [/\bMr\.?\s+John\b/g, 'Shri Ravi'],
    [/\bMrs\.?\s+Smith\b/g, 'Smt. Priya'],
    [/\bJohn\b/g, 'Ravi'],
    [/\bJane\b/g, 'Priya'],
    [/\bmiles?\b/gi, 'kilometres'],
    [/\bgallons?\b/gi, 'litres']
];

function inject(text) {
    if (!text || typeof text !== 'string') return text || '';
    let out = text;
    for (const [pat, rep] of REPLACEMENTS) out = out.replace(pat, rep);
    return out;
}

module.exports = { inject };
