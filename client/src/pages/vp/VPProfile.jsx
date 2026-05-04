import { useEffect, useState } from 'react'
import vpApi from '@/services/vp/api'
import { useI18n, LANGUAGES } from '@/services/i18n'
import { Save } from 'lucide-react'

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
    const [grade, setGrade] = useState(9)
    const [board, setBoard] = useState('CBSE')
    const [stateName, setStateName] = useState('')
    const [saving, setSaving] = useState(false)
    const [savedAt, setSavedAt] = useState(null)

    useEffect(() => {
        vpApi.profile().then(d => {
            setData(d)
            setName(d.user?.name || '')
            setGrade(d.prefs?.grade || 9)
            setBoard(d.prefs?.board || 'CBSE')
            setStateName(d.prefs?.state || '')
        }).catch(() => {})
    }, [])

    const save = async () => {
        setSaving(true)
        try {
            await vpApi.updateProfile({ name, grade: Number(grade), board, state: stateName, lang: locale })
            setSavedAt(new Date().toLocaleTimeString())
        } catch (err) {
            alert(err.response?.data?.error || err.message)
        } finally {
            setSaving(false)
        }
    }

    if (!data) return <div className="vp-empty">{t('loading') || 'Loading…'}</div>

    const initials = (name || 'S').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div>
            <h1 className="vp-h1">{t('vp_profile') || 'My Profile'}</h1>

            <div className="vp-row" style={{ alignItems: 'center', gap: 16 }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700
                }}>{initials}</div>
                <div>
                    <h3 style={{ margin: 0 }}>{name || 'Student'}</h3>
                    <p className="vp-text-sm" style={{ margin: 0 }}>{data.user?.email || '—'}</p>
                    <p className="vp-text-sm">XP: <strong>{data.prefs?.xp_points || 0}</strong></p>
                </div>
            </div>

            <div className="vp-card vp-mt-24">
                <h3>{t('vp_edit_profile') || 'Edit profile'}</h3>
                <div className="vp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <Field label="Name">
                        <input className="vp-search" value={name} onChange={e => setName(e.target.value)} />
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
