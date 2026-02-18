from flask import Flask, jsonify
from flask_cors import CORS
from database import get_connection, init_db

app = Flask(__name__)
CORS(app)  # allow http://localhost:3000 to call this API

# Make sure DB and table exist
init_db()


def row_to_ticket(row):
    return {
        "ticket_id": row["ticket_id"],
        "source": row["source"],
        "subject": row["subject"],
        "summary": row["summary"],
        "body": row["body"],
        "reported_by": row["reported_by"],
        "priority": row["priority"],
        "category": row["category"],
        "confidence": row["confidence"],
        "received_at": row["received_at"],
        "status": row["status"],
    }


@app.get("/tickets")
def list_tickets():
    """
    GET /tickets
    Returns all tickets as JSON list.
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tickets ORDER BY id DESC")
    rows = [row_to_ticket(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


if __name__ == "__main__":
    # http://localhost:8000/tickets
    app.run(host="0.0.0.0", port=8000, debug=True)
