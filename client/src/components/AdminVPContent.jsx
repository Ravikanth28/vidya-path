import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit2, Save, X, BookOpen, HelpCircle, Layers, BarChart2, RefreshCw, Users, Zap, Activity, ChevronDown, ChevronRight } from 'lucide-react'
import AdminVPDiagnostic from '@/components/vp/AdminVPDiagnostic'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/vp/admin'
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

const TABS = [
    { key: 'overview',  label: 'Overview',        icon: <BarChart2 size={15} /> },
    { key: 'progress',  label: 'Student Progress', icon: <Activity size={15} /> },
    { key: 'ability',   label: 'Ability / Theta',  icon: <Zap size={15} /> },
    { key: 'attempts',  label: 'Attempts',         icon: <Users size={15} /> },
    { key: 'diagnostic',label: 'Diagnostic Studio', icon: <HelpCircle size={15} /> },
    { key: 'lessons',   label: 'Lessons',          icon: <BookOpen size={15} /> },
    { key: 'quiz',      label: 'Quiz Items',       icon: <HelpCircle size={15} /> },
    { key: 'concepts',  label: 'Concepts',         icon: <Layers size={15} /> }
]

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General']
const KINDS    = ['mcq', 'short', 'tf']

function tabStyle(active) {
    return {
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
        border: active ? '1.5px solid #60a5fa' : '1.5px solid rgba(148,163,184,0.2)',
        background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
        color: active ? '#60a5fa' : 'rgba(148,163,184,0.8)',
        transition: 'all 0.15s'
    }
}

function cardStyle() {
    return {
        background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 10, padding: '16px 20px', marginBottom: 12
    }
}

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview() {
    const [stats, setStats]     = useState(null)
    const [err, setErr]         = useState(null)
    const [seeding, setSeeding] = useState(false)
    const [seedMsg, setSeedMsg] = useState(null)
    const load = useCallback(() => {
        setErr(null)
        axios.get(`${API}/stats`, { headers: authH() })
            .then(r => setStats(r.data))
            .catch(e => setErr(e.response?.data?.error || e.message))
    }, [])
    useEffect(load, [load])

    const runSeed = async () => {
        setSeeding(true); setSeedMsg(null)
        try {
            const { data } = await axios.post(`${API}/seed`, {}, { headers: authH() })
            setSeedMsg(`Seed complete — ${data.concepts} concepts, ${data.lessons} lessons, ${data.quiz_items} quiz items in DB.`)
            load()
        } catch (e) {
            setSeedMsg('Seed error: ' + (e.response?.data?.error || e.message))
        } finally {
            setSeeding(false)
        }
    }

    if (err)   return <div style={{ color: '#f87171', padding: 24 }}>Error: {err}</div>
    if (!stats) return <div style={{ color: '#94a3b8', padding: 24 }}>Loading…</div>
    const boxes = [
        { label: 'Lessons',     value: stats.lessons },
        { label: 'Quiz Items',  value: stats.quiz_items },
        { label: 'Concepts',    value: stats.concepts },
        { label: 'Students',    value: stats.students },
        { label: 'Completions', value: stats.completions }
    ]
    return (
        <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                {boxes.map(b => (
                    <div key={b.label} style={{ ...cardStyle(), flex: '1 1 140px', textAlign: 'center', minWidth: 120 }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#60a5fa' }}>{b.value ?? '—'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>{b.label}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
                <button onClick={runSeed} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, color: '#34d399', cursor: seeding ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: seeding ? 0.6 : 1 }}>
                    <Zap size={14} /> {seeding ? 'Seeding…' : 'Seed Default Data'}
                </button>
            </div>
            {seedMsg && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: seedMsg.startsWith('Seed error') ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', color: seedMsg.startsWith('Seed error') ? '#f87171' : '#34d399', fontSize: '0.85rem', border: `1px solid ${seedMsg.startsWith('Seed error') ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}` }}>{seedMsg}</div>}
        </div>
    )
}

// ── Lessons ───────────────────────────────────────────────────────────────────
function LessonsManager({ concepts }) {
    const [lessons, setLessons] = useState([])
    const [form, setForm] = useState(null)       // null = hidden, {} = new, {id,...} = edit
    const [saving, setSaving] = useState(false)
    const [filterSubj, setFilterSubj] = useState('')

    const load = useCallback(() => {
        axios.get(`${API}/lessons`, { headers: authH() }).then(r => setLessons(r.data.lessons || [])).catch(() => {})
    }, [])
    useEffect(load, [load])

    const save = async () => {
        setSaving(true)
        try {
            if (form.id) {
                await axios.put(`${API}/lessons/${form.id}`, form, { headers: authH() })
            } else {
                await axios.post(`${API}/lessons`, form, { headers: authH() })
            }
            setForm(null)
            load()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally { setSaving(false) }
    }

    const del = async (id) => {
        if (!confirm('Delete this lesson and its quiz items?')) return
        await axios.delete(`${API}/lessons/${id}`, { headers: authH() })
        load()
    }

    const shown = filterSubj ? lessons.filter(l => l.subject === filterSubj) : lessons

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterSubj} onChange={e => setFilterSubj(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: '0.85rem' }}>
                    <option value=''>All subjects</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => setForm({ subject: '', title: '', body_en: '', concept_id: '', ordering: 0, grade: 8 })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Plus size={14} /> New Lesson
                </button>
            </div>

            {form && (
                <div style={{ ...cardStyle(), border: '1px solid rgba(96,165,250,0.3)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>{form.id ? 'Edit Lesson' : 'New Lesson'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={labelSt}>Title *</label>
                            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputSt} placeholder='Lesson title' />
                        </div>
                        <div>
                            <label style={labelSt}>Subject *</label>
                            <select value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputSt}>
                                <option value=''>Select…</option>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Concept</label>
                            <select value={form.concept_id || ''} onChange={e => setForm(f => ({ ...f, concept_id: e.target.value }))} style={inputSt}>
                                <option value=''>None</option>
                                {concepts.map(c => <option key={c.id} value={c.id}>{c.subject} — {c.title}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelSt}>Order</label>
                                <input type='number' value={form.ordering ?? 0} onChange={e => setForm(f => ({ ...f, ordering: Number(e.target.value) }))} style={inputSt} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelSt}>Grade</label>
                                <input type='number' value={form.grade ?? 8} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))} style={inputSt} />
                            </div>
                        </div>
                    </div>
                    <label style={labelSt}>Content (English)</label>
                    <textarea rows={5} value={form.body_en || ''} onChange={e => setForm(f => ({ ...f, body_en: e.target.value }))} style={{ ...inputSt, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} placeholder='Lesson content…' />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={save} disabled={saving} style={btnPrimary}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setForm(null)} style={btnSecondary}><X size={14} /> Cancel</button>
                    </div>
                </div>
            )}

            {shown.map(l => (
                <div key={l.id} style={cardStyle()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{l.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                                {l.subject} {l.concept_title ? `· ${l.concept_title}` : ''} · Grade {l.grade} · Order {l.ordering}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setForm({ ...l, body_en: '' })} style={iconBtn} title='Edit'><Edit2 size={14} /></button>
                            <button onClick={() => del(l.id)} style={{ ...iconBtn, color: '#f87171' }} title='Delete'><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
            ))}
            {!shown.length && <div style={{ color: '#64748b', padding: '20px 0' }}>No lessons found.</div>}
        </div>
    )
}

// ── Quiz Items ─────────────────────────────────────────────────────────────────
function QuizManager({ concepts, lessons }) {
    const [items, setItems] = useState([])
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [filterLesson, setFilterLesson] = useState('')

    const load = useCallback(() => {
        const url = filterLesson ? `${API}/quiz-items?lesson_id=${filterLesson}` : `${API}/quiz-items`
        axios.get(url, { headers: authH() }).then(r => setItems(r.data.items || [])).catch(() => {})
    }, [filterLesson])
    useEffect(load, [load])

    const save = async () => {
        setSaving(true)
        try {
            if (form.id) {
                await axios.put(`${API}/quiz-items/${form.id}`, form, { headers: authH() })
            } else {
                await axios.post(`${API}/quiz-items`, form, { headers: authH() })
            }
            setForm(null)
            load()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally { setSaving(false) }
    }

    const del = async (id) => {
        if (!confirm('Delete this quiz item?')) return
        await axios.delete(`${API}/quiz-items/${id}`, { headers: authH() })
        load()
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterLesson} onChange={e => setFilterLesson(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: '0.85rem', maxWidth: 260 }}>
                    <option value=''>All lessons</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.subject} — {l.title}</option>)}
                </select>
                <button onClick={() => setForm({ subject: '', lesson_id: filterLesson || '', concept_id: '', kind: 'mcq', prompt_en: '', options: ['', '', '', ''], answer_key: '', is_diagnostic: false })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Plus size={14} /> New Quiz Item
                </button>
            </div>

            {form && (
                <div style={{ ...cardStyle(), border: '1px solid rgba(96,165,250,0.3)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>{form.id ? 'Edit Quiz Item' : 'New Quiz Item'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={labelSt}>Subject *</label>
                            <select value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputSt}>
                                <option value=''>Select…</option>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Type</label>
                            <select value={form.kind || 'mcq'} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} style={inputSt}>
                                {KINDS.map(k => <option key={k}>{k}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Lesson</label>
                            <select value={form.lesson_id || ''} onChange={e => setForm(f => ({ ...f, lesson_id: e.target.value }))} style={inputSt}>
                                <option value=''>None</option>
                                {lessons.map(l => <option key={l.id} value={l.id}>{l.subject} — {l.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Concept</label>
                            <select value={form.concept_id || ''} onChange={e => setForm(f => ({ ...f, concept_id: e.target.value }))} style={inputSt}>
                                <option value=''>None</option>
                                {concepts.map(c => <option key={c.id} value={c.id}>{c.subject} — {c.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <label style={labelSt}>Question Prompt *</label>
                    <textarea rows={3} value={form.prompt_en || ''} onChange={e => setForm(f => ({ ...f, prompt_en: e.target.value }))} style={{ ...inputSt, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }} placeholder='Question text…' />

                    {(form.kind === 'mcq' || form.kind === 'tf') && (
                        <>
                            <label style={labelSt}>Options (one per line)</label>
                            <textarea rows={4} value={Array.isArray(form.options) ? form.options.join('\n') : (form.options || '')}
                                onChange={e => setForm(f => ({ ...f, options: e.target.value.split('\n') }))}
                                style={{ ...inputSt, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
                                placeholder={'Option A\nOption B\nOption C\nOption D'} />
                        </>
                    )}

                    <label style={labelSt}>Answer Key</label>
                    <input value={form.answer_key || ''} onChange={e => setForm(f => ({ ...f, answer_key: e.target.value }))} style={{ ...inputSt, marginBottom: 10 }} placeholder='e.g. A, or index 0, or correct text' />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <input type='checkbox' id='diag' checked={!!form.is_diagnostic} onChange={e => setForm(f => ({ ...f, is_diagnostic: e.target.checked }))} />
                        <label htmlFor='diag' style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Diagnostic item</label>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={save} disabled={saving} style={btnPrimary}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setForm(null)} style={btnSecondary}><X size={14} /> Cancel</button>
                    </div>
                </div>
            )}

            {items.map(q => {
                const prompt = (() => { try { const o = typeof q.prompt_i18n === 'string' ? JSON.parse(q.prompt_i18n) : q.prompt_i18n; return o?.en || '' } catch { return '' } })()
                return (
                    <div key={q.id} style={cardStyle()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: 10 }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{prompt.slice(0, 120) || '(no prompt)'}{prompt.length > 120 ? '…' : ''}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                    {q.subject} · {q.kind} {q.lesson_title ? `· ${q.lesson_title}` : ''} {q.is_diagnostic ? '· 🔬 diagnostic' : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => setForm({ ...q, prompt_en: prompt, options: (() => { try { const o = typeof q.options_i18n === 'string' ? JSON.parse(q.options_i18n) : q.options_i18n; return Array.isArray(o?.en) ? o.en : [] } catch { return [] } })() })} style={iconBtn} title='Edit'><Edit2 size={14} /></button>
                                <button onClick={() => del(q.id)} style={{ ...iconBtn, color: '#f87171' }} title='Delete'><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                )
            })}
            {!items.length && <div style={{ color: '#64748b', padding: '20px 0' }}>No quiz items found.</div>}
        </div>
    )
}

// ── Concepts ───────────────────────────────────────────────────────────────────
function ConceptsManager({ concepts, reload }) {
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)

    const save = async () => {
        setSaving(true)
        try {
            if (form.id) {
                await axios.put(`${API}/concepts/${form.id}`, form, { headers: authH() })
            } else {
                await axios.post(`${API}/concepts`, form, { headers: authH() })
            }
            setForm(null)
            reload()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally { setSaving(false) }
    }

    const del = async (id) => {
        if (!confirm('Delete this concept?')) return
        await axios.delete(`${API}/concepts/${id}`, { headers: authH() })
        reload()
    }

    return (
        <div>
            <button onClick={() => setForm({ subject: '', title: '', grade_min: 8, grade_max: 14 })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
                <Plus size={14} /> New Concept
            </button>

            {form && (
                <div style={{ ...cardStyle(), border: '1px solid rgba(96,165,250,0.3)', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>{form.id ? 'Edit Concept' : 'New Concept'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={labelSt}>Title *</label>
                            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputSt} placeholder='Concept name' />
                        </div>
                        <div>
                            <label style={labelSt}>Subject *</label>
                            <select value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputSt}>
                                <option value=''>Select…</option>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Grade Min</label>
                            <input type='number' value={form.grade_min ?? 8} onChange={e => setForm(f => ({ ...f, grade_min: Number(e.target.value) }))} style={inputSt} />
                        </div>
                        <div>
                            <label style={labelSt}>Grade Max</label>
                            <input type='number' value={form.grade_max ?? 14} onChange={e => setForm(f => ({ ...f, grade_max: Number(e.target.value) }))} style={inputSt} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={save} disabled={saving} style={btnPrimary}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setForm(null)} style={btnSecondary}><X size={14} /> Cancel</button>
                    </div>
                </div>
            )}

            {concepts.map(c => (
                <div key={c.id} style={cardStyle()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{c.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{c.subject} · Grade {c.grade_min}–{c.grade_max}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setForm({ ...c })} style={iconBtn}><Edit2 size={14} /></button>
                            <button onClick={() => del(c.id)} style={{ ...iconBtn, color: '#f87171' }}><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
            ))}
            {!concepts.length && <div style={{ color: '#64748b', padding: '20px 0' }}>No concepts yet.</div>}
        </div>
    )
}

// ── Student Progress view ─────────────────────────────────────────────────────
function StudentProgress({ lessons }) {
    const [rows, setRows]       = useState([])
    const [loading, setLoading] = useState(false)
    const [subject, setSubject] = useState('')
    const [status,  setStatus]  = useState('')
    const [expanded, setExpanded] = useState({})

    const SUBJECTS = ['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General']
    const STATUSES = ['not_started', 'in_progress', 'completed']

    const load = useCallback(() => {
        setLoading(true)
        const p = new URLSearchParams()
        if (subject) p.set('subject', subject)
        if (status)  p.set('status',  status)
        axios.get(`${API}/student-progress?${p}`, { headers: authH() })
            .then(r => setRows(r.data.rows || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [subject, status])

    useEffect(load, [load])

    // Group by student
    const byStudent = {}
    for (const r of rows) {
        const key = r.student_id
        if (!byStudent[key]) byStudent[key] = { name: r.student_name || r.student_id, email: r.student_email, lessons: [] }
        byStudent[key].lessons.push(r)
    }

    const statusColor = { completed: '#4ade80', in_progress: '#fbbf24', not_started: '#64748b' }

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={selSt}>
                    <option value=''>All subjects</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)} style={selSt}>
                    <option value=''>All statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={load} style={refreshBtn}><RefreshCw size={13} /> Refresh</button>
            </div>
            {loading && <div style={{ color: '#94a3b8' }}>Loading…</div>}
            {!loading && !Object.keys(byStudent).length && <div style={{ color: '#64748b', padding: '20px 0' }}>No progress data found.</div>}
            {Object.entries(byStudent).map(([sid, s]) => {
                const done = s.lessons.filter(l => l.status === 'completed').length
                const open = !!expanded[sid]
                return (
                    <div key={sid} style={cardStyle()}>
                        <div onClick={() => setExpanded(e => ({ ...e, [sid]: !e[sid] }))}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{s.email} · {done}/{s.lessons.length} lessons completed</div>
                            </div>
                            {open ? <ChevronDown size={16} color='#94a3b8' /> : <ChevronRight size={16} color='#94a3b8' />}
                        </div>
                        {open && (
                            <div style={{ marginTop: 10, borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 10 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ color: '#64748b' }}>
                                            <th style={thSt}>Lesson</th><th style={thSt}>Subject</th><th style={thSt}>Status</th><th style={thSt}>Mastery %</th><th style={thSt}>Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {s.lessons.map((l, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                                                <td style={tdSt}>{l.lesson_title}</td>
                                                <td style={tdSt}>{l.subject}</td>
                                                <td style={tdSt}><span style={{ color: statusColor[l.status] || '#94a3b8', fontWeight: 600 }}>{l.status}</span></td>
                                                <td style={tdSt}>{Number(l.mastery_pct).toFixed(1)}%</td>
                                                <td style={tdSt}>{l.updated_at ? new Date(l.updated_at).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Student Ability / Theta view ───────────────────────────────────────────────
function StudentAbility() {
    const [rows, setRows]       = useState([])
    const [loading, setLoading] = useState(false)
    const [subject, setSubject] = useState('')
    const SUBJECTS = ['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General']

    const load = useCallback(() => {
        setLoading(true)
        const p = new URLSearchParams()
        if (subject) p.set('subject', subject)
        axios.get(`${API}/student-ability?${p}`, { headers: authH() })
            .then(r => setRows(r.data.rows || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [subject])

    useEffect(load, [load])

    const thetaBar = (theta) => {
        // theta typically in [-3, 3]; normalise to 0-100
        const pct = Math.round(((Number(theta) + 3) / 6) * 100)
        const clamped = Math.max(0, Math.min(100, pct))
        const color = clamped >= 60 ? '#4ade80' : clamped >= 40 ? '#fbbf24' : '#f87171'
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 6, background: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${clamped}%`, height: '100%', background: color, borderRadius: 3 }} />
                </div>
                <span style={{ color, fontSize: '0.8rem', fontWeight: 600 }}>{Number(theta).toFixed(2)}</span>
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={selSt}>
                    <option value=''>All subjects</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={load} style={refreshBtn}><RefreshCw size={13} /> Refresh</button>
            </div>
            {loading && <div style={{ color: '#94a3b8' }}>Loading…</div>}
            {!loading && !rows.length && <div style={{ color: '#64748b', padding: '20px 0' }}>No ability data found.</div>}
            {!!rows.length && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                                <th style={thSt}>Student</th><th style={thSt}>Email</th><th style={thSt}>Subject</th><th style={thSt}>Theta (Ability)</th><th style={thSt}>Responses</th><th style={thSt}>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                                    <td style={tdSt}>{r.student_name || r.student_id}</td>
                                    <td style={tdSt}>{r.student_email || '—'}</td>
                                    <td style={tdSt}>{r.subject}</td>
                                    <td style={tdSt}>{thetaBar(r.theta)}</td>
                                    <td style={tdSt}>{r.n_responses}</td>
                                    <td style={tdSt}>{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ── Attempts view ──────────────────────────────────────────────────────────────
function AttemptsView({ lessons }) {
    const [rows, setRows]       = useState([])
    const [loading, setLoading] = useState(false)
    const [subject, setSubject] = useState('')
    const [lessonId, setLessonId] = useState('')
    const SUBJECTS = ['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General']

    const load = useCallback(() => {
        setLoading(true)
        const p = new URLSearchParams()
        if (subject)  p.set('subject',   subject)
        if (lessonId) p.set('lesson_id', lessonId)
        axios.get(`${API}/attempts?${p}`, { headers: authH() })
            .then(r => setRows(r.data.rows || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [subject, lessonId])

    useEffect(load, [load])

    const total   = rows.length
    const correct = rows.filter(r => r.correct).length
    const pct     = total ? ((correct / total) * 100).toFixed(1) : null

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={selSt}>
                    <option value=''>All subjects</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={lessonId} onChange={e => setLessonId(e.target.value)} style={{ ...selSt, maxWidth: 240 }}>
                    <option value=''>All lessons</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.subject} — {l.title}</option>)}
                </select>
                <button onClick={load} style={refreshBtn}><RefreshCw size={13} /> Refresh</button>
            </div>

            {pct !== null && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Attempts', value: total },
                        { label: 'Correct',        value: correct, color: '#4ade80' },
                        { label: 'Incorrect',      value: total - correct, color: '#f87171' },
                        { label: 'Accuracy',       value: pct + '%', color: '#60a5fa' }
                    ].map(b => (
                        <div key={b.label} style={{ ...cardStyle(), flex: '1 1 120px', textAlign: 'center', padding: '12px 16px' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: b.color || '#e2e8f0' }}>{b.value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{b.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {loading && <div style={{ color: '#94a3b8' }}>Loading…</div>}
            {!loading && !rows.length && <div style={{ color: '#64748b', padding: '20px 0' }}>No attempts found.</div>}
            {!!rows.length && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                                <th style={thSt}>Student</th><th style={thSt}>Lesson</th><th style={thSt}>Subject</th><th style={thSt}>Result</th><th style={thSt}>Score</th><th style={thSt}>Time (s)</th><th style={thSt}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                                    <td style={tdSt}>{r.student_name || r.student_id}</td>
                                    <td style={tdSt}>{r.lesson_title || '—'}</td>
                                    <td style={tdSt}>{r.subject}</td>
                                    <td style={tdSt}><span style={{ color: r.correct ? '#4ade80' : '#f87171', fontWeight: 600 }}>{r.correct ? '✓ Correct' : '✗ Wrong'}</span></td>
                                    <td style={tdSt}>{Number(r.score).toFixed(2)}</td>
                                    <td style={tdSt}>{r.time_taken_ms ? (r.time_taken_ms / 1000).toFixed(1) : '—'}</td>
                                    <td style={tdSt}>{r.attempted_at ? new Date(r.attempted_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const selSt     = { background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: '0.85rem' }
const refreshBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }
const thSt = { textAlign: 'left', padding: '8px 10px', fontWeight: 500 }
const tdSt = { padding: '8px 10px', color: '#cbd5e1' }
const labelSt = { display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4, fontWeight: 500 }
const inputSt  = { display: 'block', width: '100%', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', borderRadius: 7, padding: '8px 12px', fontSize: '0.875rem', boxSizing: 'border-box' }
const btnPrimary   = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.5)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }
const iconBtn      = { display: 'flex', alignItems: 'center', padding: 6, background: 'transparent', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }

// ── Root ───────────────────────────────────────────────────────────────────────
export default function AdminVPContent() {
    const [tab, setTab] = useState('overview')
    const [concepts, setConcepts] = useState([])
    const [lessons,  setLessons]  = useState([])

    const loadConcepts = useCallback(() => {
        axios.get(`${API}/concepts`, { headers: authH() }).then(r => setConcepts(r.data.concepts || [])).catch(() => {})
    }, [])
    const loadLessons = useCallback(() => {
        axios.get(`${API}/lessons`, { headers: authH() }).then(r => setLessons(r.data.lessons || [])).catch(() => {})
    }, [])

    useEffect(() => { loadConcepts(); loadLessons() }, [loadConcepts, loadLessons])

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'overview'  && <Overview />}
            {tab === 'progress'  && <StudentProgress lessons={lessons} />}
            {tab === 'ability'   && <StudentAbility />}
            {tab === 'attempts'  && <AttemptsView lessons={lessons} />}
            {tab === 'diagnostic' && <AdminVPDiagnostic />}
            {tab === 'lessons'   && <LessonsManager concepts={concepts} />}
            {tab === 'quiz'      && <QuizManager concepts={concepts} lessons={lessons} />}
            {tab === 'concepts'  && <ConceptsManager concepts={concepts} reload={() => { loadConcepts(); loadLessons() }} />}
        </div>
    )
}
