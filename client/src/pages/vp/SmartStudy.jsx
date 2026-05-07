/**
 * Smart Study — upload your syllabus, get AI-generated notes per topic,
 * take auto-generated tests, and see weak areas with YouTube recommendations.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useI18n } from '@/services/i18n'
import {
    Upload, FileText, BookOpen, ChevronRight, ChevronDown, Download,
    Loader2, CheckCircle2, XCircle, Youtube, RefreshCw,
    Target, Trash2, AlertTriangle, ArrowLeft,
    Award, NotebookPen, FlaskConical, Sparkles, PlusCircle,
    Volume2, StopCircle, Globe, ChevronUp
} from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/vp'
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

/* ─── tiny shared styles ──────────────────────────────────────────────────── */
const card = (extra = {}) => ({
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '12px',
    padding: '20px',
    ...extra
})
const tabBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
    border: active ? '1.5px solid #60a5fa' : '1.5px solid rgba(148,163,184,0.18)',
    background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
    color: active ? '#60a5fa' : 'rgba(148,163,184,0.75)',
    fontWeight: active ? 600 : 400, fontSize: '0.875rem', transition: 'all .15s'
})
const btn = (color = '#3b82f6', ghost = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem',
    fontWeight: 500, transition: 'all .15s',
    border: ghost ? `1.5px solid ${color}` : 'none',
    background: ghost ? 'transparent' : color,
    color: ghost ? color : '#fff'
})
const STATUS_COLOR = { ready: '#10b981', error: '#ef4444', processing: '#f59e0b' }
const SCORE_COLOR  = (pct) => pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

/* ─── Upload Form ─────────────────────────────────────────────────────────── */
function UploadForm({ onUploaded }) {
    const [title,   setTitle]   = useState('')
    const [subject, setSubject] = useState('')
    const [file,    setFile]    = useState(null)
    const [loading, setLoading] = useState(false)
    const [err,     setErr]     = useState(null)
    const fileRef = useRef()

    const submit = async (e) => {
        e.preventDefault()
        if (!file || !title.trim()) return
        setLoading(true); setErr(null)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('title', title.trim())
            fd.append('subject', subject.trim())
            const { data } = await axios.post(`${API}/study/upload`, fd, {
                headers: { ...authH(), 'Content-Type': 'multipart/form-data' }
            })
            onUploaded(data.id)
        } catch (e) {
            setErr(e.response?.data?.error || e.message)
        } finally { setLoading(false) }
    }

    const inputSt = {
        width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.25)',
        color: '#e2e8f0', outline: 'none'
    }

    return (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
            <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, display: 'block' }}>Syllabus title *</label>
                <input style={inputSt} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Class 12 Physics Syllabus" required />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, display: 'block' }}>Subject (optional)</label>
                <input style={inputSt} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" />
            </div>
            <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, display: 'block' }}>Upload file * (PDF, image, or text)</label>
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.docx" style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0])} />
                <div
                    onClick={() => fileRef.current.click()}
                    style={{
                        border: '2px dashed rgba(96,165,250,0.35)', borderRadius: 10,
                        padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
                        background: file ? 'rgba(96,165,250,0.06)' : 'transparent'
                    }}
                >
                    {file
                        ? <><FileText size={20} style={{ color: '#60a5fa', marginBottom: 4 }} /><br /><span style={{ color: '#60a5fa', fontSize: '0.875rem' }}>{file.name}</span></>
                        : <><Upload size={20} style={{ color: '#64748b', marginBottom: 4 }} /><br /><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Click to choose PDF, image or text file</span></>
                    }
                </div>
            </div>
            {err && <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{err}</div>}
            <button type="submit" disabled={loading || !file || !title.trim()} style={btn()}>
                {loading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                {loading ? 'Processing…' : 'Upload & Extract Topics'}
            </button>
        </form>
    )
}

/* ─── Syllabus Card ───────────────────────────────────────────────────────── */
function SyllabusCard({ syl, onSelect, onDelete }) {
    const statusColor = STATUS_COLOR[syl.status] || '#94a3b8'
    return (
        <div style={{ ...card(), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{syl.title}</span>
                </div>
                {syl.subject && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 16 }}>{syl.subject}</div>}
                {syl.error_msg && <div style={{ fontSize: '0.75rem', color: '#f87171', marginLeft: 16, marginTop: 4 }}>{syl.error_msg}</div>}
                <div style={{ fontSize: '0.75rem', color: '#475569', marginLeft: 16, marginTop: 2 }}>
                    {new Date(syl.created_at).toLocaleDateString()}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {syl.status === 'ready' &&
                    <button onClick={() => onSelect(syl)} style={btn('#3b82f6')}>
                        <BookOpen size={14} /> Open
                    </button>
                }
                {syl.status === 'processing' &&
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#f59e0b' }}>
                        <Loader2 size={14} className="spin" /> Processing…
                    </span>
                }
                <button onClick={() => onDelete(syl.id)} style={btn('#ef4444', true)}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )
}

/* ─── Notes helpers ───────────────────────────────────────────────────────── */
const DIFFICULTIES = [
    { key: 'easy',   label: 'Easy',   color: '#10b981', bg: 'rgba(16,185,129,.14)', border: 'rgba(16,185,129,.4)' },
    { key: 'medium', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,.14)',  border: 'rgba(245,158,11,.4)' },
    { key: 'hard',   label: 'Hard',   color: '#ef4444', bg: 'rgba(239,68,68,.14)',   border: 'rgba(239,68,68,.4)'  },
]

const EXPLAIN_LANGS = [
    { code: 'en-IN', name: 'English',    native: 'English' },
    { code: 'hi-IN', name: 'Hindi',      native: 'हिन्दी' },
    { code: 'ta-IN', name: 'Tamil',      native: 'தமிழ்' },
    { code: 'te-IN', name: 'Telugu',     native: 'తెలుగు' },
    { code: 'kn-IN', name: 'Kannada',    native: 'ಕನ್ನಡ' },
    { code: 'ml-IN', name: 'Malayalam',  native: 'മലയാളം' },
    { code: 'bn-IN', name: 'Bengali',    native: 'বাংলা' },
    { code: 'gu-IN', name: 'Gujarati',   native: 'ગુજરાતી' },
    { code: 'mr-IN', name: 'Marathi',    native: 'मराठी' },
]

function base64ToBlob(b64, mime) {
    const bin = atob(b64); const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: mime })
}

function parseNotesMap(raw) {
    if (!raw) return {}
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw
    try {
        const p = JSON.parse(raw)
        if (p && typeof p === 'object' && !Array.isArray(p)) return p
    } catch {}
    return { medium: { status: 'ready', content: String(raw) } }
}

async function downloadPDF(content, topicTitle, difficulty, subject) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 18
    const cW = pageW - margin * 2
    const dc = { easy: [16, 185, 129], medium: [245, 158, 11], hard: [239, 68, 68] }[difficulty] || [96, 165, 250]

    const renderHeader = (isFirst) => {
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, pageW, isFirst ? 46 : 14, 'F')
        doc.setFillColor(...dc)
        doc.rect(0, 0, 5, isFirst ? 46 : 14, 'F')
        if (isFirst) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(15)
            doc.setTextColor(241, 245, 249)
            const tl = doc.splitTextToSize(topicTitle, cW - 32)
            doc.text(tl, margin + 4, 16)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(148, 163, 184)
            doc.text(`${subject || 'Smart Study'}  ·  ${difficulty.toUpperCase()} LEVEL`, margin + 4, 16 + tl.length * 8)
            doc.setFontSize(8)
            doc.text(`VidyaPath AI  ·  ${new Date().toLocaleDateString('en-IN')}`, pageW - margin, 40, { align: 'right' })
        } else {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(148, 163, 184)
            doc.text(topicTitle, margin + 4, 9)
            doc.text(`${difficulty.toUpperCase()} LEVEL`, pageW - margin, 9, { align: 'right' })
        }
    }

    renderHeader(true)
    let y = 58
    let isFirst = true

    const checkPage = (needed = 8) => {
        if (y + needed > pageH - 18) {
            doc.addPage()
            isFirst = false
            renderHeader(false)
            y = 22
        }
    }

    for (const line of content.split('\n')) {
        const t = line.trim()
        if (!t) { y += 4; continue }

        const isSection = /^[📌🔑📐❓💡🔬⚡🧠🔗✅📝✨🎯]/.test(t)
        const isBullet  = /^[-•·→*]\s/.test(t)
        const isNum     = /^\d+[.)]\s/.test(t)

        if (isSection) {
            y += 5
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(...dc)
            const wl = doc.splitTextToSize(t, cW)
            checkPage(wl.length * 7 + 8)
            doc.text(wl, margin, y)
            y += wl.length * 7 + 1
            doc.setDrawColor(...dc)
            doc.setLineWidth(0.35)
            doc.line(margin, y, margin + cW, y)
            y += 5
        } else if (isBullet || isNum) {
            const text = t.replace(/^[-•·→*]\s*/, '').replace(/^\d+[.)]\s*/, '')
            const wl = doc.splitTextToSize(text, cW - 8)
            checkPage(wl.length * 5.5 + 2)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139)
            doc.text('•', margin + 2, y)
            doc.setTextColor(30, 41, 59)
            doc.text(wl, margin + 7, y)
            y += wl.length * 5.5 + 1.5
        } else {
            const wl = doc.splitTextToSize(t, cW)
            checkPage(wl.length * 5.5 + 1)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(51, 65, 85)
            doc.text(wl, margin, y)
            y += wl.length * 5.5 + 1
        }
    }

    const total = doc.internal.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.25)
        doc.line(margin, pageH - 13, pageW - margin, pageH - 13)
        doc.text('VidyaPath AI Smart Study', margin, pageH - 8)
        doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 8, { align: 'right' })
    }
    doc.save(`${topicTitle} — ${difficulty} notes.pdf`)
}

async function downloadDOCX(content, topicTitle, difficulty, subject) {
    const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import('docx')
    const dcHex = { easy: '10B981', medium: 'F59E0B', hard: 'EF4444' }[difficulty] || '3B82F6'
    const children = []

    children.push(new Paragraph({
        children: [new TextRun({ text: topicTitle, bold: true, size: 36, color: '0F172A' })],
        spacing: { after: 160 }
    }))
    children.push(new Paragraph({
        children: [
            new TextRun({ text: subject || 'Smart Study', color: '64748B', size: 20 }),
            new TextRun({ text: '  ·  ', color: '94A3B8', size: 20 }),
            new TextRun({ text: `${difficulty.toUpperCase()} LEVEL`, color: dcHex, size: 20, bold: true }),
        ],
        spacing: { after: 80 }
    }))
    children.push(new Paragraph({
        children: [new TextRun({ text: `Generated by VidyaPath AI · ${new Date().toLocaleDateString('en-IN')}`, color: '94A3B8', size: 16, italics: true })],
        spacing: { after: 400 }
    }))
    children.push(new Paragraph({
        border: { bottom: { color: 'E2E8F0', style: BorderStyle.SINGLE, size: 6, space: 1 } },
        spacing: { after: 320 }
    }))

    for (const line of content.split('\n')) {
        const t = line.trim()
        if (!t) { children.push(new Paragraph({ text: '', spacing: { after: 80 } })); continue }

        const isSection = /^[📌🔑📐❓💡🔬⚡🧠🔗✅📝✨🎯]/.test(t)
        const isBullet  = /^[-•·→*]\s/.test(t)

        if (isSection) {
            children.push(new Paragraph({
                children: [new TextRun({ text: t, bold: true, color: dcHex, size: 26 })],
                spacing: { before: 360, after: 120 },
                border: { bottom: { color: dcHex + '33', style: BorderStyle.SINGLE, size: 4, space: 1 } }
            }))
        } else if (isBullet) {
            children.push(new Paragraph({
                children: [new TextRun({ text: t, size: 22, color: '334155' })],
                bullet: { level: 0 },
                spacing: { after: 100 }
            }))
        } else {
            children.push(new Paragraph({
                children: [new TextRun({ text: t, size: 22, color: '334155' })],
                spacing: { after: 120 }
            }))
        }
    }

    const doc = new Document({
        creator: 'VidyaPath AI',
        title: topicTitle,
        description: `${difficulty} level study notes`,
        sections: [{ properties: {}, children }]
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${topicTitle} — ${difficulty} notes.docx`; a.click()
    URL.revokeObjectURL(url)
}

/* ─── Note Renderer — styled section display ─────────────────────────────── */
function NoteRenderer({ content, diffColor }) {
    const lines = content.split('\n')
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {lines.map((line, i) => {
                const t = line.trim()
                if (!t) return <div key={i} style={{ height: 8 }} />

                const isSection = /^[📌🔑📐❓💡🔬⚡🧠🔗✅📝✨🎯🔷💎⭐🌟]/.test(t)
                const isBullet  = /^[•\-*→·]\s/.test(t)
                const isNum     = /^\d+[.)]\s/.test(t)

                if (isSection) return (
                    <div key={i} style={{
                        marginTop: 22, marginBottom: 10,
                        paddingBottom: 8, borderBottom: `1.5px solid ${diffColor}30`
                    }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: diffColor, letterSpacing: '0.01em' }}>
                            {t}
                        </span>
                    </div>
                )

                if (isBullet) {
                    const text = t.replace(/^[•\-*→·]\s*/, '')
                    return (
                        <div key={i} style={{ display: 'flex', gap: 10, paddingLeft: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                            <span style={{ color: diffColor, flexShrink: 0, marginTop: 5, fontSize: '0.55rem', opacity: 0.9 }}>◆</span>
                            <span style={{ color: '#e2e8f0', lineHeight: 1.8, fontSize: '0.875rem' }}>{text}</span>
                        </div>
                    )
                }

                if (isNum) {
                    const m = t.match(/^(\d+[.)]\s*)(.*)/)
                    return (
                        <div key={i} style={{ display: 'flex', gap: 10, paddingLeft: 6, marginBottom: 6, alignItems: 'flex-start' }}>
                            <span style={{ color: diffColor, flexShrink: 0, fontWeight: 700, fontSize: '0.8rem', minWidth: 24, paddingTop: 2 }}>
                                {m[1].trim()}
                            </span>
                            <span style={{ color: '#e2e8f0', lineHeight: 1.8, fontSize: '0.875rem' }}>{m[2]}</span>
                        </div>
                    )
                }

                return (
                    <p key={i} style={{
                        color: '#94a3b8', lineHeight: 1.85, fontSize: '0.875rem',
                        margin: '0 0 4px', paddingLeft: 6
                    }}>{t}</p>
                )
            })}
        </div>
    )
}

/* ─── Notes Panel (difficulty selector + voice explain + download) ────────── */
function NotesPanel({ sylId, topic, syllabus }) {
    const [activeDiff,   setActiveDiff]   = useState('medium')
    const [notesMap,     setNotesMap]     = useState(() => parseNotesMap(topic.notes))
    const [polling,      setPolling]      = useState(null)
    const [err,          setErr]          = useState(null)
    const [dlLoading,    setDlLoading]    = useState(null)
    const [fromCache,    setFromCache]    = useState(false)  // true when notes loaded from localStorage
    const { locale } = useI18n()

    // voice explain state
    const [explainLang,       setExplainLang]       = useState(() => {
        const mapped = locale + '-IN'
        return EXPLAIN_LANGS.find(l => l.code === mapped) ? mapped : 'en-IN'
    })

    useEffect(() => {
        const mapped = locale + '-IN'
        setExplainLang(EXPLAIN_LANGS.find(l => l.code === mapped) ? mapped : 'en-IN')
    }, [locale])
    const [explaining,        setExplaining]         = useState(null) // null | 'loading' | 'playing'
    const [explainText,       setExplainText]        = useState(null)
    const [showText,          setShowText]           = useState(false)
    const [showLangMenu,      setShowLangMenu]       = useState(false)
    const [langMenuPos,       setLangMenuPos]        = useState({ top: 0, right: 0 })
    // part-by-part state
    const [explainPartIdx,    setExplainPartIdx]     = useState(0)
    const [explainTotalParts, setExplainTotalParts]  = useState(0)
    const [explainPartTitles, setExplainPartTitles]  = useState([])
    const explainPartIdxRef = useRef(0)  // ref so audio.onended closure sees current value
    const langBtnRef = useRef(null)
    const audioRef = useRef(null)

    const CACHE_KEY = `vp_notes_${sylId}_${topic.id}`

    // Save to localStorage whenever a difficulty becomes ready
    useEffect(() => {
        const hasReady = Object.values(notesMap).some(v => v?.status === 'ready')
        if (hasReady) {
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(notesMap)) } catch {}
        }
    }, [notesMap, CACHE_KEY])

    useEffect(() => {
        const fresh = parseNotesMap(topic.notes)
        // If we have live notes, use them and cache them
        const hasLive = Object.values(fresh).some(v => v?.status === 'ready')
        if (hasLive) {
            setNotesMap(fresh); setFromCache(false)
        } else if (!navigator.onLine) {
            // Offline and no live notes — try localStorage
            try {
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) { setNotesMap(JSON.parse(cached)); setFromCache(true) }
                else setNotesMap(fresh)
            } catch { setNotesMap(fresh) }
        } else {
            setNotesMap(fresh)
        }
    }, [topic.notes, CACHE_KEY])
    // Stop audio when switching difficulty
    useEffect(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
        setExplaining(null); setExplainText(null); setShowText(false)
        setExplainPartIdx(0); setExplainTotalParts(0); setExplainPartTitles([])
        explainPartIdxRef.current = 0
    }, [activeDiff])

    // Close lang menu on outside click
    useEffect(() => {
        if (!showLangMenu) return
        const handler = (e) => {
            if (langBtnRef.current && !langBtnRef.current.contains(e.target)) setShowLangMenu(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showLangMenu])

    const D       = DIFFICULTIES.find(d => d.key === activeDiff)
    const current = notesMap[activeDiff] || { status: 'none' }

    const generate = async (diff, force = false) => {
        if (polling === diff) return
        setErr(null); setPolling(diff)
        setNotesMap(prev => ({ ...prev, [diff]: { status: 'generating' } }))
        try {
            await axios.post(
                `${API}/study/syllabi/${sylId}/topics/${topic.id}/notes`,
                { difficulty: diff, force },
                { headers: authH() }
            )
        } catch (e) {
            setErr(e.response?.data?.error || e.message); setPolling(null)
            setNotesMap(prev => ({ ...prev, [diff]: { status: 'error' } })); return
        }
        let tries = 0
        const timer = setInterval(async () => {
            tries++
            if (tries > 60) { clearInterval(timer); setPolling(null); return }
            try {
                const { data } = await axios.get(
                    `${API}/study/syllabi/${sylId}/topics/${topic.id}/notes`,
                    { headers: authH() }
                )
                const map = data.notes_map || parseNotesMap(data.notes)
                setNotesMap(map)
                if (map[diff]?.status === 'ready' || map[diff]?.status === 'error') {
                    clearInterval(timer); setPolling(null)
                }
            } catch { clearInterval(timer); setPolling(null) }
        }, 2500)
    }

    const handleDownload = async (type) => {
        setDlLoading(type)
        try {
            const subject = syllabus?.subject || syllabus?.title || ''
            if (type === 'pdf') await downloadPDF(current.content, topic.title, activeDiff, subject)
            else                await downloadDOCX(current.content, topic.title, activeDiff, subject)
        } catch (e) { setErr('Download failed: ' + e.message) }
        finally { setDlLoading(null) }
    }

    const handleExplain = async (partIdx = 0) => {
        if (explaining === 'playing') {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
            setExplaining(null); return
        }
        setErr(null); setExplaining('loading')
        explainPartIdxRef.current = partIdx
        try {
            const { data } = await axios.post(
                `${API}/study/syllabi/${sylId}/topics/${topic.id}/notes/explain`,
                { difficulty: activeDiff, language: explainLang, section_index: partIdx },
                { headers: authH() }
            )
            // update part metadata (use ?? 0 to guard against missing field)
            setExplainPartIdx(data.section_index ?? 0)
            setExplainTotalParts(data.total_sections || 1)
            setExplainPartTitles(data.section_titles || [])
            setExplainText(data.explanation_text)
            setShowText(true)
            if (data.tts_available && data.audio_b64) {
                const blob = base64ToBlob(data.audio_b64, 'audio/wav')
                const url  = URL.createObjectURL(blob)
                const audio = new Audio(url)
                audioRef.current = audio
                audio.onended = () => {
                    URL.revokeObjectURL(url)
                    const nextIdx = explainPartIdxRef.current + 1
                    if (nextIdx < (data.total_sections || 1)) {
                        // auto-play next part
                        handleExplain(nextIdx)
                    } else {
                        setExplaining(null)
                    }
                }
                audio.onerror = (e) => { console.error('Audio playback error', e); setExplaining(null) }
                try {
                    await audio.play()
                    setExplaining('playing')
                } catch (playErr) {
                    console.error('audio.play() failed:', playErr)
                    setExplaining(null)
                    setErr('Audio playback blocked by browser. Check if audio is muted or allow autoplay.')
                }
            } else {
                setExplaining(null)
                if (!data.tts_available) setErr('Audio could not be generated. Text explanation is shown below — click Explain again to retry audio.')
            }
        } catch (e) {
            setErr(e.response?.data?.error || e.message); setExplaining(null)
        }
    }

    const curLang = EXPLAIN_LANGS.find(l => l.code === explainLang) || EXPLAIN_LANGS[0]

    return (
        <div style={{
            marginTop: 10, borderRadius: 14,
            border: `1px solid ${D.border}`, boxShadow: `0 4px 24px rgba(0,0,0,0.25)`
        }}>
            {/* ── Difficulty tab strip ── */}
            <div style={{ display: 'flex', background: 'rgba(2,6,23,0.85)', borderBottom: '1px solid rgba(148,163,184,0.07)', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
                {DIFFICULTIES.map((d, i) => {
                    const isActive   = activeDiff === d.key
                    const st         = notesMap[d.key]?.status || 'none'
                    const isSpinning = polling === d.key
                    return (
                        <button key={d.key} onClick={() => setActiveDiff(d.key)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '12px 8px', border: 'none', cursor: 'pointer',
                            background: isActive ? d.bg : 'transparent',
                            borderBottom: `2.5px solid ${isActive ? d.color : 'transparent'}`,
                            color: isActive ? d.color : '#64748b',
                            fontWeight: isActive ? 700 : 400, fontSize: '0.85rem', transition: 'all .15s',
                            borderRight: i < 2 ? '1px solid rgba(148,163,184,0.07)' : 'none'
                        }}>
                            {isSpinning ? <Loader2 size={12} className="spin" />
                                : st === 'ready' ? <CheckCircle2 size={12} color={d.color} />
                                : st === 'error' ? <XCircle size={12} color="#ef4444" />
                                : <Sparkles size={12} />}
                            {d.label}
                            {st === 'ready' && !isActive && (
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.color, opacity: 0.8 }} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Content pane ── */}
            <div style={{ padding: '18px 20px', background: 'rgba(2,6,23,0.55)', borderRadius: '0 0 14px 14px' }}>
                {err && (
                    <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} /> {err}
                    </div>
                )}

                {current.status === 'none' && (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: D.bg, border: `1.5px solid ${D.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                        }}>
                            <Sparkles size={24} color={D.color} />
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 4 }}>
                            No <strong style={{ color: D.color }}>{D.label}</strong> notes yet
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 20 }}>
                            {activeDiff === 'easy'   && '1 A4 page · Simple explanations with analogies'}
                            {activeDiff === 'medium' && '3-4 A4 pages · Comprehensive exam-ready notes'}
                            {activeDiff === 'hard'   && '5-6 A4 pages · Advanced theory & competitive prep'}
                        </div>
                        <button onClick={() => generate(activeDiff)} style={{ ...btn(D.color), padding: '10px 24px' }}>
                            <Sparkles size={14} /> Generate {D.label} Notes
                        </button>
                    </div>
                )}

                {current.status === 'generating' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: D.bg, border: `1.5px solid ${D.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}>
                            <Loader2 size={24} className="spin" style={{ color: D.color }} />
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            Generating <strong style={{ color: D.color }}>{D.label}</strong> notes…
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: 6 }}>This takes 15–40 seconds</div>
                    </div>
                )}

                {current.status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <XCircle size={30} style={{ color: '#ef4444', marginBottom: 12 }} />
                        <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: 16 }}>Generation failed. Please try again.</div>
                        <button onClick={() => generate(activeDiff)} style={btn('#ef4444', true)}>
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {current.status === 'ready' && current.content && (
                    <div>
                        {/* ── Toolbar ── */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: 10,
                            marginBottom: 16, paddingBottom: 14,
                            borderBottom: `1px solid rgba(148,163,184,0.1)`
                        }}>
                            {/* Left: badge + status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    background: D.bg, border: `1px solid ${D.border}`,
                                    color: D.color, borderRadius: 6,
                                    padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em'
                                }}>{D.label.toUpperCase()}</span>
                                <CheckCircle2 size={13} color="#10b981" />
                                <span style={{ color: '#475569', fontSize: '0.78rem' }}>Notes ready</span>
                                {fromCache && (
                                    <span style={{
                                        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                                        color: '#f59e0b', borderRadius: 6, padding: '2px 8px',
                                        fontSize: '0.72rem', fontWeight: 600
                                    }} title="Loaded from offline cache">
                                        📦 Cached
                                    </span>
                                )}
                                {/* Part progress indicator — only show when notes have multiple sections */}
                                {explainTotalParts > 1 && (
                                    <span style={{
                                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
                                        color: '#c4b5fd', borderRadius: 6, padding: '2px 8px',
                                        fontSize: '0.72rem', fontWeight: 600
                                    }}>
                                        Part {explainPartIdx + 1}/{explainTotalParts}
                                        {explainPartTitles[explainPartIdx] ? ` · ${explainPartTitles[explainPartIdx]}` : ''}
                                    </span>
                                )}
                            </div>

                            {/* Right: actions */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Voice Explain + Lang selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1.5px solid ${explaining === 'playing' ? D.border : 'rgba(139,92,246,.4)'}`, borderRadius: 8, overflow: 'hidden' }}>
                                    <button
                                        onClick={() => explaining === 'playing' ? handleExplain() : handleExplain(0)}
                                        disabled={explaining === 'loading'}
                                        title={explaining === 'playing' ? 'Stop' : 'AI Voice Explanation — part by part'}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '6px 12px', cursor: 'pointer',
                                            border: 'none', borderRight: '1px solid rgba(148,163,184,0.15)',
                                            background: explaining === 'playing' ? `${D.color}22` : 'rgba(139,92,246,0.1)',
                                            color: explaining === 'playing' ? D.color : '#c4b5fd',
                                            fontSize: '0.78rem', fontWeight: 600
                                        }}
                                    >
                                        {explaining === 'loading' ? <Loader2 size={13} className="spin" />
                                            : explaining === 'playing' ? <StopCircle size={13} />
                                            : <Volume2 size={13} />}
                                        {explaining === 'loading'
                                            ? `Generating${explainTotalParts > 0 ? ` part ${explainPartIdx + 1}/${explainTotalParts}` : ''}…`
                                            : explaining === 'playing'
                                                ? `Stop · Part ${explainPartIdx + 1}/${explainTotalParts || '?'}`
                                                : 'Explain Part by Part'}
                                    </button>
                                    {/* Language selector */}
                                    <div ref={langBtnRef} style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => {
                                                if (!showLangMenu && langBtnRef.current) {
                                                    const r = langBtnRef.current.getBoundingClientRect()
                                                    setLangMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
                                                }
                                                setShowLangMenu(p => !p)
                                            }}
                                            title="Select explanation language"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '6px 9px', cursor: 'pointer',
                                                border: 'none', background: 'rgba(139,92,246,0.08)',
                                                color: '#a78bfa', fontSize: '0.72rem', fontWeight: 600
                                            }}
                                        >
                                            <Globe size={11} />
                                            {curLang.native}
                                            {showLangMenu ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                        </button>
                                        {showLangMenu && (
                                            <div style={{
                                                position: 'fixed', top: langMenuPos.top, right: langMenuPos.right, zIndex: 9999,
                                                background: '#0f172a', border: '1px solid rgba(139,92,246,0.35)',
                                                borderRadius: 10, padding: 6, minWidth: 170,
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.7)'
                                            }}>
                                                {EXPLAIN_LANGS.map(l => (
                                                    <button key={l.code}
                                                        onClick={() => { setExplainLang(l.code); setShowLangMenu(false) }}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            width: '100%', padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                                            border: 'none', textAlign: 'left',
                                                            background: explainLang === l.code ? 'rgba(139,92,246,0.2)' : 'transparent',
                                                            color: explainLang === l.code ? '#c4b5fd' : '#94a3b8',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <span>{l.name}</span>
                                                        <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{l.native}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PDF */}
                                <button onClick={() => handleDownload('pdf')} disabled={dlLoading !== null} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '6px 13px', borderRadius: 7, cursor: 'pointer',
                                    border: '1.5px solid rgba(239,68,68,.45)',
                                    background: 'rgba(239,68,68,.08)', color: '#fca5a5',
                                    fontSize: '0.78rem', fontWeight: 500, opacity: dlLoading ? 0.6 : 1
                                }}>
                                    {dlLoading === 'pdf' ? <Loader2 size={12} className="spin" /> : <Download size={12} />} PDF
                                </button>
                                {/* DOCX */}
                                <button onClick={() => handleDownload('docx')} disabled={dlLoading !== null} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '6px 13px', borderRadius: 7, cursor: 'pointer',
                                    border: '1.5px solid rgba(59,130,246,.45)',
                                    background: 'rgba(59,130,246,.08)', color: '#93c5fd',
                                    fontSize: '0.78rem', fontWeight: 500, opacity: dlLoading ? 0.6 : 1
                                }}>
                                    {dlLoading === 'docx' ? <Loader2 size={12} className="spin" /> : <FileText size={12} />} DOCX
                                </button>
                                {/* Regenerate */}
                                <button onClick={() => generate(activeDiff, true)} disabled={polling !== null} title="Regenerate notes" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '6px 13px', borderRadius: 7, cursor: 'pointer',
                                    border: '1.5px solid rgba(139,92,246,.45)',
                                    background: 'rgba(139,92,246,.08)', color: '#c4b5fd',
                                    fontSize: '0.78rem', fontWeight: 500, opacity: polling ? 0.6 : 1
                                }}>
                                    {polling === activeDiff ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Regenerate
                                </button>
                            </div>
                        </div>

                        {/* ── AI Explanation text (if available + toggled) ── */}
                        {explainText && (
                            <div style={{
                                marginBottom: 16, borderRadius: 10,
                                border: `1px solid ${D.border}`,
                                background: D.bg, overflow: 'hidden'
                            }}>
                                <button
                                    onClick={() => setShowText(p => !p)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                        padding: '10px 14px', border: 'none', cursor: 'pointer',
                                        background: 'transparent', color: D.color, fontSize: '0.8rem', fontWeight: 600
                                    }}
                                >
                                    <Volume2 size={13} />
                                    {explainTotalParts > 1
                                        ? `Part ${explainPartIdx + 1}/${explainTotalParts} · ${explainPartTitles[explainPartIdx] || 'AI Explanation'}`
                                        : 'AI Explanation Script'}
                                    {showText ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
                                </button>
                                {showText && (
                                    <div style={{ padding: '4px 14px 14px', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.8, borderTop: `1px solid ${D.border}` }}>
                                        {explainText}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Notes content ── */}
                        <div style={{
                            background: 'rgba(15,23,42,0.6)', borderRadius: 10,
                            padding: '20px 22px', maxHeight: 580, overflowY: 'auto',
                            border: '1px solid rgba(148,163,184,0.08)',
                            scrollbarWidth: 'thin', scrollbarColor: `${D.color}40 transparent`
                        }}>
                            <NoteRenderer content={current.content} diffColor={D.color} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Unit / Topic Tree ───────────────────────────────────────────────────── */
function TopicsTab({ syllabus, selectedTopics, onToggleTopic }) {
    const [expanded,  setExpanded]  = useState({})
    const [openNotes, setOpenNotes] = useState({}) // topicId → bool

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(syllabus.units || []).map(unit => (
                <div key={unit.id} style={card()}>
                    <button
                        onClick={() => setExpanded(p => ({ ...p, [unit.id]: !p[unit.id] }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0 }}
                    >
                        {expanded[unit.id]
                            ? <ChevronDown size={18} color="#60a5fa" />
                            : <ChevronRight size={18} color="#60a5fa" />}
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: '#e2e8f0' }}>
                            Unit {unit.unit_number}: {unit.title}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569' }}>
                            {(unit.topics || []).length} topics
                        </span>
                    </button>

                    {expanded[unit.id] && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(unit.topics || []).map(t => {
                                const checked    = selectedTopics.has(t.id)
                                const notesOpen  = openNotes[t.id]
                                const hasNotes   = parseNotesMap(t.notes) && Object.values(parseNotesMap(t.notes)).some(v => v.status === 'ready')
                                return (
                                    <div key={t.id} style={{ paddingLeft: 28 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => onToggleTopic(t.id)}
                                                style={{ width: 16, height: 16, accentColor: '#3b82f6', flexShrink: 0, cursor: 'pointer' }}
                                            />
                                            <span style={{ flex: 1, fontSize: '0.9rem', color: '#cbd5e1' }}>{t.title}</span>

                                            {/* Notes badge dots */}
                                            <div style={{ display: 'flex', gap: 3, marginRight: 4 }}>
                                                {DIFFICULTIES.map(d => {
                                                    const st = parseNotesMap(t.notes)[d.key]?.status || 'none'
                                                    return (
                                                        <span key={d.key} title={`${d.label}: ${st}`} style={{
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            background: st === 'ready' ? d.color : 'rgba(148,163,184,0.2)',
                                                            border: st === 'ready' ? 'none' : '1px solid rgba(148,163,184,0.15)'
                                                        }} />
                                                    )
                                                })}
                                            </div>

                                            <button
                                                onClick={() => setOpenNotes(p => ({ ...p, [t.id]: !notesOpen }))}
                                                style={{
                                                    background: notesOpen ? 'rgba(139,92,246,0.12)' : 'none',
                                                    border: notesOpen ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                                                    borderRadius: 6, cursor: 'pointer',
                                                    color: notesOpen ? '#a78bfa' : '#64748b',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    fontSize: '0.78rem', padding: '4px 9px', transition: 'all .15s'
                                                }}
                                            >
                                                <NotebookPen size={12} />
                                                {notesOpen ? 'Hide' : (hasNotes ? 'View Notes' : 'Notes')}
                                            </button>
                                        </div>

                                        {notesOpen && (
                                            <div style={{ paddingLeft: 26, marginTop: 6 }}>
                                                <NotesPanel
                                                    sylId={syllabus.id}
                                                    topic={t}
                                                    syllabus={syllabus}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

/* ─── Test Tab ────────────────────────────────────────────────────────────── */
function TestTab({ syllabus, selectedTopics, onToggleTopic, onResult }) {
    const [numQ,      setNumQ]      = useState(10)
    const [loading,   setLoading]   = useState(false)
    const [err,       setErr]       = useState(null)
    const [test,      setTest]      = useState(null)   // { test_id, questions }
    const [answers,   setAnswers]   = useState({})     // { questionId: 'A' }
    const [submitted, setSubmitted] = useState(false)

    const generateTest = async () => {
        if (!selectedTopics.size) { setErr('Select at least one topic first (use the Topics tab)'); return }
        setLoading(true); setErr(null)
        try {
            const { data } = await axios.post(`${API}/study/test/generate`, {
                syllabus_id:   syllabus.id,
                topic_ids:     [...selectedTopics],
                num_questions: numQ
            }, { headers: authH() })
            setTest(data)
            setAnswers({})
            setSubmitted(false)
        } catch (e) {
            setErr(e.response?.data?.error || e.message)
        } finally { setLoading(false) }
    }

    const submitTest = async () => {
        if (Object.keys(answers).length < test.total) {
            setErr(`Please answer all ${test.total} questions before submitting`)
            return
        }
        setLoading(true); setErr(null)
        try {
            const { data } = await axios.post(`${API}/study/test/${test.test_id}/submit`,
                { answers },
                { headers: authH() }
            )
            setSubmitted(true)
            onResult(data)
        } catch (e) {
            setErr(e.response?.data?.error || e.message)
        } finally { setLoading(false) }
    }

    const optLabel = ['A', 'B', 'C', 'D']

    if (!test) return (
        <div>
            <div style={{ ...card(), marginBottom: 20 }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 16 }}>
                    {selectedTopics.size === 0
                        ? '⚠️  No topics selected — go to the Topics tab and check the topics you want to be tested on.'
                        : `✅ ${selectedTopics.size} topic${selectedTopics.size > 1 ? 's' : ''} selected`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Number of questions</label>
                        <select value={numQ} onChange={e => setNumQ(Number(e.target.value))} style={{
                            padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(148,163,184,0.25)', color: '#e2e8f0', cursor: 'pointer'
                        }}>
                            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={generateTest}
                        disabled={loading || selectedTopics.size === 0}
                        style={{ ...btn('#8b5cf6'), marginTop: 20 }}
                    >
                        {loading ? <Loader2 size={15} className="spin" /> : <FlaskConical size={15} />}
                        {loading ? 'Generating…' : 'Generate Test'}
                    </button>
                </div>
                {err && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 12 }}>{err}</div>}
            </div>
        </div>
    )

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Test · {test.total} questions</span>
                <button onClick={() => { setTest(null); setAnswers({}) }} style={btn('#475569', true)}>
                    <RefreshCw size={14} /> New Test
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {test.questions.map((q, idx) => (
                    <div key={q.id} style={card()}>
                        <div style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: 4 }}>
                            <span style={{ color: '#60a5fa', marginRight: 8 }}>Q{idx + 1}.</span>
                            {q.question}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 12 }}>Topic: {q.topic}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(q.options || []).map((opt, oi) => {
                                const letter = optLabel[oi]
                                const selected = answers[String(q.id)] === letter
                                return (
                                    <button
                                        key={oi}
                                        onClick={() => !submitted && setAnswers(p => ({ ...p, [String(q.id)]: letter }))}
                                        style={{
                                            textAlign: 'left', padding: '10px 14px', borderRadius: 8, cursor: submitted ? 'default' : 'pointer',
                                            border: selected ? '1.5px solid #3b82f6' : '1.5px solid rgba(148,163,184,0.18)',
                                            background: selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                                            color: selected ? '#93c5fd' : '#cbd5e1', fontSize: '0.875rem', transition: 'all .12s'
                                        }}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {err && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 16 }}>{err}</div>}

            {!submitted && (
                <button onClick={submitTest} disabled={loading} style={{ ...btn('#10b981'), marginTop: 24 }}>
                    {loading ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                    {loading ? 'Submitting…' : `Submit Test (${Object.keys(answers).length}/${test.total} answered)`}
                </button>
            )}
        </div>
    )
}

/* ─── Results Tab ─────────────────────────────────────────────────────────── */
function SingleResult({ result, defaultOpen = false }) {
    const pct = result.pct
    const scoreColor = SCORE_COLOR(pct)
    const [showAll, setShowAll] = useState(defaultOpen)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Score summary */}
            <div style={{ ...card({ background: `rgba(${pct >= 70 ? '16,185,129' : pct >= 40 ? '245,158,11' : '239,68,68'},.06)`, border: `1px solid ${scoreColor}40` }), display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: scoreColor }}>{pct}%</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{result.score}/{result.total} correct</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', marginBottom: 4 }}>
                        {pct >= 70 ? '🎉 Great job!' : pct >= 40 ? '📚 Keep studying!' : '⚠️ Needs more practice'}
                    </div>
                    {result.completed_at && (
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                            {new Date(result.completed_at).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Topic-wise breakdown */}
            {(result.topic_stats || []).length > 0 && (
                <div style={card()}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Topic Performance</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(result.topic_stats || []).map(t => {
                            const p = Math.round((t.correct / t.total) * 100)
                            const c = SCORE_COLOR(p)
                            return (
                                <div key={t.topic_id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
                                        <span style={{ color: '#cbd5e1' }}>{t.topic}</span>
                                        <span style={{ color: c, fontWeight: 600 }}>{t.correct}/{t.total} &nbsp;<span style={{ color: '#475569' }}>({p}%)</span></span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${p}%`, background: c, borderRadius: 3, transition: 'width .6s ease' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Weak areas + YouTube */}
            {(result.weak_topics?.length > 0 || result.recommendations?.length > 0) && (
                <div style={card({ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' })}>
                    <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} /> Areas that need more study
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(result.recommendations || []).map((r, i) => (
                            <div key={i} style={{ ...card({ background: 'rgba(255,255,255,0.03)', padding: '12px 14px' }) }}>
                                <div style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: 4 }}>{r.topic}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                                    Your score: <span style={{ color: SCORE_COLOR(r.score_pct), fontWeight: 600 }}>{r.score_pct}%</span>
                                </div>
                                <a
                                    href={r.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '8px 14px', borderRadius: 9, textDecoration: 'none',
                                        background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.35)',
                                        color: '#fca5a5', fontSize: '0.85rem', fontWeight: 500
                                    }}
                                >
                                    <span style={{
                                        flexShrink: 0, width: 28, height: 20, borderRadius: 4,
                                        background: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Youtube size={13} color="white" />
                                    </span>
                                    Search: "{r.search_query}"
                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>↗</span>
                                </a>
                            </div>
                        ))}
                        {/* Fallback if no recommendations but weak_topics exist */}
                        {!(result.recommendations?.length) && (result.weak_topics || []).map((t, i) => {
                            const tName = t.topic || t.title || String(t)
                            const searchQ = encodeURIComponent(tName + ' explained')
                            return (
                                <div key={i} style={{ ...card({ background: 'rgba(255,255,255,0.03)', padding: '12px 14px' }) }}>
                                    <div style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: 8 }}>{tName}</div>
                                    <a
                                        href={`https://www.youtube.com/results?search_query=${searchQ}`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                            padding: '8px 14px', borderRadius: 9, textDecoration: 'none',
                                            background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.35)',
                                            color: '#fca5a5', fontSize: '0.85rem', fontWeight: 500
                                        }}
                                    >
                                        <span style={{ width: 28, height: 20, borderRadius: 4, background: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Youtube size={13} color="white" />
                                        </span>
                                        Search on YouTube: "{tName}"
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Detailed Q&A review */}
            {result.graded?.length > 0 && (
                <div style={card()}>
                    <button
                        onClick={() => setShowAll(p => !p)}
                        style={{ ...btn('#475569', true), marginBottom: showAll ? 16 : 0 }}
                    >
                        {showAll ? 'Hide' : 'Show'} detailed answers ({result.graded.length})
                    </button>
                    {showAll && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(result.graded || []).map((q, i) => (
                                <div key={i} style={{ ...card({ padding: 14, background: q.is_correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${q.is_correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }) }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        {q.is_correct ? <CheckCircle2 size={15} color="#10b981" /> : <XCircle size={15} color="#ef4444" />}
                                        <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>Q{i + 1}. {q.question}</span>
                                    </div>
                                    <div style={{ paddingLeft: 23, fontSize: '0.8rem', color: '#94a3b8' }}>
                                        <div>Your answer: <span style={{ color: q.is_correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>{q.student_answer || '(not answered)'}</span></div>
                                        {!q.is_correct && <div>Correct: <span style={{ color: '#10b981', fontWeight: 600 }}>{q.answer}</span></div>}
                                        {q.explanation && <div style={{ marginTop: 6, color: '#64748b', fontStyle: 'italic' }}>{q.explanation}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function ResultsTab({ result, history, loadingHistory }) {
    const hasLatest  = !!result
    const hasHistory = history?.length > 0
    const [histOpen, setHistOpen] = useState({})

    if (!hasLatest && !hasHistory) return (
        <div style={{ ...card(), color: '#64748b', textAlign: 'center', padding: 40 }}>
            <Target size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            {loadingHistory
                ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Loader2 size={16} className="spin" /> Loading results…</div>
                : <div>No results yet — generate and take a test first.</div>
            }
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Latest (just taken) ── */}
            {hasLatest && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Award size={16} color="#10b981" />
                        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>Latest result</span>
                        <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>Just submitted</span>
                    </div>
                    <SingleResult result={result} defaultOpen={false} />
                </div>
            )}

            {/* ── History from DB ── */}
            {hasHistory && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Target size={16} color="#60a5fa" />
                        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>Test history</span>
                        <span style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>{history.length} attempts</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {history.map((h, hIdx) => {
                            const hOpen = histOpen[h.id]
                            const hPct  = h.pct
                            const hColor = SCORE_COLOR(hPct)
                            return (
                                <div key={h.id} style={{ ...card({ padding: 0, overflow: 'hidden' }) }}>
                                    {/* Row header */}
                                    <button
                                        onClick={() => setHistOpen(p => ({ ...p, [h.id]: !p[h.id] }))}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '14px 18px', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                            background: `${hColor}18`, border: `1.5px solid ${hColor}40`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.95rem', color: hColor
                                        }}>{hPct}%</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.88rem' }}>
                                                {h.score}/{h.total} correct
                                                {h.weak_topics?.length > 0 && (
                                                    <span style={{ marginLeft: 10, background: 'rgba(239,68,68,0.12)', color: '#f87171', borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem' }}>
                                                        {h.weak_topics.length} weak
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>
                                                {new Date(h.completed_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem', flexShrink: 0 }}>{hOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {/* Expanded: weak areas + YouTube */}
                                    {hOpen && (h.weak_topics?.length > 0 || h.recommendations?.length > 0) && (
                                        <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', padding: '14px 18px' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Weak areas — YouTube resources
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {((h.recommendations?.length ? h.recommendations : h.weak_topics) || []).map((r, ri) => {
                                                    const tName  = r.topic || r.title || String(r)
                                                    const ytUrl  = r.youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(tName + ' explained')}`
                                                    const ytQ    = r.search_query || tName
                                                    const sPct   = r.score_pct
                                                    return (
                                                        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.83rem', color: '#cbd5e1', flex: 1, minWidth: 100 }}>{tName}</span>
                                                            {sPct != null && <span style={{ color: SCORE_COLOR(sPct), fontSize: '0.78rem', fontWeight: 600 }}>{sPct}%</span>}
                                                            <a
                                                                href={ytUrl} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                    padding: '5px 12px', borderRadius: 8, textDecoration: 'none',
                                                                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                                                    color: '#fca5a5', fontSize: '0.8rem', flexShrink: 0
                                                                }}
                                                            >
                                                                <Youtube size={12} /> {ytQ.length > 30 ? ytQ.slice(0, 30) + '…' : ytQ} ↗
                                                            </a>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Syllabus Detail (with tabs) ─────────────────────────────────────────── */
function SyllabusDetail({ syllabus: initSyl, onBack }) {
    const [syllabus, setSyllabus]         = useState(initSyl)
    const [tab, setTab]                   = useState('topics')
    const [selectedTopics, setSel]        = useState(new Set())
    const [result, setResult]             = useState(null)
    const [history, setHistory]           = useState([])
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [refreshing, setRefreshing]     = useState(false)

    const loadHistory = useCallback(async () => {
        if (historyLoaded) return
        setLoadingHistory(true)
        try {
            const { data } = await axios.get(`${API}/study/syllabi/${initSyl.id}/results`, { headers: authH() })
            setHistory(data.results || [])
            setHistoryLoaded(true)
        } catch { /* ignore */ }
        finally { setLoadingHistory(false) }
    }, [initSyl.id, historyLoaded])

    // Auto-load history when results tab is active
    useEffect(() => {
        if (tab === 'results') loadHistory()
    }, [tab, loadHistory])

    const reload = useCallback(async () => {
        setRefreshing(true)
        try {
            const { data } = await axios.get(`${API}/study/syllabi/${syllabus.id}`, { headers: authH() })
            setSyllabus(data)
        } catch { /* ignore */ }
        finally { setRefreshing(false) }
    }, [syllabus.id])

    const toggleTopic = (id) => setSel(prev => {
        const n = new Set(prev)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
    })

    const allTopicCount = (syllabus.units || []).reduce((s, u) => s + (u.topics || []).length, 0)

    const TABS = [
        { key: 'topics',  label: 'Topics & Notes',    icon: <BookOpen size={15} /> },
        { key: 'test',    label: 'Take a Test',        icon: <FlaskConical size={15} /> },
        { key: 'results', label: 'Results',            icon: <Award size={15} /> }
    ]

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button onClick={onBack} style={btn('#475569', true)}>
                    <ArrowLeft size={15} /> Back
                </button>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#e2e8f0' }}>{syllabus.title}</div>
                    {syllabus.subject && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{syllabus.subject} · {allTopicCount} topics</div>}
                </div>
                <button onClick={reload} disabled={refreshing} style={{ ...btn('#475569', true), marginLeft: 'auto' }}>
                    <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Selection hint */}
            {selectedTopics.size > 0 && (
                <div style={{ ...card({ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', padding: 12 }), marginBottom: 16, fontSize: '0.85rem', color: '#93c5fd' }}>
                    {selectedTopics.size} topic{selectedTopics.size > 1 ? 's' : ''} selected for test generation
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => {
                        setTab(t.key)
                        if (t.key === 'results') loadHistory()
                    }} style={tabBtn(tab === t.key)}>
                        {t.icon} {t.label}
                        {t.key === 'test' && selectedTopics.size > 0 && (
                            <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                {selectedTopics.size}
                            </span>
                        )}
                        {t.key === 'results' && (result || history.length > 0) && (
                            <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                {(result ? 1 : 0) + history.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'topics' && (
                <TopicsTab
                    syllabus={syllabus}
                    selectedTopics={selectedTopics}
                    onToggleTopic={toggleTopic}
                />
            )}
            {tab === 'test' && (
                <TestTab
                    syllabus={syllabus}
                    selectedTopics={selectedTopics}
                    onToggleTopic={toggleTopic}
                    onResult={(r) => { setResult(r); setHistoryLoaded(false); setTab('results'); loadHistory() }}
                />
            )}
            {tab === 'results' && (
                <ResultsTab result={result} history={history} loadingHistory={loadingHistory} />
            )}
        </div>
    )
}

/* ─── Teacher's Notes Section (student view) ─────────────────────────────── */
function TeacherNotesSection() {
    const [notes,    setNotes]    = useState([])
    const [loading,  setLoading]  = useState(true)
    const [open,     setOpen]     = useState(true)
    const [dlId,     setDlId]     = useState(null)
    const [err,      setErr]      = useState(null)

    useEffect(() => {
        axios.get(`${API}/study/teacher-notes`, { headers: authH() })
            .then(r => setNotes(r.data.notes || []))
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

    const fmt = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`
    const ext = (n) => n?.split('.').pop()?.toUpperCase() || 'FILE'
    const extColor = (n) => {
        const e = n?.split('.').pop()?.toLowerCase()
        return e === 'pdf' ? '#ef4444' : e === 'docx' || e === 'doc' ? '#3b82f6'
             : e === 'pptx' || e === 'ppt' ? '#f59e0b' : '#8b5cf6'
    }

    if (!loading && notes.length === 0 && !err) return (
        <div style={{
            ...card({ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.15)' }),
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px'
        }}>
            <BookOpen size={18} color="#6d28d9" style={{ flexShrink: 0 }} />
            <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#a78bfa' }}>Teacher's Notes</span>
                <span style={{ fontSize: '0.8rem', color: '#475569', marginLeft: 10 }}>No notes uploaded by your teacher yet</span>
            </div>
        </div>
    )

    return (
        <div style={{ ...card({ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)' }), marginBottom: 24 }}>
            {/* Header */}
            <button
                onClick={() => setOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0 }}
            >
                <BookOpen size={18} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0', flex: 1, textAlign: 'left' }}>
                    Teacher's Notes
                </span>
                {!loading && (
                    <span style={{
                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
                        color: '#a78bfa', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700
                    }}>
                        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                    </span>
                )}
                {open ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
            </button>

            {open && (
                <div style={{ marginTop: 14 }}>
                    {err && <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 10 }}>{err}</div>}
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.85rem', padding: '8px 0' }}>
                            <Loader2 size={14} className="spin" /> Loading teacher notes…
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {notes.map(note => (
                                <div key={note.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.1)',
                                    borderRadius: 9, padding: '12px 14px'
                                }}>
                                    {/* Badge */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 7, flexShrink: 0,
                                        background: `${extColor(note.original_name)}18`,
                                        border: `1px solid ${extColor(note.original_name)}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: extColor(note.original_name) }}>
                                            {ext(note.original_name)}
                                        </span>
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {note.title}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ color: '#a78bfa' }}>by {note.teacher_name}</span>
                                            {note.subject && <span>· {note.subject}</span>}
                                            <span>· {fmt(note.file_size)}</span>
                                            <span>· {new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {note.description && (
                                            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {note.description}
                                            </div>
                                        )}
                                    </div>
                                    {/* Download */}
                                    <button
                                        onClick={() => download(note)}
                                        disabled={dlId === note.id}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                                            padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
                                            border: '1.5px solid rgba(139,92,246,0.4)',
                                            background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
                                            fontSize: '0.78rem', fontWeight: 600,
                                            opacity: dlId === note.id ? 0.6 : 1
                                        }}
                                    >
                                        {dlId === note.id
                                            ? <Loader2 size={12} className="spin" />
                                            : <Download size={12} />}
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}


export default function SmartStudy() {
    const [view,      setView]     = useState('list') // 'list' | 'detail'
    const [syllabi,   setSyllabi]  = useState([])
    const [loading,   setLoading]  = useState(true)
    const [selected,  setSelected] = useState(null)
    const [showUpload, setShowUpload] = useState(false)

    const loadSyllabi = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(`${API}/study/syllabi`, { headers: authH() })
            setSyllabi(data.syllabi || [])
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadSyllabi() }, [loadSyllabi])

    // Auto-refresh while any syllabus is still processing
    useEffect(() => {
        if (syllabi.some(s => s.status === 'processing')) {
            const t = setTimeout(loadSyllabi, 3000)
            return () => clearTimeout(t)
        }
    }, [syllabi, loadSyllabi])

    const handleUploaded = (id) => {
        setShowUpload(false)
        loadSyllabi()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this syllabus and all its topics?')) return
        try {
            await axios.delete(`${API}/study/syllabi/${id}`, { headers: authH() })
            setSyllabi(p => p.filter(s => s.id !== id))
        } catch (e) { alert(e.response?.data?.error || e.message) }
    }

    const handleSelect = async (syl) => {
        // Fetch full detail
        try {
            const { data } = await axios.get(`${API}/study/syllabi/${syl.id}`, { headers: authH() })
            setSelected(data)
            setView('detail')
        } catch (e) { alert(e.response?.data?.error || e.message) }
    }

    if (view === 'detail' && selected) {
        return (
            <SyllabusDetail
                syllabus={selected}
                onBack={() => { setView('list'); setSelected(null); loadSyllabi() }}
            />
        )
    }

    return (
        <div>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={20} color="#8b5cf6" /> Your Syllabi
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                        Upload your syllabus and let AI extract topics, generate study notes at different difficulty levels, create practice tests, and highlight your weak areas.
                    </p>
                </div>
                <button onClick={() => setShowUpload(p => !p)} style={btn('#8b5cf6')}>
                    <PlusCircle size={15} /> {showUpload ? 'Cancel' : 'Upload Syllabus'}
                </button>
            </div>

            {/* How it works — shown only when no syllabi and form is hidden */}
            {!showUpload && syllabi.length === 0 && !loading && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12, marginBottom: 24
                }}>
                    {[
                        { step: '1', icon: <Upload size={18} />, title: 'Upload', desc: 'Share your syllabus as a PDF, image, or text file' },
                        { step: '2', icon: <Sparkles size={18} />, title: 'AI Extracts Topics', desc: 'AI reads and breaks it into structured topics for you' },
                        { step: '3', icon: <NotebookPen size={18} />, title: 'Get Notes & Tests', desc: 'Generate easy, medium, or hard notes and auto-quizzes per topic' },
                        { step: '4', icon: <Target size={18} />, title: 'Find Weak Areas', desc: 'See scores and get YouTube recommendations for topics you struggle with' },
                    ].map(item => (
                        <div key={item.step} style={{
                            ...card({ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', padding: '16px' }),
                            display: 'flex', flexDirection: 'column', gap: 8
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: '50%', background: 'rgba(139,92,246,0.2)',
                                    border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', flexShrink: 0
                                }}>{item.step}</span>
                                <span style={{ color: '#a78bfa' }}>{item.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>{item.title}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.775rem', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload form (collapsible) */}
            {showUpload && (
                <div style={{ ...card({ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.2)' }), marginBottom: 28 }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 600, color: '#c4b5fd', fontSize: '1rem' }}>
                        Upload New Syllabus
                    </h3>
                    <UploadForm onUploaded={handleUploaded} />
                </div>
            )}

            {/* Syllabus list */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', padding: 32 }}>
                    <Loader2 size={18} className="spin" /> Loading your syllabi…
                </div>
            ) : syllabi.length === 0 ? (
                <div style={{ ...card({ textAlign: 'center', padding: 52 }) }}>
                    <BookOpen size={40} style={{ color: '#334155', marginBottom: 16 }} />
                    <div style={{ color: '#64748b', fontWeight: 500 }}>No syllabi yet</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: 6, marginBottom: 24 }}>
                        Upload a PDF, image, or text file of your syllabus to get started
                    </div>
                    <button onClick={() => setShowUpload(true)} style={btn('#8b5cf6')}>
                        <Upload size={15} /> Upload your first syllabus
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {syllabi.map(s => (
                        <SyllabusCard key={s.id} syl={s} onSelect={handleSelect} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
