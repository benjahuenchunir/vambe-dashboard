from supabase import Client, create_client

from services.taxonomy import ExistingTaxonomies
from collections.abc import Callable, Iterator
from typing import Any


def get_client(url: str, service_role_key: str) -> Client:
    return create_client(url, service_role_key)

def paginate(
    query_factory: Callable[[], Any],
    batch_size: int = 1000,
) -> Iterator[dict]:
    start = 0

    while True:
        result = (
            query_factory()
            .range(start, start + batch_size - 1)
            .execute()
        )

        rows = result.data or []
        yield from rows

        if len(rows) < batch_size:
            break

        start += batch_size


def get_processed_csv_row_ids(db: Client) -> set[int]:
    return {
        row["csv_row_id"]
        for row in paginate(
            lambda: db.table("clients").select("csv_row_id").order("fecha_reunion", desc=True).order("id")
        )
    }


def get_existing_taxonomies(db: Client) -> ExistingTaxonomies:
    """Scans the full table to dedupe distinct vocabulary values."""

    rows = list(
        paginate(
            lambda: db.table("clients").select(
                "casos_uso_principales, canales_no_soportados_solicitados"
            ).order("fecha_reunion", desc=True).order("id")
        )
    )

    def uniq_flat(lists: list[list[str] | None]) -> list[str]:
        return sorted({v for lst in lists if lst for v in lst})

    return ExistingTaxonomies(
        casos_uso_principales=uniq_flat(
            [r.get("casos_uso_principales") for r in rows]
        ),
        canales_no_soportados_solicitados=uniq_flat(
            [r.get("canales_no_soportados_solicitados") for r in rows]
        ),
    )


def insert_client(db: Client, record: dict) -> None:
    db.table("clients").insert(record).execute()
