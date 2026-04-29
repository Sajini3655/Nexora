import os

try:
    from groq import Groq
except Exception:
    Groq = None

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if Groq and api_key else None

SAFE_CHAT_MODELS = [
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
]

def get_first_available_model():
    """Return the first safe chat-capable model available."""
    if client is None:
        return os.getenv("GROQ_MODEL") or SAFE_CHAT_MODELS[0]

    try:
        available_models = client.models.list()
        for m in available_models:
            # Some SDK responses can include tuples or plain dict-like entries.
            model_id = None

            if hasattr(m, "id"):
                model_id = m.id
            elif isinstance(m, tuple) and len(m) > 0:
                first = m[0]
                if hasattr(first, "id"):
                    model_id = first.id
                elif isinstance(first, str):
                    model_id = first
            elif isinstance(m, dict):
                model_id = m.get("id")

            if model_id in SAFE_CHAT_MODELS:
                return model_id
    except Exception as e:
        print("Error fetching models:", e)

    return SAFE_CHAT_MODELS[0]

if __name__ == "__main__":
    model = get_first_available_model()
    print("Selected model:", model)