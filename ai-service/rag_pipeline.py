import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Initialize model and index
# loading a small model for efficiency
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
model = None
index = None
documents = []

def initialize_rag():
    global model, index, documents
    print("Loading embedding model...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    
    # Initialize FAISS index
    embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
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

def build_index(raw_data):
    global index, documents
    
    new_docs = preprocess_data(raw_data)
    if not new_docs:
        return 0
        
    documents = new_docs
    embeddings = model.encode(new_docs)
    
    # Reset index and add new embeddings
    embedding_dim = 384
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(np.array(embeddings).astype('float32'))
    
    return len(documents)

def retrieve(query, k=3):
    global index, documents
    
    if index is None or index.ntotal == 0:
        return []
        
    query_embedding = model.encode([query])
    D, I = index.search(np.array(query_embedding).astype('float32'), k)
    
    retrieved_docs = []
    for idx in I[0]:
        if 0 <= idx < len(documents):
            retrieved_docs.append(documents[idx])
            
    return retrieved_docs

# Auto-initialize on import (or can be explicit)
initialize_rag()
