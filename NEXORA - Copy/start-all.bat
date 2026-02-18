@echo off
cd /d "%~dp0"
@echo off

REM === Go to backend ===
cd /d "C:\Users\vishva prabodhana\Desktop\Sem 2 project\NEXORA\EmailToTicketAI"

REM Activate Python virtual environment
call .venv\Scripts\activate.bat

REM Start API server in its own CMD window
start "NEXORA API" cmd /k "python api.py"

REM Start Email Worker in its own CMD window
start "NEXORA Worker" cmd /k "python main.py"

REM === Go to React frontend ===
cd /d "C:\Users\vishva prabodhana\Desktop\Sem 2 project\NEXORA\nexora-ui"

REM Start React dev server in this window
npm start

