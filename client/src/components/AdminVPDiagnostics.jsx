/**
 * AdminVPDiagnostics — 3-level admin view of student diagnostic results.
 *
 * Level 1: Student list  (Name, Email, Tests Taken, Weak Topics count)
 * Level 2: Student's test attempts list (Test Name, Status, Stage, Marks)
 * Level 3: Full test detail (Weak Topics, Score, Accuracy, IRT, Plan, etc.)
 */
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, RefreshCw, User, Brain, BookOpen, Target, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/vp'

// ── helpers ───────────────────────────────────────────────────────────────────
const pct   = n => (n == null ? '—' : `${Math.round(n * 100)}%`)
const dt    = v => v ? new Date(v).toLocaleString() : '—'
const theta2label = t => {
    if (t == null) return '—'
    if (t < -1)  return 'Foundation'
    if (t < 0.5) return 'Developing'
    if (t < 1.5) return 'Proficient'
    return 'Advanced'
}
const theta2color = t => {
    if (t == null) return '#6b7280'
    if (t < -1)  return '#ef4444'
    if (t < 0.5) return '#f59e0b'
    if (t < 1.5) return '#3b82f6'
    return '#10b981'
}
const modeName = m => {
    if (!m) return 'Diagnostic Test'
    if (m === 'irt') return 'IRT Adaptive Test'
    if (m === 'student_choice' || m === 'student-choice') return 'Student-Choice Test'
    return m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── styled primitives ─────────────────────────────────────────────────────────
const card = { background: 'var(--bg-secondary,#1e2133)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, border: '1px solid var(--border-color,rgba(255,255,255,0.06))' }
const badge = (col) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: `${col}22`, color: col, border: `1px solid ${col}44` })

function StatPill({ label, value, color = '#3b82f6' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 2 }}>{label}</span>
        </div>
    )
}

function SectionToggle({ title, icon: Icon, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <button onClick={() => setOpen(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                {Icon && <Icon size={16} style={{ opacity: 0.7 }} />}
                <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
        </div>
    )
}

function BackButton({ onClick, label = 'Back' }) {
    return (
        <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'inherit', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> {label}
        </button>
    )
}

// ── LEVEL 3: Full detail for one test attempt ─────────────────────────────────
function TestDetail({ studentData, attemptId, onBack }) {
    const { student, diagnostic_state, attempts, ability, mastery, lesson_progress } = studentData
    const attempt = attempts.find(a => a.id === attemptId) || attempts[0]

    // Use per-attempt report_json ONLY — never fall back to diagnostic_state (which is another test's result)
    const result        = attempt?.report_json || {}
    const hasResult     = !!attempt?.report_json
    const accuracy      = result.percentage
    const weakTopics    = result.weak_topics || []
    const topicBreakdown = result.topic_breakdown || []

    // Per-attempt plan stored inline; fall back to student-level plan only for same attempt
    const attemptPlan   = attempt?.personalized_plan_json || studentData.plan
    const scoreColor = accuracy >= 50 ? '#10b981' : accuracy >= 25 ? '#f59e0b' : '#ef4444'

    return (
        <div>
            {/* Back + header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <BackButton onClick={onBack} label="Back to Tests" />
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {modeName(attempt?.mode)}
                        <span style={{ opacity: 0.45, fontWeight: 400, fontSize: '0.82rem', marginLeft: 8 }}>— {student.name}</span>
                    </div>
                    <div style={{ opacity: 0.45, fontSize: '0.78rem' }}>
                        {attempt ? `Submitted ${dt(attempt.submitted_at || attempt.created_at)}` : ''}
                    </div>
                </div>
                {attempt && (
                    <span style={{ ...badge(attempt.status === 'submitted' ? '#10b981' : '#f59e0b'), marginLeft: 'auto' }}>
                        {attempt.status}
                    </span>
                )}
            </div>

            {/* Top stat row */}
            {!hasResult
                ? (
                    <div style={{ ...card, color: '#f59e0b', fontSize: '0.88rem', opacity: 0.8 }}>
                        ⏳ This test has not been submitted yet — no results available.
                    </div>
                ) : (
                <div style={{ ...card, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatPill label="Score" value={result.score != null ? `${result.score}/${result.total_marks}` : '—'} color={scoreColor} />
                    <StatPill label="Accuracy" value={accuracy != null ? `${accuracy}%` : '—'} color={scoreColor} />
                    <StatPill label="Stage" value={result.stage || '—'} color="#8b5cf6" />
                    <StatPill label="Weak Topics" value={weakTopics.length} color="#f59e0b" />
                    <StatPill label="Attempts" value={attempts.length} color="#3b82f6" />
                    {ability.length > 0 && (
                        <StatPill label={`IRT θ (${ability[0].subject})`} value={Number(ability[0].theta).toFixed(2)} color={theta2color(ability[0].theta)} />
                    )}
                    <div style={{ marginLeft: 'auto', opacity: 0.45, fontSize: '0.75rem' }}>
                        Completed {dt(diagnostic_state.completed_at)}
                    </div>
                </div>
            )}

            {/* Weak Topics — only shown when test has results */}
            {hasResult && weakTopics.length > 0 && (
                <SectionToggle title={`Weak Topics (${weakTopics.length})`} icon={AlertCircle} defaultOpen={true}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                        {weakTopics.map((wt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 16px' }}>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{wt.topic}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.55, marginTop: 1 }}>{wt.subject}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{wt.percentage}%</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{wt.score}/{wt.total} marks · {wt.attempts} q</div>
                                </div>
                                <div style={{ width: 70, flexShrink: 0 }}>
                                    <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${wt.percentage}%`, background: '#ef4444', borderRadius: 4 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionToggle>
            )}

            {/* Full Topic Breakdown — only when results exist */}
            {hasResult && topicBreakdown.length > 0 && (
                <SectionToggle title={`All Topics Breakdown (${topicBreakdown.length})`} icon={Target}>
                    <div style={{ overflowX: 'auto', marginTop: 4 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                    {['Topic', 'Subject', 'Score', 'Accuracy', 'Questions'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topicBreakdown.map((t, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{t.topic}</td>
                                        <td style={{ padding: '8px 10px', opacity: 0.6 }}>{t.subject}</td>
                                        <td style={{ padding: '8px 10px' }}>{t.score}/{t.total}</td>
                                        <td style={{ padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 70, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${t.percentage}%`, background: t.percentage >= 60 ? '#10b981' : t.percentage >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} />
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: t.percentage >= 60 ? '#10b981' : t.percentage >= 40 ? '#f59e0b' : '#ef4444' }}>{t.percentage}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 10px', opacity: 0.6 }}>{t.attempts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionToggle>
            )}

            {/* Personalized Plan — only when results exist */}
            {hasResult && attemptPlan && (
                <SectionToggle title={attemptPlan.title || 'Personalized Plan'} icon={Target} defaultOpen={true}>
                    {attemptPlan.detail?.weekly_goals?.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginTop: 8, marginBottom: 16 }}>
                            {attemptPlan.detail.weekly_goals.map((w, i) => (
                                <div key={i} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '12px 14px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#818cf8', marginBottom: 4 }}>Week {i + 1}</div>
                                    <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>{w}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {attemptPlan.detail?.topic_plans?.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.55, marginBottom: 8 }}>Topic-wise Plan</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {attemptPlan.detail.topic_plans.map((tp, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.87rem' }}>{tp.topic}</span>
                                            <span style={{ ...badge('#f59e0b'), marginLeft: 'auto' }}>{tp.current_pct}% → {tp.target_pct}%</span>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: 6 }}>{tp.why_struggle}</div>
                                        {tp.weekly_focus?.map((wf, wi) => (
                                            <div key={wi} style={{ fontSize: '0.76rem', opacity: 0.6, paddingLeft: 10, borderLeft: '2px solid rgba(99,102,241,0.3)', marginBottom: 3 }}>{wf}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </SectionToggle>
            )}

            {/* IRT Ability */}
            <SectionToggle title={`IRT Ability by Subject (${ability.length})`} icon={Target}>
                {ability.length === 0
                    ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No ability data yet.</p>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        {ability.map(a => (
                            <div key={a.subject} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 18px', minWidth: 160, border: `1px solid ${theta2color(a.theta)}44` }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.55, marginBottom: 4 }}>{a.subject}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: theta2color(a.theta) }}>{Number(a.theta).toFixed(2)}</div>
                                <div style={{ fontSize: '0.75rem', marginTop: 2, color: theta2color(a.theta) }}>{theta2label(a.theta)}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.45, marginTop: 4 }}>{a.n_responses} responses</div>
                            </div>
                        ))}
                    </div>
                }
            </SectionToggle>

            {/* Concept Mastery */}
            <SectionToggle title={`Concept Mastery (${mastery.length})`} icon={CheckCircle}>
                {mastery.length === 0
                    ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No mastery data yet.</p>
                    : <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                    {['Concept', 'Subject', 'Mastery', 'Reps', 'Next Due'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {mastery.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{m.concept_title}</td>
                                        <td style={{ padding: '8px 10px', opacity: 0.65 }}>{m.subject}</td>
                                        <td style={{ padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 80, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: pct(m.p_mastery), background: m.p_mastery >= 0.7 ? '#10b981' : m.p_mastery >= 0.4 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{pct(m.p_mastery)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 10px', opacity: 0.65 }}>{m.reps}</td>
                                        <td style={{ padding: '8px 10px', opacity: 0.65 }}>{dt(m.next_due)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                }
            </SectionToggle>

            {/* Lesson Progress */}
            <SectionToggle title={`Lesson Progress (${lesson_progress.length})`} icon={BookOpen}>
                {lesson_progress.length === 0
                    ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No lessons started yet.</p>
                    : <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                    {['Lesson', 'Subject', 'Status', 'Mastery'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {lesson_progress.map((lp, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{lp.title}</td>
                                        <td style={{ padding: '8px 10px', opacity: 0.65 }}>{lp.subject}</td>
                                        <td style={{ padding: '8px 10px' }}>
                                            <span style={badge(lp.status === 'completed' ? '#10b981' : lp.status === 'in_progress' ? '#3b82f6' : '#6b7280')}>{lp.status}</span>
                                        </td>
                                        <td style={{ padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 70, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${lp.mastery_pct ?? 0}%`, background: lp.mastery_pct >= 70 ? '#10b981' : lp.mastery_pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{lp.mastery_pct ?? 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                }
            </SectionToggle>
        </div>
    )
}

// ── LEVEL 2: All tests for one student ────────────────────────────────────────
function StudentTestsList({ studentId, onBack, onViewTest }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(null)

    useEffect(() => {
        setLoading(true)
        axios.get(`${BASE}/admin/student-diagnostics/${studentId}`)
            .then(r => { setData(r.data); setLoading(false) })
            .catch(e => { setErr(e.response?.data?.error || e.message); setLoading(false) })
    }, [studentId])

    if (loading) return <div className="loading-spinner" />
    if (err) return <div style={{ color: '#f87171', padding: 20 }}>Error: {err}</div>
    if (!data) return null

    const { student, attempts, diagnostic_state } = data
    const result = diagnostic_state?.result_json || {}
    // For the summary strip, use latest attempt's report or fall back to diagnostic_state
    const latestReport = attempts[0]?.report_json || result
    const overallStage = latestReport.stage

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <BackButton onClick={onBack} label="Back to Students" />
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{student.name}</div>
                    <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>{student.email}</div>
                </div>
                <span style={{ ...badge(diagnostic_state?.diagnostic_done ? '#10b981' : '#f59e0b'), marginLeft: 'auto' }}>
                    {diagnostic_state?.diagnostic_done ? 'Diagnostic Complete' : 'Pending'}
                </span>
            </div>

            {/* Summary strip — based on latest attempt */}
            {latestReport.percentage != null && (
                <div style={{ ...card, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
                    <StatPill label="Tests Taken" value={attempts.length} color="#3b82f6" />
                    <StatPill label="Score" value={latestReport.score != null ? `${latestReport.score}/${latestReport.total_marks}` : '—'} color={latestReport.percentage >= 50 ? '#10b981' : latestReport.percentage >= 25 ? '#f59e0b' : '#ef4444'} />
                    <StatPill label="Accuracy" value={latestReport.percentage != null ? `${latestReport.percentage}%` : '—'} color={latestReport.percentage >= 50 ? '#10b981' : latestReport.percentage >= 25 ? '#f59e0b' : '#ef4444'} />
                    <StatPill label="Stage" value={overallStage || '—'} color="#8b5cf6" />
                    <StatPill label="Weak Topics" value={(latestReport.weak_topics || []).length} color="#f59e0b" />
                </div>
            )}

            {/* Tests table */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Brain size={16} style={{ opacity: 0.6 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tests ({attempts.length})</span>
                </div>
                {attempts.length === 0
                    ? <div style={{ padding: '32px 20px', textAlign: 'center', opacity: 0.4, fontSize: '0.85rem' }}>No tests taken yet.</div>
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                                <thead>
                                    <tr style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                        {['#', 'Test Name', 'Status', 'Stage', 'Marks', 'Weak Topics', 'Date', ''].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((a, idx) => {
                                        const isLatest = idx === 0
                                        const aReport = a.report_json || {}
                                        const aStage = aReport.stage
                                        const aPct = aReport.percentage
                                        const aWt = (aReport.weak_topics || []).length
                                        return (
                                            <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '10px 16px', opacity: 0.4 }}>{attempts.length - idx}</td>
                                                <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                                                    {modeName(a.mode)}
                                                    {a.subject ? <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '0.78rem', marginLeft: 6 }}>({a.subject})</span> : null}
                                                    {isLatest && <span style={{ ...badge('#6366f1'), marginLeft: 8, fontSize: '0.65rem' }}>latest</span>}
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <span style={badge(a.status === 'submitted' ? '#10b981' : '#f59e0b')}>{a.status}</span>
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    {aStage
                                                        ? <span style={badge('#8b5cf6')}>{aStage}</span>
                                                        : <span style={{ opacity: 0.35 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '10px 16px', fontWeight: 700 }}>
                                                    {a.score != null
                                                        ? <span style={{ color: aPct >= 50 ? '#10b981' : aPct >= 25 ? '#f59e0b' : '#ef4444' }}>
                                                            {a.score} / {a.total_marks ?? '?'}
                                                            {aPct != null && <span style={{ opacity: 0.55, fontWeight: 400, fontSize: '0.78rem', marginLeft: 6 }}>({aPct}%)</span>}
                                                          </span>
                                                        : '—'}
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    {aWt > 0
                                                        ? <span style={badge('#f87171')}>{aWt} weak</span>
                                                        : <span style={{ opacity: 0.35 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '10px 16px', opacity: 0.5, fontSize: '0.78rem' }}>{dt(a.submitted_at || a.created_at)}</td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <button
                                                        onClick={() => onViewTest(data, a.id)}
                                                        style={{ background: 'none', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        View →
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

// ── LEVEL 1: Student list ─────────────────────────────────────────────────────
export default function AdminVPDiagnostics() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState(null)
    const [search, setSearch] = useState('')
    const [view, setView] = useState(null)
    // view = null → student list
    // view = { level: 'tests', studentId } → student's tests
    // view = { level: 'detail', studentData, attemptId } → test detail

    const load = () => {
        setLoading(true)
        setErr(null)
        axios.get(`${BASE}/admin/student-diagnostics`)
            .then(r => { setRows(r.data.rows || []); setLoading(false) })
            .catch(e => { setErr(e.response?.data?.error || e.message); setLoading(false) })
    }

    useEffect(() => { load() }, [])

    if (view?.level === 'detail') {
        return (
            <TestDetail
                studentData={view.studentData}
                attemptId={view.attemptId}
                onBack={() => setView({ level: 'tests', studentId: view.studentData.student.id })}
            />
        )
    }

    if (view?.level === 'tests') {
        return (
            <StudentTestsList
                studentId={view.studentId}
                onBack={() => setView(null)}
                onViewTest={(studentData, attemptId) => setView({ level: 'detail', studentData, attemptId })}
            />
        )
    }

    const filtered = rows.filter(r => {
        const q = search.toLowerCase()
        return !q || r.student_name?.toLowerCase().includes(q) || r.student_email?.toLowerCase().includes(q)
    })

    const completedCount = rows.filter(r => r.diagnostic_done).length
    const pendingCount   = rows.length - completedCount

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Student Diagnostics</h2>
                    <p style={{ margin: '2px 0 0', opacity: 0.5, fontSize: '0.82rem' }}>Click View to see a student's tests and detailed results</p>
                </div>
                <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'inherit', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem' }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Students', value: rows.length, color: '#3b82f6' },
                    { label: 'Completed', value: completedCount, color: '#10b981' },
                    { label: 'Pending', value: pendingCount, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{ ...card, marginBottom: 0, flex: '1 1 100px', textAlign: 'center', padding: '16px 12px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', marginBottom: 16, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'inherit', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />

            {err && <div style={{ color: '#f87171', marginBottom: 12, fontSize: '0.85rem' }}>⚠ {err}</div>}

            {loading
                ? <div className="loading-spinner" />
                : filtered.length === 0
                    ? <div style={{ opacity: 0.45, textAlign: 'center', padding: '40px 0', fontSize: '0.9rem' }}>No students found.</div>
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                                <thead>
                                    <tr style={{ opacity: 0.5, fontSize: '0.75rem' }}>
                                        {['Student', 'Email', 'Tests Taken', 'Weak Topics', ''].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => {
                                        const result  = r.result_json || {}
                                        const wtCount = result.weak_topics?.length ?? 0
                                        return (
                                            <tr key={r.student_id}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <User size={13} />
                                                        </span>
                                                        {r.student_name || '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', opacity: 0.6 }}>{r.student_email}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={badge('#3b82f6')}>{r.tests_taken ?? 0} test{r.tests_taken !== 1 ? 's' : ''}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    {wtCount > 0
                                                        ? <span style={badge('#f87171')}>{wtCount} weak</span>
                                                        : <span style={{ opacity: 0.35 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <button
                                                        onClick={() => setView({ level: 'tests', studentId: r.student_id })}
                                                        style={{ background: 'none', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        View →
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
            }
        </div>
    )
}
