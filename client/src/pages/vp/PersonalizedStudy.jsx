/**
 * Personalized Study — combines BKT weak areas, IRT ability scores,
 * Bandit "best next lesson" pick, SRS review queue,
 * lesson reading history, and Smart Study syllabus/test data.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Brain, Target, Zap, RefreshCw, BookOpen,
    ChevronRight, Clock, TrendingUp, AlertTriangle,
    CheckCircle2, Loader2, BarChart3, FlaskConical,
    FileText, History, Youtube, FileDown
} from 'lucide-react'
import vpApi from '@/services/vp/api'

/* ── tiny style helpers ──────────────────────────────────────────────────── */
const card = (extra = {}) => ({
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 14, padding: '20px 22px',
    ...extra
})

const MASTERY_COLOR = (pct) => {
    if (pct >= 85) return '#10b981'
    if (pct >= 55) return '#f59e0b'
    return '#ef4444'
}

const THETA_LABEL = (theta) => {
    if (theta >= 2)  return { label: 'Expert',       color: '#10b981' }
    if (theta >= 1)  return { label: 'Advanced',     color: '#60a5fa' }
    if (theta >= 0)  return { label: 'Intermediate', color: '#f59e0b' }
    if (theta >= -1) return { label: 'Beginner',     color: '#f97316' }
    return                  { label: 'Novice',       color: '#ef4444' }
}

/* ── sub-components ─────────────────────────────────────────────────────── */
function MasteryBar({ pct, color }) {
    return (
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(148,163,184,0.12)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
    )
}

function SectionTitle({ icon, children, sub }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
                {icon} {children}
            </div>
            {sub && <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 3 }}>{sub}</div>}
        </div>
    )
}

/* ── DiagnosticPlansSection ─────────────────────────────────────────────── */
const WEEK_COLORS = [
    { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.35)', color: '#a5b4fc' },
    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)', color: '#fbbf24' },
    { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)', color: '#34d399' },
    { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',  color: '#f87171' },
]
const pctColor = (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444'

function PlanProgressBar({ pct, color }) {
    return (
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(148,163,184,0.1)', overflow: 'hidden', marginTop: 5 }}>
            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
    )
}

function TopicPlanExpanded({ tp }) {
    const [open, setOpen] = useState(false)
    const color = pctColor(tp.current_pct || 0)

    const downloadNotes = () => {
        const content = tp?.notes?.content || ''
        if (!content) return
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.download = tp.notes.file_name || 'notes.txt'; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{
            ...card({
                border: `1px solid ${color}28`,
                background: `linear-gradient(135deg, rgba(15,23,42,0.97), rgba(${tp.current_pct < 40 ? '239,68,68' : tp.current_pct < 70 ? '245,158,11' : '16,185,129'},0.03))`
            })
        }}>
            {/* ── Topic header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: `${color}18`, border: `1.5px solid ${color}45`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem', color
                }}>{tp.rank}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>{tp.topic}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{tp.why_struggle}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{tp.current_pct}%</span>
                    <span style={{ fontSize: '0.72rem', color: '#475569' }}> → </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pctColor(tp.target_pct || 70) }}>{tp.target_pct}%</span>
                </div>
            </div>
            <PlanProgressBar pct={tp.current_pct || 0} color={color} />

            {/* ── Weekly badges ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
                {(tp.weekly_focus || []).map((w, wIdx) => {
                    const wc = WEEK_COLORS[wIdx] || WEEK_COLORS[3]
                    const colonIdx = w.indexOf(':')
                    const wLabel = colonIdx > -1 ? w.slice(0, colonIdx).trim() : `Week ${wIdx + 1}`
                    const wBody  = colonIdx > -1 ? w.slice(colonIdx + 1).trim() : w
                    return (
                        <div key={wIdx} style={{
                            display: 'flex', gap: 9, alignItems: 'flex-start',
                            background: wc.bg, border: `1px solid ${wc.border}`,
                            borderRadius: 8, padding: '7px 11px'
                        }}>
                            <span style={{
                                flexShrink: 0, background: wc.border, color: wc.color,
                                borderRadius: 5, padding: '1px 7px', fontSize: '0.68rem',
                                fontWeight: 700, minWidth: 50, textAlign: 'center'
                            }}>{wLabel}</span>
                            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>{wBody}</span>
                        </div>
                    )
                })}
            </div>

            {/* ── Expand: daily tasks + YouTube + books ── */}
            <button
                onClick={() => setOpen(p => !p)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', fontSize: '0.78rem', fontWeight: 600, padding: 0
                }}
            >
                {open ? '▲ Hide details' : '▼ Show daily tasks & resources'}
            </button>

            {open && (
                <div style={{ marginTop: 10 }}>
                    {/* Daily tasks */}
                    {(tp.daily_tasks || []).length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Daily tasks</div>
                            {tp.daily_tasks.map((d, dIdx) => (
                                <div key={dIdx} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                                    <span style={{ flexShrink: 0, marginTop: 4, width: 12, height: 12, borderRadius: 3, border: '1.5px solid rgba(148,163,184,0.3)', background: 'rgba(255,255,255,0.04)', display: 'inline-block' }} />
                                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{d}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* YouTube */}
                    {(tp.resources?.youtube || []).length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>YouTube resources</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {tp.resources.youtube.map((y, yIdx) => (
                                    <a key={yIdx}
                                        href={y.url} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 9,
                                            padding: '8px 12px', borderRadius: 9, textDecoration: 'none',
                                            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
                                            color: '#fca5a5', fontSize: '0.82rem', fontWeight: 500
                                        }}
                                    >
                                        <span style={{
                                            flexShrink: 0, width: 26, height: 18, borderRadius: 4,
                                            background: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="12" height="9" viewBox="0 0 14 10" fill="white">
                                                <path d="M13.7 1.56A1.76 1.76 0 0 0 12.46.3C11.36 0 7 0 7 0S2.64 0 1.54.3A1.76 1.76 0 0 0 .3 1.56 18.5 18.5 0 0 0 0 5a18.5 18.5 0 0 0 .3 3.44A1.76 1.76 0 0 0 1.54 9.7C2.64 10 7 10 7 10s4.36 0 5.46-.3a1.76 1.76 0 0 0 1.24-1.26A18.5 18.5 0 0 0 14 5a18.5 18.5 0 0 0-.3-3.44z"/>
                                                <polygon points="5.6,7.1 9.24,5 5.6,2.9" fill="#ef4444"/>
                                            </svg>
                                        </span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.title}</span>
                                        <span style={{ flexShrink: 0, fontSize: '0.7rem', color: '#94a3b8' }}>↗</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Books */}
                    {(tp.resources?.books || []).length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Book references</div>
                            {tp.resources.books.map((b, bIdx) => (
                                <div key={bIdx} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: '0.82rem' }}>
                                    <span>📚</span>
                                    <div><span style={{ color: '#cbd5e1', fontWeight: 600 }}>{b.title}</span> — <span style={{ color: '#64748b' }}>{b.ref}</span></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Download notes */}
                    {tp.notes?.content && (
                        <button
                            onClick={downloadNotes}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem',
                                border: '1.5px solid rgba(99,102,241,0.4)',
                                background: 'rgba(99,102,241,0.07)', color: '#a5b4fc'
                            }}
                        >
                            <FileDown size={12} /> Download Notes
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

function DiagnosticPlansSection({ plans }) {
    const [expanded, setExpanded] = useState({ [plans[0]?.id]: true })
    const pScoreColor = (p) => pctColor(p.summary?.percentage || 0)

    return (
        <div>
            <SectionTitle
                icon={<FileText size={17} color="#38bdf8" />}
                sub="Topic-wise plans from your diagnostic tests. Expand to see week-by-week focus, daily tasks, and YouTube resources."
            >
                Personalized Study Plans
                <span style={{
                    marginLeft: 8, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                    color: '#7dd3fc', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700
                }}>{plans.length} plans</span>
            </SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plans.map(p => {
                    const isOpen    = !!expanded[p.id]
                    const pct       = p.summary?.percentage || 0
                    const sColor    = pScoreColor(p)
                    const topicPlans = p.plan?.topic_plans || []

                    return (
                        <div key={p.id} style={card({ border: '1px solid rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.03)', padding: 0, overflow: 'hidden' })}>
                            {/* Plan header — click to expand */}
                            <button
                                onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '16px 20px', textAlign: 'left'
                                }}
                            >
                                {/* Score ring */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                                    background: `${sColor}18`, border: `1.5px solid ${sColor}45`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: sColor, lineHeight: 1 }}>{pct}%</span>
                                    <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 2 }}>score</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                                        {p.title || 'Diagnostic Improvement Plan'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <span>Stage: <strong style={{ color: sColor }}>{p.summary?.stage || 'N/A'}</strong></span>
                                        <span>Score: <strong style={{ color: '#94a3b8' }}>{p.summary?.score ?? '-'}/{p.summary?.total_marks ?? '-'}</strong></span>
                                        <span>Target: <strong style={{ color: '#60a5fa' }}>{p.plan?.target_score ?? 'N/A'}%</strong></span>
                                        {topicPlans.length > 0 && <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 20, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700 }}>{topicPlans.length} topics</span>}
                                    </div>
                                </div>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                            </button>

                            {isOpen && (
                                <div style={{ borderTop: '1px solid rgba(56,189,248,0.1)', padding: '16px 20px' }}>
                                    {/* Weekly overview */}
                                    {p.plan?.weekly_goals?.length > 0 && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {p.plan.horizon_days}-day plan overview
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                                                {p.plan.weekly_goals.map((g, gIdx) => {
                                                    const wc = WEEK_COLORS[gIdx] || WEEK_COLORS[3]
                                                    const colonIdx = g.indexOf(':')
                                                    const wLabel = colonIdx > -1 ? g.slice(0, colonIdx).trim() : `Week ${gIdx + 1}`
                                                    const wBody  = colonIdx > -1 ? g.slice(colonIdx + 1).trim() : g
                                                    return (
                                                        <div key={gIdx} style={{ background: wc.bg, border: `1px solid ${wc.border}`, borderRadius: 9, padding: '10px 12px' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: wc.color, marginBottom: 4 }}>{wLabel}</div>
                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{wBody}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Topic plans */}
                                    {topicPlans.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Topic-wise breakdown
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                                                {topicPlans.map((tp, tpIdx) => (
                                                    <TopicPlanExpanded key={tpIdx} tp={tp} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── main page ───────────────────────────────────────────────────────────── */
export default function PersonalizedStudy() {
    const [data,    setData]    = useState(null)
    const [loading, setLoading] = useState(true)
    const [err,     setErr]     = useState(null)

    const load = () => {
        setLoading(true); setErr(null)
        vpApi.personalized()
            .then(d => { setData(d); setLoading(false) })
            .catch(e => { setErr(e.response?.data?.error || e.message); setLoading(false) })
    }

    useEffect(load, [])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, gap: 12, color: '#64748b' }}>
            <Loader2 size={20} className="spin" /> Loading your personalized path…
        </div>
    )

    if (err) return (
        <div style={{ ...card(), color: '#f87171', display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertTriangle size={16} /> {err}
            <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #f87171', color: '#f87171', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Retry</button>
        </div>
    )

    if (!data?.has_data) return (
        <div style={card({ textAlign: 'center', padding: '48px 24px' })}>
            <Brain size={40} color="#6366f1" style={{ marginBottom: 16, opacity: 0.7 }} />
            <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 20 }}>
                No learning data yet. Take a diagnostic test or complete a lesson quiz to unlock your personalized study path.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/student/vp/diagnostic" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#6366f1', color: '#fff', borderRadius: 10,
                    padding: '10px 22px', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem'
                }}>
                    <Target size={14} /> Take Diagnostic
                </Link>
                <Link to="/student/vp/lessons" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderRadius: 10,
                    padding: '10px 22px', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem',
                    border: '1px solid rgba(99,102,241,0.3)'
                }}>
                    <BookOpen size={14} /> Browse Lessons
                </Link>
            </div>
        </div>
    )

    const {
        weak_areas, srs_queue, bandit_pick, subject_summary,
        total_concepts, mastered_count,
        syllabi, smart_weak_topics, smart_topics_count, smart_notes_ready,
        read_lessons, diagnostic_plans
    } = data

    const hasBktData = total_concepts > 0
    const hasSmartStudy = (syllabi?.length > 0) || (smart_weak_topics?.length > 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* ── Header stats strip ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Concepts tracked</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#e2e8f0' }}>{total_concepts}</div>
                </div>
                <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mastered</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{mastered_count}</div>
                    <div style={{ color: '#475569', fontSize: '0.72rem' }}>≥ 85% mastery</div>
                </div>
                <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Weak areas</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: weak_areas.length > 0 ? '#f59e0b' : '#10b981' }}>{weak_areas.length}</div>
                </div>
                <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Review due</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: srs_queue.length > 0 ? '#f97316' : '#10b981' }}>{srs_queue.length}</div>
                    <div style={{ color: '#475569', fontSize: '0.72rem' }}>SRS cards today</div>
                </div>
                {syllabi?.length > 0 && (
                    <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Smart Study</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>{syllabi.length}</div>
                        <div style={{ color: '#475569', fontSize: '0.72rem' }}>{smart_notes_ready}/{smart_topics_count} notes ready</div>
                    </div>
                )}
                {(diagnostic_plans?.length > 0) && (
                    <div style={card({ display: 'flex', flexDirection: 'column', gap: 4 })}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Saved Plans</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{diagnostic_plans.length}</div>
                        <div style={{ color: '#475569', fontSize: '0.72rem' }}>From diagnostic reports</div>
                    </div>
                )}
            </div>

            {(diagnostic_plans?.length > 0) && (
                <DiagnosticPlansSection plans={diagnostic_plans} />
            )}

            {/* ── Bandit Pick: Best next lesson ── */}
            {bandit_pick && (
                <div>
                    <SectionTitle icon={<Zap size={17} color="#f59e0b" />} sub="AI-selected based on your ability score and weakest concepts">
                        Best Next Lesson for You
                    </SectionTitle>
                    <Link to={`/student/vp/lessons/${bandit_pick.lesson_id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                            ...card({
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.10))',
                                border: '1.5px solid rgba(99,102,241,0.35)',
                                display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
                            })
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Brain size={22} color="#818cf8" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
                                    {bandit_pick.lesson_title}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{bandit_pick.subject}</div>
                                {bandit_pick.mastery_pct != null && (
                                    <MasteryBar pct={bandit_pick.mastery_pct} color={MASTERY_COLOR(bandit_pick.mastery_pct)} />
                                )}
                            </div>
                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <span style={{
                                    background: bandit_pick.reason === 'exploit' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.15)',
                                    border: `1px solid ${bandit_pick.reason === 'exploit' ? 'rgba(99,102,241,0.4)' : 'rgba(245,158,11,0.4)'}`,
                                    color: bandit_pick.reason === 'exploit' ? '#a5b4fc' : '#fbbf24',
                                    borderRadius: 6, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 600
                                }}>
                                    {bandit_pick.reason === 'exploit' ? '🎯 Optimal' : '🔭 Explore'}
                                </span>
                                <ChevronRight size={18} color="#64748b" />
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* ── No data yet prompt ── */}
            {!hasBktData && !hasSmartStudy && (
                <div style={card({ textAlign: 'center', padding: '40px 24px' })}>
                    <Brain size={38} color="#6366f1" style={{ marginBottom: 14, opacity: 0.7 }} />
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20 }}>
                        No learning data yet. Start by uploading a syllabus in Smart Study or take a lesson quiz.
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/student/vp/smart-study" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#6366f1', color: '#fff', borderRadius: 10,
                            padding: '9px 20px', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem'
                        }}>
                            <FlaskConical size={14} /> Smart Study
                        </Link>
                        <Link to="/student/vp/lessons" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderRadius: 10,
                            padding: '9px 20px', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem',
                            border: '1px solid rgba(99,102,241,0.3)'
                        }}>
                            <BookOpen size={14} /> Browse Lessons
                        </Link>
                    </div>
                </div>
            )}

            {/* ── Smart Study Syllabi & Weak Topics ── */}
            {hasSmartStudy && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
                    {syllabi?.length > 0 && (
                        <div>
                            <SectionTitle
                                icon={<FlaskConical size={17} color="#a78bfa" />}
                                sub="Syllabi you uploaded in Smart Study"
                            >
                                Your Study Syllabi
                            </SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {syllabi.map(s => (
                                    <Link key={s.syllabus_id} to="/student/vp/smart-study" style={{ textDecoration: 'none' }}>
                                        <div style={card({
                                            padding: '13px 16px', display: 'flex',
                                            justifyContent: 'space-between', alignItems: 'center',
                                            border: '1px solid rgba(167,139,250,0.2)',
                                            background: 'rgba(167,139,250,0.05)'
                                        })}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{s.syllabus_title}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{s.subject || 'No subject'}</div>
                                            </div>
                                            <ChevronRight size={15} color="#64748b" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {smart_weak_topics?.length > 0 && (
                        <div>
                            <SectionTitle
                                icon={<AlertTriangle size={17} color="#f87171" />}
                                sub="Topics you scored low on in Smart Study tests"
                            >
                                Weak Topics from Tests
                            </SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {smart_weak_topics.map((t, i) => (
                                    <div key={i} style={card({
                                        padding: '11px 16px', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        border: '1px solid rgba(248,113,113,0.2)',
                                        background: 'rgba(248,113,113,0.04)'
                                    })}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5' }}>{t.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>
                                                {t.syllabus_title}{t.subject ? ` · ${t.subject}` : ''}
                                            </div>
                                        </div>
                                        <Link to="/student/vp/smart-study" style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)',
                                            color: '#f87171', borderRadius: 7, padding: '3px 10px',
                                            fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none'
                                        }}>
                                            Revise <ChevronRight size={11} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {hasBktData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>

                    {/* ── Weak Areas (BKT) ── */}
                    <div>
                        <SectionTitle
                            icon={<Target size={17} color="#ef4444" />}
                            sub="Bayesian Knowledge Tracing · sorted by lowest mastery"
                        >
                            Weak Areas to Strengthen
                        </SectionTitle>
                        {weak_areas.length === 0 ? (
                            <div style={card({ textAlign: 'center', padding: 28, color: '#10b981' })}>
                                <CheckCircle2 size={28} style={{ marginBottom: 8, opacity: 0.8 }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>All concepts mastered!</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {weak_areas.map(w => {
                                    const color = MASTERY_COLOR(w.mastery_pct)
                                    return (
                                        <div key={w.concept_id} style={card({ padding: '14px 18px' })}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{w.concept_title}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{w.subject}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{w.mastery_pct}%</span>
                                                    {w.lesson_id && (
                                                        <Link to={`/student/vp/lessons/${w.lesson_id}`} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            background: `${color}1a`, border: `1px solid ${color}50`,
                                                            color, borderRadius: 7, padding: '3px 10px',
                                                            fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none'
                                                        }}>
                                                            Study <ChevronRight size={11} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            <MasteryBar pct={w.mastery_pct} color={color} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── SRS Review Queue ── */}
                    <div>
                        <SectionTitle
                            icon={<Clock size={17} color="#f97316" />}
                            sub="Spaced Repetition — due for review today"
                        >
                            Review Queue
                        </SectionTitle>
                        {srs_queue.length === 0 ? (
                            <div style={card({ textAlign: 'center', padding: 28, color: '#10b981' })}>
                                <CheckCircle2 size={28} style={{ marginBottom: 8, opacity: 0.8 }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nothing due today!</div>
                                <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: 4 }}>Check back after your next quiz</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {srs_queue.map(s => (
                                    <div key={s.concept_id} style={card({
                                        padding: '14px 18px',
                                        border: '1px solid rgba(249,115,22,0.25)',
                                        background: 'rgba(249,115,22,0.04)'
                                    })}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{s.concept_title}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.subject}</div>
                                            </div>
                                            {s.lesson_id && (
                                                <Link to={`/student/vp/lessons/${s.lesson_id}`} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.4)',
                                                    color: '#fb923c', borderRadius: 7, padding: '4px 12px',
                                                    fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none'
                                                }}>
                                                    Review <ChevronRight size={11} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Recent Lessons Read ── */}
            {read_lessons?.length > 0 && (
                <div>
                    <SectionTitle
                        icon={<History size={17} color="#38bdf8" />}
                        sub="Lessons you've studied recently"
                    >
                        Recently Studied
                    </SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {read_lessons.map(l => {
                            const color = MASTERY_COLOR(Number(l.mastery_pct))
                            const statusBadge = {
                                completed: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399', label: 'Done' },
                                in_progress: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', label: 'In progress' }
                            }[l.status] || { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', color: '#94a3b8', label: 'Started' }
                            return (
                                <Link key={l.lesson_id} to={`/student/vp/lessons/${l.lesson_id}`} style={{ textDecoration: 'none' }}>
                                    <div style={card({ padding: '13px 16px' })}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', flex: 1, paddingRight: 8 }}>{l.lesson_title}</div>
                                            <span style={{
                                                background: statusBadge.bg, border: `1px solid ${statusBadge.border}`,
                                                color: statusBadge.color, borderRadius: 6, padding: '2px 8px',
                                                fontSize: '0.68rem', fontWeight: 600, flexShrink: 0
                                            }}>{statusBadge.label}</span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 6 }}>{l.subject}</div>
                                        <MasteryBar pct={Number(l.mastery_pct)} color={color} />
                                        <div style={{ color, fontSize: '0.72rem', marginTop: 4, fontWeight: 600 }}>{Math.round(Number(l.mastery_pct))}% mastery</div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Subject Ability Summary (IRT + quiz accuracy) ── */}
            {subject_summary?.length > 0 && (
                <div>
                    <SectionTitle
                        icon={<BarChart3 size={17} color="#60a5fa" />}
                        sub="IRT ability + recent quiz accuracy · updates after every quiz session"
                    >
                        Ability by Subject
                    </SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        {subject_summary.map(s => {
                            const { label, color } = THETA_LABEL(s.theta)
                            return (
                                <div key={s.subject} style={card({ padding: '16px 20px' })}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>{s.subject}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>
                                                {s.concepts > 0 ? `${s.concepts} concepts · ` : ''}{s.n_responses} answers
                                            </div>
                                        </div>
                                        {s.theta !== null && (
                                            <span style={{
                                                background: `${color}1a`, border: `1px solid ${color}50`,
                                                color, borderRadius: 6, padding: '2px 9px',
                                                fontSize: '0.7rem', fontWeight: 700
                                            }}>{label}</span>
                                        )}
                                    </div>
                                    {s.ability_score !== null && (
                                        <div style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>
                                                <span>Ability score</span>
                                                <span style={{ color, fontWeight: 700 }}>{s.ability_score}/100</span>
                                            </div>
                                            <MasteryBar pct={s.ability_score} color={color} />
                                        </div>
                                    )}
                                    {s.quiz_accuracy !== null && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 6 }}>
                                            <span>Quiz accuracy</span>
                                            <span style={{ color: MASTERY_COLOR(s.quiz_accuracy), fontWeight: 600 }}>{s.quiz_accuracy}% ({s.quiz_attempts} Qs)</span>
                                        </div>
                                    )}
                                    {s.avg_mastery !== null && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                                            <span>Avg concept mastery</span>
                                            <span style={{ color: MASTERY_COLOR(s.avg_mastery), fontWeight: 600 }}>{s.avg_mastery}%</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Refresh ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={load} disabled={loading} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'none', border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                    color: '#64748b', fontSize: '0.78rem', fontWeight: 500
                }}>
                    <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>
        </div>
    )
}
