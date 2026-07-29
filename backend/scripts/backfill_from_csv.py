"""
Lee un CSV con columnas id, telefono, email, transcripcion y actualiza
esos campos en la tabla clients.

Uso:
    python -m scripts.backfill_from_csv --csv data/vambe_clients_10k.csv
"""

import argparse
from data import db, csv_source
from config import load_settings


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill telefono, email, transcripcion desde CSV"
    )
    parser.add_argument("--csv", required=True, help="Ruta al archivo CSV")
    parser.add_argument(
        "--id-column",
        default="id",
        help="Columna del CSV que coincide con clients.id (default: id)",
    )
    args = parser.parse_args()

    settings = load_settings()
    supabase = db.get_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    actualizadas, fallidas, no_encontradas = 0, 0, 0

    rows = csv_source.read_csv_rows(args.csv)

    for i, row in enumerate(rows, start=1):
        try:
            row_id = row.csv_row_id
            if not row_id:
                print(f"[WARN] fila {i}: sin '{args.id_column}', saltando")
                no_encontradas += 1
                continue

            # Solo enviamos campos que vengan con valor en el CSV
            update_data = {}
            for col in ("telefono", "email", "transcripcion"):
                val = row.__getattribute__(col)
                if val:
                    update_data[col] = val

            if not update_data:
                continue

            result = (
                supabase.table("clients")
                .update(update_data)
                .eq("csv_row_id", row_id)
                .execute()
            )

            # Si no hay data de vuelta, la fila no existía
            if not getattr(result, "data", None):
                print(f"[WARN] fila {i}: id {row_id} no encontrado en DB")
                no_encontradas += 1
                continue

            actualizadas += 1
            if actualizadas % 1000 == 0:
                print(f"{actualizadas} filas actualizadas...")

        except Exception as error:
            print(f"[ERROR] fila {i} (id {row.csv_row_id}): {error}")
            fallidas += 1

    print(
        f"Listo. {actualizadas} actualizadas, "
        f"{fallidas} fallidas, {no_encontradas} no encontradas."
    )


if __name__ == "__main__":
    main()