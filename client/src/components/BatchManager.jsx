import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Upload, Trash2, Edit3, Users, FileText, Plus, X, Search, Check, AlertCircle, FolderPlus, FileSpreadsheet, Layers } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })
const authHeaderJSON = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' })

function Toast({ item, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3200)
        return () => clearTimeout(timer)
    }, [onClose])
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: item.type === 'error' ? 'linear-gradient(135deg, #3b0d0d, #450a0a)' : 'linear-gradient(135deg, #052e16, #064e3b)',
            color: item.type === 'error' ? '#fca5a5' : '#86efac',
            border: `1px solid ${item.type === 'error' ? '#7f1d1d' : '#166534'}`,
            padding: '14px 20px', borderRadius: 14, minWidth: 300, maxWidth: 480,
            boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideIn 0.3s ease-out',
            fontWeight: 600, fontSize: 14
        }}>
            {item.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {item.message}
        </div>
    )
}

function BatchDetailModal({ batch, onClose }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetch(`${API}/batches/${batch.id}`, { headers: authHeaderJSON() })
            .then(r => r.json())
            .then(data => {
                setStudents(data.batch?.students || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [batch.id])

    const filteredStudents = useMemo(() => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return students
        return students.filter(s =>
            (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
        )
    }, [students, searchQuery])

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: 16 }}>
            <div style={{
                width: 640, maxWidth: '96vw', maxHeight: '85vh', overflow: 'hidden',
                background: 'linear-gradient(165deg, #0f1d3b, #0b1428)',
                borderRadius: 24, border: '1px solid #1e355f',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid #193457', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 22 }}>📋 {batch.batch_name}</div>
                        <div style={{ color: '#8197bc', fontSize: 13, marginTop: 4 }}>
                            {batch.student_count} students
                            {batch.sheet_name ? ` • Sheet: ${batch.sheet_name}` : ''}
                            {batch.source_filename ? ` • File: ${batch.source_filename}` : ''}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#1b2d4f', border: '1px solid #29466f', color: '#9fb2d5', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '14px 26px 0' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search students..."
                            style={{ width: '100%', padding: '12px 14px 12px 40px', background: '#0b1428', border: '1px solid #284570', color: '#d8e3f7', borderRadius: 12, outline: 'none', fontSize: 14 }}
                        />
                    </div>
                </div>

                <div style={{ padding: '14px 26px 20px', flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ color: '#8197bc', textAlign: 'center', padding: 40 }}>Loading...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div style={{ color: '#8197bc', textAlign: 'center', padding: 40 }}>No students found</div>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {filteredStudents.map(student => (
                                <div key={student.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '12px 16px', borderRadius: 12,
                                    background: '#12213c', border: '1px solid #1e3457',
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0
                                    }}>
                                        {(student.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#e6eefb', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                                        <div style={{ color: '#91a6cb', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* Result modal shown right after uploading an Excel file with multiple sheets */
function UploadResultModal({ result, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: 16 }}>
            <div style={{
                width: 540, maxWidth: '96vw', maxHeight: '80vh', overflow: 'hidden',
                background: 'linear-gradient(165deg, #0f1d3b, #0b1428)',
                borderRadius: 24, border: '1px solid #1e355f',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '22px 26px', borderBottom: '1px solid #193457', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#86efac', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Check size={22} /> Upload Successful
                        </div>
                        <div style={{ color: '#8197bc', fontSize: 13, marginTop: 4 }}>
                            {result.filename} • {result.batches_created} batch{result.batches_created !== 1 ? 'es' : ''} created
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#1b2d4f', border: '1px solid #29466f', color: '#9fb2d5', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '16px 26px 22px', overflowY: 'auto', display: 'grid', gap: 10 }}>
                    {result.is_excel && (
                        <div style={{
                            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
                            borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                            color: '#c4b5fd', fontSize: 13, fontWeight: 600
                        }}>
                            <Layers size={16} /> Each sheet in the Excel file was created as a separate batch
                        </div>
                    )}

                    {(result.batches || []).map((batch, idx) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', borderRadius: 14,
                            background: '#12213c', border: '1px solid #1e3457',
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0
                            }}>
                                {batch.student_count}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#e6eefb', fontWeight: 800, fontSize: 15 }}>{batch.batch_name}</div>
                                <div style={{ color: '#91a6cb', fontSize: 12 }}>
                                    {batch.student_count} matched
                                    {batch.unmatched > 0 ? ` • ${batch.unmatched} unmatched` : ''}
                                    {batch.sheet_name ? ` • Sheet: ${batch.sheet_name}` : ''}
                                </div>
                            </div>
                            <div style={{
                                background: batch.student_count > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                color: batch.student_count > 0 ? '#34d399' : '#fbbf24',
                                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700
                            }}>
                                {batch.student_count > 0 ? '✓ Created' : '⚠ Empty'}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '14px 26px', borderTop: '1px solid #193457' }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', border: 'none', borderRadius: 12,
                            padding: '13px 14px', fontWeight: 800, fontSize: 15,
                            cursor: 'pointer', color: '#fff',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function BatchManager() {
    const [batches, setBatches] = useState([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)
    const [showCreate, setShowCreate] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [csvBatchName, setCsvBatchName] = useState('')
    const [creating, setCreating] = useState(false)
    const [editingBatch, setEditingBatch] = useState(null)
    const [editName, setEditName] = useState('')
    const [detailBatch, setDetailBatch] = useState(null)
    const [uploadResult, setUploadResult] = useState(null)
    const fileInputRef = useRef(null)

    const isExcel = selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))

    async function loadBatches() {
        setLoading(true)
        try {
            const res = await fetch(`${API}/batches`, { headers: authHeaderJSON() })
            const data = await res.json()
            setBatches(data.batches || [])
        } catch (err) {
            console.error('Load batches error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadBatches() }, [])

    async function uploadFile() {
        if (!selectedFile) {
            setToast({ type: 'error', message: 'Please select a CSV or Excel file' })
            return
        }
        if (!isExcel && !csvBatchName.trim()) {
            setToast({ type: 'error', message: 'Batch name is required for CSV files' })
            return
        }

        setCreating(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            if (!isExcel && csvBatchName.trim()) {
                formData.append('batch_name', csvBatchName.trim())
            }

            const res = await fetch(`${API}/batches`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setToast({ type: 'error', message: data.error || 'Failed to create batch' })
                return
            }

            setUploadResult(data)
            setSelectedFile(null)
            setCsvBatchName('')
            setShowCreate(false)
            loadBatches()
        } catch (err) {
            setToast({ type: 'error', message: err.message })
        } finally {
            setCreating(false)
        }
    }

    async function deleteBatch(id) {
        if (!window.confirm('Are you sure you want to delete this batch?')) return
        try {
            const res = await fetch(`${API}/batches/${id}`, { method: 'DELETE', headers: authHeaderJSON() })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setToast({ type: 'error', message: data.error || 'Delete failed' })
                return
            }
            setToast({ type: 'success', message: 'Batch deleted successfully' })
            loadBatches()
        } catch (err) {
            setToast({ type: 'error', message: err.message })
        }
    }

    async function updateBatchName(id) {
        if (!editName.trim()) return
        try {
            const formData = new FormData()
            formData.append('batch_name', editName.trim())
            const res = await fetch(`${API}/batches/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setToast({ type: 'error', message: data.error || 'Update failed' })
                return
            }
            setToast({ type: 'success', message: 'Batch name updated' })
            setEditingBatch(null)
            setEditName('')
            loadBatches()
        } catch (err) {
            setToast({ type: 'error', message: err.message })
        }
    }

    function handleDrop(e) {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file)
        } else {
            setToast({ type: 'error', message: 'Only CSV or Excel (.xlsx) files are supported' })
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {toast && <Toast item={toast} onClose={() => setToast(null)} />}
            {detailBatch && <BatchDetailModal batch={detailBatch} onClose={() => setDetailBatch(null)} />}
            {uploadResult && <UploadResultModal result={uploadResult} onClose={() => setUploadResult(null)} />}

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                borderRadius: 22, border: '1px solid rgba(139, 92, 246, 0.25)',
                padding: '26px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-60%', right: '-8%', width: 300, height: 300,
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)'
                        }}>
                            <FolderPlus size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 900 }}>Batch Manager</div>
                            <div style={{ color: '#94a3b8', marginTop: 2, fontSize: 14 }}>
                                Upload Excel with multiple sheets → each sheet = one batch
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setShowCreate(!showCreate); setSelectedFile(null); setCsvBatchName('') }}
                    style={{
                        position: 'relative', zIndex: 1,
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 20px', borderRadius: 14,
                        border: 'none', cursor: 'pointer',
                        background: showCreate ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff', fontWeight: 800, fontSize: 15,
                        boxShadow: showCreate ? '0 6px 20px rgba(239, 68, 68, 0.3)' : '0 6px 20px rgba(139, 92, 246, 0.35)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {showCreate ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Upload File</>}
                </button>
            </div>

            {/* Upload Form */}
            {showCreate && (
                <div style={{
                    background: 'linear-gradient(165deg, #1a2a4e, #0f172a)',
                    borderRadius: 20, border: '1px solid #1e3a5f',
                    padding: 28, display: 'grid', gap: 20,
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <div style={{ borderBottom: '1px solid #1e3a5f', paddingBottom: 16 }}>
                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20 }}>📦 Upload Student File</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                            Upload an <strong style={{ color: '#a78bfa' }}>Excel file (.xlsx)</strong> — each sheet becomes a separate batch.
                            Or upload a <strong style={{ color: '#60a5fa' }}>CSV</strong> for a single batch.
                        </div>
                    </div>

                    {/* File Drop Zone */}
                    <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${selectedFile ? '#8b5cf6' : '#334155'}`,
                            borderRadius: 16, padding: selectedFile ? '18px 20px' : '44px 20px',
                            textAlign: 'center', cursor: 'pointer',
                            background: selectedFile ? 'rgba(139, 92, 246, 0.05)' : 'rgba(2, 6, 23, 0.5)',
                            transition: 'border-color 0.2s ease, background 0.2s ease'
                        }}
                        onMouseEnter={e => { if (!selectedFile) { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)' } }}
                        onMouseLeave={e => { if (!selectedFile) { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = 'rgba(2, 6, 23, 0.5)' } }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={e => {
                                if (e.target.files[0]) setSelectedFile(e.target.files[0])
                                e.target.value = ''
                            }}
                        />
                        {!selectedFile ? (
                            <>
                                <FileSpreadsheet size={40} style={{ color: '#64748b', marginBottom: 12 }} />
                                <div style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>Drop a file here or click to browse</div>
                                <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>
                                    Supports <strong style={{ color: '#a78bfa' }}>.xlsx</strong> (multi-sheet) and <strong style={{ color: '#60a5fa' }}>.csv</strong> files
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: isExcel ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {isExcel ? <Layers size={22} color="white" /> : <FileText size={22} color="white" />}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15 }}>{selectedFile.name}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                                        {(selectedFile.size / 1024).toFixed(1)} KB •
                                        {isExcel ? ' Excel — each sheet will become a batch' : ' CSV — single batch'}
                                    </div>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Batch name input for CSV only */}
                    {selectedFile && !isExcel && (
                        <div style={{ display: 'grid', gap: 8 }}>
                            <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📌 Batch Name *</label>
                            <input
                                value={csvBatchName}
                                onChange={e => setCsvBatchName(e.target.value)}
                                placeholder="e.g., CSE 2024 Batch A"
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    background: '#020617', border: '1px solid #334155',
                                    borderRadius: 12, color: '#e2e8f0', fontSize: 15,
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    {/* Excel info box */}
                    {selectedFile && isExcel && (
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 12, padding: '14px 18px',
                            display: 'flex', alignItems: 'flex-start', gap: 12
                        }}>
                            <Layers size={20} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ color: '#34d399', fontWeight: 800, fontSize: 14 }}>Multi-Sheet Mode</div>
                                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                                    Each sheet in this Excel file will be created as a <strong style={{ color: '#cbd5e1' }}>separate batch</strong>.
                                    The <strong style={{ color: '#cbd5e1' }}>sheet name</strong> will be used as the batch name.
                                    Ensure each sheet has a header row with <code style={{ color: '#a78bfa', background: '#1e293b', padding: '1px 5px', borderRadius: 4 }}>email</code> or <code style={{ color: '#a78bfa', background: '#1e293b', padding: '1px 5px', borderRadius: 4 }}>name</code> columns.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Format Hint */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.06)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        borderRadius: 12, padding: '12px 16px'
                    }}>
                        <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>💡 EXPECTED FORMAT</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
                            Each sheet / CSV should have a header row with columns like <strong style={{ color: '#cbd5e1' }}>email</strong>, <strong style={{ color: '#cbd5e1' }}>name</strong>, or <strong style={{ color: '#cbd5e1' }}>id</strong>.
                            Students are matched against registered users. Unmatched rows are skipped.
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        disabled={creating || !selectedFile}
                        onClick={uploadFile}
                        style={{
                            border: 'none', borderRadius: 14,
                            padding: '16px 20px', fontWeight: 900, fontSize: 16,
                            cursor: creating || !selectedFile ? 'not-allowed' : 'pointer',
                            color: '#fff',
                            background: creating || !selectedFile ? '#31435f' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            boxShadow: creating || !selectedFile ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.35)',
                            transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                        }}
                    >
                        {creating ? 'Processing...' : <><Upload size={18} /> {isExcel ? 'Upload & Create Batches' : 'Upload & Create Batch'}</>}
                    </button>
                </div>
            )}

            {/* Batches Grid */}
            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>Loading batches...</div>
            ) : batches.length === 0 ? (
                <div style={{
                    background: 'linear-gradient(165deg, #1a2a4e, #0f172a)',
                    borderRadius: 20, border: '1px solid #1e3a5f',
                    padding: '60px 20px', textAlign: 'center'
                }}>
                    <FileSpreadsheet size={48} style={{ color: '#334155', marginBottom: 16 }} />
                    <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 700 }}>No batches created yet</div>
                    <div style={{ color: '#64748b', fontSize: 14, marginTop: 6 }}>
                        Upload an Excel file with multiple sheets — each sheet becomes a batch
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16
                }}>
                    {batches.map(batch => (
                        <div
                            key={batch.id}
                            style={{
                                background: 'linear-gradient(165deg, #1a2a4e, #0f172a)',
                                borderRadius: 20, border: '1px solid #1e3a5f',
                                padding: 0, overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.15)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3a5f'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            {/* Card Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.08))',
                                padding: '18px 20px 14px',
                                borderBottom: '1px solid rgba(30, 58, 95, 0.5)',
                                cursor: 'pointer'
                            }}
                                onClick={() => setDetailBatch(batch)}
                            >
                                {editingBatch === batch.id ? (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') updateBatchName(batch.id); if (e.key === 'Escape') setEditingBatch(null) }}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            style={{ flex: 1, padding: '8px 12px', background: '#020617', border: '1px solid #3b82f6', borderRadius: 8, color: '#e2e8f0', fontSize: 15, fontWeight: 700, outline: 'none' }}
                                        />
                                        <button onClick={e => { e.stopPropagation(); updateBatchName(batch.id) }} style={{ background: '#10b981', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}>Save</button>
                                        <button onClick={e => { e.stopPropagation(); setEditingBatch(null) }} style={{ background: '#374151', border: 'none', color: '#9ca3af', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 17 }}>{batch.batch_name}</div>
                                        {batch.sheet_name && (
                                            <div style={{ color: '#64748b', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Layers size={11} /> Sheet: {batch.sheet_name}
                                                {batch.source_filename ? ` • ${batch.source_filename}` : ''}
                                            </div>
                                        )}
                                        {!batch.sheet_name && batch.source_filename && (
                                            <div style={{ color: '#64748b', fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FileText size={11} /> {batch.source_filename}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '14px 20px 18px' }}>
                                {/* Student Count */}
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: 12, padding: '14px 16px',
                                    textAlign: 'center', marginBottom: 14
                                }}>
                                    <div style={{ color: '#60a5fa', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{batch.student_count}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Students</div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setDetailBatch(batch)}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 0', borderRadius: 10,
                                            border: '1px solid #284570', background: '#14233f',
                                            color: '#b7c8e6', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#1a2d4f'; e.currentTarget.style.borderColor = '#3b82f6' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#14233f'; e.currentTarget.style.borderColor = '#284570' }}
                                    >
                                        <Users size={14} /> View
                                    </button>
                                    <button
                                        onClick={() => { setEditingBatch(batch.id); setEditName(batch.batch_name) }}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 0', borderRadius: 10,
                                            border: '1px solid #284570', background: '#14233f',
                                            color: '#b7c8e6', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#1a2d4f'; e.currentTarget.style.borderColor = '#f59e0b' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#14233f'; e.currentTarget.style.borderColor = '#284570' }}
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => deleteBatch(batch.id)}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 0', borderRadius: 10,
                                            border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)',
                                            color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = '#ef4444' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)' }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    )
}
