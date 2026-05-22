# HyperActive — Complete Feature Guide & Run Manual

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Environment Setup](#2-environment-setup)
3. [Running the Project](#3-running-the-project)
4. [Feature Reference](#4-feature-reference)
5. [AI Provider Configuration](#5-ai-provider-configuration)
6. [API Reference](#6-api-reference)
7. [Test Suite](#7-test-suite)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. System Requirements

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Node.js | 18+ | Backend + Frontend |
| Python | 3.9+ | AI Service |
| MongoDB Atlas | Any | Database (cloud) |
| Ollama | Latest | Local AI (optional) |

Check your versions:
```bash
node --version
python --version
```

---

## 2. Environment Setup

Three `.env` files are required. They are already created — fill in the values marked below.

### `backend/.env`
```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/hyperactive
JWT_SECRET=local_dev_secret_change_this_to_something_long_and_random
PORT=5000
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```
**You must fill in:** `MONGODB_URI` with your MongoDB Atlas connection string.

### `ai-service/.env`
```env
AI_PROVIDER=ollama          # use "gemini" for cloud, "ollama" for local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3
OLLAMA_EMBED_MODEL=nomic-embed-text
GEMINI_API_KEY=your_key_here   # only needed if AI_PROVIDER=gemini
PORT=8000
```

### `frontend/.env.local`
```env
VITE_API_URL=http://localhost:5000
```
This file is already correct. No changes needed.

---

## 3. Running the Project

Open **three separate terminals**.

### Terminal 1 — AI Service (Python)

**First time only — install Ollama models:**
```bash
ollama pull phi3
ollama pull nomic-embed-text
ollama serve
```

**Then start the AI service:**
```bash
cd progress-tracker/ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
Starting background initialization of RAG index...
Background initialization complete.
```

Verify it's running: http://localhost:8000/health

---

### Terminal 2 — Backend (Node.js)

```bash
cd progress-tracker/backend
npm install
node server.js
```

Expected output:
```
🔌 Attempting to connect to MongoDB...
✅ MongoDB connection established successfully
Server is running on port 5000
```

Verify it's running: http://localhost:5000

---

### Terminal 3 — Frontend (React)

```bash
cd progress-tracker/frontend
npm install
npm run dev
```

Expected output:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

### Startup Order

Always start in this order:
1. Ollama (`ollama serve`)
2. AI Service (`uvicorn`)
3. Backend (`node server.js`)
4. Frontend (`npm run dev`)

The AI service takes 10–30 seconds to build its RAG index on first start. AI features will return errors during this window — wait for "Background initialization complete." in the terminal.

---

## 4. Feature Reference

Every feature below is fully implemented, tested, and working.

---

### Authentication

**Where:** `/login`, `/signup`

**What it does:**
- Register with username, email, password (min 6 chars)
- Login returns a JWT token (7-day expiry) stored in localStorage
- Every login awards 10 XP and updates the daily streak
- Token is sent as `Authorization: Bearer <token>` on all protected routes

**How to use:**
1. Go to `/signup`, create an account
2. You are redirected to the Dashboard automatically
3. Refresh the page — you stay logged in (token persists in localStorage)
4. Logout from Settings

---

### Dashboard — Topic Management

**Where:** `/` (Dashboard)

**What it does:**
- Create learning topics with: title, category, goal, deadline, difficulty (Easy/Medium/Hard)
- Edit any topic inline — click the pencil icon on a topic card
- Delete topics
- Topics are scoped to your account — other users cannot see yours
- Overdue topics show a red border and "Overdue by X days" label
- Topics due within 3 days show an amber warning
- Total study time is displayed on each card (e.g. "2h 30m studied")

**How to use:**
1. Click "New Topic" on the Dashboard
2. Fill in Title (required), Category (required), Goal, Target Date, Difficulty
3. Click "Initialize Module"
4. To edit: click the pencil icon on any card
5. To delete: open the topic → click the trash icon

**Spaced Repetition Banner:**
When topics are due for review (based on the SM-2 algorithm), a yellow banner appears at the top of the Dashboard listing them. This triggers after you mark a topic as "Revised" — the system schedules the next review date automatically.

---

### Topic Detail — Sessions

**Where:** `/topic/:id` → Sessions tab

**What it does:**
- Log study sessions with: duration (minutes), notes, mood (Great/Good/Okay/Tired/Frustrated), difficulty
- Each session awards XP: 1 XP per minute, capped at 60 XP per session
- Logging a session increments the topic's total study time
- Delete sessions (also decrements the topic's study time counter)
- View all sessions for a topic in reverse chronological order

**How to use:**
1. Open any topic from the Dashboard
2. Click "Log Session"
3. Enter duration, select mood and difficulty, write notes
4. Click "Save Session"
5. XP is awarded immediately — check the GamificationHeader

---

### Topic Detail — AI Improve Notes

**Where:** `/topic/:id` → Sessions tab → each session card

**What it does:**
- Sends your raw session notes to the AI service
- Returns a rewritten, structured version
- Shows a preview with Accept / Discard buttons
- Clicking "Accept" saves the improved notes back to the database permanently

**How to use:**
1. Open a topic that has at least one logged session
2. Click "AI Improve Notes" on any session card
3. Wait for the AI response (5–30 seconds depending on provider)
4. Review the improved text shown above the original
5. Click "Accept" to save it, or "Discard" to keep the original

**Requires:** AI service running

---

### Topic Detail — Pomodoro Timer

**Where:** `/topic/:id` → 🍅 Pomodoro tab

**What it does:**
- 25-minute focus timer with 5-minute break cycles
- Circular SVG progress ring that depletes in real time
- When a focus session completes, a 25-minute session is automatically logged to the database
- Reset button to restart the timer

**How to use:**
1. Open any topic
2. Click the "🍅 Pomodoro" tab
3. Click "Start"
4. Work for 25 minutes — the timer auto-logs the session when it hits zero
5. Take the 5-minute break, then repeat

**Note:** The timer only auto-logs when it naturally reaches zero. Pausing and resetting does not log a session.

---

### Topic Detail — AI Quiz (AI Tutor Mode)

**Where:** `/topic/:id` → 🧠 AI Quiz tab

**What it does:**
- Generates 5 questions based on your actual session notes for that topic
- Socratic-style open-answer questions (not multiple choice)
- Navigate questions one at a time with a progress bar
- Submit all answers at once for AI grading
- AI grades semantically — partial credit for correct meaning
- Shows score percentage, per-question feedback, and correct answers
- Awards 10 XP per correct answer
- Perfect score (100%) awards the "Perfect Score 💯" badge

**How to use:**
1. Open a topic that has at least one session with notes
2. Click the "🧠 AI Quiz" tab
3. Click "Generate Quiz" — wait 10–30 seconds
4. Answer each question in the text area
5. Navigate with Next/Back buttons
6. Click "Submit Quiz" on the last question
7. Review results and XP earned

**Requires:** AI service running. Works best when you have detailed session notes.

---

### Topic Detail — AI Progress Summary

**Where:** `/topic/:id` → AI Summary tab

**What it does:**
- Sends all your sessions for this topic to the RAG pipeline
- Returns a personalized summary of your progress and suggestions

**How to use:**
1. Open a topic with sessions logged
2. Click "AI Summary" tab
3. Click "Generate Summary"
4. Read the AI analysis

**Requires:** AI service running

---

### Gamification System

**Where:** Dashboard (GamificationHeader), Sidebar (XP bar)

**XP Sources:**
| Action | XP Awarded |
|--------|-----------|
| Daily login | 10 XP |
| Log a study session | 1 XP/min (max 60) |
| Complete a subtask | 5 XP |
| Mark topic as Revised | 50 XP |
| Correct quiz answer | 10 XP |

**Level System:** Level up every 200 XP. Level = `floor(totalXP / 200) + 1`

**Streak System:** Login every consecutive day to increment your streak. Miss a day and it resets to 1.

**Badges:**
| Badge | How to Earn |
|-------|------------|
| ⚡ First Session | Log your first study session |
| 🎯 First Revision | Mark your first topic as Revised |
| 📚 Dedicated Learner | Revise 5 topics |
| 🏆 Knowledge Master | Revise 10 topics |
| 🕐 10 Hour Club | Accumulate 600+ minutes of study |
| 💯 Perfect Score | Score 100% on an AI quiz |

Badges appear in the GamificationHeader on the Dashboard.

---

### Spaced Repetition

**Where:** Dashboard (yellow banner), triggered by marking topics Revised

**What it does:**
- Uses the SM-2 algorithm (same as Anki) to schedule review dates
- When you mark a topic "Revised", the next review date is calculated
- First review: 1 day later
- Second review: 6 days later
- Subsequent reviews: interval × ease factor (starts at 2.5)
- Due topics appear in the yellow banner on the Dashboard

**How to use:**
1. Create a topic and study it
2. Mark it as "Revised" using the status dropdown in TopicDetail
3. The system schedules a review date (visible in the topic detail header)
4. When the review date arrives, the topic appears in the Dashboard banner
5. Study it again and mark Revised again to reschedule

---

### AI Study Planner

**Where:** `/planner`

**What it does:**
- Generate a weekly study schedule from topics, goals, and available hours
- Adjust hours per week with a slider (1–40)
- Save generated plans to your account
- View and expand saved plans
- Delete saved plans

**How to use:**
1. Go to AI Planner from the sidebar
2. Enter topics (comma-separated, e.g. "React, SQL, Algorithms")
3. Enter your learning goal
4. Set weekly hours with the slider
5. Click "Generate Schedule"
6. Click "Save Plan" to persist it
7. Scroll down to "Saved Plans" to view history

**Requires:** AI service running

---

### AI Study Coach (Chat Widget)

**Where:** Floating button, bottom-right corner of every page

**What it does:**
- Persistent AI chat that remembers your conversation history across sessions
- Injects your real learning data as context: topics, sessions, due reviews, streak
- Suggested prompts for new users
- Clear history button to start fresh
- History is stored in MongoDB — survives page refreshes and browser restarts

**How to use:**
1. Click the purple chat bubble (bottom-right)
2. Type a question or click a suggested prompt
3. The AI knows your topics, study time, and what's due for review
4. Close and reopen — history is preserved
5. Click the trash icon in the chat header to clear history

**Suggested prompts that work well:**
- "What should I study next?"
- "Summarize my progress"
- "Which topics need review?"
- "Give me a study tip for [topic name]"

**Requires:** AI service running

---

### Analytics

**Where:** `/analytics`

**What it does:**
- Date range filter: Last 7 days / Last 30 days / All Time
- Stat cards: Total study time, Average session length, Topics revised, XP earned, Top mood
- Weekly activity bar chart (hours by day of week)
- Topic distribution donut chart (minutes per topic)
- 14-day study trend line chart
- AI Weekly Report: personalized analysis of your week

**How to use:**
1. Go to Analytics from the sidebar
2. Use the range buttons to filter data
3. Click "Generate Report" for the AI weekly analysis

**AI Weekly Report requires:** AI service running. The report includes:
- Total study time this week
- Session count
- Current streak
- Topics due for review
- AI narrative with recommendations

---

### Reminders / Alarms

**Where:** Dashboard sidebar (right column)

**What it does:**
- Set datetime alarms with a title and optional message
- Alarms fire as a banner notification at the top of the screen
- Audio notification plays when alarm triggers (browser audio permission required)
- Alarms are checked every 30 seconds while the app is open
- Triggered alarms are marked in the database so they don't re-fire

**How to use:**
1. On the Dashboard, click "+" next to "Active Alarms"
2. Enter a title, optional message, and pick a date/time
3. Click "Set Alarm"
4. Keep the browser tab open — the alarm fires when the time arrives
5. A purple banner slides in from the top with audio
6. Click X to dismiss, or it auto-dismisses after 8 seconds

**Note:** Alarms only fire while the browser tab is open. There are no push notifications.

---

### Workspaces (Collaboration)

**Where:** `/workspaces`

**What it does:**
- Create named workspaces with descriptions
- Invite members by searching their username
- Real-time group chat (Socket.io — messages persist in MongoDB)
- Live presence: see who is currently studying and what topic
- Shared Notes: collaborative markdown editor with auto-save and real-time sync
- Knowledge Hub: shared links, code snippets, and PDF references

**How to use:**

**Create a workspace:**
1. Go to Workspaces → "Create Workspace"
2. Enter name and description

**Invite members:**
1. Enter the workspace → Members tab
2. Search by username in the "Invite Members" panel
3. Click "Add" next to a user

**Chat:**
1. Enter the workspace → Chat tab
2. Type and send messages — they appear for all members in real time

**Shared Notes:**
1. Enter the workspace → Shared Notes tab
2. Write in the editor — auto-saves every 2 seconds
3. Switch between Edit and Preview mode (full Markdown rendering)
4. Other members see your changes in real time

**Knowledge Hub:**
1. Enter the workspace → Knowledge Hub tab
2. Click "Add Resource"
3. Enter title, URL/content, and type (Link/Snippet/PDF)

**Live Presence:**
1. Open a topic that has a `workspaceId` set
2. Click "Study Now" — your name appears in the workspace chat sidebar
3. Other members see "[username] studying [topic]"

---

### Resources / Knowledge Base

**Where:** `/resources`

**What it does:**
- Add text content with a category label (Notes, Formula, Guide, etc.)
- View all resources in a card grid
- Click any card to open a full-screen modal with the content
- Copy content to clipboard
- Resources are stored in the AI service's in-memory store and used as RAG context

**Note:** Resources added here are in-memory only — they are lost when the AI service restarts. For persistent resources, use the Knowledge Hub inside a Workspace.

---

### AI Task Decomposition

**Where:** Dashboard → Topic cards (✨ sparkle button)

**What it does:**
- Sends the topic title and goal to the AI
- Returns 3–5 actionable subtasks
- Subtasks appear on the card with checkboxes
- Checking a subtask awards 5 XP
- Progress counter shows "X/Y" completed

**How to use:**
1. On the Dashboard, click the purple ✨ button on any topic card
2. Wait 5–15 seconds for the AI to generate subtasks
3. Click "View X Sub-tasks" to expand them
4. Click any subtask to toggle it complete/incomplete

**Requires:** AI service running

---

## 5. AI Provider Configuration

### Option A — Local (Ollama, fully offline, free)

1. Install Ollama: https://ollama.com
2. Pull models (already done if you followed setup):
   ```bash
   ollama pull qwen2.5:0.5b
   ollama pull nomic-embed-text
   ```
3. Ollama starts automatically on Windows after install. If needed: `ollama serve`
4. In `ai-service/.env`:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_MODEL=qwen2.5:0.5b
   OLLAMA_EMBED_MODEL=nomic-embed-text
   OLLAMA_BASE_URL=http://localhost:11434
   ```

**Measured response times on i5-12450H + RTX 3050 4GB:**
| Model | Size | Cold start | Warm response | VRAM used |
|-------|------|-----------|---------------|-----------|
| qwen2.5:0.5b ✅ recommended | 397 MB | ~9s | **1–3s** | ~0.8 GB |
| phi3 | 2.2 GB | ~15s | 30–90s | ~2.3 GB |
| llama3.2 | 2.0 GB | ~15s | 20–60s | ~2.1 GB |

`qwen2.5:0.5b` fits entirely in VRAM with room to spare, so every layer runs on GPU. phi3 spills to CPU which is why it was slow.

The AI service warms up the model on startup — after the first 10 seconds, all responses are 1–3 seconds.

### Option B — Google Gemini (cloud, requires API key)

1. Get a free API key: https://aistudio.google.com/app/apikey
2. In `ai-service/.env`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   ```
3. Restart the AI service

Gemini is significantly faster and higher quality than local models. The free tier is sufficient for development.

---

## 6. API Reference

All endpoints are prefixed with `http://localhost:5000`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/auth/search?q=` | Yes | Search users by username |

### Topics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/topics` | Yes | Get all topics for current user |
| GET | `/api/topics/:id` | Yes | Get single topic |
| POST | `/api/topics` | Yes | Create topic |
| PUT | `/api/topics/:id` | Yes | Edit topic |
| DELETE | `/api/topics/:id` | Yes | Delete topic |
| PATCH | `/api/topics/:id/status` | Yes | Update status / subtasks |
| GET | `/api/topics/due-review` | Yes | Get topics due for spaced repetition |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions` | Yes | All sessions for current user |
| GET | `/api/sessions/:topicId` | No | Sessions for a specific topic |
| POST | `/api/sessions` | Yes | Log a session |
| PATCH | `/api/sessions/:id/notes` | Yes | Update session notes |
| DELETE | `/api/sessions/:id` | Yes | Delete session |

### AI
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/chat` | Yes | Chat with AI coach |
| GET | `/api/ai/chat-history` | Yes | Load persisted chat history |
| DELETE | `/api/ai/chat-history` | Yes | Clear chat history |
| POST | `/api/ai/summarize` | Yes | Summarize topic progress |
| POST | `/api/ai/improve-notes` | No | Rewrite session notes |
| POST | `/api/ai/plan` | No | Generate study plan |
| POST | `/api/ai/decompose` | No | Break task into subtasks |
| GET | `/api/ai/weekly-report` | Yes | AI weekly progress report |
| GET | `/api/ai/resources` | No | Get knowledge base items |
| POST | `/api/ai/resources` | No | Add to knowledge base |

### Quiz
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/quiz/generate` | Yes | Generate quiz from topic notes |
| POST | `/api/quiz/submit` | Yes | Submit answers, get graded |
| GET | `/api/quiz/history/:topicId` | Yes | Quiz history for a topic |

### Workspaces
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workspaces` | Yes | Get user's workspaces |
| POST | `/api/workspaces` | Yes | Create workspace |
| POST | `/api/workspaces/:id/members` | Yes | Add member |
| GET | `/api/workspaces/:id/chat` | Yes | Get chat history (last 50) |

### Notes, Resources, Reminders, Plans
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workspaces/:id/notes` | Yes | Get workspace notes |
| POST | `/api/notes` | Yes | Create/update note |
| DELETE | `/api/notes/:id` | Yes | Delete note |
| GET | `/api/workspaces/:id/resources` | Yes | Get workspace resources |
| POST | `/api/resources` | Yes | Add resource |
| DELETE | `/api/resources/:id` | Yes | Delete resource |
| GET | `/api/reminders` | Yes | Get user reminders |
| POST | `/api/reminders` | Yes | Create reminder |
| DELETE | `/api/reminders/:id` | Yes | Delete reminder |
| PATCH | `/api/reminders/:id/trigger` | Yes | Mark reminder triggered |
| GET | `/api/plans` | Yes | Get saved plans |
| POST | `/api/plans` | Yes | Save a plan |
| DELETE | `/api/plans/:id` | Yes | Delete a plan |

---

## 7. Test Suite

Tests use Jest + Supertest + MongoDB Memory Server (no real database needed).

```bash
cd progress-tracker/backend
npm test
```

**29 tests across 5 suites — all passing:**

| Suite | Tests | What it covers |
|-------|-------|---------------|
| `auth.test.js` | 7 | Signup, login, duplicate check, XP on login, token auth |
| `topics.test.js` | 6 | CRUD, user scoping, XP on revision, spaced repetition scheduling |
| `sessions.test.js` | 6 | Create, XP award, study time tracking, delete, validation |
| `gamification.test.js` | 4 | XP sources, subtask XP, badge award, level calculation |
| `reminders.test.js` | 5 | CRUD, trigger marking, user scoping |

---

## 8. Troubleshooting

### "AI Service unavailable" error
- Check that `uvicorn` is running in Terminal 1
- Check http://localhost:8000/health — should return `{"status":"ok"}`
- If using Ollama: check `ollama serve` is running in a separate terminal
- Wait 30 seconds after starting the AI service for the RAG index to build

### "Cannot connect to Ollama" error
- Run `ollama serve` in a terminal
- Verify with: `curl http://localhost:11434/api/tags`
- If the model isn't downloaded: `ollama pull phi3`

### MongoDB connection error
- Check your `MONGODB_URI` in `backend/.env`
- Ensure your IP is whitelisted in MongoDB Atlas (Network Access → Add IP → 0.0.0.0/0 for dev)
- Test the connection string in MongoDB Compass

### Frontend shows blank page or "Loading..."
- Check that the backend is running on port 5000
- Check `frontend/.env.local` has `VITE_API_URL=http://localhost:5000`
- Open browser DevTools → Network tab — look for failed requests

### Topics not showing after login
- This was a known bug (fixed): topics now require auth header
- If you see topics from other users, clear localStorage and log in again

### Quiz generates no questions
- The topic needs at least one session with notes
- The AI service must be running
- Try with a topic that has detailed notes (more context = better questions)

### Reminders not firing
- The browser tab must be open
- Check browser audio permissions (the alarm plays a sound)
- Reminders are checked every 30 seconds — there may be up to a 30-second delay

### Port conflicts
- Backend default: 5000 — change `PORT` in `backend/.env`
- AI service default: 8000 — change `PORT` in `ai-service/.env` and update `AI_SERVICE_URL` in `backend/.env`
- Frontend default: 5173 — Vite auto-increments if busy

---

*Last updated: May 2026*
