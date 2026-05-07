import { useEffect, useState } from 'react'
import vpApi from '@/services/vp/api'
import { useI18n, LANGUAGES } from '@/services/i18n'
import { Mail, Phone, Save, School, Sparkles } from 'lucide-react'

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'NIOS']
const STATES = [
    'Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana','Karnataka','Kerala',
    'Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana',
    'Uttar Pradesh','West Bengal','Other'
]

export default function VPProfile() {
    const { t, locale, setLocale } = useI18n()
    const [data, setData] = useState(null)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [studentClass, setStudentClass] = useState('')
    const [grade, setGrade] = useState(9)
    const [board, setBoard] = useState('CBSE')
    const [stateName, setStateName] = useState('')
    const [saving, setSaving] = useState(false)
    const [savedAt, setSavedAt] = useState(null)

    useEffect(() => {
        vpApi.profile().then(d => {
            setData(d)
            setName(d.user?.name || '')
            setPhone(d.user?.phone || '')
            setStudentClass(d.user?.studentClass || '')
            setGrade(d.prefs?.grade || 9)
            setBoard(d.prefs?.board || 'CBSE')
            setStateName(d.prefs?.state || '')
        }).catch(() => {})
    }, [])

    const save = async () => {
        setSaving(true)
        try {
            await vpApi.updateProfile({
                name,
                phone,
                studentClass,
                grade: Number(grade),
                board,
                state: stateName,
                lang: locale
            })
            setSavedAt(new Date().toLocaleTimeString())
            setData(prev => ({
                ...prev,
                user: {
                    ...(prev?.user || {}),
                    name,
                    phone,
                    studentClass
                }
            }))
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!data) return <div className="vp-empty">{t('loading') || 'Loading…'}</div>

    const initials = (name || 'S').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="vp-profile-shell">
            <h1 className="vp-h1">{t('vp_profile') || 'My Profile'}</h1>

            <div className="vp-profile-hero">
                <div className="vp-profile-avatar">{initials}</div>
                <div className="vp-profile-id">
                    <h3>{name || 'Student'}</h3>
                    <p><Mail size={14} /> {data.user?.email || '—'}</p>
                    <p><Phone size={14} /> {data.user?.phone || 'Not added yet'}</p>
                    <p><School size={14} /> {data.user?.studentClass || `Grade ${grade}`}</p>
                </div>
                <div className="vp-profile-xp">
                    <Sparkles size={16} />
                    <strong>{data.prefs?.xp_points || 0}</strong>
                    <span>XP</span>
                </div>
            </div>

            <div className="vp-card vp-mt-24 vp-profile-editor">
                <h3>{t('vp_edit_profile') || 'Edit profile'}</h3>
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <Field label="Name">
                        <input className="vp-search" value={name} onChange={e => setName(e.target.value)} />
                    </Field>
                    <Field label="Mobile Number">
                        <input className="vp-search" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
                    </Field>
                    <Field label="Class">
                        <input className="vp-search" value={studentClass} onChange={e => setStudentClass(e.target.value)} placeholder="e.g. 10 / 11 / B.Tech 1st Year" />
                    </Field>
                    <Field label="Grade">
                        <select className="vp-search" value={grade} onChange={e => setGrade(e.target.value)}>
                            {[8,9,10,11,12,13,14].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </Field>
                    <Field label="Board">
                        <select className="vp-search" value={board} onChange={e => setBoard(e.target.value)}>
                            {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </Field>
                    <Field label="State">
                        <select className="vp-search" value={stateName} onChange={e => setStateName(e.target.value)}>
                            <option value="">— Select —</option>
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Language">
                        <select className="vp-search" value={locale} onChange={e => setLocale(e.target.value)}>
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="vp-row vp-mt-12">
                    <button className="vp-btn vp-btn-primary" onClick={save} disabled={saving}>
                        <Save size={14} /> {saving ? '…' : (t('save') || 'Save')}
                    </button>
                    {savedAt && <span className="vp-text-sm">Saved at {savedAt}</span>}
                </div>
            </div>

            <h2 className="vp-h2">Subject ability (IRT θ)</h2>
            {(!data.ability || !data.ability.length) ? (
                <div className="vp-empty">No diagnostic results yet.</div>
            ) : (
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    {data.ability.map(a => (
                        <div key={a.subject} className="vp-card">
                            <h3>{a.subject}</h3>
                            <p style={{ fontSize: 22, fontWeight: 700 }}>{Number(a.theta).toFixed(2)}</p>
                            <p className="vp-text-sm">{a.n} responses</p>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="vp-h2">Concept mastery</h2>
            {(!data.mastery || !data.mastery.length) ? (
                <div className="vp-empty">Complete some quizzes to populate mastery.</div>
            ) : (
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {data.mastery.map(m => (
                        <div key={m.concept_id} className="vp-card">
                            <h3>{m.title}</h3>
                            <p className="vp-text-sm">{m.subject}</p>
                            <div className="vp-progress"><div style={{ width: `${m.pct}%` }} /></div>
                            <p className="vp-text-sm">{m.pct}% mastery</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function Field({ label, children }) {
    return (
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>
            {label}
            <div style={{ marginTop: 4 }}>{children}</div>
        </label>
    )
}
