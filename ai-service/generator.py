import os
import google.generativeai as genai

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

GENERATOR_MODEL_NAME = "gemini-pro"
model = None

def initialize_generator():
    global model
    print(f"Loading generator model: {GENERATOR_MODEL_NAME}...")
    model = genai.GenerativeModel(GENERATOR_MODEL_NAME)
    print("Generator Initialized.")

def generate_chat_response(message, history, context=""):
    """
    Generate a conversational response using chat history and context.
    """
    # 0. Basic Greetings Bypass
    greetings = ["hi", "hello", "hey", "greetings", "good morning"]
    if message.lower().strip() in greetings:
        return "Hello! I am your NeuroTrack AI Assistant. How can I help you optimize your learning today?"

    global model
    if model is None:
        initialize_generator()

    try:
        # Construct a rich prompt with context
        system_instruction = f"""
You are an expert AI Study Assistant for NeuroTrack.
Use the following Context to answer the user's question.
If the answer is not in the context, use your general knowledge but mention that it's general advice.

Context:
{context}
"""
        # Convert history format if needed, or just append to prompt
        # Gemini supports chat history objects, but for simplicity/statelessness we can append
        
        full_prompt = f"{system_instruction}\n\nUser: {message}"
        
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"I encountered an error: {str(e)}"

def generate_study_plan(topics, goals, hours_per_week):
    global model
    if model is None:
        initialize_generator()
        
    prompt = f"""
    Create a personalized weekly study plan.
    Topics: {', '.join(topics)}
    Goals: {goals}
    Available Time: {hours_per_week} hours/week
    
    Format the output as a clear Weekly Schedule with daily activities.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating plan: {str(e)}"

def generate_text(prompt, max_length=200):
    global model
    if model is None:
        initialize_generator()
        
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"

def construct_prompt(query, context_docs):
    context_str = "\n".join(context_docs)
    return f"Context:\n{context_str}\n\nQuestion: {query}\nAnswer:"
