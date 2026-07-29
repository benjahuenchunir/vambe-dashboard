"""
Backfill: reemplaza valores legacy 'no_mencionado', 'no_inferible' (y cualquier variante
mayúscula/minúscula como 'No_inferible', 'NO_INFERIDO') por null en la base de datos.

Ejecuta UNA sola vez. No necesitas especificar columnas; ya están todas hardcodeadas.

Uso con columna JSONB:
    python -m scripts.backfill_nulls \
        --table extracciones \
        --json-column extraccion \
        --batch-size 500

Uso con columnas planas:
    python -m scripts.backfill_nulls \
        --table extracciones \
        --batch-size 500

Dry-run (no escribe nada):
    python -m scripts.backfill_nulls \
        --table extracciones \
        --json-column extraccion \
        --dry-run
"""

import argparse
from typing import Any, Set

from data import db
from config import load_settings

# ── CONFIGURACIÓN: rutas a limpiar (todas las que usaban null antes) ──
PATHS_A_LIMPIAR = [
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

VALORES_LEGACY: Set[str] = {
    "no_mencionado",
    "no_inferible",
    "no_inferido",
}


def _is_legacy(val: Any) -> bool:
    return isinstance(val, str) and val.strip().lower() in VALORES_LEGACY


def set_nested(obj: dict, path: str, value: Any) -> bool:
    keys = path.split(".")
    for key in keys[:-1]:
        if key not in obj:
            obj[key] = {}
        obj = obj[key]
    last = keys[-1]
    if last in obj and _is_legacy(obj[last]):
        obj[last] = value
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill: convierte valores legacy a null (case-insensitive). "
                    "No requiere especificar columnas; limpia todas las rutas definidas."
    )
    parser.add_argument("--table", required=True, help="Nombre de la tabla")
    parser.add_argument(
        "--json-column",
        default=None,
        help="Nombre de la columna JSONB (ej: extraccion). Si se omite, asume columnas planas.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Registros por página (default: 500)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="No escribe a la DB; solo muestra conteo estimado",
    )
    args = parser.parse_args()

    settings = load_settings()
    supabase = db.get_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    print(f"▶ Escaneando tabla '{args.table}'...")
    print(f"  Modo: {'DRY-RUN (solo lectura)' if args.dry_run else 'LIVE (escritura)'}")
    print(f"  Columna JSONB: {args.json_column or '(ninguna, columnas planas)'}")
    print(f"  Batch size: {args.batch_size}")
    print()

    actualizados, limpios, fallidos = 0, 0, 0
    offset = 0
    page = 1

    while True:
        # Offset pagination: funciona con UUIDs, strings, cualquier tipo de id
        query = (
            supabase.table(args.table)
            .select("id" + (f",{args.json_column}" if args.json_column else ""))
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

            # ── Determinar payload a mutar ──
            if args.json_column:
                payload = reg.get(args.json_column) or {}
                if not isinstance(payload, dict):
                    continue
                modificado = False
                for path in PATHS_A_LIMPIAR:
                    if set_nested(payload, path, None):
                        modificado = True
                if not modificado:
                    limpios += 1
                    continue
                update_payload = {args.json_column: payload}
            else:
                payload = dict(reg)
                modificado = False
                for path in PATHS_A_LIMPIAR:
                    if set_nested(payload, path, None):
                        modificado = True
                if not modificado:
                    limpios += 1
                    continue
                update_payload = {k: v for k, v in payload.items() if k != "id"}

            if args.dry_run:
                actualizados += 1
                continue

            # ── Escritura ──
            try:
                result = (
                    supabase.table(args.table)
                    .update(update_payload)
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