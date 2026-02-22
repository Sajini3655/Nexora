from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from summarizer import get_ai_response, summarize_chat
from groq import Groq
from get_valid_model import get_first_available_model


def extract_blockers(messages):
    """
    Detect blockers from user messages.
    """
    blockers = []
    combined = " ".join([m["message"].lower() for m in messages])

    if "database server is down" in combined or "db server is down" in combined:
        blockers.append("Database server is down")

    if "api keys are missing" in combined or "missing api keys" in combined:
        blockers.append("API keys are missing")

    return blockers



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/app", StaticFiles(directory="../frontend", html=True), name="app")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing!")

client = Groq(api_key=GROQ_API_KEY)
MODEL = get_first_available_model()

print("Using model:", MODEL)



def groq_stream_response(user_message: str):
    return get_ai_response(user_message)



@app.get("/")
def home():
    return {"status": "AI Shadow Chat Backend Running", "model": MODEL}


@app.post("/chat")
async def chat(req: Request):
    body = await req.json()
    msg = body.get("message")

    if not msg:
        return JSONResponse({"error": "Message is required"}, status_code=400)

    return StreamingResponse(groq_stream_response(msg), media_type="text/plain")


@app.post("/chat/start")
async def chat_start(req: Request):
    return {"status": "started"}


@app.post("/chat/end")
async def chat_end(req: Request):
    body = await req.json()
    task_id = body.get("task_id")
    messages = body.get("messages", [])
    create_tickets = body.get("create_tickets", None)  # None = user hasn’t decided yet

    if not task_id:
        return JSONResponse({"error": "task_id is required"}, status_code=400)

    real_blockers = extract_blockers(messages)
    tickets = []
    ticket_prompt_needed = False

    summary_text = "Project cannot proceed due to: " + ", ".join(real_blockers) if real_blockers else "No blockers detected. Project can continue normally."

    if real_blockers and create_tickets is None:
        ticket_prompt_needed = True

    if real_blockers and create_tickets is True:
        for idx, b in enumerate(real_blockers, 1):
            tickets.append({"ticket_id": f"TICKET{idx}", "blocker": b})

    return JSONResponse({
        "summary": summary_text,
        "blockers": real_blockers,
        "tickets_created": tickets,
        "ticket_prompt_needed": ticket_prompt_needed
    })
