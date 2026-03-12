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
            background: '#1e293b', border: '1px solid #334155', borderRadius: 20,
            padding: '14px 14px', marginBottom: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
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
   Chat bubble
   ═══════════════════════════════════════════════════════════════════════════ */
function ChatBubble({ turn }) {
    const isStu = turn.isStudent;
    return (
        <div style={{ display: 'flex', gap: 10, justifyContent: isStu ? 'flex-end' : 'flex-start', marginBottom: 14, animation: 'gdFadeIn 0.35s ease-out' }}>
            {!isStu && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e1b4b', border: '1px solid #6366f144', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8', flexShrink: 0, marginTop: 14 }}>
                    {(turn.speaker_label || turn.speaker || '').replace(/\s*\(AI\)/i, '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
            )}
            <div style={{ maxWidth: '72%' }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, textAlign: isStu ? 'right' : 'left', fontWeight: 600 }}>
                    {turn.speaker_label || turn.speaker}
                </div>
                <div style={{
                    background: isStu ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : C.card,
                    border: `1px solid ${isStu ? '#6366f144' : C.border}`,
                    borderRadius: isStu ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '10px 14px', fontSize: 13, color: C.text, lineHeight: 1.55,
                }}>
                    {turn.transcript}
                </div>
                {/* Score chips for student turns */}
                {isStu && turn.languageScore != null && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 5, fontSize: 10 }}>
                        {[['Lang', turn.languageScore, '#a78bfa'], ['Pron', turn.pronunciationScore, '#34d399'], ['Conf', turn.confidenceScore, '#fb923c']].map(([l, v, c]) => (
                            <span key={l} style={{ background: c + '22', color: c, padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>{l} {v}%</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ModuleGDRound({ sessionId, testId, test, onComplete }) {
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
    const timerRef = useRef(null);
    const gdRef = useRef(null);
    const turnsRef = useRef([]);
    const recRef = useRef(null);
    const accText = useRef('');          // accumulates interim results across multiple onresult events
    const autoStartTimerRef = useRef(null);
    const handRaisedRef = useRef(false);
    const phaseRef = useRef('loading');

    gdRef.current = gd;
    turnsRef.current = turns;
    handRaisedRef.current = handRaised;
    phaseRef.current = phase;

    /* ── cancel TTS helper ──────────────────────────────────────────────── */
    const cancelTTS = () => { try { window.speechSynthesis?.cancel(); } catch {} };

    /* ── scroll chat to bottom ──────────────────────────────────────────── */
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
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
                if (t <= 1) { clearInterval(timerRef.current); doConclude(); return 0; }
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
        return () => { cancelTTS(); window.speechSynthesis?.removeEventListener?.('voiceschanged', h); };
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
                    setTimeout(() => {
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
        setActiveSpeaker('student');
        startMic();
    }

    // Speak — student takes a turn (only when no one is speaking)
    function handleSpeak() {
        cancelTTS();
        setActiveSpeaker('student');
        setHandRaised(false);
        startMic();
    }

    // Done speaking — submit student turn
    async function handleDone() {
        stopMic();
        const text = (accText.current || finalText || liveText || '').trim();
        if (!text) { setActiveSpeaker(null); setLiveText(''); return; }

        setSubmitting(true);
        const turnObj = { speaker: 'student', speaker_label: 'You (Student)', transcript: text, isStudent: true };
        try {
            const { data } = await axios.post(`${API}/comm-test/gd/turn`, {
                sessionId, turnIndex: myTurnIdx, transcript: text,
                durationSec: 15, topic: gdRef.current?.topic,
            }, { headers: authH() });
            turnObj.languageScore = data.languageScore;
            turnObj.pronunciationScore = data.pronunciationScore;
            turnObj.confidenceScore = data.confidenceScore;
        } catch {}
        setTurns(prev => [...prev, turnObj]);
        setMyTurnIdx(i => i + 1);
        setActiveSpeaker(null);
        setLiveText('');
        setFinalText('');
        accText.current = '';
        setSubmitting(false);

        // After student speaks, next AI goes after a short pause
        if (phaseRef.current === 'discussion') {
            const g = gdRef.current;
            if (g) {
                const totalTurns = turnsRef.current.length + 1;
                const nextAiIdx = totalTurns % g.participants.length;
                setTimeout(() => {
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
        cancelTTS();
        stopMic();
        setActiveSpeaker(null);
        setPhase('concluding');
        setConcludeText('');
    }

    // Final submit — optional closing statement, then end test
    async function handleFinalSubmit() {
        setSubmitting(true);
        // If student wrote/spoke a closing remark, save it as a turn
        if (concludeText.trim()) {
            try {
                await axios.post(`${API}/comm-test/gd/turn`, {
                    sessionId, turnIndex: myTurnIdx, transcript: concludeText.trim(),
                    durationSec: 10, topic: gdRef.current?.topic,
                }, { headers: authH() });
            } catch {}
        }
        // Conclude GD
        try {
            await axios.post(`${API}/comm-test/gd/conclude`, {
                sessionId, topic: gdRef.current?.topic,
                aiTurns: turns.filter(t => !t.isStudent).map(t => t.transcript),
            }, { headers: authH() });
        } catch {}
        setSubmitting(false);
        setPhase('done');
        onComplete();
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
       RENDER — DISCUSSION PHASE (main GD UI)
       ══════════════════════════════════════════════════════════════════════ */
    const aiIsSpeaking = activeSpeaker && activeSpeaker !== 'student';
    const studentIsSpeaking = activeSpeaker === 'student';
    const nobodySpeaking = !activeSpeaker;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
            {/* ── Top bar: topic + timer ──────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 10,
                background: 'linear-gradient(90deg, #1e1b4b, #1e293b)', border: '1px solid #6366f133', borderRadius: 12,
            }}>
                <Volume2 size={14} color="#818cf8" />
                <div style={{ flex: 1, fontSize: 12, color: '#a5b4fc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gd?.topic}
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800,
                    color: timeLeft <= 60 ? C.red : timeLeft <= 180 ? C.amber : C.indigo, flexShrink: 0,
                }}>
                    <Clock size={13} /> {fmt(timeLeft)}
                </div>
            </div>

            {/* ── Conference Room ────────────────────────────────────── */}
            <ConferenceRoom
                participants={gd?.participants || []}
                activeSpeaker={activeSpeaker}
                studentIsSpeaking={studentIsSpeaking}
                handRaised={handRaised}
                topic={gd?.topic}
            />

            {/* ── Global wave bar when someone speaks ─────────────────── */}
            {(aiIsSpeaking || studentIsSpeaking) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '6px 0', marginBottom: 8,
                    background: aiIsSpeaking ? '#1e1b4b' : '#052e16', borderRadius: 10, border: `1px solid ${aiIsSpeaking ? '#6366f133' : '#10b98133'}`,
                }}>
                    <AudioWave active color={aiIsSpeaking ? '#818cf8' : C.green} size="lg" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: aiIsSpeaking ? '#818cf8' : C.green }}>
                        {aiIsSpeaking
                            ? `${(gd?.participants?.find(p => p.id === activeSpeaker)?.name || 'AI')} is speaking…`
                            : recording ? 'You are speaking…' : 'Your turn!'}
                    </span>
                    <AudioWave active color={aiIsSpeaking ? '#818cf8' : C.green} size="lg" />
                </div>
            )}

            {/* ── Chat transcript ─────────────────────────────────────── */}
            <div ref={chatRef} style={{
                flex: 1, overflowY: 'auto', padding: '8px 4px 14px', minHeight: 180, maxHeight: 300,
                scrollBehavior: 'smooth',
            }}>
                {turns.length === 0 && !aiSpeakingText && (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: C.muted, fontSize: 13 }}>
                        Discussion starting… Click <strong style={{ color: C.green }}>Start</strong> to begin, or AI will start in 5 seconds.
                    </div>
                )}
                {turns.map((t, i) => <ChatBubble key={i} turn={t} />)}

                {/* AI typing indicator */}
                {aiIsSpeaking && aiSpeakingText === '...' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', color: '#818cf8', fontSize: 12 }}>
                        <AudioWave active color="#818cf8" size="sm" />
                        <span>AI is thinking…</span>
                    </div>
                )}
            </div>

            {/* ── Live transcript while recording ─────────────────────── */}
            {recording && (
                <div style={{
                    margin: '0 0 8px', padding: '8px 14px', borderRadius: 10,
                    background: '#052e16', border: '1px solid #10b98133',
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, animation: 'gdPulse 1s infinite', flexShrink: 0, marginTop: 4 }} />
                    <div style={{ fontSize: 12, color: '#34d399', fontStyle: 'italic', flex: 1 }}>
                        {liveText || 'Listening… speak now'}
                    </div>
                </div>
            )}

            {/* ── Action buttons ──────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
                {/* 1) Start / Speak / Done */}
                {!recording ? (
                    turns.length === 0 && !aiIsSpeaking ? (
                        /* Start button — first move */
                        <button onClick={handleStart} style={btnStyle(C.green, true)}>
                            <ChevronRight size={18} /><span>Start</span>
                        </button>
                    ) : (
                        /* Speak button */
                        <button
                            onClick={handleSpeak}
                            disabled={aiIsSpeaking || recording}
                            style={btnStyle('#4f46e5', !aiIsSpeaking && !recording)}
                        >
                            <Mic size={18} /><span>Speak</span>
                        </button>
                    )
                ) : (
                    /* Done Speaking */
                    <button onClick={handleDone} disabled={submitting} style={btnStyle(C.green, true)}>
                        <MicOff size={18} /><span>{submitting ? '…' : 'Done'}</span>
                    </button>
                )}

                {/* 2) Raise Hand */}
                <button
                    onClick={handleRaiseHand}
                    disabled={studentIsSpeaking || recording}
                    style={{
                        ...btnStyle(handRaised ? '#92400e' : '#334155', !studentIsSpeaking && !recording),
                        border: handRaised ? '2px solid #f59e0b' : '1px solid transparent',
                        color: handRaised ? C.amber : C.sub,
                    }}
                >
                    <Hand size={18} /><span>{handRaised ? 'Queued' : 'Raise Hand'}</span>
                </button>

                {/* 3) Turns count indicator */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: C.card, borderRadius: 10, padding: '10px 4px',
                }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: C.indigo }}>{studentTurns.length}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>Your turns</span>
                </div>

                {/* 4) Conclude */}
                <button onClick={doConclude} style={btnStyle('#450a0a', true, '#7f1d1d')}>
                    <StopCircle size={18} /><span>Conclude</span>
                </button>
            </div>

            <style>{gdStyles}</style>
        </div>
    );
}

/* ── Button style helper ────────────────────────────────────────────────── */
function btnStyle(bg, enabled, border) {
    return {
        padding: '12px 4px', background: bg || '#334155',
        border: border ? `1px solid ${border}` : 'none',
        borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 12,
        cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.45,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
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
