import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Users, Eye, Upload, X, Check, Globe, Search, Tag, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

const CATEGORIES = ['General', 'Tutorial', 'Documentation', 'Video', 'Article', 'Tool', 'GitHub', 'Other']

export default function AdminResourceLinks() {
    const [links, setLinks] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [showBulk, setShowBulk] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCat, setFilterCat] = useState('all')
    const [assignModal, setAssignModal] = useState(null) // link object
    const [selectedStudents, setSelectedStudents] = useState([])
    const [assigning, setAssigning] = useState(false)
    const [assignMode, setAssignMode] = useState('all') // 'all' | 'individual' | 'batch'
    const [studentSearch, setStudentSearch] = useState('')
    const [form, setForm] = useState({ title: '', url: '', description: '', category: 'General' })
    const [bulkJson, setBulkJson] = useState('')
    const [bulkError, setBulkError] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState({ msg: '', type: 'success' })

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000) }

    const fetchLinks = async () => {
        try {
            const res = await axios.get(`${API_BASE}/resource-links`, { headers: authHeader() })
            setLinks(res.data.links || [])
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users?role=student`, { headers: authHeader() })
            setStudents(res.data.users || res.data || [])
        } catch { }
    }

    useEffect(() => { fetchLinks(); fetchStudents() }, [])

    function authHeader() {
        const token = localStorage.getItem('authToken')
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.title || !form.url) return showToast('Title and URL are required', 'error')
        setSaving(true)
        try {
            await axios.post(`${API_BASE}/resource-links`, form, { headers: authHeader() })
            showToast('Link created!')
            setForm({ title: '', url: '', description: '', category: 'General' })
            setShowCreate(false)
            fetchLinks()
        } catch (err) { showToast('Error: ' + (err.response?.data?.error || err.message), 'error') }
        setSaving(false)
    }

    const handleBulkImport = async () => {
        setBulkError('')
        let parsed
        try {
            parsed = JSON.parse(bulkJson)
            if (!Array.isArray(parsed)) parsed = [parsed]
        } catch {
            setBulkError('Invalid JSON. Provide an array of { title, url, description, category } objects.')
            return
        }
        setSaving(true)
        try {
            await axios.post(`${API_BASE}/resource-links`, { links: parsed }, { headers: authHeader() })
            showToast(`Imported ${parsed.length} link(s)!`)
            setBulkJson('')
            setShowBulk(false)
            fetchLinks()
        } catch (err) { setBulkError(err.response?.data?.error || err.message) }
        setSaving(false)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this link? Students will lose access to it.')) return
        try {
            await axios.delete(`${API_BASE}/resource-links/${id}`, { headers: authHeader() })
            showToast('Link deleted')
            setLinks(prev => prev.filter(l => l.id !== id))
        } catch (err) { showToast('Error: ' + (err.response?.data?.error || err.message), 'error') }
    }

    const openAssignModal = (link) => {
        setAssignModal(link)
        setSelectedStudents([])
        setAssignMode('all')
        setStudentSearch('')
    }

    const handleAssign = async () => {
        if (!assignModal) return
        setAssigning(true)
        try {
            const payload = assignMode === 'all'
                ? { assignAll: true }
                : { studentIds: selectedStudents }
            await axios.post(`${API_BASE}/resource-links/${assignModal.id}/assign`, payload, { headers: authHeader() })
            showToast(`✓ Assigned link to ${assignMode === 'all' ? 'all ' + students.length + ' students' : selectedStudents.length + ' student(s)'}!`)
            setAssignModal(null)
            fetchLinks()
        } catch (err) {
            showToast('Error: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setAssigning(false)
        }
    }

    const handleAssignIndividual = async (studentId, studentName) => {
        setAssigning(true)
        try {
            await axios.post(`${API_BASE}/resource-links/${assignModal.id}/assign`, { studentIds: [studentId] }, { headers: authHeader() })
            showToast(`✓ Assigned to ${studentName}!`)
            fetchLinks()
        } catch (err) {
            showToast('Error: ' + (err.response?.data?.error || err.message), 'error')
        } finally {
            setAssigning(false)
        }
    }

    const filtered = links.filter(l => {
        const q = searchTerm.toLowerCase()
        return (filterCat === 'all' || l.category === filterCat) &&
            (!q || l.title?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))
    })

    const catColor = { General: '#3b82f6', Tutorial: '#10b981', Documentation: '#f59e0b', Video: '#ef4444', Article: '#8b5cf6', Tool: '#06b6d4', GitHub: '#1e293b', Other: '#64748b' }

    if (loading) return <div className="loading-spinner"></div>

    return (
        <div className="animate-fadeIn" style={{ padding: '0', maxWidth: '100%' }}>
            {/* Toast */}
            {toast.msg && (
                <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 99999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '0.85rem 1.4rem', borderRadius: '12px', fontWeight: 700, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 420, minWidth: 200, fontSize: '0.9rem' }}>
                    <span style={{ fontSize: '1.15rem' }}>{toast.type === 'error' ? '❌' : '✅'}</span> {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Resource Links</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Share curated links with students via cards</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => { setShowBulk(true); setShowCreate(false) }} style={{ padding: '0.6rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#8b5cf6', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Upload size={16} /> Bulk JSON Import
                    </button>
                    <button onClick={() => { setShowCreate(true); setShowBulk(false) }} style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={16} /> Add Link
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Add New Link</h3>
                        <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Title *</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. React Documentation" required style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>URL *</label>
                            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." required style={inputStyle} type="url" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Category</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
                            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {saving ? 'Creating...' : 'Create Link'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Bulk Import */}
            {showBulk && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Bulk Import from JSON</h3>
                        <button onClick={() => setShowBulk(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '0.75rem' }}>
                        Paste a JSON array of links: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{'[{"title":"...", "url":"...", "description":"...", "category":"..."}]'}</code>
                    </p>
                    <textarea
                        value={bulkJson}
                        onChange={e => { setBulkJson(e.target.value); setBulkError('') }}
                        placeholder={'[\n  {\n    "title": "React Docs",\n    "url": "https://react.dev",\n    "description": "Official React documentation",\n    "category": "Documentation"\n  }\n]'}
                        rows={10}
                        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                    />
                    {bulkError && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: 6 }}>{bulkError}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <button onClick={() => setShowBulk(false)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>Cancel</button>
                        <button onClick={handleBulkImport} disabled={saving || !bulkJson.trim()} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                            {saving ? 'Importing...' : 'Import Links'}
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search links..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '2rem', width: '100%' }} />
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={inputStyle}>
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                    {filtered.length} link{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Links', value: links.length, color: '#3b82f6' },
                    { label: 'Categories', value: [...new Set(links.map(l => l.category))].length, color: '#8b5cf6' },
                    { label: 'Total Assigned', value: links.reduce((a, l) => a + (l.assignedCount || 0), 0), color: '#10b981' }
                ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <Link2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No links found</p>
                    <p style={{ fontSize: '0.87rem' }}>Add some links to share with students</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map(link => (
                        <div key={link.id} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px',
                            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            position: 'relative', overflow: 'hidden'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            {/* Category Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: catColor[link.category] + '22', color: catColor[link.category] || '#3b82f6', border: `1px solid ${catColor[link.category]}44` }}>
                                    {link.category}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <Users size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                    {link.assignedCount || 0} assigned
                                </span>
                            </div>

                            {/* Title & URL */}
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{link.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Globe size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    {link.url}
                                </p>
                            </div>

                            {link.description && (
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {link.description}
                                </p>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none' }}>
                                    <ExternalLink size={13} /> View
                                </a>
                                <button onClick={() => openAssignModal(link)}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                    <Users size={13} /> Assign
                                </button>
                                <button onClick={() => handleDelete(link.id)}
                                    style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflow: 'auto' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>Assign Link</h3>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{assignModal.title}</p>
                            </div>
                            <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
                        </div>

                        {/* Mode Tabs */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            {[{ id: 'all', icon: '🌐', label: 'Assign All' }, { id: 'individual', icon: '👤', label: 'Individual' }, { id: 'batch', icon: '👥', label: 'Batch' }].map(tab => (
                                <button key={tab.id} type="button" onClick={() => { setAssignMode(tab.id); setSelectedStudents([]); setStudentSearch('') }}
                                    style={{ padding: '0.5rem 0.25rem', background: assignMode === tab.id ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', border: 'none', borderRadius: '8px', color: assignMode === tab.id ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s' }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Assign All Mode */}
                        {assignMode === 'all' && (
                            <div style={{ textAlign: 'center', padding: '2rem 1.5rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{students.length}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.4rem 0 1.25rem 0' }}>students will receive this link</div>
                                <button onClick={handleAssign} disabled={assigning}
                                    style={{ padding: '0.8rem 2rem', background: assigning ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', cursor: assigning ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    {assigning ? '⏳ Assigning...' : `🚀 Assign to All ${students.length} Students`}
                                </button>
                            </div>
                        )}

                        {/* Individual Mode */}
                        {assignMode === 'individual' && (
                            <div>
                                <input type="text" placeholder="🔍 Search student by name or email..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: '0.75rem' }} />
                                <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '0.75rem' }}>
                                    {students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 ? (
                                        <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students match your search</p>
                                    ) : students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                        <button key={s.id} type="button" onClick={() => handleAssignIndividual(s.id, s.name)} disabled={assigning}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: assigning ? 'not-allowed' : 'pointer', textAlign: 'left', color: 'inherit', transition: 'background 0.1s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                            </div>
                                            <span style={{ padding: '3px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>Assign →</span>
                                        </button>
                                    ))}
                                </div>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>Click a student row to instantly assign this link.</p>
                            </div>
                        )}

                        {/* Batch Mode */}
                        {assignMode === 'batch' && (
                            <div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input type="text" placeholder="🔍 Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button type="button"
                                        onClick={() => setSelectedStudents(students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => s.id))}
                                        style={{ padding: '0.5rem 0.875rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Select All</button>
                                    {selectedStudents.length > 0 && <button type="button" onClick={() => setSelectedStudents([])}
                                        style={{ padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Clear</button>}
                                </div>
                                <div style={{ maxHeight: '260px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '0.875rem' }}>
                                    {students.filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.87rem', background: selectedStudents.includes(s.id) ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                                            <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={e => {
                                                if (e.target.checked) setSelectedStudents(p => [...p, s.id])
                                                else setSelectedStudents(p => p.filter(id => id !== s.id))
                                            }} style={{ cursor: 'pointer' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                            </div>
                                            {selectedStudents.includes(s.id) && <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={() => setAssignModal(null)} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>Cancel</button>
                                    <button onClick={handleAssign} disabled={assigning || selectedStudents.length === 0}
                                        style={{ flex: 2, padding: '0.7rem', background: selectedStudents.length === 0 ? 'rgba(139,92,246,0.25)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                                        {assigning ? '⏳ Assigning...' : selectedStudents.length === 0 ? 'Select students first' : `Assign to ${selectedStudents.length} student(s)`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {assignMode !== 'batch' && (
                            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                                <button onClick={() => setAssignModal(null)} style={{ padding: '0.55rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const inputStyle = {
    padding: '0.6rem 0.875rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'inherit',
    fontSize: '0.87rem',
    outline: 'none',
    width: '100%'
}
