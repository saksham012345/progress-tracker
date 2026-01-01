import os
import google.generativeai as genai

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

GENERATOR_MODEL_NAME = "gemini-1.5-flash"
model = None

def initialize_generator():
    global model
    
    # Try models in order of preference (Flash is fastest/cheapest, Pro is powerful, 1.0 is legacy stable)
    candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.0-pro"
    ]
    
    for model_name in candidates:
        try:
            print(f"Attempting to load generator model: {model_name}...")
            test_model = genai.GenerativeModel(model_name)
            # Simple test generation to verify access
            test_result = test_model.generate_content("Hello")
            if test_result:
                 model = test_model
                 print(f"Successfully initialized: {model_name}")
                 return
        except Exception as e:
            print(f"Failed to load {model_name}: {e}")
            
    # Absolute fallback if everything fails
    print("CRITICAL: Could not load normal candidates. Using gemini-1.5-flash as final fallback.")
    model = genai.GenerativeModel("gemini-1.5-flash")

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
