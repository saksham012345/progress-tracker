#!/bin/bash
# 🚀 LOCAL DEVELOPMENT STARTUP GUIDE

echo "================================"
echo "🚀 NEUROTRACK LOCAL STARTUP"
echo "================================"
echo ""
echo "This guide will help you start all services locally."
echo ""

# Check if Ollama is installed
echo "1️⃣ Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Install from https://ollama.ai"
    exit 1
fi
echo "✅ Ollama found"
echo ""

# Start Ollama
echo "2️⃣ Starting Ollama server..."
echo "   Run this in a NEW terminal:"
echo "   → ollama serve"
echo ""
echo "   Then run: ollama pull qwen2.5:0.5b"
echo ""
read -p "Press Enter when Ollama is running..."
echo ""

# Start AI Service
echo "3️⃣ Starting AI Service..."
echo "   Run this in a NEW terminal:"
echo "   → cd ai-service"
echo "   → pip install -r requirements.txt"
echo "   → python main.py"
echo ""
read -p "Press Enter when AI Service is running (http://localhost:8000)..."
echo ""

# Start Backend
echo "4️⃣ Starting Backend..."
echo "   Run this in a NEW terminal:"
echo "   → cd backend"
echo "   → npm install  (if first time)"
echo "   → npm start"
echo ""
read -p "Press Enter when Backend is running (http://localhost:5000)..."
echo ""

# Start Frontend
echo "5️⃣ Starting Frontend..."
echo "   Run this in a NEW terminal:"
echo "   → cd frontend"
echo "   → npm install  (if first time)"
echo "   → npm run dev"
echo ""
read -p "Press Enter when Frontend is running (http://localhost:5173)..."
echo ""

echo "================================"
echo "✅ ALL SERVICES RUNNING!"
echo "================================"
echo ""
echo "Visit: http://localhost:5173"
echo ""
echo "Test the AI connection:"
echo "  curl http://localhost:8000/health"
echo ""
echo "View detailed health:"
echo "  curl http://localhost:5000/api/health/detailed"
echo ""
