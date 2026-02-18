import re, mailparser
from langdetect import detect, LangDetectException
from html import unescape

SIG_PAT = re.compile(r"(?i)(thanks|regards|best,|sent from my).*", re.S)

def _to_text(mail):
    if mail.text_plain:
        txt = "\n\n".join([t or "" for t in mail.text_plain]).strip()
    else:
        html = "\n\n".join([h or "" for h in (mail.text_html or [])])
        txt = re.sub(r"<[^>]+>", " ", html)
        txt = unescape(txt).strip()
    txt = txt.split("\nOn ", 1)[0]
    txt = SIG_PAT.sub("", txt)
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt).strip()
    return txt

def clean_email(raw_bytes):
    mail = mailparser.parse_from_bytes(raw_bytes)
    subj = (mail.subject or "").strip()
    body = _to_text(mail)
    try:
        lang = detect(body) if body else "en"
    except LangDetectException:
        lang = "en"
    sender = mail.from_[0][1] if mail.from_ else "unknown"
    return {"subject": subj, "body": body[:4000], "sender": sender, "lang": lang}
