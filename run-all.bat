@echo off
setlocal

REM Opens 2 terminals: backend + unified UI (admin/manager/developer)
start "Backend" cmd /k "cd backend && mvn spring-boot:run"
REM Install once at repo root (npm workspaces) and run each UI in its own terminal.
start "Admin+Manager UI" cmd /k "npm install && npm run dev:admin"

endlocal
