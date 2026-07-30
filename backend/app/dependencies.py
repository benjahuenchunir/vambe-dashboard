"""
Dependencias reutilizables para inyeccion via FastAPI Depends().
"""
from fastapi import Header, HTTPException

from config import load_settings


def verify_secret(x_pipeline_secret: str = Header(...)) -> None:
    """Valida el header x-pipeline-secret contra el secreto configurado."""
    settings = load_settings()
    if x_pipeline_secret != settings.pipeline_api_secret:
        raise HTTPException(status_code=401, detail="unauthorized")
