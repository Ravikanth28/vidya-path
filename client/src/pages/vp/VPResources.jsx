import { useState } from 'react'
import { BookOpen, Youtube } from 'lucide-react'
import { useAuth } from '../../App'
import LessonsList from './LessonsList'
import YouTubeRecommendations from '@/components/YouTubeRecommendations'

const TABS = [
    { key: 'lessons', label: 'Lessons',           icon: <BookOpen size={16} /> },
    { key: 'youtube', label: 'YouTube Resources',  icon: <Youtube size={16} /> }
]

export default function VPResources() {
    const auth = useAuth()
    const user = auth?.user
    const [tab, setTab] = useState('lessons')

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: tab === t.key ? '1.5px solid #60a5fa' : '1.5px solid rgba(148,163,184,0.2)',
                            background: tab === t.key ? 'rgba(96,165,250,0.12)' : 'transparent',
                            color: tab === t.key ? '#60a5fa' : 'rgba(148,163,184,0.8)',
                            fontWeight: tab === t.key ? 600 : 400,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'lessons' && <LessonsList />}
            {tab === 'youtube' && <YouTubeRecommendations user={user} />}
        </div>
    )
}
