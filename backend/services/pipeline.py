"""
Logica del pipeline
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

from config import load_settings
from data import db
from data.csv_source import CsvRow, read_csv_rows
from ai import llm
from ai.prompt import build_prompt
from services.scoring import (
    KNOWN_CASOS_USO,
    KNOWN_INTEGRACIONES,
    compute_channels_not_supported,
    compute_readiness_score,
    derive_new_labels,
)
from services.taxonomy import reconcile_list, _fold
from app.state import _state, _state_lock, _taxonomy_lock


def _append_unique(pool: list[str], label: str) -> None:
    if label and not any(_fold(label) == _fold(existing) for existing in pool):
        pool.append(label)


def _extend_unique(pool: list[str], labels: list[str]) -> None:
    for label in labels:
        _append_unique(pool, label)


def _build_record(row: CsvRow, extraction: dict, taxonomies) -> dict:
    perfil = extraction["perfil_cliente"]
    necesidades = extraction["necesidades_y_casos_uso"]
    intencion = extraction["intencion_compra"]

    raw_canales = necesidades.get("canales_deseados") or []
    raw_integraciones = necesidades.get("integraciones_requeridas") or []
    raw_casos_uso = necesidades.get("casos_uso_principales") or []
    raw_objeciones = intencion.get("objeciones_principales") or []
    canales_no_soportados_solicitados = (
        necesidades.get("canales_no_soportados_solicitados") or []
    )

    canales_deseados = reconcile_list(raw_canales, taxonomies.canales_deseados)
    integraciones_requeridas = reconcile_list(
        raw_integraciones, taxonomies.integraciones_requeridas
    )
    casos_uso_principales = reconcile_list(
        raw_casos_uso, taxonomies.casos_uso_principales
    )

    _extend_unique(taxonomies.canales_deseados, canales_deseados)
    _extend_unique(taxonomies.integraciones_requeridas, integraciones_requeridas)
    _extend_unique(taxonomies.casos_uso_principales, casos_uso_principales)

    reconciled_extraction = {
        **extraction,
        "perfil_cliente": {**perfil, "industria": perfil["industria"]},
        "necesidades_y_casos_uso": {
            **necesidades,
            "canales_deseados": canales_deseados,
            "integraciones_requeridas": integraciones_requeridas,
            "casos_uso_principales": casos_uso_principales,
        },
    }

    return {
        "csv_row_id": row.csv_row_id,
        "nombre_cliente": row.nombre_cliente,
        "vendedor": row.vendedor,
        "fecha_reunion": row.fecha_reunion,
        "cierre": row.cierre,
        "industria": perfil["industria"],
        "sector_b2b_b2c": perfil["sector_b2b_b2c"],
        "tamano_empresa": perfil["tamano_empresa"],
        "decisor_identificado": perfil["decisor_identificado"],
        "volumen_consultas_mensual": perfil["volumen_consultas_mensual"],
        "canal_descubrimiento": perfil["canal_descubrimiento"],
        "tipo_canal": perfil["tipo_canal"],
        "area_negocio_principal": necesidades["area_negocio_principal"],
        "area_negocio_detalle": necesidades["area_negocio_detalle"],
        "canales_deseados": canales_deseados,
        "canales_no_soportados_solicitados": canales_no_soportados_solicitados,
        "casos_uso_principales": casos_uso_principales,
        "integraciones_requeridas": integraciones_requeridas,
        "dolor_explicito": intencion["dolor_explicito"],
        "urgencia": intencion["urgencia"],
        "complejidad_tecnica": intencion["complejidad_tecnica"],
        "objeciones_principales": raw_objeciones,
        "tono_deseado": intencion["tono_deseado"],
        "requiere_regulacion_compleja": intencion.get("requiere_regulacion_compleja"),
        "requiere_sistema_gestion_completo": intencion.get(
            "requiere_sistema_gestion_completo"
        ),
        "vambe_readiness_score": compute_readiness_score(reconciled_extraction),
        "canales_no_soportados": compute_channels_not_supported(canales_deseados),
        "casos_uso_nuevos": derive_new_labels(casos_uso_principales, KNOWN_CASOS_USO),
        "integraciones_nuevas": derive_new_labels(
            integraciones_requeridas, KNOWN_INTEGRACIONES
        ),
        "raw_extraction": extraction,
    }


def _process_single_row(
    row: CsvRow, settings, genai_client, supabase, taxonomies
) -> None:
    with _taxonomy_lock:
        prompt = build_prompt(row.transcripcion, taxonomies)

    extraction = llm.categorize_transcript(genai_client, settings.gemma_model, prompt)

    with _taxonomy_lock:
        record = _build_record(row, extraction, taxonomies)
        db.insert_client(supabase, record)


def run_pipeline(limit: Optional[int], workers: int) -> None:
    """Orquesta el pipeline completo en background."""
    try:
        settings = load_settings()
        supabase = db.get_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        genai_client = llm.get_genai_client(settings.gemini_api_key)

        all_rows = read_csv_rows(settings.csv_path)
        processed_ids = db.get_processed_csv_row_ids(supabase)
        pending = [r for r in all_rows if r.csv_row_id not in processed_ids]
        if limit:
            pending = pending[:limit]
        
        print(f"Pipeline: {len(pending)} filas pendientes de {len(all_rows)} totales.")

        with _state_lock:
            _state["total"] = len(pending)

        taxonomies = db.get_existing_taxonomies(supabase)

        # Somete en tandas del tamano de `workers`, chequeando stop_requested
        # entre tandas - asi una "detencion" deja terminar la tanda en curso
        # en vez de cortar una insercion a mitad de camino.
        for i in range(0, len(pending), workers):
            with _state_lock:
                if _state["stop_requested"]:
                    break

            tanda = pending[i : i + workers]
            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = {
                    executor.submit(
                        _process_single_row,
                        row,
                        settings,
                        genai_client,
                        supabase,
                        taxonomies,
                    ): row
                    for row in tanda
                }
                for future in as_completed(futures):
                    with _state_lock:
                        _state["processed"] += 1
                    try:
                        future.result()
                        with _state_lock:
                            _state["succeeded"] += 1
                    except Exception as error:  # noqa: BLE001
                        with _state_lock:
                            _state["failed"] += 1
                        print(f"[ERROR] fila fallo: {error}")

    except Exception as error:  # noqa: BLE001
        with _state_lock:
            _state["error"] = str(error)
    finally:
        with _state_lock:
            _state["running"] = False
            _state["stop_requested"] = False
