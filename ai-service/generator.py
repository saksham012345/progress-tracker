import os
from optimum.onnxruntime import ORTModelForSeq2SeqLM
from transformers import AutoTokenizer

# Using LaMini-Flan-T5-77M for ultra-low memory footprint (Int8 Quantized)
# Roughly 80MB model size.
GENERATOR_MODEL_NAME = os.getenv("GENERATOR_MODEL", "Xenova/LaMini-Flan-T5-77M")
model = None
tokenizer = None

def initialize_generator():
    global model, tokenizer
    print(f"Loading generator model (ONNX): {GENERATOR_MODEL_NAME}...")
    
    # Load quantized model for efficiency
    tokenizer = AutoTokenizer.from_pretrained(GENERATOR_MODEL_NAME)
    model = ORTModelForSeq2SeqLM.from_pretrained(GENERATOR_MODEL_NAME)
    
    print("Generator Initialized.")

def generate_chat_response(message, history, context=""):
    """
    Generate a conversational response using history and context.
    """
    # Simple history formatting
    history_text = ""
    for msg in history[-2:]: # minimal history
        history_text += f"{msg['role']}: {msg['content']}\n"
        
    prompt = f"""
    Answer the user question based on the context.
    Context: {context[:300]}
    
    User: {message}
    Answer:
    """
    
    return generate_text(prompt, max_length=150)

def generate_study_plan(topics, goals, hours_per_week):
    prompt = f"""
    Create a weekly study plan.
    Topics: {', '.join(topics)}
    Goals: {goals}
    Time: {hours_per_week} hours/week
    
    Plan:
    """
    return generate_text(prompt, max_length=200)

def generate_text(prompt, max_length=150):
    global model, tokenizer
    if model is None:
        initialize_generator()
        
    try:
        inputs = tokenizer(prompt, return_tensors="pt")
        # Generate with aggressive optimization parameters
        gen_tokens = model.generate(
            **inputs, 
            max_new_tokens=max_length,
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )
        response = tokenizer.batch_decode(gen_tokens, skip_special_tokens=True)[0]
        return response
    except Exception as e:
        print(f"Generation Error: {e}")
        return "Error generating response."

def construct_prompt(query, context_docs):
    context_str = " ".join(context_docs)
    return f"Context: {context_str}\nQuestion: {query}\nAnswer:"
