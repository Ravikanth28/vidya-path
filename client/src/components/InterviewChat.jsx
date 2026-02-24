import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Building2, Send, Mic, MicOff, Maximize2, Minimize2, Settings, Loader2, MessageCircle, Info, Sparkles } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { AvatarViewer } from './AvatarViewer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function InterviewChat({ attempt, onClose }) {
    const [messages, setMessages] = useState(attempt.messages || []);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(attempt.interview_progress || 0);
    const [speaking, setSpeaking] = useState(false);
    const ref = useRef(null);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            speakText(messages[messages.length - 1].content);
        }
    }, [messages]);

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const toggleMic = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
        }
    };

    const send = async (overrideText = null) => {
        const msg = overrideText || input;
        if (!msg.trim() || sending) return;

        if (listening) SpeechRecognition.stopListening();
        window.speechSynthesis.cancel();

        setInput('');
        resetTranscript();
        setSending(true);

        setMessages(p => [...p, { role: 'user', content: msg }]);

        try {
            const { data } = await axios.post(`${API}/api/company/interviews/attempt/${attempt.id}/message`, { message: msg });
            setMessages(p => [...p, { role: 'assistant', content: data.message }]);
            if (data.interview_progress !== undefined) setProgress(data.interview_progress);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const skipQuestion = () => {
        send("I would like to skip this question and move to the next one.");
    };

    const finish = async () => {
        if (!confirm('End the interview and get your evaluation?')) return;
        if (listening) SpeechRecognition.stopListening();
        window.speechSynthesis.cancel();
        setSending(true);
        try {
            const { data } = await axios.post(`${API}/api/company/interviews/attempt/${attempt.id}/finish`, { codingSubmissions: [], sqlSubmissions: [] });
            onClose(data.evaluation);
        } catch (e) {
            alert('Evaluation failed');
            setSending(false);
        }
    };

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const latestAIQuestion = messages.slice().reverse().find(m => m.role === 'assistant')?.content || '';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#020617', display: 'flex', flexDirection: 'column', color: 'white' }}>

            {/* Top Bar */}
            <div style={{ padding: '16px 30px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '8px', background: '#3b82f6', borderRadius: '10px' }}>
                        <Building2 size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{attempt.companyName}</h2>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Proctored AI Interview</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Session Progress</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '200px', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{Math.round(progress)}%</span>
                        </div>
                    </div>
                    <div style={{ borderLeft: '1px solid #1e293b', height: '30px', margin: '0 10px' }} />
                    <button onClick={finish} disabled={sending} style={{ padding: '8px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Finish Session</button>
                    <button onClick={() => { window.speechSynthesis.cancel(); onClose(null); }} style={{ padding: '8px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Exit</button>
                </div>
            </div>

            {/* Main Layout: Split Screen */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Left Side: The Interviewer (Avatar & Current Question) */}
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', background: '#020617', borderRight: '1px solid #1e293b', padding: '40px' }}>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
                        <div style={{ width: '100%', maxWidth: '400px', marginBottom: '40px', flexShrink: 0 }}>
                            <AvatarViewer speaking={speaking || sending} />
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: speaking ? '#22c55e' : '#64748b', boxShadow: speaking ? '0 0 10px #22c55e' : 'none', animation: speaking ? 'pulse 1.5s infinite' : 'none' }} />
                                <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    CURRENT QUESTION {speaking && <Sparkles size={14} className="spinning" />}
                                </span>
                            </div>

                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid #1e293b', borderRadius: '24px',
                                padding: '32px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                overflowY: 'auto', maxHeight: '300px', scrollbarWidth: 'thin'
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: latestAIQuestion.length > 200 ? '18px' : '22px',
                                    lineHeight: '1.7',
                                    color: '#f8fafc',
                                    fontWeight: 500,
                                    transition: 'font-size 0.3s ease'
                                }}>
                                    {latestAIQuestion || "Initializing interview..."}
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* Quick Tips or Info */}
                    <div style={{ marginTop: '20px', padding: '16px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Info size={16} color="#3b82f6" />
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                            Answer clearly. You can use your voice or type your response below.
                        </p>
                    </div>
                </div>

                {/* Right Side: Conversation History & Interaction */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020617' }}>

                    {/* Transcript Header */}
                    <div style={{ padding: '15px 30px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageCircle size={16} color="#64748b" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Interview Transcript</span>
                    </div>

                    {/* Scrollable History */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{m.role === 'user' ? 'You' : 'AI Interviewer'}</span>
                                    </div>
                                    <div style={{
                                        maxWidth: '85%', padding: '14px 20px', borderRadius: '18px', fontSize: '14px', lineHeight: '1.6',
                                        ...(m.role === 'user' ?
                                            { background: '#3b82f6', color: 'white', borderBottomRightRadius: '4px' } :
                                            { background: '#1e293b', color: '#e2e8f0', borderBottomLeftRadius: '4px', border: '1px solid #334155' }
                                        )
                                    }}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {sending && (
                                <div style={{ display: 'flex', gap: '6px', padding: '10px' }}>
                                    {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', animation: `bounce 0.8s ${i * 0.1}s infinite` }} />)}
                                </div>
                            )}
                            <div ref={ref} />
                        </div>
                    </div>

                    {/* Input Area (Floating at bottom of right pane) */}
                    <div style={{ padding: '30px', background: 'linear-gradient(to top, #020617, transparent)' }}>
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Your Response</span>
                                <button onClick={skipQuestion} disabled={sending} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #1e293b', borderRadius: '6px', color: '#f59e0b', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Skip Question</button>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>

                                {browserSupportsSpeechRecognition && (
                                    <button
                                        onClick={toggleMic}
                                        style={{
                                            width: '56px', height: '56px', borderRadius: '18px', border: 'none',
                                            background: listening ? '#ef4444' : '#1e293b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: listening ? '0 0 25px rgba(239, 68, 68, 0.5)' : 'none',
                                            flexShrink: 0
                                        }}
                                    >
                                        {listening ? <Mic color="white" size={24} /> : <MicOff color="#94a3b8" size={24} />}
                                    </button>
                                )}

                                <div style={{ flex: 1, position: 'relative' }}>
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                        placeholder={listening ? "Listening to your voice..." : "Type your answer here..."}
                                        style={{
                                            width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px',
                                            padding: '18px 20px', color: 'white', resize: 'none', height: '100px', fontSize: '16px',
                                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => send()}
                                    disabled={sending || (!input.trim() && !listening)}
                                    style={{
                                        width: '56px', height: '56px', background: '#3b82f6', borderRadius: '18px', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        opacity: (!input.trim() && !listening) || sending ? 0.3 : 1, transition: '0.3s',
                                        flexShrink: 0
                                    }}
                                >
                                    {sending ? <Loader2 size={24} color="white" className="animate-spin" /> : <Send size={24} color="white" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .spinning { animation: spin 2s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                /* Custom Scrollbar for the Question Box */
                div::-webkit-scrollbar {
                    width: 6px;
                }
                div::-webkit-scrollbar-track {
                    background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-8px); opacity: 1; }
                }
                textarea:focus { border-color: #3b82f6 !format; }
            `}</style>

        </div>
    );
}
