import { useState, useEffect, useRef, useMemo } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, Award, List, Search, Send, Activity, CheckCircle, Check, TrendingUp, Clock, Globe, FileCode, Plus, X, Code, ChevronRight, Upload, AlertTriangle, Zap, Target, Sparkles, Bot, Wand2, Eye, FileText, BarChart2, RefreshCw, Calendar, HelpCircle, Trash2, Save, Brain, XCircle, Shield, Download, ClipboardList, Settings, Database, MessageSquare, Github, ExternalLink, BarChart3, Video, Building2, Filter, ChevronDown, Hash, Percent, ArrowUpDown, Link2, Layers, Mic, FlaskConical } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import { AIChatbot, AIFloatingButton } from '../components/AIChatbot'
import AptitudeReportModal from '../components/AptitudeReportModal'
import StudentReportModal from '../components/StudentReportModal'
import TestCasesManager from '../components/TestCasesManager'
import LocalTestCasesManager from '../components/LocalTestCasesManager'
import AdminLiveMonitoring from '../components/AdminLiveMonitoring'
import AdminOperations from '../components/AdminOperations'
import UserManagement from '../components/UserManagement'
import FileUpload from '../components/FileUpload'
import SkillTestManager from '../components/SkillTestManager'
import SkillSubmissions from '../components/SkillSubmissions'
import AdminPlagiarismDashboard from '../components/AdminPlagiarismDashboard'
import ExportReports from '../components/ExportReports'
import CodeReviewPanel from '../components/CodeReviewPanel'
import { MentorAIReviewDashboard } from '../components/AICodeReview'
// New Features
import AdminResourceLinks from '../components/AdminResourceLinks'
import AdminMCQ from '../components/AdminMCQ'
import WebhookManager from '../components/WebhookManager'
import { AdminCertificateManager } from '../components/CertificatePortal'
import { CompanyTestManager } from '../components/CompanyFeatures'
import CompanyRoundManager from '../components/CompanyRoundManager'
import AdminCommTest from '../components/AdminCommTest'
import AdminFrontendEval from '../components/AdminFrontendEval'
import BatchManager from '../components/BatchManager'
import AdminLabExercise from '../components/AdminLabExercise'
import { useAuth } from '../App'
import { useI18n } from '../services/i18n.jsx'
import axios from 'axios'
import GlobalReportModal from '../components/GlobalReportModal'
import './Portal.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']


function AdminPortal() {
    const auth = useAuth()
    const user = auth?.user || null
    const { t } = useI18n()
    const location = useLocation()
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')

    useEffect(() => {
        const path = location.pathname.split('/').pop()
        switch (path) {
            case 'allocations':
                setTitle(t('allocations'))
                setSubtitle(t('mentor_student_assignments'))
                break
            case 'student-leaderboard':
                setTitle(t('student_leaderboard'))
                setSubtitle(t('top_performers'))
                break
            case 'mentor-leaderboard':
                setTitle(t('mentor_leaderboard'))
                setSubtitle(t('mentor_activity'))
                break
            case 'all-submissions':
                setTitle(t('all_submissions'))
                setSubtitle(t('platform_wide_submissions'))
                break
            case 'global-tasks':
                setTitle(t('global_tasks'))
                setSubtitle(t('tasks_visible_all'))
                break
            case 'global-problems':
                setTitle(t('global_problems'))
                setSubtitle(t('coding_challenges_all'))
                break
            case 'aptitude-tests':
                setTitle(t('aptitude_tests'))
                setSubtitle(t('manage_aptitude_tests'))
                break
            case 'global-tests':
                setTitle(t('global_complete_tests'))
                setSubtitle(t('global_tests_subtitle'))
                break
            case 'live-monitoring':
                setTitle(t('global_live_monitoring'))
                setSubtitle(t('monitor_all_subtitle'))
                break
            case 'operations':
                setTitle(t('admin_operations'))
                setSubtitle(t('admin_ops_subtitle'))
                break
            case 'user-management':
                setTitle('User Management')
                setSubtitle('Create, edit, and manage platform users')
                break
            case 'login-activity':
            case 'messaging':
                setTitle('Login Activity')
                setSubtitle('Track student logins, logouts, tests attended, and time spent')
                break
            case 'analytics':
                setTitle(t('analytics'))
                setSubtitle(t('advanced_analytics_subtitle'))
                break
            case 'plagiarism':
                setTitle('Plagiarism Dashboard')
                setSubtitle('Monitor and review plagiarism detection reports')
                break
            case 'code-reviews':
                setTitle('Code Reviews')
                setSubtitle('View all code review comments across the platform')
                break
            case 'reports':
                setTitle('Export Reports')
                setSubtitle('Generate and download platform-wide reports')
                break
            case 'skill-tests':
                setTitle('Skill Tests')
                setSubtitle('Create and manage AI skill assessments')
                break
            case 'skill-submissions':
                setTitle('Skill Test Submissions')
                setSubtitle('View all student skill test results')
                break
            case 'company-tests':
                setTitle('Company Tests')
                setSubtitle('Manage company-specific technical interviews')
                break
            case 'company-round-tests':
                setTitle('Company Round Tests')
                setSubtitle('First round multi-section assessments')
                break
            case 'resource-links':
                setTitle('Resource Links')
                setSubtitle('Share curated links and resources with students')
                break
            case 'mcq':
                setTitle('MCQ Manager')
                setSubtitle('Create and manage MCQ tests with AI evaluation')
                break
            case 'comm-test':
                setTitle('Communication Test')
                setSubtitle('Manage content, view student reports & analytics')
                break
            case 'frontend-evals':
                setTitle('Frontend Evaluation')
                setSubtitle('Create frontend use cases and assign them to students')
                break
            case 'frontend-submissions':
                setTitle('Frontend Submissions')
                setSubtitle('Review uploaded frontend projects and AI reports')
                break
            case 'batch-add':
                setTitle('Batch Manager')
                setSubtitle('Create and manage student batches from CSV uploads')
                break
            case 'lab-exercises':
                setTitle('Lab Exercises')
                setSubtitle('Create and manage programming, ML, SQL and other coding labs')
                break
            case 'lab-submissions':
                setTitle('Lab Submissions')
                setSubtitle('Review student lab exercise submissions and AI evaluation reports')
                break
            default:
                setTitle(t('dashboard'))
                setSubtitle(t('system_administration'))
        }
    }, [location, t])

    const navItems = [
        { path: '/admin', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
        {
            label: 'Content Management',
            icon: <FileCode size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/admin/global-tasks', label: t('global_tasks'), icon: <Globe size={20} /> },
                { path: '/admin/global-problems', label: t('global_problems'), icon: <FileCode size={20} /> },
                { path: '/admin/aptitude-tests', label: t('aptitude_tests'), icon: <Target size={20} /> },
                { path: '/admin/global-tests', label: t('global_complete_tests'), icon: <ClipboardList size={20} /> },
                { path: '/admin/skill-tests', label: 'Skill Tests', icon: <Brain size={20} /> },
                { path: '/admin/company-tests', label: 'Company Tests', icon: <Building2 size={20} /> },
                { path: '/admin/company-round-tests', label: 'Round Tests', icon: <Target size={20} /> },
                { path: '/admin/resource-links', label: 'Resource Links', icon: <Link2 size={20} /> },
                { path: '/admin/mcq', label: 'MCQ Manager', icon: <Brain size={20} /> },
                { path: '/admin/comm-test', label: 'Comm Test', icon: <Mic size={20} /> },
                { path: '/admin/frontend-evals', label: 'Frontend Eval', icon: <Code size={20} /> }
            ]
        },
        { path: '/admin/lab-exercises', label: 'Lab Exercises', icon: <FlaskConical size={20} /> },
        {
            label: 'Allocations',
            icon: <Users size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/admin/allocations', label: t('allocations'), icon: <Users size={20} /> }
            ]
        },
        {
            label: 'Monitoring',
            icon: <Activity size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/admin/all-submissions', label: t('all_submissions'), icon: <List size={20} /> },
                { path: '/admin/skill-submissions', label: 'Skill Submissions', icon: <Brain size={20} /> },
                { path: '/admin/frontend-submissions', label: 'Frontend Submissions', icon: <Code size={20} /> },
                { path: '/admin/live-monitoring', label: t('live_monitoring'), icon: <Activity size={20} /> },
                { path: '/admin/analytics', label: t('analytics'), icon: <TrendingUp size={20} /> },
                { path: '/admin/plagiarism', label: 'Plagiarism Dashboard', icon: <Shield size={20} /> },
                { path: '/admin/code-reviews', label: 'Code Reviews', icon: <Github size={20} /> },
                { path: '/admin/ai-reviews', label: 'AI Code Reviews', icon: <Bot size={20} /> }
            ]
        },
        {
            label: 'System',
            icon: <Settings size={20} />,
            defaultExpanded: false,
            children: [
                { path: '/admin/operations', label: t('admin_operations'), icon: <Settings size={20} /> },
                { path: '/admin/user-management', label: 'User Management', icon: <Shield size={20} /> },
                { path: '/admin/login-activity', label: 'Login Activity', icon: <ClipboardList size={20} /> },
                { path: '/admin/batch-add', label: 'Batch Add', icon: <Database size={20} /> },
                { path: '/admin/certificates', label: 'Issue Certificates', icon: <Award size={20} /> },
                { path: '/admin/webhooks', label: 'Webhook Manager', icon: <Zap size={20} /> },
                { path: '/admin/reports', label: 'Export Reports', icon: <Download size={20} /> }
            ]
        },
        { path: '/connect-alumni', label: 'Connect Alumni', icon: <Users size={20} />, highlight: true, external: true }
    ]

    return (
        <DashboardLayout navItems={navItems} title={title} subtitle={subtitle}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/global-tasks" element={<GlobalTasks />} />
                <Route path="/global-problems" element={<GlobalProblems />} />
                <Route path="/aptitude-tests" element={<AptitudeTestsAdmin />} />
                <Route path="/global-tests" element={<GlobalTestsAdmin />} />
                <Route path="/skill-tests" element={<SkillTestManager />} />
                <Route path="/skill-submissions" element={<SkillSubmissions user={user} isAdmin={true} />} />
                <Route path="/allocations" element={<Allocations />} />

                <Route path="/all-submissions" element={<AllSubmissions />} />
                <Route path="/live-monitoring" element={<AdminLiveMonitoring user={user} />} />
                <Route path="/analytics" element={<AdminAnalyticsDashboard />} />
                <Route path="/operations" element={<AdminOperations />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/login-activity" element={<AdminLoginActivity />} />
                <Route path="/messaging" element={<AdminLoginActivity />} />
                <Route path="/webhooks" element={<WebhookManager />} />
                <Route path="/certificates" element={<AdminCertificateManager />} />
                <Route path="/plagiarism" element={<AdminPlagiarismDashboard adminId={user?.id} adminName={user?.name} />} />
                <Route path="/code-reviews" element={<AdminCodeReviews />} />
                <Route path="/ai-reviews" element={<MentorAIReviewDashboard user={user} />} />
                <Route path="/reports" element={<ExportReports />} />
                <Route path="/company-tests" element={<CompanyTestManager />} />
                <Route path="/company-round-tests" element={<CompanyRoundManager />} />
                <Route path="/resource-links" element={<AdminResourceLinks />} />
                <Route path="/mcq" element={<AdminMCQ />} />
                <Route path="/comm-test" element={<AdminCommTest />} />
                <Route path="/frontend-evals" element={<AdminFrontendEval initialTab="tests" />} />
                <Route path="/frontend-submissions" element={<AdminFrontendEval initialTab="submissions" />} />
                <Route path="/batch-add" element={<BatchManager />} />
                <Route path="/lab-exercises" element={<AdminLabExercise initialTab="questions" />} />
                <Route path="/lab-submissions" element={<AdminLabExercise initialTab="submissions" />} />
            </Routes>
        </DashboardLayout>
    )
}

function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState('7d')

    useEffect(() => {
        axios.get(`${API_BASE}/analytics/admin`)
            .then(res => {
                setStats(res.data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="loading-spinner"></div>
    if (!stats) return <div>Error loading stats</div>

    // Calculate additional metrics
    const avgSubmissionsPerStudent = stats.totalStudents > 0
        ? Math.round(stats.totalSubmissions / stats.totalStudents * 10) / 10
        : 0
    const totalMentors = stats.mentorCount || Math.ceil(stats.totalStudents / 15)
    const activeToday = stats.recentSubmissions?.length || 0

    return (
        <div className="animate-fadeIn">
            {/* Welcome Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(6, 182, 212, 0.05) 100%)',
                borderRadius: '20px',
                padding: '2rem 2.5rem',
                marginBottom: '2rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                        }}>
                            <Shield size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Admin Control Center
                            </h1>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Monitor performance, manage content, and track platform health
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid - 6 Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {/* Total Students */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}>
                            <Users size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{stats.totalStudents}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#10b981'
                    }}>
                        <TrendingUp size={12} /> +12% this month
                    </div>
                </div>

                {/* Total Mentors */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}>
                            <Award size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{totalMentors}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Mentors</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        ~{Math.round(stats.totalStudents / totalMentors)} students/mentor
                    </div>
                </div>

                {/* Submissions */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(6, 182, 212, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                        }}>
                            <Send size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{stats.totalSubmissions}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submissions</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        {avgSubmissionsPerStudent} avg per student
                    </div>
                </div>

                {/* Success Rate */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #047857, #10b981)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}>
                            <CheckCircle size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{stats.successRate}%</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Success Rate</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        height: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${stats.successRate}%`,
                            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                            borderRadius: '3px',
                            transition: 'width 1s ease'
                        }} />
                    </div>
                </div>

                {/* Total Content */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4f46e5, #f59e0b)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}>
                            <FileCode size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{stats.totalContent}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Content</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        Tasks, Problems & Tests
                    </div>
                </div>

                {/* Active Today */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.15), transparent 70%)'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #be185d, #ec4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                        }}>
                            <Zap size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{activeToday}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Today</div>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(236, 72, 153, 0.1)',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#ec4899'
                    }}>
                        <Activity size={12} /> Live
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Submission Trends Chart */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Submission Trends</h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Platform activity over time</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['7d', '30d', '90d'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selectedPeriod === period ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--bg-tertiary)',
                                        color: selectedPeriod === period ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ width: '100%', height: '280px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={stats.submissionTrends}>
                                <defs>
                                    <linearGradient id="colorCountAdmin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                                    }}
                                    labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCountAdmin)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Language Distribution */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '1.5rem'
                }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Language Distribution</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code submissions by language</p>
                    </div>
                    <div style={{ width: '100%', height: '200px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={stats.languageStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {stats.languageStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem',
                        marginTop: '1rem'
                    }}>
                        {stats.languageStats.map((entry, index) => (
                            <div key={entry.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '3px',
                                    background: COLORS[index % COLORS.length]
                                }} />
                                <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section - Activity & Leaderboard */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '1.5rem'
            }}>
                {/* Recent Activity */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    maxHeight: '420px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Activity size={18} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Recent Activity</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live platform submissions</p>
                            </div>
                        </div>
                        <button style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}>
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats.recentSubmissions.map((sub, index) => (
                            <div key={sub.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: sub.status === 'accepted' ? '#10b981' : '#ef4444',
                                    boxShadow: `0 0 12px ${sub.status === 'accepted' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.studentName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <Clock size={11} />
                                        {new Date(sub.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span style={{ opacity: 0.5 }}>•</span>
                                        <span>submitted a solution</span>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: sub.status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: sub.status === 'accepted' ? '#10b981' : '#ef4444'
                                }}>
                                    {sub.score}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performers */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Trophy size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Top Performers</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leading students</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats.studentPerformance.slice(0, 5).map((student, i) => (
                            <div key={student.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: i === 0 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))' : 'var(--bg-tertiary)',
                                borderRadius: '12px',
                                border: `1px solid ${i === 0 ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)'}`
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : i === 2 ? 'linear-gradient(135deg, #4f46e5, #3730a3)' : 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: i < 3 ? 'white' : 'var(--text-muted)'
                                }}>
                                    {i < 3 ? <Trophy size={14} /> : `#${i + 1}`}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.count} submissions</div>
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    color: student.score >= 80 ? '#10b981' : student.score >= 60 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {student.score}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}


function Allocations() {
    const [allocations, setAllocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedMentor, setExpandedMentor] = useState(null)

    useEffect(() => {
        axios.get(`${API_BASE}/allocations`)
            .then(res => {
                setAllocations(res.data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="loading-spinner"></div>

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Mentor Allocations</h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Manage and view student-mentor assignments</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {allocations.map((alloc) => (
                    <div key={alloc.mentorId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div
                            style={{
                                padding: '1.5rem 2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                background: expandedMentor === alloc.mentorId ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                            }}
                            onClick={() => setExpandedMentor(expandedMentor === alloc.mentorId ? null : alloc.mentorId)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                                    {alloc.mentorName.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{alloc.mentorName}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{alloc.mentorEmail}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{alloc.students.length}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Students</span>
                                </div>
                                <div style={{ transform: expandedMentor === alloc.mentorId ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                    <Send size={18} style={{ transform: 'rotate(90deg)', color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                        </div>

                        {expandedMentor === alloc.mentorId && (
                            <div style={{ padding: '0 2rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <div className="table-container" style={{ marginTop: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.75rem' }}>
                                    <table style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Email</th>
                                                <th>Batch</th>
                                                <th>ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alloc.students.map(student => (
                                                <tr key={student.id}>
                                                    <td>{student.name}</td>
                                                    <td>{student.email}</td>
                                                    <td>{student.batch}</td>
                                                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{student.id}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function StudentLeaderboard() {
    const [leaders, setLeaders] = useState([])
    const [loading, setLoading] = useState(true)
    const [reportStudent, setReportStudent] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        axios.get(`${API_BASE}/leaderboard`)
            .then(res => {
                setLeaders(res.data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    if (loading) return <div className="loading-spinner"></div>

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy size={24} style={{ color: '#fbbf24' }} />
        if (rank === 2) return <Award size={24} style={{ color: '#94a3b8' }} />
        if (rank === 3) return <Award size={24} style={{ color: '#3730a3' }} />
        return <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{rank}</span>
    }

    const getTotalViolations = (student) => {
        if (!student.violations) return 0
        return (student.violations.tabSwitches || 0) +
            (student.violations.copyPaste || 0) +
            (student.violations.cameraBlocked || 0) +
            (student.violations.phoneDetection || 0) +
            (student.violations.integrityViolations || 0) +
            (student.violations.plagiarism || 0)
    }

    return (
        <div className="card animate-fadeIn" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Trophy size={32} className="text-primary" />
                        <div>
                            <h2 style={{ margin: 0 }}>Global Performance Ranking</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time ranking of students across all mentors</p>
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem 0.75rem 2.75rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                width: '300px',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>

                <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Student Name</th>
                                <th>Submissions</th>
                                <th>Avg. Score</th>
                                <th>Violations</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((student, i) => {
                                const totalViolations = getTotalViolations(student)
                                const hasIssues = totalViolations > 0 || student.violations?.plagiarism > 0

                                return (
                                    <tr key={student.studentId}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {getRankIcon(i + 1)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="avatar-circle">{student.name.charAt(0)}</div>
                                                <span>{student.name}</span>
                                            </div>
                                        </td>
                                        <td>{student.totalSubmissions}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{student.avgScore}%</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {student.violations?.tabSwitches > 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(245, 158, 11, 0.15)',
                                                        color: '#f59e0b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }} title="Tab Switches">
                                                        <Eye size={10} /> {student.violations.tabSwitches}
                                                    </span>
                                                )}
                                                {student.violations?.cameraBlocked > 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }} title="Camera Blocked">
                                                        📷 {student.violations.cameraBlocked}
                                                    </span>
                                                )}
                                                {student.violations?.phoneDetection > 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }} title="Phone Detected">
                                                        📱 {student.violations.phoneDetection}
                                                    </span>
                                                )}
                                                {student.violations?.copyPaste > 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(245, 158, 11, 0.15)',
                                                        color: '#f59e0b',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }} title="Copy/Paste Attempts">
                                                        📋 {student.violations.copyPaste}
                                                    </span>
                                                )}
                                                {student.violations?.plagiarism > 0 && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#ef4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }} title="Plagiarism">
                                                        <AlertTriangle size={10} /> {student.violations.plagiarism}
                                                    </span>
                                                )}
                                                {!hasIssues && (
                                                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                                        <CheckCircle size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ width: '100px', height: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${student.avgScore}%`, height: '100%', background: hasIssues ? 'var(--warning)' : 'var(--primary)' }}></div>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setReportStudent({ id: student.studentId, name: student.name })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.5rem 0.85rem',
                                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                                                }}
                                                title="Generate comprehensive report"
                                            >
                                                <FileText size={14} />
                                                Report
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Report Modal */}
            {reportStudent && (
                <StudentReportModal
                    studentId={reportStudent.id}
                    studentName={reportStudent.name}
                    onClose={() => setReportStudent(null)}
                    requestedBy="Administrator"
                    requestedByRole="admin"
                />
            )}
        </div>
    )
}

function MentorLeaderboard() {
    const [leaders, setLeaders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('authToken')
        axios.get(`${API_BASE}/mentor-leaderboard`, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
            .then(res => {
                setLeaders(Array.isArray(res.data) ? res.data : [])
                setError(Array.isArray(res.data) ? '' : 'Unexpected mentor leaderboard response.')
                setLoading(false)
            })
            .catch(err => {
                setLeaders([])
                setError(err.response?.data?.error || 'Failed to load mentor ranking.')
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="loading-spinner"></div>

    // Compute mentor stats
    const mentorStats = useMemo(() => {
        const totalMentors = leaders.length
        const totalStudents = leaders.reduce((sum, m) => sum + (m.studentCount || 0), 0)
        const totalSubs = leaders.reduce((sum, m) => sum + (m.totalSubmissions || 0), 0)
        const totalContent = leaders.reduce((sum, m) => sum + (m.totalContent || 0), 0)
        const scores = leaders.map(m => Number(m.avgStudentScore) || 0).filter(s => s > 0)
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const topMentor = leaders.length > 0 ? leaders.reduce((best, m) => (Number(m.avgStudentScore) || 0) > (Number(best.avgStudentScore) || 0) ? m : best, leaders[0]) : null
        return { totalMentors, totalStudents, totalSubs, totalContent, avgScore, topMentor }
    }, [leaders])

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Award size={32} style={{ color: '#8b5cf6' }} />
                    <div>
                        <h2 style={{ margin: 0 }}>Global Mentor Leaderboard</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Ranking mentors by student success and platform engagement</p>
                    </div>
                </div>

                {error && (
                    <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {/* Mentor Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#a78bfa' }}>Total Mentors</span>
                            <Users size={16} style={{ color: '#8b5cf6' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{mentorStats.totalMentors}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Active mentors</div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#60a5fa' }}>Total Students</span>
                            <Users size={16} style={{ color: '#3b82f6' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>{mentorStats.totalStudents}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Across all mentors</div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#34d399' }}>Avg Student Score</span>
                            <TrendingUp size={16} style={{ color: '#10b981' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{mentorStats.avgScore.toFixed(1)}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Platform average</div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fbbf24' }}>Total Submissions</span>
                            <ClipboardList size={16} style={{ color: '#f59e0b' }} />
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{mentorStats.totalSubs}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{mentorStats.totalContent} content items</div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#22d3ee' }}>Top Mentor</span>
                            <Trophy size={16} style={{ color: '#06b6d4' }} />
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#06b6d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentorStats.topMentor?.name || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{mentorStats.topMentor ? `${mentorStats.topMentor.avgStudentScore}% avg score` : ''}</div>
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color, #1e293b)' }}>
                <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '500px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'var(--bg-card, #0f172a)' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>#</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Mentor</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Students</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Content</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Submissions</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Avg Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '1.25rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No mentor ranking data available yet.
                                    </td>
                                </tr>
                            ) : leaders.map((mentor, idx) => (
                                <tr key={mentor.mentorId} style={{ borderBottom: '1px solid var(--border-color, #1e293b)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', width: 32, height: 32, fontSize: '0.85rem' }}>
                                                {(mentor.name || '?').charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mentor.name || 'Unknown Mentor'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 600 }}>{mentor.studentCount}</td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontWeight: 600 }}>{mentor.totalContent}</span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 600 }}>{mentor.totalSubmissions}</td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: Number(mentor.avgStudentScore) >= 80 ? '#10b981' : Number(mentor.avgStudentScore) >= 60 ? '#f59e0b' : '#ef4444' }}>{mentor.avgStudentScore}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function AllSubmissions() {
    const [submissions, setSubmissions] = useState([])
    const [mlTaskSubmissions, setMlTaskSubmissions] = useState([])
    const [aptitudeSubmissions, setAptitudeSubmissions] = useState([])
    const [globalSubmissions, setGlobalSubmissions] = useState([])
    const [mcqSubmissions, setMcqSubmissions] = useState([])
    const [crtSubmissions, setCrtSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [viewReport, setViewReport] = useState(null)
    const [viewMLReport, setViewMLReport] = useState(null)
    const [viewAptitudeResult, setViewAptitudeResult] = useState(null)
    const [viewGlobalReport, setViewGlobalReport] = useState(null)
    const [viewCRTReport, setViewCRTReport] = useState(null)
    const [crtReportData, setCrtReportData] = useState(null)
    const [crtReportLoading, setCrtReportLoading] = useState(false)
    const [resetting, setResetting] = useState(false)
    // Column filters
    const [filterStudent, setFilterStudent] = useState('')
    const [filterLanguage, setFilterLanguage] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterProblem, setFilterProblem] = useState('')
    const [filterAttempt, setFilterAttempt] = useState('')
    const [sortField, setSortField] = useState('submittedAt')
    const [sortDir, setSortDir] = useState('desc')
    const [showFilters, setShowFilters] = useState(false)

    // WhatsApp Send Report modal state
    const [showWAModal, setShowWAModal] = useState(false)
    const [waStep, setWAStep] = useState(1)        // 1=type, 2=title, 3=mode, 4=details
    const [waTestType, setWATestType] = useState('crt')
    const [waTestTitle, setWATestTitle] = useState('')
    const [waSendMode, setWASendMode] = useState('individual') // 'individual' | 'bulk'
    const [waIndivName, setWAIndivName] = useState('')
    const [waIndivEmail, setWAIndivEmail] = useState('')
    const [waIndivPhone, setWAIndivPhone] = useState('')
    const [waBulkJson, setWABulkJson] = useState('')
    const [waSending, setWASending] = useState(false)
    const [waResults, setWAResults] = useState([])  // [{name, phone, status, link}]
    const [waJsonError, setWAJsonError] = useState('')

    const fetchSubmissions = () => {
        setLoading(true)
        Promise.all([
            axios.get(`${API_BASE}/submissions?limit=5000`),
            axios.get(`${API_BASE}/aptitude-submissions`),
            axios.get(`${API_BASE}/global-test-submissions`),
            axios.get(`${API_BASE}/mcq-submissions`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }).catch(() => ({ data: { submissions: [] } })),
            axios.get(`${API_BASE}/crt-submissions`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }).catch(() => ({ data: { submissions: [] } }))
        ]).then(([codeRes, aptRes, globalRes, mcqRes, crtRes]) => {
            const codeData = Array.isArray(codeRes.data) ? codeRes.data : (codeRes.data?.data || [])
            const mlTasks = codeData.filter(s => s.isMLTask).map(s => ({ ...s, subType: 'ml-task' }))
            const codeSubs = codeData.filter(s => !s.isMLTask).map(s => ({ ...s, subType: 'code' }))
            const aptSubs = (aptRes.data || []).map(s => ({
                ...s,
                subType: 'aptitude',
                itemTitle: s.testTitle,
                language: 'Aptitude'
            }))
            const globalSubs = (globalRes.data || []).map(s => ({
                ...s,
                subType: 'global',
                itemTitle: s.testTitle,
                language: 'Mixed',
                score: s.overallPercentage
            }))
            const mcqSubs = (mcqRes.data?.submissions || []).map(s => ({
                ...s,
                subType: 'mcq',
                itemTitle: s.mcq_title,
                language: 'MCQ',
                studentName: s.student_name,
                studentEmail: s.student_email,
                submittedAt: s.submitted_at
            }))
            const crtSubs = (crtRes.data?.submissions || [])
            setSubmissions(codeSubs)
            setMlTaskSubmissions(mlTasks)
            setAptitudeSubmissions(aptSubs)
            setGlobalSubmissions(globalSubs)
            setMcqSubmissions(mcqSubs)
            setCrtSubmissions(crtSubs)
            setLoading(false)
        }).catch(err => {
            console.error('Fetch error:', err)
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    // Download CSV functionality
    const downloadCSV = () => {
        const dataToExport = getFilteredSubmissions()

        if (dataToExport.length === 0) {
            alert('No submissions to download')
            return
        }

        // CSV headers
        const headers = [
            'Student Name',
            'Student Email',
            'Type',
            'Problem/Test Title',
            'Language',
            'Score',
            'Status',
            'Tab Switches',
            'Camera Blocked',
            'Phone Detected',
            'Plagiarism Detected',
            'Submitted At'
        ]

        // Convert data to CSV rows
        const rows = dataToExport.map(sub => [
            sub.studentName || '',
            sub.studentEmail || '',
            sub.subType === 'aptitude' ? 'Aptitude' : sub.subType === 'global' ? 'Global' : sub.subType === 'crt' ? 'Round Test' : 'Code',
            sub.itemTitle || sub.testTitle || '',
            sub.subType === 'aptitude' ? 'N/A' : sub.subType === 'global' ? 'Mixed' : sub.subType === 'crt' ? 'Round Test' : (sub.language || 'N/A'),
            sub.score || 0,
            sub.status || '',
            sub.integrity?.tabSwitches || sub.tabSwitches || 0,
            sub.cameraBlockedCount || 0,
            sub.phoneDetectionCount || 0,
            sub.plagiarism?.detected ? 'Yes' : 'No',
            sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''
        ])

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma or quotes
                const cellStr = String(cell)
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`
                }
                return cellStr
            }).join(','))
        ].join('\n')

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `submissions_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleResetAllSubmissions = async () => {
        const confirmReset = window.confirm(
            '⚠️ WARNING: This will permanently delete ALL submissions from ALL students!\n\n' +
            'This includes:\n' +
            '• All code submissions\n' +
            '• All aptitude test submissions\n' +
            '• All problem completions\n' +
            '• All task completions\n\n' +
            'This action CANNOT be undone. Are you sure?'
        )

        if (!confirmReset) return

        // Double confirmation for safety
        const doubleConfirm = window.confirm(
            '🚨 FINAL CONFIRMATION 🚨\n\n' +
            'You are about to delete ALL submissions permanently.\n\n' +
            'Type OK to proceed.'
        )

        if (!doubleConfirm) return

        setResetting(true)
        try {
            const response = await axios.delete(`${API_BASE}/submissions`)
            alert(`✅ Reset Complete!\n\n` +
                `• Code submissions deleted: ${response.data.deletedCodeSubmissions}\n` +
                `• Aptitude submissions deleted: ${response.data.deletedAptitudeSubmissions}\n` +
                `• Global test submissions deleted: ${response.data.deletedGlobalSubmissions || 0}`)
            fetchSubmissions() // Refresh the list
        } catch (err) {
            alert('❌ Failed to reset submissions: ' + (err.response?.data?.error || err.message))
        } finally {
            setResetting(false)
        }
    }

    const handleResetCRTSubmissions = async () => {
        const confirmReset = window.confirm(
            '⚠️ WARNING: This will permanently delete ALL Round Test (CRT) submissions globally!\n\n' +
            'This action CANNOT be undone. Are you sure?'
        )

        if (!confirmReset) return

        const doubleConfirm = window.confirm(
            '🚨 FINAL CONFIRMATION 🚨\n\n' +
            'You are about to delete ALL Round Test submissions. Type OK to proceed.'
        )

        if (!doubleConfirm) return

        setResetting(true)
        try {
            const response = await axios.delete(`${API_BASE}/crt-submissions/reset`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
            alert(`✅ Reset Complete!\n\n• Round Test attempts deleted: ${response.data.deletedAttempts || 0}`)
            fetchSubmissions() // Refresh the list
        } catch (err) {
            alert('❌ Failed to reset Round Test submissions: ' + (err.response?.data?.error || err.message))
        } finally {
            setResetting(false)
        }
    }

    const allSubmissions = [...submissions, ...mlTaskSubmissions, ...aptitudeSubmissions, ...globalSubmissions, ...mcqSubmissions, ...crtSubmissions]
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    // Compute attempt numbers: group by (studentId + problemId/testId) and assign attempt #
    const attemptMap = useMemo(() => {
        const map = {}
        const sorted = [...allSubmissions].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        sorted.forEach(sub => {
            const key = `${sub.studentId || sub.student_id}_${sub.problemId || sub.testId || sub.itemTitle || ''}_${sub.subType}`
            if (!map[key]) map[key] = 0
            map[key]++
            sub._attemptNum = map[key]
        })
        // Also store total attempts per key
        const totalMap = {}
        sorted.forEach(sub => {
            const key = `${sub.studentId || sub.student_id}_${sub.problemId || sub.testId || sub.itemTitle || ''}_${sub.subType}`
            totalMap[key] = map[key]
        })
        sorted.forEach(sub => {
            const key = `${sub.studentId || sub.student_id}_${sub.problemId || sub.testId || sub.itemTitle || ''}_${sub.subType}`
            sub._totalAttempts = totalMap[key]
        })
        return map
    }, [allSubmissions])

    // Unique values for filter dropdowns
    const uniqueStudents = useMemo(() => [...new Set(allSubmissions.map(s => s.studentName).filter(Boolean))].sort(), [allSubmissions])
    const uniqueLanguages = useMemo(() => [...new Set(allSubmissions.map(s => s.language).filter(Boolean))].sort(), [allSubmissions])
    const uniqueStatuses = useMemo(() => [...new Set(allSubmissions.map(s => s.status).filter(Boolean))].sort(), [allSubmissions])
    const uniqueProblems = useMemo(() => [...new Set(allSubmissions.map(s => s.itemTitle || s.testTitle).filter(Boolean))].sort(), [allSubmissions])
    const uniqueAttempts = useMemo(() => {
        const nums = [...new Set(allSubmissions.map(s => s._attemptNum).filter(Boolean))].sort((a, b) => a - b)
        return nums
    }, [allSubmissions])

    const getFilteredSubmissions = () => {
        let filtered = activeTab === 'all'
            ? allSubmissions
            : activeTab === 'code'
                ? submissions
                : activeTab === 'ml-task'
                    ? mlTaskSubmissions
                    : activeTab === 'aptitude'
                        ? aptitudeSubmissions
                        : activeTab === 'mcq'
                            ? mcqSubmissions
                            : activeTab === 'crt'
                                ? crtSubmissions
                                : globalSubmissions

        // Text search
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(s =>
                (s.studentName || '').toLowerCase().includes(q) ||
                (s.itemTitle || s.testTitle || '').toLowerCase().includes(q) ||
                (s.status || '').toLowerCase().includes(q)
            )
        }

        // Column filters
        if (filterStudent) filtered = filtered.filter(s => s.studentName === filterStudent)
        if (filterLanguage) filtered = filtered.filter(s => s.language === filterLanguage)
        if (filterStatus) filtered = filtered.filter(s => s.status === filterStatus)
        if (filterProblem) filtered = filtered.filter(s => (s.itemTitle || s.testTitle) === filterProblem)
        if (filterAttempt) filtered = filtered.filter(s => String(s._attemptNum) === filterAttempt)

        // Sorting
        filtered = [...filtered].sort((a, b) => {
            let aVal, bVal
            if (sortField === 'submittedAt') { aVal = new Date(a.submittedAt); bVal = new Date(b.submittedAt) }
            else if (sortField === 'score') { aVal = Number(a.score) || 0; bVal = Number(b.score) || 0 }
            else if (sortField === 'studentName') { aVal = (a.studentName || '').toLowerCase(); bVal = (b.studentName || '').toLowerCase() }
            else if (sortField === 'status') { aVal = (a.status || ''); bVal = (b.status || '') }
            else { aVal = a[sortField]; bVal = b[sortField] }

            // Special case for 'high_score' explicit sort dropdown filter mapping
            if (sortField === 'high_score') {
                aVal = Number(a.score) || 0;
                bVal = Number(b.score) || 0;
                return bVal - aVal; // Always descending for high score
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('desc') }
    }

    const clearAllFilters = () => {
        setFilterStudent(''); setFilterLanguage(''); setFilterStatus(''); setFilterProblem(''); setFilterAttempt(''); setSearchTerm('')
    }
    const hasActiveFilters = filterStudent || filterLanguage || filterStatus || filterProblem || filterAttempt || searchTerm

    const filteredSubmissions = getFilteredSubmissions()

    // Aggregate stats
    const stats = useMemo(() => {
        const data = filteredSubmissions
        const scores = data.map(s => Number(s.score) || 0)
        const totalStudents = new Set(data.map(s => s.studentId || s.student_id)).size
        const accepted = data.filter(s => (s.status || '').toLowerCase() === 'accepted').length
        const partial = data.filter(s => (s.status || '').toLowerCase() === 'partial').length
        const rejected = data.filter(s => (s.status || '').toLowerCase() === 'rejected').length
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0
        const minScore = scores.length > 0 ? Math.min(...scores) : 0
        const passRate = data.length > 0 ? ((accepted / data.length) * 100) : 0
        const avgTabSwitches = data.length > 0 ? (data.reduce((a, s) => a + (s.tabSwitches || s.integrity?.tabSwitches || 0), 0) / data.length) : 0
        const plagCount = data.filter(s => s.plagiarism?.detected).length
        // Score distribution
        const dist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
        scores.forEach(s => {
            if (s <= 20) dist['0-20']++
            else if (s <= 40) dist['21-40']++
            else if (s <= 60) dist['41-60']++
            else if (s <= 80) dist['61-80']++
            else dist['81-100']++
        })
        return { totalStudents, accepted, partial, rejected, avgScore, maxScore, minScore, passRate, avgTabSwitches, plagCount, dist, total: data.length }
    }, [filteredSubmissions])

    if (loading) return <div className="loading-spinner"></div>

    const filterSelectStyle = {
        padding: '6px 10px', background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border-color, #334155)',
        borderRadius: '6px', color: 'inherit', fontSize: '0.78rem', outline: 'none', minWidth: '120px', cursor: 'pointer'
    }

    const SortHeader = ({ label, field, style = {} }) => (
        <th onClick={() => toggleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {label}
                <ArrowUpDown size={12} style={{ opacity: sortField === field ? 1 : 0.3, color: sortField === field ? 'var(--primary)' : 'inherit' }} />
            </div>
        </th>
    )

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexShrink: 0 }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Submission Archives</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Global audit trail of all submissions</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Tab Buttons */}
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        {[
                            { key: 'all', label: 'All', count: allSubmissions.length, color: 'var(--primary)' },
                            { key: 'code', label: '💻 Code', count: submissions.length, color: 'var(--primary)' },
                            { key: 'ml-task', label: '🧠 ML', count: mlTaskSubmissions.length, color: '#06b6d4' },
                            { key: 'aptitude', label: '📝 Apt', count: aptitudeSubmissions.length, color: '#8b5cf6' },
                            { key: 'global', label: '🌐 Global', count: globalSubmissions.length, color: '#3b82f6' },
                            { key: 'mcq', label: '🔢 MCQ', count: mcqSubmissions.length, color: '#8b5cf6' },
                            { key: 'crt', label: '🏢 Round', count: crtSubmissions.length, color: '#f59e0b' }
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{ padding: '0.4rem 0.75rem', background: activeTab === tab.key ? tab.color : 'transparent', border: 'none', color: activeTab === tab.key ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                            >{tab.label} ({tab.count})</button>
                        ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search..." style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', width: '200px', fontSize: '0.82rem' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setShowFilters(f => !f)} style={{
                        padding: '0.5rem 0.75rem', background: showFilters ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)', border: `1px solid ${showFilters ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.2)'}`,
                        borderRadius: '8px', color: '#3b82f6', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                        <Filter size={14} /> Filters {hasActiveFilters && <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
                    </button>
                    <button onClick={downloadCSV} disabled={filteredSubmissions.length === 0} style={{
                        padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px', color: '#10b981', cursor: filteredSubmissions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px', opacity: filteredSubmissions.length === 0 ? 0.5 : 1
                    }}>
                        <Download size={14} /> CSV
                    </button>
                    <button onClick={handleResetAllSubmissions} disabled={resetting || allSubmissions.length === 0} style={{
                        padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px', color: '#ef4444', cursor: resetting || allSubmissions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px', opacity: resetting || allSubmissions.length === 0 ? 0.5 : 1
                    }}>
                        <Trash2 size={14} /> {resetting ? 'Resetting...' : 'Reset All'}
                    </button>

                    {/* WhatsApp Send Report Button */}
                    <button onClick={() => { setShowWAModal(true); setWAStep(1); setWATestType('crt'); setWATestTitle(''); setWASendMode('individual'); setWAIndivName(''); setWAIndivEmail(''); setWAIndivPhone(''); setWABulkJson(''); setWAResults([]); setWAJsonError(''); }} style={{
                        padding: '0.5rem 0.75rem', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.4)',
                        borderRadius: '8px', color: '#25d366', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                        <span style={{ fontSize: '1rem' }}>📲</span> Send Report
                    </button>

                    {/* Additional Reset Button explicitly for CRT/Round Tests ONLY */}
                    {activeTab === 'crt' && (
                        <button onClick={handleResetCRTSubmissions} disabled={resetting || filteredSubmissions.length === 0} style={{
                            padding: '0.5rem 0.75rem', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.3)',
                            borderRadius: '8px', color: '#2563eb', cursor: resetting || filteredSubmissions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '5px', opacity: resetting || filteredSubmissions.length === 0 ? 0.5 : 1
                        }}>
                            <Trash2 size={14} /> {resetting ? 'Resetting...' : 'Reset Round Tests'}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.75rem',
                    background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', flexShrink: 0, flexWrap: 'wrap'
                }}>
                    <Filter size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} style={filterSelectStyle}>
                        <option value="">All Students</option>
                        {uniqueStudents.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterProblem} onChange={e => setFilterProblem(e.target.value)} style={filterSelectStyle}>
                        <option value="">All Problems/Tests</option>
                        {uniqueProblems.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} style={filterSelectStyle}>
                        <option value="">All Languages</option>
                        {uniqueLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterAttempt} onChange={e => setFilterAttempt(e.target.value)} style={{ ...filterSelectStyle, minWidth: '100px' }}>
                        <option value="">All Attempts</option>
                        {uniqueAttempts.map(a => <option key={a} value={String(a)}>Attempt #{a}</option>)}
                    </select>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />

                    <select value={sortField === 'score' && sortDir === 'desc' ? 'high_score' : sortField} onChange={e => {
                        if (e.target.value === 'high_score') {
                            setSortField('score');
                            setSortDir('desc');
                        } else {
                            setSortField(e.target.value);
                            setSortDir('desc'); // Default to descending when changing via dropdown
                        }
                    }} style={{ ...filterSelectStyle, minWidth: '130px', border: '1px solid rgba(139, 92, 246, 0.5)', color: '#a78bfa' }}>
                        <option value="submittedAt">Sort by Date</option>
                        <option value="high_score">Sort by High Score</option>
                        <option value="studentName">Sort by Name</option>
                    </select>

                    {hasActiveFilters && (
                        <button onClick={clearAllFilters} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={12} /> Clear
                        </button>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Showing {filteredSubmissions.length} of {allSubmissions.length}
                    </span>
                </div>
            )}

            {/* Aggregate Stats Panel */}
            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#60a5fa' }}>Total Submissions</span>
                        <ClipboardList size={16} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>{stats.total}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stats.totalStudents} unique students</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#34d399' }}>Pass Rate</span>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.passRate.toFixed(1)}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stats.accepted} accepted of {stats.total}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#a78bfa' }}>Avg Score</span>
                        <BarChart2 size={16} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.avgScore.toFixed(1)}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Min {stats.minScore}% · Max {stats.maxScore}%</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fbbf24' }}>Status Breakdown</span>
                        <Target size={16} style={{ color: '#f59e0b' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{stats.accepted}</div><div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Pass</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{stats.partial}</div><div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Partial</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{stats.rejected}</div><div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Fail</div></div>
                        {stats.plagCount > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{stats.plagCount}</div><div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Plag</div></div>}
                    </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#22d3ee' }}>Score Distribution</span>
                        <BarChart3 size={16} style={{ color: '#06b6d4' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '40px', marginTop: '0.25rem' }}>
                        {Object.entries(stats.dist).map(([range, count]) => {
                            const maxCount = Math.max(...Object.values(stats.dist), 1)
                            const height = Math.max((count / maxCount) * 36, 2)
                            const colors = { '0-20': '#ef4444', '21-40': '#f59e0b', '41-60': '#eab308', '61-80': '#3b82f6', '81-100': '#10b981' }
                            return (<div key={range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><div style={{ width: '100%', height: `${height}px`, background: colors[range], borderRadius: '3px 3px 0 0', opacity: 0.8 }} title={`${range}: ${count}`}></div><span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{range}</span></div>)
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable Table */}
            <div className="card glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color, #1e293b)' }}>
                <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '620px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'var(--bg-card, #0f172a)' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>#</th>
                                <SortHeader label="Student" field="studentName" style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }} />
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Type</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Problem / Test</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Lang</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Attempt</th>
                                <SortHeader label="Score" field="score" style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }} />
                                <SortHeader label="Status" field="status" style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }} />
                                <SortHeader label="Submitted" field="submittedAt" style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }} />
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '2px solid var(--border-color, #334155)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No submissions found</td></tr>
                            ) : filteredSubmissions.map((sub, idx) => (
                                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color, #1e293b)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sub.studentName}</div>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <span style={{
                                            fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
                                            background: sub.subType === 'aptitude' ? 'rgba(139,92,246,0.12)' : sub.subType === 'global' ? 'rgba(59,130,246,0.12)' : sub.subType === 'ml-task' ? 'rgba(6,182,212,0.12)' : sub.subType === 'crt' ? 'rgba(245,158,11,0.12)' : 'rgba(59, 130, 246, 0.1)',
                                            color: sub.subType === 'ml-task' ? '#06b6d4' : sub.subType === 'aptitude' ? '#8b5cf6' : sub.subType === 'global' ? '#3b82f6' : sub.subType === 'crt' ? '#f59e0b' : 'var(--primary)'
                                        }}>
                                            {sub.subType === 'ml-task' ? '🧠 ML' : sub.subType === 'aptitude' ? '📝 Apt' : sub.subType === 'global' ? '🌐 Global' : sub.subType === 'crt' ? '🏢 Round' : '💻 Code'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.itemTitle || sub.testTitle}</div>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(59,130,246,0.08)', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                            {sub.subType === 'aptitude' ? 'N/A' : sub.subType === 'global' ? 'Mixed' : sub.subType === 'crt' ? 'Round Test' : (sub.language?.toUpperCase() || 'N/A')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap',
                                            background: sub._attemptNum === 1 ? 'rgba(16,185,129,0.12)' : sub._attemptNum === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: sub._attemptNum === 1 ? '#10b981' : sub._attemptNum === 2 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            #{sub._attemptNum || 1}{sub._totalAttempts > 1 ? `/${sub._totalAttempts}` : ''}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700, fontSize: '1rem' }}>{sub.score != null ? `${sub.score}%` : '-'}</td>
                                    <td style={{ padding: '0.6rem 1rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
                                            <span className={`status-badge ${sub.status}`} style={{ fontSize: '0.7rem' }}>{sub.status}</span>
                                            {sub.plagiarism?.detected && (
                                                <span className="status-badge plagiarized" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.65rem' }}>
                                                    <AlertTriangle size={10} /> Plag
                                                </span>
                                            )}
                                            {(sub.integrity?.integrityViolation || sub.tabSwitches > 0) && (
                                                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <AlertTriangle size={9} /> {sub.integrity?.tabSwitches || sub.tabSwitches || 0}T
                                                </span>
                                            )}
                                            {sub.cameraBlockedCount > 0 && (
                                                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                                                    📷{sub.cameraBlockedCount}
                                                </span>
                                            )}
                                            {sub.phoneDetectionCount > 0 && (
                                                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                                                    📱{sub.phoneDetectionCount}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                                        {sub.subType === 'aptitude' ? (
                                            <button onClick={() => setViewAptitudeResult(sub)} style={{ background: 'rgba(139,92,246,0.1)', border: 'none', color: '#8b5cf6', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Eye size={12} /> Results
                                            </button>
                                        ) : sub.subType === 'global' ? (
                                            <button onClick={() => setViewGlobalReport(sub.id)} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Eye size={12} /> Report
                                            </button>
                                        ) : sub.subType === 'ml-task' ? (
                                            <button onClick={() => setViewMLReport(sub)} style={{ background: 'rgba(6,182,212,0.1)', border: 'none', color: '#06b6d4', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Eye size={12} /> ML
                                            </button>
                                        ) : sub.subType === 'crt' ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={async () => {
                                                    setViewCRTReport(sub)
                                                    setCrtReportLoading(true)
                                                    try {
                                                        const { data } = await axios.get(`${API_BASE}/crt/attempt/${sub.attemptId || sub.id}/report`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
                                                        setCrtReportData(data)
                                                    } catch (err) {
                                                        console.error('CRT report error:', err)
                                                        setCrtReportData(null)
                                                    }
                                                    setCrtReportLoading(false)
                                                }} style={{ background: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <Eye size={12} /> Report
                                                </button>
                                                <button onClick={async () => {
                                                    if (!window.confirm('Are you sure you want to delete this Round Test submission?')) return;
                                                    try {
                                                        await axios.delete(`${API_BASE}/crt/attempts/${sub.attemptId || sub.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
                                                        alert('Submission deleted successfully');
                                                        fetchSubmissions();
                                                    } catch (err) {
                                                        alert('Failed to delete submission: ' + (err.response?.data?.error || err.message));
                                                    }
                                                }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setViewReport(sub)} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Eye size={12} /> Report
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Report Modal */}
            {viewAptitudeResult && (
                <AptitudeReportModal submission={viewAptitudeResult} onClose={() => setViewAptitudeResult(null)} />
            )}

            {viewGlobalReport && (
                <GlobalReportModal
                    submissionId={viewGlobalReport}
                    onClose={() => setViewGlobalReport(null)}
                    isStudentView={false}
                />
            )}

            {viewMLReport && <AdminMLReportModal submission={viewMLReport} onClose={() => setViewMLReport(null)} />}

            {viewReport && (
                <AdminSubmissionReportModal
                    submission={viewReport}
                    onClose={() => setViewReport(null)}
                />
            )}

            {/* CRT Report Modal */}
            {viewCRTReport && (
                <AdminCRTReportModal
                    submission={viewCRTReport}
                    reportData={crtReportData}
                    loading={crtReportLoading}
                    onClose={() => { setViewCRTReport(null); setCrtReportData(null); }}
                />
            )}

            {/* ═══ WhatsApp Send Report Modal ═══ */}
            {showWAModal && (() => {
                // Derive available titles for chosen type
                const typeMap = {
                    crt: crtSubmissions,
                    global: globalSubmissions,
                    mcq: mcqSubmissions,
                    aptitude: aptitudeSubmissions,
                }
                const pool = typeMap[waTestType] || []
                const titleKey = waTestType === 'mcq' ? 'mcq_title' : waTestType === 'global' ? 'testTitle' : waTestType === 'aptitude' ? 'itemTitle' : 'test_title'
                const availTitles = [...new Set(pool.map(s => s[titleKey] || s.itemTitle || s.testTitle || s.title || '').filter(Boolean))].sort()

                // Build WhatsApp message for a single submission
                const buildMessage = (sub) => {
                    const name = sub.studentName || sub.student_name || 'Student'
                    const title = sub[titleKey] || sub.itemTitle || sub.testTitle || sub.title || 'Test'
                    const score = Math.round(Number(sub.score || sub.overallPercentage || 0))
                    const status = (sub.status || '').toUpperCase() || (score >= (sub.pass_percentage || 60) ? 'PASSED' : 'FAILED')
                    const rank = sub.rank ? `${sub.rank}/${sub.total_participants || '—'}` : '—'
                    const date = sub.submittedAt || sub.submitted_at || sub.completed_at
                        ? new Date(sub.submittedAt || sub.submitted_at || sub.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''
                    const sectionScores = sub.section_scores || {}
                    const sections = sub.sections || Object.keys(sectionScores)
                    const totalQ = sections.reduce((s, sec) => s + (sectionScores[sec]?.total || 0), 0) || sub.total_questions || ''
                    const correctQ = sections.reduce((s, sec) => s + (sectionScores[sec]?.correct || 0), 0) || sub.correct_answers || ''
                    const wrongQ = correctQ !== '' && totalQ !== '' ? (sub.attempted_questions != null ? sub.attempted_questions - correctQ : '') : ''
                    const missed = totalQ !== '' && sub.attempted_questions != null ? totalQ - sub.attempted_questions : ''

                    let secLines = ''
                    if (sections.length > 0) {
                        secLines = '\n\n📚 *Section-wise Performance:*\n' + sections.map(sec => {
                            const ss = sectionScores[sec] || {}
                            const label = { aptitude: 'Aptitude', verbal: 'Verbal', logical: 'Logical', reasoning: 'Reasoning', technical_mcq: 'Technical MCQ', coding: 'Coding', sql: 'SQL' }[sec] || sec
                            return `• ${label}: ${Math.round(ss.score || 0)}% (${ss.correct || 0}/${ss.total || 0})`
                        }).join('\n')
                    }

                    return `🎓 *AI Mentor Hub – Test Report*\n\n👤 *Student:* ${name}\n📋 *Test:* ${title}${date ? `\n📅 *Date:* ${date}` : ''}\n\n📊 *Overall Score:* ${score}%\n🏆 *Status:* ${status}\n🎯 *Rank:* ${rank}${totalQ ? `\n\n📝 *Question Breakdown:*\n✅ Correct: ${correctQ}${wrongQ !== '' ? `\n❌ Wrong: ${wrongQ}` : ''}${missed !== '' ? `\n⏭️ Missed: ${missed}` : ''}\n📋 Total: ${totalQ}` : ''}${secLines}\n\n🔗 Login to AI Mentor Hub to view your full detailed report.`
                }

                // Find submission by email and title
                const findSub = (email, title) => {
                    const emailLc = (email || '').toLowerCase().trim()
                    const titleLc = (title || '').toLowerCase().trim()
                    return pool.find(s => {
                        const sEmail = (s.studentEmail || s.student_email || s.email || '').toLowerCase().trim()
                        const sTitle = (s[titleKey] || s.itemTitle || s.testTitle || s.title || '').toLowerCase().trim()
                        return sEmail === emailLc && (titleLc === '' || sTitle === titleLc)
                    })
                }

                // Send individual text — calls backend API directly
                const sendIndividual = async () => {
                    const sub = findSub(waIndivEmail, waTestTitle)
                    const phone = waIndivPhone.replace(/\D/g, '')
                    if (!phone) { alert('Please enter a valid phone number.'); return }
                    const msg = sub ? buildMessage(sub) : `🎓 *AI Mentor Hub – Test Report*\n\n👤 *Student:* ${waIndivName || waIndivEmail}\n📋 *Test:* ${waTestTitle}\n\n⚠️ Detailed report data not available. Please log into the portal to view your results.`
                    setWASending(true)
                    setWAResults([{ name: waIndivName || waIndivEmail, phone, status: 'Sending…' }])
                    try {
                        await axios.post(`${API_BASE}/admin/send-whatsapp`, { phone, message: msg })
                        setWAResults([{ name: waIndivName || waIndivEmail, phone, status: sub ? '✅ Text sent' : '✅ Text sent (no submission data found)' }])
                    } catch (err) {
                        const errMsg = err.response?.data?.error || err.message
                        setWAResults([{ name: waIndivName || waIndivEmail, phone, status: `❌ Failed: ${errMsg}` }])
                    } finally {
                        setWASending(false)
                    }
                }

                // Send individual PDF report
                const sendIndividualPDF = async () => {
                    const sub = findSub(waIndivEmail, waTestTitle)
                    if (!sub) { alert('No CRT submission found for this email and test title. PDF reports are only available for Round Tests.'); return }
                    const attemptId = sub.attemptId || sub.id
                    if (!attemptId) { alert('Could not find attempt ID for this submission.'); return }
                    const phone = waIndivPhone.replace(/\D/g, '')
                    if (!phone) { alert('Please enter a valid phone number.'); return }
                    setWASending(true)
                    setWAResults([{ name: waIndivName || waIndivEmail, phone, status: '⏳ Generating PDF & sending…' }])
                    try {
                        await axios.post(`${API_BASE}/admin/send-whatsapp-pdf`, { attemptId, phone })
                        setWAResults([{ name: waIndivName || waIndivEmail, phone, status: '✅ PDF report sent!' }])
                    } catch (err) {
                        const errMsg = err.response?.data?.error || err.message
                        setWAResults([{ name: waIndivName || waIndivEmail, phone, status: `❌ PDF failed: ${errMsg}` }])
                    } finally {
                        setWASending(false)
                    }
                }

                // Parse & prepare bulk — then allow per-row send or send-all
                const sendBulk = () => {
                    setWAJsonError('')
                    let list
                    try { list = JSON.parse(waBulkJson) } catch { setWAJsonError('Invalid JSON. Please fix and retry.'); return }
                    if (!Array.isArray(list) || list.length === 0) { setWAJsonError('JSON must be a non-empty array of objects.'); return }
                    const results = []
                    list.forEach((item, i) => {
                        const { name, email, phone: rawPhone } = item
                        if (!rawPhone) { results.push({ name: name || email || `#${i + 1}`, email, phone: '', msg: '', status: 'Skipped – no phone' }); return }
                        const phone = String(rawPhone).replace(/\D/g, '')
                        const sub = findSub(email, waTestTitle)
                        const msgObj = sub ? { ...sub, studentName: name || sub.studentName } : null
                        const msg = msgObj ? buildMessage(msgObj) : `🎓 *AI Mentor Hub – Test Report*\n\n👤 *Student:* ${name || email}\n📋 *Test:* ${waTestTitle}\n\n⚠️ Report data not available. Please log into the portal.`
                        const attemptId = sub ? (sub.attemptId || sub.id) : null
                        results.push({ name: name || email || `#${i + 1}`, email, phone, msg, attemptId, status: 'Ready' })
                    })
                    setWAResults(results)
                }

                const sendOneBulkRow = async (idx) => {
                    const row = waResults[idx]
                    if (!row.phone || !row.msg) return
                    setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'Sending…' } : r))
                    try {
                        await axios.post(`${API_BASE}/admin/send-whatsapp`, { phone: row.phone, message: row.msg })
                        setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: '✅ Text sent' } : r))
                    } catch (err) {
                        const errMsg = err.response?.data?.error || err.message
                        setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: `❌ ${errMsg}` } : r))
                    }
                }

                const sendOneBulkPDF = async (idx) => {
                    const row = waResults[idx]
                    if (!row.phone) return
                    if (!row.attemptId) { setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: '❌ No CRT attempt found' } : r)); return }
                    setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: '⏳ Generating PDF…' } : r))
                    try {
                        await axios.post(`${API_BASE}/admin/send-whatsapp-pdf`, { attemptId: row.attemptId, phone: row.phone })
                        setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: '✅ PDF sent' } : r))
                    } catch (err) {
                        const errMsg = err.response?.data?.error || err.message
                        setWAResults(prev => prev.map((r, i) => i === idx ? { ...r, status: `❌ PDF: ${errMsg}` } : r))
                    }
                }

                const sendAllBulk = async () => {
                    setWASending(true)
                    for (let i = 0; i < waResults.length; i++) {
                        if (waResults[i].phone && waResults[i].msg && !waResults[i].status?.startsWith('✅')) {
                            await sendOneBulkRow(i)
                            await new Promise(r => setTimeout(r, 700)) // brief gap between sends
                        }
                    }
                    setWASending(false)
                }

                const typeLabel = { crt: 'Round Test', global: 'Global Test', mcq: 'MCQ', aptitude: 'Aptitude' }

                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                        onClick={() => setShowWAModal(false)}>
                        <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid #374151', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                            {/* Header */}
                            <div style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)', padding: '20px 24px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.8rem' }}>📲</span>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>Send Report via WhatsApp</div>
                                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', marginTop: '2px' }}>Step {waStep} of 4</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowWAModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>

                            {/* Step indicator */}
                            <div style={{ display: 'flex', padding: '16px 24px 0', gap: '6px' }}>
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} style={{ flex: 1, height: '4px', borderRadius: '4px', background: waStep >= n ? '#25d366' : '#374151', transition: 'background 0.3s' }}></div>
                                ))}
                            </div>

                            <div style={{ padding: '24px' }}>

                                {/* Step 1: Test Type */}
                                {waStep === 1 && (
                                    <div>
                                        <div style={{ color: '#e5e7eb', fontWeight: 800, fontSize: '1rem', marginBottom: '16px' }}>1. Choose Test Type</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {[
                                                { key: 'crt', label: 'Round Test', icon: '🏢', desc: `${crtSubmissions.length} submissions` },
                                                { key: 'global', label: 'Global Test', icon: '🌐', desc: `${globalSubmissions.length} submissions` },
                                                { key: 'mcq', label: 'MCQ', icon: '🔢', desc: `${mcqSubmissions.length} submissions` },
                                                { key: 'aptitude', label: 'Aptitude', icon: '📝', desc: `${aptitudeSubmissions.length} submissions` },
                                            ].map(t => (
                                                <button key={t.key} onClick={() => { setWATestType(t.key); setWATestTitle('') }}
                                                    style={{ padding: '16px', border: waTestType === t.key ? '2px solid #25d366' : '1px solid #374151', borderRadius: '14px', background: waTestType === t.key ? 'rgba(37,211,102,0.1)' : '#1e293b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t.icon}</div>
                                                    <div style={{ color: waTestType === t.key ? '#25d366' : '#e5e7eb', fontWeight: 800, fontSize: '0.9rem' }}>{t.label}</div>
                                                    <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '2px' }}>{t.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <button onClick={() => setWAStep(2)} style={{ padding: '10px 24px', background: '#25d366', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Next →</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Test Title */}
                                {waStep === 2 && (
                                    <div>
                                        <div style={{ color: '#e5e7eb', fontWeight: 800, fontSize: '1rem', marginBottom: '16px' }}>2. Select Test Title <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>({typeLabel[waTestType]})</span></div>
                                        {availTitles.length === 0 ? (
                                            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem' }}>No submissions found for this test type.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                                                {availTitles.map(t => (
                                                    <button key={t} onClick={() => setWATestTitle(t)}
                                                        style={{ padding: '12px 16px', border: waTestTitle === t ? '2px solid #25d366' : '1px solid #374151', borderRadius: '10px', background: waTestTitle === t ? 'rgba(37,211,102,0.1)' : '#1e293b', cursor: 'pointer', textAlign: 'left', color: waTestTitle === t ? '#25d366' : '#e5e7eb', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s' }}>
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                            <button onClick={() => setWAStep(1)} style={{ padding: '10px 20px', background: '#374151', border: 'none', borderRadius: '10px', color: '#e5e7eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
                                            <button onClick={() => setWAStep(3)} disabled={!waTestTitle} style={{ padding: '10px 24px', background: waTestTitle ? '#25d366' : '#374151', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: waTestTitle ? 'pointer' : 'not-allowed', fontSize: '0.9rem', opacity: waTestTitle ? 1 : 0.5 }}>Next →</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Send Mode */}
                                {waStep === 3 && (
                                    <div>
                                        <div style={{ color: '#e5e7eb', fontWeight: 800, fontSize: '1rem', marginBottom: '16px' }}>3. How do you want to send?</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            {[
                                                { key: 'individual', label: 'Individual', icon: '👤', desc: 'Send to one student by entering their details' },
                                                { key: 'bulk', label: 'Bulk Send', icon: '👥', desc: 'Upload a JSON list of students with phone numbers' },
                                            ].map(m => (
                                                <button key={m.key} onClick={() => setWASendMode(m.key)}
                                                    style={{ padding: '20px 16px', border: waSendMode === m.key ? '2px solid #25d366' : '1px solid #374151', borderRadius: '14px', background: waSendMode === m.key ? 'rgba(37,211,102,0.1)' : '#1e293b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{m.icon}</div>
                                                    <div style={{ color: waSendMode === m.key ? '#25d366' : '#e5e7eb', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>{m.label}</div>
                                                    <div style={{ color: '#9ca3af', fontSize: '0.78rem', lineHeight: 1.4 }}>{m.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                            <button onClick={() => setWAStep(2)} style={{ padding: '10px 20px', background: '#374151', border: 'none', borderRadius: '10px', color: '#e5e7eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
                                            <button onClick={() => { setWAResults([]); setWAStep(4); }} style={{ padding: '10px 24px', background: '#25d366', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Next →</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Details + Send */}
                                {waStep === 4 && (
                                    <div>
                                        <div style={{ color: '#e5e7eb', fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>4. {waSendMode === 'individual' ? 'Enter Student Details' : 'Upload Student List (JSON)'}</div>
                                        <div style={{ color: '#6b7280', fontSize: '0.78rem', marginBottom: '16px' }}>Test: <strong style={{ color: '#a855f7' }}>{waTestTitle}</strong> ({typeLabel[waTestType]})</div>

                                        {waSendMode === 'individual' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Student Name</label>
                                                    <input value={waIndivName} onChange={e => setWAIndivName(e.target.value)} placeholder="e.g. Akshaya" style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Login Email (Username)</label>
                                                    <input value={waIndivEmail} onChange={e => setWAIndivEmail(e.target.value)} placeholder="student@example.com" style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>WhatsApp Phone Number</label>
                                                    <input value={waIndivPhone} onChange={e => setWAIndivPhone(e.target.value)} placeholder="91XXXXXXXXXX (with country code)" style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                                                </div>
                                                <button onClick={sendIndividual} disabled={!waIndivPhone || waSending}
                                                    style={{ marginTop: '8px', padding: '14px', background: '#25d366', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: (waIndivPhone && !waSending) ? 'pointer' : 'not-allowed', opacity: (waIndivPhone && !waSending) ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <span>{waSending ? '⏳' : '📲'}</span> {waSending ? 'Sending…' : 'Send Text Report'}
                                                </button>
                                                {waTestType === 'crt' && (
                                                    <button onClick={sendIndividualPDF} disabled={!waIndivPhone || !waIndivEmail || waSending}
                                                        style={{ padding: '14px', background: '#7c3aed', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: (waIndivPhone && waIndivEmail && !waSending) ? 'pointer' : 'not-allowed', opacity: (waIndivPhone && waIndivEmail && !waSending) ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <span>{waSending ? '⏳' : '📄'}</span> {waSending ? 'Generating PDF…' : 'Send as PDF Report'}
                                                    </button>
                                                )}
                                                {waResults.length > 0 && (
                                                    <div style={{ padding: '12px 16px', background: waResults[0].status?.startsWith('✅') ? 'rgba(37,211,102,0.1)' : waResults[0].status?.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${waResults[0].status?.startsWith('✅') ? 'rgba(37,211,102,0.3)' : waResults[0].status?.startsWith('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: '10px', color: waResults[0].status?.startsWith('✅') ? '#25d366' : waResults[0].status?.startsWith('❌') ? '#f87171' : '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {waResults[0].status} — <strong>{waResults[0].name}</strong> ({waResults[0].phone})
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ padding: '12px 14px', background: '#1e293b', border: '1px solid #374151', borderRadius: '10px', fontSize: '0.78rem', color: '#9ca3af', fontFamily: 'monospace', lineHeight: 1.6 }}>
                                                    {`Example format:\n[\n  { "name": "Akshaya", "email": "akshaya@example.com", "phone": "919876543210" },\n  { "name": "Chandra",  "email": "chandra@example.com",  "phone": "919876543211" }\n]`}
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Paste JSON List</label>
                                                    <textarea value={waBulkJson} onChange={e => { setWABulkJson(e.target.value); setWAJsonError(''); setWAResults([]); }}
                                                        rows={8} placeholder='[{"name":"...","email":"...","phone":"91..."}]'
                                                        style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: `1px solid ${waJsonError ? '#ef4444' : '#374151'}`, borderRadius: '10px', color: '#e5e7eb', fontSize: '0.82rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                                                    {waJsonError && <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px' }}>⚠️ {waJsonError}</div>}
                                                </div>
                                                <button onClick={sendBulk} disabled={!waBulkJson.trim() || waSending}
                                                    style={{ padding: '12px', background: '#1d4ed8', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: waBulkJson.trim() ? 'pointer' : 'not-allowed', opacity: waBulkJson.trim() ? 1 : 0.5 }}>
                                                    📋 Preview Students
                                                </button>
                                                {waResults.length > 0 && (
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                {waResults.length} student{waResults.length !== 1 ? 's' : ''}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={sendAllBulk} disabled={waSending || waResults.every(r => r.status?.startsWith('✅') || !r.phone)}
                                                                    style={{ padding: '8px 16px', background: waSending ? '#374151' : '#25d366', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: waSending ? 'not-allowed' : 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    {waSending ? '⏳ Sending…' : '🚀 Send All Text'}
                                                                </button>
                                                                {waTestType === 'crt' && (
                                                                    <button onClick={async () => { setWASending(true); for (let i = 0; i < waResults.length; i++) { if (waResults[i].phone && waResults[i].attemptId && !waResults[i].status?.startsWith('✅')) { await sendOneBulkPDF(i); await new Promise(r => setTimeout(r, 1500)); } } setWASending(false); }} disabled={waSending}
                                                                        style={{ padding: '8px 16px', background: waSending ? '#374151' : '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: waSending ? 'not-allowed' : 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {waSending ? '⏳' : '📄'} Send All PDF
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                                                            {waResults.map((r, i) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#1e293b', borderRadius: '10px', border: `1px solid ${r.status?.startsWith('✅') ? 'rgba(37,211,102,0.3)' : r.status?.startsWith('❌') ? 'rgba(239,68,68,0.3)' : '#374151'}` }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '0.85rem' }}>{r.name}</div>
                                                                        <div style={{ color: r.status?.startsWith('✅') ? '#25d366' : r.status?.startsWith('❌') ? '#f87171' : '#6b7280', fontSize: '0.72rem' }}>{r.phone || 'no phone'} · {r.status}</div>
                                                                    </div>
                                                                    {r.phone && !r.status?.startsWith('✅') && (
                                                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                                            <button onClick={() => sendOneBulkRow(i)} disabled={waSending || r.status === 'Sending…'}
                                                                                style={{ padding: '7px 12px', background: '#25d366', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                                                                📲
                                                                            </button>
                                                                            {waTestType === 'crt' && r.attemptId && (
                                                                                <button onClick={() => sendOneBulkPDF(i)} disabled={waSending || r.status?.includes('⏳')}
                                                                                    style={{ padding: '7px 12px', background: '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                                                                    📄
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {r.status?.startsWith('✅') && <span style={{ color: '#25d366', fontSize: '1rem', flexShrink: 0 }}>✅</span>}
                                                                    {r.status?.startsWith('❌') && <span style={{ color: '#f87171', fontSize: '1rem', flexShrink: 0 }}>❌</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '16px' }}>
                                            <button onClick={() => setWAStep(3)} style={{ padding: '10px 20px', background: '#374151', border: 'none', borderRadius: '10px', color: '#e5e7eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>← Back</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}

// ==================== ADMIN CRT REPORT MODAL ====================
function AdminCRTReportModal({ submission, reportData, loading, onClose }) {
    const [activeReportTab, setActiveReportTab] = useState('overview')
    const [selectedSection, setSelectedSection] = useState(null)

    const SECTION_DEFS = {
        aptitude: { label: 'Aptitude', icon: '🧮', color: '#f59e0b' },
        verbal: { label: 'Verbal', icon: '📝', color: '#06b6d4' },
        logical: { label: 'Logical', icon: '🧠', color: '#8b5cf6' },
        reasoning: { label: 'Reasoning', icon: '🔍', color: '#ec4899' },
        technical_mcq: { label: 'Technical MCQ', icon: '💻', color: '#a855f7' },
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
    const passPercentage = attempt?.pass_percentage || 60
    const passed = overallScore >= passPercentage

    const answersBySection = {}
    answers.forEach(a => {
        if (!answersBySection[a.section]) answersBySection[a.section] = []
        answersBySection[a.section].push(a)
    })

    const fmtDur = secs => {
        if (secs === undefined || secs === null) return '—';
        if (secs <= 0) return '0s';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h ${m}m`;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    const reportTabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart2 size={15} /> },
        { id: 'section', label: 'Section Analysis', icon: <Layers size={15} /> },
        { id: 'time', label: 'Time Analysis', icon: <Clock size={15} /> },
    ]

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: '20px 16px', overflowY: 'auto' }}>
            <div className="modal-content p-0" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '920px', background: '#111827', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>

                {/* Header (Solid Orange) */}
                <div style={{ background: '#1f2937', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '2px solid #7c3aed' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STUDENT CRT REPORT
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, minWidth: 0, overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {submission?.studentName || 'Student'} | {attempt?.company_name || 'Round Test'} | ID: {attempt?.student_id || submission?.studentId}
                        </span>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '8px', padding: 0, opacity: 0.8, flexShrink: 0 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: '0 24px 24px', flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#7c3aed' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 1rem', borderColor: '#7c3aed', borderTopColor: 'transparent' }}></div>
                            <span style={{ fontWeight: 600, color: '#a855f7' }}>Loading report details...</span>
                        </div>
                    ) : !reportData ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#a855f7', fontWeight: 700 }}>No report data available.</div>
                    ) : (
                        <>
                            {/* ═══ HERO CARD (matches screenshot) ═══ */}
                            {(() => {
                                const totalCorrectH = sections.reduce((s, sec) => s + (sectionScores[sec]?.correct || 0), 0);
                                const totalQsH = sections.reduce((s, sec) => s + (sectionScores[sec]?.total || 0), 0);
                                const pctH = Math.round(overallScore);
                                const testDate = attempt?.completed_at ? new Date(attempt.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                                const classAvg = attempt?.class_average ?? '—';
                                const rank = attempt?.rank ?? '—';
                                const totalP = attempt?.total_participants ?? '—';
                                const percentile = attempt?.percentile ?? '—';
                                const sectionLabels = sections.map(s => SECTION_DEFS[s]?.label || s).join(', ');
                                const truncSections = sectionLabels.length > 28 ? sectionLabels.slice(0, 28) + '...' : sectionLabels;
                                return (
                                    <div style={{ background: 'linear-gradient(135deg, #170032 0%, #5b21b6 50%, #7c3aed 100%)', borderRadius: '18px', padding: '28px 32px 24px', margin: '20px 0 0', color: 'white' }}>
                                        {/* Top row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{attempt?.title || 'FIRST ROUND'}</h2>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500, marginTop: 6 }}>
                                                    {testDate}{attempt?.difficulty ? ` · ${attempt.difficulty}` : ''}{attempt?.duration_minutes ? ` · ${attempt.duration_minutes} min` : ''}
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', borderRadius: '24px', padding: '8px 20px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.25)' }}>
                                                {attempt?.company_name || 'Round Test'}
                                            </div>
                                        </div>

                                        {/* Score ring */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                            <div style={{ width: 150, height: 150, position: 'relative' }}>
                                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${pctH}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
                                                </svg>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                    <div style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1 }}>{pctH}</div>
                                                    <div style={{ width: 30, height: 2, background: 'rgba(255,255,255,0.5)', margin: '4px 0' }}></div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.85 }}>100</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.85, marginTop: 8 }}>Class average : {classAvg}</div>
                                        </div>

                                        {/* 3 stat cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', borderRadius: '14px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>🏆 Rank</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>{rank}<span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7 }}>/{totalP}</span></div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.75, marginTop: 4 }}>{percentile} percentile</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', borderRadius: '14px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>📄 Questions</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>{totalCorrectH}<span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7 }}>/{totalQsH}</span></div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.75, marginTop: 4 }}>Correct answers</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', borderRadius: '14px', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>📊 Sections</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>{sections.length}</div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.75, marginTop: 4 }}>{truncSections}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* ═══ QUESTION BREAKDOWN PANEL ═══ */}
                            {answers.length > 0 && (() => {
                                const totalQ = sections.reduce((s, sec) => s + (sectionScores[sec]?.total || 0), 0) || answers.length;
                                const correctQ = answers.filter(a => a.is_correct).length;
                                const attemptedQ = answers.filter(a => a.student_answer !== null && a.student_answer !== undefined && a.student_answer !== '').length;
                                const wrongQ = answers.filter(a => !a.is_correct && a.student_answer !== null && a.student_answer !== undefined && a.student_answer !== '').length;
                                const missedQ = totalQ - attemptedQ;
                                const stats = [
                                    { label: 'Total', value: totalQ, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', icon: '📋' },
                                    { label: 'Attempted', value: attemptedQ, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '✏️' },
                                    { label: 'Correct', value: correctQ, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✅' },
                                    { label: 'Wrong', value: wrongQ, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌' },
                                    { label: 'Missed', value: missedQ < 0 ? 0 : missedQ, color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', icon: '⏭️' },
                                ];
                                return (
                                    <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #374151', padding: '20px 24px', margin: '16px 0 0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            📊 Question Breakdown
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                            {stats.map((s, i) => (
                                                <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '14px', padding: '16px 12px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.3px' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ marginTop: '14px' }}>
                                            <div style={{ display: 'flex', height: '8px', borderRadius: '8px', overflow: 'hidden', gap: '2px' }}>
                                                {totalQ > 0 && <>
                                                    <div style={{ width: `${(correctQ / totalQ) * 100}%`, background: '#10b981', borderRadius: '8px 0 0 8px', transition: 'width 1s ease' }} title={`Correct: ${correctQ}`}></div>
                                                    <div style={{ width: `${(wrongQ / totalQ) * 100}%`, background: '#ef4444', transition: 'width 1s ease' }} title={`Wrong: ${wrongQ}`}></div>
                                                    <div style={{ width: `${((missedQ < 0 ? 0 : missedQ) / totalQ) * 100}%`, background: '#374151', borderRadius: '0 8px 8px 0', transition: 'width 1s ease' }} title={`Missed: ${missedQ < 0 ? 0 : missedQ}`}></div>
                                                </>}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#6b7280' }}>
                                                <span style={{ color: '#10b981' }}>● Correct {totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0}%</span>
                                                <span style={{ color: '#ef4444' }}>● Wrong {totalQ > 0 ? Math.round((wrongQ / totalQ) * 100) : 0}%</span>
                                                <span style={{ color: '#64748b' }}>● Missed {totalQ > 0 ? Math.round(((missedQ < 0 ? 0 : missedQ) / totalQ) * 100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Tabs */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <div style={{ background: '#1e293b', border: '1px solid #374151', borderRadius: '30px', display: 'flex', padding: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                                    {reportTabs.map(tab => (
                                        <button key={tab.id} onClick={() => { setActiveReportTab(tab.id); if (tab.id !== 'section') setSelectedSection(null); }}
                                            style={{
                                                padding: '10px 20px', border: 'none', cursor: 'pointer',
                                                background: activeReportTab === tab.id ? 'linear-gradient(135deg, #5b21b6, #a855f7)' : 'transparent',
                                                color: activeReportTab === tab.id ? 'white' : '#9ca3af',
                                                fontSize: '0.85rem', fontWeight: 800,
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                borderRadius: '30px',
                                                boxShadow: activeReportTab === tab.id ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
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
                                        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #374151', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                            <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}><BarChart2 size={18} color="#a855f7" /> Overall Performance</h3>
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                                <div style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', borderRadius: '16px', padding: '24px 20px', flex: 1, border: '1px solid #4b5563' }}>
                                                    <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>{pct}%</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7', marginTop: '8px' }}>Grade: {grade}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 600, marginTop: 4 }}>{totalCorrect} of {totalQs} correct</div>
                                                </div>
                                                <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
                                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3.5" />
                                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeDasharray={`${pct}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
                                                    </svg>
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed' }}>{totalCorrect}</div>
                                                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Correct</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800, color: '#a855f7' }}>Performance Breakdown</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {[
                                                    { label: 'Proficient (≥80%)', color: '#10b981', count: sections.filter(s => (sectionScores[s]?.score || 0) >= 80).length },
                                                    { label: 'Above Avg (60-79%)', color: '#a855f7', count: sections.filter(s => { const sc = sectionScores[s]?.score || 0; return sc >= 60 && sc < 80 }).length },
                                                    { label: 'Needs Work (<60%)', color: '#ef4444', count: sections.filter(s => (sectionScores[s]?.score || 0) < 60).length },
                                                ].map((item, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#374151' }}>
                                                        <div style={{ background: item.color, borderRadius: '50%', width: 12, height: 12, flexShrink: 0 }}></div>
                                                        <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: '#e5e7eb' }}>{item.label}</span>
                                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: item.color }}>{item.count}/{sections.length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* RIGHT COL */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #374151', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                                <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}><Layers size={18} color="#a855f7" /> Section Scores</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    {sections.map(sec => {
                                                        const def = SECTION_DEFS[sec]; const ss = sectionScores[sec] || {}; const secPct = Math.round(ss.score || 0);
                                                        const barColor = secPct >= 80 ? '#10b981' : secPct >= 60 ? '#a855f7' : '#ef4444';
                                                        return (
                                                            <div key={sec} onClick={() => { setActiveReportTab('section'); setSelectedSection(sec); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                                                                <span style={{ width: 26, fontSize: '1rem', textAlign: 'center', flexShrink: 0 }}>{def?.icon || '📊'}</span>
                                                                <span style={{ width: 85, fontSize: '0.8rem', fontWeight: 700, color: '#d1d5db', flexShrink: 0 }}>{def?.label || sec}</span>
                                                                <div style={{ flex: 1, height: 18, background: '#374151', borderRadius: 9, overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', width: `${secPct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`, borderRadius: 9, transition: 'width 1s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, minWidth: secPct > 12 ? 'auto' : 0 }}>
                                                                        {secPct > 12 && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'white' }}>{secPct}%</span>}
                                                                    </div>
                                                                </div>
                                                                {secPct <= 12 && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: barColor }}>{secPct}%</span>}
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', flexShrink: 0, width: 40, textAlign: 'right' }}>{ss.correct || 0}/{ss.total || 0}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #374151', padding: '18px', textAlign: 'center', color: 'white' }}>
                                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a855f7' }}>{sections.length}</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Sections</div>
                                                </div>
                                                <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #374151', padding: '18px', textAlign: 'center', color: 'white' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{passed ? '✓ PASS' : '✗ FAIL'}</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Cutoff: {passPercentage}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* TAB: Section Analysis */}
                            {activeReportTab === 'section' && sections.length > 0 && (
                                <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #374151', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                    <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Layers size={18} color="#a855f7" /> Choose a Section to Review
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
                                                        padding: '16px', border: isActive ? '2px solid #7c3aed' : '1px solid #374151',
                                                        borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                                                        background: isActive ? 'rgba(124,58,237,0.15)' : '#111827',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px',
                                                        boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.8rem' }}>{def?.icon || '📊'}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isActive ? '#a855f7' : '#e5e7eb' }}>{def?.label || sec}</div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', marginTop: 4 }}>
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
                                            <div style={{ textAlign: 'center', padding: '3rem', color: '#a855f7', background: '#111827', borderRadius: '16px', fontWeight: 700 }}>
                                                No answers recorded for this section.
                                            </div>
                                        )
                                        return (
                                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed #4b5563', animation: 'fadeIn 0.4s ease-out' }}>
                                                <h4 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', color: '#a855f7' }}>
                                                    {def?.icon} {def?.label || selectedSection} — Question Review
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {secAnswers.map((ans, idx) => {
                                                        const isCode = ans.question_type === 'code' || ['coding', 'debug', 'pseudocode'].includes(ans.section);
                                                        const isSql = ans.question_type === 'sql' || ans.section === 'sql';
                                                        const submittedCode = ans.student_answer || '';
                                                        const execResult = ans.execution_result;
                                                        const testCases = Array.isArray(ans.test_cases) ? ans.test_cases : [];
                                                        return (
                                                            <div key={ans.id || idx} style={{ padding: '16px 20px', background: ans.is_correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{ans.is_correct ? '✅' : '❌'}</span>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6', lineHeight: 1.5 }}>Q{idx + 1}: {ans.question}</div>
                                                                    </div>
                                                                    <span style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, flexShrink: 0, background: ans.is_correct ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: ans.is_correct ? '#34d399' : '#f87171' }}>{Math.round(ans.score || 0)}% Score</span>
                                                                </div>

                                                                {/* MCQ answer display */}
                                                                {ans.question_type === 'mcq' && (
                                                                    <div style={{ marginLeft: '36px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                                        <div style={{ color: ans.is_correct ? '#34d399' : '#f87171', background: ans.is_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                            Student answer: <span style={{ fontWeight: 800, color: '#e5e7eb' }}>{typeof ans.student_answer === 'object' ? JSON.stringify(ans.student_answer) : (ans.student_answer || 'Not answered')}</span>
                                                                        </div>
                                                                        {!ans.is_correct && (
                                                                            <div style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px', fontWeight: 600 }}>
                                                                                Correct answer: <span style={{ fontWeight: 800, color: '#e5e7eb' }}>{typeof ans.correct_answer === 'object' ? JSON.stringify(ans.correct_answer) : ans.correct_answer}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Code submission display */}
                                                                {(isCode || isSql) && (
                                                                    <div style={{ marginLeft: '36px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSql ? '#14b8a6' : '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            {isSql ? '🗄️' : '⌨️'} Student Submission
                                                                        </div>
                                                                        <pre style={{ margin: 0, padding: '14px 16px', background: '#0d1117', border: `1px solid ${isSql ? 'rgba(20,184,166,0.3)' : 'rgba(99,102,241,0.3)'}`, borderRadius: '10px', fontSize: '0.78rem', color: '#e2e8f0', fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '260px', overflowY: 'auto' }}>
                                                                            {submittedCode.trim() || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No code submitted</span>}
                                                                        </pre>

                                                                        {/* Execution / test results */}
                                                                        {execResult && (
                                                                            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '12px 14px' }}>
                                                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Execution Result</div>
                                                                                {typeof execResult === 'object' && execResult.test_results ? (
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                                        {execResult.test_results.slice(0, 6).map((tc, ti) => (
                                                                                            <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 10px', background: tc.passed ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', borderRadius: '8px', border: `1px solid ${tc.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '0.75rem' }}>
                                                                                                <span style={{ flexShrink: 0 }}>{tc.passed ? '✅' : '❌'}</span>
                                                                                                <span style={{ color: '#94a3b8' }}>Test {ti + 1}:</span>
                                                                                                {tc.input !== undefined && <span style={{ color: '#64748b' }}>in: <code style={{ color: '#67e8f9' }}>{String(tc.input).slice(0, 40)}</code></span>}
                                                                                                <span style={{ color: '#64748b' }}>exp: <code style={{ color: '#4ade80' }}>{String(tc.expected || tc.expected_output || '').slice(0, 40)}</code></span>
                                                                                                {!tc.passed && <span style={{ color: '#64748b' }}>got: <code style={{ color: '#f87171' }}>{String(tc.actual || tc.output || '').slice(0, 40)}</code></span>}
                                                                                            </div>
                                                                                        ))}
                                                                                        {execResult.test_results.length > 6 && <div style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'center' }}>+{execResult.test_results.length - 6} more test cases</div>}
                                                                                    </div>
                                                                                ) : (
                                                                                    <pre style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{typeof execResult === 'string' ? execResult : JSON.stringify(execResult, null, 2)}</pre>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Expected output for code */}
                                                                        {isCode && ans.expected_output && !ans.is_correct && (
                                                                            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                                                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>Expected Output</div>
                                                                                <pre style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{ans.expected_output}</pre>
                                                                            </div>
                                                                        )}

                                                                        {/* SQL schema hint */}
                                                                        {isSql && ans.sql_schema && (
                                                                            <details style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}>
                                                                                <summary style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5eead4', userSelect: 'none' }}>🗄️ SQL Schema (reference)</summary>
                                                                                <pre style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{ans.sql_schema}</pre>
                                                                            </details>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
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
                                    <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #374151', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                        <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Clock size={18} color="#a855f7" /> Time Allocation Analysis
                                        </h3>

                                        {/* Summary Cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                            <div style={{ background: 'linear-gradient(135deg, #1f2937, #374151)', border: '1px solid #4b5563', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a855f7' }}>{fmtDur(totalTimeSecsAdmin)}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginTop: 4 }}>Time Spent</div>
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #1f2937, #374151)', border: '1px solid #4b5563', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#c084fc' }}>{totalAllocatedSecs > 0 ? fmtDur(totalAllocatedSecs) : '—'}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginTop: 4 }}>Allocated</div>
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #1f2937, #374151)', border: '1px solid #4b5563', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: totalAllocatedSecs > 0 && totalTimeSecsAdmin > totalAllocatedSecs ? '#ef4444' : '#10b981' }}>
                                                    {totalAllocatedSecs > 0 ? `${Math.min(100, Math.round((totalTimeSecsAdmin / totalAllocatedSecs) * 100))}%` : '—'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginTop: 4 }}>Utilization</div>
                                            </div>
                                        </div>

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
                                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e5e7eb' }}>{def?.label || sec}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                {allocatedSecs > 0 && (
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: overTime ? '#f87171' : '#34d399', background: overTime ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: '12px' }}>
                                                                        {utilizationPct}% Used
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#a855f7' }}>{fmtDur(secSecs)}</span>
                                                                {allocatedSecs > 0 && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/ {fmtDur(allocatedSecs)}</span>}
                                                            </div>
                                                        </div>

                                                        <div style={{ height: 14, background: '#374151', borderRadius: 7, position: 'relative', overflow: 'hidden' }}>
                                                            {allocBarPct > 0 && (
                                                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${allocBarPct}%`, background: 'rgba(168,85,247,0.1)', borderRight: '2px solid #7c3aed' }} />
                                                            )}
                                                            <div style={{ position: 'relative', height: '100%', width: `${barPct}%`, background: overTime ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#5b21b6,#a855f7)', borderRadius: 7, transition: 'width 1s ease-out' }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Legend */}
                                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #374151', display: 'flex', gap: '20px', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 8, borderRadius: 3, background: 'linear-gradient(90deg,#5b21b6,#a855f7)', display: 'inline-block' }} /> Time Spent</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 8, borderRadius: 3, background: 'rgba(168,85,247,0.1)', border: '1px solid #7c3aed', display: 'inline-block' }} /> Allocated Time</span>
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



// ==================== ADMIN ML REPORT MODAL ====================
function AdminMLReportModal({ submission, onClose }) {
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
                    {/* Student Info */}
                    <div style={{
                        marginBottom: '1.5rem', padding: '1rem',
                        background: 'var(--bg-tertiary)', borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Name</span>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{submission.studentName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submitted On</span>
                            <div style={{ fontWeight: 500 }}>{new Date(submission.submittedAt).toLocaleString()}</div>
                        </div>
                    </div>

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

// ==================== ADMIN SUBMISSION REPORT MODAL ====================
function AdminSubmissionReportModal({ submission, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <div className="modal-title-with-icon">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: submission.status === 'accepted' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #ef4444, #f59e0b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={20} color="white" />
                        </div>
                        <h2>Detailed Submission Report</h2>
                    </div>
                    <button onClick={onClose} className="modal-close"><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* Student & Submission Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem',
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.1)'
                    }}>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Student Name</span>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600, fontSize: '1.1rem' }}>{submission.studentName}</p>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Submitted At</span>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{new Date(submission.submittedAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Language</span>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{submission.language}</p>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Submission Type</span>
                            <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{submission.submissionType === 'file' ? 'File Upload' : 'Code Editor'}</p>
                        </div>
                    </div>

                    {/* Score & Status */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '3rem',
                        marginBottom: '2rem',
                        padding: '2rem',
                        background: submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '1rem',
                        border: `1px solid ${submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: submission.status === 'accepted' ? '#10b981' : '#ef4444' }}>
                                {submission.score}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>AI Evaluation Score</div>
                        </div>
                        <div style={{
                            padding: '1rem 2rem',
                            borderRadius: '1rem',
                            background: submission.status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: submission.status === 'accepted' ? '#10b981' : '#ef4444',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {submission.status === 'accepted' ? <CheckCircle size={24} /> : <X size={24} />}
                            {submission.status?.toUpperCase()}
                        </div>
                    </div>

                    {/* Plagiarism Warning */}
                    {submission.plagiarism?.detected && (
                        <div className="plagiarism-banner" style={{ marginBottom: '1.5rem' }}>
                            <AlertTriangle size={24} color="#ef4444" />
                            <div>
                                <strong style={{ color: '#ef4444' }}>Plagiarism Detected</strong>
                                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>
                                    This code matches a submission from {submission.plagiarism.copiedFromName}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Proctoring Violations Section */}
                    {(submission.tabSwitches > 0 || submission.copyPasteAttempts > 0 || submission.cameraBlockedCount > 0 || submission.phoneDetectionCount > 0) && (
                        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
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
                            {submission.proctoringVideo && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem' }}>🎥</span>
                                    <span style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Proctoring video recorded: {submission.proctoringVideo}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Feedback */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={18} color="#3b82f6" /> AI Feedback
                        </h4>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                            {submission.feedback || 'No feedback provided.'}
                        </p>
                    </div>

                    {/* AI Explanation */}
                    {submission.aiExplanation && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color="#8b5cf6" /> AI Explanation (Why this score?)
                            </h4>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', background: 'rgba(139, 92, 246, 0.05)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                {submission.aiExplanation}
                            </p>
                        </div>
                    )}

                    {/* Detailed Analysis */}
                    {submission.analysis && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BarChart2 size={18} color="var(--primary)" /> Detailed Analysis
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {submission.analysis.correctness !== undefined && (
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <CheckCircle size={22} color="#3b82f6" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Correctness</span>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6' }}>{submission.analysis.correctness}</p>
                                        </div>
                                    </div>
                                )}
                                {submission.analysis.efficiency !== undefined && (
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Zap size={22} color="#10b981" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Efficiency</span>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>{submission.analysis.efficiency}</p>
                                        </div>
                                    </div>
                                )}
                                {submission.analysis.codeStyle !== undefined && (
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Code size={22} color="#8b5cf6" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Code Style</span>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#8b5cf6' }}>{submission.analysis.codeStyle}</p>
                                        </div>
                                    </div>
                                )}
                                {submission.analysis.bestPractices !== undefined && (
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Award size={22} color="#f59e0b" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Best Practices</span>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>{submission.analysis.bestPractices}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Code Preview */}
                    <div>
                        <h4 style={{ margin: '0 0 0.75rem' }}>Submitted Code</h4>
                        <pre style={{
                            background: '#020617',
                            padding: '1.5rem',
                            borderRadius: '0.5rem',
                            overflow: 'auto',
                            maxHeight: '300px',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            color: '#e2e8f0',
                            border: '1px solid #334155'
                        }}>
                            {submission.code}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==================== GLOBAL TASKS COMPONENT ====================
function GlobalTasks() {
    const user = useAuth()?.user
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showAIChat, setShowAIChat] = useState(false)
    const [uploading, setUploading] = useState(false)
    const csvInputRef = useRef(null)
    const [task, setTask] = useState({
        title: '',
        type: 'machine_learning',
        difficulty: 'medium',
        description: '',
        requirements: '',
        deadline: '',
        maxAttempts: 0
    })

    // Student allocation states
    const [showStudentAllocationModal, setShowStudentAllocationModal] = useState(false)
    const [allStudents, setAllStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [originallyAllocated, setOriginallyAllocated] = useState([])
    const [allocatingTaskId, setAllocatingTaskId] = useState(null)
    const [studentSearchTerm, setStudentSearchTerm] = useState('')
    const [taskSearchTerm, setTaskSearchTerm] = useState('')

    // AI Chatbot handler - auto-fills the task form
    const handleAIGenerate = (generated) => {
        setTask({
            title: generated.title || '',
            type: generated.type || 'machine_learning',
            difficulty: generated.difficulty || 'medium',
            description: generated.description || '',
            requirements: generated.requirements || '',
            deadline: task.deadline,
            maxAttempts: task.maxAttempts
        })
        setShowAIChat(false)
        setShowModal(true)
    }

    const fetchTasks = () => {
        axios.get(`${API_BASE}/tasks?mentorId=${user?.id}`)
            .then(res => {
                setTasks(Array.isArray(res.data) ? res.data : (res.data?.data || []))
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchAllStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users?role=student`)
            setAllStudents(Array.isArray(res.data) ? res.data : [])
        } catch (e) { console.error('Error fetching students:', e) }
    }

    const openStudentAllocationModal = async (taskId) => {
        setAllocatingTaskId(taskId)
        setStudentSearchTerm('')
        setSelectedStudents([])
        setOriginallyAllocated([])
        await fetchAllStudents()

        try {
            const res = await axios.get(`${API_BASE}/tests/${taskId}/allocated-students`)
            const existing = res.data.studentIds || []
            setSelectedStudents(existing)
            setOriginallyAllocated(existing)
        } catch (e) {
            console.error(e)
            setSelectedStudents([])
            setOriginallyAllocated([])
        }
        setShowStudentAllocationModal(true)
    }

    const toggleStudentSelection = (studentId) => {
        // Cannot deselect already-allocated students
        if (originallyAllocated.includes(studentId)) return
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const saveStudentAllocations = async () => {
        try {
            await axios.post(`${API_BASE}/tests/${allocatingTaskId}/allocate-students`, {
                studentIds: selectedStudents
            })
            alert('Students assigned successfully!')
            setShowStudentAllocationModal(false)
        } catch (e) {
            alert('Error assigning students: ' + (e.response?.data?.error || e.message))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_BASE}/tasks`, { ...task, mentorId: user?.id })
            setShowModal(false)
            setTask({
                title: '', type: 'machine_learning', difficulty: 'medium',
                description: '', requirements: '', deadline: '', maxAttempts: 0
            })
            fetchTasks()
        } catch (error) {
            alert('Error creating global task')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await axios.delete(`${API_BASE}/tasks/${id}`)
                fetchTasks()
            } catch (error) {
                alert('Error deleting task')
            }
        }
    }

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        e.target.value = ''
        setUploading(true)
        try {
            const text = await file.text()
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
            if (lines.length < 2) { alert('CSV must have a header row and at least one data row'); setUploading(false); return }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
            const rows = lines.slice(1)
            let created = 0
            for (const row of rows) {
                const vals = row.match(/(".*?"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
                const obj = {}
                headers.forEach((h, i) => { obj[h] = vals[i] || '' })
                const taskData = {
                    title: obj.title || obj.name || '',
                    type: obj.type || 'machine_learning',
                    difficulty: obj.difficulty || 'medium',
                    description: obj.description || '',
                    requirements: obj.requirements || '',
                    deadline: obj.deadline || '',
                    mentorId: user?.id
                }
                if (!taskData.title) continue
                await axios.post(`${API_BASE}/tasks`, taskData)
                created++
            }
            alert(`Successfully created ${created} tasks from CSV!`)
            fetchTasks()
        } catch (err) { alert('Error parsing CSV: ' + err.message) }
        setUploading(false)
    }

    if (loading) return <div className="loading-spinner"></div>

    return (
        <div className="animate-fadeIn">
            {/* Hero Section */}
            <div className="admin-hero-card glass" style={{
                background: 'var(--bg-card)',
                borderRadius: '1.5rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '1rem',
                                background: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 32px var(--primary-alpha)'
                            }}>
                                <Globe size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                    Global Tasks Management
                                </h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                    Create ML/AI tasks visible to all mentors and their students
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={taskSearchTerm}
                                onChange={(e) => setTaskSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.9rem',
                                    width: '220px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <input type="file" ref={csvInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            className="btn-create-new premium-btn"
                            disabled={uploading}
                            style={{
                                padding: '0.85rem 1.25rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                opacity: uploading ? 0.6 : 1
                            }}
                        >
                            <Upload size={18} /> {uploading ? 'Uploading...' : 'CSV Upload'}
                        </button>
                        <button
                            onClick={() => setShowAIChat(true)}
                            className="btn-create-new premium-btn"
                            style={{
                                padding: '0.85rem 1.25rem',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                        >
                            <Sparkles size={18} /> AI Generate
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-create-new premium-btn"
                            style={{
                                padding: '0.85rem 1.5rem',
                                background: 'var(--primary)',
                                borderRadius: '0.75rem',
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}
                        >
                            <Plus size={18} /> Create Manual
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--primary-alpha)', color: 'var(--primary)' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Tasks</span>
                        <span className="stat-value">{tasks.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--success-alpha)', color: 'var(--success)' }}>
                        <Zap size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Live Tasks</span>
                        <span className="stat-value">{tasks.filter(t => t.status === 'live').length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--secondary-alpha)', color: 'var(--secondary)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Completions</span>
                        <span className="stat-value">{tasks.reduce((acc, t) => acc + (t.completedBy?.length || 0), 0)}</span>
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
                {tasks.filter(t =>
                    (t.title || '').toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                    (t.description || '').toLowerCase().includes(taskSearchTerm.toLowerCase())
                ).length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <Globe size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <h3>{taskSearchTerm ? 'No matching tasks' : 'No Global Tasks Yet'}</h3>
                        <p>{taskSearchTerm ? 'Try a different search term.' : 'Create your first global task to make it visible to all students!'}</p>
                    </div>
                ) : (
                    tasks.filter(t =>
                        (t.title || '').toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(taskSearchTerm.toLowerCase())
                    ).map(t => (
                        <div key={t.id} className="item-card glass" style={{
                            minHeight: '280px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div className="item-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        padding: '10px',
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                                        borderRadius: '10px'
                                    }}>
                                        <Globe size={20} color="#3b82f6" />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>GLOBAL TASK</span>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h3>
                                    </div>
                                </div>
                                <span className={`status-badge ${t.status}`}>{t.status}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>{t.description}</p>

                            {t.requirements && (
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <strong style={{ color: '#60a5fa' }}>Requirements:</strong><br />
                                    {t.requirements.split('\n').slice(0, 2).join('\n')}...
                                </div>
                            )}

                            <div className="item-card-footer" style={{ paddingTop: '1rem', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className={`difficulty-badge ${t.difficulty?.toLowerCase()}`}>{t.difficulty}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t.completedBy?.length || 0} completed
                                    </span>
                                    {t.maxAttempts > 0 && (
                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            Max Attempts: {t.maxAttempts}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => openStudentAllocationModal(t.id)}
                                    className="btn-create-new"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.8rem',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        color: '#8b5cf6',
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                >
                                    <Users size={16} /> Assign
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showStudentAllocationModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowStudentAllocationModal(false)
                    setStudentSearchTerm('')
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="modal-title-with-icon">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Assign Students</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select students for this task</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setShowStudentAllocationModal(false)
                                setStudentSearchTerm('')
                            }} className="modal-close"><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or batch..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 1rem 0.7rem 2.5rem',
                                        borderRadius: '10px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-main)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    )
                                    // Only toggle non-locked students
                                    const toggleable = filtered.filter(s => !originallyAllocated.includes(s.id))
                                    const allToggleableSelected = toggleable.every(s => selectedStudents.includes(s.id))
                                    if (allToggleableSelected) {
                                        // Deselect only non-locked students
                                        setSelectedStudents(prev => prev.filter(id =>
                                            originallyAllocated.includes(id) || !toggleable.map(s => s.id).includes(id)
                                        ))
                                    } else {
                                        setSelectedStudents(prev => [...new Set([...prev, ...toggleable.map(s => s.id)])])
                                    }
                                }}
                                style={{
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).filter(s => !originallyAllocated.includes(s.id))
                                    .every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>No students found matching your search.</p>
                                    </div>
                                ) : (
                                    allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    ).map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudentSelection(student.id)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '1rem',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary-alpha)' : 'var(--bg-card)',
                                                border: `1.5px solid ${originallyAllocated.includes(student.id) ? '#10b981' : selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                                                cursor: originallyAllocated.includes(student.id) ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                boxShadow: selectedStudents.includes(student.id) ? '0 4px 12px var(--primary-alpha)' : 'none',
                                                opacity: originallyAllocated.includes(student.id) ? 0.85 : 1
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: originallyAllocated.includes(student.id) ? '#10b981' : selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {(student.name || student.username || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {student.name || student.username}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                                        {student.batch || 'No Batch'}
                                                    </span>
                                                    {originallyAllocated.includes(student.id) && (
                                                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
                                                            ✓ Already Assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {originallyAllocated.includes(student.id)
                                                ? <CheckCircle size={18} color="#10b981" />
                                                : selectedStudents.includes(student.id) && <CheckCircle size={18} color="var(--primary)" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudents.length}</span> total&nbsp;
                                {originallyAllocated.length > 0 && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        ({originallyAllocated.length} already assigned, +{selectedStudents.filter(id => !originallyAllocated.includes(id)).length} new)
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-reset" onClick={() => {
                                    setShowStudentAllocationModal(false)
                                    setStudentSearchTerm('')
                                }}>Cancel</button>
                                <button className="btn-create-new" onClick={saveStudentAllocations} style={{ background: 'var(--primary)', padding: '0.7rem 2rem', borderRadius: '10px', boxShadow: '0 4px 15px var(--primary-alpha)' }}>
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <div className="modal-title-with-icon">
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Globe size={20} color="white" />
                                    </div>
                                    <h2>Create Global Task</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="modal-close"><X size={20} /></button>
                            </div>
                            <div className="modal-body premium-form">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Task Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Sentiment Analysis Challenge"
                                            value={task.title}
                                            onChange={(e) => setTask({ ...task, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Task Type</label>
                                            <select
                                                value={task.type}
                                                onChange={(e) => setTask({ ...task, type: e.target.value })}
                                            >
                                                <option value="machine_learning">Machine Learning</option>
                                                <option value="deep_learning">Deep Learning</option>
                                                <option value="data_science">Data Science</option>
                                                <option value="nlp">NLP</option>
                                                <option value="computer_vision">Computer Vision</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Difficulty</label>
                                            <select
                                                value={task.difficulty}
                                                onChange={(e) => setTask({ ...task, difficulty: e.target.value })}
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Describe the task in detail..."
                                            value={task.description}
                                            onChange={(e) => setTask({ ...task, description: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Requirements (one per line)</label>
                                        <textarea
                                            rows="4"
                                            placeholder="1. Data Preprocessing&#10;2. Model Training&#10;3. Evaluation Metrics"
                                            value={task.requirements}
                                            onChange={(e) => setTask({ ...task, requirements: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Deadline (Optional)</label>
                                            <input
                                                type="date"
                                                value={task.deadline}
                                                onChange={(e) => setTask({ ...task, deadline: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Max Attempts (0 = Unlimited)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={task.maxAttempts}
                                                onChange={(e) => setTask({ ...task, maxAttempts: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="btn-reset" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-create-new" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                            <Globe size={18} /> Create Global Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI Chatbot for Task Generation */}
            <AIChatbot
                context="task"
                isOpen={showAIChat}
                onClose={() => setShowAIChat(false)}
                onGenerate={handleAIGenerate}
            />
        </div >
    )
}

// ==================== GLOBAL PROBLEMS COMPONENT ====================
function GlobalProblems() {
    const user = useAuth()?.user
    const [problems, setProblems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showAIChat, setShowAIChat] = useState(false)
    const [uploading, setUploading] = useState(false)
    const csvInputRef = useRef(null)
    const [activeTab, setActiveTab] = useState('coding') // 'coding' or 'sql'
    const [selectedProblemForTestCases, setSelectedProblemForTestCases] = useState(null)
    const [problem, setProblem] = useState({
        title: '',
        type: 'Coding',
        language: 'Python',
        difficulty: 'Medium',
        description: '',
        sampleInput: '',
        expectedOutput: '',
        deadline: '',
        status: 'live',
        maxAttempts: 0,
        // SQL specific fields
        sqlSchema: '',
        expectedQueryResult: '',
        enableProctoring: false,
        enableVideoAudio: false,
        disableCopyPaste: false,
        trackTabSwitches: false,
        maxTabSwitches: 3,
        enableFaceDetection: false,
        detectMultipleFaces: false,
        trackFaceLookaway: false
    })

    // Student allocation states
    const [showStudentAllocationModal, setShowStudentAllocationModal] = useState(false)
    const [allStudents, setAllStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [originallyAllocated, setOriginallyAllocated] = useState([])
    const [allocatingProblemId, setAllocatingProblemId] = useState(null)
    const [studentSearchTerm, setStudentSearchTerm] = useState('')
    const [problemSearchTerm, setProblemSearchTerm] = useState('')

    // Check if SQL is selected
    const isSQLProblem = problem.type === 'SQL' || problem.language === 'SQL'

    // AI Chatbot handler - auto-fills the form
    const handleAIGenerate = (generated) => {
        const isSQL = generated.type === 'SQL' || generated.language === 'SQL'
        setProblem({
            title: generated.title || '',
            type: generated.type || 'Coding',
            language: generated.language || 'Python',
            difficulty: generated.difficulty || 'Medium',
            description: generated.description || '',
            sampleInput: isSQL ? '' : (generated.sampleInput || ''),
            expectedOutput: isSQL ? '' : (generated.expectedOutput || ''),
            sqlSchema: isSQL ? (generated.sqlSchema || generated.schema || '') : '',
            expectedQueryResult: isSQL ? (generated.expectedQueryResult || generated.expectedResult || '') : '',
            deadline: problem.deadline,
            status: generated.status || 'live',
            maxAttempts: problem.maxAttempts,
            enableProctoring: problem.enableProctoring,
            enableVideoAudio: problem.enableVideoAudio,
            disableCopyPaste: problem.disableCopyPaste,
            trackTabSwitches: problem.trackTabSwitches,
            maxTabSwitches: problem.maxTabSwitches,
            enableFaceDetection: problem.enableFaceDetection,
            detectMultipleFaces: problem.detectMultipleFaces,
            trackFaceLookaway: problem.trackFaceLookaway
        })
        setShowAIChat(false)
        setShowModal(true)
    }

    const fetchProblems = () => {
        axios.get(`${API_BASE}/problems?mentorId=${user?.id}`)
            .then(res => {
                setProblems(Array.isArray(res.data) ? res.data : (res.data?.data || []))
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }

    useEffect(() => {
        fetchProblems()
    }, [])

    const fetchAllStudents = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users?role=student`)
            setAllStudents(Array.isArray(res.data) ? res.data : [])
        } catch (e) { console.error('Error fetching students:', e) }
    }

    const openStudentAllocationModal = async (problemId) => {
        setAllocatingProblemId(problemId)
        setStudentSearchTerm('')
        setSelectedStudents([])
        setOriginallyAllocated([])
        await fetchAllStudents()

        try {
            // Use the correct problems allocated-students endpoint
            const res = await axios.get(`${API_BASE}/problems/${problemId}/allocated-students`)
            const existing = res.data.studentIds || []
            setSelectedStudents(existing)
            setOriginallyAllocated(existing)
        } catch (e) {
            console.error(e)
            setSelectedStudents([])
            setOriginallyAllocated([])
        }
        setShowStudentAllocationModal(true)
    }

    const toggleStudentSelection = (studentId) => {
        // Cannot deselect already-allocated students
        if (originallyAllocated.includes(studentId)) return
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const saveStudentAllocations = async () => {
        try {
            await axios.post(`${API_BASE}/problems/${allocatingProblemId}/allocate-students`, {
                studentIds: selectedStudents
            })
            alert('Students assigned successfully!')
            setShowStudentAllocationModal(false)
        } catch (e) {
            alert('Error assigning students: ' + (e.response?.data?.error || e.message))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_BASE}/problems`, { ...problem, mentorId: user?.id })
            setShowModal(false)
            setProblem({
                title: '', type: 'Coding', language: 'Python', difficulty: 'Medium',
                description: '', sampleInput: '', expectedOutput: '', deadline: '', status: 'live', maxAttempts: 0,
                sqlSchema: '', expectedQueryResult: '',
                enableProctoring: false, enableVideoAudio: false, disableCopyPaste: false, trackTabSwitches: false, maxTabSwitches: 3,
                enableFaceDetection: false, detectMultipleFaces: false, trackFaceLookaway: false
            })
            fetchProblems()
        } catch (error) {
            alert('Error creating global problem')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this problem?')) {
            try {
                await axios.delete(`${API_BASE}/problems/${id}`)
                fetchProblems()
            } catch (error) {
                alert('Error deleting problem')
            }
        }
    }

    const updateMaxAttempts = async (problemId, newVal) => {
        try {
            await axios.put(`${API_BASE}/problems/${problemId}`, { maxAttempts: newVal })
            fetchProblems()
        } catch (error) {
            console.error('Update max attempts error:', error.response?.data || error.message)
            alert('Error updating max attempts: ' + (error.response?.data?.error || error.message))
        }
    }

    const handleUpdateProblemStatus = async (problemId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/problems/${problemId}`, { status: newStatus })
            fetchProblems()
        } catch (error) {
            alert(error.response?.data?.error || 'Status update failed')
        }
    }

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        e.target.value = ''
        setUploading(true)
        try {
            const text = await file.text()
            const lines = text.split('\n').filter(l => l.trim()).map(l => l.trim())
            if (lines.length < 2) { alert('CSV must have a header row and at least one data row'); setUploading(false); return }

            // Parse CSV with proper quote handling
            const parseCSVLine = (line) => {
                const result = []
                let current = ''
                let insideQuotes = false
                for (let i = 0; i < line.length; i++) {
                    const char = line[i]
                    if (char === '"') {
                        insideQuotes = !insideQuotes
                    } else if (char === ',' && !insideQuotes) {
                        result.push(current.trim())
                        current = ''
                    } else {
                        current += char
                    }
                }
                result.push(current.trim())
                return result
            }

            const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
            const rows = lines.slice(1)
            let created = 0

            for (const row of rows) {
                if (!row.trim()) continue
                const vals = parseCSVLine(row)
                const obj = {}
                headers.forEach((h, i) => { obj[h] = vals[i] || '' })

                const isSQL = (obj.type || '').toUpperCase() === 'SQL' || (obj.language || '').toUpperCase() === 'SQL'

                // Map various column name variations
                const getSampleInput = () => {
                    return obj['sample_input'] || obj['sampleinput'] || obj['testinput'] || obj['test_input'] || obj['sample input'] || obj['test input'] || ''
                }

                const getExpectedOutput = () => {
                    return obj['expected_output'] || obj['expectedoutput'] || obj['expectedresult'] || obj['expected_result'] || obj['expected output'] || obj['expected result'] || ''
                }

                const getSQLSchema = () => {
                    return obj['sql_schema'] || obj['sqlschema'] || obj['schema'] || obj['sql schema'] || ''
                }

                const getExpectedQueryResult = () => {
                    return obj['expected_query_result'] || obj['expectedqueryresult'] || obj['expected_result'] || obj['expectedresult'] || obj['expected query result'] || ''
                }

                const probData = {
                    title: obj['title'] || obj['name'] || '',
                    type: isSQL ? 'SQL' : (obj['type'] || 'Coding'),
                    language: isSQL ? 'SQL' : (obj['language'] || 'Python'),
                    difficulty: (obj['difficulty'] || 'Medium').charAt(0).toUpperCase() + (obj['difficulty'] || 'Medium').slice(1).toLowerCase(),
                    description: obj['description'] || '',
                    sampleInput: getSampleInput(),
                    expectedOutput: getExpectedOutput(),
                    sqlSchema: isSQL ? getSQLSchema() : '',
                    expectedQueryResult: isSQL ? getExpectedQueryResult() : '',
                    maxAttempts: parseInt(obj['max_attempts'] || obj['maxattempts'] || obj['attempts']) || 0,
                    status: obj['status'] || 'live',
                    mentorId: user?.id
                }

                if (!probData.title || !probData.description) continue
                await axios.post(`${API_BASE}/problems`, probData)
                created++
            }
            alert(`Successfully created ${created} problems from CSV!`)
            fetchProblems()
        } catch (err) { alert('Error parsing CSV: ' + err.message) }
        setUploading(false)
    }

    if (loading) return <div className="loading-spinner"></div>

    // Separate problems into Coding and SQL
    const codingProblems = problems.filter(p => p.language !== 'SQL' && p.type !== 'SQL')
    const sqlProblems = problems.filter(p => p.language === 'SQL' || p.type === 'SQL')
    const displayedProblems = (activeTab === 'coding' ? codingProblems : sqlProblems).filter(p =>
        (p.title || '').toLowerCase().includes(problemSearchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(problemSearchTerm.toLowerCase()) ||
        (p.language || '').toLowerCase().includes(problemSearchTerm.toLowerCase())
    )

    return (
        <div className="animate-fadeIn">
            {/* Hero Section */}
            <div className="admin-hero-card glass" style={{
                background: 'var(--bg-card)',
                borderRadius: '1.5rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '1rem',
                                background: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 32px var(--primary-alpha)'
                            }}>
                                <Code size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                    Global Problems Management
                                </h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                    Create coding challenges visible to all students platform-wide
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search problems..."
                                value={problemSearchTerm}
                                onChange={(e) => setProblemSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '1rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.9rem',
                                    width: '250px'
                                }}
                            />
                        </div>
                        <input type="file" accept=".csv" ref={csvInputRef} style={{ display: 'none' }} onChange={handleCSVUpload} />
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            disabled={uploading}
                            className="btn-create-new premium-btn"
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: '1rem',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Upload size={18} /> {uploading ? 'Uploading...' : 'CSV Upload'}
                        </button>
                        <button
                            onClick={() => setShowAIChat(true)}
                            className="btn-create-new premium-btn"
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                borderRadius: '1rem',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Sparkles size={20} /> AI Generate
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-create-new premium-btn"
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'var(--primary)',
                                borderRadius: '1rem',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Plus size={20} /> Create Manually
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--primary-alpha)', color: 'var(--primary)' }}>
                        <FileCode size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Problems</span>
                        <span className="stat-value">{problems.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--success-alpha)', color: 'var(--success)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Problems</span>
                        <span className="stat-value">{problems.filter(p => p.status === 'live').length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--warning-alpha)', color: 'var(--warning)' }}>
                        <Trophy size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Solutions</span>
                        <span className="stat-value">{problems.reduce((acc, p) => acc + (p.completedBy?.length || 0), 0)}</span>
                    </div>
                </div>
            </div>

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

            {/* Problems Grid */}
            <div className="problem-list-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                {displayedProblems.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <Code size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <h3>No {activeTab === 'sql' ? 'SQL' : 'Coding'} Problems Yet</h3>
                        <p>Create your first {activeTab === 'sql' ? 'SQL' : 'coding'} problem!</p>
                    </div>
                ) : (
                    displayedProblems.map(p => (
                        <div key={p.id} className="problem-card card glass" style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                                        color: '#10b981',
                                        fontWeight: 700
                                    }}>GLOBAL</span>
                                    <span className="problem-badge">{p.type?.toUpperCase()}</span>
                                    <span className={`status-badge ${p.status || 'live'}`} style={{ fontSize: '0.65rem' }}>{p.status || 'Active'}</span>
                                    {p.proctoring?.enabled && (
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
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{p.language}</span>
                            </div>
                            <h3 style={{ margin: '0.75rem 0', fontSize: '1.2rem' }}>{p.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                                {p.description}
                            </p>

                            {p.deadline && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f87171', marginBottom: '1rem', background: 'rgba(248, 113, 113, 0.05)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                    <Clock size={12} /> Deadline: {new Date(p.deadline).toLocaleDateString()}
                                </div>
                            )}

                            {(p.maxAttempts || p.max_attempts) > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#8b5cf6', marginBottom: '1rem', background: 'rgba(139, 92, 246, 0.05)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                    🔄 Max Attempts: {p.maxAttempts || p.max_attempts}
                                    <button onClick={() => {
                                        const val = prompt('Set max attempts (0 = unlimited):', p.maxAttempts || p.max_attempts || 0)
                                        if (val !== null) updateMaxAttempts(p.id, parseInt(val) || 0)
                                    }} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem' }} title="Edit max attempts">✏️</button>
                                </div>
                            )}
                            {!(p.maxAttempts || p.max_attempts) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', background: 'rgba(100, 116, 139, 0.05)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                    🔄 Attempts: Unlimited
                                    <button onClick={() => {
                                        const val = prompt('Set max attempts (0 = unlimited):', '0')
                                        if (val !== null && parseInt(val) > 0) updateMaxAttempts(p.id, parseInt(val))
                                    }} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem' }} title="Set attempt limit">✏️</button>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: p.difficulty === 'Easy' ? '#10b981' : p.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {p.difficulty}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        • {p.completedBy?.length || 0} solved
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setSelectedProblemForTestCases(p)}
                                        disabled={p.language === 'SQL' || p.type === 'SQL'}
                                        style={{
                                            background: (p.language === 'SQL' || p.type === 'SQL') ? 'rgba(100, 116, 139, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            border: 'none',
                                            color: (p.language === 'SQL' || p.type === 'SQL') ? '#64748b' : '#10b981',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            cursor: (p.language === 'SQL' || p.type === 'SQL') ? 'not-allowed' : 'pointer',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: (p.language === 'SQL' || p.type === 'SQL') ? 0.5 : 1
                                        }}
                                        title={(p.language === 'SQL' || p.type === 'SQL') ? 'Test cases not available for SQL problems' : 'Manage Test Cases'}
                                    >
                                        <ClipboardList size={14} /> Tests
                                    </button>
                                    <button
                                        onClick={() => openStudentAllocationModal(p.id)}
                                        className="btn-create-new"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.8rem',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            color: '#8b5cf6',
                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                    >
                                        <Users size={16} /> Assign
                                    </button>
                                    {p.status === 'live' ? (
                                        <button
                                            onClick={() => handleUpdateProblemStatus(p.id, 'draft')}
                                            style={{
                                                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                                                color: '#fbbf24', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                                cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                                            }}
                                        >
                                            <XCircle size={14} /> End
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateProblemStatus(p.id, 'live')}
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
                                                color: '#6ee7b7', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                                cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                                            }}
                                        >
                                            <CheckCircle size={14} /> Activate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showStudentAllocationModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowStudentAllocationModal(false)
                    setStudentSearchTerm('')
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="modal-title-with-icon">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Assign Students</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select students for this problem</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setShowStudentAllocationModal(false)
                                setStudentSearchTerm('')
                            }} className="modal-close"><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or batch..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 1rem 0.7rem 2.5rem',
                                        borderRadius: '10px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-main)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    )
                                    // Only toggle non-locked students
                                    const toggleable = filtered.filter(s => !originallyAllocated.includes(s.id))
                                    const allToggleableSelected = toggleable.every(s => selectedStudents.includes(s.id))
                                    if (allToggleableSelected) {
                                        setSelectedStudents(prev => prev.filter(id =>
                                            originallyAllocated.includes(id) || !toggleable.map(s => s.id).includes(id)
                                        ))
                                    } else {
                                        setSelectedStudents(prev => [...new Set([...prev, ...toggleable.map(s => s.id)])])
                                    }
                                }}
                                style={{
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).filter(s => !originallyAllocated.includes(s.id))
                                    .every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>No students found matching your search.</p>
                                    </div>
                                ) : (
                                    allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    ).map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudentSelection(student.id)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '1rem',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary-alpha)' : 'var(--bg-card)',
                                                border: `1.5px solid ${originallyAllocated.includes(student.id) ? '#10b981' : selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                                                cursor: originallyAllocated.includes(student.id) ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                boxShadow: selectedStudents.includes(student.id) ? '0 4px 12px var(--primary-alpha)' : 'none',
                                                opacity: originallyAllocated.includes(student.id) ? 0.85 : 1
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: originallyAllocated.includes(student.id) ? '#10b981' : selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {(student.name || student.username || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {student.name || student.username}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                                        {student.batch || 'No Batch'}
                                                    </span>
                                                    {originallyAllocated.includes(student.id) && (
                                                        <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
                                                            ✓ Already Assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {originallyAllocated.includes(student.id)
                                                ? <CheckCircle size={18} color="#10b981" />
                                                : selectedStudents.includes(student.id) && <CheckCircle size={18} color="var(--primary)" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudents.length}</span> total&nbsp;
                                {originallyAllocated.length > 0 && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        ({originallyAllocated.length} already assigned, +{selectedStudents.filter(id => !originallyAllocated.includes(id)).length} new)
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-reset" onClick={() => {
                                    setShowStudentAllocationModal(false)
                                    setStudentSearchTerm('')
                                }}>Cancel</button>
                                <button className="btn-create-new" onClick={saveStudentAllocations} style={{ background: 'var(--primary)', padding: '0.7rem 2rem', borderRadius: '10px', boxShadow: '0 4px 15px var(--primary-alpha)' }}>
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Code size={20} color="white" />
                                </div>
                                <h2>Create Global Coding Problem</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="modal-close"><X size={20} /></button>
                        </div>
                        <div className="modal-body premium-form">
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Problem Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Two Sum Problem"
                                            value={problem.title}
                                            onChange={(e) => setProblem({ ...problem, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Problem Type</label>
                                        <select
                                            value={problem.type}
                                            onChange={(e) => {
                                                const newType = e.target.value
                                                setProblem({
                                                    ...problem,
                                                    type: newType,
                                                    language: newType === 'SQL' ? 'SQL' : problem.language === 'SQL' ? 'Python' : problem.language
                                                })
                                            }}
                                        >
                                            <option value="Coding">Coding</option>
                                            <option value="SQL">SQL</option>
                                            <option value="Algorithm">Algorithm</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Language</label>
                                        <select
                                            value={problem.language}
                                            onChange={(e) => {
                                                const newLang = e.target.value
                                                setProblem({
                                                    ...problem,
                                                    language: newLang,
                                                    type: newLang === 'SQL' ? 'SQL' : problem.type === 'SQL' ? 'Coding' : problem.type
                                                })
                                            }}
                                        >
                                            <option value="Python">Python</option>
                                            <option value="JavaScript">JavaScript</option>
                                            <option value="Java">Java</option>
                                            <option value="C">C</option>
                                            <option value="C++">C++</option>
                                            <option value="SQL">SQL</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Difficulty</label>
                                        <select
                                            value={problem.difficulty}
                                            onChange={(e) => setProblem({ ...problem, difficulty: e.target.value })}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            value={problem.status}
                                            onChange={(e) => setProblem({ ...problem, status: e.target.value })}
                                        >
                                            <option value="live">Live</option>
                                            <option value="draft">Draft</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Problem Description</label>
                                    <textarea
                                        rows="5"
                                        placeholder="Describe the problem in detail..."
                                        value={problem.description}
                                        onChange={(e) => setProblem({ ...problem, description: e.target.value })}
                                        required
                                    ></textarea>
                                </div>

                                {/* SQL-specific fields */}
                                {isSQLProblem ? (
                                    <>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Code size={14} color="#06b6d4" /> Database Schema (CREATE TABLE statements)
                                            </label>
                                            <textarea
                                                rows="6"
                                                placeholder="CREATE TABLE employees (&#10;  id INT PRIMARY KEY,&#10;  name VARCHAR(100),&#10;  department VARCHAR(50),&#10;  salary DECIMAL(10,2)&#10;);&#10;&#10;INSERT INTO employees VALUES (1, 'John', 'IT', 50000);"
                                                value={problem.sqlSchema}
                                                onChange={(e) => setProblem({ ...problem, sqlSchema: e.target.value })}
                                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                            />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                Include CREATE TABLE and INSERT statements to set up the test database
                                            </small>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle size={14} color="#10b981" /> Expected Query Result
                                            </label>
                                            <textarea
                                                rows="4"
                                                placeholder="id | name | salary&#10;1  | John | 50000&#10;2  | Jane | 60000"
                                                value={problem.expectedQueryResult}
                                                onChange={(e) => setProblem({ ...problem, expectedQueryResult: e.target.value })}
                                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                                            />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                The expected output when the correct SQL query is executed
                                            </small>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Sample Input</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., [2, 7, 11, 15], target = 9"
                                                value={problem.sampleInput}
                                                onChange={(e) => setProblem({ ...problem, sampleInput: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Expected Output</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., [0, 1]"
                                                value={problem.expectedOutput}
                                                onChange={(e) => setProblem({ ...problem, expectedOutput: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Deadline (Optional)</label>
                                    <input
                                        type="date"
                                        value={problem.deadline}
                                        onChange={(e) => setProblem({ ...problem, deadline: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Max Attempts (0 = Unlimited)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={problem.maxAttempts}
                                        onChange={(e) => setProblem({ ...problem, maxAttempts: parseInt(e.target.value) || 0 })}
                                        placeholder="0 = unlimited attempts"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                        Set how many times a student can submit. 0 means unlimited.
                                    </small>
                                </div>

                                {/* Proctoring Settings Section */}
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1.25rem',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(239, 68, 68, 0.15)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Eye size={20} color="#ef4444" />
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>
                                            Proctoring Settings
                                        </h4>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: 'pointer',
                                            padding: '0.75rem',
                                            background: problem.enableProctoring ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.enableProctoring}
                                                onChange={(e) => setProblem({ ...problem, enableProctoring: e.target.checked })}
                                                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>Enable Proctoring</span>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.enableVideoAudio ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.enableVideoAudio}
                                                onChange={(e) => setProblem({ ...problem, enableVideoAudio: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>📹 Video/Audio Monitoring</span>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.disableCopyPaste ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.disableCopyPaste}
                                                onChange={(e) => setProblem({ ...problem, disableCopyPaste: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>📋 Disable Copy/Paste</span>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.trackTabSwitches ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.trackTabSwitches}
                                                onChange={(e) => setProblem({ ...problem, trackTabSwitches: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>🔒 Track Tab Switches</span>
                                        </label>

                                        <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)', opacity: 0.3 }} />

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.enableFaceDetection ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.enableFaceDetection}
                                                onChange={(e) => setProblem({ ...problem, enableFaceDetection: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#ec4899' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>👁️ Enable Face Detection</span>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.detectMultipleFaces ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.detectMultipleFaces}
                                                onChange={(e) => setProblem({ ...problem, detectMultipleFaces: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>👥 Detect Multiple Faces (Cheating)</span>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            cursor: problem.enableProctoring ? 'pointer' : 'not-allowed',
                                            opacity: problem.enableProctoring ? 1 : 0.5,
                                            padding: '0.75rem',
                                            background: problem.trackFaceLookaway ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            borderRadius: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={problem.trackFaceLookaway}
                                                onChange={(e) => setProblem({ ...problem, trackFaceLookaway: e.target.checked })}
                                                disabled={!problem.enableProctoring}
                                                style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>👀 Track Face Lookaway</span>
                                        </label>
                                    </div>

                                    {problem.enableProctoring && problem.trackTabSwitches && (
                                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Max Tab Switches:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={problem.maxTabSwitches}
                                                onChange={(e) => setProblem({ ...problem, maxTabSwitches: parseInt(e.target.value) || 3 })}
                                                style={{ width: '80px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-reset" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-create-new" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                        <Plus size={18} /> Create Global Problem
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chatbot for Problem Generation */}
            <AIChatbot
                context="problem"
                isOpen={showAIChat}
                onClose={() => setShowAIChat(false)}
                onGenerate={handleAIGenerate}
            />

            {/* Test Cases Manager Modal */}
            {selectedProblemForTestCases && (
                <TestCasesManager
                    problemId={selectedProblemForTestCases.id}
                    problemTitle={selectedProblemForTestCases.title}
                    onClose={() => setSelectedProblemForTestCases(null)}
                />
            )}
        </div>
    )
}

// ==================== GLOBAL COMPLETE TESTS ADMIN ====================
const GLOBAL_SECTIONS = [
    { id: 'aptitude', label: 'Aptitude', icon: '📊' },
    { id: 'verbal', label: 'Verbal', icon: '📝' },
    { id: 'logical', label: 'Logical', icon: '🧩' },
    { id: 'coding', label: 'Coding', icon: '💻' },
    { id: 'sql', label: 'SQL', icon: '🗄️' }
];

function GlobalTestsAdmin() {
    const user = useAuth()?.user
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [modalStep, setModalStep] = useState(1)
    const [editingId, setEditingId] = useState(null)
    const [sectionTab, setSectionTab] = useState('aptitude')
    const [managingTestCases, setManagingTestCases] = useState(null)

    // Student allocation states
    const [showStudentAllocationModal, setShowStudentAllocationModal] = useState(false)
    const [allStudents, setAllStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [allocatingTestId, setAllocatingTestId] = useState(null)
    const [studentSearchTerm, setStudentSearchTerm] = useState('')
    const [testSearchTerm, setTestSearchTerm] = useState('') // New state for test search
    const [expandedTestId, setExpandedTestId] = useState(null) // For collapsible test cards

    const [newTest, setNewTest] = useState({
        title: '',
        type: 'comprehensive',
        difficulty: 'Medium',
        duration: 180,
        passingScore: 60,
        description: '',
        startTime: '',
        deadline: '',
        maxAttempts: 1,
        maxTabSwitches: 3,
        status: 'live',
        sectionConfig: {
            sections: [
                { id: 'aptitude', enabled: true, order: 1, questionsCount: 20, timeMinutes: 30 },
                { id: 'verbal', enabled: true, order: 2, questionsCount: 25, timeMinutes: 25 },
                { id: 'logical', enabled: true, order: 3, questionsCount: 20, timeMinutes: 20 },
                { id: 'coding', enabled: true, order: 4, questionsCount: 2, timeMinutes: 50 },
                { id: 'sql', enabled: true, order: 5, questionsCount: 1, timeMinutes: 25 }
            ],
            totalDurationMinutes: 180,
            sectionTimeMode: 'fixed'
        }
    })
    const [questionsBySection, setQuestionsBySection] = useState({
        aptitude: [], verbal: [], logical: [], coding: [], sql: []
    })
    const [manualQuestion, setManualQuestion] = useState({
        question: '', options: ['', '', '', ''], correctAnswer: 0, category: 'general', explanation: ''
    })
    const [codingQuestion, setCodingQuestion] = useState({
        question: '', starterCode: '', language: 'Python', testCases: [{ input: '', expected_output: '' }]
    })
    const [sqlQuestion, setSqlQuestion] = useState({
        question: '', schema: '', expectedOutput: ''
    })
    const [submissions, setSubmissions] = useState([])
    const [aiPrompt, setAiPrompt] = useState({ topic: '', difficulty: 'Medium', count: 5 })
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    // Enhanced Proctoring Settings
    const [proctoringSettings, setProctoringSettings] = useState({
        enabled: true,
        trackTabSwitches: true,
        maxTabSwitches: 3,
        enableVideoAudio: true,
        disableCopyPaste: true,
        detectCameraBlocking: true,
        detectPhoneUsage: true,
        enforceFullscreen: true,
        autoSubmitOnViolation: false
    })
    // AI Generation for Coding/SQL
    const [codingAiPrompt, setCodingAiPrompt] = useState({ topic: '', difficulty: 'Medium', language: 'Python' })
    const [sqlAiPrompt, setSqlAiPrompt] = useState({ topic: '', difficulty: 'Medium' })
    const [generatedCodingProblems, setGeneratedCodingProblems] = useState([])
    const [generatedSqlProblems, setGeneratedSqlProblems] = useState([])
    const [isGeneratingCoding, setIsGeneratingCoding] = useState(false)
    const [isGeneratingSql, setIsGeneratingSql] = useState(false)
    const [enableProctoring, setEnableProctoring] = useState(true)
    const [uploading, setUploading] = useState(false)
    const csvInputRef = useRef(null)

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        try {
            const text = await file.text()
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
            if (lines.length < 2) { alert('CSV must have header + at least one row'); return }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
            const questions = []
            for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
                const row = {}
                headers.forEach((h, idx) => row[h] = vals[idx] || '')
                const section = (row.section || 'aptitude').toLowerCase()
                if (!['aptitude', 'verbal', 'logical'].includes(section)) continue
                questions.push({
                    section,
                    question: row.question || '',
                    options: [row.option1 || row.option_1 || '', row.option2 || row.option_2 || '', row.option3 || row.option_3 || '', row.option4 || row.option_4 || ''],
                    correctAnswer: parseInt(row.correctanswer || row.correct_answer || row.answer || '0'),
                    category: row.category || 'general',
                    explanation: row.explanation || ''
                })
            }
            if (questions.length === 0) { alert('No valid MCQ rows found. CSV needs: section,question,option1,option2,option3,option4,correctAnswer'); setUploading(false); return }
            // Create a test with default config
            const testPayload = {
                title: file.name.replace('.csv', '') + ' - CSV Import',
                type: 'comprehensive', difficulty: 'Medium', duration: 180, passingScore: 60,
                status: 'draft', createdBy: user?.id,
                sectionConfig: {
                    sections: [
                        { id: 'aptitude', enabled: true, order: 1, questionsCount: questions.filter(q => q.section === 'aptitude').length, timeMinutes: 30 },
                        { id: 'verbal', enabled: true, order: 2, questionsCount: questions.filter(q => q.section === 'verbal').length, timeMinutes: 25 },
                        { id: 'logical', enabled: true, order: 3, questionsCount: questions.filter(q => q.section === 'logical').length, timeMinutes: 20 },
                        { id: 'coding', enabled: false, order: 4, questionsCount: 0, timeMinutes: 0 },
                        { id: 'sql', enabled: false, order: 5, questionsCount: 0, timeMinutes: 0 }
                    ],
                    totalDurationMinutes: 75, sectionTimeMode: 'fixed'
                }
            }
            const res = await axios.post(`${API_BASE}/global-tests`, testPayload)
            const testId = res.data.id
            // Group questions by section and post
            for (const sec of ['aptitude', 'verbal', 'logical']) {
                const secQs = questions.filter(q => q.section === sec)
                if (secQs.length === 0) continue
                await axios.post(`${API_BASE}/global-tests/${testId}/questions`, { section: sec, questions: secQs })
            }
            alert(`Created test with ${questions.length} questions from CSV!`)
            fetchTests()
        } catch (err) {
            alert('CSV upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const fetchTests = async () => {
        try {
            const res = await axios.get(`${API_BASE}/global-tests`)
            setTests(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            if (e.response?.status === 503) setTests([])
            else console.error(e)
        } finally {
            setLoading(false)
        }
    }
    const fetchSubmissions = async () => {
        try {
            const res = await axios.get(`${API_BASE}/global-test-submissions`)
            setSubmissions(Array.isArray(res.data) ? res.data : [])
        } catch (_) { setSubmissions([]) }
    }

    const fetchAllStudents = async () => {
        try {
            const response = await axios.get(`${API_BASE}/users?role=student`)
            setAllStudents(response.data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
        }
    }

    const openStudentAllocationModal = async (testId) => {
        setAllocatingTestId(testId)
        setStudentSearchTerm('')
        setSelectedStudents([])
        await fetchAllStudents()
        try {
            const response = await axios.get(`${API_BASE}/tests/${testId}/allocated-students`)
            setSelectedStudents(response.data.studentIds || [])
        } catch (error) {
            setSelectedStudents([])
        }
        setShowStudentAllocationModal(true)
    }

    const saveStudentAllocations = async () => {
        if (!allocatingTestId) return
        try {
            await axios.post(`${API_BASE}/tests/${allocatingTestId}/allocate-students`, {
                studentIds: selectedStudents
            })
            alert(`✅ Test allocated to ${selectedStudents.length} student(s)`)
            setShowStudentAllocationModal(false)
            setSelectedStudents([])
            setAllocatingTestId(null)
        } catch (error) {
            alert('❌ Error allocating test: ' + error.response?.data?.error || error.message)
        }
    }

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    useEffect(() => { fetchTests(); fetchSubmissions(); fetchAllStudents() }, [])

    const updateSectionConfig = (sectionId, field, value) => {
        setNewTest(prev => ({
            ...prev,
            sectionConfig: {
                ...prev.sectionConfig,
                sections: prev.sectionConfig.sections.map(s =>
                    s.id === sectionId ? { ...s, [field]: value } : s
                )
            }
        }))
    }
    const toggleSection = (sectionId, enabled) => {
        updateSectionConfig(sectionId, 'enabled', enabled)
    }

    const addManualQuestion = () => {
        if (!manualQuestion.question.trim()) return
        const opt = manualQuestion.options.map(o => o.trim()).filter(Boolean)
        if (opt.length < 2) { alert('Add at least 2 options'); return }
        const correctAnswer = opt[manualQuestion.correctAnswer] ?? opt[0]
        setQuestionsBySection(prev => ({
            ...prev,
            [sectionTab]: [...(prev[sectionTab] || []), {
                question: manualQuestion.question,
                options: opt,
                correctAnswer,
                category: manualQuestion.category,
                explanation: manualQuestion.explanation
            }]
        }))
        setManualQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0, category: 'general', explanation: '' })
    }

    const removeQuestion = (section, index) => {
        setQuestionsBySection(prev => ({
            ...prev,
            [section]: (prev[section] || []).filter((_, i) => i !== index)
        }))
    }

    const buildQuestionPayload = (section, list) => {
        if (section === 'coding') {
            return list.map(q => ({
                questionType: 'coding',
                question: q.question,
                starterCode: q.starterCode || '',
                testCases: q.testCases || { language: 'Python', cases: [] },
                points: q.points ?? 10
            }))
        }
        if (section === 'sql') {
            return list.map(q => ({
                questionType: 'sql',
                question: q.question,
                starterCode: q.starterCode || '',
                testCases: q.testCases || { expectedOutput: '' },
                points: q.points ?? 10
            }))
        }
        return list.map(q => ({
            questionType: 'mcq',
            question: q.question,
            options: q.options || [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean),
            correctAnswer: q.correctAnswer ?? q.options?.[q.correctAnswer],
            category: q.category || 'general',
            explanation: q.explanation || ''
        }))
    }

    // AI Generation for Coding Problems
    const generateCodingProblem = async () => {
        if (!codingAiPrompt.topic.trim()) {
            alert('Please enter a topic for the coding problem')
            return
        }
        setIsGeneratingCoding(true)
        try {
            const res = await axios.post(`${API_BASE}/ai/generate-coding-problem`, {
                topic: codingAiPrompt.topic,
                difficulty: codingAiPrompt.difficulty,
                language: codingAiPrompt.language
            })
            if (res.data.problem) {
                setGeneratedCodingProblems([res.data.problem])
            }
        } catch (e) {
            console.error('AI Generation error:', e)
            // Fallback problem
            setGeneratedCodingProblems([{
                question: `Write a ${codingAiPrompt.language} program to solve: ${codingAiPrompt.topic}`,
                starterCode: codingAiPrompt.language === 'Python'
                    ? '# Write your solution here\ndef solution():\n    pass\n\n# Test your code\nsolution()'
                    : '// Write your solution here',
                testCases: [{ input: '', expected_output: '' }],
                language: codingAiPrompt.language,
                difficulty: codingAiPrompt.difficulty
            }])
        } finally {
            setIsGeneratingCoding(false)
        }
    }

    const addGeneratedCodingToSection = () => {
        if (generatedCodingProblems.length === 0) return
        const newProblems = generatedCodingProblems.map(p => ({
            questionType: 'coding',
            question: p.question,
            starterCode: p.starterCode || '',
            solutionCode: p.solutionCode || '',
            language: p.language || codingAiPrompt.language,
            testCases: {
                language: p.language || codingAiPrompt.language,
                cases: Array.isArray(p.testCases) ? p.testCases : (p.testCases?.cases || [])
            },
            hints: p.hints || [],
            explanation: p.explanation || '',
            points: 10
        }))
        setQuestionsBySection(prev => ({
            ...prev,
            coding: [...(prev.coding || []), ...newProblems]
        }))
        setGeneratedCodingProblems([])
        setCodingAiPrompt({ topic: '', difficulty: 'Medium', language: 'Python' })
    }

    // AI Generation for SQL Problems
    const generateSqlProblem = async () => {
        if (!sqlAiPrompt.topic.trim()) {
            alert('Please enter a topic for the SQL problem')
            return
        }
        setIsGeneratingSql(true)
        try {
            const res = await axios.post(`${API_BASE}/ai/generate-sql-problem`, {
                topic: sqlAiPrompt.topic,
                difficulty: sqlAiPrompt.difficulty
            })
            if (res.data.problem) {
                setGeneratedSqlProblems([res.data.problem])
            }
        } catch (e) {
            console.error('AI Generation error:', e)
            // Fallback problem
            setGeneratedSqlProblems([{
                question: `Write a SQL query to: ${sqlAiPrompt.topic}`,
                schema: `-- Sample schema\nCREATE TABLE employees (\n    id INTEGER PRIMARY KEY,\n    name TEXT,\n    department TEXT,\n    salary INTEGER\n);\n\nINSERT INTO employees VALUES (1, 'John', 'Engineering', 50000);`,
                expectedOutput: 'id|name|department|salary\n1|John|Engineering|50000',
                difficulty: sqlAiPrompt.difficulty
            }])
        } finally {
            setIsGeneratingSql(false)
        }
    }

    const addGeneratedSqlToSection = () => {
        if (generatedSqlProblems.length === 0) return
        const newProblems = generatedSqlProblems.map(p => ({
            questionType: 'sql',
            question: p.question,
            starterCode: `${p.schema || ''}\n\n-- Your query here:`,
            testCases: { expectedOutput: p.expectedOutput || '' },
            solutionQuery: p.solutionQuery || '',
            hints: p.hints || [],
            explanation: p.explanation || '',
            points: 10
        }))
        setQuestionsBySection(prev => ({
            ...prev,
            sql: [...(prev.sql || []), ...newProblems]
        }))
        setGeneratedSqlProblems([])
        setSqlAiPrompt({ topic: '', difficulty: 'Medium' })
    }

    const handleCreateOrUpdate = async () => {
        if (!newTest.title.trim()) { alert('Enter test title'); return }
        const totalQ = Object.values(questionsBySection).reduce((sum, arr) => sum + arr.length, 0)
        if (totalQ === 0) { alert('Add questions in sections'); return }
        try {
            // Format dates correctly for backend
            let formattedStartTime = null;
            if (newTest.startTime) {
                const startD = new Date(newTest.startTime);
                if (!isNaN(startD.getTime())) formattedStartTime = startD.toISOString();
            }

            let formattedDeadline = null;
            if (newTest.deadline) {
                const endD = new Date(newTest.deadline);
                if (!isNaN(endD.getTime())) formattedDeadline = endD.toISOString();
            }

            const payload = {
                ...newTest,
                startTime: formattedStartTime,
                deadline: formattedDeadline,
                createdBy: editingId ? undefined : user?.id,
                // Include enhanced proctoring settings
                proctoring: proctoringSettings.enabled ? {
                    enabled: true,
                    trackTabSwitches: proctoringSettings.trackTabSwitches,
                    maxTabSwitches: proctoringSettings.maxTabSwitches,
                    enableVideoAudio: proctoringSettings.enableVideoAudio,
                    disableCopyPaste: proctoringSettings.disableCopyPaste,
                    detectCameraBlocking: proctoringSettings.detectCameraBlocking,
                    detectPhoneUsage: proctoringSettings.detectPhoneUsage,
                    enforceFullscreen: proctoringSettings.enforceFullscreen,
                    autoSubmitOnViolation: proctoringSettings.autoSubmitOnViolation
                } : { enabled: false },
                maxTabSwitches: proctoringSettings.enabled && proctoringSettings.trackTabSwitches ? proctoringSettings.maxTabSwitches : 0
            }
            let testId = editingId
            if (editingId) {
                await axios.put(`${API_BASE}/global-tests/${editingId}`, {
                    ...payload,
                    createdBy: undefined
                })
                await axios.delete(`${API_BASE}/global-tests/${editingId}/questions`)
            } else {
                const res = await axios.post(`${API_BASE}/global-tests`, payload)
                testId = res.data.id
            }
            for (const section of GLOBAL_SECTIONS) {
                const list = questionsBySection[section.id] || []
                if (list.length === 0) continue
                const payload = buildQuestionPayload(section.id, list)
                await axios.post(`${API_BASE}/global-tests/${testId}/questions`, { section: section.id, questions: payload })
            }
            setShowModal(false)
            setModalStep(1)
            setEditingId(null)
            setQuestionsBySection({ aptitude: [], verbal: [], logical: [], coding: [], sql: [] })
            setNewTest({
                title: '', type: 'comprehensive', difficulty: 'Medium', duration: 180, passingScore: 60,
                description: '', startTime: '', deadline: '', maxAttempts: 1, maxTabSwitches: 3, status: 'live',
                sectionConfig: newTest.sectionConfig
            })
            fetchTests()
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to save test')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this global test? This cannot be undone.')) return
        try {
            await axios.delete(`${API_BASE}/global-tests/${id}`)
            fetchTests()
        } catch (e) {
            alert(e.response?.data?.error || 'Delete failed')
        }
    }

    const handleUpdateStatus = async (testId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/global-tests/${testId}`, { status: newStatus })
            fetchTests()
        } catch (e) {
            alert(e.response?.data?.error || 'Status update failed')
        }
    }

    const openEdit = async (test) => {
        try {
            const [testRes, qRes] = await Promise.all([
                axios.get(`${API_BASE}/global-tests/${test.id}`),
                axios.get(`${API_BASE}/global-tests/${test.id}/questions`)
            ])
            const t = testRes.data
            const qList = Array.isArray(qRes.data) ? qRes.data : []
            const bySection = { aptitude: [], verbal: [], logical: [], coding: [], sql: [] }
            qList.forEach(q => {
                const opts = q.options || []
                let correctAnswer = q.correctAnswer
                if (q.questionType !== 'coding' && q.questionType !== 'sql') {
                    if (typeof correctAnswer === 'number' && correctAnswer >= 0 && correctAnswer < 4) {
                        correctAnswer = correctAnswer
                    } else if (typeof correctAnswer === 'string' && opts.length) {
                        const idx = opts.indexOf(correctAnswer)
                        correctAnswer = idx >= 0 ? idx : (/^[0-3]$/.test(correctAnswer) ? parseInt(correctAnswer, 10) : 0)
                    } else {
                        correctAnswer = 0
                    }
                }
                const item = {
                    id: q.id,
                    question: q.question,
                    options: opts.length ? opts : ['', '', '', ''],
                    correctAnswer,
                    category: q.category,
                    explanation: q.explanation,
                    questionType: q.questionType || 'mcq',
                    starterCode: q.starterCode,
                    solutionCode: q.solutionCode,
                    testCases: q.testCases,
                    points: q.points
                }
                if (bySection[q.section]) bySection[q.section].push(item)
            })
            setEnableProctoring((t.maxTabSwitches ?? 0) > 0)
            setNewTest({
                title: t.title,
                type: t.type || 'comprehensive',
                difficulty: t.difficulty || 'Medium',
                duration: t.duration ?? 180,
                passingScore: t.passingScore ?? 60,
                description: t.description || '',
                startTime: t.startTime ? t.startTime.slice(0, 16) : '',
                deadline: t.deadline ? t.deadline.slice(0, 16) : '',
                maxAttempts: t.maxAttempts ?? 1,
                maxTabSwitches: t.maxTabSwitches ?? 3,
                status: t.status || 'draft',
                sectionConfig: t.sectionConfig || newTest.sectionConfig
            })
            setQuestionsBySection(bySection)
            setEditingId(t.id)
            setModalStep(1)
            setShowModal(true)
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to load test')
        }
    }

    const handleGenerateQuestions = async () => {
        setIsGenerating(true)
        try {
            const res = await axios.post(`${API_BASE}/ai/generate-aptitude`, aiPrompt)
            if (res.data.questions) setGeneratedQuestions(res.data.questions)
        } catch (_) {
            alert('Error generating questions')
        } finally {
            setIsGenerating(false)
        }
    }
    const addGeneratedToSection = () => {
        if (generatedQuestions.length === 0) return
        setQuestionsBySection(prev => ({
            ...prev,
            [sectionTab]: [...(prev[sectionTab] || []), ...generatedQuestions.map(q => ({
                question: q.question,
                options: q.options || ['', '', '', ''],
                correctAnswer: q.correctAnswer ?? 0,
                category: q.category || 'general',
                explanation: q.explanation || ''
            }))]
        }))
        setGeneratedQuestions([])
    }
    const updateQuestionInSection = (section, index, field, value) => {
        setQuestionsBySection(prev => {
            const list = [...(prev[section] || [])]
            if (!list[index]) return prev
            if (field === 'options') {
                list[index] = { ...list[index], options: value }
            } else if (field === 'correctAnswer') {
                list[index] = { ...list[index], correctAnswer: value }
            } else {
                list[index] = { ...list[index], [field]: value }
            }
            return { ...prev, [section]: list }
        })
    }
    const addNewMcqToSection = () => {
        setQuestionsBySection(prev => ({
            ...prev,
            [sectionTab]: [...(prev[sectionTab] || []), { question: '', options: ['', '', '', ''], correctAnswer: 0, category: 'general', explanation: '' }]
        }))
    }

    const addCodingQuestion = () => {
        if (!codingQuestion.question.trim()) { alert('Enter problem description'); return }
        const cases = codingQuestion.testCases.filter(tc => tc.input !== undefined || tc.expected_output)
        if (cases.length === 0 || !cases.some(c => (c.expected_output || '').trim())) { alert('Add at least one test case with expected output'); return }
        setQuestionsBySection(prev => ({
            ...prev,
            coding: [...(prev.coding || []), {
                questionType: 'coding',
                question: codingQuestion.question,
                starterCode: codingQuestion.starterCode,
                testCases: { language: codingQuestion.language, cases: codingQuestion.testCases.map(c => ({ input: c.input || '', expected_output: c.expected_output || '' })) },
                points: 10
            }]
        }))
        setCodingQuestion({ question: '', starterCode: '', language: 'Python', testCases: [{ input: '', expected_output: '' }] })
    }

    const addSqlQuestion = () => {
        if (!sqlQuestion.question.trim()) { alert('Enter question text'); return }
        if (!sqlQuestion.schema.trim()) { alert('Enter database schema'); return }
        if (!sqlQuestion.expectedOutput.trim()) { alert('Enter expected query result'); return }
        setQuestionsBySection(prev => ({
            ...prev,
            sql: [...(prev.sql || []), {
                questionType: 'sql',
                question: sqlQuestion.question,
                starterCode: sqlQuestion.schema,
                testCases: { expectedOutput: sqlQuestion.expectedOutput },
                points: 10
            }]
        }))
        setSqlQuestion({ question: '', schema: '', expectedOutput: '' })
    }

    if (loading) return <div className="loading-spinner"></div>

    const filteredTests = tests.filter(t =>
        (t.title || '').toLowerCase().includes(testSearchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(testSearchTerm.toLowerCase()) ||
        (t.type || '').toLowerCase().includes(testSearchTerm.toLowerCase())
    )

    return (
        <div className="animate-fadeIn">
            {/* Hero – same style as Global Problems */}
            <div className="admin-hero-card glass" style={{
                background: 'var(--bg-card)',
                borderRadius: '1.5rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--primary-alpha) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '1rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px var(--primary-alpha)' }}>
                                <ClipboardList size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Global Complete Tests</h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Aptitude, Verbal, Logical, Coding, SQL – create and manage</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <input type="file" accept=".csv" ref={csvInputRef} style={{ display: 'none' }} onChange={handleCSVUpload} />
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            disabled={uploading}
                            className="btn-create-new premium-btn"
                            style={{ padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '1rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Upload size={18} /> {uploading ? 'Uploading...' : 'CSV Upload'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowModal(true); setModalStep(1); setEditingId(null); setQuestionsBySection({ aptitude: [], verbal: [], logical: [], coding: [], sql: [] }); setGeneratedQuestions([]); setAiPrompt({ topic: '', difficulty: 'Medium', count: 5 }); }}
                            className="btn-create-new premium-btn"
                            style={{ padding: '0.75rem 1.25rem', background: 'var(--primary)', borderRadius: '1rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={20} /> Create Global Test
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats grid – like Global Problems */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--primary-alpha)', color: 'var(--primary)' }}><ClipboardList size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Tests</span>
                        <span className="stat-value">{tests.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--success-alpha)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Live</span>
                        <span className="stat-value">{tests.filter(t => t.status === 'live').length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'var(--warning-alpha)', color: 'var(--warning)' }}><Target size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Submissions</span>
                        <span className="stat-value">{submissions.length}</span>
                    </div>
                </div>
            </div>

            {/* Search Input for Tests */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search tests..."
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '1rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            width: '300px'
                        }}
                    />
                </div>
            </div>

            {filteredTests.length === 0 && !loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.7 }}>
                    <ClipboardList size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3>No global tests yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Create one to add Aptitude, Verbal, Logical, Coding, and SQL sections.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>If you see 503, run: <code>node migrate_global_tests.js</code></p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredTests.map(t => {
                        const isExpanded = expandedTestId === t.id
                        const sectionConfig = t.sectionConfig?.sections || []
                        const enabledSections = sectionConfig.filter(s => s.enabled)
                        const sectionLabels = enabledSections.map(s => s.id.charAt(0).toUpperCase() + s.id.slice(1)).join(', ')

                        return (
                            <div key={t.id} style={{
                                background: 'var(--bg-secondary)',
                                border: `1px solid ${isExpanded ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-color)'}`,
                                borderRadius: '16px',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                boxShadow: isExpanded ? '0 8px 32px rgba(99, 102, 241, 0.15)' : '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                {/* Card Header - Always Visible */}
                                <div
                                    onClick={() => setExpandedTestId(isExpanded ? null : t.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1.25rem 1.5rem',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        background: isExpanded ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                                    }}
                                >
                                    {/* Status indicator */}
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: t.status === 'live' ? '#10b981' : '#ef4444',
                                        boxShadow: `0 0 8px ${t.status === 'live' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        flexShrink: 0
                                    }} />

                                    {/* Title & type */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</h3>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                textTransform: 'uppercase',
                                                fontWeight: 700,
                                                background: t.status === 'live' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: t.status === 'live' ? '#10b981' : '#ef4444',
                                                border: t.status === 'live' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                                flexShrink: 0
                                            }}>
                                                {t.status === 'live' ? 'LIVE' : 'ENDED'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Clock size={12} /> {t.duration} min
                                            </span>
                                            <span>·</span>
                                            <span>{t.totalQuestions ?? 0} questions</span>
                                            <span>·</span>
                                            <span>Pass {t.passingScore}%</span>
                                            {sectionLabels && (
                                                <>
                                                    <span>·</span>
                                                    <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{sectionLabels}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand/Collapse icon */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'transform 0.3s',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                        flexShrink: 0
                                    }}>
                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: 'rotate(90deg)' }} />
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div style={{
                                        borderTop: '1px solid var(--border-color)',
                                        padding: '1.25rem 1.5rem',
                                        animation: 'fadeIn 0.2s ease'
                                    }}>
                                        {/* Description */}
                                        {t.description && (
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                                                {t.description}
                                            </p>
                                        )}

                                        {/* Section details grid */}
                                        {enabledSections.length > 0 && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: `repeat(${Math.min(enabledSections.length, 5)}, 1fr)`,
                                                gap: '0.75rem',
                                                marginBottom: '1.25rem'
                                            }}>
                                                {enabledSections.map(sec => {
                                                    const sectionColors = {
                                                        aptitude: { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
                                                        verbal: { bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' },
                                                        logical: { bg: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.2)' },
                                                        coding: { bg: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'rgba(16, 185, 129, 0.2)' },
                                                        sql: { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.2)' }
                                                    }
                                                    const sc = sectionColors[sec.id] || sectionColors.aptitude
                                                    return (
                                                        <div key={sec.id} style={{
                                                            padding: '0.75rem',
                                                            background: sc.bg,
                                                            border: `1px solid ${sc.border}`,
                                                            borderRadius: '10px',
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                                                                {sec.id}
                                                            </div>
                                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                                                {sec.questionsCount || 0}
                                                            </div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                {sec.timeMinutes || 0} min
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Meta row: type, dates, max attempts */}
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.75rem',
                                            marginBottom: '1.25rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <span style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                Type: <strong style={{ color: 'var(--text-main)' }}>{t.type || 'Comprehensive'}</strong>
                                            </span>
                                            <span style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                Difficulty: <strong style={{ color: { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' }[t.difficulty] || 'var(--text-main)' }}>{t.difficulty || 'Medium'}</strong>
                                            </span>
                                            <span style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                Max Attempts: <strong style={{ color: 'var(--text-main)' }}>{t.maxAttempts || 1}</strong>
                                            </span>
                                            {t.startTime && (
                                                <span style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    Start: <strong style={{ color: 'var(--text-main)' }}>{new Date(t.startTime).toLocaleString()}</strong>
                                                </span>
                                            )}
                                            {t.deadline && (
                                                <span style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    Deadline: <strong style={{ color: 'var(--text-main)' }}>{new Date(t.deadline).toLocaleString()}</strong>
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '0.6rem',
                                            flexWrap: 'wrap',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--border-color)'
                                        }}>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                                    background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd',
                                                    border: '1px solid rgba(59, 130, 246, 0.25)'
                                                }}
                                            >
                                                <Eye size={14} /> View / Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openStudentAllocationModal(t.id); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                                    background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe',
                                                    border: '1px solid rgba(168, 85, 247, 0.25)'
                                                }}
                                            >
                                                <Users size={14} /> Assign Students
                                            </button>

                                            {t.status === 'live' ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(t.id, 'draft'); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                                        background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24',
                                                        border: '1px solid rgba(245, 158, 11, 0.25)'
                                                    }}
                                                >
                                                    <XCircle size={14} /> End Test
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(t.id, 'live'); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                                        background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)'
                                                    }}
                                                >
                                                    <CheckCircle size={14} /> Activate
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                                    background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5',
                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                    marginLeft: 'auto'
                                                }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {showStudentAllocationModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowStudentAllocationModal(false)
                    setStudentSearchTerm('')
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="modal-title-with-icon">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Assign Students</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select students for this global test</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setShowStudentAllocationModal(false)
                                setStudentSearchTerm('')
                            }} className="modal-close"><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or batch..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 1rem 0.7rem 2.5rem',
                                        borderRadius: '10px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-main)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    )
                                    const allSelected = filtered.every(s => selectedStudents.includes(s.id))
                                    if (allSelected) {
                                        setSelectedStudents(prev => prev.filter(id => !filtered.map(s => s.id).includes(id)))
                                    } else {
                                        setSelectedStudents(prev => [...new Set([...prev, ...filtered.map(s => s.id)])])
                                    }
                                }}
                                style={{
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>No students found matching your search.</p>
                                    </div>
                                ) : (
                                    allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    ).map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudentSelection(student.id)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '1rem',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary-alpha)' : 'var(--bg-card)',
                                                border: `1.5px solid ${selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                boxShadow: selectedStudents.includes(student.id) ? '0 4px 12px var(--primary-alpha)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {(student.name || student.username || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {student.name || student.username}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                                        {student.batch || 'No Batch'}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedStudents.includes(student.id) && <CheckCircle size={18} color="var(--primary)" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudents.length}</span> students selected
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-reset" onClick={() => {
                                    setShowStudentAllocationModal(false)
                                    setStudentSearchTerm('')
                                }}>Cancel</button>
                                <button className="btn-create-new" onClick={saveStudentAllocations} style={{ background: 'var(--primary)', padding: '0.7rem 2rem', borderRadius: '10px', boxShadow: '0 4px 15px var(--primary-alpha)' }}>
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 1500,
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}>
                    <div className="modal-content" style={{
                        width: '100%',
                        maxWidth: modalStep === 1 ? 'min(800px, calc(100vw - 2rem))' : 'min(900px, calc(100vw - 2rem))',
                        maxHeight: '80vh', // Reduced to 80vh to ensure it stays well within screen
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        background: '#1e293b', // Solid background fallback
                        backgroundImage: 'linear-gradient(145deg, rgba(30,41,59,1), rgba(15,23,42,1))', // opaque gradient
                        border: '1px solid rgba(139,92,246,0.2)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                    }}>
                        {/* Modal Header - Fixed */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid rgba(139,92,246,0.15)',
                            background: 'rgba(15, 23, 42, 0.95)', // Nearly opaque background
                            backdropFilter: 'blur(10px)', // Blur for glass effect without text bleed
                            flexShrink: 0,
                            zIndex: 10
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', borderRadius: '10px' }}>
                                    <Globe size={22} color="#a78bfa" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? 'Edit' : 'Create'} Global Test</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                        {modalStep === 1 ? 'Step 1: Basic Settings & Sections' : 'Step 2: Add Questions to Sections'}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setShowModal(false); setModalStep(1); setEditingId(null); }}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

                            {modalStep === 1 && (
                                <>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">Test Title</label>
                                        <input type="text" placeholder="e.g. Global Complete Assessment - Feb 2026" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Duration (min) — default 180 for Coding+SQL</label>
                                            <input type="number" min="30" max="300" value={newTest.duration} onChange={e => setNewTest({ ...newTest, duration: parseInt(e.target.value) || 180 })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Passing Score (%)</label>
                                            <input type="number" min="0" max="100" value={newTest.passingScore} onChange={e => setNewTest({ ...newTest, passingScore: parseInt(e.target.value) || 60 })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select value={newTest.status} onChange={e => setNewTest({ ...newTest, status: e.target.value })}>
                                                <option value="draft">Draft</option>
                                                <option value="live">Live</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">Max Attempts</label>
                                        <input type="number" min="1" max="10" value={newTest.maxAttempts} onChange={e => setNewTest({ ...newTest, maxAttempts: parseInt(e.target.value) || 1 })} />
                                    </div>
                                    {/* Enhanced Proctoring Settings */}
                                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(251,191,36,0.05))', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                                                <Shield size={20} color="#ef4444" />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#ef4444' }}>Proctoring Settings</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Configure security measures for exam integrity</p>
                                            </div>
                                            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input type="checkbox" checked={proctoringSettings.enabled} onChange={e => setProctoringSettings({ ...proctoringSettings, enabled: e.target.checked })} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Proctoring</span>
                                            </label>
                                        </div>

                                        {proctoringSettings.enabled && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                                {/* Tab Switches */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.trackTabSwitches} onChange={e => setProctoringSettings({ ...proctoringSettings, trackTabSwitches: e.target.checked })} />
                                                        <Eye size={16} color="#f59e0b" />
                                                        Track Tab Switches
                                                    </label>
                                                    {proctoringSettings.trackTabSwitches && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1.5rem' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Max:</span>
                                                            <input type="number" min="1" max="10" value={proctoringSettings.maxTabSwitches} onChange={e => setProctoringSettings({ ...proctoringSettings, maxTabSwitches: parseInt(e.target.value) || 3 })} style={{ width: 50, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Video/Audio Recording */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.enableVideoAudio} onChange={e => setProctoringSettings({ ...proctoringSettings, enableVideoAudio: e.target.checked })} />
                                                        <span style={{ fontSize: '1rem' }}>📹</span>
                                                        Video/Audio Recording
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Record student during test</p>
                                                </div>

                                                {/* Camera Blocking Detection */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.detectCameraBlocking} onChange={e => setProctoringSettings({ ...proctoringSettings, detectCameraBlocking: e.target.checked })} />
                                                        <span style={{ fontSize: '1rem' }}>🚫</span>
                                                        Detect Camera Blocking
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Flag covered/blocked camera</p>
                                                </div>

                                                {/* Phone Detection */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.detectPhoneUsage} onChange={e => setProctoringSettings({ ...proctoringSettings, detectPhoneUsage: e.target.checked })} />
                                                        <span style={{ fontSize: '1rem' }}>📱</span>
                                                        AI Phone Detection
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Detect mobile phones in view</p>
                                                </div>

                                                {/* Copy/Paste Blocking */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.disableCopyPaste} onChange={e => setProctoringSettings({ ...proctoringSettings, disableCopyPaste: e.target.checked })} />
                                                        <span style={{ fontSize: '1rem' }}>📋</span>
                                                        Disable Copy/Paste
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Block clipboard actions</p>
                                                </div>

                                                {/* Fullscreen Enforcement */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.enforceFullscreen} onChange={e => setProctoringSettings({ ...proctoringSettings, enforceFullscreen: e.target.checked })} />
                                                        <span style={{ fontSize: '1rem' }}>🖥️</span>
                                                        Enforce Fullscreen
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Required during test</p>
                                                </div>

                                                {/* Auto Submit on Violation */}
                                                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                        <input type="checkbox" checked={proctoringSettings.autoSubmitOnViolation} onChange={e => setProctoringSettings({ ...proctoringSettings, autoSubmitOnViolation: e.target.checked })} />
                                                        <AlertTriangle size={16} color="#ef4444" />
                                                        Auto-Submit on Max Violations
                                                    </label>
                                                    <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.7rem', color: 'rgba(239,68,68,0.7)' }}>Submit test when violations exceed limit</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">Description (optional)</label>
                                        <textarea placeholder="Instructions for students" value={newTest.description} onChange={e => setNewTest({ ...newTest, description: e.target.value })} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.75rem' }}>Sections — Coding min 2, SQL min 1 (max set by you)</h4>
                                        {(newTest.sectionConfig?.sections || []).map(s => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 120 }}>
                                                    <input type="checkbox" checked={!!s.enabled} onChange={e => toggleSection(s.id, e.target.checked)} />
                                                    {GLOBAL_SECTIONS.find(g => g.id === s.id)?.icon} {GLOBAL_SECTIONS.find(g => g.id === s.id)?.label}
                                                    {s.id === 'coding' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(min 2)</span>}
                                                    {s.id === 'sql' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(min 1)</span>}
                                                </label>
                                                <input type="number" min={s.id === 'coding' ? 2 : s.id === 'sql' ? 1 : 0} placeholder="Count" value={s.questionsCount ?? ''} onChange={e => updateSectionConfig(s.id, 'questionsCount', parseInt(e.target.value) || 0)} style={{ width: 70 }} />
                                                <input type="number" min="0" placeholder="Min" value={s.timeMinutes ?? ''} onChange={e => updateSectionConfig(s.id, 'timeMinutes', parseInt(e.target.value) || 0)} style={{ width: 70 }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn-reset" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="button" className="btn-create-new" onClick={() => setModalStep(2)}>Next: Add Questions</button>
                                    </div>
                                </>
                            )}

                            {modalStep === 2 && (
                                <>
                                    {/* Modern Section Tabs */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '1.5rem',
                                        flexWrap: 'wrap',
                                        padding: '0.5rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {GLOBAL_SECTIONS.map(s => {
                                            const isActive = sectionTab === s.id
                                            const count = (questionsBySection[s.id] || []).length
                                            const sectionColors = {
                                                aptitude: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', color: '#a78bfa' },
                                                verbal: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#60a5fa' },
                                                logical: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' },
                                                coding: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34d399' },
                                                sql: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', color: '#22d3ee' }
                                            }
                                            const colors = sectionColors[s.id] || sectionColors.aptitude
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setSectionTab(s.id)}
                                                    style={{
                                                        padding: '0.75rem 1.25rem',
                                                        borderRadius: '10px',
                                                        border: isActive ? `2px solid ${colors.border}` : '2px solid transparent',
                                                        background: isActive ? colors.bg : 'transparent',
                                                        color: isActive ? colors.color : 'rgba(255,255,255,0.6)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.9rem',
                                                        fontWeight: isActive ? 600 : 400,
                                                        transition: 'all 0.2s ease',
                                                        flex: '1 1 auto',
                                                        justifyContent: 'center',
                                                        minWidth: '120px'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                                    <span>{s.label}</span>
                                                    <span style={{
                                                        background: count > 0
                                                            ? (isActive ? colors.color : 'rgba(255,255,255,0.2)')
                                                            : 'rgba(255,255,255,0.1)',
                                                        color: count > 0 ? (isActive ? '#0f172a' : 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.4)',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        minWidth: '24px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {count}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {sectionTab === 'coding' && (
                                        <>
                                            {/* AI Coding Problem Generator */}
                                            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1.1rem', color: '#10b981' }}>
                                                    <Bot size={20} /> AI Coding Problem Generator
                                                </h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>TOPIC / CONCEPT</label>
                                                        <input type="text" placeholder="e.g., Two Sum, Binary Search, Linked Lists" value={codingAiPrompt.topic} onChange={e => setCodingAiPrompt({ ...codingAiPrompt, topic: e.target.value })} style={{ width: '100%' }} />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>DIFFICULTY</label>
                                                        <select value={codingAiPrompt.difficulty} onChange={e => setCodingAiPrompt({ ...codingAiPrompt, difficulty: e.target.value })}>
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>LANGUAGE</label>
                                                        <select value={codingAiPrompt.language} onChange={e => setCodingAiPrompt({ ...codingAiPrompt, language: e.target.value })}>
                                                            <option value="Python">Python</option>
                                                            <option value="JavaScript">JavaScript</option>
                                                            <option value="Java">Java</option>
                                                            <option value="C">C</option>
                                                            <option value="C++">C++</option>
                                                        </select>
                                                    </div>
                                                    <button type="button" className="btn-create-new" onClick={generateCodingProblem} disabled={isGeneratingCoding} style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                                        {isGeneratingCoding ? <><RefreshCw size={16} className="spin" /> Generating...</> : <><Wand2 size={16} /> Generate</>}
                                                    </button>
                                                </div>
                                                {generatedCodingProblems.length > 0 && (
                                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontWeight: 600, color: '#10b981' }}>✓ Generated {generatedCodingProblems.length} Problem(s)</span>
                                                            <button type="button" className="btn-create-new" onClick={addGeneratedCodingToSection} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                                                <Plus size={16} /> Add to Section
                                                            </button>
                                                        </div>
                                                        {generatedCodingProblems.map((p, i) => (
                                                            <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                                <p style={{ margin: '0 0 0.5rem', fontWeight: 500, color: 'white' }}>{p.question?.substring(0, 150)}...</p>
                                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{p.testCases?.length || 0} test cases</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Manual Entry Section */}
                                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text)' }}>
                                                    <Code size={18} /> Manual Entry
                                                </h4>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Problem description</label>
                                                    <textarea value={codingQuestion.question} onChange={e => setCodingQuestion({ ...codingQuestion, question: e.target.value })} placeholder="Describe the coding problem..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Starter code (optional)</label>
                                                    <textarea value={codingQuestion.starterCode} onChange={e => setCodingQuestion({ ...codingQuestion, starterCode: e.target.value })} placeholder="def solution():\n    pass" rows={4} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Language</label>
                                                    <select value={codingQuestion.language} onChange={e => setCodingQuestion({ ...codingQuestion, language: e.target.value })}>
                                                        <option value="Python">Python</option>
                                                        <option value="JavaScript">JavaScript</option>
                                                        <option value="Java">Java</option>
                                                        <option value="C">C</option>
                                                        <option value="C++">C++</option>
                                                    </select>
                                                </div>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Test cases (input → expected output)</label>
                                                    {codingQuestion.testCases.map((tc, idx) => (
                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                            <input type="text" placeholder="Sample Input" value={tc.input || ''} onChange={e => {
                                                                const t = [...codingQuestion.testCases]; t[idx] = { ...t[idx], input: e.target.value }; setCodingQuestion({ ...codingQuestion, testCases: t })
                                                            }} />
                                                            <input type="text" placeholder="Sample Output" value={tc.expected_output || ''} onChange={e => {
                                                                const t = [...codingQuestion.testCases]; t[idx] = { ...t[idx], expected_output: e.target.value }; setCodingQuestion({ ...codingQuestion, testCases: t })
                                                            }} />
                                                            <button type="button" onClick={() => setCodingQuestion({ ...codingQuestion, testCases: codingQuestion.testCases.filter((_, i) => i !== idx) })} className="btn-reset" style={{ color: 'var(--danger)' }}><X size={18} /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" className="btn-reset" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }} onClick={() => setCodingQuestion({ ...codingQuestion, testCases: [...codingQuestion.testCases, { input: '', expected_output: '' }] })}>+ Add test case</button>
                                                </div>
                                                <button type="button" className="btn-create-new" onClick={addCodingQuestion}>Add this coding problem</button>
                                            </div>

                                            {/* Added Coding Questions List */}
                                            <div style={{ marginTop: '2rem' }}>
                                                {questionsBySection.coding?.length > 0 && <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>Added Coding Problems ({questionsBySection.coding.length})</h4>}
                                                {questionsBySection.coding?.map((q, idx) => (
                                                    <div key={idx} className="card glass" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h5 style={{ margin: '0 0 0.5rem', color: '#60a5fa', fontSize: '1rem' }}>{q.question?.substring(0, 100)}...</h5>
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                                    {q.testCases?.language || (q.testCases?.cases || Array.isArray(q.testCases) ? 'Coding' : 'Python')} • {(Array.isArray(q.testCases) ? q.testCases : (q.testCases?.cases || [])).length} test cases
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button type="button" onClick={() => setManagingTestCases({ index: idx, section: 'coding' })} style={{ padding: '0.5rem 0.75rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                                    <ClipboardList size={16} /> Manage Test Cases
                                                                </button>
                                                                <button type="button" onClick={() => {
                                                                    setQuestionsBySection(prev => ({ ...prev, coding: prev.coding.filter((_, i) => i !== idx) }))
                                                                }} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Local Test Cases Manager Modal */}
                                            {managingTestCases && questionsBySection[managingTestCases.section]?.[managingTestCases.index] && (
                                                <LocalTestCasesManager
                                                    title={questionsBySection[managingTestCases.section][managingTestCases.index].question?.substring(0, 50)}
                                                    inputLabel={managingTestCases.section === 'sql' ? 'Database Schema (SQL)' : 'Sample Input'}
                                                    outputLabel={managingTestCases.section === 'sql' ? 'Expected Result (Table/Text)' : 'Sample Output'}
                                                    initialTestCases={(() => {
                                                        const q = questionsBySection[managingTestCases.section][managingTestCases.index]
                                                        if (Array.isArray(q.testCases)) {
                                                            return q.testCases.map(c => ({
                                                                ...c,
                                                                expectedOutput: c.expected_output || c.expectedOutput,
                                                                isHidden: c.isHidden || false,
                                                                points: c.points || 10,
                                                                description: c.description || ''
                                                            }))
                                                        } else if (managingTestCases.section === 'sql') {
                                                            // Handle SQL specific formats
                                                            // Format 1: schema/expectedOutput properties
                                                            // Format 2: starterCode (schema) and testCases.expectedOutput
                                                            const schema = q.schema || q.starterCode || ''
                                                            const output = q.expectedOutput || q.testCases?.expectedOutput || ''
                                                            if (schema || output) {
                                                                return [{
                                                                    input: schema,
                                                                    expectedOutput: output,
                                                                    isHidden: false,
                                                                    points: q.points || 10,
                                                                    description: 'Default Case'
                                                                }]
                                                            }
                                                        }

                                                        if (q.testCases?.cases) {
                                                            return q.testCases.cases.map(c => ({
                                                                ...c,
                                                                expectedOutput: c.expected_output || c.expectedOutput,
                                                                isHidden: c.isHidden || false,
                                                                points: c.points || 10,
                                                                description: c.description || ''
                                                            }))
                                                        }
                                                        return []
                                                    })()}
                                                    onClose={() => setManagingTestCases(null)}
                                                    onUpdate={(newCases) => {
                                                        const denormalized = newCases.map(c => ({
                                                            input: c.input,
                                                            expected_output: c.expectedOutput,
                                                            isHidden: c.isHidden,
                                                            points: c.points,
                                                            description: c.description
                                                        }))
                                                        setQuestionsBySection(prev => {
                                                            const section = managingTestCases.section
                                                            const list = [...(prev[section] || [])]
                                                            if (list[managingTestCases.index]) {
                                                                const q = list[managingTestCases.index]
                                                                if (section === 'sql') {
                                                                    // For SQL, update root schema/expectedOutput AND starterCode
                                                                    const first = newCases[0] || { input: '', expectedOutput: '' }
                                                                    list[managingTestCases.index] = {
                                                                        ...q,
                                                                        schema: first.input,
                                                                        starterCode: first.input, // Critical: GlobalTestInterface uses this for schema if sqlSchema missing
                                                                        expectedOutput: first.expectedOutput,
                                                                        testCases: denormalized // Store as array for future
                                                                    }
                                                                } else {
                                                                    // For Coding
                                                                    const currentLang = q.testCases?.language || 'Python'
                                                                    if (q.testCases?.language || !Array.isArray(q.testCases)) {
                                                                        list[managingTestCases.index] = {
                                                                            ...q,
                                                                            testCases: {
                                                                                language: currentLang,
                                                                                cases: denormalized
                                                                            }
                                                                        }
                                                                    } else {
                                                                        list[managingTestCases.index] = {
                                                                            ...q,
                                                                            testCases: denormalized
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            return { ...prev, [section]: list }
                                                        })
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}

                                    {sectionTab === 'sql' && (
                                        <>
                                            {/* AI SQL Problem Generator */}
                                            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '16px' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1.1rem', color: '#06b6d4' }}>
                                                    <Bot size={20} /> AI SQL Problem Generator
                                                </h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>TOPIC / CONCEPT</label>
                                                        <input type="text" placeholder="e.g., JOINs, Aggregate Functions, Subqueries" value={sqlAiPrompt.topic} onChange={e => setSqlAiPrompt({ ...sqlAiPrompt, topic: e.target.value })} style={{ width: '100%' }} />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>DIFFICULTY</label>
                                                        <select value={sqlAiPrompt.difficulty} onChange={e => setSqlAiPrompt({ ...sqlAiPrompt, difficulty: e.target.value })}>
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                    </div>
                                                    <button type="button" className="btn-create-new" onClick={generateSqlProblem} disabled={isGeneratingSql} style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                                                        {isGeneratingSql ? <><RefreshCw size={16} className="spin" /> Generating...</> : <><Wand2 size={16} /> Generate</>}
                                                    </button>
                                                </div>
                                                {generatedSqlProblems.length > 0 && (
                                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(6,182,212,0.1)', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontWeight: 600, color: '#06b6d4' }}>✓ Generated {generatedSqlProblems.length} Problem(s)</span>
                                                            <button type="button" className="btn-create-new" onClick={addGeneratedSqlToSection} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                                                                <Plus size={16} /> Add to Section
                                                            </button>
                                                        </div>
                                                        {generatedSqlProblems.map((p, i) => (
                                                            <div key={i} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                                <p style={{ margin: '0 0 0.5rem', fontWeight: 500, color: 'white' }}>{p.question?.substring(0, 150)}...</p>
                                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Schema included</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Manual Entry Section */}
                                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text)' }}>
                                                    <Database size={18} /> Manual Entry
                                                </h4>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Question / instruction</label>
                                                    <textarea value={sqlQuestion.question} onChange={e => setSqlQuestion({ ...sqlQuestion, question: e.target.value })} placeholder="e.g. Write a query to return the top 5 employees by salary" rows={2} style={{ width: '100%', resize: 'vertical' }} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Database schema (CREATE TABLE + INSERT)</label>
                                                    <textarea value={sqlQuestion.schema} onChange={e => setSqlQuestion({ ...sqlQuestion, schema: e.target.value })} placeholder="CREATE TABLE employees (id INT, name TEXT, salary INT);&#10;INSERT INTO employees VALUES (1,'A',100);" rows={6} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="form-label">Expected query result (exact output to match)</label>
                                                    <textarea value={sqlQuestion.expectedOutput} onChange={e => setSqlQuestion({ ...sqlQuestion, expectedOutput: e.target.value })} placeholder="Paste the expected result as shown by SQLite" rows={4} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }} />
                                                </div>
                                                <button type="button" className="btn-create-new" onClick={addSqlQuestion}>Add this SQL question</button>
                                            </div>

                                            {/* Added SQL Questions List */}
                                            <div style={{ marginTop: '2rem' }}>
                                                {questionsBySection.sql?.length > 0 && <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>Added SQL Problems ({questionsBySection.sql.length})</h4>}
                                                {questionsBySection.sql?.map((q, idx) => (
                                                    <div key={idx} className="card glass" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h5 style={{ margin: '0 0 0.5rem', color: '#60a5fa', fontSize: '1rem' }}>{q.question?.substring(0, 100)}...</h5>
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                                    SQL Problem • {(Array.isArray(q.testCases) ? q.testCases : (q.schema ? 1 : 0))} test case(s)
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button type="button" onClick={() => setManagingTestCases({ index: idx, section: 'sql' })} style={{ padding: '0.5rem 0.75rem', background: '#06b6d4', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                                    <ClipboardList size={16} /> Manage Data
                                                                </button>
                                                                <button type="button" onClick={() => {
                                                                    setQuestionsBySection(prev => ({ ...prev, sql: prev.sql.filter((_, i) => i !== idx) }))
                                                                }} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {sectionTab !== 'coding' && sectionTab !== 'sql' && (
                                        <>
                                            {/* AI Question Generator - same as Aptitude Tests */}
                                            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1rem' }}>
                                                    <Sparkles size={18} style={{ color: 'var(--primary)' }} /> AI Question Generator
                                                </h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap' }}>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label">TOPIC</label>
                                                        <input type="text" placeholder="e.g., Number Series, Logical Reasoning" value={aiPrompt.topic} onChange={e => setAiPrompt({ ...aiPrompt, topic: e.target.value })} style={{ width: '100%' }} />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label">DIFFICULTY</label>
                                                        <select value={aiPrompt.difficulty} onChange={e => setAiPrompt({ ...aiPrompt, difficulty: e.target.value })}>
                                                            <option value="Easy">Easy</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="Hard">Hard</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-label">COUNT</label>
                                                        <input type="number" min="1" max="20" value={aiPrompt.count} onChange={e => setAiPrompt({ ...aiPrompt, count: parseInt(e.target.value) || 1 })} style={{ width: 70 }} />
                                                    </div>
                                                    <button type="button" className="btn-create-new" onClick={handleGenerateQuestions} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Sparkles size={16} /> {isGenerating ? 'Generating…' : 'Generate'}
                                                    </button>
                                                </div>
                                                {generatedQuestions.length > 0 && (
                                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{generatedQuestions.length} question(s) generated.</span>
                                                        <button type="button" className="btn-create-new" onClick={addGeneratedToSection} style={{ fontSize: '0.9rem' }}>Add All to Test</button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Questions - card UI like Aptitude */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem' }}>
                                                    <HelpCircle size={18} style={{ color: 'var(--text-muted)' }} /> Questions
                                                </h4>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{(questionsBySection[sectionTab] || []).length} questions</span>
                                            </div>

                                            <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1rem' }}>
                                                {(questionsBySection[sectionTab] || []).map((q, idx) => (
                                                    <div key={idx} className="card glass" style={{ marginBottom: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Q{idx + 1}</span>
                                                            <button type="button" onClick={() => removeQuestion(sectionTab, idx)} className="btn-reset" style={{ color: 'var(--danger)', padding: '0.25rem' }} title="Delete question"><Trash2 size={18} /></button>
                                                        </div>
                                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                            <label className="form-label">QUESTION TEXT</label>
                                                            <textarea value={q.question || ''} onChange={e => updateQuestionInSection(sectionTab, idx, 'question', e.target.value)} placeholder="Enter question text..." rows={2} style={{ width: '100%', resize: 'vertical' }} />
                                                        </div>
                                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                                            <label className="form-label">ANSWER OPTIONS</label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                                {[0, 1, 2, 3].map(i => {
                                                                    const opts = q.options || ['', '', '', '']
                                                                    const isCorrect = (q.correctAnswer ?? 0) === i
                                                                    return (
                                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <button type="button" onClick={() => updateQuestionInSection(sectionTab, idx, 'correctAnswer', i)} style={{ minWidth: 36, height: 36, borderRadius: '8px', border: '2px solid ' + (isCorrect ? 'var(--success)' : 'var(--border-color)'), background: isCorrect ? 'var(--success-alpha)' : 'var(--bg-secondary)', color: isCorrect ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                                                                                {String.fromCharCode(65 + i)}
                                                                            </button>
                                                                            <input type="text" value={opts[i] || ''} onChange={e => { const o = [...opts]; o[i] = e.target.value; updateQuestionInSection(sectionTab, idx, 'options', o); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} style={{ flex: 1 }} />
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--success-alpha)', borderRadius: '8px', border: '1px solid var(--success)' }}>
                                                            <Check size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 500 }}>Correct Answer:</span>
                                                            <span style={{ background: 'var(--success)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.85rem' }}>Option {String.fromCharCode(65 + (q.correctAnswer ?? 0))}</span>
                                                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click any option badge to change</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={addNewMcqToSection} style={{ width: '100%', padding: '1.25rem', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                                    <Plus size={20} /> Add New Question
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {(sectionTab === 'coding' || sectionTab === 'sql') && (
                                        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                            <strong>Added in {GLOBAL_SECTIONS.find(s => s.id === sectionTab)?.label}:</strong>
                                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', maxHeight: 200, overflow: 'auto' }}>
                                                {(questionsBySection[sectionTab] || []).map((q, i) => (
                                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{q.question}</span>
                                                        <button type="button" onClick={() => removeQuestion(sectionTab, i)} className="btn-reset" style={{ color: 'var(--danger)' }}><X size={16} /></button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                                        <button type="button" className="btn-reset" onClick={() => setModalStep(1)}>Back</button>
                                        <button type="button" className="btn-create-new" onClick={handleCreateOrUpdate}>{editingId ? 'Update' : 'Create'} Test</button>
                                    </div>
                                </>
                            )}
                        </div> {/* End Scrollable Content Area */}
                    </div>
                </div>
            )}
        </div>
    )
}

// ==================== APTITUDE TESTS ADMIN ====================
function AptitudeTestsAdmin() {
    const user = useAuth()?.user
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showQuestionsModal, setShowQuestionsModal] = useState(false)
    const [selectedTest, setSelectedTest] = useState(null)
    const [viewLoading, setViewLoading] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingTest, setEditingTest] = useState(null)
    const [editingQuestions, setEditingQuestions] = useState([])
    const [editSaving, setEditSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [aiPrompt, setAiPrompt] = useState({ topic: '', difficulty: 'Medium', count: 5 })
    const [submissions, setSubmissions] = useState([])
    const [uploading, setUploading] = useState(false)
    const csvInputRef = useRef(null)

    // Student allocation state
    const [showStudentAllocationModal, setShowStudentAllocationModal] = useState(false)
    const [allStudents, setAllStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [allocatingTestId, setAllocatingTestId] = useState(null)
    const [studentSearchTerm, setStudentSearchTerm] = useState('')

    const [newTest, setNewTest] = useState({
        title: '',
        difficulty: 'Medium',
        duration: 30,
        passingScore: 60,
        maxTabSwitches: 3,
        maxAttempts: 1,
        startTime: '',
        deadline: '',
        description: '',
        status: 'live',
        questions: []
    })
    const [manualQuestion, setManualQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'general',
        explanation: ''
    })

    useEffect(() => {
        fetchTests()
        fetchSubmissions()
        fetchAllStudents()
    }, [])

    const fetchAllStudents = async () => {
        try {
            const response = await axios.get(`${API_BASE}/users?role=student`)
            setAllStudents(response.data || [])
        } catch (error) {
            console.error('Error fetching students:', error)
        }
    }

    const fetchTests = async () => {
        try {
            const response = await axios.get(`${API_BASE}/aptitude`)
            setTests(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching tests:', error)
            setLoading(false)
        }
    }

    const fetchSubmissions = async () => {
        try {
            const response = await axios.get(`${API_BASE}/aptitude-submissions`)
            setSubmissions(response.data)
        } catch (error) {
            console.error('Error fetching submissions:', error)
        }
    }

    const openStudentAllocationModal = async (testId) => {
        setAllocatingTestId(testId)
        try {
            const response = await axios.get(`${API_BASE}/aptitude/${testId}/allocated-students`)
            setSelectedStudents(response.data.studentIds || [])
        } catch (error) {
            setSelectedStudents([])
        }
        setShowStudentAllocationModal(true)
    }

    const saveStudentAllocations = async () => {
        if (!allocatingTestId) return
        try {
            await axios.post(`${API_BASE}/aptitude/${allocatingTestId}/allocate-students`, {
                studentIds: selectedStudents
            })
            alert(`✅ Test allocated to ${selectedStudents.length} student(s)`)
            setShowStudentAllocationModal(false)
            setSelectedStudents([])
            setAllocatingTestId(null)
        } catch (error) {
            alert('❌ Error allocating test: ' + error.response?.data?.error || error.message)
        }
    }

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const handleGenerateQuestions = async () => {
        setIsGenerating(true)
        try {
            const response = await axios.post(`${API_BASE}/ai/generate-aptitude`, aiPrompt)
            if (response.data.questions) {
                setGeneratedQuestions(response.data.questions)
            }
        } catch (error) {
            alert('Error generating questions')
        } finally {
            setIsGenerating(false)
        }
    }

    const addGeneratedQuestions = () => {
        setNewTest(prev => ({
            ...prev,
            questions: [...prev.questions, ...generatedQuestions]
        }))
        setGeneratedQuestions([])
    }

    const handleCreateTest = async (e) => {
        if (e) e.preventDefault()

        if (newTest.questions.length === 0) {
            alert('Please add at least one question')
            return
        }

        // Validate that all questions have content and options
        const invalidQuestions = newTest.questions.filter(q => {
            return !q.question.trim() || q.options.some(opt => !opt.trim())
        })

        if (invalidQuestions.length > 0) {
            alert('Please fill in all questions and options')
            return
        }

        try {
            // Convert dates to ISO strings without timezone conversion
            // because datetime-local input is already in local time
            const testPayload = { ...newTest, createdBy: user?.id }
            if (testPayload.startTime) {
                const date = new Date(testPayload.startTime)
                if (!isNaN(date.getTime())) testPayload.startTime = date.toISOString()
            }
            if (testPayload.deadline) {
                const date = new Date(testPayload.deadline)
                if (!isNaN(date.getTime())) testPayload.deadline = date.toISOString()
            }

            await axios.post(`${API_BASE}/aptitude`, testPayload)
            setShowModal(false)
            setNewTest({
                title: '',
                difficulty: 'Medium',
                duration: 30,
                passingScore: 60,
                maxTabSwitches: 3,
                maxAttempts: 1,
                startTime: '',
                deadline: '',
                description: '',
                status: 'live',
                questions: []
            })
            fetchTests()
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.error || 'Error creating test')
        }
    }

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploading(true)
        try {
            const text = await file.text()
            // Proper CSV line parser that handles empty fields and quoted commas
            const parseCSVLine = (line) => {
                const result = []
                let current = '', inQuotes = false
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '"') { inQuotes = !inQuotes }
                    else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = '' }
                    else { current += line[i] }
                }
                result.push(current.trim())
                return result
            }
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
            if (lines.length < 2) { alert('CSV must have header + at least one row'); return }
            const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim())
            const questions = []
            for (let i = 1; i < lines.length; i++) {
                const vals = parseCSVLine(lines[i])
                const row = {}
                headers.forEach((h, idx) => row[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim())
                if (!row.question) continue
                // Support many header naming styles for options
                const opt1 = row.option1 || row.option_1 || row['option 1'] || row['option a'] || row.a || row.opt1 || row.choice1 || ''
                const opt2 = row.option2 || row.option_2 || row['option 2'] || row['option b'] || row.b || row.opt2 || row.choice2 || ''
                const opt3 = row.option3 || row.option_3 || row['option 3'] || row['option c'] || row.c || row.opt3 || row.choice3 || ''
                const opt4 = row.option4 || row.option_4 || row['option 4'] || row['option d'] || row.d || row.opt4 || row.choice4 || ''
                // Support letter-based correct answer (A→0, B→1, C→2, D→3) or numeric index
                const rawAnswer = (row.correctanswer || row.correct_answer || row.answer || row.correctoption || '').trim().toUpperCase()
                const letterMap = { A: 0, B: 1, C: 2, D: 3 }
                const correctAnswer = rawAnswer in letterMap ? letterMap[rawAnswer] : (parseInt(rawAnswer) || 0)
                questions.push({
                    question: row.question,
                    options: [opt1, opt2, opt3, opt4],
                    correctAnswer,
                    category: row.category || 'general',
                    explanation: row.explanation || ''
                })
            }
            if (questions.length === 0) { alert('No valid rows. CSV needs: question,option1,option2,option3,option4,correctAnswer'); setUploading(false); return }
            const payload = {
                title: file.name.replace('.csv', '') + ' - CSV Import',
                difficulty: 'Medium', duration: Math.max(30, questions.length * 2),
                passingScore: 60, maxTabSwitches: 3, maxAttempts: 1,
                status: 'draft', createdBy: user?.id, questions
            }
            await axios.post(`${API_BASE}/aptitude`, payload)
            alert(`Created aptitude test with ${questions.length} questions from CSV!`)
            fetchTests()
        } catch (err) {
            alert('CSV upload failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleToggleStatus = async (test) => {
        const newStatus = test.status === 'live' ? 'ended' : 'live';
        const action = newStatus === 'live' ? 'make this test visible to students' : 'hide this test from students';

        if (window.confirm(`Are you sure you want to ${action}?`)) {
            try {
                await axios.patch(`${API_BASE}/aptitude/${test.id}/status`, { status: newStatus })
                fetchTests()
            } catch (error) {
                alert('Error updating test status')
            }
        }
    }

    const handleDeleteTest = async (id) => {
        if (!window.confirm('Delete this aptitude test?')) {
            return
        }

        try {
            await axios.delete(`${API_BASE}/aptitude/${id}`)
            fetchTests()
        } catch (error) {
            console.error(error)
            alert('Error deleting test')
        }
    }

    const removeQuestion = (index) => {
        setNewTest(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }))
    }

    if (loading) return <div className="loading-spinner"></div>

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
                        <Target size={28} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                            Aptitude Tests
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                            Create and manage aptitude tests for students
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input type="file" accept=".csv" ref={csvInputRef} style={{ display: 'none' }} onChange={handleCSVUpload} />
                    <button
                        onClick={() => csvInputRef.current?.click()}
                        disabled={uploading}
                        className="btn-create-new premium-btn"
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Upload size={18} /> {uploading ? 'Uploading...' : 'CSV Upload'}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-create-new premium-btn"
                        style={{
                            padding: '0.75rem 1.25rem',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            borderRadius: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={20} /> Create New Test
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Tests</span>
                        <span className="stat-value">{tests.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Live Tests</span>
                        <span className="stat-value">{tests.filter(t => t.status === 'live').length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Send size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Submissions</span>
                        <span className="stat-value">{submissions.length}</span>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Trophy size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Pass Rate</span>
                        <span className="stat-value">
                            {submissions.length > 0
                                ? Math.round((submissions.filter(s => s.status === 'passed').length / submissions.length) * 100)
                                : 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Tests Table */}
            <div className="card glass">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Target size={20} style={{ color: '#8b5cf6' }} /> All Aptitude Tests
                </h3>
                <div className="table-container" style={{ border: 'none' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Test Title</th>
                                <th>Difficulty</th>
                                <th>Questions</th>
                                <th>Duration</th>
                                <th>Pass %</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.map(test => (
                                <tr key={test.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Target size={16} color="white" />
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{test.title}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`difficulty-badge ${test.difficulty?.toLowerCase()}`}>
                                            {test.difficulty}
                                        </span>
                                    </td>
                                    <td>{test.questionCount || test.totalQuestions}</td>
                                    <td>{test.duration} min</td>
                                    <td>{test.passingScore}%</td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            background: test.status === 'live'
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : test.status === 'ended'
                                                    ? 'rgba(239, 68, 68, 0.15)'
                                                    : 'rgba(107, 114, 128, 0.15)',
                                            color: test.status === 'live'
                                                ? '#10b981'
                                                : test.status === 'ended'
                                                    ? '#ef4444'
                                                    : '#6b7280',
                                            fontSize: '0.8rem',
                                            fontWeight: 500
                                        }}>
                                            {test.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={async () => {
                                                    setViewLoading(true)
                                                    try {
                                                        const res = await axios.get(`${API_BASE}/aptitude/${test.id}`)
                                                        setSelectedTest(res.data)
                                                        setShowQuestionsModal(true)
                                                    } catch (e) {
                                                        alert('Failed to load test questions')
                                                    } finally {
                                                        setViewLoading(false)
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#3b82f6',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await axios.get(`${API_BASE}/aptitude/${test.id}`)
                                                        const t = res.data
                                                        setEditingTest({
                                                            id: t.id,
                                                            title: t.title,
                                                            difficulty: t.difficulty,
                                                            duration: t.duration,
                                                            passingScore: t.passingScore,
                                                            maxTabSwitches: t.maxTabSwitches || 3,
                                                            maxAttempts: t.maxAttempts || 1,
                                                            startTime: t.startTime ? t.startTime.slice(0, 16) : '',
                                                            deadline: t.deadline ? t.deadline.slice(0, 16) : '',
                                                            description: t.description || '',
                                                            status: t.status
                                                        })
                                                        setEditingQuestions((t.questions || []).map(q => ({ ...q })))
                                                        setShowEditModal(true)
                                                    } catch (e) {
                                                        alert('Failed to load test for editing')
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#f59e0b',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openStudentAllocationModal(test.id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'rgba(168, 85, 247, 0.1)',
                                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#a855f7',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title="Assign this test to specific students"
                                            >
                                                👥 Assign
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(test)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: test.status === 'live'
                                                        ? 'rgba(245, 158, 11, 0.1)'
                                                        : 'rgba(16, 185, 129, 0.1)',
                                                    border: test.status === 'live'
                                                        ? '1px solid rgba(245, 158, 11, 0.3)'
                                                        : '1px solid rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '6px',
                                                    color: test.status === 'live' ? '#f59e0b' : '#10b981',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                                title={test.status === 'live' ? 'End test (hide from students)' : 'Make test live (show to students)'}
                                            >
                                                {test.status === 'live' ? 'End' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTest(test.id)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Test Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <div className="modal-header">
                            <div className="modal-title-with-icon">
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Target size={20} color="white" />
                                </div>
                                <h2>Create Aptitude Test</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTest} className="modal-body">
                            {/* Test Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label"><FileText size={14} style={{ marginRight: '0.5rem' }} /> Test Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter test title..."
                                        value={newTest.title}
                                        onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Clock size={14} style={{ marginRight: '0.5rem' }} /> Duration (mins)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="180"
                                        value={newTest.duration}
                                        onChange={e => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><RefreshCw size={14} style={{ marginRight: '0.5rem' }} /> Attempts</label>
                                    <select
                                        value={newTest.maxAttempts}
                                        onChange={e => setNewTest({ ...newTest, maxAttempts: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>1 Attempt</option>
                                        <option value={2}>2 Attempts</option>
                                        <option value={3}>3 Attempts</option>
                                        <option value={5}>5 Attempts</option>
                                        <option value={-1}>Unlimited</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label"><AlertTriangle size={14} style={{ marginRight: '0.5rem' }} /> Max Tab Switches (Violations)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={newTest.maxTabSwitches}
                                        onChange={e => setNewTest({ ...newTest, maxTabSwitches: parseInt(e.target.value) })}
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Test auto-submits if exceeded</small>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Calendar size={14} style={{ marginRight: '0.5rem' }} /> Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={newTest.startTime}
                                        onChange={e => setNewTest({ ...newTest, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Calendar size={14} style={{ marginRight: '0.5rem' }} /> End Time (Deadline)</label>
                                    <input
                                        type="datetime-local"
                                        value={newTest.deadline}
                                        onChange={e => setNewTest({ ...newTest, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Difficulty</label>
                                    <select
                                        value={newTest.difficulty}
                                        onChange={e => setNewTest({ ...newTest, difficulty: e.target.value })}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newTest.passingScore}
                                        onChange={e => setNewTest({ ...newTest, passingScore: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Settings size={14} style={{ marginRight: '0.5rem' }} /> Test Status</label>
                                    <select
                                        value={newTest.status}
                                        onChange={e => setNewTest({ ...newTest, status: e.target.value })}
                                    >
                                        <option value="live">Live - Visible to students</option>
                                        <option value="ended">Ended - Hidden from students</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label"><FileText size={14} style={{ marginRight: '0.5rem' }} /> Description (Optional)</label>
                                <textarea
                                    placeholder="Brief description of the test..."
                                    value={newTest.description}
                                    onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            </div>

                            {/* AI Question Generation */}
                            <div style={{
                                background: 'var(--secondary-alpha)',
                                border: '1px solid var(--secondary)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', color: 'var(--text-primary)' }}>
                                    <Sparkles size={18} color="var(--secondary)" /> AI Question Generator
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">TOPIC</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Number Series, Logical Reasoning..."
                                            value={aiPrompt.topic}
                                            onChange={e => setAiPrompt({ ...aiPrompt, topic: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">DIFFICULTY</label>
                                        <select
                                            value={aiPrompt.difficulty}
                                            onChange={e => setAiPrompt({ ...aiPrompt, difficulty: e.target.value })}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">COUNT</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={aiPrompt.count}
                                            onChange={e => setAiPrompt({ ...aiPrompt, count: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGenerateQuestions}
                                        disabled={isGenerating}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'var(--primary)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: 600,
                                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Sparkles size={16} />
                                        {isGenerating ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>

                                {/* Generated Questions Preview */}
                                {generatedQuestions.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 600 }}>
                                                ✨ Generated {generatedQuestions.length} questions
                                            </span>
                                            <button
                                                type="button"
                                                onClick={addGeneratedQuestions}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'var(--success-alpha)',
                                                    border: '1px solid var(--success)',
                                                    borderRadius: '6px',
                                                    color: 'var(--success)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Add All to Test
                                            </button>
                                        </div>
                                        <div style={{
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            padding: '0.75rem'
                                        }}>
                                            {generatedQuestions.map((q, idx) => (
                                                <div key={idx} style={{
                                                    padding: '0.5rem',
                                                    borderBottom: idx < generatedQuestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    Q{idx + 1}: {q.question.substring(0, 80)}...
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Questions Section */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '1.25rem',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        margin: 0,
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        fontWeight: 600
                                    }}>
                                        <HelpCircle size={18} style={{ color: 'var(--primary)' }} /> Questions
                                    </h4>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--primary)',
                                        background: 'var(--primary-alpha)',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '20px',
                                        fontWeight: 500
                                    }}>
                                        {newTest.questions.length} question{newTest.questions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Questions List - Each as editable card */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {newTest.questions.map((q, idx) => (
                                        <div key={idx} style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: 'var(--card-shadow)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {/* Question Header */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1.25rem'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem'
                                                }}>
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                        color: 'white',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.5px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Q{idx + 1}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(idx)}
                                                    style={{
                                                        background: 'var(--danger-alpha)',
                                                        border: '1px solid var(--danger)',
                                                        borderRadius: '8px',
                                                        padding: '0.5rem',
                                                        cursor: 'pointer',
                                                        color: 'var(--danger)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={e => {
                                                        e.currentTarget.style.background = 'var(--danger)';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseOut={e => {
                                                        e.currentTarget.style.background = 'var(--danger-alpha)';
                                                        e.currentTarget.style.color = 'var(--danger)';
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Question Input */}
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <label style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-muted)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '0.5rem',
                                                    display: 'block'
                                                }}>
                                                    Question Text
                                                </label>
                                                <input
                                                    type="text"
                                                    value={q.question}
                                                    onChange={e => {
                                                        const updated = [...newTest.questions];
                                                        updated[idx] = { ...updated[idx], question: e.target.value };
                                                        setNewTest({ ...newTest, questions: updated });
                                                    }}
                                                    placeholder="Enter your question here..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        fontSize: '0.95rem',
                                                        borderRadius: '10px',
                                                        border: '2px solid var(--border-color)',
                                                        background: 'var(--bg-primary)',
                                                        color: 'var(--text-primary)',
                                                        transition: 'border-color 0.2s'
                                                    }}
                                                />
                                            </div>

                                            {/* Options Grid */}
                                            <div style={{ marginBottom: '1.25rem' }}>
                                                <label style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-muted)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '0.75rem',
                                                    display: 'block'
                                                }}>
                                                    Answer Options
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                background: q.correctAnswer === optIdx ? 'var(--success-alpha)' : 'var(--bg-primary)',
                                                                padding: '0.5rem',
                                                                borderRadius: '10px',
                                                                border: q.correctAnswer === optIdx ? '2px solid var(--success)' : '2px solid var(--border-color)',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <span
                                                                onClick={() => {
                                                                    const updated = [...newTest.questions];
                                                                    updated[idx] = { ...updated[idx], correctAnswer: optIdx };
                                                                    setNewTest({ ...newTest, questions: updated });
                                                                }}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '8px',
                                                                    background: q.correctAnswer === optIdx
                                                                        ? 'var(--success)'
                                                                        : 'var(--bg-tertiary)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.85rem',
                                                                    color: q.correctAnswer === optIdx ? 'white' : 'var(--text-muted)',
                                                                    flexShrink: 0,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    border: q.correctAnswer === optIdx ? 'none' : '1px solid var(--border-color)'
                                                                }}
                                                                title="Click to set as correct answer"
                                                            >{letter}</span>
                                                            <input
                                                                type="text"
                                                                value={q.options[optIdx] || ''}
                                                                onChange={e => {
                                                                    const updated = [...newTest.questions];
                                                                    const newOptions = [...updated[idx].options];
                                                                    newOptions[optIdx] = e.target.value;
                                                                    updated[idx] = { ...updated[idx], options: newOptions };
                                                                    setNewTest({ ...newTest, questions: updated });
                                                                }}
                                                                placeholder={`Option ${letter}`}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '0.625rem 0.875rem',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'var(--text-primary)',
                                                                    fontSize: '0.9rem'
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Correct Answer Indicator */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.875rem 1rem',
                                                background: 'var(--success-alpha)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--success)'
                                            }}>
                                                <CheckCircle size={18} color="var(--success)" />
                                                <span style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    Correct Answer:
                                                </span>
                                                <span style={{
                                                    background: 'var(--success)',
                                                    color: 'white',
                                                    padding: '0.375rem 0.875rem',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem'
                                                }}>
                                                    Option {['A', 'B', 'C', 'D'][q.correctAnswer]}
                                                </span>
                                                <span style={{
                                                    marginLeft: 'auto',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    Click any option badge to change
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add New Question Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewTest(prev => ({
                                                ...prev,
                                                questions: [...prev.questions, {
                                                    question: '',
                                                    options: ['', '', '', ''],
                                                    correctAnswer: 0,
                                                    category: 'general',
                                                    explanation: ''
                                                }]
                                            }));
                                        }}
                                        style={{
                                            padding: '1.25rem',
                                            background: 'var(--bg-card)',
                                            border: '2px dashed var(--border-color)',
                                            borderRadius: '16px',
                                            color: 'var(--text-muted)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            transition: 'all 0.2s',
                                            fontSize: '0.95rem'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.color = 'var(--primary)';
                                            e.currentTarget.style.background = 'var(--primary-alpha)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                            e.currentTarget.style.background = 'var(--bg-card)';
                                        }}
                                    >
                                        <Plus size={20} /> Add New Question
                                    </button>
                                </div>
                            </div>

                            <div className="form-actions" style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '1.5rem',
                                marginTop: '0.5rem'
                            }}>
                                <button type="button" className="btn-reset" onClick={() => setShowModal(false)}>
                                    <X size={16} /> Cancel
                                </button>
                                <button type="submit" className="btn-create-new" disabled={newTest.questions.length === 0}>
                                    <Save size={16} /> Create Test
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Questions Modal */}
            {showQuestionsModal && selectedTest && (
                <div className="modal-overlay" onClick={() => setShowQuestionsModal(false)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '780px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <div className="modal-title-with-icon">
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Target size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedTest.title}</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {selectedTest.questions?.length || selectedTest.totalQuestions} Questions &bull; {selectedTest.duration} min &bull; Pass: {selectedTest.passingScore}% &bull; <span style={{ color: selectedTest.difficulty === 'Hard' ? '#ef4444' : selectedTest.difficulty === 'Easy' ? '#10b981' : '#f59e0b' }}>{selectedTest.difficulty}</span>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowQuestionsModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Legend */}
                        <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(16,185,129,0.25)', border: '1px solid #10b981' }} /> Correct Answer
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(71,85,105,0.3)', border: '1px solid transparent' }} /> Other Options
                            </div>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem' }}>
                            {(!selectedTest.questions || selectedTest.questions.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>No questions found for this test.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {selectedTest.questions.map((q, idx) => (
                                        <div key={idx} style={{
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {/* Question header */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <span style={{
                                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                                    color: 'white', padding: '0.25rem 0.6rem',
                                                    borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
                                                }}>Q{idx + 1}</span>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: 500, lineHeight: 1.5 }}>{q.question}</span>
                                                    {q.category && (
                                                        <span style={{ marginLeft: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '4px', fontSize: '0.72rem', color: '#a78bfa' }}>{q.category}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Options grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginLeft: '2.5rem' }}>
                                                {q.options?.map((opt, optIdx) => {
                                                    const isCorrect = optIdx === q.correctAnswer
                                                    return (
                                                        <div key={optIdx} style={{
                                                            padding: '0.6rem 0.85rem',
                                                            background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(71,85,105,0.2)',
                                                            borderRadius: '8px', fontSize: '0.85rem',
                                                            border: isCorrect ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                        }}>
                                                            <span style={{
                                                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                                background: isCorrect ? '#10b981' : 'rgba(71,85,105,0.4)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.72rem', fontWeight: 700, color: 'white'
                                                            }}>{['A','B','C','D'][optIdx]}</span>
                                                            <span style={{ color: isCorrect ? '#10b981' : 'var(--text-main)', fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                                                            {isCorrect && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div style={{ marginTop: '0.75rem', marginLeft: '2.5rem', padding: '0.6rem 0.85rem', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', borderLeft: '3px solid #3b82f6' }}>
                                                    <strong style={{ color: '#60a5fa' }}>Explanation: </strong>{q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Test Modal */}
            {showEditModal && editingTest && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '860px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <div className="modal-title-with-icon">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Save size={20} color="white" />
                                </div>
                                <h2>Edit Aptitude Test</h2>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="modal-close"><X size={20} /></button>
                        </div>

                        <div className="modal-body premium-form" style={{ overflowY: 'auto' }}>
                            {/* Test Details Section */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-main)' }}>Test Details</h3>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input type="text" value={editingTest.title} onChange={e => setEditingTest(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Difficulty</label>
                                        <select value={editingTest.difficulty} onChange={e => setEditingTest(p => ({ ...p, difficulty: e.target.value }))}>
                                            <option>Easy</option><option>Medium</option><option>Hard</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Duration (min)</label>
                                        <input type="number" min="5" value={editingTest.duration} onChange={e => setEditingTest(p => ({ ...p, duration: parseInt(e.target.value) || 30 }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Pass Score (%)</label>
                                        <input type="number" min="0" max="100" value={editingTest.passingScore} onChange={e => setEditingTest(p => ({ ...p, passingScore: parseInt(e.target.value) || 60 }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Tab Switches</label>
                                        <input type="number" min="0" value={editingTest.maxTabSwitches} onChange={e => setEditingTest(p => ({ ...p, maxTabSwitches: parseInt(e.target.value) || 3 }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Attempts</label>
                                        <input type="number" min="1" value={editingTest.maxAttempts} onChange={e => setEditingTest(p => ({ ...p, maxAttempts: parseInt(e.target.value) || 1 }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select value={editingTest.status} onChange={e => setEditingTest(p => ({ ...p, status: e.target.value }))}>
                                            <option value="draft">Draft</option><option value="live">Live</option><option value="ended">Ended</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Time (optional)</label>
                                        <input type="datetime-local" value={editingTest.startTime} onChange={e => setEditingTest(p => ({ ...p, startTime: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Deadline (optional)</label>
                                        <input type="datetime-local" value={editingTest.deadline} onChange={e => setEditingTest(p => ({ ...p, deadline: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea rows="2" value={editingTest.description} onChange={e => setEditingTest(p => ({ ...p, description: e.target.value }))} />
                                </div>
                            </div>

                            {/* Questions Section */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Questions ({editingQuestions.length})</h3>
                                <button
                                    type="button"
                                    onClick={() => setEditingQuestions(p => [...p, { id: `new-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, category: 'general', explanation: '' }])}
                                    style={{ padding: '0.4rem 0.9rem', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Plus size={15} /> Add Question
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {editingQuestions.map((q, idx) => (
                                    <div key={q.id || idx} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>Q{idx + 1}</span>
                                            <button type="button" onClick={() => setEditingQuestions(p => p.filter((_, i) => i !== idx))}
                                                style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Question</label>
                                            <textarea rows="2" value={q.question} onChange={e => setEditingQuestions(p => p.map((qu, i) => i === idx ? { ...qu, question: e.target.value } : qu))} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <input type="radio" name={`correct-${idx}`} checked={q.correctAnswer === oIdx}
                                                        onChange={() => setEditingQuestions(p => p.map((qu, i) => i === idx ? { ...qu, correctAnswer: oIdx } : qu))}
                                                        title="Mark as correct answer"
                                                        style={{ accentColor: '#10b981', flexShrink: 0 }} />
                                                    <input type="text" placeholder={`Option ${['A','B','C','D'][oIdx]}`} value={opt}
                                                        onChange={e => setEditingQuestions(p => p.map((qu, i) => i === idx ? { ...qu, options: qu.options.map((o, oi) => oi === oIdx ? e.target.value : o) } : qu))}
                                                        style={{ flex: 1, padding: '0.45rem 0.65rem', borderRadius: '6px', background: q.correctAnswer === oIdx ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)', border: q.correctAnswer === oIdx ? '1px solid #10b981' : '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Category</label>
                                                <input type="text" value={q.category} onChange={e => setEditingQuestions(p => p.map((qu, i) => i === idx ? { ...qu, category: e.target.value } : qu))} style={{ fontSize: '0.85rem' }} />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Explanation (optional)</label>
                                                <input type="text" value={q.explanation} onChange={e => setEditingQuestions(p => p.map((qu, i) => i === idx ? { ...qu, explanation: e.target.value } : qu))} style={{ fontSize: '0.85rem' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0 }}>
                            <button className="btn-reset" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button
                                className="btn-create-new"
                                disabled={editSaving}
                                onClick={async () => {
                                    setEditSaving(true)
                                    try {
                                        await axios.put(`${API_BASE}/aptitude/${editingTest.id}`, {
                                            ...editingTest,
                                            questions: editingQuestions
                                        })
                                        alert('Test updated successfully!')
                                        setShowEditModal(false)
                                        fetchTests()
                                    } catch (err) {
                                        alert('Failed to save: ' + (err.response?.data?.error || err.message))
                                    } finally {
                                        setEditSaving(false)
                                    }
                                }}
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: editSaving ? 0.7 : 1 }}
                            >
                                <Save size={16} /> {editSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStudentAllocationModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowStudentAllocationModal(false)
                    setStudentSearchTerm('')
                }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="modal-title-with-icon">
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Assign Students</h2>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select students for this aptitude test</p>
                                </div>
                            </div>
                            <button onClick={() => {
                                setShowStudentAllocationModal(false)
                                setStudentSearchTerm('')
                            }} className="modal-close"><X size={20} /></button>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or batch..."
                                    value={studentSearchTerm}
                                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.7rem 1rem 0.7rem 2.5rem',
                                        borderRadius: '10px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-main)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const filtered = allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    )
                                    const allSelected = filtered.every(s => selectedStudents.includes(s.id))
                                    if (allSelected) {
                                        setSelectedStudents(prev => prev.filter(id => !filtered.map(s => s.id).includes(id)))
                                    } else {
                                        setSelectedStudents(prev => [...new Set([...prev, ...filtered.map(s => s.id)])])
                                    }
                                }}
                                style={{
                                    padding: '0.7rem 1.2rem',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {allStudents.filter(s =>
                                    (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                    (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>No students found matching your search.</p>
                                    </div>
                                ) : (
                                    allStudents.filter(s =>
                                        (s.name || s.username || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                        (s.batch || '').toLowerCase().includes(studentSearchTerm.toLowerCase())
                                    ).map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudentSelection(student.id)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '1rem',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary-alpha)' : 'var(--bg-card)',
                                                border: `1.5px solid ${selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                boxShadow: selectedStudents.includes(student.id) ? '0 4px 12px var(--primary-alpha)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: selectedStudents.includes(student.id) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 700, color: 'white'
                                            }}>
                                                {(student.name || student.username || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {student.name || student.username}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                                        {student.batch || 'No Batch'}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedStudents.includes(student.id) && <CheckCircle size={18} color="var(--primary)" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudents.length}</span> students selected
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-reset" onClick={() => {
                                    setShowStudentAllocationModal(false)
                                    setStudentSearchTerm('')
                                }}>Cancel</button>
                                <button className="btn-create-new" onClick={saveStudentAllocations} style={{ background: 'var(--primary)', padding: '0.7rem 2rem', borderRadius: '10px', boxShadow: '0 4px 15px var(--primary-alpha)' }}>
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==================== FEATURES 39-43: ADMIN ANALYTICS DASHBOARD ====================
function AdminAnalyticsDashboard() {
    const { t } = useI18n()
    const [activeTab, setActiveTab] = useState('overview')
    const [timeToSolve, setTimeToSolve] = useState(null)
    const [topicAnalysis, setTopicAnalysis] = useState(null)
    const [proctoring, setProctoring] = useState(null)
    const [studentStats, setStudentStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [searchStudent, setSearchStudent] = useState('')

    useEffect(() => {
        setLoading(true)
        Promise.all([
            axios.get(`${API_BASE}/analytics/time-to-solve`),
            axios.get(`${API_BASE}/analytics/topics`),
            axios.get(`${API_BASE}/proctoring/analytics`).catch(() => ({ data: null })),
            axios.get(`${API_BASE}/proctoring/analytics/by-student`).catch(() => ({ data: null }))
        ]).then(([tRes, taRes, prRes, ssRes]) => {
            setTimeToSolve(tRes.data)
            setTopicAnalysis(taRes.data)
            setProctoring(prRes.data)
            setStudentStats(ssRes.data)
            setLoading(false)
        }).catch(err => { console.error(err); setLoading(false) })
    }, [])

    const handleExport = async (format) => {
        setExporting(true)
        try {
            if (format === 'csv') {
                const res = await axios.get(`${API_BASE}/analytics/export/csv`, { responseType: 'blob' })
                const url = window.URL.createObjectURL(new Blob([res.data]))
                const a = document.createElement('a'); a.href = url; a.download = `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`; a.click()
            } else {
                const res = await axios.get(`${API_BASE}/analytics/export/json`)
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `platform_analytics_${new Date().toISOString().split('T')[0]}.json`; a.click()
            }
        } catch (err) { console.error(err) }
        setExporting(false)
    }

    if (loading) return <div className="loading-spinner"></div>

    const tabs = [
        { id: 'overview', label: t('topic_analysis'), icon: <BarChart2 size={16} /> },
        { id: 'time-to-solve', label: t('time_to_solve'), icon: <Clock size={16} /> },
        { id: 'proctoring', label: '🎥 Proctoring', icon: <Video size={16} /> },
        { id: 'student-stats', label: '👥 Student Stats', icon: <Users size={16} /> },
        { id: 'export', label: t('export_report'), icon: <Download size={16} /> }
    ]

    return (
        <div className="animate-fadeIn">
            {/* Tabs */}
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

            {/* TOPIC OVERVIEW TAB */}
            {activeTab === 'overview' && topicAnalysis && (
                <div>
                    {/* By Type Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {topicAnalysis.byType.map((item, i) => (
                            <div key={i} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'capitalize' }}>{item.type}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                                    <div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{item.submissions}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('submissions')}</div></div>
                                    <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.avgScore >= 70 ? '#10b981' : '#f59e0b' }}>{item.avgScore}%</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('avg_score')}</div></div>
                                    <div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{item.uniqueStudents}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('students')}</div></div>
                                </div>
                                <div style={{ marginTop: '1rem', height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${item.passRate}%`, borderRadius: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.5s' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    <span>{item.passRate}% {t('pass_rate')}</span>
                                    <span>{item.failRate}% {t('fail_rate')}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Difficulty + Language side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Target size={18} color="#f59e0b" /> {t('by_difficulty')}</h3>
                            {topicAnalysis.byDifficulty.map((d, i) => {
                                const colors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 700, width: '70px', textTransform: 'capitalize', color: colors[d.difficulty] || '#3b82f6' }}>{d.difficulty}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${d.passRate}%`, borderRadius: '4px', background: colors[d.difficulty] || '#3b82f6' }} />
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', width: '45px', textAlign: 'right' }}>{d.avgScore}%</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '40px' }}>{d.submissions}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Code size={18} color="#8b5cf6" /> {t('by_language')}</h3>
                            {topicAnalysis.byLanguage.map((l, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, width: '90px' }}>{l.language}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${l.passRate}%`, borderRadius: '4px', background: COLORS[i % COLORS.length] }} />
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', width: '45px', textAlign: 'right' }}>{l.avgScore}%</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '40px' }}>{l.submissions}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Problems Table */}
                    {topicAnalysis.topProblems.length > 0 && (
                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Zap size={18} color="#ef4444" /> {t('most_attempted_problems')}</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead><tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.6rem' }}>#</th>
                                        <th style={{ textAlign: 'left', padding: '0.6rem' }}>{t('problem')}</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('type')}</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('difficulty')}</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('attempts')}</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('avg_score')}</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('pass_rate')}</th>
                                    </tr></thead>
                                    <tbody>
                                        {topicAnalysis.topProblems.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.6rem', fontWeight: 700, color: '#3b82f6' }}>{i + 1}</td>
                                                <td style={{ padding: '0.6rem', fontWeight: 600 }}>{p.title}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', textTransform: 'capitalize' }}>{p.type}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: p.difficulty === 'easy' ? 'rgba(16,185,129,0.12)' : p.difficulty === 'medium' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)', color: p.difficulty === 'easy' ? '#10b981' : p.difficulty === 'medium' ? '#f59e0b' : '#ef4444' }}>{p.difficulty}</span>
                                                </td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{p.attempts}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: p.avgScore >= 70 ? '#10b981' : '#f59e0b' }}>{p.avgScore}%</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.passRate}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TIME TO SOLVE TAB */}
            {activeTab === 'time-to-solve' && timeToSolve && (
                <div>
                    {/* Difficulty Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {timeToSolve.difficultySummary.map((d, i) => {
                            const colors = { easy: { bg: 'rgba(16,185,129,0.08)', border: '#10b981' }, medium: { bg: 'rgba(251,191,36,0.08)', border: '#f59e0b' }, hard: { bg: 'rgba(239,68,68,0.08)', border: '#ef4444' } }
                            const c = colors[d.difficulty] || { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6' }
                            return (
                                <div key={i} style={{ padding: '1.5rem', borderRadius: '16px', background: c.bg, border: `2px solid ${c.border}` }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', textTransform: 'capitalize', color: c.border, marginBottom: '1rem' }}>{d.difficulty}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('problems')}</div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{d.problems}</div></div>
                                        <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('avg_time')}</div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{d.avgTimeMinutes}m</div></div>
                                        <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('avg_attempts')}</div><div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{d.avgAttempts}</div></div>
                                        <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('solve_rate')}</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.border }}>{d.avgSolveRate}%</div></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Problem Table */}
                    <div className="dashboard-panel">
                        <h3 className="panel-title"><Clock size={18} color="#3b82f6" /> {t('all_problems_metrics')}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead><tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.6rem' }}>{t('problem')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('type')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('difficulty')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('students')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('total_attempts')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('avg_attempts')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('avg_time')}</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>{t('solve_rate')}</th>
                                </tr></thead>
                                <tbody>
                                    {timeToSolve.problems.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.6rem', fontWeight: 600 }}>{p.title}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center', textTransform: 'capitalize' }}>{p.type}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: p.difficulty === 'easy' ? 'rgba(16,185,129,0.12)' : p.difficulty === 'medium' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)', color: p.difficulty === 'easy' ? '#10b981' : p.difficulty === 'medium' ? '#f59e0b' : '#ef4444' }}>{p.difficulty}</span>
                                            </td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.studentCount}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.totalAttempts}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{p.avgAttempts}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>{p.avgTimeMinutes ? `${p.avgTimeMinutes}m` : '-'}</td>
                                            <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: p.solveRate >= 70 ? '#10b981' : p.solveRate >= 40 ? '#f59e0b' : '#ef4444' }}>{p.solveRate}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* PROCTORING ANALYTICS TAB */}
            {activeTab === 'proctoring' && proctoring && proctoring.analytics ? (
                <div>
                    {/* Info Box - What This Tab Means */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '1.5rem' }}>
                        <strong style={{ color: '#3b82f6' }}>📊 PROCTORING TAB EXPLANATION:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            <li><strong>Total Sessions</strong> = How many exams were taken with proctoring enabled (last 30 days)</li>
                            <li><strong>Completed</strong> = How many exams finished without critical issues</li>
                            <li><strong>Flagged</strong> = How many exams had violations (tab switches, camera blocked, phone detected, copy attempts)</li>
                            <li><strong>Avg Score</strong> = Average violation intensity (0 = clean, 100 = severe violations)</li>
                        </ul>
                    </div>

                    {/* Main Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>📹 Total Sessions</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{proctoring.analytics.totalSessions || 0}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Total exams with proctoring</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #10b981' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>🟢 Completed</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{proctoring.analytics.completedSessions || 0}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Exams completed cleanly</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #f59e0b' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>⚠️ Flagged</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{proctoring.analytics.flaggedSessions || 0}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Exams with violations</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>🚨 Avg Score</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{Math.round(proctoring.analytics.averageViolationScore || 0)}/100</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>0=clean, 100=severe</div>
                        </div>
                    </div>

                    {/* Violations By Type + Severity Distribution */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="dashboard-panel">
                            <h3 className="panel-title"><AlertTriangle size={18} /> Violations by Type</h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,159,64,0.08)' }}>
                                <strong>What each violation means:</strong>
                                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                                    <li><strong>TABSWITCHES</strong> - Student left exam tab (tried to look at other tabs) = 🚨 Cheating Sign</li>
                                    <li><strong>CAMERABLOCKED</strong> - Student's camera was covered/blocked = 🚨 Cannot verify identity</li>
                                    <li><strong>PHONEDETECTION</strong> - Phone detected near desk = 🚨 Could use for cheating</li>
                                    <li><strong>COPYPASTE</strong> - Tried to copy code = 🚨 Using external code</li>
                                </ul>
                            </div>
                            {proctoring.analytics.violationsByType && Object.entries(proctoring.analytics.violationsByType).length > 0 ? (
                                Object.entries(proctoring.analytics.violationsByType).sort((a, b) => b[1] - a[1]).map(([type, count], i) => {
                                    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']
                                    const color = colors[i % colors.length]
                                    return (
                                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>{type}</div>
                                            </div>
                                            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden', flex: 1 }}>
                                                <div style={{ height: '100%', width: `${Math.min(count / Math.max(...Object.values(proctoring.analytics.violationsByType)) * 100, 100)}%`, borderRadius: '4px', background: color }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', width: '40px', textAlign: 'right', color: color }}>{count}</span>
                                        </div>
                                    )
                                })
                            ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No violations data</div>}
                        </div>

                        <div className="dashboard-panel">
                            <h3 className="panel-title"><Zap size={18} /> Severity Distribution</h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(34,197,94,0.08)' }}>
                                <strong>Status meanings:</strong>
                                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                                    <li><strong>✅ APPROVED</strong> - Student exam is clean, no violations</li>
                                    <li><strong>⚠️ REQUIRES_REVIEW</strong> - Some violations, admin review needed</li>
                                    <li><strong>❌ REJECTED_FLAGGED</strong> - Serious violations, exam flagged for rejection</li>
                                </ul>
                            </div>
                            {proctoring.analytics.severityDistribution ? (
                                ['APPROVED', 'REQUIRES_REVIEW', 'REJECTED_FLAGGED'].map((status, i) => {
                                    const count = proctoring.analytics.severityDistribution[status] || 0
                                    const colors = ['#10b981', '#f59e0b', '#ef4444']
                                    const color = colors[i]
                                    const icons = ['✅', '⚠️', '❌']
                                    return (
                                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{icons[i]}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{status.replace(/_/g, ' ')}</div>
                                            </div>
                                            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.08)', overflow: 'hidden', flex: 1 }}>
                                                <div style={{ height: '100%', width: `${count / (proctoring.analytics.totalSessions || 1) * 100}%`, borderRadius: '4px', background: color }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', width: '40px', textAlign: 'right', color }}>{count}</span>
                                        </div>
                                    )
                                })
                            ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No severity data</div>}
                        </div>
                    </div>

                    {/* Session Summary Card */}
                    <div className="dashboard-panel">
                        <h3 className="panel-title"><Video size={18} /> Proctoring Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Violations</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{proctoring.analytics.totalViolations || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Sessions</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{proctoring.analytics.activeSessions || 0}</div>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Score</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{Math.round(proctoring.analytics.averageViolationScore || 0)}</div>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Flagged Rate</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{proctoring.analytics.totalSessions ? Math.round(proctoring.analytics.flaggedSessions / proctoring.analytics.totalSessions * 100) : 0}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
                        <strong style={{ color: '#3b82f6' }}>💡 HOW TO USE THIS TAB:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                            <li><strong>Total Sessions:</strong> Check if students are taking proctored exams</li>
                            <li><strong>Flagged Rate:</strong> See what % of exams have violations (higher = more cheating)</li>
                            <li><strong>Top Violation Type:</strong> If CAMERABLOCKED is high, fix camera setup. If TABSWITCHES is high, remind students to stay in exam.</li>
                            <li><strong>Severity Distribution:</strong> See how many exams need review vs. rejection</li>
                            <li><strong>Action:</strong> Use "Student Stats" tab to review individual student violations and approve/reject their exams.</li>
                        </ul>
                    </div>
                </div>
            ) : activeTab === 'proctoring' && !proctoring ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Video size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Proctoring data loading...</p>
                </div>
            ) : activeTab === 'proctoring' ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Video size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No proctoring data available yet. Run exams with proctoring enabled to see analytics.</p>
                </div>
            ) : null}

            {/* STUDENT STATISTICS TAB */}
            {activeTab === 'student-stats' && studentStats && studentStats.students ? (
                <div>
                    {/* Info Box - What This Tab Means */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '1.5rem' }}>
                        <strong style={{ color: '#3b82f6' }}>👥 STUDENT STATS TAB EXPLANATION:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            <li><strong>Total Students</strong> = How many students took proctored exams</li>
                            <li><strong>Clean Students</strong> = Students with ZERO violations (no cheating signs)</li>
                            <li><strong>Flagged Students</strong> = Students with violations detected (needs review)</li>
                            <li><strong>Repeat Violators</strong> = Students with 2+ flagged exams (serious cases)</li>
                            <li><strong>Status Badges:</strong> ✅ CLEAN = no violations | ⚡ CAUTION = 1 violation | ⚠️ FLAGGED = multiple violations | 🚨 REPEAT = 2+ violations</li>
                        </ul>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search student name or ID..."
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '2px solid var(--border-color)',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>👥 Total Students</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{studentStats.totalStudents || 0}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Took proctored exams</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #10b981' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>✅ Clean Students</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{studentStats.students.filter(s => s.flagged_exams === 0).length}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Zero violations</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #f59e0b' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>⚠️ Flagged Students</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{studentStats.students.filter(s => s.flagged_exams > 0).length}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Has violations</div>
                        </div>
                        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>🚨 Repeat Violators</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{studentStats.students.filter(s => s.flagged_exams >= 2).length}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>2+ flagged exams</div>
                        </div>
                    </div>

                    {/* Top Violators */}
                    {studentStats.topViolators && studentStats.topViolators.length > 0 && (
                        <div className="dashboard-panel" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="panel-title"><AlertTriangle size={18} /> 🚨 Top 10 Violators</h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)' }}>
                                <strong>How to read violation numbers (e.g., "2011"):</strong> First digit = tab switches | Second digit = copy/paste attempts | Third digit = camera blocked | Fourth digit = phone detected. Example: "2011" = 2 tabs + 0 copy + 1 camera + 1 phone
                            </div>
                            {studentStats.topViolators.map((student, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{i + 1}. {student.student_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.total_exams} exams | Avg Score: {student.avg_score}/100</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, color: '#ef4444' }}>{student.flagged_exams} flagged</span>
                                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: student.status.includes('CLEAN') ? 'rgba(16,185,129,0.2)' : student.status.includes('REPEAT') ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: student.status.includes('CLEAN') ? '#10b981' : student.status.includes('REPEAT') ? '#f59e0b' : '#ef4444' }}>{student.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All Students Table */}
                    <div className="dashboard-panel">
                        <h3 className="panel-title"><Users size={18} /> All Students ({searchStudent ? studentStats.students.filter(s => s.student_name.toLowerCase().includes(searchStudent.toLowerCase()) || s.student_id.toLowerCase().includes(searchStudent.toLowerCase())).length : studentStats.students.length})</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead><tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.6rem' }}>Student Name</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Exams</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Flagged</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Pass Rate</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Avg Score</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Violations</th>
                                    <th style={{ textAlign: 'center', padding: '0.6rem' }}>Status</th>
                                </tr></thead>
                                <tbody>
                                    {studentStats.students
                                        .filter(s => !searchStudent || s.student_name.toLowerCase().includes(searchStudent.toLowerCase()) || s.student_id.toLowerCase().includes(searchStudent.toLowerCase()))
                                        .map((student, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                                                    <div>{student.student_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.student_id}</div>
                                                </td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{student.total_exams}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600, color: student.flagged_exams > 0 ? '#ef4444' : '#10b981' }}>{student.flagged_exams}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: student.pass_rate >= 80 ? 'rgba(16,185,129,0.12)' : student.pass_rate >= 50 ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)', color: student.pass_rate >= 80 ? '#10b981' : student.pass_rate >= 50 ? '#f59e0b' : '#ef4444' }}>{student.pass_rate}%</span>
                                                </td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: student.avg_score >= 60 ? '#ef4444' : student.avg_score >= 30 ? '#f59e0b' : '#10b981' }}>{student.avg_score}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 600 }}>{student.total_violations}</td>
                                                <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: student.status.includes('CLEAN') ? 'rgba(16,185,129,0.15)' : student.status.includes('REPEAT') ? 'rgba(245,158,11,0.15)' : student.status.includes('DEFINITE') ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', color: student.status.includes('CLEAN') ? '#10b981' : student.status.includes('REPEAT') ? '#f59e0b' : student.status.includes('DEFINITE') ? '#ef4444' : '#3b82f6' }}>{student.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
                        <strong style={{ color: '#3b82f6' }}>💡 Understanding Student Data:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                            <li><strong>Violations Code:</strong> 4-digit number (e.g., 2011) = Tabs | Copy | Camera | Phone counts</li>
                            <li><strong>Status Meanings:</strong> ✅ CLEAN (0 violations) | ⚡ CAUTION (1 violation) | ⚠️ FLAGGED (multiple violations) | 🚨 REPEAT VIOLATOR (2+ flagged exams)</li>
                            <li><strong>Avg Score:</strong> 0-30 = low violations | 30-60 = medium | 60+ = serious violations</li>
                            <li><strong>Action:</strong> Review ⚠️ and 🚨 students. Approve clean exams, reject serious violations.</li>
                        </ul>
                    </div>
                </div>
            ) : activeTab === 'student-stats' && !studentStats ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>Student statistics loading...</p>
                </div>
            ) : activeTab === 'student-stats' ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No student proctoring data available yet. Students need to complete exams with proctoring enabled.</p>
                </div>
            ) : null}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
                <div>
                    <div className="dashboard-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <Download size={56} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>{t('export_platform_analytics')}</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>{t('export_platform_description')}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handleExport('csv')} disabled={exporting} style={{
                                padding: '1rem 2.5rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', fontWeight: 700, fontSize: '1rem',
                                opacity: exporting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                            }}>
                                <FileText size={20} /> {t('download_csv')}
                            </button>
                            <button onClick={() => handleExport('json')} disabled={exporting} style={{
                                padding: '1rem 2.5rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', fontWeight: 700, fontSize: '1rem',
                                opacity: exporting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                            }}>
                                <Code size={20} /> {t('download_json')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function AdminLoginActivity() {
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [eventFilter, setEventFilter] = useState('all')
    const [rangeFilter, setRangeFilter] = useState('all')
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
    const [refreshEverySec, setRefreshEverySec] = useState(30)
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
    const [exportingCsv, setExportingCsv] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [data, setData] = useState({ summary: null, students: [], recentEvents: [] })
    const studentScrollRef = useRef(null)
    const eventScrollRef = useRef(null)

    const fetchActivity = (query = search) => {
        setLoading(true)
        axios.get(`${API_BASE}/admin/login-activity`, { params: query.trim() ? { search: query.trim() } : {} })
            .then(res => {
                setData({
                    summary: res.data?.summary || null,
                    students: Array.isArray(res.data?.students) ? res.data.students : [],
                    recentEvents: Array.isArray(res.data?.recentEvents) ? res.data.recentEvents : []
                })
                setLastUpdatedAt(new Date().toISOString())
            })
            .catch(() => {
                setData({ summary: null, students: [], recentEvents: [] })
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        const timer = setTimeout(() => fetchActivity(search), 250)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        if (!autoRefreshEnabled) return
        const id = setInterval(() => fetchActivity(search), Math.max(15, Number(refreshEverySec || 30)) * 1000)
        return () => clearInterval(id)
    }, [autoRefreshEnabled, refreshEverySec, search])

    const fmtDate = (value) => {
        if (!value) return '—'
        const dt = new Date(value)
        if (Number.isNaN(dt.getTime())) return '—'
        return dt.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const fmtDateCompact = (value) => {
        if (!value) return '—'
        const dt = new Date(value)
        if (Number.isNaN(dt.getTime())) return '—'
        return dt.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const fmtDuration = (seconds) => {
        const total = Number(seconds || 0)
        if (!Number.isFinite(total) || total <= 0) return '0m'
        const hours = Math.floor(total / 3600)
        const minutes = Math.floor((total % 3600) / 60)
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${Math.max(1, minutes)}m`
    }

    const summary = data.summary || { totalStudents: 0, activeToday: 0, loginEventsToday: 0, testEventsToday: 0, avgActivityMinutes: 0 }

    const inTimeRange = (ts) => {
        if (rangeFilter === 'all' || !ts) return true
        const now = new Date()
        const t = new Date(ts)
        if (Number.isNaN(t.getTime())) return false
        if (rangeFilter === 'today') {
            const start = new Date(now)
            start.setHours(0, 0, 0, 0)
            return t >= start
        }
        if (rangeFilter === '7d') {
            const start = new Date(now)
            start.setDate(now.getDate() - 7)
            return t >= start
        }
        if (rangeFilter === '30d') {
            const start = new Date(now)
            start.setDate(now.getDate() - 30)
            return t >= start
        }
        return true
    }

    const filteredEvents = useMemo(() => {
        return data.recentEvents.filter(event => {
            const typeOk = eventFilter === 'all' ? true : event.eventType === eventFilter
            const timeOk = inTimeRange(event.timestamp)
            return typeOk && timeOk
        })
    }, [data.recentEvents, eventFilter, rangeFilter])

    const topActiveStudent = useMemo(() => {
        if (!data.students.length) return null
        return [...data.students].sort((a, b) => (b.totalActivitySeconds || 0) - (a.totalActivitySeconds || 0))[0]
    }, [data.students])

    const scrollToTop = (ref) => {
        if (!ref?.current) return
        ref.current.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const selectedStudentEvents = useMemo(() => {
        if (!selectedStudent) return []
        return data.recentEvents
            .filter(event => event.studentId === selectedStudent.id)
            .filter(event => (eventFilter === 'all' ? true : event.eventType === eventFilter))
            .filter(event => inTimeRange(event.timestamp))
            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    }, [selectedStudent, data.recentEvents, eventFilter, rangeFilter])

    const toCsvCell = (value) => {
        const raw = value == null ? '' : String(value)
        const escaped = raw.replace(/"/g, '""')
        return `"${escaped}"`
    }

    const handleExportCsv = () => {
        setExportingCsv(true)
        try {
            const studentHeader = ['Student ID', 'Name', 'Email', 'Status', 'Logins', 'Logouts', 'Tests', 'Time Spent (min)', 'Last Seen']
            const studentRows = data.students.map(student => [
                student.id,
                student.name,
                student.email || '',
                student.status || '',
                student.loginCount || 0,
                student.logoutCount || 0,
                student.testsAttended || 0,
                Math.round(Number(student.totalActivitySeconds || 0) / 60),
                fmtDate(student.lastSeenAt)
            ])

            const eventHeader = ['Student ID', 'Student Name', 'Type', 'Label', 'Timestamp', 'Duration (sec)', 'Score', 'Status', 'IP']
            const eventRows = filteredEvents.map(event => [
                event.studentId,
                event.studentName,
                event.eventType,
                event.label || '',
                event.timestamp || '',
                event.durationSeconds || 0,
                event.score == null ? '' : Math.round(event.score),
                event.status || '',
                event.ipAddress || ''
            ])

            const csvLines = []
            csvLines.push('Student Activity Summary')
            csvLines.push(studentHeader.map(toCsvCell).join(','))
            studentRows.forEach(row => csvLines.push(row.map(toCsvCell).join(',')))
            csvLines.push('')
            csvLines.push('Filtered Recent Events')
            csvLines.push(eventHeader.map(toCsvCell).join(','))
            eventRows.forEach(row => csvLines.push(row.map(toCsvCell).join(',')))

            const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
            a.download = `login-activity-${stamp}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setExportingCsv(false)
        }
    }

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))',
                border: '1px solid rgba(59,130,246,0.2)'
            }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Student Login Activity</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    This tab tracks when students log in, log out, which tests they attended, and how much time they spent across Aptitude, Global, MCQ, and CRT activity.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total Students', value: summary.totalStudents, color: '#3b82f6' },
                    { label: 'Active Today', value: summary.activeToday, color: '#10b981' },
                    { label: 'Logins Today', value: summary.loginEventsToday, color: '#8b5cf6' },
                    { label: 'Tests Today', value: summary.testEventsToday, color: '#f59e0b' },
                    { label: 'Avg Time Spent', value: `${summary.avgActivityMinutes || 0}m`, color: '#ef4444' }
                ].map(card => (
                    <div key={card.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem 1.1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.55rem' }}>{card.label}</div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 900, color: card.color }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
            }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.9rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Top Active Student</div>
                    <div style={{ marginTop: '0.35rem', fontWeight: 800, fontSize: '1rem' }}>{topActiveStudent?.name || '—'}</div>
                    <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{topActiveStudent ? fmtDuration(topActiveStudent.totalActivitySeconds) : 'No activity yet'}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.9rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Filtered Events</div>
                    <div style={{ marginTop: '0.35rem', fontWeight: 800, fontSize: '1rem' }}>{filteredEvents.length}</div>
                    <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current filter: {eventFilter.toUpperCase()} · {rangeFilter.toUpperCase()}</div>
                </div>
            </div>

            <div style={{ position: 'relative', maxWidth: '460px' }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search student name, email, or ID..."
                    style={{
                        width: '100%',
                        padding: '0.9rem 1rem 0.9rem 2.8rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                    { key: 'all', label: 'All Events' },
                    { key: 'login', label: 'Logins' },
                    { key: 'logout', label: 'Logouts' },
                    { key: 'test', label: 'Tests' }
                ].map(item => (
                    <button
                        key={item.key}
                        onClick={() => setEventFilter(item.key)}
                        style={{
                            border: eventFilter === item.key ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                            background: eventFilter === item.key ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                            color: eventFilter === item.key ? '#60a5fa' : 'var(--text-muted)',
                            borderRadius: '999px',
                            padding: '0.42rem 0.75rem',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
                <span style={{ marginLeft: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Range:</span>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'today', label: 'Today' },
                    { key: '7d', label: '7 Days' },
                    { key: '30d', label: '30 Days' }
                ].map(item => (
                    <button
                        key={item.key}
                        onClick={() => setRangeFilter(item.key)}
                        style={{
                            border: rangeFilter === item.key ? '1px solid #10b981' : '1px solid var(--border-color)',
                            background: rangeFilter === item.key ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                            color: rangeFilter === item.key ? '#34d399' : 'var(--text-muted)',
                            borderRadius: '999px',
                            padding: '0.42rem 0.75rem',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
                <span style={{ marginLeft: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Auto-refresh:</span>
                <button
                    onClick={() => setAutoRefreshEnabled(v => !v)}
                    style={{
                        border: autoRefreshEnabled ? '1px solid #22c55e' : '1px solid var(--border-color)',
                        background: autoRefreshEnabled ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
                        color: autoRefreshEnabled ? '#4ade80' : 'var(--text-muted)',
                        borderRadius: '999px',
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    {autoRefreshEnabled ? 'On' : 'Off'}
                </button>
                <select
                    value={refreshEverySec}
                    onChange={e => setRefreshEverySec(Number(e.target.value))}
                    disabled={!autoRefreshEnabled}
                    style={{
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        borderRadius: '10px',
                        padding: '0.35rem 0.55rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: autoRefreshEnabled ? 'pointer' : 'not-allowed',
                        opacity: autoRefreshEnabled ? 1 : 0.6
                    }}
                >
                    <option value={15}>15s</option>
                    <option value={30}>30s</option>
                </select>
                <button
                    onClick={() => fetchActivity(search)}
                    style={{
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        borderRadius: '10px',
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Refresh Now
                </button>
                <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv}
                    style={{
                        border: '1px solid #06b6d4',
                        background: 'rgba(6,182,212,0.15)',
                        color: '#67e8f9',
                        borderRadius: '10px',
                        padding: '0.42rem 0.75rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: exportingCsv ? 'not-allowed' : 'pointer',
                        opacity: exportingCsv ? 0.7 : 1
                    }}
                >
                    {exportingCsv ? 'Exporting...' : 'Export CSV'}
                </button>
                {lastUpdatedAt && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Updated: {fmtDate(lastUpdatedAt)}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="dashboard-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading login activity…</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
                    <div className="dashboard-panel" style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 className="panel-title"><ClipboardList size={18} color="#3b82f6" /> Student Activity</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.students.length} students</span>
                                <button onClick={() => scrollToTop(studentScrollRef)} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.28rem 0.48rem', fontSize: '0.7rem', cursor: 'pointer' }}>Top</button>
                            </div>
                        </div>

                        <div
                            ref={studentScrollRef}
                            style={{
                                overflowY: 'auto',
                                maxHeight: '690px',
                                scrollBehavior: 'smooth',
                                scrollbarWidth: 'thin',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.65rem',
                                paddingRight: '0.2rem'
                            }}
                        >
                            {data.students.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    title="Click to view detailed timeline"
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '12px',
                                        padding: '0.85rem 0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{student.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', wordBreak: 'break-word' }}>{student.email || `ID: ${student.id}`}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                                                {student.batch && <span style={{ padding: '0.18rem 0.5rem', borderRadius: '999px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '0.68rem', fontWeight: 700 }}>{student.batch}</span>}
                                                <span style={{ padding: '0.18rem 0.5rem', borderRadius: '999px', background: student.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: student.status === 'active' ? '#10b981' : '#f87171', fontSize: '0.68rem', fontWeight: 700 }}>{student.status || 'unknown'}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '110px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Last seen</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>{fmtDateCompact(student.lastSeenAt)}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.55rem', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))', gap: '0.45rem' }}>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.45rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logins</div>
                                            <div style={{ fontWeight: 800, marginTop: '0.1rem', color: 'var(--text-main)' }}>{student.loginCount || 0}</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.45rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tests</div>
                                            <div style={{ fontWeight: 800, marginTop: '0.1rem', color: 'var(--text-main)' }}>{student.testsAttended || 0}</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.45rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                                            <div style={{ fontWeight: 800, marginTop: '0.1rem', color: 'var(--text-main)' }}>{fmtDuration(student.totalActivitySeconds)}</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.45rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logout</div>
                                            <div style={{ fontWeight: 800, marginTop: '0.1rem', color: 'var(--text-main)' }}>{student.logoutCount || 0}</div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.55rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                        Aptitude: {student.testBreakdown?.aptitude || 0} · Global: {student.testBreakdown?.global || 0} · MCQ: {student.testBreakdown?.mcq || 0} · CRT: {student.testBreakdown?.crt || 0} · Last test: {fmtDateCompact(student.lastTestAt)}
                                    </div>
                                </button>
                            ))}

                            {data.students.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No student activity found for the current filter.</div>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-panel" style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h3 className="panel-title"><Activity size={18} color="#10b981" /> Recent Events</h3>
                            <button onClick={() => scrollToTop(eventScrollRef)} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.28rem 0.48rem', fontSize: '0.7rem', cursor: 'pointer' }}>Top</button>
                        </div>
                        <div
                            ref={eventScrollRef}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                maxHeight: '760px',
                                overflowY: 'auto',
                                paddingRight: '0.25rem',
                                scrollBehavior: 'smooth',
                                scrollbarWidth: 'thin',
                                scrollSnapType: 'y proximity'
                            }}
                        >
                            {filteredEvents.map((event, index) => {
                                const isLogin = event.eventType === 'login'
                                const isLogout = event.eventType === 'logout'
                                const tone = isLogin ? '#10b981' : isLogout ? '#ef4444' : '#3b82f6'
                                const bg = isLogin ? 'rgba(16,185,129,0.12)' : isLogout ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)'
                                return (
                                    <div key={`${event.studentId}-${event.timestamp}-${index}`} style={{ padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', scrollSnapAlign: 'start' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{event.studentName}</div>
                                                <div style={{ marginTop: '0.22rem', fontSize: '0.8rem', color: tone }}>{event.label}</div>
                                            </div>
                                            <span style={{ padding: '0.2rem 0.55rem', borderRadius: '999px', background: bg, color: tone, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {event.eventType === 'test' ? (event.testType || 'test') : event.eventType}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                            <div>{fmtDate(event.timestamp)}</div>
                                            {event.eventType === 'test' && <div>Duration: {fmtDuration(event.durationSeconds)}{event.score != null ? ` · Score: ${Math.round(event.score)}%` : ''}{event.status ? ` · ${event.status}` : ''}</div>}
                                            {event.ipAddress && <div>IP: {event.ipAddress}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredEvents.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity available.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        zIndex: 2200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setSelectedStudent(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '88vh',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-main)' }}>{selectedStudent.name} - Timeline</div>
                                <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedStudent.email || `ID: ${selectedStudent.id}`} · Total events: {selectedStudentEvents.length}</div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>

                        <div style={{ padding: '0.85rem 1rem', overflowY: 'auto', maxHeight: '72vh', scrollBehavior: 'smooth', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {selectedStudentEvents.map((event, index) => {
                                const isLogin = event.eventType === 'login'
                                const isLogout = event.eventType === 'logout'
                                const tone = isLogin ? '#10b981' : isLogout ? '#ef4444' : '#3b82f6'
                                const bg = isLogin ? 'rgba(16,185,129,0.12)' : isLogout ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)'
                                return (
                                    <div key={`${event.studentId}-${event.timestamp}-${index}`} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.85rem 0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>{event.label}</div>
                                            <span style={{ padding: '0.18rem 0.5rem', borderRadius: '999px', background: bg, color: tone, fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                {event.eventType === 'test' ? (event.testType || 'test') : event.eventType}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                            <div>{fmtDate(event.timestamp)}</div>
                                            {event.eventType === 'test' && <div>Duration: {fmtDuration(event.durationSeconds)}{event.score != null ? ` · Score: ${Math.round(event.score)}%` : ''}{event.status ? ` · ${event.status}` : ''}</div>}
                                            {event.ipAddress && <div>IP: {event.ipAddress}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                            {selectedStudentEvents.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No timeline events for this filter.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const ADMIN_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function AdminCodeReviews() {
    const auth = useAuth()
    const user = auth?.user || null
    const [submissions, setSubmissions] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const token = localStorage.getItem('authToken')

    useEffect(() => {
        axios.get(`${ADMIN_API_BASE}/api/submissions?limit=5000`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.submissions || [])
                setSubmissions(data)
            })
            .catch(() => setSubmissions([]))
            .finally(() => setLoading(false))
    }, [])

    if (selected) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button
                    onClick={() => setSelected(null)}
                    style={{ alignSelf: 'flex-start', padding: '8px 18px', cursor: 'pointer', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    ← Back to submissions
                </button>
                <CodeReviewPanel submissionId={selected.id} submission={selected} user={user} />
            </div>
        )
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>Loading submissions…</div>

    const filtered = submissions.filter(s => {
        const q = search.toLowerCase()
        return !q
            || (s.problem_title || s.itemTitle || s.title || '').toLowerCase().includes(q)
            || (s.student_name || s.studentName || s.username || '').toLowerCase().includes(q)
    })

    return (
        <div style={{ padding: '0 4px' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Code Reviews</h2>
                <p style={{ margin: 0, opacity: 0.55, fontSize: 13 }}>View and post code review comments across the platform</p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16, position: 'relative', maxWidth: 420 }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by problem or student name…"
                    style={{
                        width: '100%', padding: '10px 14px 10px 38px',
                        borderRadius: 8, border: '1px solid var(--border, #334155)',
                        background: 'var(--card-bg, #1e293b)', color: 'inherit',
                        fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                />
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
            </div>

            <p style={{ marginBottom: 14, opacity: 0.5, fontSize: 12 }}>
                Showing {filtered.length} of {submissions.length} submission(s) — click one to view/post reviews
            </p>

            {!filtered.length ? (
                <div style={{ padding: '48px 0', textAlign: 'center', opacity: 0.5 }}>
                    <Github size={40} style={{ marginBottom: 12 }} />
                    <p style={{ margin: 0 }}>No submissions found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(sub => {
                        const title = sub.problem_title || sub.itemTitle || sub.title || `Submission #${sub.id}`
                        const student = sub.student_name || sub.studentName || sub.username || 'Unknown'
                        const score = sub.score != null ? sub.score : '—'
                        const lang = sub.language || 'Code'
                        const date = sub.submitted_at || sub.submittedAt || sub.created_at
                        return (
                            <div
                                key={sub.id}
                                onClick={() => setSelected(sub)}
                                style={{
                                    padding: '14px 18px',
                                    borderRadius: 10,
                                    background: 'var(--card-bg, #1e293b)',
                                    border: '1px solid var(--border, #334155)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'border-color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary, #4f46e5)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border, #334155)'}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                                    <div style={{ fontSize: 12, opacity: 0.55, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <span>👤 {student}</span>
                                        <span>💻 {lang}</span>
                                        <span>🏆 Score: {score}</span>
                                        {date && <span>📅 {new Date(date).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ opacity: 0.4, flexShrink: 0, marginLeft: 12 }} />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default AdminPortal

