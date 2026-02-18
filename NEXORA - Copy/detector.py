import os, json, requests
from dotenv import load_dotenv

load_dotenv()
API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
API_KEY = os.getenv("GROQ_API_KEY")
MODEL   = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

def call_groq(subject: str, body: str) -> dict:
    if not API_KEY:
        raise RuntimeError("GROQ_API_KEY not set in .env")

    # clear JSON-only instruction
    system = (
        "You are a project assistant. Always reply with a single valid JSON object only, "
        "no prose. Keys: action_required (true/false), category ('bug'|'blocker'|'error'|'request'|'info'), "
        "priority ('Low'|'Medium'|'High'|'Critical'), confidence (0.0-1.0), summary."
    )
    user = f"Analyze this email.\nSubject: {subject}\n\n{body}"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        "temperature": 0.2,
        # ask the API to return a JSON object; Groq supports the OpenAI-compatible flag
        "response_format": {"type": "json_object"}
    }

    resp = requests.post(API_URL, headers=headers, json=payload, timeout=45)
    if not resp.ok:
        # print exact server message to debug 400s
        print("Groq error:", resp.status_code, resp.text)
        return {"action_required": False, "category":"info", "priority":"Low", "confidence":0.0, "summary":"Groq API error"}

    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"].strip()
        parsed = json.loads(content)
    except Exception:
        return {"action_required": False, "category":"info", "priority":"Low", "confidence":0.0, "summary":"Unparseable model output"}

    return {
        "action_required": bool(parsed.get("action_required", False)),
        "category": str(parsed.get("category", "info")),
        "priority": str(parsed.get("priority", "Medium")),
        "confidence": float(parsed.get("confidence", 0.0)),
        "summary": str(parsed.get("summary", ""))[:300],
    }
