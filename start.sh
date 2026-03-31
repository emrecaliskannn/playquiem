#!/bin/bash
set -e
echo ""
echo "  =================================="
echo "   QuestLog React + FastAPI"
echo "  =================================="
echo ""

# Check dependencies
command -v python3 &>/dev/null || { echo "Python 3 required: https://python.org"; exit 1; }
command -v node    &>/dev/null || { echo "Node.js required: https://nodejs.org"; exit 1; }

# Backend
echo "[1/4] Setting up backend..."
cd backend
[ ! -d "venv" ] && python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -q

echo "[2/4] Starting backend (port 8000)..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "[3/4] Installing frontend deps..."
cd frontend
[ ! -d "node_modules" ] && npm install

echo "[4/4] Starting frontend (port 3000)..."
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000  <-- Open this"
echo ""
echo "  Press Ctrl+C to stop everything"
echo ""

trap "kill $BACKEND_PID 2>/dev/null" EXIT
npm run dev
