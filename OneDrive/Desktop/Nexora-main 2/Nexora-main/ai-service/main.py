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

# ----------------------------
# Helper to detect blockers
# ----------------------------
def extract_blockers(messages):
    blockers = []
    combined = " ".join([m["message"].lower() for m in messages])

    if "database server is down" in combined or "db server is down" in combined:
        blockers.append("Database server is down")
    if "api keys are missing" in combined or "missing api keys" in combined:
        blockers.append("API keys are missing")
    return blockers

# ----------------------------
# App setup
# ----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing!")

client = Groq(api_key=GROQ_API_KEY)
MODEL = get_first_available_model()
print("Using model:", MODEL)

# ----------------------------
# Endpoints
# ----------------------------
@app.get("/")
def home():
    return {"status": "AI Shadow Chat Backend Running", "model": MODEL}

@app.post("/chat/message")
async def chat_message(req: Request):
    """
    Receives full conversation and generates AI reply.
    """
    body = await req.json()
    messages = body.get("messages") or body.get("message")
    if not messages:
        return JSONResponse({"text": "[No messages sent]"}, status_code=400)

    # Prepare AI input with full chat history
    ai_input = ""
    if isinstance(messages, list):
        for m in messages:
            role = "User" if m["user"] == "user" else "AI"
            ai_input += f"{role}: {m['message']}\n"
    else:
        ai_input = messages

    # Stream AI response
    full_response = ""
    async for chunk in get_ai_response(ai_input):
        full_response += chunk

    return JSONResponse({"text": full_response})


@app.post("/chat/end")
async def chat_end(req: Request):
    """
    Summarize chat and create tickets if blockers exist.
    """
    body = await req.json()
    messages = body.get("messages", [])
    create_tickets = body.get("create_tickets", None)

    if not isinstance(messages, list):
        messages = []

    # Detect blockers
    real_blockers = extract_blockers(messages)
    tickets = []
    ticket_prompt_needed = False

    summary_text = (
        "Project cannot proceed due to: " + ", ".join(real_blockers)
        if real_blockers else
        "✅ No blockers detected. Project can continue normally."
    )

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