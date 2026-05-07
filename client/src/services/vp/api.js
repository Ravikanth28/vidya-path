// VidyaPath API client. Uses the global axios interceptor for the JWT.
import axios from 'axios'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/vp'

export const vpApi = {
    health:        () => axios.get(`${BASE}/health`).then(r => r.data),

    // Diagnostic
    diagState:     () => axios.get(`${BASE}/diagnostic/state`).then(r => r.data),
    diagItems:     () => axios.get(`${BASE}/diagnostic/items`).then(r => r.data),
    diagSubmit:    (answers) => axios.post(`${BASE}/diagnostic/submit`, { answers }).then(r => r.data),
    diagPlans:     () => axios.get(`${BASE}/diagnostic/plans`).then(r => r.data),
    diagHistory:   () => axios.get(`${BASE}/diagnostic/history`).then(r => r.data),
    diagStudentStart: (body) => axios.post(`${BASE}/diagnostic/student-choice/start`, body).then(r => r.data),
    diagStudentSubmit: (body) => axios.post(`${BASE}/diagnostic/student-choice/submit`, body).then(r => r.data),
    diagSyllabusUpload: (formData) => axios.post(`${BASE}/diagnostic/syllabus-upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    diagTeacherTests: (params = {}) => axios.get(`${BASE}/diagnostic/teacher-tests`, { params }).then(r => r.data),
    diagTeacherTest: (id) => axios.get(`${BASE}/diagnostic/teacher-tests/${id}`).then(r => r.data),
    diagTeacherStart: (id) => axios.post(`${BASE}/diagnostic/teacher-tests/${id}/start`).then(r => r.data),
    diagTeacherSubmit: (body) => axios.post(`${BASE}/diagnostic/teacher-tests/submit`, body).then(r => r.data),
    diagRegeneratePlan: (attempt_id) => axios.post(`${BASE}/diagnostic/plan/regenerate`, { attempt_id }).then(r => r.data),
    diagLocalizedResult: (attemptId, language) => axios.get(`${BASE}/diagnostic/attempts/${attemptId}/localized`, { params: { language } }).then(r => r.data),
    diagUiText: (language) => axios.get(`${BASE}/diagnostic/ui-text`, { params: { language } }).then(r => r.data),
    diagGenerateLessons: (attemptId, language) => axios.post(`${BASE}/diagnostic/attempts/${attemptId}/generate-lessons`, { language }).then(r => r.data),
    adminDiagnosticTests: () => axios.get(`${BASE}/diagnostic/admin/tests`).then(r => r.data),
    adminDiagnosticPlans: (params = {}) => axios.get(`${BASE}/diagnostic/admin/plans`, { params }).then(r => r.data),
    adminDiagnosticManualTest: (body) => axios.post(`${BASE}/diagnostic/admin/tests/manual`, body).then(r => r.data),
    adminDiagnosticUploadTest: (formData) => axios.post(`${BASE}/diagnostic/admin/tests/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    adminDiagnosticPublish: (id, is_published) => axios.post(`${BASE}/diagnostic/admin/tests/${id}/publish`, { is_published }).then(r => r.data),

    // Lessons
    lessons:       (params = {}) => axios.get(`${BASE}/lessons`, { params }).then(r => r.data),
    lesson:        (id, lang = 'en') => axios.get(`${BASE}/lessons/${id}`, { params: { lang } }).then(r => r.data),
    lessonProgress:(id, body) => axios.post(`${BASE}/lessons/${id}/progress`, body).then(r => r.data),
    lessonComplete:(id) => axios.post(`${BASE}/lessons/${id}/complete`).then(r => r.data),

    // Quiz
    quizStart:     (lessonId, lang = 'en') => axios.get(`${BASE}/quiz/lesson/${lessonId}/start`, { params: { lang } }).then(r => r.data),
    quizNext:      (body) => axios.post(`${BASE}/quiz/next`, body).then(r => r.data),
    quizAnswer:    (body) => axios.post(`${BASE}/quiz/answer`, body).then(r => r.data),
    quizFinish:    (lessonId) => axios.post(`${BASE}/quiz/lesson/${lessonId}/finish`).then(r => r.data),

    // Practice
    practiceRecommended: () => axios.get(`${BASE}/practice/recommended`).then(r => r.data),
    practiceCompleted:   () => axios.get(`${BASE}/practice/completed`).then(r => r.data),

    // Personalized Study
    personalized: () => axios.get(`${BASE}/personalized`).then(r => r.data),

    // Voice tutor
    tutorText:     (body) => axios.post(`${BASE}/voice-tutor/text`, body).then(r => r.data),
    tutorVoice:    (formData) => axios.post(`${BASE}/voice-tutor/voice`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    tutorHistory:  () => axios.get(`${BASE}/voice-tutor/history`).then(r => r.data),

    // Career Hub
    careerProfile: () => axios.get(`${BASE}/career-hub/profile`).then(r => r.data),
    careerMatch:   (kind, lang = 'en') => axios.post(`${BASE}/career-hub/match`, { kind, lang }).then(r => r.data),
    careerHistory: () => axios.get(`${BASE}/career-hub/history`).then(r => r.data),

    // Profile
    profile:       () => axios.get(`${BASE}/profile`).then(r => r.data),
    updateProfile: (body) => axios.put(`${BASE}/profile`, body).then(r => r.data),
    mastery:       () => axios.get(`${BASE}/profile/mastery`).then(r => r.data),

    // Notifications
    notifications: (all = false) => axios.get(`${BASE}/notifications`, { params: all ? { all: 1 } : {} }).then(r => r.data),
    markRead:      (id) => axios.post(`${BASE}/notifications/${id}/read`).then(r => r.data),
    markAllRead:   () => axios.post(`${BASE}/notifications/read-all`).then(r => r.data),

    // Sync
    syncReplay:    (events) => axios.post(`${BASE}/sync/replay`, { events }).then(r => r.data),
    syncPing:      () => axios.get(`${BASE}/sync/ping`).then(r => r.data)
}

export default vpApi
