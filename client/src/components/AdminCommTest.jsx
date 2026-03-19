import React, { useState, useEffect, useCallback } from 'react';
import {
    Mic, Plus, Trash2, Edit3, Users, Play, Square, BarChart2,
    X, Search, CheckCircle, CheckCircle2, Clock, BookOpen, Volume2, MessageSquare,
    PenTool, Eye, AlertCircle, AlertTriangle, Briefcase, FileText, Brain, List, Headphones, ArrowRight, Radio, Download
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' });

const MODULE_DEFS = [
    // Core communication
    { key: 'read-speak',           label: 'Read & Speak',          icon: BookOpen,      color: '#7c3aed', group: 'Speaking' },
    { key: 'listen-repeat',        label: 'Listen & Repeat',        icon: Headphones,    color: '#0891b2', group: 'Speaking' },
    { key: 'topic-speak',          label: 'Topic Speaking',         icon: MessageSquare, color: '#059669', group: 'Speaking' },
    { key: 'grammar-quiz',         label: 'Grammar Quiz',           icon: PenTool,       color: '#d97706', group: 'Language' },
    // Hiring-focused
    { key: 'vocabulary-test',      label: 'Vocabulary Test',        icon: Brain,         color: '#7c2d92', group: 'Language' },
    { key: 'situational-response', label: 'Situational Response',   icon: Briefcase,     color: '#0f766e', group: 'Professional' },
    { key: 'email-writing',        label: 'Professional Writing',   icon: FileText,      color: '#b45309', group: 'Professional' },
    { key: 'interview-qa',         label: 'Interview Q&A',          icon: List,          color: '#be123c', group: 'Professional' },
    // Group Discussion (exclusive — cannot be mixed with other sections)
    { key: 'gd-round',             label: 'Group Discussion (GD)',  icon: Radio,         color: '#6366f1', group: 'Group Discussion', exclusive: true,
      desc: 'AI-powered group discussion — students debate a topic with AI participants' },
];

const STATUS_BADGE = {
    draft:  { label: 'Draft', bg: '#1e293b', color: '#94a3b8', border: '#475569' },
    active: { label: 'Live',  bg: '#052e16', color: '#34d399', border: '#065f46' },
    ended:  { label: 'Ended', bg: '#2d1515', color: '#f87171', border: '#7f1d1d' },
};

// Dark design tokens
const D = {
    bg: '#0f172a', card: '#1e293b', border: '#334155',
    inputBg: '#0f172a', inputBorder: '#475569',
    text: '#f1f5f9', textSec: '#94a3b8', textMuted: '#64748b',
    purple: '#7c3aed',
};

// --- Toast ---------------------------------------------------------------------
function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const s = { success: { bg: '#052e16', color: '#34d399', border: '#065f46' }, error: { bg: '#2d1515', color: '#f87171', border: '#7f1d1d' }, warn: { bg: '#2d1b00', color: '#fbbf24', border: '#92400e' } }[type] || { bg: '#052e16', color: '#34d399', border: '#065f46' };
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.5)', maxWidth: 380, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500 }}>
            {type === 'error' ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
            <span style={{ flex: 1 }}>{msg}</span>
            <X size={14} style={{ cursor: 'pointer', opacity: .7 }} onClick={onClose}/>
        </div>
    );
}

// --- Assign Modal ---------------------------------------------------------------
function AssignModal({ test, onClose, onDone }) {
    const testId = test.id;
    const testTitle = test.title;
    const isLive = test.status === 'active';

    const [tab, setTab] = useState('all');
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');
    const [batchText, setBatchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        fetch(`${API}/crt/students`, { headers: authHeader() })
            .then(r => r.json())
            .then(d => { setStudents(Array.isArray(d) ? d : (d.students || [])); setLoadingStudents(false); })
            .catch(() => setLoadingStudents(false));
    }, []);

    const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const filtered = students.filter(s => (s.name + ' ' + s.email).toLowerCase().includes(search.toLowerCase()));

    async function doSave(ids) {
        if (!ids.length) return;
        setLoading(true);
        try {
            await fetch(`${API}/admin/comm-test/tests/${testId}/assign`, { method: 'PUT', headers: authHeader(), body: JSON.stringify({ student_ids: ids.map(String) }) });
            onDone(); onClose();
        } finally { setLoading(false); }
    }

    function handleBatch() {
        const emails = batchText.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
        const ids = students.filter(s => emails.includes((s.email || '').toLowerCase())).map(s => s.id);
        if (!ids.length) { alert('No matching students found.'); return; }
        doSave(ids);
    }

    const TABS = [
        { key: 'all',        label: '🚀 Assign All' },
        { key: 'individual', label: '👤 Individual' },
        { key: 'batch',      label: '👥 Batch' },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0f172a', borderRadius: 20, width: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #1e293b', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

                {/* Header */}
                <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={18} color="#a78bfa" /> Assign Students
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>{testTitle}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#1e293b', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 8, padding: 7, display: 'flex', lineHeight: 1 }}><X size={15}/></button>
                </div>

                {/* Not-live warning */}
                {!isLive && (
                    <div style={{ margin: '0 24px 14px', padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, fontSize: 12, color: '#fbbf24', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                        <AlertTriangle size={14}/>
                        <span>This test is <strong>not Live yet</strong> — students won't see it until you click <strong>Go Live</strong> on the card.</span>
                    </div>
                )}

                {/* Tab switcher */}
                <div style={{ margin: '0 24px 18px', display: 'flex', background: '#1e293b', borderRadius: 12, padding: 4, gap: 2 }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                                background: tab === t.key ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                                color: tab === t.key ? '#fff' : '#64748b',
                                boxShadow: tab === t.key ? '0 2px 8px #7c3aed40' : 'none' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* Assign All */}
                    {tab === 'all' && (
                        <div style={{ padding: '8px 24px 24px', textAlign: 'center' }}>
                            <div style={{ background: '#1e293b', borderRadius: 16, padding: '36px 24px', marginBottom: 16 }}>
                                {loadingStudents
                                    ? <p style={{ color: '#64748b', fontSize: 14 }}>Loading students…</p>
                                    : <>
                                        <div style={{ fontSize: 52, fontWeight: 900, color: '#a78bfa', lineHeight: 1, marginBottom: 8 }}>{students.length}</div>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>students will receive this test</p>
                                      </>}
                            </div>
                            <button onClick={() => doSave(students.map(s => s.id))} disabled={loading || loadingStudents}
                                style={{ width: '100%', padding: 14, background: loading ? '#334155' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px #7c3aed40' }}>
                                {loading ? '⏳ Assigning…' : `🚀 Assign to All ${students.length} Students`}
                            </button>
                        </div>
                    )}

                    {/* Individual */}
                    {tab === 'individual' && (
                        <>
                            <div style={{ padding: '0 24px 10px' }}>
                                <div style={{ position: 'relative', marginBottom: 8 }}>
                                    <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}/>
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                                        style={{ width: '100%', padding: '9px 14px 9px 34px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>{selected.length} selected</span>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => setSelected(students.map(s => s.id))} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Select All</button>
                                        <button onClick={() => setSelected([])} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', maxHeight: 300 }}>
                                {filtered.map(s => {
                                    const isSel = selected.includes(s.id);
                                    return (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: isSel ? 'rgba(124,58,237,0.12)' : 'transparent', border: `1px solid ${isSel ? '#7c3aed40' : 'transparent'}`, marginBottom: 3, transition: 'all 0.12s' }}>
                                            <input type="checkbox" checked={isSel} onChange={() => toggle(s.id)} style={{ accentColor: '#7c3aed', width: 15, height: 15, flexShrink: 0 }}/>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isSel ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSel ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{(s.name||'?')[0].toUpperCase()}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.email}</div>
                                            </div>
                                            {isSel && <CheckCircle2 size={15} color="#a78bfa" style={{ flexShrink: 0 }}/>}
                                        </label>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button onClick={() => doSave(selected)} disabled={loading || !selected.length}
                                    style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: loading || !selected.length ? '#334155' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading || !selected.length ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: selected.length ? '0 2px 10px #7c3aed40' : 'none' }}>
                                    <CheckCircle2 size={14}/> {loading ? 'Saving…' : `Confirm${selected.length ? ` (${selected.length})` : ''}`}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Batch */}
                    {tab === 'batch' && (
                        <div style={{ padding: '0 24px 24px' }}>
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 10px' }}>Paste student emails — one per line, or separated by commas.</p>
                            <textarea value={batchText} onChange={e => setBatchText(e.target.value)} rows={10}
                                placeholder={"student1@edu.com\nstudent2@edu.com\n..."}
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 12, color: '#f1f5f9', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}/>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button onClick={handleBatch} disabled={loading || !batchText.trim()}
                                    style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: loading || !batchText.trim() ? '#334155' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading || !batchText.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle2 size={14}/> {loading ? 'Assigning…' : 'Assign Batch'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- AI Generate Panel -----------------------------------------------------------
function AIGeneratePanel({ moduleKey, testId, onGenerated, onCancel }) {
    const def = MODULE_DEFS.find(m => m.key === moduleKey);
    const [topic, setTopic] = React.useState('');
    const [count, setCount] = React.useState(5);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState('');

    const topicPlaceholders = {
        'read-speak': 'e.g. Business communication, Daily routines',
        'listen-repeat': 'e.g. Office scenarios, Travel phrases',
        'topic-speak': 'e.g. Leadership, Work-life balance',
        'grammar-quiz': 'e.g. Present perfect, Modal verbs',
        'vocabulary-test': 'e.g. Business English, HR terminology',
        'situational-response': 'e.g. Customer complaints, Team conflicts',
        'email-writing': 'e.g. Job applications, Meeting requests',
        'interview-qa': 'e.g. Software engineering, Marketing roles',
    };

    async function generate() {
        setErr(''); setLoading(true);
        try {
            const r = await fetch(`${API}/admin/comm-test/tests/${testId}/questions/ai-generate`, {
                method: 'POST', headers: authHeader(),
                body: JSON.stringify({ module_type: moduleKey, topic: topic.trim(), count })
            });
            const d = await r.json();
            if (!r.ok || !d.success) { setErr(d.error || 'Generation failed'); return; }
            onGenerated(d.generated);
        } catch (e) { setErr('Network error: ' + e.message); }
        finally { setLoading(false); }
    }

    const inp = { width: '100%', background: D.inputBg, border: `1px solid ${D.inputBorder}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: D.text, boxSizing: 'border-box' };
    const flabel = { fontSize: 12, fontWeight: 600, color: D.textSec, display: 'block', marginBottom: 4 };

    return (
        <div style={{ background: D.bg, border: `2px solid ${def?.color || D.purple}`, borderRadius: 12, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {def && React.createElement(def.icon, { size: 15, color: def.color })}
                <span style={{ fontWeight: 700, color: def?.color || D.purple, fontSize: 14 }}>AI Generate — {def?.label || moduleKey}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fbbf24', background: '#78350f', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>⚡ Cerebras AI</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 12 }}>
                <div>
                    <label style={flabel}>Topic / Context <span style={{ fontWeight: 400, color: D.textMuted }}>(optional)</span></label>
                    <input value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder={topicPlaceholders[moduleKey] || 'e.g. Professional English'} style={inp}/>
                </div>
                <div>
                    <label style={flabel}>Questions to generate</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setCount(c => Math.max(1, c-1))} style={{ width: 28, height: 34, border: `1px solid ${D.inputBorder}`, borderRadius: 6, background: D.card, color: D.text, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>−</button>
                        <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value)||1)))}
                            style={{ ...inp, width: 46, textAlign: 'center', padding: '8px 4px' }}/>
                        <button onClick={() => setCount(c => Math.min(20, c+1))} style={{ width: 28, height: 34, border: `1px solid ${D.inputBorder}`, borderRadius: 6, background: D.card, color: D.text, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</button>
                    </div>
                </div>
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: '#1e1336', border: '1px solid #7c3aed', borderRadius: 8, padding: '16px 12px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #a855f7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}/>
                        <span style={{ color: '#c4b5fd', fontWeight: 700, fontSize: 13 }}>Generating {count} question{count !== 1 ? 's' : ''} with GPT-OSS-120B...</span>
                    </div>
                    <span style={{ fontSize: 12, color: D.textMuted }}>⏳ This usually takes 15–40 seconds. Please wait — don't close this panel.</span>
                </div>
            ) : (
                <div style={{ fontSize: 12, color: D.textMuted, background: D.card, borderRadius: 6, padding: '6px 10px', marginBottom: 12 }}>
                    💡 AI will generate {count} {def?.label || moduleKey} question{count !== 1 ? 's' : ''} using Cerebras GPT-OSS-120B and save them directly to the question bank.
                </div>
            )}
            {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={12}/>{err}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onCancel} disabled={loading} style={{ padding: '7px 16px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'none', color: D.textSec, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={generate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: loading ? D.card : 'linear-gradient(135deg,#7c3aed,#a855f7)', color: loading ? D.textMuted : '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {loading ? (<>
                        <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                        Generating...
                    </>) : (<>⚡ Generate {count} Questions</>)}
                </button>
            </div>
        </div>
    );
}

// --- Question Form (per-section, admin only) ------------------------------------
function QuestionForm({ moduleKey, testId, onSaved, onCancel }) {
    const [form, setForm] = React.useState({ content: '', answer: '', options: ['','','',''], correctOption: 0, category: '', hint: '' });
    const [saving, setSaving] = React.useState(false);
    const [err, setErr] = React.useState('');
    const def = MODULE_DEFS.find(m => m.key === moduleKey);

    // Per-module config
    const cfg = {
        'read-speak':           { label: 'Sentence to Read Aloud', placeholder: 'The quick brown fox jumps over the lazy dog.', needsAnswer: false },
        'listen-repeat':        { label: 'Sentence to Listen & Repeat', placeholder: 'Please repeat this sentence clearly.', needsAnswer: false },
        'topic-speak':          { label: 'Discussion Topic / Prompt', placeholder: 'Describe a time you resolved a conflict at work.', needsAnswer: false },
        'grammar-quiz':         { label: 'Sentence (use ___ for blank)', placeholder: 'She ___ to the office every morning.', needsAnswer: true, answerLabel: 'Correct Answer', answerPlaceholder: 'goes', showCategory: true, categoryPlaceholder: 'Present Simple' },
        'vocabulary-test':      { label: 'Word or Phrase', placeholder: 'Articulate', needsAnswer: true, answerLabel: 'Meaning / Usage', answerPlaceholder: 'Able to express ideas clearly and effectively', showCategory: true, categoryPlaceholder: 'Adjective' },
        'situational-response': { label: 'Scenario / Situation', placeholder: 'A client is upset about a delayed delivery. How do you handle the call?', needsAnswer: false, hint: 'Candidates will speak their response aloud.' },
        'email-writing':        { label: 'Email Writing Prompt', placeholder: 'Write a professional follow-up email after a job interview.', needsAnswer: false, hint: 'Candidates will type or dictate their email.' },
        'interview-qa':         { label: 'Interview Question', placeholder: 'Tell me about a challenge you faced and how you overcame it.', needsAnswer: false, hint: 'Candidates answer verbally.' },
    }[moduleKey] || { label: 'Content', placeholder: 'Enter content...', needsAnswer: false };

    async function save() {
        if (!form.content.trim()) { setErr('Content is required'); return; }
        if (cfg.needsAnswer && !form.answer.trim()) { setErr(cfg.answerLabel + ' is required'); return; }
        setErr(''); setSaving(true);
        try {
            const payload = {
                module_type: moduleKey,
                content: form.content.trim(),
                answer: cfg.needsAnswer ? form.answer.trim() : undefined,
                category: form.category.trim() || undefined,
                hint: form.hint.trim() || undefined,
            };
            const r = await fetch(`${API}/admin/comm-test/tests/${testId}/questions`, {
                method: 'POST', headers: authHeader(), body: JSON.stringify(payload)
            });
            if (!r.ok) { const t = await r.text(); let m = 'Server error'; try { m = JSON.parse(t).error || m; } catch {} setErr(m); return; }
            const d = await r.json();
            if (d.success) onSaved();
            else setErr(d.error || 'Failed to save');
        } catch (e) { setErr('Network error: ' + e.message); }
        finally { setSaving(false); }
    }

    const inp = { width: '100%', background: D.inputBg, border: `1px solid ${D.inputBorder}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: D.text, boxSizing: 'border-box' };
    const flabel = { fontSize: 12, fontWeight: 600, color: D.textSec, display: 'block', marginBottom: 4 };

    return (
        <div style={{ background: D.bg, border: `2px solid ${def?.color || D.border}`, borderRadius: 12, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {def && React.createElement(def.icon, { size: 15, color: def.color })}
                <span style={{ fontWeight: 700, color: def?.color || D.purple, fontSize: 14 }}>Add {def?.label || moduleKey} Question</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: D.textMuted, background: D.card, padding: '2px 8px', borderRadius: 4 }}>Admin Only</span>
            </div>
            {cfg.hint && <p style={{ margin: '0 0 12px', fontSize: 12, color: D.textMuted, background: D.card, padding: '6px 10px', borderRadius: 6 }}>{cfg.hint}</p>}
            <div style={{ marginBottom: 10 }}>
                <label style={flabel}>{cfg.label} *</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={3}
                    placeholder={cfg.placeholder} style={{ ...inp, resize: 'vertical' }}/>
            </div>
            {cfg.needsAnswer && (
                <div style={{ display: 'grid', gridTemplateColumns: cfg.showCategory ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                        <label style={flabel}>{cfg.answerLabel} *</label>
                        <input value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} placeholder={cfg.answerPlaceholder} style={inp}/>
                    </div>
                    {cfg.showCategory && (
                        <div>
                            <label style={flabel}>Category <span style={{ fontWeight: 400, color: D.textMuted }}>(optional)</span></label>
                            <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder={cfg.categoryPlaceholder || 'e.g. Grammar'} style={inp}/>
                        </div>
                    )}
                </div>
            )}
            {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={12}/>{err}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={{ padding: '7px 16px', border: `1px solid ${D.border}`, borderRadius: 6, background: 'none', color: D.textSec, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ padding: '7px 16px', background: def?.color || D.purple, color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Add Question'}
                </button>
            </div>
        </div>
    );
}
// --- Question Editor -------------------------------------------------------------
function QuestionEditor({ test, onBack, showToast }) {
    const modules = Array.isArray(test.modules) ? test.modules : JSON.parse(test.modules || '[]');
    const [activeModule, setActiveModule] = useState(modules[0] || 'read-speak');
    const [questions, setQuestions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [addMode, setAddMode] = useState(null); // null | 'manual' | 'ai'
    const [loading, setLoading] = useState(false);

    const loadQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/admin/comm-test/tests/${test.id}/questions?module_type=${activeModule}`, { headers: authHeader() });
            const d = await r.json();
            setQuestions(d.questions || []);
        } finally { setLoading(false); }
    }, [test.id, activeModule]);

    useEffect(() => { loadQuestions(); }, [loadQuestions]);

    async function deleteQuestion(qid) {
        if (!window.confirm('Delete this question?')) return;
        await fetch(`${API}/admin/comm-test/tests/${test.id}/questions/${qid}`, { method: 'DELETE', headers: authHeader() });
        loadQuestions(); showToast('Question deleted');
    }

    function closePanel() { setAddMode(null); setShowForm(false); }

    const sectionQTarget = (() => {
        try {
            const sq = test.section_questions
                ? (typeof test.section_questions === 'string' ? JSON.parse(test.section_questions) : test.section_questions)
                : {};
            const perModule = sq[activeModule];
            if (perModule != null) return perModule;
            // fallback: use questions_per_module from old tests
            return test.questions_per_module ? Number(test.questions_per_module) : null;
        } catch { return null; }
    })();

    const def = MODULE_DEFS.find(m => m.key === activeModule);
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={onBack} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: D.textSec }}>← Back</button>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: D.text }}>{test.title}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: D.textMuted }}>Question Bank</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${D.border}` }}>
                {modules.map(mk => {
                    const d = MODULE_DEFS.find(m => m.key === mk);
                    const Icon = d?.icon || BookOpen;
                    const isActive = activeModule === mk;
                    return (
                        <button key={mk} onClick={() => { setActiveModule(mk); closePanel(); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', background: 'none', borderBottom: isActive ? `2px solid ${d?.color||D.purple}` : '2px solid transparent', color: isActive?(d?.color||D.purple):D.textMuted, cursor: 'pointer', fontWeight: isActive?700:400, fontSize: 13 }}>
                            <Icon size={14}/>{d?.label || mk}
                        </button>
                    );
                })}
            </div>
            {/* Add panels */}
            {addMode === 'manual' && (
                <QuestionForm moduleKey={activeModule} testId={test.id}
                    onSaved={() => { closePanel(); loadQuestions(); showToast('Question added!'); }}
                    onCancel={closePanel}/>
            )}
            {addMode === 'ai' && (
                <AIGeneratePanel moduleKey={activeModule} testId={test.id}
                    onGenerated={(n) => { closePanel(); loadQuestions(); showToast(`✅ ${n} AI questions added!`); }}
                    onCancel={closePanel}/>
            )}
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: D.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                    {sectionQTarget != null && (
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
                            background: questions.length >= sectionQTarget ? '#064e3b' : '#451a03',
                            color: questions.length >= sectionQTarget ? '#34d399' : '#fbbf24',
                            border: `1px solid ${questions.length >= sectionQTarget ? '#10b981' : '#d97706'}` }}>
                            {questions.length >= sectionQTarget ? '✓' : '!'} target: {sectionQTarget}
                        </span>
                    )}
                </span>
                {!addMode && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setAddMode('manual')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: def?.color||D.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            <Plus size={14}/> Add Manually
                        </button>
                        <button onClick={() => setAddMode('ai')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            ⚡ AI Generate
                        </button>
                    </div>
                )}
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: D.textMuted }}>Loading...</div>
            ) : questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: D.textMuted, background: D.bg, borderRadius: 10, border: `2px dashed ${D.border}` }}>
                    <BookOpen size={32} style={{ marginBottom: 8, opacity: .4, display: 'block', margin: '0 auto 8px' }}/>
                    <p style={{ margin: 0, fontWeight: 500 }}>No questions yet for this module</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>Use <strong>Add Manually</strong> or <strong>⚡ AI Generate</strong> above</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {questions.map((q, i) => (
                        <div key={q.id} style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ background: D.card, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: D.textSec, flexShrink: 0 }}>#{i+1}</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 14, color: D.text }}>{q.content}</p>
                                {q.answer && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#34d399' }}>Answer: <strong>{q.answer}</strong>{q.category ? ` · ${q.category}` : ''}</p>}
                            </div>
                            <button onClick={() => deleteQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Reports View ----------------------------------------------------------------
function ReportsView({ testId: propTestId, testTitle }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [viewSession, setViewSession] = useState(null);
    const [tests, setTests] = useState([]);
    const [search, setSearch] = useState('');
    const [filterTest, setFilterTest] = useState(propTestId || '');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterScore, setFilterScore] = useState('');
    const [filterSort, setFilterSort] = useState('newest');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [fetchKey, setFetchKey] = useState(0);

    useEffect(() => {
        if (!propTestId) {
            fetch(`${API}/admin/comm-test/tests`, { headers: authHeader() })
                .then(r => r.json()).then(d => setTests(d.tests || [])).catch(() => {});
        }
    }, [propTestId]);

    const fetchReports = React.useCallback(() => {
        setLoading(true); setError(null);
        const params = new URLSearchParams();
        const tid = propTestId || filterTest;
        if (tid) params.set('test_id', tid);
        if (search) params.set('search', search);
        if (filterStatus) params.set('status', filterStatus);
        if (filterScore === 'high')   { params.set('min_score', 80); }
        if (filterScore === 'medium') { params.set('min_score', 60); params.set('max_score', 79); }
        if (filterScore === 'low')    { params.set('max_score', 59); }
        if (filterSort) params.set('sort', filterSort);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        params.set('limit', 100);
        fetch(`${API}/admin/comm-test/reports?${params}`, { headers: authHeader() })
            .then(r => r.json())
            .then(d => { setSessions(d.sessions || []); setTotal(d.total || 0); setLoading(false); })
            .catch(() => { setError('Failed to load reports. Check your connection.'); setLoading(false); });
    }, [propTestId, search, filterTest, filterStatus, filterScore, filterSort, dateFrom, dateTo, fetchKey]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const resetFilters = () => {
        setSearch(''); setFilterTest(propTestId || ''); setFilterStatus('');
        setFilterScore(''); setFilterSort('newest'); setDateFrom(''); setDateTo('');
        setFetchKey(k => k + 1);
    };

    const handleDelete = async (sessionId) => {
        if (!window.confirm('Delete this session report permanently? This cannot be undone.')) return;
        setDeleting(sessionId);
        try {
            await fetch(`${API}/admin/comm-test/reports/${sessionId}`, { method: 'DELETE', headers: authHeader() });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (e) { console.error(e); }
        setDeleting(null);
    };

    const handleDeleteAll = async () => {
        const count = sessions.length;
        if (!window.confirm(`Delete ALL ${count} visible report${count !== 1 ? 's' : ''}? This cannot be undone.`)) return;
        setDeletingAll(true);
        try {
            const ids = sessions.map(s => s.id);
            const res = await fetch(`${API}/admin/comm-test/reports`, {
                method: 'DELETE',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert('Delete failed: ' + (data.error || 'Unknown error'));
            } else {
                setSessions([]);
                setTotal(0);
            }
        } catch (e) {
            console.error(e);
            alert('Delete failed. Check your connection.');
        }
        setDeletingAll(false);
    };

    const downloadCSV = () => {
        const headers = ['Student Name', 'Student Email', 'Test', 'Date', 'Score (%)', 'Status'];
        const rows = sessions.map(s => [
            s.student_name || 'Unknown',
            s.student_email || '',
            s.test_title || '',
            s.started_at ? new Date(s.started_at).toLocaleString() : '',
            s.overall_score != null ? s.overall_score : '',
            s.completed_at ? 'Completed' : 'In Progress',
        ]);
        const csv = [headers, ...rows]
            .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comm_test_reports_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const selStyle = { padding: '8px 10px', background: D.inputBg, border: `1px solid ${D.inputBorder}`, borderRadius: 8, fontSize: 13, color: D.text, cursor: 'pointer' };

    if (viewSession) return <SessionReport sessionId={viewSession} onBack={() => setViewSession(null)}/>;
    return (
        <div>
            {testTitle && <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: D.text }}>Reports &rsaquo; {testTitle}</h3>}

            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: D.textMuted }}/>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
                            style={{ ...selStyle, paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}/>
                    </div>

                    {!propTestId && (
                        <select value={filterTest} onChange={e => setFilterTest(e.target.value)} style={{ ...selStyle, flex: '1 1 180px' }}>
                            <option value="">All Tests</option>
                            {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                    )}

                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selStyle, flex: '0 0 auto' }}>
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">In Progress</option>
                    </select>

                    <select value={filterScore} onChange={e => setFilterScore(e.target.value)} style={{ ...selStyle, flex: '0 0 auto' }}>
                        <option value="">All Scores</option>
                        <option value="high">High (80%+)</option>
                        <option value="medium">Medium (60-79%)</option>
                        <option value="low">Low (under 60%)</option>
                    </select>

                    <select value={filterSort} onChange={e => setFilterSort(e.target.value)} style={{ ...selStyle, flex: '0 0 auto' }}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="high_score">Highest Score</option>
                        <option value="low_score">Lowest Score</option>
                    </select>

                    <button onClick={resetFilters}
                        style={{ padding: '8px 16px', background: D.purple, border: 'none', borderRadius: 8, fontSize: 13, color: 'white', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.02em' }}>
                        Reset
                    </button>

                    {/* Download CSV */}
                    <button onClick={downloadCSV} disabled={sessions.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 8, fontSize: 13, color: '#34d399', cursor: sessions.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: sessions.length === 0 ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                        <Download size={14}/> Download CSV
                    </button>

                    {/* Delete All */}
                    <button onClick={handleDeleteAll} disabled={sessions.length === 0 || deletingAll}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, fontSize: 13, color: '#ef4444', cursor: sessions.length === 0 || deletingAll ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: sessions.length === 0 || deletingAll ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                        <Trash2 size={14}/> {deletingAll ? 'Deleting...' : `Delete All (${sessions.length})`}
                    </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: D.textMuted }}>From:</span>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ ...selStyle, fontSize: 12, colorScheme: 'dark' }}/>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: D.textMuted }}>To:</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ ...selStyle, fontSize: 12, colorScheme: 'dark' }}/>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: D.textMuted }}>
                        {!loading && `Showing ${sessions.length}${total > sessions.length ? ` of ${total}` : ''} result${sessions.length !== 1 ? 's' : ''}`}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: D.textMuted }}>Loading...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#f87171', background: D.card, border: `1px solid ${D.border}`, borderRadius: 10 }}>
                    {error}
                    <button onClick={fetchReports} style={{ display: 'block', margin: '12px auto 0', padding: '6px 16px', background: D.purple, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>Retry</button>
                </div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: D.textMuted, background: D.card, border: `1px solid ${D.border}`, borderRadius: 10 }}>No results found</div>
            ) : (
                <div style={{ overflowX: 'auto', background: D.card, border: `1px solid ${D.border}`, borderRadius: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${D.border}` }}>
                                {['Student','Test','Date','Score','Status','Action'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: D.textSec, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id} style={{ borderBottom: `1px solid ${D.border}` }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 500, color: D.text }}>{s.student_name||'Unknown'}</div>
                                        <div style={{ fontSize: 11, color: D.textMuted }}>{s.student_email}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: D.textSec }}>{s.test_title||'â€”'}</td>
                                    <td style={{ padding: '12px 16px', color: D.textMuted }}>{s.started_at ? new Date(s.started_at).toLocaleString() : 'â€”'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {s.overall_score != null
                                            ? <span style={{ fontWeight: 700, color: s.overall_score >= 80 ? '#34d399' : s.overall_score >= 60 ? '#fbbf24' : '#f87171' }}>{s.overall_score}%</span>
                                            : <span style={{ color: D.textMuted }}>â€”</span>}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                                            background: s.completed_at ? 'rgba(52,211,153,.15)' : 'rgba(251,191,36,.12)',
                                            color: s.completed_at ? '#34d399' : '#fbbf24' }}>
                                            {s.completed_at ? 'Completed' : 'In Progress'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => setViewSession(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: D.purple }}>
                                                <Eye size={12}/> View
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#ef4444', opacity: deleting === s.id ? 0.6 : 1 }}>
                                                <Trash2 size={12}/> {deleting === s.id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
function SessionReport({ sessionId, onBack }) {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedModule, setSelectedModule] = useState(null);
    useEffect(() => {
        fetch(`${API}/admin/comm-test/reports/${sessionId}`, { headers: authHeader() }).then(r => r.json()).then(d => setData(d));
    }, [sessionId]);

    if (!data) return <div style={{ textAlign: 'center', padding: 40, color: D.textMuted }}>Loading report...</div>;
    const { session, overallScore, modules } = data;
    const score = Math.round(overallScore || 0);
    const passing = score >= 60;
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    const totalAttempts = modules.reduce((s, m) => s + (m.attempts || 0), 0);

    const MODULE_META = {
        'read-speak':    { label: 'Read & Speak',    color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
        'listen-repeat': { label: 'Listen & Repeat', color: '#0891b2', bg: 'rgba(8,145,178,0.15)' },
        'topic-speak':   { label: 'Topic Speaking',  color: '#059669', bg: 'rgba(5,150,105,0.15)' },
        'grammar-quiz':  { label: 'Grammar Quiz',    color: '#d97706', bg: 'rgba(217,119,6,0.15)' },
        'gd-round':      { label: 'Group Discussion', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    };

    const modIcon = mod => mod === 'read-speak' ? '\u{1F4D6}' : mod === 'listen-repeat' ? '\u{1F50A}' : mod === 'topic-speak' ? '\u26A1' : mod === 'gd-round' ? '\u{1F4AC}' : '\u{1F9E0}';

    function renderSubmissions(module, submissions) {
        if (module === 'gd-round') {
            const ai = submissions[0]?.ai_scores || {};
            const turns = ai.turns || [];
            const stuTurns = turns.filter(t => t.speaker === 'student');
            const aiTurns = turns.filter(t => t.speaker !== 'student');
            return (
                <div>
                    {/* GD Scores overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                        {[['Language', ai.avgLang, '#a78bfa'], ['Pronunciation', ai.avgPron, '#34d399'], ['Confidence', ai.avgConf, '#fb923c'], ['Participation', ai.participation, '#60a5fa']].map(([l, v, c]) => (
                            <div key={l} style={{ background: D.bg, borderRadius: 10, padding: '12px 10px', border: `1px solid ${D.border}`, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c }}>{Math.round(v || 0)}%</div>
                                <div style={{ fontSize: '0.7rem', color: D.textMuted, fontWeight: 600, marginTop: 3 }}>{l}</div>
                            </div>
                        ))}
                    </div>
                    {/* GD Stats */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: '0.8rem', color: D.textSec }}>
                        <span>Total turns: <strong style={{ color: D.text }}>{turns.length || submissions.length}</strong></span>
                        <span>Student turns: <strong style={{ color: '#10b981' }}>{stuTurns.length}</strong></span>
                        <span>AI turns: <strong style={{ color: '#818cf8' }}>{aiTurns.length}</strong></span>
                    </div>
                    {/* Discussion transcript */}
                    {turns.length > 0 ? turns.map((t, i) => (
                        <div key={i} style={{ background: D.bg, borderRadius: 10, padding: '10px 14px', marginBottom: 8, border: `1px solid ${D.border}`, borderLeft: `3px solid ${t.speaker === 'student' ? '#10b981' : '#6366f1'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: t.speaker === 'student' ? '#10b981' : '#818cf8', fontSize: '0.78rem' }}>{t.speaker_label || t.speaker}</span>
                                {t.language_score != null && <span style={{ fontSize: '0.72rem', color: D.textMuted }}>L:{t.language_score} P:{t.pronunciation_score} C:{t.confidence_score}</span>}
                            </div>
                            <p style={{ margin: 0, color: D.textSec, fontSize: '0.82rem', lineHeight: 1.5 }}>{t.transcript}</p>
                        </div>
                    )) : submissions.map((sub, i) => (
                        <div key={i} style={{ background: D.bg, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${D.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, color: D.textMuted, fontSize: '0.8rem' }}>Turn #{i+1}</span>
                                <span style={{ fontWeight: 800, color: sub.score >= 60 ? '#10b981' : '#ef4444' }}>{Math.round(sub.score)}%</span>
                            </div>
                            {sub.transcribed_text && <p style={{ margin: 0, color: D.textSec, fontSize: '0.85rem' }}>{sub.transcribed_text}</p>}
                            {sub.feedback && <p style={{ margin: '4px 0 0', color: D.purple, fontSize: '0.78rem', fontStyle: 'italic' }}>{sub.feedback}</p>}
                        </div>
                    ))}
                </div>
            );
        }
        if (module === 'topic-speak') {
            return submissions.map((sub, i) => {
                const ai = sub.ai_scores || {};
                return (
                    <div key={i} style={{ background: D.bg, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${D.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, color: D.textMuted, fontSize: '0.8rem' }}>ATTEMPT #{i+1}</span>
                            <span style={{ fontWeight: 800, color: sub.score >= 60 ? '#10b981' : '#ef4444', fontSize: '1rem' }}>{Math.round(sub.score)}%</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                            {[['Relevance', ai.relevance], ['Grammar', ai.grammar], ['Vocabulary', ai.vocabulary], ['Coherence', ai.coherence]].map(([label, val]) => (
                                <div key={label} style={{ background: D.card, borderRadius: 8, padding: '8px 10px', border: `1px solid ${D.border}`, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: D.purple }}>{val ?? '-'}<span style={{ fontSize: '0.65rem', color: D.textMuted }}>/25</span></div>
                                </div>
                            ))}
                        </div>
                        {sub.expected_text && <p style={{ margin: '0 0 6px', color: D.text, fontSize: '0.85rem' }}><strong style={{ color: D.textSec }}>Prompt:</strong> {sub.expected_text}</p>}
                        {sub.transcribed_text && <p style={{ margin: '0 0 6px', color: D.textSec, fontSize: '0.85rem' }}><strong>Response:</strong> {sub.transcribed_text}</p>}
                        {sub.feedback && <p style={{ margin: 0, color: D.purple, fontSize: '0.8rem', fontStyle: 'italic' }}>{sub.feedback}</p>}
                    </div>
                );
            });
        }
        if (module === 'grammar-quiz') {
            return (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: D.bg }}>
                                {['#', 'Sentence / Blank', 'Category', 'Student Answer', 'Correct Answer', 'Score'].map(h => (
                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: D.textMuted, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: `1px solid ${D.border}` }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                                    <td style={{ padding: '8px 10px', color: D.textMuted, fontSize: '0.8rem' }}>{i+1}</td>
                                    <td style={{ padding: '8px 10px', color: D.text, fontSize: '0.82rem' }}>{sub.expected_text || '\u2014'}</td>
                                    <td style={{ padding: '8px 10px', color: D.textSec, fontSize: '0.8rem' }}>{(sub.ai_scores || {}).category || '\u2014'}</td>
                                    <td style={{ padding: '8px 10px', color: sub.score >= 60 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{sub.transcribed_text || '\u2014'}</td>
                                    <td style={{ padding: '8px 10px', color: '#10b981', fontWeight: 600 }}>{(sub.ai_scores || {}).correct_answer || '\u2014'}</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, color: sub.score >= 60 ? '#10b981' : '#ef4444' }}>{Math.round(sub.score)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        // read-speak / listen-repeat
        return submissions.map((sub, i) => {
            const ai = sub.ai_scores || {};
            return (
                <div key={i} style={{ background: D.bg, borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${D.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: D.textMuted, fontSize: '0.8rem' }}>ATTEMPT #{i+1}</span>
                        <span style={{ fontWeight: 800, color: sub.score >= 60 ? '#10b981' : '#ef4444' }}>{Math.round(sub.score)}%</span>
                    </div>
                    {sub.expected_text && <p style={{ margin: '0 0 6px', color: D.text, fontSize: '0.85rem' }}><strong style={{ color: D.textSec }}>Expected:</strong> {sub.expected_text}</p>}
                    {sub.transcribed_text && <p style={{ margin: '0 0 6px', color: D.textSec, fontSize: '0.85rem' }}><strong>Transcribed:</strong> {sub.transcribed_text}</p>}
                    {(ai.pronunciation != null || ai.fluency != null) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {ai.pronunciation != null && <span style={{ background: D.card, borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem', fontWeight: 700, color: D.purple, border: `1px solid ${D.border}` }}>Pronunciation: {ai.pronunciation}/25</span>}
                            {ai.fluency != null && <span style={{ background: D.card, borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', border: `1px solid ${D.border}` }}>Fluency: {ai.fluency}/25</span>}
                        </div>
                    )}
                    {sub.feedback && <p style={{ margin: '8px 0 0', color: D.purple, fontSize: '0.78rem', fontStyle: 'italic' }}>{sub.feedback}</p>}
                </div>
            );
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── HERO ── */}
            <div style={{ background: 'linear-gradient(135deg, #170032 0%, #5b21b6 50%, #7c3aed 100%)', borderRadius: 18, padding: '28px 24px 24px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: 13, color: 'white', fontWeight: 700, marginBottom: 12 }}>\u2190 Back to Reports</button>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{session.student_name || 'Student'}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 4 }}>{session.test_title} \u00b7 {session.student_email}</div>
                    </div>
                    <div style={{ background: passing ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${passing ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}` }}>
                        {passing ? '\u2705 Passed' : '\u274C Failed'}
                    </div>
                </div>

                {/* Score circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ width: 130, height: 130, position: 'relative' }}>
                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3"
                                strokeDasharray={`${score}, 100`} strokeLinecap="round"
                                style={{ transition: 'stroke-dasharray 1.5s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>{score}</div>
                            <div style={{ width: 26, height: 2, background: 'rgba(255,255,255,0.4)', margin: '3px 0' }} />
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, opacity: 0.8 }}>100</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, marginTop: 8 }}>Overall Score \u2014 Grade: {grade}</div>
                </div>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                        { icon: '\u{1F4CA}', label: 'Modules',  value: modules.length,  sub: 'sections tested' },
                        { icon: '\u{1F4DD}', label: 'Attempts', value: totalAttempts,   sub: 'total submissions' },
                        { icon: '\u{1F4C5}', label: 'Date',     value: new Date(session.started_at).toLocaleDateString(), sub: new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                    ].map(c => (
                        <div key={c.label} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>{c.icon} {c.label}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>{c.value}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.72, marginTop: 4 }}>{c.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 30, display: 'flex', padding: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                    {[{ id: 'overview', label: 'Overview' }, { id: 'section', label: 'Section Analysis' }, { id: 'time', label: '⏱ Time Analysis' }].map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedModule(null); }}
                            style={{
                                padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 30,
                                background: activeTab === t.id ? 'linear-gradient(135deg, #5b21b6, #a855f7)' : 'transparent',
                                color: activeTab === t.id ? 'white' : D.textMuted,
                                fontSize: '0.82rem', fontWeight: 800,
                                boxShadow: activeTab === t.id ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                                transition: 'all 0.2s', textTransform: 'uppercase'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
                    {/* Overall Performance card */}
                    <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, padding: 22 }}>
                        <h3 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: 800, color: D.purple, textTransform: 'uppercase' }}>
                            Overall Performance
                        </h3>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ background: D.bg, borderRadius: 14, padding: '20px 16px', flex: 1, border: `1px solid ${D.border}` }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: D.purple, lineHeight: 1 }}>{score}%</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: D.purple, marginTop: 8 }}>Grade: {grade}</div>
                                <div style={{ fontSize: '0.8rem', color: D.textSec, fontWeight: 600, marginTop: 4 }}>{totalAttempts} total attempt{totalAttempts !== 1 ? 's' : ''}</div>
                            </div>
                            <div style={{ width: 100, height: 100, position: 'relative', flexShrink: 0 }}>
                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={D.border} strokeWidth="3.5" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={D.purple} strokeWidth="3.5"
                                        strokeDasharray={`${score}, 100`} strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 1.2s ease' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: D.purple }}>{score}</div>
                                    <div style={{ fontSize: '0.5rem', fontWeight: 700, color: D.textMuted, textTransform: 'uppercase' }}>Score</div>
                                </div>
                            </div>
                        </div>
                        <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 800, color: D.purple }}>Performance Breakdown</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { label: 'Strong (>=80%)',    color: '#10b981', count: modules.filter(m => m.avgScore >= 80).length },
                                { label: 'Good (60-79%)',     color: D.purple,  count: modules.filter(m => m.avgScore >= 60 && m.avgScore < 80).length },
                                { label: 'Needs Work (<60%)', color: '#ef4444', count: modules.filter(m => m.avgScore < 60).length },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 10, background: D.bg }}>
                                    <div style={{ background: item.color, borderRadius: '50%', width: 10, height: 10, flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', color: D.text }}>{item.label}</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: item.color }}>{item.count}/{modules.length}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section Scores card */}
                    <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, padding: 22 }}>
                        <h3 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: 800, color: D.purple, textTransform: 'uppercase' }}>
                            Section Scores
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {modules.map(m => {
                                const meta = MODULE_META[m.module] || { label: m.module, color: D.purple };
                                const barColor = m.avgScore >= 80 ? '#10b981' : m.avgScore >= 60 ? D.purple : '#ef4444';
                                return (
                                    <div key={m.module}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span>{modIcon(m.module)}</span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: D.text }}>{meta.label}</span>
                                            </div>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: barColor }}>{m.avgScore}%</span>
                                        </div>
                                        <div style={{ height: 10, background: D.bg, borderRadius: 5, overflow: 'hidden', border: `1px solid ${D.border}` }}>
                                            <div style={{ height: '100%', width: `${m.avgScore}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})`, borderRadius: 5, transition: 'width 1s ease-out' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                                            <span style={{ fontSize: '0.72rem', color: D.textMuted }}>{m.attempts} attempt{m.attempts !== 1 ? 's' : ''}</span>
                                            {m.allocatedMinutes && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0891b2', background: 'rgba(8,145,178,0.12)', borderRadius: 4, padding: '1px 6px' }}>⏱ {m.allocatedMinutes} min</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                </div>
            )}

            {/* ── TIME ANALYSIS TAB ── */}
            {activeTab === 'time' && (() => {
                const hasTimes = modules.some(m => m.allocatedMinutes);
                const totalAllocMins = modules.reduce((s, m) => s + (m.allocatedMinutes || 0), 0);
                const sessionDurationMs = session.completed_at && session.started_at
                    ? new Date(session.completed_at) - new Date(session.started_at) : null;
                const sessionDurationMins = sessionDurationMs ? Math.round(sessionDurationMs / 60000) : null;
                const utilization = hasTimes && sessionDurationMins
                    ? Math.min(100, Math.round((sessionDurationMins / totalAllocMins) * 100)) : null;
                const fmtMins = m => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Summary stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            {[
                                { label: 'TIME SPENT', value: sessionDurationMins != null ? fmtMins(sessionDurationMins) : 'N/A', color: '#a855f7' },
                                { label: 'ALLOCATED',  value: hasTimes ? fmtMins(totalAllocMins) : 'Not Set', color: '#0891b2' },
                                { label: 'UTILIZATION', value: utilization != null ? `${utilization}%` : 'N/A', color: utilization >= 80 ? '#10b981' : utilization >= 50 ? '#f59e0b' : '#94a3b8' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: D.textMuted, marginTop: 6, letterSpacing: 1 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-section cards */}
                        <div style={{ background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, padding: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0891b2', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    ⏱ Section Breakdown
                                </h3>
                                {sessionDurationMins != null && hasTimes && (
                                    <span style={{ fontSize: '0.68rem', color: D.textMuted, fontStyle: 'italic' }}>
                                        Est. time based on proportional allocation
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                {modules.map(m => {
                                    const meta = MODULE_META[m.module] || { label: m.module, color: D.purple };
                                    const scoreColor = m.avgScore >= 80 ? '#10b981' : m.avgScore >= 60 ? '#f59e0b' : '#ef4444';
                                    const proportion = hasTimes && totalAllocMins > 0
                                        ? (m.allocatedMinutes || 0) / totalAllocMins
                                        : 1 / modules.length;
                                    const estMins = sessionDurationMins != null ? Math.round(sessionDurationMins * proportion) : null;
                                    const passed = m.avgScore >= 60;
                                    return (
                                        <div key={m.module} style={{
                                            background: D.bg, borderRadius: 14,
                                            border: `1px solid ${meta.color}33`,
                                            borderLeft: `4px solid ${meta.color}`,
                                            padding: 18, display: 'flex', flexDirection: 'column', gap: 14
                                        }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ fontSize: '1.3rem' }}>{modIcon(m.module)}</span>
                                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: D.text }}>{meta.label}</span>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                                    background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: passed ? '#10b981' : '#ef4444',
                                                    border: `1px solid ${passed ? '#10b98133' : '#ef444433'}`
                                                }}>{passed ? '✓ PASS' : '✗ FAIL'}</span>
                                            </div>
                                            {/* Time stats */}
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <div style={{ flex: 1, background: D.card, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0891b2' }}>
                                                        {m.allocatedMinutes ? `${m.allocatedMinutes}m` : '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: D.textMuted, marginTop: 3, letterSpacing: 0.8 }}>ALLOCATED</div>
                                                </div>
                                                <div style={{ flex: 1, background: D.card, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7' }}>
                                                        {estMins != null ? `~${estMins}m` : '—'}
                                                    </div>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: D.textMuted, marginTop: 3, letterSpacing: 0.8 }}>EST. SPENT</div>
                                                </div>
                                            </div>
                                            {/* Score bar */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: '0.75rem', color: D.textMuted, fontWeight: 600 }}>Score</span>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: scoreColor }}>{m.avgScore}%</span>
                                                </div>
                                                <div style={{ height: 10, background: D.card, borderRadius: 6, overflow: 'hidden', border: `1px solid ${D.border}` }}>
                                                    <div style={{ height: '100%', width: `${m.avgScore}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`, borderRadius: 6, transition: 'width 1s ease-out' }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.6rem', color: D.textMuted }}>
                                                    <span>0%</span><span>100%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {!hasTimes && (
                                <div style={{ marginTop: 14, padding: '8px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b33', borderRadius: 8, fontSize: '0.75rem', color: '#f59e0b' }}>
                                    ⚠ No per-section time limits configured — set them in the test editor to see allocated times
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── SECTION ANALYSIS TAB ── */}
            {activeTab === 'section' && (
                <div>
                    {/* Module selector buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                        {modules.map(m => {
                            const meta = MODULE_META[m.module] || { label: m.module, color: D.purple, bg: 'rgba(124,58,237,0.15)' };
                            const isActive = selectedModule === m.module;
                            return (
                                <button key={m.module} onClick={() => setSelectedModule(isActive ? null : m.module)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                                        background: isActive ? meta.bg : D.card,
                                        border: `2px solid ${isActive ? meta.color : D.border}`,
                                        borderRadius: 12, cursor: 'pointer', flex: '1 1 140px',
                                        boxShadow: isActive ? `0 4px 12px ${meta.color}33` : 'none',
                                        transition: 'all 0.2s'
                                    }}>
                                    <span style={{ fontSize: '1.4rem' }}>{modIcon(m.module)}</span>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isActive ? meta.color : D.text }}>{meta.label}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: D.textMuted, marginTop: 3 }}>
                                            {m.attempts} attempt{m.attempts !== 1 ? 's' : ''} \u00b7 {m.avgScore}%{m.allocatedMinutes ? ` \u00b7 ${m.allocatedMinutes}m` : ''}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedModule && (() => {
                        const m = modules.find(x => x.module === selectedModule);
                        const meta = MODULE_META[selectedModule] || { label: selectedModule, color: D.purple };
                        if (!m) return null;
                        return (
                            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: meta.color }}>{meta.label} \u2014 Detailed Review</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {m.allocatedMinutes && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', background: 'rgba(8,145,178,0.12)', borderRadius: 6, padding: '3px 8px' }}>\u23f1 {m.allocatedMinutes} min allocated</span>}
                                        <span style={{ fontWeight: 800, color: m.avgScore >= 60 ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>{m.avgScore}%</span>
                                        <button onClick={() => setSelectedModule(null)} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11, color: D.textMuted }}>Clear</button>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 18px' }}>
                                    {renderSubmissions(m.module, m.submissions)}
                                </div>
                            </div>
                        );
                    })()}

                    {!selectedModule && (
                        <div style={{ textAlign: 'center', padding: 40, color: D.textMuted, background: D.card, border: `1px solid ${D.border}`, borderRadius: 14 }}>
                            Select a module above to see the detailed submission breakdown
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Analytics View --------------------------------------------------------------
function AnalyticsView() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        fetch(`${API}/admin/comm-test/stats`, { headers: authHeader() })
        .then(r => r.json()).then(d => { if (d && (d.totalTests !== undefined || d.success)) setStats(d); else setStats({}); })
        .catch(() => setStats({}));
    }, []);
    if (stats === null) return <div style={{ textAlign: 'center', padding: 60, color: D.textMuted }}>Loading analytics...</div>;
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Tests',    value: stats.totalTests||0,      sub: `${stats.activeTests||0} active`,      color: D.purple },
                    { label: 'Total Attempts', value: stats.totalSessions||0,   sub: `${stats.completedSessions||0} done`,  color: '#0891b2' },
                    { label: 'Avg Score',      value: `${stats.avgScore||0}%`,  sub: 'across all sessions',                 color: '#059669' },
                    { label: 'Active Tests',   value: stats.activeTests||0,     sub: `${stats.endedTests||0} ended`,        color: '#d97706' },
                ].map(c => (
                    <div key={c.label} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 12, color: D.textMuted, marginBottom: 6 }}>{c.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 700, color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: 12, color: D.textSec, marginTop: 4 }}>{c.sub}</div>
                    </div>
                ))}
            </div>
            {stats.moduleStats?.length > 0 && (
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: D.text }}>Performance by Module</h4>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stats.moduleStats.map(m => ({ name: m.module.replace(/-/g,' '), score: m.avgScore }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={D.border}/>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: D.textMuted }}/>
                            <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: D.textMuted }}/>
                            <Tooltip contentStyle={{ background: D.card, border: `1px solid ${D.border}`, color: D.text, borderRadius: 8 }}/>
                            <Bar dataKey="score" name="Avg Score %" fill={D.purple} radius={[4,4,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {stats.topStudents?.length > 0 && (
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 20 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: D.text }}>Top Students</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${D.border}` }}>
                                {['Name','Email','Best Score','Sessions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: D.textSec, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topStudents.map((s, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500, color: D.text }}>{s.name||'�'}</td>
                                    <td style={{ padding: '10px 12px', color: D.textSec }}>{s.email}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#34d399' }}>{s.best_score}%</td>
                                    <td style={{ padding: '10px 12px', color: D.textSec }}>{s.sessions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- Test Form -------------------------------------------------------------------
function TestForm({ existing, onSaved, onCancel, showToast }) {
    function initSectionQ(mods, existing) {
        const sq = {};
        const def = (existing && existing.section_questions)
            ? (typeof existing.section_questions === 'string' ? JSON.parse(existing.section_questions) : existing.section_questions)
            : {};
        mods.forEach(k => { sq[k] = def[k] || 5; });
        return sq;
    }

    function initSectionT(mods, existing) {
        const st = {};
        const def = (existing && existing.section_times)
            ? (typeof existing.section_times === 'string' ? JSON.parse(existing.section_times) : existing.section_times)
            : {};
        const total = (existing && existing.duration_minutes) || 60;
        const fallback = Math.max(1, Math.floor(total / (mods.length || 1)));
        mods.forEach(k => { st[k] = def[k] || fallback; });
        return st;
    }

    const initMods = existing
        ? (Array.isArray(existing.modules) ? existing.modules : JSON.parse(existing.modules || '[]'))
        : ['read-speak','listen-repeat','topic-speak','grammar-quiz'];

    const [form, setForm] = React.useState({
        title: existing ? existing.title : '',
        description: existing ? (existing.description || '') : '',
        modules: initMods,
        duration_minutes: existing ? (existing.duration_minutes || 60) : 60,
        section_questions: initSectionQ(initMods, existing),
        section_times: initSectionT(initMods, existing),
        passing_score: existing ? (existing.passing_score || 60) : 60,
        attempt_limit: existing ? (existing.attempt_limit ?? null) : null,
        gd_participants: existing ? (existing.gd_participants || 3) : 3,
        proctoring_mode: existing ? (existing.proctoring_mode || 'off') : 'off',
    });
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState('');

    function toggleModule(key) {
        const def = MODULE_DEFS.find(m => m.key === key);
        const active = form.modules.includes(key);
        let newMods;
        if (active) {
            newMods = form.modules.filter(m => m !== key);
        } else if (def?.exclusive) {
            // GD is exclusive — deselect all others
            newMods = [key];
        } else {
            // Deselect any exclusive module when selecting a regular one
            newMods = [...form.modules.filter(m => !MODULE_DEFS.find(d => d.key === m)?.exclusive), key];
        }
        const newSQ = { ...form.section_questions };
        const newST = { ...form.section_times };
        if (!active) {
            if (!newSQ[key]) newSQ[key] = def?.exclusive ? 1 : 5;
            if (!newST[key]) newST[key] = def?.exclusive ? 30 : 10;
        }
        setForm({ ...form, modules: newMods, section_questions: newSQ, section_times: newST });
    }

    function setSectionQ(key, val) {
        setForm({ ...form, section_questions: { ...form.section_questions, [key]: Math.min(100, Math.max(1, Number(val) || 1)) } });
    }

    function setSectionT(key, val) {
        setForm({ ...form, section_times: { ...form.section_times, [key]: Math.min(180, Math.max(1, Number(val) || 1)) } });
    }

    const totalSectionMins = form.modules.reduce((s, k) => s + (form.section_times[k] || 10), 0);
    const timeExceeded = totalSectionMins > form.duration_minutes;

    async function save() {
        if (!form.title.trim()) { setSaveError('Test title is required'); return; }
        if (!form.modules.length) { setSaveError('Select at least one section'); return; }
        if (timeExceeded) {
            setSaveError(`Total section time (${totalSectionMins} min) exceeds test duration (${form.duration_minutes} min). Reduce section times or increase overall duration.`);
            return;
        }
        setSaveError('');
        setSaving(true);
        try {
            // Only keep section_questions entries for currently active modules
            const activeSQ = {};
            form.modules.forEach(k => { activeSQ[k] = form.section_questions[k] || 5; });
            const payload = {
                ...form,
                section_questions: activeSQ,
                questions_per_module: Math.max(...form.modules.map(k => activeSQ[k] || 5)),
                gd_participants: form.gd_participants || 3,
            };
            const url = existing ? `${API}/admin/comm-test/tests/${existing.id}` : `${API}/admin/comm-test/tests`;
            const r = await fetch(url, { method: existing ? 'PUT' : 'POST', headers: authHeader(), body: JSON.stringify(payload) });
            if (!r.ok) {
                const text = await r.text();
                let msg = `Server error (${r.status})`;
                try { msg = JSON.parse(text).error || msg; } catch {}
                setSaveError(msg); return;
            }
            const d = await r.json();
            if (d.success) onSaved(d.id);
            else setSaveError(d.error || 'Failed to save test');
        } catch (err) {
            setSaveError('Network error â€” is the server running? ' + err.message);
        } finally { setSaving(false); }
    }

    const inp = { width: '100%', background: D.inputBg, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, color: D.text, boxSizing: 'border-box' };
    const lbl = { fontSize: 13, fontWeight: 600, color: D.textSec, display: 'block', marginBottom: 6 };
    const secHead = { fontSize: 12, fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 };
    const divider = { border: 'none', borderTop: `1px solid ${D.border}`, margin: '20px 0' };
    const groups = [...new Set(MODULE_DEFS.map(m => m.group))];
    const btnStep = { width: 26, height: 26, border: `1px solid ${D.border}`, borderRadius: 6, background: D.card, color: D.text, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
    const numInp = (color) => ({ width: 52, textAlign: 'center', background: D.inputBg, border: `1px solid ${D.inputBorder}`, borderRadius: 6, padding: '4px 4px', fontSize: 13, fontWeight: 700, color, boxSizing: 'border-box' });

    const PROCTORING_OPTS = [
        { value: 'off',    label: 'Off',    desc: 'No restrictions',                     color: D.textMuted },
        { value: 'basic',  label: 'Basic',  desc: 'Tab-switch & copy-paste detection',   color: '#0891b2'   },
        { value: 'strict', label: 'Strict', desc: 'Camera + tab-switch + full tracking', color: '#dc2626'   },
    ];

    return (
        <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={onCancel} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: D.textSec }}>&#8592; Back</button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: D.text }}>{existing ? 'Edit Test' : 'Create New Test'}</h2>
            </div>
            <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 28 }}>

                {/* Title */}
                <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Test Title *</label>
                    <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Hiring Communication Assessment" style={inp}/>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                    <label style={lbl}>Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Brief description..." style={{ ...inp, resize: 'vertical' }}/>
                </div>

                <hr style={divider}/>

                {/* Sections */}
                <div style={{ marginBottom: 8 }}>
                    <p style={secHead}>&#9655; Sections <span style={{ fontWeight: 400, color: D.textMuted, textTransform: 'none', letterSpacing: 0 }}>(select at least one)</span></p>
                    {groups.map(grp => (
                        <div key={grp} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{grp}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                                {MODULE_DEFS.filter(m => m.group === grp).map(m => {
                                    const Icon = m.icon;
                                    const active = form.modules.includes(m.key);
                                    return (
                                        <button key={m.key} onClick={() => toggleModule(m.key)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px solid ${active ? m.color : D.border}`, borderRadius: 10, background: active ? `${m.color}18` : D.bg, cursor: 'pointer', textAlign: 'left' }}>
                                            <Icon size={15} color={active ? m.color : D.textMuted}/>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: active ? m.color : D.textSec, flex: 1 }}>{m.label}</span>
                                            {active && <CheckCircle size={13} color={m.color}/>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: D.textMuted }}>{form.modules.length} section{form.modules.length !== 1 ? 's' : ''} selected</p>
                </div>

                <hr style={divider}/>

                {/* Total Duration */}
                <div style={{ marginBottom: form.modules.length > 0 ? 16 : 20 }}>
                    <label style={lbl}>Total Test Duration (minutes)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="number" min="5" max="300" value={form.duration_minutes}
                            onChange={e => setForm({...form, duration_minutes: Math.min(300, Math.max(5, Number(e.target.value)))})}
                            style={{ ...inp, maxWidth: 160 }}/>
                        {form.modules.length > 0 && (
                            <span style={{ fontSize: 12, color: timeExceeded ? '#f87171' : D.textMuted }}>
                                {totalSectionMins} min used &mdash; {timeExceeded
                                    ? `EXCEEDS by ${totalSectionMins - form.duration_minutes} min!`
                                    : `${form.duration_minutes - totalSectionMins} min buffer`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Per-Section: Questions + Time */}
                {form.modules.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <p style={{ ...secHead, margin: 0, flex: 1 }}>&#9655; Per-Section Settings</p>
                            <span style={{ fontSize: 11, color: D.textMuted, width: 130, textAlign: 'center' }}>Questions</span>
                            <span style={{ fontSize: 11, color: timeExceeded ? '#f87171' : D.textMuted, width: 120, textAlign: 'center' }}>Time (min)</span>
                        </div>
                        <div style={{ background: D.bg, border: `1px solid ${timeExceeded ? '#7f1d1d' : D.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                            {form.modules.map((key, idx) => {
                                const def = MODULE_DEFS.find(m => m.key === key);
                                const Icon = def ? def.icon : BookOpen;
                                const color = def ? def.color : D.purple;
                                const sq = form.section_questions[key] || 5;
                                const st = form.section_times[key] || 10;
                                return (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderBottom: idx < form.modules.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                                        <Icon size={14} color={color}/>
                                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def ? def.label : key}</span>
                                        {/* Q controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <button onClick={() => setSectionQ(key, sq - 1)} style={btnStep}>&#8722;</button>
                                            <input type="number" min="1" max="100" value={sq} onChange={e => setSectionQ(key, e.target.value)} style={numInp(color)}/>
                                            <button onClick={() => setSectionQ(key, sq + 1)} style={btnStep}>&#43;</button>
                                        </div>
                                        <div style={{ width: 1, height: 20, background: D.border, flexShrink: 0, margin: '0 4px' }}/>
                                        {/* Time controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <button onClick={() => setSectionT(key, st - 1)} style={btnStep}>&#8722;</button>
                                            <input type="number" min="1" max="180" value={st} onChange={e => setSectionT(key, e.target.value)} style={numInp(timeExceeded ? '#f87171' : '#0891b2')}/>
                                            <button onClick={() => setSectionT(key, st + 1)} style={btnStep}>&#43;</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 4px 0', fontSize: 12 }}>
                            <span style={{ color: D.textMuted }}>
                                Total: <strong style={{ color: D.text }}>{form.modules.reduce((s,k)=>s+(form.section_questions[k]||5),0)}</strong> questions
                            </span>
                            <span style={{ color: timeExceeded ? '#f87171' : D.textMuted }}>
                                <strong style={{ color: timeExceeded ? '#f87171' : D.text }}>{totalSectionMins}</strong> / {form.duration_minutes} min
                                {timeExceeded ? ' \u2014 exceeds duration!' : ''}
                            </span>
                        </div>
                        {timeExceeded && (
                            <div style={{ marginTop: 8, padding: '7px 12px', background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: 8, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={12}/> Section times ({totalSectionMins} min) exceed overall duration ({form.duration_minutes} min). Fix before saving.
                            </div>
                        )}
                    </div>
                )}

                {/* GD-specific config panel */}
                {form.modules.includes('gd-round') && (
                    <div style={{ marginBottom: 20, padding: '16px 18px', background: '#1e1b4b', border: '1px solid #6366f144', borderRadius: 12 }}>
                        <p style={{ ...secHead, margin: '0 0 14px', color: '#818cf8' }}>&#11088; Group Discussion Settings</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ ...lbl, color: '#a5b4fc' }}>Total Participants (incl. student)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button onClick={() => setForm({...form, gd_participants: Math.max(2, form.gd_participants - 1)})} style={btnStep}>&#8722;</button>
                                    <input type="number" min="2" max="8" value={form.gd_participants}
                                        onChange={e => setForm({...form, gd_participants: Math.min(8, Math.max(2, Number(e.target.value)))})}
                                        style={{ ...numInp('#818cf8'), width: 52 }}/>
                                    <button onClick={() => setForm({...form, gd_participants: Math.min(8, form.gd_participants + 1)})} style={btnStep}>&#43;</button>
                                    <span style={{ fontSize: 12, color: '#818cf8' }}>
                                        = 1 student + {form.gd_participants - 1} AI
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label style={{ ...lbl, color: '#a5b4fc' }}>Duration (30–45 min recommended)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button onClick={() => { const v = Math.max(15, (form.section_times['gd-round']||30) - 5); setForm({...form, section_times: {...form.section_times, 'gd-round': v}, duration_minutes: v}); }} style={btnStep}>&#8722;</button>
                                    <input type="number" min="15" max="60" value={form.section_times['gd-round'] || 30}
                                        onChange={e => { const v = Math.min(60, Math.max(15, Number(e.target.value))); setForm({...form, section_times: {...form.section_times, 'gd-round': v}, duration_minutes: v}); }}
                                        style={{ ...numInp('#818cf8'), width: 52 }}/>
                                    <button onClick={() => { const v = Math.min(60, (form.section_times['gd-round']||30) + 5); setForm({...form, section_times: {...form.section_times, 'gd-round': v}, duration_minutes: v}); }} style={btnStep}>&#43;</button>
                                    <span style={{ fontSize: 12, color: '#818cf8' }}>min</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: '#6366f1', background: '#1e1b4b', borderRadius: 8, padding: '6px 10px', border: '1px solid #6366f122' }}>
                            💡 Topic count is fixed at <strong>1</strong> — one discussion topic per session. Questions count in per-section settings is used as the topic.
                        </div>
                    </div>
                )}

                <hr style={divider}/>

                {/* Passing Score + Attempt Limit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                    <div>
                        <label style={lbl}>Passing Score (%)</label>
                        <input type="number" min="0" max="100" value={form.passing_score}
                            onChange={e => setForm({...form, passing_score: Math.min(100, Math.max(0, Number(e.target.value)))})} style={inp}/>
                    </div>
                    <div>
                        <label style={lbl}>Attempt Limit</label>
                        <select value={form.attempt_limit === null ? 'unlimited' : form.attempt_limit}
                            onChange={e => setForm({...form, attempt_limit: e.target.value === 'unlimited' ? null : Number(e.target.value)})}
                            style={{ ...inp, cursor: 'pointer' }}>
                            <option value="unlimited">Unlimited</option>
                            {[1,2,3,5,10,15,20,50,100].map(n => <option key={n} value={n}>{n} attempt{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                </div>

                <hr style={divider}/>

                {/* Proctoring Mode */}
                <div style={{ marginBottom: 8 }}>
                    <p style={secHead}>&#9650; Proctoring Mode</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {PROCTORING_OPTS.map(opt => {
                            const active = form.proctoring_mode === opt.value;
                            return (
                                <button key={opt.value} onClick={() => setForm({...form, proctoring_mode: opt.value})}
                                    style={{ padding: '12px 10px', border: `2px solid ${active ? opt.color : D.border}`, borderRadius: 10, background: active ? `${opt.color}18` : D.bg, cursor: 'pointer', textAlign: 'center' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? opt.color : D.textSec, marginBottom: 4 }}>{opt.label}</div>
                                    <div style={{ fontSize: 11, color: D.textMuted, lineHeight: 1.3 }}>{opt.desc}</div>
                                </button>
                            );
                        })}
                    </div>
                    {form.proctoring_mode !== 'off' && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#1c1f2e', border: `1px solid ${form.proctoring_mode === 'strict' ? '#7f1d1d' : '#164e63'}`, borderRadius: 8, fontSize: 12, color: D.textSec }}>
                            {form.proctoring_mode === 'basic'
                                ? 'Students will be warned if they switch tabs or copy-paste during the test.'
                                : 'Camera access will be required. Tab switching, copy-paste, and suspicious activity are flagged and reported.'}
                        </div>
                    )}
                </div>

                <hr style={divider}/>

                {saveError && (
                    <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={14}/> {saveError}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${D.border}`, borderRadius: 8, background: 'none', color: D.textSec, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={save} disabled={saving || timeExceeded}
                        style={{ padding: '10px 28px', background: timeExceeded ? '#374151' : D.purple, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: (saving || timeExceeded) ? 'not-allowed' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving...' : (existing ? 'Update Test' : 'Create Test & Add Questions')}
                    </button>
                </div>
            </div>
        </div>
    );
}
// --- Main Component --------------------------------------------------------------
export default function AdminCommTest() {
    const [view, setView] = useState('tests');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState(null);
    const [mainTab, setMainTab] = useState('tests');
    const [assignModal, setAssignModal] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/admin/comm-test/tests`, { headers: authHeader() });
            const d = await r.json();
            setTests(d.tests || []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadTests(); }, [loadTests]);

    async function goLive(test) {
        const r = await fetch(`${API}/admin/comm-test/tests/${test.id}/go-live`, { method: 'POST', headers: authHeader() });
        const d = await r.json();
        if (d.success) { showToast('Test is now Live!'); loadTests(); } else showToast(d.error || 'Failed', 'error');
    }

    async function endTest(test) {
        if (!window.confirm(`End "${test.title}"? Students won't be able to take it anymore.`)) return;
        const r = await fetch(`${API}/admin/comm-test/tests/${test.id}/end`, { method: 'POST', headers: authHeader() });
        const d = await r.json();
        if (d.success) { showToast('Test ended'); loadTests(); } else showToast(d.error || 'Failed', 'error');
    }

    async function deleteTest(test) {
        if (!window.confirm(`Delete "${test.title}" and ALL its data? Cannot be undone.`)) return;
        const r = await fetch(`${API}/admin/comm-test/tests/${test.id}`, { method: 'DELETE', headers: authHeader() });
        const d = await r.json();
        if (d.success) { showToast('Test deleted'); loadTests(); } else showToast(d.error || 'Failed', 'error');
    }

    if (view === 'create') return (
        <div style={{ padding: 24 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            <TestForm onSaved={async (newId) => {
                showToast('Test created! Now add questions for each section.', 'success');
                const r = await fetch(`${API}/admin/comm-test/tests`, { headers: authHeader() });
                const d = await r.json();
                const t = (d.tests || []).find(x => x.id === newId);
                if (t) { setSelectedTest(t); setView('questions'); }
                else { loadTests(); setView('tests'); }
            }}
            onCancel={() => setView('tests')} showToast={showToast}/>
        </div>
    );
    if (view === 'edit' && selectedTest) return (
        <div style={{ padding: 24 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            <TestForm existing={{ ...selectedTest, modules: Array.isArray(selectedTest.modules) ? selectedTest.modules : JSON.parse(selectedTest.modules || '[]') }}
                onSaved={() => { showToast('Test updated!'); setView('tests'); loadTests(); }} onCancel={() => setView('tests')} showToast={showToast}/>
        </div>
    );
    if (view === 'questions' && selectedTest) return (
        <div style={{ padding: 24 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            <QuestionEditor test={{ ...selectedTest, modules: Array.isArray(selectedTest.modules) ? selectedTest.modules : JSON.parse(selectedTest.modules || '[]') }}
                onBack={() => { setView('tests'); setSelectedTest(null); }} showToast={showToast}/>
        </div>
    );
    if (view === 'test-reports' && selectedTest) return (
        <div style={{ padding: 24 }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            <button onClick={() => { setView('tests'); setSelectedTest(null); }} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16, color: D.textSec }}>← Back to Tests</button>
            <ReportsView testId={selectedTest.id} testTitle={selectedTest.title}/>
        </div>
    );

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
            {assignModal && <AssignModal test={assignModal} onClose={() => setAssignModal(null)} onDone={() => { showToast('Students assigned!'); loadTests(); }}/>}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', borderRadius: 12, padding: 12, display: 'flex' }}>
                        <Mic size={22} color="#fff"/>
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: D.text }}>Communication Test</h1>
                        <p style={{ margin: 0, fontSize: 13, color: D.textMuted }}>Create tests, manage questions, assign to students</p>
                    </div>
                </div>
                {mainTab === 'tests' && (
                    <button onClick={() => setView('create')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: D.purple, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        <Plus size={16}/> New Test
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${D.border}` }}>
                {[['tests','Tests'],['reports','All Reports'],['analytics','Analytics']].map(([k,l]) => (
                    <button key={k} onClick={() => setMainTab(k)}
                        style={{ padding: '10px 20px', border: 'none', background: 'none', fontWeight: mainTab===k?700:400, borderBottom: mainTab===k?`2px solid ${D.purple}`:'2px solid transparent', color: mainTab===k?D.purple:D.textSec, cursor: 'pointer', fontSize: 14 }}>{l}</button>
                ))}
            </div>

            {mainTab === 'analytics' && <AnalyticsView/>}
            {mainTab === 'reports' && <ReportsView testId={null} testTitle={null}/>}

            {mainTab === 'tests' && (
                loading ? <div style={{ textAlign: 'center', padding: 60, color: D.textMuted }}>Loading tests...</div> :
                tests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: D.card, borderRadius: 16, border: `2px dashed ${D.border}` }}>
                        <Mic size={40} style={{ color: D.border, marginBottom: 12, display: 'block', margin: '0 auto 12px' }}/>
                        <h3 style={{ margin: '0 0 8px', color: D.textSec }}>No tests yet</h3>
                        <p style={{ margin: '0 0 20px', color: D.textMuted, fontSize: 14 }}>Create your first communication test to get started</p>
                        <button onClick={() => setView('create')} style={{ background: D.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                            Create First Test
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {tests.map(test => {
                            const badge = STATUS_BADGE[test.status] || STATUS_BADGE.draft;
                            const mods = Array.isArray(test.modules) ? test.modules : JSON.parse(test.modules || '[]');
                            const atLimit = test.attempt_limit;
                            const activeMods = MODULE_DEFS.filter(m => mods.length === 0 || mods.includes(m.key));
                            let totalQ = (test.questions_per_module || 5) * (mods.length || 4);
                            try {
                                const sq = typeof test.section_questions === 'string' ? JSON.parse(test.section_questions) : test.section_questions;
                                if (sq && typeof sq === 'object') totalQ = mods.reduce((a, k) => a + Number(sq[k] || 0), 0);
                            } catch {}
                            return (
                                <div key={test.id} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                                                <span style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{badge.label}</span>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: D.text }}>{test.title}</h3>
                                            </div>
                                            {test.description && <p style={{ margin: '0 0 10px', fontSize: 13, color: D.textSec }}>{test.description}</p>}
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                                {mods.map(mk => {
                                                    const d = MODULE_DEFS.find(m => m.key === mk);
                                                    const Icon = d?.icon || BookOpen;
                                                    return (
                                                        <span key={mk} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${d?.color||D.purple}18`, color: d?.color||D.purple, border: `1px solid ${d?.color||D.purple}44`, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                                            <Icon size={10}/>{d?.label||mk}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ display: 'flex', gap: 18, fontSize: 12, color: D.textMuted, flexWrap: 'wrap' }}>
                                                <span><Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }}/>{test.duration_minutes} min</span>
                                                <span><BookOpen size={11} style={{ verticalAlign: 'middle', marginRight: 3 }}/>{totalQ} questions</span>
                                                <span><Users size={11} style={{ verticalAlign: 'middle', marginRight: 3 }}/>{Number(test.assigned_count)||0} assigned</span>
                                                <span><BarChart2 size={11} style={{ verticalAlign: 'middle', marginRight: 3 }}/>{Number(test.attempt_count)||0} attempts</span>
                                                <span style={{ color: atLimit ? '#fbbf24' : D.textMuted }}>
                                                    ? {atLimit ? `${atLimit} attempt${atLimit > 1 ? 's' : ''} max` : 'Unlimited attempts'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0, maxWidth: 320 }}>
                                            {test.status === 'draft' && (<>
                                                <button onClick={() => { setSelectedTest(test); setView('edit'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: `1px solid ${D.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: D.textSec }}>
                                                    <Edit3 size={12}/> Edit
                                                </button>
                                                <button onClick={() => { setSelectedTest(test); setView('questions'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: `1px solid ${D.purple}44`, borderRadius: 8, background: `${D.purple}10`, cursor: 'pointer', fontSize: 12, color: D.purple, fontWeight: 600 }}>
                                                    <BookOpen size={12}/> Questions
                                                </button>
                                                <button onClick={() => setAssignModal(test)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: '1px solid #0891b244', borderRadius: 8, background: '#0891b210', cursor: 'pointer', fontSize: 12, color: '#0891b2', fontWeight: 600 }}>
                                                    <Users size={12}/> Assign
                                                </button>
                                                <button onClick={() => goLive(test)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                                    <Play size={12}/> Go Live
                                                </button>
                                            </>)}
                                            {test.status === 'active' && (<>
                                                <button onClick={() => { setSelectedTest(test); setView('questions'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: `1px solid ${D.purple}44`, borderRadius: 8, background: `${D.purple}10`, cursor: 'pointer', fontSize: 12, color: D.purple, fontWeight: 600 }}>
                                                    <BookOpen size={12}/> Questions
                                                </button>
                                                <button onClick={() => setAssignModal(test)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: '1px solid #0891b244', borderRadius: 8, background: '#0891b210', cursor: 'pointer', fontSize: 12, color: '#0891b2', fontWeight: 600 }}>
                                                    <Users size={12}/> Assign
                                                </button>
                                                <button onClick={() => { setSelectedTest(test); setView('test-reports'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: '1px solid #d9770644', borderRadius: 8, background: '#d9770610', cursor: 'pointer', fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                                                    <BarChart2 size={12}/> Reports
                                                </button>
                                                <button onClick={() => endTest(test)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                                    <Square size={12}/> End
                                                </button>
                                            </>)}
                                            {test.status === 'ended' && (
                                                <button onClick={() => { setSelectedTest(test); setView('test-reports'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: '1px solid #d9770644', borderRadius: 8, background: '#d9770610', cursor: 'pointer', fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                                                    <BarChart2 size={12}/> Reports
                                                </button>
                                            )}
                                            <button onClick={() => deleteTest(test)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', border: '1px solid #ef444444', borderRadius: 8, background: '#ef444410', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                                                <Trash2 size={12}/> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
