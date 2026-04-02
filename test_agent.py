import os
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

# Resolve path to .env
env_path = Path(__file__).resolve().parent / "backend" / ".env"
load_dotenv(env_path)

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {api_key[:10]}..." if api_key else "No API Key found")

if api_key:
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello, are you working?",
                }
            ],
            model="llama-3.3-70b-versatile",
            max_tokens=10
        )
        print("Success:", chat_completion.choices[0].message.content)
    except Exception as e:
        print("Error:", str(e))
else:
    print("Skipping test due to missing API key")
