import requests
import sys
import time

def check_service(name, url):
    print(f"Checking {name} at {url}...", end=" ")
    try:
        if "5000" in url: # Backend root might just return text
            try:
                requests.get(url, timeout=5)
                print("✅ ONLINE")
                return True
            except:
                pass
        
        # Try health endpoints
        if "8000" in url:
            resp = requests.get(f"{url}/health", timeout=5)
            if resp.status_code == 200:
                print(f"✅ ONLINE (Model: {resp.json().get('model')})")
                return True
        elif "5000" in url:
             # Just check if we can connect
             resp = requests.get(url, timeout=5)
             print("✅ ONLINE")
             return True
             
    except Exception as e:
        print(f"❌ OFFLINE ({e})")
        return False
    return False

def test_rag_flow():
    print("\nTesting RAG Flow (Chat)...")
    try:
        payload = {
            "message": "What factors affect student performance?",
            "history": []
        }
        resp = requests.post("http://localhost:5000/api/ai/chat", json=payload, timeout=10)
        if resp.status_code == 200:
            print("✅ RAG Chat Response Received")
            print(f"   Response Preview: {resp.json().get('reply')[:100]}...")
            return True
        else:
            print(f"❌ RAG Chat Failed: {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG Chat Error: {e}")
        return False

def main():
    print("=== NeuroTrack System Verification ===\n")
    
    frontend = check_service("Frontend", "http://localhost:5173")
    backend = check_service("Backend", "http://localhost:5000")
    ai = check_service("AI Service", "http://localhost:8000")
    
    if backend and ai:
        test_rag_flow()
    else:
        print("\nSkipping RAG Flow test because services are offline.")

if __name__ == "__main__":
    main()
