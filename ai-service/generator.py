import os
from transformers import pipeline, set_seed

# Initialize text generation pipeline
# Using distilgpt2 for lightweight local usage
GENERATOR_MODEL_NAME = os.getenv("GENERATOR_MODEL", "distilgpt2")
generator = None

def initialize_generator():
    global generator
    print(f"Loading generator model: {GENERATOR_MODEL_NAME}...")
    generator = pipeline('text-generation', model=GENERATOR_MODEL_NAME)
    set_seed(42)
    print("Generator Initialized.")

def generate_chat_response(message, history, context=""):
    """
    Generate a conversational response using history and context.
    """
    # Limit history to last 3 items to keep prompt small
    recent_history = history[-3:]
    
    history_text = ""
    for msg in recent_history:
        role = "User" if msg['role'] == 'user' else "Assistant"
        history_text += f"{role}: {msg['content']}\n"
        
    prompt = f"""
    Act as a helpful study assistant. Use the context to answer the user.
    
    Context:
    {context[:500]}...
    
    Conversation:
    {history_text}
    User: {message}
    Assistant:
    """
    
    # Assuming generate_text is a global function as per existing structure
    return generate_text(prompt, max_length=150)

def generate_study_plan(topics, goals, hours_per_week):
    """
    Generate a structured study plan.
    """
    prompt = f"""
    Act as an expert academic advisor. Create a weekly study schedule for a student.
    
    Input:
    - Topics: {', '.join(topics)}
    - Goal: {goals}
    - Available Time: {hours_per_week} hours/week
    
    Output format:
    Day 1: [Topic] - [Activity] (Time)
    Day 2: [Topic] - [Activity] (Time)
    ...
    
    Weekly Schedule:
    """
    
    # We assume the model can handle this simple instruction.
    # For small models like distilgpt2, output might be repetitive, 
    # but it proves the pipeline works.
    
    return generate_text(prompt, max_length=300)

def generate_text(prompt, max_length=150):
    global generator
    if generator is None:
        initialize_generator()
        
    try:
        response = generator(prompt, max_length=max_length, num_return_sequences=1, truncation=True)
        return response[0]['generated_text']
    except Exception as e:
        print(f"Generation Error: {e}")
        return "Error generating response."

def construct_prompt(query, context_docs):
    """
    Construct a prompt combining query and retrieved context.
    Uses a structured format to guide the small model.
    """
    context_str = "\n- ".join(context_docs)
    
    # Prompt engineering for small model (distilgpt2)
    # It works best with clear patterns.
    prompt = f"""
I am an expert study assistant. I analyze learning data and give advice.

[Context]
- {context_str}

[Question]
{query}

[Answer]
Based on the context, here is the summary/advice:
"""
    return prompt
