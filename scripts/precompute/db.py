from supabase import Client, create_client

from .taxonomy import ExistingTaxonomies


def get_client(url: str, service_role_key: str) -> Client:
    return create_client(url, service_role_key)


def get_processed_csv_row_ids(db: Client) -> set[int]:
    all_ids: set[int] = set()
    batch_size = 1000
    start = 0

    while True:
        result = (
            db.table("clients")
            .select("csv_row_id")
            .range(start, start + batch_size - 1)
            .execute()
        )
        rows = result.data or []
        
        all_ids.update(row["csv_row_id"] for row in rows)
        
        if len(rows) < batch_size:
            break
        
        start += batch_size

    return all_ids


def get_existing_taxonomies(db: Client) -> ExistingTaxonomies:
    """Scans the full table to dedupe distinct vocabulary values. Fine at demo
    volumes; replace with a Postgres view/RPC if this table grows large."""
    all_rows = []
    batch_size = 1000
    start = 0
    
    while True:
        result = (
            db.table("clients")
            .select("industria, canales_deseados, integraciones_requeridas, casos_uso_principales")
            .range(start, start + batch_size - 1)
            .execute()
        )
        rows = result.data or []
        all_rows.extend(rows)
        if len(rows) < batch_size:
            break
        start += batch_size

    def uniq_flat(lists: list[list[str] | None]) -> list[str]:
        return sorted({v for lst in lists if lst for v in lst})

    rows = all_rows
    return ExistingTaxonomies(
        canales_deseados=uniq_flat([r.get("canales_deseados") for r in rows]),
        integraciones_requeridas=uniq_flat([r.get("integraciones_requeridas") for r in rows]),
        casos_uso_principales=uniq_flat([r.get("casos_uso_principales") for r in rows]),
    )


def insert_client(db: Client, record: dict) -> None:
    db.table("clients").insert(record).execute()
