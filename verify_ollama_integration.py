"""
HyperActive - Comprehensive Ollama Integration Verification
Tests all AI endpoints through the FastAPI service to verify Ollama is working correctly.
"""

import requests
import json
import time
import sys
import io

# Fix Windows terminal encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

AI_SERVICE_URL = "http://127.0.0.1:8000"
OLLAMA_URL = "http://localhost:11434"

# ─── ANSI Colors ───
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

results = []

def header(text):
    print(f"\n{BOLD}{CYAN}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{RESET}\n")

def test(name, passed, detail=""):
    status = f"{GREEN}[PASS]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
    print(f"  {status}  {name}")
    if detail:
        # Truncate long details
        preview = detail[:150].replace('\n', ' ')
        print(f"         {YELLOW}-> {preview}{'...' if len(detail) > 150 else ''}{RESET}")
    results.append((name, passed))

# ═══════════════════════════════════════════════════════════
# PHASE 1: Infrastructure Checks
# ═══════════════════════════════════════════════════════════
header("PHASE 1: Infrastructure Checks")

# Test 1: Ollama Service
print(f"  Checking Ollama service at {OLLAMA_URL}...")
try:
    r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
    models = [m['name'] for m in r.json().get('models', [])]
    test("Ollama is running", r.status_code == 200, f"Models available: {', '.join(models)}")
except Exception as e:
    test("Ollama is running", False, str(e))
    print(f"\nFATAL: Ollama is not running. Start it first.")
    sys.exit(1)

# Test 2: phi3 model available
test("phi3 model available", any("phi3" in m for m in models))

# Test 3: nomic-embed-text model available
test("nomic-embed-text model available", any("nomic-embed-text" in m for m in models))

# Test 4: AI FastAPI service health
print(f"\n  Checking AI FastAPI service at {AI_SERVICE_URL}...")
try:
    r = requests.get(f"{AI_SERVICE_URL}/health", timeout=5)
    data = r.json()
    test("AI FastAPI service is healthy", r.status_code == 200, f"Status: {data}")
except Exception as e:
    test("AI FastAPI service is healthy", False, str(e))
    print(f"\n{YELLOW}[!] AI Service not running. Starting it is required for API-level tests.")
    print(f"  Run: cd ai-service && python main.py{RESET}")
    print(f"\n  Falling back to DIRECT Ollama tests only...\n")

# ═══════════════════════════════════════════════════════════
# PHASE 2: Direct Ollama Model Tests
# ═══════════════════════════════════════════════════════════
header("PHASE 2: Direct Ollama Model Tests")

# Test 5: phi3 text generation
print("  Testing phi3 text generation (may take 10-30s)...")
try:
    start = time.time()
    r = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": "phi3",
        "prompt": "What is 2 + 2? Reply with just the number.",
        "stream": False
    }, timeout=120)
    duration = time.time() - start
    response_text = r.json().get('response', '')
    test(f"phi3 generates text ({duration:.1f}s)", 
         r.status_code == 200 and len(response_text) > 0,
         response_text)
except Exception as e:
    test("phi3 generates text", False, str(e))

# Test 6: nomic-embed-text embeddings
print("  Testing nomic-embed-text embeddings...")
try:
    r = requests.post(f"{OLLAMA_URL}/api/embeddings", json={
        "model": "nomic-embed-text",
        "prompt": "Machine learning is a subset of artificial intelligence"
    }, timeout=30)
    embedding = r.json().get('embedding', [])
    test(f"nomic-embed-text generates embeddings", 
         r.status_code == 200 and len(embedding) > 100,
         f"Embedding dimension: {len(embedding)}")
except Exception as e:
    test("nomic-embed-text generates embeddings", False, str(e))

# ═══════════════════════════════════════════════════════════
# PHASE 3: AI Service API Endpoint Tests
# ═══════════════════════════════════════════════════════════
header("PHASE 3: AI Service API Endpoint Tests (via FastAPI)")

service_available = False
try:
    requests.get(f"{AI_SERVICE_URL}/health", timeout=3)
    service_available = True
except:
    pass

if not service_available:
    print(f"  {YELLOW}[!] Skipping API tests - AI Service not running.{RESET}")
else:
    # Test 7: Chat endpoint
    print("  Testing /rag/chat endpoint...")
    try:
        start = time.time()
        r = requests.post(f"{AI_SERVICE_URL}/rag/chat", json={
            "message": "What are some effective study techniques?",
            "history": []
        }, timeout=120)
        duration = time.time() - start
        data = r.json()
        reply = data.get('reply', '')
        test(f"/rag/chat endpoint ({duration:.1f}s)", 
             r.status_code == 200 and len(reply) > 20,
             reply)
    except Exception as e:
        test("/rag/chat endpoint", False, str(e))

    # Test 8: Chat greeting bypass
    print("  Testing /rag/chat greeting bypass...")
    try:
        r = requests.post(f"{AI_SERVICE_URL}/rag/chat", json={
            "message": "hello",
            "history": []
        }, timeout=10)
        data = r.json()
        reply = data.get('reply', '')
        test("/rag/chat greeting bypass", 
             "HyperActive" in reply,
             reply)
    except Exception as e:
        test("/rag/chat greeting bypass", False, str(e))

    # Test 9: Task decomposition
    print("  Testing /rag/decompose endpoint...")
    try:
        start = time.time()
        r = requests.post(f"{AI_SERVICE_URL}/rag/decompose", json={
            "task": "Learn Python web development with Flask",
            "context": "Beginner programmer"
        }, timeout=120)
        duration = time.time() - start
        data = r.json()
        sub_tasks = data.get('subTasks', [])
        test(f"/rag/decompose endpoint ({duration:.1f}s)", 
             r.status_code == 200 and len(sub_tasks) >= 2,
             f"Got {len(sub_tasks)} sub-tasks: {sub_tasks[:3]}")
    except Exception as e:
        test("/rag/decompose endpoint", False, str(e))

    # Test 10: Study plan generation
    print("  Testing /rag/plan endpoint...")
    try:
        start = time.time()
        r = requests.post(f"{AI_SERVICE_URL}/rag/plan", json={
            "topics": ["React", "Node.js", "MongoDB"],
            "goals": "Build a full-stack web application",
            "hours_per_week": 10
        }, timeout=120)
        duration = time.time() - start
        data = r.json()
        plan = data.get('plan', '')
        test(f"/rag/plan endpoint ({duration:.1f}s)", 
             r.status_code == 200 and len(plan) > 30,
             plan)
    except Exception as e:
        test("/rag/plan endpoint", False, str(e))

    # Test 11: Analyze progress (RAG pipeline full test)
    print("  Testing /rag/analyze endpoint (full RAG pipeline)...")
    try:
        start = time.time()
        r = requests.post(f"{AI_SERVICE_URL}/rag/analyze", json={
            "topics": [
                {"title": "React Hooks", "category": "Frontend", "status": "in-progress", "goal": "Master useState and useEffect"},
                {"title": "Express.js", "category": "Backend", "status": "completed", "goal": "Build REST APIs"}
            ],
            "sessions": [
                {"date": "2026-04-18", "duration": 60, "notes": "Studied React Hooks deeply"},
                {"date": "2026-04-19", "duration": 45, "notes": "Built a REST API with Express"}
            ],
            "query": "How is my learning progress?"
        }, timeout=120)
        duration = time.time() - start
        data = r.json()
        summary = data.get('summary', '')
        context_used = data.get('context_used', [])
        test(f"/rag/analyze endpoint ({duration:.1f}s)", 
             r.status_code == 200 and len(summary) > 10,
             f"Summary: {summary}")
        test("RAG context retrieval works", 
             len(context_used) > 0,
             f"Retrieved {len(context_used)} context docs")
    except Exception as e:
        test("/rag/analyze endpoint", False, str(e))

    # Test 12: Improve notes
    print("  Testing /rag/improve-notes endpoint...")
    try:
        start = time.time()
        r = requests.post(f"{AI_SERVICE_URL}/rag/improve-notes", json={
            "notes": "react hooks r cool. usestate for state. useeffect for side effects. dont forget cleanup func",
            "topic": "React Hooks"
        }, timeout=120)
        duration = time.time() - start
        data = r.json()
        improved = data.get('improvedNotes', '')
        test(f"/rag/improve-notes endpoint ({duration:.1f}s)", 
             r.status_code == 200 and len(improved) > 20,
             improved)
    except Exception as e:
        test("/rag/improve-notes endpoint", False, str(e))

    # Test 13: Knowledge base
    print("  Testing /rag/knowledge GET endpoint...")
    try:
        r = requests.get(f"{AI_SERVICE_URL}/rag/knowledge", timeout=10)
        data = r.json()
        test("/rag/knowledge GET endpoint", 
             r.status_code == 200 and isinstance(data, list),
             f"Knowledge base has {len(data)} items")
    except Exception as e:
        test("/rag/knowledge GET endpoint", False, str(e))

# ═══════════════════════════════════════════════════════════
# RESULTS SUMMARY
# ═══════════════════════════════════════════════════════════
header("VERIFICATION RESULTS SUMMARY")

passed = sum(1 for _, p in results if p)
failed = sum(1 for _, p in results if not p)
total = len(results)

for name, p in results:
    icon = f"{GREEN}[PASS]{RESET}" if p else f"{RED}[FAIL]{RESET}"
    print(f"  {icon}  {name}")

print(f"\n  {BOLD}Total: {total}  |  Passed: {GREEN}{passed}{RESET}  |  Failed: {RED}{failed}{RESET}")

if failed == 0:
    print(f"\n  {GREEN}{BOLD}*** ALL TESTS PASSED! Ollama integration is fully working. ***{RESET}")
else:
    print(f"\n  {YELLOW}{BOLD}[!] Some tests failed. Review the output above.{RESET}")
