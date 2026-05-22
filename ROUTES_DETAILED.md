# 🎯 ROUTE TO PAGE MAPPING

## Frontend Pages → Backend Routes Used

```
http://localhost:5173/
│
├── 🔐 Login (/login)
│   └── POST /api/auth/login
│
├── 🔐 Signup (/signup)
│   └── POST /api/auth/signup
│
├── 📊 Dashboard (/dashboard)
│   ├── GET /api/topics
│   ├── GET /api/sessions
│   ├── GET /api/reminders ← Background polling every 60s
│   ├── GET /api/quiz/history/:topicId
│   └── User streaming status via Socket.io
│
├── 📋 Study Planner (/study-planner)
│   ├── POST /api/ai/plan ← Generates schedule
│   ├── GET /api/plans ← List saved plans
│   ├── POST /api/plans ← Save plan
│   └── DELETE /api/plans/:id ← Delete plan
│
├── 📚 Resources (/resources)
│   ├── GET /api/ai/resources ← Knowledge base
│   ├── POST /api/ai/resources ← Add resource
│   └── GET /api/workspaces/:workspaceId/resources
│
├── 📈 Analytics (/analytics)
│   ├── GET /api/ai/weekly-report ← Performance summary
│   └── GET /api/ai/summarize ← Progress analysis
│
├── ⚙️ Settings (/settings)
│   └── User profile (local storage)
│
├── 🏢 Workspaces (/workspaces)
│   ├── GET /api/workspaces ← List all
│   ├── GET /api/workspaces/invites ← Pending invites
│   └── POST /api/workspaces ← Create new
│
├── 🏢 Workspace Detail (/workspaces/:id)
│   ├── GET /api/workspaces/:id ← Workspace info
│   ├── GET /api/workspaces/:id/chat ← Messages
│   ├── GET /api/workspaces/:id/notes ← Shared notes
│   ├── GET /api/workspaces/:id/resources ← Resources
│   ├── POST /api/workspaces/:id/invite ← Send invite
│   └── PATCH /api/workspaces/:id/invites/:inviteId ← Accept/Reject
│
├── 📖 Topic Detail (/topics/:id)
│   ├── GET /api/topics/:id ← Topic details
│   ├── GET /api/sessions/:topicId ← Study sessions
│   ├── POST /api/sessions ← Log new session
│   ├── PATCH /api/sessions/:id/notes ← Update notes
│   └── POST /api/quiz/generate ← Generate quiz
│
├── 💬 ChatWidget (Embedded in Dashboard)
│   ├── POST /api/ai/chat ← Send message
│   ├── GET /api/ai/chat-history ← Load past messages
│   └── DELETE /api/ai/chat-history ← Clear all
│
└── 📝 Shared Notes (In Workspaces)
    ├── GET /api/workspaces/:workspaceId/notes
    ├── POST /api/notes ← Create/update
    └── DELETE /api/notes/:id ← Delete
```

---

## Backend Controllers Structure

```
backend/routes/
├── auth.js
│   ├── POST /auth/signup → userController
│   └── POST /auth/login → userController
│
├── api.js
│   ├── Topic Routes (topicController)
│   │   GET/POST /topics
│   │   GET /topics/due-review
│   │   etc.
│   │
│   ├── Session Routes (sessionController)
│   │   GET/POST /sessions
│   │   PATCH /sessions/:id/notes
│   │   etc.
│   │
│   ├── AI Routes (aiController)
│   │   POST /ai/plan → calls AI Service
│   │   POST /ai/chat → calls AI Service
│   │   POST /ai/summarize → calls AI Service
│   │   POST /ai/improve-notes → calls AI Service
│   │   etc.
│   │
│   ├── Quiz Routes (quizController)
│   │   POST /quiz/generate → AI Service
│   │   POST /quiz/submit
│   │   GET /quiz/history
│   │
│   ├── Workspace Routes (workspaceController)
│   │   GET/POST /workspaces
│   │   POST /workspaces/:id/invite
│   │   GET /workspaces/:id/chat (Socket.io)
│   │   etc.
│   │
│   ├── Note Routes (noteController)
│   │   GET/POST/DELETE /notes
│   │
│   ├── Resource Routes (resourceController)
│   │   GET/POST/DELETE /resources
│   │
│   ├── Plan Routes (planController)
│   │   GET/POST/DELETE /plans
│   │
│   ├── Reminder Routes (reminderController)
│   │   GET /reminders (polled every 60s)
│   │   POST/DELETE /reminders
│   │   PATCH /reminders/:id/trigger
│   │
│   └── Health Routes (server.js)
│       GET / → Basic health
│       GET /api/health
│       GET /api/health/detailed
```

---

## AI Service Endpoints

```
ai-service/main.py
├── /health (GET)
│   └── Returns: { status, model_name }
│
├── /debug (GET)
│   └── Returns: { provider, model, configs }
│
├── /rag/chat (POST)
│   ├── Input: message, history, context
│   └── Output: { reply }
│
├── /rag/plan (POST)
│   ├── Input: topics[], goals, hours_per_week
│   └── Output: { plan } ← Used by Study Planner
│
├── /rag/analyze (POST)
│   ├── Input: topics[], sessions[], query
│   └── Output: { summary, context }
│
├── /rag/improve-notes (POST)
│   ├── Input: notes, topic
│   └── Output: { improvedNotes }
│
├── /rag/decompose (POST)
│   ├── Input: task, context
│   └── Output: { subTasks }
│
├── /rag/quiz-generate (POST)
│   ├── Input: topic, difficulty
│   └── Output: { questions[] }
│
├── /rag/quiz-grade (POST)
│   ├── Input: answers, correct_answers
│   └── Output: { score, feedback }
│
├── /rag/knowledge (GET)
│   └── Output: { resources[] }
│
└── /rag/knowledge (POST)
    ├── Input: category, content
    └── Output: { id, resource }
```

---

## 🔄 Key Data Flows

### 1️⃣ Generate Study Plan Flow
```
StudyPlanner.jsx
  ↓ (User submits form)
POST /api/ai/plan
  ↓ (Backend forwards to AI)
AI Service: POST /rag/plan
  ↓ (Ollama generates response)
return { plan: "Weekly schedule..." }
  ↓ (Display to user)
User can click "Save Plan"
POST /api/plans
  ↓ (Stored in MongoDB)
```

### 2️⃣ Chat with AI Coach
```
ChatWidget.jsx
  ↓ (User types message)
POST /api/ai/chat
  ↓ (Backend collects context)
AI Service: POST /rag/chat
  ↓ (LLM generates response)
return { reply: "Here's what you should..." }
  ↓ (Display response)
Repeat...
```

### 3️⃣ Reminder Check (Background)
```
ReminderService.js
  ↓ (Every 60 seconds)
GET /api/reminders
  ↓ (Backend queries DB)
MongoDB: Find reminders where time <= now
  ↓ Return matching reminders
  ↓ (Frontend triggers notification)
User sees: "Time to study JavaScript!"
PATCH /api/reminders/:id/trigger
  ↓ (Mark as shown)
```

### 4️⃣ Workspace Collaboration
```
WorkspaceDetail.jsx
  ↓ (User types message)
emit('sendMessage', { text: "Let's study!" })
  ↓ (Socket.io)
Backend receives via socket
  ↓
Save to Message model
Broadcast to all in workspace
  ↓
Other users see message in real-time
```

---

## 📌 Important Notes

- **Authentication**: JWT token in `Authorization: Bearer <token>` header
- **Database**: MongoDB Cloud (connections pooled)
- **Socket.io**: Real-time updates for chat, reminders, study status
- **Rate Limiting**: 500 requests per 15 minutes per IP
- **AI Timeout**: 30 seconds (returns 503 if taking too long)
- **Reminder Polling**: Every 60 seconds (reduced from 10s to prevent overload)
