import { useEffect, useState } from 'react'
import { Briefcase, GraduationCap, UserCheck, RefreshCw } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'

const TABS = [
    { key: 'career',      label: 'Careers',      icon: <Briefcase size={14} /> },
    { key: 'scholarship', label: 'Scholarships', icon: <GraduationCap size={14} /> },
    { key: 'mentor',      label: 'Mentors',      icon: <UserCheck size={14} /> }
]

export default function CareerHub() {
    const { t, locale } = useI18n()
    const [tab, setTab] = useState('career')
    const [profile, setProfile] = useState('')
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        vpApi.careerProfile().then(p => setProfile(p.summary || '')).catch(() => {})
    }, [])

    useEffect(() => {
        run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, locale])

    const run = async () => {
        setLoading(true); setError(null)
        try {
            const r = await vpApi.careerMatch(tab, locale)
            setMatches(r.matches || [])
        } catch (err) {
            setError(err.response?.data?.error || err.message)
            setMatches([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1 className="vp-h1">{t('vp_career_hub') || 'Career Hub'}</h1>
            <p className="vp-text-sm">{t('vp_career_intro') || "Your AI counsellor matches you to careers, scholarships, and mentors based on your real performance — not generic surveys."}</p>

            <div className="vp-card vp-mt-12">
                <h3>Your performance summary</h3>
                <pre className="vp-text-sm" style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                    {profile || '(building summary…)'}
                </pre>
            </div>

            <div className="vp-tabs vp-mt-24">
                {TABS.map(s => (
                    <button key={s.key} className={'vp-tab' + (tab === s.key ? ' active' : '')} onClick={() => setTab(s.key)}>
                        {s.icon}<span style={{ marginLeft: 6 }}>{t(s.key + 's') || s.label}</span>
                    </button>
                ))}
                <button className="vp-btn" onClick={run} disabled={loading}><RefreshCw size={14} /> Refresh</button>
            </div>

            {error && <div className="vp-card" style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</div>}
            {loading ? (
                <div className="vp-empty">Asking the AI counsellor…</div>
            ) : (
                <div className="vp-grid vp-mt-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {matches.map(m => (
                        <div key={m.id} className="vp-card">
                            <h3>{m.title || m.name}</h3>
                            <p className="vp-text-sm">
                                {m.domain || m.provider || m.expertise}
                                {m.amount ? ` · ${m.amount}` : ''}
                                {m.avg_salary ? ` · ${m.avg_salary}` : ''}
                            </p>
                            <p>{m.summary || m.eligibility || m.bio}</p>
                            {m.education && <p className="vp-text-sm"><strong>Education:</strong> {m.education}</p>}
                            {m.languages && <p className="vp-text-sm"><strong>Languages:</strong> {m.languages}</p>}
                            {m.availability && <p className="vp-text-sm"><strong>Availability:</strong> {m.availability}</p>}
                            {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="vp-btn vp-btn-secondary vp-mt-12">Open link</a>}
                            {m.contact && <p className="vp-text-sm"><strong>Contact:</strong> {m.contact}</p>}
                            {m.explanation && (
                                <div className="vp-card" style={{ background: 'rgba(79,70,229,0.06)', borderColor: 'rgba(79,70,229,0.2)' }}>
                                    <strong>Why this matches you</strong>
                                    <p style={{ marginTop: 6, marginBottom: 0 }}>{m.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
