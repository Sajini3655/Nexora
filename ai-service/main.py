from dotenv import load_dotenv
load_dotenv()

import os
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from summarizer import get_ai_response
from groq import Groq
from get_valid_model import get_first_available_model

# ----------------------------
# Helper to detect blockers
# ----------------------------
def extract_blockers(messages):
    blockers = []
    combined = " ".join([m["message"].lower() for m in messages])

    # Database-related issues
    if any(term in combined for term in ["database server is down", "db server is down", "database down", "db down", "database is down"]):
        blockers.append("Database server is down")
    
    # API/Service-related issues
    if any(term in combined for term in ["api keys are missing", "missing api keys", "api key missing"]):
        blockers.append("API keys are missing")
    
    # AI Service issues
    if any(term in combined for term in ["ai service is down", "ai service down", "ai server down"]):
        blockers.append("AI service is down")
    
    # General service/bug keywords
    if any(term in combined for term in ["service is down", "server is down"]) and "ai service" not in combined and "database" not in combined:
        if "service is down" in combined:
            blockers.append("Service is down")
    
    # Critical issues
    if any(term in combined for term in ["critical", "blocker", "blocking", "cannot proceed"]):
        if not any(b.lower() in combined for b in blockers):
            blockers.append("Critical issue reported")
    
    return blockers


def build_ai_summary(messages, create_tickets=None):
    transcript_lines = []
    for m in messages:
        role = "Manager/Developer" if m.get("user") == "user" else "Assistant"
        transcript_lines.append(f"{role}: {m.get('message', '')}")

    prompt = (
        "You are a project assistant that summarizes team chat for a manager. "
        "Return ONLY valid JSON with this shape: "
        "{\"summary\": string, \"blockers\": string[], \"ticket_prompt_needed\": boolean, \"ticket_message\": string}. "
        "Be concise. Use ticket_prompt_needed=true when there is a blocker that should become a ticket. "
        "If create_tickets is true, still include blockers and a clear ticket_message. "
        "If no blockers exist, ticket_prompt_needed must be false and ticket_message should mention no ticket is needed.\n\n"
        f"Chat transcript:\n" + "\n".join(transcript_lines)
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You summarize project conversations and identify blockers for ticketing."
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)
        return {
            "summary": payload.get("summary") or "No summary available.",
            "blockers": payload.get("blockers") or [],
            "ticket_prompt_needed": bool(payload.get("ticket_prompt_needed", False)),
            "ticket_message": payload.get("ticket_message") or "",
        }
    except Exception:
        blockers = extract_blockers(messages)
        summary_text = (
            "Project cannot proceed due to: " + ", ".join(blockers)
            if blockers else
            "✅ No blockers detected. Project can continue normally."
        )

        return {
            "summary": summary_text,
            "blockers": blockers,
            "ticket_prompt_needed": bool(blockers) and create_tickets is None,
            "ticket_message": "Tickets created for blockers." if blockers and create_tickets is True else "No ticket is needed.",
        }

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
MODEL = os.getenv("GROQ_MODEL") or MODEL
print("Using model:", MODEL)

# ----------------------------
# Endpoints
# ----------------------------
@app.get("/")
def home():
    return {"status": "AI Shadow Chat Backend Running", "model": MODEL}

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}

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

    ai_result = build_ai_summary(messages, create_tickets=create_tickets)
    real_blockers = ai_result["blockers"]
    tickets = []

    if real_blockers and create_tickets is True:
        for idx, b in enumerate(real_blockers, 1):
            tickets.append({"ticket_id": f"TICKET{idx}", "blocker": b})

    return JSONResponse({
        "summary": ai_result["summary"],
        "blockers": real_blockers,
        "tickets_created": tickets,
        "ticket_message": ai_result["ticket_message"],
        "ticket_prompt_needed": ai_result["ticket_prompt_needed"]
    })