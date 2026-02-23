from dotenv import load_dotenv
load_dotenv()

import os
from groq import Groq
from get_valid_model import get_first_available_model

MODEL = get_first_available_model()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set!")

client = Groq(api_key=GROQ_API_KEY)

# ----------------------------
# Async AI response generator
# ----------------------------
async def get_ai_response(message: str):
    """
    Async generator yielding AI response chunk by chunk.
    """
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
        yield f"[AI response error: {str(e)}]"

# ----------------------------
# Simple fallback summarizer
# ----------------------------
def summarize_chat(messages):
    text = "\n".join([f"User: {m['user']}\nAI: {m['message']}" for m in messages])
    return (f"Chat Summary:\n{text}", [])