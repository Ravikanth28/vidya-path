import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Volume2, Play, Square, Target, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { cacheLesson, getCachedLesson } from '@/services/vp/lessonCache'
import { queueOfflineEvent } from '@/services/vp/syncEngine'
import VoiceTutor from '@/components/vp/VoiceTutor'

const DIFFICULTY_LABEL = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' }

const mdComponents = {
    h1: ({ children }) => <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '20px 0 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4 }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '14px 0 4px' }}>{children}</h3>,
    p: ({ children }) => <p style={{ margin: '6px 0' }}>{children}</p>,
    ul: ({ children }) => <ul style={{ margin: '6px 0 6px 20px', padding: 0 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '6px 0 6px 20px', padding: 0 }}>{children}</ol>,
    li: ({ children }) => <li style={{ margin: '3px 0' }}>{children}</li>,
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    code: ({ children }) => <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.9em' }}>{children}</code>
}

export default function LessonDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { locale, t } = useI18n()
    const [lesson, setLesson] = useState(null)
    const [completed, setCompleted] = useState(false)
    const [offline, setOffline] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [showScript, setShowScript] = useState(false)
    const audioRef = useRef(null)
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
            stopAudio()
        }
    }, [id, locale])

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        try { window.speechSynthesis?.cancel() } catch {}
        synthRef.current = null
        setPlaying(false)
    }

    const onAudioEnded = async () => {
        setPlaying(false)
        if (completed) return
        try {
            if (navigator.onLine) await vpApi.lessonComplete(id)
            else await queueOfflineEvent('lesson_complete', { lesson_id: id })
            setCompleted(true)
        } catch (err) {
            console.warn('completion sync failed:', err.message)
        }
    }

    const playAudio = () => {
        if (playing) { stopAudio(); return }
        markStarted()
        if (lesson.audio_url) {
            const audio = new Audio(lesson.audio_url)
            audioRef.current = audio
            audio.onended = onAudioEnded
            audio.onerror = () => setPlaying(false)
            audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
            return
        }
        if (!('speechSynthesis' in window)) {
            alert('Audio narration not supported in this browser.')
            return
        }
        try { window.speechSynthesis.cancel() } catch {}
        const narrationText = lesson.script || lesson.body || ''
        const utter = new SpeechSynthesisUtterance(String(narrationText).slice(0, 4000))
        const langMap = { hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', gu: 'gu-IN', mr: 'mr-IN', pa: 'pa-IN' }
        utter.lang = langMap[locale] || 'en-IN'
        utter.rate = 0.92
        utter.onend = onAudioEnded
        synthRef.current = utter
        window.speechSynthesis.speak(utter)
        setPlaying(true)
    }

    const markStarted = async () => {
        if (!lesson || lesson.status !== 'not_started') return
        try {
            if (navigator.onLine) await vpApi.lessonProgress(id, { status: 'in_progress' })
            else await queueOfflineEvent('lesson_progress', { lesson_id: id, status: 'in_progress' })
        } catch {}
    }

    if (!lesson) return <div className="vp-empty">{t('loading') || 'Loading…'}</div>

    return (
        <div>
            <Link to="/student/vp/resources" className="vp-btn vp-btn-secondary">
                <ArrowLeft size={14} /> {t('back') || 'Back'}
            </Link>
            <h1 className="vp-h1" style={{ marginTop: 16 }}>{lesson.title}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="vp-text-sm">{lesson.subject}</span>
                {lesson.difficulty && (
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 99,
                        background: lesson.difficulty === 'easy' ? 'rgba(16,185,129,0.15)' : lesson.difficulty === 'hard' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                        color: lesson.difficulty === 'easy' ? '#6ee7b7' : lesson.difficulty === 'hard' ? '#fca5a5' : '#fcd34d'
                    }}>
                        {DIFFICULTY_LABEL[lesson.difficulty] || lesson.difficulty}
                    </span>
                )}
                {offline && <span className="vp-text-sm" style={{ color: '#f59e0b' }}>· Offline</span>}
            </div>

            {/* Audio Player */}
            <div style={{
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
            }}>
                <button className="vp-btn vp-btn-primary" onClick={playAudio} style={{ minWidth: 190 }}>
                    {playing
                        ? <><Square size={14} fill="currentColor" /> Stop Audio</>
                        : <><Play size={14} /> {t('vp_play_audio') || 'Play Audio Narration'}</>
                    }
                </button>
                {playing && (
                    <span style={{ fontSize: '0.8rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.5s infinite' }} />
                        Playing narration…
                    </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {lesson.audio_url ? '🔊 AI voice ready' : lesson.script ? '📜 Script · browser TTS' : '📖 Browser TTS'}
                </span>
            </div>

            <div className="vp-row vp-mt-4" style={{ marginBottom: 20 }}>
                <button className="vp-btn" onClick={() => navigate('/student/vp/practice')}>
                    <Target size={14} /> {t('vp_take_quiz') || 'Take quiz'}
                </button>
                {completed && (
                    <span className="vp-badge completed"><CheckCircle size={12} /> Completed</span>
                )}
            </div>

            {/* Lesson Notes */}
            <div className="vp-card lesson-notes" style={{ lineHeight: 1.8, marginBottom: 20 }}>
                <ReactMarkdown components={mdComponents}>
                    {lesson.body || '(no content available)'}
                </ReactMarkdown>
            </div>

            {/* AI Teaching Script (collapsible) */}
            {lesson.script && (
                <div style={{ border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <button
                        onClick={() => setShowScript(s => !s)}
                        style={{
                            width: '100%', background: 'rgba(167,139,250,0.08)', border: 'none',
                            padding: '12px 16px', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'space-between',
                            color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem'
                        }}
                    >
                        <span><BookOpen size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />AI Teaching Script</span>
                        {showScript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showScript && (
                        <div style={{
                            padding: '16px', background: 'rgba(167,139,250,0.04)',
                            lineHeight: 1.85, fontSize: '0.9rem', color: 'var(--text-main)',
                            whiteSpace: 'pre-wrap', maxHeight: 500, overflowY: 'auto'
                        }}>
                            {lesson.script}
                        </div>
                    )}
                </div>
            )}

            <h2 className="vp-h2"><Volume2 size={18} /> {t('vp_ask_tutor') || 'Ask the AI tutor about this lesson'}</h2>
            <div className="vp-card">
                <VoiceTutor lessonId={id} />
            </div>
        </div>
    )
}
