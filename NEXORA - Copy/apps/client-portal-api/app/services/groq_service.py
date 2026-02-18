import os, json
import requests
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def summarize_ticket_with_groq(form: dict) -> dict:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is missing in .env")

    text = f"""
Client Ticket (Portal)

Category: {form.get("category")}
Client: {form.get("name")} | {form.get("company")} | {form.get("email")}
Project: {form.get("project")}
Urgency: {form.get("urgency")}

Description:
{form.get("description")}

Steps:
{form.get("steps")}

Expected:
{form.get("expected")}

Actual:
{form.get("actual")}
""".strip()

    system = (
        "Return ONLY valid JSON with keys: title, summary, internal_category, priority. "
        "internal_category must be one of: bug, error, blocker, request, info. "
        "priority must be one of: Low, Medium, High, Critical."
    )

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": text},
        ],
        "temperature": 0.2,
    }

    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload),
        timeout=30,
    )
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]

    # parse JSON (with fallback)
    try:
        return json.loads(content)
    except Exception:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            return json.loads(content[start:end+1])
        raise RuntimeError("Groq did not return valid JSON")
