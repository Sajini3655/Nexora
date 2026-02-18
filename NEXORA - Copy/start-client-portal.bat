@echo off
setlocal
cd /d "%~dp0"

echo Starting Client Portal API (8002)...
start "Client Portal API" cmd /k "cd apps\client-portal-api && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8002"

echo Starting Client Portal UI (Vite)...
start "Client Portal UI" cmd /k "cd apps\client-portal && npm run dev"

echo.
echo  Started. API: http://127.0.0.1:8002/docs
echo  UI: check the UI terminal for the Local URL (5173 or 5174).
