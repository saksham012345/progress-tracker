@echo off
REM 🚀 LOCAL DEVELOPMENT STARTUP GUIDE (Windows)

echo ================================
echo 🚀 NEUROTRACK LOCAL STARTUP
echo ================================
echo.
echo This guide will help you start all services locally.
echo.

REM Check if Ollama is installed
echo 1️⃣ Checking Ollama installation...
where ollama >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Ollama not found. Install from https://ollama.ai
    exit /b 1
)
echo ✅ Ollama found
echo.

REM Start Ollama
echo 2️⃣ Starting Ollama server...
echo    Run this in a NEW PowerShell terminal:
echo    ^→ ollama serve
echo.
echo    Then run: ollama pull qwen2.5:0.5b
echo.
pause

REM Start AI Service
echo 3️⃣ Starting AI Service...
echo    Run this in a NEW PowerShell terminal:
echo    ^→ cd ai-service
echo    ^→ pip install -r requirements.txt
echo    ^→ python main.py
echo.
pause

REM Start Backend
echo 4️⃣ Starting Backend...
echo    Run this in a NEW PowerShell terminal:
echo    ^→ cd backend
echo    ^→ npm install  (if first time)
echo    ^→ npm start
echo.
pause

REM Start Frontend
echo 5️⃣ Starting Frontend...
echo    Run this in a NEW PowerShell terminal:
echo    ^→ cd frontend
echo    ^→ npm install  (if first time)
echo    ^→ npm run dev
echo.
pause

echo ================================
echo ✅ ALL SERVICES RUNNING!
echo ================================
echo.
echo Visit: http://localhost:5173
echo.
echo Test the AI connection:
echo   curl http://localhost:8000/health
echo.
echo View detailed health:
echo   curl http://localhost:5000/api/health/detailed
echo.
pause
