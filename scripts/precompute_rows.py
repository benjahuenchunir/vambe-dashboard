import argparse
import sys
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed

from precompute import db, llm
from precompute.config import load_settings
from precompute.csv_source import CsvRow, read_csv_rows
from precompute.prompt import build_prompt
from precompute.scoring import (
    KNOWN_CASOS_USO,
    KNOWN_INTEGRACIONES,
    compute_channels_not_supported,
    compute_readiness_score,
    derive_new_labels,
)
from precompute.taxonomy import reconcile_label, reconcile_list, _fold

# Candado global para evitar condiciones de carrera al modificar taxonomies
taxonomy_lock = threading.Lock()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Categoriza transcripciones de Vambe con Gemma 4.")
    parser.add_argument("--csv", help="Ruta al CSV (default: CSV_PATH del .env).")
    parser.add_argument("--limit", type=int, help="Procesa como máximo N filas pendientes en esta corrida.")
    parser.add_argument("--workers", type=int, default=1, help="Número de peticiones en paralelo (default: 1).")
    return parser.parse_args()


def _build_record(row: CsvRow, extraction: dict, taxonomies) -> dict:
    perfil = extraction["perfil_cliente"]
    necesidades = extraction["necesidades_y_casos_uso"]
    intencion = extraction["intencion_compra"]

    raw_canales = necesidades.get("canales_deseados") or []
    raw_integraciones = necesidades.get("integraciones_requeridas") or []
    raw_casos_uso = necesidades.get("casos_uso_principales") or []
    raw_objeciones = intencion.get("objeciones_principales") or []
    canales_no_soportados_solicitados = necesidades.get("canales_no_soportados_solicitados") or []

    # Reconciliación (usa el pool cargado desde DB al inicio de la corrida)
    industria = reconcile_label(perfil["industria"], taxonomies.industria)
    canales_deseados = reconcile_list(raw_canales, taxonomies.canales_deseados)
    integraciones_requeridas = reconcile_list(raw_integraciones, taxonomies.integraciones_requeridas)
    casos_uso_principales = reconcile_list(raw_casos_uso, taxonomies.casos_uso_principales)

    _append_unique(taxonomies.industria, industria)
    _extend_unique(taxonomies.canales_deseados, canales_deseados)
    _extend_unique(taxonomies.integraciones_requeridas, integraciones_requeridas)
    _extend_unique(taxonomies.casos_uso_principales, casos_uso_principales)

    reconciled_extraction = {
        **extraction,
        "perfil_cliente": {**perfil, "industria": industria},
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
        "industria": industria,
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
        "requiere_sistema_gestion_completo": intencion.get("requiere_sistema_gestion_completo"),
        "vambe_readiness_score": compute_readiness_score(reconciled_extraction),
        "canales_no_soportados": compute_channels_not_supported(canales_deseados),
        "casos_uso_nuevos": derive_new_labels(casos_uso_principales, KNOWN_CASOS_USO),
        "integraciones_nuevas": derive_new_labels(integraciones_requeridas, KNOWN_INTEGRACIONES),
        "raw_extraction": extraction,
    }

def _append_unique(pool: list[str], label: str) -> None:
    if label and not any(_fold(label) == _fold(existing) for existing in pool):
        pool.append(label)

def _extend_unique(pool: list[str], labels: list[str]) -> None:
    for label in labels:
        _append_unique(pool, label)


def process_single_row(row: CsvRow, settings, genai_client, supabase, taxonomies) -> tuple[str, str]:
    # 1. Generar prompt (lectura de taxonomies protegida por Lock)
    with taxonomy_lock:
        prompt = build_prompt(row.transcripcion, taxonomies)
    
    # 2. Llamada a la API de LLM (Esto se ejecuta en paralelo sin bloquear los otros hilos)
    extraction = llm.categorize_transcript(genai_client, settings.gemma_model, prompt)

    # 3. Construir e insertar registro (actualización de taxonomies y DB protegida)
    with taxonomy_lock:
        record = _build_record(row, extraction, taxonomies)
        db.insert_client(supabase, record)

    return row.csv_row_id, row.nombre_cliente


def run() -> None:
    args = parse_args()
    settings = load_settings()
    csv_path = args.csv or settings.csv_path

    supabase = db.get_client(settings.supabase_url, settings.supabase_service_role_key)
    genai_client = llm.get_genai_client(settings.gemini_api_key)

    all_rows = read_csv_rows(csv_path)
    processed_ids = db.get_processed_csv_row_ids(supabase)
    pending = [r for r in all_rows if r.csv_row_id not in processed_ids]

    if args.limit:
        pending = pending[: args.limit]

    print(f"{len(all_rows)} filas en el CSV, {len(processed_ids)} ya procesadas, {len(pending)} a procesar ahora.")
    if not pending:
        return

    taxonomies = db.get_existing_taxonomies(supabase)

    succeeded, failed = 0, 0
    total = len(pending)

    # Procesamiento paralelo controlado por --workers (default: 3 para no saturar Free Tier)
    print(f"Procesando con {args.workers} hilos en paralelo...")

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(process_single_row, row, settings, genai_client, supabase, taxonomies): row
            for row in pending
        }

        for i, future in enumerate(as_completed(futures), start=1):
            row = futures[future]
            try:
                row_id, nombre = future.result()
                succeeded += 1
                print(f"[{i}/{total}] fila {row_id} OK ({nombre})")
            except Exception as error:  # noqa: BLE001
                failed += 1
                print(f"[{i}/{total}] fila {row.csv_row_id} FALLÓ: {error}\n{traceback.format_exc()}", file=sys.stderr)

    print(f"Listo. {succeeded} insertadas, {failed} fallidas (se reintentarán en la próxima corrida).")


if __name__ == "__main__":
    run()