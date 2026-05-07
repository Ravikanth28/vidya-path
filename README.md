# VidyaPath AI — Comprehensive Platform Documentation

> An end-to-end, AI-powered education platform for Indian school students (Class 8–12) and their mentors/admins.  
> Combines adaptive learning science, multi-provider LLMs, voice interaction, and a full coding/assessment suite into a single deployable stack.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Feature Map](#2-feature-map)
3. [Tech Stack — Full Breakdown](#3-tech-stack--full-breakdown)
4. [System Architecture](#4-system-architecture)
5. [AI & API Keys — How Each Is Used](#5-ai--api-keys--how-each-is-used)
6. [ML Sidecar — Adaptive Learning Engine](#6-ml-sidecar--adaptive-learning-engine)
7. [Database — Schema, Tables, and Data Flow](#7-database--schema-tables-and-data-flow)
8. [Backend — Internal Working](#8-backend--internal-working)
9. [Frontend — Internal Working](#9-frontend--internal-working)
10. [Frontend ↔ Backend ↔ Database Integration](#10-frontend--backend--database-integration)
11. [Security & Middleware](#11-security--middleware)
12. [Running the Platform](#12-running-the-platform)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Why These Tech Choices?](#14-why-these-tech-choices)

---

## 1. Platform Overview

VidyaPath AI is a multilingual, adaptive learning platform designed for Indian school education. It runs as three coordinated processes:

| Process | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Backend API** | Node.js + Express | 3000 | All REST APIs, auth, real-time WebSocket, file handling |
| **Frontend SPA** | React + Vite | 5173 (dev) | Student, Mentor, and Admin portals |
| **ML Sidecar** | Python + FastAPI | 8000 | IRT, BKT, Bandit, SRS algorithms |

The backend is the single integration point: it owns the MySQL database, calls the ML Sidecar over HTTP, calls external AI APIs, and serves the built React SPA in production.

---

## 2. Feature Map

### 2.1 VidyaPath Adaptive Learning System (`/api/vp/*`)

| Feature | Route Prefix | Description |
|---------|-------------|-------------|
| **IRT Diagnostic Test** | `/api/vp/diagnostic` | One-time placement test using Item Response Theory (3-PL model) to measure student ability (`theta`) per subject |
| **Lesson Catalog** | `/api/vp/lessons` | Multilingual lessons (i18n JSON bodies). Supports filtering by subject, status, search. Tracks reading progress and mastery per student |
| **Adaptive Quiz** | `/api/vp/quiz` | Bandit-driven item selection, IRT theta update after each quiz, BKT mastery update per concept, SRS review scheduling, AI grading for short-answer questions |
| **Practice Picker** | `/api/vp/practice` | Recommends lessons with low BKT mastery. Cold-start handled by picking incomplete lessons |
| **AI Voice Tutor** | `/api/vp/voice-tutor` | Accepts text or voice audio. Voice → Sarvam STT → LLM → Sarvam TTS → base64 audio back to browser. Text mode skips STT/TTS |
| **Smart Study** | `/api/vp/study` | Upload PDF/image/text syllabi → LLM extracts topics → per-topic AI notes (easy/medium/hard) → MCQ test generation → AI grading with weak-area detection and YouTube video links |
| **Career Hub** | `/api/vp/career-hub` | LLM-powered matching of student profile against careers, scholarships, and mentors from the database |
| **Personalized Dashboard** | `/api/vp/personalized` | Combines BKT weak areas, IRT ability, recent quiz accuracy, SRS queue, and syllabus notes into a single dashboard payload |
| **Student Profile** | `/api/vp/profile` | Stores language preference, grade, board, state, XP points, and exposes theta and mastery summaries |
| **Notifications** | `/api/vp/notifications` | In-app notifications with read/unread status |
| **Offline Sync** | `/api/vp/sync` | Mirrors client `sync_queue` events on the server for offline-first operation |
| **Teacher Notes** | `/api/vp/study/teacher-notes` | Teachers upload PDF/PPT/DOC files; students from the same batch can download them |
| **Admin Content Management** | `/api/vp/admin` | CRUD for lessons, quiz items, concepts, careers, scholarships, mentors |

### 2.2 Mentor Platform Features

| Feature | Description |
|---------|-------------|
| **Multi-language Communication Test** | 8 module types: read-speak, listen-repeat, topic-speak, grammar-quiz, vocabulary-test, situational-response, email-writing, interview-QA. Audio graded by WER (Word Error Rate) via Sarvam STT |
| **Proctored Code Editor** | Monaco Editor with face detection (TensorFlow.js + BlazeFace), tab-switch tracking, copy-paste monitoring. Violation scoring with configurable thresholds |
| **Company Round Tests (CRT)** | Aptitude + coding rounds matching company hiring patterns |
| **Frontend Evaluation** | Student uploads a ZIP of HTML/CSS/JS. Server runs it in a sandboxed environment, executes test cases, returns a score |
| **Lab Exercises** | Admin creates exercises with starter code. AI evaluates submissions using the LLM. Results stored with per-attempt history |
| **SQL Debugger & Validator** | In-browser SQL execution using `sql.js` (WebAssembly SQLite). Admin defines expected output; system compares results order-independently |
| **Plagiarism Detection** | Jaccard similarity, Longest Common Subsequence (LCS), and Rabin-Karp hash-window algorithms across all submissions for a problem |
| **Gamification** | XP points, level-up, streaks, leaderboard, badges. Points awarded on problem solve, test completion, first-attempt success |
| **Certificate Generation** | PDF certificates via PDFKit with SHA-256 verifiable code. Issued when score is at or above the passing threshold |
| **Predictive Analytics** | At-risk student detection, learning curve analysis, weak concept identification, behavioural pattern detection |
| **Webhook Service** | Outgoing webhooks on events (submission, test complete) for third-party integrations |
| **Alumni Connect** | Students can browse and connect with alumni for mentoring |
| **Batch Management** | Group students into batches; mentor-to-batch assignment |
| **Real-time Messaging** | Socket.IO direct messaging with 24-hour auto-cleanup |
| **YouTube Recommendations** | AI suggests relevant YouTube videos for weak topics |
| **AI Code Review** | LLM reviews submitted code and returns structured feedback on style, efficiency, correctness |
| **AI Interview Simulation** | Avatar-based interview with voice interaction |
| **Leaderboard** | Global and batch-level ranking by points |

---

## 3. Tech Stack — Full Breakdown

### 3.1 Backend

#### Node.js (v22+)

- **What it is**: Server-side JavaScript runtime built on V8.
- **Why chosen**: Non-blocking I/O makes it ideal for handling many concurrent student connections, file uploads, and database queries without spawning threads. The same language as the frontend reduces cognitive overhead.
- **How it works here**: `server.js` is the entry point. It creates an Express app, attaches all middleware, mounts every route group, initialises the MySQL connection pool, and then wraps it in an `http.Server` for Socket.IO.

#### Express.js (v5)

- **What it is**: Minimal HTTP framework for Node.js.
- **Why chosen**: Zero-opinion routing, excellent middleware ecosystem. v5 brings native async/await error propagation so unhandled promise rejections in route handlers are caught automatically.
- **How it works here**: Routes are split into files under `routes/` and `routes/vp/`. Each route file exports a factory function that receives the MySQL pool and `authenticate` middleware, keeping each module self-contained. All route factories are called in `server.js` and mounted with `app.use()`.

#### MySQL 2 (`mysql2/promise`)

- **What it is**: MySQL driver for Node.js with native Promise support.
- **Why chosen**: PlanetScale (MySQL-compatible) is used as the managed cloud database. `mysql2/promise` provides connection pooling and async/await-friendly query execution without extra wrapper libraries.
- **How it works here**: A single pool (`pool`) is created at startup with SSL enabled and shared across all routes via function parameters. Queries use parameterised placeholders (`?`) to prevent SQL injection.

#### Socket.IO (v4)

- **What it is**: Library for real-time bidirectional event-based communication over WebSocket (with polling fallback).
- **Why chosen**: Mentor live monitoring, chat messaging, and code execution result streaming all benefit from push updates rather than polling.
- **How it works here**: The `http.Server` is passed to `SocketIOServer`. The `io` instance is attached to `req.app.get('io')` so any route handler can emit events to connected clients.

#### Multer

- **What it is**: Middleware for handling multipart/form-data (file uploads).
- **Why chosen**: Integrates seamlessly with Express; supports in-memory storage (for immediate processing) and disk storage (for persistent files).
- **How it works here**: Voice audio goes to memory storage, teacher notes and frontend ZIP evaluations go to disk. File size limits are enforced per-route (e.g., 15 MB for audio, 80 MB for frontend ZIPs).

#### Axios

- **What it is**: Promise-based HTTP client.
- **Why chosen**: Used for outgoing requests to external AI APIs (Cerebras, Groq, NVIDIA, Sarvam). Supports request/response interceptors and timeout configuration cleanly.

#### Axios-Retry

- **What it is**: Axios plugin that automatically retries failed requests.
- **Why chosen**: AI provider APIs occasionally return transient 5xx errors. Auto-retry reduces visible failures without manual retry logic per route.

#### PDFKit

- **What it is**: Pure JavaScript PDF generation library.
- **Why chosen**: No binary dependencies (no Puppeteer/headless Chrome required), produces certificates directly in Node without spawning a browser.
- **How it works here**: `CertificateService` constructs the PDF in memory and writes it to `public/certificates/`. A SHA-256 verification code is embedded and stored in the database for tamper-proof validation.

#### ExcelJS

- **What it is**: Library for reading and writing Excel files.
- **Why chosen**: Admin report export in .xlsx format is a common requirement in Indian institutional contexts.

#### bcryptjs

- **What it is**: Password hashing library (bcrypt algorithm, pure JavaScript).
- **Why chosen**: Industry-standard adaptive hashing with configurable rounds (set to 12 here). Pure-JS avoids native build steps.

#### jsonwebtoken (JWT)

- **What it is**: Library for creating and verifying JSON Web Tokens.
- **Why chosen**: Stateless authentication — no session store needed. Tokens carry role and user ID, enabling role-based access control on every route.

#### Zod

- **What it is**: TypeScript-first schema validation library (also works in plain JS).
- **Why chosen**: Replaces manual field presence checks. Schemas defined once in `middleware/validation.js` are reused across all routes.

#### sql.js

- **What it is**: SQLite compiled to WebAssembly, usable in Node.js.
- **Why chosen**: The SQL Debugger feature needs to execute arbitrary student-written SQL safely without touching the production MySQL database. `sql.js` runs SQLite entirely in memory in the Node process — no external binary, no risk to production data.
- **How it works here**: `sanitizeSQLForSQLite()` converts MySQL-dialect schema (AUTO_INCREMENT, TINYINT, etc.) to SQLite-compatible DDL. The student's query is executed and results are compared against admin-defined expected output using a normalised, order-independent comparison algorithm.

#### Morgan

- **What it is**: HTTP request logger middleware.
- **Why chosen**: Structured request logs in development; can be switched to combined format for production log aggregation.

#### UUID (v4)

- **What it is**: Generates RFC-compliant random UUIDs.
- **Why chosen**: Primary keys for most tables are UUIDs (VARCHAR(48)) rather than auto-incrementing integers, so records can be created client-side or across distributed writes without coordination.

---

### 3.2 ML Sidecar (Python)

#### FastAPI

- **What it is**: Modern, high-performance Python web framework with automatic OpenAPI docs.
- **Why chosen**: Roughly 10x faster than Flask for I/O-bound routes. Pydantic models provide automatic request validation. Auto-generated docs at `/docs` are useful for debugging the ML endpoints.
- **How it works here**: Four routers are mounted: `/irt`, `/bkt`, `/bandit`, `/srs`. The Node backend calls these over HTTP via `services/vp/ml_client.js` with a configurable timeout (`ML_SIDECAR_TIMEOUT_MS`).

#### Uvicorn

- **What it is**: ASGI server for Python.
- **Why chosen**: Production-grade server for FastAPI, supports async request handling.

#### Pydantic

- **What it is**: Data validation library used internally by FastAPI.
- **Why chosen**: All ML algorithm inputs are strictly validated (types, ranges). Invalid input raises a 422 before any computation.

---

### 3.3 Frontend

#### React (v18+)

- **What it is**: Component-based UI library.
- **Why chosen**: Component model maps well to the many distinct UI panels (quiz, code editor, voice tutor, career hub). Concurrent rendering in React 18 keeps the UI responsive during heavy data fetches.
- **How it works here**: Three top-level portals (`StudentPortal`, `MentorPortal`, `AdminPortal`) are lazy-loaded for code splitting. Auth state lives in `AuthContext`; theme in `ThemeContext`.

#### Vite

- **What it is**: Next-generation frontend build tool (uses esbuild for dev transforms, Rollup for production bundles).
- **Why chosen**: Cold-start dev server in under 1 second. HMR is near-instant. Manual chunk splitting in `vite.config.js` separates React, charts, Monaco editor, TensorFlow, and sql.js into independent chunks so first-load is fast.

#### React Router v6

- **What it is**: Client-side routing library.
- **Why chosen**: Hash-based routing (`#/student/vp`) works without server-side redirect configuration — important for the static hosting setup.

#### Monaco Editor

- **What it is**: The VS Code editor running in the browser.
- **Why chosen**: Syntax highlighting, IntelliSense, multi-language support (C, C++, Java, Python, JS, SQL) in a familiar interface.

#### TensorFlow.js + BlazeFace

- **What it is**: Machine learning framework ported to the browser. BlazeFace is a face detection model.
- **Why chosen**: Proctoring must work client-side to avoid uploading video streams to a server (privacy and bandwidth). BlazeFace detects faces in webcam frames at ~30 FPS in-browser.
- **How it works here**: `FaceDetectionMonitor.js` and `ViolationDetector.js` run continuous frame analysis. No-face and multiple-face events are sent to the backend violation log.

#### Recharts + D3

- **What it is**: Declarative chart library for React (Recharts) built on D3 primitives.
- **Why chosen**: Clean API for bar charts, line charts, and radar charts used in the analytics and gamification dashboards.

#### Lucide React

- **What it is**: Icon set as React components.
- **Why chosen**: Consistent, lightweight SVG icons without a large icon font.

#### Axios (frontend)

- **What it is**: Same HTTP client used on the backend, here in the browser.
- **How it works here**: A global Axios request interceptor in `App.jsx` automatically attaches the `Authorization: Bearer <token>` header from localStorage to every outgoing API call.

#### Internationalization (i18n)

- **How it works here**: Lesson bodies, quiz prompts, and options are stored as JSON objects keyed by language code (`{ "en": "...", "hi": "...", "ta": "..." }`). The frontend passes `?lang=hi` query params; the backend picks the correct field.

#### Service Worker (PWA)

- **What it is**: Background script enabling offline capability.
- **Why chosen**: Students in low-connectivity areas can still access cached lessons and queue quiz answers for later sync via `/api/vp/sync`.

---

### 3.4 Shared Utilities

| Utility | File | Purpose |
|---------|------|---------|
| In-memory Cache | `utils/cache.js` | TTL-based Map cache. LLM responses are cached for 60 s by prompt hash to avoid duplicate API calls during concurrent requests |
| Pagination | `utils/pagination.js` | Standardised `{ data, page, limit, total }` response wrapper used across list endpoints |
| Logger | `utils/logger.js` | Structured logging with Morgan integration |

---

## 4. System Architecture

```
Browser (React SPA)
        |  HTTP REST + WebSocket
        v
+-----------------------------------------------+
|         Node.js / Express              :3000   |
|                                                |
|  +---------------+  +---------------------+   |
|  | Auth / Rate   |  |  Validation /       |   |
|  | Limiter       |  |  Sanitizer          |   |
|  +---------------+  +---------------------+   |
|                                                |
|  routes/vp/*          routes/*                |
|  (VidyaPath AI)       (Mentor Platform)       |
|                                                |
|  services/vp/                                 |
|  +------------+  +----------+  +----------+  |
|  | LLM Router |  | Sarvam   |  | Profile  |  |
|  | Cerebras → |  | STT/TTS  |  | Builder  |  |
|  | Groq → NIM |  +----------+  +----------+  |
|  +------------+                               |
|        |                                      |
+--------+--------------------------------------+
         |                          |
         | HTTP                     | mysql2/promise
         v                          v
+-----------------+      +----------------------+
| Python FastAPI  |      |  MySQL               |
| ML Sidecar :8000|      |  (PlanetScale/TiDB)  |
| /irt  /bkt      |      |                      |
| /bandit  /srs   |      |  vp_* tables         |
+-----------------+      |  mentor tables       |
                          +----------------------+
         |
         v (external APIs)
+----------------------------------------+
|  Cerebras API  (primary LLM)           |
|  Groq API      (fallback LLM + Whisper)|
|  NVIDIA NIM    (tertiary LLM)          |
|  Sarvam AI     (STT + TTS)             |
+----------------------------------------+
```

---

## 5. AI & API Keys — How Each Is Used

### 5.1 Cerebras API (`CEREBRAS_API_KEY`, `CEREBRAS_API_KEY_1` ... `_4`)

- **Provider**: Cerebras Systems
- **Model**: `llama3.3-70b` (LLaMA 3.3 70B running on Cerebras wafer-scale hardware)
- **Why chosen**: Cerebras hardware provides sub-second token generation for large models — critical for real-time tutoring where latency over 3 seconds breaks the learning experience.
- **How it works**:
  - Up to 5 API keys are loaded from environment variables into `CEREBRAS_KEYS[]`.
  - On each request, the LLM router tries the next key in round-robin (`state.keyIndex`), advancing after each successful call.
  - If a key returns HTTP 429 (rate limit) or 5xx, the router backs off that key for 30 seconds and tries the next.
  - Used for: lesson Q&A, quiz short-answer grading, syllabus topic extraction, notes generation, test generation, career matching, AI code review.

### 5.2 Groq API (`GROQ_API_KEY`)

- **Provider**: Groq Inc.
- **Models used**:
  - `llama-3.3-70b-versatile` — Text completion (secondary LLM fallback)
  - `whisper-large-v3` — Speech-to-text (STT fallback when Sarvam is unavailable)
- **Why chosen**: Groq LPU inference is extremely fast and the free tier is generous, making it an ideal fallback. Whisper-large-v3 supports Indian-accented English well.
- **How it works**:
  - Text: Called by `llm_router.js` when Cerebras is in backoff or unconfigured.
  - STT: Called by `sarvam.js → sttGroqWhisper()` when `SARVAM_API_KEY` is not set.

### 5.3 NVIDIA NIM API (`NVIDIA_API_KEY`)

- **Provider**: NVIDIA
- **Model**: `nvidia/nemotron-3-super-120b-a12b` (120B parameter model)
- **Why chosen**: Acts as the tertiary fallback for demanding reasoning tasks. NVIDIA NIM offers OpenAI-compatible endpoints.
- **How it works**: Third in the fallback chain in `llm_router.js`. Tried only if both Cerebras and Groq are in backoff.

### 5.4 LLM Fallback Chain in Detail

```
Request arrives at llmChat()
        |
        +-- Is Cerebras in 30s backoff? No --> Try CEREBRAS_KEYS[keyIndex]
        |       Success --> return result
        |       429/5xx --> try next Cerebras key
        |       All keys exhausted --> trip 30s backoff
        |
        +-- Try Groq
        |       Success --> return result
        |       429/5xx --> trip 30s backoff
        |
        +-- Try NVIDIA NIM
        |       Success --> return result
        |       429/5xx --> trip 30s backoff
        |
        +-- Return deterministic mock response
```

A 60-second **prompt cache** sits in front of the entire chain. If the same prompt is seen within 60 s, the cached response is returned instantly with no API call made.

### 5.5 Sarvam AI (`SARVAM_API_KEY`)

- **Provider**: Sarvam AI (India)
- **Models**:
  - `saarika:v2` — Speech-to-Text for 12 Indian languages
  - `bulbul:v2` — Text-to-Speech for 12 Indian languages, speaker `meera`
- **Languages supported**: English, Hindi, Tamil, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Telugu, Urdu
- **Why chosen**: The only production-quality STT/TTS service with native support for all major Indian languages. Critical for voice tutoring in the student's mother tongue.
- **How it works**:
  - **STT**: Voice audio bytes uploaded from the browser → Multer stores in memory → bytes sent as multipart form to `https://api.sarvam.ai/speech-to-text` → transcript returned.
  - **TTS**: LLM text answer sent to `https://api.sarvam.ai/text-to-speech` → WAV audio returned as base64 → sent back to browser → browser plays with an audio element.
  - Multiple WAV chunks (for long text split into segments) are merged by rewriting PCM headers before sending to the client.

### 5.6 Cultural Injector (Post-processing, No Extra API Cost)

A local string replacement layer in `services/vp/cultural_injector.js`. After every LLM response, it:
- Replaces `$` with `₹`
- Replaces "dollars" with "rupees"
- Replaces Western name placeholders (John, Jane, Mr. Smith) with Indian equivalents (Ravi, Priya, Shri Ravi, Smt. Priya)
- Replaces "miles" with "kilometres", "gallons" with "litres"

This ensures AI-generated content feels locally appropriate without re-prompting.

---

## 6. ML Sidecar — Adaptive Learning Engine

The Python FastAPI sidecar (`ml_sidecar/`) implements four educational data science models. The Node backend calls it over HTTP via `services/vp/ml_client.js`. If the sidecar is unreachable, JavaScript fallback implementations in `ml_client.js` keep the system operational.

### 6.1 IRT — Item Response Theory (3-Parameter Logistic)

**File**: `ml_sidecar/services/irt_service.py`

**Purpose**: Measure student ability (`theta`) on a common scale from −3 (very low) to +3 (very high) regardless of which specific questions they answered.

**3-PL Model formula**:

    P(correct | theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))

Where:
- `a` = discrimination (how sharply the item differentiates abilities)
- `b` = difficulty (the theta at which a student has ~50% chance of a correct answer, adjusted for guessing)
- `c` = pseudo-guessing (lower asymptote — minimum probability for a random guess)

**Estimation**: Newton-Raphson Maximum Likelihood Estimation with damped step (max ±1.0 per iteration) to prevent divergence. Theta is clamped to [−3, +3].

**When is it called?**
1. After the **Diagnostic Test** — one estimate per subject from 30 questions.
2. After each **Quiz session** — rolling update to `vp_student_ability.theta`.

**Why IRT over a simple score?** A student scoring 8/10 on easy questions should not get the same theta as a student scoring 8/10 on hard questions. IRT accounts for item difficulty, discrimination, and guessing probability.

---

### 6.2 BKT — Bayesian Knowledge Tracing (Corbett-Anderson)

**File**: `ml_sidecar/services/bkt_service.py`

**Purpose**: Track the probability that a student has mastered a concept (`p_mastery`) after each question attempt.

**4 parameters** (default values):
- `p_learn = 0.10` — probability of transitioning from not-knowing to knowing per attempt
- `p_slip = 0.10` — probability of making an error even when knowing
- `p_guess = 0.20` — probability of a correct guess when not knowing
- `p_mastery` — current mastery probability (starts at 0.10)

**Update rule** (Bayes' theorem):

If correct:

    P_posterior = (P_mastery * (1 - P_slip)) / (P_mastery * (1 - P_slip) + (1 - P_mastery) * P_guess)

Then apply learning:

    P_new = P_posterior + (1 - P_posterior) * P_learn

**When used?**: After every quiz answer. `vp_student_mastery.p_mastery` is updated in the database.

**Threshold**: When `p_mastery >= 0.85`, a concept is considered mastered. The Practice Picker only recommends concepts below this threshold.

---

### 6.3 Multi-Armed Bandit (Epsilon-Greedy)

**File**: `ml_sidecar/services/bandit_service.py`

**Purpose**: Select the most informative quiz question for a student at their current ability level. Balances exploration (random selection) and exploitation (best known selection).

**Reward function — Fisher Information**:

    I(theta) = (a^2 * (P(theta) - c)^2 * (1 - P(theta))) / (P(theta) * (1 - c)^2)

Fisher Information peaks when the item difficulty `b` is close to the student's `theta`. Selecting high-information items means each answer gives the most statistical signal for updating theta.

**Epsilon-greedy rule**:
- With probability epsilon = 0.1: pick a random candidate (exploration)
- With probability 1 − epsilon = 0.9: pick the item with maximum Fisher Information at the student's current theta (exploitation)

---

### 6.4 SRS — Spaced Repetition System (SuperMemo SM-2)

**File**: `ml_sidecar/services/srs_service.py`

**Purpose**: Schedule when a student should review a concept next, based on how well they recalled it (quality score 0–5).

**SM-2 algorithm**:
1. If quality < 3: reset repetitions, schedule review for tomorrow.
2. Otherwise: `interval = round(previous_interval * ease_factor)`, `ease = ease + 0.1 − (5 − quality) * (0.08 + (5 − quality) * 0.02)`
3. Ease is clamped to minimum 1.3 to prevent review intervals from collapsing.

**Stored per concept**: `ease`, `interval_days`, `reps`, `next_due`.

**Effect**: Concepts answered correctly multiple times are scheduled weeks or months out. Forgotten concepts reset to daily review.

---

## 7. Database — Schema, Tables, and Data Flow

### 7.1 Connection

`mysql2/promise` creates a **connection pool** at startup:

```javascript
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,  // mysql://user:pass@host:4000/db
    ssl: { ... },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})
```

All queries use `await pool.query(sql, params)`. Parameterised queries prevent SQL injection — user input is never interpolated into SQL strings.

### 7.2 VidyaPath Tables (`vp_` prefix)

All VidyaPath tables are created idempotently at startup by `routes/vp/migrations.js` using `CREATE TABLE IF NOT EXISTS`.

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `vp_concepts` | id, subject, title, grade_min, grade_max | Atomic learnable concepts (leaf nodes of the curriculum) |
| `vp_lessons` | id, concept_id, subject, title, body_i18n (JSON), audio_url_i18n (JSON), ordering, grade | Lessons linked to concepts. Body and audio are JSON objects keyed by language code |
| `vp_lesson_progress` | student_id, lesson_id, status (ENUM), mastery_pct, last_position | Per-student lesson state. last_position stores reading scroll offset for resume |
| `vp_quiz_items` | id, lesson_id, concept_id, subject, kind (mcq/short/tf), prompt_i18n, options_i18n, answer_key, a, b, c, is_diagnostic | IRT-parameterised question bank. a, b, c are the three IRT parameters |
| `vp_attempts` | id, student_id, item_id, lesson_id, subject, student_answer, correct, score, ai_feedback (JSON), time_taken_ms | Full audit log of every answer |
| `vp_student_ability` | (student_id, subject) PK, theta, n_responses | IRT theta per student per subject |
| `vp_student_mastery` | (student_id, concept_id) PK, p_mastery, ease, interval_days, reps, next_due | BKT + SRS state per student per concept |
| `vp_voice_queries` | id, student_id, lesson_id, mode (text/voice), lang, question, answer, provider | Full history of voice/text tutor interactions |
| `vp_diagnostic_state` | student_id, diagnostic_done, completed_at, result_json | Tracks whether the student completed the one-time placement test |
| `vp_careers` | id, title, domain, summary, avg_salary, education, skills_json | Career catalog for LLM matching |
| `vp_scholarships` | id, title, provider, eligibility, amount, url | Scholarship catalog |
| `vp_mentors` | id, name, expertise, bio, languages, availability | Mentor catalog |
| `vp_match_history` | id, student_id, kind, matched_ids (JSON), summary, provider | Audit log of career-hub LLM matches |
| `vp_notifications` | id, student_id, type, title, body, read_at, created_at | In-app notifications |
| `vp_sync_events` | id, student_id, event_type, payload (JSON), synced_at | Server-side mirror of offline sync queue |
| `vp_user_prefs` | student_id PK, lang, grade, board, state, diagnostic_done, xp_points | Per-user preferences and XP points |
| `vp_syllabi` | id, student_id, title, raw_text, units_json, created_at | Uploaded syllabus documents |
| `vp_study_topics` | id, syllabus_id, unit_title, topic_title, notes (JSON), notes_status | Extracted topics with generated notes |
| `vp_study_tests` | id, syllabus_id, student_id, questions (JSON), status, score | Generated practice tests |
| `vp_teacher_notes` | id, teacher_id, title, subject, batch, file_name, original_name, file_type, file_size | Teacher-uploaded reference materials |

### 7.3 Mentor Platform Tables

| Table | Purpose |
|-------|---------|
| `users` | All users (student, mentor, admin) with bcrypt password hash |
| `submissions` | Code submissions |
| `global_test_submissions` | Test attempt results |
| `aptitude_submissions` | Aptitude test results |
| `comm_test_submissions` | Communication test audio + scores |
| `problems` | Coding problem catalog |
| `student_gamification` | XP, level, streak |
| `badges`, `user_badges` | Badge definitions and awards |
| `points_history` | Audit log of point events |
| `certificates` | Issued certificates with verification codes |
| `plagiarism_analysis` | Plagiarism detection results |
| `student_analytics` | Predictive analytics snapshots |
| `direct_messages` | Chat messages (auto-deleted after 24 hours) |
| `lab_exercises`, `lab_exercise_assignments`, `lab_exercise_submissions` | Lab exercise system |
| `crt_*` | Company round test tables |
| `comm_test_*` | Communication test tables |
| `frontend_eval_*` | Frontend evaluation tables |
| `submission_file_storage` | ZIP blobs for frontend evaluation (LONGBLOB) |
| `alumni_*` | Alumni directory tables |
| `resource_links` | Curated resource links per batch |
| `student_batches` | Batch membership |

### 7.4 How Data Flows — A Complete Request Example

**Example: Student answers a quiz question**

```
1. Browser --> POST /api/vp/quiz/answer
   Body: { item_id, student_answer, session_id, time_taken_ms }

2. authenticate middleware
   - Reads Authorization: Bearer <token>
   - jwt.verify(token, JWT_SECRET)
   - Attaches req.user = { id, email, role }

3. rateLimiter (aiLimiter)
   - Checks user's request count in 15-min window

4. Route handler (routes/vp/quiz.js)
   - Fetch item from vp_quiz_items WHERE id = ?
   - Check correct (exact match for MCQ/TF)
     OR send to llmChat() for short-answer grading

   - Call ML sidecar: POST http://localhost:8000/bkt/update
     Body: { p_mastery, correct, p_learn, p_slip, p_guess }
     Response: { p_mastery: 0.72 }

   - MySQL: INSERT INTO vp_attempts (id, student_id, item_id, ...)

   - MySQL: INSERT INTO vp_student_mastery ...
             ON DUPLICATE KEY UPDATE p_mastery = 0.72

   - Call ML sidecar: POST http://localhost:8000/srs/schedule
     Body: { ease, interval, reps, quality }
     Response: { ease, interval, reps, next_due }

   - MySQL: UPDATE vp_student_mastery SET ease=?, interval_days=?, next_due=?

   - Response: { correct, score, feedback, mastery, next_due }

5. Browser receives response
   - React updates quiz state, shows feedback, advances to next item
```

---

## 8. Backend — Internal Working

### 8.1 Startup Sequence (`server.js`)

```
1. dotenv.config()  — loads .env
2. Create Express app + http.Server + Socket.IO
3. Apply global middleware:
   - CORS (origin whitelist)
   - body-parser (JSON + URL-encoded)
   - Morgan (HTTP logging)
   - sanitizeMiddleware (XSS/injection scrubbing)
   - generalLimiter (rate limiting)
4. Create MySQL pool (mysql2/promise)
5. Mount Swagger UI at /api-docs
6. Run table-creation migrations for all Mentor tables
7. await vidyaPathRouter(pool, authenticate)
   - Runs VidyaPath migrations (vp_* tables)
   - Seeds initial catalog data if empty
   - Returns mounted router --> app.use('/api/vp', router)
8. Mount all other route groups
9. httpServer.listen(PORT)
10. Socket.IO connection handler attached
11. Message auto-cleanup interval started (every 30 min)
```

### 8.2 LLM Router (Provider Fallback)

`services/vp/llm_router.js` is the single point of contact for all AI text generation.

- `llmChat(opts)` — General chat completion. Returns `{ provider, text }`.
- `llmJson(opts)` — Same, but expects a JSON response. Automatically retries once if the response is not valid JSON.
- `evaluateShortAnswer(opts)` — Specialised for quiz grading. Returns `{ correct, score, feedback }`.

All calls check the 60-second in-memory cache first using a `cacheKey` derived from the prompt content.

### 8.3 Rate Limiting Tiers

| Endpoint Type | Free | Pro | Enterprise |
|--------------|------|-----|-----------|
| General API | 500 req / 15 min | 2000 | Unlimited |
| Auth (login) | 10 req / 15 min | 50 | Unlimited |
| AI endpoints | 5 req / day | 50 | Unlimited |
| Code execution | 10 req / 5 min | 100 | Unlimited |
| File uploads | 5 req / 15 min | 50 | Unlimited |

The key generator uses the JWT user ID when authenticated, falling back to the client IP for unauthenticated requests.

### 8.4 Plagiarism Detection Algorithm

Three independent similarity metrics are computed for every pair of submissions for the same problem:

1. **Jaccard Similarity** — Tokenise both submissions; compute intersection/union of token sets. Fast, catches copy-paste.
2. **Structural Similarity (LCS)** — Longest Common Subsequence on the character level. Catches rearranged copies.
3. **Rabin-Karp Rolling Hash** — Sliding window of 10 tokens hashed. Common hash windows indicate copied segments. Catches partial copy-paste.

Final score = weighted combination. Flagged if above a configurable threshold. Severity levels: none / low / medium / high / critical.

### 8.5 Code Execution (Lab Exercises, CRT)

Server checks for locally installed compilers at startup: gcc/g++ (C/C++), javac (Java), python (Python 3), node (JavaScript), sqlite3 (falls back to Judge0 API if not found).

Student code is written to a temp file, compiled if needed, and executed via `child_process.exec` with a configurable timeout. Output is compared against expected output or sent to the LLM for open-ended evaluation.

### 8.6 SQL Safe Execution

`sanitizeSQLForSQLite()` converts MySQL-dialect DDL to SQLite-compatible DDL:
- Strips ENGINE=, CHARSET=, COLLATE=, ROW_FORMAT=, AUTO_INCREMENT
- Replaces backtick identifiers with double-quoted identifiers
- Converts TINYINT(1)/BOOLEAN to INTEGER, DATETIME/TIMESTAMP to TEXT, VARCHAR(n) to TEXT, ENUM(...) to TEXT
- Removes inline KEY/INDEX definitions

The student query runs inside an in-memory SQLite instance. Results are compared against admin-defined expected output in a normalised, order-independent way (handles GROUP BY / ORDER BY differences).

---

## 9. Frontend — Internal Working

### 9.1 Authentication Flow

```
1. User submits login form
2. POST /api/login --> { token, user }
3. token stored in localStorage
4. AuthContext.user set --> triggers ProtectedRoute re-evaluation
5. Navigate to /student, /mentor, or /admin
6. Axios global interceptor attaches token to ALL subsequent requests
7. On 401 response --> clear localStorage --> redirect to /login
```

### 9.2 Code Splitting Strategy

| Chunk | Contents | Why Separate |
|-------|----------|-------------|
| vendor-react | React, ReactDOM, React Router | Changes rarely; long browser cache |
| vendor-charts | Recharts, D3 | Heavy; only loaded on analytics pages |
| vendor-monaco | Monaco Editor | Very heavy (~4 MB); only loaded on code editor pages |
| vendor-ai | TensorFlow.js, BlazeFace | Heavy; only loaded during proctored sessions |
| vendor-sql | sql.js (WASM) | Heavy; only loaded on SQL practice pages |
| vendor-misc | Axios, Socket.IO, Lucide | Shared utilities |

### 9.3 VidyaPath Student Portal Pages (`client/src/pages/vp/`)

| Page | Main API Calls |
|------|----------------|
| VidyaPathHome | GET /api/vp/profile, GET /api/vp/diagnostic/state |
| Diagnostic | GET /api/vp/diagnostic/items, POST /api/vp/diagnostic/submit |
| LessonsList | GET /api/vp/lessons?lang=hi |
| LessonDetail | GET /api/vp/lessons/:id, POST /api/vp/lessons/:id/progress |
| AdaptiveQuiz | GET /api/vp/quiz/lesson/:id/start, POST /api/vp/quiz/next, POST /api/vp/quiz/answer |
| PracticePicker | GET /api/vp/practice/recommended |
| VPVoiceTutorPage | POST /api/vp/voice-tutor/text or /voice (multipart) |
| SmartStudy | POST /study/upload, POST /study/syllabi/:id/topics/:tid/notes |
| CareerHub | POST /api/vp/career-hub/match |
| PersonalizedStudy | GET /api/vp/personalized |
| VPProfile | GET /api/vp/profile, PUT /api/vp/profile |
| VPNotifications | GET /api/vp/notifications |

---

## 10. Frontend ↔ Backend ↔ Database Integration

### 10.1 REST Data Fetching

Every React component that needs data:
1. Calls `axios.get('/api/...')` (Vite proxy in dev → `http://localhost:3000/api/...`)
2. The global Axios interceptor adds the Bearer token automatically
3. Express route validates the token, runs the query, returns JSON
4. React stores the result in `useState` and renders

### 10.2 Real-time (Socket.IO)

Events pushed from server to client:
- `code_output` — streaming code execution results to the student's editor
- `new_message` — instant delivery of direct messages
- `violation_event` — proctoring violations pushed to the mentor's live monitoring dashboard
- `submission_graded` — lab exercise result pushed when AI grading completes

### 10.3 Offline Sync

The Service Worker intercepts failed API requests during connectivity loss and stores them in IndexedDB. When connectivity is restored, it replays the queue and calls `POST /api/vp/sync/push` to mirror events server-side.

### 10.4 File Uploads — Two Strategies

| Use Case | Strategy | Storage |
|----------|---------|---------|
| Voice audio for STT | Memory (Multer) | Never persisted — processed immediately |
| Teacher notes (PDF, PPT) | Disk | `uploads/teacher_notes/` |
| Frontend evaluation ZIPs | Hybrid | Local disk + LONGBLOB in `submission_file_storage` |
| Syllabus PDF/image | Memory | Parsed immediately, text stored in DB |

---

## 11. Security & Middleware

### 11.1 Authentication

- Passwords hashed with **bcrypt** (12 rounds).
- **JWT** tokens (HS256, 24 h expiry, configurable via `JWT_EXPIRES_IN`).
- Backward compatibility: plain-text password detection during migration (`comparePassword` checks for bcrypt hash prefix before comparing).

### 11.2 Input Validation

`middleware/validation.js` defines Zod schemas for all mutating endpoints: login, user creation, password reset, task creation, submission, message sending, bulk operations, problem creation, aptitude submission, test submission, plagiarism check.

### 11.3 Sanitization

`middleware/sanitizer.js` runs on every request body:
- Strips HTML tags from string fields (XSS prevention)
- Removes null bytes
- Recursively sanitises nested objects and arrays

### 11.4 Rate Limiting

`express-rate-limit` with per-user (JWT ID) or per-IP keying. Tier-based limits enforced per route group. Admin-enterprise users bypass general limits.

### 11.5 CORS

Configured to allow only the known frontend origin (`VITE_API_URL`) in production.

### 11.6 SQL Injection Prevention

All database queries use **parameterised placeholders** (`?`). No string interpolation into SQL. mysql2 handles escaping internally.

### 11.7 Proctoring Violation Scoring

Configurable weights per violation type (no face, multiple faces, tab switch, clipboard event). Cumulative score beyond a threshold triggers a real-time alert to the mentor's live monitoring dashboard via Socket.IO.

---

## 12. Running the Platform

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 18+ (22 recommended) |
| npm | 9+ |
| Python | 3.9+ |
| MySQL-compatible DB | PlanetScale / TiDB / Local MySQL 8 |
| gcc, g++, javac, python (for code execution) | Any recent version |

### Step 1 — Install Backend Dependencies

```bash
cd vidya-path
npm install
```

### Step 2 — Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 3 — Install ML Sidecar Dependencies

```bash
pip install fastapi uvicorn pydantic
# or: pip install -r ml_sidecar/requirements.txt
```

### Step 4 — Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

At minimum you need:
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — any long random string
- `CEREBRAS_API_KEY` or `GROQ_API_KEY` (at least one LLM key)
- `SARVAM_API_KEY` — for voice features (optional but recommended)

### Step 5 — Start All Three Processes

**Terminal 1 — Backend**:
```bash
node server.js
# Server running at http://127.0.0.1:3000
```

**Terminal 2 — ML Sidecar**:
```bash
python -m uvicorn ml_sidecar.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Frontend (dev)**:
```bash
cd client
npm run dev
# Vite dev server at http://localhost:5173
```

### Production Build

```bash
cd client && npm run build
# Outputs to client/dist/ — served as static files by Express in production
```

---

## 13. Environment Variables Reference

| Variable | Required | Description |
|---------|---------|-------------|
| `PORT` | No (default 3000) | Backend HTTP port |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | `mysql://user:pass@host:port/dbname` |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No (default 24h) | Token expiry e.g. `7d`, `24h` |
| `CEREBRAS_API_KEY` | Recommended | Primary LLM API key |
| `CEREBRAS_API_KEY_1` ... `_4` | No | Additional Cerebras keys for rotation |
| `CEREBRAS_MODEL` | No | Default `llama3.3-70b` |
| `GROQ_API_KEY` | Recommended | Secondary LLM + Whisper STT fallback |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `NVIDIA_API_KEY` | No | Tertiary LLM fallback |
| `NVIDIA_BASE_URL` | No | NVIDIA NIM endpoint |
| `NVIDIA_MODEL` | No | Default `nvidia/nemotron-3-super-120b-a12b` |
| `SARVAM_API_KEY` | Recommended | Indian language STT + TTS |
| `SARVAM_BASE_URL` | No | Default `https://api.sarvam.ai` |
| `SARVAM_STT_MODEL` | No | Default `saarika:v2` |
| `SARVAM_TTS_MODEL` | No | Default `bulbul:v2` |
| `SARVAM_TTS_SPEAKER` | No | Default `meera` |
| `ML_SIDECAR_URL` | No (default `http://127.0.0.1:8000`) | Python ML sidecar base URL |
| `ML_SIDECAR_TIMEOUT_MS` | No (default 6000) | Timeout before JS fallback kicks in |
| `COMM_TEST_SYNC_STT_CONCURRENCY` | No (default 4) | Concurrent synchronous STT requests |
| `COMM_TEST_BG_STT_CONCURRENCY` | No (default 2) | Concurrent background STT requests |
| `VITE_API_URL` | No (default `http://localhost:3000`) | API origin for the Vite dev proxy |

---

## 14. Why These Tech Choices?

| Decision | Reason |
|---------|--------|
| Node.js for backend | Non-blocking I/O handles many concurrent students without the memory overhead of thread-per-request models. Same language as the frontend. |
| Express v5 | Proven ecosystem. Native async error propagation in v5 eliminates try/catch boilerplate in route handlers. |
| MySQL (PlanetScale) | Relational data with foreign keys fits the student-lesson-attempt model better than NoSQL. PlanetScale's serverless driver works behind edge networks. |
| Python FastAPI for ML | Scientific Python ecosystem for IRT/BKT mathematics. FastAPI is async and roughly 10x faster than Flask. Separating ML from the Node process means ML failures do not crash the main API. |
| Cerebras as primary LLM | Industry-fastest inference for large models — sub-second responses are essential for tutoring. Multiple key rotation avoids single-key rate limits. |
| Sarvam for voice | Only production-grade service covering all 12 major Indian languages. Critical for mother-tongue tutoring. |
| LLM fallback chain | No single provider has 100% uptime. Three-tier fallback keeps tutoring available even during provider outages. |
| sql.js for SQL practice | In-memory SQLite execution means zero risk to the production database. No extra service to deploy. Works offline. |
| TensorFlow.js + BlazeFace for proctoring | Client-side face detection: no video stream sent to the server, preserves student privacy, works on low-bandwidth connections. |
| React lazy loading + Vite chunks | The platform has many heavy components (Monaco, TensorFlow, charts). Code splitting ensures students only download what they need for their current page. |
| JWT stateless auth | No session store needed. Tokens scale horizontally across multiple backend instances. |
| bcrypt (12 rounds) | Computationally expensive enough that brute-force is infeasible, fast enough for a login endpoint. |
| In-memory cache (Map) | Avoids Redis dependency for single-server deployment. The 60-second LLM prompt cache meaningfully reduces API costs when multiple students ask identical questions simultaneously. |
| UUIDs as primary keys | Records can be created client-side (offline) without database coordination. No sequential ID enumeration vulnerability. |
| Cultural injector post-processing | Cheaper than re-prompting the LLM to use Indian cultural context. Deterministic, zero-latency, zero-cost. |
