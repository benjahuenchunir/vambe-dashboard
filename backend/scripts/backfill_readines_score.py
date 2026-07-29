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
    supabase = db.get_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    actualizadas, fallidas = 0, 0

    for row in db.paginate(
        lambda: supabase.table("clients").select("id, raw_extraction").order("id")
    ):
        try:
            nuevo_score = compute_readiness_score(row["raw_extraction"])

            (
                supabase.table("clients")
                .update({"vambe_readiness_score": nuevo_score})
                .eq("id", row["id"])
                .execute()
            )

            actualizadas += 1

            if actualizadas % 1000 == 0:
                print(f"{actualizadas} filas procesadas...")

        except Exception as error:
            print(f"[ERROR] fila {row['id']}: {error}")
            fallidas += 1

    print(f"Listo. {actualizadas} actualizadas, {fallidas} fallidas.")


if __name__ == "__main__":
    main()