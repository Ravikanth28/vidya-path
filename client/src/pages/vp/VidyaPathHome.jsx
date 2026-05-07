import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../App'
import { startSyncEngine } from '@/services/vp/syncEngine'
import { startKeepAlive } from '@/workers/keepAlive'
import OfflineIndicator from '@/components/vp/OfflineIndicator'
import FloatingTutor from '@/components/vp/FloatingTutor'

import VPDashboard      from './VPDashboard'
import LessonsList      from './LessonsList'
import LessonDetail     from './LessonDetail'
import AdaptiveQuiz     from './AdaptiveQuiz'
import PracticePicker   from './PracticePicker'
import VPResources      from './VPResources'
import CareerHub        from './CareerHub'
import VPProfile        from './VPProfile'
import VPVoiceTutorPage from './VPVoiceTutorPage'
import SmartStudy from './SmartStudy'
import PersonalizedStudy from './PersonalizedStudy'
import Diagnostic from './Diagnostic'

import '@/components/vp/vp.css'

export default function VidyaPathHome({ hasAttempted = true, onDiagnosticComplete }) {
    const auth = useAuth()
    const locked = !hasAttempted

    useEffect(() => {
        startSyncEngine()
        startKeepAlive()
    }, [])

    const gate = (element) => locked ? <Navigate to="/student/vp/diagnostic" replace /> : element

    return (
        <div>
            <OfflineIndicator />
            <div className="vp-container">
                <Routes>
                    <Route index               element={<VPDashboard />} />
                    <Route path="lessons"      element={gate(<LessonsList />)} />
                    <Route path="lessons/:id"  element={gate(<LessonDetail />)} />
                    <Route path="lessons/:id/quiz" element={gate(<AdaptiveQuiz />)} />
                    <Route path="resources"    element={gate(<VPResources />)} />
                    <Route path="practice"     element={gate(<PracticePicker />)} />
                    <Route path="tutor"        element={gate(<VPVoiceTutorPage />)} />
                    <Route path="careers"      element={gate(<CareerHub />)} />
                    <Route path="profile"      element={gate(<VPProfile />)} />
                    <Route path="smart-study"  element={gate(<SmartStudy />)} />
                    <Route path="personalized" element={gate(<PersonalizedStudy />)} />
                    <Route path="diagnostic" element={<Diagnostic onDone={onDiagnosticComplete} />} />
                </Routes>
            </div>
            <FloatingTutor />
        </div>
    )
}
