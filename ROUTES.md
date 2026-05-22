## BACKEND ROUTES REFERENCE

### 📌 BASE URLs
- **Backend**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Frontend**: http://localhost:5173
- **AI Service**: http://localhost:8000

---

## 🔐 AUTHENTICATION ROUTES (`/api/auth`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| POST | `/auth/signup` | Register new user | ❌ No |
| POST | `/auth/login` | Login user & get JWT token | ❌ No |

**Token Usage**: Add header `Authorization: Bearer <token>` to authenticated requests

---

## 📚 TOPIC ROUTES (`/api/topics`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/topics` | Get all user's topics | ✅ Yes |
| GET | `/topics/due-review` | Get topics due for review | ✅ Yes |
| GET | `/topics/:id` | Get specific topic details | ✅ Yes |
| POST | `/topics` | Create new topic | ✅ Yes |
| PUT | `/topics/:id` | Update topic | ✅ Yes |
| DELETE | `/topics/:id` | Delete topic | ✅ Yes |
| PATCH | `/topics/:id/status` | Update topic status | ✅ Yes |

**Related Pages**: Dashboard, StudyPlanner, TopicDetail

---

## 📖 SESSION ROUTES (`/api/sessions`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/sessions` | Get all sessions | ✅ Yes |
| GET | `/sessions/:topicId` | Get sessions for a topic | ❌ No |
| POST | `/sessions` | Add study session | ✅ Yes |
| PATCH | `/sessions/:id/notes` | Update session notes | ✅ Yes |
| DELETE | `/sessions/:id` | Delete session | ✅ Yes |

**Related Pages**: Dashboard, SessionLog, TopicDetail

---

## 🤖 AI ROUTES (`/api/ai`)

| Method | Route | Purpose | Auth Required | Leads To |
|--------|-------|---------|---|---|
| POST | `/ai/plan` | Generate weekly study schedule | ❌ No | **Study Planner** generates schedule |
| POST | `/ai/chat` | Chat with AI study coach | ✅ Yes | **ChatWidget** conversation |
| POST | `/ai/summarize` | Summarize learning progress | ✅ Yes | **Analytics** dashboard |
| POST | `/ai/improve-notes` | AI-improved version of notes | ❌ No | **SharedNotes** |
| POST | `/ai/decompose` | Break task into subtasks | ❌ No | Study planning |
| GET | `/ai/resources` | Get knowledge base resources | ❌ No | **Resources** page |
| POST | `/ai/resources` | Add resource to KB | ❌ No | **Resources** page |
| GET | `/ai/chat-history` | Get past conversations | ✅ Yes | **ChatWidget** history |
| DELETE | `/ai/chat-history` | Clear chat history | ✅ Yes | **ChatWidget** |
| GET | `/ai/weekly-report` | Generate weekly performance report | ✅ Yes | **Analytics** |

**Related Pages**: StudyPlanner, Dashboard, ChatWidget, Resources, Analytics

---

## 🎯 QUIZ ROUTES (`/api/quiz`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| POST | `/quiz/generate` | Generate quiz from topic | ✅ Yes |
| POST | `/quiz/submit` | Submit quiz answers | ✅ Yes |
| GET | `/quiz/history/:topicId` | Get quiz history for topic | ✅ Yes |

**Related Pages**: Dashboard, TopicDetail (embedded quiz component)

---

## 🏢 WORKSPACE ROUTES (`/api/workspaces`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/workspaces` | Get all workspaces | ✅ Yes |
| GET | `/workspaces/invites` | Get pending invites | ✅ Yes |
| POST | `/workspaces` | Create workspace | ✅ Yes |
| POST | `/workspaces/:id/invite` | Send invite to user | ✅ Yes |
| PATCH | `/workspaces/:id/invites/:inviteId` | Accept/reject invite | ✅ Yes |
| POST | `/workspaces/:id/members` | Add member to workspace | ✅ Yes |
| GET | `/workspaces/:id/chat` | Get workspace chat | ✅ Yes |

**Related Pages**: Workspaces, WorkspaceDetail

---

## 📝 NOTE ROUTES (`/api/notes`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/workspaces/:workspaceId/notes` | Get notes in workspace | ✅ Yes |
| POST | `/notes` | Update/create note | ✅ Yes |
| DELETE | `/notes/:id` | Delete note | ✅ Yes |

**Related Pages**: SharedNotes, WorkspaceDetail

---

## 📌 REMINDER ROUTES (`/api/reminders`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/reminders` | Get user's reminders | ✅ Yes |
| POST | `/reminders` | Create new reminder | ✅ Yes |
| DELETE | `/reminders/:id` | Delete reminder | ✅ Yes |
| PATCH | `/reminders/:id/trigger` | Mark reminder as triggered | ✅ Yes |

**Related Pages**: Dashboard (ReminderService runs in background)

---

## 📚 RESOURCE ROUTES (`/api/resources`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/workspaces/:workspaceId/resources` | Get resources | ✅ Yes |
| POST | `/resources` | Add resource | ✅ Yes |
| DELETE | `/resources/:id` | Delete resource | ✅ Yes |

**Related Pages**: Resources, SharedNotes

---

## 📋 PLAN ROUTES (`/api/plans`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---|
| GET | `/plans` | Get saved study plans | ✅ Yes |
| POST | `/plans` | Save new plan | ✅ Yes |
| DELETE | `/plans/:id` | Delete plan | ✅ Yes |

**Related Pages**: StudyPlanner

---

## 🔧 HEALTH/DEBUG ROUTES

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | Health check (backend alive) |
| GET | `/api/health` | Backend status |
| GET | `/api/health/detailed` | Backend + Database + AI Service status |

**AI Service Debug**:
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | AI service status |
| GET | `/debug` | AI configuration (provider, model) |

---

## 🎨 FRONTEND PAGES MAPPING

| Page | Route | Primary Routes Used |
|------|-------|---|
| **Login** | `/login` | POST /auth/login |
| **Signup** | `/signup` | POST /auth/signup |
| **Dashboard** | `/dashboard` | GET /topics, GET /sessions, GET /reminders, GET /quiz/history |
| **Study Planner** | `/study-planner` | POST /ai/plan, GET/POST /plans, DELETE /plans |
| **Resources** | `/resources` | GET/POST /ai/resources, GET /resources |
| **Analytics** | `/analytics` | GET /ai/weekly-report, GET /ai/summarize |
| **Settings** | `/settings` | User profile management |
| **Workspaces** | `/workspaces` | GET /workspaces, POST /workspaces |
| **Workspace Detail** | `/workspaces/:id` | GET /workspaces/:id, GET /workspaces/:id/chat |
| **Topic Detail** | `/topics/:id` | GET /topics/:id, GET /sessions/:topicId |

---

## 💡 COMMON WORKFLOWS

### Generate Study Plan
```
User → StudyPlanner page
       → Form: topics, goals, hours
       → POST /api/ai/plan
       → AI Service generates plan
       → Display plan
       → User can POST /api/plans to save
```

### Create Study Topic & Log Session
```
User → Dashboard → Create Topic
       → POST /api/topics
       → User starts study session
       → POST /api/sessions
       → Log notes: PATCH /api/sessions/:id/notes
```

### Chat with AI Coach
```
User → ChatWidget → Type message
       → POST /api/ai/chat
       → AI responds
       → GET /api/ai/chat-history (load past)
       → DELETE /api/ai/chat-history (clear)
```

### Create Workspace & Invite
```
User → Workspaces → Create Workspace
       → POST /api/workspaces
       → Invite member: POST /api/workspaces/:id/invite
       → Member receives invite: GET /api/workspaces/invites
       → Member accepts: PATCH /api/workspaces/:id/invites/:inviteId
```

---

## 🚀 LOCAL SETUP CHECKLIST

- [x] Backend `.env` set to `AI_SERVICE_URL=http://localhost:8000`
- [x] AI Service `.env` set to `AI_PROVIDER=ollama`
- [ ] Start Ollama: `ollama serve`
- [ ] Download model: `ollama pull qwen2.5:0.5b`
- [ ] Start Backend: `cd backend && npm start`
- [ ] Start AI Service: `cd ai-service && python main.py`
- [ ] Start Frontend: `cd frontend && npm run dev`
- [ ] Visit http://localhost:5173
