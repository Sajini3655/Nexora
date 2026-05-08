from dotenv import load_dotenv
load_dotenv()

import os
import json
import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from summarizer import get_ai_response
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

    if client is None:
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

try:
    from groq import Groq
except Exception:
    Groq = None

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if Groq and GROQ_API_KEY else None
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


# ----------------------------
# NLQ navigation resolve
# ----------------------------
def _normalize(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9\s]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _best_destination_id(query: str, allowed_destinations: List[Dict[str, Any]]) -> Optional[str]:
    q = _normalize(query)
    if not q:
        return None

    best_id = None
    best_score = 0.0

    for d in allowed_destinations or []:
        dest_id = (d.get("id") or "").strip()
        label = _normalize(d.get("label") or "")
        keywords = d.get("keywords") or []
        haystacks = [label] + [_normalize(k) for k in keywords if k]

        score = 0.0
        for h in haystacks:
            if not h:
                continue
            if h == q:
                score = max(score, 1.0)
                continue
            if h in q or q in h:
                score = max(score, 0.92)
                continue
            score = max(score, SequenceMatcher(None, q, h).ratio())

        if score > best_score:
            best_score = score
            best_id = dest_id

    # Small threshold to avoid nonsense picks
    return best_id if best_score >= 0.55 else None


def _detect_switch_role(query: str) -> Optional[str]:
    q = _normalize(query)
    if not q:
        return None

    if "switch" in q or "change role" in q or "go to" in q or q.startswith("as "):
        for role in ["admin", "manager", "developer", "client"]:
            if role in q:
                return role.upper()
    return None


def _detect_entity(current_role: str, query: str) -> Optional[Dict[str, str]]:
    q = _normalize(query)
    role = (current_role or "").strip().upper()

    # Strip common navigation verbs.
    stripped = re.sub(r"^(go to|goto|open|show|take me to|navigate|navigate to)\s+", "", q).strip()

    if role == "MANAGER":
        if "ticket" in stripped or "tickets" in stripped:
            name = stripped.replace("tickets", "").replace("ticket", "").strip()
            return {"entityType": "MANAGER_TICKET", "entityName": name}
        if "task" in stripped or "tasks" in stripped:
            name = stripped.replace("tasks", "").replace("task", "").strip()
            return {"entityType": "MANAGER_TASK", "entityName": name}
        if "project" in stripped or "projects" in stripped or "workstream" in stripped or "workstreams" in stripped:
            name = stripped
            for w in ["projects", "project", "workstreams", "workstream"]:
                name = name.replace(w, "")
            name = name.strip()
            return {"entityType": "MANAGER_PROJECT", "entityName": name}

    if role == "CLIENT":
        if "ticket" in stripped or "tickets" in stripped:
            name = stripped.replace("tickets", "").replace("ticket", "").strip()
            return {"entityType": "CLIENT_TICKET", "entityName": name}
        if "project" in stripped or "projects" in stripped or "workstream" in stripped or "workstreams" in stripped:
            name = stripped
            for w in ["projects", "project", "workstreams", "workstream"]:
                name = name.replace(w, "")
            name = name.strip()
            return {"entityType": "CLIENT_PROJECT", "entityName": name}

    if role == "DEVELOPER":
        if "task" in stripped or "tasks" in stripped:
            name = stripped.replace("tasks", "").replace("task", "").strip()
            return {"entityType": "DEVELOPER_TASK", "entityName": name}
        if "ticket" in stripped or "tickets" in stripped:
            name = stripped.replace("tickets", "").replace("ticket", "").strip()
            return {"entityType": "TICKET", "entityName": name}

    return None


@app.post("/nlq/resolve")
async def nlq_resolve(req: Request):
    """Resolve an NLQ navigation query to a constrained JSON response.

    Input shape (from backend):
      {"query": str, "currentRole": str, "allowedDestinations": [{id,label,path,keywords}]}

    Output shape:
      {"action": "NAVIGATE"|"SWITCH_ROLE"|"UNKNOWN", "destinationId": str|null,
       "targetRole": str|null, "entityType": str|null, "entityName": str|null,
       "searchQuery": str|null, "confidence": float|null, "reason": str}
    """
    body = await req.json()
    query = (body.get("query") or "").strip()
    current_role = (body.get("currentRole") or "").strip().upper()
    allowed = body.get("allowedDestinations") or []

    if not query:
        return JSONResponse({
            "action": "UNKNOWN",
            "destinationId": None,
            "targetRole": None,
            "entityType": None,
            "entityName": None,
            "searchQuery": None,
            "confidence": 0.0,
            "reason": "Empty query",
        }, status_code=200)

    # Switch role intent is handled explicitly.
    target_role = _detect_switch_role(query)
    if target_role:
        return JSONResponse({
            "action": "SWITCH_ROLE",
            "destinationId": None,
            "targetRole": target_role,
            "entityType": None,
            "entityName": None,
            "searchQuery": None,
            "confidence": 0.9,
            "reason": "Role switch requested",
        }, status_code=200)

    # If no LLM is configured, fall back to a safe heuristic.
    if client is None:
        destination_id = _best_destination_id(query, allowed)
        entity = _detect_entity(current_role, query) or {}
        return JSONResponse({
            "action": "NAVIGATE" if destination_id else "UNKNOWN",
            "destinationId": destination_id,
            "targetRole": None,
            "entityType": entity.get("entityType"),
            "entityName": entity.get("entityName"),
            "searchQuery": None,
            "confidence": 0.6 if destination_id else 0.0,
            "reason": "Heuristic resolver (no GROQ_API_KEY)",
        }, status_code=200)

    allowed_ids = [d.get("id") for d in allowed if d.get("id")]
    prompt = (
        "You are a navigation intent classifier for a web app. "
        "Pick EXACTLY ONE destinationId from allowedDestinations, or respond UNKNOWN. "
        "Handle spelling mistakes and variants (e.g., 'goto dashbord' -> dashboard). "
        "If the query mentions an entity by name (project or ticket), extract the entity name into entityName and set entityType. "
        "Rules:\n"
        "- action must be one of: NAVIGATE, SWITCH_ROLE, UNKNOWN\n"
        "- destinationId must be one of the allowedDestinations IDs when action=NAVIGATE\n"
        "- targetRole must be one of: ADMIN, MANAGER, DEVELOPER, CLIENT when action=SWITCH_ROLE\n"
        "- entityType must be one of: MANAGER_PROJECT, CLIENT_PROJECT, CLIENT_TICKET, TICKET, or null\n"
        "- Return ONLY valid JSON with keys: action,destinationId,targetRole,entityType,entityName,searchQuery,confidence,reason\n\n"
        f"currentRole: {current_role}\n"
        f"allowedDestinations (ids only): {allowed_ids}\n"
        f"allowedDestinations detail: {json.dumps(allowed)}\n\n"
        f"User query: {query}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You return strict JSON for navigation intent."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)

        action = str(payload.get("action") or "UNKNOWN").upper()
        destination_id = payload.get("destinationId")

        if action == "NAVIGATE" and destination_id not in allowed_ids:
            # Guardrail: never emit a destination outside allowed list.
            action = "UNKNOWN"
            destination_id = None

        return JSONResponse({
            "action": action,
            "destinationId": destination_id,
            "targetRole": payload.get("targetRole"),
            "entityType": payload.get("entityType"),
            "entityName": payload.get("entityName"),
            "searchQuery": payload.get("searchQuery"),
            "confidence": payload.get("confidence"),
            "reason": payload.get("reason") or "LLM resolved",
        }, status_code=200)
    except Exception as e:
        destination_id = _best_destination_id(query, allowed)
        entity = _detect_entity(current_role, query) or {}
        return JSONResponse({
            "action": "NAVIGATE" if destination_id else "UNKNOWN",
            "destinationId": destination_id,
            "targetRole": None,
            "entityType": entity.get("entityType"),
            "entityName": entity.get("entityName"),
            "searchQuery": None,
            "confidence": 0.55 if destination_id else 0.0,
            "reason": f"LLM failed; heuristic fallback: {str(e)}",
        }, status_code=200)


@app.post("/skill/extract")
async def skill_extract(req: Request):
    """Extract required skills from task description using Groq AI.
    
    Input shape:
      {"title": str, "description": str}
    
    Output shape:
      {"skills": [{"name": str, "weight": float}], "explanation": str}
    """
    body = await req.json()
    title = (body.get("title") or "").strip()
    description = (body.get("description") or "").strip()
    
    if not title:
        return JSONResponse({
            "skills": [{"name": "General", "weight": 1.0}],
            "explanation": "No task title provided."
        }, status_code=400)
    
    task_text = f"Title: {title}\nDescription: {description or '(No description)'}"
    
    prompt = (
        "You are a technical skill analyzer. Extract the primary technical skills required for this task.\n"
        "Return ONLY valid JSON with this shape: "
        "{\"skills\": [{\"name\": string, \"weight\": float (0.0-1.0)}], \"explanation\": string}.\n"
        "- skills: List of required technologies/skills (max 5)\n"
        "- weight: How critical each skill is (1.0 = critical, 0.5 = moderate, 0.3 = helpful)\n"
        "- explanation: Brief reasoning for the skill choices\n"
        "Include skills like: React, Node.js, Database, UI Design, Spring Boot, Testing, DevOps, Docker, Python, Java, etc.\n\n"
        f"Task:\n{task_text}"
    )
    
    # If Groq is not available, return keyword-based extraction
    if client is None:
        keywords = {
            "React": ["react", "jsx", "component", "frontend", "ui"],
            "Node.js": ["node", "express", "api", "backend", "jwt", "auth"],
            "Database": ["database", "sql", "schema", "query", "postgres", "mysql"],
            "UI Design": ["figma", "ux", "design", "wireframe", "layout"],
            "Spring Boot": ["spring", "springboot", "java", "controller"],
            "Testing": ["test", "testing", "junit", "jest", "bug"],
            "DevOps": ["docker", "deploy", "pipeline", "ci", "cd"],
            "Python": ["python", "django", "flask", "fastapi"],
        }
        
        task_lower = task_text.lower()
        found = {}
        for skill, kw_list in keywords.items():
            count = sum(1 for kw in kw_list if kw in task_lower)
            if count > 0:
                found[skill] = count
        
        if not found:
            return JSONResponse({
                "skills": [{"name": "General", "weight": 1.0}],
                "explanation": "No specific technical skills detected. General development skills required."
            })
        
        total = sum(found.values())
        skills = [{"name": k, "weight": v / total} for k, v in sorted(found.items(), key=lambda x: -x[1])]
        return JSONResponse({
            "skills": skills,
            "explanation": f"Extracted {len(skills)} skills from task description."
        })
    
    # Use Groq AI
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You analyze task descriptions and extract required technical skills as JSON."
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        
        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)
        
        skills = payload.get("skills") or [{"name": "General", "weight": 1.0}]
        explanation = payload.get("explanation") or "Skill extraction complete."
        
        return JSONResponse({
            "skills": skills,
            "explanation": explanation
        })
    except Exception as e:
        return JSONResponse({
            "skills": [{"name": "General", "weight": 1.0}],
            "explanation": f"Error extracting skills: {str(e)}"
        }, status_code=500)