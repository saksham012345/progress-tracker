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

@app.on_event("startup")
async def startup_event():
    # Load data on startup
    # In a real app, this might be async or offloaded
    try:
        # Preprocess data loads custom data from ai-service/data internally
        docs = rag_pipeline.preprocess_data([]) 
        rag_pipeline.build_index(docs)
    except Exception as e:
        print(f"Startup Error: {e}")

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

@app.post("/rag/study-plan")
async def generate_study_plan(request: StudyPlanRequest):
    # This is a placeholder for the study plan generation logic.
    # It would typically involve using the RAG pipeline or a generator
    # to create a personalized study plan based on the provided topics, goals,
    # and available study time.

    # Example prompt construction:
    prompt = f"""
    Generate a personalized study plan based on the following information:
    Topics to cover: {', '.join(request.topics)}
    Goals: {request.goals}
    Available study hours per week: {request.hours_per_week}

    Please provide a structured study plan, including suggested resources or activities.
    """
    
    # For now, we'll just return a mock response or use the generator directly
    # In a real scenario, you might retrieve relevant documents first.
    response_text = generator.generate_text(prompt, max_length=500)
    final_response = response_text.replace(prompt, "").strip()

    return {"studyPlan": final_response}

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

@app.get("/rag/knowledge")
def get_knowledge_base():
    """
    Return all loaded documents for the Resources page.
    """
    # In a real app with Faiss, we can't easily "list" everything back from the index alone if we didn't store metadata.
    # But we have `rag_pipeline.documents` which stores the raw text.
    
    # Simple parsing to try and reconstruct category/content if possible, 
    # or just return the raw strings.
    
    docs = []
    for d in rag_pipeline.documents:
        # We formatted them as "General Knowledge (Category): Content"
        # Let's try to parse that back for UI
        if "General Knowledge (" in d:
            parts = d.split("): ", 1)
            if len(parts) == 2:
                cat = parts[0].replace("General Knowledge (", "")
                content = parts[1]
                docs.append({"category": cat, "content": content})
            else:
                docs.append({"category": "General", "content": d})
        elif "Session on" not in d and "Topic:" not in d: # Exclude user data
             docs.append({"category": "Custom Data", "content": d})
             
    return docs

@app.get("/health")
def health_check():
    return {"status": "ok", "model": generator.GENERATOR_MODEL_NAME}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
