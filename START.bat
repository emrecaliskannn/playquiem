@echo off
title QuestLog
color 0B
echo.
echo  ==========================================
echo   QuestLog React + FastAPI
echo  ==========================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b
)

echo [1/4] Setting up backend...
cd backend
if not exist "venv\" python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt -q --disable-pip-version-check
cd ..

echo [2/4] Starting backend (port 8000)...
start "QuestLog Backend" /min cmd /c "cd /d %~dp0backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

ping -n 3 127.0.0.1 >nul

echo [3/4] Setting up frontend...
cd frontend
if not exist "node_modules\" (
    echo Installing npm packages - first time only, ~1-2 min...
    call npm install
)

echo [4/4] Starting frontend (port 3000)...
echo.
echo  ==========================================
echo   Open this in your browser:
echo   http://localhost:3000
echo  ==========================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
call npm run dev
