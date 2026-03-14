import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Code2, Eye, Play, Square, Trash2, Users, X, Plus, FileCode2 } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' })

const STATUS_META = {
    draft: { label: 'Draft', bg: '#1e293b', color: '#94a3b8' },
    active: { label: 'Live', bg: '#052e16', color: '#34d399' },
    ended: { label: 'Ended', bg: '#3b0d0d', color: '#f87171' },
}

function Toast({ item, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3200)
        return () => clearTimeout(timer)
    }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: item.type === 'error' ? '#3b0d0d' : '#052e16', color: item.type === 'error' ? '#fca5a5' : '#86efac', border: `1px solid ${item.type === 'error' ? '#7f1d1d' : '#166534'}`, padding: '12px 16px', borderRadius: 12, minWidth: 280, boxShadow: '0 16px 36px rgba(0,0,0,0.35)' }}>
            {item.message}
        </div>
    )
}

function AssignModal({ test, onClose, onSaved }) {
    const [students, setStudents] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/crt/students`, { headers: authHeader() }).then(r => r.json()),
            fetch(`${API}/admin/frontend-evals/tests/${test.id}/assignments`, { headers: authHeader() }).then(r => r.json()).catch(() => ({ student_ids: [] })),
        ])
            .then(([studentData, assignmentData]) => {
                const list = Array.isArray(studentData) ? studentData : (studentData.students || [])
                setStudents(list)
                setSelected((assignmentData.student_ids || []).map(String))
            })
    }, [test.assigned_students])

    async function save() {
        setLoading(true)
        try {
            const res = await fetch(`${API}/admin/frontend-evals/tests/${test.id}/assign`, {
                method: 'PUT',
                headers: authHeader(),
                body: JSON.stringify({ student_ids: selected }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save assignments')
            onSaved()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
            <div style={{ width: 560, maxHeight: '85vh', overflow: 'hidden', background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>Assign Students</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{test.title}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 18, overflowY: 'auto', display: 'grid', gap: 10 }}>
                    {students.map(student => {
                        const checked = selected.includes(String(student.id))
                        return (
                            <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: checked ? 'rgba(59,130,246,0.12)' : '#111827', border: `1px solid ${checked ? '#2563eb55' : '#1f2937'}` }}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setSelected(prev => checked ? prev.filter(id => id !== String(student.id)) : [...prev, String(student.id)])}
                                    style={{ accentColor: '#2563eb' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{student.name}</div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>{student.email}</div>
                                </div>
                            </label>
                        )
                    })}
                </div>
                <div style={{ padding: 18, borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={save} disabled={loading} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Saving...' : 'Save Assignments'}</button>
                </div>
            </div>
        </div>
    )
}

function ReportModal({ submission, onClose }) {
    if (!submission) return null
    const report = submission.report_json || {}
    const breakdown = report.breakdown || submission.breakdown_json || {}
    const metrics = [
        ['Structure', breakdown.structure, '#60a5fa'],
        ['Functionality', breakdown.functionality, '#34d399'],
        ['UI/UX', breakdown.uiUx, '#f59e0b'],
        ['Responsive', breakdown.responsiveness, '#a78bfa'],
        ['Code Quality', breakdown.codeQuality, '#f87171'],
    ]

    const renderTree = (nodes = [], depth = 0) => nodes.map(node => (
        <div key={node.path} style={{ paddingLeft: depth * 14, color: node.type === 'dir' ? '#cbd5e1' : '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            {node.type === 'dir' ? '📁' : '📄'} {node.name}
            {node.children ? renderTree(node.children, depth + 1) : null}
        </div>
    ))

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: 'min(1000px, 92vw)', maxHeight: '90vh', overflowY: 'auto', background: '#020617', border: '1px solid #1e293b', borderRadius: 22 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>{submission.test_title}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{submission.student_name || submission.student_email} · {new Date(submission.submitted_at).toLocaleString()}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24, display: 'grid', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18 }}>
                        <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid #1e293b', padding: 20, textAlign: 'center' }}>
                            <div style={{ color: '#38bdf8', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Overall Score</div>
                            <div style={{ color: '#f8fafc', fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginTop: 10 }}>{Math.round(submission.score || report.overallScore || 0)}</div>
                            <div style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{submission.runtime_status || 'skipped'} runtime check</div>
                        </div>
                        <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid #1e293b', padding: 20 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 10 }}>Summary</div>
                            <div style={{ color: '#94a3b8', lineHeight: 1.7 }}>{report.summary || 'No summary available.'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                        {metrics.map(([label, value, color]) => (
                            <div key={label} style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 14 }}>
                                <div style={{ color: '#64748b', fontSize: 12 }}>{label}</div>
                                <div style={{ color, fontSize: 26, fontWeight: 800, marginTop: 6 }}>{Math.round(value || 0)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 18 }}>
                        <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid #1e293b', padding: 18 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 10 }}>Highlights</div>
                            <div style={{ color: '#86efac', fontWeight: 700, marginBottom: 6 }}>Strengths</div>
                            {(report.strengths || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>• {item}</div>)}
                            <div style={{ color: '#fca5a5', fontWeight: 700, margin: '14px 0 6px' }}>Issues</div>
                            {(report.issues || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>• {item}</div>)}
                            <div style={{ color: '#93c5fd', fontWeight: 700, margin: '14px 0 6px' }}>Recommendations</div>
                            {(report.recommendations || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>• {item}</div>)}
                        </div>
                        <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid #1e293b', padding: 18 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 10 }}>Runtime & Project Tree</div>
                            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{submission.runtime_summary || report.runtime?.summary || 'Runtime analysis not available.'}</div>
                            {submission.runtime_output || report.runtime?.output ? (
                                <pre style={{ background: '#020617', color: '#94a3b8', padding: 12, borderRadius: 12, fontSize: 11, overflow: 'auto', maxHeight: 180 }}>{submission.runtime_output || report.runtime?.output}</pre>
                            ) : null}
                            <div style={{ marginTop: 12, background: '#020617', borderRadius: 12, padding: 12, maxHeight: 240, overflow: 'auto' }}>
                                {renderTree(submission.file_tree_json || report.fileTree || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AdminFrontendEval({ initialTab = 'tests' }) {
    const [tab, setTab] = useState(initialTab)
    const [tests, setTests] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [assigning, setAssigning] = useState(null)
    const [report, setReport] = useState(null)
    const [toast, setToast] = useState(null)
    const [form, setForm] = useState({ title: '', description: '', requirements: '', attempt_limit: 1 })

    const assignedMap = useMemo(() => Object.fromEntries(tests.map(test => [test.id, safeJson(test.assigned_students, [])])), [tests])

    function safeJson(value, fallback) {
        try { return value ? JSON.parse(value) : fallback } catch { return fallback }
    }

    async function loadData() {
        setLoading(true)
        try {
            const [testsRes, subsRes] = await Promise.all([
                fetch(`${API}/admin/frontend-evals/tests`, { headers: authHeader() }).then(r => r.json()),
                fetch(`${API}/admin/frontend-evals/submissions`, { headers: authHeader() }).then(r => r.json()),
            ])
            setTests((testsRes.tests || []).map(test => ({ ...test, assigned_students: safeJson(test.assigned_students, []) })))
            setSubmissions(subsRes.submissions || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])
    useEffect(() => { setTab(initialTab) }, [initialTab])

    function resetForm() {
        setForm({ title: '', description: '', requirements: '', attempt_limit: 1 })
        setEditing(null)
    }

    async function saveTest() {
        const url = editing ? `${API}/admin/frontend-evals/tests/${editing.id}` : `${API}/admin/frontend-evals/tests`
        const method = editing ? 'PUT' : 'POST'
        const res = await fetch(url, {
            method,
            headers: authHeader(),
            body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Failed to save test' })
            return
        }
        setToast({ type: 'success', message: editing ? 'Frontend evaluation updated' : 'Frontend evaluation created' })
        resetForm()
        loadData()
    }

    async function act(testId, action) {
        const res = await fetch(`${API}/admin/frontend-evals/tests/${testId}/${action}`, { method: 'POST', headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || `Failed to ${action}` })
            return
        }
        setToast({ type: 'success', message: action === 'go-live' ? 'Test is now live' : 'Test ended' })
        loadData()
    }

    async function remove(testId) {
        if (!window.confirm('Delete this frontend evaluation and its submissions?')) return
        const res = await fetch(`${API}/admin/frontend-evals/tests/${testId}`, { method: 'DELETE', headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Delete failed' })
            return
        }
        setToast({ type: 'success', message: 'Frontend evaluation deleted' })
        loadData()
    }

    async function openReport(id) {
        const res = await fetch(`${API}/admin/frontend-evals/submissions/${id}`, { headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Failed to load report' })
            return
        }
        setReport(data.submission)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {toast ? <Toast item={toast} onClose={() => setToast(null)} /> : null}
            {assigning ? <AssignModal test={assigning} onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); loadData() }} /> : null}
            {report ? <ReportModal submission={report} onClose={() => setReport(null)} /> : null}

            <div style={{ background: 'linear-gradient(135deg, #082f49, #0f172a)', borderRadius: 22, border: '1px solid #1e3a5f', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: '#f8fafc', fontSize: 22, fontWeight: 900 }}>Frontend Evaluation</div>
                    <div style={{ color: '#94a3b8', marginTop: 4 }}>Create frontend use cases, assign students, evaluate uploaded HTML/CSS/JS projects, and review dedicated reports.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setTab('tests')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #1e3a5f', background: tab === 'tests' ? '#0ea5e9' : '#0f172a', color: '#fff', cursor: 'pointer' }}>Tests</button>
                    <button onClick={() => setTab('submissions')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #1e3a5f', background: tab === 'submissions' ? '#0ea5e9' : '#0f172a', color: '#fff', cursor: 'pointer' }}>Submissions</button>
                </div>
            </div>

            {tab === 'tests' ? (
                <>
                    <div style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', padding: 20, display: 'grid', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: '#f8fafc', fontWeight: 800 }}>{editing ? 'Edit Use Case' : 'Create Use Case'}</div>
                            {editing ? <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Cancel Edit</button> : null}
                        </div>
                        <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Use case title" style={{ width: '100%', padding: '12px 14px', background: '#020617', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} />
                        <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Describe the frontend use case" style={{ width: '100%', padding: '12px 14px', background: '#020617', border: '1px solid #334155', borderRadius: 12, color: '#fff', resize: 'vertical' }} />
                        <textarea value={form.requirements} onChange={e => setForm(prev => ({ ...prev, requirements: e.target.value }))} rows={5} placeholder="Expected features and requirements" style={{ width: '100%', padding: '12px 14px', background: '#020617', border: '1px solid #334155', borderRadius: 12, color: '#fff', resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input type="number" min="1" value={form.attempt_limit ?? ''} onChange={e => setForm(prev => ({ ...prev, attempt_limit: e.target.value ? Number(e.target.value) : null }))} placeholder="Attempt limit" style={{ width: 180, padding: '12px 14px', background: '#020617', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} />
                            <button onClick={saveTest} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Plus size={16} /> {editing ? 'Update Use Case' : 'Create Use Case'}
                            </button>
                        </div>
                    </div>

                    {loading ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading frontend evaluations...</div> : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                            {tests.map(test => {
                                const status = STATUS_META[test.status] || STATUS_META.draft
                                return (
                                    <div key={test.id} style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: 17 }}>{test.title}</div>
                                                <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{test.description?.slice(0, 140) || 'No description provided.'}</div>
                                            </div>
                                            <div style={{ alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 999, background: status.bg, color: status.color, fontSize: 12, fontWeight: 800 }}>{status.label}</div>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, minHeight: 60 }}>{test.requirements?.slice(0, 180) || 'No requirements added yet.'}</div>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                                            <span>Attempts: {test.attempt_limit ?? 'Unlimited'}</span>
                                            <span>Assigned: {test.assigned_count || assignedMap[test.id]?.length || 0}</span>
                                            <span>Submissions: {test.submissions_count || 0}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                            <button onClick={() => setEditing(test) || setForm({ title: test.title, description: test.description || '', requirements: test.requirements || '', attempt_limit: test.attempt_limit })} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => setAssigning(test)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Users size={14} />Assign</button>
                                            <button onClick={() => remove(test.id)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #7f1d1d', background: '#2a0d0d', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Trash2 size={14} />Delete</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                            {test.status === 'active'
                                                ? <button onClick={() => act(test.id, 'end')} style={{ padding: '11px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Square size={14} />End</button>
                                                : <button onClick={() => act(test.id, 'go-live')} style={{ padding: '11px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #166534, #22c55e)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Play size={14} />Go Live</button>}
                                            <div style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #1e293b', background: '#020617', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><FileCode2 size={14} />Frontend Task</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 190px 80px', padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #1e293b' }}>
                        <div>Student / Test</div>
                        <div>Submission</div>
                        <div>Score</div>
                        <div>Runtime</div>
                        <div>Submitted At</div>
                        <div></div>
                    </div>
                    {submissions.map(sub => (
                        <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 190px 80px', padding: '14px 18px', alignItems: 'center', borderBottom: '1px solid #111827' }}>
                            <div>
                                <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{sub.student_name || 'Student'}</div>
                                <div style={{ color: '#64748b', fontSize: 12 }}>{sub.test_title}</div>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{sub.submission_type === 'zip' ? 'ZIP Upload' : 'Multi-file Upload'}</div>
                            <div style={{ color: '#38bdf8', fontWeight: 800 }}>{Math.round(sub.score || 0)}</div>
                            <div style={{ color: sub.runtime_status === 'passed' ? '#34d399' : sub.runtime_status === 'failed' ? '#f87171' : '#fbbf24', fontWeight: 700 }}>{sub.runtime_status}</div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(sub.submitted_at).toLocaleString()}</div>
                            <button onClick={() => openReport(sub.id)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Eye size={14} />View</button>
                        </div>
                    ))}
                    {!submissions.length ? <div style={{ padding: 30, color: '#94a3b8', textAlign: 'center' }}>No frontend evaluation submissions yet.</div> : null}
                </div>
            )}
        </div>
    )
}
