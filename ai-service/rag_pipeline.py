import os
import google.generativeai as genai
import numpy as np

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# In-memory storage suitable for < 1000 docs (Extremely fast & light)
documents = []
document_embeddings = None

def preprocess_data(data_items):
    """
    Load and preprocess data from the data/ directory and input items.
    """
    global documents
    documents = []
    
    # Load built-in data
    # Safe check for data loader existence, or just read directory
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    if os.path.exists(data_dir):
        for f in os.listdir(data_dir):
            if f.endswith(".txt"):
                try:
                    with open(os.path.join(data_dir, f), "r", encoding="utf-8") as file:
                        content = file.read()
                        # Simple chunking by paragraph
                        chunks = [c.strip() for c in content.split('\n\n') if c.strip()]
                        documents.extend(chunks)
                except Exception as e:
                    print(f"Error reading {f}: {e}")

    # Add user data items (Topics/Sessions converted to text)
    if data_items:
        for item in data_items:
            # Flexible handling of dict items
            text = str(item)
            if isinstance(item, dict):
                # Format nicely if it's a known structure
                if 'title' in item: # Topic
                    text = f"Topic: {item.get('title')} ({item.get('category')}). Goal: {item.get('goal')}"
                elif 'date' in item: # Session
                    text = f"Session on {item.get('date')} ({item.get('duration')} min): {item.get('notes')}"
            
            documents.append(text)
            
    return documents

import time
import random

import requests

def build_index(docs):
    """
    Generate embeddings for all documents using Gemini V1 API with Rate Limiting.
    """
    global document_embeddings, documents
    
    # Update documents list if provided
    if docs is not None:
        documents = docs
        
    if not documents:
        print("No documents to index.")
        return 0
        
    print(f"Indexing {len(documents)} documents with Gemini V1...")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: No API Key found.")
        return 0

    # Configuration for Rate Limiting
    BATCH_SIZE = 1 # Embed content does not support batch in v1 easily via simple rest without lookups
    # Actually V1 batchEmbedContents exists but lets stick to simple 1 by 1 or check batch support
    # To be safe and simple: 1 by 1 or V1 batch endpoint. 
    # V1 URL: https://generativelanguage.googleapis.com/v1/models/embedding-001:batchEmbedContents
    
    url = "https://generativelanguage.googleapis.com/v1/models/embedding-001:batchEmbedContents"
    
    DELAY_SECONDS = 1
    MAX_RETRIES = 5
    
    all_embeddings = []
    
    # Simple batching implementation for the API
    # Max batch size for Gemini is usually higher, but let's stick to 5
    BATCH_SIZE_API = 5
    
    for i in range(0, len(documents), BATCH_SIZE_API):
        batch_docs = documents[i:i + BATCH_SIZE_API]
        print(f"Processing batch {i//BATCH_SIZE_API + 1}...")
        
        # Prepare payload
        requests_payload = {
            "requests": [{
                "model": "models/embedding-001",
                "content": {"parts": [{"text": d}]},
                "taskType": "RETRIEVAL_DOCUMENT",
                "title": "NeuroTrack Knowledge"
            } for d in batch_docs]
        }
        
        retry_count = 0
        current_batch_embeddings = []
        
        while retry_count <= MAX_RETRIES:
            try:
                response = requests.post(
                    url, 
                    headers={"Content-Type": "application/json"},
                    params={"key": api_key},
                    json=requests_payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Extract embeddings
                    if 'embeddings' in data:
                        for emb in data['embeddings']:
                            if 'values' in emb:
                                current_batch_embeddings.append(emb['values'])
                        break # Success
                    else:
                        print(f"Unexpected response structure: {data}")
                        break
                elif response.status_code == 429:
                    wait_time = (2 ** retry_count) + random.uniform(0, 1)
                    print(f"  Rate limit hit. Retrying in {wait_time:.2f}s...")
                    time.sleep(wait_time)
                    retry_count += 1
                else:
                    print(f"  Error embedding batch: {response.text}")
                    break
            except Exception as e:
                 print(f"  Request Exception: {e}")
                 retry_count += 1
                 time.sleep(1)
        
        # Fill missing if failed
        if len(current_batch_embeddings) != len(batch_docs):
             # Pad with zeros
             current_batch_embeddings.extend([[0.0]*768] * (len(batch_docs) - len(current_batch_embeddings)))
             
        all_embeddings.extend(current_batch_embeddings)
        time.sleep(DELAY_SECONDS)

    try:
        document_embeddings = np.array(all_embeddings)
        print("Indexing complete.")
        return len(documents)
    except Exception as e:
        print(f"Error finalizing index: {e}")
        return 0

def retrieve(query, k=3):
    """
    Retrieve top k documents using Cosine Similarity via V1 API.
    """
    global document_embeddings, documents
    
    if not documents or document_embeddings is None:
        return []
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []

    try:
        # Embed query
        url = "https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent"
        payload = {
            "model": "models/embedding-001",
            "content": {"parts": [{"text": query}]},
            "taskType": "RETRIEVAL_QUERY"
        }
        
        response = requests.post(
            url, 
            headers={"Content-Type": "application/json"},
            params={"key": api_key},
            json=payload,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"Retrieval embedding error: {response.text}")
            return []
            
        data = response.json()
        if 'embedding' not in data or 'values' not in data['embedding']:
             return []
             
        query_embedding = np.array(data['embedding']['values'])
        
        # Calculate Cosine Similarity
        doc_norms = np.linalg.norm(document_embeddings, axis=1)
        query_norm = np.linalg.norm(query_embedding)
        
        if query_norm == 0 or np.any(doc_norms == 0):
            return []
            
        scores = np.dot(document_embeddings, query_embedding) / (doc_norms * query_norm)
        
        top_k_indices = np.argsort(scores)[-k:][::-1]
        
        results = [documents[i] for i in top_k_indices]
        return results
        
    except Exception as e:
        print(f"Retrieval Error: {e}")
        return []
