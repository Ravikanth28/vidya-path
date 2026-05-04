import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'

export default function VPNotifications() {
    const { t } = useI18n()
    const [items, setItems] = useState([])
    const [showAll, setShowAll] = useState(false)
    const [loading, setLoading] = useState(true)

    const load = (all = showAll) => {
        setLoading(true)
        vpApi.notifications(all).then(r => setItems(r.items || [])).catch(() => setItems([])).finally(() => setLoading(false))
    }
    useEffect(() => { load(showAll) }, [showAll])

    return (
        <div>
            <h1 className="vp-h1"><Bell size={22} /> {t('vp_notifications') || 'Notifications'}</h1>
            <div className="vp-row vp-mt-12">
                <button className={'vp-tab' + (!showAll ? ' active' : '')} onClick={() => setShowAll(false)}>Unread</button>
                <button className={'vp-tab' + (showAll ? ' active' : '')} onClick={() => setShowAll(true)}>All</button>
                <button className="vp-btn" onClick={async () => { await vpApi.markAllRead(); load() }}>
                    <CheckCheck size={14} /> Mark all read
                </button>
            </div>
            {loading ? (
                <div className="vp-empty">{t('loading') || 'Loading…'}</div>
            ) : items.length === 0 ? (
                <div className="vp-empty">No notifications.</div>
            ) : (
                <div className="vp-grid vp-mt-12">
                    {items.map(n => (
                        <div key={n.id} className="vp-card" style={{ opacity: n.is_read ? 0.6 : 1 }}>
                            <h3>{n.title}</h3>
                            <p>{n.body}</p>
                            <p className="vp-text-sm">{new Date(n.created_at).toLocaleString()} · {n.kind}</p>
                            {!n.is_read && (
                                <button className="vp-btn vp-btn-secondary" onClick={async () => {
                                    await vpApi.markRead(n.id); load()
                                }}>Mark read</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
