from dotenv import load_dotenv
load_dotenv()

import os
import json
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


@app.post("/v1/navigate")
async def nlq_navigate(req: Request):
    """
    Convert natural language query to navigation route.
    
    Request: {"query": "Go to user dashboard", "available_routes": [...]}
    Response: {"route": "/admin/dashboard", "confidence": 0.95, "reasoning": "..."}
    """
    try:
        body = await req.json()
        query = body.get("query")
        available_routes = body.get("available_routes", [])
        
        if not query:
            return JSONResponse({"error": "Query is required"}, status_code=400)
        
        if not available_routes:
            return JSONResponse({"error": "Available routes are required"}, status_code=400)
        
        # Create a prompt to map NLQ to routes
        routes_json = json.dumps(available_routes, indent=2)
        system_prompt = f"""You are a navigation assistant. Your job is to convert natural language queries to application routes.

Available routes:
{routes_json}

Instructions:
1. Understand the user's intent from the natural language query
2. Match it to the most appropriate route from the available routes
3. Return ONLY valid JSON (no markdown, no extra text) with these fields:
   - route: the path (must be one of the available routes)
   - confidence: confidence score from 0 to 1
   - reasoning: brief explanation

Important: Return only valid JSON that can be parsed directly."""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Navigate to: {query}"}
            ],
            temperature=0.2,
            max_tokens=200
        )
        
        # Parse the response
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response
        try:
            # Remove markdown code blocks if present
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            # Try to parse as JSON
            result = json.loads(response_text)
            
            # Validate the route exists in available routes
            available_paths = [r["path"] for r in available_routes]
            if result.get("route") not in available_paths:
                # Find the closest match
                result["route"] = available_paths[0] if available_paths else "/"
                result["confidence"] = 0
            
        except json.JSONDecodeError as e:
            result = {
                "route": available_routes[0]["path"] if available_routes else "/",
                "confidence": 0,
                "reasoning": "Could not parse navigation response"
            }
        
        return JSONResponse(result)
    
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)