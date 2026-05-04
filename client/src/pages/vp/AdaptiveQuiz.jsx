import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Check, X, ArrowRight, ArrowLeft, Trophy } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { queueOfflineEvent } from '@/services/vp/syncEngine'

export default function AdaptiveQuiz() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { locale, t } = useI18n()
    const [session, setSession] = useState(null)
    const [item, setItem] = useState(null)
    const [seenIds, setSeenIds] = useState([])
    const [selected, setSelected] = useState(null)
    const [shortText, setShortText] = useState('')
    const [feedback, setFeedback] = useState(null)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [done, setDone] = useState(false)
    const [summary, setSummary] = useState(null)
    const [proctorAck, setProctorAck] = useState(false)

    useEffect(() => {
        let mounted = true
        vpApi.quizStart(id, locale).then(s => {
            if (!mounted) return
            setSession(s)
            setLoading(false)
            // first item from initial batch (if any)
            if (s.items && s.items.length) {
                setItem(s.items[0])
                setSeenIds([s.items[0].id])
            }
        }).catch(err => {
            alert(err.response?.data?.error || err.message)
            setLoading(false)
        })
        return () => { mounted = false }
    }, [id, locale])

    const submitAnswer = async () => {
        if (!item) return
        const answer = item.kind === 'short' ? shortText : selected
        if (!answer) return
        const t0 = Date.now()
        try {
            let r
            if (navigator.onLine) {
                r = await vpApi.quizAnswer({ item_id: item.id, answer, time_taken_ms: Date.now() - t0, lang: locale })
            } else {
                await queueOfflineEvent('quiz_answer', { item_id: item.id, answer, time_taken_ms: Date.now() - t0, lang: locale })
                r = { correct: 0, score: 0, expected: null, feedback: { feedback: 'Saved offline. Will be graded when you reconnect.' } }
            }
            setFeedback(r)
            setResults(rs => [...rs, { item, answer, ...r }])
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    const next = async () => {
        setSelected(null); setShortText(''); setFeedback(null)
        try {
            const r = await vpApi.quizNext({ lesson_id: id, exclude: seenIds, lang: locale })
            if (r.done) {
                const fin = await vpApi.quizFinish(id).catch(() => null)
                setSummary(fin)
                setDone(true)
            } else {
                setItem(r.item)
                setSeenIds(s => [...s, r.item.id])
            }
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    const finishEarly = async () => {
        const fin = await vpApi.quizFinish(id).catch(() => null)
        setSummary(fin)
        setDone(true)
    }

    if (loading) return <div className="vp-empty">{t('loading') || 'Loading quiz…'}</div>

    if (!proctorAck && !done) {
        return (
            <div>
                <h1 className="vp-h1">{t('vp_proctoring') || 'Proctoring notice'}</h1>
                <div className="vp-card">
                    <p>By starting this quiz you confirm:</p>
                    <ul>
                        <li>You will not consult external help.</li>
                        <li>Switching tabs is logged.</li>
                        <li>The bandit AI will pick the next question for you.</li>
                    </ul>
                    <button className="vp-btn vp-btn-primary vp-mt-12" onClick={() => setProctorAck(true)}>
                        I understand — start quiz
                    </button>
                </div>
            </div>
        )
    }

    if (done) {
        return (
            <div>
                <h1 className="vp-h1"><Trophy size={26} /> Quiz finished</h1>
                {summary && (
                    <div className="vp-card">
                        <p>Accuracy: <strong>{Math.round((summary.accuracy || 0) * 100)}%</strong></p>
                        <p>New {session?.subject} ability θ = <strong>{Number(summary.theta || 0).toFixed(2)}</strong></p>
                        <p className="vp-text-sm">{summary.attempts} attempts contributed to your score.</p>
                    </div>
                )}
                <div className="vp-row vp-mt-24">
                    <Link to={`/student/vp/lessons/${id}`} className="vp-btn vp-btn-primary">Back to lesson</Link>
                    <Link to="/student/vp/practice" className="vp-btn">Practice more</Link>
                </div>
            </div>
        )
    }

    if (!item) return <div className="vp-empty">No more questions.</div>

    return (
        <div>
            <h1 className="vp-h1">Quiz · {session?.subject}</h1>
            <p className="vp-text-sm">θ {Number(session?.theta || 0).toFixed(2)} · mastery {Math.round((session?.mastery || 0) * 100)}%</p>

            <div className="vp-card vp-mt-12">
                <h3>{item.prompt}</h3>
                {item.kind === 'short' ? (
                    <textarea
                        className="vp-search"
                        rows={4}
                        placeholder="Type your answer…"
                        value={shortText}
                        onChange={e => setShortText(e.target.value)}
                        disabled={!!feedback}
                    />
                ) : (
                    <div className="vp-quiz-options">
                        {(item.options || []).map(opt => {
                            const cls = !feedback
                                ? (selected === opt ? 'selected' : '')
                                : (opt === feedback.expected ? 'correct' : (opt === selected ? 'incorrect' : ''))
                            return (
                                <button key={opt}
                                    className={'vp-quiz-option ' + cls}
                                    onClick={() => !feedback && setSelected(opt)}
                                    disabled={!!feedback}
                                >{opt}</button>
                            )
                        })}
                    </div>
                )}

                {feedback && (
                    <div className="vp-card" style={{ background: feedback.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: 'none' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                            {feedback.correct ? <Check color="#10b981" /> : <X color="#ef4444" />}
                            <strong>{feedback.correct ? 'Correct' : 'Not quite'}</strong>
                        </p>
                        {feedback.feedback?.feedback && <p style={{ marginTop: 6 }}>{feedback.feedback.feedback}</p>}
                        {Array.isArray(feedback.feedback?.improvements) && feedback.feedback.improvements.length > 0 && (
                            <p className="vp-text-sm">Improve: {feedback.feedback.improvements.join('; ')}</p>
                        )}
                    </div>
                )}

                <div className="vp-row vp-mt-12">
                    {!feedback ? (
                        <button className="vp-btn vp-btn-primary" onClick={submitAnswer}
                            disabled={item.kind === 'short' ? !shortText.trim() : !selected}>
                            Submit
                        </button>
                    ) : (
                        <button className="vp-btn vp-btn-primary" onClick={next}>
                            Next <ArrowRight size={14} />
                        </button>
                    )}
                    <button className="vp-btn" onClick={finishEarly}>Finish quiz</button>
                </div>
            </div>

            <p className="vp-text-sm vp-mt-12">Attempted {results.length} · session {seenIds.length}</p>
        </div>
    )
}
