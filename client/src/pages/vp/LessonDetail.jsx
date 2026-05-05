import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Volume2, Play, Target, ArrowLeft, CheckCircle } from 'lucide-react'
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
                <button className="vp-btn" onClick={() => navigate(`/student/vp/lessons/${id}/quiz`)}>
                    <Target size={14} /> {t('vp_take_quiz') || 'Take quiz'}
                </button>
                {completed && <span className="vp-badge completed"><CheckCircle size={12} /> Completed</span>}
            </div>

            <div className="vp-card vp-mt-24" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {lesson.body || '(no content available)'}
            </div>

            <h2 className="vp-h2"><Volume2 size={18} /> {t('vp_ask_tutor') || 'Ask the AI tutor about this lesson'}</h2>
            <div className="vp-card">
                <VoiceTutor lessonId={id} />
            </div>
        </div>
    )
}
