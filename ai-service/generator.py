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
    # Stateless REST API doesn't need initialization, but we can check the key
    if not API_KEY:
        print("CRITICAL: GEMINI_API_KEY not found.")
    else:
        print(f"Generator configured for V1 API using model: {GENERATOR_MODEL_NAME}")

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
        return "Hello! I am your NeuroTrack AI Assistant. How can I help you optimize your learning today?"

    try:
        # Construct a rich prompt with context
        system_instruction = f"""
You are an expert AI Study Assistant for NeuroTrack.
Use the following Context to answer the user's question.
If the answer is not in the context, use your general knowledge but mention that it's general advice.

Context:
{context}
"""
        full_prompt = f"{system_instruction}\n\nUser: {message}"
        
        return call_gemini_v1(full_prompt)
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
    return call_gemini_v1(prompt)


def generate_text(prompt, max_length=200):
    return call_gemini_v1(prompt)


def construct_prompt(query, context_docs):
    context_str = "\n".join(context_docs)
    return f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer:"
