from hashlib import sha1
from datetime import datetime, timezone

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

def short_hash(text: str) -> str:
    return sha1((text or "").encode("utf-8")).hexdigest()[:12]
