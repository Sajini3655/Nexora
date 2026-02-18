import os, time
from dotenv import load_dotenv
from fetcher import fetch_unseen
from preprocess import clean_email
from filters import should_ignore
from detector import call_groq
from ticketing import create_ticket
from storage import append_log
from database import init_db


load_dotenv()
init_db()  

POLL_SECONDS = int(os.getenv("POLL_SECONDS", "10"))  


print(" Email-to-Ticket Worker (Groq AI) Started...")

def process_once():
    server, batch = fetch_unseen(limit=5)
    try:
        if not batch:
            print("No new emails. Sleeping...")
            return

        for uid, raw in batch:
            try:
                meta = clean_email(raw)
                if should_ignore(meta):
                    append_log({"event":"ignored","uid":int(uid)})
                    server.add_flags([uid],[b"\\Seen"])
                    continue

                det = call_groq(meta["subject"], meta["body"])
                if det.get("action_required"):
                    create_ticket(meta, det)
                else:
                    append_log({"event":"no_action","uid":int(uid),"confidence":det.get("confidence",0)})

                server.add_flags([uid],[b"\\Seen"])
            except Exception as e:
                append_log({"event":"error","uid":int(uid),"error":str(e)})
                print(" Error:", e)
    finally:
        try:
            server.logout()
        except Exception:
            pass

if __name__ == "__main__":
    while True:
        process_once()
        time.sleep(POLL_SECONDS)
