# NeuroTrack - Learning Progress Tracker

Manage your learning journey with AI-powered insights. Track topics, log sessions, and get feedback on your notes.

## Tech Stack
- **Frontend**: React, Vite, Framer Motion
- **Backend**: Node.js, Express, MongoDB
- **AI**: Groq API (Llama 3)
- **Styling**: Modern CSS Variables & Modules

## Features
- **Dashboard**: Visual overview of learning topics.
- **Session Logging**: Track time and regular notes.
- **AI Summary**: Get concise summaries of your progress.
- **AI Note Improvement**: One-click refactoring of your rough study notes.
- **Animations**: Smooth page transitions and micro-interactions.

## Setup Instructions

### 1. AI Service (Python)
**Required for AI features.**
```bash
cd ai-service
# First time setup
pip install -r requirements.txt
# Run the service
python main.py
```
The service runs on `http://localhost:8000`.

### 2. Backend (Node/Express)
```bash
cd backend
npm install
# Ensure MongoDB is running
node server.js
```
The backend runs on `http://localhost:5000` and proxies AI requests to the Python service.

### 3. Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

## AI Integration - Local RAG
This project uses a **Local RAG** system.
- **Model**: `distilgpt2` (Generation), `all-MiniLM-L6-v2` (Embeddings)
- **Vector Store**: FAISS
- **No API Keys Required**. All inference runs locally on your machine.
