import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Target, Briefcase, Sparkles, Award, Brain } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'

export default function VPDashboard() {
    const { t } = useI18n()
    const [profile, setProfile] = useState(null)
    const [diagnostic, setDiagnostic] = useState(null)
    const [recommendations, setRecommendations] = useState([])
    const [unread, setUnread] = useState(0)

    useEffect(() => {
        Promise.all([
            vpApi.profile().catch(() => null),
            vpApi.diagState().catch(() => null),
            vpApi.practiceRecommended().catch(() => ({ items: [] })),
            vpApi.notifications().catch(() => ({ unread: 0 }))
        ]).then(([p, d, r, n]) => {
            setProfile(p); setDiagnostic(d); setRecommendations(r?.items || []); setUnread(n?.unread || 0)
        })
    }, [])

    return (
        <div>
            <h1 className="vp-h1">
                {t('vp_welcome') || 'Welcome to VidyaPath'}{profile?.user?.name ? `, ${profile.user.name}` : ''}
            </h1>

            <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <StatCard icon={<BookOpen size={18} />} title="Lessons completed"
                    value={profile?.mastery?.length || 0}
                    link="/student/vp/lessons" linkLabel="Browse lessons" />

                <StatCard icon={<Target size={18} />} title="XP points"
                    value={profile?.prefs?.xp_points || 0}
                    link="/student/vp/practice" linkLabel="Earn more" />

                <StatCard icon={<Award size={18} />} title="Top mastery"
                    value={profile?.mastery?.[0] ? `${profile.mastery[0].title} — ${profile.mastery[0].pct}%` : '—'}
                    link="/student/vp/profile" linkLabel="View profile" />

                <StatCard icon={<Sparkles size={18} />} title="AI Tutor"
                    value="Ask anything"
                    link="/student/vp/tutor" linkLabel="Open tutor" />

                <StatCard icon={<Brain size={18} />} title="Personalized Study"
                    value="Your learning path"
                    link="/student/vp/personalized" linkLabel="View plan" />
            </div>

            <h2 className="vp-h2">{t('vp_recommended') || 'Recommended for you'}</h2>
            {recommendations.length === 0 ? (
                <div className="vp-empty">{t('no_data') || 'No recommendations yet. Start with a lesson.'}</div>
            ) : (
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    {recommendations.slice(0, 6).map(r => (
                        <Link key={r.id} to={`/student/vp/lessons/${r.id}`} className="vp-card" style={{ textDecoration: 'none' }}>
                            <h3>{r.title}</h3>
                            <p>{r.subject}</p>
                            <div className="vp-progress"><div style={{ width: `${Math.round(r.mastery_pct || 0)}%` }} /></div>
                            <p className="vp-text-sm">Mastery {Math.round(r.mastery_pct || 0)}%</p>
                        </Link>
                    ))}
                </div>
            )}

            <h2 className="vp-h2">{t('vp_quick_links') || 'Quick links'}</h2>
            <div className="vp-row">
                <Link to="/student/vp/careers" className="vp-btn"><Briefcase size={14} /> Career Hub</Link>
                <Link to="/student/vp/notifications" className="vp-btn">Notifications {unread > 0 ? `(${unread})` : ''}</Link>
                <Link to="/student/vp/profile" className="vp-btn">My profile</Link>
            </div>
        </div>
    )
}

function StatCard({ icon, title, value, link, linkLabel }) {
    return (
        <div className="vp-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {title}</h3>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{value}</p>
            {link && <Link to={link} className="vp-btn vp-btn-secondary vp-mt-12" style={{ display: 'inline-block' }}>{linkLabel}</Link>}
        </div>
    )
}
