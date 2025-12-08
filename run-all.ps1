Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\sajin\OneDrive\Desktop\ai-shadow\ai-service'; uvicorn main:app --reload"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\sajin\OneDrive\Desktop\ai-shadow\frontend'; npm run dev"
