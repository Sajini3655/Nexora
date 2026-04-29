from dotenv import load_dotenv
load_dotenv()

import os
import json

try:
    from groq import Groq
except Exception:
    Groq = None
from get_valid_model import get_first_available_model

MODEL = get_first_available_model()
MODEL = os.getenv("GROQ_MODEL") or MODEL
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if Groq and GROQ_API_KEY else None


def _build_local_reply(message: str) -> str:
    text = str(message or "").strip()
    if not text:
        return "I am online, but no message was provided."

    lower = text.lower()
    if any(term in lower for term in ["blocked", "blocker", "stuck", "error", "failed", "not working", "cannot continue"]):
        return (
            "I can see a likely blocker in the conversation. "
            "Please capture the issue, summarize the impact, and create a ticket if it needs action."
        )

    return (
        "I do not have model access right now, so I am using a local fallback. "
        "Share the blocker, expected behavior, and any error details so the team can act on it."
    )

# ----------------------------
# Async AI response generator
# ----------------------------
async def get_ai_response(message: str):
    """
    Async generator yielding AI response chunk by chunk.
    """
    if client is None:
        yield _build_local_reply(message)
        return

    try:
        stream = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are AI Shadow Chat. "
                        "Respond in a clear, friendly, and concise way, like talking to a teammate. "
                        "Do NOT use Markdown tables or long bullet points. "
                        "Focus on actionable advice."
                    )
                },
                {"role": "user", "content": message},
            ],
            stream=True,
        )

        for chunk in stream:
            delta = getattr(chunk.choices[0].delta, "content", None)
            if delta:
                yield delta

    except Exception as e:
        yield _build_local_reply(message)

# ----------------------------
# Simple fallback summarizer
# ----------------------------
def summarize_chat(messages):
    lines = []
    blockers = []

    for message in messages or []:
        sender = str(message.get("user") or "User").title()
        content = str(message.get("message") or "").strip()
        if not content:
            continue

        lines.append(f"{sender}: {content}")

        lower = content.lower()
        if any(term in lower for term in ["blocked", "blocker", "stuck", "error", "failed", "not working", "cannot continue"]):
            blockers.append(content)

    summary = "Chat Summary:\n" + "\n".join(lines[-8:]) if lines else "Chat Summary:\nNo messages were available to summarize."
    return (summary, blockers)