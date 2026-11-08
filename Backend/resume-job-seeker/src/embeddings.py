import os

from google import genai
from google.genai import types


def generate_embedding(text):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY was not found. "
            "Check your .env file."
        )

    # timeout is in milliseconds: give up after 30 seconds instead of hanging
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=30_000),
    )

    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=text
    )

    return response.embeddings[0].values
