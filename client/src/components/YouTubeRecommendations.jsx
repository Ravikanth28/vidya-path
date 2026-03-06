import { useState, useRef } from 'react'
import { Youtube, Search, Loader, ExternalLink, Play, BookOpen, Clock, ThumbsUp, Sparkles, AlertCircle, RotateCcw, Download, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, BookMarked, Target, Brain } from 'lucide-react'
import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// ==================== PDF GENERATOR ====================
function generatePDF(data) {
    const { topic, summary, learningTip, topicNotes, videos } = data

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${topic} - Learning Notes &amp; YouTube Resources</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; line-height: 1.6; }
  h1 { font-size: 28px; color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; margin-bottom: 6px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 30px; }
  h2 { font-size: 20px; color: #1e40af; margin: 28px 0 12px; }
  h3 { font-size: 15px; color: #374151; margin: 14px 0 6px; }
  p { color: #374151; margin-bottom: 10px; font-size: 14px; }
  .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin-bottom: 16px; border-radius: 4px; }
  .tip-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 18px; margin-bottom: 16px; border-radius: 4px; }
  .warn-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 14px 18px; margin-bottom: 16px; border-radius: 4px; }
  .concept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
  .concept-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .concept-name { font-weight: 700; color: #3b82f6; font-size: 13px; margin-bottom: 4px; }
  .concept-desc { font-size: 13px; color: #64748b; }
  ul { padding-left: 18px; margin: 6px 0; }
  li { font-size: 13px; color: #374151; margin-bottom: 5px; }
  .video-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
  .video-rank { display: inline-block; background: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px; margin-right: 10px; }
  .video-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .video-channel { font-size: 13px; color: #dc2626; font-weight: 600; margin-bottom: 8px; }
  .video-desc { font-size: 13px; color: #64748b; margin-bottom: 8px; }
  .video-meta { display: flex; gap: 16px; font-size: 12px; color: #94a3b8; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 0 3px; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-yellow { background: #fef9c3; color: #ca8a04; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .youtube-link { color: #dc2626; font-size: 12px; text-decoration: none; font-weight: 600; }
  .tags { margin-top: 6px; }
  .tag { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>&#x1F4DA; ${topic}</h1>
<p class="subtitle">AI-curated Learning Notes &amp; YouTube Resources &mdash; Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

${topicNotes ? `
<h2>&#x1F4D6; About This Topic</h2>
<div class="section">
  ${topicNotes.whatIsIt ? `<div class="info-box"><strong>What is ${topic}?</strong><br>${topicNotes.whatIsIt}</div>` : ''}
  ${topicNotes.whyLearnIt ? `<div class="tip-box"><strong>Why Learn It?</strong><br>${topicNotes.whyLearnIt}</div>` : ''}
  ${topicNotes.prerequisites?.length > 0 ? `<h3>&#x1F517; Prerequisites</h3><ul>${topicNotes.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
</div>
${topicNotes.keyConcepts?.length > 0 ? `
<h2>&#x1F511; Key Concepts</h2>
<div class="concept-grid">
  ${topicNotes.keyConcepts.map(c => `<div class="concept-card"><div class="concept-name">${c.concept}</div><div class="concept-desc">${c.explanation}</div></div>`).join('')}
</div>` : ''}
${topicNotes.quickTips?.length > 0 || topicNotes.commonMistakes?.length > 0 ? `
<h2>&#x1F4A1; Tips &amp; Common Mistakes</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
  ${topicNotes.quickTips?.length > 0 ? `<div class="tip-box"><strong>&#x2705; Quick Tips</strong><ul style="margin-top:8px;">${topicNotes.quickTips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
  ${topicNotes.commonMistakes?.length > 0 ? `<div class="warn-box"><strong>&#x26A0; Common Mistakes</strong><ul style="margin-top:8px;">${topicNotes.commonMistakes.map(m => `<li>${m}</li>`).join('')}</ul></div>` : ''}
</div>` : ''}
` : ''}

<h2>&#x1F3AC; Top 5 YouTube Videos</h2>
${summary ? `<p style="color:#64748b;margin-bottom:16px;font-size:14px;">${summary}</p>` : ''}
${videos.map((video, idx) => {
    const levelBadge = video.level === 'beginner' ? 'badge-green' : video.level === 'intermediate' ? 'badge-yellow' : 'badge-red'
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title + ' ' + video.channel)}&sp=EgIQAQ%3D%3D`
    const isValidId = video.videoId && /^[a-zA-Z0-9_-]{11}$/.test(video.videoId)
    const watchUrl = isValidId ? `https://www.youtube.com/watch?v=${video.videoId}` : searchUrl
    const watchLabel = isValidId ? '&#x25B6; Watch Directly' : '&#x1F50D; Find on YouTube'
    return `<div class="video-card">
  <span class="video-rank">${idx + 1}</span>
  <div class="video-title">${video.title}</div>
  <div class="video-channel">&#x1F4FA; ${video.channel}</div>
  <div class="video-desc">${video.description}</div>
  ${video.why ? `<p style="font-size:12px;color:#3b82f6;margin-bottom:6px;"><em>Why this: ${video.why}</em></p>` : ''}
  <div class="video-meta">
    ${video.level ? `<span class="badge ${levelBadge}">${video.level}</span>` : ''}
    ${video.duration ? `<span>&#x23F1; ${video.duration}</span>` : ''}
    ${video.views ? `<span>&#x1F44D; ${video.views}</span>` : ''}
  </div>
  ${video.tags?.length > 0 ? `<div class="tags">${video.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>` : ''}
  <div style="margin-top:8px;"><a href="${watchUrl}" class="youtube-link">${watchLabel} &rarr;</a></div>
</div>`
}).join('')}

${learningTip ? `<div class="tip-box" style="margin-top:20px;"><strong>&#x1F4A1; Pro Learning Tip</strong><br>${learningTip}</div>` : ''}
<div class="footer">Generated by AI Mentor Hub &bull; YouTube Learning Resources &bull; ${new Date().getFullYear()}</div>
</body></html>`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
        printWindow.onload = () => {
            setTimeout(() => { printWindow.print(); URL.revokeObjectURL(url) }, 500)
        }
    }
}

// ==================== YOUTUBE RECOMMENDATIONS COMPONENT ====================
function YouTubeRecommendations({ user }) {
    const [topic, setTopic] = useState('')
    const [recommendations, setRecommendations] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [searchHistory, setSearchHistory] = useState([])
    const [notesExpanded, setNotesExpanded] = useState(true)
    const inputRef = useRef(null)

    const quickTopics = [
        'React hooks', 'Python data structures', 'SQL joins', 'Machine learning basics',
        'Dynamic programming', 'System design', 'Git & GitHub', 'REST APIs',
        'Docker & containers', 'JavaScript async/await'
    ]

    const handleSearch = async (searchTopic = topic) => {
        const query = searchTopic.trim()
        if (!query) return
        setLoading(true)
        setError(null)
        setTopic(query)
        setRecommendations(null)
        try {
            const res = await axios.post(`${API_BASE}/ai/youtube-recommendations`, { topic: query })
            if (res.data.success) {
                setRecommendations(res.data)
                setNotesExpanded(true)
                setSearchHistory(prev => [query, ...prev.filter(h => h !== query)].slice(0, 5))
            } else {
                setError('Could not fetch recommendations. Please try again.')
            }
        } catch (err) {
            setError(err.response?.data?.details || err.response?.data?.error || 'Failed to load recommendations. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getDifficultyColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' }
            case 'intermediate': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' }
            case 'advanced': return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' }
            default: return { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' }
        }
    }

    const card = { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1rem' }

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.05))', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '1.5rem', padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '1rem', flexShrink: 0, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
                    <Youtube size={32} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>YouTube Learning Resources</h1>
                    <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>Ask about any topic â€” get top 5 YouTube videos + simplified notes &amp; PDF download</p>
                </div>
            </div>

            {/* Search Box */}
            <div style={{ ...card }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input ref={inputRef} type="text" value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ask about any topic... e.g. 'binary search trees', 'neural networks'"
                            style={{ width: '100%', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.85rem 1rem 0.85rem 2.75rem', color: '#f8fafc', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(239,68,68,0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <button onClick={() => handleSearch()} disabled={loading || !topic.trim()}
                        style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: loading || !topic.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: loading || !topic.trim() ? '#64748b' : 'white', cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', boxShadow: loading || !topic.trim() ? 'none' : '0 4px 16px rgba(239,68,68,0.35)' }}>
                        {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                        {loading ? 'Finding...' : 'Find Videos'}
                    </button>
                </div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Popular Topics</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {quickTopics.map((t) => (
                        <button key={t} onClick={() => handleSearch(t)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.35rem 0.8rem', borderRadius: '2rem', fontSize: '0.78rem', cursor: 'pointer' }}>{t}</button>
                    ))}
                </div>
                {searchHistory.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Searches</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {searchHistory.map((h) => (
                                <button key={h} onClick={() => handleSearch(h)} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <RotateCcw size={10} /> {h}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', ...card }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
                        <Youtube size={28} color="#ef4444" />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 0.5rem' }}>AI is curating resources for <strong style={{ color: '#f8fafc' }}>"{topic}"</strong>...</p>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Generating video recommendations + topic notes</p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: '0.9rem', flex: 1 }}>{error}</span>
                    <button onClick={() => handleSearch()} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <RotateCcw size={13} /> Retry
                    </button>
                </div>
            )}

            {/* Results */}
            {recommendations && !loading && (
                <div>
                    {/* Results header + PDF */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                                Results for <span style={{ color: '#f87171' }}>"{recommendations.topic}"</span>
                            </h2>
                            {recommendations.summary && <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{recommendations.summary}</p>}
                        </div>
                        <button onClick={() => generatePDF(recommendations)}
                            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', color: 'white', padding: '0.65rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                            <Download size={15} /> Download Notes PDF
                        </button>
                    </div>

                    {/* TOPIC NOTES */}
                    {recommendations.topicNotes && (
                        <div style={{ ...card, border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1.5rem' }}>
                            <button onClick={() => setNotesExpanded(!notesExpanded)}
                                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BookMarked size={18} color="white" />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Simplified Topic Notes</h3>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Quick reference cheat-sheet for {recommendations.topic}</p>
                                    </div>
                                </div>
                                {notesExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                            </button>

                            {notesExpanded && (
                                <div style={{ marginTop: '1.25rem' }}>
                                    {/* What + Why */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        {recommendations.topicNotes.whatIsIt && (
                                            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <Brain size={14} color="#60a5fa" />
                                                    <span style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.78rem' }}>WHAT IS IT?</span>
                                                </div>
                                                <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>{recommendations.topicNotes.whatIsIt}</p>
                                            </div>
                                        )}
                                        {recommendations.topicNotes.whyLearnIt && (
                                            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <Target size={14} color="#34d399" />
                                                    <span style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.78rem' }}>WHY LEARN IT?</span>
                                                </div>
                                                <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>{recommendations.topicNotes.whyLearnIt}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Prerequisites */}
                                    {recommendations.topicNotes.prerequisites?.length > 0 && (
                                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <BookOpen size={14} color="#fbbf24" />
                                                <span style={{ fontWeight: 700, color: '#fcd34d', fontSize: '0.78rem' }}>PREREQUISITES</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {recommendations.topicNotes.prerequisites.map((p, i) => (
                                                    <span key={i} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.8rem' }}>{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Key Concepts Grid */}
                                    {recommendations.topicNotes.keyConcepts?.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h4 style={{ color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Sparkles size={13} color="#a5b4fc" /> Key Concepts
                                            </h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '0.6rem' }}>
                                                {recommendations.topicNotes.keyConcepts.map((c, i) => (
                                                    <div key={i} style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                                                        <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>{c.concept}</div>
                                                        <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.5' }}>{c.explanation}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tips + Mistakes */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {recommendations.topicNotes.quickTips?.length > 0 && (
                                            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                    <CheckCircle size={13} color="#34d399" />
                                                    <span style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.78rem' }}>QUICK TIPS</span>
                                                </div>
                                                {recommendations.topicNotes.quickTips.map((tip, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                        <span style={{ color: '#34d399', fontSize: '0.8rem', flexShrink: 0 }}>âœ“</span>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.5' }}>{tip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {recommendations.topicNotes.commonMistakes?.length > 0 && (
                                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                    <AlertTriangle size={13} color="#f87171" />
                                                    <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.78rem' }}>COMMON MISTAKES</span>
                                                </div>
                                                {recommendations.topicNotes.commonMistakes.map((m, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                        <span style={{ color: '#f87171', fontSize: '0.8rem', flexShrink: 0 }}>âœ&mdash;</span>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.5' }}>{m}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIDEO CARDS */}
                    <h3 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Youtube size={16} color="#ef4444" /> Top 5 YouTube Videos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {recommendations.videos?.map((video, idx) => {
                            const diffStyle = getDifficultyColor(video.level)
                            const searchQuery = encodeURIComponent(`${video.title} ${video.channel}`)
                            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}&sp=EgIQAQ%3D%3D`
                            const isValidVideoId = video.videoId && /^[a-zA-Z0-9_-]{11}$/.test(video.videoId)
                            const ytWatchUrl = isValidVideoId ? `https://www.youtube.com/watch?v=${video.videoId}` : youtubeSearchUrl
                            return (
                                <div key={idx}
                                    style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.25rem', overflow: 'hidden', transition: 'border-color 0.2s,transform 0.15s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
                                >
                                    <div style={{ display: 'flex' }}>
                                        <div style={{ width: '100px', minWidth: '100px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.25rem 0.5rem' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'white', background: idx === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : idx === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : idx === 2 ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(99,102,241,0.4)', boxShadow: idx === 0 ? '0 4px 12px rgba(251,191,36,0.4)' : 'none' }}>#{idx + 1}</div>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Play size={18} color="#ef4444" fill="#ef4444" />
                                            </div>
                                            {video.level && <span style={{ background: diffStyle.bg, border: `1px solid ${diffStyle.border}`, color: diffStyle.text, padding: '0.15rem 0.45rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize', textAlign: 'center' }}>{video.level}</span>}
                                        </div>
                                        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: '#f1f5f9', lineHeight: '1.4' }}>{video.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Youtube size={13} color="#ef4444" />
                                                <span style={{ color: '#fb923c', fontSize: '0.82rem', fontWeight: 600 }}>{video.channel}</span>
                                            </div>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', lineHeight: '1.6', flex: 1 }}>{video.description}</p>
                                            {video.tags?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                    {video.tags.slice(0, 4).map((tag, ti) => <span key={ti} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '0.1rem 0.45rem', borderRadius: '0.35rem', fontSize: '0.7rem' }}>#{tag}</span>)}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    {video.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.78rem' }}><Clock size={12} />{video.duration}</span>}
                                                    {video.views && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.78rem' }}><ThumbsUp size={12} />{video.views}</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '0.45rem 0.85rem', borderRadius: '0.6rem', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Search size={12} /> Search
                                                    </a>
                                                    <a href={ytWatchUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: 'white', padding: '0.45rem 1rem', borderRadius: '0.6rem', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
                                                        <ExternalLink size={12} /> {isValidVideoId ? 'Watch' : 'Find Video'}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Learning Tip */}
                    {recommendations.learningTip && (
                        <div style={{ marginTop: '1.25rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1rem', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <Lightbulb size={17} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <p style={{ margin: '0 0 0.25rem', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600 }}>ðŸ’¡ Pro Learning Tip</p>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', lineHeight: '1.6' }}>{recommendations.learningTip}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!recommendations && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(15,23,42,0.4)', borderRadius: '1.25rem', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Youtube size={36} color="#ef4444" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '1.2rem' }}>Discover Your Next Learning Resource</h3>
                    <p style={{ margin: '0 auto', color: '#64748b', maxWidth: '420px', lineHeight: '1.6', fontSize: '0.9rem' }}>
                        Type any topic above â€” programming, maths, system design â€” and get the top 5 YouTube videos + simplified notes with PDF download.
                    </p>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1;transform:scale(1); } 50% { opacity:0.7;transform:scale(0.95); } }
            `}</style>
        </div>
    )
}

export default YouTubeRecommendations
