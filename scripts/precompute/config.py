import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno {name}. Revisa tu .env (ver .env.example).")
    return value


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    supabase_url: str
    supabase_service_role_key: str
    gemma_model: str
    csv_path: str


def load_settings() -> Settings:
    return Settings(
        gemini_api_key=_require("GEMINI_API_KEY"),
        supabase_url=_require("SUPABASE_URL"),
        supabase_service_role_key=_require("SUPABASE_SERVICE_ROLE_KEY"),
        gemma_model=os.environ.get("GEMMA_MODEL", "gemma-4-26b-a4b-it"),
        csv_path=os.environ.get("CSV_PATH", "vambe_clients_10k.csv"),
    )
