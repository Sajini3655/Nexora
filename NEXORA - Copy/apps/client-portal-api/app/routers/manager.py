import os, json
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(tags=["manager"])

EMAIL_TICKETS_PATH = os.getenv("EMAIL_TICKETS_PATH", "")
PORTAL_TICKETS_PATH = os.getenv("PORTAL_TICKETS_PATH", "./data/tickets_portal.json")

def read_list(path: str):
    try:
        if not path or not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []

def normalize(t: dict, source: str):
    return {
        "id": t.get("ticket_id") or t.get("id") or t.get("_id"),
        "source": source,  # email | portal | chatbot
        "title": t.get("title") or t.get("summary") or t.get("subject") or "Untitled",
        "summary": t.get("summary") or t.get("description") or t.get("body") or "",
        "status": t.get("status", "open"),
        "priority": t.get("priority", "Medium"),
        "created_at": t.get("created_at") or t.get("timestamp") or t.get("createdAt"),
        "reported_by": t.get("reported_by") or t.get("from_email") or t.get("email"),
        "project": t.get("project") or t.get("project_id") or "",
        "raw": t,
    }

@router.get("/manager/tickets")
def all_tickets(source: str = "all"):
    email = [normalize(x, "email") for x in read_list(EMAIL_TICKETS_PATH)]
    portal = [normalize(x, "portal") for x in read_list(PORTAL_TICKETS_PATH)]
    chatbot = []  # empty for now

    tickets = email + portal + chatbot

    if source != "all":
        tickets = [x for x in tickets if x["source"] == source]

    tickets.sort(key=lambda x: (x["created_at"] or ""), reverse=True)
    return {"count": len(tickets), "tickets": tickets}
