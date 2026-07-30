"""
Pydantic schemas (request/response models).
Centraliza todos los contratos de la API.
"""
from pydantic import BaseModel


class ProcessRequest(BaseModel):
    limit: int | None = None
    workers: int = 1


class ActionResponse(BaseModel):
    status: str


class PipelineStatusResponse(BaseModel):
    running: bool
    stop_requested: bool
    total_csv: int
    total_global_processed: int
    total_lote: int
    processed: int
    succeeded: int
    failed: int
    error: str | None


class HealthResponse(BaseModel):
    status: str
