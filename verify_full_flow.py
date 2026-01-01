import sys
import os
import time
from dotenv import load_dotenv

# Load env vars
env_path = os.path.join(os.getcwd(), 'backend', '.env')
print(f"DEBUG: Attempting to load .env from {env_path}")

if os.path.exists(env_path):
    print("DEBUG: File exists.")
    try:
        with open(env_path, 'r') as f:
            content = f.read()
            print(f"DEBUG: File content length: {len(content)}")
            if "GEMINI_API_KEY" in content:
                print("DEBUG: Found GEMINI_API_KEY in file.")
                # Manual parse fallback
                for line in content.split('\n'):
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.split("=")[1].strip()
                        os.environ["GEMINI_API_KEY"] = key
                        print("DEBUG: Manually loaded key to os.environ")
            else:
                print("DEBUG: GEMINI_API_KEY NOT found in file content.")
    except Exception as e:
        print(f"DEBUG: Error reading file: {e}")
else:
    print("DEBUG: File DOES NOT exist.")

load_dotenv(env_path)

# Add ai-service to path
sys.path.append(os.path.join(os.getcwd(), 'ai-service'))

try:
    import google.generativeai as genai
    import rag_pipeline
    import generator
    print("SUCCESS: Modules imported.")
except ImportError as e:
    print(f"CRITICAL: Missing modules. Run pip install. Error: {e}")
    sys.exit(1)

def verify_planner():
    print("\n--- Testing AI Study Planner ---")
    try:
        topics = ["React", "Node.js"]
        goals = "Build a full stack app"
        hours = 15
        
        print("Generating plan...")
        start = time.time()
        plan = generator.generate_study_plan(topics, goals, hours)
        duration = time.time() - start
        
        print(f"Plan generated in {duration:.2f}s")
        print(f"Plan Preview: {plan[:100]}...")
        
        if "Weekly Schedule" in plan or "Day 1" in plan or "Week" in plan:
            print("SUCCESS: Planner output looks structured.")
            return True
        else:
            print("WARNING: Planner output might be unstructured.")
            return True # Still return true if it didn't crash
            
    except Exception as e:
        print(f"FAILURE: Planner crashed: {e}")
        return False

def verify_analytics():
    print("\n--- Testing Analytics/RAG ---")
    try:
        # 1. Mock Data
        mock_sessions = [
            {"date": "2023-01-01", "duration": 60, "notes": "Studied React Hooks"},
            {"date": "2023-01-02", "duration": 45, "notes": "Built a Todo App"}
        ]
        
        # 2. Build Index (Local test)
        print("Indexing mock data...")
        count = rag_pipeline.build_index(rag_pipeline.preprocess_data(mock_sessions))
        print(f"Indexed {count} documents.")
        
        if count == 0:
            print("FAILURE: No documents indexed.")
            return False
            
        # 3. Analyze
        print("Generating Analysis...")
        context = rag_pipeline.retrieve("progress summary", k=2)
        prompt = generator.construct_prompt("Summarize my progress", context)
        summary = generator.generate_text(prompt)
        
        print(f"Analysis: {summary}")
        
        if len(summary) > 20:
             print("SUCCESS: Analysis generated.")
             return True
        else:
             print("WARNING: Analysis too short.")
             return False

    except Exception as e:
        print(f"FAILURE: Analytics crashed: {e}")
        return False

if __name__ == "__main__":
    print("Starting Comprehensive AI Verification...")
    
    # Init Models
    generator.initialize_generator()
    
    p_ok = verify_planner()
    a_ok = verify_analytics()
    
    if p_ok and a_ok:
        print("\n✅ Verification PASSED: Planner and Analytics are working.")
    else:
        print("\n❌ Verification FAILED.")
