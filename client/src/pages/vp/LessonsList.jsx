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
    const [fetchError, setFetchError] = useState(null)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            setFetchError(null)
            try {
                const r = await vpApi.lessons({ lang: locale })
                if (mounted) {
                    setItems(r.items || [])
                    setOfflineMode(false)
                }
            } catch (err) {
                const status = err.response?.status
                const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message
                // Only fall back to offline cache when truly offline (no network)
                if (!navigator.onLine || status === undefined) {
                    const cached = await listCachedLessons()
                    if (mounted) {
                        setItems(cached.map(c => ({
                            id: c.id, subject: c.subject, title: c.title,
                            status: 'not_started', mastery_pct: 0, preview: (c.body || '').slice(0, 160)
                        })))
                        setOfflineMode(true)
                    }
                } else {
                    // Server returned an error (401, 500, etc.) — show it
                    if (mounted) {
                        setFetchError({ status, message: serverMsg, raw: JSON.stringify(err.response?.data || {}, null, 2) })
                        setItems([])
                        setOfflineMode(false)
                    }
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

            {fetchError && (
                <div style={{ margin: '12px 0', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: '0.85rem', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(248,113,113,0.15)', borderBottom: '1px solid rgba(248,113,113,0.25)' }}>
                        <span style={{ fontWeight: 700 }}>⚠ Failed to load lessons</span>
                        {fetchError.status && <span style={{ marginLeft: 'auto', background: 'rgba(248,113,113,0.25)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontFamily: 'monospace' }}>HTTP {fetchError.status}</span>}
                        <button onClick={() => setFetchError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, marginLeft: fetchError.status ? 4 : 'auto' }}>✕</button>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div><strong>{fetchError.message}</strong></div>
                        {fetchError.raw && fetchError.raw !== '{}' && (
                            <div>
                                <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Server Response</span>
                                <pre style={{ margin: '4px 0 0', padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflowY: 'auto', color: '#fca5a5' }}>{fetchError.raw}</pre>
                            </div>
                        )}
                        {fetchError.status === 401 && (
                            <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Your session may have expired. <a href="/login" style={{ color: '#60a5fa' }}>Log in again →</a></div>
                        )}
                    </div>
                </div>
            )}

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
                            {list.map(l => {
                                // Progress bar: completed=100%, in_progress uses last_position or mastery, not_started=0%
                                const barPct = l.status === 'completed'
                                    ? 100
                                    : l.status === 'in_progress'
                                        ? Math.max(l.mastery_pct || 0, l.last_position || 0, 15)
                                        : 0

                                // Bottom label: only show mastery% when there's a real score
                                const progressLabel = l.status === 'completed'
                                    ? l.mastery_pct > 0 ? `Mastery ${Math.round(l.mastery_pct)}%` : 'Lesson completed'
                                    : l.status === 'in_progress'
                                        ? l.mastery_pct > 0 ? `Mastery ${Math.round(l.mastery_pct)}%` : 'In progress'
                                        : 'Not started'

                                return (
                                <Link key={l.id} to={`/student/vp/lessons/${l.id}`} className="vp-card" style={{ textDecoration: 'none' }}>
                                    <span className={`vp-badge ${l.status}`}>{l.status.replace('_', ' ')}</span>
                                    <h3 style={{ marginTop: 6 }}>{l.title}</h3>
                                    <p className="vp-text-sm">{l.preview}</p>
                                    <div className="vp-progress"><div style={{ width: `${barPct}%` }} /></div>
                                    <p className="vp-text-sm">{progressLabel}</p>
                                </Link>
                                )
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}
