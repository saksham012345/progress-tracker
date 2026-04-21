import os
import google.generativeai as genai

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

GENERATOR_MODEL_NAME = "gemini-1.5-flash"
import requests
import json
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GENERATOR_MODEL_NAME = "gemini-1.5-flash"
API_KEY = os.getenv("GEMINI_API_KEY")

def initialize_generator():
    provider = get_provider()
    if provider == "gemini":
        print(f"Generator configured for Google Gemini using model: {GENERATOR_MODEL_NAME}")
    else:
        print(f"Generator configured for Local Ollama using model: {os.getenv('OLLAMA_MODEL', 'llama3')}")

def get_provider():
    if os.getenv("AI_PROVIDER") == "ollama":
        return "ollama"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    return "ollama" # Default fallback if key is missing

def call_ollama(prompt, model=None):
    if model is None:
        model = os.getenv("OLLAMA_MODEL", "llama3")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Quick connectivity check (2s) to avoid hanging for 120s
    try:
        health = requests.get(f"{base_url}/api/tags", timeout=2)
        if health.status_code != 200:
            return "Error: Ollama service returned an unexpected status. Please check if Ollama is running."
    except requests.exceptions.ConnectionError:
        return "Error: Cannot connect to Ollama at " + base_url + ". Please start Ollama first (run 'ollama serve')."
    except requests.exceptions.Timeout:
        return "Error: Ollama service is not responding. Please make sure Ollama is running."
    
    url = f"{base_url}/api/generate"
    try:
        response = requests.post(url, json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }, timeout=120)
        
        if response.status_code == 200:
            return response.json().get('response', '')
        else:
            logger.error(f"Ollama Error: {response.status_code} - {response.text}")
            return f"Error: Local Ollama returned {response.status_code}. Is the model '{model}' downloaded? Try: ollama pull {model}"
    except Exception as e:
        logger.error(f"Ollama Connection Error: {e}")
        return "Error: Could not connect to local Ollama service. Please make sure it's running."

def call_ai(prompt, model=GENERATOR_MODEL_NAME):
    provider = get_provider()
    if provider == "gemini":
        return call_gemini_v1(prompt, model)
    else:
        return call_ollama(prompt)

def call_gemini_v1(prompt, model=GENERATOR_MODEL_NAME):
    if not API_KEY:
        return "Error: API Key is missing."

    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    params = {
        "key": API_KEY
    }
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        response = requests.post(url, headers=headers, params=params, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            try:
                text = result['candidates'][0]['content']['parts'][0]['text']
                return text
            except (KeyError, IndexError) as e:
                logger.error(f"Parsing Error: {e}, Response: {result}")
                return "Error parsing AI response."
        else:
            logger.error(f"Gemini API V1 Error: {response.status_code} - {response.text}")
            return f"Error: API returned {response.status_code}"
            
    except Exception as e:
        logger.error(f"Request Error: {e}")
        return f"Error connecting to AI service: {e}"


def generate_chat_response(message, history, context=""):
    """
    Generate a conversational response using chat history and context.
    """
    # 0. Basic Greetings Bypass
    greetings = ["hi", "hello", "hey", "greetings", "good morning"]
    if message.lower().strip() in greetings:
        return "Hello! I am your HyperActive AI Assistant. How can I help you optimize your learning today?"

    try:
        # Construct a rich prompt with context
        system_instruction = f"""
You are an expert AI Study Assistant for HyperActive.
Use the following Context to answer the user's question.
If the answer is not in the context, use your general knowledge but mention that it's general advice.

Context:
{context}
"""
        full_prompt = f"{system_instruction}\n\nUser: {message}"
        
        return call_ai(full_prompt)
    except Exception as e:
        return f"I encountered an error: {str(e)}"


def generate_study_plan(topics, goals, hours_per_week):
    prompt = f"""
    Create a personalized weekly study plan.
    Topics: {', '.join(topics)}
    Goals: {goals}
    Available Time: {hours_per_week} hours/week
    
    Format the output as a clear Weekly Schedule with daily activities.
    """
    return call_ai(prompt)


def generate_subtasks(task, context=""):
    prompt = f"""
    Break down the following learning task into 3-5 small, actionable sub-tasks.
    Task: {task}
    Additional Context: {context}
    
    Return ONLY a JSON list of strings.
    Example: ["Understand basic syntax", "Practice simple loops", "Build a small CLI app"]
    """
    response = call_ai(prompt)
    try:
        # Try to find JSON list in response
        import re
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            import json
            return json.loads(match.group())
        return [s.strip('- ') for s in response.split('\n') if s.strip()]
    except:
        return [s.strip() for s in response.split('\n') if s.strip()][:5]


def generate_text(prompt, max_length=200):
    """
    Generate text using the configured AI provider.
    This is a convenience wrapper around call_ai() used by the /rag/analyze and /rag/improve-notes endpoints.
    """
    return call_ai(prompt)


def construct_prompt(query, context_docs):
    context_str = "\n".join(context_docs)
    return f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer:"
