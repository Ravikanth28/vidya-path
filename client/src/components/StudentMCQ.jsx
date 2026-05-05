import { useState, useEffect, useRef, useCallback } from 'react'
import { Brain, Clock, CheckCircle, XCircle, ChevronRight, ChevronLeft, Sparkles, BarChart2, AlertCircle, ArrowLeft, Target, Trophy, BookOpen, Code } from 'lucide-react'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

function authHeader() {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

const catIcon = { technical: '💻', debug: '🐛', pseudocode: '📋' }
const catColor = { technical: '#3b82f6', debug: '#f59e0b', pseudocode: '#8b5cf6' }
const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
const perfColor = { excellent: '#10b981', good: '#3b82f6', average: '#f59e0b', needs_improvement: '#ef4444' }

export default function StudentMCQ({ user }) {
    const [view, setView] = useState('list') // list | take | result
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTest, setActiveTest] = useState(null)
    const [result, setResult] = useState(null)

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await axios.get(`${API_BASE}/mcq/student`, { headers: authHeader() })
                setTests(res.data.tests || [])
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchTests()
    }, [])

    const handleStartTest = (test) => {
        setActiveTest(test)
        setView('take')
    }

    const handleSubmitComplete = (res) => {
        setResult(res)
        setView('result')
        // Refresh list to update submission status
        axios.get(`${API_BASE}/mcq/student`, { headers: authHeader() })
            .then(r => setTests(r.data.tests || []))
    }

    if (loading) return <div className="loading-spinner"></div>

    if (view === 'take' && activeTest) {
        return <TakeTest test={activeTest} user={user} onComplete={handleSubmitComplete} onCancel={() => setView('list')} />
    }

    if (view === 'result' && result) {
        return <ResultView result={result} onBack={() => setView('list')} />
    }

    return <ListView tests={tests} onStart={handleStartTest} onViewResult={(sub) => { setResult(sub); setView('result') }} />
}

// ===== LIST VIEW =====
function ListView({ tests, onStart, onViewResult }) {
    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={24} color="white" />
                    </div>
                    MCQ Tests
                </h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Take multiple-choice tests and get instant AI-powered evaluation</p>
            </div>

            {/* Stats */}
            {tests.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Available', value: tests.length, color: '#3b82f6' },
                        { label: 'Completed', value: tests.filter(t => t.submission).length, color: '#10b981' },
                        { label: 'Pending', value: tests.filter(t => !t.submission).length, color: '#f59e0b' }
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {tests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <Brain size={56} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>No MCQ tests available</p>
                    <p style={{ fontSize: '0.87rem', margin: 0 }}>Your admin will assign MCQ tests here for you to take.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
                    {tests.map(test => {
                        const done = !!test.submission
                        const passed = done && test.submission?.status === 'passed'
                        const isExpired = test.deadline && new Date(test.deadline) < new Date()
                        const attemptsUsed = test.attempts_used || 0
                        const maxAttempts = test.max_attempts || 1
                        const attemptsExhausted = attemptsUsed >= maxAttempts
                        const canStart = !isExpired && !attemptsExhausted
                        return (
                            <div key={test.id} style={{
                                background: 'var(--bg-card)', border: `1px solid ${isExpired ? 'rgba(100,116,139,0.3)' : done ? (passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)') : 'var(--border-color)'}`,
                                borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                position: 'relative', overflow: 'hidden', opacity: isExpired && !done ? 0.75 : 1,
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                                onMouseEnter={e => { if (canStart || done) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                            >
                                {/* Status badge top-right */}
                                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {isExpired && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(100,116,139,0.18)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}>⏰ EXPIRED</span>}
                                    {!isExpired && done && (passed
                                        ? <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ PASSED</span>
                                        : <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>✗ FAILED</span>
                                    )}
                                </div>

                                {/* Category icon & badges */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{catIcon[test.category] || '📝'}</span>
                                    <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: `${catColor[test.category]}22`, color: catColor[test.category], border: `1px solid ${catColor[test.category]}44` }}>
                                        {test.category}
                                    </span>
                                    <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: `${diffColor[test.difficulty]}22`, color: diffColor[test.difficulty], border: `1px solid ${diffColor[test.difficulty]}44` }}>
                                        {test.difficulty}
                                    </span>
                                </div>

                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, paddingRight: done ? '80px' : 0 }}>{test.title}</h3>
                                    {test.description && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{test.description}</p>}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <span><Brain size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{test.questionCount} questions</span>
                                    <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{test.time_limit} min</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>🎯 Pass: {test.pass_mark || 70}%</span>
                                    {maxAttempts > 1 && <span style={{ color: attemptsExhausted ? '#ef4444' : '#8b5cf6', fontWeight: 600 }}>🔁 {attemptsUsed}/{maxAttempts} attempts</span>}
                                    {test.deadline && <span style={{ color: isExpired ? '#94a3b8' : '#06b6d4', fontWeight: 600 }}>⏰ {isExpired ? 'Deadline passed' : `Due: ${new Date(test.deadline).toLocaleDateString()}`}</span>}
                                </div>

                                {/* Score if done */}
                                {done && (
                                    <div style={{ background: done && passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', borderRadius: '10px', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your Score</span>
                                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: passed ? '#10b981' : '#ef4444' }}>{test.submission.score}%</span>
                                    </div>
                                )}

                                {/* Action */}
                                {done ? (
                                    <button onClick={() => onViewResult(test.submission)}
                                        style={{ padding: '0.65rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Sparkles size={15} /> View AI Report
                                    </button>
                                ) : isExpired ? (
                                    <button disabled style={{ padding: '0.65rem 1rem', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '10px', color: '#64748b', cursor: 'not-allowed', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        ⏰ Deadline Passed
                                    </button>
                                ) : attemptsExhausted ? (
                                    <button disabled style={{ padding: '0.65rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', cursor: 'not-allowed', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        🚫 No Attempts Left
                                    </button>
                                ) : (
                                    <button onClick={() => onStart(test)}
                                        style={{ padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <Target size={15} /> Start MCQ Test
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ===== TAKE TEST VIEW =====
function TakeTest({ test, user, onComplete, onCancel }) {
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [timeLeft, setTimeLeft] = useState((test.time_limit || 30) * 60)
    const [violations, setViolations] = useState(0)
    const [proctoringWarning, setProctoringWarning] = useState('')
    const startTime = useRef(Date.now())
    const timerRef = useRef(null)
    const tabSwitchCount = useRef(0)
    const submitRef = useRef(null)

    // Parse proctoring config
    const pc = (() => {
        try { return typeof test.proctoring_config === 'string' ? JSON.parse(test.proctoring_config) : (test.proctoring_config || {}) }
        catch { return {} }
    })()
    const proctoringEnabled = !!pc.enabled

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    submitRef.current?.(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    // ── PROCTORING EFFECTS ─────────────────────────────────────────────────────
    const violationsRef = useRef(0)
    const addViolation = useCallback((reason) => {
        violationsRef.current++
        setViolations(violationsRef.current)
        setProctoringWarning(`⚠️ Violation #${violationsRef.current}: ${reason}`)
        setTimeout(() => setProctoringWarning(''), 4000)
        const maxV = pc.maxViolations || 5
        if (pc.autoSubmitOnViolation && violationsRef.current >= maxV) {
            setProctoringWarning('🚫 Max violations reached — auto-submitting!')
            setTimeout(() => submitRef.current?.(true), 1500)
        }
    }, [pc.autoSubmitOnViolation, pc.maxViolations])

    // 1. Fullscreen enforcement
    useEffect(() => {
        if (!proctoringEnabled || !pc.requireFullscreen) return
        const el = document.documentElement
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen
        if (req) req.call(el).catch(() => {})
        const handleFsChange = () => {
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)
            if (!isFs) addViolation('Exited fullscreen')
        }
        document.addEventListener('fullscreenchange', handleFsChange)
        document.addEventListener('webkitfullscreenchange', handleFsChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange)
            document.removeEventListener('webkitfullscreenchange', handleFsChange)
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {})
        }
    }, [proctoringEnabled, pc.requireFullscreen])

    // 2. Copy-paste blocking
    useEffect(() => {
        if (!proctoringEnabled || !pc.disableCopyPaste) return
        const block = (e) => {
            e.preventDefault()
            addViolation(`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} attempt blocked`)
        }
        document.addEventListener('copy', block)
        document.addEventListener('cut', block)
        document.addEventListener('paste', block)
        return () => {
            document.removeEventListener('copy', block)
            document.removeEventListener('cut', block)
            document.removeEventListener('paste', block)
        }
    }, [proctoringEnabled, pc.disableCopyPaste])

    // 3. Tab/window switch tracking
    useEffect(() => {
        if (!proctoringEnabled || !pc.trackTabSwitches) return
        const maxTabs = pc.maxTabSwitches || 3
        const checkMax = (label) => {
            if (tabSwitchCount.current >= maxTabs) {
                setProctoringWarning(`🚫 ${maxTabs} ${label} detected — auto-submitting!`)
                setTimeout(() => submitRef.current?.(true), 1500)
            }
        }
        const handleVisibility = () => {
            if (document.hidden) {
                tabSwitchCount.current++
                addViolation(`Tab switched (${tabSwitchCount.current}/${maxTabs})`)
                checkMax('tab switches')
            }
        }
        const handleBlur = () => {
            if (!document.hidden) {
                tabSwitchCount.current++
                addViolation(`Window focus lost (${tabSwitchCount.current}/${maxTabs})`)
                checkMax('focus losses')
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        window.addEventListener('blur', handleBlur)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility)
            window.removeEventListener('blur', handleBlur)
        }
    }, [proctoringEnabled, pc.trackTabSwitches, pc.maxTabSwitches])

    const questions = test.questions || []
    const q = questions[currentQ]
    const answered = Object.keys(answers).length
    const OPTS = ['A', 'B', 'C', 'D']

    const handleAnswer = (opt) => {
        setAnswers(prev => ({ ...prev, [q.id]: opt }))
    }

    const handleSubmit = useCallback(async (timedOut = false) => {
        clearInterval(timerRef.current)
        const unanswered = questions.filter(q => !answers[q.id]).length
        if (!timedOut && unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return
        }
        setSubmitting(true)
        // Exit fullscreen if entered
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {})
        const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
        try {
            const res = await axios.post(`${API_BASE}/mcq/${test.id}/submit`, {
                answers,
                time_taken: timeTaken
            }, { headers: authHeader() })
            onComplete(res.data)
        } catch (err) {
            alert('Submission error: ' + (err.response?.data?.error || err.message))
            setSubmitting(false)
        }
    }, [answers, questions])

    // keep ref in sync so proctoring effects can call latest version
    useEffect(() => { submitRef.current = handleSubmit }, [handleSubmit])

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timerPct = (timeLeft / ((test.time_limit || 30) * 60)) * 100

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Proctoring active banner */}
            {proctoringEnabled && (
                <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.82rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🛡️ Proctoring Active
                        {pc.requireFullscreen && <span style={{ fontWeight: 400, color: '#fca5a5' }}>· Fullscreen required</span>}
                        {pc.disableCopyPaste && <span style={{ fontWeight: 400, color: '#fca5a5' }}>· Copy/paste disabled</span>}
                        {pc.trackTabSwitches && <span style={{ fontWeight: 400, color: '#fca5a5' }}>· Tab switches tracked ({tabSwitchCount.current}/{pc.maxTabSwitches || 3})</span>}
                    </span>
                    {violations > 0 && (
                        <span style={{ padding: '2px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 800 }}>
                            {violations} violation{violations !== 1 ? 's' : ''}
                            {pc.autoSubmitOnViolation ? ` / ${pc.maxViolations || 5} max` : ''}
                        </span>
                    )}
                </div>
            )}

            {/* Floating violation warning */}
            {proctoringWarning && (
                <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#991b1b', color: '#fff', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 8px 32px rgba(239,68,68,0.5)', animation: 'fadeIn 0.2s ease' }}>
                    {proctoringWarning}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{test.title}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                        <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: `${catColor[test.category]}22`, color: catColor[test.category] }}>{test.category}</span>
                        <span style={{ padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: `${diffColor[test.difficulty]}22`, color: diffColor[test.difficulty] }}>{test.difficulty}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: timeLeft < 120 ? 'rgba(239,68,68,0.12)' : 'var(--bg-card)', border: `1px solid ${timeLeft < 120 ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`, borderRadius: '10px' }}>
                        <Clock size={16} style={{ color: timeLeft < 120 ? '#ef4444' : '#f59e0b' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: timeLeft < 120 ? '#ef4444' : 'inherit', fontFamily: 'monospace' }}>
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </span>
                    </div>
                    <button onClick={onCancel} style={{ padding: '0.4rem 0.875rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        ✕ Exit
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Question {currentQ + 1} of {questions.length}</span>
                    <span>{answered}/{questions.length} answered</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '999px', transition: 'width 0.3s' }} />
                </div>
            </div>

            {/* Question Navigation Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrentQ(i)} style={{
                        width: 32, height: 32, borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                        background: currentQ === i ? '#3b82f6' : answers[questions[i]?.id] ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                        color: currentQ === i ? '#fff' : answers[questions[i]?.id] ? '#10b981' : 'var(--text-muted)',
                        border: `1px solid ${currentQ === i ? '#3b82f6' : answers[questions[i]?.id] ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`
                    }}>{i + 1}</button>
                ))}
            </div>

            {/* Question Card */}
            {q && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.25rem' }}>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6 }}>{q.question}</p>

                    {q.code && (
                        <pre style={{ margin: '0 0 1.25rem 0', background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', fontSize: '0.82rem', overflow: 'auto', fontFamily: 'monospace', lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.06)' }}>
                            {q.code}
                        </pre>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {OPTS.map((opt, oi) => {
                            const optText = q.options?.[oi] || ''
                            if (!optText) return null
                            const selected = answers[q.id] === opt
                            return (
                                <button key={opt} onClick={() => handleAnswer(opt)} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1.25rem', textAlign: 'left',
                                    background: selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1.5px solid ${selected ? '#3b82f6' : 'var(--border-color)'}`,
                                    borderRadius: '12px', cursor: 'pointer', color: 'inherit', fontSize: '0.93rem', lineHeight: 1.5,
                                    transition: 'all 0.15s'
                                }}
                                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)' }}
                                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-color)' }}
                                >
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0, marginTop: -1, background: selected ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: selected ? '#fff' : 'var(--text-muted)', border: selected ? 'none' : '1px solid var(--border-color)' }}>
                                        {opt}
                                    </span>
                                    <span style={{ flex: 1, paddingTop: 4 }}>{optText}</span>
                                    {selected && <CheckCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}
                    style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', color: currentQ === 0 ? 'var(--text-muted)' : 'inherit', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <ChevronLeft size={16} /> Previous
                </button>

                {currentQ < questions.length - 1 ? (
                    <button onClick={() => setCurrentQ(p => p + 1)}
                        style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                        Next <ChevronRight size={16} />
                    </button>
                ) : (
                    <button onClick={() => handleSubmit()} disabled={submitting}
                        style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? '⏳ Submitting...' : '✅ Submit MCQ'}
                    </button>
                )}
            </div>
        </div>
    )
}

// ===== RESULT VIEW =====
function ResultView({ result, onBack }) {
    const report = result.aiReport || result.ai_report || {}
    const perfC = perfColor[report.performanceLevel] || '#3b82f6'

    return (
        <div className="animate-fadeIn">
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to MCQ Tests
            </button>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {/* Score Hero */}
                <div style={{ background: `linear-gradient(135deg, ${perfC}15, rgba(0,0,0,0.2))`, border: `1px solid ${perfC}44`, borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: `${perfC}20`, border: `3px solid ${perfC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: perfC, lineHeight: 1 }}>{result.score}%</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800 }}>
                            {result.status === 'passed' ? '🎉 Test Passed!' : '📚 Test Completed'}
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.87rem' }}>
                            {result.correctAnswers ?? result.correct_answers ?? 0} out of {result.totalQuestions ?? result.total_questions ?? 0} correct
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, background: `${perfC}20`, color: perfC, border: `1px solid ${perfC}44` }}>
                            {report.performanceLevel?.replace('_', ' ').toUpperCase() || 'EVALUATED'}
                        </span>
                        {report.estimatedSkillLevel && (
                            <span style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>
                                {report.estimatedSkillLevel.toUpperCase()} LEVEL
                            </span>
                        )}
                    </div>
                </div>

                {/* AI Feedback */}
                {report.overallFeedback && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={18} /> AI Evaluation
                        </h4>
                        <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.93rem' }}>{report.overallFeedback}</p>
                    </div>
                )}

                {/* Strengths & Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {report.strengths?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>✅ Strengths</h4>
                            {report.strengths.map((s, i) => (
                                <p key={i} style={{ margin: '0 0 5px 0', fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                    <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />{s}
                                </p>
                            ))}
                        </div>
                    )}
                    {report.weaknesses?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>🔧 Needs Work</h4>
                            {report.weaknesses.map((w, i) => (
                                <p key={i} style={{ margin: '0 0 5px 0', fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                    <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />{w}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                {report.recommendations?.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            💡 Study Recommendations
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {report.recommendations.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0.875rem', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)', fontSize: '0.85rem', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#f59e0b', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                                    {r}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Topics to improve */}
                {report.topicsToImprove?.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700 }}>📚 Topics to Study</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {report.topicsToImprove.map((t, i) => (
                                <span key={i} style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Per-question breakdown */}
                {(result.evaluation || result.answers)?.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>Question Breakdown</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(result.evaluation || result.answers).map((a, i) => (
                                <div key={i} style={{ padding: '0.875rem 1.25rem', background: a.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)', border: `1px solid ${a.isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: a.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, color: a.isCorrect ? '#10b981' : '#ef4444' }}>
                                            {i + 1}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '0.88rem' }}>{a.question}</p>
                                            {a.code && <pre style={{ margin: '0 0 6px 0', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', overflow: 'auto' }}>{a.code}</pre>}
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <span>Your answer: <strong style={{ color: a.isCorrect ? '#10b981' : '#ef4444' }}>{a.studentAnswer || '—'}</strong></span>
                                                {!a.isCorrect && <span>Correct: <strong style={{ color: '#10b981' }}>{a.correctAnswer}</strong></span>}
                                            </div>
                                            {a.explanation && <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>💡 {a.explanation}</p>}
                                        </div>
                                        {a.isCorrect
                                            ? <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                                            : <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={onBack} style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                    ← Back to MCQ Tests
                </button>
            </div>
        </div>
    )
}
