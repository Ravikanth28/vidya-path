import { useState, useRef, useEffect } from 'react'
import { Mic, Send, StopCircle, Volume2 } from 'lucide-react'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { queueOfflineEvent } from '@/services/vp/syncEngine'

/**
 * In-lesson and standalone AI Voice Tutor.
 * Props:
 *   lessonId  — optional, attaches lesson context to the LLM prompt
 *   compact   — boolean, smaller layout for floating widget
 */
export default function VoiceTutor({ lessonId, compact = false }) {
    const { locale, t } = useI18n()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [busy, setBusy] = useState(false)
    const [recording, setRecording] = useState(false)
    const recorderRef = useRef(null)
    const audioRef = useRef(null)
    const scrollRef = useRef(null)

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages])

    const sendText = async () => {
        const q = input.trim()
        if (!q || busy) return
        setInput('')
        setMessages(m => [...m, { role: 'user', content: q }])
        setBusy(true)
        try {
            if (!navigator.onLine) {
                const fallback = "I'm offline right now. Your question has been saved and will be answered when you're back online."
                setMessages(m => [...m, { role: 'assistant', content: fallback }])
                await queueOfflineEvent('voice_query', { lesson_id: lessonId, lang: locale, question: q, answer: fallback, mode: 'text', provider: 'offline' })
            } else {
                const out = await vpApi.tutorText({ question: q, lang: locale, lesson_id: lessonId })
                setMessages(m => [...m, { role: 'assistant', content: out.answer || '(no reply)' }])
            }
        } catch (err) {
            setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + (err.response?.data?.error || err.message) }])
        } finally {
            setBusy(false)
        }
    }

    const startRecording = async () => {
        if (recording || busy) return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            const chunks = []
            mr.ondataavailable = (e) => e.data && chunks.push(e.data)
            mr.onstop = async () => {
                stream.getTracks().forEach(track => track.stop())
                const blob = new Blob(chunks, { type: 'audio/webm' })
                await sendVoice(blob)
            }
            mr.start()
            recorderRef.current = mr
            setRecording(true)
        } catch (err) {
            alert('Microphone permission denied: ' + err.message)
        }
    }

    const stopRecording = () => {
        const mr = recorderRef.current
        if (mr && mr.state !== 'inactive') {
            mr.stop()
        }
        recorderRef.current = null
        setRecording(false)
    }

    const sendVoice = async (blob) => {
        if (!blob || blob.size === 0) return
        setBusy(true)
        setMessages(m => [...m, { role: 'user', content: '🎤 (voice message)' }])
        try {
            const fd = new FormData()
            fd.append('audio', blob, 'speech.webm')
            fd.append('lang', locale)
            if (lessonId) fd.append('lesson_id', lessonId)
            fd.append('speak_back', 'true')
            const out = await vpApi.tutorVoice(fd)
            const text = out.answer || '(no reply)'
            setMessages(m => {
                // replace the last placeholder with the transcript
                const copy = [...m]
                copy[copy.length - 1] = { role: 'user', content: '🎤 ' + (out.transcript || '(no transcript)') }
                copy.push({ role: 'assistant', content: text, audio_b64: out.audio_b64, audio_mime: out.audio_mime })
                return copy
            })
            if (out.audio_b64) playBase64(out.audio_b64, out.audio_mime || 'audio/wav')
        } catch (err) {
            setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + (err.response?.data?.error || err.message) }])
        } finally {
            setBusy(false)
        }
    }

    const playBase64 = (b64, mime) => {
        try {
            const blob = base64ToBlob(b64, mime)
            const url = URL.createObjectURL(blob)
            if (audioRef.current) {
                audioRef.current.src = url
                audioRef.current.play().catch(() => { /* user gesture required */ })
            }
        } catch { /* ignore */ }
    }

    return (
        <div className="vp-tutor" style={compact ? { fontSize: 13 } : {}}>
            <div ref={scrollRef} className="vp-tutor-msgs" style={compact ? { maxHeight: 280 } : {}}>
                {messages.length === 0 && (
                    <div className="vp-text-sm" style={{ textAlign: 'center', padding: 20 }}>
                        {t('vp_tutor_intro') || 'Ask me any question about this lesson — type or hold the mic.'}
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`vp-msg ${m.role}`}>
                        {m.content}
                        {m.audio_b64 && (
                            <button
                                onClick={() => playBase64(m.audio_b64, m.audio_mime)}
                                className="vp-btn"
                                style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
                                title="Play audio"
                            >
                                <Volume2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
                {busy && <div className="vp-msg assistant">…</div>}
            </div>
            <div className="vp-tutor-input">
                <textarea
                    rows={2}
                    placeholder={t('vp_tutor_placeholder') || 'Ask a question…'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
                    disabled={busy || recording}
                />
                <button
                    type="button"
                    className={`vp-btn vp-mic ${recording ? 'recording' : ''}`}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording() }}
                    onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
                    title="Hold to record"
                    disabled={busy}
                >
                    {recording ? <StopCircle size={16} /> : <Mic size={16} />}
                </button>
                <button className="vp-btn vp-btn-primary" onClick={sendText} disabled={busy || !input.trim()}>
                    <Send size={16} />
                </button>
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
    )
}

function base64ToBlob(b64, mime) {
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return new Blob([arr], { type: mime })
}
