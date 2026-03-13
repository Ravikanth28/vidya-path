import React, { useEffect, useState } from 'react'
import { AlertCircle, Eye, FileArchive, FolderOpen, Send, Upload, X } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

function ReportModal({ submission, onClose }) {
    if (!submission) return null
    const report = submission.report_json || submission.report || {}
    const breakdown = report.breakdown || submission.breakdown_json || {}
    const renderTree = (nodes = [], depth = 0) => nodes.map(node => (
        <div key={node.path} style={{ paddingLeft: depth * 14, color: node.type === 'dir' ? '#cbd5e1' : '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            {node.type === 'dir' ? '📁' : '📄'} {node.name}
            {node.children ? renderTree(node.children, depth + 1) : null}
        </div>
    ))

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 'min(980px, 92vw)', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', borderRadius: 22, border: '1px solid #1e293b' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>{submission.test_title}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(submission.submitted_at).toLocaleString()}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24, display: 'grid', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
                        <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1e293b', padding: 18, textAlign: 'center' }}>
                            <div style={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Overall Score</div>
                            <div style={{ color: '#f8fafc', fontSize: 56, fontWeight: 900, lineHeight: 1.1, marginTop: 8 }}>{Math.round(submission.score || report.overallScore || 0)}</div>
                            <div style={{ color: '#64748b', marginTop: 8, fontSize: 12 }}>{submission.runtime_status || 'skipped'} runtime check</div>
                        </div>
                        <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1e293b', padding: 18 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Summary</div>
                            <div style={{ color: '#94a3b8', lineHeight: 1.7 }}>{report.summary || 'No summary available.'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                        {[
                            ['Structure', breakdown.structure, '#60a5fa'],
                            ['Functionality', breakdown.functionality, '#34d399'],
                            ['UI/UX', breakdown.uiUx, '#f59e0b'],
                            ['Responsive', breakdown.responsiveness, '#a78bfa'],
                            ['Code Quality', breakdown.codeQuality, '#f87171'],
                        ].map(([label, value, color]) => (
                            <div key={label} style={{ background: '#020617', borderRadius: 14, border: '1px solid #1e293b', padding: 14 }}>
                                <div style={{ color: '#64748b', fontSize: 12 }}>{label}</div>
                                <div style={{ color, fontSize: 26, fontWeight: 800, marginTop: 6 }}>{Math.round(value || 0)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1e293b', padding: 18 }}>
                            <div style={{ color: '#86efac', fontWeight: 700, marginBottom: 8 }}>Strengths</div>
                            {(report.strengths || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', marginBottom: 6 }}>• {item}</div>)}
                            <div style={{ color: '#fca5a5', fontWeight: 700, margin: '14px 0 8px' }}>Issues</div>
                            {(report.issues || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', marginBottom: 6 }}>• {item}</div>)}
                            <div style={{ color: '#93c5fd', fontWeight: 700, margin: '14px 0 8px' }}>Recommendations</div>
                            {(report.recommendations || []).map((item, idx) => <div key={idx} style={{ color: '#94a3b8', marginBottom: 6 }}>• {item}</div>)}
                        </div>
                        <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1e293b', padding: 18 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Runtime & Files</div>
                            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{submission.runtime_summary || report.runtime?.summary || 'Runtime analysis not available.'}</div>
                            {submission.runtime_output || report.runtime?.output ? <pre style={{ background: '#000814', color: '#94a3b8', padding: 12, borderRadius: 12, fontSize: 11, maxHeight: 180, overflow: 'auto' }}>{submission.runtime_output || report.runtime?.output}</pre> : null}
                            <div style={{ marginTop: 12, background: '#000814', borderRadius: 12, padding: 12, maxHeight: 220, overflow: 'auto' }}>
                                {renderTree(submission.file_tree_json || report.fileTree || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SubmitModal({ test, onClose, onSubmitted }) {
    const [mode, setMode] = useState('files')
    const [folderFiles, setFolderFiles] = useState([])
    const [zipFile, setZipFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function submit() {
        setError('')
        if (mode === 'zip' && !zipFile) {
            setError('Please choose a zip file.')
            return
        }
        if (mode === 'files' && folderFiles.length === 0) {
            setError('Please choose project files or a folder.')
            return
        }

        const formData = new FormData()
        formData.append('submissionType', mode)
        if (mode === 'zip') {
            formData.append('files', zipFile)
        } else {
            folderFiles.forEach(file => {
                formData.append('files', file)
                formData.append('relativePaths', file.webkitRelativePath || file.name)
            })
        }

        setSubmitting(true)
        try {
            const res = await fetch(`${API}/frontend-evals/tests/${test.id}/submit`, {
                method: 'POST',
                headers: authHeaders(),
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed')
            onSubmitted(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 'min(760px, 92vw)', background: '#0f172a', borderRadius: 22, border: '1px solid #1e293b' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 800 }}>Submit Frontend Project</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{test.title}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 24, display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setMode('files')} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1px solid ${mode === 'files' ? '#2563eb' : '#334155'}`, background: mode === 'files' ? 'rgba(37,99,235,0.12)' : '#020617', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FolderOpen size={16} />Multi-file / Folder</button>
                        <button onClick={() => setMode('zip')} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1px solid ${mode === 'zip' ? '#2563eb' : '#334155'}`, background: mode === 'zip' ? 'rgba(37,99,235,0.12)' : '#020617', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><FileArchive size={16} />ZIP Upload</button>
                    </div>

                    <div style={{ background: '#020617', border: '1px dashed #334155', borderRadius: 16, padding: 18 }}>
                        {mode === 'files' ? (
                            <>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Choose your project folder or multiple files</div>
                                <input type="file" multiple onChange={e => setFolderFiles(Array.from(e.target.files || []))} style={{ width: '100%', color: '#94a3b8' }} />
                                <input type="file" multiple webkitdirectory="" directory="" onChange={e => setFolderFiles(Array.from(e.target.files || []))} style={{ width: '100%', color: '#94a3b8', marginTop: 12 }} />
                                <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>{folderFiles.length ? `${folderFiles.length} file(s) selected` : 'No files selected yet.'}</div>
                            </>
                        ) : (
                            <>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Upload a zip file of your frontend project</div>
                                <input type="file" accept=".zip" onChange={e => setZipFile(e.target.files?.[0] || null)} style={{ width: '100%', color: '#94a3b8' }} />
                                <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>{zipFile ? zipFile.name : 'No zip selected yet.'}</div>
                            </>
                        )}
                    </div>

                    <div style={{ background: '#020617', borderRadius: 16, border: '1px solid #1e293b', padding: 16 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Use Case Requirements</div>
                        <div style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{test.requirements || 'No explicit requirements provided.'}</div>
                    </div>

                    {error ? <div style={{ color: '#fca5a5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{error}</div> : null}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={submit} disabled={submitting} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Send size={14} /> {submitting ? 'Evaluating...' : 'Submit Project'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function FrontendEvaluationPortal({ initialTab = 'tests' }) {
    const [tab, setTab] = useState(initialTab)
    const [tests, setTests] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [selectedTest, setSelectedTest] = useState(null)
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    async function loadData() {
        setLoading(true)
        try {
            const [testsRes, subsRes] = await Promise.all([
                fetch(`${API}/frontend-evals/my-tests`, { headers: authHeaders() }).then(r => r.json()),
                fetch(`${API}/frontend-evals/my-submissions`, { headers: authHeaders() }).then(r => r.json()),
            ])
            setTests(testsRes.tests || [])
            setSubmissions(subsRes.submissions || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])
    useEffect(() => { setTab(initialTab) }, [initialTab])

    async function openSubmission(id) {
        const res = await fetch(`${API}/frontend-evals/submissions/${id}`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success) setReport(data.submission)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {selectedTest ? <SubmitModal test={selectedTest} onClose={() => setSelectedTest(null)} onSubmitted={async data => {
                setSelectedTest(null)
                await loadData()
                setReport({
                    id: data.submissionId,
                    test_title: selectedTest.title,
                    submitted_at: new Date().toISOString(),
                    score: data.score,
                    report_json: data.report,
                    runtime_status: data.report?.runtime?.success ? 'passed' : data.report?.runtime?.attempted ? 'failed' : 'skipped',
                    runtime_summary: data.report?.runtime?.summary,
                    runtime_output: data.report?.runtime?.output,
                    file_tree_json: data.report?.fileTree || [],
                })
            }} /> : null}
            {report ? <ReportModal submission={report} onClose={() => setReport(null)} /> : null}

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius: 22, border: '1px solid #312e81', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>Frontend Evaluation</div>
                    <div style={{ color: '#cbd5e1', marginTop: 4 }}>Upload HTML, CSS, JS projects as multiple files or zip and get a structured frontend report.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setTab('tests')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #4338ca', background: tab === 'tests' ? '#4f46e5' : '#111827', color: '#fff', cursor: 'pointer' }}>Available Tests</button>
                    <button onClick={() => setTab('submissions')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #4338ca', background: tab === 'submissions' ? '#4f46e5' : '#111827', color: '#fff', cursor: 'pointer' }}>My Submissions</button>
                </div>
            </div>

            {loading ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading frontend evaluations...</div> : tab === 'tests' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {tests.map(test => {
                        const attemptsReached = test.attempt_limit != null && Number(test.attempts_used || 0) >= Number(test.attempt_limit)
                        return (
                            <div key={test.id} style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: 18 }}>{test.title}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{test.description || 'No description provided.'}</div>
                                </div>
                                <div style={{ background: '#020617', borderRadius: 14, border: '1px solid #1e293b', padding: 14 }}>
                                    <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Requirements</div>
                                    <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{test.requirements || 'No explicit requirements provided.'}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12 }}>
                                    <span>Attempts used: {test.attempts_used || 0}</span>
                                    <span>Limit: {test.attempt_limit ?? 'Unlimited'}</span>
                                </div>
                                <button onClick={() => setSelectedTest(test)} disabled={attemptsReached} style={{ padding: '11px 14px', borderRadius: 12, border: 'none', background: attemptsReached ? '#334155' : 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 800, cursor: attemptsReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Upload size={15} /> {attemptsReached ? 'Attempt Limit Reached' : 'Submit Project'}
                                </button>
                            </div>
                        )
                    })}
                    {!tests.length ? <div style={{ color: '#94a3b8' }}>No live frontend evaluations are assigned to you right now.</div> : null}
                </div>
            ) : (
                <div style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 180px 80px', padding: '14px 18px', color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #1e293b' }}>
                        <div>Test</div>
                        <div>Submission</div>
                        <div>Score</div>
                        <div>Runtime</div>
                        <div>Submitted At</div>
                        <div></div>
                    </div>
                    {submissions.map(sub => (
                        <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 180px 80px', padding: '14px 18px', alignItems: 'center', borderBottom: '1px solid #111827' }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{sub.test_title}</div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{sub.submission_type === 'zip' ? 'ZIP Upload' : 'Multi-file Upload'}</div>
                            <div style={{ color: '#38bdf8', fontWeight: 800 }}>{Math.round(sub.score || 0)}</div>
                            <div style={{ color: sub.runtime_status === 'passed' ? '#34d399' : sub.runtime_status === 'failed' ? '#f87171' : '#fbbf24', fontWeight: 700 }}>{sub.runtime_status}</div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(sub.submitted_at).toLocaleString()}</div>
                            <button onClick={() => openSubmission(sub.id)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Eye size={14} />View</button>
                        </div>
                    ))}
                    {!submissions.length ? <div style={{ padding: 28, color: '#94a3b8', textAlign: 'center' }}>No frontend project submissions yet.</div> : null}
                </div>
            )}
        </div>
    )
}
