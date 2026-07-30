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
from services.scoring import compute_readiness_score
from services.taxonomy import reconcile_list, _fold
import traceback
from app.state import _state, _state_lock, _taxonomy_lock


def _update_state(**kwargs) -> None:
    """Thread-safe state update."""
    with _state_lock:
        _state.update(kwargs)


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

    raw_integraciones_nuevas = necesidades.get("integraciones_nuevas") or []
    raw_casos_uso_nuevos = necesidades.get("raw_casos_uso_nuevos") or []
    raw_objeciones = intencion.get("objeciones_principales") or []
    canales_no_soportados_solicitados = (
        necesidades.get("canales_no_soportados_solicitados") or []
    )

    integraciones_nuevas = reconcile_list(
        raw_integraciones_nuevas, taxonomies.integraciones_nuevas
    )
    casos_uso_nuevos = reconcile_list(
        raw_casos_uso_nuevos, taxonomies.casos_uso_nuevos
    )
    canales_no_soportados_solicitados = reconcile_list(
        canales_no_soportados_solicitados, taxonomies.canales_no_soportados_solicitados
    )
    _extend_unique(taxonomies.casos_uso_nuevos, casos_uso_nuevos)
    _extend_unique(taxonomies.canales_no_soportados_solicitados, canales_no_soportados_solicitados)
    _extend_unique(taxonomies.integraciones_nuevas, integraciones_nuevas)

    reconciled_extraction = {
        **extraction,
        "perfil_cliente": {**perfil, "industria": perfil["industria"]},
        "necesidades_y_casos_uso": {
            **necesidades,
            "canales_deseados": necesidades.get("canales_deseados"),
            "integraciones_requeridas": necesidades.get("integraciones_requeridas"),
            "integraciones_nuevas": integraciones_nuevas,
            "casos_uso_principales": necesidades.get("casos_uso_principales"),
            "casos_uso_nuevos": casos_uso_nuevos,
        },
    }

    return {
        "csv_row_id": row.csv_row_id,
        "nombre_cliente": row.nombre_cliente,
        "telefono": row.telefono,
        "email": row.email,
        "vendedor": row.vendedor,
        "fecha_reunion": row.fecha_reunion,
        "cierre": row.cierre,
        "transcripcion": row.transcripcion,
        "industria": perfil["industria"],
        "sector_b2b_b2c": perfil["sector_b2b_b2c"],
        "tamano_empresa": perfil["tamano_empresa"],
        "decisor_identificado": perfil["decisor_identificado"],
        "volumen_consultas_mensual": perfil["volumen_consultas_mensual"],
        "canal_descubrimiento": perfil["canal_descubrimiento"],
        "tipo_canal": perfil["tipo_canal"],
        "area_negocio_principal": necesidades["area_negocio_principal"],
        "area_negocio_detalle": necesidades["area_negocio_detalle"],
        "canales_deseados": necesidades.get("canales_deseados"),
        "canales_no_soportados_solicitados": canales_no_soportados_solicitados,
        "casos_uso_principales": necesidades.get("casos_uso_principales"),
        "casos_uso_nuevos": casos_uso_nuevos,
        "integraciones_requeridas": necesidades.get("integraciones_requeridas"),
        "integraciones_nuevas": integraciones_nuevas,
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
        "raw_extraction": extraction,
    }


def _process_single_row(
    row: CsvRow, settings, genai_client, supabase, taxonomies
) -> None:
    # Early exit: si ya pidieron parar antes de que este hilo arranque, salimos
    with _state_lock:
        if _state["stop_requested"]:
            raise RuntimeError("Stop requested before LLM call")

    with _taxonomy_lock:
        prompt = build_prompt(row.transcripcion, taxonomies)
        print(prompt)

    # Segunda verificación justo antes del LLM (la parte más cara)
    with _state_lock:
        if _state["stop_requested"]:
            raise RuntimeError("Stop requested before LLM call")

    extraction = llm.categorize_transcript(genai_client, settings.gemma_model, prompt)

    with _taxonomy_lock:
        record = _build_record(row, extraction, taxonomies)
        db.insert_client(supabase, record)


def init_pipeline_state() -> dict:
    """
    Precarga el estado con total_csv y total_global_processed.
    Llamar esto al iniciar la aplicacion (on startup) para que
    el frontend pueda mostrar progreso global desde el minuto 0.
    """
    try:
        settings = load_settings()
        supabase = db.get_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        all_rows = read_csv_rows(settings.csv_path)
        processed_ids = db.get_processed_csv_row_ids(supabase)

        _update_state(
            total_csv=len(all_rows),
            total_global_processed=len(processed_ids),
            total_lote=0,
            processed=0,
            succeeded=0,
            failed=0,
            running=False,
            stop_requested=False,
            error=None,
        )
        return dict(_state)
    except Exception as e:
        _update_state(error=str(e))
        return dict(_state)


def run_pipeline(limit: Optional[int], workers: int) -> None:
    executor: ThreadPoolExecutor | None = None

    try:
        settings = load_settings()
        supabase = db.get_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
        genai_client = llm.get_genai_client(settings.gemini_api_key)

        # 1. Contar total CSV y ya procesados
        all_rows = read_csv_rows(settings.csv_path)
        processed_ids = db.get_processed_csv_row_ids(supabase)
        total_csv = len(all_rows)
        total_global_processed = len(processed_ids)

        # 2. Calcular pendientes y aplicar limit
        pending = [r for r in all_rows if r.csv_row_id not in processed_ids]
        if limit and limit > 0:
            pending = pending[:limit]
        total_lote = len(pending)

        print(f"Pipeline: {total_lote} filas en este lote (total CSV: {total_csv}, ya procesadas: {total_global_processed}).")

        # 3. Inicializar estado del lote
        _update_state(
            running=True,
            stop_requested=False,
            total_csv=total_csv,
            total_global_processed=total_global_processed,
            total_lote=total_lote,
            processed=0,
            succeeded=0,
            failed=0,
            error=None,
        )

        if total_lote == 0:
            print("Pipeline: no hay filas pendientes.")
            _update_state(running=False)
            return

        taxonomies = db.get_existing_taxonomies(supabase)

        # 4. Procesar en tandas del tamano de `workers`
        for i in range(0, len(pending), workers):
            with _state_lock:
                if _state["stop_requested"]:
                    print("Pipeline: detencion solicitada antes de iniciar tanda.")
                    break

            tanda = pending[i : i + workers]

            # NO usamos context manager para poder hacer shutdown(wait=False)
            executor = ThreadPoolExecutor(max_workers=workers)
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

            stopped_early = False

            try:
                for future in as_completed(futures):
                    with _state_lock:
                        _state["processed"] += 1

                    try:
                        future.result()
                        with _state_lock:
                            _state["succeeded"] += 1
                            _state["total_global_processed"] += 1
                    except Exception as error:  # noqa: BLE001
                        with _state_lock:
                            _state["failed"] += 1
                        # Solo loguear si NO fue por stop requested
                        if "Stop requested" not in str(error):
                            print(traceback.format_exc())
                            print(f"[ERROR] fila fallo: {error}")

                    # Verificar stop inmediatamente después de cada completado
                    with _state_lock:
                        if _state["stop_requested"]:
                            stopped_early = True
                            break

            finally:
                # Cancelar futures que aun no empezaron y NO esperar a los que corren
                if executor:
                    executor.shutdown(wait=False, cancel_futures=True)
                    executor = None

            if stopped_early:
                print("Pipeline: detencion inmediata ejecutada.")
                break

        # 5. Finalizar
        with _state_lock:
            _state["running"] = False
            _state["stop_requested"] = False
            print(f"Pipeline finalizado. {_state['succeeded']} exitosas, {_state['failed']} fallidas.")

    except Exception as error:  # noqa: BLE001
        print(f"[ERROR CRITICO] Pipeline fallo: {error}")
        _update_state(
            running=False,
            stop_requested=False,
            error=str(error),
        )
    finally:
        # Seguro por si quedo colgado
        if executor:
            executor.shutdown(wait=False, cancel_futures=True)