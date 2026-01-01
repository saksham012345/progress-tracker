import sys
import os
import psutil
import time

# Add ai-service to path
sys.path.append(os.path.join(os.getcwd(), 'ai-service'))

def get_memory_mb():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024

print(f"Initial Memory: {get_memory_mb():.2f} MB")

print("Importing rag_pipeline...")
import rag_pipeline
print(f"After RAG Import: {get_memory_mb():.2f} MB")

print("Importing generator...")
import generator
print(f"After Generator Import: {get_memory_mb():.2f} MB")

print("Initializing RAG (Models loading)...")
rag_pipeline.initialize_rag()
print(f"After RAG Init: {get_memory_mb():.2f} MB")

print("Initializing Generator (Models loading)...")
generator.initialize_generator()
print(f"After Generator Init: {get_memory_mb():.2f} MB")

print("Running test generation...")
response = generator.generate_text("Hello, how are you?")
print(f"Response: {response}")
print(f"Final Memory: {get_memory_mb():.2f} MB")

if get_memory_mb() > 450:
    print("WARNING: Memory usage > 450MB. Risk of OOM.")
else:
    print("SUCCESS: Memory usage safe.")
