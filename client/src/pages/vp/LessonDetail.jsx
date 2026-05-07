import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Volume2, Play, Target, ArrowLeft, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { cacheLesson, getCachedLesson } from '@/services/vp/lessonCache'
import { queueOfflineEvent } from '@/services/vp/syncEngine'
import VoiceTutor from '@/components/vp/VoiceTutor'

export default function LessonDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { locale, t } = useI18n()
    const [lesson, setLesson] = useState(null)
    const [completed, setCompleted] = useState(false)
    const [offline, setOffline] = useState(false)
    const synthRef = useRef(null)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const l = await vpApi.lesson(id, locale)
                if (!mounted) return
                setLesson(l)
                setCompleted(l.status === 'completed')
                cacheLesson(l)
            } catch {
                const cached = await getCachedLesson(id)
                if (!mounted) return
                if (cached) {
                    setLesson(cached)
                    setOffline(true)
                } else {
                    alert(t('error_occurred') || 'Lesson not available offline.')
                }
            }
        }
        load()
        return () => {
            mounted = false
            try { window.speechSynthesis?.cancel() } catch {}
        }
    }, [id, locale])

    if (!lesson) return <div className="vp-empty">{t('loading') || 'Loading…'}</div>

    const playAudio = () => {
        if (lesson.audio_url) {
            // Server-provided audio
            const audio = new Audio(lesson.audio_url)
            audio.onended = onAudioEnded
            audio.play()
            return
        }
        // Browser SpeechSynthesis fallback
        if (!('speechSynthesis' in window)) {
            alert('Audio narration not supported in this browser.')
            return
        }
        try { window.speechSynthesis.cancel() } catch {}
        const utter = new SpeechSynthesisUtterance(String(lesson.body || '').slice(0, 4000))
        utter.lang = locale === 'hi' ? 'hi-IN' : locale === 'ta' ? 'ta-IN' : 'en-IN'
        utter.rate = 0.95
        utter.onend = onAudioEnded
        synthRef.current = utter
        window.speechSynthesis.speak(utter)
    }

    const onAudioEnded = async () => {
        if (completed) return
        try {
            if (navigator.onLine) await vpApi.lessonComplete(id)
            else await queueOfflineEvent('lesson_complete', { lesson_id: id })
            setCompleted(true)
        } catch (err) {
            console.warn('completion sync failed:', err.message)
        }
    }

    const markStarted = async () => {
        if (lesson.status !== 'not_started') return
        try {
            if (navigator.onLine) await vpApi.lessonProgress(id, { status: 'in_progress' })
            else await queueOfflineEvent('lesson_progress', { lesson_id: id, status: 'in_progress' })
        } catch {}
    }

    return (
        <div>
            <Link to="/student/vp/resources" className="vp-btn vp-btn-secondary"><ArrowLeft size={14} /> {t('back') || 'Back'}</Link>
            <h1 className="vp-h1" style={{ marginTop: 16 }}>{lesson.title}</h1>
            <p className="vp-text-sm">{lesson.subject} {offline && '· Offline'}</p>

            <div className="vp-row vp-mt-12">
                <button className="vp-btn vp-btn-primary" onClick={() => { markStarted(); playAudio() }}>
                    <Play size={14} /> {t('vp_play_audio') || 'Play audio narration'}
                </button>
                <button className="vp-btn" onClick={() => navigate('/student/vp/practice')}>
                    <Target size={14} /> {t('vp_take_quiz') || 'Take quiz'}
                </button>
                {completed && <span className="vp-badge completed"><CheckCircle size={12} /> Completed</span>}
            </div>

            <div className="vp-card vp-mt-24 lesson-notes" style={{ lineHeight: 1.7 }}>
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4 }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '14px 0 4px' }}>{children}</h3>,
                        p: ({ children }) => <p style={{ margin: '6px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ margin: '6px 0 6px 20px', padding: 0 }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '6px 0 6px 20px', padding: 0 }}>{children}</ol>,
                        li: ({ children }) => <li style={{ margin: '3px 0' }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                        code: ({ children }) => <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.9em' }}>{children}</code>
                    }}
                >{lesson.body || '(no content available)'}</ReactMarkdown>
            </div>

            <h2 className="vp-h2"><Volume2 size={18} /> {t('vp_ask_tutor') || 'Ask the AI tutor about this lesson'}</h2>
            <div className="vp-card">
                <VoiceTutor lessonId={id} />
            </div>
        </div>
    )
}
