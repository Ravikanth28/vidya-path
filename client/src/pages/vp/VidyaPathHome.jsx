import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../../App'
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
import VPResources      from './VPResources'
import CareerHub        from './CareerHub'
import VPProfile        from './VPProfile'
import VPVoiceTutorPage from './VPVoiceTutorPage'
import SmartStudy from './SmartStudy'
import PersonalizedStudy from './PersonalizedStudy'

import '@/components/vp/vp.css'

export default function VidyaPathHome() {
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
                <Routes>
                    <Route index               element={<VPDashboard />} />
                    <Route path="diagnostic"   element={<Diagnostic onDone={() => setDiagDone(true)} />} />
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
