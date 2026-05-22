from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

import rag_pipeline
import generator

app = FastAPI(title="HyperActive AI Service")

# Pydantic Models
class SessionData(BaseModel):
    date: str
    duration: int
    notes: str
    topicId: Optional[str] = None

class TopicData(BaseModel):
    title: str
    category: str
    status: str
    goal: Optional[str] = None

class AnalyzeRequest(BaseModel):
    topics: List[TopicData]
    sessions: List[SessionData]
    query: Optional[str] = "Summarize my progress and suggest improvements."

class ImproveNotesRequest(BaseModel):
    notes: str
    topic: str = None

class StudyPlanRequest(BaseModel):
    topics: List[str]
    goals: str
    hours_per_week: int

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    notes: Optional[List[dict]] = []
    resources: Optional[List[dict]] = []
    user_context: Optional[str] = ""

class DecomposeRequest(BaseModel):
    task: str
    context: Optional[str] = ""

import threading

def run_async_init():
    try:
        print("Starting background initialization of RAG index...")
        docs = rag_pipeline.preprocess_data([])
        rag_pipeline.build_index(docs)
        print("Background initialization complete.")
        # Warm up the model — send a dummy request so first real call is instant
        print("Warming up model...")
        generator.call_ai("Hello")
        print(f"Model warm. Provider: {generator.get_provider()}, Model: {os.getenv('OLLAMA_MODEL', 'qwen2.5:0.5b')}")
    except Exception as e:
        print(f"Startup Error: {e}")

@app.on_event("startup")
async def startup_event():
    # Load data on startup in a separate thread to avoid blocking the event loop
    # This ensures the server binds to the port immediately and passes health checks
    threading.Thread(target=run_async_init, daemon=True).start()

@app.post("/rag/chat")
async def chat_endpoint(request: ChatRequest):
    # 1. Retrieve relevant context
    context_docs = rag_pipeline.retrieve(request.message, k=2)
    context_text = "\n".join(context_docs)

    # 2. Append user_context (coach memory) if provided
    if request.user_context:
        context_text = request.user_context + "\n\n" + context_text

    # 3. Generate response with history
    response = generator.generate_chat_response(
        request.message,
        request.history,
        context_text
    )

    final_response = response.split("Assistant:")[-1].strip()
    return {"reply": final_response}

# Removed duplicate /rag/study-plan logic
# ...

@app.post("/rag/analyze")
async def analyze_progress(request: AnalyzeRequest):
    combined_data = [t.dict() for t in request.topics] + [s.dict() for s in request.sessions]
    doc_count = rag_pipeline.build_index(combined_data)

    if doc_count == 0:
        return {"summary": "No data yet. Start logging study sessions!"}

    context = rag_pipeline.retrieve("progress summary", k=3)
    prompt = f"""Summarize this student's learning progress briefly.
Context: {chr(10).join(context[:2])}
Question: {request.query}
Answer in 3-4 sentences:"""

    response_text = generator.call_ai(prompt)
    return {"summary": response_text, "context_used": context}

@app.post("/rag/improve-notes")
async def improve_notes(request: ImproveNotesRequest):
    prompt = f"""Rewrite these study notes to be clearer and better structured. Be concise.
Notes: {request.notes[:600]}
Improved notes:"""
    response_text = generator.call_ai(prompt)
    return {"improvedNotes": response_text}

@app.post("/rag/plan")
async def generate_study_plan(request: StudyPlanRequest):
    plan = generator.generate_study_plan(
        request.topics, 
        request.goals, 
        request.hours_per_week
    )
    # Clean up prompt echo if present
    final_plan = plan.split("Weekly Schedule:")[-1].strip() if "Weekly Schedule:" in plan else plan
    
    return {"plan": final_plan}

@app.post("/rag/decompose")
async def decompose_task(request: DecomposeRequest):
    sub_tasks = generator.generate_subtasks(request.task, request.context)
    # Expected format: JSON list of strings from generator
    return {"subTasks": sub_tasks}

class QuizRequest(BaseModel):
    topic: str
    notes: str
    difficulty: Optional[str] = "Medium"

class GradeRequest(BaseModel):
    questions: List[dict]  # [{ question, userAnswer, correctAnswer }]

class ResourceRequest(BaseModel):
    category: str
    content: str

@app.post("/rag/quiz")
async def generate_quiz(request: QuizRequest):
    """Generate 5 quiz questions from topic notes."""
    notes_snippet = request.notes[:1000] if request.notes else f"General knowledge about {request.topic}"
    prompt = f"""Generate 5 quiz questions about: {request.topic} ({request.difficulty})
Notes: {notes_snippet}

Return ONLY a JSON array, no other text:
[{{"question":"...","correctAnswer":"...","hint":"..."}}]"""

    response = generator.call_ai(prompt)
    try:
        import re, json
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            questions = json.loads(match.group())
            if isinstance(questions, list) and len(questions) > 0:
                return {"questions": questions}
    except Exception:
        pass
    return {"questions": [], "error": "Could not parse questions. Try again or add more session notes."}

@app.post("/rag/grade")
async def grade_quiz(request: GradeRequest):
    """Grade answers using AI semantic matching."""
    graded = []
    for q in request.questions:
        prompt = f"""Grade this answer. Reply ONLY with JSON.
Q: {q.get('question','')}
Correct: {q.get('correctAnswer','')}
User: {q.get('userAnswer','')}
JSON: {{"isCorrect":true/false,"feedback":"one sentence"}}"""

        response = generator.call_ai(prompt)
        try:
            import re, json
            match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
            result = json.loads(match.group()) if match else {"isCorrect": False, "feedback": "Could not grade."}
        except Exception:
            result = {"isCorrect": False, "feedback": "Could not grade."}

        graded.append({
            "question": q.get("question"),
            "userAnswer": q.get("userAnswer"),
            "correctAnswer": q.get("correctAnswer"),
            "isCorrect": bool(result.get("isCorrect", False)),
            "feedback": result.get("feedback", "")
        })
    return {"graded": graded}

@app.post("/rag/knowledge")
async def add_knowledge(request: ResourceRequest):
    """
    Allow users to add new resources to the knowledge base.
    """
    try:
        # Prepend to documents so it's fresh
        doc_text = f"User Resource ({request.category}): {request.content}"
        rag_pipeline.documents.insert(0, doc_text)
        
        # Re-index (incremental would be better, but for small RAM, full rebuild is safer/simpler)
        # Note: In a real DB, we'd save this. Here it's in-memory for the session.
        # Ideally, backend saves it to MongoDB, then we fetch it.
        # But for this endpoint, we just add to runtime.
        # Ideally, we should trigger a background re-index.
        
        return {"status": "added", "count": len(rag_pipeline.documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/knowledge")
def get_knowledge_base():
    """
    Return all loaded documents for the Resources page.
    """
    docs = []
    
    # 1. Static Files (formatted nicely)
    # We loaded them as raw chunks in rag_pipeline. 
    # Let's try to detect if they are markdown sections.
    
    for d in rag_pipeline.documents:
        # User/System formatted strings
        if "User Resource (" in d:
            parts = d.split("): ", 1)
            cat = parts[0].replace("User Resource (", "")
            content = parts[1] if len(parts) > 1 else d
            docs.append({"category": cat, "content": content})
            
        elif "# " in d and "**" in d: # Simple MD detection
             # Guess category from first line
             lines = d.split('\n')
             cat_line = lines[0].replace("#", "").strip()
             content = "\n".join(lines[1:]).strip()
             docs.append({"category": "Guide", "title": cat_line, "content": content})
             
        elif "General Knowledge (" in d:
            parts = d.split("): ", 1)
            cat = parts[0].replace("General Knowledge (", "")
            docs.append({"category": cat, "content": parts[1]})
            
        elif "Session on" not in d and "Topic:" not in d: # Exclude raw user data
             # Check if it's one of our markdown files
             docs.append({"category": "Study Material", "content": d})
             
    return docs

@app.get("/health")
def health_check():
    return {"status": "ok", "model": generator.GENERATOR_MODEL_NAME}

@app.get("/debug")
def debug_info():
    """Debug endpoint to check configuration and connectivity"""
    return {
        "status": "ok",
        "provider": generator.get_provider(),
        "model": os.getenv('OLLAMA_MODEL', 'qwen2.5:0.5b') if generator.get_provider() == 'ollama' else 'gemini-1.5-flash',
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
        "ai_provider_env": os.getenv("AI_PROVIDER", "not-set"),
        "ollama_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "timestamp": str(datetime.now())
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
