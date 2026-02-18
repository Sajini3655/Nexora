@echo off
setlocal
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ==============================
echo   NEXORA - START EVERYTHING
echo ==============================

echo Cleaning ports...
for %%P in (8002 3000 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /PID %%A /F >nul 2>&1
  )
)

echo Starting EmailToTicketAI...
if exist "%ROOT%start-all.bat" (
  start "EmailToTicketAI" /D "%ROOT%" cmd /k "call start-all.bat"
)

echo Starting Client Portal API...
start "Client Portal API" /D "%ROOT%apps\client-portal-api" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8002"

echo Starting Client Portal UI (fixed port 5173)...
if exist "%ROOT%apps\client-portal\package.json" (
  start "Client Portal UI" /D "%ROOT%apps\client-portal" cmd /k "npm run dev -- --port 5173 --strictPort"
) else (
  echo ERROR: client-portal folder not found:
  echo %ROOT%apps\client-portal
)

echo Starting Manager UI...
start "Manager UI" /D "%ROOT%nexora-ui" cmd /k "npm start"

timeout /t 4 /nobreak >nul

echo Opening browser tabs...
start "" "http://127.0.0.1:8002/docs"
start "" "http://localhost:3000"
start "" "http://localhost:5173"

echo DONE.

