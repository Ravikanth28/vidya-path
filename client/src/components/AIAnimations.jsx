/**
 * AIAnimations.jsx — Reusable AI & Data Science themed animation components v2
 * Department of Artificial Intelligence & Data Science | Mentor Hub
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { Sparkles, Activity, Brain, Database, BarChart3, Network, Cpu, Zap, TrendingUp, Trophy, CheckCircle } from 'lucide-react'
import './AIAnimations.css'

// ─── useCountUp ────────────────────────────────────────────────────────────────
/**
 * Animates a number from 0 → target using easeOutCubic.
 * @param {number} target  - Final value
 * @param {number} duration- Animation duration in ms (default 1300)
 * @param {boolean} run    - Whether to start the animation
 */
export function useCountUp(target, duration = 1300, run = true) {
    const [value, setValue] = useState(0)
    const rafRef = useRef(null)

    useEffect(() => {
        if (!run) return
        const numTarget = parseFloat(target) || 0
        const startTime = performance.now()

        const tick = (now) => {
            const elapsed  = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased    = 1 - Math.pow(1 - progress, 3)   // easeOutCubic
            setValue(
                Number.isInteger(numTarget)
                    ? Math.round(eased * numTarget)
                    : Math.round(eased * numTarget * 10) / 10
            )
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                setValue(numTarget)
            }
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [target, duration, run])

    return value
}

// ─── CountUp ───────────────────────────────────────────────────────────────────
/**
 * Renders an animated number that counts up when it scrolls into view.
 */
export function CountUp({ value, prefix = '', suffix = '', duration = 1300 }) {
    const [started, setStarted] = useState(false)
    const ref = useRef(null)
    const animated = useCountUp(value, duration, started)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true) },
            { threshold: 0.15 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <span ref={ref} className="ai-count-num">
            {prefix}{animated}{suffix}
        </span>
    )
}

// ─── DataFlowLine ─────────────────────────────────────────────────────────────
/**
 * A thin horizontal line with animated data "packets" flowing across it.
 */
export function DataFlowLine() {
    return (
        <div className="ai-flow-track" aria-hidden="true">
            <div className="ai-flow-packet" />
            <div className="ai-flow-packet" />
            <div className="ai-flow-packet" />
        </div>
    )
}

// ─── AIDeptBadge ──────────────────────────────────────────────────────────────
/**
 * Glowing badge displaying the department name.
 */
export function AIDeptBadge({ label = 'AI & Data Science' }) {
    return (
        <div className="ai-dept-badge" aria-label={`Department: ${label}`}>
            <span className="ai-dept-badge-dot" />
            <Sparkles size={10} />
            <span>{label}</span>
        </div>
    )
}

// ─── NeuralPulseIcon ──────────────────────────────────────────────────────────
/**
 * Wraps any element with expanding neural-pulse rings.
 */
export function NeuralPulseIcon({ children }) {
    return (
        <div className="ai-pulse-wrap" aria-hidden="true">
            <div className="ai-pulse-ring" />
            <div className="ai-pulse-ring" />
            {children}
        </div>
    )
}

// ─── AIPageTransition ─────────────────────────────────────────────────────────
/**
 * Wraps a page/section with a smooth slide-up + fade entrance.
 */
export function AIPageTransition({ children, className = '' }) {
    return (
        <div className={`ai-page-enter ${className}`}>
            {children}
        </div>
    )
}

// ─── AISectionDivider ─────────────────────────────────────────────────────────
/**
 * Decorative section separator with a centred label.
 */
export function AISectionDivider({ label, icon: Icon = Activity }) {
    return (
        <div className="ai-divider" role="separator" aria-label={label}>
            <div className="ai-divider-line" />
            <div className="ai-divider-label">
                <Icon size={13} />
                {label}
            </div>
            <div className="ai-divider-line" />
        </div>
    )
}

// ─── AIParticles ──────────────────────────────────────────────────────────────
/**
 * Decorative floating data particles — place inside a position:relative container.
 */
export function AIParticles() {
    const particles = [
        { left: '5%',  top: '88%', color: 'rgba(59,130,246,0.55)',   delay: '0s',    dur: '4.5s' },
        { left: '20%', top: '82%', color: 'rgba(139,92,246,0.50)',   delay: '1.1s',  dur: '5.2s' },
        { left: '40%', top: '90%', color: 'rgba(59,130,246,0.45)',   delay: '2.0s',  dur: '3.8s' },
        { left: '60%', top: '85%', color: 'rgba(6,182,212,0.50)',    delay: '0.6s',  dur: '4.9s' },
        { left: '80%', top: '87%', color: 'rgba(139,92,246,0.45)',   delay: '1.7s',  dur: '5.5s' },
    ]
    return (
        <div className="ai-particles-host" aria-hidden="true">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="ai-ptcl"
                    style={{
                        left: p.left, top: p.top,
                        background: p.color,
                        animationDelay: p.delay,
                        animationDuration: p.dur
                    }}
                />
            ))}
        </div>
    )
}

// ─── MatrixDecor ──────────────────────────────────────────────────────────────
/**
 * A row of cascading matrix-style characters — purely decorative.
 */
export function MatrixDecor({ chars = ['0', '1', 'λ', '∑', '∇', 'σ'] }) {
    return (
        <span aria-hidden="true">
            {chars.map((c, i) => (
                <span key={i} className="ai-matrix-char">{c}</span>
            ))}
        </span>
    )
}

// ─── AIStatCard ───────────────────────────────────────────────────────────────
/**
 * A fully animated stat card with:
 *   - CountUp number
 *   - AI icon glow pulse
 *   - Radial glow decoration
 *   - Hover lift effect
 *
 * Props:
 *   icon     — Lucide icon component
 *   label    — Card subtitle
 *   value    — Numeric value to count up to
 *   suffix   — e.g. '%'
 *   gradient — CSS gradient string for the icon bg
 *   glowRgb  — e.g. '59,130,246'  (for rgba glow)
 *   footer   — JSX rendered below the stat
 */
export function AIStatCard({
    icon: Icon,
    label,
    value,
    suffix = '',
    gradient = 'linear-gradient(135deg,#1e40af,#3b82f6)',
    glowRgb = '59,130,246',
    footer = null,
}) {
    return (
        <div
            className="ai-glow-card"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Corner glow */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '80px', height: '80px',
                    background: `radial-gradient(circle at top right, rgba(${glowRgb},0.18), transparent 70%)`,
                    pointerEvents: 'none',
                }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                {/* Glowing icon */}
                <div
                    className="ai-icon-glow"
                    style={{
                        '--ai-glow': `rgba(${glowRgb},0.4)`,
                        width: '48px', height: '48px',
                        borderRadius: '12px',
                        background: gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon size={22} color="white" />
                </div>

                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                        <CountUp value={value} suffix={suffix} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {label}
                    </div>
                </div>
            </div>

            {footer && (
                <div style={{ marginTop: '1rem', position: 'relative', zIndex: 1 }}>
                    {footer}
                </div>
            )}
        </div>
    )
}

// ─── AIWelcomeHeader ──────────────────────────────────────────────────────────
/**
 * A re-usable animated welcome header for portal dashboards.
 *
 * Props:
 *   icon    — Lucide icon component
 *   title   — Main heading text
 *   sub     — Subtitle / description
 *   badges  — Array of { label, color } for extra tags
 */
export function AIWelcomeHeader({ icon: Icon = Brain, title, sub, badges = [] }) {
    return (
        <div
            style={{
                background: 'linear-gradient(135deg,rgba(59,130,246,0.10) 0%,rgba(139,92,246,0.10) 60%,rgba(6,182,212,0.05) 100%)',
                borderRadius: '20px',
                padding: '2rem 2.5rem',
                marginBottom: '2rem',
                border: '1px solid rgba(59,130,246,0.18)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative radial glow */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', top: '-50%', right: '-8%',
                    width: '380px', height: '380px',
                    background: 'radial-gradient(circle,rgba(59,130,246,0.14) 0%,transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Floating particles */}
            <AIParticles />

            {/* Matrix decoration — top-right corner */}
            <div
                aria-hidden="true"
                style={{ position: 'absolute', top: '1rem', right: '1.5rem', opacity: 0.4 }}
            >
                <MatrixDecor />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Dept badge */}
                <div style={{ marginBottom: '0.85rem' }}>
                    <AIDeptBadge />
                </div>

                {/* Icon + Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                    <NeuralPulseIcon>
                        <div
                            className="ai-icon-glow"
                            style={{
                                '--ai-glow': 'rgba(59,130,246,0.45)',
                                width: '50px', height: '50px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                            }}
                        >
                            <Icon size={24} color="white" />
                        </div>
                    </NeuralPulseIcon>

                    <div>
                        <h1
                            style={{
                                margin: 0,
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg,#f8fafc,#94a3b8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {title}
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {sub}
                        </p>
                    </div>
                </div>

                {/* Data flow line */}
                <DataFlowLine />

                {/* Optional extra badges */}
                {badges.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        {badges.map((b, i) => (
                            <span
                                key={i}
                                style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: b.color || 'rgba(59,130,246,0.12)',
                                    color: b.text || '#60a5fa',
                                    border: `1px solid ${b.border || 'rgba(59,130,246,0.2)'}`,
                                }}
                            >
                                {b.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── AIOrbitDecor ─────────────────────────────────────────────────────────────
/**
 * Three concentric spinning orbit rings — purely decorative background.
 * Place inside a position:relative container.
 */
export function AIOrbitDecor({ size = 120 }) {
    return (
        <div className="ai-orbit-wrap" aria-hidden="true"
            style={{ width: size, height: size, position: 'absolute', pointerEvents: 'none' }}>
            <div className="ai-orbit-r" style={{ width: size * 0.55, height: size * 0.55 }} />
            <div className="ai-orbit-r r2" style={{ width: size * 0.78, height: size * 0.78 }} />
            <div className="ai-orbit-r r3" style={{ width: size * 1, height: size * 1 }} />
        </div>
    )
}

// ─── AIProgressRing ───────────────────────────────────────────────────────────
/**
 * Circular SVG progress ring that animates in on mount.
 * Props: value (0-100), size, strokeWidth, color, label
 */
export function AIProgressRing({ value = 75, size = 80, strokeWidth = 7, color = '#3b82f6', label = '' }) {
    const [started, setStarted] = useState(false)
    const ref = useRef(null)
    const r = (size - strokeWidth) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (circ * (started ? value : 0)) / 100

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.2 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} className="ai-progress-ring">
                <circle className="track" cx={size/2} cy={size/2} r={r} strokeWidth={strokeWidth}
                    style={{ stroke: 'rgba(59,130,246,0.1)' }} />
                <circle className="fill" cx={size/2} cy={size/2} r={r} strokeWidth={strokeWidth}
                    style={{
                        stroke: color,
                        fill: 'none',
                        strokeLinecap: 'round',
                        strokeDasharray: circ,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)',
                    }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                textAlign: 'center',
                fontSize: size < 70 ? '0.75rem' : '0.9rem',
                fontWeight: 800,
                color,
                lineHeight: 1.1,
            }}>
                <div>{value}%</div>
                {label && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>}
            </div>
        </div>
    )
}

// ─── AIFloatCard ──────────────────────────────────────────────────────────────
/**
 * A wrapper that makes a card gently float up and down.
 */
export function AIFloatCard({ children, delay = '0s', style = {} }) {
    return (
        <div className="ai-float" style={{ animationDelay: delay, ...style }}>
            {children}
        </div>
    )
}

// ─── AITypingText ─────────────────────────────────────────────────────────────
/**
 * Cycles through an array of texts with a typewriter + fade effect.
 */
export function AITypingText({ texts = ['AI Analytics', 'Data Intelligence', 'Neural Networks'], interval = 3000 }) {
    const [idx, setIdx] = useState(0)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const timer = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setIdx(i => (i + 1) % texts.length)
                setVisible(true)
            }, 350)
        }, interval)
        return () => clearInterval(timer)
    }, [texts, interval])

    return (
        <span style={{
            display: 'inline-block',
            transition: 'opacity 0.35s ease',
            opacity: visible ? 1 : 0,
            color: '#60a5fa',
            fontWeight: 700,
        }}>
            {texts[idx]}
        </span>
    )
}

// ─── AIGlowButton ─────────────────────────────────────────────────────────────
/**
 * A button with ripple + glow effect on click/hover.
 */
export function AIGlowButton({ children, onClick, style = {}, disabled = false, color = '#3b82f6' }) {
    const [ripples, setRipples] = useState([])

    const addRipple = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()
        setRipples(r => [...r, { id, x, y }])
        setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 700)
    }

    return (
        <button
            className="ai-glow-btn"
            onClick={(e) => { addRipple(e); onClick?.(e) }}
            disabled={disabled}
            style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.6rem 1.2rem',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
        >
            {ripples.map(r => (
                <span key={r.id} aria-hidden="true" style={{
                    position: 'absolute',
                    left: r.x, top: r.y,
                    width: '8px', height: '8px',
                    marginLeft: '-4px', marginTop: '-4px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    animation: 'aiRipple 0.7s ease-out forwards',
                    pointerEvents: 'none',
                }} />
            ))}
            {children}
        </button>
    )
}

// ─── AIBigParticles ───────────────────────────────────────────────────────────
/**
 * 10-particle enhanced version with varied sizes and paths.
 */
export function AIBigParticles() {
    const particles = useMemo(() => [
        { left: '3%',  top: '85%', color: 'rgba(59,130,246,0.55)',  delay: '0s',    dur: '4.2s', size: 4 },
        { left: '12%', top: '90%', color: 'rgba(139,92,246,0.45)',  delay: '0.8s',  dur: '5.5s', size: 3 },
        { left: '24%', top: '82%', color: 'rgba(59,130,246,0.40)',  delay: '1.6s',  dur: '3.8s', size: 5 },
        { left: '36%', top: '88%', color: 'rgba(6,182,212,0.50)',   delay: '0.4s',  dur: '4.9s', size: 3 },
        { left: '48%', top: '84%', color: 'rgba(139,92,246,0.45)',  delay: '2.1s',  dur: '5.2s', size: 4 },
        { left: '58%', top: '89%', color: 'rgba(59,130,246,0.50)',  delay: '1.0s',  dur: '4.4s', size: 3 },
        { left: '68%', top: '83%', color: 'rgba(16,185,129,0.40)',  delay: '1.8s',  dur: '3.6s', size: 5 },
        { left: '76%', top: '87%', color: 'rgba(245,158,11,0.35)',  delay: '0.6s',  dur: '5.8s', size: 3 },
        { left: '86%', top: '91%', color: 'rgba(139,92,246,0.50)',  delay: '2.4s',  dur: '4.1s', size: 4 },
        { left: '94%', top: '85%', color: 'rgba(59,130,246,0.45)',  delay: '1.3s',  dur: '5.0s', size: 3 },
    ], [])

    return (
        <div className="ai-particles-host" aria-hidden="true">
            {particles.map((p, i) => (
                <div key={i} className="ai-ptcl" style={{
                    left: p.left, top: p.top,
                    width: p.size, height: p.size,
                    background: p.color,
                    animationDelay: p.delay,
                    animationDuration: p.dur,
                }} />
            ))}
        </div>
    )
}

// ─── AILeaderboardHeader ──────────────────────────────────────────────────────
/**
 * Specialised header for leaderboard/ranking sections.
 */
export function AILeaderboardHeader({ icon: Icon = Trophy, title, sub, stats = [] }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg,rgba(245,158,11,0.08) 0%,rgba(251,191,36,0.06) 40%,rgba(59,130,246,0.06) 100%)',
            borderRadius: '18px',
            padding: '1.75rem 2rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(245,158,11,0.18)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <AIParticles />
            <div aria-hidden="true" style={{
                position: 'absolute', top: '-40%', right: '-5%',
                width: '280px', height: '280px',
                background: 'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
                <AIDeptBadge />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0 0.25rem' }}>
                    <NeuralPulseIcon>
                        <div className="ai-icon-glow" style={{
                            '--ai-glow': 'rgba(245,158,11,0.45)',
                            width: '46px', height: '46px', borderRadius: '13px',
                            background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon size={22} color="white" />
                        </div>
                    </NeuralPulseIcon>
                    <div>
                        <h2 className="ai-gradient-text" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{title}</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{sub}</p>
                    </div>
                </div>
                <DataFlowLine />
                {stats.length > 0 && (
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        {stats.map((s, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span style={{ fontWeight: 800, fontSize: '1rem', color: s.color || '#f59e0b' }}>{s.value}</span>
                                {' '}{s.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── AISectionCard ────────────────────────────────────────────────────────────
/**
 * A glass-morphism panel with animated gradient border accent at top.
 */
export function AISectionCard({ children, style = {}, className = '' }) {
    return (
        <div
            className={`ai-glass ai-pulse-card ${className}`}
            style={{
                borderRadius: '18px',
                padding: '1.5rem',
                ...style,
            }}
        >
            {children}
        </div>
    )
}

// ─── AIStatsRow ───────────────────────────────────────────────────────────────
/**
 * A quick horizontal row of mini stat pills — ideal for leaderboard summaries.
 * stats: [{ label, value, color, icon: LucideComponent }]
 */
export function AIStatsRow({ stats = [] }) {
    return (
        <div className="ai-stagger-20" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {stats.map((s, i) => (
                <div key={i} className="ai-stat-mini" style={{
                    animationDelay: `${i * 0.07}s`,
                    background: 'var(--bg-card)',
                    border: `1px solid ${s.color ? `${s.color}30` : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    padding: '0.75rem 1.1rem',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    minWidth: '110px',
                }}>
                    {s.icon && (
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            background: s.color ? `${s.color}18` : 'rgba(59,130,246,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <s.icon size={15} color={s.color || '#60a5fa'} />
                        </div>
                    )}
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color || '#60a5fa', lineHeight: 1 }}>
                            <CountUp value={typeof s.value === 'number' ? s.value : 0} suffix={s.suffix || ''} />
                            {typeof s.value !== 'number' && s.value}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
