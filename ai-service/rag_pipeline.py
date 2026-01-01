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

def build_index(docs):
    """
    Generate embeddings for all documents using Gemini.
    """
    global document_embeddings, documents
    
    # Update documents list if provided
    if docs is not None:
        documents = docs
        
    if not documents:
        print("No documents to index.")
        return 0
        
    print(f"Indexing {len(documents)} documents with Gemini...")
    
    try:
        # Batch embedding (Gemini supports batching)
        # embedding-001 is the model
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=documents,
            task_type="retrieval_document",
            title="NeuroTrack Knowledge"
        )
        
        # 'embedding' key maps to list of embeddings
        document_embeddings = np.array(result['embedding'])
        print("Indexing complete.")
        return len(documents)
        
    except Exception as e:
        print(f"Embedding Error: {e}")
        return 0

def retrieve(query, k=3):
    """
    Retrieve top k documents using Cosine Similarity.
    """
    global document_embeddings, documents
    
    if not documents or document_embeddings is None:
        return []
        
    try:
        # Embed the query
        query_result = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = np.array(query_result['embedding'])
        
        # Calculate Cosine Similarity
        # Dot product of normalized vectors (assuming Gemini output is not normalized, we strictly use dot for simplicity)
        # For robustness, we normalize.
        
        # Compute norms
        doc_norms = np.linalg.norm(document_embeddings, axis=1)
        query_norm = np.linalg.norm(query_embedding)
        
        # Avoid division by zero
        if query_norm == 0 or np.any(doc_norms == 0):
            return []
            
        scores = np.dot(document_embeddings, query_embedding) / (doc_norms * query_norm)
        
        # Get top k indices
        top_k_indices = np.argsort(scores)[-k:][::-1]
        
        results = [documents[i] for i in top_k_indices]
        return results
        
    except Exception as e:
        print(f"Retrieval Error: {e}")
        return []
