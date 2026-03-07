/**
 * CompanyRoundInterface.jsx — Student view for Company Round Tests
 * Supports: MCQ, Coding, Debugging, SQL sections with proctoring
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import socketService from '../services/socketService';
import {
    Building2, Clock, Play, Check, ChevronRight, ChevronDown, ChevronUp,
    AlertTriangle, Shield, Eye, EyeOff, Database, Code, Brain, RefreshCw,
    CheckCircle2, XCircle, Award, BarChart2, ArrowRight, X, Loader2,
    FileText, Target, Zap, Lock, Layers, Send
} from 'lucide-react';
import SQLValidator from './SQLValidator';
import SQLVisualizer from './SQLVisualizer';
import SQLDebugger from './SQLDebugger';

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
        <div style={{ background: '#0a0f1a', borderRadius: '14px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            {/* Question header */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', borderRadius: '7px', padding: '3px 9px', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>Q{index + 1}</span>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', flex: 1 }}>{question.question}</p>
            </div>
            {/* Code snippet */}
            {question.code_snippet && (
                <div style={{ padding: '12px 16px', background: '#060a10', borderBottom: '1px solid #1e293b' }}>
                    <pre style={{ margin: 0, padding: '12px 14px', background: '#0d1117', border: '1px solid #1e293b', borderRadius: '8px', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#a5f3fc', whiteSpace: 'pre-wrap', overflowX: 'auto', lineHeight: 1.65 }}>{question.code_snippet}</pre>
                </div>
            )}
            {/* Options */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {(question.options || []).map((opt, oi) => {
                    const letter = letters[oi];
                    const selected = answer === letter;
                    return (
                        <label key={oi} onClick={() => onChange(letter)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderRadius: '10px', cursor: 'pointer', background: selected ? 'rgba(99,102,241,0.12)' : 'rgba(15,23,42,0.6)', border: `2px solid ${selected ? '#6366f1' : '#1e293b'}`, transition: 'all 0.15s', outline: 'none' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selected ? '#6366f1' : '#334155'}`, background: selected ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                {selected && <Check size={12} color="white" />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', fontFamily: 'monospace', flexShrink: 0, width: '18px' }}>{letter}</span>
                            <span style={{ fontWeight: selected ? 600 : 400, color: selected ? '#c7d2fe' : '#94a3b8', fontSize: '14px', flex: 1 }}>{opt}</span>
                        </label>
                    );
                })}
            </div>
            {!answer && (
                <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={12} color="#f59e0b" />
                    <span style={{ fontSize: '11px', color: '#78716c', fontWeight: 600 }}>Not answered yet</span>
                </div>
            )}
        </div>
    );
}

// ─── Coding/Debug Question Component ──────────────────────────────────────────
// ─── Per-language starter templates ─────────────────────────────────────────
const LANG_TEMPLATES = {
    'Python':     '# Write your Python code here\n\n',
    'JavaScript': '// Write your JavaScript code here\n\n',
    'Java':       '// Write your Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
    'C':          '// Write your C code here\n#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
    'C++':        '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
};

function CodingQuestion({ question, index, answer, onChange, attemptId, isDebug }) {
    const initLang = answer?.language || question.language || 'Python';
    const initCode = answer?.code || question.starter_code || LANG_TEMPLATES[initLang] || '';
    const [code, setCode] = useState(initCode);
    const [language, setLanguage] = useState(initLang);
    const codeByLang = useRef({ [initLang]: initCode });
    const [isRunning, setIsRunning] = useState(false);
    const [outputSegments, setOutputSegments] = useState([]); // { text, type }
    const [customInput, setCustomInput] = useState(question.sample_input || '');
    const [interactiveStdin, setInteractiveStdin] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [runningTests, setRunningTests] = useState(false);
    const [activeOutputTab, setActiveOutputTab] = useState('output'); // 'input' | 'output' | 'tests'
    const [terminalSize, setTerminalSize] = useState('normal'); // 'normal' | 'minimized' | 'maximized'
    const [runResult, setRunResult] = useState(null); // { actual, expected, passed }
    const terminalRef = useRef(null);

    const LANG_MAP = { Python: 'python', JavaScript: 'javascript', Java: 'java', C: 'c', 'C++': 'cpp' };

    const normalizeForCompare = s => {
        if (!s) return '';
        return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\\n/g, '\n')
            .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    };
    const wsCollapse = s => normalizeForCompare(s).replace(/\s+/g, ' ').trim();

    const scrollTerminal = () => {
        setTimeout(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, 0);
    };

    const handleRun = () => {
        setIsRunning(true);
        setOutputSegments([]);
        setRunResult(null);
        setActiveOutputTab('output');
        if (terminalSize === 'minimized') setTerminalSize('normal');

        const socket = socketService.connect();
        socket.emit('run-interactive', { code, language, problemId: question.id });

        let accOutput = '';
        let stdinPiped = false; // send customInput only once, after process actually starts
        let earlyTimer = null;   // fires if no output at all (Python silent input())
        let postRunTimer = null; // fires after compilation ends but program blocks on scanf/cin

        const pipeCustomInput = () => {
            if (stdinPiped || !customInput.trim()) return;
            stdinPiped = true;
            const lines = customInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            lines.forEach((line, idx) => {
                setTimeout(() => socket.emit('run-stdin', line), idx * 40);
            });
        };

        // Initial 700ms fallback: handles Python input() with no print before it.
        // Will be CANCELLED if 'info' events arrive (meaning C/C++/Java is compiling).
        earlyTimer = setTimeout(pipeCustomInput, 700);

        const onOutput = ({ text, type }) => {
            if (type !== 'stdin') accOutput += text;
            setOutputSegments(prev => [...prev, { text, type: type || 'stdout' }]);
            scrollTerminal();
            if (type === 'info') {
                // Compilation in progress — cancel early timer (don't pipe during compile)
                // and reset a post-compile timer (fires 1.5s after last 'info' message)
                clearTimeout(earlyTimer);
                earlyTimer = null;
                clearTimeout(postRunTimer);
                postRunTimer = setTimeout(pipeCustomInput, 1500);
            } else {
                // Real program output — program is running, pipe stdin immediately
                clearTimeout(earlyTimer);
                clearTimeout(postRunTimer);
                pipeCustomInput();
            }
        };
        const onExit = ({ allOutput: progOutput } = {}) => {
            clearTimeout(earlyTimer);
            clearTimeout(postRunTimer);
            socket.off('run-output', onOutput);
            socket.off('run-exit', onExit);
            setIsRunning(false);
            const progText = progOutput !== undefined ? progOutput : accOutput;
            const expectedRaw = (question.expected_output || question.expectedOutput || '').trim();
            if (expectedRaw) {
                const normMatch = normalizeForCompare(progText) === normalizeForCompare(expectedRaw);
                const wsMatch = wsCollapse(progText) === wsCollapse(expectedRaw);
                const stripEcho = s => normalizeForCompare(s).split('\n').filter(l => !/^\d+$/.test(l)).join('\n');
                const passed = normMatch || wsMatch || stripEcho(progText) === stripEcho(expectedRaw);
                setRunResult({ actual: progText.trim(), expected: expectedRaw, passed });
            }
            scrollTerminal();
        };
        socket.on('run-output', onOutput);
        socket.on('run-exit', onExit);
    };

    const sendInteractiveStdin = () => {
        socketService.connect().emit('run-stdin', interactiveStdin);
        setOutputSegments(prev => [...prev, { text: interactiveStdin + '\n', type: 'stdin' }]);
        setInteractiveStdin('');
        scrollTerminal();
    };

    const stopRun = () => { socketService.connect().emit('kill-run'); };

    const handleRunAllTests = async () => {
        const tcs = question.test_cases || [];
        if (!tcs.length) return;
        setRunningTests(true);
        setActiveOutputTab('tests');
        if (terminalSize === 'minimized') setTerminalSize('normal');
        const results = [];
        for (const tc of tcs) {
            try {
                const { data } = await axios.post(`${API}/api/crt/attempt/${attemptId}/run-code`,
                    { code, language, stdin: String(tc.input || '') }, { headers: authHeader() });
                const actual = (data.output || '').trim();
                const expected = String(tc.expected_output || '').trim();
                const norm = s => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean).join('\n');
                results.push({ input: tc.input, expected, actual, passed: norm(actual) === norm(expected) });
            } catch (e) {
                results.push({ input: tc.input, expected: tc.expected_output, actual: `Error: ${e.message}`, passed: false });
            }
        }
        setTestResults(results);
        onChange({ code, language, student_answer: code });
        setRunningTests(false);
    };

    const handleCodeChange = v => {
        setCode(v);
        onChange({ code: v, language, student_answer: v });
    };

    const tcs = question.test_cases || [];
    const passedCount = testResults.filter(r => r.passed).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0f1a', borderRadius: '14px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            {/* Question header */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', borderRadius: '7px', padding: '3px 9px', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{isDebug ? '🐛' : '💻'} Q{index + 1}</span>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', flex: 1 }}>{question.question}</p>
            </div>

            {/* Buggy code for debug mode */}
            {isDebug && question.code_snippet && (
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e293b', background: 'rgba(239,68,68,0.05)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>🐛 Buggy Code to Fix</p>
                    <pre style={{ margin: 0, padding: '12px 14px', background: '#0f172a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#fca5a5', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{question.code_snippet}</pre>
                </div>
            )}

            {/* Toolbar — like ProctoredCodeEditor */}
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Language:</label>
                    <select value={language}
                        onChange={e => {
                            const l = e.target.value;
                            codeByLang.current[language] = code;
                            const newCode = codeByLang.current[l] ?? LANG_TEMPLATES[l] ?? '';
                            setLanguage(l);
                            setCode(newCode);
                            onChange({ code: newCode, language: l, student_answer: newCode });
                        }}
                        style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' }}>
                        {['Python', 'JavaScript', 'Java', 'C', 'C++'].map(l => <option key={l}>{l}</option>)}
                    </select>
                    <button onClick={handleRun} disabled={isRunning}
                        style={{ background: isRunning ? '#334155' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', color: isRunning ? '#64748b' : 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                        <Play size={16} /> {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {tcs.length > 0 && (
                        <button onClick={handleRunAllTests} disabled={runningTests || isRunning}
                            style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: (runningTests || isRunning) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', opacity: (runningTests || isRunning) ? 0.5 : 1 }}>
                            {runningTests ? <Loader2 size={15} className="spin" /> : <Zap size={15} />} Run All Tests
                        </button>
                    )}
                    {tcs.length > 0 && <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{tcs.length} test{tcs.length !== 1 ? 's' : ''}</span>}
                </div>
            </div>

            {/* Monaco Editor */}
            <Editor
                height="320px"
                language={LANG_MAP[language] || 'python'}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true, padding: { top: 10, bottom: 10 }, fontFamily: 'ui-monospace,JetBrains Mono,monospace', renderLineHighlight: 'all', smoothScrolling: true }}
            />

            {/* Output / Tab panel — exactly like ProctoredCodeEditor */}
            <div style={{
                flex: terminalSize === 'maximized' ? '0 0 420px' : terminalSize === 'minimized' ? '0 0 36px' : '0 0 320px',
                background: '#020617', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', minHeight: 0,
                transition: 'flex-basis 0.25s cubic-bezier(0.4,0,0.2,1)'
            }}>
                {/* Tab Headers */}
                <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: '#0f172a', alignItems: 'center' }}>
                    {[
                        { key: 'input', label: '📝 Custom Input' },
                        { key: 'output', label: '⚙️ Output' },
                        { key: 'tests', label: `🧪 Test Cases${testResults.length > 0 ? ` (${passedCount}/${testResults.length})` : tcs.length > 0 ? ` (${tcs.length})` : ''}` }
                    ].map(tab => (
                        <button key={tab.key}
                            onClick={() => { setActiveOutputTab(tab.key); if (terminalSize === 'minimized') setTerminalSize('normal'); }}
                            style={{
                                padding: '0.65rem 1.1rem', background: activeOutputTab === tab.key ? '#1e293b' : 'transparent', border: 'none',
                                borderBottom: activeOutputTab === tab.key
                                    ? `2px solid ${tab.key === 'input' ? '#f59e0b' : tab.key === 'output' ? '#3b82f6' : '#06b6d4'}`
                                    : '2px solid transparent',
                                color: activeOutputTab === tab.key
                                    ? (tab.key === 'input' ? '#fbbf24' : tab.key === 'output' ? '#60a5fa' : '#06b6d4')
                                    : '#64748b',
                                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}>
                            {tab.label}
                            {tab.key === 'output' && outputSegments.length > 0 && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: outputSegments.some(s => s.type === 'stderr') ? '#ef4444' : '#10b981' }} />
                            )}
                        </button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
                        <button onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} title="Minimize" style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#475569', fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}>─</button>
                        <button onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} title="Maximize" style={{ padding: '2px 6px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#475569', fontSize: '0.7rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                    </div>
                </div>

                {/* Custom Input Tab */}
                {activeOutputTab === 'input' && terminalSize !== 'minimized' && (
                    <div style={{ padding: '0.75rem', flex: 1 }}>
                        <textarea
                            value={customInput}
                            onChange={e => setCustomInput(e.target.value)}
                            placeholder={`Enter your input here (stdin)...\nExample:\n5\n1 2 3 4 5`}
                            style={{ width: '100%', height: 'calc(100% - 30px)', minHeight: '140px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>💡 Type your stdin input, then click Run Code</div>
                    </div>
                )}

                {/* Output Tab — exact ProctoredCodeEditor terminal */}
                {activeOutputTab === 'output' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#090d18', borderTop: '1px solid #1e3a5f' }}>
                        {/* Terminal header bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: '#0d1929', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <div title="Minimize" onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')}
                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.85, cursor: 'pointer' }} />
                                    <div title="Normal" onClick={() => setTerminalSize('normal')}
                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.85, cursor: 'pointer' }} />
                                    <div title="Maximize" onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')}
                                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.85, cursor: 'pointer' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', fontFamily: 'ui-monospace,monospace' }}>TERMINAL</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isRunning && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '4px', padding: '2px 8px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'blink 1s step-end infinite' }} />
                                        RUNNING
                                    </span>
                                )}
                                {!isRunning && outputSegments.length > 0 && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: runResult ? (runResult.passed ? '#4ade80' : '#f87171') : '#64748b' }}>
                                        {runResult ? (runResult.passed ? '✅ Accepted' : '❌ Wrong Answer') : '● Finished'}
                                    </span>
                                )}
                                {isRunning && (
                                    <button onClick={stopRun} style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#f87171', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>■ Stop</button>
                                )}
                                <button onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} style={{ padding: '2px 7px', background: 'rgba(71,85,105,0.2)', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1 }}>─</button>
                                <button onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} style={{ padding: '2px 6px', background: 'rgba(71,85,105,0.2)', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', fontSize: '0.65rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                            </div>
                        </div>

                        {/* Scrollable output area */}
                        {terminalSize !== 'minimized' && (
                            <div ref={terminalRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'ui-monospace,SFMono-Regular,Consolas,monospace', fontSize: '0.84rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '80px' }}>
                                {outputSegments.length > 0
                                    ? outputSegments.map((seg, i) => (
                                        <span key={i} style={{ color: seg.type === 'stdin' ? '#4ade80' : seg.type === 'stderr' ? '#fca5a5' : seg.type === 'info' ? '#475569' : '#e2e8f0' }}>{seg.text}</span>
                                    ))
                                    : <span style={{ color: '#334155', fontStyle: 'italic' }}>▶ Click "Run Code" to execute your program…</span>
                                }
                                {isRunning && <span style={{ display: 'inline-block', width: '8px', height: '1em', background: '#4ade80', marginLeft: '1px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
                            </div>
                        )}

                        {/* Legend + verdict */}
                        {!isRunning && outputSegments.length > 0 && terminalSize !== 'minimized' && (
                            <div style={{ flexShrink: 0, padding: '3px 16px 5px', fontSize: '0.7rem', color: '#334155' }}>
                                <span style={{ color: '#4ade80' }}>█</span> = stdin &nbsp; <span style={{ color: '#fca5a5' }}>█</span> = stderr &nbsp; <span style={{ color: '#475569' }}>█</span> = compiler
                            </div>
                        )}
                        {!isRunning && runResult && terminalSize !== 'minimized' && (
                            <div style={{ flexShrink: 0, margin: '0 12px 10px', padding: '10px 14px', borderRadius: '8px', background: runResult.passed ? 'rgba(16,185,129,0.09)' : 'rgba(239,68,68,0.09)', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: runResult.passed ? 0 : '8px' }}>
                                    <span style={{ fontSize: '1rem' }}>{runResult.passed ? '✅' : '❌'}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: runResult.passed ? '#4ade80' : '#f87171' }}>
                                        {runResult.passed ? 'Accepted — Output matches expected!' : 'Wrong Answer — Output does not match'}
                                    </span>
                                </div>
                                {!runResult.passed && (
                                    <div style={{ paddingLeft: '28px' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>Expected output:</div>
                                        <pre style={{ margin: 0, padding: '8px 12px', background: '#0d1929', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#34d399', fontSize: '0.78rem', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{(runResult.expected || '').replace(/\\r\\n|\\n|\\r/g, '\n')}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interactive stdin bar — active when running */}
                        <div style={{ flexShrink: 0, borderTop: `2px solid ${isRunning ? '#16a34a' : '#1e293b'}`, background: isRunning ? '#051210' : '#0a0f1a', transition: 'border-color 0.2s, background 0.2s' }}>
                            {isRunning ? (
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px', gap: '8px' }}>
                                    <span style={{ color: '#4ade80', fontSize: '0.9rem', fontFamily: 'ui-monospace,monospace', fontWeight: 700, userSelect: 'none', flexShrink: 0 }}>$</span>
                                    <input type="text" value={interactiveStdin} onChange={e => setInteractiveStdin(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') sendInteractiveStdin(); }}
                                        placeholder="Type your input here and press Enter…"
                                        autoFocus
                                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.88rem', fontFamily: 'ui-monospace,SFMono-Regular,monospace', caretColor: '#4ade80' }}
                                    />
                                    <button onClick={sendInteractiveStdin} style={{ flexShrink: 0, padding: '6px 16px', background: '#16a34a', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>↵ Send</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '36px', gap: '8px' }}>
                                    <span style={{ color: '#1e3a5f', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace' }}>$</span>
                                    <span style={{ color: '#334155', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                        {outputSegments.length > 0 ? 'Process finished. Run code again to restart.' : 'Stdin will appear here when your program requests input'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Test Cases Tab */}
                {activeOutputTab === 'tests' && terminalSize !== 'minimized' && (
                    <div style={{ padding: '0.75rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {testResults.length === 0 && !runningTests && (
                            <div style={{ textAlign: 'center', paddingTop: '28px' }}>
                                <button onClick={handleRunAllTests} disabled={isRunning}
                                    style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', border: 'none', color: '#fff', padding: '0.65rem 1.4rem', borderRadius: '8px', cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: isRunning ? 0.5 : 1 }}>
                                    {runningTests ? '⏳ Running All Tests...' : `🧪 Run All Tests (${tcs.length})`}
                                </button>
                                <p style={{ color: '#475569', fontSize: '12px', marginTop: '8px' }}>Compare your output against {tcs.length} test case{tcs.length !== 1 ? 's' : ''}</p>
                            </div>
                        )}
                        {runningTests && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#06b6d4', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Loader2 size={15} className="spin" /> Running test cases…
                            </div>
                        )}
                        {testResults.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 12px', background: passedCount === testResults.length ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '8px', border: `1px solid ${passedCount === testResults.length ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                                    <span style={{ fontSize: '18px' }}>{passedCount === testResults.length ? '🎉' : '❌'}</span>
                                    <span style={{ fontWeight: 700, fontSize: '13px', color: passedCount === testResults.length ? '#4ade80' : '#f87171' }}>{passedCount}/{testResults.length} test cases passed</span>
                                </div>
                                {testResults.map((res, i) => (
                                    <div key={i} style={{ marginBottom: '8px', borderRadius: '9px', overflow: 'hidden', border: `1px solid ${res.passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: res.passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                                            <span style={{ fontSize: '14px' }}>{res.passed ? '✅' : '❌'}</span>
                                            <span style={{ fontWeight: 700, fontSize: '12px', color: res.passed ? '#4ade80' : '#f87171' }}>Test Case {i + 1}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#060a10' }}>
                                            {[['Input', String(res.input ?? '—'), '#94a3b8'], ['Expected', res.expected || '—', '#4ade80'], ['Actual', res.actual || '(no output)', res.passed ? '#4ade80' : '#f87171']].map(([label, val, col]) => (
                                                <div key={label} style={{ padding: '8px 11px', borderRight: '1px solid #1e293b' }}>
                                                    <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                                                    <code style={{ fontSize: '11.5px', color: col, fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{val}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── SQL Question Component ───────────────────────────────────────────────────
function SQLQuestion({ question, index, answer, onChange, attemptId }) {
    const [query, setQuery] = useState(answer?.query || '-- Write your SQL query here\nSELECT * FROM table_name;\n');
    const [sqlTool, setSqlTool] = useState('validator'); // 'validator' | 'visualizer' | 'debugger'
    const [schemaOpen, setSchemaOpen] = useState(false);

    const handleChange = v => { setQuery(v); onChange({ query: v, student_answer: v }); };
    const schema = question.sql_schema || question.sqlSchema || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0f1a', borderRadius: '14px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            {/* Question header */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)', color: '#fff', borderRadius: '7px', padding: '3px 9px', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>🗄 Q{index + 1}</span>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.65', flex: 1 }}>{question.question}</p>
            </div>

            {/* Schema — button always visible, popup on click */}
            {schema && (
                <>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', background: '#060e14', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={12} color="#2dd4bf" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Database Schema</span>
                        <button onClick={() => setSchemaOpen(true)}
                            style={{ marginLeft: 'auto', padding: '3px 12px', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '5px', color: '#2dd4bf', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> View Schema
                        </button>
                    </div>
                    {schemaOpen && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                            onClick={() => setSchemaOpen(false)}>
                            <div style={{ background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '82vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
                                onClick={e => e.stopPropagation()}>
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Database size={15} color="#2dd4bf" />
                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#2dd4bf' }}>Database Schema</span>
                                    </div>
                                    <button onClick={() => setSchemaOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', padding: '16px 20px' }}>
                                    <pre style={{ margin: 0, color: '#93c5fd', fontSize: '0.84rem', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,JetBrains Mono,monospace', lineHeight: 1.7 }}>{schema}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Toolbar */}
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Language:</label>
                    <select disabled style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.85rem', opacity: 0.7, cursor: 'not-allowed' }}>
                        <option>SQL</option>
                    </select>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#14b8a6', letterSpacing: '0.12em', fontFamily: 'monospace', padding: '4px 10px', background: 'rgba(20,184,166,0.1)', borderRadius: '6px', border: '1px solid rgba(20,184,166,0.25)' }}>SQL MODE</span>
            </div>

            {/* Monaco SQL Editor */}
            <Editor
                height="260px"
                language="sql"
                theme="vs-dark"
                value={query}
                onChange={handleChange}
                options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true, padding: { top: 20 }, fontFamily: 'ui-monospace,JetBrains Mono,monospace', renderLineHighlight: 'all', smoothScrolling: true }}
            />

            {/* SQL Tools Suite — like ProctoredCodeEditor */}
            <div style={{ borderTop: '1px solid #334155', padding: '1.25rem', background: '#0f172a', overflowY: 'auto', maxHeight: '420px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '4px', background: '#020617', borderRadius: '10px', width: 'fit-content' }}>
                    <button onClick={() => setSqlTool('validator')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: sqlTool === 'validator' ? 'rgba(59,130,246,0.2)' : 'transparent', color: sqlTool === 'validator' ? '#60a5fa' : '#64748b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Shield size={14} /> Validator
                    </button>
                    <button onClick={() => setSqlTool('visualizer')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: sqlTool === 'visualizer' ? 'rgba(139,92,246,0.2)' : 'transparent', color: sqlTool === 'visualizer' ? '#a78bfa' : '#64748b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Database size={14} /> ER Diagram
                    </button>
                    <button onClick={() => setSqlTool('debugger')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: sqlTool === 'debugger' ? 'rgba(16,185,129,0.2)' : 'transparent', color: sqlTool === 'debugger' ? '#4ade80' : '#64748b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Layers size={14} /> Debugger
                    </button>
                </div>
                {sqlTool === 'validator' && <SQLValidator query={query} onQueryChange={handleChange} schemaContext={schema} />}
                {sqlTool === 'visualizer' && <SQLVisualizer schema={schema} />}
                {sqlTool === 'debugger' && <SQLDebugger query={query} schema={schema} />}
            </div>
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
