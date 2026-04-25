from groq import Groq
import os

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set!")

client = Groq(api_key=api_key)

def get_first_available_model():
    """Return the first available chat-capable model."""
    return "llama-3.1-70b-versatile"

def get_valid_models():
    """Get list of valid models."""
    return ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]

if __name__ == "__main__":
    model = get_first_available_model()
    print("Selected model:", model)
