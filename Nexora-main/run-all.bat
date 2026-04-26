@echo off
setlocal

REM Opens 2 terminals: backend + single frontend (admin-manager)
start "Backend" cmd /k "cd backend && mvn spring-boot:run"
start "Admin+Manager UI" cmd /k "cd admin-manager && npm install && npm run dev"

endlocal
