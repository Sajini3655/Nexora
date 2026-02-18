import os
from dotenv import load_dotenv
from imapclient import IMAPClient

load_dotenv()

def fetch_unseen(limit=5):
    host = os.getenv("IMAP_HOST", "imap.gmail.com")
    port = int(os.getenv("IMAP_PORT", "993"))
    user = os.getenv("IMAP_USER")
    pwd  = os.getenv("IMAP_PASS")

    server = IMAPClient(host, ssl=True, port=port)
    server.login(user, pwd)
    server.select_folder("INBOX")

    uids = server.search(["UNSEEN"])
    if not uids:
        return server, []

    uids = uids[-limit:]
    raw_map = server.fetch(uids, ["RFC822"])
    items = [(uid, raw_map[uid][b"RFC822"]) for uid in uids]
    return server, items
