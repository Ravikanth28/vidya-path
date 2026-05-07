import { useEffect, useState } from 'react'
import vpApi from '@/services/vp/api'
import { Upload, Save, RefreshCw } from 'lucide-react'

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Aptitude', 'Programming', 'General']
const LANGUAGES = [
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

const card = {
    background: 'rgba(30,41,59,0.6)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 12
}

const input = {
    display: 'block',
    width: '100%',
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.2)',
    color: '#e2e8f0',
    borderRadius: 7,
    padding: '8px 12px',
    fontSize: '0.875rem',
    boxSizing: 'border-box'
}

export default function AdminVPDiagnostic() {
    const [tests, setTests] = useState([])
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(false)

    const [manual, setManual] = useState({
        title: '',
        description: '',
        language: 'en',
        grade: 9,
        subject: 'Mathematics',
        topic: '',
        scope: 'subject',
        questionsText: ''
    })

    const [uploadMeta, setUploadMeta] = useState({
        title: '',
        description: '',
        language: 'en',
        grade: 9,
        subject: 'Mathematics',
        topic: '',
        scope: 'subject'
    })
    const [uploadFile, setUploadFile] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [t, p] = await Promise.all([
                vpApi.adminDiagnosticTests(),
                vpApi.adminDiagnosticPlans()
            ])
            setTests(t.tests || [])
            setPlans(p.plans || [])
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const saveManual = async () => {
        if (!manual.title.trim()) return alert('Title required')
        const questions = manual.questionsText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const [text, type = 'mcq', marks = '1', answer_key = '', options = '', topic = ''] = line.split('|').map(s => s.trim())
                return {
                    text,
                    type,
                    marks: Number(marks || 1),
                    answer_key,
                    options: options ? options.split(';').map(s => s.trim()).filter(Boolean) : [],
                    topic,
                    subject: manual.subject
                }
            })

        if (!questions.length) return alert('Add at least one question line')

        try {
            await vpApi.adminDiagnosticManualTest({
                title: manual.title,
                description: manual.description,
                language: manual.language,
                grade: Number(manual.grade),
                subject: manual.subject,
                topic: manual.topic,
                scope: manual.scope,
                questions
            })
            setManual(m => ({ ...m, title: '', description: '', questionsText: '' }))
            load()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    const saveUpload = async () => {
        if (!uploadMeta.title.trim()) return alert('Title required')
        if (!uploadFile) return alert('Choose a file first')

        const fd = new FormData()
        fd.append('file', uploadFile)
        Object.entries(uploadMeta).forEach(([k, v]) => fd.append(k, v))

        try {
            await vpApi.adminDiagnosticUploadTest(fd)
            setUploadMeta(m => ({ ...m, title: '', description: '' }))
            setUploadFile(null)
            load()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    const togglePublish = async (id, current) => {
        try {
            await vpApi.adminDiagnosticPublish(id, !current)
            load()
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#e2e8f0' }}>Diagnostic Test Studio</h3>
                <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            <div style={card}>
                <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>Manual Test Creation</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Use one question per line with this format:</p>
                <p style={{ color: '#60a5fa', fontSize: '0.78rem' }}>question|type|marks|answer|opt1;opt2;opt3;opt4|topic</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 10 }}>
                    <input style={input} placeholder='Title' value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} />
                    <select style={input} value={manual.subject} onChange={e => setManual(m => ({ ...m, subject: e.target.value }))}>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select style={input} value={manual.grade} onChange={e => setManual(m => ({ ...m, grade: Number(e.target.value) }))}>
                        {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select style={input} value={manual.language} onChange={e => setManual(m => ({ ...m, language: e.target.value }))}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code} ({l.label})</option>)}
                    </select>
                </div>
                <textarea style={{ ...input, minHeight: 120, marginBottom: 8 }} value={manual.description} onChange={e => setManual(m => ({ ...m, description: e.target.value }))} placeholder='Description' />
                <textarea style={{ ...input, minHeight: 160, marginBottom: 12 }} value={manual.questionsText} onChange={e => setManual(m => ({ ...m, questionsText: e.target.value }))} placeholder='Paste question lines...' />
                <button onClick={saveManual} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.5)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <Save size={14} /> Save Manual Test
                </button>
            </div>

            <div style={card}>
                <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>Upload Test File (PDF/CSV/Excel)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 10 }}>
                    <input style={input} placeholder='Title' value={uploadMeta.title} onChange={e => setUploadMeta(m => ({ ...m, title: e.target.value }))} />
                    <select style={input} value={uploadMeta.subject} onChange={e => setUploadMeta(m => ({ ...m, subject: e.target.value }))}>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select style={input} value={uploadMeta.grade} onChange={e => setUploadMeta(m => ({ ...m, grade: Number(e.target.value) }))}>
                        {[8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select style={input} value={uploadMeta.language} onChange={e => setUploadMeta(m => ({ ...m, language: e.target.value }))}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code} ({l.label})</option>)}
                    </select>
                </div>
                <input type='file' onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ marginBottom: 10, color: '#cbd5e1' }} />
                <button onClick={saveUpload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.5)', borderRadius: 8, color: '#60a5fa', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <Upload size={14} /> Upload & Publish
                </button>
            </div>

            <div style={card}>
                <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>Published / Draft Diagnostic Tests</h4>
                {loading && <div style={{ color: '#94a3b8' }}>Loading...</div>}
                {!loading && !tests.length && <div style={{ color: '#64748b' }}>No tests created yet.</div>}
                {tests.map(t => (
                    <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.12)', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{t.title}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{t.subject || 'General'} · Class {t.grade || '-'} · Questions: {t.question_count || 0}</div>
                        </div>
                        <button onClick={() => togglePublish(t.id, !!t.is_published)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(148,163,184,0.2)', background: t.is_published ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.08)', color: t.is_published ? '#34d399' : '#cbd5e1', cursor: 'pointer' }}>
                            {t.is_published ? 'Published' : 'Draft'}
                        </button>
                    </div>
                ))}
            </div>

            <div style={card}>
                <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>Student Personalized Plans (Admin View)</h4>
                {!plans.length && <div style={{ color: '#64748b' }}>No plans generated yet.</div>}
                {plans.slice(0, 30).map(p => (
                    <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{p.student_name || p.student_id}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                            {p.title || 'Diagnostic Plan'} · Stage: {p.summary?.stage || 'N/A'} · {p.summary?.percentage ?? 0}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
