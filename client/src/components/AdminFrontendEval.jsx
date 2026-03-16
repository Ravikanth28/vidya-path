import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Code2, Eye, Play, Square, Trash2, Users, X, Plus, FileCode2 } from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' })

const STATUS_META = {
    draft: { label: 'Draft', bg: '#1e293b', color: '#94a3b8' },
    active: { label: 'Live', bg: '#052e16', color: '#34d399' },
    ended: { label: 'Ended', bg: '#3b0d0d', color: '#f87171' },
}

function Toast({ item, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3200)
        return () => clearTimeout(timer)
    }, [onClose])
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: item.type === 'error' ? '#3b0d0d' : '#052e16', color: item.type === 'error' ? '#fca5a5' : '#86efac', border: `1px solid ${item.type === 'error' ? '#7f1d1d' : '#166534'}`, padding: '12px 16px', borderRadius: 12, minWidth: 280, boxShadow: '0 16px 36px rgba(0,0,0,0.35)' }}>
            {item.message}
        </div>
    )
}

function BatchAssignSection({ students, allStudentIds, selectedDomain, setSelectedDomain, emailDomains, batchStudentIds, assignedStudentIds, loading, save }) {
    const [savedBatches, setSavedBatches] = useState([])
    const [selectedBatchIds, setSelectedBatchIds] = useState([])
    const [batchMode, setBatchMode] = useState('domain') // 'domain' | 'saved'

    useEffect(() => {
        fetch(`${API}/batches`, { headers: authHeader() })
            .then(r => r.json())
            .then(data => setSavedBatches(data.batches || []))
            .catch(() => { })
    }, [])

    const selectedBatches = useMemo(() =>
        savedBatches.filter(b => selectedBatchIds.includes(b.id)),
        [savedBatches, selectedBatchIds]
    )

    const savedBatchStudentIds = useMemo(() => {
        if (selectedBatches.length === 0) return []
        const uniqueIds = new Set()
        const availableIds = new Set(allStudentIds)

        selectedBatches.forEach(batch => {
            (batch.student_ids || []).forEach(id => {
                const sid = String(id)
                if (availableIds.has(sid)) {
                    uniqueIds.add(sid)
                }
            })
        })
        return Array.from(uniqueIds)
    }, [selectedBatches, allStudentIds])

    const activeStudentIds = batchMode === 'saved' ? savedBatchStudentIds : batchStudentIds

    useEffect(() => {
        if (!savedBatches.length) return

        const assignedSet = new Set((assignedStudentIds || []).map(String))
        const availableStudentIds = new Set(allStudentIds.map(String))
        const matchedBatchIds = savedBatches
            .filter(batch => {
                const batchIds = (batch.student_ids || [])
                    .map(id => String(id))
                    .filter(id => availableStudentIds.has(id))

                return batchIds.length > 0 && batchIds.every(id => assignedSet.has(id))
            })
            .map(batch => batch.id)

        setSelectedBatchIds(matchedBatchIds)
        if (matchedBatchIds.length > 0) {
            setBatchMode('saved')
        }
    }, [savedBatches, assignedStudentIds, allStudentIds])

    const toggleBatch = (id) => {
        setSelectedBatchIds(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        )
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {/* Toggle between domain and saved batches */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: '#12213c', borderRadius: 10, padding: 4, border: '1px solid #1e3457' }}>
                <button
                    onClick={() => setBatchMode('domain')}
                    style={{
                        border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                        fontWeight: 700, fontSize: 12,
                        background: batchMode === 'domain' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                        color: batchMode === 'domain' ? '#fff' : '#8197bc',
                    }}
                >
                    By Email Domain
                </button>
                <button
                    onClick={() => setBatchMode('saved')}
                    style={{
                        border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                        fontWeight: 700, fontSize: 12,
                        background: batchMode === 'saved' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                        color: batchMode === 'saved' ? '#fff' : '#8197bc',
                    }}
                >
                    Saved Batches {savedBatches.length > 0 ? `(${savedBatches.length})` : ''}
                </button>
            </div>

            {batchMode === 'domain' ? (
                <>
                    <div style={{ color: '#a9bcdd', fontSize: 13 }}>Assign by email domain</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedDomain('all')}
                            style={{ border: '1px solid #284570', background: selectedDomain === 'all' ? '#3b82f6' : '#14233f', color: '#fff', borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}
                        >
                            All Domains
                        </button>
                        {emailDomains.map(domain => (
                            <button
                                key={domain}
                                onClick={() => setSelectedDomain(domain)}
                                style={{ border: '1px solid #284570', background: selectedDomain === domain ? '#3b82f6' : '#14233f', color: '#fff', borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                {domain}
                            </button>
                        ))}
                    </div>
                    <div style={{ background: '#202f4a', borderRadius: 14, border: '1px solid #2a4b77', padding: 14 }}>
                        <div style={{ color: '#dfe9fb', fontWeight: 800, fontSize: 18 }}>{batchStudentIds.length} students selected</div>
                        <div style={{ color: '#93a8cd', fontSize: 13, marginTop: 4 }}>
                            {selectedDomain === 'all' ? 'All domains will be assigned.' : `Only ${selectedDomain} students will be assigned.`}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ color: '#a9bcdd', fontSize: 13 }}>Select saved batches to assign (can select multiple)</div>
                    {savedBatches.length === 0 ? (
                        <div style={{ background: '#12213c', border: '1px solid #1e3457', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: 14 }}>No saved batches found</div>
                            <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>Go to System → Batch Add to create batches from CSV files</div>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
                            {savedBatches.map(batch => {
                                const isSelected = selectedBatchIds.includes(batch.id)
                                return (
                                    <div
                                        key={batch.id}
                                        onClick={() => toggleBatch(batch.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                            background: isSelected ? '#1b2d4f' : '#12213c',
                                            border: `1px solid ${isSelected ? '#3b82f6' : '#1e3457'}`,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: isSelected ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : '#1e3457',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isSelected ? '#fff' : '#64748b',
                                            fontWeight: 900, fontSize: 16, flexShrink: 0,
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {batch.student_count}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#e6eefb', fontWeight: 800, fontSize: 14 }}>{batch.batch_name}</div>
                                            <div style={{ color: '#91a6cb', fontSize: 11 }}>
                                                {batch.student_count} students • {batch.source_filename || 'Uploaded File'} {batch.sheet_name ? `(${batch.sheet_name})` : ''}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div style={{ color: '#3b82f6', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>✓ Selected</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {selectedBatches.length > 0 && (
                        <div style={{ background: '#202f4a', borderRadius: 14, border: '1px solid #2a4b77', padding: 14 }}>
                            <div style={{ color: '#dfe9fb', fontWeight: 800, fontSize: 18 }}>{savedBatchStudentIds.length} unique students will be assigned</div>
                            <div style={{ color: '#93a8cd', fontSize: 13, marginTop: 4 }}>
                                From {selectedBatches.length} selected batch{selectedBatches.length > 1 ? 'es' : ''} ({selectedBatches.map(b => b.batch_name).join(', ')})
                            </div>
                            {assignedStudentIds?.length > 0 ? (
                                <div style={{ color: '#60a5fa', fontSize: 12, marginTop: 8 }}>
                                    Existing saved-batch assignments are preselected.
                                </div>
                            ) : null}
                        </div>
                    )}
                </>
            )}

            <button
                disabled={loading || !activeStudentIds.length}
                onClick={() => save(activeStudentIds)}
                style={{
                    border: 'none', borderRadius: 12, padding: '12px 14px',
                    fontWeight: 800, fontSize: 15,
                    cursor: loading || !activeStudentIds.length ? 'not-allowed' : 'pointer',
                    color: '#fff',
                    background: loading || !activeStudentIds.length ? '#31435f' : 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                }}
            >
                {loading ? 'Assigning...' : `Assign ${activeStudentIds.length} Students`}
            </button>
        </div>
    )
}

function AssignModal({ test, onClose, onSaved }) {
    const [students, setStudents] = useState([])
    const [selected, setSelected] = useState([])
    const [mode, setMode] = useState('all')
    const [query, setQuery] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('all')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/crt/students`, { headers: authHeader() }).then(r => r.json()),
            fetch(`${API}/admin/frontend-evals/tests/${test.id}/assignments`, { headers: authHeader() }).then(r => r.json()).catch(() => ({ student_ids: [] })),
        ])
            .then(([studentData, assignmentData]) => {
                const list = Array.isArray(studentData) ? studentData : (studentData.students || [])
                setStudents(list)
                setSelected((assignmentData.student_ids || []).map(String))
            })
    }, [test.id])

    const allStudentIds = useMemo(() => students.map(student => String(student.id)), [students])

    const filteredStudents = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return students
        return students.filter(student => {
            const name = String(student.name || '').toLowerCase()
            const email = String(student.email || '').toLowerCase()
            return name.includes(q) || email.includes(q)
        })
    }, [students, query])

    const emailDomains = useMemo(() => {
        const unique = new Set()
        for (const student of students) {
            const email = String(student.email || '')
            const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : ''
            if (domain) unique.add(domain)
        }
        return Array.from(unique).sort((a, b) => a.localeCompare(b))
    }, [students])

    const batchStudentIds = useMemo(() => {
        if (selectedDomain === 'all') return allStudentIds
        return students
            .filter(student => String(student.email || '').toLowerCase().endsWith(`@${selectedDomain}`))
            .map(student => String(student.id))
    }, [students, selectedDomain, allStudentIds])

    async function save(studentIds = selected) {
        setLoading(true)
        try {
            const res = await fetch(`${API}/admin/frontend-evals/tests/${test.id}/assign`, {
                method: 'PUT',
                headers: authHeader(),
                body: JSON.stringify({ student_ids: studentIds }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save assignments')
            onSaved()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    function toggleStudent(studentId) {
        setSelected(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId])
    }

    function selectVisibleStudents() {
        const visibleIds = filteredStudents.map(student => String(student.id))
        setSelected(prev => Array.from(new Set([...prev, ...visibleIds])))
    }

    function clearVisibleStudents() {
        const visibleIds = new Set(filteredStudents.map(student => String(student.id)))
        setSelected(prev => prev.filter(id => !visibleIds.has(id)))
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: 16 }}>
            <div style={{ width: 620, maxWidth: '96vw', maxHeight: '88vh', overflow: 'hidden', background: 'linear-gradient(165deg, #0f1d3b, #0b1428)', borderRadius: 24, border: '1px solid #1e355f', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 26px', borderBottom: '1px solid #193457', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 30, lineHeight: 1 }}>Assign Students</div>
                        <div style={{ color: '#8197bc', fontSize: 13, marginTop: 8 }}>{test.title}</div>
                    </div>
                    <button onClick={onClose} style={{ background: '#1b2d4f', border: '1px solid #29466f', color: '#9fb2d5', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 18, display: 'grid', gap: 14 }}>
                    <div style={{ background: '#1a2a48', border: '1px solid #213c66', borderRadius: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: 4 }}>
                        {[
                            { id: 'all', label: 'Assign All' },
                            { id: 'individual', label: 'Individual' },
                            { id: 'batch', label: 'Batch' },
                        ].map(tab => {
                            const active = mode === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setMode(tab.id)}
                                    style={{
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: 13,
                                        background: active ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: active ? '#ffffff' : '#98abd0',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {mode === 'all' ? (
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div style={{ background: '#202f4a', borderRadius: 18, border: '1px solid #2a4b77', padding: '28px 16px', textAlign: 'center' }}>
                                <div style={{ color: '#a78bfa', fontWeight: 900, fontSize: 64, lineHeight: 1 }}>{students.length}</div>
                                <div style={{ color: '#8fa6cd', fontSize: 20, marginTop: 8 }}>students will receive this test</div>
                            </div>
                            <button
                                disabled={loading || !students.length}
                                onClick={() => save(allStudentIds)}
                                style={{
                                    border: 'none',
                                    borderRadius: 14,
                                    padding: '14px 16px',
                                    fontWeight: 900,
                                    fontSize: 22,
                                    cursor: loading || !students.length ? 'not-allowed' : 'pointer',
                                    color: '#fff',
                                    background: loading || !students.length ? '#31435f' : 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                }}
                            >
                                {loading ? 'Assigning...' : `Assign to All ${students.length} Students`}
                            </button>
                        </div>
                    ) : null}

                    {mode === 'individual' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search name or email"
                                    style={{ background: '#0b1428', border: '1px solid #284570', color: '#d8e3f7', borderRadius: 10, padding: '10px 12px', outline: 'none' }}
                                />
                                <button onClick={selectVisibleStudents} style={{ background: '#1a2a48', border: '1px solid #284570', color: '#b7c8e6', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}>Select</button>
                                <button onClick={clearVisibleStudents} style={{ background: '#1a2a48', border: '1px solid #284570', color: '#b7c8e6', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                            </div>
                            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'grid', gap: 10, paddingRight: 4 }}>
                                {filteredStudents.map(student => {
                                    const checked = selected.includes(String(student.id))
                                    return (
                                        <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: checked ? '#1b2d4f' : '#12213c', border: `1px solid ${checked ? '#2b69d1' : '#1e3457'}`, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleStudent(String(student.id))}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#e6eefb', fontWeight: 800, fontSize: 14 }}>{student.name}</div>
                                                <div style={{ color: '#91a6cb', fontSize: 12 }}>{student.email}</div>
                                            </div>
                                        </label>
                                    )
                                })}
                                {!filteredStudents.length ? (
                                    <div style={{ color: '#91a6cb', textAlign: 'center', padding: 16 }}>No students found for this search.</div>
                                ) : null}
                            </div>
                            <button
                                disabled={loading}
                                onClick={() => save(selected)}
                                style={{
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    fontWeight: 800,
                                    fontSize: 15,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    color: '#fff',
                                    background: loading ? '#31435f' : 'linear-gradient(135deg, #2563eb, #0ea5e9)'
                                }}
                            >
                                {loading ? 'Saving...' : `Save ${selected.length} Assignments`}
                            </button>
                        </>
                    ) : null}

                    {mode === 'batch' ? (
                        <BatchAssignSection
                            students={students}
                            allStudentIds={allStudentIds}
                            selectedDomain={selectedDomain}
                            setSelectedDomain={setSelectedDomain}
                            emailDomains={emailDomains}
                            batchStudentIds={batchStudentIds}
                            assignedStudentIds={selected}
                            loading={loading}
                            save={save}
                        />
                    ) : null}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #193457', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334e73', background: 'transparent', color: '#b7c8e6', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

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
    const report = submission.report_json || {}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflowY: 'auto', padding: '20px' }}>
            <div style={{ width: 'min(1100px, 95vw)', background: 'linear-gradient(135deg, #0f172a, #020617)', border: '1px solid #1e293b', borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1a2a4e, #0f172a)' }}>
                    <div>
                        <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20 }}>📊 {submission.test_title}</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>👤 {submission.student_name || 'Student'} • ⏰ {new Date(submission.submitted_at).toLocaleString()}</div>
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

export default function AdminFrontendEval({ initialTab = 'tests' }) {
    const [tab, setTab] = useState(initialTab)
    const [tests, setTests] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [assigning, setAssigning] = useState(null)
    const [report, setReport] = useState(null)
    const [toast, setToast] = useState(null)
    const [form, setForm] = useState({ title: '', description: '', requirements: '', attempt_limit: 1, rubric_json: {} })
    const [formErrors, setFormErrors] = useState({})
    const [submissionQuery, setSubmissionQuery] = useState('')
    const [batchFilter, setBatchFilter] = useState('all')
    const [runtimeFilter, setRuntimeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('latest')
    const [batches, setBatches] = useState([])

    const assignedMap = useMemo(() => Object.fromEntries(tests.map(test => [test.id, safeJson(test.assigned_students, [])])), [tests])

    function safeJson(value, fallback) {
        try { return value ? JSON.parse(value) : fallback } catch { return fallback }
    }

    async function loadData() {
        setLoading(true)
        try {
            const [testsRes, subsRes, batchesRes] = await Promise.all([
                fetch(`${API}/admin/frontend-evals/tests`, { headers: authHeader() }).then(r => r.json()),
                fetch(`${API}/admin/frontend-evals/submissions`, { headers: authHeader() }).then(r => r.json()),
                fetch(`${API}/batches`, { headers: authHeader() }).then(r => r.json()).catch(() => ({ batches: [] })),
            ])
            setTests((testsRes.tests || []).map(test => ({ ...test, assigned_students: safeJson(test.assigned_students, []) })))
            setSubmissions(subsRes.submissions || [])
            setBatches(batchesRes.batches || [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])
    useEffect(() => { setTab(initialTab) }, [initialTab])

    const batchStudentLookup = useMemo(() => {
        const lookup = {}
        batches.forEach(batch => {
            ; (batch.student_ids || []).forEach(studentId => {
                const key = String(studentId)
                if (!lookup[key]) lookup[key] = []
                lookup[key].push(batch.batch_name)
            })
        })
        return lookup
    }, [batches])

    const filteredSubmissions = useMemo(() => {
        const query = submissionQuery.trim().toLowerCase()
        let list = [...submissions]

        if (query) {
            list = list.filter(sub =>
                String(sub.student_name || '').toLowerCase().includes(query) ||
                String(sub.test_title || '').toLowerCase().includes(query) ||
                String(sub.submission_type || '').toLowerCase().includes(query) ||
                (batchStudentLookup[String(sub.student_id)] || []).some(batchName => batchName.toLowerCase().includes(query))
            )
        }

        if (batchFilter !== 'all') {
            const selectedBatch = batches.find(batch => batch.id === batchFilter)
            const allowedStudents = new Set((selectedBatch?.student_ids || []).map(id => String(id)))
            list = list.filter(sub => allowedStudents.has(String(sub.student_id)))
        }

        if (runtimeFilter !== 'all') {
            list = list.filter(sub => String(sub.runtime_status || '').toLowerCase() === runtimeFilter)
        }

        if (sortBy === 'latest') list.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        if (sortBy === 'oldest') list.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
        if (sortBy === 'score-desc') list.sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        if (sortBy === 'score-asc') list.sort((a, b) => Number(a.score || 0) - Number(b.score || 0))

        return list
    }, [submissions, submissionQuery, batchFilter, runtimeFilter, sortBy, batches, batchStudentLookup])

    const submissionStats = useMemo(() => {
        const total = filteredSubmissions.length
        const passed = filteredSubmissions.filter(sub => sub.runtime_status === 'passed').length
        const avgScore = total ? Math.round(filteredSubmissions.reduce((acc, sub) => acc + Number(sub.score || 0), 0) / total) : 0
        return { total, passed, avgScore }
    }, [filteredSubmissions])

    const batchReport = useMemo(() => {
        if (batchFilter === 'all') {
            return { label: 'Batch Report', totalStudents: 0, attendedStudents: 0, active: false }
        }

        const selectedBatch = batches.find(batch => batch.id === batchFilter)
        const batchStudentIds = new Set((selectedBatch?.student_ids || []).map(id => String(id)))
        const attendedStudents = new Set(
            submissions
                .filter(sub => batchStudentIds.has(String(sub.student_id)))
                .map(sub => String(sub.student_id))
        )

        return {
            label: selectedBatch?.batch_name || 'Batch Report',
            totalStudents: batchStudentIds.size,
            attendedStudents: attendedStudents.size,
            active: true,
        }
    }, [batchFilter, batches, submissions])

    const requirementLines = useMemo(() =>
        String(form.requirements || '').split('\n')
            .map(l => l.replace(/^[-*\d.)\s]+/, '').trim())
            .filter(l => l.length >= 4),
        [form.requirements]
    )

    function resetForm() {
        setForm({ title: '', description: '', requirements: '', attempt_limit: 1, rubric_json: {} })
        setFormErrors({})
        setEditing(null)
    }

    async function saveTest() {
        const nextErrors = {}
        if (!String(form.title || '').trim()) nextErrors.title = 'Title is required.'
        if (!String(form.description || '').trim()) nextErrors.description = 'Description is required.'
        if (!String(form.requirements || '').trim()) nextErrors.requirements = 'Requirements are required.'
        if (Object.keys(nextErrors).length) {
            setFormErrors(nextErrors)
            setToast({ type: 'error', message: 'Please fill all required fields.' })
            return
        }

        const url = editing ? `${API}/admin/frontend-evals/tests/${editing.id}` : `${API}/admin/frontend-evals/tests`
        const method = editing ? 'PUT' : 'POST'
        const res = await fetch(url, {
            method,
            headers: authHeader(),
            body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Failed to save test' })
            return
        }
        setToast({ type: 'success', message: editing ? 'Frontend evaluation updated' : 'Frontend evaluation created' })
        resetForm()
        loadData()
    }

    async function act(testId, action) {
        const res = await fetch(`${API}/admin/frontend-evals/tests/${testId}/${action}`, { method: 'POST', headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || `Failed to ${action}` })
            return
        }
        setToast({ type: 'success', message: action === 'go-live' ? 'Test is now live' : 'Test ended' })
        loadData()
    }

    async function remove(testId) {
        if (!window.confirm('Delete this frontend evaluation and its submissions?')) return
        const res = await fetch(`${API}/admin/frontend-evals/tests/${testId}`, { method: 'DELETE', headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Delete failed' })
            return
        }
        setToast({ type: 'success', message: 'Frontend evaluation deleted' })
        loadData()
    }

    async function openReport(id) {
        const res = await fetch(`${API}/admin/frontend-evals/submissions/${id}`, { headers: authHeader() })
        const data = await res.json()
        if (!res.ok || !data.success) {
            setToast({ type: 'error', message: data.error || 'Failed to load report' })
            return
        }
        setReport(data.submission)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {toast ? <Toast item={toast} onClose={() => setToast(null)} /> : null}
            {assigning ? <AssignModal test={assigning} onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); loadData() }} /> : null}
            {report ? <ReportModal submission={report} onClose={() => setReport(null)} /> : null}

            <div style={{ background: 'linear-gradient(135deg, #082f49, #0f172a)', borderRadius: 22, border: '1px solid #1e3a5f', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ color: '#f8fafc', fontSize: 22, fontWeight: 900 }}>Frontend Evaluation</div>
                    <div style={{ color: '#94a3b8', marginTop: 4 }}>Create frontend use cases, assign students, evaluate uploaded HTML/CSS/JS projects, and review dedicated reports.</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setTab('tests')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #1e3a5f', background: tab === 'tests' ? '#0ea5e9' : '#0f172a', color: '#fff', cursor: 'pointer' }}>Tests</button>
                    <button onClick={() => setTab('submissions')} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid #1e3a5f', background: tab === 'submissions' ? '#0ea5e9' : '#0f172a', color: '#fff', cursor: 'pointer' }}>Submissions</button>
                </div>
            </div>

            {tab === 'tests' ? (
                <>
                    <div style={{ background: 'linear-gradient(135deg, #1a2a4e, #0f172a)', borderRadius: 20, border: '1px solid #1e3a5f', padding: 28, display: 'grid', gap: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #1e3a5f' }}>
                            <div>
                                <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 20 }}>{editing ? '✏️ Edit Use Case' : '➕ Create New Use Case'}</div>
                                <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Define frontend evaluation task for students</div>
                            </div>
                            {editing ? <button onClick={resetForm} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Cancel Edit</button> : null}
                        </div>

                        <div style={{ display: 'grid', gap: 16 }}>
                            {/* Title Field */}
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📌 Use Case Title *</label>
                                <input value={form.title} onChange={e => { setForm(prev => ({ ...prev, title: e.target.value })); if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' })) }} placeholder="e.g., E-Commerce Product Page" style={{ width: '100%', padding: '14px 16px', background: '#020617', border: `1px solid ${formErrors.title ? '#ef4444' : '#334155'}`, borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none', transition: 'border-color 0.2s ease' }} />
                                {formErrors.title ? <div style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '6px 8px' }}>{formErrors.title}</div> : null}
                                <div style={{ fontSize: 11, color: '#64748b' }}>A clear, concise title for the use case</div>
                            </div>

                            {/* Description Field */}
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Description *</label>
                                <textarea value={form.description} onChange={e => { setForm(prev => ({ ...prev, description: e.target.value })); if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' })) }} rows={3} placeholder="Describe what students need to build..." style={{ width: '100%', padding: '14px 16px', background: '#020617', border: `1px solid ${formErrors.description ? '#ef4444' : '#334155'}`, borderRadius: 12, color: '#e2e8f0', fontSize: 15, resize: 'vertical', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s ease' }} />
                                {formErrors.description ? <div style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '6px 8px' }}>{formErrors.description}</div> : null}
                                <div style={{ fontSize: 11, color: '#64748b' }}>Provide context and overview of the task</div>
                            </div>

                            {/* Requirements Field */}
                            <div style={{ display: 'grid', gap: 8 }}>
                                <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Requirements & Features *</label>
                                <textarea value={form.requirements} onChange={e => { setForm(prev => ({ ...prev, requirements: e.target.value })); if (formErrors.requirements) setFormErrors(prev => ({ ...prev, requirements: '' })) }} rows={4} placeholder="• List expected features&#10;• Include technical requirements&#10;• Specify any constraints or must-haves" style={{ width: '100%', padding: '14px 16px', background: '#020617', border: `1px solid ${formErrors.requirements ? '#ef4444' : '#334155'}`, borderRadius: 12, color: '#e2e8f0', fontSize: 15, resize: 'vertical', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s ease' }} />
                                {formErrors.requirements ? <div style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '6px 8px' }}>{formErrors.requirements}</div> : null}
                                <div style={{ fontSize: 11, color: '#64748b' }}>Use line breaks for each requirement</div>
                            </div>

                            {/* Rubric Weights */}
                            {requirementLines.length > 0 ? (
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Requirement Weights <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(toggle each line's priority)</span></label>
                                    <div style={{ display: 'grid', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 2 }}>
                                        {requirementLines.map((line, i) => {
                                            const weight = (form.rubric_json || {})[line] || 'must'
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#020617', borderRadius: 10, border: `1px solid ${weight === 'must' ? '#334155' : '#1e3a5f'}` }}>
                                                    <div style={{ flex: 1, color: '#e2e8f0', fontSize: 13, lineHeight: 1.4 }}>{line}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, rubric_json: { ...(prev.rubric_json || {}), [line]: (prev.rubric_json || {})[line] === 'nice' ? 'must' : 'nice' } }))}
                                                        style={{ border: 'none', borderRadius: 8, padding: '5px 10px', fontWeight: 800, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', background: weight === 'must' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#334155', color: '#fff' }}
                                                    >
                                                        {weight === 'must' ? '★ Must Have' : '◎ Nice to Have'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Must Have requirements are weighted more heavily in evaluation scoring</div>
                                </div>
                            ) : null}

                            {/* Attempt Limit & Submit */}
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'flex-end' }}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔄 Attempt Limit</label>
                                    <input type="number" min="1" value={form.attempt_limit ?? ''} onChange={e => setForm(prev => ({ ...prev, attempt_limit: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g., 3" style={{ width: '100%', padding: '14px 16px', background: '#020617', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none' }} />
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Leave empty for unlimited</div>
                                </div>
                                <button onClick={saveTest} style={{ padding: '14px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #0ea5e9)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
                                    <Plus size={18} /> {editing ? 'Update Use Case' : 'Create Use Case'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                            {[1, 2, 3].map(id => (
                                <div key={id} style={{ background: '#0f172a', borderRadius: 20, border: '1px solid #1e293b', padding: 20, display: 'grid', gap: 12 }}>
                                    <div style={{ height: 18, width: '52%', borderRadius: 8, background: '#1e293b' }} />
                                    <div style={{ height: 12, width: '84%', borderRadius: 8, background: '#1e293b' }} />
                                    <div style={{ height: 12, width: '70%', borderRadius: 8, background: '#1e293b' }} />
                                    <div style={{ height: 74, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        <div style={{ height: 58, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                                        <div style={{ height: 58, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                                        <div style={{ height: 58, borderRadius: 12, background: '#111827', border: '1px solid #1e293b' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                            {tests.map(test => {
                                const status = STATUS_META[test.status] || STATUS_META.draft
                                return (
                                    <div key={test.id} style={{ background: 'linear-gradient(135deg, #0f172a, #020617)', borderRadius: 20, border: '1px solid #1e293b', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                                        {/* Header with Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: 17, marginBottom: 6 }}>{test.title}</div>
                                                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{test.description?.slice(0, 90) || 'No description provided.'}</div>
                                            </div>
                                            <div style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 8, background: status.bg, color: status.color, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{status.label}</div>
                                        </div>

                                        {/* Requirements Preview */}
                                        <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 14, padding: 14 }}>
                                            <div style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>📋 Requirements</div>
                                            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                                                {test.requirements?.split('\n').slice(0, 2).map((line, i) => (
                                                    <div key={i}>{line.trim().slice(0, 60)}</div>
                                                )) || <em>No requirements added yet.</em>}
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                            <div style={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b', padding: 12, textAlign: 'center' }}>
                                                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Attempts</div>
                                                <div style={{ color: '#38bdf8', fontSize: 18, fontWeight: 900 }}>{test.attempt_limit ?? '∞'}</div>
                                            </div>
                                            <div style={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b', padding: 12, textAlign: 'center' }}>
                                                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Assigned</div>
                                                <div style={{ color: '#10b981', fontSize: 18, fontWeight: 900 }}>{test.assigned_count || assignedMap[test.id]?.length || 0}</div>
                                            </div>
                                            <div style={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b', padding: 12, textAlign: 'center' }}>
                                                <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Submitted</div>
                                                <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 900 }}>{test.submissions_count || 0}</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                            <button onClick={() => setEditing(test) || setForm({ title: test.title, description: test.description || '', requirements: test.requirements || '', attempt_limit: test.attempt_limit, rubric_json: safeJson(test.rubric_json, {}) })} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: 12, transition: 'all 0.2s' }}>✏️ Edit</button>
                                            <button onClick={() => setAssigning(test)} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}><Users size={14} />Assign</button>
                                            <button onClick={() => remove(test.id)} style={{ padding: '11px 12px', borderRadius: 10, border: '1px solid #7f1d1d', background: '#2a0d0d', color: '#fca5a5', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}><Trash2 size={14} />Delete</button>
                                        </div>

                                        {/* Status Action Button */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                            {test.status === 'active'
                                                ? <button onClick={() => act(test.id, 'end')} style={{ padding: '12px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}><Square size={14} />End Test</button>
                                                : <button onClick={() => act(test.id, 'go-live')} style={{ padding: '12px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #166534, #22c55e)', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}><Play size={14} />Go Live</button>}
                                            <div style={{ padding: '12px 12px', borderRadius: 10, border: '1px solid #1e293b', background: '#020617', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}><FileCode2 size={14} />Frontend</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Filtered Submissions</div>
                            <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{submissionStats.total}</div>
                        </div>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Runtime Passed</div>
                            <div style={{ color: '#34d399', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{submissionStats.passed}</div>
                        </div>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Average Score</div>
                            <div style={{ color: '#38bdf8', fontSize: 26, fontWeight: 900, marginTop: 4 }}>{submissionStats.avgScore}</div>
                            {batchReport.active ? (
                                <div style={{ color: '#60a5fa', fontSize: 12, marginTop: 6 }}>
                                    {batchReport.label}: {batchReport.attendedStudents}/{batchReport.totalStudents} attended
                                </div>
                            ) : (
                                <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>Select a batch to see attendance</div>
                            )}
                        </div>
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 12 }}>
                            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Batch Attendance</div>
                            <div style={{ color: batchReport.active ? '#a78bfa' : '#94a3b8', fontSize: 26, fontWeight: 900, marginTop: 4 }}>
                                {batchReport.active ? `${batchReport.attendedStudents}/${batchReport.totalStudents}` : '—'}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                                {batchReport.active ? `${batchReport.label} students attended` : 'Filter by batch to view report'}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e293b', padding: 12, display: 'grid', gridTemplateColumns: '1.5fr 0.9fr 0.8fr 0.8fr auto', gap: 10 }}>
                        <input
                            value={submissionQuery}
                            onChange={e => setSubmissionQuery(e.target.value)}
                            placeholder="Search student, test, or type"
                            style={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', padding: '10px 12px', outline: 'none' }}
                        />
                        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', padding: '10px 12px', outline: 'none' }}>
                            <option value="all">All Batches</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.batch_name}</option>
                            ))}
                        </select>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>👤 Student / Test</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📦 Type</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>⭐ Score</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>▶️ Runtime</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>⏰ Submitted</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>👁️ View</div>
                        </div>
                        {filteredSubmissions.map((sub, idx) => (
                            <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 110px 120px 190px 80px', gap: 16, padding: '16px 24px', alignItems: 'center', borderBottom: idx === filteredSubmissions.length - 1 ? 'none' : '1px solid #111827', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{sub.student_name || 'Student'}</div>
                                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>📋 {sub.test_title}</div>
                                    <div style={{ color: '#60a5fa', fontSize: 11, marginTop: 4 }}>
                                        Batch: {(batchStudentLookup[String(sub.student_id)] || []).join(', ') || 'Unassigned'}
                                    </div>
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: 13, background: sub.submission_type === 'zip' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)', padding: '6px 10px', borderRadius: 8, fontWeight: 600 }}>{sub.submission_type === 'zip' ? '📦 ZIP' : '📁 Multi-file'}</div>
                                <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: 16 }}>{Math.round(sub.score || 0)}</div>
                                <div style={{ color: sub.runtime_status === 'passed' ? '#34d399' : sub.runtime_status === 'failed' ? '#f87171' : '#fbbf24', fontWeight: 700, background: sub.runtime_status === 'passed' ? 'rgba(52, 211, 153, 0.1)' : sub.runtime_status === 'failed' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)', padding: '6px 10px', borderRadius: 8 }}>
                                    {sub.runtime_status === 'passed' ? '✅ Passed' : sub.runtime_status === 'failed' ? '❌ Failed' : '⏸ Skipped'}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleString()}</div>
                                <button onClick={() => openReport(sub.id)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #334155', background: '#111827', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}><Eye size={14} />View</button>
                            </div>
                        ))}
                        {!filteredSubmissions.length ? <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                            <div>No submissions match current filters.</div>
                        </div> : null}
                    </div>
                </div>
            )}
        </div>
    )
}
