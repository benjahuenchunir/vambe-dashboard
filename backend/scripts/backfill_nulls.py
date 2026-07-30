"""
Backfill: reemplaza valores legacy 'no_mencionado', 'no_inferible', 'no_inferido'
(case-insensitive) por null en columnas planas (text, boolean, text[]) y dentro
del JSONB raw_extraction.

Ejecuta UNA sola vez.

Uso:
    python -m scripts.backfill_nulls_v2 --table clients --batch-size 500
    python -m scripts.backfill_nulls_v2 --table clients --dry-run
"""

import argparse
from typing import Any, Set, Tuple

from data import db
from config import load_settings

# ── Valores legacy (case-insensitive) ──
VALORES_LEGACY: Set[str] = {
    "no_mencionado",
    "no_inferible",
    "no_inferido",
}

# ── Columnas planas de tipo text ──
TEXT_COLUMNS = [
    "industria",
    "sector_b2b_b2c",
    "tamano_empresa",
    "decisor_identificado",
    "canal_descubrimiento",
    "tipo_canal",
    "area_negocio_principal",
    "urgencia",
    "complejidad_tecnica",
    "tono_deseado",
]

# ── Columnas planas de tipo text[] ──
ARRAY_COLUMNS = [
    "canales_deseados",
    "canales_no_soportados_solicitados",
    "casos_uso_principales",
    "integraciones_requeridas",
    "objeciones_principales",
    "casos_uso_nuevos",
    "integraciones_nuevas",
]

# ── Rutas dentro de raw_extraction (JSONB) que son text/boolean ──
JSONB_TEXT_PATHS = [
    "perfil_cliente.industria",
    "perfil_cliente.sector_b2b_b2c",
    "perfil_cliente.tamano_empresa",
    "perfil_cliente.decisor_identificado",
    "perfil_cliente.canal_descubrimiento",
    "perfil_cliente.tipo_canal",
    "necesidades_y_casos_uso.area_negocio_principal",
    "intencion_compra.urgencia",
    "intencion_compra.complejidad_tecnica",
    "intencion_compra.tono_deseado",
    "intencion_compra.dolor_explicito",
    "intencion_compra.requiere_regulacion_compleja",
    "intencion_compra.requiere_sistema_gestion_completo",
]

# ── Rutas dentro de raw_extraction (JSONB) que son arrays ──
JSONB_ARRAY_PATHS = [
    "necesidades_y_casos_uso.canales_deseados",
    "necesidades_y_casos_uso.canales_no_soportados_solicitados",
    "necesidades_y_casos_uso.casos_uso_principales",
    "necesidades_y_casos_uso.integraciones_requeridas",
    "intencion_compra.objeciones_principales",
]


def _is_legacy(val: Any) -> bool:
    return isinstance(val, str) and val.strip().lower() in VALORES_LEGACY


def clean_text(val: Any) -> Tuple[Any, bool]:
    """Devuelve (valor, cambió)."""
    if _is_legacy(val):
        return None, True
    return val, False


def clean_array(val: Any) -> Tuple[Any, bool]:
    """Filtra elementos legacy de un array. Devuelve (valor, cambió)."""
    if not isinstance(val, list):
        return val, False
    filtered = [v for v in val if not _is_legacy(v)]
    return filtered, len(filtered) != len(val)


def clean_jsonb_text(obj: dict, path: str) -> bool:
    keys = path.split(".")
    for key in keys[:-1]:
        if not isinstance(obj, dict) or key not in obj:
            return False
        obj = obj[key]
    last = keys[-1]
    if last not in obj:
        return False
    if _is_legacy(obj[last]):
        obj[last] = None
        return True
    return False


def clean_jsonb_array(obj: dict, path: str) -> bool:
    keys = path.split(".")
    for key in keys[:-1]:
        if not isinstance(obj, dict) or key not in obj:
            return False
        obj = obj[key]
    last = keys[-1]
    if last not in obj or not isinstance(obj[last], list):
        return False
    filtered = [v for v in obj[last] if not _is_legacy(v)]
    if len(filtered) != len(obj[last]):
        obj[last] = filtered
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill: limpia valores legacy de text, text[] y JSONB."
    )
    parser.add_argument("--table", required=True, help="Nombre de la tabla")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Registros por página (default: 500)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="No escribe a la DB; solo cuenta",
    )
    args = parser.parse_args()

    settings = load_settings()
    supabase = db.get_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    print(f"▶ Escaneando tabla '{args.table}'...")
    print(f"  Modo: {'DRY-RUN (solo lectura)' if args.dry_run else 'LIVE (escritura)'}")
    print(f"  Batch size: {args.batch_size}")
    print()

    actualizados, limpios, fallidos = 0, 0, 0
    offset = 0
    page = 1

    while True:
        query = (
            supabase.table(args.table)
            .select("*")
            .order("id")
            .range(offset, offset + args.batch_size - 1)
        )

        response = query.execute()
        registros = getattr(response, "data", []) or []

        if not registros:
            break

        for reg in registros:
            reg_id = reg.get("id")
            if not reg_id:
                continue

            update_data = {}
            changed = False

            # ── 1. Columnas planas: text ──
            for col in TEXT_COLUMNS:
                val = reg.get(col)
                cleaned, did_change = clean_text(val)
                if did_change:
                    update_data[col] = cleaned
                    changed = True

            # ── 2. Columnas planas: text[] ──
            for col in ARRAY_COLUMNS:
                val = reg.get(col)
                cleaned, did_change = clean_array(val)
                if did_change:
                    update_data[col] = cleaned
                    changed = True

            # ── 3. JSONB raw_extraction ──
            raw = reg.get("raw_extraction")
            if isinstance(raw, dict):
                raw_changed = False
                for path in JSONB_TEXT_PATHS:
                    if clean_jsonb_text(raw, path):
                        raw_changed = True
                for path in JSONB_ARRAY_PATHS:
                    if clean_jsonb_array(raw, path):
                        raw_changed = True
                if raw_changed:
                    update_data["raw_extraction"] = raw
                    changed = True

            if not changed:
                limpios += 1
                continue

            if args.dry_run:
                actualizados += 1
                continue

            try:
                result = (
                    supabase.table(args.table)
                    .update(update_data)
                    .eq("id", reg_id)
                    .execute()
                )
                if getattr(result, "data", None):
                    actualizados += 1
                else:
                    print(f"  [WARN] id={reg_id}: update sin retorno")
                    fallidos += 1
            except Exception as exc:
                print(f"  [ERROR] id={reg_id}: {exc}")
                fallidos += 1

        print(f"  Página {page}: {len(registros)} registros evaluados...")
        page += 1

        if len(registros) < args.batch_size:
            break
        offset += args.batch_size

    print()
    print("═" * 50)
    print(f"  ACTUALIZADOS : {actualizados}")
    print(f"  SIN CAMBIOS  : {limpios}")
    print(f"  FALLIDOS     : {fallidos}")
    print("═" * 50)


if __name__ == "__main__":
    main()
