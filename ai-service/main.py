from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import rag_pipeline
import generator

app = FastAPI(title="NeuroTrack AI Service")

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
    topics: list[str]
    goals: str
    hours_per_week: int

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

import threading

def run_async_init():
    try:
        print("Starting background initialization of RAG index...")
        # Preprocess data loads custom data from ai-service/data internally
        docs = rag_pipeline.preprocess_data([]) 
        rag_pipeline.build_index(docs)
        print("Background initialization complete.")
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
    
    # 2. Generate response with history
    response = generator.generate_chat_response(
        request.message, 
        request.history, 
        context_text
    )
    
    # Clean up output
    final_response = response.split("Assistant:")[-1].strip()
    
    return {"reply": final_response}

# Removed duplicate /rag/study-plan logic
# ...

@app.post("/rag/analyze")
async def analyze_progress(request: AnalyzeRequest):
    # 1. Build Index from current data (In a real app, this would be incremental or persisted)
    # Combining topics and sessions for context
    combined_data = [t.dict() for t in request.topics] + [s.dict() for s in request.sessions]
    doc_count = rag_pipeline.build_index(combined_data)
    
    if doc_count == 0:
        return {"summary": "No data available to analyze. Start learning!"}
    
    # 2. Retrieve relevant context
    # For a summary, we might want generic high-level context, or just recent ones.
    # Simple strategy: retrieve top 5 most relevant to "progress summary"
    context = rag_pipeline.retrieve("progress summary learning", k=5)
    
    # 3. Generate Response
    prompt = generator.construct_prompt(request.query, context)
    # Limit max length for summary
    response_text = generator.generate_text(prompt, max_length=200)
    
    # Clean up response (simple post-processing to remove prompt if echo'd)
    # GPT-2 style models often echo.
    final_response = response_text.replace(prompt, "").strip()
    
    return {"summary": final_response, "context_used": context}

@app.post("/rag/improve-notes")
async def improve_notes(request: ImproveNotesRequest):
    # For improving notes, we might not need the index if it's just rewriting.
    # But RAG could help if we indexed textbook material.
    # Here, we'll just use the LLM to rewrite.
    
    prompt = f"""
    Rewrite these notes to be clear and structured:
    {request.notes}
    
    Improved Notes:
    """
    
    response_text = generator.generate_text(prompt, max_length=200)
    final_response = response_text.replace(prompt, "").strip()
    
    return {"improvedNotes": final_response}

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

class ResourceRequest(BaseModel):
    category: str
    content: str

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
