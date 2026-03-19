/**
 * AIAnimations.jsx — Reusable AI & Data Science themed animation components
 * Department of Artificial Intelligence & Data Science | Mentor Hub
 */
import { useState, useEffect, useRef } from 'react'
import { Sparkles, Activity, Brain, Database, BarChart3, Network, Cpu, Zap } from 'lucide-react'
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
