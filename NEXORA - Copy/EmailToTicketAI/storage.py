import json, os

TICKET_FILE = "tickets.json"
LOG_FILE = "logs.jsonl"

def _ensure_files():
    if not os.path.exists(TICKET_FILE):
        json.dump([], open(TICKET_FILE, "w"))
    if not os.path.exists(LOG_FILE):
        open(LOG_FILE, "a").close()

def read_tickets():
    _ensure_files()
    with open(TICKET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def write_tickets(tickets):
    with open(TICKET_FILE, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2)

def append_log(obj):
    _ensure_files()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def next_ticket_id():
    return f"TKT-{len(read_tickets())+1:03d}"
