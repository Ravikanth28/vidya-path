import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Eye, FileArchive, FolderOpen, Send, Upload, X } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

function ScoreRing({ score, label, color }) {
    const radius = 25;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="35" cy="35" r={radius} fill="none" stroke="#1e293b" strokeWidth="5" />
                    <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
                </svg>
                <span style={{ position: 'absolute', fontWeight: 900, fontSize: '16px', color: '#f1f5f9' }}>{score}%</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>{label}</span>
        </div>
    );
}

function ReportModal({ submission, onClose }) {
    if (!submission) return null
    const report = submission.report_json || submission.report || {}
    const breakdown = report.breakdown || submission.breakdown_json || {}
    const [activeTab, setActiveTab] = useState('overview')
    const [activeEvalSection, setActiveEvalSection] = useState('strengths')
    const [copied, setCopied] = useState(false)
    const metrics = [
        ['Structure', breakdown.structure, '#60a5fa'],
        ['Functionality', breakdown.functionality, '#34d399'],
        ['UI/UX', breakdown.uiUx, '#f59e0b'],
        ['Responsive', breakdown.responsiveness, '#a78bfa'],
        ['Code Quality', breakdown.codeQuality, '#f87171'],
    ]
    const strengths = report.strengths || []
    const issues = report.issues || []
    const recommendations = report.recommendations || []
    const runtimeSummary = submission.runtime_summary || report.runtime?.summary || 'Runtime analysis not available.'
    const runtimeOutput = submission.runtime_output || report.runtime?.output || ''
    const lintData = submission.lint_results || report.lintResults || null
    const allLintIssues = lintData ? [...(lintData.htmlIssues || []), ...(lintData.cssWarnings || []), ...(lintData.jsWarnings || [])] : []
    const confidenceScore = submission.confidence_score ?? report.confidenceScore ?? null
    const coverage = report.coverage || {}
    const smokeTests = Array.isArray(report.runtime?.smokeTests) ? report.runtime.smokeTests : []
    const validationSignals = report.validationSignals || {}
    const evalSections = {
        strengths: { label: 'Strengths', color: '#86efac', items: strengths },
        issues: { label: 'Issues', color: '#fca5a5', items: issues },
        recommendations: { label: 'Recommendations', color: '#93c5fd', items: recommendations },
    }
    const activeEval = evalSections[activeEvalSection] || evalSections.strengths
    const hasCoverageData = Number(coverage.totalCount || 0) > 0
    const derivedConfidence = confidenceScore ?? (validationSignals.runtimeAttempted ? (validationSignals.runtimeSuccess ? 68 : 45) : null)
    const derivedLintScore = validationSignals.lintScore ?? lintData?.lintScore ?? (lintData ? Math.max(10, 100 - ((lintData.totalIssues || allLintIssues.length) * 10)) : null)
    const smokePassed = validationSignals.smokePassed ?? smokeTests.filter(test => test.success).length
    const smokeTotal = validationSignals.smokeTotal ?? smokeTests.length
    const hasInsightsData = derivedConfidence != null || hasCoverageData || derivedLintScore != null || smokeTotal > 0

    const renderTree = (nodes = [], depth = 0) => nodes.map(node => (
        <div key={node.path} style={{ paddingLeft: depth * 14, color: node.type === 'dir' ? '#cbd5e1' : '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
            {node.type === 'dir' ? '📁' : '📄'} {node.name}
            {node.children ? renderTree(node.children, depth + 1) : null}
        </div>
    ))

    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    async function copyRuntimeOutput() {
        if (!runtimeOutput) return
        try {
            await navigator.clipboard.writeText(runtimeOutput)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
            <div style={{ width: 'min(1100px, 95vw)', background: 'linear-gradient(135deg, #0f172a, #020617)', borderRadius: 24, border: '1px solid #1e293b', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1a2a4e, #0f172a)' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20 }}>📊 {submission.test_title}</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>⏰ {new Date(submission.submitted_at).toLocaleString()}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 24 }}>✕</button>
                </div>

                <div style={{ padding: 20, borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'center', background: '#0c162e' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 8, background: '#16274a', border: '1px solid #223b66', borderRadius: 999, padding: 6, width: 'min(860px, 100%)' }}>
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'evaluation', label: 'Evaluation Details' },
                            { id: 'insights', label: 'Insights' },
                            { id: 'runtime', label: 'Runtime & Files' },
                        ].map(tab => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        border: 'none',
                                        borderRadius: 999,
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: active ? '#ffffff' : '#9bb0d4',
                                        background: active ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div style={{ padding: 28, display: 'grid', gap: 20, maxHeight: 'calc(90vh - 190px)', overflowY: 'auto' }}>
                    {activeTab === 'overview' ? (
                        <>
                            <div style={{ background: 'linear-gradient(145deg, #5b21b6, #4f46e5)', borderRadius: 20, border: '1px solid #6d28d9', padding: 22 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'center' }}>
                                    <div style={{ background: 'rgba(15, 23, 42, 0.45)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                                        <div style={{ color: '#ede9fe', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>Overall Score</div>
                                        <div style={{ color: '#fff', fontSize: 54, fontWeight: 900, lineHeight: 1.05, marginTop: 8 }}>{Math.round(submission.score || report.overallScore || 0)}</div>
                                        <div style={{ color: '#ddd6fe', fontSize: 12, marginTop: 8 }}>{submission.runtime_status || 'skipped'} runtime check</div>
                                    </div>
                                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 18 }}>
                                            {confidenceScore != null ? (
                                                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '4px 10px' }}>
                                                    <span style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>Confidence</span>
                                                    <span style={{ fontSize: 14, fontWeight: 900, color: confidenceScore >= 70 ? '#34d399' : confidenceScore >= 40 ? '#fbbf24' : '#f87171' }}>{confidenceScore}%</span>
                                                </div>
                                            ) : null}
                                        <div style={{ color: '#ede9fe', fontWeight: 800, marginBottom: 8, fontSize: 13, textTransform: 'uppercase' }}>Summary</div>
                                        <div style={{ color: '#e2e8f0', lineHeight: 1.75, fontSize: 14 }}>{report.summary || 'No summary available.'}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 20 }}>
                                <div style={{ color: '#cbd5e1', fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Score Breakdown</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(100px, 1fr))', gap: 12 }}>
                                    {metrics.map(([label, value, color]) => (
                                        <ScoreRing key={label} score={Math.round(value || 0)} label={label} color={color} />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}

                    {activeTab === 'evaluation' ? (
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#86efac', fontSize: 12, fontWeight: 800 }}>Strengths</div>
                                    <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{strengths.length}</div>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#fca5a5', fontSize: 12, fontWeight: 800 }}>Issues</div>
                                    <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{issues.length}</div>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 800 }}>Recommendations</div>
                                    <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{recommendations.length}</div>
                                </div>
                            </div>

                            <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 999, display: 'flex', padding: 4 }}>
                                        {Object.entries(evalSections).map(([id, section]) => {
                                            const isActive = activeEvalSection === id
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => setActiveEvalSection(id)}
                                                    style={{
                                                        border: 'none',
                                                        borderRadius: 999,
                                                        padding: '8px 14px',
                                                        cursor: 'pointer',
                                                        fontWeight: 800,
                                                        fontSize: 12,
                                                        color: isActive ? '#ffffff' : '#9ca3af',
                                                        background: isActive ? 'linear-gradient(135deg, #5b21b6, #7c3aed)' : 'transparent',
                                                    }}
                                                >
                                                    {section.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <div style={{ color: activeEval.color, fontWeight: 800 }}>{activeEval.label}</div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>{activeEval.items.length} item{activeEval.items.length !== 1 ? 's' : ''}</div>
                                </div>
                                {activeEval.items.length ? activeEval.items.map((item, idx) => (
                                    <div key={idx} style={{ color: '#94a3b8', marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${activeEval.color}`, lineHeight: 1.6 }}>{item}</div>
                                )) : <div style={{ color: '#64748b', fontSize: 13 }}>No {activeEval.label.toLowerCase()} recorded.</div>}
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'insights' ? (
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Confidence</div>
                                    <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{derivedConfidence ?? 'N/A'}{derivedConfidence != null ? '%' : ''}</div>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Coverage</div>
                                    <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{hasCoverageData ? `${coverage.score ?? 0}%` : 'N/A'}</div>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#fcd34d', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Lint Score</div>
                                    <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{derivedLintScore ?? 'N/A'}</div>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 12 }}>
                                    <div style={{ color: '#34d399', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Smoke Checks</div>
                                    <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{smokeTotal > 0 ? `${smokePassed}/${smokeTotal}` : 'N/A'}</div>
                                </div>
                            </div>

                            {!hasInsightsData ? (
                                <div style={{ color: '#94a3b8', fontSize: 12, background: 'rgba(15,23,42,0.45)', border: '1px solid #1e293b', borderRadius: 10, padding: '8px 12px' }}>
                                    This looks like a legacy submission. Detailed confidence and validation signals will appear for new submissions.
                                </div>
                            ) : null}

                            <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                <div style={{ color: '#cbd5e1', fontWeight: 800, marginBottom: 10 }}>Requirement Coverage</div>
                                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>
                                    {hasCoverageData ? `Matched ${coverage.matchedCount ?? 0} of ${coverage.totalCount ?? 0} requirements.` : 'No structured requirement checklist was available in this report.'}
                                </div>
                                {hasCoverageData && (coverage.missing || []).length ? (
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {(coverage.missing || []).slice(0, 6).map((item, idx) => (
                                            <div key={idx} style={{ color: '#94a3b8', fontSize: 12, padding: '6px 10px', background: '#0a1020', borderRadius: 8, border: '1px solid #1e293b' }}>
                                                Missing: {typeof item === 'string' ? item : item.text}
                                            </div>
                                        ))}
                                    </div>
                                ) : !hasCoverageData ? (
                                    <div style={{ color: '#64748b', fontSize: 13 }}>Requirement coverage tracking starts from newer evaluations.</div>
                                ) : (
                                    <div style={{ color: '#34d399', fontSize: 13 }}>All listed requirements appear represented in source.</div>
                                )}
                            </div>

                            {smokeTests.length ? (
                                <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                    <div style={{ color: '#cbd5e1', fontWeight: 800, marginBottom: 10 }}>Smoke-run Checks</div>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        {smokeTests.map((test, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#0a1020', border: '1px solid #1e293b', borderRadius: 8 }}>
                                                <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 12 }}>npm run {test.script}</div>
                                                <div style={{ color: test.success ? '#34d399' : '#f87171', fontWeight: 800, fontSize: 12 }}>{test.success ? 'Passed' : 'Failed'} • {Math.round((test.duration || 0) / 1000)}s</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {activeTab === 'runtime' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 16 }}>
                                <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                    <div style={{ color: '#cbd5e1', fontWeight: 800, marginBottom: 10 }}>Runtime Summary</div>
                                    <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 13, marginBottom: 12, background: 'rgba(56, 189, 248, 0.1)', padding: 12, borderRadius: 10, border: '1px solid rgba(56, 189, 248, 0.2)' }}>{runtimeSummary}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Runtime Output</div>
                                        <button onClick={copyRuntimeOutput} disabled={!runtimeOutput} style={{ border: '1px solid #334155', background: '#0b1224', color: copied ? '#86efac' : '#cbd5e1', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: runtimeOutput ? 'pointer' : 'not-allowed' }}>{copied ? 'Copied' : 'Copy Output'}</button>
                                    </div>
                                    <pre style={{ background: '#000814', color: '#94a3b8', padding: 12, borderRadius: 10, fontSize: 11, overflow: 'auto', minHeight: 170, maxHeight: 260, border: '1px solid #1e293b' }}>{runtimeOutput || 'No runtime output captured.'}</pre>
                                </div>

                                <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                    <div style={{ color: '#cbd5e1', fontWeight: 800, marginBottom: 10 }}>Project Files</div>
                                    <div style={{ background: '#000814', borderRadius: 10, padding: 12, maxHeight: 360, overflow: 'auto', border: '1px solid #1e293b' }}>
                                        {renderTree(submission.file_tree_json || report.fileTree || [])}
                                    </div>
                                </div>
                            </div>

                            {lintData ? (
                                <div style={{ background: '#020617', borderRadius: 18, border: '1px solid #1e293b', padding: 18 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ color: '#cbd5e1', fontWeight: 800 }}>🔍 Static Lint Analysis</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: allLintIssues.length === 0 ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', color: allLintIssues.length === 0 ? '#34d399' : '#fbbf24', border: `1px solid ${allLintIssues.length === 0 ? '#065f46' : '#78350f'}` }}>
                                            {allLintIssues.length === 0 ? '✅ No issues found' : `${allLintIssues.length} issue${allLintIssues.length !== 1 ? 's' : ''} detected`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: allLintIssues.length ? 12 : 0 }}>
                                        <div style={{ background: '#0c162e', borderRadius: 10, border: '1px solid #1e3a5f', padding: '10px 12px' }}>
                                            <div style={{ color: '#93c5fd', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>HTML</div>
                                            <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{(lintData.htmlIssues || []).length}</div>
                                        </div>
                                        <div style={{ background: '#0c162e', borderRadius: 10, border: '1px solid #1e3a5f', padding: '10px 12px' }}>
                                            <div style={{ color: '#fcd34d', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>CSS</div>
                                            <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{(lintData.cssWarnings || []).length}</div>
                                        </div>
                                        <div style={{ background: '#0c162e', borderRadius: 10, border: '1px solid #1e3a5f', padding: '10px 12px' }}>
                                            <div style={{ color: '#f9a8d4', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>JS</div>
                                            <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20, marginTop: 4 }}>{(lintData.jsWarnings || []).length}</div>
                                        </div>
                                    </div>
                                    {allLintIssues.length > 0 ? (
                                        <div style={{ display: 'grid', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
                                            {allLintIssues.map((issue, idx) => (
                                                <div key={idx} style={{ color: '#94a3b8', fontSize: 12, padding: '6px 10px', background: '#0a1020', borderRadius: 8, border: '1px solid #1e293b' }}>⚠️ {issue}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#34d399', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>All analyzed files passed static checks.</div>
                                    )}
                                </div>
                            ) : null}
                        </>
                    ) : null}
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
    const filesInputRef = useRef(null)
    const folderInputRef = useRef(null)
    const zipInputRef = useRef(null)

    const topFolderName = folderFiles[0]?.webkitRelativePath ? folderFiles[0].webkitRelativePath.split('/')[0] : ''
    const totalSizeMb = (folderFiles.reduce((sum, file) => sum + (file.size || 0), 0) / (1024 * 1024)).toFixed(2)

    function pickFiles() {
        filesInputRef.current?.click()
    }

    function pickFolder() {
        folderInputRef.current?.click()
    }

    function pickZip() {
        zipInputRef.current?.click()
    }

    function onMultiFilesChange(event) {
        const list = Array.from(event.target.files || [])
        setFolderFiles(list)
    }

    function onFolderChange(event) {
        const list = Array.from(event.target.files || [])
        setFolderFiles(list)
    }

    function onZipChange(event) {
        setZipFile(event.target.files?.[0] || null)
    }

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
                                <input ref={filesInputRef} type="file" multiple onChange={onMultiFilesChange} style={{ display: 'none' }} />
                                <input ref={folderInputRef} type="file" multiple webkitdirectory="" directory="" onChange={onFolderChange} style={{ display: 'none' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <button type="button" onClick={pickFiles} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #334155', background: '#0b1326', color: '#cbd5e1', cursor: 'pointer', fontWeight: 700 }}>Select Files</button>
                                    <button type="button" onClick={pickFolder} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #2563eb', background: 'rgba(37,99,235,0.12)', color: '#bfdbfe', cursor: 'pointer', fontWeight: 700 }}>Select Folder</button>
                                </div>
                                {folderFiles.length ? (
                                    <div style={{ marginTop: 10, background: '#0b1326', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 4 }}>
                                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{topFolderName ? `Folder: ${topFolderName}` : 'Multiple files selected'}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{folderFiles.length} file(s) • {totalSizeMb} MB</div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>No files selected yet.</div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>Upload a zip file of your frontend project</div>
                                <input ref={zipInputRef} type="file" accept=".zip" onChange={onZipChange} style={{ display: 'none' }} />
                                <button type="button" onClick={pickZip} style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #2563eb', background: 'rgba(37,99,235,0.12)', color: '#bfdbfe', cursor: 'pointer', fontWeight: 700 }}>Choose ZIP File</button>
                                {zipFile ? (
                                    <div style={{ marginTop: 10, background: '#0b1326', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 4 }}>
                                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, wordBreak: 'break-all' }}>{zipFile.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{(zipFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>No zip selected yet.</div>
                                )}
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
    const [submissionQuery, setSubmissionQuery] = useState('')
    const [runtimeFilter, setRuntimeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('latest')

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

    const filteredSubmissions = useMemo(() => {
        const query = submissionQuery.trim().toLowerCase()
        let list = [...submissions]

        if (query) {
            list = list.filter(sub =>
                String(sub.test_title || '').toLowerCase().includes(query) ||
                String(sub.submission_type || '').toLowerCase().includes(query)
            )
        }

        if (runtimeFilter !== 'all') {
            list = list.filter(sub => String(sub.runtime_status || '').toLowerCase() === runtimeFilter)
        }

        if (sortBy === 'latest') list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        if (sortBy === 'oldest') list.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
        if (sortBy === 'score-desc') list.sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        if (sortBy === 'score-asc') list.sort((a, b) => Number(a.score || 0) - Number(b.score || 0))

        return list
    }, [submissions, submissionQuery, runtimeFilter, sortBy])

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

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', borderRadius: 22, border: '1px solid #312e81', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>🚀 Frontend Evaluation</div>
                    <div style={{ color: '#cbd5e1', marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>Upload your HTML, CSS, and JavaScript projects as multiple files or a ZIP archive. Get instant comprehensive feedback on structure, functionality, UI/UX, responsiveness, and code quality.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setTab('tests')} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid #4338ca', background: tab === 'tests' ? '#4f46e5' : '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}>📋 Available Tests</button>
                    <button onClick={() => setTab('submissions')} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid #4338ca', background: tab === 'submissions' ? '#4f46e5' : '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }}>📊 My Submissions</button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                    {[1, 2, 3].map(id => (
                        <div key={id} style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', padding: 20, display: 'grid', gap: 12 }}>
                            <div style={{ height: 18, width: '56%', borderRadius: 8, background: '#1e293b' }} />
                            <div style={{ height: 12, width: '86%', borderRadius: 8, background: '#1e293b' }} />
                            <div style={{ height: 76, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                <div style={{ height: 58, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                                <div style={{ height: 58, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                            </div>
                            <div style={{ height: 44, borderRadius: 12, background: '#1e293b' }} />
                        </div>
                    ))}
                </div>
            ) : tab === 'tests' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                    {tests.map(test => {
                        const attemptsReached = test.attempt_limit != null && Number(test.attempts_used || 0) >= Number(test.attempt_limit)
                        return (
                            <div key={test.id} style={{ background: 'linear-gradient(135deg, #0f172a, #020617)', borderRadius: 20, border: '1px solid #1e293b', padding: 22, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                                {/* Title & Status */}
                                <div>
                                    <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 19, marginBottom: 8 }}>✨ {test.title}</div>
                                    <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{test.description || 'No description provided.'}</div>
                                </div>

                                {/* Requirements Box */}
                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 14, padding: 14 }}>
                                    <div style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>📋 What to Build</div>
                                    <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                                        {test.requirements ? test.requirements.split('\n').slice(0, 2).join(' • ').slice(0, 100) + '...' : 'Click to view full requirements'}
                                    </div>
                                </div>

                                {/* Attempts Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                    <div style={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b', padding: 12, textAlign: 'center' }}>
                                        <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Attempts</div>
                                        <div style={{ color: '#38bdf8', fontSize: 16, fontWeight: 900 }}>{Number(test.attempts_used || 0)}/{test.attempt_limit ?? '∞'}</div>
                                    </div>
                                    <div style={{ background: attemptsReached ? '#3b0d0d' : '#052e16', border: `1px solid ${attemptsReached ? '#7f1d1d' : '#166534'}`, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                                        <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                                        <div style={{ color: attemptsReached ? '#fca5a5' : '#86efac', fontSize: 13, fontWeight: 900 }}>{attemptsReached ? '⛔ Limit Reached' : '✅ Available'}</div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button onClick={() => setSelectedTest(test)} disabled={attemptsReached} style={{ padding: '14px 16px', borderRadius: 12, border: 'none', background: attemptsReached ? '#334155' : 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 800, cursor: attemptsReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, transition: 'all 0.2s' }}>
                                    <Upload size={16} /> {attemptsReached ? 'Limit Reached' : 'Submit Project'}
                                </button>
                            </div>
                        )
                    })}
                    {!tests.length ? <div style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div>No frontend evaluations are assigned to you right now.</div>
                    </div> : null}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Filtered Submissions</div>
                            <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{filteredSubmissions.length}</div>
                        </div>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Passed Runtime</div>
                            <div style={{ color: '#34d399', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{filteredSubmissions.filter(sub => sub.runtime_status === 'passed').length}</div>
                        </div>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Average Score</div>
                            <div style={{ color: '#38bdf8', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{filteredSubmissions.length ? Math.round(filteredSubmissions.reduce((acc, sub) => acc + Number(sub.score || 0), 0) / filteredSubmissions.length) : 0}</div>
                        </div>
                    </div>

                    <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 12, display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 0.8fr auto', gap: 10 }}>
                        <input
                            value={submissionQuery}
                            onChange={e => setSubmissionQuery(e.target.value)}
                            placeholder="Search by test name or type"
                            style={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', padding: '10px 12px', outline: 'none' }}
                        />
                        <select value={runtimeFilter} onChange={e => setRuntimeFilter(e.target.value)} style={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', padding: '10px 12px', outline: 'none' }}>
                            <option value="all">All Runtime</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="skipped">Skipped</option>
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', padding: '10px 12px', outline: 'none' }}>
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="score-desc">Score High to Low</option>
                            <option value="score-asc">Score Low to High</option>
                        </select>
                        <div style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', border: '1px solid #334155', borderRadius: 10, padding: '0 12px', fontWeight: 700 }}>
                            {filteredSubmissions.length} results
                        </div>
                    </div>

                    <div style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #020617)', padding: '18px 24px', borderBottom: '1px solid #1e293b', display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 190px 80px', gap: 16, color: '#64748b', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📋 Test Name</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📦 Type</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>⭐ Score</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>▶️ Runtime</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>⏰ Submitted</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>👁️ View</div>
                        </div>
                        {filteredSubmissions.map((sub, idx) => (
                            <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 190px 80px', gap: 16, padding: '16px 24px', alignItems: 'center', borderBottom: idx === filteredSubmissions.length - 1 ? 'none' : '1px solid #111827', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{sub.test_title}</div>
                                <div style={{ color: '#94a3b8', fontSize: 13, background: sub.submission_type === 'zip' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)', padding: '6px 10px', borderRadius: 8, fontWeight: 600 }}>{sub.submission_type === 'zip' ? '📦 ZIP' : '📁 Multi'}</div>
                                <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: 16 }}>{Math.round(sub.score || 0)}</div>
                                <div style={{ color: sub.runtime_status === 'passed' ? '#34d399' : sub.runtime_status === 'failed' ? '#f87171' : '#fbbf24', fontWeight: 700, background: sub.runtime_status === 'passed' ? 'rgba(52, 211, 153, 0.1)' : sub.runtime_status === 'failed' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '6px 10px', borderRadius: 8 }}>
                                    {sub.runtime_status === 'passed' ? '✅' : sub.runtime_status === 'failed' ? '❌' : '⏸'} {sub.runtime_status}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleString()}</div>
                                <button onClick={() => openSubmission(sub.id)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}><Eye size={14} />View</button>
                            </div>
                        ))}
                        {!filteredSubmissions.length ? <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                            <div>No submissions match current filters.</div>
                        </div> : null}
                    </div>
                </div>
            )}
        </div>
    )
}
