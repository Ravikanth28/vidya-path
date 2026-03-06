/**
 * CompanyRoundManager.jsx — Admin panel for Company First Round Tests
 * Sections: aptitude | verbal | logical | reasoning | technical_mcq | pseudocode | debug | coding | sql
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import {
    Building2, Plus, Trash2, Eye, Users, ToggleLeft, ToggleRight, X, Search,
    Sparkles, ChevronDown, ChevronUp, CheckCircle2, XCircle, Shield, Clock,
    BarChart2, Code, Database, Brain, FileText, Bug, BookOpen, Cpu, Hash,
    Camera, Monitor, ClipboardX, RefreshCw, Download, ArrowLeft, Edit3,
    Play, Check, AlertTriangle, Target, Zap
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Section definitions (mirrors backend) ────────────────────────────────────
const SECTIONS = [
    { key: 'aptitude',      label: 'Aptitude',      icon: '🧮', kind: 'mcq',  desc: 'Quantitative & mathematical reasoning',  color: '#f59e0b' },
    { key: 'verbal',        label: 'Verbal',        icon: '📝', kind: 'mcq',  desc: 'English language & comprehension',        color: '#06b6d4' },
    { key: 'logical',       label: 'Logical',       icon: '🧠', kind: 'mcq',  desc: 'Logical patterns & sequences',            color: '#8b5cf6' },
    { key: 'reasoning',     label: 'Reasoning',     icon: '🔍', kind: 'mcq',  desc: 'Abstract & analytical reasoning',         color: '#ec4899' },
    { key: 'technical_mcq', label: 'Technical MCQ', icon: '💻', kind: 'mcq',  desc: 'CS concepts, theory & technology',        color: '#3b82f6' },
    { key: 'pseudocode',    label: 'Pseudo Code',   icon: '📋', kind: 'mcq',  desc: 'Trace pseudocode & predict output',       color: '#10b981' },
    { key: 'debug',         label: 'Debugging',     icon: '🐛', kind: 'code', desc: 'Find & fix bugs in code snippets',        color: '#ef4444' },
    { key: 'coding',        label: 'Coding',        icon: '⌨️',  kind: 'code', desc: 'Write solutions from scratch',            color: '#6366f1' },
    { key: 'sql',           label: 'SQL',           icon: '🗄️',  kind: 'sql',  desc: 'SQL queries on structured schemas',       color: '#14b8a6' },
];

const SEC_MAP = Object.fromEntries(SECTIONS.map(s => [s.key, s]));

function authHeader() {
    const t = localStorage.getItem('authToken');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const emptyMCQ = () => ({ question_type: 'mcq', question: '', options: ['A) ', 'B) ', 'C) ', 'D) '], correct_answer: 'A', explanation: '' });
const emptyCode = (section) => ({
    question_type: 'code', question: '', code_snippet: section === 'debug' ? '# Buggy code here\n' : '',
    starter_code: '# Write your solution here\n', language: 'Python', test_cases: [{ input: '', expected_output: '' }], explanation: ''
});
const emptySQL = () => ({ question_type: 'sql', question: '', sql_schema: '-- CREATE TABLE ...\n-- INSERT INTO ...\n', expected_output: '', explanation: '' });

const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    if (!msg) return null;
    const bg = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, background: bg, color: '#fff', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '380px' }}>
            {msg}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '4px' }}><X size={15} /></button>
        </div>
    );
}

// ─── Attempt table ─────────────────────────────────────────────────────────────
function AttemptsTable({ attempts, onClose }) {
    return (
        <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} /> Student Attempts ({attempts.length})
                </h4>
                <button onClick={onClose} style={{ background: '#334155', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>Close <ChevronUp size={14} /></button>
            </div>
            {attempts.length === 0 ? <p style={{ color: '#64748b', fontSize: '13px' }}>No attempts yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#0f172a' }}>
                                {['Student', 'Status', 'Score', 'Violations', 'Started', 'Completed'].map(h => (
                                    <th key={h} style={{ padding: '8px', textAlign: h === 'Student' ? 'left' : 'center', borderBottom: '1px solid #334155', color: '#64748b', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '8px', color: '#e2e8f0', fontWeight: 600 }}>{a.student_name || `#${a.student_id}`}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: a.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: a.status === 'completed' ? '#6ee7b7' : '#fcd34d' }}>{a.status}</span>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: a.overall_score >= 60 ? '#4ade80' : '#f87171' }}>{a.status === 'completed' ? `${Math.round(a.overall_score || 0)}%` : '—'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{(a.proctoring_violations || []).length}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{new Date(a.started_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Question form (MCQ / Code / SQL) ────────────────────────────────────────
function QuestionForm({ section, onSave, onCancel, initialData }) {
    const def = SEC_MAP[section];
    const [form, setForm] = useState(initialData || (def.kind === 'mcq' ? emptyMCQ() : def.kind === 'code' ? emptyCode(section) : emptySQL()));
    const [saving, setSaving] = useState(false);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setOption = (i, v) => setForm(f => { const opts = [...f.options]; opts[i] = v; return { ...f, options: opts }; });
    const setTC = (i, k, v) => setForm(f => { const tc = [...(f.test_cases || [])]; tc[i] = { ...tc[i], [k]: v }; return { ...f, test_cases: tc }; });
    const addTC = () => setForm(f => ({ ...f, test_cases: [...(f.test_cases || []), { input: '', expected_output: '' }] }));
    const removeTC = (i) => setForm(f => ({ ...f, test_cases: (f.test_cases || []).filter((_, j) => j !== i) }));

    const handle = async () => {
        if (!form.question.trim()) return;
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' };
    const labelStyle = { fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' };

    return (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: def.color }}>{def.icon} {def.label} Question</span>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>

            {/* Question text */}
            <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Question *</label>
                <textarea value={form.question} onChange={e => setField('question', e.target.value)} rows={3} placeholder="Enter the question..." style={inputStyle} />
            </div>

            {def.kind === 'mcq' && (
                <>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Options (A, B, C, D)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {['A', 'B', 'C', 'D'].map((letter, i) => (
                                <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: form.correct_answer === letter ? '#4ade80' : '#64748b', minWidth: '18px' }}>{letter})</span>
                                    <input value={(form.options || [])[i] || ''} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${letter}`}
                                        style={{ ...inputStyle, padding: '8px 12px', flex: 1, borderColor: form.correct_answer === letter ? '#22c55e' : '#475569' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        <div>
                            <label style={labelStyle}>Correct Answer</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['A', 'B', 'C', 'D'].map(l => (
                                    <button key={l} onClick={() => setField('correct_answer', l)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${form.correct_answer === l ? '#22c55e' : '#334155'}`, background: form.correct_answer === l ? '#22c55e20' : '#1e293b', color: form.correct_answer === l ? '#4ade80' : '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Explanation (optional)</label>
                            <input value={form.explanation || ''} onChange={e => setField('explanation', e.target.value)} placeholder="Why is this correct?" style={{ ...inputStyle, resize: 'none' }} />
                        </div>
                    </div>
                </>
            )}

            {def.kind === 'code' && (
                <>
                    {section === 'debug' && (
                        <div style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>Buggy Code Snippet</label>
                            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569' }}>
                                <Editor height="160px" language="python" theme="vs-dark" value={form.code_snippet || ''} onChange={v => setField('code_snippet', v)}
                                    options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', scrollBeyondLastLine: false }} />
                            </div>
                        </div>
                    )}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Starter Code (given to student)</label>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569' }}>
                            <Editor height="160px" language="python" theme="vs-dark" value={form.starter_code || ''} onChange={v => setField('starter_code', v)}
                                options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', scrollBeyondLastLine: false }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={labelStyle}>Test Cases</label>
                            <button onClick={addTC} style={{ background: '#3b82f620', border: '1px solid #3b82f640', color: '#60a5fa', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>+ Add Case</button>
                        </div>
                        {(form.test_cases || []).map((tc, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '6px' }}>
                                <input value={tc.input || ''} onChange={e => setTC(i, 'input', e.target.value)} placeholder="Input" style={{ ...inputStyle, padding: '7px 10px' }} />
                                <input value={tc.expected_output || ''} onChange={e => setTC(i, 'expected_output', e.target.value)} placeholder="Expected Output" style={{ ...inputStyle, padding: '7px 10px' }} />
                                <button onClick={() => removeTC(i)} style={{ background: '#ef444420', border: 'none', color: '#f87171', borderRadius: '6px', cursor: 'pointer', padding: '0 10px' }}><X size={13} /></button>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Explanation / Solution Hint</label>
                        <textarea value={form.explanation || ''} onChange={e => setField('explanation', e.target.value)} rows={2} placeholder="Explain the solution..." style={inputStyle} />
                    </div>
                </>
            )}

            {def.kind === 'sql' && (
                <>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>SQL Schema (CREATE TABLE + INSERT INTO)</label>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569' }}>
                            <Editor height="160px" language="sql" theme="vs-dark" value={form.sql_schema || ''} onChange={v => setField('sql_schema', v)}
                                options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', scrollBeyondLastLine: false }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Expected Output (pipe-separated: col1|col2 per row)</label>
                        <textarea value={form.expected_output || ''} onChange={e => setField('expected_output', e.target.value)} rows={3} placeholder="e.g.&#10;name|salary&#10;Alice|95000&#10;Bob|88000" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Explanation / Correct Query</label>
                        <textarea value={form.explanation || ''} onChange={e => setField('explanation', e.target.value)} rows={2} placeholder="The correct SQL query is..." style={inputStyle} />
                    </div>
                </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #475569', background: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Cancel</button>
                <button onClick={handle} disabled={saving || !form.question.trim()} style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: saving ? '#475569' : `linear-gradient(135deg, ${def.color}, ${def.color}99)`, color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <RefreshCw size={13} className="spin" /> : <Check size={13} />} Save Question
                </button>
            </div>
        </div>
    );
}

// ─── Question Editor View (per test) ─────────────────────────────────────────
function QuestionEditor({ test, onBack, showToast }) {
    const [activeSection, setActiveSection] = useState(test.sections?.[0] || '');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingQ, setAddingQ] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    const isCodeOrSql = (sec) => ['coding', 'debug', 'sql'].includes(sec);
    const [aiCount, setAiCount] = useState(isCodeOrSql(test.sections?.[0]) ? 1 : 5);
    const [aiTopic, setAiTopic] = useState('');

    const loadQs = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/api/crt/tests/${test.id}/questions`, { headers: authHeader() });
            setQuestions(data);
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); }
        setLoading(false);
    }, [test.id]);

    useEffect(() => { loadQs(); }, [loadQs]);

    const sectionQs = questions.filter(q => q.section === activeSection);
    const def = SEC_MAP[activeSection];

    const saveQuestion = async (form) => {
        try {
            await axios.post(`${API}/api/crt/tests/${test.id}/questions`, { section: activeSection, ...form }, { headers: authHeader() });
            setAddingQ(false);
            loadQs();
            showToast('Question saved!');
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); }
    };

    const deleteQuestion = async (qid) => {
        if (!confirm('Delete this question?')) return;
        try {
            await axios.delete(`${API}/api/crt/tests/${test.id}/questions/${qid}`, { headers: authHeader() });
            loadQs();
            showToast('Question deleted', 'warn');
        } catch (e) { showToast(e.message, 'error'); }
    };

    const aiGenerate = async () => {
        setAiGenerating(true);
        try {
            const { data } = await axios.post(`${API}/api/crt/tests/${test.id}/ai-generate`,
                { section: activeSection, count: aiCount, difficulty: test.difficulty || 'medium', topic: aiTopic },
                { headers: authHeader() });
            loadQs();
            showToast(`✨ AI generated ${data.inserted} questions!`);
            setAiTopic('');
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); }
        setAiGenerating(false);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>
                        <span style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{test.company_name}</span>
                        &nbsp;— Question Bank
                    </h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{test.title} · {questions.length} total questions</p>
                </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
                {(test.sections || []).map(sec => {
                    const d = SEC_MAP[sec];
                    const cnt = questions.filter(q => q.section === sec).length;
                    return (
                        <button key={sec} onClick={() => { setActiveSection(sec); setAddingQ(false); setAiCount(isCodeOrSql(sec) ? 1 : 3); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `2px solid ${activeSection === sec ? d.color : '#334155'}`, background: activeSection === sec ? `${d.color}18` : '#1e293b', color: activeSection === sec ? d.color : '#94a3b8', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <span>{d.icon}</span> {d.label}
                            <span style={{ background: activeSection === sec ? d.color : '#334155', color: activeSection === sec ? '#fff' : '#94a3b8', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{cnt}</span>
                        </button>
                    );
                })}
            </div>

            {def && (
                <>
                    {/* Section header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>{def.icon} {def.label} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '13px' }}>— {def.desc}</span></h3>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{sectionQs.length} questions in this section</p>
                        </div>
                    </div>

                    {/* AI Generate + Add Question toolbar */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {/* AI panel */}
                        <div style={{ flex: 1, minWidth: '320px', display: 'flex', gap: '10px', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b, #1e293b)', border: '1px solid #4f46e540', borderRadius: '12px', padding: '10px 14px' }}>
                            <Sparkles size={16} color="#8b5cf6" style={{ flexShrink: 0 }} />
                            {/* Topic input */}
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !aiGenerating && aiGenerate()}
                                    placeholder="Topic (e.g. Arrays, SQL Joins…)"
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '7px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                                    onBlur={e => e.target.style.borderColor = '#334155'}
                                />
                            </div>
                            {/* Count input */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Count</span>
                                <input
                                    type="number"
                                    value={aiCount}
                                    min={1}
                                    max={100}
                                    onChange={e => setAiCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                    style={{ width: '52px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '7px 8px', color: '#a78bfa', fontSize: '14px', fontWeight: 800, outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                                    onBlur={e => e.target.style.borderColor = '#334155'}
                                />
                            </div>
                            <button onClick={aiGenerate} disabled={aiGenerating}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: aiGenerating ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: '9px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: aiGenerating ? 'not-allowed' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap', boxShadow: aiGenerating ? 'none' : '0 2px 12px #8b5cf640', transition: 'all 0.2s' }}>
                                {aiGenerating
                                    ? <><span style={{ width: '13px', height: '13px', border: '2px solid #ffffff40', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                                    : <><Sparkles size={13} /> Generate</>}
                            </button>
                        </div>

                        {/* Manual add button */}
                        {!addingQ && (
                            <button onClick={() => setAddingQ(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: `linear-gradient(135deg, ${def.color}dd, ${def.color}99)`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: `0 2px 12px ${def.color}40`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                <Plus size={16} /> Add Question
                            </button>
                        )}
                    </div>

                    {/* Add question form */}
                    {addingQ && (
                        <QuestionForm section={activeSection} onSave={saveQuestion} onCancel={() => setAddingQ(false)} />
                    )}

                    {/* Question list */}
                    {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading questions…</div>
                        : sectionQs.length === 0 && !addingQ ? (
                            <div style={{ textAlign: 'center', padding: '48px', background: '#1e293b', borderRadius: '12px', border: '2px dashed #334155' }}>
                                <span style={{ fontSize: '40px' }}>{def.icon}</span>
                                <p style={{ color: '#64748b', marginTop: '12px', fontSize: '14px' }}>No questions yet. Add manually or use AI Generate.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sectionQs.map((q, i) => (
                                    <div key={q.id} style={{ background: '#1e293b', borderRadius: '10px', padding: '14px 16px', border: `1px solid #334155`, borderLeft: `3px solid ${def.color}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Q{i + 1}</span>
                                                    <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: `${def.color}20`, color: def.color, fontWeight: 700 }}>{q.question_type?.toUpperCase()}</span>
                                                    {q.question_type === 'mcq' && q.correct_answer && (
                                                        <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: '#22c55e20', color: '#4ade80', fontWeight: 700 }}>✓ {q.correct_answer}</span>
                                                    )}
                                                    {q.question_type === 'code' && (q.test_cases || []).length > 0 && (
                                                        <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: '#6366f120', color: '#a5b4fc', fontWeight: 700 }}>{q.test_cases.length} test cases</span>
                                                    )}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#f1f5f9', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{q.question}</p>
                                                {q.question_type === 'mcq' && (q.options || []).length > 0 && (
                                                    <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                                        {q.options.map((opt, oi) => {
                                                            const letter = ['A', 'B', 'C', 'D'][oi];
                                                            const isCorrect = letter === q.correct_answer;
                                                            return <span key={oi} style={{ fontSize: '11px', color: isCorrect ? '#4ade80' : '#94a3b8', fontWeight: isCorrect ? 700 : 400 }}>{isCorrect ? '✓' : '•'} {opt}</span>;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => deleteQuestion(q.id)} style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#f87171', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </>
            )}
        </div>
    );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ testId, testTitle, isActive, currentAssigned, onClose, onSaved, showToast }) {
    const [tab, setTab] = useState('all'); // 'all' | 'individual' | 'batch'
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([...(currentAssigned || [])]);
    const [search, setSearch] = useState('');
    const [batchText, setBatchText] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        axios.get(`${API}/api/crt/students`, { headers: authHeader() })
            .then(r => { setStudents(r.data); setLoadingStudents(false); })
            .catch(e => { showToast(e.message, 'error'); setLoadingStudents(false); });
    }, []);

    const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const filtered = students.filter(s => (s.name + s.email).toLowerCase().includes(search.toLowerCase()));

    const doSave = async (ids) => {
        setSaving(true);
        try {
            await axios.put(`${API}/api/crt/tests/${testId}/assign`, { student_ids: ids }, { headers: authHeader() });
            showToast(`✅ Assigned to ${ids.length} student(s)`);
            onSaved();
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); setSaving(false); }
    };

    const handleBatchAssign = () => {
        // match emails from batchText to student list
        const emails = batchText.split(/[\n,;]+/).map(l => l.trim().toLowerCase()).filter(Boolean);
        const ids = students.filter(s => emails.includes(s.email?.toLowerCase())).map(s => s.id);
        if (ids.length === 0) { showToast('No matching students found', 'error'); return; }
        doSave(ids);
    };

    const TABS = [
        { key: 'all', label: '🚀 Assign All', icon: null },
        { key: 'individual', label: '👤 Individual', icon: null },
        { key: 'batch', label: '👥 Batch', icon: null },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0f172a', borderRadius: '20px', width: '540px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #1e293b', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

                {/* Header */}
                <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="#a78bfa" /> Assign Students
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>{testTitle}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#1e293b', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: '8px', padding: '7px', display: 'flex', lineHeight: 1 }}><X size={15} /></button>
                </div>

                {/* Not-live warning */}
                {!isActive && (
                    <div style={{ margin: '0 24px 14px', padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', fontSize: '12px', color: '#fbbf24', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 600 }}>
                        <AlertTriangle size={14} />
                        <span>This test is <strong>not Live yet</strong> — students won't see it until you click <strong>Go Live</strong> on the card.</span>
                    </div>
                )}

                {/* Tab switcher */}
                <div style={{ margin: '0 24px 18px', display: 'flex', background: '#1e293b', borderRadius: '12px', padding: '4px', gap: '2px' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.15s', background: tab === t.key ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent', color: tab === t.key ? '#fff' : '#64748b', boxShadow: tab === t.key ? '0 2px 8px #7c3aed40' : 'none' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* ── Assign All ── */}
                    {tab === 'all' && (
                        <div style={{ padding: '8px 24px 24px', textAlign: 'center' }}>
                            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '36px 24px', marginBottom: '16px' }}>
                                {loadingStudents
                                    ? <p style={{ color: '#64748b', fontSize: '14px' }}>Loading students…</p>
                                    : <>
                                        <div style={{ fontSize: '52px', fontWeight: 900, color: '#a78bfa', lineHeight: 1, marginBottom: '8px' }}>{students.length}</div>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>students will receive this test</p>
                                    </>}
                            </div>
                            <button onClick={() => doSave(students.map(s => s.id))} disabled={saving || loadingStudents}
                                style={{ width: '100%', padding: '14px', background: saving ? '#334155' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 800, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px #7c3aed40' }}>
                                {saving ? '⏳ Assigning…' : `🚀 Assign to All ${students.length} Students`}
                            </button>
                        </div>
                    )}

                    {/* ── Individual ── */}
                    {tab === 'individual' && (
                        <>
                            <div style={{ padding: '0 24px 10px' }}>
                                <div style={{ position: 'relative', marginBottom: '8px' }}>
                                    <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                                        style={{ width: '100%', padding: '9px 14px 9px 34px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>{selected.length} selected</span>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setSelected(students.map(s => s.id))} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                                        <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', maxHeight: '320px' }}>
                                {filtered.map(s => {
                                    const isSelected = selected.includes(s.id);
                                    return (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', borderRadius: '10px', cursor: 'pointer', background: isSelected ? 'rgba(124,58,237,0.12)' : 'transparent', border: `1px solid ${isSelected ? '#7c3aed40' : 'transparent'}`, marginBottom: '3px', transition: 'all 0.12s' }}>
                                            <input type="checkbox" checked={isSelected} onChange={() => toggle(s.id)} style={{ accentColor: '#7c3aed', width: '15px', height: '15px', flexShrink: 0 }} />
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{(s.name || '?')[0].toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.email}</div>
                                            </div>
                                            {isSelected && <CheckCircle2 size={15} color="#a78bfa" style={{ flexShrink: 0 }} />}
                                        </label>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button onClick={() => doSave(selected)} disabled={saving || selected.length === 0}
                                    style={{ padding: '9px 22px', borderRadius: '10px', border: 'none', background: saving || selected.length === 0 ? '#334155' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: saving || selected.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: selected.length > 0 ? '0 2px 10px #7c3aed40' : 'none' }}>
                                    <CheckCircle2 size={14} /> {saving ? 'Saving…' : `Confirm ${selected.length > 0 ? `(${selected.length})` : ''}`}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Batch (paste emails) ── */}
                    {tab === 'batch' && (
                        <div style={{ padding: '0 24px 24px' }}>
                            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 10px' }}>Paste student emails — one per line, or separated by commas.</p>
                            <textarea value={batchText} onChange={e => setBatchText(e.target.value)} rows={10}
                                placeholder={"student1@edu.com\nstudent2@edu.com\n..."}
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', color: '#f1f5f9', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button onClick={handleBatchAssign} disabled={saving || !batchText.trim()}
                                    style={{ padding: '9px 22px', borderRadius: '10px', border: 'none', background: saving || !batchText.trim() ? '#334155' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: saving || !batchText.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={14} /> {saving ? 'Assigning…' : 'Assign Batch'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Create Test Form ─────────────────────────────────────────────────────────
function CreateTestForm({ onCreated, onCancel, showToast }) {
    const [form, setForm] = useState({
        company_name: '', title: '', description: '',
        sections: [], difficulty: 'medium', duration_minutes: 90,
        max_attempts: 1, pass_percentage: 60,
        section_time_limits: {},
        proctoring_config: {
            enabled: false, disableCopyPaste: true, trackTabSwitches: true,
            maxTabSwitches: 3, requireFullscreen: false, enableWebcam: false,
            autoSubmitOnViolation: false
        }
    });
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState(1); // 1: Info + Sections, 2: Settings + Proctoring

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setPC = (k, v) => setForm(f => ({ ...f, proctoring_config: { ...f.proctoring_config, [k]: v } }));
    const toggleSection = (key) => set('sections', form.sections.includes(key) ? form.sections.filter(s => s !== key) : [...form.sections, key]);

    const handleCreate = async () => {
        if (!form.company_name.trim() || !form.title.trim()) return showToast('Company name and title are required', 'error');
        if (form.sections.length === 0) return showToast('Select at least one section', 'error');
        setCreating(true);
        try {
            const { data } = await axios.post(`${API}/api/crt/tests`, form, { headers: authHeader() });
            showToast('Test created successfully!');
            onCreated(data.testId);
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); }
        setCreating(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { fontWeight: 700, fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };

    return (
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '18px', padding: '28px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="#3b82f6" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#93c5fd' }}>Create Company Round Test</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Step {step} of 2</p>
                    </div>
                </div>
                <button onClick={onCancel} style={{ background: '#334155', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: '8px', padding: '8px', display: 'flex' }}><X size={16} /></button>
            </div>

            {/* Step 1: Company, Title, Sections */}
            {step === 1 && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                        <div>
                            <label style={labelStyle}>Company Name *</label>
                            <input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g., Google, Zoho, TCS" style={{ ...inputStyle, borderColor: form.company_name ? '#3b82f6' : '#475569' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Test Title *</label>
                            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., TCS NQT First Round" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={labelStyle}>Description (optional)</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief overview of this assessment…" style={{ ...inputStyle, resize: 'none' }} />
                    </div>

                    {/* Section selector */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ ...labelStyle, marginBottom: '12px' }}>
                            Select Sections * <span style={{ color: '#64748b', textTransform: 'none', fontSize: '11px', fontWeight: 400 }}>({form.sections.length} selected)</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {SECTIONS.map(sec => {
                                const selected = form.sections.includes(sec.key);
                                return (
                                    <button key={sec.key} onClick={() => toggleSection(sec.key)}
                                        style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${selected ? sec.color : '#334155'}`, background: selected ? `${sec.color}15` : '#1e293b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative' }}>
                                        {selected && <Check size={13} style={{ position: 'absolute', top: '8px', right: '8px', color: sec.color }} />}
                                        <span style={{ fontSize: '20px', marginBottom: '6px' }}>{sec.icon}</span>
                                        <span style={{ fontWeight: 700, fontSize: '13px', color: selected ? sec.color : '#f1f5f9' }}>{sec.label}</span>
                                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>{sec.desc}</span>
                                        <span style={{ fontSize: '10px', marginTop: '4px', padding: '2px 6px', borderRadius: '4px', background: '#0f172a', color: '#475569', width: 'fit-content' }}>{sec.kind.toUpperCase()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => step === 1 && (form.company_name && form.title && form.sections.length > 0 ? setStep(2) : showToast('Fill company name, title and select sections', 'error'))}
                            style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                            Next: Settings →
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Duration, difficulty, proctoring */}
            {step === 2 && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                        <div>
                            <label style={labelStyle}>Difficulty</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {['easy', 'medium', 'hard'].map(d => (
                                    <button key={d} onClick={() => set('difficulty', d)} style={{ padding: '8px', borderRadius: '8px', border: `2px solid ${form.difficulty === d ? { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }[d] : '#334155'}`, background: form.difficulty === d ? { easy: '#22c55e15', medium: '#f59e0b15', hard: '#ef444415' }[d] : '#1e293b', color: form.difficulty === d ? { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' }[d] : '#94a3b8', fontWeight: 700, fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}>{d}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Duration (min)</label>
                            <input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', clamp(parseInt(e.target.value) || 30, 10, 300))} min={10} max={300} style={{ ...inputStyle, textAlign: 'center' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Attempts</label>
                            <input type="number" value={form.max_attempts} onChange={e => set('max_attempts', clamp(parseInt(e.target.value) || 1, 1, 10))} min={1} max={10} style={{ ...inputStyle, textAlign: 'center' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Pass % Threshold</label>
                            <input type="number" value={form.pass_percentage} onChange={e => set('pass_percentage', clamp(parseInt(e.target.value) || 60, 0, 100))} min={0} max={100} style={{ ...inputStyle, textAlign: 'center' }} />
                        </div>
                    </div>

                    {/* Proctoring */}
                    <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', marginBottom: '18px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={16} color="#8b5cf6" /> Proctoring Settings</h4>
                            <button onClick={() => setPC('enabled', !form.proctoring_config.enabled)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: `1px solid ${form.proctoring_config.enabled ? '#8b5cf6' : '#334155'}`, borderRadius: '8px', padding: '5px 12px', color: form.proctoring_config.enabled ? '#a78bfa' : '#64748b', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>
                                {form.proctoring_config.enabled ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                                {form.proctoring_config.enabled ? 'Proctoring ON' : 'Proctoring OFF'}
                            </button>
                        </div>
                        {form.proctoring_config.enabled && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[
                                    ['disableCopyPaste', 'Disable Copy/Paste', ClipboardX],
                                    ['trackTabSwitches', 'Track Tab Switches', Monitor],
                                    ['requireFullscreen', 'Require Fullscreen', Monitor],
                                    ['enableWebcam', 'Enable Webcam', Camera],
                                    ['autoSubmitOnViolation', 'Auto-Submit on Violation', AlertTriangle],
                                ].map(([k, lbl, Icon]) => (
                                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: form.proctoring_config[k] ? '#8b5cf615' : 'transparent', border: `1px solid ${form.proctoring_config[k] ? '#8b5cf640' : 'transparent'}` }}>
                                        <input type="checkbox" checked={!!form.proctoring_config[k]} onChange={e => setPC(k, e.target.checked)} style={{ accentColor: '#8b5cf6' }} />
                                        <Icon size={13} color="#a78bfa" />
                                        <span style={{ fontSize: '12px', color: '#e2e8f0' }}>{lbl}</span>
                                    </label>
                                ))}
                                {form.proctoring_config.trackTabSwitches && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', color: '#94a3b8' }}>Max tab switches:</label>
                                        <input type="number" value={form.proctoring_config.maxTabSwitches || 3} onChange={e => setPC('maxTabSwitches', parseInt(e.target.value) || 3)} min={1} max={20} style={{ width: '60px', textAlign: 'center', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#f1f5f9', padding: '4px 8px', outline: 'none' }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section time limits */}
                    <div style={{ marginBottom: '18px', background: '#0f172a', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
                        <label style={{ ...labelStyle, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={13} /> Section Time Limits <span style={{ color: '#475569', fontSize: '10px', textTransform: 'none', fontWeight: 400, marginLeft: '4px' }}>(minutes · 0 = no limit)</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {form.sections.map(sec => { const d = SEC_MAP[sec]; return (
                                <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: '#1e293b', border: `1px solid ${d.color}40` }}>
                                    <span style={{ fontSize: '14px' }}>{d.icon}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: d.color, flex: 1 }}>{d.label}</span>
                                    <input type="number" min={0} max={180} value={form.section_time_limits[sec] || 0}
                                        onChange={e => set('section_time_limits', { ...form.section_time_limits, [sec]: parseInt(e.target.value) || 0 })}
                                        style={{ width: '52px', textAlign: 'center', background: '#0f172a', border: '1px solid #475569', borderRadius: '6px', color: '#f1f5f9', padding: '5px 6px', outline: 'none', fontSize: '13px', fontWeight: 700 }} />
                                    <span style={{ fontSize: '10px', color: '#475569' }}>min</span>
                                </div>
                            ); })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(1)} style={{ padding: '11px 20px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                        <button onClick={handleCreate} disabled={creating} style={{ padding: '11px 32px', background: creating ? '#475569' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: creating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {creating ? <><RefreshCw size={14} className="spin" /> Creating…</> : <><Sparkles size={14} /> Create Test</>}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CompanyRoundManager() {
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingTest, setEditingTest] = useState(null); // QuestionEditor view
    const [viewAttempts, setViewAttempts] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [assignModal, setAssignModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
    }, []);

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/api/crt/tests`, { headers: authHeader() });
            setTests(data);
        } catch (e) { showToast(e.response?.data?.error || e.message, 'error'); }
        setLoading(false);
    }, [showToast]);

    useEffect(() => { loadTests(); }, [loadTests]);

    const toggleLive = async (id) => {
        try {
            const { data } = await axios.put(`${API}/api/crt/tests/${id}/toggle`, {}, { headers: authHeader() });
            showToast(data.is_active ? '🟢 Test is now LIVE!' : '⏹ Test ended');
            loadTests();
        } catch (e) { showToast(e.message, 'error'); }
    };

    const deleteTest = async (id) => {
        if (!confirm('Delete this test and all attempts?')) return;
        try {
            await axios.delete(`${API}/api/crt/tests/${id}`, { headers: authHeader() });
            showToast('Test deleted', 'warn');
            loadTests();
        } catch (e) { showToast(e.message, 'error'); }
    };

    const loadAttempts = async (testId) => {
        if (viewAttempts === testId) { setViewAttempts(null); return; }
        try {
            const { data } = await axios.get(`${API}/api/crt/tests/${testId}/attempts`, { headers: authHeader() });
            setAttempts(data);
            setViewAttempts(testId);
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleCreated = async (newTestId) => {
        await loadTests();
        setShowCreate(false);
        // Open the question editor for the new test
        const { data } = await axios.get(`${API}/api/crt/tests`, { headers: authHeader() });
        const created = data.find(t => t.id === newTestId);
        if (created) setEditingTest(created);
        setTests(data);
    };

    // Question editor view
    if (editingTest) {
        return (
            <>
                <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
                <QuestionEditor test={editingTest} onBack={() => { setEditingTest(null); loadTests(); }} showToast={showToast} />
            </>
        );
    }

    const filtered = tests.filter(t => (t.company_name + ' ' + t.title).toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>

            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Page header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}><Building2 size={22} color="white" /></div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#f1f5f9' }}>Company Round Tests</h2>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Create first-round assessments with aptitude, coding, SQL & more</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search tests…" style={{ padding: '9px 14px 9px 34px', borderRadius: '10px', border: '1px solid #475569', background: '#0f172a', color: '#f1f5f9', fontSize: '13px', width: '220px', outline: 'none' }} />
                        </div>
                        <button onClick={() => setShowCreate(!showCreate)}
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', background: showCreate ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}>
                            {showCreate ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Create Test</>}
                        </button>
                    </div>
                </div>

                {/* Create form */}
                {showCreate && <CreateTestForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} showToast={showToast} />}

                {/* Test cards */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading tests…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '72px 40px', background: '#1e293b', borderRadius: '18px', border: '2px dashed #334155' }}>
                        <Building2 size={52} style={{ color: '#334155', marginBottom: '14px' }} />
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 8px', fontWeight: 700 }}>{searchTerm ? 'No tests match your search' : 'No company round tests yet'}</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>{searchTerm ? 'Try a different keyword' : 'Click "Create Test" to get started'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px' }}>{filtered.length} test{filtered.length !== 1 ? 's' : ''}</p>
                        {filtered.map(test => (
                            <div key={test.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px 22px', borderLeft: `5px solid ${test.is_active ? '#22c55e' : '#475569'}`, transition: 'border-color 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                                    {/* Left: info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f1f5f9' }}>{test.title}</h3>
                                            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: test.is_active ? '#22c55e20' : '#ef444420', color: test.is_active ? '#4ade80' : '#f87171' }}>{test.is_active ? '🟢 LIVE' : '⏹ INACTIVE'}</span>
                                            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: '#3b82f620', color: '#60a5fa' }}>{test.company_name}</span>
                                            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: { easy: '#22c55e20', medium: '#f59e0b20', hard: '#ef444420' }[test.difficulty], color: { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' }[test.difficulty] }}>{test.difficulty}</span>
                                        </div>
                                        {test.description && <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: '13px' }}>{test.description}</p>}

                                        {/* Sections */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            {(test.sections || []).map(sec => { const d = SEC_MAP[sec]; return d && <span key={sec} style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: `${d.color}20`, color: d.color }}>{d.icon} {d.label}</span>; })}
                                        </div>

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: '18px', fontSize: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><FileText size={13} /> {test.total_questions || 0} questions</span>
                                            <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><Clock size={13} /> {test.duration_minutes}m</span>
                                            <span style={{ color: '#64748b', display: 'flex', gap: '4px', alignItems: 'center' }}><Users size={13} /> {test.total_attempts || 0} attempts</span>
                                            <span style={{ color: '#22c55e', display: 'flex', gap: '4px', alignItems: 'center' }}><CheckCircle2 size={13} /> {test.completed_attempts || 0} completed</span>
                                            {test.avg_score > 0 && <span style={{ color: '#60a5fa', display: 'flex', gap: '4px', alignItems: 'center' }}><BarChart2 size={13} /> Avg {Math.round(test.avg_score)}%</span>}
                                            <span style={{ color: '#a78bfa', display: 'flex', gap: '4px', alignItems: 'center' }}><Shield size={13} /> Pass {test.pass_percentage}%</span>
                                        </div>
                                    </div>

                                    {/* Right: action buttons */}
                                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                        {/* Edit Questions */}
                                        <button onClick={() => setEditingTest(test)} title="Edit Questions"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#a5b4fc', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                            <Edit3 size={14} /> Questions
                                        </button>
                                        {/* Assign */}
                                        <button onClick={() => setAssignModal(test)} title="Assign Students"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px', color: '#a78bfa', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                            <Users size={14} /> Assign
                                        </button>
                                        {/* Attempts */}
                                        <button onClick={() => loadAttempts(test.id)} title="View Attempts"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                            <Eye size={14} /> Attempts {viewAttempts === test.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                        {/* Live/End */}
                                        <button onClick={() => toggleLive(test.id)} title={test.is_active ? 'End Test' : 'Go Live'}
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: test.is_active ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${test.is_active ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: '10px', color: test.is_active ? '#fbbf24' : '#4ade80', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                            {test.is_active ? <><ToggleRight size={14} /> End</> : <><ToggleLeft size={14} /> Go Live</>}
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => deleteTest(test.id)} title="Delete"
                                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Not-live + assigned warning */}
                                {!test.is_active && (test.assigned_students || []).length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', marginTop: '14px', fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>
                                        <AlertTriangle size={13} />
                                        <span>{(test.assigned_students || []).length} student{(test.assigned_students || []).length !== 1 ? 's' : ''} assigned but this test is <strong>not Live</strong> — click <strong>Go Live</strong> so they can see it.</span>
                                    </div>
                                )}

                                {/* Attempts table */}
                                {viewAttempts === test.id && <AttemptsTable attempts={attempts} onClose={() => setViewAttempts(null)} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign modal */}
            {assignModal && (
                <AssignModal
                    testId={assignModal.id}
                    testTitle={`${assignModal.company_name} — ${assignModal.title}`}
                    isActive={!!assignModal.is_active}
                    currentAssigned={assignModal.assigned_students || []}
                    onClose={() => setAssignModal(null)}
                    onSaved={() => { setAssignModal(null); loadTests(); }}
                    showToast={showToast}
                />
            )}
        </>
    );
}
