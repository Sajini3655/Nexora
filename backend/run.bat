@echo off
REM ============================================================
REM  Nexora backend launcher
REM  Forces JDK 21 (project requires Java 21) and starts the app
REM ============================================================

REM -- Point Maven at JDK 21 (change here if your JDK path differs)
set "JAVA_HOME=C:\Program Files\Java\jdk-21"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERROR] JDK 21 not found at "%JAVA_HOME%"
    echo Edit run.bat and set JAVA_HOME to your JDK 21 install path.
    exit /b 1
)

REM -- Run from this script's own folder regardless of where it was called
cd /d "%~dp0"

echo Using JAVA_HOME=%JAVA_HOME%
echo Starting Nexora backend on http://localhost:8081 ...
echo (Press Ctrl+C to stop)
echo.

call mvn spring-boot:run
