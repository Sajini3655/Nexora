from groq import Groq
import os

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set!")

client = Groq(api_key=api_key)

SAFE_CHAT_MODELS = [
    "openai/gpt-oss-20b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
]

def get_first_available_model():
    """Return the first safe chat-capable model available."""
    try:
        available_models = client.models.list()
        for m in available_models:
            if m.id in SAFE_CHAT_MODELS:
                return m.id
    except Exception as e:
        print("Error fetching models:", e)


    return SAFE_CHAT_MODELS[0]

if __name__ == "__main__":
    model = get_first_available_model()
    print("Selected model:", model)
