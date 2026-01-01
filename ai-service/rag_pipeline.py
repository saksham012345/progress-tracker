import os
import json
import numpy as np
import faiss
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer

# Using quantized MiniLM (~20MB)
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "Xenova/all-MiniLM-L6-v2")
model = None
tokenizer = None
index = None
documents = []

def initialize_rag():
    global model, tokenizer, index, documents
    print("Loading embedding model (ONNX)...")
    
    tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
    model = ORTModelForFeatureExtraction.from_pretrained(EMBEDDING_MODEL_NAME, file_name="model_quantized.onnx")
    
    # Initialize FAISS index
    embedding_dim = 384
    index = faiss.IndexFlatL2(embedding_dim)
    print("RAG Pipeline Initialized.")

import data_loader

def preprocess_data(data):
    """
    Convert raw session/topic data into text documents.
    Also loads custom data from 'data/' directory.
    """
    processed_docs = []
    
    # 1. Load static knowledge base (Legacy)
    try:
        if os.path.exists('knowledge_base.json'):
            with open('knowledge_base.json', 'r') as f:
                kb = json.load(f)
                for item in kb:
                    processed_docs.append(f"General Knowledge ({item['category']}): {item['content']}")
    except Exception as e:
        print(f"Warning: Could not load knowledge_base.json: {e}")
        
    # 2. Load custom data via Data Loader
    custom_docs = data_loader.load_all_data()
    processed_docs.extend(custom_docs)
    print(f"Total documents loaded: {len(processed_docs)}")

    # 3. Load dynamic User Data
    for item in data:
        # Handle Session Data
        if 'duration' in item and 'notes' in item:
            text = f"Session on {item.get('date', 'Unknown Date')}: Studied for {item.get('duration')} minutes. Notes: {item.get('notes')}"
            processed_docs.append(text)
        # Handle Topic Data
        elif 'title' in item and 'status' in item:
            text = f"Topic: {item.get('title')} ({item.get('category')}). Status: {item.get('status')}. Goal: {item.get('goal', 'No goal set')}"
            processed_docs.append(text)
            
    return processed_docs

def get_embeddings(texts):
    global model, tokenizer
    if not texts:
        return []
        
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
    outputs = model(**inputs)
    # Mean pooling
    token_embeddings = outputs.last_hidden_state
    attention_mask = inputs.attention_mask
    
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    
    return embeddings.detach().numpy()

# Need torch for the pooling logic above if we do it manually, 
# OR use a library helper. To imply dependency, let's keep it simple.
# Actually optimum outputs torch tensors usually.
import torch 

def build_index(raw_data):
    global index, documents
    
    new_docs = preprocess_data(raw_data)
    if not new_docs:
        return 0
        
    documents = new_docs
    embeddings = get_embeddings(new_docs)
    
    # Reset index and add new embeddings
    embedding_dim = 384
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(np.array(embeddings).astype('float32'))
    
    return len(documents)

def retrieve(query, k=3):
    global index, documents
    
    if index is None or index.ntotal == 0:
        return []
        
    query_embedding = get_embeddings([query])
    D, I = index.search(np.array(query_embedding).astype('float32'), k)
    
    retrieved_docs = []
    for idx in I[0]:
        if 0 <= idx < len(documents):
            retrieved_docs.append(documents[idx])
            
    return retrieved_docs

initialize_rag()
