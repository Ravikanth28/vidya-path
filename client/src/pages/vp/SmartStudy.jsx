/**
 * Smart Study — upload your syllabus, get AI-generated notes per topic,
 * take auto-generated tests, and see weak areas with YouTube recommendations.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
    Upload, FileText, BookOpen, ChevronRight, ChevronDown, Download,
    Loader2, CheckCircle2, XCircle, Youtube, RefreshCw,
    Target, Trash2, AlertTriangle, ArrowLeft,
    Award, NotebookPen, FlaskConical, Sparkles, PlusCircle
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

/* ─── Notes Panel (difficulty selector + download) ───────────────────────── */
function NotesPanel({ sylId, topic, syllabus }) {
    const [activeDiff, setActiveDiff] = useState('medium')
    const [notesMap,   setNotesMap]   = useState(() => parseNotesMap(topic.notes))
    const [polling,    setPolling]    = useState(null)  // diff key currently being generated
    const [err,        setErr]        = useState(null)
    const [dlLoading,  setDlLoading]  = useState(null) // 'pdf'|'docx'

    useEffect(() => { setNotesMap(parseNotesMap(topic.notes)) }, [topic.notes])

    const D = DIFFICULTIES.find(d => d.key === activeDiff)
    const current = notesMap[activeDiff] || { status: 'none' }

    const generate = async (diff) => {
        if (polling === diff) return
        setErr(null)
        setPolling(diff)
        setNotesMap(prev => ({ ...prev, [diff]: { status: 'generating' } }))
        try {
            await axios.post(
                `${API}/study/syllabi/${sylId}/topics/${topic.id}/notes`,
                { difficulty: diff },
                { headers: authH() }
            )
        } catch (e) {
            setErr(e.response?.data?.error || e.message)
            setPolling(null)
            setNotesMap(prev => ({ ...prev, [diff]: { status: 'error' } }))
            return
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

    return (
        <div style={{
            marginTop: 10, borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${D.border}`, boxShadow: `0 0 0 1px rgba(0,0,0,.2)`
        }}>
            {/* ── Difficulty tab strip ── */}
            <div style={{ display: 'flex', background: 'rgba(2,6,23,0.7)' }}>
                {DIFFICULTIES.map((d, i) => {
                    const isActive  = activeDiff === d.key
                    const st        = notesMap[d.key]?.status || 'none'
                    const isSpinning = polling === d.key
                    return (
                        <button key={d.key} onClick={() => setActiveDiff(d.key)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '11px 8px', border: 'none', cursor: 'pointer',
                            background: isActive ? d.bg : 'transparent',
                            borderBottom: `2px solid ${isActive ? d.color : 'transparent'}`,
                            color: isActive ? d.color : '#64748b',
                            fontWeight: isActive ? 700 : 400, fontSize: '0.85rem', transition: 'all .15s',
                            borderRight: i < 2 ? '1px solid rgba(148,163,184,0.08)' : 'none'
                        }}>
                            {isSpinning
                                ? <Loader2 size={12} className="spin" />
                                : st === 'ready'
                                    ? <CheckCircle2 size={12} color={d.color} />
                                    : st === 'error'
                                        ? <XCircle size={12} color="#ef4444" />
                                        : <Sparkles size={12} />}
                            {d.label}
                            {st === 'ready' && !isActive && (
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: d.color, opacity: 0.7, marginLeft: 2
                                }} />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Content pane ── */}
            <div style={{ padding: 18, background: 'rgba(2,6,23,0.45)' }}>
                {err && (
                    <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} /> {err}
                    </div>
                )}

                {current.status === 'none' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: D.bg, border: `1.5px solid ${D.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 14px'
                        }}>
                            <Sparkles size={22} color={D.color} />
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 6 }}>
                            No <strong style={{ color: D.color }}>{D.label}</strong> notes yet
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 18 }}>
                            {activeDiff === 'easy'   && 'Simple explanations with analogies — perfect for first-time learners'}
                            {activeDiff === 'medium' && 'Comprehensive exam-ready notes with examples and revision tips'}
                            {activeDiff === 'hard'   && 'Advanced theory, proofs, and competitive exam preparation'}
                        </div>
                        <button onClick={() => generate(activeDiff)} style={{
                            ...btn(D.color), padding: '10px 22px', fontSize: '0.875rem'
                        }}>
                            <Sparkles size={14} /> Generate {D.label} Notes
                        </button>
                    </div>
                )}

                {current.status === 'generating' && (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                        <Loader2 size={32} className="spin" style={{ color: D.color, marginBottom: 12 }} />
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            Generating <strong style={{ color: D.color }}>{D.label}</strong> notes…
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: 6 }}>
                            AI is writing your notes — this takes 10–25 seconds
                        </div>
                    </div>
                )}

                {current.status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <XCircle size={28} style={{ color: '#ef4444', marginBottom: 10 }} />
                        <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: 14 }}>
                            Generation failed. Please try again.
                        </div>
                        <button onClick={() => generate(activeDiff)} style={btn('#ef4444', true)}>
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {current.status === 'ready' && current.content && (
                    <div>
                        {/* Download toolbar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 14, paddingBottom: 14,
                            borderBottom: '1px solid rgba(148,163,184,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    background: D.bg, border: `1px solid ${D.border}`,
                                    color: D.color, borderRadius: 6,
                                    padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em'
                                }}>
                                    {D.label.toUpperCase()}
                                </span>
                                <span style={{ color: '#475569', fontSize: '0.8rem' }}>
                                    <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: '#10b981' }} />
                                    Notes ready · Download below
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                    onClick={() => handleDownload('pdf')}
                                    disabled={dlLoading !== null}
                                    title="Download as PDF"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '6px 13px', borderRadius: 7, cursor: 'pointer',
                                        border: '1.5px solid rgba(239,68,68,.45)',
                                        background: 'rgba(239,68,68,.08)', color: '#fca5a5',
                                        fontSize: '0.78rem', fontWeight: 500, opacity: dlLoading ? 0.6 : 1
                                    }}
                                >
                                    {dlLoading === 'pdf' ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDownload('docx')}
                                    disabled={dlLoading !== null}
                                    title="Download as Word document"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '6px 13px', borderRadius: 7, cursor: 'pointer',
                                        border: '1.5px solid rgba(59,130,246,.45)',
                                        background: 'rgba(59,130,246,.08)', color: '#93c5fd',
                                        fontSize: '0.78rem', fontWeight: 500, opacity: dlLoading ? 0.6 : 1
                                    }}
                                >
                                    {dlLoading === 'docx' ? <Loader2 size={12} className="spin" /> : <FileText size={12} />}
                                    DOCX
                                </button>
                                <button
                                    onClick={() => generate(activeDiff)}
                                    disabled={polling !== null}
                                    title="Regenerate notes"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                                        border: '1.5px solid rgba(148,163,184,.2)',
                                        background: 'transparent', color: '#64748b',
                                        fontSize: '0.78rem'
                                    }}
                                >
                                    <RefreshCw size={12} className={polling === activeDiff ? 'spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Notes content */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                            padding: '16px 18px', maxHeight: 500, overflowY: 'auto',
                            border: '1px solid rgba(148,163,184,0.06)'
                        }}>
                            <pre style={{
                                whiteSpace: 'pre-wrap', fontSize: '0.875rem',
                                color: '#cbd5e1', lineHeight: 1.8, margin: 0, fontFamily: 'inherit'
                            }}>
                                {current.content}
                            </pre>
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
function ResultsTab({ result }) {
    if (!result) return (
        <div style={{ ...card(), color: '#64748b', textAlign: 'center', padding: 40 }}>
            <Target size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No result yet — generate and take a test first.</div>
        </div>
    )

    const pct = result.pct
    const scoreColor = SCORE_COLOR(pct)
    const [showAll, setShowAll] = useState(false)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Score summary */}
            <div style={{ ...card({ background: `rgba(${pct >= 70 ? '16,185,129' : pct >= 40 ? '245,158,11' : '239,68,68'},.06)`, border: `1px solid ${scoreColor}40` }), textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor }}>{pct}%</div>
                <div style={{ color: '#94a3b8', marginTop: 4 }}>{result.score} / {result.total} correct</div>
                <div style={{ marginTop: 8, fontSize: '1rem', fontWeight: 600, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                    {pct >= 70 ? '🎉 Great job!' : pct >= 40 ? '📚 Keep studying!' : '⚠️ Needs more practice'}
                </div>
            </div>

            {/* Topic-wise breakdown */}
            <div style={card()}>
                <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Topic Performance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(result.topic_stats || []).map(t => {
                        const p = Math.round((t.correct / t.total) * 100)
                        const c = SCORE_COLOR(p)
                        return (
                            <div key={t.topic_id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
                                    <span style={{ color: '#cbd5e1' }}>{t.topic}</span>
                                    <span style={{ color: c, fontWeight: 600 }}>{t.correct}/{t.total}</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${p}%`, background: c, borderRadius: 3, transition: 'width .6s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Weak areas + YouTube */}
            {result.weak_topics?.length > 0 && (
                <div style={card({ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' })}>
                    <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} /> Areas that need more study
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {(result.recommendations || []).map((r, i) => (
                            <div key={i} style={{ ...card({ background: 'rgba(255,255,255,0.03)', padding: 14 }) }}>
                                <div style={{ fontWeight: 500, color: '#e2e8f0', marginBottom: 6 }}>{r.topic}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                                    Your score: <span style={{ color: SCORE_COLOR(r.score_pct), fontWeight: 600 }}>{r.score_pct}%</span>
                                </div>
                                <a
                                    href={r.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#fca5a5', fontSize: '0.85rem', fontWeight: 500
                                    }}
                                >
                                    <Youtube size={14} /> Search on YouTube: "{r.search_query}"
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Q&A review */}
            <div style={card()}>
                <button
                    onClick={() => setShowAll(p => !p)}
                    style={{ ...btn('#475569', true), marginBottom: showAll ? 16 : 0 }}
                >
                    {showAll ? 'Hide' : 'Show'} detailed answers ({result.graded?.length})
                </button>
                {showAll && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(result.graded || []).map((q, i) => (
                            <div key={i} style={{ ...card({ padding: 14, background: q.is_correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${q.is_correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }) }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    {q.is_correct ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>Q{i + 1}. {q.question}</span>
                                </div>
                                <div style={{ paddingLeft: 24, fontSize: '0.8rem', color: '#94a3b8' }}>
                                    <div>Your answer: <span style={{ color: q.is_correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>{q.student_answer || '(not answered)'}</span></div>
                                    {!q.is_correct && <div>Correct: <span style={{ color: '#10b981', fontWeight: 600 }}>{q.answer}</span></div>}
                                    {q.explanation && <div style={{ marginTop: 6, color: '#64748b', fontStyle: 'italic' }}>{q.explanation}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Syllabus Detail (with tabs) ─────────────────────────────────────────── */
function SyllabusDetail({ syllabus: initSyl, onBack }) {
    const [syllabus, setSyllabus]     = useState(initSyl)
    const [tab, setTab]               = useState('topics')
    const [selectedTopics, setSel]    = useState(new Set())
    const [result, setResult]         = useState(null)
    const [refreshing, setRefreshing] = useState(false)

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
                    <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                        {t.icon} {t.label}
                        {t.key === 'test' && selectedTopics.size > 0 && (
                            <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                {selectedTopics.size}
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
                    onResult={(r) => { setResult(r); setTab('results') }}
                />
            )}
            {tab === 'results' && (
                <ResultsTab result={result} />
            )}
        </div>
    )
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.4rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={22} color="#8b5cf6" /> Smart Study
                    </h2>
                    <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                        Upload your syllabus → AI extracts topics → generate notes & tests → find weak areas
                    </p>
                </div>
                <button onClick={() => setShowUpload(p => !p)} style={btn('#8b5cf6')}>
                    <PlusCircle size={15} /> {showUpload ? 'Cancel' : 'Upload Syllabus'}
                </button>
            </div>

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
