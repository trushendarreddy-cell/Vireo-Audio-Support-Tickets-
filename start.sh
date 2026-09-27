#!/usr/bin/env bash
# One-click startup for Vireo Audio — Support Intelligence (Linux / macOS)
echo "Starting Backend on http://localhost:8000 ..."
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --port 8000 &

echo "Starting Frontend on http://localhost:3000 ..."
cd frontend && npm install && npm run build && npm run start -- -p 3000 &

echo "Vireo Support Intelligence running on http://localhost:3000"
