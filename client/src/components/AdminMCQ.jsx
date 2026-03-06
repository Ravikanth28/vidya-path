import { useState, useEffect, useMemo } from 'react'
import { Brain, Plus, Trash2, Edit3, Users, Eye, Download, BarChart2, X, Check, ChevronDown, ChevronUp, Code, FileText, Sparkles, AlertCircle, ArrowLeft, Search, Filter, Shield, Camera, TabletSmartphone, Clipboard, Monitor, Radio, StopCircle } from 'lucide-react'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

const MCQ_CATEGORIES = [
    { value: 'technical', label: '💻 Technical MCQ', desc: 'Programming concepts, algorithms, data structures' },
    { value: 'debug', label: '🐛 Debug MCQ', desc: 'Find bugs in code snippets' },
    { value: 'pseudocode', label: '📋 Pseudocode MCQ', desc: 'Trace pseudocode and predict output' }
]

const DIFFICULTIES = ['easy', 'medium', 'hard']

function authHeader() {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

const emptyQuestion = () => ({
    id: Date.now(),
    type: 'mcq',
    question: '',
    code: '',
    options: ['', '', '', ''],
    correct_answer: 'A',
    explanation: ''
})

export default function AdminMCQ() {
    const [view, setView] = useState('list') // list | create | submissions | report
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ msg: '', type: 'success' })
    const [selectedTest, setSelectedTest] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [searchSub, setSearchSub] = useState('')
    const [assignModal, setAssignModal] = useState(null)
    const [students, setStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [assigning, setAssigning] = useState(false)
    const [assignMode, setAssignMode] = useState('all') // 'all' | 'individual' | 'batch'
    const [studentSearch, setStudentSearch] = useState('')

    // Create form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        categories: ['technical'],
        difficulty: 'medium',
        time_limit: 30,
        deadline: '',
        questions: [emptyQuestion()],
        pass_mark: 70,
        max_attempts: 1,
        proctoring: {
            enabled: false,
            disableCopyPaste: false,
            trackTabSwitches: true,
            maxTabSwitches: 3,
            requireFullscreen: false,
            enableWebcam: false,
            detectMultipleFaces: false,
            autoSubmitOnViolation: false,
            maxViolations: 5
        }
    })
    const [saving, setSaving] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)
    const [aiPrompt, setAiPrompt] = useState('')

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3500) }

    const handleToggleLive = async (test) => {
        const newActive = !test.is_active
        try {
            await axios.patch(`${API_BASE}/mcq/${test.id}/active`, { is_active: newActive }, { headers: authHeader() })
            showToast(newActive ? '✅ Test is now Live!' : '⏹ Test ended', newActive ? 'success' : 'error')
            fetchTests()
        } catch (err) { showToast(err.response?.data?.error || err.message, 'error') }
    }

    const fetchTests = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/mcq`, { headers: authHeader() })
            setTests(res.data.tests || [])
        } catch (err) { showToast(err.response?.data?.error || err.message, 'error') }
        setLoading(false)
    }

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users?role=student`, { headers: authHeader() })
            setStudents(res.data.users || res.data || [])
        } catch { }
    }

    useEffect(() => { fetchTests(); fetchStudents() }, [])

    const openSubmissions = async (test) => {
        setSelectedTest(test)
        setView('submissions')
        try {
            const res = await axios.get(`${API_BASE}/mcq/${test.id}/submissions`, { headers: authHeader() })
            setSubmissions(res.data.submissions || [])
        } catch (err) { showToast('Could not load submissions', 'error') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this MCQ test? All submissions will also be deleted.')) return
        try {
            await axios.delete(`${API_BASE}/mcq/${id}`, { headers: authHeader() })
            showToast('MCQ deleted')
            fetchTests()
        } catch (err) { showToast(err.response?.data?.error || err.message, 'error') }
    }

    // Question management
    const addQuestion = () => setForm(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }))
    const removeQuestion = (idx) => setForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }))
    const updateQuestion = (idx, field, val) => setForm(p => ({
        ...p,
        questions: p.questions.map((q, i) => i === idx ? { ...q, [field]: val } : q)
    }))
    const updateOption = (qIdx, oIdx, val) => setForm(p => ({
        ...p,
        questions: p.questions.map((q, i) => i === qIdx ? {
            ...q,
            options: q.options.map((o, j) => j === oIdx ? val : o)
        } : q)
    }))

    // AI Generate via server endpoint
    const handleAIGenerate = async () => {
        if (!aiPrompt.trim()) return showToast('Describe the topic to generate questions about', 'error')
        if (!form.categories.length) return showToast('Select at least one category first', 'error')
        setAiGenerating(true)
        try {
            const res = await axios.post(`${API_BASE}/mcq/generate-questions`, {
                topic: aiPrompt,
                categories: form.categories,
                category: form.categories[0],
                difficulty: form.difficulty,
                count: 5
            }, { headers: authHeader() })

            const generated = res.data.questions || []
            const newQuestions = generated.map(q => ({
                id: Date.now() + Math.random(),
                type: 'mcq',
                question: q.question || '',
                code: q.code || '',
                options: Array.isArray(q.options) ? q.options.slice(0, 4).concat(['', '', '', '']).slice(0, 4) : ['', '', '', ''],
                correct_answer: ['A', 'B', 'C', 'D'].includes(q.correct_answer) ? q.correct_answer : 'A',
                explanation: q.explanation || ''
            }))

            setForm(p => ({ ...p, questions: [...p.questions.filter(q => q.question.trim()), ...newQuestions] }))
            showToast(`✨ Generated ${newQuestions.length} questions!`)
            setAiPrompt('')
        } catch (err) {
            showToast('AI generation failed: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setAiGenerating(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.title.trim()) return showToast('Title is required', 'error')
        if (!form.categories.length) return showToast('Select at least one category', 'error')
        if (form.questions.length === 0) return showToast('Add at least one question', 'error')
        const incomplete = form.questions.findIndex(q => !q.question.trim())
        if (incomplete >= 0) return showToast(`Question ${incomplete + 1} has no text`, 'error')

        setSaving(true)
        try {
            const payload = {
                ...form,
                categories: form.categories,
                category: form.categories[0],
                deadline: form.deadline || null,
                pass_mark: form.pass_mark || 70,
                max_attempts: form.max_attempts || 1,
                proctoring_config: form.proctoring.enabled ? form.proctoring : null,
                questions: form.questions.map((q, idx) => ({
                    ...q,
                    id: idx + 1,
                    options: q.options.filter(o => o.trim())
                }))
            }
            await axios.post(`${API_BASE}/mcq`, payload, { headers: authHeader() })
            showToast('✅ MCQ Test created!')
            setView('list')
            setForm({ title: '', description: '', categories: ['technical'], difficulty: 'medium', time_limit: 30, deadline: '', questions: [emptyQuestion()], proctoring: { enabled: false, disableCopyPaste: false, trackTabSwitches: true, maxTabSwitches: 3, requireFullscreen: false, enableWebcam: false, detectMultipleFaces: false, autoSubmitOnViolation: false, maxViolations: 5 } })
            fetchTests()
        } catch (err) { showToast(err.response?.data?.error || err.message, 'error') }
        setSaving(false)
    }

    const handleAssign = async () => {
        if (!assignModal) return
        setAssigning(true)
        try {
            const payload = assignMode === 'all'
                ? { assignAll: true }
                : { studentIds: selectedStudents }
            await axios.post(`${API_BASE}/mcq/${assignModal.id}/assign`, payload, { headers: authHeader() })
            showToast(`Assigned to ${assignMode === 'all' ? 'all ' + students.length + ' students' : selectedStudents.length + ' student(s)'}!`)
            setAssignModal(null)
        } catch (err) {
            showToast(err.response?.data?.error || err.message, 'error')
        } finally {
            setAssigning(false)
        }
    }

    const handleAssignIndividual = async (studentId, studentName) => {
        setAssigning(true)
        try {
            await axios.post(`${API_BASE}/mcq/${assignModal.id}/assign`, { studentIds: [studentId] }, { headers: authHeader() })
            showToast(`✓ Assigned to ${studentName}!`)
        } catch (err) {
            showToast(err.response?.data?.error || err.message, 'error')
        } finally {
            setAssigning(false)
        }
    }

    // Excel Export
    const exportExcel = () => {
        const data = filteredSubs
        if (!data.length) return showToast('No submissions to export', 'error')

        const rows = data.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${s.student_name || ''}</td>
                <td>${s.student_email || ''}</td>
                <td>${s.mcq_title || selectedTest?.title || ''}</td>
                <td>${s.score || 0}%</td>
                <td>${s.correct_answers || 0}/${s.total_questions || 0}</td>
                <td>${s.status || ''}</td>
                <td>${s.ai_report?.performanceLevel || ''}</td>
                <td>${s.ai_report?.estimatedSkillLevel || ''}</td>
                <td>${s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''}</td>
            </tr>`).join('')

        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head>
<body><table border="1">
<tr style="background:#4f46e5;color:white;font-weight:bold;">
<th>#</th><th>Student Name</th><th>Email</th><th>MCQ Title</th><th>Score</th><th>Correct</th><th>Status</th><th>Performance</th><th>Skill Level</th><th>Submitted At</th>
</tr>${rows}
</table></body></html>`

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `mcq_submissions_${Date.now()}.xls`
        link.click()
    }

    const filteredSubs = useMemo(() => {
        if (!searchSub) return submissions
        const q = searchSub.toLowerCase()
        return submissions.filter(s =>
            (s.student_name || '').toLowerCase().includes(q) ||
            (s.student_email || '').toLowerCase().includes(q) ||
            (s.status || '').toLowerCase().includes(q)
        )
    }, [submissions, searchSub])

    const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
    const catColor = { technical: '#3b82f6', debug: '#f59e0b', pseudocode: '#8b5cf6' }
    const perfColor = { excellent: '#10b981', good: '#3b82f6', average: '#f59e0b', needs_improvement: '#ef4444' }

    if (loading && view === 'list') return <div className="loading-spinner"></div>

    // === REPORT VIEW ===
    if (view === 'report' && selectedSubmission) {
        const sub = selectedSubmission
        const report = sub.ai_report || {}
        return (
            <div className="animate-fadeIn">
                {toast.msg && (
                    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{toast.msg}</div>
                )}
                <button onClick={() => { setView('submissions'); setSelectedSubmission(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back to Submissions
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Score Card */}
                    <div style={{ gridColumn: '1/-1', background: `linear-gradient(135deg, ${perfColor[report.performanceLevel] || '#3b82f6'}22, transparent)`, border: `1px solid ${perfColor[report.performanceLevel] || '#3b82f6'}44`, borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: perfColor[report.performanceLevel] || '#3b82f6', lineHeight: 1 }}>{sub.score}%</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Score</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700 }}>{sub.student_name}</h2>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{sub.student_email}</p>
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.87rem' }}>{sub.mcq_title}</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: `${perfColor[report.performanceLevel]}22`, color: perfColor[report.performanceLevel], border: `1px solid ${perfColor[report.performanceLevel]}44` }}>
                                    {report.performanceLevel?.replace('_', ' ').toUpperCase()}
                                </span>
                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    {report.estimatedSkillLevel?.toUpperCase()} LEVEL
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{sub.correct_answers}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Correct</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{sub.total_questions - sub.correct_answers}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wrong</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Feedback */}
                    {report.overallFeedback && (
                        <div style={{ gridColumn: '1/-1', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', color: '#8b5cf6' }}><Sparkles size={16} /> AI Feedback</h4>
                            <p style={{ margin: 0, lineHeight: 1.6 }}>{report.overallFeedback}</p>
                        </div>
                    )}

                    {report.strengths?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#10b981' }}>✅ Strengths</h4>
                            {report.strengths.map((s, i) => <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 6 }}><Check size={13} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />{s}</p>)}
                        </div>
                    )}

                    {report.weaknesses?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#ef4444' }}>❌ Areas to Improve</h4>
                            {report.weaknesses.map((w, i) => <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 6 }}><AlertCircle size={13} style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />{w}</p>)}
                        </div>
                    )}

                    {report.recommendations?.length > 0 && (
                        <div style={{ gridColumn: '1/-1', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#f59e0b' }}>💡 Recommendations</h4>
                            {report.recommendations.map((r, i) => <p key={i} style={{ margin: '0 0 6px 0', fontSize: '0.85rem', paddingLeft: '1rem', borderLeft: '2px solid #f59e0b' }}>{r}</p>)}
                        </div>
                    )}

                    {/* Question-by-question */}
                    {sub.answers?.length > 0 && (
                        <div style={{ gridColumn: '1/-1' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>Question Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {sub.answers.map((a, i) => (
                                    <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${a.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: a.code ? '0.75rem' : 0 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{i + 1}. {a.question}</p>
                                                {a.code && <pre style={{ margin: '0.5rem 0 0 0', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', overflow: 'auto' }}>{a.code}</pre>}
                                            </div>
                                            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: a.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: a.isCorrect ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                                                {a.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                                            <span>Student: <strong style={{ color: a.isCorrect ? '#10b981' : '#ef4444' }}>{a.studentAnswer || 'No answer'}</strong></span>
                                            {!a.isCorrect && <span>Correct: <strong style={{ color: '#10b981' }}>{a.correctAnswer}</strong></span>}
                                        </div>
                                        {a.explanation && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>💡 {a.explanation}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // === SUBMISSIONS VIEW ===
    if (view === 'submissions' && selectedTest) {
        const avgScore = submissions.length ? Math.round(submissions.reduce((a, s) => a + Number(s.score || 0), 0) / submissions.length) : 0
        const passed = submissions.filter(s => s.status === 'passed').length

        return (
            <div className="animate-fadeIn">
                {toast.msg && (
                    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{toast.msg}</div>
                )}
                <button onClick={() => { setView('list'); setSelectedTest(null); setSubmissions([]) }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back to MCQ List
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{selectedTest.title}</h2>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{submissions.length} submissions</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search student..." value={searchSub} onChange={e => setSearchSub(e.target.value)}
                                style={{ padding: '0.5rem 0.75rem 0.5rem 1.9rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'inherit', fontSize: '0.82rem', width: 180, outline: 'none' }} />
                        </div>
                        <button onClick={exportExcel} disabled={!submissions.length}
                            style={{ padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5, opacity: !submissions.length ? 0.5 : 1 }}>
                            <Download size={14} /> Excel
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total Submissions', value: submissions.length, color: '#3b82f6' },
                        { label: 'Avg Score', value: avgScore + '%', color: '#8b5cf6' },
                        { label: 'Passed', value: passed, color: '#10b981' },
                        { label: 'Failed', value: submissions.length - passed, color: '#ef4444' }
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                {filteredSubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <BarChart2 size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p>No submissions yet</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-card)', textAlign: 'left' }}>
                                    {['#', 'Student', 'Score', 'Correct', 'Status', 'Performance', 'Submitted', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubs.map((sub, i) => {
                                    const perf = sub.ai_report?.performanceLevel
                                    return (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{sub.student_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.student_email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ fontWeight: 700, color: sub.score >= 70 ? '#10b981' : sub.score >= 40 ? '#f59e0b' : '#ef4444', fontSize: '1rem' }}>{sub.score}%</span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{sub.correct_answers}/{sub.total_questions}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: sub.status === 'passed' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sub.status === 'passed' ? '#10b981' : '#ef4444' }}>
                                                    {sub.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {perf && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: `${perfColor[perf]}22`, color: perfColor[perf] }}>
                                                    {perf.replace('_', ' ')}
                                                </span>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <button onClick={() => { setSelectedSubmission(sub); setView('report') }}
                                                    style={{ padding: '4px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', color: '#8b5cf6', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    AI Report
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    // === CREATE VIEW ===
    if (view === 'create') {
        return (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height, 72px) - 5rem)', minHeight: 0 }}>
                {toast.msg && (
                    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 99999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '0.85rem 1.4rem', borderRadius: '12px', fontWeight: 700, boxShadow: '0 12px 32px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 400, fontSize: '0.9rem', animation: 'slideInRight 0.2s ease' }}><span style={{ fontSize: '1.15rem' }}>{toast.type === 'error' ? '❌' : '✅'}</span> {toast.msg}</div>
                )}

                {/* Header — pinned, never scrolls */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', padding: '0.45rem 0.875rem', fontSize: '0.85rem' }}>
                        <ArrowLeft size={15} /> Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Create MCQ Test</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Fill in settings, choose a category, then add questions</p>
                    </div>
                </div>

                {/* Scrollable form body — only this area scrolls */}
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px' }}>
                <form id="mcq-create-form" onSubmit={handleSave}>
                    {/* STEP 1: Category Selection — multi-select cards */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ ...labelStyle, fontSize: '0.88rem', marginBottom: '0.75rem', display: 'block' }}>
                            📂 Test Categories <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(select one or more)</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                            {MCQ_CATEGORIES.map(cat => {
                                const catClr = { technical: '#3b82f6', debug: '#f59e0b', pseudocode: '#8b5cf6' }[cat.value]
                                const selected = form.categories.includes(cat.value)
                                return (
                                    <button key={cat.value} type="button" onClick={() => {
                                        setForm(p => ({
                                            ...p,
                                            categories: selected
                                                ? p.categories.filter(c => c !== cat.value)
                                                : [...p.categories, cat.value]
                                        }))
                                    }}
                                        style={{ padding: '1rem 1.25rem', background: selected ? `${catClr}18` : 'var(--bg-card)', border: `2px solid ${selected ? catClr : 'var(--border-color)'}`, borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative' }}>
                                        {selected && <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: catClr, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#fff" /></div>}
                                        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{cat.label.split(' ')[0]}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selected ? catClr : 'inherit', marginBottom: 4 }}>{cat.label.split(' ').slice(1).join(' ')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{cat.desc}</div>
                                    </button>
                                )
                            })}
                        </div>
                        {form.categories.length === 0 && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>⚠️ Please select at least one category.</p>}
                        {form.categories.length > 1 && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#3b82f6' }}>ℹ️ AI will generate questions mixing all selected categories.</p>}
                    </div>

                    {/* STEP 2: Test Settings — horizontal row */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 700 }}>⚙️ Test Settings</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                            <div>
                                <label style={labelStyle}>Test Title *</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Python Basics MCQ" required style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Difficulty</label>
                                <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={inputStyle}>
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Time Limit (min)</label>
                                <input type="number" min={5} max={180} value={form.time_limit} onChange={e => setForm(p => ({ ...p, time_limit: Number(e.target.value) }))} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Deadline (optional)</label>
                                <input type="datetime-local" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.875rem' }}>
                            <div>
                                <label style={labelStyle}>Pass Mark (%)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="range" min={10} max={100} step={5} value={form.pass_mark} onChange={e => setForm(p => ({ ...p, pass_mark: Number(e.target.value) }))} style={{ flex: 1, accentColor: form.pass_mark >= 80 ? '#ef4444' : form.pass_mark >= 60 ? '#f59e0b' : '#10b981' }} />
                                    <span style={{ minWidth: 44, fontWeight: 800, fontSize: '1rem', color: form.pass_mark >= 80 ? '#ef4444' : form.pass_mark >= 60 ? '#f59e0b' : '#10b981', textAlign: 'right' }}>{form.pass_mark}%</span>
                                </div>
                                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Students must score ≥ {form.pass_mark}% to pass</p>
                            </div>
                            <div>
                                <label style={labelStyle}>Max Attempts</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 5].map(n => (
                                        <button key={n} type="button" onClick={() => setForm(p => ({ ...p, max_attempts: n }))}
                                            style={{ flex: 1, padding: '0.45rem', border: `1.5px solid ${form.max_attempts === n ? '#3b82f6' : 'var(--border-color)'}`, borderRadius: '8px', background: form.max_attempts === n ? 'rgba(59,130,246,0.15)' : 'transparent', color: form.max_attempts === n ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                                            {n === 1 ? '1×' : n === 5 ? '5× (unlimited)' : `${n}×`}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>How many times students can attempt</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.875rem' }}>
                            <label style={labelStyle}>Description (optional)</label>
                            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Briefly describe what this test covers..." style={inputStyle} />
                        </div>
                    </div>

                    {/* STEP 3: Proctoring Settings */}
                    <div style={{ background: 'var(--bg-card)', border: `1px solid ${form.proctoring.enabled ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`, borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', transition: 'border-color 0.2s' }}>
                        {/* Header toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={18} color={form.proctoring.enabled ? '#ef4444' : 'var(--text-muted)'} />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: form.proctoring.enabled ? '#ef4444' : 'inherit' }}>Proctoring Settings</h4>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitor students during test to prevent cheating</p>
                                </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{form.proctoring.enabled ? 'Enabled' : 'Disabled'}</span>
                                <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, enabled: !p.proctoring.enabled } }))}
                                    style={{ width: 44, height: 24, borderRadius: '999px', background: form.proctoring.enabled ? '#ef4444' : 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                    <div style={{ position: 'absolute', top: 2, left: form.proctoring.enabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                                </div>
                            </label>
                        </div>

                        {form.proctoring.enabled && (
                            <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
                                {/* Tab Switch Detection */}
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                            <TabletSmartphone size={15} color="#ef4444" /> Tab Switch Guard
                                        </div>
                                        <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, trackTabSwitches: !p.proctoring.trackTabSwitches } }))}
                                            style={{ width: 36, height: 20, borderRadius: '999px', background: form.proctoring.trackTabSwitches ? '#ef4444' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.proctoring.trackTabSwitches ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detect when student switches tabs or windows</p>
                                    {form.proctoring.trackTabSwitches && (
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '0.72rem' }}>Max tab switches allowed</label>
                                            <input type="number" min={1} max={20} value={form.proctoring.maxTabSwitches}
                                                onChange={e => setForm(p => ({ ...p, proctoring: { ...p.proctoring, maxTabSwitches: Number(e.target.value) } }))}
                                                style={{ ...inputStyle, fontSize: '0.82rem' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Clipboard / Copy-Paste */}
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                            <Clipboard size={15} color="#f59e0b" /> Disable Copy-Paste
                                        </div>
                                        <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, disableCopyPaste: !p.proctoring.disableCopyPaste } }))}
                                            style={{ width: 36, height: 20, borderRadius: '999px', background: form.proctoring.disableCopyPaste ? '#f59e0b' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.proctoring.disableCopyPaste ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Block Ctrl+C, Ctrl+V and right-click during the test</p>
                                </div>

                                {/* Fullscreen */}
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                            <Monitor size={15} color="#8b5cf6" /> Require Fullscreen
                                        </div>
                                        <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, requireFullscreen: !p.proctoring.requireFullscreen } }))}
                                            style={{ width: 36, height: 20, borderRadius: '999px', background: form.proctoring.requireFullscreen ? '#8b5cf6' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.proctoring.requireFullscreen ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Force student browser into fullscreen mode</p>
                                </div>

                                {/* Webcam */}
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                            <Camera size={15} color="#10b981" /> Webcam Monitoring
                                        </div>
                                        <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, enableWebcam: !p.proctoring.enableWebcam } }))}
                                            style={{ width: 36, height: 20, borderRadius: '999px', background: form.proctoring.enableWebcam ? '#10b981' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.proctoring.enableWebcam ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Record webcam to detect presence and identity</p>
                                    {form.proctoring.enableWebcam && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.proctoring.detectMultipleFaces}
                                                onChange={e => setForm(p => ({ ...p, proctoring: { ...p.proctoring, detectMultipleFaces: e.target.checked } }))} />
                                            Detect multiple faces (AI flag)
                                        </label>
                                    )}
                                </div>

                                {/* Auto-submit */}
                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem', gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
                                            <AlertCircle size={15} color="#ef4444" /> Auto-Submit on Violations
                                        </div>
                                        <div onClick={() => setForm(p => ({ ...p, proctoring: { ...p.proctoring, autoSubmitOnViolation: !p.proctoring.autoSubmitOnViolation } }))}
                                            style={{ width: 36, height: 20, borderRadius: '999px', background: form.proctoring.autoSubmitOnViolation ? '#ef4444' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                            <div style={{ position: 'absolute', top: 2, left: form.proctoring.autoSubmitOnViolation ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>Automatically submit the test when student exceeds the violation limit</p>
                                        {form.proctoring.autoSubmitOnViolation && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Max violations:</label>
                                                <input type="number" min={1} max={20} value={form.proctoring.maxViolations}
                                                    onChange={e => setForm(p => ({ ...p, proctoring: { ...p.proctoring, maxViolations: Number(e.target.value) } }))}
                                                    style={{ ...inputStyle, width: 70 }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STEP 4: AI Generator + Questions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>
                        {/* AI Generator Panel */}
                        <div style={{ position: 'sticky', top: 0 }}>
                            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08))', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '14px', padding: '1.25rem' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Sparkles size={16} /> AI Question Generator
                                </h4>

                                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.875rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                    <strong style={{ color: '#8b5cf6' }}>How it works:</strong> Describe the topic and AI will generate 5 questions matching your selected
                                    {' '}<em>{form.categories.map(c => MCQ_CATEGORIES.find(m => m.value === c)?.label).join(' + ') || 'category'}</em>
                                    {' '}at <em>{form.difficulty}</em> difficulty.
                                    <br /><br />
                                    <strong style={{ color: '#8b5cf6' }}>Examples:</strong>
                                    <div style={{ marginTop: 4 }}>
                                        {['Python list comprehensions and generators', 'SQL JOIN and GROUP BY operations', 'Binary search and time complexity', 'React hooks and state management'].map(ex => (
                                            <div key={ex} onClick={() => setAiPrompt(ex)} style={{ padding: '3px 8px', margin: '2px 0', borderRadius: '6px', cursor: 'pointer', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                                💡 {ex}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder="Type your topic here, e.g: Python list comprehensions and lambda functions"
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical', fontSize: '0.82rem', marginBottom: '0.75rem' }}
                                />
                                <button type="button" onClick={handleAIGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                                    style={{ width: '100%', padding: '0.65rem', background: aiGenerating ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: aiGenerating ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Sparkles size={15} />
                                    {aiGenerating ? 'Generating...' : 'Generate 5 Questions'}
                                </button>
                            </div>
                        </div>

                        {/* Questions Panel */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                    📝 Questions <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({form.questions.length})</span>
                                </h4>
                                <button type="button" onClick={addQuestion}
                                    style={{ padding: '0.4rem 0.875rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Plus size={14} /> Add Question
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {form.questions.map((q, idx) => (
                                    <div key={q.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.88rem', padding: '3px 12px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.25)' }}>Q{idx + 1}</span>
                                            {form.questions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(idx)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                                                    <X size={13} /> Remove
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '0.6rem' }}>
                                            <label style={labelStyle}>Question *</label>
                                            <textarea value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)} placeholder="Enter your question text..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                                        </div>

                                        {(form.categories.includes('debug') || form.categories.includes('pseudocode') || q.code) && (
                                            <div style={{ marginBottom: '0.6rem' }}>
                                                <label style={labelStyle}>Code Snippet <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional{form.categories.some(c => c === 'debug' || c === 'pseudocode') ? ' — recommended for debug/pseudocode' : ''})</span></label>
                                                <textarea value={q.code} onChange={e => updateQuestion(idx, 'code', e.target.value)} placeholder="Paste code here..." rows={4} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', background: 'rgba(0,0,0,0.25)' }} />
                                            </div>
                                        )}
                                        {form.categories.every(c => c === 'technical') && !q.code && (
                                            <button type="button" onClick={() => updateQuestion(idx, 'code', ' ')} style={{ marginBottom: '0.6rem', padding: '3px 10px', background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                + Add code snippet (optional)
                                            </button>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                            {['A', 'B', 'C', 'D'].map((opt, oIdx) => (
                                                <div key={opt} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0, background: q.correct_answer === opt ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', color: q.correct_answer === opt ? '#10b981' : 'var(--text-muted)', border: `1px solid ${q.correct_answer === opt ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}` }}>{opt}</span>
                                                    <input value={q.options[oIdx]} onChange={e => updateOption(idx, oIdx, e.target.value)} placeholder={`Option ${opt}`} style={{ ...inputStyle, flex: 1, fontSize: '0.83rem' }} />
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.75rem' }}>
                                            <div>
                                                <label style={labelStyle}>Correct Answer</label>
                                                <select value={q.correct_answer} onChange={e => updateQuestion(idx, 'correct_answer', e.target.value)} style={{ ...inputStyle, fontWeight: 700, color: '#10b981' }}>
                                                    {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Explanation (shown after submit)</label>
                                                <input value={q.explanation} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} placeholder="Why is this the correct answer?" style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={addQuestion}
                                    style={{ padding: '0.75rem', background: 'transparent', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '12px', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Plus size={15} /> Add Another Question
                                </button>
                            </div>
                        </div>
                    </div>

                </form>
                </div>

                {/* Footer — pinned to bottom, always visible, never scrolls */}
                <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary, #0f172a)', padding: '1rem 1.5rem', boxShadow: '0 -4px 20px rgba(0,0,0,0.18)' }}>
                    <button type="button" onClick={() => setView('list')} style={{ padding: '0.7rem 1.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600 }}>Cancel</button>
                    <button type="submit" form="mcq-create-form" disabled={saving} style={{ padding: '0.7rem 2rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {saving ? '⏳ Creating...' : '🚀 Create MCQ Test'}
                    </button>
                </div>
            </div>
        )
    }

    // === LIST VIEW ===
    return (
        <div className="animate-fadeIn">
            {toast.msg && (
                <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 99999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '0.85rem 1.4rem', borderRadius: '12px', fontWeight: 700, boxShadow: '0 12px 32px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 420, minWidth: 200, fontSize: '0.9rem' }}>
                    <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{toast.type === 'error' ? '❌' : '✅'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>MCQ Manager</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Create and manage multiple-choice question tests with AI evaluation</p>
                </div>
                <button onClick={() => setView('create')} style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={16} /> Create MCQ Test
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Tests', value: tests.length, color: '#3b82f6' },
                    { label: 'Technical', value: tests.filter(t => t.category === 'technical').length, color: '#10b981' },
                    { label: 'Debug', value: tests.filter(t => t.category === 'debug').length, color: '#f59e0b' },
                    { label: 'Pseudocode', value: tests.filter(t => t.category === 'pseudocode').length, color: '#8b5cf6' },
                    { label: 'Total Submissions', value: tests.reduce((a, t) => a + (t.submissionCount || 0), 0), color: '#06b6d4' }
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {tests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <Brain size={52} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No MCQ tests yet</p>
                    <p style={{ fontSize: '0.87rem' }}>Create your first MCQ test to get started</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {tests.map(test => (
                        <div key={test.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
                                    {(test.categories || [test.category]).map(cat => (
                                        <span key={cat} style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: `${catColor[cat]}22`, color: catColor[cat], border: `1px solid ${catColor[cat]}44` }}>
                                            {MCQ_CATEGORIES.find(c => c.value === cat)?.label || cat}
                                        </span>
                                    ))}
                                    <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: `${diffColor[test.difficulty]}22`, color: diffColor[test.difficulty], border: `1px solid ${diffColor[test.difficulty]}44` }}>
                                        {test.difficulty}
                                    </span>
                                </div>
                                {test.proctoring_config?.enabled && (
                                    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Shield size={10} /> Proctored
                                    </span>
                                )}
                            </div>

                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{test.title}</h3>
                                {test.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{test.description}</p>}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span>📝 {test.questions?.length || 0} questions</span>
                                <span>⏱ {test.time_limit} min</span>
                                <span>👥 {test.submissionCount || 0} submissions</span>
                                {test.proctoring_config?.enabled && <span style={{ color: '#ef4444' }}>🔒 Proctored</span>}
                            </div>

                            {/* Live/End status bar */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', borderRadius: '8px', background: test.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)', border: `1px solid ${test.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: test.is_active ? '#10b981' : '#64748b', display: 'inline-block', boxShadow: test.is_active ? '0 0 6px #10b981' : 'none' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: test.is_active ? '#10b981' : '#64748b' }}>{test.is_active ? 'LIVE' : 'ENDED'}</span>
                                </div>
                                <button onClick={() => handleToggleLive(test)}
                                    style={{ padding: '0.3rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: test.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: test.is_active ? '#ef4444' : '#10b981' }}>
                                    {test.is_active ? <><StopCircle size={12} /> End</> : <><Radio size={12} /> Go Live</>}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <button onClick={() => openSubmissions(test)}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <BarChart2 size={13} /> Submissions
                                </button>
                                <button onClick={() => { setAssignModal(test); setSelectedStudents([]); setAssignMode('all'); setStudentSearch('') }}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Users size={13} /> Assign
                                </button>
                                <button onClick={() => handleDelete(test.id)}
                                    style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflow: 'auto' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>Assign MCQ Test</h3>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{assignModal.title}</p>
                            </div>
                            <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
                        </div>

                        {/* Mode Tabs */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            {[{ id: 'all', icon: '🌐', label: 'Assign All' }, { id: 'individual', icon: '👤', label: 'Individual' }, { id: 'batch', icon: '👥', label: 'Batch' }].map(tab => (
                                <button key={tab.id} type="button" onClick={() => { setAssignMode(tab.id); setSelectedStudents([]); setStudentSearch('') }}
                                    style={{ padding: '0.5rem 0.25rem', background: assignMode === tab.id ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', border: 'none', borderRadius: '8px', color: assignMode === tab.id ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s' }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Assign All Mode */}
                        {assignMode === 'all' && (
                            <div style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{students.length}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.4rem 0 1.25rem 0' }}>students will receive this MCQ test</div>
                                <button onClick={handleAssign} disabled={assigning}
                                    style={{ padding: '0.8rem 2rem', background: assigning ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: assigning ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    {assigning ? '⏳ Assigning...' : `🚀 Assign to All ${students.length} Students`}
                                </button>
                            </div>
                        )}

                        {/* Individual Mode */}
                        {assignMode === 'individual' && (
                            <div>
                                <input type="text" placeholder="🔍 Search student by name or email..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: '0.75rem' }} />
                                <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '0.75rem' }}>
                                    {students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students match your search</p>
                                    ) : students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                        <button key={s.id} type="button" onClick={() => handleAssignIndividual(s.id, s.name)} disabled={assigning}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: assigning ? 'not-allowed' : 'pointer', textAlign: 'left', color: 'inherit', transition: 'background 0.1s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                            </div>
                                            <span style={{ padding: '3px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>Assign →</span>
                                        </button>
                                    ))}
                                </div>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>Click a student row to instantly assign this test.</p>
                            </div>
                        )}

                        {/* Batch Mode */}
                        {assignMode === 'batch' && (
                            <div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input type="text" placeholder="🔍 Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button type="button"
                                        onClick={() => setSelectedStudents(students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => s.id))}
                                        style={{ padding: '0.5rem 0.875rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Select All</button>
                                    {selectedStudents.length > 0 && <button type="button" onClick={() => setSelectedStudents([])}
                                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Clear</button>}
                                </div>
                                <div style={{ maxHeight: '260px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '0.875rem' }}>
                                    {students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.87rem', background: selectedStudents.includes(s.id) ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                                            <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={e => {
                                                if (e.target.checked) setSelectedStudents(p => [...p, s.id])
                                                else setSelectedStudents(p => p.filter(id => id !== s.id))
                                            }} style={{ cursor: 'pointer' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                            </div>
                                            {selectedStudents.includes(s.id) && <span style={{ color: '#3b82f6', fontSize: '0.72rem', fontWeight: 700 }}>✓</span>}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setAssignModal(null)} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>Cancel</button>
                                    <button onClick={handleAssign} disabled={assigning || selectedStudents.length === 0}
                                        style={{ flex: 2, padding: '0.7rem', background: selectedStudents.length === 0 ? 'rgba(139,92,246,0.25)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                                        {assigning ? '⏳ Assigning...' : selectedStudents.length === 0 ? 'Select students first' : `Assign to ${selectedStudents.length} student(s)`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {assignMode !== 'batch' && (
                            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                                <button onClick={() => setAssignModal(null)} style={{ padding: '0.55rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const inputStyle = {
    padding: '0.6rem 0.875rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'inherit',
    fontSize: '0.87rem',
    outline: 'none',
    width: '100%'
}
const labelStyle = { display: 'block', fontSize: '0.79rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }
const catColor = { technical: '#3b82f6', debug: '#f59e0b', pseudocode: '#8b5cf6' }
const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
const perfColor = { excellent: '#10b981', good: '#3b82f6', average: '#f59e0b', needs_improvement: '#ef4444' }
