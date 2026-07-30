import csv
from dataclasses import dataclass


@dataclass(frozen=True)
class CsvRow:
    csv_row_id: int
    nombre_cliente: str
    telefono: str
    email: str
    vendedor: str
    fecha_reunion: str  # ISO date, e.g. "2024-02-15"
    cierre: bool
    transcripcion: str


COLUMN_MAP = {
    "id": "ID",
    "nombre": "Nombre",
    "vendedor": "Vendedor asignado",
    "fecha": "Fecha de la Reunion",
    "cierre": "closed",
    "transcripcion": "Transcripcion",
    "telefono": "Numero de Telefono",
    "email": "Correo Electronico",
}


def read_csv_rows(path: str) -> list[CsvRow]:
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = [_parse_row(i, row) for i, row in enumerate(reader)]
    return rows

def _parse_row(index: int, row: dict) -> CsvRow:
    return CsvRow(
        csv_row_id=index,
        nombre_cliente=row[COLUMN_MAP["nombre"]].strip(),
        telefono=row[COLUMN_MAP["telefono"]].strip(),
        email=row[COLUMN_MAP["email"]].strip(),
        vendedor=row[COLUMN_MAP["vendedor"]].strip(),
        fecha_reunion=row[COLUMN_MAP["fecha"]].strip(),
        cierre=row[COLUMN_MAP["cierre"]].strip() == "1",
        transcripcion=row[COLUMN_MAP["transcripcion"]].strip(),
    )
