import { useState, useEffect } from 'react'
import axios from 'axios'
import { Award, Download, CheckCircle, XCircle, Shield, Calendar, User, RefreshCw, ExternalLink, Search, Star, Share2 } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_BASE = BACKEND_URL + '/api'
const authHeader = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}
const withAuth = (config = {}) => ({
    ...config,
    headers: {
        ...authHeader(),
        ...(config.headers || {})
    }
})

// ─── Score → Medal ───────────────────────────────────────────────────────────
function getMedal(score, passingScore = 70) {
    if (score >= 90) return { label: 'Diamond',       emoji: '💎', color: '#a78bfa', bg: '#2e1065', border: '#7c3aed', glow: '#7c3aed44' }
    if (score >= 80) return { label: 'Gold',           emoji: '🥇', color: '#f59e0b', bg: '#451a03', border: '#d97706', glow: '#f59e0b44' }
    if (score >= 70) return { label: 'Silver',         emoji: '🥈', color: '#94a3b8', bg: '#0f1a2e', border: '#64748b', glow: '#94a3b844' }
    if (score >= 60) return { label: 'Elite',          emoji: '✦',  color: '#2dd4bf', bg: '#042f2e', border: '#0d9488', glow: '#0d948844' }
    if (score >= passingScore) return { label: 'Pass', emoji: '✔️', color: '#60a5fa', bg: '#0c1a3a', border: '#2563eb', glow: '#2563eb33' }
    return null
}

// ─────────────────────────────────────────────
// TYPE badge colours
// ─────────────────────────────────────────────
const TYPE_COLORS = {
    skill_test:    { bg: '#1e3a5f', text: '#60a5fa', label: 'Skill Assessment' },
    aptitude_test: { bg: '#1e3a2a', text: '#34d399', label: 'Aptitude Test' },
    global_test:   { bg: '#3b1f6b', text: '#a78bfa', label: 'Comprehensive Test' },
    skill_path:    { bg: '#7c2d12', text: '#fb923c', label: 'Skill Path' },
}

const QUALITY_MAP = {
    excellent:         { color: '#34d399', label: 'Excellent' },
    good:              { color: '#60a5fa', label: 'Good' },
    needs_improvement: { color: '#fbbf24', label: 'Needs Improvement' },
    poor:              { color: '#f87171', label: 'Poor' },
}

// ─────────────────────────────────────────────
// MAIN: CertificatePortal (Student view)
// ─────────────────────────────────────────────
export default function CertificatePortal({ user }) {
    const [certs, setCerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [verifyCode, setVerifyCode] = useState('')
    const [verifyResult, setVerifyResult] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const [activeTab, setActiveTab] = useState('my-certs') // 'my-certs' | 'verify'

    const studentId = user?.id || user?.userId

    useEffect(() => {
        if (studentId) fetchCerts()
    }, [studentId])

    async function fetchCerts() {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/certificates/student/${studentId}`)
            setCerts(res.data.certificates || [])
        } catch (e) {
            console.error('Failed to fetch certificates', e)
        } finally {
            setLoading(false)
        }
    }

    async function verifyCert() {
        if (!verifyCode.trim()) return
        setVerifying(true)
        setVerifyResult(null)
        try {
            const res = await axios.get(`${API_BASE}/certificates/verify/${verifyCode.trim().toUpperCase()}`)
            setVerifyResult(res.data)
        } catch (e) {
            setVerifyResult({ valid: false, error: 'Certificate not found' })
        } finally {
            setVerifying(false)
        }
    }

    const totalCerts = certs.length
    const avgScore = certs.length ? Math.round(certs.reduce((a, c) => a + parseFloat(c.score || 0), 0) / certs.length) : 0

    return (
        <div style={{ padding: '24px', color: 'var(--text-primary)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px' }}>
                    <Award size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>My Certificates</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Auto-generated when you pass assessments
                    </p>
                </div>
                <button onClick={fetchCerts} style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Certificates', value: totalCerts, icon: <Award size={20} color="#6366f1" /> },
                    { label: 'Average Score',      value: `${avgScore}%`, icon: <CheckCircle size={20} color="#34d399" /> },
                    { label: 'Verified & Valid',   value: certs.filter(c => c.is_valid).length, icon: <Shield size={20} color="#60a5fa" /> },
                ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {stat.icon}
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 700 }}>{stat.value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', width: 'fit-content', border: '1px solid var(--border)' }}>
                {[{ id: 'my-certs', label: 'My Certificates' }, { id: 'verify', label: 'Verify a Certificate' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px', background: activeTab === tab.id ? '#6366f1' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--text-secondary)', transition: 'all .2s' }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* My Certificates Tab */}
            {activeTab === 'my-certs' && (
                loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading certificates...
                    </div>
                ) : certs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                        <Award size={48} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No certificates yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Pass any Skill Test, Aptitude Test, or Global Test with ≥70% to earn your first certificate!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                        {certs.map(cert => <CertCard key={cert.id} cert={cert} />)}
                    </div>
                )
            )}

            {/* Verify Tab */}
            {activeTab === 'verify' && (
                <div style={{ maxWidth: '560px' }}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={18} color="#6366f1" /> Verify Certificate Authenticity
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                            Enter the verification code found on any MentorHub certificate to confirm it is genuine.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                value={verifyCode}
                                onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                                placeholder="e.g. A1B2C3D4E5F6G7H8..."
                                onKeyDown={e => e.key === 'Enter' && verifyCert()}
                                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
                            />
                            <button onClick={verifyCert} disabled={verifying || !verifyCode.trim()} style={{ padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Search size={14} /> {verifying ? 'Checking...' : 'Verify'}
                            </button>
                        </div>

                        {verifyResult && (
                            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', background: verifyResult.valid ? '#052e16' : '#450a0a', border: `1px solid ${verifyResult.valid ? '#16a34a' : '#dc2626'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    {verifyResult.valid ? <CheckCircle size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
                                    <span style={{ fontWeight: 700, color: verifyResult.valid ? '#34d399' : '#f87171' }}>
                                        {verifyResult.valid ? 'Valid Certificate' : 'Invalid Certificate'}
                                    </span>
                                </div>
                                {verifyResult.valid && verifyResult.certificate && (
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                        <div><strong style={{ color: '#e2e8f0' }}>{verifyResult.certificate.student_name}</strong> earned this certificate</div>
                                        <div>Course: <strong style={{ color: '#e2e8f0' }}>{verifyResult.certificate.source_title}</strong></div>
                                        <div>Score: <strong style={{ color: '#34d399' }}>{verifyResult.certificate.score}%</strong></div>
                                        <div>Issued: {new Date(verifyResult.certificate.issued_at).toLocaleDateString()}</div>
                                    </div>
                                )}
                                {!verifyResult.valid && (
                                    <p style={{ margin: 0, fontSize: '13px', color: '#f87171' }}>
                                        {verifyResult.error || 'This certificate code is not recognized in our system.'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Certificate Action Buttons (Download / Preview / Regenerate)
// ─────────────────────────────────────────────
function CertActions({ cert, pdfUrl, medal }) {
    const [sharing, setSharing] = useState(false)
    const [shared, setShared]   = useState(false)
    const [shareErr, setShareErr] = useState('')

    async function shareToAlumni() {
        setSharing(true)
        setShareErr('')
        try {
            const tier    = medal?.label || 'Certificate'
            const score   = parseFloat(cert.score).toFixed(0)
            const content =
                `🎓 Proud to share that I have earned a MentorHub Certificate!\n\n` +
                `📋 Assessment: "${cert.source_title}"\n` +
                `🏆 Achievement: ${tier} · ${score}% Score\n` +
                `✅ Verified · MentorHub Platform\n\n` +
                `#MentorHub #Certificate #Achievement #Learning`
            await axios.post(`${API_BASE}/alumni/posts`, {
                content,
                type: 'update',
                tags: ['certificate', 'achievement']
            })
            setShared(true)
            setTimeout(() => setShared(false), 4000)
        } catch (e) {
            setShareErr('Share failed — please try again')
            setTimeout(() => setShareErr(''), 3500)
        } finally {
            setSharing(false)
        }
    }

    return (
        <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {pdfUrl ? (
                    <a href={`${pdfUrl}?t=${cert.id}`} download target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', background: medal?.color || '#6366f1', color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                        <Download size={14} /> Download PDF
                    </a>
                ) : (
                    <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px', background: '#334155', color: '#64748b', borderRadius: '9px', fontSize: '13px' }}>
                        No PDF yet
                    </span>
                )}
                {pdfUrl && (
                    <a href={`${pdfUrl}?t=${cert.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '5px', background: '#1e293b', color: '#94a3b8', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', border: '1px solid #334155' }}>
                        <ExternalLink size={12} /> Preview
                    </a>
                )}
                <button
                    onClick={shareToAlumni}
                    disabled={sharing || shared}
                    style={{
                        padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '5px',
                        background: shared ? '#14532d' : '#0c2a4a',
                        color: shared ? '#4ade80' : '#7dd3fc',
                        borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                        border: `1px solid ${shared ? '#22c55e' : '#1d4ed8'}`,
                        cursor: sharing || shared ? 'not-allowed' : 'pointer',
                        opacity: sharing ? 0.7 : 1, transition: 'all .2s'
                    }}
                >
                    <Share2 size={12} />
                    {shared ? 'Shared! ✓' : sharing ? 'Sharing…' : 'Share to Alumni'}
                </button>
            </div>
            {shareErr && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f87171' }}>{shareErr}</p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Certificate Card
// ─────────────────────────────────────────────
function CertCard({ cert }) {
    const typeInfo = TYPE_COLORS[cert.certificate_type] || { bg: '#1e293b', text: '#94a3b8', label: cert.certificate_type }
    const medal = getMedal(parseFloat(cert.score), parseFloat(cert.passing_score) || 70)
    const isValid = cert.is_valid
    // Fix URL: pdf_path is a server-relative path, must point to backend (port 3000), not frontend (port 5173)
    const pdfUrl = cert.pdf_path ? `${BACKEND_URL}${cert.pdf_path}` : null

    return (
        <div style={{
            background: 'linear-gradient(145deg,#0f172a,#1e293b)', borderRadius: '18px',
            border: `1px solid ${medal ? medal.border : (isValid ? '#334155' : '#7f1d1d')}`,
            boxShadow: medal ? `0 0 18px ${medal.glow}` : 'none',
            overflow: 'hidden', position: 'relative'
        }}>
            {/* Top accent bar — gold/silver/bronze or default */}
            <div style={{ height: '5px', background: medal
                ? `linear-gradient(90deg,${medal.color},#fff8,${medal.color})`
                : 'linear-gradient(90deg,#6366f1,#818cf8,#a78bfa)' }} />

            <div style={{ padding: '20px' }}>
                {/* Row: type badge + verified */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ background: typeInfo.bg, color: typeInfo.text, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        {typeInfo.label}
                    </span>
                    {isValid
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '12px' }}><Shield size={12} /> Verified</span>
                        : <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '12px' }}><XCircle size={12} /> Revoked</span>}
                </div>

                {/* Medal badge */}
                {medal && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: medal.bg, border: `1px solid ${medal.border}`, borderRadius: '20px', padding: '4px 12px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '15px' }}>{medal.emoji}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: medal.color, letterSpacing: '0.5px' }}>{medal.label.toUpperCase()}</span>
                    </div>
                )}

                {/* Title */}
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.35 }}>
                    {cert.source_title}
                </h3>

                {/* Score bar */}
                <div style={{ margin: '10px 0 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: '#0f172a', borderRadius: '6px', height: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(cert.score, 100)}%`, height: '100%', borderRadius: '6px',
                            background: medal?.color
                                ? `linear-gradient(90deg,${medal.color}aa,${medal.color})`
                                : 'linear-gradient(90deg,#6366f1,#34d399)'
                        }} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: medal?.color || '#34d399', minWidth: '44px' }}>
                        {parseFloat(cert.score).toFixed(2)}%
                    </span>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} /> Authorized by {cert.mentor_name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} /> {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '10px', color: '#475569' }}>
                        <Shield size={10} /> {cert.verification_code}
                    </span>
                </div>

                {/* Actions */}
                <CertActions cert={cert} pdfUrl={pdfUrl} medal={medal} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Admin Certificate Manager
// ─────────────────────────────────────────────

// Map each cert type → the API endpoint that lists those tests
const TYPE_API = {
    skill_test:    '/skill-tests/all',
    aptitude_test: '/aptitude',
    global_test:   '/global-tests',
    skill_path:    null,           // no listing endpoint; uses manual entry
}

// Field names from each API response that hold id / title
const TYPE_FIELDS = {
    skill_test:    { id: 'id', title: 'title' },
    aptitude_test: { id: 'id', title: 'title' },
    global_test:   { id: 'id', title: 'title' },
}

export function AdminCertificateManager() {
    const [allStudents, setAllStudents] = useState([])   // full list
    const [batchFilter, setBatchFilter] = useState('')    // selected batch
    const [tests, setTests] = useState([])
    const [testsLoading, setTestsLoading] = useState(false)
    const [form, setForm] = useState({
        studentId: '', type: 'skill_test',
        sourceId: '', sourceTitle: '',
        score: '', passingScore: '70'
    })
    const [issuing, setIssuing] = useState(false)
    const [result, setResult] = useState(null)
    // Bulk issue state
    const [passedStudents, setPassedStudents] = useState([])
    const [passedLoading, setPassedLoading] = useState(false)
    const [bulkIssuing, setBulkIssuing] = useState(false)
    const [bulkResult, setBulkResult] = useState(null)
    const [mode, setMode] = useState('individual') // 'individual' | 'bulk'

    // Load all students once
    useEffect(() => {
        axios.get(`${API_BASE}/users`, withAuth()).then(r => {
            const all = (r.data.users || r.data || []).filter(u => u.role === 'student')
            setAllStudents(all)
        }).catch(() => {})
    }, [])

    // Derived: unique sorted batches
    const batches = [...new Set(allStudents.map(s => s.batch).filter(Boolean))].sort()

    // Derived: students visible in dropdown
    const students = batchFilter
        ? allStudents.filter(s => s.batch === batchFilter)
        : allStudents

    // Reload test list whenever type changes
    useEffect(() => {
        const endpoint = TYPE_API[form.type]
        if (!endpoint) {
            setTests([])
            return
        }
        setTestsLoading(true)
        setForm(p => ({ ...p, sourceId: '', sourceTitle: '' }))
        setPassedStudents([])
        setBulkResult(null)
        axios.get(`${API_BASE}${endpoint}`, withAuth())
            .then(r => {
                // Different endpoints wrap their data differently
                const raw = r.data.tests || r.data.skillTests || r.data || []
                const arr = Array.isArray(raw) ? raw : []
                setTests(arr)
            })
            .catch(() => setTests([]))
            .finally(() => setTestsLoading(false))
    }, [form.type])

    // When a test is picked, fill sourceId + sourceTitle and fetch passed students
    function handleTestSelect(e) {
        const testId = e.target.value
        setBulkResult(null)
        if (!testId) {
            setForm(p => ({ ...p, sourceId: '', sourceTitle: '' }))
            setPassedStudents([])
            return
        }
        const { id: idField, title: titleField } = TYPE_FIELDS[form.type] || { id: 'id', title: 'title' }
        const chosen = tests.find(t => String(t[idField]) === String(testId))
        setForm(p => ({
            ...p,
            sourceId: testId,
            sourceTitle: chosen ? chosen[titleField] : testId
        }))

        // Fetch passed students for this test
        if (form.type !== 'skill_path') {
            setPassedLoading(true)
            axios.get(`${API_BASE}/certificates/passed-students`, withAuth({
                params: { type: form.type, sourceId: testId }
            }))
                .then(r => setPassedStudents(r.data.students || []))
                .catch(() => setPassedStudents([]))
                .finally(() => setPassedLoading(false))
        }
    }

    async function handleIssue(e) {
        e.preventDefault()
        setIssuing(true)
        setResult(null)
        try {
            const res = await axios.post(`${API_BASE}/certificates/issue`, {
                ...form,
                score: parseFloat(form.score),
                passingScore: parseFloat(form.passingScore)
            }, withAuth())
            setResult({ success: true, data: res.data })
            // Refresh passed students list
            if (form.sourceId && form.type !== 'skill_path') {
                axios.get(`${API_BASE}/certificates/passed-students`, withAuth({
                    params: { type: form.type, sourceId: form.sourceId }
                })).then(r => setPassedStudents(r.data.students || [])).catch(() => {})
            }
        } catch (err) {
            setResult({ success: false, error: err.response?.data?.error || err.message })
        } finally {
            setIssuing(false)
        }
    }

    async function handleBulkIssue(studentIds) {
        setBulkIssuing(true)
        setBulkResult(null)
        try {
            const res = await axios.post(`${API_BASE}/certificates/bulk-issue`, {
                studentIds,
                type: form.type,
                sourceId: form.sourceId,
                sourceTitle: form.sourceTitle,
                passingScore: parseFloat(form.passingScore || 70)
            }, withAuth())
            setBulkResult(res.data)
            // Refresh passed students list
            axios.get(`${API_BASE}/certificates/passed-students`, withAuth({
                params: { type: form.type, sourceId: form.sourceId }
            })).then(r => setPassedStudents(r.data.students || [])).catch(() => {})
        } catch (err) {
            setBulkResult({ success: false, error: err.response?.data?.error || err.message })
        } finally {
            setBulkIssuing(false)
        }
    }

    function handleIssueAll() {
        const eligible = passedStudents.filter(s => !s.alreadyCertified)
        if (eligible.length === 0) return
        handleBulkIssue(eligible.map(s => s.student_id))
    }

    function handleIssueSingle(studentId) {
        handleBulkIssue([studentId])
    }

    const isSkillPath = form.type === 'skill_path'
    const sel = { width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }
    const inp = { ...sel }
    const lbl = { fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }
    const eligibleCount = passedStudents.filter(s => !s.alreadyCertified).length

    return (
        <div style={{ padding: '24px', color: 'var(--text-primary)' }}>
            <h2 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={20} color="#6366f1" /> Issue Certificates
            </h2>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Issue certificates individually or in bulk to all passed students.
            </p>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button onClick={() => setMode('individual')} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: mode === 'individual' ? '#6366f1' : 'var(--bg-secondary)', color: mode === 'individual' ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    Individual Issue
                </button>
                <button onClick={() => setMode('bulk')} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: mode === 'bulk' ? '#6366f1' : 'var(--bg-secondary)', color: mode === 'bulk' ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    Bulk Issue (Send All)
                </button>
            </div>

            {mode === 'individual' ? (
                /* ── Individual Issue Form ─── */
                <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    {/* Batch filter */}
                    <div>
                        <label style={lbl}>
                            Filter by Batch &nbsp;
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                                ({students.length} student{students.length !== 1 ? 's' : ''}{batchFilter ? ` in ${batchFilter}` : ' total'})
                            </span>
                        </label>
                        <select value={batchFilter}
                            onChange={e => { setBatchFilter(e.target.value); setForm(p => ({ ...p, studentId: '' })) }}
                            style={sel}>
                            <option value="">-- All Batches --</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Student */}
                    <div>
                        <label style={lbl}>Student</label>
                        <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} required style={sel}>
                            <option value="">Select student...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                        </select>
                    </div>

                    {/* Certificate Type */}
                    <div>
                        <label style={lbl}>Certificate Type</label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={sel}>
                            <option value="skill_test">Skill Assessment</option>
                            <option value="aptitude_test">Aptitude Test</option>
                            <option value="global_test">Global Comprehensive Test</option>
                            <option value="skill_path">Skill Path (manual)</option>
                        </select>
                    </div>

                    {/* Test picker */}
                    {!isSkillPath && (
                        <div>
                            <label style={lbl}>
                                Select Test &nbsp;
                                {testsLoading && <span style={{ color: '#6366f1', fontSize: '12px' }}>Loading…</span>}
                                {!testsLoading && <span style={{ color: '#64748b', fontSize: '12px' }}>({tests.length} found)</span>}
                            </label>
                            <select value={form.sourceId} onChange={handleTestSelect} required={!isSkillPath} style={sel}>
                                <option value="">-- pick a test --</option>
                                {tests.map(t => {
                                    const { id: idF, title: titleF } = TYPE_FIELDS[form.type] || { id: 'id', title: 'title' }
                                    return <option key={t[idF]} value={t[idF]}>{t[titleF]}</option>
                                })}
                            </select>
                        </div>
                    )}

                    {/* Read-only source display */}
                    {form.sourceId && !isSkillPath && (
                        <div style={{ padding: '10px 14px', border: '1px solid #334155', borderRadius: '8px', background: '#0f172a', fontSize: '13px', display: 'flex', gap: '16px' }}>
                            <span style={{ color: '#64748b' }}>ID:</span>
                            <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{form.sourceId}</span>
                            <span style={{ color: '#64748b', marginLeft: '8px' }}>Title:</span>
                            <span style={{ color: '#e2e8f0' }}>{form.sourceTitle}</span>
                        </div>
                    )}

                    {/* Manual fields for skill_path */}
                    {isSkillPath && (
                        <>
                            <div>
                                <label style={lbl}>Source ID (Skill Path ID)</label>
                                <input value={form.sourceId} onChange={e => setForm(p => ({ ...p, sourceId: e.target.value }))} required style={inp} placeholder="e.g. path-001" />
                            </div>
                            <div>
                                <label style={lbl}>Source Title</label>
                                <input value={form.sourceTitle} onChange={e => setForm(p => ({ ...p, sourceTitle: e.target.value }))} required style={inp} placeholder="e.g. Full-Stack Developer Path" />
                            </div>
                        </>
                    )}

                    {/* Score fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={lbl}>Score (%)</label>
                            <input value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} type="number" min="0" max="100" required style={inp} placeholder="e.g. 85" />
                        </div>
                        <div>
                            <label style={lbl}>Passing Score (%)</label>
                            <input value={form.passingScore} onChange={e => setForm(p => ({ ...p, passingScore: e.target.value }))} type="number" min="0" max="100" required style={inp} />
                        </div>
                    </div>

                    <button type="submit" disabled={issuing}
                        style={{ padding: '11px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: issuing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '15px', opacity: issuing ? 0.7 : 1 }}>
                        {issuing ? 'Issuing…' : 'Issue Certificate'}
                    </button>

                    {result && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: result.success ? '#052e16' : '#450a0a', border: `1px solid ${result.success ? '#16a34a' : '#dc2626'}`, fontSize: '13px', color: result.success ? '#34d399' : '#f87171' }}>
                            {result.success
                                ? `Certificate issued! Verification code: ${result.data?.verificationCode}`
                                : `${result.error}`}
                        </div>
                    )}
                </form>
            ) : (
                /* ── Bulk Issue Panel ─── */
                <div style={{ maxWidth: '700px', background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    {/* Certificate Type */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={lbl}>Certificate Type</label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={sel}>
                            <option value="skill_test">Skill Assessment</option>
                            <option value="aptitude_test">Aptitude Test</option>
                            <option value="global_test">Global Comprehensive Test</option>
                        </select>
                    </div>

                    {/* Test picker */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={lbl}>
                            Select Test &nbsp;
                            {testsLoading && <span style={{ color: '#6366f1', fontSize: '12px' }}>Loading…</span>}
                            {!testsLoading && <span style={{ color: '#64748b', fontSize: '12px' }}>({tests.length} found)</span>}
                        </label>
                        <select value={form.sourceId} onChange={handleTestSelect} required style={sel}>
                            <option value="">-- pick a test --</option>
                            {tests.map(t => {
                                const { id: idF, title: titleF } = TYPE_FIELDS[form.type] || { id: 'id', title: 'title' }
                                return <option key={t[idF]} value={t[idF]}>{t[titleF]}</option>
                            })}
                        </select>
                    </div>

                    {/* Passing Score */}
                    <div style={{ marginBottom: '16px', maxWidth: '200px' }}>
                        <label style={lbl}>Passing Score (%)</label>
                        <input value={form.passingScore} onChange={e => setForm(p => ({ ...p, passingScore: e.target.value }))} type="number" min="0" max="100" style={inp} />
                    </div>

                    {/* Passed students list */}
                    {form.sourceId && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                    Passed Students
                                    {!passedLoading && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '8px' }}>({passedStudents.length} passed, {eligibleCount} uncertified)</span>}
                                </div>
                                {eligibleCount > 0 && (
                                    <button onClick={handleIssueAll} disabled={bulkIssuing}
                                        style={{ padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: bulkIssuing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', opacity: bulkIssuing ? 0.6 : 1 }}>
                                        <Award size={14} /> {bulkIssuing ? 'Issuing...' : `Issue All (${eligibleCount})`}
                                    </button>
                                )}
                            </div>

                            {passedLoading ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                    <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
                                    <div style={{ marginTop: '8px', fontSize: '13px' }}>Loading passed students…</div>
                                </div>
                            ) : passedStudents.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                                    No students have passed this test yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {passedStudents.map(s => (
                                        <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border)', opacity: s.alreadyCertified ? 0.5 : 1 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: s.alreadyCertified ? '#052e16' : '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: s.alreadyCertified ? '#34d399' : '#60a5fa', flexShrink: 0 }}>
                                                {s.alreadyCertified ? <CheckCircle size={14} /> : (s.student_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student_name}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{s.email}{s.batch ? ` · Batch ${s.batch}` : ''}</div>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: parseFloat(s.score) >= 90 ? '#f59e0b' : '#60a5fa' }}>
                                                {parseFloat(s.score).toFixed(0)}%
                                            </span>
                                            {s.alreadyCertified ? (
                                                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, padding: '4px 10px', background: '#052e16', borderRadius: '6px' }}>Certified</span>
                                            ) : (
                                                <button onClick={() => handleIssueSingle(s.student_id)} disabled={bulkIssuing}
                                                    style={{ padding: '5px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                                                    Issue
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bulkResult && (
                                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '8px', background: bulkResult.issued > 0 ? '#052e16' : '#451a03', border: `1px solid ${bulkResult.issued > 0 ? '#16a34a' : '#d97706'}`, fontSize: '13px', color: bulkResult.issued > 0 ? '#34d399' : '#fbbf24' }}>
                                    {bulkResult.issued > 0 && <span>{bulkResult.issued} certificate(s) issued. </span>}
                                    {bulkResult.skipped > 0 && <span>{bulkResult.skipped} skipped (already certified). </span>}
                                    {bulkResult.failed > 0 && <span>{bulkResult.failed} failed. </span>}
                                    {bulkResult.error && <span>{bulkResult.error}</span>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Manage / Delete Issued Certificates ─────────────────── */}
            <AllCertsManager />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────
// All Certificates Manager (admin list + delete)
// ─────────────────────────────────────────────────────────────────────
function AllCertsManager() {
    const [certs, setCerts] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [page, setPage] = useState(1)
    const [deleting, setDeleting] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)  // cert object pending confirm
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
    const [deletingAll, setDeletingAll] = useState(false)
    const LIMIT = 15

    useEffect(() => { fetchAll() }, [search, typeFilter, page])

    async function fetchAll() {
        setLoading(true)
        setErrorMsg(null)
        try {
            const res = await axios.get(`${API_BASE}/certificates/all`, withAuth({
                params: { search, type: typeFilter, page, limit: LIMIT }
            }))
            setCerts(res.data.certificates || [])
            setTotal(res.data.total || 0)
        } catch (e) {
            const msg = e.response?.data?.error || e.message || 'Network error'
            setErrorMsg(`Failed to load certificates: ${msg}`)
            console.error('AllCertsManager fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteAll() {
        setConfirmDeleteAll(false)
        setDeletingAll(true)
        try {
            const certIds = certs.map(c => c.id)
            if (certIds.length === 0) return
            await axios.delete(`${API_BASE}/certificates/bulk-delete`, withAuth({ data: { certIds } }))
            fetchAll()
        } catch (e) {
            setErrorMsg('Bulk delete failed: ' + (e.response?.data?.error || e.message))
        } finally {
            setDeletingAll(false)
        }
    }

    async function confirmAndDelete() {
        if (!confirmDelete) return
        const cert = confirmDelete
        setConfirmDelete(null)
        setDeleting(cert.id)
        try {
            await axios.delete(`${API_BASE}/certificates/${cert.id}`, withAuth())
            setCerts(prev => prev.filter(c => c.id !== cert.id))
            setTotal(prev => Math.max(0, prev - 1))
        } catch (e) {
            setErrorMsg('Delete failed: ' + (e.response?.data?.error || e.message))
        } finally {
            setDeleting(null)
        }
    }

    const totalPages = Math.ceil(total / LIMIT)

    const TYPE_META = {
        skill_test:    { label: 'Skill',     color: '#60a5fa', bg: '#1e3a5f' },
        aptitude_test: { label: 'Aptitude',  color: '#34d399', bg: '#0d2a1e' },
        global_test:   { label: 'Global',    color: '#a78bfa', bg: '#2a1f4a' },
        skill_path:    { label: 'Path',      color: '#fb923c', bg: '#431407' },
    }

    function getInitials(name) {
        return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    }

    function scoreColor(s) {
        const n = parseFloat(s)
        if (n >= 90) return { text: '#f59e0b', bg: '#451a03' }
        if (n >= 75) return { text: '#94a3b8', bg: '#0f172a' }
        if (n >= 60) return { text: '#34d399', bg: '#052e16' }
        return { text: '#f87171', bg: '#450a0a' }
    }

    // Type breakdown stats for header bar
    const typeCounts = certs.reduce((acc, c) => {
        acc[c.certificate_type] = (acc[c.certificate_type] || 0) + 1
        return acc
    }, {})

    return (
        <div style={{ marginTop: '40px' }}>
            {/* ── Section header ─────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '7px', background: '#1e293b', borderRadius: '10px', display: 'flex' }}>
                        <Shield size={18} color="#f87171" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Manage Issued Certificates
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            Admin view — search, filter &amp; delete any certificate
                        </p>
                    </div>
                    <span style={{ background: '#1e293b', color: '#94a3b8', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                        {total} total
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {certs.length > 0 && (
                        <button onClick={() => setConfirmDeleteAll(true)} disabled={deletingAll}
                            style={{ background: '#7f1d1d', border: '1px solid #dc2626', borderRadius: '9px', padding: '7px 14px', color: '#f87171', cursor: deletingAll ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, opacity: deletingAll ? 0.6 : 1 }}>
                            <XCircle size={13} /> {deletingAll ? 'Deleting…' : 'Delete All'}
                        </button>
                    )}
                    <button onClick={fetchAll} disabled={loading} style={{ background: '#1e293b', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 14px', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: loading ? 0.6 : 1 }}>
                        <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Error banner ─────────────────────────────────── */}
            {errorMsg && (
                <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <XCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>Error loading certificates</div>
                        <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '2px' }}>{errorMsg}</div>
                    </div>
                    <button onClick={() => setErrorMsg(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
            )}

            {/* ── Type breakdown pills ─────────────────────────── */}
            {certs.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {Object.entries(typeCounts).map(([type, count]) => {
                        const m = TYPE_META[type] || { label: type, color: '#94a3b8', bg: '#1e293b' }
                        return (
                            <span key={type} style={{ background: m.bg, border: `1px solid ${m.color}40`, borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 600, color: m.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                                {m.label}: {count}
                            </span>
                        )
                    })}
                </div>
            )}

            {/* ── Search + Filter row ───────────────────────────── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search by student, test title, or verification code…"
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                    />
                </div>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', minWidth: '160px', cursor: 'pointer' }}>
                    <option value="">All Types</option>
                    <option value="skill_test">Skill Assessment</option>
                    <option value="aptitude_test">Aptitude Test</option>
                    <option value="global_test">Global Test</option>
                    <option value="skill_path">Skill Path</option>
                </select>
            </div>

            {/* ── Certificate list ─────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loading ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <RefreshCw size={22} style={{ animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
                        <div style={{ fontSize: '13px' }}>Loading certificates…</div>
                    </div>
                ) : certs.length === 0 ? (
                    <div style={{ padding: '50px 24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <Award size={32} color="#334155" style={{ marginBottom: '12px' }} />
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No certificates found</div>
                        <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                            {search || typeFilter ? 'Try a different search or filter' : 'No certificates have been issued yet'}
                        </div>
                    </div>
                ) : certs.map(cert => {
                    const m    = TYPE_META[cert.certificate_type] || { label: cert.certificate_type, color: '#94a3b8', bg: '#1e293b' }
                    const sc   = scoreColor(cert.score)
                    const medal = parseFloat(cert.score) >= 90 ? '🥇' : parseFloat(cert.score) >= 75 ? '🥈' : '🥉'
                    return (
                        <div key={cert.id} style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            background: 'var(--bg-secondary)', borderRadius: '12px',
                            border: '1px solid var(--border)', padding: '14px 16px',
                            transition: 'border-color 0.15s',
                            opacity: deleting === cert.id ? 0.5 : 1
                        }}>
                            {/* Initials avatar */}
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: m.bg, border: `2px solid ${m.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: m.color, flexShrink: 0 }}>
                                {getInitials(cert.student_name)}
                            </div>

                            {/* Student info */}
                            <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cert.student_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {cert.student_email && <span>{cert.student_email}</span>}
                                    {cert.student_batch && <span style={{ color: '#475569' }}>· Batch {cert.student_batch}</span>}
                                </div>
                            </div>

                            {/* Test title */}
                            <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cert.source_title}>
                                    {cert.source_title}
                                </div>
                                <span style={{ display: 'inline-block', marginTop: '4px', background: m.bg, border: `1px solid ${m.color}50`, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: m.color, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                    {m.label}
                                </span>
                            </div>

                            {/* Score */}
                            <div style={{ flexShrink: 0, background: sc.bg, border: `1px solid ${sc.text}40`, borderRadius: '10px', padding: '6px 12px', textAlign: 'center', minWidth: '64px' }}>
                                <div style={{ fontSize: '11px', marginBottom: '1px' }}>{medal}</div>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: sc.text, lineHeight: 1 }}>
                                    {parseFloat(cert.score).toFixed(0)}%
                                </div>
                            </div>

                            {/* Date */}
                            <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '80px' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                    {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </div>
                                <div style={{ fontSize: '11px', color: '#475569' }}>
                                    {new Date(cert.issued_at).getFullYear()}
                                </div>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => setConfirmDelete(cert)}
                                disabled={deleting === cert.id}
                                title="Delete certificate permanently"
                                style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: '1px solid #7f1d1d', borderRadius: '9px', color: '#ef4444', cursor: deleting === cert.id ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                <XCircle size={13} />{deleting === cert.id ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* ── Pagination ───────────────────────────────────── */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '7px 18px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, opacity: page === 1 ? 0.35 : 1 }}>
                        ← Prev
                    </button>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2
                            if (p < 1 || p > totalPages) return null
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    style={{ width: '34px', height: '34px', borderRadius: '8px', border: `1px solid ${p === page ? '#6366f1' : 'var(--border)'}`, background: p === page ? '#4f46e5' : 'var(--bg-secondary)', color: p === page ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: p === page ? 700 : 400 }}>
                                    {p}
                                </button>
                            )
                        })}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        style={{ padding: '7px 18px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, opacity: page === totalPages ? 0.35 : 1 }}>
                        Next →
                    </button>
                </div>
            )}

            {/* ── Delete confirm modal ─────────────────────────── */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, background: '#00000090', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setConfirmDelete(null)}>
                    <div style={{ background: '#0f172a', border: '1px solid #dc2626', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px #00000080' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ padding: '10px', background: '#450a0a', borderRadius: '10px' }}>
                                <XCircle size={22} color="#f87171" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Delete Certificate?</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>This action is permanent and cannot be undone.</div>
                            </div>
                        </div>
                        <div style={{ background: '#1e293b', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>{confirmDelete.student_name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{confirmDelete.source_title}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '9px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button onClick={confirmAndDelete} style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: '9px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete ALL confirm modal ─────────────────────── */}
            {confirmDeleteAll && (
                <div style={{ position: 'fixed', inset: 0, background: '#00000090', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setConfirmDeleteAll(false)}>
                    <div style={{ background: '#0f172a', border: '1px solid #dc2626', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px #00000080' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ padding: '10px', background: '#450a0a', borderRadius: '10px' }}>
                                <XCircle size={22} color="#f87171" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>Delete All Certificates on This Page?</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>This will permanently delete {certs.length} certificate(s) shown on this page.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setConfirmDeleteAll(false)} style={{ flex: 1, padding: '10px', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '9px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteAll} style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: '9px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                                Delete All ({certs.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
