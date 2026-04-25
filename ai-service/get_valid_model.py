from groq import Groq
import os

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set!")

client = Groq(api_key=api_key)

SAFE_CHAT_MODELS = [
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
]

def get_first_available_model():
    """Return the first safe chat-capable model available."""
    try:
        available_models = client.models.list()
        models = getattr(available_models, "data", available_models)
        for m in models:
            model_id = getattr(m, "id", None)
            if model_id is None and isinstance(m, dict):
                model_id = m.get("id")
            if model_id in SAFE_CHAT_MODELS:
                return model_id
    except Exception as e:
        print("Error fetching models:", e)

    return SAFE_CHAT_MODELS[0]

def get_valid_models():
    """Return the list of supported models for fallback usage."""
    return SAFE_CHAT_MODELS

if __name__ == "__main__":
    model = get_first_available_model()
    print("Selected model:", model)