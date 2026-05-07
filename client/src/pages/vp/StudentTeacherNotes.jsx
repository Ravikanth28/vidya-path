/**
 * Teacher's Notes â€” split-column layout.
 * Left: note list | Right: inline preview + AI Tutor side panel.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
    BookOpen, Download, Loader2, Eye, Sparkles,
    Send, Mic, StopCircle, FileText, X
} from 'lucide-react'
import vpApi from '@/services/vp/api'
import * as pdfjsLib from 'pdfjs-dist'

// Configure pdf.js worker (v5, Vite-compatible)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href

const API   = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/vp'
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

/* â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt      = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`
const extOf    = (n) => n?.split('.').pop()?.toLowerCase() || ''
const extLabel = (n) => extOf(n).toUpperCase() || 'FILE'
const extColor = (n) => {
    const e = extOf(n)
    return e === 'pdf' ? '#ef4444'
         : e === 'docx' || e === 'doc' ? '#3b82f6'
         : e === 'pptx' || e === 'ppt' ? '#f59e0b'
         : ['png','jpg','jpeg','gif','webp'].includes(e) ? '#10b981'
         : '#8b5cf6'
}
const isImage = (n) => ['png','jpg','jpeg','gif','webp','bmp','svg'].includes(extOf(n))
const isPDF   = (n) => extOf(n) === 'pdf'
const isText  = (n) => ['txt','md','csv','json','xml','html','htm','py','js','ts','css'].includes(extOf(n))

/* â”€â”€â”€ AI Tutor side panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TutorPanel({ initialQuestion, onClose }) {
    const [msgs,      setMsgs]      = useState([])
    const [input,     setInput]     = useState('')
    const [busy,      setBusy]      = useState(false)
    const [recording, setRecording] = useState(false)
    const recRef    = useRef(null)
    const scrollRef = useRef(null)

    // Auto-send when a new selection question comes in
    useEffect(() => {
        if (!initialQuestion) return
        setInput('')
        setMsgs(m => [...m, { role: 'user', content: initialQuestion }])
        setBusy(true)
        vpApi.tutorText({ question: initialQuestion, lang: 'en' })
            .then(out => setMsgs(m => [...m, { role: 'assistant', content: out.answer || '(no reply)' }]))
            .catch(e  => setMsgs(m => [...m, { role: 'assistant', content: 'Error: ' + (e.response?.data?.error || e.message) }]))
            .finally(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialQuestion])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [msgs, busy])

    const send = async () => {
        const q = input.trim()
        if (!q || busy) return
        setInput('')
        setMsgs(m => [...m, { role: 'user', content: q }])
        setBusy(true)
        try {
            const out = await vpApi.tutorText({ question: q, lang: 'en' })
            setMsgs(m => [...m, { role: 'assistant', content: out.answer || '(no reply)' }])
        } catch (e) {
            setMsgs(m => [...m, { role: 'assistant', content: 'Error: ' + (e.response?.data?.error || e.message) }])
        } finally { setBusy(false) }
    }

    const startRec = async () => {
        if (recording || busy) return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            const chunks = []
            mr.ondataavailable = e => e.data && chunks.push(e.data)
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(chunks, { type: 'audio/webm' })
                const placeholder = 'ðŸŽ¤ (voice)'
                setMsgs(m => [...m, { role: 'user', content: placeholder }])
                setBusy(true)
                try {
                    const fd = new FormData()
                    fd.append('audio', blob, 'speech.webm')
                    fd.append('lang', 'en'); fd.append('speak_back', 'false')
                    const out = await vpApi.tutorVoice(fd)
                    setMsgs(m => {
                        const c = [...m]
                        c[c.length - 1] = { role: 'user', content: 'ðŸŽ¤ ' + (out.transcript || '(voice)') }
                        c.push({ role: 'assistant', content: out.answer || '(no reply)' })
                        return c
                    })
                } catch (e) {
                    setMsgs(m => [...m, { role: 'assistant', content: 'Error: ' + e.message }])
                } finally { setBusy(false) }
            }
            mr.start(); recRef.current = mr; setRecording(true)
        } catch (e) { alert('Mic error: ' + e.message) }
    }
    const stopRec = () => {
        if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
        recRef.current = null; setRecording(false)
    }

    return (
        <div style={{
            width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderLeft: '1px solid rgba(139,92,246,0.2)',
            background: 'rgba(10,8,28,0.97)'
        }}>
            {/* header */}
            <div style={{
                padding: '12px 14px', borderBottom: '1px solid rgba(139,92,246,0.18)',
                display: 'flex', alignItems: 'center', gap: 8
            }}>
                <Sparkles size={15} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0', flex: 1 }}>AI Tutor</span>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#475569', display: 'flex', padding: 2
                }}><X size={15} /></button>
            </div>

            {/* messages */}
            <div ref={scrollRef} style={{
                flex: 1, overflowY: 'auto', padding: '12px 12px',
                display: 'flex', flexDirection: 'column', gap: 10
            }}>
                {msgs.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '28px 10px',
                        color: '#334155', fontSize: '0.78rem', lineHeight: 1.7
                    }}>
                        <Sparkles size={26} color="#1e293b" style={{ marginBottom: 10 }} />
                        <div style={{ color: '#475569' }}>
                            Select text from the notes and click<br />
                            <strong style={{ color: '#a78bfa' }}>Ask AI Tutor</strong> to get an explanation.<br />
                            Or just type your question below.
                        </div>
                    </div>
                )}
                {msgs.map((m, i) => (
                    <div key={i} style={{
                        maxWidth: '92%',
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user'
                            ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
                        border: m.role === 'user'
                            ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(148,163,184,0.1)',
                        borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                        padding: '8px 12px', fontSize: '0.8rem', color: '#e2e8f0',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                    }}>{m.content}</div>
                ))}
                {busy && (
                    <div style={{
                        alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(148,163,184,0.1)', borderRadius: '10px 10px 10px 2px',
                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.78rem', color: '#475569'
                    }}>
                        <Loader2 size={12} className="spin" /> Thinkingâ€¦
                    </div>
                )}
            </div>

            {/* input */}
            <div style={{
                padding: '10px 10px', borderTop: '1px solid rgba(148,163,184,0.08)',
                display: 'flex', gap: 6, alignItems: 'flex-end'
            }}>
                <textarea
                    rows={2} value={input} placeholder="Ask anythingâ€¦"
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    disabled={busy || recording}
                    style={{
                        flex: 1, resize: 'none', borderRadius: 8, padding: '7px 9px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.18)',
                        color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', lineHeight: 1.4
                    }}
                />
                <button
                    onMouseDown={startRec} onMouseUp={stopRec}
                    onTouchStart={e => { e.preventDefault(); startRec() }}
                    onTouchEnd={e => { e.preventDefault(); stopRec() }}
                    disabled={busy} title="Hold to record"
                    style={{
                        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                        background: recording ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.05)',
                        border: recording ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(148,163,184,0.15)',
                        color: recording ? '#f87171' : '#64748b', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {recording ? <StopCircle size={13} /> : <Mic size={13} />}
                </button>
                <button
                    onClick={send} disabled={busy || !input.trim()}
                    style={{
                        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                        background: input.trim() ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                        border: '1.5px solid rgba(139,92,246,0.3)',
                        color: input.trim() ? '#fff' : '#334155', cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s'
                    }}
                ><Send size={13} /></button>
            </div>
        </div>
    )
}

/* â”€â”€â”€ Selection popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SelectionPopup({ pos, onAsk }) {
    return (
        <div
            onClick={onAsk}
            style={{
                position: 'fixed',
                left: pos.x, top: pos.y - 46,
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'rgba(12,8,32,0.97)',
                border: '1.5px solid rgba(139,92,246,0.6)',
                borderRadius: 10, padding: '7px 15px',
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 6px 28px rgba(0,0,0,0.7)',
                cursor: 'pointer', userSelect: 'none',
                animation: 'notePopIn .14s ease'
            }}
        >
            <Sparkles size={13} color="#a78bfa" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', whiteSpace: 'nowrap' }}>
                Ask AI Tutor
            </span>
        </div>
    )
}

/* â”€â”€â”€ Preview pane content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* --- PDFPage: renders one page canvas + transparent selectable text layer --- */
function PDFPage({ page, scale }) {
    const canvasRef = useRef(null)
    const textRef   = useRef(null)
    const taskRef   = useRef(null)

    useEffect(() => {
        const canvas  = canvasRef.current
        const textDiv = textRef.current
        if (!canvas || !textDiv) return

        const vp  = page.getViewport({ scale })
        canvas.width  = vp.width
        canvas.height = vp.height
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, vp.width, vp.height)

        // Cancel any previous in-flight render
        taskRef.current?.cancel?.()

        const renderTask = page.render({ canvasContext: ctx, viewport: vp })
        taskRef.current = renderTask

        renderTask.promise.then(() => {
            if (!textDiv) return
            textDiv.innerHTML = ''
            textDiv.style.width  = vp.width  + 'px'
            textDiv.style.height = vp.height + 'px'
            const tl = new pdfjsLib.TextLayer({
                textContentSource: page.streamTextContent(),
                container: textDiv,
                viewport: vp,
            })
            taskRef.current = { cancel: () => tl.cancel?.() }
            tl.render().catch(() => {})
        }).catch(() => {})

        return () => { taskRef.current?.cancel?.() }
    }, [page, scale])

    const { width, height } = page.getViewport({ scale })
    return (
        <div style={{
            position: 'relative', width, height,
            flexShrink: 0, marginBottom: 16,
            boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
            background: '#fff',
        }}>
            {/* pointerEvents none so mouse events reach the text layer above */}
            <canvas ref={canvasRef} style={{ display: 'block', pointerEvents: 'none' }} />
            <div ref={textRef} className="textLayer" />
        </div>
    )
}

/* --- PDFViewer: loads all pages, ResizeObserver keeps scale fitted --- */
function PDFViewer({ blobUrl, onTextSelect }) {
    const containerRef   = useRef(null)
    const naturalWRef    = useRef(0)   // natural width at scale=1
    const [pages,   setPages]   = useState([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)
    const [scale,   setScale]   = useState(1.2)

    // Load PDF document and all pages
    useEffect(() => {
        if (!blobUrl) return
        let cancelled = false
        setLoading(true); setPages([]); setError(null); naturalWRef.current = 0

        pdfjsLib.getDocument(blobUrl).promise
            .then(async pdf => {
                if (cancelled) return
                const arr = []
                for (let i = 1; i <= pdf.numPages; i++) {
                    if (cancelled) return
                    arr.push(await pdf.getPage(i))
                }
                if (cancelled) return
                naturalWRef.current = arr[0]?.getViewport({ scale: 1 }).width || 600
                setPages(arr)
                setLoading(false)
            })
            .catch(e => { if (!cancelled) { setError(e.message); setLoading(false) } })

        return () => { cancelled = true }
    }, [blobUrl])

    // ResizeObserver: recalculate scale whenever the container resizes
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const calc = (w) => {
            if (!naturalWRef.current) return
            const avail = w - 40   // 16px padding each side + scroll
            const s = Math.min(2.0, Math.max(0.4, avail / naturalWRef.current))
            setScale(s)
        }

        const ro = new ResizeObserver(entries => {
            for (const e of entries) calc(e.contentRect.width)
        })
        ro.observe(el)
        // Trigger immediately once pages are loaded
        if (naturalWRef.current) calc(el.clientWidth)

        return () => ro.disconnect()
    }, [pages])  // re-attach after pages load so naturalWRef is populated

    const handleMouseUp = useCallback(() => {
        const sel  = window.getSelection()
        const text = sel?.toString().trim()
        if (text && text.length > 2 && sel.rangeCount > 0) {
            const rect = sel.getRangeAt(0).getBoundingClientRect()
            onTextSelect(text, { x: rect.left + rect.width / 2, y: rect.top })
        } else {
            onTextSelect(null, null)
        }
    }, [onTextSelect])

    return (
        <div
            ref={containerRef}
            onMouseUp={handleMouseUp}
            style={{
                flex: 1, overflow: 'auto', background: '#1a1a2e',
                padding: '16px',
                // Do NOT use alignItems:center — it causes left-overflow to be unreachable in Chrome
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            }}
        >
            {loading && (
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                    <Loader2 size={22} className="spin" style={{ color: '#a78bfa' }} />
                </div>
            )}
            {error && <div style={{ color: '#f87171', padding: 20 }}>PDF error: {error}</div>}
            {pages.map((page, i) => (
                // margin: 0 auto centers the page once it fits within the container
                <div key={i} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <PDFPage page={page} scale={scale} />
                </div>
            ))}
        </div>
    )
}
function PreviewPane({ note, blobUrl, textContent, onTextSelect }) {
    const textRef = useRef(null)

    const handleMouseUp = useCallback(() => {
        const sel = window.getSelection()
        const text = sel?.toString().trim()
        if (text && text.length > 3 && sel.rangeCount > 0) {
            const rect = sel.getRangeAt(0).getBoundingClientRect()
            onTextSelect(text, { x: rect.left + rect.width / 2, y: rect.top })
        } else {
            onTextSelect(null, null)
        }
    }, [onTextSelect])

    if (!blobUrl && textContent === null) return (
        <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#334155'
        }}>
            <Loader2 size={22} className="spin" />
        </div>
    )

    if (isPDF(note.original_name)) return (
        !blobUrl
            ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={22} className="spin" />
              </div>
            : <PDFViewer blobUrl={blobUrl} onTextSelect={onTextSelect} />
    )

    if (isImage(note.original_name)) return (
        <div style={{
            flex: 1, overflow: 'auto', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center',
            padding: 24, background: '#0a0e1a'
        }}>
            <img
                src={blobUrl} alt={note.title}
                style={{ maxWidth: '100%', borderRadius: 10, boxShadow: '0 4px 40px rgba(0,0,0,0.6)' }}
            />
        </div>
    )

    if (isText(note.original_name) && textContent !== null) return (
        <div
            ref={textRef}
            onMouseUp={handleMouseUp}
            style={{
                flex: 1, overflow: 'auto', padding: '28px 32px',
                background: '#0d1117', color: '#c9d1d9',
                fontFamily: 'ui-monospace, "Cascadia Code", monospace',
                fontSize: '0.875rem', lineHeight: 1.85,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                userSelect: 'text', cursor: 'text'
            }}
        >{textContent}</div>
    )

    // Unsupported
    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 14, padding: 40, textAlign: 'center'
        }}>
            <div style={{
                width: 60, height: 60, borderRadius: 12,
                background: `${extColor(note.original_name)}12`,
                border: `1px solid ${extColor(note.original_name)}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800, color: extColor(note.original_name)
            }}>{extLabel(note.original_name)}</div>
            <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>
                Preview not available
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 260 }}>
                This file type cannot be previewed in the browser. Download it to open locally.
            </div>
        </div>
    )
}

/* â”€â”€â”€ Right preview column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PreviewColumn({ note, onDownload }) {
    const [blobUrl,     setBlobUrl]     = useState(null)
    const [textContent, setTextContent] = useState(null)
    const [loadErr,     setLoadErr]     = useState(null)
    const [tutorOpen,   setTutorOpen]   = useState(false)
    const [tutorQ,      setTutorQ]      = useState('')
    const [tutorKey,    setTutorKey]    = useState(0) // force remount on new question
    const [selPopup,    setSelPopup]    = useState(null) // { x, y } position for floating pill
    const [selText,     setSelText]     = useState('')   // currently selected text
    const [dlBusy,      setDlBusy]      = useState(false)
    const prevNoteId = useRef(null)
    const lastSelRef = useRef('')  // survives the mousedown→onClick race

    // Load blob when note changes
    useEffect(() => {
        if (!note) return
        if (prevNoteId.current === note.id) return
        prevNoteId.current = note.id
        setBlobUrl(null); setTextContent(null); setLoadErr(null)
        setSelPopup(null); setSelText(''); lastSelRef.current = ''
        setTutorOpen(false)

        let objUrl = null
        const load = async () => {
            try {
                const resp = await axios.get(`${API}/study/teacher-notes/${note.id}/download`, {
                    headers: authH(), responseType: 'blob'
                })
                objUrl = URL.createObjectURL(resp.data)
                setBlobUrl(objUrl)
                if (isText(note.original_name)) {
                    const txt = await resp.data.text()
                    setTextContent(txt)
                }
            } catch (e) { setLoadErr(e.response?.data?.error || e.message) }
        }
        load()
        return () => { if (objUrl) URL.revokeObjectURL(objUrl) }
    }, [note])

    // Hide popup on click elsewhere
    useEffect(() => {
        const hide = () => setSelPopup(null)
        window.addEventListener('mousedown', hide)
        return () => window.removeEventListener('mousedown', hide)
    }, [])

    const handleTextSelect = useCallback((text, pos) => {
        if (text) {
            lastSelRef.current = text
            setSelText(text)
            setSelPopup(pos) // just position
        } else {
            setSelPopup(null)
            // keep selText + lastSelRef so toolbar button still works
        }
    }, [])

    const askAI = useCallback((text) => {
        const q = text || lastSelRef.current || ''
        lastSelRef.current = ''
        setSelText('')
        setSelPopup(null)
        window.getSelection()?.removeAllRanges()
        setTutorQ(q)
        setTutorKey(k => k + 1)
        setTutorOpen(true)
    }, [])

    const handleDownload = async () => {
        if (!blobUrl) return
        setDlBusy(true)
        try {
            const a = document.createElement('a')
            a.href = blobUrl; a.download = note.original_name; a.click()
        } finally { setDlBusy(false) }
    }

    if (!note) return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, color: '#1e293b', textAlign: 'center', padding: 40
        }}>
            <Eye size={40} color="#1e293b" />
            <div style={{ color: '#334155', fontWeight: 500, fontSize: '0.9rem' }}>
                Select a note on the left to preview it
            </div>
            <div style={{ color: '#1e293b', fontSize: '0.8rem' }}>
                You can read, select text, and ask the AI Tutor without downloading
            </div>
        </div>
    )

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* toolbar */}
            <div style={{
                height: 50, flexShrink: 0, padding: '0 16px',
                borderBottom: '1px solid rgba(148,163,184,0.1)',
                background: 'rgba(15,20,40,0.7)',
                display: 'flex', alignItems: 'center', gap: 10
            }}>
                {/* badge */}
                <div style={{
                    width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                    background: `${extColor(note.original_name)}15`,
                    border: `1px solid ${extColor(note.original_name)}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.5rem', fontWeight: 800, color: extColor(note.original_name)
                }}>{extLabel(note.original_name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{note.title}</div>
                    <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                        by {note.teacher_name}{note.subject ? ` Â· ${note.subject}` : ''}  Â·  {fmt(note.file_size)}
                    </div>
                </div>

                {/* Ask AI Tutor button — highlights when text is selected */}
                <button
                    onClick={() => askAI(lastSelRef.current)}
                    title={selText ? `Ask about: "${selText.slice(0, 60)}…"` : 'Select text in the document, then click to explain it'}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.775rem',
                        fontWeight: 600, transition: 'all .15s',
                        border: selText
                            ? '1.5px solid rgba(139,92,246,0.8)'
                            : '1.5px solid rgba(139,92,246,0.35)',
                        background: selText
                            ? 'rgba(139,92,246,0.28)'
                            : tutorOpen ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)',
                        color: selText ? '#c4b5fd' : '#8b5cf6',
                        boxShadow: selText ? '0 0 0 2px rgba(139,92,246,0.18)' : 'none'
                    }}
                >
                    <Sparkles size={12} />
                    {selText ? 'Ask AI Tutor' : 'Ask AI Tutor'}
                </button>

                <button
                    onClick={handleDownload} disabled={!blobUrl || dlBusy}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.775rem',
                        fontWeight: 600, border: '1.5px solid rgba(96,165,250,0.35)',
                        background: 'rgba(96,165,250,0.08)', color: '#93c5fd',
                        opacity: !blobUrl ? 0.5 : 1
                    }}
                >
                    {dlBusy ? <Loader2 size={12} className="spin" /> : <Download size={12} />} Download
                </button>
            </div>

            {/* body: preview + optional tutor panel */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {loadErr ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#f87171', fontSize: '0.875rem'
                    }}>Failed to load: {loadErr}</div>
                ) : (
                    <PreviewPane
                        note={note}
                        blobUrl={blobUrl}
                        textContent={textContent}
                        onTextSelect={handleTextSelect}
                    />
                )}

                {/* AI Tutor side panel */}
                {tutorOpen && (
                    <TutorPanel
                        key={tutorKey}
                        initialQuestion={tutorQ}
                        onClose={() => setTutorOpen(false)}
                    />
                )}
            </div>

            {/* Text selection popup — floating pill above the selection */}
            {selPopup && selText && (
                <SelectionPopup
                    pos={selPopup}
                    onAsk={() => askAI(selText)}
                />
            )}
        </div>
    )
}

/* â”€â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function StudentTeacherNotes() {
    const [notes,    setNotes]    = useState([])
    const [loading,  setLoading]  = useState(true)
    const [err,      setErr]      = useState(null)
    const [selected, setSelected] = useState(null)
    const [dlId,     setDlId]     = useState(null)

    useEffect(() => {
        axios.get(`${API}/study/teacher-notes`, { headers: authH() })
            .then(r => {
                const ns = r.data.notes || []
                setNotes(ns)
                // no auto-select — user must click Preview
            })
            .catch(e => setErr(e.response?.data?.error || e.message))
            .finally(() => setLoading(false))
    }, [])

    const download = async (note) => {
        setDlId(note.id)
        try {
            const resp = await axios.get(`${API}/study/teacher-notes/${note.id}/download`, {
                headers: authH(), responseType: 'blob'
            })
            const url = URL.createObjectURL(resp.data)
            const a = document.createElement('a')
            a.href = url; a.download = note.original_name; a.click()
            URL.revokeObjectURL(url)
        } catch (e) { alert('Download failed: ' + (e.response?.data?.error || e.message)) }
        finally { setDlId(null) }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', padding: 32 }}>
            <Loader2 size={16} className="spin" /> Loading teacher notesâ€¦
        </div>
    )
    if (err) return (
        <div style={{ color: '#f87171', fontSize: '0.875rem', padding: 16 }}>{err}</div>
    )
    if (notes.length === 0) return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: 12, textAlign: 'center', padding: 52
        }}>
            <BookOpen size={40} style={{ color: '#334155', marginBottom: 16 }} />
            <div style={{ color: '#64748b', fontWeight: 500 }}>No teacher notes yet</div>
            <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: 6 }}>
                Your teacher hasn't uploaded any notes yet. Check back later.
            </div>
        </div>
    )

    return (
        <>
            <style>{`
                @keyframes notePopIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(5px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .note-card-item:hover { background: rgba(255,255,255,0.055) !important; }

                /* pdf.js text layer — transparent but selectable */
                .textLayer {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    text-size-adjust: none;
                    forced-color-adjust: none;
                    line-height: 1;
                    user-select: text;
                    cursor: text;
                    z-index: 2;
                    pointer-events: auto;
                }
                .textLayer :is(span, br) {
                    color: transparent;
                    position: absolute;
                    white-space: pre;
                    cursor: text;
                    transform-origin: 0% 0%;
                }
                .textLayer ::selection {
                    background: rgba(100, 149, 237, 0.4);
                    color: transparent;
                }
                .textLayer .endOfContent {
                    display: block;
                    position: absolute;
                    inset: 100% 0 0;
                    z-index: -1;
                    cursor: default;
                    user-select: none;
                }
            `}</style>

            {/* split layout */}
            <div style={{
                display: 'flex', gap: 0,
                height: 'calc(100vh - 188px)',
                minHeight: 480,
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: 12, overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)'
            }}>
                {/* -- Left: note list -- */}
                <div style={{
                    width: 320, flexShrink: 0,
                    borderRight: '1px solid rgba(148,163,184,0.1)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    {/* list header */}
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)',
                        background: 'rgba(15,20,40,0.5)'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <BookOpen size={15} color="#a78bfa" /> Teacher's Notes
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 3 }}>
                            {notes.length} {notes.length === 1 ? 'note' : 'notes'} - click Preview to open
                        </div>
                    </div>

                    {/* scrollable list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                        {notes.map(note => {
                            const active = selected?.id === note.id
                            return (
                                <div
                                    key={note.id}
                                    className="note-card-item"
                                    style={{
                                        padding: '12px 14px',
                                        background: active ? 'rgba(139,92,246,0.13)' : 'transparent',
                                        borderLeft: active ? '3px solid #7c3aed' : '3px solid transparent',
                                        transition: 'background .12s'
                                    }}
                                >
                                    {/* top row: badge + title */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                                            background: `${extColor(note.original_name)}15`,
                                            border: `1px solid ${extColor(note.original_name)}35`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.5rem', fontWeight: 800, color: extColor(note.original_name)
                                        }}>{extLabel(note.original_name)}</div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600, fontSize: '0.82rem',
                                                color: active ? '#c4b5fd' : '#e2e8f0',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>{note.title}</div>
                                            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>
                                                {note.teacher_name} - {fmt(note.file_size)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* bottom row: Preview + Download buttons */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => setSelected(note)}
                                            style={{
                                                flex: 1, display: 'inline-flex', alignItems: 'center',
                                                justifyContent: 'center', gap: 5,
                                                padding: '5px 0', borderRadius: 6, cursor: 'pointer',
                                                fontSize: '0.74rem', fontWeight: 600,
                                                border: active
                                                    ? '1.5px solid rgba(139,92,246,0.6)'
                                                    : '1.5px solid rgba(139,92,246,0.3)',
                                                background: active
                                                    ? 'rgba(139,92,246,0.22)'
                                                    : 'rgba(139,92,246,0.08)',
                                                color: active ? '#c4b5fd' : '#a78bfa'
                                            }}
                                        >
                                            <Eye size={12} /> {active ? 'Previewing' : 'Preview'}
                                        </button>
                                        <button
                                            onClick={() => download(note)}
                                            disabled={dlId === note.id}
                                            style={{
                                                flex: 1, display: 'inline-flex', alignItems: 'center',
                                                justifyContent: 'center', gap: 5,
                                                padding: '5px 0', borderRadius: 6, cursor: 'pointer',
                                                fontSize: '0.74rem', fontWeight: 600,
                                                border: '1.5px solid rgba(96,165,250,0.3)',
                                                background: 'rgba(96,165,250,0.07)',
                                                color: '#93c5fd'
                                            }}
                                        >
                                            {dlId === note.id
                                                ? <><Loader2 size={12} className="spin" /> Saving...</>
                                                : <><Download size={12} /> Download</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
{/* â”€â”€ Right: preview column â”€â”€ */}
                <PreviewColumn note={selected} onDownload={download} />
            </div>
        </>
    )
}

