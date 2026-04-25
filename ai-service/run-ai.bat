@echo off
setlocal

set PYTHON_EXE=%~dp0.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
  echo Python virtual environment not found.
  echo Run: py -3.14 -m venv .venv
  echo Then: .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)

cd /d "%~dp0"
"%PYTHON_EXE%" main.py
