import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { Award, ChevronRight } from 'lucide-react'

export default function Diagnostic({ onDone }) {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [answers, setAnswers] = useState({})
    const [idx, setIdx] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [done, setDone] = useState(false)

    useEffect(() => {
        Promise.all([vpApi.diagState(), vpApi.diagItems()]).then(([s, i]) => {
            setDone(!!s.done)
            setResult(s.result || null)
            setItems(i.items || [])
        }).catch(() => setItems([]))
    }, [])

    if (done && result) {
        return <ResultView result={result} onRestart={null} />
    }

    if (!items.length) {
        return <div className="vp-empty">{t('loading') || 'Loading…'}</div>
    }

    const cur = items[idx]
    const isLast = idx === items.length - 1

    const submit = async () => {
        setSubmitting(true)
        try {
            const arr = items.map(it => ({ item_id: it.id, answer: answers[it.id] ?? '' }))
            const r = await vpApi.diagSubmit(arr)
            setResult(r.result)
            setDone(true)
            onDone?.()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <h1 className="vp-h1">{t('vp_diagnostic') || 'Diagnostic Placement'}</h1>
            <p className="vp-text-sm">{t('vp_diag_intro') || 'Answer each question to your best ability. We use IRT scoring to tailor your lessons.'}</p>
            <div className="vp-progress vp-mt-12"><div style={{ width: `${((idx + 1) / items.length) * 100}%` }} /></div>
            <p className="vp-text-sm">{idx + 1} / {items.length} · {cur.subject}</p>

            <div className="vp-card vp-mt-12">
                <h3>{cur.prompt}</h3>
                <div className="vp-quiz-options">
                    {(cur.options || []).map(opt => (
                        <button
                            key={opt}
                            className={'vp-quiz-option' + (answers[cur.id] === opt ? ' selected' : '')}
                            onClick={() => setAnswers(a => ({ ...a, [cur.id]: opt }))}
                        >{opt}</button>
                    ))}
                </div>
                <div className="vp-row">
                    <button className="vp-btn" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>{t('back') || 'Back'}</button>
                    {!isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={() => setIdx(i => i + 1)} disabled={!answers[cur.id]}>
                            {t('next') || 'Next'} <ChevronRight size={16} />
                        </button>
                    )}
                    {isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={submit} disabled={submitting}>
                            {submitting ? '…' : (t('submit') || 'Submit')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function ResultView({ result }) {
    const navigate = useNavigate()
    return (
        <div>
            <h1 className="vp-h1"><Award size={26} /> Diagnostic complete</h1>
            <p>Here's your placement across each subject:</p>
            <div className="vp-grid vp-mt-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {Object.entries(result || {}).map(([subject, info]) => (
                    <div key={subject} className="vp-card">
                        <h3>{subject}</h3>
                        <p style={{ fontSize: 22, fontWeight: 700 }}>θ = {Number(info.theta).toFixed(2)}</p>
                        <p className="vp-text-sm">{Math.round((info.correctness || 0) * 100)}% accuracy on diagnostic</p>
                    </div>
                ))}
            </div>
            <div className="vp-row vp-mt-24">
                <button className="vp-btn vp-btn-primary" onClick={() => navigate('/student/vp/lessons')}>
                    Browse lessons
                </button>
                <button className="vp-btn" onClick={() => navigate('/student/vp')}>Back to dashboard</button>
            </div>
        </div>
    )
}
