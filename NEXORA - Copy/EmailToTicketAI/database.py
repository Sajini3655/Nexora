import os
import sqlite3

# Path to DB file (you can change via env if you want)
DB_PATH = os.getenv("TICKET_DB_PATH", "tickets.db")


def get_connection():
    """
    Open a SQLite connection. Always call conn.close() when done.
    """
    conn = sqlite3.connect(DB_PATH)
    # So we can access columns by name: row["subject"]
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create the tickets table if it does not exist.
    Run this once at startup.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT UNIQUE,
            source TEXT,
            subject TEXT,
            summary TEXT,
            body TEXT,
            reported_by TEXT,
            priority TEXT,
            category TEXT,
            confidence REAL,
            received_at TEXT,
            status TEXT
        )
        """
    )

    conn.commit()
    conn.close()
