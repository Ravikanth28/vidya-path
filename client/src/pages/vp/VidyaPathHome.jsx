import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom'
import { LayoutDashboard, GraduationCap, BookOpen, Sparkles, Target, Briefcase, User, Bell, ListChecks, Activity } from 'lucide-react'
import { useAuth } from '../../App'
import { useI18n } from '@/services/i18n'
import vpApi from '@/services/vp/api'
import { startSyncEngine } from '@/services/vp/syncEngine'
import { startKeepAlive } from '@/workers/keepAlive'
import OfflineIndicator from '@/components/vp/OfflineIndicator'
import FloatingTutor from '@/components/vp/FloatingTutor'

import VPDashboard      from './VPDashboard'
import Diagnostic       from './Diagnostic'
import LessonsList      from './LessonsList'
import LessonDetail     from './LessonDetail'
import AdaptiveQuiz     from './AdaptiveQuiz'
import PracticePicker   from './PracticePicker'
import CareerHub        from './CareerHub'
import VPProfile        from './VPProfile'
import VPNotifications  from './VPNotifications'
import VPVoiceTutorPage from './VPVoiceTutorPage'

import '@/components/vp/vp.css'

const subTabs = [
    { to: '',                 label: 'vp_home',          icon: <LayoutDashboard size={16} /> },
    { to: 'diagnostic',       label: 'vp_diagnostic',    icon: <GraduationCap  size={16} /> },
    { to: 'lessons',          label: 'vp_lessons',       icon: <BookOpen       size={16} /> },
    { to: 'practice',         label: 'vp_practice',      icon: <Target         size={16} /> },
    { to: 'tutor',            label: 'vp_tutor',         icon: <Sparkles       size={16} /> },
    { to: 'careers',          label: 'vp_career_hub',    icon: <Briefcase      size={16} /> },
    { to: 'profile',          label: 'vp_profile',       icon: <User           size={16} /> },
    { to: 'notifications',    label: 'vp_notifications', icon: <Bell           size={16} /> }
]

export default function VidyaPathHome() {
    const { t } = useI18n()
    const auth = useAuth()
    const navigate = useNavigate()
    const [diagDone, setDiagDone] = useState(true)

    useEffect(() => {
        startSyncEngine()
        startKeepAlive()
        vpApi.diagState().then(s => setDiagDone(!!s.done)).catch(() => {})
    }, [])

    useEffect(() => {
        // Force students into diagnostic the first time
        if (!diagDone && window.location.hash.indexOf('/student/vp/diagnostic') === -1) {
            // Don't loop — only redirect on first land
            const onceFlag = sessionStorage.getItem('vp:diag-redirected')
            if (!onceFlag) {
                sessionStorage.setItem('vp:diag-redirected', '1')
                navigate('/student/vp/diagnostic')
            }
        }
    }, [diagDone, navigate])

    return (
        <div>
            <OfflineIndicator />
            <div className="vp-container">
                <div className="vp-tabs" style={{ marginBottom: 24 }}>
                    {subTabs.map(s => (
                        <NavLink
                            key={s.to}
                            to={`/student/vp/${s.to}`}
                            end={s.to === ''}
                            className={({ isActive }) => 'vp-tab' + (isActive ? ' active' : '')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                        >
                            {s.icon}<span>{t(s.label) || s.label.replace('vp_', '')}</span>
                        </NavLink>
                    ))}
                </div>

                <Routes>
                    <Route index               element={<VPDashboard />} />
                    <Route path="diagnostic"   element={<Diagnostic onDone={() => setDiagDone(true)} />} />
                    <Route path="lessons"      element={<LessonsList />} />
                    <Route path="lessons/:id"  element={<LessonDetail />} />
                    <Route path="lessons/:id/quiz" element={<AdaptiveQuiz />} />
                    <Route path="practice"     element={<PracticePicker />} />
                    <Route path="tutor"        element={<VPVoiceTutorPage />} />
                    <Route path="careers"      element={<CareerHub />} />
                    <Route path="profile"      element={<VPProfile />} />
                    <Route path="notifications" element={<VPNotifications />} />
                </Routes>
            </div>
            <FloatingTutor />
        </div>
    )
}
