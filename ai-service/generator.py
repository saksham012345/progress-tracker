import os
import requests
import json
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GENERATOR_MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")

# ── Provider selection ────────────────────────────────────────────────────────
def get_provider():
    """
    Determine which AI provider to use.
    Priority: Environment variable > GEMINI_API_KEY presence > Ollama availability > default ollama
    """
    env_provider = os.getenv("AI_PROVIDER", "").lower()
    
    # Explicit provider set
    if env_provider in ["gemini", "ollama"]:
        print(f"Using provider from AI_PROVIDER env var: {env_provider}")
        return env_provider
    
    # Auto-detect based on available API keys
    if os.getenv("GEMINI_API_KEY"):
        print("Auto-detected Gemini API key, using Gemini provider")
        return "gemini"
    
    print("No API key found, defaulting to Ollama (local)")
    return "ollama"

def initialize_generator():
    provider = get_provider()
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b") if provider == "ollama" else "gemini-1.5-flash"
    print(f"Generator: provider={provider}, model={model}")

# ── Ollama call ───────────────────────────────────────────────────────────────
def call_ollama(prompt, model=None):
    if model is None:
        model = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    try:
        health = requests.get(f"{base_url}/api/tags", timeout=3)
        if health.status_code != 200:
            return "Error: Ollama not responding."
    except Exception:
        return "Error: Cannot connect to Ollama. Run 'ollama serve'."

    try:
        response = requests.post(f"{base_url}/api/generate", json={
            "model": model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "30m",   # keep model in VRAM for 30 min between requests
            "options": {
                "num_predict": 512,
                "temperature": 0.7,
                "top_p": 0.9
            }
        }, timeout=180)

        if response.status_code == 200:
            return response.json().get("response", "").strip()
        else:
            logger.error(f"Ollama error {response.status_code}: {response.text[:200]}")
            return f"Error: Ollama returned {response.status_code}. Is model '{model}' downloaded?"
    except requests.exceptions.Timeout:
        return "Error: Ollama timed out. The model may be loading — try again in 10 seconds."
    except Exception as e:
        logger.error(f"Ollama exception: {e}")
        return "Error: Could not connect to Ollama."

# ── Gemini call ───────────────────────────────────────────────────────────────
def call_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not set."
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
    try:
        response = requests.post(url, params={"key": api_key},
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30)
        if response.status_code == 200:
            return response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        logger.error(f"Gemini error {response.status_code}: {response.text[:200]}")
        return f"Error: Gemini returned {response.status_code}"
    except Exception as e:
        return f"Error: {e}"

# ── Unified call ──────────────────────────────────────────────────────────────
def call_ai(prompt):
    if get_provider() == "gemini":
        return call_gemini(prompt)
    return call_ollama(prompt)

# ── Feature functions ─────────────────────────────────────────────────────────
def generate_chat_response(message, history, context=""):
    greetings = {"hi", "hello", "hey", "greetings", "good morning", "sup"}
    if message.lower().strip() in greetings:
        return "Hello! I'm your AI Study Coach. Ask me about your topics, progress, or study tips."

    # Keep context short for small models
    ctx_snippet = context[:800] if context else ""
    history_snippet = ""
    if history:
        recent = history[-4:]  # last 2 exchanges
        history_snippet = "\n".join(f"{m['role'].capitalize()}: {m['content'][:200]}" for m in recent)

    prompt = f"""You are a helpful study coach. Answer briefly and directly.

Context: {ctx_snippet}
{f'Recent chat:{chr(10)}{history_snippet}' if history_snippet else ''}

User: {message}
Answer:"""
    return call_ai(prompt)


def generate_study_plan(topics, goals, hours_per_week):
    prompt = f"""Create a weekly study schedule.
Topics: {', '.join(topics)}
Goal: {goals}
Hours/week: {hours_per_week}

Write a clear day-by-day plan. Be concise."""
    return call_ai(prompt)


def generate_subtasks(task, context=""):
    prompt = f"""Break this learning task into 4 short actionable steps.
Task: {task}
{f'Context: {context}' if context else ''}

Return ONLY a JSON array of strings, no other text.
Example: ["Step 1", "Step 2", "Step 3", "Step 4"]"""

    response = call_ai(prompt)
    try:
        match = re.search(r'\[.*?\]', response, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    # Fallback: split lines
    lines = [l.strip().lstrip('-•123456789. ') for l in response.split('\n') if l.strip()]
    return [l for l in lines if l][:5]


def generate_text(prompt, max_length=300):
    return call_ai(prompt)


def construct_prompt(query, context_docs):
    context_str = "\n".join(context_docs[:3])  # limit context
    return f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer briefly:"
