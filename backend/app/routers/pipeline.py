"""
Endpoints de orquestacion del pipeline de categorizacion.
"""
import threading

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import verify_secret
from app.schemas import ActionResponse, PipelineStatusResponse, ProcessRequest
from app.state import _state, _state_lock
from services.pipeline import run_pipeline

router = APIRouter(prefix="/process", tags=["pipeline"])


@router.post(
    "/start",
    response_model=ActionResponse,
    summary="Inicia una corrida de categorizacion",
    description=(
        "Procesa hasta `limit` filas pendientes del CSV (todas si se omite), "
        "con `workers` hilos en paralelo. Falla con 409 si ya hay un job corriendo. "
        "El progreso se consulta con GET /process/status."
    ),
)
def start_process(req: ProcessRequest, _=Depends(verify_secret)):
    with _state_lock:
        if _state["running"]:
            raise HTTPException(status_code=409, detail="Ya hay un proceso corriendo.")
        _state.update(
            running=True,
            stop_requested=False,
            total=0,
            processed=0,
            succeeded=0,
            failed=0,
            error=None,
        )

    thread = threading.Thread(
        target=run_pipeline,
        args=(req.limit, req.workers),
        daemon=True,
    )
    thread.start()
    return {"status": "started"}


@router.post(
    "/stop",
    response_model=ActionResponse,
    summary="Detiene el job en curso",
    description=(
        "Marca stop_requested=true; el job termina la tanda de filas ya en vuelo "
        "(no corta una insercion a mitad de camino) y luego se detiene. "
        "Falla con 409 si no hay ningun job corriendo."
    ),
)
def stop_process(_=Depends(verify_secret)):
    with _state_lock:
        if not _state["running"]:
            raise HTTPException(status_code=409, detail="No hay ningun proceso corriendo.")
        _state["stop_requested"] = True
    return {"status": "stopping"}


@router.get(
    "/status",
    response_model=PipelineStatusResponse,
    summary="Estado del job actual (o del ultimo terminado)",
)
def get_status(_=Depends(verify_secret)):
    with _state_lock:
        return dict(_state)
