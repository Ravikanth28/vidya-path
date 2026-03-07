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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div className="modal-title-with-icon">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={20} color="white" />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600 }}>ML Task Details</span>
                            <h2 style={{ margin: 0 }}>{task.title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close"><XCircle size={20} /></button>
                </div>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    {/* Difficulty & Status */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span className={`difficulty-badge ${task.difficulty?.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            {task.difficulty}
                        </span>
                        <span className={`status-badge ${task.status || 'live'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            {task.status || 'Active'}
                        </span>
                        {task.maxAttempts > 0 && (
                            <span style={{
                                fontSize: '0.85rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '2rem',
                                background: task.attemptCount >= task.maxAttempts ? 'var(--error-alpha)' : 'var(--bg-secondary)',
                                color: task.attemptCount >= task.maxAttempts ? 'var(--error)' : 'var(--text-muted)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 600
                            }}>
                                {task.attemptCount}/{task.maxAttempts} Attempts Used
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} color="var(--primary)" /> Description
                        </h4>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '0.95rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.75rem', margin: 0 }}>
                            {task.description}
                        </p>
                    </div>

                    {/* Requirements */}
                    {task.requirements && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Target size={18} color="var(--secondary)" /> Requirements
                            </h4>
                            <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                {task.requirements.split('\n').map((req, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: idx < task.requirements.split('\n').length - 1 ? '0.75rem' : 0 }}>
                                        <CheckCircle size={16} color="var(--success)" style={{ marginTop: '3px', flexShrink: 0 }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{req.replace(/^[-•*]\s*/, '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submission Guidelines */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lightbulb size={18} color="var(--warning)" /> Submission Guidelines
                        </h4>
                        <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.08))', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.8' }}>
                                <li>You can submit a <strong>file</strong> (.py, .ipynb, .zip) or a <strong>GitHub repository URL</strong></li>
                                <li>For GitHub submissions, ensure the repository is <strong>public</strong> or share access</li>
                                <li>Include a <strong>README.md</strong> with instructions to run your code</li>
                                <li>Your submission will be evaluated by AI based on the requirements</li>
                                <li>You will receive a score and detailed feedback after evaluation</li>
                            </ul>
                        </div>
                    </div>

                    {/* Sample Input/Output if available */}
                    {(task.sampleInput || task.expectedOutput) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Code size={18} color="var(--info)" /> Sample Data
                            </h4>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {task.sampleInput && (
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Sample Input</label>
                                        <pre style={{ background: 'var(--bg-dark)', padding: '0.75rem', borderRadius: '0.5rem', margin: 0, fontSize: '0.85rem', overflow: 'auto' }}>{task.sampleInput}</pre>
                                    </div>
                                )}
                                {task.expectedOutput && (
                                    <div>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Expected Output</label>
                                        <pre style={{ background: 'var(--bg-dark)', padding: '0.75rem', borderRadius: '0.5rem', margin: 0, fontSize: '0.85rem', overflow: 'auto' }}>{task.expectedOutput}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Submit Button */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={onClose} className="btn-reset">Close</button>
                    <button
                        onClick={onSubmit}
                        className="btn-create-new"
                        disabled={task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: (task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts) ? 0.5 : 1,
                            cursor: (task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Upload size={16} /> {task.maxAttempts > 0 && task.attemptCount >= task.maxAttempts ? 'Attempt Limit Reached' : 'Submit Solution'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================== TASK SUBMIT MODAL ====================
function TaskSubmitModal({ task, user, onClose, onSubmissionComplete }) {
    const [file, setFile] = useState(null)
    const [githubUrl, setGithubUrl] = useState('')
    const [submissionType, setSubmissionType] = useState('file') // 'file' or 'github'
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [evaluating, setEvaluating] = useState(false)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    const isValidGithubUrl = (url) => {
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?.*$/i
        return githubRegex.test(url)
    }

    const handleSubmit = async () => {
        if (submissionType === 'file' && !file) return
        if (submissionType === 'github' && !githubUrl) return
        if (submissionType === 'github' && !isValidGithubUrl(githubUrl)) {
            alert('Please enter a valid GitHub repository URL')
            return
        }

        setSubmitting(true)
        setEvaluating(true)

        try {
            if (submissionType === 'file') {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    try {
                        const response = await axios.post(`${API_BASE}/submissions/ml-task`, {
                            studentId: user.id,
                            taskId: task.id,
                            submissionType: 'file',
                            code: e.target.result,
                            fileName: file.name,
                            taskTitle: task.title,
                            taskDescription: task.description,
                            taskRequirements: task.requirements
                        })
                        setResult(response.data)
                        if (onSubmissionComplete) onSubmissionComplete()
                    } catch (error) {
                        console.error(error)
                        setResult({ status: 'error', score: 0, feedback: error.response?.data?.error || 'Submission failed. Please try again.' })
                    } finally {
                        setSubmitting(false)
                        setEvaluating(false)
                    }
                }
                reader.readAsText(file)
            } else {
                // GitHub URL submission
                const response = await axios.post(`${API_BASE}/submissions/ml-task`, {
                    studentId: user.id,
                    taskId: task.id,
                    submissionType: 'github',
                    githubUrl: githubUrl,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    taskRequirements: task.requirements
                })
                setResult(response.data)
                setSubmitting(false)
                setEvaluating(false)
                if (onSubmissionComplete) onSubmissionComplete()
            }
        } catch (error) {
            console.error(error)
            setResult({ status: 'error', score: 0, feedback: error.response?.data?.error || 'Submission failed. Please try again.' })
            setSubmitting(false)
            setEvaluating(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <div className="modal-title-with-icon">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={20} color="white" />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submit Solution</span>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{task.title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close"><XCircle size={20} /></button>
                </div>
                <div className="modal-body">
                    {!result ? (
                        <>
                            {/* Submission Type Toggle */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Choose Submission Method</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => setSubmissionType('file')}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: `2px solid ${submissionType === 'file' ? 'var(--primary)' : 'var(--border-color)'}`,
                                            background: submissionType === 'file' ? 'var(--primary-alpha)' : 'var(--bg-dark)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Upload size={24} color={submissionType === 'file' ? 'var(--primary)' : 'var(--text-muted)'} />
                                        <span style={{ fontWeight: 600, color: submissionType === 'file' ? 'var(--primary)' : 'var(--text-muted)' }}>Upload File</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>.py, .ipynb, .zip</span>
                                    </button>
                                    <button
                                        onClick={() => setSubmissionType('github')}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: `2px solid ${submissionType === 'github' ? 'var(--primary)' : 'var(--border-color)'}`,
                                            background: submissionType === 'github' ? 'var(--primary-alpha)' : 'var(--bg-dark)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Github size={24} color={submissionType === 'github' ? 'var(--primary)' : 'var(--text-muted)'} />
                                        <span style={{ fontWeight: 600, color: submissionType === 'github' ? 'var(--primary)' : 'var(--text-muted)' }}>GitHub URL</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repository link</span>
                                    </button>
                                </div>
                            </div>

                            {/* File Upload Section */}
                            {submissionType === 'file' && (
                                <div className="form-group">
                                    <label className="form-label">Upload Your Solution File</label>
                                    <div style={{
                                        border: '2px dashed var(--border-color)',
                                        borderRadius: '1rem',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        background: 'var(--bg-dark)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                        onClick={() => document.getElementById('file-input').click()}
                                    >
                                        <input type="file" id="file-input" onChange={handleFileChange} accept=".py,.ipynb,.csv,.pkl,.h5,.zip" style={{ display: 'none' }} />
                                        <Upload size={40} style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
                                        {file ? (
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--success)' }}>{file.name}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p style={{ fontWeight: 600 }}>Click to upload or drag and drop</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Supports: .py, .ipynb, .csv, .pkl, .h5, .zip</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* GitHub URL Section */}
                            {submissionType === 'github' && (
                                <div className="form-group">
                                    <label className="form-label">GitHub Repository URL</label>
                                    <div style={{ position: 'relative' }}>
                                        <Github size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="url"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            placeholder="https://github.com/username/repository"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem 0.875rem 2.75rem',
                                                borderRadius: '0.75rem',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                    </div>
                                    {githubUrl && !isValidGithubUrl(githubUrl) && (
                                        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                            Please enter a valid GitHub URL (e.g., https://github.com/username/repo)
                                        </p>
                                    )}
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <strong style={{ color: 'var(--info)' }}>Note:</strong> Make sure your repository is public. Include a README.md with setup instructions.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn-reset" onClick={onClose}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn-create-new"
                                    onClick={handleSubmit}
                                    disabled={(submissionType === 'file' && !file) || (submissionType === 'github' && (!githubUrl || !isValidGithubUrl(githubUrl))) || submitting}
                                >
                                    {submitting ? (
                                        <><span className="spinner-small"></span> {evaluating ? 'Evaluating...' : 'Submitting...'}</>
                                    ) : (
                                        <><Send size={16} /> Submit for Evaluation</>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'left', padding: '0.5rem' }}>
                            {/* Header Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    background: `conic-gradient(${result.score >= 80 ? 'var(--success)' : result.score >= 60 ? 'var(--warning)' : 'var(--danger)'} ${result.score * 3.6}deg, var(--bg-dark) 0deg)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', flexShrink: 0
                                }}>
                                    <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{result.score}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: result.score >= 80 ? 'var(--success)' : result.score >= 60 ? 'var(--warning)' : 'var(--danger)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                        {result.score >= 90 ? 'Outstanding!' : result.score >= 80 ? 'Excellent Work!' : result.score >= 60 ? 'Good Effort' : 'Needs Improvement'}
                                    </h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {result.summary || "Evaluation complete. Review the detailed feedback below to improve your skills."}
                                    </p>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            {(result.metrics || result.breakdown) && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BarChart3 size={18} color="var(--primary)" /> Performance Metrics
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {Object.entries(result.metrics || result.breakdown).map(([key, val]) => (
                                            <div key={key} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                                    <span style={{ fontWeight: 700, color: val >= 80 ? 'var(--success)' : val >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{val}%</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${val}%`,
                                                        height: '100%',
                                                        background: val >= 80 ? 'var(--success)' : val >= 60 ? 'var(--warning)' : 'var(--danger)',
                                                        borderRadius: '3px',
                                                        transition: 'width 1s ease-out'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths & Improvements */}
                            {(result.strengths?.length > 0 || result.suggestion_points?.length > 0) && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {result.strengths?.length > 0 && (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                            <h4 style={{ margin: '0 0 1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                                <CheckCircle size={18} /> Key Strengths
                                            </h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {result.strengths.map((s, i) => (
                                                    <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {result.suggestion_points?.length > 0 && (
                                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                            <h4 style={{ margin: '0 0 1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                                <AlertTriangle size={18} /> Areas for Improvement
                                            </h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {result.suggestion_points.map((s, i) => (
                                                    <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Detailed Feedback Tab/Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} color="var(--info)" /> Detailed Analysis
                                </h4>
                                <div style={{
                                    background: 'var(--bg-dark)',
                                    padding: '1.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', fontFamily: 'monospace' }}>
                                        {result.detailed_feedback || result.feedback}
                                    </div>
                                </div>
                            </div>

                            {/* Next Steps */}
                            {result.next_steps && (
                                <div style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <h4 style={{ margin: '0 0 0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                        <Target size={18} /> Recommended Next Steps
                                    </h4>
                                    <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>{result.next_steps}</p>
                                </div>
                            )}

                            <button className="btn-create-new" onClick={onClose} style={{ marginTop: '2rem', width: '100%', padding: '1rem', fontSize: '1rem' }}>Close Report</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ==================== CODING PROBLEMS ====================
function Assignments({ user }) {
    const [problems, setProblems] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [activeProblem, setActiveProblem] = useState(null)
    const [useProctoredEditor, setUseProctoredEditor] = useState(false)
    const [activeTab, setActiveTab] = useState('coding') // 'coding' or 'sql'
    const [attemptCounts, setAttemptCounts] = useState({}) // { problemId: count }

    const fetchAttemptCounts = async (problemList) => {
        const counts = {}
        await Promise.all(problemList.map(async (p) => {
            try {
                const res = await axios.get(`${API_BASE}/submissions/count?studentId=${user.id}&problemId=${p.id}`)
                counts[p.id] = res.data.attemptCount || 0
            } catch (e) {
                counts[p.id] = 0
            }
        }))
        setAttemptCounts(counts)
    }

    const refreshProblems = (silent = false) => {
        if (!user?.id) return
        if (!silent) setLoading(true)
        if (!silent) setFetchError(null)
        axios.get(`${API_BASE}/students/${user.id}/problems`)
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : []
                setProblems(data)
                setFetchError(null)
                if (!silent) setLoading(false)
                fetchAttemptCounts(data)
            })
            .catch(err => {
                if (!silent) {
                    setLoading(false)
                    const msg = err?.response?.data?.error || err?.message || 'Failed to load problems'
                    setFetchError(msg)
                    console.error('Problem fetch error:', msg)
                }
            })
    }

    useEffect(() => {
        if (!user?.id) return
        refreshProblems()
    }, [user?.id])

    const handleSolve = (problem) => {
        const maxAttempts = problem.maxAttempts || problem.max_attempts || 0
        const used = attemptCounts[problem.id] || 0
        if (maxAttempts > 0 && used >= maxAttempts) {
            alert(`You have used all ${maxAttempts} attempt(s) for this problem.`)
            return
        }
        setActiveProblem(problem)
        // Check if this problem has proctoring enabled
        setUseProctoredEditor(problem.proctoring?.enabled === true)
    }

    const handleClose = () => {
        setActiveProblem(null)
        setUseProctoredEditor(false)
        // Refresh everything after closing editor
        refreshProblems(true)
    }

    // Separate problems into Coding and SQL
    const codingProblems = problems.filter(p => p.language !== 'SQL' && p.type !== 'SQL')
    const sqlProblems = problems.filter(p => p.language === 'SQL' || p.type === 'SQL')

    if (loading) return <div className="loading-spinner"></div>

    if (fetchError) return (
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Could not load problems</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{fetchError}</p>
            <button
                onClick={() => refreshProblems()}
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

    // Helper function to render problem cards
    const renderProblemCard = (problem) => (
        <div key={problem.id} className="item-card glass">
            <div className="item-card-header">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', background: 'var(--primary-alpha)', color: 'var(--primary)', fontWeight: 700 }}>{problem.type?.toUpperCase()}</span>
                    <span className={`status-badge ${problem.status || 'live'}`} style={{ fontSize: '0.65rem' }}>{problem.status || 'Active'}</span>
                    {problem.proctoring?.enabled && (
                        <span style={{
                            fontSize: '0.6rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <Shield size={10} /> PROCTORED
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '4px' }}>{problem.language}</span>
            </div>
            <h3 style={{ margin: '0.75rem 0', fontSize: '1.2rem' }}>{problem.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>{problem.description}</p>

            {/* Proctoring Info */}
            {problem.proctoring?.enabled && (
                <div style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <Eye size={12} /> Proctoring Enabled:
                        {problem.proctoring.videoAudio && <span style={{ marginLeft: '4px' }}>📹 Video</span>}
                        {problem.proctoring.disableCopyPaste && <span style={{ marginLeft: '4px' }}>📋 No Copy</span>}
                        {problem.proctoring.trackTabSwitches && <span style={{ marginLeft: '4px' }}>🔒 Tab Track</span>}
                        {problem.proctoring.enableFaceDetection && <span style={{ marginLeft: '4px' }}>👁️ Face</span>}
                        {problem.proctoring.detectMultipleFaces && <span style={{ marginLeft: '4px' }}>👥 Multi-Face</span>}
                        {problem.proctoring.trackFaceLookaway && <span style={{ marginLeft: '4px' }}>👀 Lookaway</span>}
                    </p>
                </div>
            )}

            {/* Attempt Info */}
            {(() => {
                const maxAttempts = problem.maxAttempts || problem.max_attempts || 0
                const used = attemptCounts[problem.id] || 0
                const exhausted = maxAttempts > 0 && used >= maxAttempts
                return (
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        background: exhausted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                        borderRadius: '8px',
                        marginBottom: '0.75rem',
                        border: `1px solid ${exhausted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)'}`
                    }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: exhausted ? '#ef4444' : '#8b5cf6', fontWeight: 600 }}>
                            🔄 Attempts: {used}{maxAttempts > 0 ? `/${maxAttempts}` : ''} {exhausted ? '(Limit Reached)' : maxAttempts > 0 ? `(${maxAttempts - used} remaining)` : '(Unlimited)'}
                        </p>
                    </div>
                )
            })()}

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
                {(() => {
                    const maxAttempts = problem.maxAttempts || problem.max_attempts || 0
                    const used = attemptCounts[problem.id] || 0
                    const exhausted = maxAttempts > 0 && used >= maxAttempts
                    return (
                        <button
                            onClick={() => handleSolve(problem)}
                            className="btn-create-new"
                            disabled={exhausted}
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                opacity: exhausted ? 0.5 : 1,
                                cursor: exhausted ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <Play size={16} /> {exhausted ? 'No Attempts Left' : 'Solve'}
                        </button>
                    )
                })()}
            </div>
        </div>
    )

    return (
        <>
            {/* Tab Buttons */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '0.5rem',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                width: 'fit-content'
            }}>
                <button
                    onClick={() => setActiveTab('coding')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        background: activeTab === 'coding' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'coding' ? 'white' : 'var(--text-muted)'
                    }}
                >
                    <Code size={18} />
                    Coding Problems
                    <span style={{
                        background: activeTab === 'coding' ? 'rgba(255,255,255,0.2)' : 'var(--bg-dark)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                    }}>{codingProblems.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('sql')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        background: activeTab === 'sql' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'transparent',
                        color: activeTab === 'sql' ? 'white' : 'var(--text-muted)'
                    }}
                >
                    <FileText size={18} />
                    SQL Problems
                    <span style={{
                        background: activeTab === 'sql' ? 'rgba(255,255,255,0.2)' : 'var(--bg-dark)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                    }}>{sqlProblems.length}</span>
                </button>
            </div>

            {/* Coding Problems Tab */}
            {activeTab === 'coding' && (
                <div className="cards-grid animate-slideUp">
                    {codingProblems.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div className="empty-state-icon"><Code size={40} /></div>
                            <h3>No Coding Problems</h3>
                            <p>Your mentor hasn't assigned any coding problems yet.</p>
                        </div>
                    ) : (
                        codingProblems.map(problem => renderProblemCard(problem))
                    )}
                </div>
            )}

            {/* SQL Problems Tab */}
            {activeTab === 'sql' && (
                <div className="cards-grid animate-slideUp">
                    {sqlProblems.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <div className="empty-state-icon"><FileText size={40} /></div>
                            <h3>No SQL Problems</h3>
                            <p>Your mentor hasn't assigned any SQL problems yet.</p>
                        </div>
                    ) : (
                        sqlProblems.map(problem => renderProblemCard(problem))
                    )}
                </div>
            )}

            {/* Use Proctored Editor if proctoring is enabled, otherwise use regular modal */}
            {activeProblem && useProctoredEditor && (
                <ProctoredCodeEditor
                    problem={activeProblem}
                    user={user}
                    onClose={handleClose}
                    onSubmitSuccess={() => {
                        // Refresh problems after successful submission
                        axios.get(`${API_BASE}/students/${user.id}/problems`)
                            .then(res => setProblems(res.data))
                    }}
                />
            )}

            {activeProblem && !useProctoredEditor && (
                <CodeEditorModal
                    problem={activeProblem}
                    user={user}
                    onClose={handleClose}
                    onSubmissionComplete={() => refreshProblems(true)}
                />
            )}
        </>
    )
}

// ==================== CODE EDITOR MODAL WITH FULL PROCTORED MODE ====================
function CodeEditorModal({ problem, user, onClose, onSubmissionComplete }) {
    const langConfig = LANGUAGE_CONFIG[problem.language] || LANGUAGE_CONFIG['Python']
    const [code, setCode] = useState(langConfig.defaultCode)
    const [selectedLang, setSelectedLang] = useState(problem.language || 'Python')
    const [sqlTool, setSqlTool] = useState('validator') // 'validator', 'visualizer', 'debugger'
    const [output, setOutput] = useState([]) // [{text, type: 'stdout'|'stderr'|'info'|'stdin'}]
    const [status, setStatus] = useState('idle')
    const [result, setResult] = useState(null)
    const [tabSwitches, setTabSwitches] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const [warningMessage, setWarningMessage] = useState('')
    const [showTestResults, setShowTestResults] = useState(false)
    const [testResults, setTestResults] = useState(null)
    const [customInput, setCustomInput] = useState(problem.sampleInput || problem.testInput || '')
    const [activeOutputTab, setActiveOutputTab] = useState('input')
    const [descTab, setDescTab] = useState('description')
    const [runResult, setRunResult] = useState(null)
    const [interactiveStdin, setInteractiveStdin] = useState('')
    const [terminalSize, setTerminalSize] = useState('normal') // 'minimized'|'normal'|'maximized'
    const containerRef = useRef(null)
    const terminalRef = useRef(null)

    // Enter fullscreen on mount
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (containerRef.current && document.fullscreenEnabled) {
                    await containerRef.current.requestFullscreen()
                    setIsFullscreen(true)
                }
            } catch (err) {
                console.warn('Could not enter fullscreen:', err)
            }
        }
        const timer = setTimeout(enterFullscreen, 100)
        return () => clearTimeout(timer)
    }, [])

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement
            setIsFullscreen(isNowFullscreen)
            if (!isNowFullscreen && !result) {
                setWarningMessage('⚠️ You exited fullscreen mode! This action has been recorded.')
                setShowWarning(true)
                setTabSwitches(prev => prev + 1)
                setTimeout(async () => {
                    if (containerRef.current && document.fullscreenEnabled) {
                        try { await containerRef.current.requestFullscreen() } catch (e) { }
                    }
                }, 500)
            }
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [result])

    // Track tab visibility changes - AUTO EXIT AFTER 3 VIOLATIONS
    const [forceExit, setForceExit] = useState(false)

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !result && !forceExit) {
                setTabSwitches(prev => {
                    const newCount = prev + 1

                    if (newCount >= 3) {
                        // 3rd violation - Force exit
                        setWarningMessage(`🚫 DISQUALIFIED! You have exceeded the maximum allowed tab switches (${newCount}/3). Session terminated.`)
                        setShowWarning(true)
                        setForceExit(true)

                        // Auto-submit with rejection after a delay
                        setTimeout(async () => {
                            try {
                                await axios.post(`${API_BASE}/submissions`, {
                                    studentId: user.id,
                                    problemId: problem.id,
                                    language: selectedLang,
                                    code: code,
                                    submissionType: 'editor',
                                    tabSwitches: newCount
                                })
                            } catch (e) {
                                console.error('Auto-submit failed:', e)
                            }

                            // Exit fullscreen and close
                            if (document.fullscreenElement) {
                                document.exitFullscreen()
                            }
                            onClose()
                        }, 3000)
                    } else {
                        setWarningMessage(`⚠️ Tab switch detected! (${newCount}/3 violations) ${3 - newCount} more will disqualify you!`)
                        setShowWarning(true)
                    }

                    return newCount
                })
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [result, forceExit, user.id, problem.id, selectedLang, code, onClose])

    // Auto-hide warning
    useEffect(() => {
        if (showWarning) {
            const timer = setTimeout(() => setShowWarning(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showWarning])

    const handleLanguageChange = (newLang) => {
        setSelectedLang(newLang)
        setCode(LANGUAGE_CONFIG[newLang]?.defaultCode || '')
    }

    // Normalize: handle \r, literal \\n, trim each line, remove blank lines
    const normalizeForCompare = s => {
        if (!s) return '';
        return s
            .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/\\n/g, '\n') // literal backslash-n → real newline
            .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    };
    // Whitespace-collapsed compare — matches when expected uses spaces where actual uses newlines
    const wsCollapse = s => normalizeForCompare(s).replace(/\s+/g, ' ').trim();

    const handleRun = () => {
        setStatus('running')
        setOutput([])
        setRunResult(null)
        setInteractiveStdin('')
        setActiveOutputTab('output')

        const socket = socketService.connect()
        socket.emit('run-interactive', {
            code,
            language: selectedLang,
            problemId: problem.id,
            sqlSchema: problem.sqlSchema
        })

        let accOutput = ''

        const onOutput = ({ text, type }) => {
            if (type !== 'stdin') accOutput += text
            setOutput(prev => [...prev, { text, type: type || 'stdout' }])
            setTimeout(() => {
                if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
            }, 0)
        }

        const onExit = ({ code: exitCode, allOutput: progOutput }) => {
            socket.off('run-output', onOutput)
            socket.off('run-exit', onExit)
            setStatus(exitCode === 0 ? 'success' : 'error')
            // Use allOutput from server — pure program output, excludes "Compiling..." status messages
            const progText = (progOutput !== undefined ? progOutput : accOutput)
            const expectedRaw = (problem.expectedOutput || problem.expected_output || '').trim()
            if (expectedRaw) {
                const normMatch = normalizeForCompare(progText) === normalizeForCompare(expectedRaw)
                const wsMatch = wsCollapse(progText) === wsCollapse(expectedRaw)
                // Strip lone-number lines (stdin echoes) from actual for problems stored without terminal echo
                const stripEchoLines = s => normalizeForCompare(s).split('\n').filter(l => !/^\d+$/.test(l)).join('\n');
                const echoStrippedMatch = stripEchoLines(progText) === stripEchoLines(expectedRaw);
                const passed = normMatch || wsMatch || echoStrippedMatch
                setRunResult({ actual: progText.trim(), expected: expectedRaw, passed })
            }
            // Also run test cases in background
            axios.post(`${API_BASE}/run-with-tests`, { problemId: problem.id, code, language: selectedLang })
                .then(testRes => {
                    if (testRes.data?.testResults) {
                        setTestResults({
                            passed: testRes.data.testResults.filter(r => r.passed).length,
                            total: testRes.data.testResults.length,
                            results: testRes.data.testResults
                        })
                    }
                })
                .catch(() => {})
        }

        socket.on('run-output', onOutput)
        socket.on('run-exit', onExit)
    }

    const sendInteractiveStdin = () => {
        const socket = socketService.connect()
        socket.emit('run-stdin', interactiveStdin)
        // Echo typed input as green segment
        setOutput(prev => [...prev, { text: interactiveStdin + '\n', type: 'stdin' }])
        setInteractiveStdin('')
    }

    const stopRun = () => {
        const socket = socketService.connect()
        socket.emit('kill-run')
        setStatus('idle')
    }

    // ==================== AI HINTS FEATURE ====================
    const [hints, setHints] = useState(null)
    const [hintsLoading, setHintsLoading] = useState(false)
    const [showHints, setShowHints] = useState(false)

    const handleGetHints = async () => {
        setHintsLoading(true)
        setShowHints(true)
        try {
            const res = await axios.post(`${API_BASE}/hints`, {
                code,
                language: selectedLang,
                problemId: problem.id
            })
            setHints(res.data)
        } catch (error) {
            setHints({
                hints: ['Think about the problem step by step.', 'Consider what data structure would be most efficient.'],
                encouragement: "Don't give up! Every expert was once a beginner.",
                error: true
            })
        } finally {
            setHintsLoading(false)
        }
    }


    const handleSubmit = async () => {
        setStatus('submitting')
        try {
            const response = await axios.post(`${API_BASE}/submissions`, {
                studentId: user.id,
                problemId: problem.id,
                language: selectedLang,
                code: code,
                submissionType: 'editor',
                tabSwitches: tabSwitches
            })
            setResult(response.data)
            setStatus('done')
            if (onSubmissionComplete) onSubmissionComplete()
            if (document.fullscreenElement) document.exitFullscreen()
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.error === 'Attempt limit reached') {
                setResult({ status: 'rejected', score: 0, feedback: error.response.data.message || 'You have used all attempts for this problem.' })
                setStatus('done')
                if (document.fullscreenElement) document.exitFullscreen()
            } else {
                setResult({ status: 'rejected', score: 0, feedback: 'Submission failed.' })
                setStatus('error')
            }
        }
    }

    const handleExit = () => {
        if (!result && !window.confirm('Exiting early will be recorded. Are you sure?')) return
        if (document.fullscreenElement) document.exitFullscreen()
        onClose()
    }

    return (
        <div ref={containerRef} className="proctored-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            {/* Warning Toast */}
            {showWarning && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', zIndex: 10001, boxShadow: '0 10px 40px rgba(239, 68, 68, 0.5)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontWeight: 600 }}>{warningMessage}</span>
                </div>
            )}

            {/* Header */}
            <div style={{ borderBottom: '1px solid #334155', background: '#1e293b', padding: '1rem 2rem', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {problem.title}
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '2rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
                                🔒 PROCTORED MODE
                            </span>
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{problem.type || 'coding'}</span>
                            <span className={`difficulty-badge ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty?.toUpperCase()}</span>
                            {tabSwitches > 0 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600 }}>⚠️ {tabSwitches} violations</span>}
                        </div>
                    </div>
                </div>
                <button onClick={handleExit} style={{ background: '#334155', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Exit Session</button>
            </div>

            {/* Body */}
            <div style={{ padding: 0, display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0, overflow: 'hidden', background: '#0f172a' }}>
                {/* Left Side: LeetCode-style Problem Panel */}
                <div style={{ width: '420px', borderRight: '1px solid #1e293b', overflowY: 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    {/* Tab bar */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0a0f1a', flexShrink: 0 }}>
                        {['description', 'examples', 'hints'].map(tab => (
                            <button key={tab} onClick={() => setDescTab(tab)} style={{ padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: descTab === tab ? '#60a5fa' : '#64748b', borderBottom: descTab === tab ? '2px solid #3b82f6' : '2px solid transparent', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                                {tab === 'description' ? '📄 Description' : tab === 'examples' ? '📋 Examples' : '💡 Hints'}
                            </button>
                        ))}
                    </div>

                    {/* Description Tab */}
                    {descTab === 'description' && (() => {
                        // Smart description renderer — detects section headers & formats nicely
                        const SECTION_PATTERNS = /^(input format|output format|constraints?|examples?|explanation|note|notes|sample input|sample output|approach|hint|hints?|format|scoring|warning|important|problem statement)(s)?\s*:?\s*$/i
                        const lines = (problem.description || '').split('\n')
                        const rendered = []
                        let paraLines = []
                        const flushPara = () => {
                            if (paraLines.length) {
                                const text = paraLines.join('\n').trim()
                                if (text) rendered.push({ type: 'para', text })
                                paraLines = []
                            }
                        }
                        lines.forEach((raw) => {
                            const line = raw.trimEnd()
                            if (SECTION_PATTERNS.test(line.trim())) {
                                flushPara()
                                rendered.push({ type: 'section', text: line.trim() })
                            } else if (line.trim() === '') {
                                flushPara()
                            } else {
                                paraLines.push(line)
                            }
                        })
                        flushPara()
                        const isSQLDesc = problem.type === 'SQL' || problem.language === 'SQL'
                        return (
                        <div style={{ padding: '1.5rem', flex: 1 }}>
                            {/* Title + badges */}
                            <div style={{ marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid #1e293b' }}>
                                <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{problem.title}</h2>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.15)' : problem.difficulty === 'Hard' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: problem.difficulty === 'Easy' ? '#4ade80' : problem.difficulty === 'Hard' ? '#f87171' : '#facc15', border: `1px solid ${problem.difficulty === 'Easy' ? 'rgba(34,197,94,0.3)' : problem.difficulty === 'Hard' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}` }}>{problem.difficulty?.toUpperCase() || 'MEDIUM'}</span>
                                    {problem.type && <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>{problem.type}</span>}
                                    {problem.language && problem.type !== problem.language && <span style={{ padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }}>{problem.language}</span>}
                                </div>
                            </div>

                            {/* Smart-rendered description */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                {rendered.map((block, i) => block.type === 'section' ? (
                                    <div key={i} style={{ marginTop: i === 0 ? 0 : '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#3b82f6', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{block.text.replace(/:$/, '')}</span>
                                    </div>
                                ) : (
                                    <p key={i} style={{ margin: '0 0 0.75rem', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{block.text}</p>
                                ))}
                            </div>

                            {/* SQL schema */}
                            {isSQLDesc && problem.sqlSchema && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>🗄️ Database Schema</div>
                                    <pre style={{ margin: 0, padding: '14px 16px', background: '#0d1929', border: '1px solid #1e3a5f', borderRadius: '10px', color: '#93c5fd', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{problem.sqlSchema}</pre>
                                </div>
                            )}

                            {/* Constraints */}
                            {problem.constraints && (
                                <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Constraints</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{problem.constraints}</div>
                                </div>
                            )}

                            {/* Tags */}
                            {problem.tags && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                                    {(typeof problem.tags === 'string' ? problem.tags.split(',') : problem.tags).filter(Boolean).map((tag, i) => (
                                        <span key={i} style={{ padding: '2px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '999px', color: '#64748b', fontSize: '0.7rem' }}>{tag.trim()}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        )
                    })()}

                    {/* Examples Tab */}
                    {descTab === 'examples' && (
                        <div style={{ padding: '1.25rem', flex: 1 }}>
                            {(problem.type === 'SQL' || problem.language === 'SQL') ? (
                                <>
                                    {problem.expectedQueryResult && (
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '7px' }}>✅ Expected Output</div>
                                            <pre style={{ margin: 0, padding: '14px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#34d399', fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{problem.expectedQueryResult}</pre>
                                        </div>
                                    )}
                                </>
                            ) : (() => {
                                const toLines = (text = '') =>
                                    (text || '').replace(/\\n/g, '\n').replace(/\r/g, '').split('\n').map(l => l.trimEnd());
                                const InputBlock = ({ raw, onUse }) => {
                                    const lines = toLines(raw);
                                    return (
                                        <div style={{ background: '#080e1a', border: '1px solid #1e3a5f', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 6px 14px', background: '#0d1929', borderBottom: '1px solid #1e2d4a' }}>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.07em', fontFamily: 'ui-monospace,monospace' }}>STDIN</span>
                                                {onUse && <button onClick={onUse} style={{ padding: '2px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '5px', color: '#60a5fa', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>▶ Use as Input</button>}
                                            </div>
                                            <div style={{ padding: '10px 14px' }}>
                                                {lines.map((line, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minHeight: '1.4em' }}>
                                                        <span style={{ color: '#334155', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace', userSelect: 'none', paddingTop: '1px', minWidth: '18px', textAlign: 'right' }}>{i + 1}</span>
                                                        <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{line || <span style={{ color: '#334155' }}>↵</span>}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                };
                                const OutputBlock = ({ raw, actualRaw, label, passed }) => {
                                    const expLines = toLines(raw);
                                    const actLines = actualRaw !== undefined ? toLines(actualRaw) : null;
                                    // Use passed from parent (which uses smarter whitespace-collapsed comparison)
                                    const effectivePassed = actLines === null ? undefined : passed;
                                    const borderColor = actLines === null ? 'rgba(16,185,129,0.3)' : effectivePassed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)';
                                    const headerBg = actLines === null ? '#061510' : effectivePassed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
                                    // Per-line diff only makes sense when NOT passed (genuine mismatch)
                                    const showPerLine = actLines !== null && !effectivePassed;
                                    return (
                                        <div style={{ background: '#070d0a', border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: actLines === null ? '#34d399' : effectivePassed ? '#4ade80' : '#f87171', letterSpacing: '0.07em', fontFamily: 'ui-monospace,monospace' }}>{label}</span>
                                                {actLines !== null && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: effectivePassed ? '#4ade80' : '#f87171' }}>{effectivePassed ? '✅ Match' : '❌ Mismatch'}</span>}
                                            </div>
                                            <div style={{ padding: '10px 14px' }}>
                                                {expLines.map((line, i) => {
                                                    const actLine = showPerLine ? (actLines[i] ?? '') : null;
                                                    const lineMatch = actLine === null ? null : line.trim() === actLine.trim();
                                                    return (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minHeight: '1.4em', borderRadius: '3px', background: lineMatch === false ? 'rgba(239,68,68,0.06)' : 'transparent', margin: '0 -4px', padding: '0 4px' }}>
                                                            <span style={{ color: '#334155', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace', userSelect: 'none', paddingTop: '1px', minWidth: '18px', textAlign: 'right' }}>{i + 1}</span>
                                                            <span style={{ color: actLines === null ? '#34d399' : effectivePassed ? '#4ade80' : lineMatch === false ? '#fca5a5' : '#4ade80', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', flex: 1 }}>{line || ''}</span>
                                                            {lineMatch === false && actLine !== undefined && <span style={{ color: '#f87171', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', flex: 1, borderLeft: '1px solid rgba(239,68,68,0.25)', paddingLeft: '8px' }}>{actLine}</span>}
                                                            {effectivePassed && actLines !== null && <span style={{ color: '#1e4a2a', fontSize: '0.7rem', flexShrink: 0 }}>✓</span>}
                                                        </div>
                                                    );
                                                })}
                                                {/* extra actual lines — only shown when NOT passed */}
                                                {showPerLine && actLines.slice(expLines.length).map((line, i) => (
                                                    <div key={'extra-' + i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(239,68,68,0.06)', borderRadius: '3px', margin: '0 -4px', padding: '0 4px' }}>
                                                        <span style={{ color: '#334155', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace', userSelect: 'none', paddingTop: '1px', minWidth: '18px', textAlign: 'right' }}>{expLines.length + i + 1}</span>
                                                        <span style={{ flex: 1 }} /><span style={{ color: '#f87171', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', flex: 1, borderLeft: '1px solid rgba(239,68,68,0.25)', paddingLeft: '8px' }}>{line}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                };
                                return (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            Example 1
                                            {runResult && (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', background: runResult.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: runResult.passed ? '#4ade80' : '#f87171', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                                                    {runResult.passed ? '✅ Passed' : '❌ Wrong Answer'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>📥 Input</div>
                                            <InputBlock raw={problem.sampleInput || problem.testInput} onUse={() => { setCustomInput(problem.sampleInput || problem.testInput || ''); setActiveOutputTab('input'); }} />
                                        </div>
                                        <div style={{ marginBottom: runResult ? '8px' : 0 }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>📤 Expected Output</div>
                                            <OutputBlock raw={problem.expectedOutput} actualRaw={runResult ? runResult.actual : undefined} label="EXPECTED" passed={runResult?.passed} />
                                        </div>
                                        {runResult && (
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>🖥️ Your Output</div>
                                                <div style={{ background: '#070d0a', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ padding: '6px 12px', background: runResult.passed ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.06)', borderBottom: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: runResult.passed ? '#4ade80' : '#f87171', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.07em' }}>STDOUT</span>
                                                    </div>
                                                    <div style={{ padding: '10px 14px' }}>
                                                        {(runResult.actual || '').replace(/\\n/g, '\n').replace(/\r/g, '').split('\n').map((line, i) => (
                                                            <div key={i} style={{ display: 'flex', gap: '8px', minHeight: '1.4em' }}>
                                                                <span style={{ color: '#334155', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace', userSelect: 'none', paddingTop: '1px', minWidth: '18px', textAlign: 'right' }}>{i + 1}</span>
                                                                <span style={{ color: runResult.passed ? '#4ade80' : '#fca5a5', fontSize: '0.82rem', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{line}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Hints Tab */}
                    {descTab === 'hints' && (
                        <div style={{ padding: '1.5rem', flex: 1 }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 1rem' }}>AI hints guide you toward the solution without revealing it directly.</p>
                            {!showHints ? (
                                <button onClick={handleGetHints} disabled={hintsLoading} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', borderRadius: '8px', color: '#1e293b', fontWeight: 700, fontSize: '0.88rem', cursor: hintsLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Sparkles size={16} /> {hintsLoading ? 'Getting Hints...' : 'Get AI Hints'}
                                </button>
                            ) : (
                                <div>
                                    {hintsLoading ? <div style={{ textAlign: 'center', padding: '2rem', color: '#fbbf24' }}>🤔 Analyzing your code...</div> : hints && (
                                        <div>
                                            {hints.encouragement && <div style={{ background: 'rgba(34,197,94,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '0.82rem' }}><Sparkles size={13} /> {hints.encouragement}</div>}
                                            {hints.hints?.length > 0 && <ul style={{ margin: '0 0 12px', paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.9 }}>{hints.hints.map((h, i) => <li key={i}>{h}</li>)}</ul>}
                                            {hints.commonMistakes && <div style={{ background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.8rem' }}>⚠️ {hints.commonMistakes}</div>}
                                            <button onClick={() => { setShowHints(false); setHints(null); }} style={{ marginTop: '12px', width: '100%', padding: '8px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Hide Hints</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Proctoring rules */}
                            <div style={{ marginTop: '1.5rem', padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={13} /> Proctoring Rules</div>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.9 }}>
                                    <li>Do not switch tabs or windows</li>
                                    <li>Stay in fullscreen mode</li>
                                    <li>All violations are recorded</li>
                                    <li>3+ violations = disqualification</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Code Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
                    {/* Toolbar - Only show if not submitted */}
                    {!result && (
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', background: '#1e293b' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Language:</label>
                                <select
                                    value={selectedLang}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    disabled={problem.type === 'SQL' || problem.language === 'SQL'}
                                    style={{
                                        background: '#0f172a',
                                        color: '#f8fafc',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.85rem',
                                        opacity: (problem.type === 'SQL' || problem.language === 'SQL') ? 0.7 : 1,
                                        cursor: (problem.type === 'SQL' || problem.language === 'SQL') ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {Object.keys(LANGUAGE_CONFIG).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {/* Hide Run Code for SQL - SQLValidator handles execution */}
                                {selectedLang !== 'SQL' && (
                                    <button onClick={handleRun} disabled={status === 'running' || status === 'submitting'} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                        <Play size={16} /> {status === 'running' ? 'Running...' : 'Run Code'}
                                    </button>
                                )}
                                <button onClick={handleSubmit} disabled={status === 'running' || status === 'submitting' || result} style={{ background: result ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: result ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                    <Send size={16} /> {status === 'submitting' ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Editor - Show only if no result */}
                    {!result && (
                        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                            <Editor height="100%" language={LANGUAGE_CONFIG[selectedLang]?.monacoLang || 'python'} theme="vs-dark" value={code} onChange={(value) => setCode(value)} options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: true, automaticLayout: true, padding: { top: 20 }, smoothScrolling: true, cursorSmoothCaretAnimation: 'on', mouseWheelScrollSensitivity: 1.5, lineNumbersMinChars: 3, renderLineHighlight: 'all', scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: true } }} />
                        </div>
                    )}

                    {/* Result Panel / Detailed Report */}
                    {result && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#0f172a', color: '#f8fafc' }}>
                            {/* Header Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #334155' }}>
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%',
                                    background: `conic-gradient(${result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444'} ${result.score * 3.6}deg, #1e293b 0deg)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', flexShrink: 0
                                }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc' }}>{result.score}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: '2rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                                        {result.score >= 90 ? 'Outstanding Performance!' : result.score >= 80 ? 'Excellent Work!' : result.score >= 60 ? 'Good Effort' : 'Needs Improvement'}
                                    </h3>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                        {result.feedback || (result.status === 'accepted' ? 'Your solution passed all tests and met the requirements.' : 'Your solution needs some improvements.')}
                                    </p>
                                    {tabSwitches > 0 && <p style={{ marginTop: '0.5rem', color: '#f59e0b', fontSize: '0.9rem' }}>⚠️ {tabSwitches} tab switch notifications recorded.</p>}
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            {result.analysis && (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <BarChart3 size={20} color="#3b82f6" /> Performance Analysis
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                                        {Object.entries(result.analysis).map(([key, val]) => {
                                            if (val === 'Unknown' || val === null) return null;
                                            const score = parseInt(val) || 0; // Handle if it's a number string or raw number
                                            // Mapping keys to human readable
                                            const label = key.replace(/([A-Z])/g, ' $1').trim();
                                            return (
                                                <div key={key} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'capitalize', fontWeight: 600 }}>{label}</span>
                                                        <span style={{ fontWeight: 800, color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444', fontSize: '1.1rem' }}>{score}%</span>
                                                    </div>
                                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${score}%`,
                                                            height: '100%',
                                                            background: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
                                                            borderRadius: '4px',
                                                            transition: 'width 1s ease-out'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Feedback / Explanation */}
                            {result.aiExplanation && (
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h4 style={{ color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <BookOpen size={20} color="#8b5cf6" /> Detailed AI Analysis
                                    </h4>
                                    <div style={{
                                        background: '#1e293b',
                                        padding: '1.75rem',
                                        borderRadius: '1rem',
                                        border: '1px solid #334155',
                                        color: '#cbd5e1',
                                        fontSize: '1rem',
                                        lineHeight: '1.8',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace' // Or a clean sans-serif if pre-wrap works well
                                    }}>
                                        {result.aiExplanation}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button onClick={handleExit} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    Close Session
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Console: Input / Output / Test Cases - Hide for SQL */}
                    {!result && selectedLang !== 'SQL' && (
                        <div style={{ flex: terminalSize === 'maximized' ? '0 0 560px' : terminalSize === 'minimized' ? '0 0 36px' : '0 0 360px', background: '#020617', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', transition: 'flex-basis 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                            {/* Tab Switcher */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#0f172a', alignItems: 'center' }}>
                                {['input', 'output', 'tests'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveOutputTab(tab); if (terminalSize === 'minimized') setTerminalSize('normal'); }}
                                        style={{
                                            padding: '0.75rem 1.25rem',
                                            background: activeOutputTab === tab ? '#1e293b' : 'transparent',
                                            border: 'none',
                                            borderBottom: activeOutputTab === tab ? `2px solid ${tab === 'input' ? '#f59e0b' : tab === 'output' ? '#3b82f6' : '#10b981'}` : '2px solid transparent',
                                            color: activeOutputTab === tab ? (tab === 'input' ? '#fbbf24' : tab === 'output' ? '#60a5fa' : '#4ade80') : '#64748b',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {tab === 'input' && <><FileText size={14} /> Custom Input</>}
                                        {tab === 'output' && <><Code size={14} /> Output {output.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#3b82f6' }}></span>}</>}
                                        {tab === 'tests' && <><CheckCircle size={14} /> Test Cases
                                            {testResults && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: testResults.passed === testResults.total ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                                    color: testResults.passed === testResults.total ? '#10b981' : '#f97316'
                                                }}>
                                                    {testResults.passed}/{testResults.total}
                                                </span>
                                            )}
                                        </>}
                                    </button>
                                ))}
                                {/* Always-visible resize controls */}
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
                                    <button onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} title={terminalSize === 'minimized' ? 'Restore' : 'Minimize'} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: terminalSize === 'minimized' ? '#60a5fa' : '#475569', fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'minimized' ? '▲' : '─'}</button>
                                    <button onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} title={terminalSize === 'maximized' ? 'Restore' : 'Maximize'} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: terminalSize === 'maximized' ? '#60a5fa' : '#475569', fontSize: '0.8rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                                </div>
                            </div>

                            {/* Custom Input Tab */}
                            {activeOutputTab === 'input' && (
                                <div style={{ padding: '0.75rem', flex: 1 }}>
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        placeholder={`Enter your input here (stdin)...\nExample:\n5\n1 2 3 4 5`}
                                        style={{
                                            width: '100%',
                                            minHeight: '120px',
                                            background: '#0f172a',
                                            color: '#e2e8f0',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '0.75rem',
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem',
                                            resize: 'vertical',
                                            outline: 'none'
                                        }}
                                    />
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                                        💡 This input will be passed as stdin when you click "Run Code"
                                    </div>
                                </div>
                            )}

                            {/* Console Output Tab */}
                            {activeOutputTab === 'output' && (
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#090d18', borderTop: '1px solid #1e3a5f' }}>

                                    {/* Terminal header bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: '#0d1929', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <div title="Minimize" onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }} />
                                                <div title="Restore" onClick={() => setTerminalSize('normal')} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }} />
                                                <div title="Maximize" onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.85, cursor: 'pointer', transition: 'opacity 0.15s' }} />
                                            </div>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', fontFamily: 'ui-monospace,monospace' }}>TERMINAL</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {status === 'running' && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '4px', padding: '2px 8px' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'blink 1s step-end infinite' }} />
                                                    RUNNING
                                                </span>
                                            )}
                                            {status !== 'running' && output.length > 0 && (
                                                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: runResult ? (runResult.passed ? '#4ade80' : '#f87171') : '#64748b' }}>
                                                    {runResult ? (runResult.passed ? '✅ Accepted' : '❌ Wrong Answer') : '● Finished'}
                                                </span>
                                            )}
                                            {status === 'running' && (
                                                <button onClick={stopRun} title="Kill process" style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#f87171', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>■ Stop</button>
                                            )}
                                            <button onClick={() => setTerminalSize(s => s === 'minimized' ? 'normal' : 'minimized')} title={terminalSize === 'minimized' ? 'Restore' : 'Minimize'} style={{ padding: '1px 7px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#475569', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1 }}>─</button>
                                            <button onClick={() => setTerminalSize(s => s === 'maximized' ? 'normal' : 'maximized')} title={terminalSize === 'maximized' ? 'Restore' : 'Maximize'} style={{ padding: '1px 7px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#475569', fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1 }}>{terminalSize === 'maximized' ? '⊡' : '⊞'}</button>
                                        </div>
                                    </div>

                                    {/* Scrollable output area */}
                                    <div ref={terminalRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'ui-monospace,SFMono-Regular,Consolas,monospace', fontSize: '0.84rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '80px' }}>
                                        {output.length > 0
                                            ? output.map((seg, i) => (
                                                <span key={i} style={{ color: seg.type === 'stdin' ? '#4ade80' : seg.type === 'stderr' ? '#fca5a5' : seg.type === 'info' ? '#475569' : '#e2e8f0' }}>{seg.text}</span>
                                            ))
                                            : <span style={{ color: '#334155', fontStyle: 'italic' }}>▶ Click "Run Code" to execute your program…</span>
                                        }
                                        {status === 'running' && <span style={{ display: 'inline-block', width: '8px', height: '1em', background: '#4ade80', marginLeft: '1px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
                                    </div>

                                    {/* Verdict block — shown after process exits */}
                                    {status !== 'running' && output.length > 0 && (
                                        <div style={{ flexShrink: 0, padding: '3px 16px 5px', fontSize: '0.7rem', color: '#334155' }}>
                                            <span style={{ color: '#4ade80' }}>█</span> = your input&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>█</span> = stderr&nbsp;&nbsp;<span style={{ color: '#475569' }}>█</span> = compiler
                                        </div>
                                    )}
                                    {status !== 'running' && runResult && (
                                        <div style={{ flexShrink: 0, margin: '0 12px 10px', padding: '10px 14px', borderRadius: '8px', background: runResult.passed ? 'rgba(16,185,129,0.09)' : 'rgba(239,68,68,0.09)', border: `1px solid ${runResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: runResult.passed ? 0 : '8px' }}>
                                                <span style={{ fontSize: '1rem' }}>{runResult.passed ? '✅' : '❌'}</span>
                                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: runResult.passed ? '#4ade80' : '#f87171' }}>
                                                    {runResult.passed ? 'Accepted — Output matches expected!' : 'Wrong Answer — Output does not match'}
                                                </span>
                                            </div>
                                            {!runResult.passed && (
                                                <div style={{ paddingLeft: '28px' }}>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>Expected output:</div>
                                                    <pre style={{ margin: 0, padding: '8px 12px', background: '#0d1929', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#34d399', fontSize: '0.78rem', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace,monospace' }}>{runResult.expected}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Interactive stdin bar — activates green when running */}
                                    <div style={{ flexShrink: 0, borderTop: `2px solid ${status === 'running' ? '#16a34a' : '#1e293b'}`, background: status === 'running' ? '#051210' : '#0a0f1a', transition: 'border-color 0.2s, background 0.2s' }}>
                                        {status === 'running' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px', gap: '8px' }}>
                                                <span style={{ color: '#4ade80', fontSize: '0.9rem', fontFamily: 'ui-monospace,monospace', fontWeight: 700, userSelect: 'none', flexShrink: 0 }}>$</span>
                                                <input
                                                    type="text"
                                                    value={interactiveStdin}
                                                    onChange={e => setInteractiveStdin(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') sendInteractiveStdin() }}
                                                    placeholder="Type your input here and press Enter…"
                                                    autoFocus
                                                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.88rem', fontFamily: 'ui-monospace,SFMono-Regular,monospace', caretColor: '#4ade80' }}
                                                />
                                                <button
                                                    onClick={sendInteractiveStdin}
                                                    style={{ flexShrink: 0, padding: '6px 16px', background: '#16a34a', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}>
                                                    ↵ Send
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: '36px', gap: '8px' }}>
                                                <span style={{ color: '#1e3a5f', fontSize: '0.72rem', fontFamily: 'ui-monospace,monospace' }}>$</span>
                                                <span style={{ color: '#334155', fontSize: '0.75rem', fontStyle: 'italic' }}>{output.length > 0 ? 'Process finished. Run code again to restart.' : 'Stdin will appear here when your program requests input'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Test Cases Tab */}
                            {activeOutputTab === 'tests' && (
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                    <CodeOutputPreview
                                        problemId={problem.id}
                                        code={code}
                                        language={selectedLang}
                                        showRunButton={true}
                                        onRunComplete={(results) => {
                                            if (results?.testResults) {
                                                setTestResults({
                                                    passed: results.testResults.filter(r => r.passed).length,
                                                    total: results.testResults.length
                                                })
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* SQL Tools Suite for SQL problems */}
                    {(problem.type === 'SQL' || problem.language === 'SQL') && !result && (
                        <div style={{ borderTop: '1px solid #334155', padding: '1.25rem', background: '#0f172a' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', padding: '4px', background: '#020617', borderRadius: '10px', width: 'fit-content' }}>
                                <button
                                    onClick={() => setSqlTool('validator')}
                                    style={{
                                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: sqlTool === 'validator' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        color: sqlTool === 'validator' ? '#60a5fa' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Shield size={16} /> Validator
                                </button>
                                <button
                                    onClick={() => setSqlTool('visualizer')}
                                    style={{
                                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: sqlTool === 'visualizer' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                        color: sqlTool === 'visualizer' ? '#a78bfa' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Database size={16} /> ER Diagram
                                </button>
                                <button
                                    onClick={() => setSqlTool('debugger')}
                                    style={{
                                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: sqlTool === 'debugger' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                        color: sqlTool === 'debugger' ? '#4ade80' : '#64748b',
                                        fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <Layers size={16} /> Debugger
                                </button>
                            </div>

                            <div className="sql-tool-container animate-fadeIn">
                                {sqlTool === 'validator' && (
                                    <SQLValidator
                                        query={code}
                                        onQueryChange={setCode}
                                        schemaContext={problem.sqlSchema}
                                    />
                                )}
                                {sqlTool === 'visualizer' && (
                                    <SQLVisualizer schema={problem.sqlSchema} />
                                )}
                                {sqlTool === 'debugger' && (
                                    <SQLDebugger query={code} schema={problem.sqlSchema} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}

// ==================== SUBMISSIONS WITH REPORT & DELETE ====================
function Submissions({ user }) {
    const [submissions, setSubmissions] = useState([])
    const [mlTaskSubmissions, setMlTaskSubmissions] = useState([])
    const [aptitudeSubmissions, setAptitudeSubmissions] = useState([])
    const [globalSubmissions, setGlobalSubmissions] = useState([])
    const [crtSubmissions, setCrtSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewReport, setViewReport] = useState(null)
    const [viewMLReport, setViewMLReport] = useState(null)
    const [activeTab, setActiveTab] = useState('all')
    const [viewAptitudeResult, setViewAptitudeResult] = useState(null)
    const [viewGlobalReport, setViewGlobalReport] = useState(null)
    const [viewCRTReport, setViewCRTReport] = useState(null)
    const [crtReportData, setCrtReportData] = useState(null)
    const [crtReportLoading, setCrtReportLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchSubmissions = () => {
        setLoading(true)
        Promise.all([
            axios.get(`${API_BASE}/submissions?studentId=${user.id}&limit=5000`),
            axios.get(`${API_BASE}/aptitude-submissions?studentId=${user.id}`),
            axios.get(`${API_BASE}/global-test-submissions?studentId=${user.id}`),
            axios.get(`${API_BASE}/crt/student/history?studentId=${user.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }).catch(() => ({ data: [] }))
        ]).then(([codeRes, aptRes, globalRes, crtRes]) => {
            const codeData = Array.isArray(codeRes.data) ? codeRes.data : (codeRes.data?.data || [])
            const mlTasks = codeData.filter(s => s.isMLTask).map(s => ({ ...s, subType: 'ml-task' }))
            const codeSubs = codeData.filter(s => !s.isMLTask).map(s => ({ ...s, subType: 'code' }))
            setSubmissions(codeSubs)
            setMlTaskSubmissions(mlTasks)
            setAptitudeSubmissions((aptRes.data || []).map(s => ({ ...s, subType: 'aptitude', itemTitle: s.testTitle })))
            setGlobalSubmissions((globalRes.data || []).map(s => ({
                ...s,
                subType: 'global',
                itemTitle: s.testTitle,
                score: s.overallPercentage
            })))
            const crtData = Array.isArray(crtRes.data) ? crtRes.data : []
            setCrtSubmissions(crtData.filter(a => a.status === 'completed').map(a => ({
                ...a,
                subType: 'crt',
                itemTitle: a.title || 'Round Test',
                language: 'Round Test',
                score: Math.round(a.overall_score || 0),
                status: (a.overall_score || 0) >= (a.pass_percentage || 60) ? 'Passed' : 'Failed',
                submittedAt: a.completed_at || a.started_at
            })))
            setLoading(false)
        }).catch(err => {
            console.error('Fetch submissions error:', err)
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchSubmissions()
    }, [user.id])

    const handleDelete = async (sub) => {
        if (window.confirm('Are you sure you want to delete this submission?')) {
            try {
                const endpoint = sub.subType === 'global'
                    ? `${API_BASE}/global-test-submissions/${sub.id}`
                    : `${API_BASE}/submissions/${sub.id}`;
                await axios.delete(endpoint)
                fetchSubmissions()
            } catch (error) {
                alert('Error deleting submission')
            }
        }
    }

    const allSubmissions = [...submissions, ...mlTaskSubmissions, ...aptitudeSubmissions, ...globalSubmissions, ...crtSubmissions]
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    const handleViewCRTReport = async (sub) => {
        setViewCRTReport(sub)
        setCrtReportLoading(true)
        try {
            const { data } = await axios.get(`${API_BASE}/crt/attempt/${sub.id}/report`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
            setCrtReportData(data)
        } catch (err) {
            console.error('CRT report error:', err)
            setCrtReportData(null)
        }
        setCrtReportLoading(false)
    }

    const getFilteredSubmissions = () => {
        let filtered = activeTab === 'all'
            ? allSubmissions
            : activeTab === 'code'
                ? submissions
                : activeTab === 'ml-task'
                    ? mlTaskSubmissions
                    : activeTab === 'aptitude'
                        ? aptitudeSubmissions
                        : activeTab === 'crt'
                            ? crtSubmissions
                            : globalSubmissions

        return filtered.filter(s =>
            (s.itemTitle || s.testTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.status.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }

    const filteredSubmissions = getFilteredSubmissions()

    if (loading) return <div className="loading-spinner"></div>

    return (
        <>
            {/* Header with Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'all' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.1)',
                            border: activeTab === 'all' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'all' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >All ({allSubmissions.length})</button>
                    <button
                        onClick={() => setActiveTab('code')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'code' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.1)',
                            border: activeTab === 'code' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'code' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >💻 Code ({submissions.length})</button>
                    <button
                        onClick={() => setActiveTab('ml-task')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'ml-task' ? '#06b6d4' : 'rgba(6, 182, 212, 0.1)',
                            border: activeTab === 'ml-task' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'ml-task' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >🧠 ML Tasks ({mlTaskSubmissions.length})</button>
                    <button
                        onClick={() => setActiveTab('aptitude')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'aptitude' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)',
                            border: activeTab === 'aptitude' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'aptitude' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >📝 Aptitude ({aptitudeSubmissions.length})</button>
                    <button
                        onClick={() => setActiveTab('global')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'global' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                            border: activeTab === 'global' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'global' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >🌐 Global ({globalSubmissions.length})</button>
                    <button
                        onClick={() => setActiveTab('crt')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeTab === 'crt' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                            border: activeTab === 'crt' ? 'none' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: activeTab === 'crt' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >🏢 Round ({crtSubmissions.length})</button>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search problem or status..."
                        style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', width: '250px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container animate-slideUp card glass">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Problem / Test</th>
                            <th>Language</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Submitted At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubmissions.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No submissions found</td></tr>
                        ) : (
                            filteredSubmissions.map(sub => (
                                <tr key={sub.id}>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: sub.subType === 'ml-task' ? 'rgba(6, 182, 212, 0.1)' : sub.subType === 'aptitude' ? 'rgba(139, 92, 246, 0.1)' : sub.subType === 'crt' ? 'rgba(245, 158, 11, 0.1)' : 'var(--primary-alpha)',
                                            color: sub.subType === 'ml-task' ? '#06b6d4' : sub.subType === 'aptitude' ? '#8b5cf6' : sub.subType === 'crt' ? '#f59e0b' : 'var(--primary)'
                                        }}>
                                            {sub.subType === 'ml-task' ? '🧠 ML Task' : sub.subType === 'aptitude' ? '📝 Aptitude' : sub.subType === 'global' ? '🌐 Global' : sub.subType === 'crt' ? '🏢 Round Test' : '💻 Code'}
                                        </span>
                                    </td>
                                    <td><div style={{ color: 'var(--primary)', fontWeight: 500 }}>{sub.itemTitle || sub.testTitle}</div></td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                                            {sub.subType === 'aptitude' ? 'N/A' : sub.subType === 'global' ? 'Mixed' : sub.subType === 'crt' ? 'Round Test' : (sub.language?.toUpperCase() || 'N/A')}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{sub.score}%</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                                            <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                                            {sub.plagiarism?.detected && (
                                                <span className="status-badge plagiarized" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <AlertTriangle size={11} /> Plag
                                                </span>
                                            )}
                                            {(sub.integrity?.integrityViolation || sub.tabSwitches > 0) && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#f59e0b',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    <AlertTriangle size={10} /> {sub.integrity?.tabSwitches || sub.tabSwitches || 0} Tab
                                                </span>
                                            )}
                                            {sub.cameraBlockedCount > 0 && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    📷 {sub.cameraBlockedCount} Cam
                                                </span>
                                            )}
                                            {sub.phoneDetectionCount > 0 && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    📱 {sub.phoneDetectionCount} Phone
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(sub.submittedAt).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {sub.subType === 'aptitude' ? (
                                                <button onClick={() => setViewAptitudeResult(sub)} style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', color: '#8b5cf6', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> Results</button>
                                            ) : sub.subType === 'global' ? (
                                                <>
                                                    <button onClick={() => setViewGlobalReport(sub.id)} style={{ background: 'var(--primary-alpha)', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> Full Report</button>
                                                    <button onClick={() => handleDelete(sub)} style={{ background: 'var(--danger-alpha)', border: 'none', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Trash2 size={14} /></button>
                                                </>
                                            ) : sub.subType === 'ml-task' ? (
                                                <>
                                                    <button onClick={() => setViewMLReport(sub)} style={{ background: 'rgba(6, 182, 212, 0.1)', border: 'none', color: '#06b6d4', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> ML Report</button>
                                                    <button onClick={() => handleDelete(sub)} style={{ background: 'var(--danger-alpha)', border: 'none', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Trash2 size={14} /></button>
                                                </>
                                            ) : sub.subType === 'crt' ? (
                                                <button onClick={() => handleViewCRTReport(sub)} style={{ background: 'rgba(245, 158, 11, 0.1)', border: 'none', color: '#f59e0b', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> Report</button>
                                            ) : (
                                                <>
                                                    <button onClick={() => setViewReport(sub)} style={{ background: 'var(--primary-alpha)', border: 'none', color: 'var(--primary)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> Report</button>
                                                    <button onClick={() => handleDelete(sub)} style={{ background: 'var(--danger-alpha)', border: 'none', color: 'var(--danger)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {viewReport && <SubmissionReportModal submission={viewReport} user={user} onClose={() => setViewReport(null)} />}

            {/* ML Task Report Modal */}
            {viewMLReport && <MLTaskReportModal submission={viewMLReport} onClose={() => setViewMLReport(null)} />}

            {/* Aptitude Results Modal */}
            {viewAptitudeResult && (
                <AptitudeReportModal
                    submission={viewAptitudeResult}
                    onClose={() => setViewAptitudeResult(null)}
                    isStudentView={true}
                />
            )}

            {viewGlobalReport && (
                <GlobalReportModal
                    submissionId={viewGlobalReport}
                    onClose={() => setViewGlobalReport(null)}
                    isStudentView={true}
                />
            )}

            {/* CRT Report Modal */}
            {viewCRTReport && (
                <CRTReportModal
                    submission={viewCRTReport}
                    reportData={crtReportData}
                    loading={crtReportLoading}
                    onClose={() => { setViewCRTReport(null); setCrtReportData(null); }}
                />
            )}
        </>
    )
}

// ==================== CRT REPORT MODAL ====================
function CRTReportModal({ submission, reportData, loading, onClose }) {
    const SECTION_DEFS = {
        aptitude: { label: 'Aptitude', icon: '🧮', color: '#f59e0b' },
        verbal: { label: 'Verbal', icon: '📝', color: '#06b6d4' },
        logical: { label: 'Logical', icon: '🧠', color: '#8b5cf6' },
        reasoning: { label: 'Reasoning', icon: '🔍', color: '#ec4899' },
        technical_mcq: { label: 'Technical MCQ', icon: '💻', color: '#3b82f6' },
        pseudocode: { label: 'Pseudo Code', icon: '📋', color: '#10b981' },
        debug: { label: 'Debugging', icon: '🐛', color: '#ef4444' },
        coding: { label: 'Coding', icon: '⌨️', color: '#6366f1' },
        sql: { label: 'SQL', icon: '🗄️', color: '#14b8a6' },
    }

    const attempt = reportData?.attempt
    const answers = reportData?.answers || []
    const sections = attempt?.sections || []
    const sectionScores = attempt?.section_scores || {}
    const overallScore = attempt?.overall_score || submission?.score || 0
    const passPercentage = attempt?.pass_percentage || submission?.pass_percentage || 60
    const passed = overallScore >= passPercentage

    // Group answers by section
    const answersBySection = {}
    answers.forEach(a => {
        if (!answersBySection[a.section]) answersBySection[a.section] = []
        answersBySection[a.section].push(a)
    })

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header" style={{ background: passed ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(251,146,60,0.1))' }}>
                    <div className="modal-title-with-icon">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: passed ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {passed ? <CheckCircle size={20} color="white" /> : <XCircle size={20} color="white" />}
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 600 }}>Round Test Report</span>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{attempt?.title || submission?.itemTitle || 'Round Test'}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close"><XCircle size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                            Loading report...
                        </div>
                    ) : !reportData ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            {/* Fallback: show basic info from the submission itself */}
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                <div style={{ padding: '1.25rem 2rem', background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '16px', border: `2px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center', minWidth: 140 }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: passed ? '#10b981' : '#ef4444', lineHeight: 1 }}>{Math.round(overallScore)}%</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Overall Score</div>
                                </div>
                                <div style={{ padding: '1.25rem 2rem', background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '16px', border: `1px solid ${passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, textAlign: 'center', minWidth: 140 }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: passed ? '#4ade80' : '#f87171', lineHeight: 1 }}>{passed ? '✅ PASSED' : '❌ FAILED'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Pass mark: {passPercentage}%</div>
                                </div>
                            </div>
                            {/* Show section scores from submission if available */}
                            {submission?.section_scores && Object.keys(submission.section_scores).length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
                                    {Object.entries(submission.section_scores).map(([sec, data]) => {
                                        const def = SECTION_DEFS[sec]
                                        const pct = Math.round(data?.score || 0)
                                        const scoreColor = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                                        return (
                                            <div key={sec} style={{ padding: '0.9rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', marginBottom: 3 }}>{def?.icon || '📊'}</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, textTransform: 'capitalize' }}>{def?.label || sec}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{data?.correct || 0}/{data?.total || 0} correct</div>
                                                <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.8s ease' }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Company & Test info */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Company</span>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{attempt?.company_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty</span>
                                    <div style={{ fontWeight: 500 }}>{attempt?.difficulty || 'N/A'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</span>
                                    <div style={{ fontWeight: 500 }}>{attempt?.completed_at ? new Date(attempt.completed_at).toLocaleString() : 'N/A'}</div>
                                </div>
                            </div>

                            {/* Score Cards */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <div style={{ padding: '1.25rem 2rem', background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '16px', border: `2px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, textAlign: 'center', minWidth: 150 }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: passed ? '#10b981' : '#ef4444', lineHeight: 1 }}>{Math.round(overallScore)}%</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Overall Score</div>
                                </div>
                                <div style={{ padding: '1.25rem 2rem', background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '16px', border: `1px solid ${passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, textAlign: 'center', minWidth: 150 }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: passed ? '#4ade80' : '#f87171', lineHeight: 1 }}>{passed ? '✅ PASSED' : '❌ FAILED'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Pass mark: {passPercentage}%</div>
                                </div>
                            </div>

                            {/* Section-wise Performance */}
                            {sections.length > 0 && (
                                <>
                                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BarChart2 size={17} color="#8b5cf6" /> Section-wise Performance
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
                                        {sections.map(sec => {
                                            const def = SECTION_DEFS[sec]
                                            const ss = sectionScores[sec] || {}
                                            const pct = Math.round(ss.score || 0)
                                            const scoreColor = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
                                            return (
                                                <div key={sec} style={{ padding: '0.9rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', marginBottom: 3 }}>{def?.icon || '📊'}</div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, textTransform: 'capitalize' }}>{def?.label || sec}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{ss.correct || 0}/{ss.total || 0} correct</div>
                                                    <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.8s ease' }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Detailed Answers */}
                            {sections.map(sec => {
                                const secAnswers = answersBySection[sec] || []
                                if (secAnswers.length === 0) return null
                                const def = SECTION_DEFS[sec]
                                return (
                                    <div key={sec} style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: def?.color || 'var(--text-primary)' }}>
                                            {def?.icon} {def?.label || sec}
                                        </h4>
                                        {secAnswers.map((ans, idx) => (
                                            <div key={ans.id || idx} style={{ marginBottom: '0.6rem', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)', border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{ans.is_correct ? '✅' : '❌'}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.5 }}>Q{idx + 1}: {ans.question}</div>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, flexShrink: 0,
                                                        background: ans.is_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                        color: ans.is_correct ? '#10b981' : '#ef4444'
                                                    }}>{Math.round(ans.score || 0)}%</span>
                                                </div>
                                                {ans.question_type === 'mcq' && (
                                                    <div style={{ marginLeft: '26px', fontSize: '0.8rem' }}>
                                                        <div style={{ color: ans.is_correct ? '#4ade80' : '#f87171' }}>
                                                            Your answer: <strong>{ans.student_answer || 'Not answered'}</strong>
                                                        </div>
                                                        {!ans.is_correct && (
                                                            <div style={{ color: '#4ade80', marginTop: '2px' }}>
                                                                Correct answer: <strong>{ans.correct_answer}</strong>
                                                            </div>
                                                        )}
                                                        {ans.explanation && (
                                                            <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                                                💡 {ans.explanation}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {(ans.question_type === 'code' || ans.question_type === 'sql') && ans.execution_result && (
                                                    <div style={{ marginLeft: '26px', fontSize: '0.78rem', marginTop: '4px' }}>
                                                        {ans.execution_result.passedCases !== undefined && (
                                                            <span style={{ color: ans.is_correct ? '#4ade80' : '#f59e0b' }}>
                                                                Test cases: {ans.execution_result.passedCases}/{ans.execution_result.totalCases} passed
                                                            </span>
                                                        )}
                                                        {ans.execution_result.output && (
                                                            <div style={{ marginTop: '4px', padding: '6px 10px', background: '#0f172a', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', maxHeight: '100px', overflow: 'auto' }}>
                                                                {ans.execution_result.output}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}

                            {/* Proctoring Violations */}
                            {attempt?.proctoring_violations && attempt.proctoring_violations.length > 0 && (
                                <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertTriangle size={13} /> {attempt.proctoring_violations.length} Proctoring Violation{attempt.proctoring_violations.length > 1 ? 's' : ''} Recorded
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {attempt.proctoring_violations.map((v, i) => (
                                            <span key={i} style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                                                {v.type || v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
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

