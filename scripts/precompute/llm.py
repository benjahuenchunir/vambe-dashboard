import re
import time

from google import genai
from google.genai import types
from google.genai.errors import APIError

from precompute.response_model import ExtraccionTranscript

MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 5


class CategorizationError(Exception):
    pass


def get_genai_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


def _clean_json_text(raw_text: str | None) -> str:
    """Remueve bloques de código markdown (```json ... ```) si el LLM los incluye."""
    if not raw_text:
        return ""
    text = raw_text.strip()
    # Elimina ```json o ``` al inicio
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    # Elimina ``` al final
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


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
                    max_output_tokens=8192,
                    temperature=0.1 if attempt == 1 else 0.0,
                ),
            )

            candidate = response.candidates[0] if response.candidates else None
            finish_reason = str(candidate.finish_reason) if candidate and candidate.finish_reason else "Desconocida"

            if "MAX_TOKENS" in finish_reason:
                raise ValueError(f"Truncada por límite de tokens (finish_reason: {finish_reason})")
            if "RECITATION" in finish_reason:
                raise ValueError(f"Bloqueada por recitación (finish_reason: {finish_reason})")
            if not response.text:
                raise ValueError(f"Respuesta vacía o bloqueada (finish_reason: {finish_reason})")

            clean_text = _clean_json_text(response.text)
            validated = ExtraccionTranscript.model_validate_json(clean_text)
            return validated.model_dump()

        except APIError as error:
            last_error = error
            if error.code == 429:
                sleep_time = 15 * attempt  # 15s, 30s
                print(f"[RATE LIMIT] 429 alcanzado. Esperando {sleep_time}s...")
            else:
                sleep_time = RETRY_BACKOFF_SECONDS * attempt
                print(f"[API ERROR] Error en la API ({error.code}): {error}. Esperando {sleep_time}s...")

            if attempt < MAX_ATTEMPTS:
                time.sleep(sleep_time)

        except Exception as error:
            print(f"[ERROR] Intento {attempt}/{MAX_ATTEMPTS}: {error}")
            last_error = error
            if attempt < MAX_ATTEMPTS:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    raise CategorizationError(f"Falló tras {MAX_ATTEMPTS} intentos: {last_error}")