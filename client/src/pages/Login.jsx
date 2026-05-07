import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../App'
import { useI18n, LANGUAGES } from '../services/i18n.jsx'
import {
    Mail, Lock, ArrowRight, Brain, X,
    Shield, GraduationCap, User,
    Sparkles, Database, Network, Cpu, BarChart3, Code2, Globe
} from 'lucide-react'
import './Login.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// Neural Network Background Component
function NeuralBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let animationId
        let neurons = []

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initNeurons()
        }

        const initNeurons = () => {
            neurons = []
            const count = Math.floor((canvas.width * canvas.height) / 18000)

            for (let i = 0; i < count; i++) {
                neurons.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius: Math.random() * 2 + 1,
                    pulsePhase: Math.random() * Math.PI * 2
                })
            }
        }

        const animate = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light'
            ctx.fillStyle = isLight ? 'rgba(248, 250, 252, 0.08)' : 'rgba(8, 12, 24, 0.08)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            neurons.forEach((neuron, i) => {
                neuron.x += neuron.vx
                neuron.y += neuron.vy
                neuron.pulsePhase += 0.015

                if (neuron.x < 0 || neuron.x > canvas.width) neuron.vx *= -1
                if (neuron.y < 0 || neuron.y > canvas.height) neuron.vy *= -1

                neurons.forEach((other, j) => {
                    if (i >= j) return
                    const dx = other.x - neuron.x
                    const dy = other.y - neuron.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < 120) {
                        const alpha = (1 - dist / 120) * 0.25
                        ctx.beginPath()
                        ctx.strokeStyle = isLight ? `rgba(59, 130, 246, ${alpha * 1.5})` : `rgba(59, 130, 246, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.moveTo(neuron.x, neuron.y)
                        ctx.lineTo(other.x, other.y)
                        ctx.stroke()
                    }
                })

                const pulse = Math.sin(neuron.pulsePhase) * 0.3 + 0.7
                const gradient = ctx.createRadialGradient(
                    neuron.x, neuron.y, 0,
                    neuron.x, neuron.y, neuron.radius * 3
                )
                gradient.addColorStop(0, `rgba(59, 130, 246, ${pulse})`)
                gradient.addColorStop(0.5, `rgba(59, 130, 246, ${pulse * 0.3})`)
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')

                ctx.beginPath()
                ctx.fillStyle = gradient
                ctx.arc(neuron.x, neuron.y, neuron.radius * 3, 0, Math.PI * 2)
                ctx.fill()

                ctx.beginPath()
                ctx.fillStyle = isLight ? `rgba(37, 99, 235, ${pulse})` : `rgba(147, 197, 253, ${pulse})`
                ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2)
                ctx.fill()
            })

            animationId = requestAnimationFrame(animate)
        }

        resize()
        const isCurrentLight = document.documentElement.getAttribute('data-theme') === 'light'
        ctx.fillStyle = isCurrentLight ? '#f8fafc' : '#080c18'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        animate()

        window.addEventListener('resize', resize)
        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return <canvas ref={canvasRef} className="neural-canvas" />
}

// AI Illustration Component
function AIIllustration() {
    return (
        <div className="ai-illustration">
            <div className="illustration-container">
                {/* Central Brain */}
                <div className="central-brain">
                    <Brain size={80} />
                    <div className="brain-pulse"></div>
                    <div className="brain-pulse delay-1"></div>
                    <div className="brain-pulse delay-2"></div>
                </div>

                {/* Floating Icons */}
                <div className="floating-icon icon-1">
                    <Database size={28} />
                </div>
                <div className="floating-icon icon-2">
                    <BarChart3 size={28} />
                </div>
                <div className="floating-icon icon-3">
                    <Code2 size={28} />
                </div>
                <div className="floating-icon icon-4">
                    <Cpu size={28} />
                </div>
                <div className="floating-icon icon-5">
                    <Network size={28} />
                </div>
                <div className="floating-icon icon-6">
                    <Sparkles size={28} />
                </div>

                {/* Connection Lines */}
                <svg className="connection-lines" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="80" fill="none" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="5,5" className="rotating-circle" />
                    <circle cx="200" cy="200" r="130" fill="none" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="3,3" className="rotating-circle reverse" />
                    <circle cx="200" cy="200" r="170" fill="none" stroke="url(#lineGradient)" strokeWidth="0.5" strokeDasharray="2,4" className="rotating-circle" />
                </svg>
            </div>

            <h3 className="illustration-title">
                <Sparkles size={20} />
                AI-Powered Learning
            </h3>
            <p className="illustration-desc">
                Experience intelligent code evaluation and personalized feedback
            </p>
        </div>
    )
}

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegisterMode, setIsRegisterMode] = useState(false)
    const [registerForm, setRegisterForm] = useState({
        name: '',
        phone: '',
        studentClass: '',
        email: '',
        password: ''
    })
    const [otpInput, setOtpInput] = useState('')
    const [demoOtp, setDemoOtp] = useState('')
    const [otpRequested, setOtpRequested] = useState(false)
    const [registering, setRegistering] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showLoginPanel, setShowLoginPanel] = useState(false)
    const [showLangMenu, setShowLangMenu] = useState(false)
    const { login } = useAuth()
    const { locale, setLocale, t } = useI18n()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)

        if (!result.success) {
            setError(result.error)
        }

        setLoading(false)
    }

    const requestDemoOtp = async (e) => {
        e.preventDefault()
        setError('')
        setRegistering(true)

        try {
            const response = await fetch(`${API_BASE}/auth/register/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerForm)
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate OTP')
            }

            setDemoOtp(data.demoOtp || '')
            setOtpRequested(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setRegistering(false)
        }
    }

    const verifyOtpAndRegister = async (e) => {
        e.preventDefault()
        setError('')
        setRegistering(true)

        try {
            const verifyResponse = await fetch(`${API_BASE}/auth/register/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registerForm.email, otp: otpInput })
            })
            const verifyData = await verifyResponse.json()
            if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'OTP verification failed')
            }

            const loginResult = await login(registerForm.email, registerForm.password)
            if (!loginResult.success) {
                throw new Error(loginResult.error || 'Registered but login failed. Please login manually.')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setRegistering(false)
        }
    }

    const switchAuthMode = (registerMode) => {
        setIsRegisterMode(registerMode)
        setError('')
        setOtpRequested(false)
        setDemoOtp('')
        setOtpInput('')
    }

    return (
        <div className="login-page">
            <NeuralBackground />

            {/* Navigation */}
            <nav className="login-nav">
                <div className="nav-logo">
                    <Brain className="logo-icon-svg" size={28} />
                    <span className="logo-text">Mentor Hub</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Language Switcher */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowLangMenu(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer',
                                color: '#fff', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(8px)'
                            }}
                        >
                            <Globe size={14} />
                            <span>{LANGUAGES.find(l => l.code === locale)?.flag}</span>
                            <span>{locale.toUpperCase()}</span>
                        </button>
                        {showLangMenu && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                background: 'rgba(15,20,40,0.96)', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '10px', overflow: 'hidden', minWidth: '140px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(12px)'
                            }}>
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setLocale(lang.code); setShowLangMenu(false) }}
                                        style={{
                                            width: '100%', padding: '0.55rem 1rem', border: 'none',
                                            background: locale === lang.code ? 'rgba(99,102,241,0.25)' : 'transparent',
                                            color: '#fff', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            fontSize: '0.85rem', fontWeight: locale === lang.code ? 700 : 400
                                        }}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.nativeName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="nav-login-btn" onClick={() => setShowLoginPanel(true)}>
                        {t('login')} <ArrowRight size={16} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="login-content">
                {/* Left - Hero Section */}
                <div className="hero-section">
                    <div className="hero-badge">
                        <Brain size={16} />
                        <span>AI & Data Science Learning Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Learn
                        with Mentors
                    </h1>
                    <p className="hero-subtitle">
                        Learn Machine Learning, Deep Learning, and Data Analytics
                        with personalized mentorship, hands-on projects, and AI-powered
                        code evaluation.
                    </p>
                    <button className="cta-button" onClick={() => setShowLoginPanel(true)}>
                        Get Started - It's Free <ArrowRight size={18} />
                    </button>
                </div>

                {/* Right - Dynamic Content (Illustration or Login Card) */}
                <div className="dynamic-container">
                    {!showLoginPanel ? (
                        <AIIllustration />
                    ) : (
                        <div className="login-card-inline animate-slideIn">
                            <button className="panel-back" onClick={() => setShowLoginPanel(false)}>
                                <X size={20} />
                            </button>

                            <div className="card-header">
                                <div className="header-icon">
                                    <Brain size={32} />
                                </div>
                                <h2>{isRegisterMode ? 'Create Account' : t('welcome_back')}</h2>
                                <p>{isRegisterMode ? 'Register with OTP verification' : t('login_subtitle')}</p>
                            </div>

                            <div className="auth-switch-row">
                                <button
                                    type="button"
                                    className={`auth-switch-btn ${!isRegisterMode ? 'active' : ''}`}
                                    onClick={() => switchAuthMode(false)}
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    className={`auth-switch-btn ${isRegisterMode ? 'active' : ''}`}
                                    onClick={() => switchAuthMode(true)}
                                >
                                    Register
                                </button>
                            </div>

                            {!isRegisterMode ? (
                                <form onSubmit={handleSubmit} className="login-form">
                                    <div className="form-group">
                                        <label htmlFor="email">{t('email')}</label>
                                        <div className="input-field">
                                            <Mail className="field-icon" size={18} />
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('email')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="password">{t('password')}</label>
                                        <div className="input-field">
                                            <Lock className="field-icon" size={18} />
                                            <input
                                                type="password"
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t('password')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="error-message">{error}</div>}

                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <div className="btn-spinner"></div>
                                                {t('loading')}
                                            </>
                                        ) : (
                                            <>
                                                {t('sign_in')}
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={otpRequested ? verifyOtpAndRegister : requestDemoOtp} className="login-form">
                                    <div className="form-group">
                                        <label htmlFor="reg-name">Name</label>
                                        <div className="input-field">
                                            <User className="field-icon" size={18} />
                                            <input
                                                type="text"
                                                id="reg-name"
                                                value={registerForm.name}
                                                onChange={(e) => setRegisterForm(v => ({ ...v, name: e.target.value }))}
                                                placeholder="Student name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="reg-phone">Phone Number</label>
                                        <div className="input-field">
                                            <Shield className="field-icon" size={18} />
                                            <input
                                                type="tel"
                                                id="reg-phone"
                                                value={registerForm.phone}
                                                onChange={(e) => setRegisterForm(v => ({ ...v, phone: e.target.value }))}
                                                placeholder="10-digit mobile number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="reg-class">Class</label>
                                        <div className="input-field">
                                            <GraduationCap className="field-icon" size={18} />
                                            <input
                                                type="text"
                                                id="reg-class"
                                                value={registerForm.studentClass}
                                                onChange={(e) => setRegisterForm(v => ({ ...v, studentClass: e.target.value }))}
                                                placeholder="e.g. 10, 11, 12, BTech 1st Year"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="reg-email">Email</label>
                                        <div className="input-field">
                                            <Mail className="field-icon" size={18} />
                                            <input
                                                type="email"
                                                id="reg-email"
                                                value={registerForm.email}
                                                onChange={(e) => setRegisterForm(v => ({ ...v, email: e.target.value }))}
                                                placeholder="Email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="reg-password">Password</label>
                                        <div className="input-field">
                                            <Lock className="field-icon" size={18} />
                                            <input
                                                type="password"
                                                id="reg-password"
                                                value={registerForm.password}
                                                onChange={(e) => setRegisterForm(v => ({ ...v, password: e.target.value }))}
                                                placeholder="Create password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {otpRequested && (
                                        <>
                                            <div className="demo-otp-box">
                                                <div className="demo-otp-label">Demo OTP</div>
                                                <div className="demo-otp-code">{demoOtp || '------'}</div>
                                                <div className="demo-otp-note">Use this OTP to complete registration.</div>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="reg-otp">Enter OTP</label>
                                                <div className="input-field">
                                                    <Shield className="field-icon" size={18} />
                                                    <input
                                                        type="text"
                                                        id="reg-otp"
                                                        value={otpInput}
                                                        onChange={(e) => setOtpInput(e.target.value)}
                                                        placeholder="6-digit OTP"
                                                        maxLength={6}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {error && <div className="error-message">{error}</div>}

                                    <button type="submit" className="submit-btn" disabled={registering}>
                                        {registering ? (
                                            <>
                                                <div className="btn-spinner"></div>
                                                {t('loading')}
                                            </>
                                        ) : otpRequested ? (
                                            <>
                                                Verify OTP & Login
                                                <ArrowRight size={18} />
                                            </>
                                        ) : (
                                            <>
                                                Sign Up
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Login
