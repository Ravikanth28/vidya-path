import { useState, useEffect } from 'react'
import axios from 'axios'
import { Webhook, Plus, Trash2, Play, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, AlertTriangle, Activity, Copy, ChevronDown, ChevronRight, Settings } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

const ALL_EVENTS = [
    { id: 'submission_graded',          label: 'Submission Graded',          desc: 'When a mentor grades a submission' },
    { id: 'test_passed',                label: 'Test Passed',                desc: 'When a student passes any test' },
    { id: 'certificate_issued',         label: 'Certificate Issued',         desc: 'When a certificate is auto-generated' },
    { id: 'plagiarism_flagged',         label: 'Plagiarism Flagged',         desc: 'When code is flagged for plagiarism' },
    { id: 'student_at_risk',            label: 'Student At Risk',            desc: 'When analytics marks a student at-risk' },
    { id: 'new_student_enrolled',       label: 'New Student Enrolled',       desc: 'When a new student is added to the platform' },
    { id: 'code_review_completed',      label: 'Code Review Completed',      desc: 'When AI review finishes' },
    { id: 'mentor_availability_updated',label: 'Mentor Availability Updated',desc: 'When mentor updates their calendar' },
]

export default function WebhookManager() {
    const [webhooks, setWebhooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const [deliveries, setDeliveries] = useState({})
    const [loadingDeliveries, setLoadingDeliveries] = useState({})
    const [testingId, setTestingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => { fetchWebhooks() }, [])

    async function fetchWebhooks() {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/webhooks`)
            setWebhooks(res.data.webhooks || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    async function toggleExpand(id) {
        if (expandedId === id) { setExpandedId(null); return }
        setExpandedId(id)
        if (!deliveries[id]) fetchDeliveries(id)
    }

    async function fetchDeliveries(webhookId) {
        setLoadingDeliveries(p => ({ ...p, [webhookId]: true }))
        try {
            const res = await axios.get(`${API_BASE}/webhooks/${webhookId}/deliveries`)
            setDeliveries(p => ({ ...p, [webhookId]: res.data.deliveries || [] }))
        } catch (e) { console.error(e) } finally {
            setLoadingDeliveries(p => ({ ...p, [webhookId]: false }))
        }
    }

    async function testWebhook(webhookId) {
        setTestingId(webhookId)
        try {
            const res = await axios.post(`${API_BASE}/webhooks/${webhookId}/test`)
            alert(res.data.success ? `✅ Test delivery successful! HTTP ${res.data.status}` : `⚠️ Test delivered but got HTTP ${res.data.status}`)
            fetchDeliveries(webhookId)
        } catch (e) {
            alert('❌ Test failed: ' + (e.response?.data?.error || e.message))
        } finally { setTestingId(null) }
    }

    async function toggleActive(webhook) {
        try {
            await axios.put(`${API_BASE}/webhooks/${webhook.id}`, { is_active: !webhook.is_active })
            fetchWebhooks()
        } catch (e) { console.error(e) }
    }

    async function deleteWebhook(webhookId) {
        if (!confirm('Delete this webhook? This cannot be undone.')) return
        setDeletingId(webhookId)
        try {
            await axios.delete(`${API_BASE}/webhooks/${webhookId}`)
            setWebhooks(p => p.filter(w => w.id !== webhookId))
            if (expandedId === webhookId) setExpandedId(null)
        } catch (e) { console.error(e) } finally { setDeletingId(null) }
    }

    return (
        <div style={{ padding: '24px', color: 'var(--text-primary)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '12px', padding: '10px' }}>
                    <Webhook size={22} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Webhook Manager</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Configure HTTP callbacks for platform events
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={fetchWebhooks} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Plus size={14} /> New Webhook
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showCreateForm && <CreateWebhookForm onCreated={() => { setShowCreateForm(false); fetchWebhooks() }} />}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Webhooks', value: webhooks.length },
                    { label: 'Active',         value: webhooks.filter(w => w.is_active).length },
                    { label: 'Failing',        value: webhooks.filter(w => w.failure_count > 0).length },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700 }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} /><br />Loading webhooks...
                </div>
            ) : webhooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <Webhook size={40} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
                    <h3>No webhooks configured</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Create your first webhook to get notified of platform events.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {webhooks.map(webhook => (
                        <WebhookRow key={webhook.id}
                            webhook={webhook}
                            expanded={expandedId === webhook.id}
                            deliveries={deliveries[webhook.id]}
                            loadingDeliveries={loadingDeliveries[webhook.id]}
                            testingId={testingId}
                            deletingId={deletingId}
                            onToggleExpand={() => toggleExpand(webhook.id)}
                            onToggleActive={() => toggleActive(webhook)}
                            onTest={() => testWebhook(webhook.id)}
                            onDelete={() => deleteWebhook(webhook.id)}
                            onRefreshDeliveries={() => fetchDeliveries(webhook.id)}
                        />
                    ))}
                </div>
            )}

            {/* Supported events reference */}
            <div style={{ marginTop: '32px', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                    <Activity size={16} color="#6366f1" /> Supported Event Types
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                    {ALL_EVENTS.map(ev => (
                        <div key={ev.id} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border)' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6366f1', marginBottom: '3px' }}>{ev.id}</div>
                            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{ev.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ev.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Single Webhook Row ──────────────────────────────────
function WebhookRow({ webhook, expanded, deliveries, loadingDeliveries, testingId, deletingId, onToggleExpand, onToggleActive, onTest, onDelete, onRefreshDeliveries }) {
    const events = typeof webhook.events === 'string' ? JSON.parse(webhook.events) : webhook.events || []
    const hasFailures = webhook.failure_count > 0

    return (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: `1px solid ${hasFailures ? '#7f1d1d' : 'var(--border)'}`, overflow: 'hidden' }}>
            {/* Row header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }} onClick={onToggleExpand}>
                <span style={{ background: webhook.is_active ? '#052e16' : '#1e293b', color: webhook.is_active ? '#34d399' : '#64748b', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                    {webhook.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{webhook.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{webhook.url}</div>
                </div>
                {hasFailures && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '12px' }}>
                        <AlertTriangle size={12} /> {webhook.failure_count} fails
                    </span>
                )}
                <div style={{ fontSize: '12px', color: '#64748b' }}>{events.length} event{events.length !== 1 ? 's' : ''}</div>
                {expanded ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
            </div>

            {/* Expanded details */}
            {expanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                    {/* Subscribed events */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscribed Events</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {events.map(ev => (
                                <span key={ev} style={{ background: '#1e3a5f', color: '#60a5fa', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace' }}>{ev}</span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <button onClick={onTest} disabled={testingId === webhook.id} style={{ padding: '7px 14px', background: '#1e3a5f', color: '#60a5fa', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Play size={12} /> {testingId === webhook.id ? 'Sending...' : 'Send Test'}
                        </button>
                        <button onClick={onToggleActive} style={{ padding: '7px 14px', background: webhook.is_active ? '#450a0a' : '#052e16', color: webhook.is_active ? '#f87171' : '#34d399', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {webhook.is_active ? <><EyeOff size={12} /> Disable</> : <><Eye size={12} /> Enable</>}
                        </button>
                        <button onClick={onDelete} disabled={deletingId === webhook.id} style={{ padding: '7px 14px', background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                            <Trash2 size={12} /> {deletingId === webhook.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                    {/* Delivery log */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Deliveries</div>
                            <button onClick={onRefreshDeliveries} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <RefreshCw size={11} /> Refresh
                            </button>
                        </div>
                        {loadingDeliveries ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>
                        ) : !deliveries || deliveries.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No deliveries yet.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {deliveries.slice(0, 10).map(d => (
                                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }}>
                                        {d.success ? <CheckCircle size={13} color="#34d399" /> : <XCircle size={13} color="#f87171" />}
                                        <span style={{ fontFamily: 'monospace', color: '#6366f1', minWidth: '140px' }}>{d.event_type}</span>
                                        <span style={{ color: d.response_status >= 200 && d.response_status < 300 ? '#34d399' : '#f87171' }}>
                                            HTTP {d.response_status || 'N/A'}
                                        </span>
                                        <span style={{ color: '#64748b' }}>{d.duration_ms}ms</span>
                                        {d.retry_count > 0 && <span style={{ color: '#fbbf24' }}>{d.retry_count} retries</span>}
                                        <span style={{ marginLeft: 'auto', color: '#475569' }}>{new Date(d.delivered_at).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Create Webhook Form ─────────────────────────────────
function CreateWebhookForm({ onCreated }) {
    const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [showSecret, setShowSecret] = useState(false)

    function generateSecret() {
        const arr = new Uint8Array(24)
        crypto.getRandomValues(arr)
        setForm(p => ({ ...p, secret: Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('') }))
    }

    function toggleEvent(eventId) {
        setForm(p => ({
            ...p,
            events: p.events.includes(eventId) ? p.events.filter(e => e !== eventId) : [...p.events, eventId]
        }))
    }

    function selectAll() { setForm(p => ({ ...p, events: ALL_EVENTS.map(e => e.id) })) }
    function clearAll()  { setForm(p => ({ ...p, events: [] })) }

    async function handleCreate(e) {
        e.preventDefault()
        if (!form.events.length) { setError('Select at least one event'); return }
        setSaving(true); setError(null)
        try {
            await axios.post(`${API_BASE}/webhooks`, form)
            onCreated()
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally { setSaving(false) }
    }

    return (
        <form onSubmit={handleCreate} style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '1px solid #6366f1', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="#6366f1" /> Create New Webhook
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Webhook Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Slack Notifications" required
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Endpoint URL *</label>
                    <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://hooks.slack.com/..." type="url" required
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Signing Secret * (HMAC-SHA256)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={form.secret} onChange={e => setForm(p => ({ ...p, secret: e.target.value }))} type={showSecret ? 'text' : 'password'} placeholder="Min 16 chars" required
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }} />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ padding: '9px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={generateSecret} style={{ padding: '9px 14px', background: '#1e3a5f', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', color: '#60a5fa', fontSize: '12px' }}>
                        Generate
                    </button>
                </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Events to subscribe *</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={selectAll} style={{ fontSize: '11px', padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: '#60a5fa' }}>All</button>
                        <button type="button" onClick={clearAll} style={{ fontSize: '11px', padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}>None</button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                    {ALL_EVENTS.map(ev => {
                        const checked = form.events.includes(ev.id)
                        return (
                            <label key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px', background: checked ? '#1e293b' : 'var(--bg-primary)', borderRadius: '8px', border: `1px solid ${checked ? '#6366f1' : 'var(--border)'}`, cursor: 'pointer', transition: 'all .15s' }}>
                                <input type="checkbox" checked={checked} onChange={() => toggleEvent(ev.id)} style={{ marginTop: '2px', accentColor: '#6366f1' }} />
                                <div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6366f1', marginBottom: '2px' }}>{ev.id}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ev.desc}</div>
                                </div>
                            </label>
                        )
                    })}
                </div>
            </div>
            {error && <div style={{ padding: '10px', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    {saving ? 'Creating...' : 'Create Webhook'}
                </button>
                <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    Cancel
                </button>
            </div>
        </form>
    )
}
