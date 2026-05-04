import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'

const TABS = [
    { key: 'recommended', label: 'Recommended' },
    { key: 'completed',   label: 'All Completed' }
]

export default function PracticePicker() {
    const { t } = useI18n()
    const [tab, setTab] = useState('recommended')
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        const fn = tab === 'recommended' ? vpApi.practiceRecommended : vpApi.practiceCompleted
        fn().then(r => { if (mounted) setItems(r.items || []) })
            .catch(() => mounted && setItems([]))
            .finally(() => mounted && setLoading(false))
        return () => { mounted = false }
    }, [tab])

    return (
        <div>
            <h1 className="vp-h1">{t('vp_practice') || 'Practice'}</h1>
            <p className="vp-text-sm">{t('vp_practice_intro') || 'Pick a lesson to practice. Recommended uses BKT to surface concepts that need review.'}</p>

            <div className="vp-card vp-mt-12" style={{ background: '#fef3c7', borderColor: '#f59e0b' }}>
                <strong>📋 Proctoring notice</strong>
                <p className="vp-text-sm" style={{ margin: '4px 0 0 0' }}>
                    Quizzes are proctored — switching tabs and excessive time gaps are logged.
                </p>
            </div>

            <div className="vp-tabs vp-mt-12">
                {TABS.map(s => (
                    <button key={s.key} className={'vp-tab' + (tab === s.key ? ' active' : '')} onClick={() => setTab(s.key)}>
                        {t(s.key) || s.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="vp-empty">{t('loading') || 'Loading…'}</div>
            ) : items.length === 0 ? (
                <div className="vp-empty">No lessons in this tab yet.</div>
            ) : (
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {items.map(l => (
                        <Link key={l.id} to={`/student/vp/lessons/${l.id}/quiz`} className="vp-card" style={{ textDecoration: 'none' }}>
                            <h3>{l.title}</h3>
                            <p className="vp-text-sm">{l.subject}</p>
                            {typeof l.mastery_pct === 'number' && (
                                <>
                                    <div className="vp-progress"><div style={{ width: `${Math.round(l.mastery_pct)}%` }} /></div>
                                    <p className="vp-text-sm">Mastery {Math.round(l.mastery_pct)}%</p>
                                </>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
