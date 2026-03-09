import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Code, Send, Trophy, Clock, CheckCircle, XCircle, ChevronRight, Play, Upload, FileText, Trash2, Eye, AlertTriangle, Download, Lightbulb, HelpCircle, Sparkles, Target, Zap, BookOpen, Brain, Award, X, Video, Shield, Search, BarChart2, BarChart3, Flame, Layers, Database, RefreshCw, TrendingUp, Radar, Users, ArrowUpRight, ArrowDownRight, Minus, PieChart, MessageSquare, Github, ExternalLink, Link2, Calendar, Map, Building2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AptitudeTestInterface from '@/components/AptitudeTestInterface'
import GlobalTestInterface from '@/components/GlobalTestInterface'
import AptitudeReportModal from '@/components/AptitudeReportModal'
import ProctoredCodeEditor from '@/components/ProctoredCodeEditor'
import CodeOutputPreview from '@/components/CodeOutputPreview'
import SQLValidator from '@/components/SQLValidator'
import SQLVisualizer from '@/components/SQLVisualizer'
import SQLDebugger from '@/components/SQLDebugger'
import DirectMessaging from '@/components/DirectMessaging'
import SkillTestPortal from '@/components/SkillTestPortal'
import SkillSubmissions from '@/components/SkillSubmissions'
import CodeReviewPanel from '@/components/CodeReviewPanel'
import ExportReports from '@/components/ExportReports'
import PlagiarismChecker from '@/components/PlagiarismChecker'
import MentorAvailabilityView from '@/components/MentorAvailabilityView'
import FeaturesShowcase from '@/components/FeaturesShowcase'
import { useAuth } from '../App'
import { useI18n } from '../services/i18n.jsx'
import axios from 'axios'
import socketService from '../services/socketService'
import GlobalReportModal from '@/components/GlobalReportModal'
import Editor from '@monaco-editor/react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RRadar, BarChart as RBarChart, Bar, Legend } from 'recharts'
// Advanced Features Components
import { GamificationProfile, AchievementBadges, GamificationLeaderboard } from '@/components/GamificationComponents'
import { RiskScoreCard, RecommendationsPanel } from '@/components/AnalyticsComponents'
// New Features
import StudentResourceLinks from '@/components/StudentResourceLinks'
import StudentMCQ from '@/components/StudentMCQ'
import CertificatePortal from '@/components/CertificatePortal'
import { StudentAIReviewDashboard } from '@/components/AICodeReview'
import { CompanyRoadmap, CompanyPrep } from '@/components/CompanyFeatures'
import CompanyRoundInterface from '@/components/CompanyRoundInterface'
import YouTubeRecommendations from '@/components/YouTubeRecommendations'
import './Portal.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

// Language configurations for code editor
const LANGUAGE_CONFIG = {
    'Python': { monacoLang: 'python', ext: '.py', defaultCode: `# Write your Python code here\n\ndef solution():\n    pass\n\n# Call your solution\nsolution()` },
    'JavaScript': { monacoLang: 'javascript', ext: '.js', defaultCode: `// Write your JavaScript code here\n\nfunction solution() {\n    \n}\n\n// Call your solution\nsolution();` },
    'Java': { monacoLang: 'java', ext: '.java', defaultCode: `// Write your Java code here\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}` },
    'C': { monacoLang: 'c', ext: '.c', defaultCode: `// Write your C code here\n#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}` },
    'C++': { monacoLang: 'cpp', ext: '.cpp', defaultCode: `// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}` },
    'SQL': { monacoLang: 'sql', ext: '.sql', defaultCode: `-- Write your SQL query here\nSELECT * FROM table_name;` }
}

function StudentPortal() {
    const { user } = useAuth()
    const { t } = useI18n()
    const location = useLocation()
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [mentorInfo, setMentorInfo] = useState(null)
    const [unreadCount, setUnreadCount] = useState(0)

    // Poll for unread messages
    useEffect(() => {
        const userId = user?.id || user?.userId
        if (!userId) return
        const fetchUnread = async () => {
            try {
                const res = await axios.get(`${API_BASE}/messages/unread/${userId}`)
                setUnreadCount(res.data.unreadCount || 0)
            } catch (e) { /* ignore */ }
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 15000)
        return () => clearInterval(interval)
    }, [user])

    // Fetch mentor info once
    useEffect(() => {
        if (user?.id) {
            axios.get(`${API_BASE}/analytics/student/${user.id}`)
                .then(res => {
                    if (res.data.mentorInfo) {
                        setMentorInfo(res.data.mentorInfo)
                    }
                })
                .catch(err => console.error('Error fetching mentor info:', err))
        }
    }, [user?.id])

    useEffect(() => {
        const path = location.pathname.split('/').pop()
        switch (path) {
            case 'tasks':
                setTitle(t('ml_tasks'))
                setSubtitle(t('ml_tasks_subtitle'))
                break
            case 'assignments':
                setTitle(t('coding_problems'))
                setSubtitle(t('solve_coding_subtitle'))
                break
            case 'aptitude':
                setTitle(t('aptitude_tests'))
                setSubtitle(t('aptitude_subtitle'))
                break
            case 'global-tests':
                setTitle(t('global_complete_tests'))
                setSubtitle(t('global_tests_student_subtitle'))
                break
            case 'submissions':
                setTitle(t('my_submissions'))
                setSubtitle(t('submissions_subtitle'))
                break
            case 'analytics':
                setTitle(t('my_analytics'))
                setSubtitle(t('analytics_subtitle'))
                break
            case 'messaging':
                setTitle('Messages')
                setSubtitle('Chat with your mentor')
                break
            case 'skill-tests':
                setTitle('Skill Tests')
                setSubtitle('AI-powered skill assessments')
                break
            case 'skill-submissions':
                setTitle('Skill Test Submissions')
                setSubtitle('View your skill test results & reports')
                break
            case 'connect-alumni':
                setTitle('Connect Alumni')
                setSubtitle('Network with alumni for career growth')
                break
            case 'company-roadmap':
                setTitle('Company Roadmap')
                setSubtitle('Your personalized guide to crack top companies')
                break
            case 'company-prep':
                setTitle('Company Preparation')
                setSubtitle('AI-powered interactive interview drills')
                break
            case 'company-round-tests':
                setTitle('Company Round Tests')
                setSubtitle('Take company first round assessments')
                break
            case 'youtube':
                setTitle('YouTube Learning Resources')
                setSubtitle('AI-curated top 5 YouTube videos for any topic you ask')
                break
            case 'resource-links':
                setTitle('Resource Links')
                setSubtitle('Curated resources and links assigned to you')
                break
            case 'mcq':
                setTitle('MCQ Tests')
                setSubtitle('Take tests and get instant AI-powered evaluation')
                break
            default:
                setTitle(t('dashboard'))
                setSubtitle(t('welcome_back_name', { name: user?.name || '' }))
        }
    }, [location, user, t])

    const navItems = [
        { path: '/student', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        {
            label: 'Learning',
            icon: <ClipboardList size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/student/tasks', label: t('ml_tasks'), icon: <ClipboardList size={20} /> },
                { path: '/student/assignments', label: t('coding_problems'), icon: <Code size={20} /> },
                { path: '/student/aptitude', label: t('aptitude_tests'), icon: <Brain size={20} /> },
                { path: '/student/global-tests', label: t('global_complete_tests'), icon: <Layers size={20} /> },
                { path: '/student/skill-tests', label: 'Skill Tests', icon: <Target size={20} /> },
                { path: '/student/company-roadmap', label: 'Company Roadmap', icon: <Map size={20} /> },
                { path: '/student/company-prep', label: 'Company Prep', icon: <Building2 size={20} /> },
                { path: '/student/company-round-tests', label: 'Round Tests', icon: <Target size={20} /> },
                { path: '/student/youtube', label: 'YouTube Resources', icon: <BookOpen size={20} /> },
                { path: '/student/resource-links', label: 'Resource Links', icon: <Link2 size={20} /> },
                { path: '/student/mcq', label: 'MCQ Tests', icon: <Brain size={20} /> }
            ]
        },
        {
            label: 'Progress & Analytics',
            icon: <TrendingUp size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/student/submissions', label: t('my_submissions'), icon: <Send size={20} /> },
                { path: '/student/skill-submissions', label: 'Skill Submissions', icon: <Target size={20} /> },
                { path: '/student/analytics', label: t('my_analytics'), icon: <TrendingUp size={20} /> },
                { path: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} /> },
                { path: '/student/badges', label: 'Skill Badges', icon: <Award size={20} /> },
                { path: '/student/certificates', label: 'My Certificates', icon: <Award size={20} /> },
                { path: '/student/reports', label: 'Export Reports', icon: <Download size={20} /> }
            ]
        },
        {
            label: 'Review & Collaboration',
            icon: <Github size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/student/code-reviews', label: 'Code Reviews', icon: <Github size={20} /> },
                { path: '/student/ai-reviews', label: 'AI Code Reviews', icon: <Zap size={20} /> },
                { path: '/student/plagiarism', label: 'Plagiarism Check', icon: <AlertTriangle size={20} /> },
                { path: '/student/messaging', label: 'Direct Messages', icon: <MessageSquare size={20} />, badge: unreadCount }
            ]
        },
        {
            label: 'My Mentor',
            icon: <Calendar size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/student/availability', label: 'Mentor Availability', icon: <Calendar size={20} /> }
            ]
        },
        { path: '/connect-alumni', label: 'Connect Alumni', icon: <Users size={20} />, highlight: true, external: true }
    ]

    return (
        <DashboardLayout navItems={navItems} title={title} subtitle={subtitle} mentorInfo={mentorInfo}>
            <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/tasks" element={<Tasks key={user?.id} user={user} />} />
                <Route path="/assignments" element={<Assignments key={user?.id} user={user} />} />
                <Route path="/aptitude" element={<AptitudeTests user={user} />} />
                <Route path="/global-tests" element={<GlobalTests user={user} />} />
                <Route path="/skill-tests" element={<SkillTestPortal user={user} />} />
                <Route path="/skill-submissions" element={<SkillSubmissions user={user} />} />
                <Route path="/submissions" element={<Submissions user={user} />} />
                <Route path="/analytics" element={<StudentAnalytics user={user} />} />
                <Route path="/leaderboard" element={<GamificationLeaderboard limit={100} />} />
                <Route path="/badges" element={<AchievementBadges studentId={user?.id} />} />
                <Route path="/reports" element={<ExportReports user={user} />} />
                <Route path="/code-reviews" element={<StudentCodeReviews user={user} />} />
                <Route path="/ai-reviews" element={<StudentAIReviewDashboard user={user} />} />
                <Route path="/plagiarism" element={<PlagiarismChecker user={user} />} />
                <Route path="/messaging" element={<DirectMessaging currentUser={user} />} />
                <Route path="/availability" element={<MentorAvailabilityView user={user} />} />
                <Route path="/certificates" element={<CertificatePortal user={user} />} />
                <Route path="/features" element={<FeaturesShowcase />} />
                <Route path="/company-roadmap" element={<CompanyRoadmap user={user} />} />
                <Route path="/company-prep" element={<CompanyPrep user={user} />} />
                <Route path="/company-round-tests" element={<CompanyRoundInterface user={user} />} />
                <Route path="/youtube" element={<YouTubeRecommendations user={user} />} />
                <Route path="/resource-links" element={<StudentResourceLinks user={user} />} />
                <Route path="/mcq" element={<StudentMCQ user={user} />} />
            </Routes>
        </DashboardLayout>
    )
}

function Dashboard({ user }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = () => {
        setLoading(true)
        axios.get(`${API_BASE}/analytics/student/${user.id}`)
            .then(res => {
                setStats(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchData()
    }, [user.id])

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="loading-spinner"></div>
        </div>
    )
    if (!stats) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Unable to load dashboard data</div>

    // Chart data
    const trendData = stats.submissionTrends && stats.submissionTrends.length > 0
        ? stats.submissionTrends
        : (() => {
            const days = []
            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i)
                days.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 })
            }
            return days
        })()

    const completionData = [
        { name: 'Tasks', completed: stats.completedTasks, total: stats.totalTasks },
        { name: 'Coding', completed: stats.completedProblems, total: stats.totalProblems },
        { name: 'Aptitude', completed: stats.completedAptitude, total: stats.totalAptitude }
    ]

    const pieData = [
        { name: 'Tasks', value: stats.completedTasks || 0, color: '#3b82f6' },
        { name: 'Code', value: stats.completedProblems || 0, color: '#10b981' },
        { name: 'Aptitude', value: stats.completedAptitude || 0, color: '#a78bfa' },
        { name: 'Remaining', value: Math.max(0, (stats.totalTasks - stats.completedTasks) + (stats.totalProblems - stats.completedProblems) + (stats.totalAptitude - stats.completedAptitude)), color: 'rgba(100,116,139,0.2)' }
    ].filter(d => d.value > 0)

    const radarData = [
        { subject: 'Task Score', A: stats.avgTaskScore || 0 },
        { subject: 'Code Score', A: stats.avgProblemScore || 0 },
        { subject: 'Tasks Done', A: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0 },
        { subject: 'Code Done', A: stats.totalProblems > 0 ? Math.round((stats.completedProblems / stats.totalProblems) * 100) : 0 },
        { subject: 'Aptitude', A: stats.totalAptitude > 0 ? Math.round((stats.completedAptitude / stats.totalAptitude) * 100) : 0 }
    ]

    const totalDone = stats.completedTasks + stats.completedProblems + stats.completedAptitude
    const totalAll = stats.totalTasks + stats.totalProblems + stats.totalAptitude
    const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

    // Circular Progress helper
    const CircleProgress = ({ pct, size = 52, strokeWidth = 5, color }) => {
        const r = (size - strokeWidth) / 2
        const circ = 2 * Math.PI * r
        const offset = circ - (Math.min(pct, 100) / 100) * circ
        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
        )
    }

    const ChartTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="dash-tooltip">
                    <div className="dash-tooltip-label">{label}</div>
                    {payload.map((p, i) => (
                        <div key={i} className="dash-tooltip-value" style={{ color: p.color || p.stroke || '#818cf8' }}>{p.name}: {p.value}</div>
                    ))}
                </div>
            )
        }
        return null
    }

    const scoreColors = ['#3b82f6', '#10b981', '#a78bfa']

    return (
        <div className="sdash">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Overview</h2>
                <button
                    onClick={fetchData}
                    className="refresh-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="sdash-stats">
                {[
                    { label: 'Tasks', done: stats.completedTasks, total: stats.totalTasks, icon: <ClipboardList size={20} />, color: '#3b82f6', gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)' },
                    { label: 'Problems', done: stats.completedProblems, total: stats.totalProblems, icon: <Code size={20} />, color: '#10b981', gradient: 'linear-gradient(135deg, #047857, #10b981)' },
                    { label: 'Aptitude', done: stats.completedAptitude, total: stats.totalAptitude, icon: <Brain size={20} />, color: '#a78bfa', gradient: 'linear-gradient(135deg, #6d28d9, #a78bfa)' },
                    { label: 'Task Score', done: stats.avgTaskScore, total: 100, icon: <Award size={20} />, color: '#f472b6', gradient: 'linear-gradient(135deg, #be185d, #f472b6)', suffix: '%' },
                    { label: 'Code Score', done: stats.avgProblemScore, total: 100, icon: <Target size={20} />, color: '#fbbf24', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', suffix: '%' },
                    { label: 'Overall', done: overallPct, total: 100, icon: <TrendingUp size={20} />, color: '#06b6d4', gradient: 'linear-gradient(135deg, #0e7490, #06b6d4)', suffix: '%' }
                ].map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
                    return (
                        <div key={i} className="sdash-stat-card">
                            <div className="sdash-stat-ring">
                                <CircleProgress pct={pct} color={s.color} />
                                <div className="sdash-stat-icon" style={{ background: s.gradient }}>
                                    {React.cloneElement(s.icon, { color: '#fff', size: 18 })}
                                </div>
                            </div>
                            <div className="sdash-stat-info">
                                <div className="sdash-stat-val">{s.done}{s.suffix || ''}{!s.suffix && <span className="sdash-stat-dim">/{s.total}</span>}</div>
                                <div className="sdash-stat-lbl">{s.label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Row 2: Main charts */}
            <div className="sdash-row2">
                {/* Submission Activity - Area Chart */}
                <div className="sdash-card sdash-grow">
                    <div className="sdash-card-head">
                        <h3><TrendingUp size={16} color="#818cf8" /> Activity</h3>
                        <span className="sdash-badge-sm" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)' }}>7 Days</span>
                    </div>
                    <div style={{ width: '100%', height: 200, marginTop: 8 }}>
                        <ResponsiveContainer>
                            <AreaChart data={trendData} margin={{ top: 5, right: 8, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="count" name="Submissions" stroke="#818cf8" strokeWidth={2.5} fill="url(#aGrad)" dot={{ r: 3, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Progress Bar Chart */}
                <div className="sdash-card">
                    <div className="sdash-card-head">
                        <h3><BarChart3 size={16} color="#10b981" /> Progress</h3>
                    </div>
                    <div style={{ width: '100%', height: 200, marginTop: 8 }}>
                        <ResponsiveContainer>
                            <RBarChart data={completionData} margin={{ top: 5, right: 8, left: -25, bottom: 0 }} barGap={4} barSize={22}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]} fill="#10b981" />
                                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="rgba(100,116,139,0.25)" />
                            </RBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Donut + Radar + Gamification */}
            <div className="sdash-row3">
                {/* Donut chart */}
                <div className="sdash-card sdash-center-card">
                    <div className="sdash-card-head">
                        <h3><PieChart size={16} color="#a78bfa" /> Completion</h3>
                    </div>
                    <div style={{ width: '100%', height: 175, position: 'relative', marginTop: 4 }}>
                        <ResponsiveContainer>
                            <RPieChart>
                                <Pie data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: 'rgba(100,116,139,0.2)' }]} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                    {(pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: 'rgba(100,116,139,0.2)' }]).map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </RPieChart>
                        </ResponsiveContainer>
                        <div className="sdash-donut-center">
                            <span className="sdash-donut-pct">{overallPct}%</span>
                            <span className="sdash-donut-sub">Done</span>
                        </div>
                    </div>
                    <div className="sdash-legend">
                        {[{ l: 'Tasks', c: '#3b82f6' }, { l: 'Code', c: '#10b981' }, { l: 'Aptitude', c: '#a78bfa' }].map(x => (
                            <span key={x.l} className="sdash-legend-item"><span className="sdash-legend-dot" style={{ background: x.c }} />{x.l}</span>
                        ))}
                    </div>
                </div>

                {/* Radar */}
                <div className="sdash-card sdash-center-card">
                    <div className="sdash-card-head">
                        <h3><Radar size={16} color="#f472b6" /> Skill Radar</h3>
                    </div>
                    <div style={{ width: '100%', height: 210, marginTop: 4 }}>
                        <ResponsiveContainer>
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                                <PolarGrid stroke="rgba(148,163,184,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                <RRadar name="Score" dataKey="A" stroke="#f472b6" fill="#f472b6" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: '#f472b6' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gamification Card */}
                <div className="sdash-card sdash-gami-card">
                    <GamificationProfile studentId={user?.id || user?.userId} />
                </div>
            </div>

            {/* Row 4: Risk + Skills + Recent + Leaderboard */}
            <div className="sdash-row4">
                {/* Risk Assessment */}
                <div className="sdash-card">
                    <RiskScoreCard studentId={user?.id || user?.userId} />
                </div>

                {/* Skill Bars */}
                <div className="sdash-card">
                    <div className="sdash-card-head">
                        <h3><Layers size={16} color="#8b5cf6" /> Skills</h3>
                    </div>
                    <div className="sdash-skills">
                        {[
                            { name: 'ML Tasks', done: stats.completedTasks, total: stats.totalTasks, color: '#3b82f6' },
                            { name: 'Coding', done: stats.completedProblems, total: stats.totalProblems, color: '#10b981' },
                            { name: 'Aptitude', done: stats.completedAptitude, total: stats.totalAptitude, color: '#a78bfa' }
                        ].map((s, i) => (
                            <div key={i} className="sdash-skill-row">
                                <div className="sdash-skill-label">
                                    <span>{s.name}</span>
                                    <span style={{ color: s.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.done}/{s.total}</span>
                                </div>
                                <div className="sdash-skill-track">
                                    <div className="sdash-skill-fill" style={{ width: `${s.total > 0 ? (s.done / s.total) * 100 : 0}%`, background: `linear-gradient(90deg, ${s.color}cc, ${s.color})` }} />
                                </div>
                            </div>
                        ))}
                        <div className="sdash-skill-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                            <div className="sdash-skill-label">
                                <span style={{ fontWeight: 600 }}>Total Submissions</span>
                                <span style={{ color: '#06b6d4', fontWeight: 700 }}>{stats.totalSubmissions || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="sdash-card">
                    <div className="sdash-card-head">
                        <h3><Clock size={16} color="#3b82f6" /> Recent</h3>
                        <button onClick={() => window.location.href = '/student/submissions'} className="view-all-btn">All →</button>
                    </div>
                    <div className="submissions-list" style={{ maxHeight: 240 }}>
                        {stats.recentSubmissions && stats.recentSubmissions.length > 0 ? (
                            stats.recentSubmissions.map((sub, idx) => (
                                <div key={idx} className="submission-item">
                                    <div className="submission-icon">
                                        <Code size={16} color="#3b82f6" />
                                    </div>
                                    <div className="submission-info">
                                        <div className="submission-title">{sub.title}</div>
                                        <div className="submission-meta">{formatTimeAgo(sub.time)} · {sub.score}/100</div>
                                    </div>
                                    <span className={`submission-status ${sub.status}`}>{sub.status}</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-small"><Code size={28} color="var(--text-muted)" />No submissions</div>
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="sdash-card">
                    <div className="sdash-card-head">
                        <h3><Trophy size={16} color="#fbbf24" /> Leaderboard</h3>
                    </div>
                    <div className="leaderboard-list" style={{ maxHeight: 240 }}>
                        {stats.leaderboard && stats.leaderboard.length > 0 ? (
                            stats.leaderboard.slice(0, 5).map((s, idx) => (
                                <div key={idx} className={`leaderboard-item ${s.studentId === user.id ? 'current-user' : ''}`}>
                                    <div className={`rank-badge rank-${idx + 1}`}>{s.rank}</div>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-name">{s.name}</div>
                                        <div className="leaderboard-stats">{s.taskCount}T · {s.codeCount}C · {s.aptitudeCount}A</div>
                                    </div>
                                    <div className={`leaderboard-score rank-${idx + 1}-score`}>
                                        {s.avgScore}%
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-small"><Trophy size={28} color="var(--text-muted)" />No data yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== ML TASKS WITH FILE UPLOAD ====================
function Tasks({ user }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [activeTask, setActiveTask] = useState(null)
    const [viewingTask, setViewingTask] = useState(null)

    const fetchTasks = (showLoading = true) => {
        if (!user?.id) return
        if (showLoading) setLoading(true)
        setFetchError(null)
        axios.get(`${API_BASE}/students/${user.id}/tasks`)
            .then(res => {
                setTasks(Array.isArray(res.data) ? res.data : [])
                setFetchError(null)
                setLoading(false)
            })
            .catch(err => {
                setLoading(false)
                const msg = err?.response?.data?.error || err?.message || 'Failed to load tasks'
                setFetchError(msg)
                console.error('Task fetch error:', msg)
            })
    }

    useEffect(() => {
        if (!user?.id) return
        fetchTasks(true)
    }, [user?.id])

    if (loading) return <div className="loading-spinner"></div>

    if (fetchError) return (
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Could not load tasks</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{fetchError}</p>
            <button
                onClick={() => fetchTasks()}
                style={{
                    padding: '0.6rem 1.5rem',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                <RefreshCw size={16} /> Try Again
            </button>
        </div>
    )

    return (
        <>
            <div className="cards-grid animate-slideUp">
                {tasks.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <div className="empty-state-icon"><ClipboardList size={40} /></div>
                        <h3>No ML Tasks Assigned</h3>
                        <p>Your mentor hasn't assigned any tasks yet.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="item-card glass">
                            <div className="item-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '10px', background: 'var(--primary-alpha)', borderRadius: '10px' }}>
                                        <ClipboardList size={20} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>ML TASK</span>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{task.title}</h3>
                                    </div>
                                </div>
                                <span className={`difficulty-badge ${task.difficulty?.toLowerCase()}`}>{task.difficulty}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
                            {task.requirements && (
                                <div style={{ background: 'var(--bg-dark)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <strong style={{ color: 'var(--primary)' }}>Requirements:</strong><br />
                                    {task.requirements.split('\n').slice(0, 2).join('\n')}...
                                </div>
                            )}
                            <div className="item-card-footer" style={{ paddingTop: '1rem', marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className={`status-badge ${task.status || 'live'}`}>{task.status || 'Active'}</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                    {task.maxAttempts > 0 && (
                                        <span style={{
                                            fontSize: '0.8rem',
                                            color: task.attemptCount >= task.maxAttempts ? 'var(--error)' : 'var(--text-muted)',
                                            alignSelf: 'center',
                                            marginRight: '0.5rem',
                                            fontWeight: 600
                                        }}>
                                            {task.attemptCount}/{task.maxAttempts} Attempts
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setViewingTask(task)}
                                        className="btn-reset"
                                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                    <button
                                        onClick={() => setActiveTask(task)}
                                        className="btn-create-new"
                                        disabled={task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.85rem',
                                            opacity: (task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts) ? 0.5 : 1,
                                            cursor: (task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <Upload size={16} /> {task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts ? 'Limit Reached' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {viewingTask && <TaskDetailsModal task={viewingTask} onClose={() => setViewingTask(null)} onSubmit={() => { setViewingTask(null); setActiveTask(viewingTask); }} />}
            {activeTask && <TaskSubmitModal task={activeTask} user={user} onClose={() => setActiveTask(null)} onSubmissionComplete={() => fetchTasks(false)} />}
        </>
    )
}

// ==================== TASK DETAILS MODAL ====================
function TaskDetailsModal({ task, onClose, onSubmit }) {
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-content p-0" onClick={e => e.stopPropagation()} style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: '#FFF7ED', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header (Solid Orange) */}
                <div style={{ background: '#d97706', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STUDENT CRT REPORT
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
                        {submission?.studentName || 'Student'} | {attempt?.company_name || 'Round Test'} | ID: {attempt?.student_id || submission?.studentId}
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '16px', padding: 0, opacity: 0.8 }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.8}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 24px 24px', flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#ea580c' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem', borderColor: '#ea580c', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontWeight: 600 }}>Loading report details...</span>
                        </div>
                    ) : !reportData ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#ea580c', fontWeight: 700 }}>No report data available.</div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <div style={{ background: 'white', border: '1px solid #fdba74', borderRadius: '30px', display: 'flex', padding: '4px', boxShadow: '0 4px 6px rgba(234, 88, 12, 0.05)', overflow: 'hidden' }}>
                                    {reportTabs.map(tab => (
                                        <button key={tab.id} onClick={() => { setActiveReportTab(tab.id); if (tab.id !== 'section') setSelectedSection(null); }}
                                            style={{
                                                padding: '10px 20px', border: 'none', cursor: 'pointer',
                                                background: activeReportTab === tab.id ? 'white' : 'transparent',
                                                color: activeReportTab === tab.id ? '#ea580c' : '#9a3412',
                                                fontSize: '0.85rem', fontWeight: 800,
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                borderRadius: '30px',
                                                boxShadow: activeReportTab === tab.id ? '0 2px 8px rgba(234, 88, 12, 0.15)' : 'none',
                                                transition: 'all 0.2s', textTransform: 'uppercase'
                                            }}
                                        >
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* TAB: Overview */}
                            {activeReportTab === 'overview' && sections.length > 0 && (() => {
                                const totalCorrect = sections.reduce((s, sec) => s + (sectionScores[sec]?.correct || 0), 0);
                                const totalQs = sections.reduce((s, sec) => s + (sectionScores[sec]?.total || 0), 0);
                                const pct = Math.round(overallScore);
                                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C';

                                return (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
                                    {/* OVERALL PERFORMANCE */}
                                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>OVERALL PERFORMANCE</h3>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                            <div style={{ background: '#ffedd5', borderRadius: '12px', padding: '24px 20px', flex: 1, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#b45309', lineHeight: 1 }}>{pct}%</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', marginTop: '12px' }}>CRT Score: {grade}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>{totalCorrect}/{totalQs}</div>
                                            </div>
                                            
                                            <div style={{ width: '140px', height: '140px', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', position: 'absolute', transform: 'rotate(-90deg)' }}>
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#9ca3af" strokeWidth="4.5" />
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ea580c" strokeWidth="4.5" strokeDasharray={`${pct}, 100`} style={{ transition: 'stroke-dasharray 1s ease' }}/>
                                                </svg>
                                                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '4px' }}>Total Score</div>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1f2937', lineHeight: 1 }}>{totalCorrect}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', marginBottom: '24px', paddingLeft: '8px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ea580c' }}></div> Points Gained: {pct}%</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#9ca3af' }}></div> Points Remaining: {100 - pct}%</span>
                                        </div>

                                        <h4 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937' }}>Key Indicators</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} strokeWidth={3}/></div> Proficient
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) >= 80).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) >= 80).length / sections.length)*100) : 0}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#f97316', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={14} strokeWidth={3}/></div> Above Average
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) >= 60 && (sectionScores[s]?.score||0) < 80).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) >= 60 && (sectionScores[s]?.score||0) < 80).length / sections.length)*100) : 0}%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
                                                    <div style={{ background: '#eab308', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div> Needs Improvement
                                                </span>
                                                <span style={{ color: '#1f2937' }}>{sections.filter(s => (sectionScores[s]?.score||0) < 60).length > 0 ? Math.round((sections.filter(s => (sectionScores[s]?.score||0) < 60).length / sections.length)*100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KEY ACHIEVEMENTS */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>KEY ACHIEVEMENTS</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {sections.map(sec => {
                                                    const def = SECTION_DEFS[sec]
                                                    const ss = sectionScores[sec] || {}
                                                    const secPct = Math.round(ss.score || 0)
                                                    return (
                                                        <div key={sec} onClick={() => { setActiveReportTab('section'); setSelectedSection(sec); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s', padding: '8px 0' }}>
                                                            <div style={{ background: '#ffedd5', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                                {def?.icon || '📊'}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '0.95rem' }}>{def?.label || sec}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500, marginTop: '2px' }}>
                                                                    {secPct >= 80 ? 'High Score' : secPct >= 60 ? 'Consistent Growth' : 'Needs Review'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* RECENT TREND */}
                                        <div>
                                            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase' }}>RECENT TREND</h3>
                                            <div style={{ height: '140px', background: 'linear-gradient(to bottom, rgba(251,146,60,0.1) 0%, transparent 100%)', borderRadius: '8px', borderBottom: '2px solid #fed7aa', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '10px 0' }}>
                                                {/* Mini chart dummy to match UI request perfectly */}
                                                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%', stroke: '#ea580c', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                                                    <path d="M 0,35 L 20,25 L 40,28 L 60,15 L 80,15 L 100,5" />
                                                </svg>
                                                {/* Grid lines */}
                                                <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                                <div style={{ position: 'absolute', bottom: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                                <div style={{ position: 'absolute', bottom: '75%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.05)' }}></div>
                                            </div>
                                        </div>
                                        
                                        {/* Download Report Button */}
                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button style={{ padding: '8px 20px', borderRadius: '30px', border: '1px solid #ea580c', background: 'white', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                DOWNLOAD REPORT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )
                            })()}

                            {/* TAB: Section Analysis */}
                            {activeReportTab === 'section' && sections.length > 0 && (
                                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                    <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Layers size={18} color="#ea580c" /> Choose a Section to Review
                                    </h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        {sections.map(sec => {
                                            const def = SECTION_DEFS[sec]
                                            const ss = sectionScores[sec] || {}
                                            const pct = Math.round(ss.score || 0)
                                            const isActive = selectedSection === sec
                                            return (
                                                <button key={sec} onClick={() => setSelectedSection(isActive ? null : sec)}
                                                    style={{
                                                        padding: '16px', border: isActive ? '2px solid #ea580c' : '1px solid #fdba74',
                                                        borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                                                        background: isActive ? '#ffedd5' : 'white',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px',
                                                        boxShadow: isActive ? '0 4px 12px rgba(234,88,12,0.1)' : '0 2px 4px rgba(234,88,12,0.02)'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.8rem' }}>{def?.icon || '📊'}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? '#ea580c' : '#1f2937' }}>{def?.label || sec}</div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9a3412', marginTop: 4 }}>
                                                            {ss.correct || 0} Correct · {pct}%
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Detailed answers */}
                                    {selectedSection && (() => {
                                        const secAnswers = answersBySection[selectedSection] || []
                                        const def = SECTION_DEFS[selectedSection]
                                        if (secAnswers.length === 0) return (
                                            <div style={{ textAlign: 'center', padding: '3rem', color: '#9a3412', background: '#ffedd5', borderRadius: '16px', fontWeight: 700 }}>
                                                No answers recorded for this section.
                                            </div>
                                        )
                                        return (
                                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed #fdba74', animation: 'fadeIn 0.4s ease-out' }}>
                                                <h4 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', color: '#1f2937' }}>
                                                    {def?.icon} {def?.label || selectedSection} — Question Review
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {secAnswers.map((ans, idx) => (
                                                        <div key={ans.id || idx} style={{ padding: '16px 20px', background: ans.is_correct ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ans.is_correct ? '#86efac' : '#fca5a5'}`, borderRadius: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                                                                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{ans.is_correct ? '✅' : '❌'}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937', lineHeight: 1.5 }}>Q{idx + 1}: {ans.question}</div>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '0.85rem', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, flexShrink: 0,
                                                                    background: ans.is_correct ? '#dcfce7' : '#fee2e2', color: ans.is_correct ? '#166534' : '#991b1b'
                                                                }}>{Math.round(ans.score || 0)}% Score</span>
                                                            </div>
                                                            {ans.question_type === 'mcq' && (
                                                                <div style={{ marginLeft: '36px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                                    <div style={{ color: ans.is_correct ? '#15803d' : '#b91c1c', background: ans.is_correct ? '#dcfce7' : '#fee2e2', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                        Student answer: <span style={{ fontWeight: 800 }}>{typeof ans.student_answer === 'object' ? JSON.stringify(ans.student_answer) : (ans.student_answer || 'Not answered')}</span>
                                                                    </div>
                                                                    {!ans.is_correct && (
                                                                        <div style={{ color: '#15803d', background: '#dcfce7', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                            Correct answer: <span style={{ fontWeight: 800 }}>{typeof ans.correct_answer === 'object' ? JSON.stringify(ans.correct_answer) : ans.correct_answer}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}

                            {/* TAB: Time Analysis */}
                            {activeReportTab === 'time' && sections.length > 0 && (() => {
                                const timeLimits = attempt?.section_time_limits || {}
                                const timeSpentAdmin = {}
                                sections.forEach(sec => { timeSpentAdmin[sec] = sectionScores[sec]?.time_spent || 0 })
                                const totalTimeSecsAdmin = sections.reduce((s, sec) => s + (timeSpentAdmin[sec] || 0), 0)
                                const totalAllocatedSecs = sections.reduce((s, sec) => s + ((timeLimits[sec] || 0) * 60), 0)
                                const maxTimeAdmin = Math.max(...sections.map(sec => {
                                    const allocated = (timeLimits[sec] || 0) * 60
                                    return Math.max(timeSpentAdmin[sec] || 0, allocated)
                                }), 1)
                                return (
                                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #fed7aa', padding: '24px', boxShadow: '0 4px 12px rgba(234,88,12,0.05)' }}>
                                        <h3 style={{ margin: '0 0 24px', fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Clock size={18} color="#ea580c" /> Time Allocation Analysis
                                            <span style={{ marginLeft: 'auto', fontSize: '0.9rem', fontWeight: 800, color: '#c2410c', background: '#ffedd5', padding: '6px 16px', borderRadius: '20px' }}>
                                                Total Time: {fmtDur(totalTimeSecsAdmin)}{totalAllocatedSecs > 0 ? ` / ${fmtDur(totalAllocatedSecs)} allocated` : ''}
                                            </span>
                                        </h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {sections.map(sec => {
                                                const def = SECTION_DEFS[sec]
                                                const secSecs = timeSpentAdmin[sec] || 0
                                                const allocatedSecs = (timeLimits[sec] || 0) * 60
                                                const barPct = maxTimeAdmin > 0 ? Math.round((secSecs / maxTimeAdmin) * 100) : 0
                                                const allocBarPct = allocatedSecs > 0 && maxTimeAdmin > 0 ? Math.round((allocatedSecs / maxTimeAdmin) * 100) : 0
                                                const utilizationPct = allocatedSecs > 0 ? Math.min(100, Math.round((secSecs / allocatedSecs) * 100)) : null
                                                const overTime = utilizationPct > 100
                                                
                                                return (
                                                    <div key={sec} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1.2rem' }}>{def?.icon || '📊'}</span>
                                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2937' }}>{def?.label || sec}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                {allocatedSecs > 0 && (
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: overTime ? '#ef4444' : '#10b981', background: overTime ? '#fee2e2' : '#dcfce7', padding: '2px 10px', borderRadius: '12px' }}>
                                                                        {utilizationPct}% Used
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ea580c' }}>{fmtDur(secSecs)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                                                            {allocBarPct > 0 && (
                                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${allocBarPct}%`, background: '#ffedd5', borderRight: '2px solid #fdba74' }} />
                                                            )}
                                                            <div style={{ position: 'relative', height: '100%', width: `${barPct}%`, background: overTime ? '#ef4444' : 'linear-gradient(90deg,#ea580c,#f97316)', borderRadius: 6, transition: 'width 1s ease-out' }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })()}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}


// ==================== SUBMISSION REPORT MODAL WITH DETAILED SCORING ====================
function SubmissionReportModal({ submission, user, onClose }) {
    // Parse analysis scores for visual display
    // Handles: "30/40 - comment", "85/100 - text", plain number 90, or string "90"
    const parseScore = (val, categoryMax) => {
        if (val === null || val === undefined || val === '') return { score: 0, max: 0, comment: '' };
        const str = String(val);
        // Try "X/Y" format first (e.g., "35/40 - Good correctness")
        const slashMatch = str.match(/(\d+)\s*\/\s*(\d+)/);
        if (slashMatch) {
            return {
                score: parseInt(slashMatch[1]),
                max: parseInt(slashMatch[2]),
                comment: str.replace(/\d+\s*\/\s*\d+\s*[-–]?\s*/, '').trim()
            };
        }
        // Try plain number (e.g., 90 or "90" or "85 - Good approach")
        const numMatch = str.match(/^(\d+)/);
        if (numMatch) {
            const rawScore = parseInt(numMatch[1]);
            // Scale from 0-100 to the category max (e.g., 90/100 → 36/40)
            const scaled = categoryMax ? Math.round((rawScore / 100) * categoryMax) : rawScore;
            const comment = str.replace(/^\d+\s*[-–]?\s*/, '').trim();
            return { score: scaled, max: categoryMax || 100, comment };
        }
        return { score: 0, max: categoryMax || 0, comment: str };
    };

    const analysis = submission.analysis || {};
    const scores = {
        correctness: parseScore(analysis.correctness, 40),
        efficiency: parseScore(analysis.efficiency, 25),
        codeStyle: parseScore(analysis.codeStyle, 20),
        bestPractices: parseScore(analysis.bestPractices, 15)
    };

    // Score bar component
    const ScoreBar = ({ label, icon, score, max, comment, color }) => (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {icon}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                </div>
                <span style={{ fontWeight: 700, color: color }}>{score}/{max}</span>
            </div>
            <div style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', height: '8px', overflow: 'hidden' }}>
                <div style={{
                    width: max > 0 ? `${(score / max) * 100}%` : '0%',
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    borderRadius: '0.5rem',
                    transition: 'width 0.5s ease'
                }} />
            </div>
            {comment && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{comment}</p>}
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <div className="modal-title-with-icon">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: submission.status === 'accepted' ? 'linear-gradient(135deg, var(--success), #06b6d4)' : 'linear-gradient(135deg, var(--danger), var(--warning))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color="white" />
                        </div>
                        <h2>Submission Report</h2>
                    </div>
                    <button onClick={onClose} className="modal-close"><XCircle size={20} /></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Student</span><p style={{ margin: '0.25rem 0 0', fontWeight: 600, fontSize: '1.1rem' }}>{user?.name}</p></div>
                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Submitted At</span><p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{new Date(submission.submittedAt).toLocaleString()}</p></div>
                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Language</span><p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{submission.language}</p></div>
                    </div>

                    {/* Score & Status */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', marginBottom: '2rem', padding: '2rem', background: submission.status === 'accepted' ? 'var(--success-alpha)' : 'var(--danger-alpha)', borderRadius: '1rem', border: `1px solid ${submission.status === 'accepted' ? 'var(--success)' : 'var(--danger)'}` }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: submission.status === 'accepted' ? 'var(--success)' : 'var(--danger)' }}>{submission.score}</div>
                            <div style={{ color: 'var(--text-muted)' }}>AI Evaluation Score</div>
                        </div>
                        <div style={{ padding: '1rem 2rem', borderRadius: '1rem', background: submission.status === 'accepted' ? 'var(--success-alpha)' : 'var(--danger-alpha)', color: submission.status === 'accepted' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {submission.status === 'accepted' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                            {submission.status?.toUpperCase()}
                        </div>
                    </div>

                    {/* Detailed Scoring Breakdown */}
                    {(analysis.correctness || analysis.efficiency || analysis.codeStyle || analysis.bestPractices) && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Target size={18} color="var(--primary)" /> Detailed Score Breakdown
                            </h4>

                            <ScoreBar
                                label="Correctness"
                                icon={<CheckCircle size={16} color="#10b981" />}
                                score={scores.correctness.score}
                                max={scores.correctness.max || 40}
                                comment={scores.correctness.comment}
                                color="#10b981"
                            />

                            <ScoreBar
                                label="Efficiency"
                                icon={<Zap size={16} color="#3b82f6" />}
                                score={scores.efficiency.score}
                                max={scores.efficiency.max || 25}
                                comment={scores.efficiency.comment}
                                color="#3b82f6"
                            />

                            <ScoreBar
                                label="Code Style"
                                icon={<Eye size={16} color="#8b5cf6" />}
                                score={scores.codeStyle.score}
                                max={scores.codeStyle.max || 20}
                                comment={scores.codeStyle.comment}
                                color="#8b5cf6"
                            />

                            <ScoreBar
                                label="Best Practices"
                                icon={<Trophy size={16} color="#f59e0b" />}
                                score={scores.bestPractices.score}
                                max={scores.bestPractices.max || 15}
                                comment={scores.bestPractices.comment}
                                color="#f59e0b"
                            />
                        </div>
                    )}

                    {/* Plagiarism Warning */}
                    {submission.plagiarism?.detected && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--danger-alpha)', borderRadius: '0.75rem', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <AlertTriangle size={24} color="var(--danger)" />
                            <div>
                                <strong style={{ color: 'var(--danger)' }}>Plagiarism Detected</strong>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>This code matches a submission from {submission.plagiarism.copiedFromName}</p>
                            </div>
                        </div>
                    )}

                    {/* Integrity Violation */}
                    {submission.integrity?.integrityViolation && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <AlertTriangle size={24} color="#f59e0b" />
                            <div>
                                <strong style={{ color: '#f59e0b' }}>Integrity Violation</strong>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Tab switches detected: {submission.integrity.tabSwitches}. Score was capped due to academic integrity concerns.</p>
                            </div>
                        </div>
                    )}

                    {/* Proctoring Violations Section */}
                    {(submission.tabSwitches > 0 || submission.copyPasteAttempts > 0 || submission.cameraBlockedCount > 0 || submission.phoneDetectionCount > 0) && (
                        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                                <AlertTriangle size={18} /> Proctoring Violations
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {submission.tabSwitches > 0 && (
                                    <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Eye size={18} color="#f59e0b" />
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#f59e0b' }}>{submission.tabSwitches} Tab Switches</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalty: -{Math.min(submission.tabSwitches * 5, 25)} pts</div>
                                        </div>
                                    </div>
                                )}
                                {submission.copyPasteAttempts > 0 && (
                                    <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>📋</span>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#f59e0b' }}>{submission.copyPasteAttempts} Copy/Paste</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalty: -{Math.min(submission.copyPasteAttempts * 3, 15)} pts</div>
                                        </div>
                                    </div>
                                )}
                                {submission.cameraBlockedCount > 0 && (
                                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>📷</span>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#ef4444' }}>{submission.cameraBlockedCount} Camera Blocked</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalty: -{Math.min(submission.cameraBlockedCount * 10, 30)} pts</div>
                                        </div>
                                    </div>
                                )}
                                {submission.phoneDetectionCount > 0 && (
                                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>📱</span>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#ef4444' }}>{submission.phoneDetectionCount} Phone Detected</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalty: -{Math.min(submission.phoneDetectionCount * 15, 45)} pts</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sparkles size={18} color="var(--primary)" /> AI Feedback</h4>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.5rem' }}>{submission.feedback || 'No feedback provided.'}</p>
                    </div>

                    {/* AI Explanation */}
                    {submission.aiExplanation && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={18} color="var(--secondary)" /> Why this score?</h4>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', background: 'var(--secondary-alpha)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--secondary)' }}>{submission.aiExplanation}</p>
                        </div>
                    )}

                    {/* Suggestions */}
                    {submission.suggestions && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lightbulb size={18} color="#fbbf24" /> Improvement Suggestion</h4>
                            <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <p style={{ color: '#fbbf24', margin: 0, fontSize: '0.95rem' }}>{submission.suggestions}</p>
                            </div>
                        </div>
                    )}

                    {/* Code Preview */}
                    <div>
                        <h4 style={{ margin: '0 0 0.75rem' }}>Submitted Code</h4>
                        <pre style={{ background: 'var(--code-bg)', padding: '1.5rem', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '300px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--code-text)', border: '1px solid var(--border-color)' }}>{submission.code}</pre>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== ML TASK REPORT MODAL ====================
function MLTaskReportModal({ submission, onClose }) {
    const isGithub = (submission.submissionType || '').includes('github')

    const parseMetricScore = (str) => {
        if (!str || str === 'N/A') return null
        const match = str.match(/(\d+)/)
        return match ? parseInt(match[1]) : null
    }

    const metrics = [
        { label: 'Correctness', value: parseMetricScore(submission.analysis?.correctness), color: '#3b82f6' },
        { label: 'Code Quality', value: parseMetricScore(submission.analysis?.efficiency), color: '#8b5cf6' },
        { label: 'Documentation', value: parseMetricScore(submission.analysis?.codeStyle), color: '#06b6d4' },
        { label: 'Model Performance', value: parseMetricScore(submission.analysis?.bestPractices), color: '#10b981' }
    ].filter(m => m.value !== null)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div className="modal-title-with-icon">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Brain size={20} color="white" />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: '#06b6d4', textTransform: 'uppercase', fontWeight: 600 }}>ML Task Report</span>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{submission.itemTitle || 'ML Task'}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close"><XCircle size={20} /></button>
                </div>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    {/* Score & Status Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem',
                        padding: '1.5rem', borderRadius: '1rem',
                        background: submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                        <div style={{
                            width: '90px', height: '90px', borderRadius: '50%',
                            background: `conic-gradient(${submission.score >= 80 ? '#10b981' : submission.score >= 60 ? '#f59e0b' : '#ef4444'} ${(submission.score || 0) * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{submission.score}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</span>
                            </div>
                        </div>
                        <div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '0.5rem',
                                background: submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: submission.status === 'accepted' ? '#10b981' : '#ef4444',
                                fontWeight: 700, fontSize: '0.9rem'
                            }}>
                                {submission.status === 'accepted' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                {(submission.status || 'pending').toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    📅 {new Date(submission.submittedAt).toLocaleString()}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600 }}>
                                    {isGithub ? '🔗 GitHub Submission' : '📁 File Upload'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    {metrics.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                <BarChart3 size={18} color="#06b6d4" /> Performance Metrics
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                {metrics.map(m => (
                                    <div key={m.label} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.label}</span>
                                            <span style={{ fontWeight: 700, color: m.value >= 80 ? '#10b981' : m.value >= 60 ? '#f59e0b' : '#ef4444' }}>{m.value}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${m.value}%`, height: '100%',
                                                background: m.color,
                                                borderRadius: '3px', transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Feedback */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={18} color="#06b6d4" /> AI Feedback
                        </h4>
                        <div style={{
                            background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '0.75rem',
                            border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap',
                            color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', maxHeight: '300px', overflowY: 'auto'
                        }}>
                            {submission.feedback || 'No feedback provided.'}
                        </div>
                    </div>

                    {/* AI Summary */}
                    {submission.aiExplanation && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Eye size={18} color="#8b5cf6" /> Summary
                            </h4>
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.05)', padding: '1rem', borderRadius: '0.75rem',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6'
                            }}>
                                {submission.aiExplanation}
                            </div>
                        </div>
                    )}

                    {/* Submitted Content */}
                    <div>
                        <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isGithub ? <Github size={18} color="var(--text-main)" /> : <FileText size={18} color="var(--text-main)" />}
                            {isGithub ? 'GitHub Repository' : 'Submitted Code'}
                        </h4>
                        {isGithub ? (
                            <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                <a href={submission.code} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                    <ExternalLink size={16} /> {submission.code}
                                </a>
                            </div>
                        ) : (
                            <pre style={{
                                background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '0.75rem',
                                overflow: 'auto', maxHeight: '300px', fontSize: '0.8rem',
                                fontFamily: 'monospace', color: 'var(--text-main)',
                                border: '1px solid var(--border-color)', lineHeight: '1.6'
                            }}>{submission.code}</pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== GLOBAL COMPLETE TESTS COMPONENT ====================
function GlobalTests({ user }) {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTest, setSelectedTest] = useState(null)
    const [showTestInterface, setShowTestInterface] = useState(false)
    const [submissions, setSubmissions] = useState([])
    const [submissionResult, setSubmissionResult] = useState(null)

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const allTestsResponse = await axios.get(`${API_BASE}/global-tests?status=live`)
                const allocatedResponse = await axios.get(`${API_BASE}/tests/allocated-to/${user.id}`)

                const allTests = Array.isArray(allTestsResponse.data) ? allTestsResponse.data : []
                const allocatedTests = Array.isArray(allocatedResponse.data) ? allocatedResponse.data : []

                // Determine which tests should be visible
                const visibleTests = allTests.filter(test => {
                    const testAllocationInfo = allocatedTests.find(a => a.test_id === test.id)

                    // If test has no allocations, show to everyone
                    if (!testAllocationInfo || !testAllocationInfo.has_allocations) {
                        return true
                    }

                    // If test has allocations, only show if student is allocated
                    return testAllocationInfo.is_allocated_to_student
                })

                setTests(visibleTests)
            } catch (e) {
                if (e.response?.status === 503) setTests([])
                else {
                    console.error(e)
                    // Fallback: show all tests if allocation check fails
                    try {
                        const res = await axios.get(`${API_BASE}/global-tests?status=live`)
                        setTests(Array.isArray(res.data) ? res.data : [])
                    } catch (_) {
                        setTests([])
                    }
                }
            } finally {
                setLoading(false)
            }
        }
        const fetchSubs = async () => {
            try {
                const res = await axios.get(`${API_BASE}/global-test-submissions?studentId=${user.id}`)
                setSubmissions(Array.isArray(res.data) ? res.data : [])
            } catch (_) { setSubmissions([]) }
        }
        fetchTests()
        fetchSubs()
    }, [user.id])

    const getAttemptCount = (testId) => submissions.filter(s => s.testId === testId).length
    const getTestSubmission = (testId) => submissions.find(s => s.testId === testId)
    const isTestCompleted = (testId, testData) => {
        const hasPassed = submissions.some(s => s.testId === testId && s.status === 'passed')
        const attemptCount = getAttemptCount(testId)
        const maxAttempts = testData?.maxAttempts ?? 1
        return hasPassed || (maxAttempts !== -1 && attemptCount >= maxAttempts)
    }

    const startTest = async (test) => {
        if (test.startTime && new Date(test.startTime) > new Date()) {
            alert('This test is not yet available.')
            return
        }
        if (test.deadline && new Date(test.deadline) < new Date()) {
            alert('This test has expired.')
            return
        }
        const attemptCount = submissions.filter(s => s.testId === test.id).length
        const maxAttempts = test.maxAttempts ?? 1
        if (maxAttempts !== -1 && attemptCount >= maxAttempts) {
            alert(`Max attempts (${maxAttempts}) reached for this test.`)
            return
        }
        try {
            const res = await axios.get(`${API_BASE}/global-tests/${test.id}`)
            setSelectedTest(res.data)
            setShowTestInterface(true)
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to load test')
        }
    }

    const handleComplete = (result) => {
        setShowTestInterface(false)
        setSelectedTest(null)
        // Show result modal if we received result data
        if (result) {
            setSubmissionResult(result)
        }
        // Refresh submissions list
        axios.get(`${API_BASE}/global-test-submissions?studentId=${user.id}`).then(r => setSubmissions(Array.isArray(r.data) ? r.data : [])).catch(() => { })
    }

    if (loading) return <div className="loading-spinner"></div>

    if (showTestInterface && selectedTest) {
        return (
            <GlobalTestInterface
                test={selectedTest}
                user={user}
                onClose={() => { setShowTestInterface(false); setSelectedTest(null) }}
                onComplete={handleComplete}
            />
        )
    }

    const completedCount = submissions.filter(s => s.status === 'passed').length

    // Submission Result Modal — shown after test submission
    const ResultModal = () => {
        if (!submissionResult) return null
        const sectionScores = submissionResult.sectionScores || {}
        const isPassed = submissionResult.status === 'passed'
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                overflow: 'auto',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                `}</style>

                <div style={{
                    background: 'rgba(30,41,59,0.98)',
                    borderRadius: '24px',
                    border: `2px solid ${isPassed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    maxWidth: 800,
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 25px 50px -12px ${isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                    animation: 'scaleIn 0.4s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '2rem 2rem 1.5rem',
                        background: isPassed ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(251, 146, 60, 0.1))',
                        borderBottom: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: isPassed ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #f97316)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            boxShadow: `0 8px 24px ${isPassed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            animation: isPassed ? 'pulse 2s ease-in-out infinite' : 'none'
                        }}>
                            {isPassed ? <Award size={40} color="white" /> : <XCircle size={40} color="white" />}
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem', color: 'white', fontSize: '1.75rem', fontWeight: 800 }}>
                            {isPassed ? '🎉 Congratulations!' : 'Test Completed'}
                        </h2>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
                            {isPassed ? 'You have successfully passed the assessment!' : 'Keep practicing to improve your score.'}
                        </p>
                    </div>

                    <div style={{ padding: '2rem', overflowY: 'auto' }}>
                        {/* Score Card */}
                        <div style={{
                            display: 'flex',
                            gap: '1.5rem',
                            marginBottom: '2rem',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                padding: '1.5rem 2.5rem',
                                background: isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                borderRadius: 16,
                                border: `2px solid ${isPassed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                                textAlign: 'center',
                                minWidth: '180px'
                            }}>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 900,
                                    color: isPassed ? '#10b981' : '#ef4444',
                                    lineHeight: 1
                                }}>
                                    {submissionResult.score ?? submissionResult.overallPercentage}%
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.6)',
                                    marginTop: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    fontWeight: 600
                                }}>
                                    Overall Score
                                </div>
                            </div>
                            <div style={{
                                padding: '1.5rem 2rem',
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: 16,
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>
                                    {submissionResult.correctCount || 0}/{submissionResult.totalQuestions || 0}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                                    Correct Answers
                                </div>
                            </div>
                        </div>

                        {/* Section Scores */}
                        <h3 style={{ margin: '0 0 1rem', color: 'white', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layers size={18} color="#8b5cf6" /> Section-wise Performance
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                            {Object.entries(sectionScores).map(([sec, score]) => {
                                const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={sec} style={{
                                        padding: '1rem',
                                        background: 'rgba(30, 41, 59, 0.8)',
                                        borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor }}>{score}%</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize', marginTop: '0.25rem' }}>{sec}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1.25rem 2rem',
                        borderTop: '1px solid rgba(139,92,246,0.2)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        background: 'rgba(15, 23, 42, 0.5)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setSubmissionResult(null)}
                            style={{
                                padding: '0.85rem 2.5rem',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                        >
                            Close & View Results
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={28} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Global Complete Tests</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Aptitude, Verbal, Logical, Coding, SQL – all in one test</p>
                    </div>
                </div>
            </div>
            {tests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No global tests available. Check back later.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-card glass">
                            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}><Layers size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">Available</span>
                                <span className="stat-value">{tests.length}</span>
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">Submitted</span>
                                <span className="stat-value">{submissions.length}</span>
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><Award size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">Passed</span>
                                <span className="stat-value">{submissions.filter(s => s.status === 'passed').length}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {tests.map(t => {
                            const completed = isTestCompleted(t.id, t)
                            const submission = getTestSubmission(t.id)
                            const attemptCount = getAttemptCount(t.id)
                            const hasPassed = submission?.status === 'passed'
                            const hasAttemptsLeft = t.maxAttempts === -1 || attemptCount < (t.maxAttempts || 1)
                            const canRetry = !hasPassed && hasAttemptsLeft && attemptCount > 0

                            return (
                                <div key={t.id} className="card glass" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                    {/* Status Badge */}
                                    {attemptCount > 0 && (
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: hasPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: hasPassed ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {hasPassed ? <><CheckCircle size={14} /> Passed</> : <><XCircle size={14} /> Failed</>}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Layers size={24} color="white" />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                <span className={`difficulty-badge ${t.difficulty?.toLowerCase()}`}>{t.difficulty}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}><Clock size={14} /> {t.duration} min</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={16} color="#06b6d4" /><span>{t.totalQuestions} Questions</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={16} color="#f59e0b" /><span>Pass: {t.passingScore}%</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} color="#ef4444" /><span>Tab Limit: {t.maxTabSwitches || 3}</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} color="#3b82f6" /><span>Attempts: {attemptCount}/{t.maxAttempts === -1 ? '∞' : (t.maxAttempts || 1)}</span></div>
                                        {t.deadline && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: t.startTime && new Date(t.startTime) > new Date() ? '#f59e42' : t.deadline && new Date(t.deadline) < new Date() ? '#ef4444' : 'var(--text-muted)' }}>
                                                <Clock size={16} color={t.startTime && new Date(t.startTime) > new Date() ? '#f59e42' : t.deadline && new Date(t.deadline) < new Date() ? '#ef4444' : '#10b981'} />
                                                <span>{t.startTime && new Date(t.startTime) > new Date() ? `Not Yet Started` : t.deadline && new Date(t.deadline) < new Date() ? 'Expired' : t.deadline ? `Due: ${new Date(t.deadline).toLocaleDateString()}` : ''}</span>
                                            </div>
                                        )}
                                    </div>

                                    {attemptCount > 0 && submission && (
                                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your Score</span>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: hasPassed ? '#10b981' : '#ef4444' }}>{submission.overallPercentage}%</span>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {completed ? (
                                            <button disabled style={{ flex: 1, padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', color: '#10b981', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'not-allowed' }}><CheckCircle size={18} /> Completed</button>
                                        ) : canRetry ? (
                                            <button onClick={() => startTest(t)} className="btn-create-new" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Retry Test <RefreshCw size={18} /></button>
                                        ) : t.startTime && new Date(t.startTime) > new Date() ? (
                                            <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(245, 158, 66, 0.15)', borderRadius: '10px', color: '#f59e42', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><XCircle size={18} /> Not Yet Started</div>
                                        ) : t.deadline && new Date(t.deadline) < new Date() ? (
                                            <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(107, 114, 128, 0.2)', borderRadius: '10px', color: '#6b7280', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><XCircle size={18} /> Test Expired</div>
                                        ) : (
                                            <button onClick={() => startTest(t)} className="btn-create-new" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Start Test <ChevronRight size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
            <ResultModal />
        </div>
    )
}

// ==================== APTITUDE TESTS COMPONENT ====================
function AptitudeTests({ user }) {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTest, setSelectedTest] = useState(null)
    const [showTestInterface, setShowTestInterface] = useState(false)
    const [submissions, setSubmissions] = useState([])
    const [showResults, setShowResults] = useState(null)

    useEffect(() => {
        fetchTests()
        fetchSubmissions()
    }, [user.id])

    const fetchTests = async () => {
        try {
            // Get all live tests
            const allTestsResponse = await axios.get(`${API_BASE}/aptitude?status=live`)
            let visibleTests = allTestsResponse.data

            // Get tests specifically allocated to this student
            try {
                const allocatedResponse = await axios.get(`${API_BASE}/aptitude/allocated-to/${user.id}`)
                const allocatedTestIds = new Set(allocatedResponse.data.map(t => t.id))

                // Filter tests: show only if:
                // 1. Test has no allocations (show to everyone)
                // 2. Test has allocations AND student is in the list
                visibleTests = await Promise.all(
                    allTestsResponse.data.map(async (test) => {
                        try {
                            // Check if this test has any allocations
                            const allocResponse = await axios.get(`${API_BASE}/aptitude/${test.id}/allocated-students`)
                            const hasAllocations = allocResponse.data.count > 0

                            // If no allocations, show to everyone
                            if (!hasAllocations) return test

                            // If has allocations, only show if student is allocated
                            return allocatedTestIds.has(test.id) ? test : null
                        } catch {
                            return test // If error checking allocations, show test
                        }
                    })
                )
                visibleTests = visibleTests.filter(t => t !== null)
            } catch (error) {
                // If error getting allocated tests, show all (backward compatibility)
                console.warn('Could not fetch allocated tests, showing all live tests')
            }

            setTests(visibleTests)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching tests:', error)
            setLoading(false)
        }
    }

    const fetchSubmissions = async () => {
        try {
            const response = await axios.get(`${API_BASE}/aptitude-submissions?studentId=${user.id}`)
            setSubmissions(response.data)
        } catch (error) {
            console.error('Error fetching submissions:', error)
        }
    }

    // Helper function to check if test has started
    const hasTestStarted = (test) => {
        if (!test.startTime) return true // No start time = always available

        const startTime = new Date(test.startTime)
        const now = new Date()

        // Ensure both dates are compared in the same timezone
        // The backend stores dates in UTC, so we need to compare in UTC
        const startTimeUTC = Date.UTC(
            startTime.getUTCFullYear(),
            startTime.getUTCMonth(),
            startTime.getUTCDate(),
            startTime.getUTCHours(),
            startTime.getUTCMinutes()
        )

        const nowUTC = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes()
        )

        return nowUTC >= startTimeUTC
    }

    // Helper function to check if test has expired
    const hasTestExpired = (test) => {
        if (!test.deadline) return false // No deadline = never expires

        const deadline = new Date(test.deadline)
        const now = new Date()

        const deadlineUTC = Date.UTC(
            deadline.getUTCFullYear(),
            deadline.getUTCMonth(),
            deadline.getUTCDate(),
            deadline.getUTCHours(),
            deadline.getUTCMinutes()
        )

        const nowUTC = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes()
        )

        return nowUTC > deadlineUTC
    }


    const startTest = async (test) => {
        // Check if test has not started yet (using helper with timezone tolerance)
        if (!hasTestStarted(test)) {
            alert('This test is not yet available. Please check the start time.')
            return
        }
        // Check if deadline has passed
        if (hasTestExpired(test)) {
            alert('This test has expired. The deadline has passed.')
            return
        }

        // Check if max attempts reached (skip if unlimited: -1)
        if (!canRetryTest(test) && getAttemptCount(test.id) > 0) {
            alert(`You have reached the maximum number of attempts (${test.maxAttempts}) for this test.`)
            return
        }

        // Fetch full test with questions
        try {
            const response = await axios.get(`${API_BASE}/aptitude/${test.id}`)
            setSelectedTest(response.data)
            setShowTestInterface(true)
        } catch (error) {
            alert('Error loading test')
        }
    }

    const handleTestComplete = (result) => {
        fetchSubmissions()
        setShowTestInterface(false)
        setSelectedTest(null)
    }

    const isTestCompleted = (testId) => {
        return submissions.some(s => s.testId === testId)
    }

    const getTestSubmission = (testId) => {
        // Get the latest submission for this test (submissions are ordered by date DESC from backend)
        const testSubmissions = submissions.filter(s => s.testId === testId)
        return testSubmissions.length > 0 ? testSubmissions[0] : null
    }

    // Count how many attempts a student has made for a test
    const getAttemptCount = (testId) => {
        return submissions.filter(s => s.testId === testId).length
    }

    // Check if student can retry the test
    const canRetryTest = (test) => {
        const attemptCount = getAttemptCount(test.id)
        const maxAttempts = test.maxAttempts
        // -1 means unlimited attempts
        if (maxAttempts === -1) return true
        // Default to 1 attempt if not set
        return attemptCount < (maxAttempts || 1)
    }

    // Get remaining attempts
    const getRemainingAttempts = (test) => {
        const attemptCount = getAttemptCount(test.id)
        const maxAttempts = test.maxAttempts
        // -1 means unlimited attempts
        if (maxAttempts === -1) return '∞'
        return Math.max(0, (maxAttempts || 1) - attemptCount)
    }

    // Get unique tests with their latest submissions for stats
    const getLatestSubmissions = () => {
        const latestByTest = {}
        submissions.forEach(s => {
            if (!latestByTest[s.testId]) {
                latestByTest[s.testId] = s
            }
        })
        return Object.values(latestByTest)
    }

    const latestSubmissions = getLatestSubmissions()

    if (loading) return <div className="loading-spinner"></div>

    if (showTestInterface && selectedTest) {
        return (
            <AptitudeTestInterface
                test={selectedTest}
                user={user}
                onClose={() => {
                    setShowTestInterface(false)
                    setSelectedTest(null)
                }}
                onComplete={handleTestComplete}
            />
        )
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Brain size={28} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                            Aptitude Tests
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Test your reasoning, analytical, and problem-solving skills
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Brain size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Available Tests</span>
                        <span className="stat-value">{tests.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{latestSubmissions.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Avg Score</span>
                        <span className="stat-value">
                            {latestSubmissions.length > 0
                                ? Math.round(latestSubmissions.reduce((a, b) => a + b.score, 0) / latestSubmissions.length)
                                : 0}%
                        </span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Passed</span>
                        <span className="stat-value">
                            {latestSubmissions.filter(s => s.status === 'passed').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tests Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
            }}>
                {tests.map(test => {
                    const completed = isTestCompleted(test.id)
                    const submission = getTestSubmission(test.id)

                    return (
                        <div
                            key={test.id}
                            className="card glass"
                            style={{
                                padding: '1.5rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Status Badge */}
                            {completed && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    background: submission?.status === 'passed'
                                        ? 'rgba(16, 185, 129, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)',
                                    color: submission?.status === 'passed' ? '#10b981' : '#ef4444',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    {submission?.status === 'passed' ? (
                                        <><CheckCircle size={14} /> Passed</>
                                    ) : (
                                        <><XCircle size={14} /> Failed</>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Brain size={24} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                        {test.title}
                                    </h3>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        <span className={`difficulty-badge ${test.difficulty?.toLowerCase()}`}>
                                            {test.difficulty}
                                        </span>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <Clock size={14} /> {test.duration} min
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Target size={16} color="#8b5cf6" />
                                    <span>{test.questionCount || test.totalQuestions} Questions</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={16} color="#f59e0b" />
                                    <span>Pass: {test.passingScore}%</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertTriangle size={16} color="#ef4444" />
                                    <span>Tab Limit: {test.maxTabSwitches || 3}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Zap size={16} color="#06b6d4" />
                                    <span>Attempts: {getAttemptCount(test.id)}/{test.maxAttempts === -1 ? '∞' : (test.maxAttempts || 1)}</span>
                                </div>
                                {test.startTime && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: !hasTestStarted(test) ? '#f59e42' : '#10b981'
                                    }}>
                                        <Clock size={16} color={!hasTestStarted(test) ? '#f59e42' : '#10b981'} />
                                        <span>
                                            {!hasTestStarted(test)
                                                ? `Starts: ${new Date(test.startTime).toLocaleString()}`
                                                : `Started: ${new Date(test.startTime).toLocaleDateString()}`
                                            }
                                        </span>
                                    </div>
                                )}
                                {test.deadline && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: hasTestExpired(test) ? '#ef4444' : 'var(--text-muted)'
                                    }}>
                                        <Clock size={16} color={hasTestExpired(test) ? '#ef4444' : '#10b981'} />
                                        <span>
                                            {hasTestExpired(test)
                                                ? 'Expired'
                                                : `Due: ${new Date(test.deadline).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>

                            {completed && submission && (
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your Score</span>
                                        <span style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            color: submission.status === 'passed' ? '#10b981' : '#ef4444'
                                        }}>
                                            {submission.score}%
                                        </span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginTop: '0.5rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <span>{submission.correctCount}/{submission.totalQuestions} Correct</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {!completed ? (
                                    !hasTestStarted(test) ? (
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'rgba(245, 158, 66, 0.15)',
                                                border: 'none',
                                                borderRadius: '10px',
                                                color: '#f59e42',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <XCircle size={18} /> Not Yet Started
                                        </div>
                                    ) : hasTestExpired(test) ? (
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'rgba(107, 114, 128, 0.2)',
                                                border: 'none',
                                                borderRadius: '10px',
                                                color: '#6b7280',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <XCircle size={18} /> Test Expired
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startTest(test)}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                                border: 'none',
                                                borderRadius: '10px',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Play size={18} /> Start Test
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowResults(submission)}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '10px',
                                                color: '#3b82f6',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Eye size={18} /> View Results
                                        </button>
                                        {canRetryTest(test) ? (
                                            <button
                                                onClick={() => startTest(test)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    background: 'rgba(139, 92, 246, 0.1)',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    borderRadius: '10px',
                                                    color: '#8b5cf6',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <Zap size={18} /> Retry ({getRemainingAttempts(test)} left)
                                            </button>
                                        ) : (
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                background: 'rgba(107, 114, 128, 0.1)',
                                                border: '1px solid rgba(107, 114, 128, 0.3)',
                                                borderRadius: '10px',
                                                color: '#6b7280',
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                            >
                                                <XCircle size={18} /> No retries left
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {tests.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: 'var(--text-muted)'
                }}>
                    <Brain size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No aptitude tests available at the moment.</p>
                </div>
            )}

            {/* Results Modal */}
            {showResults && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowResults(null)}
                >
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '600px' }}
                    >
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: showResults.status === 'passed'
                                        ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                                        : 'linear-gradient(135deg, #ef4444, #f97316)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {showResults.status === 'passed' ? (
                                        <Award size={20} color="white" />
                                    ) : (
                                        <Target size={20} color="white" />
                                    )}
                                </div>
                                <h2>{showResults.testTitle}</h2>
                            </div>
                            <button onClick={() => setShowResults(null)} className="modal-close">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Score Summary */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '1rem',
                                marginBottom: '2rem'
                            }}>
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
                                        {showResults.score}%
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score</div>
                                </div>
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                                        {showResults.correctCount}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Correct</div>
                                </div>
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
                                        {showResults.totalQuestions - showResults.correctCount}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wrong</div>
                                </div>
                            </div>

                            {/* Question Results */}
                            <h4 style={{ marginBottom: '1rem' }}>Question Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {showResults.questionResults?.map((qr, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            background: qr.isCorrect
                                                ? 'rgba(16, 185, 129, 0.1)'
                                                : 'rgba(239, 68, 68, 0.1)',
                                            border: `1px solid ${qr.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            borderRadius: '12px',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem'
                                        }}>
                                            {qr.isCorrect ? (
                                                <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            ) : (
                                                <XCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <p style={{
                                                    margin: '0 0 0.5rem',
                                                    fontWeight: 500,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Q{idx + 1}: {qr.question}
                                                </p>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    <span>
                                                        Your: <strong style={{ color: qr.isCorrect ? '#10b981' : '#ef4444' }}>
                                                            {qr.userAnswer}
                                                        </strong>
                                                    </span>
                                                    {!qr.isCorrect && (
                                                        <span>
                                                            Correct: <strong style={{ color: '#10b981' }}>
                                                                {qr.correctAnswer}
                                                            </strong>
                                                        </span>
                                                    )}
                                                </div>
                                                {qr.explanation && (
                                                    <p style={{
                                                        margin: '0.5rem 0 0',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-muted)',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        💡 {qr.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==================== FEATURE 37, 42, 43: STUDENT ANALYTICS ====================
function StudentAnalytics({ user }) {
    const { t } = useI18n()
    const [activeTab, setActiveTab] = useState('learning-path')
    const [learningPath, setLearningPath] = useState(null)
    const [peerComparison, setPeerComparison] = useState(null)
    const [topicAnalysis, setTopicAnalysis] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const fetchData = async () => {
            try {
                const [lpRes, pcRes, taRes] = await Promise.all([
                    axios.get(`${API_BASE}/analytics/learning-path/${user.id}`),
                    axios.get(`${API_BASE}/analytics/peer-comparison/${user.id}`),
                    axios.get(`${API_BASE}/analytics/topics?studentId=${user.id}`)
                ])
                setLearningPath(lpRes.data)
                setPeerComparison(pcRes.data)
                setTopicAnalysis(taRes.data)
            } catch (err) { console.error(err) }
            setLoading(false)
        }
        fetchData()
    }, [user.id])

    if (loading) return <div className="loading-spinner"></div>

    const tabs = [
        { id: 'learning-path', label: t('learning_path'), icon: <Radar size={16} /> },
        { id: 'peer-comparison', label: t('peer_comparison'), icon: <Users size={16} /> },
        { id: 'topic-analysis', label: t('topic_analysis'), icon: <PieChart size={16} /> }
    ]

    return (
        <div className="animate-fadeIn">
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem',
                        borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                        background: activeTab === tab.id ? 'var(--primary)' : 'var(--card-bg)',
                        color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                        boxShadow: activeTab === tab.id ? '0 4px 15px rgba(59,130,246,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s'
                    }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* LEARNING PATH TAB */}
            {activeTab === 'learning-path' && learningPath && (
                <div>
                    {/* Overview Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-stat-card stat-card-blue">
                            <div className="stat-card-inner">
                                <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                                    <Target size={22} color="#fff" />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-number">{learningPath.overallPassRate}%</div>
                                    <div className="stat-label-text">{t('overall_pass_rate')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="dashboard-stat-card stat-card-green">
                            <div className="stat-card-inner">
                                <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}>
                                    <CheckCircle size={22} color="#fff" />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-number">{learningPath.totalPassed}</div>
                                    <div className="stat-label-text">{t('problems_passed')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="dashboard-stat-card stat-card-purple">
                            <div className="stat-card-inner">
                                <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}>
                                    <Flame size={22} color="#fff" />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-number">{learningPath.totalAttempts}</div>
                                    <div className="stat-label-text">{t('total_attempts')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weak Areas & Strengths */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-panel">
                            <h3 className="panel-title" style={{ color: '#ef4444' }}>
                                <AlertTriangle size={18} /> {t('weak_areas')}
                            </h3>
                            {learningPath.weakAreas.length > 0 ? learningPath.weakAreas.map((area, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{area.category}</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{area.attempts} {t('attempts_made')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.1rem' }}>{area.avgScore}%</span>
                                        <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{area.passRate}% {t('pass_rate')}</div>
                                    </div>
                                </div>
                            )) : <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>{t('no_weak_areas')}</div>}
                        </div>

                        <div className="dashboard-panel">
                            <h3 className="panel-title" style={{ color: '#10b981' }}>
                                <CheckCircle size={18} /> {t('strengths')}
                            </h3>
                            {learningPath.strengths.length > 0 ? learningPath.strengths.map((area, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{area.category}</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{area.attempts} {t('attempts_made')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>{area.avgScore}%</span>
                                        <div style={{ fontSize: '0.7rem', color: '#10b981' }}>{area.passRate}% {t('pass_rate')}</div>
                                    </div>
                                </div>
                            )) : <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>{t('no_data')}</div>}
                        </div>
                    </div>

                    {/* Language Proficiency */}
                    {learningPath.languageProficiency.length > 0 && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><Code size={18} color="#3b82f6" /> {t('language_proficiency')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                {learningPath.languageProficiency.map((lang, i) => (
                                    <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{lang.language}</div>
                                        <div style={{
                                            display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                                            background: lang.level === 'Advanced' ? 'rgba(16,185,129,0.15)' : lang.level === 'Intermediate' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: lang.level === 'Advanced' ? '#10b981' : lang.level === 'Intermediate' ? '#f59e0b' : '#ef4444'
                                        }}>{lang.level}</div>
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${lang.avgScore}%`, borderRadius: '3px', background: lang.level === 'Advanced' ? '#10b981' : lang.level === 'Intermediate' ? '#f59e0b' : '#ef4444', transition: 'width 0.5s' }} />
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lang.avgScore}% avg • {lang.attempts} solved</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommended Problems */}
                    <div className="dashboard-panel">
                        <h3 className="panel-title"><Sparkles size={18} color="#f59e0b" /> {t('recommended_problems')}</h3>
                        {learningPath.recommendations.length > 0 ? (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {learningPath.recommendations.map((rec, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
                                            background: rec.priority >= 5 ? 'rgba(239,68,68,0.12)' : rec.priority >= 3 ? 'rgba(251,191,36,0.12)' : 'rgba(59,130,246,0.12)',
                                            color: rec.priority >= 5 ? '#ef4444' : rec.priority >= 3 ? '#f59e0b' : '#3b82f6'
                                        }}>{i + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.reason}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: rec.difficulty === 'easy' ? 'rgba(16,185,129,0.12)' : rec.difficulty === 'medium' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)', color: rec.difficulty === 'easy' ? '#10b981' : rec.difficulty === 'medium' ? '#f59e0b' : '#ef4444' }}>{rec.difficulty}</span>
                                            {rec.language && <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{rec.language}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('complete_more_problems')}</div>}
                    </div>
                </div>
            )}

            {/* PEER COMPARISON TAB */}
            {activeTab === 'peer-comparison' && peerComparison && (
                <div>
                    {/* Rank & Percentile Header */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '280px', padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{t('your_rank')}</div>
                            <div style={{ fontSize: '3rem', fontWeight: 800 }}>#{peerComparison.you.rank}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t('out_of')} {peerComparison.you.totalStudents} {t('students')}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '280px', padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{t('percentile')}</div>
                            <div style={{ fontSize: '3rem', fontWeight: 800 }}>{peerComparison.you.percentile}th</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t('top_performer_msg')}</div>
                        </div>
                    </div>

                    {/* Comparison Grid */}
                    <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="panel-title"><BarChart3 size={18} color="#8b5cf6" /> {t('your_score_vs_class')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            {[
                                { label: t('avg_score'), yours: peerComparison.you.avgScore, classVal: peerComparison.classAverage.avgScore, suffix: '%' },
                                { label: t('pass_rate'), yours: peerComparison.you.passRate, classVal: peerComparison.classAverage.avgPassRate, suffix: '%' },
                                { label: t('total_submissions'), yours: peerComparison.you.totalSubmissions, classVal: peerComparison.classAverage.avgSubmissions, suffix: '' },
                                { label: t('problems_solved_label'), yours: peerComparison.you.problemsSolved, classVal: peerComparison.classAverage.avgProblemsSolved, suffix: '' },
                                { label: t('tasks_completed'), yours: peerComparison.you.tasksDone, classVal: peerComparison.classAverage.avgTasksDone, suffix: '' }
                            ].map((item, i) => {
                                const diff = item.yours - item.classVal
                                const isAbove = diff > 0
                                const isEqual = diff === 0
                                return (
                                    <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.yours}{item.suffix}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('you')}</div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: '0.25rem 0.5rem', borderRadius: '8px', background: isAbove ? 'rgba(16,185,129,0.1)' : isEqual ? 'rgba(156,163,175,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                                {isAbove ? <ArrowUpRight size={14} color="#10b981" /> : isEqual ? <Minus size={14} color="#9ca3af" /> : <ArrowDownRight size={14} color="#ef4444" />}
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAbove ? '#10b981' : isEqual ? '#9ca3af' : '#ef4444' }}>{isAbove ? '+' : ''}{diff}{item.suffix}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{Math.round(item.classVal)}{item.suffix}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('class_avg')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Score Distribution */}
                    {peerComparison.scoreDistribution && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><BarChart3 size={18} color="#3b82f6" /> {t('score_distribution')}</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', padding: '0 1rem' }}>
                                {peerComparison.scoreDistribution.map((bucket, i) => {
                                    const maxCount = Math.max(...peerComparison.scoreDistribution.map(b => b.count))
                                    const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>{bucket.count}</span>
                                            <div style={{
                                                width: '100%', height: `${height}%`, minHeight: '4px', borderRadius: '4px 4px 0 0',
                                                background: bucket.isYou ? 'linear-gradient(180deg, #3b82f6, #1e40af)' : 'rgba(59,130,246,0.15)',
                                                border: bucket.isYou ? '2px solid #1e40af' : 'none', transition: 'height 0.3s'
                                            }} />
                                            <span style={{ fontSize: '0.55rem', color: bucket.isYou ? '#3b82f6' : 'var(--text-muted)', fontWeight: bucket.isYou ? 700 : 400 }}>{bucket.range}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {t('highlighted_your_position')}
                            </div>
                        </div>
                    )}

                    {/* Language Comparison */}
                    {peerComparison.languageComparison.length > 0 && (
                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Code size={18} color="#8b5cf6" /> {t('language_vs_class')}</h3>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {peerComparison.languageComparison.map((lang, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                        <div style={{ width: '80px', fontWeight: 700, fontSize: '0.9rem' }}>{lang.language}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#3b82f6', width: '50px' }}>{t('you')}: {lang.yourScore}%</span>
                                                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${lang.yourScore}%`, borderRadius: '4px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#9ca3af', width: '50px' }}>{t('class')}: {lang.classAvg}%</span>
                                                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${lang.classAvg}%`, borderRadius: '4px', background: 'rgba(156,163,175,0.4)' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontWeight: 700, fontSize: '0.85rem', padding: '0.25rem 0.5rem', borderRadius: '6px',
                                            color: lang.difference > 0 ? '#10b981' : lang.difference < 0 ? '#ef4444' : '#9ca3af',
                                            background: lang.difference > 0 ? 'rgba(16,185,129,0.1)' : lang.difference < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)'
                                        }}>{lang.difference > 0 ? '+' : ''}{lang.difference}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TOPIC ANALYSIS TAB */}
            {activeTab === 'topic-analysis' && topicAnalysis && (
                <div>
                    {/* By Type */}
                    {topicAnalysis.byType.length > 0 && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><BookOpen size={18} color="#3b82f6" /> {t('performance_by_type')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {topicAnalysis.byType.map((item, i) => (
                                    <div key={i} style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'capitalize' }}>{item.type}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('submissions')}</span><div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{item.submissions}</div></div>
                                            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('avg_score')}</span><div style={{ fontWeight: 700, fontSize: '1.2rem', color: item.avgScore >= 70 ? '#10b981' : item.avgScore >= 40 ? '#f59e0b' : '#ef4444' }}>{item.avgScore}%</div></div>
                                            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('pass_rate')}</span><div style={{ fontWeight: 700, color: '#10b981' }}>{item.passRate}%</div></div>
                                            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('fail_rate')}</span><div style={{ fontWeight: 700, color: '#ef4444' }}>{item.failRate}%</div></div>
                                        </div>
                                        <div style={{ marginTop: '0.75rem', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${item.passRate}%`, borderRadius: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* By Difficulty */}
                    {topicAnalysis.byDifficulty.length > 0 && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><Target size={18} color="#f59e0b" /> {t('performance_by_difficulty')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {topicAnalysis.byDifficulty.map((item, i) => {
                                    const colors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
                                    const color = colors[item.difficulty] || '#3b82f6'
                                    return (
                                        <div key={i} style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary)', borderLeft: `4px solid ${color}` }}>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize', color, marginBottom: '0.75rem' }}>{item.difficulty}</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{item.avgScore}%</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.submissions} {t('submissions')} • {item.passRate}% {t('pass_rate')}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* By Language */}
                    {topicAnalysis.byLanguage.length > 0 && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><Code size={18} color="#8b5cf6" /> {t('performance_by_language')}</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>{t('language')}</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>{t('submissions')}</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>{t('avg_score')}</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem' }}>{t('pass_rate')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topicAnalysis.byLanguage.map((lang, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{lang.language}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{lang.submissions}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: lang.avgScore >= 70 ? '#10b981' : lang.avgScore >= 40 ? '#f59e0b' : '#ef4444' }}>{lang.avgScore}%</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${lang.passRate}%`, borderRadius: '3px', background: '#10b981' }} />
                                                        </div>
                                                        <span>{lang.passRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Top Problems */}
                    {topicAnalysis.topProblems.length > 0 && (
                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Flame size={18} color="#ef4444" /> {t('most_attempted_problems')}</h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {topicAnalysis.topProblems.map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#3b82f6' }}>{i + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.type} • {p.difficulty}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.avgScore}%</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.attempts} attempts • {p.passRate}% pass</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ==================== STUDENT CODE REVIEWS (read-only view) ====================
function StudentCodeReviews({ user }) {
    const [submissions, setSubmissions] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const token = localStorage.getItem('authToken')

    useEffect(() => {
        axios.get(`${API_BASE}/submissions?studentId=${user?.id}&limit=100`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
                setSubmissions(data.filter(s => !s.isMLTask))
            })
            .catch(() => setSubmissions([]))
            .finally(() => setLoading(false))
    }, [user])

    if (selected) {
        return (
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <button
                    onClick={() => setSelected(null)}
                    style={{ marginBottom: 16, padding: '7px 16px', cursor: 'pointer', background: 'var(--primary, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem' }}
                >
                    ← Back to my submissions
                </button>
                <CodeReviewPanel submissionId={selected.id} submission={selected} />
            </div>
        )
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading your submissions…</div>

    if (!submissions.length) {
        return (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.7 }}>
                <Code size={48} style={{ marginBottom: 12 }} />
                <p>No submissions yet. Complete a coding problem to receive code reviews.</p>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <p style={{ marginBottom: 12, opacity: 0.55, fontSize: '0.85rem' }}>
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''} — click one to view mentor feedback
            </p>
            {submissions.map(sub => {
                const statusColor = sub.status === 'accepted' ? '#4ade80' : sub.status === 'rejected' ? '#f87171' : '#94a3b8'
                const statusBg = sub.status === 'accepted' ? 'rgba(34,197,94,0.12)' : sub.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.12)'
                return (
                    <div
                        key={sub.id}
                        onClick={() => setSelected(sub)}
                        style={{ padding: '13px 16px', marginBottom: 8, borderRadius: 10, background: 'var(--card-bg, #1e293b)', border: '1px solid var(--border-color, #334155)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color, #334155)'}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {'</>'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.93rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sub.itemTitle || `Submission #${sub.id}`}
                            </div>
                            <div style={{ fontSize: '0.78rem', opacity: 0.55, marginTop: 2 }}>
                                {sub.language || 'Code'} · {new Date(sub.submittedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {sub.score != null && (
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>{sub.score}%</span>
                            )}
                            <span style={{ fontSize: '0.72rem', padding: '2px 9px', borderRadius: 20, background: statusBg, color: statusColor, fontWeight: 600 }}>
                                {(sub.status || 'unknown').toUpperCase()}
                            </span>
                            <ChevronRight size={15} style={{ opacity: 0.4 }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default StudentPortal
