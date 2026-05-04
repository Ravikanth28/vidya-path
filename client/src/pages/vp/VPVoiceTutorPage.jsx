import { useEffect, useState } from 'react'
import { History, Sparkles } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import VoiceTutor from '@/components/vp/VoiceTutor'

export default function VPVoiceTutorPage() {
    const { t } = useI18n()
    const [history, setHistory] = useState([])
    const [showHistory, setShowHistory] = useState(false)

    useEffect(() => {
        vpApi.tutorHistory().then(r => setHistory(r.items || [])).catch(() => {})
    }, [])

    return (
        <div>
            <h1 className="vp-h1"><Sparkles size={22} /> {t('vp_tutor') || 'AI Voice Tutor'}</h1>
            <p className="vp-text-sm">{t('vp_tutor_intro_full') || 'Ask any academic question. Type or hold the mic to speak. Replies are voiced back in your chosen language.'}</p>

            <div className="vp-card vp-mt-12" style={{ minHeight: 480 }}>
                <VoiceTutor />
            </div>

            <h2 className="vp-h2">
                <button className="vp-btn vp-btn-secondary" onClick={() => setShowHistory(s => !s)}>
                    <History size={14} /> {showHistory ? 'Hide' : 'Show'} history
                </button>
            </h2>
            {showHistory && (
                <div className="vp-grid">
                    {history.length === 0 && <div className="vp-empty">No history yet.</div>}
                    {history.map(h => (
                        <div key={h.id} className="vp-card">
                            <p className="vp-text-sm">{new Date(h.created_at).toLocaleString()} · {h.mode} · {h.lang}</p>
                            <p><strong>Q:</strong> {h.question}</p>
                            <p><strong>A:</strong> {h.answer}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
