import os, json, uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
STORAGE_PATH = os.getenv("STORAGE_PATH", "./data/tickets_portal.json")

def _read_all():
    if not os.path.exists(STORAGE_PATH):
        return []
    with open(STORAGE_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return []

def _write_all(items):
    os.makedirs(os.path.dirname(STORAGE_PATH), exist_ok=True)
    with open(STORAGE_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)

def save_ticket(form: dict, ai: dict) -> dict:
    tickets = _read_all()

    ticket = {
        "ticket_id": f"PORTAL-{uuid.uuid4().hex[:8].upper()}",
        "source": "portal",
        "status": "open",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "reported_by": form.get("email"),
        "client_name": form.get("name"),
        "company": form.get("company"),
        "project": form.get("project"),
        "client_category": form.get("category"),
        "urgency": form.get("urgency"),
        "title": ai.get("title", "Client Ticket"),
        "summary": ai.get("summary", ""),
        "category": ai.get("internal_category", "info"),
        "priority": ai.get("priority", "Medium"),
        "description_raw": form.get("description"),
        "steps_raw": form.get("steps"),
        "expected_raw": form.get("expected"),
        "actual_raw": form.get("actual"),
    }

    tickets.append(ticket)
    _write_all(tickets)
    return ticket
