import json
import time

from google import genai
from google.genai import types

from precompute.response_model import ExtraccionTranscript

MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 5


class CategorizationError(Exception):
    pass

def get_genai_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


def categorize_transcript(client: genai.Client, model: str, prompt: str) -> dict:
    last_error: Exception | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtraccionTranscript,
                ),
            )
            
            validated = ExtraccionTranscript.model_validate_json(response.text)
            
            return validated.model_dump()

        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < MAX_ATTEMPTS:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    raise CategorizationError(f"Falló la categorización tras {MAX_ATTEMPTS} intentos: {last_error}")
