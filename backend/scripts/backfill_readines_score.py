"""
Recalcula vambe_readiness_score para todas las filas ya existentes, usando
raw_extraction (la respuesta cruda del LLM ya guardada) — no vuelve a llamar
a la API. Corre esto una vez después de actualizar los pesos en scoring.py.

Uso: python -m processing.backfill_readiness_score
"""

from data import db
from config import load_settings
from services.scoring import compute_readiness_score


def main() -> None:
    settings = load_settings()
    supabase = db.get_client(settings.supabase_url, settings.supabase_service_role_key)

    batch_size = 1000
    start = 0
    actualizadas, fallidas = 0, 0

    while True:
        result = (
            supabase.table("clients")
            .select("id, raw_extraction")
            .range(start, start + batch_size - 1)
            .execute()
        )

        rows = result.data or []

        if not rows:
            break

        print(f"Procesando filas {start}–{start + len(rows) - 1}...")

        for row in rows:
            try:
                nuevo_score = compute_readiness_score(row["raw_extraction"])
                (
                    supabase.table("clients")
                    .update({"vambe_readiness_score": nuevo_score})
                    .eq("id", row["id"])
                    .execute()
                )
                actualizadas += 1
            except Exception as error:  # noqa: BLE001
                print(f"[ERROR] fila {row['id']}: {error}")
                fallidas += 1

        if len(rows) < batch_size:
            break

        start += batch_size

    print(f"Listo. {actualizadas} actualizadas, {fallidas} fallidas.")


if __name__ == "__main__":
    main()