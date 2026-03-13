/**
 * ModuleGDRound.jsx – Full Group Discussion round
 * Flow: prep (30s) → discussion (AI+student turns) → concluding (final speech → Submit) → done
 *
 * Fixes:
 *  - Continuous SpeechRecognition (doesn't stop after first result)
 *  - speechSynthesis with proper voice selection & onend handling
 *  - Raise Hand = "I go next" (waits for AI to finish, then auto-starts mic)
 *  - Conclude = stop discussion → show final speech box → Submit → onComplete()
 *  - Audio wave bars when anyone speaks
 *  - Proper button states
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Mic, MicOff, Hand, StopCircle, ChevronRight, Clock, Send, Volume2, AlertCircle } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });

/* ─────── colours ──────── */
const C = {
    bg: '#0f172a', card: '#1e293b', card2: '#111827', border: '#334155',
    indigo: '#6366f1', indigoGlow: '#6366f180',
    text: '#f1f5f9', sub: '#94a3b8', muted: '#64748b',
    green: '#10b981', red: '#ef4444', amber: '#f59e0b',
};

/* ═══════════════════════════════════════════════════════════════════════════
   Audio-wave visualiser: 5 animated bars
   ═══════════════════════════════════════════════════════════════════════════ */
function AudioWave({ active, color = '#6366f1', size = 'md' }) {
    const h = size === 'lg' ? 28 : size === 'sm' ? 12 : 18;
    const w = size === 'lg' ? 5 : size === 'sm' ? 3 : 4;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 2 : 3, height: h + 4, justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                    width: w, borderRadius: w / 2,
                    background: active ? color : '#334155',
                    height: active ? undefined : w,
                    animation: active ? `gdWave 1s ease-in-out ${i * 0.12}s infinite alternate` : 'none',
                    transition: 'all 0.3s',
                }} />
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GD Evaluation — compute rich, content-aware scores from transcript
   ═══════════════════════════════════════════════════════════════════════════ */
function computeLocalGDScores(text, durationSec, topic, prevTurns) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wc = words.length;
    if (wc < 3) return { comm: 10, pron: 10, lang: 10, gd: 10, conf: 10, wpm: 0, wc, fillerCount: 0 };

    const wpm = durationSec > 4 ? Math.round((wc / durationSec) * 60) : 130;

    // Filler word detection — broader pattern set
    const fillerRx = /\b(um+|uh+|er+|hmm+|ah+|like|you know|basically|literally|kind of|sort of|i mean|okay so|so so|well well|right so|actually actually|honestly honestly)\b/gi;
    const fillerCount = (text.match(fillerRx) || []).length;
    const fillerPenalty = Math.min(fillerCount * 12, 55); // harsher per filler

    // Vocabulary richness — ratio of unique meaningful words
    const meaningfulWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 3);
    const uniqueW = new Set(meaningfulWords);
    const vocabRich = uniqueW.size / Math.max(meaningfulWords.length, 1); // 0..1

    // Advanced vocabulary — words 7+ chars that aren't common
    const commonWords = new Set(['because','however','therefore','although','whether','another','something','anything','everything','nothing','through','between','against','without','towards','organization','organizations']);
    const advancedW = meaningfulWords.filter(w => w.length >= 7 && !commonWords.has(w));
    const advVocabBonus = Math.min(advancedW.length * 2.5, 20);

    // Sentence structure
    const sents = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const sentCount = Math.max(sents.length, 1);
    const avgSentLen = wc / sentCount;
    // Penalise single very long run-on sentence
    const runOnPenalty = sentCount === 1 && wc > 30 ? 8 : 0;

    // Argument indicators — shows student builds a point
    const argRx = /\b(because|therefore|however|although|whereas|on the other hand|for instance|for example|in fact|contrary|furthermore|additionally|consequently|nevertheless|in contrast|this means|which means|as a result|given that|it follows|to illustrate)\b/gi;
    const argCount = (text.match(argRx) || []).length;
    const argBonus = Math.min(argCount * 6, 24);

    // Topic relevance — count topic keyword hits
    const topicKws = (topic || '').toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const hits = topicKws.filter(kw => text.toLowerCase().includes(kw)).length;
    const relevance = topicKws.length > 0 ? hits / topicKws.length : 0.25;

    // Reference bonus — student directly engaged with what AI said
    const prevTexts = (prevTurns || []).filter(t => !t.isStudent).map(t => (t.transcript || '').toLowerCase());
    const refMatchedWords = words.filter(w => w.length > 5).filter(w =>
        prevTexts.some(pt => pt.includes(w.toLowerCase()))
    ).length;
    const refBonus = refMatchedWords >= 3 ? 16 : refMatchedWords >= 1 ? 8 : 0;

    // Pace score: 100-160 wpm is ideal for GD
    const paceScore = (wpm >= 100 && wpm <= 160) ? 80
        : (wpm >= 80 && wpm < 100) || (wpm > 160 && wpm <= 200) ? 62
        : 35;

    // ── Communication: clarity, structure, engagement (strict base)
    // Floor is 15; a mediocre 35-word answer should score ~44-52
    const comm = Math.round(Math.min(100, Math.max(10,
        15
        + (wc >= 80 ? 22 : wc >= 55 ? 15 : wc >= 35 ? 9 : wc >= 15 ? 3 : 0)
        + (sentCount >= 4 ? 14 : sentCount >= 3 ? 9 : sentCount >= 2 ? 4 : 0)
        + (avgSentLen >= 8 && avgSentLen <= 22 ? 10 : 3)
        + (paceScore >= 78 ? 10 : paceScore >= 60 ? 4 : 0)
        + argBonus
        + refBonus * 0.7
        - fillerPenalty * 0.65
        - runOnPenalty
    )));

    // ── Pronunciation: fluency, pace, filler-free (very sensitive to fillers)
    const pron = Math.round(Math.min(100, Math.max(10,
        (paceScore - 10)
        + (wc >= 45 ? 14 : wc >= 25 ? 7 : 2)
        - fillerPenalty * 1.1
        - runOnPenalty * 0.5
    )));

    // ── Language: vocabulary depth, grammar proxy
    const lang = Math.round(Math.min(100, Math.max(10,
        16
        + vocabRich * 48    // max ~48 for perfectly unique vocab
        + advVocabBonus
        + (sentCount >= 3 ? 10 : sentCount >= 2 ? 5 : 0)
        + (avgSentLen >= 8 && avgSentLen <= 20 ? 7 : 0)
        - fillerPenalty * 0.4
        - runOnPenalty
    )));

    // ── GD Relevance: on-topic, engages with others, structures argument
    const gd = Math.round(Math.min(100, Math.max(10,
        12
        + relevance * 52    // max 52 for fully on-topic
        + refBonus * 1.6
        + argBonus * 0.8
        + (wc >= 50 ? 12 : wc >= 25 ? 6 : 0)
        + (sentCount >= 2 ? 5 : 0)
    )));

    // ── Confidence: pace, fluency, decisive language, length
    const confArgRx = /\b(i believe|i think|clearly|definitely|absolutely|certainly|obviously|my point is|i would argue|to be clear|the key point|let me explain|consider this|the fact is|evidence suggests)\b/gi;
    const confArgCount = (text.match(confArgRx) || []).length;
    const conf = Math.round(Math.min(100, Math.max(10,
        22
        + (paceScore >= 78 ? 20 : paceScore >= 60 ? 8 : -5)
        + (wc >= 40 ? 14 : wc >= 20 ? 7 : 0)
        + (sentCount >= 3 ? 8 : sentCount >= 2 ? 4 : 0)
        + Math.min(confArgCount * 5, 18)
        - fillerPenalty * 0.9
        - runOnPenalty
    )));

    return { comm, pron, lang, gd, conf, wpm, wc, fillerCount };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2-D Room Avatar — SVG person with head + suit body
   ═══════════════════════════════════════════════════════════════════════════ */
const AI_AVT_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#a78bfa'];

function RoomAvatar({ name, isSpeaking, isStudent, isRaisedHand, colorIdx = 0 }) {
    const displayName = name.replace(/\s*\(AI\)\s*/i, '').replace(/\s*\(Student\)\s*/i, '');
    const color = isStudent ? '#10b981' : AI_AVT_COLORS[colorIdx % AI_AVT_COLORS.length];
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 80, position: 'relative' }}>
            {isRaisedHand && (
                <div style={{ position: 'absolute', top: -8, right: 0, fontSize: 14, zIndex: 3, animation: 'gdFloat .8s ease-in-out infinite alternate' }}>✋</div>
            )}
            {/* Avatar wrapper — glow border + pulse when speaking */}
            <div style={{
                padding: 4, borderRadius: 14,
                border: `2px solid ${isSpeaking ? color : 'transparent'}`,
                boxShadow: isSpeaking ? `0 0 18px ${color}66` : 'none',
                background: isSpeaking ? `${color}11` : 'transparent',
                transition: 'all .35s',
                animation: isSpeaking ? 'gdRingPulse 1.4s ease-in-out infinite' : 'none',
            }}>
                <svg width="52" height="66" viewBox="0 0 52 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head */}
                    <circle cx="26" cy="15" r="12" fill={isStudent ? '#052e16' : '#1e1b4b'} stroke={color} strokeWidth={isSpeaking ? 2.2 : 1.4} opacity={isSpeaking ? 1 : 0.8} />
                    {/* Eyes */}
                    <circle cx="21.5" cy="13" r="1.7" fill={color} opacity={isSpeaking ? 1 : 0.45} />
                    <circle cx="30.5" cy="13" r="1.7" fill={color} opacity={isSpeaking ? 1 : 0.45} />
                    {/* Mouth */}
                    <path d={isSpeaking ? 'M20 20 Q26 25 32 20' : 'M20 20 Q26 23 32 20'} stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={isSpeaking ? 1 : 0.45} />
                    {/* Student: mic icon | AI: initials */}
                    {isStudent ? (
                        <>
                            <rect x="24" y="7" width="4" height="7.5" rx="2" fill={color} opacity=".85" />
                            <path d="M20 13.5 Q20 19.5 26 19.5 Q32 19.5 32 13.5" stroke={color} strokeWidth="1.2" fill="none" opacity=".85" />
                            <line x1="26" y1="19.5" x2="26" y2="23" stroke={color} strokeWidth="1.2" opacity=".85" />
                        </>
                    ) : (
                        <text x="26" y="19" textAnchor="middle" fontSize="8" fontWeight="800" fill={color} fontFamily="system-ui" opacity={isSpeaking ? 1 : 0.55}>{initials}</text>
                    )}
                    {/* Neck */}
                    <rect x="22.5" y="26.5" width="7" height="5" rx="2.5" fill={isStudent ? '#052e16' : '#1e1b4b'} />
                    {/* Body / suit */}
                    <rect x="7" y="31.5" width="38" height="31" rx="10" fill={isStudent ? '#064e3b' : '#1e1b4b'} stroke={color} strokeWidth={isSpeaking ? 1.8 : 1} opacity={isSpeaking ? 1 : 0.6} />
                    {/* Jacket collar V */}
                    <path d="M18.5 31.5 L26 44 L33.5 31.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity={isSpeaking ? .85 : .35} />
                    {/* Shoulder caps */}
                    <ellipse cx="8" cy="38" rx="4.5" ry="7" fill={isStudent ? '#052e16' : '#1e1b4b'} opacity=".9" />
                    <ellipse cx="44" cy="38" rx="4.5" ry="7" fill={isStudent ? '#052e16' : '#1e1b4b'} opacity=".9" />
                    {/* Role badge strip */}
                    <rect x="13" y="50" width="26" height="10" rx="5" fill={`${color}22`} />
                    <text x="26" y="57.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={color} fontFamily="system-ui">{isStudent ? 'YOU' : 'AI'}</text>
                </svg>
            </div>
            {/* Name label */}
            <span style={{ fontSize: 11, fontWeight: isSpeaking ? 800 : 500, color: isSpeaking ? color : '#64748b', textAlign: 'center', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color .3s' }}>
                {displayName || name}
            </span>
            {/* Wave bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        width: 3, borderRadius: 2,
                        background: isSpeaking ? color : '#334155',
                        height: isSpeaking ? undefined : 3,
                        animation: isSpeaking ? `gdWave 1s ease-in-out ${i * .12}s infinite alternate` : 'none',
                        transition: 'background .3s',
                    }} />
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Conference Room — seats participants around an oval table
   ═══════════════════════════════════════════════════════════════════════════ */
function ConferenceRoom({ participants, activeSpeaker, studentIsSpeaking, handRaised, topic }) {
    const n = participants.length;
    let topRow = [], leftP = null, rightP = null;
    if (n <= 1)      { topRow = participants; }
    else if (n === 2){ topRow = [participants[0]]; leftP = participants[1]; }
    else             { leftP = participants[n - 2]; rightP = participants[n - 1]; topRow = participants.slice(0, n - 2); }

    return (
        <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
            padding: '10px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                ◈ Conference Room · Group Discussion ◈
            </span>

            {/* Top row */}
            {topRow.length > 0 && (
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    {topRow.map((p, i) => (
                        <RoomAvatar key={p.id} name={p.name} isSpeaking={activeSpeaker === p.id} colorIdx={i} />
                    ))}
                </div>
            )}

            {/* Middle: left seat | oval table | right seat */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 6, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {leftP
                        ? <RoomAvatar name={leftP.name} isSpeaking={activeSpeaker === leftP.id} colorIdx={n - 2} />
                        : <div style={{ width: 80 }} />}
                </div>
                {/* Oval conference table */}
                <div style={{
                    background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
                    border: '2px solid #334155', borderRadius: 48,
                    padding: '14px 10px', textAlign: 'center',
                    boxShadow: 'inset 0 3px 12px #00000077, 0 0 0 5px #1e293b, 0 0 0 7px #334155',
                    minHeight: 86, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                    <div style={{ fontSize: 8, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Discussion Topic</div>
                    <div style={{ fontSize: 10.5, color: '#818cf8', fontWeight: 700, lineHeight: 1.4, maxWidth: 155 }}>
                        "{topic && topic.length > 58 ? topic.slice(0, 55) + '\u2026' : topic}"
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {rightP
                        ? <RoomAvatar name={rightP.name} isSpeaking={activeSpeaker === rightP.id} colorIdx={n - 1} />
                        : <div style={{ width: 80 }} />}
                </div>
            </div>

            {/* Bottom: student */}
            <RoomAvatar name="You" isSpeaking={studentIsSpeaking} isStudent isRaisedHand={handRaised} />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Larger Avatar for immersive room view
   ═══════════════════════════════════════════════════════════════════════════ */
function BigAvatar({ name, isSpeaking, isStudent, isRaisedHand, colorIdx = 0 }) {
    const displayName = name.replace(/\s*\(AI\)\s*/i, '').replace(/\s*\(Student\)\s*/i, '');
    const color = isStudent ? '#10b981' : AI_AVT_COLORS[colorIdx % AI_AVT_COLORS.length];
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
            {isRaisedHand && (
                <div style={{ position: 'absolute', top: -14, right: -6, fontSize: 18, zIndex: 3, animation: 'gdFloat .8s ease-in-out infinite alternate' }}>✋</div>
            )}
            <div style={{
                padding: 5, borderRadius: 16,
                border: `2.5px solid ${isSpeaking ? color : '#1e2d45'}`,
                boxShadow: isSpeaking ? `0 0 22px ${color}55, 0 0 55px ${color}22` : '0 4px 16px #00000055',
                background: isSpeaking ? `${color}0d` : '#0b1524',
                transition: 'all .3s', animation: isSpeaking ? 'gdRingPulse 1.4s ease-in-out infinite' : 'none',
            }}>
                <svg width="62" height="78" viewBox="0 0 52 66" fill="none">
                    <circle cx="26" cy="15" r="12" fill={isStudent ? '#052e16' : '#1e1b4b'} stroke={color} strokeWidth={isSpeaking ? 2.2 : 1.3} opacity={isSpeaking ? 1 : 0.8} />
                    <circle cx="21.5" cy="13" r="1.7" fill={color} opacity={isSpeaking ? 1 : 0.45} />
                    <circle cx="30.5" cy="13" r="1.7" fill={color} opacity={isSpeaking ? 1 : 0.45} />
                    <path d={isSpeaking ? 'M20 20 Q26 25 32 20' : 'M20 20 Q26 23 32 20'} stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={isSpeaking ? 1 : 0.45} />
                    {isStudent ? (
                        <>
                            <rect x="24" y="7" width="4" height="7.5" rx="2" fill={color} opacity=".85" />
                            <path d="M20 13.5 Q20 19.5 26 19.5 Q32 19.5 32 13.5" stroke={color} strokeWidth="1.2" fill="none" opacity=".85" />
                            <line x1="26" y1="19.5" x2="26" y2="23" stroke={color} strokeWidth="1.2" opacity=".85" />
                        </>
                    ) : (
                        <text x="26" y="19" textAnchor="middle" fontSize="8" fontWeight="800" fill={color} fontFamily="system-ui" opacity={isSpeaking ? 1 : 0.6}>{initials}</text>
                    )}
                    <rect x="22.5" y="26.5" width="7" height="5" rx="2.5" fill={isStudent ? '#052e16' : '#1e1b4b'} />
                    <rect x="7" y="31.5" width="38" height="31" rx="10" fill={isStudent ? '#064e3b' : '#1e1b4b'} stroke={color} strokeWidth={isSpeaking ? 1.8 : 1} opacity={isSpeaking ? 1 : 0.65} />
                    <path d="M18.5 31.5 L26 44 L33.5 31.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity={isSpeaking ? .85 : .35} />
                    <ellipse cx="8" cy="38" rx="4.5" ry="7" fill={isStudent ? '#052e16' : '#1e1b4b'} opacity=".9" />
                    <ellipse cx="44" cy="38" rx="4.5" ry="7" fill={isStudent ? '#052e16' : '#1e1b4b'} opacity=".9" />
                    <rect x="13" y="50" width="26" height="10" rx="5" fill={`${color}22`} />
                    <text x="26" y="57.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={color} fontFamily="system-ui">{isStudent ? 'YOU' : 'AI'}</text>
                </svg>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: isSpeaking ? 800 : 600, color: isSpeaking ? color : '#475569', textAlign: 'center', maxWidth: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color .3s' }}>
                {displayName || name}
            </span>
            <div style={{ display: 'flex', gap: 2, height: 14, alignItems: 'center' }}>
                {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ width: 3, borderRadius: 2, background: isSpeaking ? color : '#1e2d45', height: isSpeaking ? undefined : 3, animation: isSpeaking ? `gdWave 1s ease-in-out ${i*.12}s infinite alternate` : 'none', transition: 'background .3s' }} />
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Immersive Conference Room — full-width; speech bubbles near each speaker
   ═══════════════════════════════════════════════════════════════════════════ */
function ImmersiveRoom({ participants, activeSpeaker, studentIsSpeaking, handRaised, topic, lastTurns = {} }) {
    const n = participants.length;
    let topRow = [], leftP = null, rightP = null;
    if (n <= 1)      { topRow = participants; }
    else if (n === 2){ topRow = [participants[0]]; leftP = participants[1]; }
    else             { leftP = participants[n - 2]; rightP = participants[n - 1]; topRow = participants.slice(0, n - 2); }

    const snippet = (id) => {
        const t = lastTurns[id];
        return t ? (t.length > 60 ? t.slice(0, 57) + '\u2026' : t) : null;
    };
    const bubbleStyle = (color, maxW = 130) => ({
        background: '#0d1929', border: `1px solid ${color}33`, borderRadius: 10,
        padding: '5px 9px', fontSize: 9.5, color: '#64748b', lineHeight: 1.4,
        maxWidth: maxW, textAlign: 'center', wordBreak: 'break-word',
        animation: 'gdFadeIn 0.35s ease-out', flexShrink: 0,
    });

    const noActivity = Object.keys(lastTurns).length === 0;

    return (
        <div style={{
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'radial-gradient(ellipse at 50% 38%, #0d1e3a 0%, #080f1a 100%)',
            border: '1px solid #1e2d45', borderRadius: 20,
            padding: '12px 28px 14px', gap: 0, overflow: 'hidden', position: 'relative',
        }}>
            {/* Ambient floor */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', background: 'linear-gradient(0deg,#07101eaa 0%,transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Room label */}
            <div style={{ zIndex: 1, fontSize: 8, color: '#1e3a5f', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10, flexShrink: 0 }}>
                ⬡ Conference Room &mdash; Group Discussion ⬡
            </div>

            {/* Top row AI */}
            {topRow.length > 0 && (
                <div style={{ display: 'flex', gap: 28, justifyContent: 'center', zIndex: 1, flexShrink: 0, flexWrap: 'wrap' }}>
                    {topRow.map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <BigAvatar name={p.name} isSpeaking={activeSpeaker === p.id} colorIdx={i} />
                            {snippet(p.id) && (
                                <div style={bubbleStyle(AI_AVT_COLORS[i % AI_AVT_COLORS.length])}>{snippet(p.id)}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Middle: left | oval table | right */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', width: '100%', gap: 16, minHeight: 0, zIndex: 1, padding: '6px 0' }}>
                {/* Left seat */}
                <div style={{ width: 128, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                    {leftP
                        ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <BigAvatar name={leftP.name} isSpeaking={activeSpeaker === leftP.id} colorIdx={n - 2} />
                            {snippet(leftP.id) && <div style={bubbleStyle(AI_AVT_COLORS[(n-2) % AI_AVT_COLORS.length], 110)}>{snippet(leftP.id)}</div>}
                          </div>
                        : <div style={{ width: 90 }} />}
                </div>

                {/* Oval conference table */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                    <div style={{
                        width: '100%', maxWidth: 460,
                        background: 'radial-gradient(ellipse at 50% 34%, #142240 0%, #091525 100%)',
                        border: '2px solid #1e3a5f', borderRadius: '50%', aspectRatio: '2 / 1',
                        boxShadow: 'inset 0 6px 28px #00000077, 0 0 0 8px #0b1a2e, 0 0 0 11px #1e3a5f1a, 0 10px 40px #00000077',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 7,
                        textAlign: 'center', padding: '14px 22px', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: '20%', left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg,transparent,#1e4a7f44,transparent)' }} />
                        <div style={{ fontSize: 7.5, color: '#1e3a5f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em' }}>DISCUSSION TOPIC</div>
                        <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, lineHeight: 1.5 }}>
                            &ldquo;{topic && topic.length > 65 ? topic.slice(0, 62) + '\u2026' : topic}&rdquo;
                        </div>
                        {noActivity && (
                            <div style={{ fontSize: 8, color: '#334155', fontWeight: 600, marginTop: 2 }}>Click Start Speaking to begin</div>
                        )}
                        {!noActivity && (
                            <div style={{ fontSize: 7.5, color: '#1e3a5f', fontWeight: 600, letterSpacing: '.08em' }}>GROUP DISCUSSION ROUND</div>
                        )}
                    </div>
                </div>

                {/* Right seat */}
                <div style={{ width: 128, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                    {rightP
                        ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <BigAvatar name={rightP.name} isSpeaking={activeSpeaker === rightP.id} colorIdx={n - 1} />
                            {snippet(rightP.id) && <div style={bubbleStyle(AI_AVT_COLORS[(n-1) % AI_AVT_COLORS.length], 110)}>{snippet(rightP.id)}</div>}
                          </div>
                        : <div style={{ width: 90 }} />}
                </div>
            </div>

            {/* Bottom: You */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 1, flexShrink: 0 }}>
                {snippet('student') && (
                    <div style={bubbleStyle('#10b981', 200)}>{snippet('student')}</div>
                )}
                <BigAvatar name="You" isSpeaking={studentIsSpeaking} isStudent isRaisedHand={handRaised} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chat bubble
   ═══════════════════════════════════════════════════════════════════════════ */
const SPEAKER_COLORS = ['#6366f1','#8b5cf6','#3b82f6','#06b6d4','#a78bfa'];
function getSpeakerColor(label) {
    let h = 0; for (const c of (label || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return SPEAKER_COLORS[h % SPEAKER_COLORS.length];
}

function ChatBubble({ turn }) {
    const isStu = turn.isStudent;
    const label = (turn.speaker_label || turn.speaker || '').replace(/\s*\(AI\)\s*/i, '').replace(/\s*\(Student\)\s*/i, '');
    const initials = label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    const accentColor = isStu ? '#6366f1' : getSpeakerColor(label);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14, animation: 'gdFadeIn 0.3s ease-out',
            alignItems: isStu ? 'flex-end' : 'flex-start', paddingLeft: isStu ? 40 : 0, paddingRight: isStu ? 0 : 40 }}>

            {/* Speaker chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isStu ? 'row-reverse' : 'row' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%',
                    background: `${accentColor}22`, border: `1.5px solid ${accentColor}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 800, color: accentColor, flexShrink: 0 }}>
                    {initials}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>{label || (isStu ? 'You' : 'AI')}</span>
            </div>

            {/* Bubble card */}
            <div style={{
                background: isStu
                    ? 'linear-gradient(135deg,#312e81 0%,#4338ca 100%)'
                    : '#1e293b',
                border: `1px solid ${isStu ? '#6366f155' : '#334155'}`,
                borderLeft: isStu ? undefined : `3px solid ${accentColor}`,
                borderRadius: isStu ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                padding: '11px 15px',
                fontSize: 13.5, color: '#f1f5f9', lineHeight: 1.6,
                boxShadow: isStu
                    ? `0 4px 18px ${accentColor}33`
                    : '0 2px 10px #00000044',
                maxWidth: '100%',
            }}>
                {turn.transcript}
            </div>

            {/* 5-dim score panel for student turns */}
            {isStu && turn.gdScores && (
                <div style={{ width: '100%', background: '#0c1420', border: '1px solid #1e293b', borderRadius: 12, padding: '10px 12px', marginTop: 2 }}>
                    <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Turn Evaluation</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                        {[['Comm','#6366f1'],['Pron','#34d399'],['Lang','#a78bfa'],['GD','#f59e0b'],['Conf','#fb923c']].map(([l, c]) => {
                            const v = turn.gdScores[l.toLowerCase()];
                            const scoreColor = v >= 70 ? c : v >= 50 ? '#f59e0b' : '#ef4444';
                            return (
                                <div key={l} style={{ background: c + '0f', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: `1px solid ${c}22` }}>
                                    <div style={{ fontSize: 17, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{v}</div>
                                    <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, marginTop: 2 }}>{l}</div>
                                    <div style={{ height: 3, borderRadius: 2, background: '#1e293b', margin: '4px 4px 0', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: v + '%', background: `linear-gradient(90deg,${c}88,${c})`, borderRadius: 2, transition: 'width .8s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 7, fontSize: 9.5, color: '#475569' }}>
                        <span>📝 {turn.gdScores.wc} words</span>
                        <span>⚡ {turn.gdScores.wpm} wpm</span>
                        <span style={{ color: turn.gdScores.fillerCount === 0 ? '#34d399' : '#f59e0b' }}>
                            {turn.gdScores.fillerCount === 0 ? '✓ Fluent' : `${turn.gdScores.fillerCount} filler${turn.gdScores.fillerCount > 1 ? 's' : ''}`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ModuleGDRound({ sessionId, testId, test, onComplete, forceSubmitToken = 0 }) {
    const [phase, setPhase] = useState('loading'); // loading | prep | discussion | concluding | done
    const [gd, setGd] = useState(null);            // { topic, topicId, participants, durationMins, prepSeconds, category }
    const [prepSec, setPrepSec] = useState(30);
    const [timeLeft, setTimeLeft] = useState(0);
    const [turns, setTurns] = useState([]);
    const [activeSpeaker, setActiveSpeaker] = useState(null); // null | 'student' | 'ai_0' etc.
    const [handRaised, setHandRaised] = useState(false);
    const [recording, setRecording] = useState(false);
    const [liveText, setLiveText] = useState('');
    const [finalText, setFinalText] = useState(''); // accumulated full transcript for current turn
    const [submitting, setSubmitting] = useState(false);
    const [myTurnIdx, setMyTurnIdx] = useState(0);
    const [aiSpeakingText, setAiSpeakingText] = useState('');
    const [concludeText, setConcludeText] = useState(''); // optional closing statement
    const [error, setError] = useState('');

    const chatRef = useRef(null);
    const transcriptStripRef = useRef(null);
    const timerRef = useRef(null);
    const gdRef = useRef(null);
    const turnsRef = useRef([]);
    const recRef = useRef(null);
    const accText = useRef('');          // accumulates interim results across multiple onresult events
    const autoStartTimerRef = useRef(null);
    const nextAiTimerRef = useRef(null);
    const postStudentTimerRef = useRef(null);
    const handRaisedRef = useRef(false);
    const phaseRef = useRef('loading');
    const speakStartRef = useRef(null);
    const finalizingRef = useRef(false);

    gdRef.current = gd;
    turnsRef.current = turns;
    handRaisedRef.current = handRaised;
    phaseRef.current = phase;

    /* ── cancel TTS helper ──────────────────────────────────────────────── */
    const cancelTTS = () => { try { window.speechSynthesis?.cancel(); } catch {} };
    const clearQueuedTimers = () => {
        clearTimeout(autoStartTimerRef.current);
        clearTimeout(nextAiTimerRef.current);
        clearTimeout(postStudentTimerRef.current);
    };

    /* ── scroll chat to bottom ──────────────────────────────────────────── */
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
        if (transcriptStripRef.current) transcriptStripRef.current.scrollTop = transcriptStripRef.current.scrollHeight;
    }, [turns, liveText, aiSpeakingText]);

    /* ══════════════════════════════════════════════════════════════════════
       PHASE 0 — Load GD data
       ══════════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.post(`${API}/comm-test/gd/start`, { sessionId, testId }, { headers: authH() });
                if (!data.success) { setError(data.error || 'Failed to load GD'); return; }
                setGd(data);
                setPrepSec(data.prepSeconds || 30);
                setTimeLeft((data.durationMins || 30) * 60);
                setPhase('prep');
            } catch (e) { setError(e.response?.data?.error || 'Failed to start GD'); }
        })();
    }, [sessionId, testId]);

    /* ══════════════════════════════════════════════════════════════════════
       PHASE 1 — Prep countdown
       ══════════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (phase !== 'prep') return;
        if (prepSec <= 0) { setPhase('discussion'); return; }
        const t = setTimeout(() => setPrepSec(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, prepSec]);

    /* ══════════════════════════════════════════════════════════════════════
       PHASE 2 — Discussion: main timer
       ══════════════════════════════════════════════════════════════════════ */
    useEffect(() => {
        if (phase !== 'discussion') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current); finalizeDiscussion({ autoSubmitted: true }); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    /* ── Auto-start: if student doesn't click Start within 5s, AI begins ─ */
    useEffect(() => {
        if (phase !== 'discussion') return;
        autoStartTimerRef.current = setTimeout(() => {
            if (turnsRef.current.length === 0 && !activeSpeaker) triggerAI(0);
        }, 5000);
        return () => clearTimeout(autoStartTimerRef.current);
    }, [phase]);

    useEffect(() => {
        if (!forceSubmitToken || phaseRef.current === 'done') return;
        finalizeDiscussion({ autoSubmitted: true, source: 'section-timer' });
    }, [forceSubmitToken]);

    /* ══════════════════════════════════════════════════════════════════════
       SpeechRecognition — continuous mode, accumulates text
       ══════════════════════════════════════════════════════════════════════ */
    function startMic() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('Speech recognition not supported. Use Chrome.'); return; }
        stopMic(); // ensure clean state
        const r = new SR();
        r.lang = 'en-US';
        r.continuous = true;
        r.interimResults = true;
        r.maxAlternatives = 1;
        accText.current = '';
        let final = '';
        r.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) { final += ' ' + t; } else { interim = t; }
            }
            const full = (final + ' ' + interim).trim();
            accText.current = full;
            setLiveText(full);
            setFinalText(final.trim());
        };
        r.onerror = (e) => { if (e.error !== 'aborted') { console.warn('SR error', e.error); } };
        r.onend = () => {
            // In continuous mode onend fires when user navigates away or mic times out
            // Don't auto-restart — student clicks "Done Speaking" to finish
            setRecording(false);
        };
        recRef.current = r;
        r.start();
        setRecording(true);
        setLiveText('');
        setFinalText('');
    }

    function stopMic() {
        try { recRef.current?.stop(); } catch {}
        recRef.current = null;
        setRecording(false);
    }

    /* ══════════════════════════════════════════════════════════════════════
       TTS — AI speaks aloud with proper voice
       ══════════════════════════════════════════════════════════════════════ */
    function speakTTS(text, onDone) {
        cancelTTS();
        if (!('speechSynthesis' in window) || !text) { onDone?.(); return; }
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'en-US';
        utt.rate = 0.95;
        utt.pitch = 1;
        // Pick a good English voice
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith('en-US')) ||
            voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utt.voice = enVoice;
        utt.onend = () => onDone?.();
        utt.onerror = () => onDone?.();
        window.speechSynthesis.speak(utt);
    }

    // Preload voices on mount
    useEffect(() => {
        window.speechSynthesis?.getVoices();
        const h = () => window.speechSynthesis?.getVoices();
        window.speechSynthesis?.addEventListener?.('voiceschanged', h);
        return () => {
            clearInterval(timerRef.current);
            clearQueuedTimers();
            cancelTTS();
            stopMic();
            window.speechSynthesis?.removeEventListener?.('voiceschanged', h);
        };
    }, []);

    /* ══════════════════════════════════════════════════════════════════════
       AI turn
       ══════════════════════════════════════════════════════════════════════ */
    const triggerAI = useCallback(async (aiIdx) => {
        const g = gdRef.current;
        if (!g || phaseRef.current !== 'discussion') return;
        const p = g.participants[aiIdx % g.participants.length];
        setActiveSpeaker(p.id);
        setAiSpeakingText('...');
        try {
            const recent = turnsRef.current.slice(-8).map(t => ({ speaker: t.speaker_label, transcript: t.transcript }));
            const { data } = await axios.post(`${API}/comm-test/gd/ai-turn`, {
                topic: g.topic, aiName: p.name, previousTurns: recent,
            }, { headers: authH() });
            const speech = data.speech || '...';
            setAiSpeakingText(speech);

            // Add to turns
            const turn = { speaker: p.id, speaker_label: p.name, transcript: speech, isStudent: false };
            setTurns(prev => [...prev, turn]);

            // Speak it aloud
            speakTTS(speech, () => {
                setActiveSpeaker(null);
                setAiSpeakingText('');
                // If student raised hand, start student mic immediately
                if (handRaisedRef.current) {
                    setHandRaised(false);
                    handleSpeak();
                } else if (phaseRef.current === 'discussion') {
                    // Schedule next AI after a pause (let student jump in)
                    nextAiTimerRef.current = setTimeout(() => {
                        if (phaseRef.current === 'discussion' && !handRaisedRef.current) {
                            const nextIdx = (aiIdx + 1) % g.participants.length;
                            triggerAI(nextIdx);
                        }
                    }, 4000);
                }
            });
        } catch {
            setActiveSpeaker(null);
            setAiSpeakingText('');
        }
    }, []);

    /* ══════════════════════════════════════════════════════════════════════
       Action handlers
       ══════════════════════════════════════════════════════════════════════ */

    // Start — student speaks first
    function handleStart() {
        clearTimeout(autoStartTimerRef.current);
        speakStartRef.current = Date.now();
        setActiveSpeaker('student');
        startMic();
    }

    // Speak — student takes a turn (only when no one is speaking)
    function handleSpeak() {
        cancelTTS();
        clearTimeout(nextAiTimerRef.current);
        speakStartRef.current = Date.now();
        setActiveSpeaker('student');
        setHandRaised(false);
        startMic();
    }

    const persistStudentTurn = useCallback(async ({ fallbackDurationSec } = {}) => {
        const text = (accText.current || finalText || liveText || '').trim();
        stopMic();
        if (!text) {
            speakStartRef.current = null;
            setActiveSpeaker(null);
            setLiveText('');
            setFinalText('');
            accText.current = '';
            return null;
        }
        const durationSec = speakStartRef.current
            ? Math.max(3, Math.round((Date.now() - speakStartRef.current) / 1000))
            : Math.max(3, fallbackDurationSec || 15);
        speakStartRef.current = null;

        const gdScores = computeLocalGDScores(text, durationSec, gdRef.current?.topic, turnsRef.current);
        const turnObj = { speaker: 'student', speaker_label: 'You', transcript: text, isStudent: true, gdScores };

        try {
            await axios.post(`${API}/comm-test/gd/turn`, {
                sessionId, turnIndex: myTurnIdx, transcript: text,
                durationSec, wordCount: gdScores.wc, wordsPerMin: gdScores.wpm,
                fillerCount: gdScores.fillerCount, topic: gdRef.current?.topic,
                localScores: gdScores,
            }, { headers: authH() });
        } catch {}
        setTurns(prev => [...prev, turnObj]);
        setMyTurnIdx(i => i + 1);
        setActiveSpeaker(null);
        setLiveText('');
        setFinalText('');
        accText.current = '';
        return turnObj;
    }, [finalText, liveText, myTurnIdx, sessionId]);

    // Done speaking — evaluate with real metrics then submit
    async function handleDone() {
        setSubmitting(true);
        const savedTurn = await persistStudentTurn();
        setSubmitting(false);

        if (!savedTurn) return;

        if (phaseRef.current === 'discussion') {
            const g = gdRef.current;
            if (g) {
                const totalTurns = turnsRef.current.length + 1;
                const nextAiIdx = totalTurns % g.participants.length;
                postStudentTimerRef.current = setTimeout(() => {
                    if (phaseRef.current === 'discussion') triggerAI(nextAiIdx);
                }, 2200);
            }
        }
    }

    // Raise Hand — student wants to go next
    function handleRaiseHand() {
        setHandRaised(true);
        // If no AI is speaking right now, start student immediately
        if (!activeSpeaker || activeSpeaker === 'student') {
            cancelTTS();
            setHandRaised(false);
            handleSpeak();
        }
        // Otherwise the triggerAI onend handler will auto-start mic
    }

    // Conclude — enter concluding phase
    function doConclude() {
        clearInterval(timerRef.current);
        clearQueuedTimers();
        cancelTTS();
        stopMic();
        setActiveSpeaker(null);
        setHandRaised(false);
        setPhase('concluding');
        setConcludeText('');
    }

    const finalizeDiscussion = useCallback(async ({ autoSubmitted = false } = {}) => {
        if (finalizingRef.current) return;
        finalizingRef.current = true;
        setSubmitting(true);
        clearInterval(timerRef.current);
        clearQueuedTimers();
        cancelTTS();
        await persistStudentTurn({ fallbackDurationSec: 10 });
        setActiveSpeaker(null);
        setHandRaised(false);
        setAiSpeakingText('');

        if (!autoSubmitted && concludeText.trim()) {
            try {
                await axios.post(`${API}/comm-test/gd/turn`, {
                    sessionId, turnIndex: myTurnIdx, transcript: concludeText.trim(),
                    durationSec: 10, topic: gdRef.current?.topic,
                }, { headers: authH() });
            } catch {}
        }

        try {
            await axios.post(`${API}/comm-test/gd/conclude`, {
                sessionId, topic: gdRef.current?.topic,
                aiTurns: turnsRef.current.filter(t => !t.isStudent).map(t => t.transcript),
            }, { headers: authH() });
        } catch {}
        setSubmitting(false);
        setPhase('done');
        onComplete();
    }, [concludeText, myTurnIdx, onComplete, persistStudentTurn, sessionId]);

    // Final submit — optional closing statement, then end test
    async function handleFinalSubmit() {
        await finalizeDiscussion({ autoSubmitted: false });
    }

    /* ── Helpers ─────────────────────────────────────────────────────────── */
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const studentTurns = turns.filter(t => t.isStudent);

    /* ══════════════════════════════════════════════════════════════════════
       RENDER — LOADING
       ══════════════════════════════════════════════════════════════════════ */
    if (phase === 'loading') return (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
            <div style={{ width: 40, height: 40, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'gdSpin 0.8s linear infinite' }} />
            Loading Group Discussion…
            {error && <div style={{ color: C.red, marginTop: 12 }}><AlertCircle size={14} style={{ verticalAlign: 'middle' }} /> {error}</div>}
            <style>{gdStyles}</style>
        </div>
    );

    /* ══════════════════════════════════════════════════════════════════════
       RENDER — PREP PHASE
       ══════════════════════════════════════════════════════════════════════ */
    if (phase === 'prep') return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Topic card */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '1px solid #6366f144', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Group Discussion Topic</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.4, marginBottom: 14 }}>
                    "{gd?.topic}"
                </div>
                <div style={{ fontSize: 12, color: '#a5b4fc', background: '#312e8155', borderRadius: 8, padding: '5px 14px', display: 'inline-block' }}>
                    {gd?.category || 'General'}
                </div>
            </div>

            {/* Countdown */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Preparation Time</div>
                <div style={{ fontSize: 64, fontWeight: 900, color: prepSec <= 10 ? C.red : C.indigo, lineHeight: 1, transition: 'color 0.3s' }}>
                    {prepSec}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>seconds — think about your key points</div>

                {/* Stats bar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 18 }}>
                    {[
                        [gd?.participants?.length + 1, 'Participants'],
                        [gd?.durationMins, 'Minutes'],
                        [gd?.participants?.length, 'AI Speakers'],
                    ].map(([v, l]) => (
                        <div key={l} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: C.indigo }}>{v}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                        </div>
                    ))}
                </div>

                <button onClick={() => setPhase('discussion')} style={{ marginTop: 18, padding: '10px 28px', background: C.indigo, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Start Early →
                </button>
            </div>

            {/* Conference Room preview during prep */}
            <ConferenceRoom
                participants={gd?.participants || []}
                activeSpeaker={null}
                studentIsSpeaking={false}
                handRaised={false}
                topic={gd?.topic}
            />
            <style>{gdStyles}</style>
        </div>
    );

    /* ══════════════════════════════════════════════════════════════════════
       RENDER — CONCLUDING PHASE (final speech + submit)
       ══════════════════════════════════════════════════════════════════════ */
    if (phase === 'concluding') return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'gdFadeIn 0.4s' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
                <StopCircle size={28} color="#f87171" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Discussion Ended</div>
                <div style={{ fontSize: 12, color: '#a5b4fc' }}>
                    You spoke {studentTurns.length} time{studentTurns.length !== 1 ? 's' : ''} · {turns.length} total turns
                </div>
            </div>

            {/* Optional final speech */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                    📝 Final Statement <span style={{ fontWeight: 400, color: C.muted, fontSize: 11 }}>(optional)</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>
                    Summarise your position or add any final thoughts before submitting.
                </div>
                <textarea
                    value={concludeText}
                    onChange={e => setConcludeText(e.target.value)}
                    placeholder="Type your closing statement here… (optional)"
                    maxLength={800}
                    rows={4}
                    style={{
                        width: '100%', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
                        padding: '10px 14px', color: C.text, fontSize: 13, resize: 'vertical', outline: 'none',
                        fontFamily: 'inherit', lineHeight: 1.5,
                    }}
                />
                <div style={{ fontSize: 10, color: C.muted, textAlign: 'right', marginTop: 4 }}>{concludeText.length}/800</div>
            </div>

            <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                style={{
                    padding: '14px 0', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 15,
                    background: submitting ? C.muted : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
            >
                <Send size={16} />
                {submitting ? 'Submitting…' : 'Submit & Finish GD'}
            </button>
            <style>{gdStyles}</style>
        </div>
    );

    if (phase === 'done') return null;

    /* ══════════════════════════════════════════════════════════════════════
       RENDER — DISCUSSION PHASE  (immersive room view)
       ══════════════════════════════════════════════════════════════════════ */
    const aiIsSpeaking = activeSpeaker && activeSpeaker !== 'student';
    const studentIsSpeaking = activeSpeaker === 'student';
    const avgScore = studentTurns.length > 0
        ? Math.round(studentTurns.reduce((a, t) => a + (t.gdScores ? (t.gdScores.comm + t.gdScores.gd + t.gdScores.conf) / 3 : 0), 0) / studentTurns.length)
        : null;
    const speakerName = gd?.participants?.find(p => p.id === activeSpeaker)?.name?.replace(/\s*\(AI\)\s*/i, '') || 'AI';

    // Last transcript per seat — drives speech bubbles in the room
    const lastTurns = {};
    turns.forEach(t => { lastTurns[t.isStudent ? 'student' : t.speaker] = t.transcript; });

    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: '#080f1a',
            display: 'flex', flexDirection: 'column',
            padding: '8px 12px 10px',
            gap: 7, overflow: 'hidden', boxSizing: 'border-box',
        }}>

            {/* ── Status bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 14px',
                background: 'linear-gradient(90deg,#0d1b35,#0f1929)',
                border: '1px solid #1e3a5f33', borderRadius: 12,
                flexShrink: 0,
            }}>
                <Volume2 size={13} color="#818cf8" />
                <div style={{ flex: 1, fontSize: 11.5, color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gd?.topic}
                </div>
                {/* Inline stats + speaker indicator */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>
                        Turns: <span style={{ color: C.indigo, fontWeight: 800 }}>{studentTurns.length}</span>
                    </span>
                    {avgScore != null && (
                        <span style={{ fontSize: 11, color: C.muted }}>
                            Avg: <span style={{ fontWeight: 800, color: avgScore >= 70 ? C.green : avgScore >= 50 ? C.amber : C.red }}>{avgScore}</span>
                        </span>
                    )}
                    {(aiIsSpeaking || studentIsSpeaking) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: aiIsSpeaking ? '#1e1b4b88' : '#02280f88', borderRadius: 8, padding: '3px 8px' }}>
                            <AudioWave active color={aiIsSpeaking ? '#818cf8' : C.green} size="sm" />
                            <span style={{ fontSize: 10, color: aiIsSpeaking ? '#818cf8' : C.green, fontWeight: 700 }}>
                                {aiIsSpeaking ? speakerName : 'You'} speaking
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: timeLeft <= 60 ? C.red : timeLeft <= 180 ? C.amber : C.indigo, flexShrink: 0 }}>
                    <Clock size={13} /> {fmt(timeLeft)}
                </div>
            </div>

            {/* ── Immersive room — main view ── */}
            <ImmersiveRoom
                participants={gd?.participants || []}
                activeSpeaker={activeSpeaker}
                studentIsSpeaking={studentIsSpeaking}
                handRaised={handRaised}
                topic={gd?.topic}
                lastTurns={lastTurns}
            />

            {/* ── Full transcript strip — scrollable, all turns ── */}
            {turns.length > 0 && (
                <div ref={transcriptStripRef} style={{
                    background: '#0a1220', border: '1px solid #1a2640', borderRadius: 10,
                    padding: '7px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
                    maxHeight: 148, overflowY: 'auto',
                    scrollBehavior: 'smooth',
                }}>
                    <div style={{ fontSize: 8, color: '#1e3a5f', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 2, flexShrink: 0 }}>Discussion Log</div>
                    {turns.map((t, i) => {
                        const lbl = (t.speaker_label || t.speaker || '').replace(/\s*\(AI\)\s*/i, '').replace(/\s*\(Student\)\s*/i, '') || (t.isStudent ? 'You' : 'AI');
                        const col = t.isStudent ? C.indigo : getSpeakerColor(lbl);
                        return (
                            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 10.5, paddingBottom: 3, borderBottom: i < turns.length - 1 ? '1px solid #111e30' : 'none' }}>
                                <span style={{ color: col, fontWeight: 800, flexShrink: 0, minWidth: 44, textAlign: 'right' }}>{lbl}:</span>
                                <span style={{ color: '#4a6080', lineHeight: 1.45, flex: 1, minWidth: 0 }}>
                                    {t.transcript.length > 160 ? t.transcript.slice(0, 157) + '\u2026' : t.transcript}
                                </span>
                                {t.isStudent && t.gdScores && (
                                    <span style={{ fontSize: 9, color: t.gdScores.comm >= 70 ? C.green : t.gdScores.comm >= 50 ? C.amber : C.red, fontWeight: 800, flexShrink: 0, marginLeft: 4 }}>
                                        {Math.round((t.gdScores.comm + t.gdScores.gd + t.gdScores.conf) / 3)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Live transcript ── */}
            {recording && (
                <div style={{ padding: '7px 12px', background: '#032014', border: '1px solid #10b98133', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'gdPulse 1s infinite', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: '#34d399', fontStyle: 'italic', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {liveText || 'Listening\u2026 speak now'}
                    </div>
                </div>
            )}

            {/* ── Control panel ── */}
            <div style={{ background: '#0c1524', border: '1px solid #1e293b', borderRadius: 14, padding: '10px 12px', flexShrink: 0 }}>
                {!recording ? (
                    turns.length === 0 && !aiIsSpeaking ? (
                        <button onClick={handleStart} style={primaryBtn('#10b981')}>
                            <ChevronRight size={20} /> Start Speaking
                        </button>
                    ) : (
                        <button onClick={handleSpeak} disabled={aiIsSpeaking} style={primaryBtn('#4f46e5', !aiIsSpeaking)}>
                            <Mic size={20} /> Speak Now
                        </button>
                    )
                ) : (
                    <button onClick={handleDone} disabled={submitting} style={primaryBtn('#059669')}>
                        <MicOff size={20} /> {submitting ? 'Analysing\u2026' : 'Done Speaking'}
                    </button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 8 }}>
                    <button onClick={handleRaiseHand} disabled={studentIsSpeaking || recording} style={secondaryBtn(!studentIsSpeaking && !recording, handRaised, false)}>
                        <Hand size={15} /> {handRaised ? '\u270b Queued \u2013 next!' : 'Raise Hand'}
                    </button>
                    <button onClick={doConclude} style={secondaryBtn(true, false, true)}>
                        <StopCircle size={15} /> End Discussion
                    </button>
                </div>
            </div>

            <style>{gdStyles}</style>
        </div>
    );
}

/* ── Primary (full-width) button ────────────────────────────────────────── */
function primaryBtn(bg, enabled = true) {
    return {
        width: '100%', padding: '13px 0', border: 'none', borderRadius: 12,
        background: enabled ? bg : '#334155',
        color: '#fff', fontWeight: 800, fontSize: 14,
        cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all .2s',
    };
}

/* ── Secondary (half-width) button ──────────────────────────────────────── */
function secondaryBtn(enabled = true, active = false, danger = false) {
    return {
        padding: '10px 0', borderRadius: 10,
        border: `1px solid ${active ? '#f59e0b' : danger ? '#7f1d1d' : '#334155'}`,
        background: active ? '#92400e' : danger ? '#450a0a' : '#1e293b',
        color: active ? '#fcd34d' : danger ? '#fca5a5' : '#94a3b8',
        fontWeight: 700, fontSize: 12,
        cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.45,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all .2s',
    };
}

/* ── Keyframe styles ────────────────────────────────────────────────────── */
const gdStyles = `
@keyframes gdSpin  { to { transform: rotate(360deg); } }
@keyframes gdPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes gdFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes gdWave {
    0%   { height: 4px;  }
    25%  { height: 14px; }
    50%  { height: 22px; }
    75%  { height: 10px; }
    100% { height: 6px;  }
}
@keyframes gdRingPulse { 0%,100%{opacity:1} 50%{opacity:.55} }
@keyframes gdFloat { from{transform:translateY(0)} to{transform:translateY(-5px)} }
`;
