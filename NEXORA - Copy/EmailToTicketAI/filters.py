import re, os
from dotenv import load_dotenv

load_dotenv()

AUTO_REPLY = re.compile(r"(?i)(out of office|auto.?reply|vacation|undeliverable)")
SPAM_HINTS = re.compile(r"(?i)(win money|lottery|viagra|click here)")
LANG_OK = set(s.strip() for s in os.getenv("LANG_WHITELIST", "en").split(",") if s.strip())

def should_ignore(meta):
    text = f"{meta['subject']} {meta['body']}"
    if AUTO_REPLY.search(text) or SPAM_HINTS.search(text): return True
    if LANG_OK and meta.get("lang") not in LANG_OK: return True
    return False
