import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { listCachedLessons } from '@/services/vp/lessonCache'

const TABS = [
    { key: 'all',         label: 'All' },
    { key: 'not_started', label: 'Not started' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'completed',   label: 'Completed' }
]

export default function LessonsList() {
    const { t, locale } = useI18n()
    const [items, setItems] = useState([])
    const [tab, setTab] = useState('all')
    const [q, setQ] = useState('')
    const [loading, setLoading] = useState(true)
    const [offlineMode, setOfflineMode] = useState(false)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            try {
                const r = await vpApi.lessons({ lang: locale })
                if (mounted) {
                    setItems(r.items || [])
                    setOfflineMode(false)
                }
            } catch {
                const cached = await listCachedLessons()
                if (mounted) {
                    setItems(cached.map(c => ({
                        id: c.id, subject: c.subject, title: c.title,
                        status: 'not_started', mastery_pct: 0, preview: (c.body || '').slice(0, 160)
                    })))
                    setOfflineMode(true)
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [locale])

    const filtered = useMemo(() => {
        let it = items
        if (tab !== 'all') it = it.filter(i => i.status === tab)
        if (q) {
            const lc = q.toLowerCase()
            it = it.filter(i => (i.title + ' ' + i.preview + ' ' + i.subject).toLowerCase().includes(lc))
        }
        return it
    }, [items, tab, q])

    const grouped = useMemo(() => {
        const g = {}
        for (const i of filtered) (g[i.subject] = g[i.subject] || []).push(i)
        return g
    }, [filtered])

    return (
        <div>
            <h1 className="vp-h1">{t('vp_lessons') || 'Lessons'}{offlineMode && ' (offline cache)'}</h1>
            <input className="vp-search vp-mt-12" placeholder={t('search') || 'Search lessons…'} value={q} onChange={e => setQ(e.target.value)} />
            <div className="vp-tabs vp-mt-12">
                {TABS.map(s => (
                    <button key={s.key} className={'vp-tab' + (tab === s.key ? ' active' : '')} onClick={() => setTab(s.key)}>
                        {t(s.key) || s.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="vp-empty">{t('loading') || 'Loading…'}</div>
            ) : filtered.length === 0 ? (
                <div className="vp-empty">{t('no_data') || 'No lessons match.'}</div>
            ) : (
                Object.entries(grouped).map(([subject, list]) => (
                    <section key={subject}>
                        <h2 className="vp-h2">{subject}</h2>
                        <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                            {list.map(l => (
                                <Link key={l.id} to={`/student/vp/lessons/${l.id}`} className="vp-card" style={{ textDecoration: 'none' }}>
                                    <span className={`vp-badge ${l.status}`}>{l.status.replace('_', ' ')}</span>
                                    <h3 style={{ marginTop: 6 }}>{l.title}</h3>
                                    <p className="vp-text-sm">{l.preview}</p>
                                    <div className="vp-progress"><div style={{ width: `${Math.round(l.mastery_pct || 0)}%` }} /></div>
                                    <p className="vp-text-sm">Mastery {Math.round(l.mastery_pct || 0)}%</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}
