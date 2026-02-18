import json
from utils import utc_now_iso
from storage import append_log
from database import get_connection


def _next_ticket_id(conn):
    """
    Get the next ticket ID in the format TKT-00X based on existing rows.
    """
    cur = conn.cursor()
    cur.execute("SELECT ticket_id FROM tickets ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    if row is None or row["ticket_id"] is None:
        return "TKT-001"

    last = row["ticket_id"]
    try:
        num = int(last.split("-")[1])
    except Exception:
        num = 0
    return f"TKT-{num + 1:03d}"


def create_ticket(meta, det):
    conn = get_connection()
    try:
        ticket_id = _next_ticket_id(conn)
        ticket = {
            "ticket_id": ticket_id,
            "source": "email",
            "subject": meta["subject"],
            "summary": det.get("summary", ""),
            "body": meta["body"],
            "reported_by": meta["sender"],
            "priority": det.get("priority", "Medium"),
            "category": det.get("category", "info"),
            "confidence": det.get("confidence", 0.0),
            "received_at": utc_now_iso(),
            "status": "Open",
        }

        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO tickets (
                ticket_id,
                source,
                subject,
                summary,
                body,
                reported_by,
                priority,
                category,
                confidence,
                received_at,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ticket["ticket_id"],
                ticket["source"],
                ticket["subject"],
                ticket["summary"],
                ticket["body"],
                ticket["reported_by"],
                ticket["priority"],
                ticket["category"],
                ticket["confidence"],
                ticket["received_at"],
                ticket["status"],
            ),
        )
        conn.commit()

        append_log(
            {
                "event": "ticket_created",
                "ticket_id": ticket["ticket_id"],
                "category": ticket["category"],
            }
        )
        print("\n Ticket Created:")
        print(json.dumps(ticket, indent=2, ensure_ascii=False))
        return ticket
    finally:
        conn.close()

