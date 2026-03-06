import { useState, useEffect } from 'react'
import { Link2, ExternalLink, Globe, Search, Tag, Clock, BookOpen } from 'lucide-react'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

const catColor = {
    General: '#3b82f6', Tutorial: '#10b981', Documentation: '#f59e0b',
    Video: '#ef4444', Article: '#8b5cf6', Tool: '#06b6d4', GitHub: '#1e293b', Other: '#64748b'
}

function authHeader() {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function StudentResourceLinks({ user }) {
    const [links, setLinks] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCat, setFilterCat] = useState('all')

    useEffect(() => {
        const fetchLinks = async () => {
            try {
                const res = await axios.get(`${API_BASE}/resource-links/student`, { headers: authHeader() })
                setLinks(res.data.links || [])
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchLinks()
    }, [])

    const categories = [...new Set(links.map(l => l.category))].filter(Boolean)

    const filtered = links.filter(l => {
        const q = searchTerm.toLowerCase()
        return (filterCat === 'all' || l.category === filterCat) &&
            (!q || l.title?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q))
    })

    if (loading) return <div className="loading-spinner"></div>

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Link2 size={24} color="white" />
                    </div>
                    Resource Links
                </h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Curated resources shared by your admin</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'inherit', fontSize: '0.87rem', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setFilterCat('all')}
                        style={{ padding: '0.35rem 0.875rem', borderRadius: '999px', border: `1px solid ${filterCat === 'all' ? 'rgba(59,130,246,0.5)' : 'var(--border-color)'}`, background: filterCat === 'all' ? 'rgba(59,130,246,0.1)' : 'transparent', color: filterCat === 'all' ? '#3b82f6' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        All ({links.length})
                    </button>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setFilterCat(cat === filterCat ? 'all' : cat)}
                            style={{ padding: '0.35rem 0.875rem', borderRadius: '999px', border: `1px solid ${filterCat === cat ? `${catColor[cat]}66` : 'var(--border-color)'}`, background: filterCat === cat ? `${catColor[cat]}15` : 'transparent', color: filterCat === cat ? catColor[cat] : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            {cat} ({links.filter(l => l.category === cat).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {links.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>{links.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Resources</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{categories.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Categories</div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={56} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                        {links.length === 0 ? 'No resources yet' : 'No resources match your search'}
                    </p>
                    <p style={{ fontSize: '0.87rem', margin: 0 }}>
                        {links.length === 0 ? 'Your admin will share resources here for you to explore.' : 'Try a different search or category filter.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map(link => (
                        <div key={link.id} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px',
                            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                            position: 'relative', overflow: 'hidden'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-3px)'
                                e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.2)`
                                e.currentTarget.style.borderColor = `${catColor[link.category] || '#3b82f6'}55`
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.borderColor = 'var(--border-color)'
                            }}
                        >
                            {/* Color accent bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: catColor[link.category] || '#3b82f6', borderRadius: '16px 16px 0 0' }} />

                            {/* Category & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.71rem', fontWeight: 700, background: `${catColor[link.category] || '#3b82f6'}20`, color: catColor[link.category] || '#3b82f6', border: `1px solid ${catColor[link.category] || '#3b82f6'}40` }}>
                                    {link.category}
                                </span>
                                {link.assigned_at && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={11} /> {new Date(link.assigned_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>{link.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Globe size={11} />
                                    {new URL(link.url).hostname}
                                </p>
                            </div>

                            {link.description && (
                                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                                    {link.description}
                                </p>
                            )}

                            {/* View Button */}
                            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                padding: '0.6rem 1rem', marginTop: 'auto',
                                background: `linear-gradient(135deg, ${catColor[link.category] || '#3b82f6'}22, ${catColor[link.category] || '#3b82f6'}11)`,
                                border: `1px solid ${catColor[link.category] || '#3b82f6'}44`,
                                borderRadius: '10px', color: catColor[link.category] || '#3b82f6',
                                fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
                                transition: 'background 0.2s'
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = `${catColor[link.category] || '#3b82f6'}33`}
                                onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, ${catColor[link.category] || '#3b82f6'}22, ${catColor[link.category] || '#3b82f6'}11)`}
                            >
                                <ExternalLink size={15} /> Open Resource
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
