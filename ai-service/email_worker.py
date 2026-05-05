import email
import imaplib
import os
import re
import time
from email.header import decode_header
from email.message import Message

import requests
from dotenv import load_dotenv

load_dotenv()

IMAP_HOST = os.getenv("IMAP_HOST") or os.getenv("EMAIL_IMAP_HOST", "imap.gmail.com")
IMAP_PORT = int(os.getenv("IMAP_PORT") or os.getenv("EMAIL_IMAP_PORT", "993"))
IMAP_USER = os.getenv("IMAP_USER") or os.getenv("EMAIL_USERNAME")
IMAP_PASS = os.getenv("IMAP_PASS") or os.getenv("EMAIL_PASSWORD")

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8081").rstrip("/")
INBOUND_EMAIL_API_KEY = os.getenv("INBOUND_EMAIL_API_KEY", "")
DEFAULT_PROJECT_NAME = os.getenv("DEFAULT_PROJECT_NAME", "").strip()
POLL_SECONDS = int(os.getenv("POLL_SECONDS", "10"))


def decode_mime(value):
    if not value:
        return ""

    decoded = ""
    for text, charset in decode_header(value):
        if isinstance(text, bytes):
            decoded += text.decode(charset or "utf-8", errors="replace")
        else:
            decoded += text

    return decoded.strip()


def extract_email_address(from_header):
    if not from_header:
        return ""

    match = re.search(r"<([^>]+)>", from_header)
    if match:
        return match.group(1).strip()

    return from_header.strip()


def get_sender(message: Message):
    raw_from = decode_mime(message.get("From", ""))
    return extract_email_address(raw_from)


def get_subject(message: Message):
    return decode_mime(message.get("Subject", "")) or "Email issue report"


def extract_body(message: Message):
    if message.is_multipart():
        plain_text = ""

        for part in message.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition") or "")

            if "attachment" in disposition.lower():
                continue

            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    plain_text += payload.decode(
                        part.get_content_charset() or "utf-8",
                        errors="replace",
                    )

        if plain_text.strip():
            return plain_text.strip()

        for part in message.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode(
                        part.get_content_charset() or "utf-8",
                        errors="replace",
                    ).strip()

        return ""

    payload = message.get_payload(decode=True)
    if not payload:
        return ""

    return payload.decode(message.get_content_charset() or "utf-8", errors="replace").strip()


def post_to_backend(from_email, subject, body):
    url = f"{BACKEND_BASE_URL}/api/inbound/emails/tickets"

    payload = {
        "fromEmail": from_email,
        "subject": subject,
        "body": body,
    }

    if DEFAULT_PROJECT_NAME:
        payload["projectName"] = DEFAULT_PROJECT_NAME

    headers = {
        "Content-Type": "application/json",
        "X-Inbound-Api-Key": INBOUND_EMAIL_API_KEY,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=30)

    if response.status_code >= 400:
        raise RuntimeError(f"Backend error {response.status_code}: {response.text}")

    return response.json()


def process_once():
    if not IMAP_USER or not IMAP_PASS:
        raise RuntimeError("IMAP_USER and IMAP_PASS must be set in ai-service/.env")

    print(f"Connecting to inbox: {IMAP_USER}")

    with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT) as mail:
        mail.login(IMAP_USER, IMAP_PASS)
        mail.select("INBOX")

        status, data = mail.search(None, "UNSEEN")
        if status != "OK":
            print("Could not search inbox.")
            return

        ids = data[0].split()
        if not ids:
            print("No new unread emails.")
            return

        print(f"Found {len(ids)} unread email(s).")

        for msg_id in ids:
            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK":
                print(f"Could not fetch email id {msg_id!r}")
                continue

            raw_email = msg_data[0][1]
            message = email.message_from_bytes(raw_email)

            from_email = get_sender(message)
            subject = get_subject(message)
            body = extract_body(message)

            print("=" * 60)
            print("From:", from_email)
            print("Subject:", subject)

            try:
                result = post_to_backend(from_email, subject, body)
                print("Backend result:", result)

                mail.store(msg_id, "+FLAGS", "\\Seen")
            except Exception as exc:
                print("Failed to create ticket:", exc)


def main():
    print("Nexora Email-to-Ticket Worker started.")
    print(f"Inbox: {IMAP_USER}")
    print(f"Backend: {BACKEND_BASE_URL}")
    print(f"Polling every {POLL_SECONDS} seconds.")

    while True:
        try:
            process_once()
        except Exception as exc:
            print("Worker error:", exc)

        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()