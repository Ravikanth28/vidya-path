import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import vpApi from '@/services/vp/api'
import { useI18n } from '@/services/i18n'
import { Award, ChevronRight, Upload, User, ClipboardList, BarChart3, History, FileDown, GraduationCap, Layers } from 'lucide-react'

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

export default function Diagnostic({ onDone }) {
    const { t } = useI18n()
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
    const [meta, setMeta] = useState({
        language: 'en',
        education_level: 'school',
        grade: 9,
        college_year: 1,
        subject: 'Mathematics',
        topic: '',
        scope: 'subject',
        syllabus_scope: 'whole_syllabus',
        unit_name: '',
        syllabus_text: ''
    })
    const [selectedTeacherTestId, setSelectedTeacherTestId] = useState('')
    const [syllabusFile, setSyllabusFile] = useState(null)
    const [syllabusUnits, setSyllabusUnits] = useState([])

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

    const resetAttempt = () => {
        setAttempt(null)
        setQuestions([])
        setAnswers({})
        setIdx(0)
    }

    const uploadSyllabus = async () => {
        if (!syllabusFile) return alert('Please upload syllabus file first.')
        setUploadingSyllabus(true)
        try {
            const fd = new FormData()
            fd.append('file', syllabusFile)
            const res = await vpApi.diagSyllabusUpload(fd)
            setMeta(m => ({ ...m, syllabus_text: res.syllabus_text || '' }))
            setSyllabusUnits(res.units || [])
            if ((res.units || []).length && !meta.unit_name) {
                setMeta(m => ({ ...m, unit_name: res.units[0] || '' }))
            }
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setUploadingSyllabus(false)
        }
    }

    const startStudentChoice = async () => {
        try {
            if (!String(meta.topic || '').trim()) {
                if (meta.syllabus_scope === 'unit_wise' && !String(meta.unit_name || '').trim()) {
                    return alert('Please choose a unit for unit-wise diagnostic, or enter a topic.')
                }
                if (!String(meta.syllabus_text || '').trim() && meta.education_level === 'college') {
                    return alert('For college flow, upload syllabus or enter a topic.')
                }
            }
            const r = await vpApi.diagStudentStart(meta)
            setMode('student_choice')
            setAttempt({ id: r.attempt_id, mode: 'student_choice' })
            setQuestions(r.question_paper || [])
            setAnswers({})
            setIdx(0)
            setDone(false)
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    const startTeacherTest = async () => {
        if (!selectedTeacherTestId) return alert('Select a teacher test first')
        try {
            const r = await vpApi.diagTeacherStart(selectedTeacherTestId)
            setMode('teacher_upload')
            setAttempt({ id: r.attempt_id, mode: 'teacher_upload', title: r.test?.title })
            setQuestions(r.test?.question_paper || [])
            setAnswers({})
            setIdx(0)
            setDone(false)
        } catch (err) {
            alert(err.response?.data?.error || err.message)
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
            setDone(true)
            onDone?.()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (done && report) {
        return <ResultView
            report={report}
            plan={plan}
            onBack={() => { setDone(false); resetAttempt(); setViewTab('take') }}
        />
    }

    if (!attempt) {
        return (
            <div className="vp-diag-shell">
                <h1 className="vp-diag-section-title">{t('vp_diagnostic') || 'Diagnostic'}</h1>
                <p className="vp-text-sm">Take a new diagnostic or review your previous results.</p>

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
                        <p className="vp-text-sm">Clean flow: Topic (highest priority) -> Unit (if Unit Wise) -> Whole Syllabus -> fallback profile context.</p>
                        <div className="vp-diag-fields">
                            <div className="vp-diag-field">
                                <label>Learning Level</label>
                                <select className="vp-search" value={meta.education_level} onChange={e => setMeta(m => ({ ...m, education_level: e.target.value }))}>
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
                                        {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="vp-diag-field">
                                    <label>College Year</label>
                                    <select className="vp-search" value={meta.college_year} onChange={e => setMeta(m => ({ ...m, college_year: Number(e.target.value) }))}>
                                        {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            )}
                            {meta.education_level === 'school' ? (
                                <div className="vp-diag-field">
                                    <label>Subject</label>
                                    <select className="vp-search" value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}>
                                        {['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="vp-diag-field">
                                    <label>Subject (optional)</label>
                                    <select className="vp-search" value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}>
                                        {['General', 'Mathematics', 'Science', 'English', 'Aptitude', 'Programming'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="vp-diag-field">
                                <label>Scope</label>
                                <select className="vp-search" value={meta.scope} onChange={e => setMeta(m => ({ ...m, scope: e.target.value }))}>
                                    <option value="topic">Topic</option>
                                    <option value="subject">Whole Subject</option>
                                    <option value="year">Whole Year</option>
                                </select>
                            </div>
                            <div className="vp-diag-field">
                                <label>Syllabus Scope</label>
                                <select className="vp-search" value={meta.syllabus_scope} onChange={e => setMeta(m => ({ ...m, syllabus_scope: e.target.value }))}>
                                    <option value="whole_syllabus">Whole Syllabus</option>
                                    <option value="unit_wise">Unit Wise</option>
                                </select>
                            </div>
                            <div className="vp-diag-field span-2">
                                <label>Topic (optional - overrides other selections)</label>
                                <input className="vp-search" value={meta.topic} onChange={e => setMeta(m => ({ ...m, topic: e.target.value }))} placeholder={meta.education_level === 'college' ? 'e.g. Compiler Design' : 'e.g. Algebra'} />
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
                            <p className="vp-text-sm">Upload syllabus (TXT/PDF/CSV/Excel). Unit-wise mode will show parsed units here.</p>
                            <div className="vp-row" style={{ gap: 8 }}>
                                <input type="file" onChange={e => setSyllabusFile(e.target.files?.[0] || null)} />
                                <button className="vp-btn" onClick={uploadSyllabus} disabled={uploadingSyllabus}>
                                    {uploadingSyllabus ? 'Uploading...' : 'Upload Syllabus'}
                                </button>
                            </div>
                            {meta.syllabus_text ? (
                                <p className="vp-text-sm">Syllabus uploaded successfully. Units detected: {syllabusUnits.length || 0}</p>
                            ) : (
                                <p className="vp-text-sm">No syllabus uploaded yet.</p>
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
            <h1 className="vp-h1">{attempt.title || (attempt.mode === 'teacher_upload' ? 'Teacher Diagnostic Test' : 'Student Choice Diagnostic')}</h1>
            <p className="vp-text-sm">Question {idx + 1} / {questions.length} · {cur.subject || 'General'} · {cur.marks} mark(s)</p>
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
                    <textarea
                        rows={cur.marks >= 5 ? 6 : 3}
                        className="vp-search"
                        style={{ width: '100%' }}
                        value={answers[cur.qid] || ''}
                        onChange={e => setAnswers(a => ({ ...a, [cur.qid]: e.target.value }))}
                        placeholder={cur.marks >= 5 ? 'Write your detailed answer...' : 'Write your answer...'}
                    />
                )}
                <div className="vp-row">
                    <button className="vp-btn" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>{t('back') || 'Back'}</button>
                    {!isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={() => setIdx(i => i + 1)} disabled={!String(answers[cur.qid] || '').trim()}>
                            {t('next') || 'Next'} <ChevronRight size={16} />
                        </button>
                    )}
                    {isLast && (
                        <button className="vp-btn vp-btn-primary" onClick={submit} disabled={submitting}>
                            {submitting ? '…' : (t('submit') || 'Submit')}
                        </button>
                    )}
                </div>
            </div>

            <div className="vp-row vp-mt-12">
                <button className="vp-btn" onClick={resetAttempt}>Exit Test</button>
            </div>
        </div>
    )
}

function ResultView({ report, plan, onBack }) {
    const navigate = useNavigate()

    const questionWise = report?.question_wise || []
    const weakTopics = report?.weak_topics || []
    const topicPlans = plan?.topic_plans || []

    const downloadNotes = (topicPlan) => {
        const content = topicPlan?.notes?.content || ''
        const name = topicPlan?.notes?.file_name || 'notes.txt'
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            <h1 className="vp-h1"><Award size={26} /> Diagnostic complete</h1>
            <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                <div className="vp-card">
                    <h3><BarChart3 size={16} /> Score</h3>
                    <p style={{ fontSize: 22, fontWeight: 700 }}>{report?.score} / {report?.total_marks}</p>
                </div>
                <div className="vp-card">
                    <h3>Stage</h3>
                    <p style={{ fontSize: 22, fontWeight: 700 }}>{report?.stage || 'N/A'}</p>
                </div>
                <div className="vp-card">
                    <h3>Accuracy</h3>
                    <p style={{ fontSize: 22, fontWeight: 700 }}>{report?.percentage || 0}%</p>
                </div>
                <div className="vp-card">
                    <h3>Weak Topics</h3>
                    <p style={{ fontSize: 22, fontWeight: 700 }}>{weakTopics.length}</p>
                </div>
            </div>

            <h2 className="vp-h2">Question-wise detailed report</h2>
            <div className="vp-grid" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
                {questionWise.map(q => (
                    <div key={q.qid} className="vp-card">
                        <h3>Q{q.index}. {q.question}</h3>
                        <p className="vp-text-sm">Score: {q.obtained}/{q.marks} · Topic: {q.topic || q.subject}</p>
                        <p className="vp-text-sm"><strong>Your answer:</strong> {q.student_answer || 'Not answered'}</p>
                        {q.expected_answer ? <p className="vp-text-sm"><strong>Expected:</strong> {q.expected_answer}</p> : null}
                        <p className="vp-text-sm">Feedback: {q.feedback}</p>
                    </div>
                ))}
            </div>

            <h2 className="vp-h2">Personalized plan to improve weak areas</h2>
            <div className="vp-card">
                <h3>{plan?.title || 'Your Improvement Plan'}</h3>
                <p className="vp-text-sm">Target score: {plan?.target_score || 'N/A'}% in {plan?.horizon_days || 21} days.</p>
                <p className="vp-text-sm"><strong>Weekly goals:</strong></p>
                <ul>
                    {(plan?.weekly_goals || []).map((g, idx) => <li key={idx}>{g}</li>)}
                </ul>
                <p className="vp-text-sm"><strong>Daily tasks:</strong></p>
                <ul>
                    {(plan?.daily_plan || []).map((d, idx) => <li key={idx}>Day {d.day}: {d.task}</li>)}
                </ul>
            </div>

            {topicPlans.length > 0 && (
                <>
                    <h2 className="vp-h2">Topic-wise personalized plan with resources</h2>
                    <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                        {topicPlans.map((tp, i) => (
                            <div key={i} className="vp-card">
                                <h3>{tp.rank}. {tp.topic}</h3>
                                <p className="vp-text-sm">Current: {tp.current_pct}% · Target: {tp.target_pct}%</p>
                                <p className="vp-text-sm">{tp.why_struggle}</p>

                                <p className="vp-text-sm"><strong>Weekly focus:</strong></p>
                                <ul>
                                    {(tp.weekly_focus || []).map((w, idx) => <li key={idx}>{w}</li>)}
                                </ul>

                                <p className="vp-text-sm"><strong>Daily tasks:</strong></p>
                                <ul>
                                    {(tp.daily_tasks || []).map((d, idx) => <li key={idx}>{d}</li>)}
                                </ul>

                                <p className="vp-text-sm"><strong>YouTube resources:</strong></p>
                                <ul>
                                    {(tp.resources?.youtube || []).map((y, idx) => (
                                        <li key={idx}><a href={y.url} target="_blank" rel="noreferrer">{y.title}</a></li>
                                    ))}
                                </ul>

                                <p className="vp-text-sm"><strong>Book references:</strong></p>
                                <ul>
                                    {(tp.resources?.books || []).map((b, idx) => <li key={idx}>{b.title} - {b.ref}</li>)}
                                </ul>

                                <button className="vp-btn vp-btn-secondary" onClick={() => downloadNotes(tp)}>
                                    <FileDown size={14} /> Download Notes
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="vp-row vp-mt-24">
                <button className="vp-btn vp-btn-primary" onClick={() => navigate('/student/vp/personalized')}>
                    Open Personalized Study
                </button>
                <button className="vp-btn" onClick={() => navigate('/student/vp/lessons')}>Browse lessons</button>
                <button className="vp-btn" onClick={onBack}>Take another diagnostic</button>
            </div>
        </div>
    )
}
