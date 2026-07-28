from supabase import Client, create_client

from .taxonomy import ExistingTaxonomies


def get_client(url: str, service_role_key: str) -> Client:
    return create_client(url, service_role_key)


def get_processed_csv_row_ids(db: Client) -> set[int]:
    result = db.table("clients").select("csv_row_id").execute()
    return {row["csv_row_id"] for row in result.data}


def get_existing_taxonomies(db: Client) -> ExistingTaxonomies:
    """Scans the full table to dedupe distinct vocabulary values. Fine at demo
    volumes; replace with a Postgres view/RPC if this table grows large."""
    result = db.table("clients").select(
        "industria, canal_descubrimiento, canales_deseados, integraciones_requeridas, casos_uso_principales"
    ).execute()

    def uniq(values: list[str | None]) -> list[str]:
        return sorted({v for v in values if v})

    def uniq_flat(lists: list[list[str] | None]) -> list[str]:
        return sorted({v for lst in lists if lst for v in lst})

    rows = result.data
    return ExistingTaxonomies(
        industria=uniq([r.get("industria") for r in rows]),
        canal_descubrimiento=uniq([r.get("canal_descubrimiento") for r in rows]),
        canales_deseados=uniq_flat([r.get("canales_deseados") for r in rows]),
        integraciones_requeridas=uniq_flat([r.get("integraciones_requeridas") for r in rows]),
        casos_uso_principales=uniq_flat([r.get("casos_uso_principales") for r in rows]),
    )


def insert_client(db: Client, record: dict) -> None:
    db.table("clients").insert(record).execute()
