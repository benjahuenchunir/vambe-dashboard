import csv
from dataclasses import dataclass


@dataclass(frozen=True)
class CsvRow:
    csv_row_id: int
    nombre_cliente: str
    vendedor: str
    fecha_reunion: str  # ISO date, e.g. "2024-02-15"
    cierre: bool
    transcripcion: str


# The sample CSV uses these exact headers. Adjust here if the real file differs.
COLUMN_MAP = {
    "id": "ID",
    "nombre": "Nombre",
    "vendedor": "Vendedor asignado",
    "fecha": "Fecha de la Reunion",
    "cierre": "closed",
    "transcripcion": "Transcripcion",
}


def read_csv_rows(path: str) -> list[CsvRow]:
    """Reads the CSV with a UTF-8-first, Latin-1-fallback strategy (the sample
    file has mojibake like 'RodrÃ­guez', suggesting inconsistent encoding)."""
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            with open(path, encoding=encoding, newline="") as f:
                reader = csv.DictReader(f)
                rows = [_parse_row(i, row) for i, row in enumerate(reader)]
            return rows
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"No se pudo leer {path} ni como utf-8-sig ni como latin-1.")


def _parse_row(index: int, row: dict) -> CsvRow:
    return CsvRow(
        csv_row_id=index,
        nombre_cliente=row[COLUMN_MAP["nombre"]].strip(),
        vendedor=row[COLUMN_MAP["vendedor"]].strip(),
        fecha_reunion=row[COLUMN_MAP["fecha"]].strip(),
        cierre=row[COLUMN_MAP["cierre"]].strip() == "1",
        transcripcion=row[COLUMN_MAP["transcripcion"]].strip(),
    )
