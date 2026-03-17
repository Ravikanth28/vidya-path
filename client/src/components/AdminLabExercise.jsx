import React, { useState, useEffect, useCallback } from 'react'
import {
    FlaskConical, Plus, Search, Filter, Edit3, Trash2, Eye, Users, Play, Square,
    CheckCircle, XCircle, Clock, Code, Brain, Database, Cpu, BarChart2,
    ChevronDown, ChevronRight, X, Save, RefreshCw, Download, AlertTriangle,
    FileText, Layers, Settings, Tag, Award, Zap, Globe, BookOpen, Shield
} from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' })

// ─── Constants ────────────────────────────────────────────────────────────────
const LAB_TYPES = [
    { value: 'programming', label: 'Programming Lab', icon: '💻', color: '#3b82f6', desc: 'C, Python, Java, C++' },
    { value: 'ml', label: 'ML Lab', icon: '🤖', color: '#8b5cf6', desc: 'Machine Learning' },
    { value: 'dl', label: 'DL Lab', icon: '🧠', color: '#ec4899', desc: 'Deep Learning' },
    { value: 'sql', label: 'SQL Lab', icon: '🗄️', color: '#06b6d4', desc: 'Database Queries' },
    { value: 'web', label: 'Web Lab', icon: '🌐', color: '#10b981', desc: 'HTML, CSS, JS' },
    { value: 'ds', label: 'Data Structures', icon: '📊', color: '#f59e0b', desc: 'Arrays, Trees, Graphs' },
]

const LANGUAGES = [
    { value: 'none', label: 'Language Free (Any)' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'sql', label: 'SQL' },
    { value: 'r', label: 'R' },
    { value: 'shell', label: 'Shell / Bash' },
]

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert']

const STATUS_META = {
    draft: { label: 'Draft', bg: '#1e293b', color: '#94a3b8', border: '#334155' },
    active: { label: 'Live', bg: '#052e16', color: '#34d399', border: '#166534' },
    ended: { label: 'Ended', bg: '#3b0d0d', color: '#f87171', border: '#7f1d1d' },
}

const DIFFICULTY_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444', expert: '#8b5cf6' }

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return (
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 10000, padding: '14px 20px',
            background: type === 'error' ? '#3b0d0d' : '#052e16',
            color: type === 'error' ? '#fca5a5' : '#86efac',
            border: `1px solid ${type === 'error' ? '#7f1d1d' : '#166534'}`,
            borderRadius: 12, minWidth: 300, maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', fontSize: 14, fontWeight: 500
        }}>
            {msg}
        </div>
    )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminLabExercise() {
    const [tab, setTab] = useState('questions')
    const [exercises, setExercises] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [modal, setModal] = useState(null) // 'create' | 'edit' | 'view' | 'assign' | 'report'
    const [selected, setSelected] = useState(null)
    const [filters, setFilters] = useState({ search: '', lab_type: '', status: '' })
    const [subFilters, setSubFilters] = useState({ search: '', status: '', language: '', exercise_id: '' })

    const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), [])

    const loadExercises = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (filters.search) p.set('search', filters.search)
            if (filters.lab_type) p.set('lab_type', filters.lab_type)
            if (filters.status) p.set('status', filters.status)
            const r = await fetch(`${API}/admin/lab-exercises?${p}`, { headers: H() })
            const d = await r.json()
            setExercises(d.exercises || [])
        } catch { showToast('Failed to load exercises', 'error') }
        finally { setLoading(false) }
    }, [filters, showToast])

    const loadSubmissions = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (subFilters.search) p.set('search', subFilters.search)
            if (subFilters.status) p.set('status', subFilters.status)
            if (subFilters.language) p.set('language', subFilters.language)
            if (subFilters.exercise_id) p.set('exercise_id', subFilters.exercise_id)
            const r = await fetch(`${API}/admin/lab-submissions?${p}`, { headers: H() })
            const d = await r.json()
            setSubmissions(d.submissions || [])
        } catch { showToast('Failed to load submissions', 'error') }
        finally { setLoading(false) }
    }, [subFilters, showToast])

    const loadStats = useCallback(async () => {
        try {
            const r = await fetch(`${API}/admin/lab-stats`, { headers: H() })
            const d = await r.json()
            setStats(d)
        } catch { }
    }, [])

    useEffect(() => { if (tab === 'questions') loadExercises() }, [tab, loadExercises])
    useEffect(() => { if (tab === 'submissions') loadSubmissions() }, [tab, loadSubmissions])
    useEffect(() => { loadStats() }, [loadStats])

    const handleDelete = async (id) => {
        if (!confirm('Delete this exercise and all its submissions?')) return
        try {
            await fetch(`${API}/admin/lab-exercises/${id}`, { method: 'DELETE', headers: H() })
            showToast('Exercise deleted')
            loadExercises()
            loadStats()
        } catch { showToast('Delete failed', 'error') }
    }

    const handleStatusChange = async (id, status) => {
        try {
            await fetch(`${API}/admin/lab-exercises/${id}/status`, {
                method: 'PUT', headers: H(), body: JSON.stringify({ status })
            })
            showToast(`Exercise ${status === 'active' ? 'set Live' : status === 'ended' ? 'Ended' : 'set Draft'}`)
            loadExercises()
            loadStats()
        } catch { showToast('Status update failed', 'error') }
    }

    const handleDeleteSubmission = async (id, silent = false) => {
        if (!silent && !confirm('Delete this submission?')) return
        try {
            await fetch(`${API}/admin/lab-submissions/${id}`, { method: 'DELETE', headers: H() })
            if (!silent) { showToast('Submission deleted'); loadSubmissions(); loadStats() }
        } catch { if (!silent) showToast('Delete failed', 'error') }
    }

    const labTypeInfo = (type) => LAB_TYPES.find(l => l.value === type) || LAB_TYPES[0]

    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FlaskConical size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>Lab Exercise Manager</h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Create and manage programming, ML, SQL and data labs for students</p>
                    </div>
                </div>
                {tab === 'questions' && (
                    <button onClick={() => { setSelected(null); setModal('create') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        <Plus size={18} /> New Exercise
                    </button>
                )}
            </div>

            {/* Stats Bar */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Total Exercises', value: stats.total_exercises, color: '#3b82f6', icon: <BookOpen size={20} /> },
                        { label: 'Live Now', value: stats.active_exercises, color: '#10b981', icon: <Play size={20} /> },
                        { label: 'Total Submissions', value: stats.total_submissions, color: '#8b5cf6', icon: <FileText size={20} /> },
                        { label: 'Pass Rate', value: `${stats.pass_rate}%`, color: stats.pass_rate >= 60 ? '#10b981' : '#f59e0b', icon: <Award size={20} /> },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid var(--border-color)', width: 'fit-content' }}>
                {[['questions', 'Questions', <FlaskConical size={16} />], ['submissions', 'Submissions', <FileText size={16} />]].map(([v, l, ic]) => (
                    <button key={v} onClick={() => setTab(v)} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                        borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        background: tab === v ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                        color: tab === v ? 'white' : 'var(--text-muted)'
                    }}>{ic} {l}</button>
                ))}
            </div>

            {/* ── Questions Tab ── */}
            {tab === 'questions' && (
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input placeholder="Search exercises..." value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                        </div>
                        <select value={filters.lab_type} onChange={e => setFilters(f => ({ ...f, lab_type: e.target.value }))}
                            style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, minWidth: 160 }}>
                            <option value="">All Lab Types</option>
                            {LAB_TYPES.map(l => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
                        </select>
                        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                            style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, minWidth: 130 }}>
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="active">Live</option>
                            <option value="ended">Ended</option>
                        </select>
                        <button onClick={loadExercises} style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>

                    {loading ? <Spinner /> : exercises.length === 0 ? (
                        <EmptyState icon={<FlaskConical size={48} />} text="No exercises yet" sub="Create your first lab exercise to get started" action={{ label: 'Create Exercise', onClick: () => setModal('create') }} />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
                            {exercises.map(ex => (
                                <ExerciseCard
                                    key={ex.id} ex={ex}
                                    labInfo={labTypeInfo(ex.lab_type)}
                                    onEdit={() => { setSelected(ex); setModal('edit') }}
                                    onView={() => { setSelected(ex); setModal('view') }}
                                    onAssign={() => { setSelected(ex); setModal('assign') }}
                                    onDelete={() => handleDelete(ex.id)}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Submissions Tab ── */}
            {tab === 'submissions' && (
                <SubmissionsTab
                    submissions={submissions}
                    exercises={exercises}
                    loading={loading}
                    filters={subFilters}
                    setFilters={setSubFilters}
                    onRefresh={loadSubmissions}
                    onDelete={handleDeleteSubmission}
                    onViewReport={(s) => { setSelected(s); setModal('report') }}
                />
            )}

            {/* Modals */}
            {(modal === 'create' || modal === 'edit') && (
                <ExerciseFormModal
                    exercise={modal === 'edit' ? selected : null}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); loadExercises(); loadStats(); showToast(modal === 'edit' ? 'Exercise updated' : 'Exercise created') }}
                    showToast={showToast}
                />
            )}
            {modal === 'view' && selected && (
                <ViewModal exercise={selected} onClose={() => setModal(null)} />
            )}
            {modal === 'assign' && selected && (
                <AssignModal
                    exercise={selected}
                    onClose={() => setModal(null)}
                    onSaved={() => { showToast(`Students assigned to "${selected.title}"`) }}
                    showToast={showToast}
                />
            )}
            {modal === 'report' && selected && (
                <SubmissionReportModal submission={selected} onClose={() => setModal(null)} />
            )}
        </div>
    )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, labInfo, onEdit, onView, onAssign, onDelete, onStatusChange }) {
    const [showMenu, setShowMenu] = useState(false)
    const sm = STATUS_META[ex.status] || STATUS_META.draft
    const lang = LANGUAGES.find(l => l.value === ex.language) || LANGUAGES[0]

    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid var(--border-color)`,
            borderRadius: 16, overflow: 'hidden', transition: 'all 0.25s',
            borderTop: `3px solid ${labInfo.color}`
        }}>
            <div style={{ padding: '20px 20px 16px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 22 }}>{labInfo.icon}</div>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: labInfo.color, textTransform: 'uppercase', letterSpacing: 1 }}>{labInfo.label}</span>
                            {ex.language !== 'none' && ex.language && (
                                <span style={{ marginLeft: 8, fontSize: 11, background: '#1e3457', color: '#60a5fa', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>{ex.language.toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, fontWeight: 700, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                            {sm.label}
                        </span>
                        <span style={{ fontSize: 11, background: `${DIFFICULTY_COLORS[ex.difficulty] || '#f59e0b'}22`, color: DIFFICULTY_COLORS[ex.difficulty] || '#f59e0b', padding: '3px 8px', borderRadius: 6, fontWeight: 600, textTransform: 'capitalize' }}>{ex.difficulty}</span>
                    </div>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{ex.title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ex.description || 'No description provided'}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    {[
                        { icon: <Users size={13} />, val: `${ex.assigned_count || 0} assigned` },
                        { icon: <FileText size={13} />, val: `${ex.submission_count || 0} submissions` },
                        { icon: <RefreshCw size={13} />, val: `${ex.max_attempts} attempts` },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                            {s.icon} {s.val}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action bar */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <ActionBtn icon={<Eye size={14} />} label="View" onClick={onView} color="#64748b" />
                <ActionBtn icon={<Edit3 size={14} />} label="Edit" onClick={onEdit} color="#3b82f6" />
                <ActionBtn icon={<Users size={14} />} label="Assign" onClick={onAssign} color="#8b5cf6" />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {ex.status !== 'active' && (
                        <button onClick={() => onStatusChange(ex.id, 'active')}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#052e16', border: '1px solid #166534', borderRadius: 7, color: '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            <Play size={13} /> Go Live
                        </button>
                    )}
                    {ex.status === 'active' && (
                        <button onClick={() => onStatusChange(ex.id, 'ended')}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#3b0d0d', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                            <Square size={13} /> End
                        </button>
                    )}
                    <button onClick={onDelete} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 7, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

function ActionBtn({ icon, label, onClick, color }) {
    const [hover, setHover] = useState(false)
    return (
        <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: hover ? `${color}20` : 'transparent', border: `1px solid ${hover ? color : 'var(--border-color)'}`, borderRadius: 7, color: hover ? color : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
            {icon} {label}
        </button>
    )
}

// ─── Exercise Form Modal ──────────────────────────────────────────────────────
function ExerciseFormModal({ exercise, onClose, onSaved, showToast }) {
    const isEdit = !!exercise
    const [form, setForm] = useState({
        title: exercise?.title || '',
        description: exercise?.description || '',
        lab_type: exercise?.lab_type || 'programming',
        language: exercise?.language || 'none',
        max_attempts: exercise?.max_attempts || 3,
        time_limit: exercise?.time_limit || 0,
        difficulty: exercise?.difficulty || 'medium',
        tags: (exercise?.tags || []).join(', '),
        instructions: exercise?.instructions || '',
        expected_output: exercise?.expected_output || '',
        evaluation_criteria: exercise?.evaluation_criteria || '',
        proctoring: exercise?.proctoring || {
            tab_switch: true,
            fullscreen: true,
            disable_copy_paste: true,
            disable_f12: true,
            disable_right_click: true,
            warn_on_blur: true,
        }
    })
    const [section, setSection] = useState('basic')
    const [saving, setSaving] = useState(false)

    const proctoringItems = [
        { key: 'tab_switch', label: 'Tab Switch Detection', icon: '🔄', desc: 'Warn when student switches tabs' },
        { key: 'fullscreen', label: 'Enforce Fullscreen', icon: '⛶', desc: 'Force fullscreen during test' },
        { key: 'disable_copy_paste', label: 'Disable Copy/Paste', icon: '📋', desc: 'Block Ctrl+C, Ctrl+V' },
        { key: 'disable_f12', label: 'Disable F12/DevTools', icon: '🔧', desc: 'Block F12 and developer tools' },
        { key: 'disable_right_click', label: 'Disable Right Click', icon: '🖱️', desc: 'Block context menu' },
        { key: 'warn_on_blur', label: 'Warn on Window Blur', icon: '⚠️', desc: 'Alert on focus loss' },
    ]

    const handleSave = async () => {
        if (!form.title.trim()) return showToast('Title is required', 'error')
        setSaving(true)
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                max_attempts: parseInt(form.max_attempts) || 3,
                time_limit: parseInt(form.time_limit) || 0,
            }
            const url = isEdit ? `${API}/admin/lab-exercises/${exercise.id}` : `${API}/admin/lab-exercises`
            const r = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: H(), body: JSON.stringify(payload) })
            const d = await r.json()
            if (!r.ok) return showToast(d.error || 'Save failed', 'error')
            onSaved()
        } catch { showToast('Save failed', 'error') }
        finally { setSaving(false) }
    }

    const labInfo = LAB_TYPES.find(l => l.value === form.lab_type) || LAB_TYPES[0]

    const sections = ['basic', 'content', 'proctoring']

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${labInfo.color}, ${labInfo.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {labInfo.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>{isEdit ? 'Edit Exercise' : 'Create New Exercise'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{labInfo.label} — {form.language === 'none' ? 'Language Free' : form.language.toUpperCase()}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}><X size={22} /></button>
                </div>

                {/* Section Tabs */}
                <div style={{ display: 'flex', gap: 2, padding: '10px 28px 0', borderBottom: '1px solid var(--border-color)' }}>
                    {sections.map(s => (
                        <button key={s} onClick={() => setSection(s)}
                            style={{ padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize', color: section === s ? '#3b82f6' : 'var(--text-muted)', borderBottom: section === s ? '2px solid #3b82f6' : '2px solid transparent' }}>
                            {s}
                        </button>
                    ))}
                </div>

                {/* Form Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {section === 'basic' && (
                        <div style={{ display: 'grid', gap: 18 }}>
                            <FormField label="Exercise Title *">
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g., Binary Search Implementation" style={inputStyle} />
                            </FormField>
                            <FormField label="Description">
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3} placeholder="Describe the exercise goal and context..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </FormField>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <FormField label="Lab Type *">
                                    <select value={form.lab_type} onChange={e => setForm(f => ({ ...f, lab_type: e.target.value }))} style={inputStyle}>
                                        {LAB_TYPES.map(l => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Language">
                                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={inputStyle}>
                                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                    </select>
                                </FormField>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <FormField label="Difficulty">
                                    <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={inputStyle}>
                                        {DIFFICULTIES.map(d => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Max Attempts">
                                    <input type="number" min={1} max={10} value={form.max_attempts} onChange={e => setForm(f => ({ ...f, max_attempts: e.target.value }))} style={inputStyle} />
                                </FormField>
                                <FormField label="Time Limit (min, 0=unlimited)">
                                    <input type="number" min={0} value={form.time_limit} onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))} style={inputStyle} />
                                </FormField>
                            </div>
                            <FormField label="Tags (comma separated)">
                                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    placeholder="recursion, searching, arrays" style={inputStyle} />
                            </FormField>
                        </div>
                    )}
                    {section === 'content' && (
                        <div style={{ display: 'grid', gap: 18 }}>
                            <FormField label="Instructions for Students">
                                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                                    rows={5} placeholder="Step-by-step instructions, constraints, edge cases to handle..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                            </FormField>
                            <FormField label="Expected Output / Requirements">
                                <textarea value={form.expected_output} onChange={e => setForm(f => ({ ...f, expected_output: e.target.value }))}
                                    rows={4} placeholder="Describe expected output, edge cases, sample I/O..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                            </FormField>
                            <FormField label="Evaluation Criteria">
                                <textarea value={form.evaluation_criteria} onChange={e => setForm(f => ({ ...f, evaluation_criteria: e.target.value }))}
                                    rows={3} placeholder="How will AI evaluate? e.g., correctness 40%, code quality 30%, performance 30%..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </FormField>
                        </div>
                    )}
                    {section === 'proctoring' && (
                        <div>
                            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>
                                Configure proctoring settings. These controls prevent academic dishonesty during the lab exercise.
                            </p>
                            <div style={{ display: 'grid', gap: 12 }}>
                                {proctoringItems.map(item => (
                                    <div key={item.key} onClick={() => setForm(f => ({ ...f, proctoring: { ...f.proctoring, [item.key]: !f.proctoring[item.key] } }))}
                                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: form.proctoring[item.key] ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)', border: `1px solid ${form.proctoring[item.key] ? '#3b82f6' : 'var(--border-color)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.label}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                                        </div>
                                        <div style={{
                                            width: 44, height: 24, borderRadius: 12,
                                            background: form.proctoring[item.key] ? '#3b82f6' : '#374151',
                                            position: 'relative', transition: 'background 0.2s'
                                        }}>
                                            <div style={{
                                                position: 'absolute', top: 3, left: form.proctoring[item.key] ? 23 : 3,
                                                width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 9, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                        {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exercise'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ exercise: ex, onClose }) {
    const labInfo = LAB_TYPES.find(l => l.value === ex.lab_type) || LAB_TYPES[0]
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, ${labInfo.color}15, transparent)` }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 28 }}>{labInfo.icon}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>{ex.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{labInfo.label} · {ex.language !== 'none' ? ex.language?.toUpperCase() : 'Any Language'} · {ex.difficulty}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    <Section title="Description">{ex.description || <em style={{ color: 'var(--text-muted)' }}>No description</em>}</Section>
                    {ex.instructions && <Section title="Instructions"><pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0 }}>{ex.instructions}</pre></Section>}
                    {ex.expected_output && <Section title="Expected Output"><pre style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>{ex.expected_output}</pre></Section>}
                    {ex.evaluation_criteria && <Section title="Evaluation Criteria">{ex.evaluation_criteria}</Section>}
                    <Section title="Settings">
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {[['Max Attempts', ex.max_attempts], ['Time Limit', ex.time_limit ? `${ex.time_limit} min` : 'Unlimited'], ['Difficulty', ex.difficulty]].map(([k, v]) => (
                                <div key={k}><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{k}: </span><strong>{v}</strong></div>
                            ))}
                        </div>
                    </Section>
                    {ex.proctoring && Object.keys(ex.proctoring).filter(k => ex.proctoring[k]).length > 0 && (
                        <Section title="Proctoring Active">
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {Object.entries(ex.proctoring).filter(([, v]) => v).map(([k]) => (
                                    <span key={k} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                        {k.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ exercise, onClose, onSaved, showToast }) {
    // ── All hooks at top (React rules) ──
    const [students, setStudents] = useState([])
    const [batches, setBatches] = useState([])
    const [selected, setSelected] = useState(new Set())
    const [selectedBatch, setSelectedBatch] = useState(null)
    const [batchSearch, setBatchSearch] = useState('')
    const [indivSearch, setIndivSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mode, setMode] = useState('all') // 'all' | 'individual' | 'batch'

    useEffect(() => {
        Promise.all([
            fetch(`${API}/admin/lab-students`, { headers: H() }).then(r => r.json()),
            fetch(`${API}/admin/lab-exercises/${exercise.id}`, { headers: H() }).then(r => r.json()),
            fetch(`${API}/batches`, { headers: H() }).then(r => r.json()).catch(() => ({ batches: [] }))
        ]).then(([sd, ed, bd]) => {
            setStudents(sd.students || [])
            const allStudentIds = (sd.students || []).map(s => s.id)
            const assignedIds = new Set((ed.assigned_students || []).map(s => s.student_id))
            setSelected(assignedIds)
            // Normalize batches — filter only batches whose student_ids overlap with known users
            const batchList = (bd.batches || bd || []).map(b => {
                const ids = Array.isArray(b.student_ids) ? b.student_ids : []
                const validIds = ids.filter(id => allStudentIds.includes(id) || allStudentIds.includes(String(id)))
                return { id: b.id, name: b.batch_name, count: validIds.length, student_ids: validIds }
            }).filter(b => b.count > 0)
            setBatches(batchList)
        }).finally(() => setLoading(false))
    }, [exercise.id])

    const doAssign = async (ids) => {
        if (!ids.length) return showToast('No students to assign', 'error')
        setSaving(true)
        try {
            const r = await fetch(`${API}/admin/lab-exercises/${exercise.id}/assign`, {
                method: 'POST', headers: H(), body: JSON.stringify({ student_ids: ids })
            })
            const d = await r.json()
            if (!r.ok) return showToast(d.error || 'Assign failed', 'error')
            showToast(`Assigned to ${ids.length} students`, 'success')
            onSaved()
            onClose()
        } catch { showToast('Assignment failed', 'error') }
        finally { setSaving(false) }
    }

    const filteredBatches = batches.filter(b => !batchSearch || b.name.toLowerCase().includes(batchSearch.toLowerCase()))
    const filteredIndiv = students.filter(s =>
        !indivSearch || s.name?.toLowerCase().includes(indivSearch.toLowerCase()) || s.email?.toLowerCase().includes(indivSearch.toLowerCase())
    )

    const TABS = [
        { key: 'all', label: 'Assign All' },
        { key: 'individual', label: 'Individual' },
        { key: 'batch', label: 'Batch' },
    ]

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 22, width: '100%', maxWidth: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>

                {/* Header */}
                <div style={{ padding: '22px 26px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)', marginBottom: 2 }}>Assign Students</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{exercise.title}</div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                </div>

                {/* Mode Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 26px 18px' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setMode(t.key)} style={{
                            padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                            background: mode === t.key ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--bg-dark)',
                            color: mode === t.key ? 'white' : 'var(--text-muted)',
                            transition: 'all 0.18s'
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* ── Assign All Tab ── */}
                {mode === 'all' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 26px 24px', gap: 16 }}>
                        <div style={{ flex: 1, borderRadius: 16, background: 'var(--bg-dark)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10 }}>
                            {loading ? <Spinner /> : (
                                <>
                                    <div style={{ fontSize: '4rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{students.length}</div>
                                    <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>students will receive this exercise</div>
                                </>
                            )}
                        </div>
                        <button onClick={() => doAssign(students.map(s => s.id))} disabled={saving || loading}
                            style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 12, color: 'white', cursor: (saving || loading) ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (saving || loading) ? 0.7 : 1 }}>
                            {saving ? <RefreshCw size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Users size={18} />}
                            {saving ? 'Assigning...' : `Assign to All ${students.length} Students`}
                        </button>
                        <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Cancel</button>
                    </div>
                )}

                {/* ── Individual Tab ── */}
                {mode === 'individual' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 26px 0' }}>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input placeholder="Search students by name or email..." value={indivSearch} onChange={e => setIndivSearch(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: 34 }} />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
                            {loading ? <Spinner /> : filteredIndiv.map(s => (
                                <div key={s.id} onClick={() => setSelected(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', background: selected.has(s.id) ? 'rgba(139,92,246,0.1)' : 'transparent', marginBottom: 2 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selected.has(s.id) ? '#8b5cf6' : 'var(--border-color)'}`, background: selected.has(s.id) ? '#8b5cf6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {selected.has(s.id) && <CheckCircle size={12} color="white" />}
                                    </div>
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                                        {(s.name || 'S')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{s.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                                    </div>
                                    {s.batch && <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: 5, fontWeight: 600, flexShrink: 0 }}>{s.batch}</span>}
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '14px 0 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
                            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                            <button onClick={() => doAssign([...selected])} disabled={saving || selected.size === 0}
                                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 10, color: 'white', cursor: (saving || selected.size === 0) ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: selected.size === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {saving ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Users size={15} />}
                                {saving ? 'Assigning...' : `Assign ${selected.size} Selected`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Batch Tab ── */}
                {mode === 'batch' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 26px 0' }}>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input placeholder="Search batches..." value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: 34 }} />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
                            {loading ? <Spinner /> : filteredBatches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                                    No batches found. Create batches in the Batch Manager first.
                                </div>
                            ) : filteredBatches.map(batch => {
                                const isSelected = selectedBatch?.id === batch.id
                                return (
                                    <div key={batch.id} onClick={() => setSelectedBatch(isSelected ? null : batch)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--border-color)'}`, background: isSelected ? 'rgba(139,92,246,0.1)' : 'var(--bg-dark)', marginBottom: 8, transition: 'all 0.15s' }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 10, background: isSelected ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Users size={20} color={isSelected ? 'white' : '#8b5cf6'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{batch.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{batch.count} student{batch.count !== 1 ? 's' : ''}</div>
                                        </div>
                                        {isSelected && <CheckCircle size={20} color="#8b5cf6" />}
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ padding: '14px 0 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
                            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                            <button onClick={() => doAssign(selectedBatch?.student_ids || [])} disabled={saving || !selectedBatch}
                                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: 10, color: 'white', cursor: (saving || !selectedBatch) ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: !selectedBatch ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                {saving ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Users size={15} />}
                                {saving ? 'Assigning...' : selectedBatch ? `Assign ${selectedBatch.count} from "${selectedBatch.name}"` : 'Select a Batch'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────
function SubmissionsTab({ submissions, exercises, loading, filters, setFilters, onRefresh, onDelete, onViewReport }) {
    const languages = [...new Set(submissions.map(s => s.language).filter(Boolean))]

    const downloadCSV = () => {
        const headers = ['Student', 'Email', 'Exercise', 'Type', 'Language', 'Score', 'Result', 'Violations', 'Attempt', 'Submitted']
        const rows = submissions.map(s => [
            s.student_name, s.student_email, s.exercise_title, s.lab_type || '',
            s.language || '', s.score, s.passed ? 'PASS' : 'FAIL',
            (s.violations || []).length, s.attempt_number,
            new Date(s.submitted_at).toLocaleString()
        ])
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'lab_submissions.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    const deleteAll = () => {
        if (!window.confirm(`Delete all ${submissions.length} submission(s)? This cannot be undone.`)) return
        Promise.all(submissions.map(s => onDelete(s.id, true))).then(onRefresh)
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input placeholder="Search student or exercise..." value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, minWidth: 130 }}>
                    <option value="">All Results</option>
                    <option value="passed">Passed ✅</option>
                    <option value="failed">Failed ❌</option>
                </select>
                <select value={filters.language} onChange={e => setFilters(f => ({ ...f, language: e.target.value }))}
                    style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, minWidth: 130 }}>
                    <option value="">All Languages</option>
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={filters.exercise_id} onChange={e => setFilters(f => ({ ...f, exercise_id: e.target.value }))}
                    style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, minWidth: 180 }}>
                    <option value="">All Exercises</option>
                    {exercises.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
                <button onClick={onRefresh} style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={15} /> Refresh
                </button>
                <button onClick={downloadCSV} disabled={submissions.length === 0} style={{ padding: '9px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 9, color: '#60a5fa', cursor: submissions.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
                    <Download size={15} /> CSV
                </button>
                {submissions.length > 0 && (
                    <button onClick={deleteAll} style={{ padding: '9px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 9, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
                        <Trash2 size={15} /> Delete All
                    </button>
                )}
            </div>

            {/* Summary */}
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--text-muted)' }}>
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''} — {submissions.filter(s => s.passed).length} passed · {submissions.filter(s => !s.passed).length} failed
            </div>

            {loading ? <Spinner /> : submissions.length === 0 ? (
                <EmptyState icon={<FileText size={48} />} text="No submissions" sub="Student submissions will appear here" />
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                                {['Student', 'Exercise', 'Language', 'Score', 'Result', 'Violations', 'Attempt', 'Submitted', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((s, i) => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{s.student_name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.student_email}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{s.exercise_title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.lab_type} lab</div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: 12, background: '#1e3457', color: '#60a5fa', padding: '3px 8px', borderRadius: 5, fontWeight: 600 }}>
                                            {s.language || s.exercise_language || '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 48, height: 6, background: '#1e293b', borderRadius: 3 }}>
                                                <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: s.score >= 60 ? '#10b981' : '#ef4444' }} />
                                            </div>
                                            <span style={{ fontWeight: 700, color: s.score >= 60 ? '#10b981' : '#ef4444', fontSize: 14 }}>{s.score}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: s.passed ? '#34d399' : '#f87171' }}>
                                            {s.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {s.passed ? 'PASS' : 'FAIL'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {(s.violations || []).length > 0 ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: 5 }}>
                                                <Shield size={12} /> {s.violations.length}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 12, color: '#475569' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>#{s.attempt_number}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                                        {new Date(s.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => onViewReport(s)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 7, color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                                <Eye size={13} /> Report
                                            </button>
                                            <button onClick={() => onDelete(s.id)} style={{ padding: '5px 8px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 7, color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={13} />
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
    )
}

// ─── Submission Report Modal ──────────────────────────────────────────────────
function SubmissionReportModal({ submission: s, onClose }) {
    const breakdown = s.ai_breakdown || {}
    const [viewFile, setViewFile] = useState(s.files?.[0] || null)

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', maxWidth: 800, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: s.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {s.passed ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                            Submission Report — {s.student_name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.exercise_title} · {s.language || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 32, fontWeight: 900, color: s.score >= 60 ? '#10b981' : '#ef4444' }}>{s.score}%</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gap: 20 }}>
                    {/* AI Feedback */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 18 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>AI Summary</div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.ai_feedback || 'No feedback available'}</p>
                    </div>

                    {/* Score Breakdown */}
                    {Object.keys(breakdown).length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: 18 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text)' }}>Score Breakdown</div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {Object.entries(breakdown).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ width: 160, fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                        <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 4 }}>
                                            <div style={{ width: `${Math.min(100, (v / 40) * 100)}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.8s' }} />
                                        </div>
                                        <span style={{ width: 40, textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {s.files?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 8, overflowX: 'auto' }}>
                                {s.files.map((f, i) => (
                                    <button key={i} onClick={() => setViewFile(f)} style={{ padding: '5px 12px', background: viewFile?.name === f.name ? '#3b82f6' : 'transparent', border: `1px solid ${viewFile?.name === f.name ? '#3b82f6' : 'var(--border-color)'}`, borderRadius: 7, color: viewFile?.name === f.name ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                            {viewFile && (
                                <pre style={{ margin: 0, padding: 18, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', maxHeight: 300, overflowY: 'auto' }}>
                                    {viewFile.content || '(empty file)'}
                                </pre>
                            )}
                        </div>
                    )}

                    {/* Proctoring Violations */}
                    {(s.violations || []).length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 14, padding: 18 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={16} /> Proctoring Violations ({s.violations.length})
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                                {s.violations.map((v, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                                        <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, fontFamily: 'monospace' }}>{i + 1}.</span>
                                        <span style={{ color: '#fde68a', fontSize: 13, textTransform: 'capitalize', flex: 1 }}>{String(v.type || 'violation').replace(/_/g, ' ')}</span>
                                        <span style={{ color: '#64748b', fontSize: 11 }}>{v.time ? new Date(v.time).toLocaleTimeString() : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
            <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{children}</div>
        </div>
    )
}
function FormField({ label, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    )
}
function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )
}
function EmptyState({ icon, text, sub, action }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, opacity: 0.4 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 6 }}>{text}</div>
            <div style={{ fontSize: 14, marginBottom: action ? 20 : 0 }}>{sub}</div>
            {action && <button onClick={action.onClick} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 9, color: 'white', cursor: 'pointer', fontWeight: 700 }}>{action.label}</button>}
        </div>
    )
}
const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
