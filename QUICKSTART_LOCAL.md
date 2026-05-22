# QUICK START - LOCAL AI SERVICE

## ✅ Configuration Done
- Backend `.env` → `AI_SERVICE_URL=http://localhost:8000` ✓
- AI Service `.env` → `AI_PROVIDER=ollama` ✓

## 🚀 START IN ORDER (5 TERMINALS)

### Terminal 1: Ollama Server
```powershell
ollama serve
```
Then in any terminal (one-time):
```powershell
ollama pull qwen2.5:0.5b
```

### Terminal 2: AI Service (Python)
```powershell
cd ai-service
pip install -r requirements.txt
python main.py
```
✓ Will be at: http://localhost:8000

### Terminal 3: Backend (Node.js)
```powershell
cd backend
npm install
npm start
```
✓ Will be at: http://localhost:5000

### Terminal 4: Frontend (React)
```powershell
cd frontend
npm install
npm run dev
```
✓ Will be at: http://localhost:5173

### Terminal 5: Monitor (Optional - check health)
```powershell
# Test AI Service
curl http://localhost:8000/health

# Test Backend + All Services
curl http://localhost:5000/api/health/detailed
```

---

## 📍 MAIN ROUTES AT A GLANCE

### Authentication
- `POST /api/auth/login` → Sign in
- `POST /api/auth/signup` → Create account

### Study Planning
- `POST /api/ai/plan` → Generate study schedule (Study Planner page)
- `GET /api/plans` → List saved plans
- `POST /api/plans` → Save generated plan

### Learning
- `GET /api/topics` → Your study topics
- `POST /api/topics` → Create topic
- `POST /api/sessions` → Log study session
- `GET /api/sessions` → View sessions

### AI Features
- `POST /api/ai/chat` → Chat with AI coach
- `POST /api/ai/summarize` → Get progress summary
- `GET /api/ai/weekly-report` → Weekly performance
- `POST /api/quiz/generate` → AI-generated quiz

### Collaboration
- `GET /api/workspaces` → Your shared workspaces
- `POST /api/workspaces` → Create workspace
- `POST /api/workspaces/:id/invite` → Invite members
- `GET /api/workspaces/:id/chat` → Workspace chat

### Notes & Resources
- `GET /api/workspaces/:workspaceId/notes` → Shared notes
- `GET /api/resources` → Learning resources
- `GET /api/reminders` → Upcoming reminders

---

## ✅ VERIFY EVERYTHING WORKS

1. **Open browser**: http://localhost:5173
2. **Sign up / Login**
3. **Go to Study Planner** page
4. **Enter**: 
   - Topics: `JavaScript, React`
   - Goals: `Learn web development`
   - Hours: `10`
5. **Click "Generate Schedule"**
6. **Should see a weekly study plan** ✅

If you see an error, check:
- [ ] Ollama running? (`ollama serve` showing model loaded)
- [ ] AI Service running? (http://localhost:8000/health)
- [ ] Backend running? (http://localhost:5000/api/health)
- [ ] Frontend running? (http://localhost:5173)

---

## 📊 COMPONENT LOCATIONS

| Feature | File | Port |
|---------|------|------|
| **Frontend** | `frontend/src/pages/StudyPlanner.jsx` | 5173 |
| **Backend** | `backend/server.js` | 5000 |
| **AI Service** | `ai-service/main.py` | 8000 |
| **Database** | MongoDB Cloud (remote) | - |

---

## 🐛 TROUBLESHOOTING

### "Failed to generate plan" or 504 errors
- Ollama not running? Start it: `ollama serve`
- AI Service not responding? Check: `curl http://localhost:8000/health`

### "Cannot connect to database"
- MongoDB URI in backend/.env should work (cloud database)
- Check your internet connection

### Model too slow?
- `qwen2.5:0.5b` is a small model (~400MB)
- For faster responses, try: `ollama pull phi`
- Update `OLLAMA_MODEL` in `ai-service/.env`

### Port already in use?
- Backend: Change `PORT=5000` in `backend/.env`
- AI Service: Change `PORT=8000` in `ai-service/.env`
- Frontend: `npm run dev` will suggest next port

---

## 📝 WHAT TO TEST NEXT

1. ✅ Study Planner → Generate schedule
2. ✅ Chat Widget → Talk to AI coach
3. ✅ Dashboard → Create topic
4. ✅ Quiz Generation → Test AI tutor
5. ✅ Workspace → Invite a friend
