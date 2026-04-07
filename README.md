# Mentor - Comprehensive Assessment & Proctoring Platform

A full-stack web application providing AI-powered assessment management, live proctoring, plagiarism detection, and detailed analytics for educational institutions and training organizations.

## 🎯 Features

- **AI-Powered Evaluation**
  - Automated code review and evaluation
  - AI test case generation
  - Intelligent plagiarism detection
  - AI recommendations for learners

- **Assessment Management**
  - Multiple choice questions (MCQ)
  - Frontend evaluation with live code execution
  - Lab exercises and practical assignments
  - Aptitude testing
  - Communication tests with audio support

- **Proctoring & Monitoring**
  - Real-time live monitoring of test sessions
  - Advanced proctoring engine
  - Violation detection and scoring

- **Analytics & Insights**
  - Comprehensive dashboard analytics
  - Audit logging for compliance
  - Performance reports and certificates
  - Detailed violation tracking

- **Advanced Features**
  - Gamification system
  - Batch processing
  - Webhook management
  - Advanced search capabilities
  - Offline support (PWA)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **API Framework**: Express
- **Database**: MySQL (TiDB Cloud)
- **AI Services**: Cerebras API, Groq API

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS
- **State Management**: Built-in React hooks
- **Internationalization**: i18n support

### Testing & Quality
- **Test Framework**: Jest
- **Unit Tests**: Middleware, routes, utilities
- **Integration Tests**: Auth integration tests

### Deployment
- **PWA**: Service worker and offline HTML support
- **CDN Ready**: Static asset structure

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- Python 3.8+ (for utilities)
- MySQL database or TiDB Cloud access

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Mentor
```

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your credentials
```

### 3. Frontend Setup
```bash
cd client
npm install
```

### 4. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
DATABASE_URL=<your-database-url>

# AI Services
CEREBRAS_API_KEY_1=<your-cerebras-key>
CEREBRAS_API_KEY_2=<your-cerebras-key>
CEREBRAS_API_KEY_3=<your-cerebras-key>
CEREBRAS_API_KEY_4=<your-cerebras-key>

# Audio Transcription (Groq)
GROQ_API_KEY=<your-groq-key>
```

## 📦 Project Structure

```
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API service handlers
│   │   ├── config/                 # Configuration
│   │   ├── i18n/                   # Internationalization
│   │   ├── styles/                 # Global styles
│   │   └── assets/                 # Static assets
│   ├── public/                      # Static files (HTML, icons, PWA)
│   └── vite.config.js              # Vite configuration
│
├── routes/                          # API route handlers
│   ├── advanced_features.js
│   ├── batch_routes.js
│   ├── communication_routes.js
│   ├── frontend_eval_routes.js
│   ├── lab_exercise_routes.js
│   └── __tests__/
│
├── services/                        # Business logic services
│   ├── ai_code_review_service.js
│   ├── analytics_service.js
│   ├── certificate_service.js
│   ├── gamification_service.js
│   ├── plagiarism_detector.js
│   ├── violation_scoring_service.js
│   └── webhook_service.js
│
├── middleware/                      # Express middleware
│   ├── auth.js                     # Authentication
│   ├── rateLimiter.js              # Rate limiting
│   ├── sanitizer.js                # Input sanitization
│   ├── validation.js               # Request validation
│   └── swagger.js                  # API documentation
│
├── utils/                           # Utility functions
│   ├── cache.js
│   ├── logger.js
│   ├── pagination.js
│   └── __tests__/
│
├── uploads/                         # User-generated content
│   ├── attachments/
│   ├── comm-test-audio/
│   ├── frontend-evals/
│   └── proctoring/
│
├── server.js                        # Main server entry point
├── jest.config.js                   # Jest configuration
└── package.json
```

## 🏃 Running the Application

### Development Mode

**Backend:**
```bash
npm run dev
# or start with Node directly
node server.js
```

**Frontend:**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and API at `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd client
npm run build
```

**Starting Production Server:**
```bash
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Specific test file
npm test -- <test-file-path>
```

### Test Structure
- **Middleware Tests**: `middleware/__tests__/`
- **Route Tests**: `routes/__tests__/`
- **Utils Tests**: `utils/__tests__/`
- **Integration Tests**: End-to-end authentication flows

## 📚 API Documentation

The API has Swagger documentation enabled via the `middleware/swagger.js` module. Access it at:
```
http://localhost:3000/api-docs
```

## 🔐 Security Features

- **Authentication**: JWT-based auth middleware
- **Rate Limiting**: Request rate limiting to prevent abuse
- **Input Sanitization**: XSS and injection attack prevention
- **Request Validation**: Schema validation for all inputs
- **Audit Logging**: Comprehensive audit trails

## 🌍 Internationalization

The frontend supports multiple languages through the i18n module. Add new languages in `client/src/i18n/`

## 📱 Progressive Web App

The application includes PWA support:
- Service worker for offline functionality (`public/sw.js`)
- Manifest for installation (`public/manifest.json`)
- Offline fallback page (`public/offline.html`)

## 🐛 Debugging

### Backend Debugging
- See `db_debug.js` and `db_debug_raw.js` for database debugging scripts
- Use `logger.js` utility for structured logging

### Frontend Debugging
- React DevTools recommended
- Vite provides HMR (Hot Module Replacement) during development

## 📊 Key Services

- **AI Code Review**: Automated code analysis using Cerebras API
- **Plagiarism Detection**: Advanced plagiarism checking
- **Analytics**: Comprehensive user and performance analytics
- **Gamification**: Points, badges, and leaderboard system
- **Notifications**: Email and in-app notifications
- **Certificates**: Automated certificate generation

## 🔗 Environment & Deployment

- Database: MySQL via TiDB Cloud
- AI Processing: Cerebras API with 4 rotating keys for reliability
- Audio Transcription: Groq API
- Static Hosting: Configured for static file serving

---

**Last Updated**: April 2026
