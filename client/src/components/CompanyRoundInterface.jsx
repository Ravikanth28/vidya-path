/**
 * CompanyRoundInterface.jsx — Student view for Company Round Tests
 * Supports: MCQ, Coding, Debugging, SQL sections with proctoring
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import {
    Building2, Clock, Play, Check, ChevronRight, ChevronDown, ChevronUp,
    AlertTriangle, Shield, Eye, EyeOff, Database, Code, Brain, RefreshCw,
    CheckCircle2, XCircle, Award, BarChart2, ArrowRight, X, Loader2,
    FileText, Target, Zap, Lock
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SECTIONS = {
    aptitude:     { label: 'Aptitude',      icon: '🧮', kind: 'mcq',  color: '#f59e0b' },
    verbal:       { label: 'Verbal',        icon: '📝', kind: 'mcq',  color: '#06b6d4' },
    logical:      { label: 'Logical',       icon: '🧠', kind: 'mcq',  color: '#8b5cf6' },
    reasoning:    { label: 'Reasoning',     icon: '🔍', kind: 'mcq',  color: '#ec4899' },
    technical_mcq:{ label: 'Technical MCQ', icon: '💻', kind: 'mcq',  color: '#3b82f6' },
    pseudocode:   { label: 'Pseudo Code',   icon: '📋', kind: 'mcq',  color: '#10b981' },
    debug:        { label: 'Debugging',     icon: '🐛', kind: 'code', color: '#ef4444' },
    coding:       { label: 'Coding',        icon: '⌨️',  kind: 'code', color: '#6366f1' },
    sql:          { label: 'SQL',           icon: '🗄️',  kind: 'sql',  color: '#14b8a6' },
};

function authHeader() {
    const t = localStorage.getItem('authToken');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Timer({ totalSeconds, onExpire }) {
    const [remaining, setRemaining] = useState(totalSeconds);
    useEffect(() => {
        const id = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) { clearInterval(id); onExpire(); return 0; }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, []);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const isUrgent = remaining < 300;
    const fmt = n => String(n).padStart(2, '0');
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)', border: `1px solid ${isUrgent ? '#ef4444' : '#3b82f6'}40`, color: isUrgent ? '#f87171' : '#60a5fa', fontWeight: 700, fontSize: '14px', transition: 'all 0.3s' }}>
            <Clock size={14} />
            {h > 0 && `${fmt(h)}:`}{fmt(m)}:{fmt(s)}
        </div>
    );
}

// ─── MCQ Question Component ───────────────────────────────────────────────────
function MCQQuestion({ question, index, answer, onChange }) {
    const letters = ['A', 'B', 'C', 'D'];
    return (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '18px', border: '1px solid #334155', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <span style={{ background: '#334155', color: '#94a3b8', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>Q{index + 1}</span>
                <p style={{ margin: 0, color: '#f1f5f9', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{question.question}</p>
            </div>
            {question.code_snippet && (
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '13px', color: '#a5f3fc', overflow: 'auto', border: '1px solid #334155' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{question.code_snippet}</pre>
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(question.options || []).map((opt, oi) => {
                    const letter = letters[oi];
                    const selected = answer === letter;
                    return (
                        <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '9px', cursor: 'pointer', background: selected ? 'rgba(59,130,246,0.15)' : 'rgba(30,41,59,0.5)', border: `2px solid ${selected ? '#3b82f6' : '#334155'}`, transition: 'all 0.15s' }}>
                            <input type="radio" name={`q${question.id}`} value={letter} checked={selected} onChange={() => onChange(letter)} style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                            <span style={{ fontWeight: selected ? 700 : 400, color: selected ? '#93c5fd' : '#cbd5e1', fontSize: '14px' }}>{opt}</span>
                        </label>
                    );
                })}
            </div>
            {!answer && <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#64748b' }}>⚠ Not answered yet</p>}
        </div>
    );
}

// ─── Coding/Debug Question Component ──────────────────────────────────────────
function CodingQuestion({ question, index, answer, onChange, attemptId, isDebug }) {
    const [code, setCode] = useState(answer?.code || question.starter_code || '');
    const [language, setLanguage] = useState(answer?.language || question.language || 'Python');
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState('');
    const [testResults, setTestResults] = useState(null);
    const [showSchema, setShowSchema] = useState(false);

    const LANG_MAP = { Python: 'python', JavaScript: 'javascript', Java: 'java', 'C': 'c', 'C++': 'cpp' };

    const runCode = async (stdin = '') => {
        setRunning(true); setOutput('Running…');
        try {
            const { data } = await axios.post(`${API}/api/crt/attempt/${attemptId}/run-code`, { code, language, stdin }, { headers: authHeader() });
            setOutput(data.output || '(no output)');
        } catch (e) { setOutput(`Error: ${e.message}`); }
        setRunning(false);
    };

    const runAllTests = async () => {
        setRunning(true);
        const tcs = question.test_cases || [];
        const results = [];
        for (const tc of tcs) {
            try {
                const { data } = await axios.post(`${API}/api/crt/attempt/${attemptId}/run-code`, { code, language, stdin: String(tc.input || '') }, { headers: authHeader() });
                const actual = (data.output || '').trim();
                const expected = String(tc.expected_output || '').trim();
                results.push({ input: tc.input, expected, actual, passed: actual === expected });
            } catch (e) { results.push({ input: tc.input, expected: tc.expected_output, actual: `Error: ${e.message}`, passed: false }); }
        }
        setTestResults(results);
        const passed = results.filter(r => r.passed).length;
        setOutput(`${passed}/${results.length} test cases passed`);
        setRunning(false);

        // Update answer with latest code
        onChange({ code, language, student_answer: code });
    };

    const handleCodeChange = (v) => {
        setCode(v);
        onChange({ code: v, language, student_answer: v });
    };

    return (
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', marginBottom: '16px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ background: '#334155', color: '#94a3b8', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>Q{index + 1}</span>
                <p style={{ margin: 0, color: '#f1f5f9', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', flex: 1 }}>{question.question}</p>
            </div>

            {/* Buggy code for debug */}
            {isDebug && question.code_snippet && (
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#f87171' }}>🐛 Buggy Code to Fix:</p>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>{question.code_snippet}</pre>
                </div>
            )}

            {/* Language selector + run buttons */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #334155', display: 'flex', gap: '8px', alignItems: 'center', background: '#0f172a', flexWrap: 'wrap' }}>
                <select value={language} onChange={e => { setLanguage(e.target.value); onChange({ code, language: e.target.value, student_answer: code }); }}
                    style={{ background: '#1e293b', border: '1px solid #475569', color: '#f1f5f9', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                    {['Python', 'JavaScript', 'Java', 'C', 'C++'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => runCode()} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#94a3b8', cursor: running ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    {running ? <Loader2 size={13} className="spin" /> : <Play size={13} />} Run
                </button>
                {(question.test_cases || []).length > 0 && (
                    <button onClick={runAllTests} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: running ? '#475569' : 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '8px', color: '#fff', cursor: running ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700 }}>
                        <Zap size={13} /> Run All Tests
                    </button>
                )}
                <span style={{ fontSize: '11px', color: '#475569', marginLeft: 'auto' }}>{(question.test_cases || []).length} test case{question.test_cases?.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Monaco editor */}
            <div style={{ borderBottom: '1px solid #334155' }}>
                <Editor
                    height="220px"
                    language={LANG_MAP[language] || 'python'}
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true }}
                />
            </div>

            {/* Output */}
            {output && (
                <div style={{ padding: '10px 14px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>OUTPUT:</p>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#a5f3fc', whiteSpace: 'pre-wrap' }}>{output}</pre>
                </div>
            )}

            {/* Test case results */}
            {testResults && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid #334155' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                        Test Results: <span style={{ color: testResults.filter(r => r.passed).length === testResults.length ? '#4ade80' : '#f87171' }}>{testResults.filter(r => r.passed).length}/{testResults.length} passed</span>
                    </p>
                    {testResults.map((res, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '6px', padding: '7px 10px', borderRadius: '8px', background: res.passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${res.passed ? '#22c55e30' : '#ef444430'}`, marginBottom: '4px', fontSize: '11px' }}>
                            <div><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Input</span><code style={{ color: '#e2e8f0' }}>{String(res.input || '—')}</code></div>
                            <div><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Expected</span><code style={{ color: '#86efac' }}>{res.expected || '—'}</code></div>
                            <div><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Actual</span><code style={{ color: res.passed ? '#86efac' : '#fca5a5' }}>{res.actual || '—'}</code></div>
                            <span style={{ color: res.passed ? '#4ade80' : '#f87171', fontSize: '16px', display: 'flex', alignItems: 'center' }}>{res.passed ? '✓' : '✗'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── SQL Question Component ───────────────────────────────────────────────────
function SQLQuestion({ question, index, answer, onChange, attemptId }) {
    const [query, setQuery] = useState(answer?.query || '-- Write your SQL query here\n');
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState('');
    const [showSchema, setShowSchema] = useState(false);

    const runSQL = async () => {
        setRunning(true); setOutput('Executing…');
        try {
            const { data } = await axios.post(`${API}/api/crt/attempt/${attemptId}/run-sql`, { query, schema: question.sql_schema || '' }, { headers: authHeader() });
            setOutput(data.output || '(no rows)');
        } catch (e) { setOutput(`Error: ${e.message}`); }
        setRunning(false);
    };

    const handleChange = (v) => { setQuery(v); onChange({ query: v, student_answer: v }); };

    return (
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', marginBottom: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ background: '#334155', color: '#94a3b8', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>Q{index + 1}</span>
                <p style={{ margin: 0, color: '#f1f5f9', fontSize: '14px', lineHeight: '1.5', flex: 1 }}>{question.question}</p>
            </div>

            {/* Schema toggle */}
            {question.sql_schema && (
                <div style={{ borderBottom: '1px solid #334155' }}>
                    <button onClick={() => setShowSchema(!showSchema)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', fontSize: '12px', fontWeight: 700, width: '100%', textAlign: 'left' }}>
                        <Database size={13} /> {showSchema ? 'Hide Schema' : 'View Schema'} {showSchema ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showSchema && (
                        <div style={{ padding: '10px 16px', background: '#0f172a', borderTop: '1px solid #334155' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#a5f3fc', whiteSpace: 'pre-wrap' }}>{question.sql_schema}</pre>
                        </div>
                    )}
                </div>
            )}

            {/* Toolbar */}
            <div style={{ padding: '8px 14px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>SQL</span>
                <button onClick={runSQL} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: running ? '#475569' : 'linear-gradient(135deg, #14b8a6, #0d9488)', border: 'none', borderRadius: '8px', color: '#fff', cursor: running ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700 }}>
                    {running ? <Loader2 size={13} className="spin" /> : <Play size={13} />} Run Query
                </button>
            </div>

            <Editor height="160px" language="sql" theme="vs-dark" value={query} onChange={handleChange}
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true }} />

            {output && (
                <div style={{ padding: '10px 14px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>RESULT:</p>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#a5f3fc', whiteSpace: 'pre-wrap' }}>{output}</pre>
                </div>
            )}
        </div>
    );
}

// ─── Report view ─────────────────────────────────────────────────────────────
function ReportView({ result, test, onClose }) {
    const { overall_score, section_scores, passed, pass_percentage, proctoring_violations } = result;
    const sections = test?.sections || [];
    const violations = (() => { try { return JSON.parse(proctoring_violations || '[]'); } catch { return []; } })();

    // Tally correct/total across all sections
    const totalCorrect = sections.reduce((s, sec) => s + (section_scores?.[sec]?.correct || 0), 0);
    const totalQs = sections.reduce((s, sec) => s + (section_scores?.[sec]?.total || 0), 0);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflow: 'auto' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes pulseAward { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
            `}</style>
            <div style={{ background: 'rgba(30,41,59,0.98)', borderRadius: '24px', border: `2px solid ${passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, maxWidth: 820, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 25px 50px -12px ${passed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, animation: 'scaleIn 0.4s ease-out' }}>

                {/* Header */}
                <div style={{ padding: '2rem 2rem 1.5rem', background: passed ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(251,146,60,0.1))', borderBottom: `1px solid ${passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: passed ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: `0 8px 24px ${passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, animation: passed ? 'pulseAward 2s ease-in-out infinite' : 'none' }}>
                        {passed ? <Award size={40} color="white" /> : <XCircle size={40} color="white" />}
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>{passed ? '🎉 Congratulations!' : 'Test Completed'}</h2>
                    <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        {test?.company_name} — {test?.title}
                    </p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                        {passed ? 'You have successfully passed the assessment!' : `Keep practicing! Pass mark is ${pass_percentage}%`}
                    </p>
                </div>

                {/* Scrollable body */}
                <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>

                    {/* Score cards */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div style={{ padding: '1.25rem 2rem', background: passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 16, border: `2px solid ${passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, textAlign: 'center', minWidth: 150 }}>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: passed ? '#10b981' : '#ef4444', lineHeight: 1 }}>{Math.round(overall_score)}%</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Overall Score</div>
                        </div>
                        {totalQs > 0 && (
                            <div style={{ padding: '1.25rem 2rem', background: 'rgba(139,92,246,0.1)', borderRadius: 16, border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center', minWidth: 150 }}>
                                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{totalCorrect}/{totalQs}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Correct Answers</div>
                            </div>
                        )}
                        <div style={{ padding: '1.25rem 1.5rem', background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 16, border: `1px solid ${passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, textAlign: 'center', minWidth: 150 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: passed ? '#4ade80' : '#f87171', lineHeight: 1 }}>{passed ? '✅ PASSED' : '❌ FAILED'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Pass mark: {pass_percentage}%</div>
                        </div>
                    </div>

                    {/* Section-wise performance */}
                    {sections.length > 0 && (
                        <>
                            <h3 style={{ margin: '0 0 0.75rem', color: 'white', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BarChart2 size={17} color="#8b5cf6" /> Section-wise Performance
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                                {sections.map(sec => {
                                    const def = SECTIONS[sec];
                                    const ss = section_scores?.[sec] || {};
                                    const pct = Math.round(ss.score || 0);
                                    const scoreColor = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                                    return (
                                        <div key={sec} style={{ padding: '0.9rem 1rem', background: 'rgba(15,23,42,0.7)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: 3 }}>{def?.icon}</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</div>
                                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'capitalize' }}>{def?.label || sec}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{ss.correct || 0}/{ss.total || 0} correct</div>
                                            <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.8s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Violations summary */}
                    {violations.length > 0 && (
                        <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={13} /> {violations.length} Proctoring Violation{violations.length > 1 ? 's' : ''} Recorded
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {violations.map((v, i) => (
                                    <span key={i} style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                                        {v.type || v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 2rem', borderTop: '1px solid rgba(139,92,246,0.15)', display: 'flex', justifyContent: 'center', background: 'rgba(15,23,42,0.5)' }}>
                    <button onClick={onClose} style={{ padding: '0.85rem 2.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                        ← Back to Tests
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN STUDENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CompanyRoundInterface({ user }) {
    const [view, setView] = useState('list'); // 'list' | 'test' | 'report'
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState(null); // { test, questionsBySection, attemptId }
    const [activeSection, setActiveSection] = useState('');
    const [answers, setAnswers] = useState({}); // { [questionId]: { student_answer, code, query, ... } }
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [violations, setViolations] = useState([]);
    const [startingId, setStartingId] = useState(null);
    const [toast, setToast] = useState('');
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const proctoringRef = useRef({ removeListeners: null });
    // section tracking
    const [visitedQuestions, setVisitedQuestions] = useState(new Set());
    const [sectionTimeLeft, setSectionTimeLeft] = useState({});
    const [expiredSections, setExpiredSections] = useState(new Set());

    const sid = user?.id || user?.userId;

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/api/crt/student/tests?studentId=${sid}`, { headers: authHeader() });
            setTests(data);
        } catch (e) { showToast(e.message); }
        setLoading(false);
    }, [sid]);

    useEffect(() => { loadTests(); }, [loadTests]);

    // Reset question index when switching sections
    useEffect(() => { setCurrentQIdx(0); }, [activeSection]);

    // Mark ONLY the currently viewed question as visited, not the whole section
    useEffect(() => {
        if (!testData || !activeSection) return;
        const qs = testData.questionsBySection[activeSection] || [];
        const q = qs[currentQIdx];
        if (q) {
            setVisitedQuestions(prev => {
                const next = new Set(prev);
                next.add(String(q.id));
                return next;
            });
        }
        // Init section timer on first visit
        const limits = testData.test.section_time_limits || {};
        const limitSec = (limits[activeSection] || 0) * 60;
        if (limitSec > 0) {
            setSectionTimeLeft(prev => ({
                ...prev,
                [activeSection]: prev[activeSection] !== undefined ? prev[activeSection] : limitSec
            }));
        }
    }, [activeSection, currentQIdx, testData]);

    // Section countdown tick
    useEffect(() => {
        if (!testData || !activeSection) return;
        const limits = testData.test.section_time_limits || {};
        const hasLimit = (limits[activeSection] || 0) > 0;
        const remaining = sectionTimeLeft[activeSection] ?? 0;
        if (!hasLimit || remaining <= 0) return;
        const tid = setInterval(() => {
            setSectionTimeLeft(prev => {
                const cur = prev[activeSection] ?? 0;
                const next = Math.max(0, cur - 1);
                if (next === 0 && cur > 0) {
                    setExpiredSections(e => new Set([...e, activeSection]));
                    const secs = testData.test.sections;
                    const idx = secs.indexOf(activeSection);
                    if (idx < secs.length - 1) {
                        setTimeout(() => setActiveSection(secs[idx + 1]), 800);
                    }
                }
                return { ...prev, [activeSection]: next };
            });
        }, 1000);
        return () => clearInterval(tid);
    }, [activeSection, testData, sectionTimeLeft[activeSection]]);

    // ── Proctoring setup ─────────────────────────────────────────────────────
    const setupProctoring = useCallback((config) => {
        if (!config?.enabled) return;
        const addViolation = (msg) => {
            const v = { message: msg, timestamp: new Date().toISOString() };
            setViolations(prev => [...prev, v]);
            showToast(`⚠ Proctoring: ${msg}`);
        };

        const handlers = {};

        // Tab visibility
        if (config.trackTabSwitches) {
            handlers.visibilitychange = () => {
                if (document.hidden) addViolation('Tab switch detected');
            };
            document.addEventListener('visibilitychange', handlers.visibilitychange);
        }

        // Copy/paste disable
        if (config.disableCopyPaste) {
            handlers.copy = e => { e.preventDefault(); addViolation('Copy attempt blocked'); };
            handlers.paste = e => { e.preventDefault(); addViolation('Paste attempt blocked'); };
            handlers.cut = e => { e.preventDefault(); addViolation('Cut attempt blocked'); };
            document.addEventListener('copy', handlers.copy);
            document.addEventListener('paste', handlers.paste);
            document.addEventListener('cut', handlers.cut);
        }

        // Fullscreen — always force, regardless of config flag
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }

        // Re-enter fullscreen if student exits
        handlers.fullscreenchange = () => {
            if (!document.fullscreenElement) {
                addViolation('Exited fullscreen');
                setTimeout(() => {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    }
                }, 500);
            }
        };
        document.addEventListener('fullscreenchange', handlers.fullscreenchange);

        proctoringRef.current.removeListeners = () => {
            if (handlers.visibilitychange) document.removeEventListener('visibilitychange', handlers.visibilitychange);
            if (handlers.copy) document.removeEventListener('copy', handlers.copy);
            if (handlers.paste) document.removeEventListener('paste', handlers.paste);
            if (handlers.cut) document.removeEventListener('cut', handlers.cut);
            if (handlers.fullscreenchange) document.removeEventListener('fullscreenchange', handlers.fullscreenchange);
            if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }, []);

    const teardownProctoring = useCallback(() => {
        if (proctoringRef.current.removeListeners) {
            proctoringRef.current.removeListeners();
            proctoringRef.current.removeListeners = null;
        }
    }, []);

    // Start test
    const startTest = async (testId) => {
        setStartingId(testId);
        try {
            const { data } = await axios.post(`${API}/api/crt/tests/${testId}/start`,
                { studentId: sid, studentName: user?.name || 'Student' },
                { headers: authHeader() });

            setTestData(data);
            setActiveSection(data.test.sections?.[0] || '');
            setAnswers({});
            setViolations([]);
            setVisitedQuestions(new Set());
            setSectionTimeLeft({});
            setExpiredSections(new Set());
            setView('test');
            setupProctoring(data.test.proctoring_config);
        } catch (e) { showToast(e.response?.data?.error || e.message); }
        setStartingId(null);
    };

    // Set answer for a question
    const setAnswer = (questionId, val) => {
        setAnswers(prev => ({ ...prev, [String(questionId)]: val }));
    };

    // Submit test
    const submitTest = async (forced = false) => {
        if (!forced && !confirm('Submit this test? You cannot change answers afterwards.')) return;
        setSubmitting(true);
        try {
            const { data } = await axios.post(
                `${API}/api/crt/attempt/${testData.attemptId}/submit`,
                { answers, proctoring_violations: violations },
                { headers: authHeader() }
            );
            teardownProctoring();
            setResult({ ...data, test: testData.test });
            setView('report');
        } catch (e) { showToast(e.response?.data?.error || e.message); }
        setSubmitting(false);
    };

    // ── Render: Test list ─────────────────────────────────────────────────────
    if (view === 'list') {
        return (
            <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>
                {toast && <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#f59e0b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, zIndex: 9999, fontSize: '13px' }}>{toast}</div>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={22} color="white" /></div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#f1f5f9' }}>Company Round Tests</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>First-round assessments assigned to you</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ width: '36px', height: '36px', border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                        <p style={{ color: '#64748b' }}>Loading tests…</p>
                    </div>
                ) : tests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '72px 40px', background: '#1e293b', borderRadius: '18px', border: '2px dashed #334155' }}>
                        <Building2 size={52} style={{ color: '#334155', marginBottom: '14px' }} />
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 8px', fontWeight: 700 }}>No Tests Available</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Your admin hasn't assigned any active company round tests yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {tests.map(test => {
                            const attempted = test.my_attempts > 0;
                            const completed = test.my_best_score !== null;
                            const canAttempt = !test.max_attempts || test.my_attempts < test.max_attempts;

                            return (
                                <div key={test.id} style={{ background: '#1e293b', borderRadius: '16px', padding: '20px 22px', border: '1px solid #334155', borderLeft: '5px solid #3b82f6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
                                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f1f5f9' }}>{test.title}</h3>
                                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: '#3b82f620', color: '#60a5fa' }}>{test.company_name}</span>
                                                {completed && <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: '#22c55e20', color: '#4ade80' }}>Attempted · {Math.round(test.my_best_score)}%</span>}
                                            </div>

                                            {/* Sections */}
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {(test.sections || []).map(sec => { const d = SECTIONS[sec]; return d && <span key={sec} style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: `${d.color}20`, color: d.color }}>{d.icon} {d.label}</span>; })}
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                                                <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><Clock size={12} /> {test.duration_minutes} min</span>
                                                <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><FileText size={12} /> {test.total_questions || 0} questions</span>
                                                <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><Target size={12} /> Pass {test.pass_percentage}%</span>
                                                <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><Shield size={12} /> {test.proctoring_config?.enabled ? 'Proctored' : 'No proctoring'}</span>
                                                <span style={{ color: '#64748b' }}>Attempts: {test.my_attempts}/{test.max_attempts === 0 ? '∞' : test.max_attempts}</span>
                                            </div>
                                        </div>

                                        <button onClick={() => canAttempt && startTest(test.id)} disabled={!canAttempt || startingId === test.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 24px', background: !canAttempt ? '#334155' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '12px', color: !canAttempt ? '#64748b' : '#fff', fontWeight: 700, fontSize: '14px', cursor: !canAttempt ? 'not-allowed' : 'pointer', boxShadow: canAttempt ? '0 4px 16px rgba(59,130,246,0.25)' : 'none', whiteSpace: 'nowrap' }}>
                                            {startingId === test.id ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
                                            {canAttempt ? (attempted ? 'Retry' : 'Start Test') : 'Max Attempts Reached'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Render: Report ────────────────────────────────────────────────────────
    if (view === 'report') {
        return (
            <>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>
                <ReportView result={result} test={result?.test} onClose={() => { setView('list'); loadTests(); }} />
            </>
        );
    }

    // ── Render: Active Test ───────────────────────────────────────────────────
    if (view === 'test' && testData) {
        const { test, questionsBySection, attemptId } = testData;
        const sectionDef = SECTIONS[activeSection];
        const currentQs = questionsBySection[activeSection] || [];
        const sectionOrder = test.sections || [];

        // Count answered per section
        const countAnswered = (sec) => (questionsBySection[sec] || []).filter(q => answers[String(q.id)]).length;
        const totalQ = Object.values(questionsBySection).reduce((t, qs) => t + qs.length, 0);
        const totalAnswered = Object.values(questionsBySection).reduce((t, qs) => t + qs.filter(q => answers[String(q.id)]).length, 0);

        // Section locking: a section is accessible only if it's first, OR previous section is complete OR expired
        const isSectionUnlocked = (sec) => {
            const idx = sectionOrder.indexOf(sec);
            if (idx === 0) return true;
            const prev = sectionOrder[idx - 1];
            const prevQs = questionsBySection[prev] || [];
            return expiredSections.has(prev) || (prevQs.length > 0 && countAnswered(prev) >= prevQs.length);
        };

        // Question status helpers
        const qAnswered = (qId) => !!answers[String(qId)];
        const qVisited = (qId) => visitedQuestions.has(String(qId));
        const qColor = (qId) => qAnswered(qId) ? '#22c55e' : qVisited(qId) ? '#f59e0b' : '#475569';

        // Section timer display helper
        const fmtTime = (sec) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; };
        const sectionTimer = (sec) => {
            const limits = test.section_time_limits || {};
            if (!limits[sec]) return null;
            const rem = sectionTimeLeft[sec] !== undefined ? sectionTimeLeft[sec] : limits[sec] * 60;
            return rem;
        };

        return (
            <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>

                {/* Toast */}
                {toast && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, zIndex: 10000, fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>{toast}</div>}

                {/* Top bar */}
                <div style={{ zIndex: 100, background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f1f5f9' }}>{test.company_name} — {test.title}</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{totalAnswered}/{totalQ} questions answered</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Timer totalSeconds={test.duration_minutes * 60} onExpire={() => { showToast('⏰ Time up! Auto-submitting…'); setTimeout(() => submitTest(true), 1000); }} />
                        {violations.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#f59e0b', padding: '4px 10px', background: '#f59e0b15', borderRadius: '8px', border: '1px solid #f59e0b30' }}>
                                <AlertTriangle size={13} /> {violations.length} violation{violations.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                if (confirm('Exit session? Your current answers will be lost and the attempt will not be submitted.')) {
                                    teardownProctoring();
                                    setView('list');
                                    setTestData(null);
                                    setAnswers({});
                                    setViolations([]);
                                    setVisitedQuestions(new Set());
                                    setSectionTimeLeft({});
                                    setExpiredSections(new Set());
                                    loadTests();
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#f87171', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                            <X size={14} /> Exit Session
                        </button>
                        <button onClick={() => submitTest(false)} disabled={submitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', background: submitting ? '#475569' : 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}>
                            {submitting ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                            {submitting ? 'Submitting…' : 'Submit Test'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, overflow: 'hidden' }}>
                    {/* Left: Section navigation */}
                    <div style={{ background: 'rgba(10,15,26,0.95)', borderRight: '1px solid rgba(139,92,246,0.15)', padding: '16px 0', overflowY: 'auto' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '16px', marginBottom: '10px' }}>Sections</p>
                        {test.sections.map(sec => {
                            const d = SECTIONS[sec];
                            const qs = questionsBySection[sec] || [];
                            const answered = countAnswered(sec);
                            const isActive = activeSection === sec;
                            const unlocked = isSectionUnlocked(sec);
                            const expired = expiredSections.has(sec);
                            const timer = sectionTimer(sec);
                            const isUrgent = timer !== null && timer < 120;
                            return (
                                <button key={sec} onClick={() => unlocked && !expired && setActiveSection(sec)}
                                    title={!unlocked ? 'Complete previous section first' : expired ? 'Time expired for this section' : ''}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', border: 'none', background: isActive ? `${d.color}18` : 'none', borderLeft: `3px solid ${isActive ? d.color : 'transparent'}`, cursor: unlocked && !expired ? 'pointer' : 'not-allowed', textAlign: 'left', transition: 'all 0.15s', opacity: unlocked ? 1 : 0.45 }}>
                                    <span style={{ fontSize: '16px' }}>{d.icon}</span>
                                    <div style={{ flex: 1 }}>  
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? d.color : '#94a3b8' }}>{d.label}</p>
                                        <p style={{ margin: 0, fontSize: '10px', color: answered === qs.length && qs.length > 0 ? '#4ade80' : '#475569' }}>{answered}/{qs.length} answered</p>
                                        {timer !== null && !expired && (
                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: isUrgent ? '#f87171' : '#fbbf24' }}>⏱ {fmtTime(timer)}</p>
                                        )}
                                        {expired && <p style={{ margin: 0, fontSize: '10px', color: '#f87171', fontWeight: 700 }}>⏱ Time up</p>}
                                    </div>
                                    {!unlocked && <Lock size={13} color="#475569" />}
                                    {answered === qs.length && qs.length > 0 && unlocked && !expired && <CheckCircle2 size={13} color="#4ade80" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Questions */}
                    <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
                        {sectionDef && (
                            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>{sectionDef.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: sectionDef.color }}>{sectionDef.label}</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{currentQs.length} question{currentQs.length !== 1 ? 's' : ''} · {countAnswered(activeSection)} answered</p>
                                </div>
                                {sectionTimer(activeSection) !== null && !expiredSections.has(activeSection) && (
                                    <div style={{ padding: '5px 12px', borderRadius: '8px', background: (sectionTimeLeft[activeSection] ?? 0) < 120 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${(sectionTimeLeft[activeSection] ?? 0) < 120 ? '#ef444460' : '#f59e0b60'}`, color: (sectionTimeLeft[activeSection] ?? 0) < 120 ? '#f87171' : '#fbbf24', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Clock size={13} /> {fmtTime(sectionTimeLeft[activeSection] ?? (((test.section_time_limits || {})[activeSection] || 0) * 60))}
                                    </div>
                                )}
                                {expiredSections.has(activeSection) && (
                                    <span style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 700, fontSize: '12px' }}>⏱ Time Expired</span>
                                )}
                            </div>
                        )}

                        {/* Question status palette */}
        {currentQs.length > 0 && (
                            <div style={{ background: '#0a0f1a', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', border: '1px solid #1e293b' }}>
                                <div style={{ display: 'flex', gap: '14px', marginBottom: '8px', fontSize: '10px', fontWeight: 700 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} /> Answered</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Visited</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#475569', display: 'inline-block' }} /> Not visited</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a78bfa' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#a78bfa', display: 'inline-block', outline: '2px solid #fff' }} /> Current</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {currentQs.map((q, i) => {
                                        const isCurrent = i === currentQIdx;
                                        const bg = isCurrent ? '#6366f1' : qColor(q.id);
                                        return (
                                            <div key={q.id}
                                                onClick={() => setCurrentQIdx(i)}
                                                title={`Q${i+1}: ${qAnswered(q.id) ? 'Answered' : qVisited(q.id) ? 'Visited not answered' : 'Not visited'}`}
                                                style={{ width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: bg, color: '#fff', cursor: 'pointer', border: isCurrent ? '2px solid #fff' : `2px solid ${bg}`, boxShadow: isCurrent ? '0 0 8px #6366f180' : qAnswered(q.id) ? '0 0 5px #22c55e40' : 'none', transition: 'all 0.12s' }}>
                                                {i + 1}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {currentQs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '14px', border: '2px dashed #334155' }}>
                                <span style={{ fontSize: '40px' }}>{sectionDef?.icon}</span>
                                <p style={{ color: '#64748b', marginTop: '10px', fontSize: '14px' }}>No questions added for this section yet.</p>
                            </div>
                        ) : (() => {
                            const safeIdx = Math.min(currentQIdx, currentQs.length - 1);
                            const q = currentQs[safeIdx];
                            const isFirst = safeIdx === 0;
                            const isLast = safeIdx === currentQs.length - 1;
                            const isLastSection = sectionOrder.indexOf(activeSection) === sectionOrder.length - 1;
                            return (
                                <>
                                    {/* Single question view */}
                                    {sectionDef?.kind === 'mcq' && (
                                        <MCQQuestion key={q.id} question={q} index={safeIdx}
                                            answer={answers[String(q.id)]?.student_answer || answers[String(q.id)]}
                                            onChange={val => setAnswer(q.id, { student_answer: val })} />
                                    )}
                                    {sectionDef?.kind === 'code' && (
                                        <CodingQuestion key={q.id} question={q} index={safeIdx}
                                            answer={answers[String(q.id)]} attemptId={attemptId}
                                            isDebug={activeSection === 'debug'}
                                            onChange={val => setAnswer(q.id, val)} />
                                    )}
                                    {sectionDef?.kind === 'sql' && (
                                        <SQLQuestion key={q.id} question={q} index={safeIdx}
                                            answer={answers[String(q.id)]} attemptId={attemptId}
                                            onChange={val => setAnswer(q.id, val)} />
                                    )}

                                    {/* Navigation row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', gap: '10px' }}>
                                        <button onClick={() => setCurrentQIdx(i => Math.max(0, i - 1))} disabled={isFirst}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: isFirst ? '#1e293b' : 'rgba(99,102,241,0.15)', border: `1px solid ${isFirst ? '#334155' : '#6366f1'}`, borderRadius: '10px', color: isFirst ? '#475569' : '#a5b4fc', fontWeight: 700, fontSize: '13px', cursor: isFirst ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                                            ← Previous
                                        </button>

                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                            Question {safeIdx + 1} of {currentQs.length}
                                        </span>

                                        {!isLast ? (
                                            <button onClick={() => setCurrentQIdx(i => Math.min(currentQs.length - 1, i + 1))}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: 'rgba(99,102,241,0.15)', border: '1px solid #6366f1', borderRadius: '10px', color: '#a5b4fc', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                Next →
                                            </button>
                                        ) : !isLastSection ? (
                                            <button onClick={() => {
                                                const nextSec = sectionOrder[sectionOrder.indexOf(activeSection) + 1];
                                                if (isSectionUnlocked(nextSec)) setActiveSection(nextSec);
                                                else showToast('Complete this section first');
                                            }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: '10px', color: '#4ade80', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                Next Section →
                                            </button>
                                        ) : (
                                            <button onClick={() => submitTest(false)} disabled={submitting}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: submitting ? '#475569' : 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                                                {submitting ? <><Loader2 size={13} className="spin" /> Submitting…</> : <><Check size={13} /> Submit Test</>}
                                            </button>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        {/* Bottom submit bar */}
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{totalAnswered}/{totalQ} answered across all sections</span>
                            <button onClick={() => submitTest(false)} disabled={submitting}
                                style={{ padding: '9px 24px', background: submitting ? '#475569' : 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                                {submitting ? <><Loader2 size={14} className="spin" /> Submitting…</> : <><Check size={14} /> Submit Test</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
