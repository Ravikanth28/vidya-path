import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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

import '@/components/vp/vp.css'

export default function VidyaPathHome() {
    const auth = useAuth()

    useEffect(() => {
        startSyncEngine()
        startKeepAlive()
    }, [])

    return (
        <div>
            <OfflineIndicator />
            <div className="vp-container">
                <Routes>
                    <Route index               element={<VPDashboard />} />
                    <Route path="lessons"      element={<LessonsList />} />
                    <Route path="lessons/:id"  element={<LessonDetail />} />
                    <Route path="lessons/:id/quiz" element={<AdaptiveQuiz />} />
                    <Route path="resources"    element={<VPResources />} />
                    <Route path="practice"     element={<PracticePicker />} />
                    <Route path="tutor"        element={<VPVoiceTutorPage />} />
                    <Route path="careers"      element={<CareerHub />} />
                    <Route path="profile"      element={<VPProfile />} />
                    <Route path="smart-study"  element={<SmartStudy />} />
                    <Route path="personalized" element={<PersonalizedStudy />} />
                </Routes>
            </div>
            <FloatingTutor />
        </div>
    )
}
