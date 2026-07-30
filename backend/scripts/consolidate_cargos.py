"""
Consolida la columna decisor_identificado a categorías cerradas.

Uso:
    python -m scripts.consolidate_cargos --table clients --batch-size 500
    python -m scripts.consolidate_cargos --table clients --dry-run
"""

import argparse
from typing import Dict, Optional

from data import db
from config import load_settings

# Mapeo case-insensitive: cargo detectado → categoría consolidada
MAPEO_CARGOS: Dict[str, str] = {
    # Dueño
    "dueño": "Dueño",
    "dueña": "Dueño",
    "propietario": "Dueño",
    "propietaria": "Dueño",
    "socio": "Dueño",
    "socia": "Dueño",
    # Director
    "director": "Director",
    "directora": "Director",
    "director general": "Director",
    "director ejecutivo": "Director",
    "directivo": "Director",
    "dirigente": "Director",
    "director de ti": "Director",
    "director de tecnología": "Director",
    "director de marketing": "Director",
    # Gerente
    "gerente": "Gerente",
    "gerenta": "Gerente",
    "gestor": "Gerente",
    "gestora": "Gerente",
    "gestor de clínica": "Gerente",
    # Administrador
    "administrador": "Administrador",
    "administradora": "Administrador",
    # Coordinador
    "coordinador": "Coordinador",
    "coordinadora": "Coordinador",
    "supervisor": "Coordinador",
    "supervisora": "Coordinador",
    "encargado de operaciones": "Coordinador",
    "encargada de operaciones": "Coordinador",
    "responsable de operaciones": "Coordinador",
    # Consultor
    "consultor": "Consultor",
    "consultora": "Consultor",
    "asesor": "Consultor",
    "asesora": "Consultor",
    # Vendedor
    "vendedor": "Vendedor",
    "vendedora": "Vendedor",
    "responsable de ventas": "Vendedor",
    # Responsable
    "responsable": "Responsable",
    "responsable de marketing": "Responsable",
    "responsable de atención al cliente": "Responsable",
    # Especialista
    "ingeniero": "Especialista",
    "ingeniera": "Especialista",
    "instructor": "Especialista",
    "instructora": "Especialista",
    "productor": "Especialista",
    "productora": "Especialista",
    "contador": "Especialista",
    "contadora": "Especialista",
}

CATEGORIAS_VALIDAS = set(MAPEO_CARGOS.values())


def consolidar(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    key = valor.strip().lower()
    return MAPEO_CARGOS.get(key, "Otro")


def main() -> None:
    parser = argparse.ArgumentParser(description="Consolida decisor_identificado a categorías cerradas")
    parser.add_argument("--table", required=True, help="Nombre de la tabla")
    parser.add_argument("--batch-size", type=int, default=500, help="Registros por página")
    parser.add_argument("--dry-run", action="store_true", help="Solo cuenta, no escribe")
    args = parser.parse_args()

    settings = load_settings()
    supabase = db.get_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    print(f"▶ Escaneando tabla '{args.table}'...")
    print(f"  Modo: {'DRY-RUN' if args.dry_run else 'LIVE'}")
    print()

    actualizados, limpios, fallidos = 0, 0, 0
    distribucion: Dict[str, int] = {}
    offset = 0
    page = 1

    while True:
        query = (
            supabase.table(args.table)
            .select("id,decisor_identificado")
            .order("id")
            .range(offset, offset + args.batch_size - 1)
        )

        response = query.execute()
        registros = getattr(response, "data", []) or []

        if not registros:
            break

        for reg in registros:
            reg_id = reg.get("id")
            original = reg.get("decisor_identificado")
            if not reg_id:
                continue

            consolidado = consolidar(original)

            # Conteo para reporte
            distribucion[consolidado or "(null)"] = distribucion.get(consolidado or "(null)", 0) + 1

            if consolidado == original:
                limpios += 1
                continue

            if args.dry_run:
                actualizados += 1
                continue

            try:
                result = (
                    supabase.table(args.table)
                    .update({"decisor_identificado": consolidado})
                    .eq("id", reg_id)
                    .execute()
                )
                if getattr(result, "data", None):
                    actualizados += 1
                else:
                    fallidos += 1
            except Exception as exc:
                print(f"  [ERROR] id={reg_id}: {exc}")
                fallidos += 1

        print(f"  Página {page}: {len(registros)} registros...")
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
    print()
    print("  Distribución final:")
    for cat, cnt in sorted(distribucion.items(), key=lambda x: -x[1]):
        print(f"    {cat:20s}: {cnt:5d}")


if __name__ == "__main__":
    main()
