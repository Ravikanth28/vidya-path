# VidyaPath AI — Adaptive Learning Suite

VidyaPath is a K‑12 adaptive learning module that lives **alongside** the existing Mentor platform, sharing the same Express server, MySQL/TiDB database, and JWT auth. All VidyaPath APIs are namespaced under `/api/vp/*` and all UI lives under `/student/vp/*`.

---

## Feature → file map

| Feature in spec | Backend route file | Frontend page | Notes |
|---|---|---|---|
| Diagnostic Test (IRT 3‑PL) | [routes/vp/diagnostic.js](routes/vp/diagnostic.js) | [Diagnostic.jsx](client/src/pages/vp/Diagnostic.jsx) | Theta scored via `/irt/estimate` (sidecar) with JS fallback |
| Lessons (i18n bodies, audio, offline cache) | [routes/vp/lessons.js](routes/vp/lessons.js) | [LessonsList.jsx](client/src/pages/vp/LessonsList.jsx) / [LessonDetail.jsx](client/src/pages/vp/LessonDetail.jsx) | IndexedDB cache via [lessonCache.js](client/src/services/vp/lessonCache.js) |
| AI Voice Tutor (chat + voice + Sarvam STT/TTS) | [routes/vp/voice_tutor.js](routes/vp/voice_tutor.js) | [VoiceTutor.jsx](client/src/components/vp/VoiceTutor.jsx) / [FloatingTutor.jsx](client/src/components/vp/FloatingTutor.jsx) / [VPVoiceTutorPage.jsx](client/src/pages/vp/VPVoiceTutorPage.jsx) | Cultural-injector post-processing |
| Adaptive Quiz (Bandit + IRT + BKT + SRS + AI grading) | [routes/vp/quiz.js](routes/vp/quiz.js) | [AdaptiveQuiz.jsx](client/src/pages/vp/AdaptiveQuiz.jsx) | Short-answer graded by `evaluateShortAnswer()` |
| Practice Quiz Picker | [routes/vp/practice.js](routes/vp/practice.js) | [PracticePicker.jsx](client/src/pages/vp/PracticePicker.jsx) | BKT next-lessons + completed list |
| Career Hub (LLM matching) | [routes/vp/career_hub.js](routes/vp/career_hub.js) | [CareerHub.jsx](client/src/pages/vp/CareerHub.jsx) | Two-pass LLM: rank → explain |
| Profile (grade, board, lang, mastery) | [routes/vp/profile.js](routes/vp/profile.js) | [VPProfile.jsx](client/src/pages/vp/VPProfile.jsx) | Reuses existing i18n service |
| Notifications | [routes/vp/notifications.js](routes/vp/notifications.js) | [VPNotifications.jsx](client/src/pages/vp/VPNotifications.jsx) | |
| Offline Sync Engine | [routes/vp/sync.js](routes/vp/sync.js) | [syncEngine.js](client/src/services/vp/syncEngine.js) / [keepAlive.js](client/src/workers/keepAlive.js) / [OfflineIndicator.jsx](client/src/components/vp/OfflineIndicator.jsx) | Plain IndexedDB, no `idb` dep |
| Multilingual (en/hi/ta) | (reuses [client/src/services/i18n.jsx](client/src/services/i18n.jsx)) | LanguageSwitcher + locale persisted to `vp_user_prefs.lang` | All VP keys added in en/hi/ta |
| ML Sidecar (Python FastAPI) | [ml_sidecar/main.py](ml_sidecar/main.py) | — | IRT 3‑PL · BKT · ε-greedy bandit · SM-2 SRS |
| Rate Limiting & Security | (reuses Mentor [middleware/](middleware/)) | — | JWT, sanitizer, validation, rate limiter all apply |
| LLM Router | [services/vp/llm_router.js](services/vp/llm_router.js) | — | Cerebras → Groq → NVIDIA → mock; 30s backoff; cache window 60s |

## Database tables (auto-created on boot)

All tables are namespaced `vp_*` and bootstrapped idempotently by [routes/vp/migrations.js](routes/vp/migrations.js):

`vp_concepts` · `vp_lessons` · `vp_lesson_progress` · `vp_quiz_items` · `vp_attempts` · `vp_student_ability` · `vp_student_mastery` · `vp_voice_queries` · `vp_diagnostic_state` · `vp_careers` · `vp_scholarships` · `vp_mentors` · `vp_match_history` · `vp_notifications` · `vp_sync_events` · `vp_user_prefs`

A small but functional catalog (9 concepts, 9 lessons, 30 quiz items, 6 careers, 4 scholarships, 4 mentors) is seeded by [routes/vp/seed.js](routes/vp/seed.js) using `INSERT IGNORE`.

## Running the stack

```bash
# 1. Install Node deps (root + client)
npm install
cd client && npm install && cd ..

# 2. Configure env
cp .env.example .env   # add at least DATABASE_URL and one LLM key

# 3. Install Python deps for the ML sidecar
python -m pip install -r ml_sidecar/requirements.txt

# 4. Start the ML sidecar (terminal 1)
python -m uvicorn ml_sidecar.main:app --host 0.0.0.0 --port 8000

# 5. Start the Express server (terminal 2)
node server.js
# Look for: 🎓 VidyaPath AI mounted at /api/vp

# 6. Start the Vite dev server (terminal 3)
cd client && npm run dev
```

Then open `http://localhost:5173/#/student/vp` after logging in as a student.

## Health check

```
GET /api/vp/health
```
returns `{ ml_sidecar: { ok: true|false }, llm: { cerebras|groq|nvidia: {configured, inBackoff} } }`.

## Graceful degradation

Every external dependency has a documented fallback so the platform stays usable in a partial deployment:

| If this is missing | What you lose | What still works |
|---|---|---|
| All LLM keys | Real tutor answers / career explanations | Deterministic mock replies, navigation, lessons, quizzes |
| Sarvam key | Voice STT/TTS | Text tutor, voice falls back to Groq Whisper STT if `GROQ_API_KEY` set |
| Python ML sidecar | None — JS fallback for IRT/BKT/Bandit/SRS | All adaptive features keep working |
| Network (offline) | Live API calls | Cached lessons, queued quiz answers, queued voice queries |

## What is *not* fully populated by this scaffold

These are content authoring tasks rather than engineering — they're stubbed so the app runs end-to-end today:

- Lesson body translations are populated in `en` for all lessons; `hi` and `ta` translations are present for the first lesson per subject and abbreviated thereafter. Add full translations in [routes/vp/seed.js](routes/vp/seed.js) `LESSONS[]`.
- Lesson audio narration uses the browser's `SpeechSynthesis` API by default. To use server-rendered Sarvam audio, populate `vp_lessons.audio_url_i18n`.
- Real career/scholarship/mentor catalogs would be sourced from a CSV or admin UI; the seed inserts a representative starter set.
