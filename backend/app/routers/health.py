"""
Healthcheck endpoint - sin autenticacion
"""
from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter(tags=["ops"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Healthcheck sin autenticar, para Railway/Fly.io",
)
def health():
    return {"status": "ok"}
