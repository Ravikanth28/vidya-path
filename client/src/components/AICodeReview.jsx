import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bot, CheckCircle, AlertTriangle, Zap, Shield, Paintbrush, Star, RefreshCw, ChevronDown, ChevronRight, XCircle, Clock, ThumbsUp, Circle } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// ─────────────────────────────────────────────────────
// Colour maps
// ─────────────────────────────────────────────────────
const TYPE_STYLE = {
    bug: { icon: <XCircle size={13} />, color: '#f87171', bg: '#450a0a', label: 'Bug' },
    performance: { icon: <Zap size={13} />, color: '#fbbf24', bg: '#451a03', label: 'Performance' },
    style: { icon: <Paintbrush size={13} />, color: '#a78bfa', bg: '#2e1065', label: 'Style' },
    security: { icon: <Shield size={13} />, color: '#34d399', bg: '#052e16', label: 'Security' },
    suggestion: { icon: <Star size={13} />, color: '#60a5fa', bg: '#1e3a5f', label: 'Suggestion' },
    praise: { icon: <ThumbsUp size={13} />, color: '#34d399', bg: '#052e16', label: 'Praise' },
}

const SEVERITY_COLOR = { critical: '#f87171', major: '#fbbf24', minor: '#60a5fa', info: '#94a3b8' }

const QUALITY_STYLE = {
    excellent: { color: '#34d399', bg: '#052e16', label: '⭐ Excellent' },
    good: { color: '#60a5fa', bg: '#1e3a5f', label: '👍 Good' },
    needs_improvement: { color: '#fbbf24', bg: '#451a03', label: '⚡ Needs Improvement' },
    poor: { color: '#f87171', bg: '#450a0a', label: '⚠️ Poor' },
}

// ─────────────────────────────────────────────────────
// Main AICodeReview component
// Shows AI review panel for a specific submission
// ─────────────────────────────────────────────────────
export default function AICodeReview({ submissionId, code = '', language = 'unknown', canTrigger = false, user }) {
    const [review, setReview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState(false)
    const [expandedComments, setExpandedComments] = useState({})
    const [filterType, setFilterType] = useState('all')

    useEffect(() => {
        if (submissionId) fetchReview()
    }, [submissionId])

    async function fetchReview() {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/ai-review/submission/${submissionId}`)
            setReview(res.data.review)
        } catch (e) {
            console.error('Failed to fetch AI review', e)
        } finally {
            setLoading(false)
        }
    }

    async function triggerReview() {
        if (!code || !submissionId) return
        setTriggering(true)
        try {
            await axios.post(`${API_BASE}/ai-review/trigger`, {
                submissionId,
                studentId: user?.id,
                code,
                language,
            })
            // Poll for completion
            let attempts = 0
            const poll = setInterval(async () => {
                attempts++
                const res = await axios.get(`${API_BASE}/ai-review/submission/${submissionId}`)
                if (res.data.review?.status === 'completed' || res.data.review?.status === 'failed' || attempts > 20) {
                    clearInterval(poll)
                    setReview(res.data.review)
                    setTriggering(false)
                }
            }, 3000)
        } catch (e) {
            setTriggering(false)
        }
    }

    async function resolveComment(commentId) {
        try {
            await axios.patch(`${API_BASE}/ai-review/comment/${commentId}/resolve`)
            fetchReview()
        } catch (e) { console.error(e) }
    }

    const toggleComment = (id) => {
        setExpandedComments(p => ({ ...p, [id]: !p[id] }))
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading AI review...
        </div>
    )

    // No review yet
    if (!review) return (
        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '16px', border: '1px dashed #334155', textAlign: 'center' }}>
            <Bot size={40} color="#6366f1" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: '#f1f5f9', margin: '0 0 8px' }}>No AI Review Yet</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                The AI hasn't reviewed this submission yet. {canTrigger ? 'Click below to request a review.' : 'It will appear automatically once triggered.'}
            </p>
            {canTrigger && (
                <button onClick={triggerReview} disabled={triggering} style={{ padding: '10px 22px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={16} /> {triggering ? 'Asking AI...' : 'Request AI Review'}
                </button>
            )}
        </div>
    )

    // Processing state
    if (review.status === 'pending' || review.status === 'processing') return (
        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                <RefreshCw size={20} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>AI is reviewing your code...</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>This usually takes 10–30 seconds. The page will auto-update.</p>
            <button onClick={fetchReview} style={{ marginTop: '10px', padding: '6px 14px', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                Check status
            </button>
        </div>
    )

    // Failed state
    if (review.status === 'failed') return (
        <div style={{ padding: '24px', background: '#450a0a', borderRadius: '16px', border: '1px solid #dc2626' }}>
            <AlertTriangle size={20} color="#f87171" />
            <p style={{ color: '#f87171', margin: '8px 0 0' }}>AI review failed. Please try again.</p>
            {canTrigger && (
                <button onClick={triggerReview} style={{ marginTop: '10px', padding: '6px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Retry
                </button>
            )}
        </div>
    )

    // Completed review
    const qualityStyle = QUALITY_STYLE[review.overall_quality] || QUALITY_STYLE.needs_improvement
    const comments = review.comments || []
    const filtered = filterType === 'all' ? comments : comments.filter(c => c.comment_type === filterType)
    const unresolvedCount = comments.filter(c => !c.is_resolved).length

    return (
        <div style={{ color: '#f1f5f9' }}>
            {/* Header summary */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: '16px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ background: '#1e293b', borderRadius: '10px', padding: '8px', border: '1px solid #334155' }}>
                        <Bot size={20} color="#6366f1" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '16px' }}>AI Code Review</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Completed {review.completed_at ? new Date(review.completed_at).toLocaleString() : ''}
                            {review.mentor_approved && <span style={{ marginLeft: '8px', color: '#34d399' }}>· Approved by mentor</span>}
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ background: qualityStyle.bg, color: qualityStyle.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            {qualityStyle.label}
                        </span>
                        {review.ai_score !== null && (
                            <span style={{ background: '#1e293b', color: '#60a5fa', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #334155' }}>
                                AI Score: {review.ai_score}/100
                            </span>
                        )}
                    </div>
                </div>

                {/* Overall feedback */}
                {review.overall_feedback && (
                    <div style={{ background: '#1e293b', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#94a3b8', borderLeft: '3px solid #6366f1' }}>
                        {review.overall_feedback}
                    </div>
                )}

                {/* Issue counts */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Bugs', count: review.bug_count, color: '#f87171' },
                        { label: 'Performance', count: review.performance_count, color: '#fbbf24' },
                        { label: 'Style', count: review.style_count, color: '#a78bfa' },
                        { label: 'Security', count: review.security_count, color: '#34d399' },
                        { label: 'Unresolved', count: unresolvedCount, color: '#60a5fa' },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: '#0f172a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #334155' }}>
                            <span style={{ color: stat.color, fontWeight: 700 }}>{stat.count}</span>
                            <span style={{ color: '#64748b', marginLeft: '5px' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {['all', 'bug', 'performance', 'style', 'security', 'suggestion', 'praise'].map(f => (
                    <button key={f} onClick={() => setFilterType(f)} style={{ padding: '5px 13px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: filterType === f ? '#6366f1' : '#1e293b', color: filterType === f ? 'white' : '#94a3b8', textTransform: 'capitalize', border: `1px solid ${filterType === f ? '#6366f1' : '#334155'}` }}>
                        {f === 'all' ? `All (${comments.length})` : f}
                    </button>
                ))}
            </div>

            {/* Comments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                        No {filterType === 'all' ? '' : filterType} comments found.
                    </div>
                ) : filtered.map(comment => {
                    const typeStyle = TYPE_STYLE[comment.comment_type] || TYPE_STYLE.suggestion
                    const expanded = expandedComments[comment.id]
                    const isResolved = comment.is_resolved

                    return (
                        <div key={comment.id} style={{ background: isResolved ? '#0f1a0f' : '#1e293b', borderRadius: '12px', border: `1px solid ${isResolved ? '#1a3a1a' : typeStyle.color}30`, opacity: isResolved ? 0.65 : 1, overflow: 'hidden' }}>
                            {/* Comment header */}
                            <div onClick={() => toggleComment(comment.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer' }}>
                                <span style={{ color: typeStyle.color }}>{typeStyle.icon}</span>
                                <span style={{ background: typeStyle.bg, color: typeStyle.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {typeStyle.label}
                                </span>
                                <span style={{ background: '#0f172a', color: SEVERITY_COLOR[comment.severity] || '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600, border: '1px solid #334155' }}>
                                    {comment.severity}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Line {comment.line_number}{comment.end_line && comment.end_line !== comment.line_number ? `–${comment.end_line}` : ''}</span>
                                <span style={{ flex: 1, fontSize: '13px', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {comment.message}
                                </span>
                                {isResolved && <CheckCircle size={14} color="#34d399" />}
                                {expanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                            </div>

                            {expanded && (
                                <div style={{ padding: '0 16px 14px', borderTop: '1px solid #334155' }}>
                                    <p style={{ margin: '10px 0 8px', fontSize: '14px', color: '#f1f5f9' }}>{comment.message}</p>
                                    {comment.suggestion && (
                                        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', fontSize: '13px', color: '#94a3b8', borderLeft: '3px solid #6366f1' }}>
                                            <strong style={{ color: '#60a5fa' }}>Suggestion:</strong> {comment.suggestion}
                                        </div>
                                    )}
                                    {comment.code_snippet && (
                                        <pre style={{ background: '#0f172a', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#94a3b8', overflowX: 'auto', margin: '0 0 8px', border: '1px solid #334155' }}>
                                            {comment.code_snippet}
                                        </pre>
                                    )}
                                    {!isResolved && (
                                        <button onClick={() => resolveComment(comment.id)} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <CheckCircle size={12} /> Mark Resolved
                                        </button>
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

// ─────────────────────────────────────────────────────
// Mentor: Pending AI Reviews Dashboard
// ─────────────────────────────────────────────────────
export function MentorAIReviewDashboard({ user }) {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [approvingId, setApprovingId] = useState(null)

    useEffect(() => { fetchPending() }, [])

    async function fetchPending() {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/ai-review/pending`)
            setReviews(res.data.reviews || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    async function approveReview(reviewId) {
        setApprovingId(reviewId)
        try {
            await axios.patch(`${API_BASE}/ai-review/${reviewId}/approve`)
            fetchPending()
        } catch (e) { console.error(e) } finally { setApprovingId(null) }
    }

    return (
        <div style={{ padding: '24px', color: '#f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px' }}>
                    <Bot size={22} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>AI Code Reviews</h1>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                        Pending your approval — {reviews.length} review{reviews.length !== 1 ? 's' : ''} waiting
                    </p>
                </div>
                <button onClick={fetchPending} style={{ marginLeft: 'auto', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 14px', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading...
                </div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
                    <CheckCircle size={40} color="#34d399" style={{ marginBottom: '12px' }} />
                    <h3>All caught up!</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>No pending AI reviews.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map(r => {
                        const qualityStyle = QUALITY_STYLE[r.overall_quality] || QUALITY_STYLE.needs_improvement
                        return (
                            <div key={r.id} style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{r.student_name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ color: qualityStyle.color }}>{qualityStyle.label}</span>
                                        <span>AI Score: {r.ai_score || '?'}/100</span>
                                        <span>{r.unresolved} unresolved</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {new Date(r.completed_at || r.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button onClick={() => approveReview(r.id)} disabled={approvingId === r.id} style={{ padding: '7px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={14} /> {approvingId === r.id ? 'Approving...' : 'Approve'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
// ─────────────────────────────────────────────────────
// Student: My AI Reviews Dashboard
// ─────────────────────────────────────────────────────
export function StudentAIReviewDashboard({ user }) {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedReview, setSelectedReview] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        if (user?.id) fetchMyReviews()
    }, [user])

    async function fetchMyReviews() {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/ai-review/student/${user.id}`)
            setReviews(res.data.reviews || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    async function selectReview(r) {
        setDetailLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/ai-review/submission/${r.submission_id}`)
            setSelectedReview(res.data.review || r)
        } catch (e) {
            setSelectedReview(r)
        } finally { setDetailLoading(false) }
    }

    if (detailLoading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading review details...
            </div>
        )
    }

    if (selectedReview) {
        const r = selectedReview
        const qualityStyle = QUALITY_STYLE[r.overall_quality] || QUALITY_STYLE.needs_improvement
        const comments = r.comments || []
        const unresolvedCount = comments.filter(c => !c.is_resolved).length

        return (
            <div style={{ padding: '24px', color: '#f1f5f9' }}>
                {/* Back Button */}
                <button onClick={() => setSelectedReview(null)} style={{ marginBottom: '24px', padding: '9px 16px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.12)'; e.target.style.borderColor = '#64748b'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.08)'; e.target.style.borderColor = '#475569'; }}>
                    ← Back to Reviews
                </button>

                {/* Review Header */}
                <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: '16px', padding: '24px', border: '1px solid #334155', marginBottom: '24px' }}>
                    {/* Title and Status */}
                    <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '12px', padding: '12px', border: 'none' }}>
                            <Bot size={24} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>AI Code Review</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                                Completed {r.completed_at ? new Date(r.completed_at).toLocaleString() : 'recently'}
                                {r.mentor_approved && <span style={{ marginLeft: '12px', color: '#34d399', fontWeight: 600 }}>✓ Approved</span>}
                            </p>
                        </div>
                        <span style={{ background: qualityStyle.bg, color: qualityStyle.color, padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                            {qualityStyle.label}
                        </span>
                    </div>

                    {/* Overall Feedback - Large and Prominent */}
                    {r.overall_feedback && (
                        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', fontSize: '14px', color: '#e2e8f0', lineHeight: '1.6', borderLeft: '4px solid #60a5fa', marginBottom: '20px' }}>
                            <strong style={{ display: 'block', color: '#60a5fa', marginBottom: '8px' }}>📝 Summary:</strong>
                            {r.overall_feedback}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '14px' }}>
                        <div style={{ background: 'rgba(96, 165, 250, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(96, 165, 250, 0.2)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{r.ai_score || 0}</div>
                            <div style={{ color: '#7dd3fc', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>AI SCORE</div>
                        </div>
                        <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.2)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#f87171', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{r.bug_count || 0}</div>
                            <div style={{ color: '#fca5a5', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>BUGS</div>
                        </div>
                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.2)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{r.performance_count || 0}</div>
                            <div style={{ color: '#fcd34d', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>PERFORMANCE</div>
                        </div>
                        <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.2)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{r.style_count || 0}</div>
                            <div style={{ color: '#d8b4fe', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>STYLE</div>
                        </div>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.2)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{r.security_count || 0}</div>
                            <div style={{ color: '#6ee7b7', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>SECURITY</div>
                        </div>
                        <div style={{ background: 'rgba(96, 165, 250, 0.08)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(96, 165, 250, 0.15)', textAlign: 'center', transition: 'all 0.2s' }}>
                            <div style={{ color: '#93c5fd', fontWeight: 700, fontSize: '24px', lineHeight: 1 }}>{unresolvedCount}</div>
                            <div style={{ color: '#bfdbfe', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>UNRESOLVED</div>
                        </div>
                    </div>
                </div>

                {/* Detailed Comments Section */}
                <div>
                    {comments.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                            <CheckCircle size={32} color="#34d399" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: '16px' }}>No Issues Found</h3>
                            <p style={{ margin: 0, fontSize: '13px' }}>Your code looks great! No improvements suggested.</p>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>📋 Detailed Feedback ({comments.length} {comments.length === 1 ? 'item' : 'items'})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {comments.map(comment => {
                                    const typeStyle = TYPE_STYLE[comment.comment_type] || TYPE_STYLE.suggestion
                                    const isResolved = comment.is_resolved
                                    return (
                                        <div key={comment.id} style={{ background: isResolved ? '#0f1a0f' : '#1e293b', borderRadius: '12px', border: `1px solid ${isResolved ? '#1a3a1a' : typeStyle.color}40`, opacity: isResolved ? 0.65 : 1, padding: '18px', overflow: 'hidden', transition: 'all 0.2s', boxShadow: isResolved ? 'none' : '0 1px 3px rgba(0,0,0,0.2)' }}>
                                            {/* Comment Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                <span style={{ color: typeStyle.color, fontSize: '16px' }}>{typeStyle.icon}</span>
                                                <span style={{ background: typeStyle.bg, color: typeStyle.color, padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{typeStyle.label}</span>
                                                <span style={{ background: '#0f172a', color: SEVERITY_COLOR[comment.severity] || '#94a3b8', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, border: '1px solid #334155' }}>
                                                    {comment.severity}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Line {comment.line_number}{comment.end_line && comment.end_line !== comment.line_number ? `–${comment.end_line}` : ''}</span>
                                                {isResolved && <CheckCircle size={14} color="#34d399" />}
                                            </div>
                                            {/* Message */}
                                            <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#f1f5f9', lineHeight: '1.5' }}>{comment.message}</p>
                                            {/* Suggestion */}
                                            {comment.suggestion && (
                                                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#94a3b8', borderLeft: '3px solid #60a5fa', marginTop: '10px' }}>
                                                    <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '4px' }}>💡 Suggestion:</strong>
                                                    {comment.suggestion}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: '24px', color: '#f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px' }}>
                    <Bot size={22} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>My AI Code Reviews</h1>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                        {reviews.length} AI review{reviews.length !== 1 ? 's' : ''} on your submissions
                    </p>
                </div>
                <button onClick={fetchMyReviews} style={{ marginLeft: 'auto', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 14px', color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading...
                </div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Bot size={40} color="#6366f1" style={{ marginBottom: '12px' }} />
                    <h3 style={{ color: '#f1f5f9' }}>No AI Reviews Yet</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>AI reviews will appear here once your submissions are reviewed.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map(r => {
                        const qualityStyle = QUALITY_STYLE[r.overall_quality] || QUALITY_STYLE.needs_improvement
                        return (
                            <div key={r.id} onClick={() => selectReview(r)} style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bot size={18} color="white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f1f5f9' }}>
                                        {r.problem_title || r.submission_title || `Code Submission`}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ color: qualityStyle.color }}>{qualityStyle.label}</span>
                                        <span>AI Score: {r.ai_score || '?'}/100</span>
                                        <span>{r.comment_count || 0} comments</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {new Date(r.completed_at || r.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    {r.mentor_approved && <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Approved</span>}
                                    <span style={{ background: qualityStyle.bg, color: qualityStyle.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{r.status}</span>
                                    <ChevronRight size={15} style={{ opacity: 0.4 }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}