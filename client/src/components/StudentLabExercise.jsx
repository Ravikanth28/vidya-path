import React, { useState, useEffect, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import {
    FlaskConical, Play, CheckCircle, XCircle, Clock, FileText, ChevronRight,
    X, Plus, Trash2, Eye, RefreshCw, Award, AlertTriangle, Code, Layers,
    Maximize2, Minimize2, FolderOpen, FilePlus, FolderPlus, Save, Send,
    Zap, Target, BookOpen, RotateCcw, LogOut, ChevronDown, ChevronUp,
    Shield, BarChart2, Brain
} from 'lucide-react'
import { useAuth } from '../App'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'
const H = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' })

const LAB_TYPES = {
    programming: { label: 'Programming Lab', icon: '💻', color: '#3b82f6' },
    ml: { label: 'ML Lab', icon: '🤖', color: '#8b5cf6' },
    dl: { label: 'DL Lab', icon: '🧠', color: '#ec4899' },
    sql: { label: 'SQL Lab', icon: '🗄️', color: '#06b6d4' },
    web: { label: 'Web Lab', icon: '🌐', color: '#10b981' },
    ds: { label: 'Data Structures', icon: '📊', color: '#f59e0b' },
}

const LANG_MAP = {
    python: 'python', py: 'python',
    javascript: 'javascript', js: 'javascript',
    java: 'java',
    c: 'c',
    cpp: 'cpp', 'c++': 'cpp',
    sql: 'sql',
    html: 'html',
    css: 'css',
    r: 'r',
    shell: 'shell', sh: 'shell', bash: 'shell',
    none: 'plaintext',
}

const LANG_ICONS = { python: '🐍', javascript: '🟨', java: '☕', c: '🔷', cpp: '🔷', sql: '🗄️', html: '🌐', css: '🎨', r: '📉', shell: '💲', plaintext: '📄' }

const DEFAULT_FILES = {
    python: [{ name: 'main.py', content: '# Write your Python solution here\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()\n', language: 'python' }],
    java: [{ name: 'Solution.java', content: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n', language: 'java' }],
    c: [{ name: 'solution.c', content: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n', language: 'c' }],
    cpp: [{ name: 'solution.cpp', content: '#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n', language: 'cpp' }],
    javascript: [{ name: 'solution.js', content: '// Write your JavaScript solution here\n\nfunction solution() {\n    \n}\n\nsolution();\n', language: 'javascript' }],
    sql: [{ name: 'query.sql', content: '-- Write your SQL query here\n-- Schema will be provided in the question\n\nSELECT * FROM table_name;\n', language: 'sql' }],
    html: [{ name: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Solution</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <!-- Write your HTML here -->\n    <script src="app.js"></script>\n</body>\n</html>\n', language: 'html' }, { name: 'style.css', content: '/* Write your CSS here */\n', language: 'css' }, { name: 'app.js', content: '// Write your JavaScript here\n', language: 'javascript' }],
    none: [{ name: 'solution.txt', content: '# Write your solution here\n', language: 'plaintext' }],
}

function getDefaultFiles(lang) {
    const key = (lang || 'none').toLowerCase()
    return (DEFAULT_FILES[key] || DEFAULT_FILES.none).map(f => ({ ...f, id: Date.now() + Math.random(), folderId: null }))
}

function getMonacoLang(filename) {
    const ext = (filename || '').split('.').pop()?.toLowerCase()
    return LANG_MAP[ext] || 'plaintext'
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentLabExercise() {
    const { user } = useAuth()
    const [tab, setTab] = useState('tests')
    const [exercises, setExercises] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(false)
    const [activeTest, setActiveTest] = useState(null) // exercise open in editor
    const [toast, setToast] = useState(null)
    const [viewReport, setViewReport] = useState(null)

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }, [])

    const loadExercises = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API}/student/lab-exercises`, { headers: H() })
            const d = await r.json()
            setExercises(d.exercises || [])
        } catch { showToast('Failed to load exercises', 'error') }
        finally { setLoading(false) }
    }, [showToast])

    const loadSubmissions = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API}/student/lab-submissions`, { headers: H() })
            const d = await r.json()
            setSubmissions(d.submissions || [])
        } catch { showToast('Failed to load submissions', 'error') }
        finally { setLoading(false) }
    }, [showToast])

    useEffect(() => {
        if (tab === 'tests') loadExercises()
        if (tab === 'submissions') loadSubmissions()
    }, [tab, loadExercises, loadSubmissions])

    if (activeTest) {
        return (
            <LabCodeEditor
                exercise={activeTest}
                user={user}
                onExit={() => { setActiveTest(null); loadExercises() }}
                showToast={showToast}
            />
        )
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            {toast && <FloatToast msg={toast.msg} type={toast.type} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FlaskConical size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Lab Exercises</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Hands-on coding labs assigned to you</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid var(--border-color)', width: 'fit-content' }}>
                {[['tests', 'My Tests', <FlaskConical size={15} />], ['submissions', 'My Submissions', <FileText size={15} />]].map(([v, l, ic]) => (
                    <button key={v} onClick={() => setTab(v)} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                        borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: tab === v ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                        color: tab === v ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
                    }}>{ic} {l}</button>
                ))}
            </div>

            {/* ── Tests Tab ── */}
            {tab === 'tests' && (
                <div>
                    {loading ? <Spinner /> : exercises.length === 0 ? (
                        <EmptyState icon={<FlaskConical size={52} />} text="No exercises assigned" sub="Your instructor hasn't assigned any lab exercises yet. Check back later." />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
                            {exercises.map(ex => (
                                <ExerciseTestCard
                                    key={ex.id} ex={ex}
                                    onStart={() => setActiveTest(ex)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Submissions Tab ── */}
            {tab === 'submissions' && (
                <div>
                    {loading ? <Spinner /> : submissions.length === 0 ? (
                        <EmptyState icon={<FileText size={52} />} text="No submissions yet" sub="Complete your first lab exercise to see results here." />
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {submissions.map(s => (
                                <SubmissionRow key={s.id} s={s} onViewReport={() => setViewReport(s)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {viewReport && <StudentReportModal sub={viewReport} onClose={() => setViewReport(null)} />}
        </div>
    )
}

// ─── Exercise Card for Student ────────────────────────────────────────────────
function ExerciseTestCard({ ex, onStart }) {
    const info = LAB_TYPES[ex.lab_type] || LAB_TYPES.programming
    const attemptsUsed = ex.attempts_used || 0
    const maxAttempts = ex.max_attempts || 3
    const canAttempt = ex.status === 'active' && attemptsUsed < maxAttempts

    const lang = (ex.language || 'none').toLowerCase()
    const langIcon = LANG_ICONS[LANG_MAP[lang] || 'plaintext'] || '📄'

    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid var(--border-color)`,
            borderRadius: 18, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
            borderTop: `3px solid ${info.color}`,
        }}>
            <div style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{info.icon}</span>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: info.color, textTransform: 'uppercase', letterSpacing: 1 }}>{info.label}</div>
                            {ex.language !== 'none' && ex.language && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{langIcon} {ex.language?.toUpperCase()}</div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {ex.ever_passed ? (
                            <span style={{ fontSize: 11, padding: '3px 8px', background: '#052e16', color: '#34d399', borderRadius: 6, fontWeight: 700 }}>✅ Passed</span>
                        ) : attemptsUsed > 0 ? (
                            <span style={{ fontSize: 11, padding: '3px 8px', background: '#3b0d0d', color: '#f87171', borderRadius: 6, fontWeight: 700 }}>❌ Attempted</span>
                        ) : (
                            <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 6, fontWeight: 700 }}>📋 New</span>
                        )}
                        {ex.due_date && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> Due {new Date(ex.due_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>{ex.title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ex.description || 'No description'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                        { label: 'Attempts', val: `${attemptsUsed}/${maxAttempts}`, color: attemptsUsed >= maxAttempts ? '#ef4444' : 'var(--text-muted)' },
                        { label: 'Best Score', val: ex.best_score != null ? `${ex.best_score}%` : '—', color: ex.best_score >= 60 ? '#10b981' : 'var(--text-muted)' },
                        { label: 'Time Limit', val: ex.time_limit > 0 ? `${ex.time_limit}m` : 'None', color: 'var(--text-muted)' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {ex.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {ex.tags.slice(0, 4).map((tag, i) => (
                            <span key={i} style={{ fontSize: 11, background: `${info.color}15`, color: info.color, padding: '3px 8px', borderRadius: 5, fontWeight: 600 }}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)' }}>
                {!canAttempt ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '4px 0' }}>
                        {ex.status !== 'active' ? '⏹ Exercise not active' : `🔒 Max attempts (${maxAttempts}) reached`}
                    </div>
                ) : (
                    <button onClick={onStart} style={{
                        width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`, border: 'none', borderRadius: 10,
                        color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15, transition: 'opacity 0.2s'
                    }}>
                        <Play size={17} /> {attemptsUsed > 0 ? 'Retry Exercise' : 'Start Exercise'}
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Lab Code Editor (Fullscreen) ─────────────────────────────────────────────
function LabCodeEditor({ exercise: ex, user, onExit, showToast }) {
    const [files, setFiles] = useState(() => getDefaultFiles(ex.language))
    const [activeFile, setActiveFile] = useState(null)
    const [newFileName, setNewFileName] = useState('')
    const [showNewFile, setShowNewFile] = useState(false)
    const [folders, setFolders] = useState([]) // [{ id, name }]
    const [expandedFolders, setExpandedFolders] = useState(new Set())
    const [newFolderName, setNewFolderName] = useState('')
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [newFileFolder, setNewFileFolder] = useState(null) // folderId for new file
    const [violationBanner, setViolationBanner] = useState(null)
    const [questionOpen, setQuestionOpen] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null) // null | evaluation result
    const [violations, setViolations] = useState([])
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [exitConfirm, setExitConfirm] = useState(false)
    const startTimeRef = useRef(Date.now())
    const proctoringRef = useRef({ violations: [] })
    const containerRef = useRef(null)

    // Set first file as active
    useEffect(() => { if (files.length > 0 && !activeFile) setActiveFile(files[0]) }, [files, activeFile])

    // Update activeFile reference when files change
    useEffect(() => {
        if (activeFile) {
            const updated = files.find(f => f.id === activeFile.id)
            if (updated && updated !== activeFile) setActiveFile(updated)
        }
    }, [files, activeFile])

    // Timer
    useEffect(() => {
        const t = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            setTimeElapsed(elapsed)
            // Time limit check
            if (ex.time_limit > 0 && elapsed >= ex.time_limit * 60) {
                clearInterval(t)
                showToast('⏰ Time is up! Auto-submitting...', 'warn')
                handleSubmit()
            }
        }, 1000)
        return () => clearInterval(t)
    }, [])

    // Proctoring setup
    useEffect(() => {
        const proctoring = ex.proctoring || {}
        const handlers = []

        // Tab switch detection
        if (proctoring.tab_switch || proctoring.warn_on_blur) {
            const onBlur = () => {
                proctoringRef.current.violations = [...proctoringRef.current.violations, { type: 'tab_switch', time: new Date().toISOString() }]
                setViolations(v => [...v, { type: 'Tab switch detected', time: new Date().toLocaleTimeString() }])
                setViolationBanner('⚠️ Tab Switch Detected!')
                setTimeout(() => setViolationBanner(null), 2500)
                showToast('⚠️ Warning: Tab switch detected!', 'warn')
            }
            document.addEventListener('visibilitychange', () => { if (document.hidden) onBlur() })
            window.addEventListener('blur', onBlur)
            handlers.push(() => { window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onBlur) })
        }

        // Disable copy/paste — paste is blocked everywhere (including Monaco);
        // copy/cut are still allowed inside the editor so students can copy their own code.
        if (proctoring.disable_copy_paste) {
            const blockPaste = (e) => {
                e.preventDefault()
                e.stopPropagation()
                showToast('⚠️ Paste is disabled!', 'warn')
                proctoringRef.current.violations = [...proctoringRef.current.violations, { type: 'paste_attempt', time: new Date().toISOString() }]
                setViolations(v => [...v, { type: 'Paste attempt blocked', time: new Date().toLocaleTimeString() }])
            }
            const blockCopyOutside = (e) => { if (!isInEditor(e.target)) { e.preventDefault(); showToast('⚠️ Copy/Paste is disabled', 'warn') } }
            const blockKeys = (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
                    // Block paste everywhere including Monaco — use capture so we intercept before Monaco
                    e.preventDefault(); e.stopPropagation()
                    showToast('⚠️ Paste is disabled!', 'warn')
                    proctoringRef.current.violations = [...proctoringRef.current.violations, { type: 'paste_attempt', time: new Date().toISOString() }]
                    setViolations(v => [...v, { type: 'Paste attempt blocked', time: new Date().toLocaleTimeString() }])
                } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x') && !isInEditor(e.target)) {
                    // Block copy/cut only outside the editor
                    e.preventDefault(); showToast('⚠️ Copy/Paste is disabled', 'warn')
                }
            }
            document.addEventListener('paste', blockPaste, true)
            document.addEventListener('copy', blockCopyOutside)
            document.addEventListener('keydown', blockKeys, true)
            handlers.push(() => {
                document.removeEventListener('paste', blockPaste, true)
                document.removeEventListener('copy', blockCopyOutside)
                document.removeEventListener('keydown', blockKeys, true)
            })
        }

        // Disable F12 and DevTools
        if (proctoring.disable_f12) {
            const noF12 = (e) => {
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
                    e.preventDefault()
                    proctoringRef.current.violations = [...proctoringRef.current.violations, { type: 'devtools_attempt', time: new Date().toISOString() }]
                    setViolations(v => [...v, { type: 'DevTools attempt blocked', time: new Date().toLocaleTimeString() }])
                    showToast('⚠️ Developer tools are disabled', 'warn')
                }
            }
            document.addEventListener('keydown', noF12)
            handlers.push(() => document.removeEventListener('keydown', noF12))
        }

        // Disable right click
        if (proctoring.disable_right_click) {
            const noContext = (e) => { e.preventDefault() }
            document.addEventListener('contextmenu', noContext)
            handlers.push(() => document.removeEventListener('contextmenu', noContext))
        }

        // Fullscreen enforcement
        if (proctoring.fullscreen) {
            const enterFullscreen = async () => {
                try {
                    await document.documentElement.requestFullscreen()
                    setIsFullscreen(true)
                } catch { }
            }
            const onFsChange = () => {
                if (!document.fullscreenElement) {
                    setIsFullscreen(false)
                    proctoringRef.current.violations = [...proctoringRef.current.violations, { type: 'fullscreen_exit', time: new Date().toISOString() }]
                    setViolations(v => [...v, { type: 'Exited fullscreen', time: new Date().toLocaleTimeString() }])
                    setViolationBanner('⚠️ Please Return to Fullscreen!')
                    setTimeout(() => setViolationBanner(null), 3000)
                    showToast('⚠️ Please stay in fullscreen mode!', 'warn')
                    setTimeout(enterFullscreen, 1500)
                }
            }
            enterFullscreen()
            document.addEventListener('fullscreenchange', onFsChange)
            handlers.push(() => {
                document.removeEventListener('fullscreenchange', onFsChange)
                if (document.fullscreenElement) document.exitFullscreen().catch(() => { })
            })
        }

        return () => handlers.forEach(h => h())
    }, [ex.proctoring])

    function isInEditor(target) {
        return target?.closest?.('.monaco-editor') != null
    }

    const updateFileContent = (content) => {
        if (!activeFile) return
        setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content } : f))
        setActiveFile(prev => ({ ...prev, content }))
    }

    const addFile = () => {
        if (!newFileName.trim()) return
        const name = newFileName.trim()
        if (files.some(f => f.name === name && f.folderId === newFileFolder)) return showToast('File already exists', 'error')
        const newFile = { id: Date.now(), name, content: '', language: getMonacoLang(name), folderId: newFileFolder }
        setFiles(prev => [...prev, newFile])
        setActiveFile(newFile)
        setNewFileName('')
        setShowNewFile(false)
        setNewFileFolder(null)
    }

    const addFolder = () => {
        if (!newFolderName.trim()) return
        const name = newFolderName.trim()
        if (folders.some(f => f.name === name)) return showToast('Folder already exists', 'error')
        const id = String(Date.now())
        setFolders(prev => [...prev, { id, name }])
        setExpandedFolders(prev => new Set([...prev, id]))
        setNewFolderName('')
        setShowNewFolder(false)
    }

    const deleteFolder = (folderId) => {
        setFiles(prev => prev.map(f => f.folderId === folderId ? { ...f, folderId: null } : f))
        setFolders(prev => prev.filter(f => f.id !== folderId))
    }

    const toggleFolder = (id) => {
        setExpandedFolders(prev => {
            const n = new Set(prev)
            n.has(id) ? n.delete(id) : n.add(id)
            return n
        })
    }

    const deleteFile = (id) => {
        if (files.length <= 1) return showToast('Need at least one file', 'error')
        const remaining = files.filter(f => f.id !== id)
        setFiles(remaining)
        if (activeFile?.id === id) setActiveFile(remaining[0])
    }

    const handleSubmit = async () => {
        if (submitting) return
        setSubmitting(true)
        try {
            const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
            const r = await fetch(`${API}/student/lab-exercises/${ex.id}/submit`, {
                method: 'POST', headers: H(),
                body: JSON.stringify({
                    files: files.map(f => ({ name: f.name, content: f.content || '' })),
                    language: ex.language || '',
                    time_taken: timeTaken,
                    violations: proctoringRef.current.violations
                })
            })
            const d = await r.json()
            if (!r.ok) return showToast(d.error || 'Submission failed', 'error')
            setResult(d)
        } catch (err) {
            showToast('Submission failed: ' + err.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const formatTime = (s) => {
        const m = Math.floor(s / 60), sec = s % 60
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }

    const timeRemaining = ex.time_limit > 0 ? ex.time_limit * 60 - timeElapsed : null
    const timeColor = timeRemaining != null ? (timeRemaining < 120 ? '#ef4444' : timeRemaining < 300 ? '#f59e0b' : '#10b981') : '#64748b'

    // If result is shown
    if (result) {
        return (
            <ResultScreen
                result={result}
                exercise={ex}
                onRetry={() => { setResult(null); setFiles(getDefaultFiles(ex.language)); setActiveFile(null) }}
                onExit={onExit}
                violations={violations}
            />
        )
    }

    return (
        <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#0a0f1a', display: 'flex', flexDirection: 'column', zIndex: 8000, fontFamily: 'var(--font-sans, system-ui)' }}>

            {/* ── Top Bar ── */}
            <div style={{ height: 48, background: '#0d1626', borderBottom: '1px solid #1e3457', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{LAB_TYPES[ex.lab_type]?.icon || '💻'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.title}</span>
                </div>

                <div style={{ width: 1, height: 24, background: '#1e3457' }} />

                {/* Lang badge */}
                {ex.language && ex.language !== 'none' && (
                    <span style={{ fontSize: 12, background: '#1e3457', color: '#60a5fa', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                        {LANG_ICONS[LANG_MAP[ex.language?.toLowerCase()] || 'plaintext']} {ex.language?.toUpperCase()}
                    </span>
                )}

                {/* Timer */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: timeColor, fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
                        <Clock size={15} />
                        {timeRemaining != null ? formatTime(Math.max(0, timeRemaining)) : formatTime(timeElapsed)}
                        {timeRemaining != null && <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'inherit' }}>remaining</span>}
                    </div>

                    {violations.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>
                            <Shield size={14} /> {violations.length} violation{violations.length > 1 ? 's' : ''}
                        </div>
                    )}

                    <button onClick={() => setExitConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                        <LogOut size={14} /> Exit
                    </button>
                    <button onClick={handleSubmit} disabled={submitting}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
                        {submitting ? 'Evaluating...' : 'Submit'}
                    </button>
                </div>
            </div>

            {/* ── Main Area ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Left: File Tree ── */}
                <div style={{ width: 230, background: '#0d1626', borderRight: '1px solid #1e3457', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    {/* Header */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e3457', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Explorer</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button title="New File" onClick={() => { setShowNewFile(!showNewFile); setShowNewFolder(false); setNewFileFolder(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 3, borderRadius: 4 }}>
                                <FilePlus size={14} />
                            </button>
                            <button title="New Folder" onClick={() => { setShowNewFolder(!showNewFolder); setShowNewFile(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: 3, borderRadius: 4 }}>
                                <FolderPlus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* New File Input */}
                    {showNewFile && (
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e3457', background: '#111827' }}>
                            {folders.length > 0 && (
                                <select value={newFileFolder || ''} onChange={e => setNewFileFolder(e.target.value || null)}
                                    style={{ width: '100%', marginBottom: 6, background: '#162032', border: '1px solid #1e3457', borderRadius: 5, color: '#94a3b8', padding: '4px 6px', fontSize: 11 }}>
                                    <option value=''>📁 root</option>
                                    {folders.map(fo => <option key={fo.id} value={fo.id}>📁 {fo.name}</option>)}
                                </select>
                            )}
                            <div style={{ display: 'flex', gap: 5 }}>
                                <input value={newFileName} onChange={e => setNewFileName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addFile(); if (e.key === 'Escape') setShowNewFile(false) }}
                                    placeholder="filename.ext" autoFocus
                                    style={{ flex: 1, background: '#162032', border: '1px solid #3b82f6', borderRadius: 5, color: '#e2e8f0', padding: '4px 7px', fontSize: 12, outline: 'none' }} />
                                <button onClick={addFile} style={{ background: '#3b82f6', border: 'none', borderRadius: 5, color: 'white', cursor: 'pointer', padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>Add</button>
                            </div>
                        </div>
                    )}

                    {/* New Folder Input */}
                    {showNewFolder && (
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e3457', background: '#111827', display: 'flex', gap: 5 }}>
                            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') addFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
                                placeholder="folder name" autoFocus
                                style={{ flex: 1, background: '#162032', border: '1px solid #f59e0b', borderRadius: 5, color: '#e2e8f0', padding: '4px 7px', fontSize: 12, outline: 'none' }} />
                            <button onClick={addFolder} style={{ background: '#d97706', border: 'none', borderRadius: 5, color: 'white', cursor: 'pointer', padding: '4px 8px', fontSize: 11, fontWeight: 700 }}>Add</button>
                        </div>
                    )}

                    {/* Tree */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                        {/* Root-level files */}
                        {files.filter(f => !f.folderId).map(f => (
                            <div key={f.id} onClick={() => setActiveFile(f)}
                                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', cursor: 'pointer',
                                    color: activeFile?.id === f.id ? '#e2e8f0' : '#94a3b8',
                                    background: activeFile?.id === f.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                                    borderLeft: `2px solid ${activeFile?.id === f.id ? '#3b82f6' : 'transparent'}`, transition: 'all 0.15s' }}>
                                <span style={{ flexShrink: 0, fontSize: 13 }}>{LANG_ICONS[getMonacoLang(f.name)] || '📄'}</span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>{f.name}</span>
                                {files.length > 1 && (
                                    <button onClick={e => { e.stopPropagation(); deleteFile(f.id) }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }} className="file-delete-btn">
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Folders */}
                        {folders.map(folder => {
                            const isOpen = expandedFolders.has(folder.id)
                            const folderFiles = files.filter(f => f.folderId === folder.id)
                            return (
                                <div key={folder.id}>
                                    {/* Folder row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', cursor: 'pointer', color: '#d1a345', transition: 'background 0.15s' }}
                                        onClick={() => toggleFolder(folder.id)}>
                                        {isOpen ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
                                        <FolderOpen size={14} color={isOpen ? '#fbbf24' : '#d97706'} />
                                        <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                                        <span style={{ fontSize: 10, color: '#475569' }}>{folderFiles.length}</span>
                                        <button onClick={e => { e.stopPropagation(); deleteFolder(folder.id) }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }} className="file-delete-btn">
                                            <X size={11} />
                                        </button>
                                    </div>
                                    {/* Files inside folder */}
                                    {isOpen && (
                                        <div>
                                            {folderFiles.map(f => (
                                                <div key={f.id} onClick={() => setActiveFile(f)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px 6px 30px', cursor: 'pointer',
                                                        color: activeFile?.id === f.id ? '#e2e8f0' : '#94a3b8',
                                                        background: activeFile?.id === f.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                                                        borderLeft: `2px solid ${activeFile?.id === f.id ? '#3b82f6' : 'transparent'}` }}>
                                                    <span style={{ flexShrink: 0, fontSize: 12 }}>{LANG_ICONS[getMonacoLang(f.name)] || '📄'}</span>
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>{f.name}</span>
                                                    <button onClick={e => { e.stopPropagation(); deleteFile(f.id) }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }} className="file-delete-btn">
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Add file to this folder shortcut */}
                                            <div onClick={() => { setNewFileFolder(folder.id); setShowNewFile(true); setShowNewFolder(false) }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 30px', cursor: 'pointer', color: '#334155', fontSize: 11 }}>
                                                <Plus size={10} /> new file
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Center: Editor Column ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                    {/* Question Panel (collapsible top) */}
                    <div style={{ background: '#0d1626', borderBottom: '1px solid #1e3457', flexShrink: 0, maxHeight: questionOpen ? '38%' : 38, transition: 'max-height 0.3s ease', overflow: 'hidden' }}>
                        <div
                            onClick={() => setQuestionOpen(!questionOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', cursor: 'pointer', borderBottom: questionOpen ? '1px solid #1e3457' : 'none' }}>
                            <BookOpen size={15} color="#8b5cf6" />
                            <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: '#c4b5fd' }}>Problem Statement</span>
                            {questionOpen ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                        </div>
                        {questionOpen && (
                            <div style={{ padding: '14px 18px', overflowY: 'auto', maxHeight: 'calc(38vh - 38px)' }}>
                                <h3 style={{ margin: '0 0 10px', color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700 }}>{ex.title}</h3>
                                {ex.description && <p style={{ margin: '0 0 10px', color: '#94a3b8', lineHeight: 1.65, fontSize: 13 }}>{ex.description}</p>}
                                {ex.instructions && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Instructions</div>
                                        <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{ex.instructions}</pre>
                                    </div>
                                )}
                                {ex.expected_output && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Expected Output</div>
                                        <pre style={{ margin: 0, background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, color: '#86efac', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: '1px solid #1e3457' }}>{ex.expected_output}</pre>
                                    </div>
                                )}
                                {ex.tags?.length > 0 && (
                                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {ex.tags.map((t, i) => <span key={i} style={{ fontSize: 11, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{t}</span>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* File Tabs Bar */}
                    <div style={{ background: '#0a0f1a', borderBottom: '1px solid #1e3457', display: 'flex', alignItems: 'center', overflowX: 'auto', flexShrink: 0, minHeight: 38 }}>
                        {files.map(f => (
                            <div
                                key={f.id}
                                onClick={() => setActiveFile(f)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'monospace',
                                    borderRight: '1px solid #1e3457',
                                    color: activeFile?.id === f.id ? '#e2e8f0' : '#64748b',
                                    background: activeFile?.id === f.id ? '#162032' : 'transparent',
                                    borderBottom: activeFile?.id === f.id ? '2px solid #3b82f6' : '2px solid transparent',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <span>{LANG_ICONS[getMonacoLang(f.name)] || '📄'}</span>
                                {f.name}
                            </div>
                        ))}
                    </div>

                    {/* Monaco Editor */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {activeFile && (
                            <Editor
                                key={activeFile.id}
                                height="100%"
                                language={getMonacoLang(activeFile.name)}
                                value={activeFile.content}
                                onChange={updateFileContent}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                    fontLigatures: true,
                                    minimap: { enabled: true },
                                    lineNumbers: 'on',
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                    suggestOnTriggerCharacters: true,
                                    formatOnPaste: true,
                                    tabSize: 4,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 12, bottom: 12 },
                                    bracketPairColorization: { enabled: true },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Violation Banner Overlay */}
            {violationBanner && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.12)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: '#1a0505', border: '2px solid #ef4444', borderRadius: 16, padding: '18px 32px', color: '#f87171', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 60px rgba(239,68,68,0.4)' }}>
                        <Shield size={22} /> {violationBanner}
                    </div>
                </div>
            )}

            {/* Exit Confirm Dialog */}
            {exitConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#0d1626', border: '1px solid #1e3457', borderRadius: 16, padding: 32, maxWidth: 420, textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                        <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: 16 }} />
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#e2e8f0', marginBottom: 10 }}>Exit Exercise?</div>
                        <div style={{ color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
                            Your code will not be saved or submitted. This attempt will be lost.<br />Are you sure you want to exit?
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setExitConfirm(false)} style={{ padding: '10px 24px', background: '#162032', border: '1px solid #1e3457', borderRadius: 9, color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>Stay</button>
                            <button onClick={() => { setExitConfirm(false); onExit() }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: 9, color: 'white', cursor: 'pointer', fontWeight: 700 }}>Exit</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
                .file-delete-btn { opacity: 0 !important; }
                div:hover > .file-delete-btn { opacity: 1 !important; }
            `}</style>
        </div>
    )
}

// ─── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({ result, exercise: ex, onRetry, onExit, violations }) {
    const passed = result.passed
    const [tab, setTab] = useState('feedback')

    return (
        <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui' }}>
            <div style={{ width: '100%', maxWidth: 720, background: '#0d1626', border: `2px solid ${passed ? '#10b981' : '#ef4444'}`, borderRadius: 24, overflow: 'hidden', boxShadow: `0 0 60px ${passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>

                {/* Result Header */}
                <div style={{ padding: '32px', background: passed ? 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)' : 'linear-gradient(135deg, rgba(239,68,68,0.1), transparent)', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 10 }}>{passed ? '🎉' : '💪'}</div>
                    <div style={{ fontWeight: 900, fontSize: '1.8rem', color: passed ? '#34d399' : '#f87171', marginBottom: 6 }}>
                        {passed ? 'Exercise Passed!' : 'Not Quite There'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 20 }}>
                        {ex.title}
                    </div>

                    {/* Score circle */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: '50%', border: `4px solid ${passed ? '#10b981' : '#ef4444'}`, background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: passed ? '#34d399' : '#f87171', lineHeight: 1 }}>{result.score}</div>
                            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>/ 100</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                        {[
                            { label: 'Attempt', val: `#${result.attempt_number}` },
                            { label: 'Remaining', val: result.attempts_remaining },
                            { label: 'Status', val: passed ? '✅ PASS' : '❌ FAIL' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>{s.val}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #1e3457' }}>
                    {[['feedback', 'AI Feedback'], ['breakdown', 'Breakdown'], violations.length > 0 && ['violations', `Violations (${violations.length})`]].filter(Boolean).map(([v, l]) => (
                        <button key={v} onClick={() => setTab(v)} style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: tab === v ? '#3b82f6' : '#64748b', borderBottom: tab === v ? '2px solid #3b82f6' : '2px solid transparent' }}>{l}</button>
                    ))}
                </div>

                <div style={{ padding: 24 }}>
                    {tab === 'feedback' && (
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                                <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Summary</div>
                                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.65 }}>{result.feedback?.summary}</p>
                            </div>
                            {result.feedback?.strengths?.length > 0 && (
                                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>✅ Strengths</div>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: '#86efac', lineHeight: 1.8, fontSize: 14 }}>
                                        {result.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {result.feedback?.issues?.length > 0 && (
                                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontWeight: 700, color: '#f87171', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⚠️ Issues Found</div>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: '#fca5a5', lineHeight: 1.8, fontSize: 14 }}>
                                        {result.feedback.issues.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {result.feedback?.suggestions?.length > 0 && (
                                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
                                    <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>💡 Suggestions</div>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: '#fde68a', lineHeight: 1.8, fontSize: 14 }}>
                                        {result.feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'breakdown' && result.feedback?.breakdown && (
                        <div style={{ display: 'grid', gap: 14 }}>
                            {Object.entries(result.feedback.breakdown).map(([k, v]) => {
                                const maxVal = k === 'correctness' ? 40 : k === 'code_quality' ? 20 : k === 'requirements_met' ? 25 : 15
                                const pct = Math.round((v / maxVal) * 100)
                                return (
                                    <div key={k}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, color: '#94a3b8', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{v} / {maxVal}</span>
                                        </div>
                                        <div style={{ height: 8, background: '#1e293b', borderRadius: 4 }}>
                                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)', transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {tab === 'violations' && (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {violations.map((v, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                                    <Shield size={15} color="#f59e0b" />
                                    <span style={{ color: '#fde68a', fontSize: 13 }}>{v.type}</span>
                                    <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{v.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #1e3457', display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={onExit} style={{ padding: '12px 28px', background: '#162032', border: '1px solid #1e3457', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                        Exit Exercise
                    </button>
                    {!passed && result.attempts_remaining > 0 && (
                        <button onClick={onRetry} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RotateCcw size={16} /> Try Again ({result.attempts_remaining} left)
                        </button>
                    )}
                    {passed && result.attempts_remaining > 0 && (
                        <button onClick={onRetry} style={{ padding: '12px 28px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: '#34d399', cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RotateCcw size={16} /> Try Again (optional)
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Submission Row ───────────────────────────────────────────────────────────
function SubmissionRow({ s, onViewReport }) {
    const info = LAB_TYPES[s.lab_type] || LAB_TYPES.programming
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{info.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{s.exercise_title}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 12 }}>
                    <span>{info.label}</span>
                    {s.language && <span style={{ background: '#1e3457', color: '#60a5fa', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{s.language.toUpperCase()}</span>}
                    <span>Attempt #{s.attempt_number}</span>
                    <span>{new Date(s.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.score >= 60 ? '#10b981' : '#ef4444' }}>{s.score}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 13, color: s.passed ? '#34d399' : '#f87171' }}>
                    {s.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {s.passed ? 'PASS' : 'FAIL'}
                </div>
                <button onClick={onViewReport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    <Eye size={14} /> View Report
                </button>
            </div>
        </div>
    )
}

// ─── Student Report Modal ─────────────────────────────────────────────────────
function StudentReportModal({ sub: s, onClose }) {
    const breakdown = s.ai_breakdown || {}
    const [viewFile, setViewFile] = useState(s.files?.[0] || null)
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: s.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                            {s.passed ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                            {s.exercise_title}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                            Attempt #{s.attempt_number} · {new Date(s.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 30, fontWeight: 900, color: s.score >= 60 ? '#10b981' : '#ef4444' }}>{s.score}%</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gap: 16 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>AI Feedback</div>
                        <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6 }}>{s.ai_feedback || 'No feedback'}</p>
                    </div>
                    {Object.keys(breakdown).length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Score Breakdown</div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {Object.entries(breakdown).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ width: 150, fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                        <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3 }}>
                                            <div style={{ width: `${Math.min(100, (v / 40) * 100)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                                        </div>
                                        <span style={{ width: 32, textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {s.files?.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 6, overflowX: 'auto' }}>
                                {s.files.map((f, i) => (
                                    <button key={i} onClick={() => setViewFile(f)} style={{ padding: '4px 10px', background: viewFile?.name === f.name ? '#3b82f6' : 'transparent', border: `1px solid ${viewFile?.name === f.name ? '#3b82f6' : 'var(--border-color)'}`, borderRadius: 6, color: viewFile?.name === f.name ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                            {viewFile && <pre style={{ margin: 0, padding: 16, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', maxHeight: 280, overflowY: 'auto' }}>{viewFile.content || '(empty)'}</pre>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FloatToast({ msg, type }) {
    const colors = { error: ['#3b0d0d', '#fca5a5'], success: ['#052e16', '#86efac'], info: ['#0c1a3a', '#60a5fa'], warn: ['#2d1b00', '#fde68a'] }
    const [bg, fg] = colors[type] || colors.info
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, background: bg, color: fg, padding: '12px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, maxWidth: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}>
            {msg}
        </div>
    )
}

function Spinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}

function EmptyState({ icon, text, sub }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, opacity: 0.35 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 6 }}>{text}</div>
            <div style={{ fontSize: 14 }}>{sub}</div>
        </div>
    )
}
