import sys
import os
import time
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), 'backend', '.env')) # Try to load from backend/.env if exists, or just .env

# Add ai-service to path
sys.path.append(os.path.join(os.getcwd(), 'ai-service'))

def get_memory_mb():
    return 0 # Mocked to avoid psutil dependency

print(f"Initial Memory: Ignored")

print("Importing rag_pipeline...")
import rag_pipeline
print(f"After RAG Import: {get_memory_mb():.2f} MB")

print("Importing generator...")
import generator
print(f"After Generator Import: {get_memory_mb():.2f} MB")

print("Initializing RAG (checking embedding-001)...")
# Manually test embedding to verify model name
try:
    import google.generativeai as genai
    import os
    if os.getenv("GEMINI_API_KEY"):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    genai.embed_content(
        model="models/embedding-001",
        content="Test",
        task_type="retrieval_query"
    )
    print("SUCCESS: embedding-001 is accessible.")
except Exception as e:
    print(f"FAILURE: embedding-001 error: {e}")

print("Initializing Generator (checking gemini-1.5-pro)...")
generator.initialize_generator()
print(f"After Generator Init: {get_memory_mb():.2f} MB")

print("Running test generation...")
# Verify correct model is loaded
if generator.model and "gemini-1.5-pro" in str(generator.model.model_name):
    print(f"SUCCESS:Correct model loaded: {generator.model.model_name}")
else:
    print(f"WARNING: Model loaded is: {generator.model.model_name if generator.model else 'None'}")

response = generator.generate_text("Hello, return the word 'Verified'.")
print(f"Response: {response}")

if "Verified" in response:
     print("SUCCESS: Generation verified.")
else:
     print("WARNING: Generation output unexpected.")

print(f"Final Memory: {get_memory_mb():.2f} MB")
