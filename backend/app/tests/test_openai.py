import openai
import os

# Ensure API key is set
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

try:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"}
        ]
    )
    print(response.choices[0].message.content)
except Exception as e:
    print("OpenAI API Test Failed:", e)
