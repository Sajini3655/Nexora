@echo off
setlocal

REM Opens 3 terminals: backend + admin/manager UI + developer UI
start "Backend" cmd /k "cd backend && mvn spring-boot:run"
start "Admin+Manager UI" cmd /k "cd admin-manager && npm install && npm run dev"
start "Developer UI" cmd /k "cd developer && npm install && npm run dev"

endlocal
