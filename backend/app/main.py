"""
FastAPI application factory.
Expone endpoints start/stop/status para que el dashboard de Next.js pueda
manejar corridas largas de LLM sin toparse con los limites de tiempo de las
funciones serverless de Vercel.

Local: uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, pipeline
from config import load_settings
from services.pipeline import init_pipeline_state


def create_app() -> FastAPI:
    app = FastAPI(
        title="Vambe Pipeline API",
        description=(
            "Orquesta el pipeline de categorizacion de transcripciones (LLM + Supabase). "
            "Endpoints protegidos con el header `x-pipeline-secret`, salvo `/health`. "
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    settings = load_settings()
    allowed_origins = [
        o.strip()
        for o in settings.allowed_origins
        if o.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["x-pipeline-secret", "Content-Type"],
    )

    app.include_router(health.router)
    app.include_router(pipeline.router)

    return app


app = create_app()

@app.on_event("startup")
async def startup():
    init_pipeline_state()
