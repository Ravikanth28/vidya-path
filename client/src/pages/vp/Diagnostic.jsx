import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { Award, ChevronRight, Upload, User, ClipboardList, BarChart3, History, FileDown, GraduationCap, Layers, Mic, MicOff } from 'lucide-react'

/** Hook — returns { listening, toggle, supported } */
function useSpeechToText({ lang = 'en-IN', onResult }) {
    const recRef = useRef(null)
    const [listening, setListening] = useState(false)

    const supported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    const toggle = useCallback(() => {
        if (!supported) return
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (listening) {
            recRef.current?.stop()
            setListening(false)
            return
        }
        const rec = new SR()
        rec.lang = lang
        rec.interimResults = false
        rec.continuous = false
        rec.onresult = e => {
            const transcript = Array.from(e.results)
                .map(r => r[0].transcript).join(' ')
            onResult(transcript)
        }
        rec.onend = () => setListening(false)
        rec.onerror = () => setListening(false)
        recRef.current = rec
        rec.start()
        setListening(true)
    }, [supported, listening, lang, onResult])

    return { listening, toggle, supported }
}

const LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English-IN' },
    { code: 'hi', label: 'Hindi-IN' },
    { code: 'ta', label: 'Tamil-IN' },
    { code: 'bn', label: 'Bengali-IN' },
    { code: 'gu', label: 'Gujarati-IN' },
    { code: 'kn', label: 'Kannada-IN' },
    { code: 'ml', label: 'Malayalam-IN' },
    { code: 'mr', label: 'Marathi-IN' },
    { code: 'or', label: 'Odia-IN' },
    { code: 'pa', label: 'Punjabi-IN' },
    { code: 'te', label: 'Telugu-IN' },
    { code: 'ur', label: 'Urdu-IN' }
]

const SCHOOL_CLASSES = [8, 9, 10, 11, 12]
const COLLEGE_YEAR_SEM_OPTIONS = [
    { year: 1, semester: 1, label: 'I/1' },
    { year: 1, semester: 2, label: 'I/2' },
    { year: 2, semester: 3, label: 'II/3' },
    { year: 2, semester: 4, label: 'II/4' },
    { year: 3, semester: 5, label: 'III/5' },
    { year: 3, semester: 6, label: 'III/6' },
    { year: 4, semester: 7, label: 'IV/7' },
    { year: 4, semester: 8, label: 'IV/8' }
]

const SUBJECT_TOPIC_BANK = {
    mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics', 'Probability', 'Calculus'],
    science: ['Physics Basics', 'Chemistry Basics', 'Biology Basics', 'Motion', 'Matter', 'Energy'],
    physics: ['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Electrostatics', 'Current Electricity', 'Optics'],
    chemistry: ['Atomic Structure', 'Chemical Bonding', 'Stoichiometry', 'Acids and Bases', 'Organic Chemistry', 'Electrochemistry'],
    biology: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Evolution', 'Plant Physiology'],
    english: ['Grammar', 'Reading Comprehension', 'Vocabulary', 'Writing Skills', 'Literature'],
    aptitude: ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation', 'Verbal Ability'],
    programming: ['Variables and Data Types', 'Control Flow', 'Functions', 'Arrays and Strings', 'Object Oriented Programming'],
    'data structures': ['Arrays', 'Linked List', 'Stacks and Queues', 'Trees', 'Graphs', 'Hashing'],
    dbms: ['ER Model', 'Normalization', 'SQL Queries', 'Transactions', 'Indexing', 'Joins'],
    os: ['Process Management', 'Threads', 'Scheduling', 'Memory Management', 'Deadlocks', 'File Systems'],
    networks: ['OSI Model', 'TCP IP', 'Routing', 'Subnetting', 'HTTP and DNS', 'Network Security']
}

function buildTopicsFromSubject(subjectRaw) {
    const subject = String(subjectRaw || '').trim().toLowerCase()
    if (!subject) return []

    const seen = new Set()
    const out = []
    const add = (v) => {
        const s = String(v || '').trim()
        if (!s) return
        const k = s.toLowerCase()
        if (seen.has(k)) return
        seen.add(k)
        out.push(s)
    }

    const parts = subject.split(',').map(s => s.trim()).filter(Boolean)
    const keys = parts.length ? parts : [subject]
    for (const key of keys) {
        let matched = false
        for (const [bankKey, topics] of Object.entries(SUBJECT_TOPIC_BANK)) {
            if (key.includes(bankKey)) {
                matched = true
                topics.forEach(add)
            }
        }
        if (!matched) {
            add(`${key} Basics`)
            add(`${key} Core Concepts`)
            add(`${key} Applications`)
        }
    }
    return out.slice(0, 20)
}

export default function Diagnostic({ onDone }) {
    const { t, locale } = useI18n()
    const navigate = useNavigate()
    const [viewTab, setViewTab] = useState('take')
    const [mode, setMode] = useState('student_choice')
    const [teacherTests, setTeacherTests] = useState([])
    const [history, setHistory] = useState([])
    const [attempt, setAttempt] = useState(null)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [idx, setIdx] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingSyllabus, setUploadingSyllabus] = useState(false)
    const [report, setReport] = useState(null)
    const [plan, setPlan] = useState(null)
    const [done, setDone] = useState(false)
    const [viewAttemptId, setViewAttemptId] = useState(null)
    const [meta, setMeta] = useState({
        language: 'en',
        education_level: 'school',
        grade: 9,
        college_year: 1,
        semester: 1,
        subject: '',
        topic: '',
        syllabus_scope: 'whole_syllabus',
        unit_name: '',
        syllabus_text: ''
    })
    const [selectedTeacherTestId, setSelectedTeacherTestId] = useState('')
    const [syllabusFile, setSyllabusFile] = useState(null)
    const [syllabusUnits, setSyllabusUnits] = useState([])
    const [syllabusTopics, setSyllabusTopics] = useState([])
    const [subjectTopics, setSubjectTopics] = useState([])
    const [error, setError] = useState(null)
    const [diagUiText, setDiagUiText] = useState({ test: {}, result: {} })

    const captureError = (err, label = '') => {
        const status = err.response?.status
        const serverData = err.response?.data
        const info = {
            label,
            message: err.message,
            status,
            statusText: err.response?.statusText,
            url: err.config?.url,
            method: err.config?.method?.toUpperCase(),
            serverError: serverData?.error || serverData?.message || null,
            serverDetail: serverData?.detail || serverData?.stack || null,
            serverRaw: serverData ? JSON.stringify(serverData, null, 2) : null,
            clientStack: err.stack,
            timestamp: new Date().toISOString()
        }
        setError(info)
        console.error('[Diagnostic error]', info)
    }

    useEffect(() => {
        setMeta(m => ({ ...m, language: locale }))
    }, [locale])

    useEffect(() => {
        Promise.all([vpApi.diagState(), vpApi.diagTeacherTests(), vpApi.diagHistory()]).then(([s, tt, h]) => {
            setDone(!!s.done)
            setReport(s.result || null)
            setTeacherTests(tt.tests || [])
            setHistory(h.results || [])
        }).catch(() => {
            setTeacherTests([])
            setHistory([])
        })
    }, [])

    useEffect(() => {
        setSubjectTopics(buildTopicsFromSubject(meta.subject))
    }, [meta.subject])

    useEffect(() => {
        const lang = attempt?.language || meta.language || locale || 'en'
        vpApi.diagUiText(lang).then(r => setDiagUiText(r.text || { test: {}, result: {} })).catch(() => {})
    }, [attempt?.language, meta.language, locale])

    useEffect(() => {
        const options = syllabusTopics.length ? syllabusTopics : subjectTopics
        setMeta(prev => {
            const current = String(prev.topic || '')
            if (!options.length) {
                if (!current) return prev
                return { ...prev, topic: '' }
            }
            if (options.includes(current)) return prev
            return { ...prev, topic: options[0] }
        })
    }, [syllabusTopics, subjectTopics])

    const resetAttempt = () => {
        setAttempt(null)
        setQuestions([])
        setAnswers({})
        setIdx(0)
    }

    const refreshHistory = () => {
        vpApi.diagHistory().then(h => setHistory(h.results || [])).catch(() => {})
    }

    const uploadSyllabus = async () => {
        if (!syllabusFile) return setError({ label: 'Validation', message: 'Please upload a syllabus file first.', timestamp: new Date().toISOString() })
        setError(null)
        setUploadingSyllabus(true)
        try {
            const fd = new FormData()
            fd.append('file', syllabusFile)
            const res = await vpApi.diagSyllabusUpload(fd)
            const topics = (res.topics || res.keywords || []).filter(Boolean)
            setMeta(m => ({ ...m, syllabus_text: res.syllabus_text || '' }))
            setSyllabusUnits(res.units || [])
            setSyllabusTopics(topics)
            if ((res.units || []).length && !meta.unit_name) {
                setMeta(m => ({ ...m, unit_name: res.units[0] || '' }))
            }
        } catch (err) {
            captureError(err, 'Syllabus Upload')
        } finally {
            setUploadingSyllabus(false)
        }
    }

    const startStudentChoice = async () => {
        setError(null)
        try {
            if (!String(meta.subject || '').trim()) {
                return setError({ label: 'Validation', message: 'Please type a subject.', timestamp: new Date().toISOString() })
            }
            if (meta.education_level === 'college') {
                const expectedYear = Math.ceil(Number(meta.semester || 1) / 2)
                if (Number(meta.college_year) !== expectedYear) {
                    return setError({ label: 'Validation', message: 'Selected year and semester are not aligned.', timestamp: new Date().toISOString() })
                }
            }
            if (!String(meta.topic || '').trim()) {
                if (meta.syllabus_scope === 'unit_wise' && !String(meta.unit_name || '').trim()) {
                    return setError({ label: 'Validation', message: 'Please choose a unit for unit-wise diagnostic, or enter a topic.', timestamp: new Date().toISOString() })
                }
                if (!String(meta.syllabus_text || '').trim() && meta.education_level === 'college') {
                    return setError({ label: 'Validation', message: 'For college flow, upload syllabus or enter a topic.', timestamp: new Date().toISOString() })
                }
            }
            const r = await vpApi.diagStudentStart(meta)
            setMode('student_choice')
            setAttempt({ id: r.attempt_id, mode: 'student_choice', language: meta.language })
            setQuestions(r.question_paper || [])
            setAnswers({})
            setIdx(0)
            setDone(false)
        } catch (err) {
            captureError(err, 'Generate Test')
        }
    }

    const startTeacherTest = async () => {
        setError(null)
        if (!selectedTeacherTestId) return setError({ label: 'Validation', message: 'Select a teacher test first.', timestamp: new Date().toISOString() })
        try {
            const r = await vpApi.diagTeacherStart(selectedTeacherTestId)
            setMode('teacher_upload')
            setAttempt({ id: r.attempt_id, mode: 'teacher_upload', title: r.test?.title, language: r.test?.language || 'en' })
            setQuestions(r.test?.question_paper || [])
            setAnswers({})
            setIdx(0)
            setDone(false)
        } catch (err) {
            captureError(err, 'Start Teacher Test')
        }
    }

    const cur = questions[idx]
    const isLast = idx === questions.length - 1

    const submit = async () => {
        setSubmitting(true)
        try {
            const arr = questions.map(it => ({ question_id: it.qid, answer: answers[it.qid] ?? '' }))
            const r = attempt?.mode === 'teacher_upload'
                ? await vpApi.diagTeacherSubmit({ attempt_id: attempt.id, answers: arr })
                : await vpApi.diagStudentSubmit({ attempt_id: attempt.id, answers: arr })
            setReport(r.report)
            setPlan(r.personalized_plan)
            setViewAttemptId(attempt?.id || null)
            setDone(true)
            onDone?.()
            refreshHistory()
        } catch (err) {
            captureError(err, 'Submit Test')
        } finally {
            setSubmitting(false)
        }
    }

    if (done && report) {
        return <ResultView
            report={report}
            plan={plan}
            attemptId={viewAttemptId}
            initialLanguage={attempt?.language || locale || 'en'}
            onPlanUpdate={p => setPlan(p)}
            onBack={() => { setDone(false); resetAttempt(); setViewTab('history'); refreshHistory() }}
        />
    }

    if (!attempt) {
        return (
            <div className="vp-diag-shell">
                <h1 className="vp-diag-section-title">{t('vp_diagnostic') || 'Diagnostic'}</h1>
                <p className="vp-text-sm">Take a new diagnostic or review your previous results.</p>

                {error && (
                    <div style={{ margin: '12px 0', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: '0.85rem', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(248,113,113,0.15)', borderBottom: '1px solid rgba(248,113,113,0.25)' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚠ Error{error.label ? ` — ${error.label}` : ''}</span>
                            {error.status && <span style={{ marginLeft: 'auto', background: 'rgba(248,113,113,0.25)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontFamily: 'monospace' }}>HTTP {error.status} {error.statusText || ''}</span>}
                            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, marginLeft: error.status ? 4 : 'auto' }}>✕</button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Main message */}
                            <div><span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Message</span><br /><strong>{error.message}</strong></div>
                            {/* Server error */}
                            {error.serverError && error.serverError !== error.message && (
                                <div><span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Server Error</span><br />{error.serverError}</div>
                            )}
                            {/* Request info */}
                            {(error.url || error.method) && (
                                <div><span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Request</span><br /><code style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{error.method} {error.url}</code></div>
                            )}
                            {/* Full server response */}
                            {error.serverRaw && (
                                <div>
                                    <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Full Server Response</span>
                                    <pre style={{ margin: '4px 0 0', padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflowY: 'auto', color: '#fca5a5' }}>{error.serverRaw}</pre>
                                </div>
                            )}
                            {/* Server detail / stack */}
                            {error.serverDetail && (
                                <div>
                                    <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Server Detail / Stack</span>
                                    <pre style={{ margin: '4px 0 0', padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflowY: 'auto', color: '#fca5a5' }}>{error.serverDetail}</pre>
                                </div>
                            )}
                            {/* Client stack */}
                            {error.clientStack && (
                                <div>
                                    <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Client Stack Trace</span>
                                    <pre style={{ margin: '4px 0 0', padding: '8px 10px', background: 'rgba(0,0,0,0.35)', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflowY: 'auto', color: '#fca5a5' }}>{error.clientStack}</pre>
                                </div>
                            )}
                            {/* Timestamp */}
                            {error.timestamp && <div style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: 4 }}>at {error.timestamp}</div>}
                        </div>
                    </div>
                )}

                <div className="vp-segment vp-mt-12">
                    <button className={'vp-btn ' + (viewTab === 'take' ? 'vp-btn-primary' : '')} onClick={() => setViewTab('take')}><ClipboardList size={16} /> Take Test</button>
                    <button className={'vp-btn ' + (viewTab === 'history' ? 'vp-btn-primary' : '')} onClick={() => setViewTab('history')}><History size={16} /> Previous Results</button>
                </div>

                {viewTab === 'history' && (
                    <div className="vp-diag-panel vp-mt-12">
                        <h3><History size={16} /> Previous Results</h3>
                        {!history.length ? (
                            <div className="vp-empty">No previous diagnostic results yet.</div>
                        ) : (
                            <div className="vp-diag-history-grid">
                                {history.map(item => (
                                    <div key={item.id} className="vp-card" style={{ margin: 0 }}>
                                        <h3>{item.subject || 'General'} {item.topic ? `· ${item.topic}` : ''}</h3>
                                        <p className="vp-text-sm">
                                            {item.report?.education_level === 'college' ? `College Year ${item.grade || '-'}` : `Class ${item.grade || '-'}`} ·
                                            {' '}Score {item.score || item.report?.score || 0}/{item.total_marks || item.report?.total_marks || 0} ·
                                            {' '}Stage {item.report?.stage || 'N/A'}
                                        </p>
                                        <p className="vp-text-sm">{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}</p>
                                        <button
                                            className="vp-btn vp-btn-secondary"
                                            onClick={() => {
                                                setReport(item.report || null)
                                                setPlan(item.personalized_plan || null)
                                                setViewAttemptId(item.id || null)
                                                setDone(true)
                                            }}
                                        >
                                            View Detailed Report
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewTab === 'take' && (
                    <>
                        <div className="vp-segment vp-mt-12">
                            <button className={'vp-btn ' + (mode === 'student_choice' ? 'vp-btn-primary' : '')} onClick={() => setMode('student_choice')}><User size={16} /> Student Choice</button>
                            <button className={'vp-btn ' + (mode === 'teacher_upload' ? 'vp-btn-primary' : '')} onClick={() => setMode('teacher_upload')}><Upload size={16} /> Teacher Uploaded</button>
                        </div>

                {mode === 'student_choice' ? (
                    <div className="vp-diag-panel vp-mt-12">
                        <h3><ClipboardList size={16} /> Student Choice Test</h3>
                        <p className="vp-text-sm">Flow: Education level {'->'} Language {'->'} Class/Year-Sem {'->'} Subject {'->'} Upload syllabus {'->'} Select topic(s) {'->'} Generate test.</p>
                        <div className="vp-diag-fields">
                            <div className="vp-diag-field">
                                <label>Learning Level</label>
                                <select
                                    className="vp-search"
                                    value={meta.education_level}
                                    onChange={e => {
                                        const nextLevel = e.target.value
                                        if (nextLevel === 'school') {
                                            setMeta(m => ({ ...m, education_level: 'school', grade: 9, college_year: 1, semester: 1 }))
                                        } else {
                                            setMeta(m => ({ ...m, education_level: 'college', college_year: 1, semester: 1 }))
                                        }
                                    }}
                                >
                                    <option value="school">School</option>
                                    <option value="college">College</option>
                                </select>
                            </div>
                            <div className="vp-diag-field">
                                <label>Language</label>
                                <select className="vp-search" value={meta.language} onChange={e => setMeta(m => ({ ...m, language: e.target.value }))}>
                                    {LANGUAGE_OPTIONS.map(l => (
                                        <option key={l.code} value={l.code}>{l.code} ({l.label})</option>
                                    ))}
                                </select>
                            </div>
                            {meta.education_level === 'school' ? (
                                <div className="vp-diag-field">
                                    <label>Class</label>
                                    <select className="vp-search" value={meta.grade} onChange={e => setMeta(m => ({ ...m, grade: Number(e.target.value) }))}>
                                        {SCHOOL_CLASSES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="vp-diag-field">
                                    <label>Year / Semester</label>
                                    <select
                                        className="vp-search"
                                        value={`${meta.college_year}-${meta.semester}`}
                                        onChange={e => {
                                            const [year, sem] = e.target.value.split('-').map(Number)
                                            setMeta(m => ({ ...m, college_year: year, semester: sem }))
                                        }}
                                    >
                                        {COLLEGE_YEAR_SEM_OPTIONS.map(opt => (
                                            <option key={`${opt.year}-${opt.semester}`} value={`${opt.year}-${opt.semester}`}>
                                                {opt.label} (Year {opt.year} · Sem {opt.semester})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="vp-diag-field span-2">
                                <label>Subject (type)</label>
                                <input
                                    className="vp-search"
                                    value={meta.subject}
                                    onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}
                                    placeholder={meta.education_level === 'college' ? 'e.g. Data Structures, DBMS, Thermodynamics' : 'e.g. Mathematics, Science, English'}
                                />
                            </div>
                            <div className="vp-diag-field span-2">
                                <label>Topic</label>
                                <select className="vp-search" value={meta.topic} onChange={e => setMeta(m => ({ ...m, topic: e.target.value }))}>
                                    {(syllabusTopics.length ? syllabusTopics : subjectTopics).length === 0 ? (
                                        <option value="">No topics yet (type subject or upload syllabus)</option>
                                    ) : (
                                        (syllabusTopics.length ? syllabusTopics : subjectTopics).map((tp, i) => (
                                            <option key={`${tp}-${i}`} value={tp}>{tp}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            {syllabusUnits.length > 0 && meta.syllabus_scope === 'unit_wise' && (
                                <div className="vp-diag-field span-2">
                                    <label>Choose Unit</label>
                                    <select className="vp-search" value={meta.unit_name} onChange={e => setMeta(m => ({ ...m, unit_name: e.target.value }))}>
                                        <option value="">Select Unit</option>
                                        {syllabusUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            )}

                        </div>

                        <div className="vp-diag-upload">
                            <h3>{meta.education_level === 'college' ? <><GraduationCap size={16} /> College Syllabus Upload</> : <><Layers size={16} /> School Syllabus Upload</>}</h3>
                            <p className="vp-text-sm">Upload syllabus (TXT/PDF/CSV/Excel). Topic dropdown will be filled from uploaded syllabus.</p>
                            <div className="vp-row" style={{ gap: 8 }}>
                                <input type="file" onChange={e => setSyllabusFile(e.target.files?.[0] || null)} />
                                <button className="vp-btn" onClick={uploadSyllabus} disabled={uploadingSyllabus}>
                                    {uploadingSyllabus ? 'Uploading...' : 'Upload Syllabus'}
                                </button>
                            </div>
                            {meta.syllabus_text ? (
                                <p className="vp-text-sm">Syllabus uploaded successfully. Units detected: {syllabusUnits.length || 0} · Topics extracted: {syllabusTopics.length || 0}</p>
                            ) : (
                                <p className="vp-text-sm">No syllabus uploaded yet. Topic dropdown is currently generated from subject name.</p>
                            )}
                        </div>

                        <button className="vp-btn vp-btn-primary vp-mt-12" onClick={startStudentChoice}>Generate Test</button>
                    </div>
                ) : (
                    <div className="vp-diag-panel vp-mt-12">
                        <h3><Upload size={16} /> Teacher Uploaded Test</h3>
                        <p className="vp-text-sm">Choose a published test uploaded by your teacher/admin.</p>
                        <select className="vp-search" style={{ maxWidth: 520 }} value={selectedTeacherTestId} onChange={e => setSelectedTeacherTestId(e.target.value)}>
                            <option value="">Select test</option>
                            {teacherTests.map(test => (
                                <option key={test.id} value={test.id}>
                                    {test.title} {test.subject ? `· ${test.subject}` : ''} {test.grade ? `· Class ${test.grade}` : ''}
                                </option>
                            ))}
                        </select>
                        <button className="vp-btn vp-btn-primary vp-mt-12" onClick={startTeacherTest}>Start Teacher Test</button>
                    </div>
                )}
                    </>
                )}
            </div>
        )
    }

    if (!questions.length) return <div className="vp-empty">{t('loading') || 'Loading…'}</div>

    return (
        <div>
            <h1 className="vp-h1">{attempt.title || (attempt.mode === 'teacher_upload' ? (diagUiText.test?.teacherDiagnosticTest || 'Teacher Diagnostic Test') : (diagUiText.test?.studentChoiceDiagnostic || 'Student Choice Diagnostic'))}</h1>
            <p className="vp-text-sm">{diagUiText.test?.question || 'Question'} {idx + 1} / {questions.length} · {cur.subject || 'General'} · {cur.marks} {diagUiText.test?.marks || 'mark(s)'}</p>
            <div className="vp-progress vp-mt-12"><div style={{ width: `${((idx + 1) / questions.length) * 100}%` }} /></div>

            <div className="vp-card vp-mt-12">
                <h3>{cur.text}</h3>
                {!!cur.options?.length ? (
                    <div className="vp-quiz-options">
                        {(cur.options || []).map(opt => (
                            <button
                                key={opt}
                                className={'vp-quiz-option' + (answers[cur.qid] === opt ? ' selected' : '')}
                                onClick={() => setAnswers(a => ({ ...a, [cur.qid]: opt }))}
                            >{opt}</button>
                        ))}
                    </div>
                ) : (
                    <ShortAnswerField
                        qid={cur.qid}
                        marks={cur.marks}
                        value={answers[cur.qid] || ''}
                        onChange={val => setAnswers(a => ({ ...a, [cur.qid]: val }))}
                        lang={attempt?.language || locale || 'en'}
                        uiText={diagUiText.test || {}}
                    />
                )}
                <div className="vp-row">
                    <button className="vp-btn" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>{diagUiText.test?.back || t('back') || 'Back'}</button>
                    {!isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={() => setIdx(i => i + 1)} disabled={!String(answers[cur.qid] || '').trim()}>
                            {diagUiText.test?.next || t('next') || 'Next'} <ChevronRight size={16} />
                        </button>
                    )}
                    {isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={submit} disabled={submitting}>
                            {submitting ? '…' : (diagUiText.test?.submit || t('submit') || 'Submit')}
                        </button>
                    )}
                </div>
            </div>

            <div className="vp-row vp-mt-12">
                <button className="vp-btn" onClick={resetAttempt}>{diagUiText.test?.exitTest || 'Exit Test'}</button>
            </div>
        </div>
    )
}

/* ── small style helpers scoped to ResultView ── */
const rv = {
    card: (extra = {}) => ({
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 14, padding: '18px 20px', ...extra
    }),
    pct: (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444',
    weekColors: [
        { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', color: '#a5b4fc', label: 'Week 1' },
        { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24', label: 'Week 2' },
        { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#34d399', label: 'Week 3' },
        { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  color: '#f87171', label: 'Week 4' },
    ]
}

// Speech-to-text textarea with mic button
function ShortAnswerField({ qid, marks, value, onChange, lang, uiText = {} }) {
    const langMap = {
        hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', gu: 'gu-IN',
        kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', pa: 'pa-IN',
        te: 'te-IN', ur: 'ur-IN', or: 'or-IN', en: 'en-IN'
    }
    const srLang = langMap[lang] || 'en-IN'
    const { listening, toggle, supported } = useSpeechToText({
        lang: srLang,
        onResult: transcript => onChange(value ? value + ' ' + transcript : transcript)
    })

    return (
        <div style={{ position: 'relative' }}>
            <textarea
                rows={marks >= 5 ? 6 : 3}
                className="vp-search"
                style={{ width: '100%', paddingRight: supported ? 48 : undefined }}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={marks >= 5 ? (uiText.writeDetailedAnswer || 'Write your detailed answer...') : (uiText.writeAnswer || 'Write your answer...')}
            />
            {supported && (
                <button
                    type="button"
                    onClick={toggle}
                    title={listening ? (uiText.stop || 'Stop') : (uiText.speak || 'Speak')}
                    style={{
                        position: 'absolute', top: 10, right: 10,
                        background: listening ? 'rgba(239,68,68,0.18)' : 'rgba(139,92,246,0.15)',
                        border: `1.5px solid ${listening ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.4)'}`,
                        borderRadius: 8, padding: '5px 7px', cursor: 'pointer',
                        color: listening ? '#f87171' : '#a78bfa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    {listening
                        ? <><MicOff size={16} /><span style={{ marginLeft: 4, fontSize: '0.72rem', fontWeight: 600 }}>{uiText.stop || 'Stop'}</span></>
                        : <><Mic size={16} /><span style={{ marginLeft: 4, fontSize: '0.72rem', fontWeight: 600 }}>{uiText.speak || 'Speak'}</span></>
                    }
                </button>
            )}
            {listening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: '0.75rem', color: '#f87171' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', animation: 'vp-mic-pulse 1s infinite' }} />
                    {uiText.listening || 'Listening...'}
                </div>
            )}
        </div>
    )
}

function ProgressBar({ pct, color }) {
    return (
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(148,163,184,0.1)', overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
    )
}

function YoutubeCard({ url, title }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                color: '#fca5a5', fontSize: '0.85rem', fontWeight: 500,
                transition: 'background 0.15s'
            }}
        >
            <span style={{
                flexShrink: 0, width: 32, height: 22, borderRadius: 5,
                background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                    <path d="M13.7 1.56A1.76 1.76 0 0 0 12.46.3C11.36 0 7 0 7 0S2.64 0 1.54.3A1.76 1.76 0 0 0 .3 1.56 18.5 18.5 0 0 0 0 5a18.5 18.5 0 0 0 .3 3.44A1.76 1.76 0 0 0 1.54 9.7C2.64 10 7 10 7 10s4.36 0 5.46-.3a1.76 1.76 0 0 0 1.24-1.26A18.5 18.5 0 0 0 14 5a18.5 18.5 0 0 0-.3-3.44z"/>
                    <polygon points="5.6,7.1 9.24,5 5.6,2.9" fill="#ef4444"/>
                </svg>
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <span style={{ flexShrink: 0, fontSize: '0.72rem', color: '#94a3b8' }}>YouTube ↗</span>
        </a>
    )
}

function TopicPlanCard({ tp }) {
    const [open, setOpen] = useState(false)
    const color = rv.pct(tp.current_pct)
    const targetColor = rv.pct(tp.target_pct)

    const downloadNotes = () => {
        const content = tp?.notes?.content || ''
        const name = tp?.notes?.file_name || 'notes.txt'
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = name; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{
            ...rv.card(),
            border: `1px solid ${color}30`,
            background: `linear-gradient(135deg, rgba(15,23,42,0.95), rgba(${tp.current_pct < 40 ? '239,68,68' : tp.current_pct < 70 ? '245,158,11' : '16,185,129'},0.04))`
        }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${color}20`, border: `1.5px solid ${color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1rem', color
                }}>{tp.rank}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>{tp.topic}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{tp.why_struggle}</div>
                </div>
            </div>

            {/* ── Progress: current → target ── */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Current mastery</span>
                    <span style={{ color, fontWeight: 700 }}>{tp.current_pct}%</span>
                </div>
                <ProgressBar pct={tp.current_pct} color={color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: 6 }}>
                    <span style={{ color: '#475569' }}>Target</span>
                    <span style={{ color: targetColor, fontWeight: 600 }}>{tp.target_pct}%</span>
                </div>
            </div>

            {/* ── Week-by-week plan ── */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Weekly focus</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(tp.weekly_focus || []).map((w, wIdx) => {
                        const wc = rv.weekColors[wIdx] || rv.weekColors[3]
                        // Extract "Week N:" prefix text vs rest
                        const colonIdx = w.indexOf(':')
                        const weekLabel = colonIdx > -1 ? w.slice(0, colonIdx).trim() : `Week ${wIdx + 1}`
                        const weekBody  = colonIdx > -1 ? w.slice(colonIdx + 1).trim() : w
                        return (
                            <div key={wIdx} style={{
                                display: 'flex', gap: 10, alignItems: 'flex-start',
                                background: wc.bg, border: `1px solid ${wc.border}`,
                                borderRadius: 8, padding: '8px 12px'
                            }}>
                                <span style={{
                                    flexShrink: 0, background: wc.border, color: wc.color,
                                    borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem',
                                    fontWeight: 700, minWidth: 54, textAlign: 'center'
                                }}>{weekLabel}</span>
                                <span style={{ fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.5 }}>{weekBody}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Daily tasks ── */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Daily tasks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(tp.daily_tasks || []).map((d, dIdx) => (
                        <div key={dIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{
                                flexShrink: 0, marginTop: 3, width: 14, height: 14,
                                borderRadius: 3, border: '1.5px solid rgba(148,163,184,0.3)',
                                background: 'rgba(255,255,255,0.04)', display: 'inline-block'
                            }} />
                            <span style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.5 }}>{d}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── YouTube resources ── */}
            {(tp.resources?.youtube || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>YouTube resources</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(tp.resources.youtube || []).map((y, yIdx) => (
                            <YoutubeCard key={yIdx} url={y.url} title={y.title} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Book references (collapsible) ── */}
            {(tp.resources?.books || []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <button
                        onClick={() => setOpen(p => !p)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#64748b', fontSize: '0.78rem', fontWeight: 700,
                            letterSpacing: '0.04em', textTransform: 'uppercase', padding: 0
                        }}
                    >
                        <GraduationCap size={13} /> Book references {open ? '▲' : '▼'}
                    </button>
                    {open && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {tp.resources.books.map((b, bIdx) => (
                                <div key={bIdx} style={{
                                    display: 'flex', gap: 8, alignItems: 'flex-start',
                                    background: 'rgba(148,163,184,0.05)', borderRadius: 7,
                                    padding: '7px 10px', fontSize: '0.82rem'
                                }}>
                                    <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }}>📚</span>
                                    <div>
                                        <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{b.title}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{b.ref}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Download Notes ── */}
            {tp.notes?.content && (
                <button
                    onClick={downloadNotes}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
                        border: '1.5px solid rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.08)', color: '#a5b4fc'
                    }}
                >
                    <FileDown size={13} /> Download Notes
                </button>
            )}
        </div>
    )
}

function ResultView({ report, plan, attemptId, initialLanguage = 'en', onPlanUpdate, onBack }) {
    const navigate = useNavigate()
    const [showQ, setShowQ] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [regenError, setRegenError] = useState(null)
    const [viewReport, setViewReport] = useState(report)
    const [viewPlan, setViewPlan] = useState(plan)
    const [resultLanguage, setResultLanguage] = useState(initialLanguage)
    const [localizing, setLocalizing] = useState(false)
    const [generatingLessons, setGeneratingLessons] = useState(false)
    const [lessonMessage, setLessonMessage] = useState('')
    const [uiText, setUiText] = useState({})
    const [lessonDifficulty, setLessonDifficulty] = useState('medium')

    useEffect(() => {
        setViewReport(report)
        setViewPlan(plan)
    }, [report, plan])

    useEffect(() => {
        setResultLanguage(initialLanguage || 'en')
    }, [initialLanguage])

    useEffect(() => {
        vpApi.diagUiText(resultLanguage).then(r => setUiText(r.text?.result || {})).catch(() => {})
    }, [resultLanguage])

    useEffect(() => {
        let cancelled = false
        const localize = async () => {
            if (!attemptId || !resultLanguage) return
            setLocalizing(true)
            setRegenError(null)
            try {
                const r = await vpApi.diagLocalizedResult(attemptId, resultLanguage)
                if (cancelled) return
                setViewReport(r.report || report)
                setViewPlan(r.personalized_plan || plan)
            } catch {
                if (cancelled) return
                setRegenError(uiText.couldNotChangeLanguage || 'Could not change result language. Please try again.')
            } finally {
                if (!cancelled) setLocalizing(false)
            }
        }
        localize()
        return () => { cancelled = true }
    }, [attemptId, resultLanguage])

    const regeneratePlan = async () => {
        if (!attemptId) return
        setRegenerating(true)
        setRegenError(null)
        try {
            const r = await vpApi.diagRegeneratePlan(attemptId)
            onPlanUpdate?.(r.personalized_plan)
            setViewPlan(r.personalized_plan)
        } catch (e) {
            setRegenError(uiText.couldNotRegeneratePlan || 'Could not regenerate plan. Please try again.')
        } finally {
            setRegenerating(false)
        }
    }

    const generateWeakTopicLessons = async () => {
        if (!attemptId) return
        setGeneratingLessons(true)
        setLessonMessage('')
        setRegenError(null)
        try {
            await vpApi.diagGenerateLessons(attemptId, resultLanguage, lessonDifficulty)
            setLessonMessage(uiText.lessonsReady || 'Weak-topic lessons are ready in Smart Study.')
            navigate('/student/vp/resources')
        } catch {
            setRegenError(uiText.couldNotGenerateLessons || 'Could not generate lessons. Please try again.')
        } finally {
            setGeneratingLessons(false)
        }
    }

    const questionWise = viewReport?.question_wise || []
    const weakTopics = viewReport?.weak_topics || []
    const topicPlans = viewPlan?.topic_plans || []

    const pct = Number(viewReport?.percentage || 0)
    const scoreColor = rv.pct(pct)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Back button ── */}
            <div>
                <button
                    className="vp-btn"
                    onClick={onBack}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                    <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} />
                    {uiText.backToDiagnostic || 'Back to Diagnostic'}
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.86rem', color: '#94a3b8' }}>{uiText.resultLanguage || 'Result Language'}</label>
                <select className="vp-search" style={{ maxWidth: 280 }} value={resultLanguage} onChange={e => setResultLanguage(e.target.value)}>
                    {LANGUAGE_OPTIONS.map(l => (
                        <option key={l.code} value={l.code}>{l.code} ({l.label})</option>
                    ))}
                </select>
                {localizing && <span className="vp-text-sm">{uiText.updatingLanguage || 'Updating language...'}</span>}
            </div>

            {/* ── Score banner ── */}
            <div style={{
                ...rv.card({
                    background: `linear-gradient(135deg, rgba(15,23,42,0.98), rgba(${pct >= 70 ? '16,185,129' : pct >= 40 ? '245,158,11' : '239,68,68'},0.06))`,
                    border: `1.5px solid ${scoreColor}40`
                }),
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
            }}>
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{uiText.accuracy || 'accuracy'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
                        <Award size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {uiText.diagnosticComplete || 'Diagnostic complete'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                        {uiText.score || 'Score'}: <strong style={{ color: '#e2e8f0' }}>{viewReport?.score} / {viewReport?.total_marks}</strong>
                        &nbsp;·&nbsp;{uiText.stage || 'Stage'}: <strong style={{ color: scoreColor }}>{viewReport?.stage || 'N/A'}</strong>
                        &nbsp;·&nbsp;{uiText.weakTopics || 'Weak topics'}: <strong style={{ color: '#f87171' }}>{weakTopics.length}</strong>
                    </div>
                    <ProgressBar pct={pct} color={scoreColor} />
                </div>
            </div>

            {/* ── Overall weekly goals ── */}
            {viewPlan?.weekly_goals?.length > 0 && (
                <div style={rv.card()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                            📅 {viewPlan.title || uiText.yourImprovementPlan || 'Your Improvement Plan'}
                        </div>
                        {attemptId && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Difficulty picker */}
                                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {[{v:'easy',label:'Easy',color:'#6ee7b7'},{v:'medium',label:'Medium',color:'#fbbf24'},{v:'hard',label:'Hard',color:'#f87171'}].map(d => (
                                        <button key={d.v} onClick={() => setLessonDifficulty(d.v)} style={{
                                            padding: '3px 10px', borderRadius: 6, border: 'none', fontSize: '0.72rem', fontWeight: 700,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            background: lessonDifficulty === d.v ? d.color : 'transparent',
                                            color: lessonDifficulty === d.v ? '#0f172a' : 'var(--text-muted)'
                                        }}>{d.label}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={generateWeakTopicLessons}
                                    disabled={generatingLessons}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: generatingLessons ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.15)',
                                        border: '1px solid rgba(16,185,129,0.35)',
                                        borderRadius: 8, padding: '5px 12px', cursor: generatingLessons ? 'not-allowed' : 'pointer',
                                        color: '#6ee7b7', fontSize: '0.78rem', fontWeight: 600,
                                        opacity: generatingLessons ? 0.6 : 1, transition: 'all 0.2s'
                                    }}
                                >
                                    {generatingLessons ? (uiText.generatingLessons || 'Generating lessons...') : (uiText.generateLessonsFromWeakTopics || 'Generate Lessons From Weak Topics')}
                                </button>
                                <button
                                    onClick={regeneratePlan}
                                    disabled={regenerating}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: regenerating ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.15)',
                                        border: '1px solid rgba(99,102,241,0.4)',
                                        borderRadius: 8, padding: '5px 12px', cursor: regenerating ? 'not-allowed' : 'pointer',
                                        color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600,
                                        opacity: regenerating ? 0.6 : 1, transition: 'all 0.2s'
                                    }}
                                >
                                    {regenerating ? `⟳ ${uiText.generating || 'Generating...'}` : `✦ ${uiText.regenerateWithAI || 'Regenerate with AI'}`}
                                </button>
                            </div>
                        )}
                    </div>
                    {regenError && (
                        <div style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: 10 }}>{regenError}</div>
                    )}
                    {lessonMessage && (
                        <div style={{ fontSize: '0.78rem', color: '#6ee7b7', marginBottom: 10 }}>{lessonMessage}</div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14 }}>
                        {uiText.target || 'Target'}: <strong style={{ color: '#60a5fa' }}>{viewPlan.target_score}%</strong> in <strong style={{ color: '#60a5fa' }}>{viewPlan.horizon_days} {uiText.days || 'days'}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                        {viewPlan.weekly_goals.map((g, gIdx) => {
                            const wc = rv.weekColors[gIdx] || rv.weekColors[3]
                            const colonIdx = g.indexOf(':')
                            const wLabel = colonIdx > -1 ? g.slice(0, colonIdx).trim() : `Week ${gIdx + 1}`
                            const wBody  = colonIdx > -1 ? g.slice(colonIdx + 1).trim() : g
                            return (
                                <div key={gIdx} style={{
                                    background: wc.bg, border: `1px solid ${wc.border}`,
                                    borderRadius: 10, padding: '12px 14px'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: wc.color, marginBottom: 6 }}>{wLabel}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{wBody}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Topic-wise plans ── */}
            {topicPlans.length > 0 && (
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={17} color="#6366f1" />
                        {uiText.topicWisePersonalizedPlan || 'Topic-wise personalized plan'}
                        <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {topicPlans.length} topics
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                        {topicPlans.map((tp, i) => <TopicPlanCard key={i} tp={tp} />)}
                    </div>
                </div>
            )}

            {/* ── Question-wise review (collapsible) ── */}
            {questionWise.length > 0 && (
                <div style={rv.card()}>
                    <button
                        onClick={() => setShowQ(p => !p)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                            color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', padding: 0
                        }}
                    >
                        <span><ClipboardList size={16} style={{ marginRight: 7, verticalAlign: 'middle' }} />{uiText.questionWiseReport || 'Question-wise report'} ({questionWise.length} questions)</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{showQ ? `▲ ${uiText.hide || 'Hide'}` : `▼ ${uiText.show || 'Show'}`}</span>
                    </button>
                    {showQ && (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {questionWise.map(q => {
                                const correct = Number(q.obtained || 0) >= Number(q.marks || 1)
                                return (
                                    <div key={q.qid} style={{
                                        ...rv.card({
                                            padding: '14px 16px',
                                            background: correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                            border: `1px solid ${correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                                        })
                                    }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                                            <span style={{ color: correct ? '#10b981' : '#ef4444', flexShrink: 0 }}>{correct ? '✓' : '✗'}</span>
                                            <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>Q{q.index}. {q.question}</span>
                                        </div>
                                        <div style={{ paddingLeft: 20, fontSize: '0.8rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                                            <span>{uiText.score || 'Score'}: <strong style={{ color: correct ? '#10b981' : '#f87171' }}>{q.obtained}/{q.marks}</strong></span>
                                            <span>{uiText.topic || 'Topic'}: <strong style={{ color: '#94a3b8' }}>{q.topic || q.subject}</strong></span>
                                            <span>{uiText.yourAnswer || 'Your answer'}: <strong style={{ color: correct ? '#10b981' : '#f87171' }}>{q.student_answer || (uiText.notAnswered || 'Not answered')}</strong></span>
                                            {q.expected_answer && <span>{uiText.expected || 'Expected'}: <strong style={{ color: '#10b981' }}>{q.expected_answer}</strong></span>}
                                        </div>
                                        {q.feedback && <div style={{ paddingLeft: 20, marginTop: 4, fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>{q.feedback}</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions ── */}
            <div className="vp-row vp-mt-24">
                <button className="vp-btn vp-btn-primary" onClick={() => navigate('/student/vp/personalized')}>
                    {uiText.openPersonalizedStudy || 'Open Personalized Study'}
                </button>
                <button className="vp-btn" onClick={() => navigate('/student/vp/lessons')}>{uiText.browseLessons || 'Browse lessons'}</button>
                <button className="vp-btn" onClick={onBack}>{uiText.takeAnotherDiagnostic || 'Take another diagnostic'}</button>
            </div>
        </div>
    )
}
