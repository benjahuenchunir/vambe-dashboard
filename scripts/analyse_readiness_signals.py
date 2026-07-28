"""
Analiza qué señales de la extracción del LLM realmente correlacionan con el
cierre (`cierre` = true), usando los datos ya categorizados en Supabase.

El vambe_readiness_score actual (scoring.py) fue diseñado con pesos elegidos
a mano, sin verificar contra los resultados reales. Este script calcula el
lift real (tasa de cierre del grupo - tasa de cierre general) de cada señal
candidata, para poder recalibrar los pesos con datos en vez de intuición.

Uso: python -m precompute.analyze_readiness_signals
"""

from collections import defaultdict

from precompute import db
from precompute.config import load_settings
from precompute.scoring import normalize_text, SUPPORTED_CHANNELS

MIN_SAMPLE = 15  # ignora grupos con muy pocos casos, poco confiables


def _tasa_cierre(rows: list[dict]) -> float:
    if not rows:
        return 0.0
    return round(100 * sum(1 for r in rows if r["cierre"]) / len(rows), 1)


def _reporte_categorico(nombre: str, rows: list[dict], key_fn, baseline: float) -> None:
    grupos: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        grupos[key_fn(r)].append(r)

    print(f"\n=== {nombre} ===")
    for valor, subset in sorted(grupos.items(), key=lambda kv: -_tasa_cierre(kv[1])):
        if len(subset) < MIN_SAMPLE:
            continue
        tasa = _tasa_cierre(subset)
        lift = round(tasa - baseline, 1)
        signo = "+" if lift >= 0 else ""
        print(f"  {valor:<40} n={len(subset):>4}  tasa={tasa:>5.1f}%  lift={signo}{lift}pp")


def _reporte_binario(nombre: str, rows: list[dict], predicate, baseline: float) -> None:
    con = [r for r in rows if predicate(r)]
    sin = [r for r in rows if not predicate(r)]
    tasa_con = _tasa_cierre(con)
    tasa_sin = _tasa_cierre(sin)
    print(f"\n=== {nombre} ===")
    print(f"  Con  (n={len(con):>4})  tasa={tasa_con:>5.1f}%  lift={round(tasa_con - baseline, 1):+.1f}pp")
    print(f"  Sin  (n={len(sin):>4})  tasa={tasa_sin:>5.1f}%  lift={round(tasa_sin - baseline, 1):+.1f}pp")


def _volumen_bucket(row: dict) -> str:
    v = row.get("volumen_consultas_mensual") or 0
    if v >= 10_000:
        return "10000+"
    if v >= 2_000:
        return "2000-9999"
    if v >= 500:
        return "500-1999"
    if v >= 200:
        return "200-499"
    if v >= 50:
        return "50-199"
    return "0-49"


def main() -> None:
    settings = load_settings()
    supabase = db.get_client(settings.supabase_url, settings.supabase_service_role_key)

    all_clients = []
    batch_size = 1000
    start = 0

    while True:
        result = (
            supabase.table("clients")
            .select(
                "cierre, industria, tamano_empresa, tipo_canal, area_negocio_principal, "
                "volumen_consultas_mensual, dolor_explicito, urgencia, complejidad_tecnica, "
                "requiere_regulacion_compleja, requiere_sistema_gestion_completo, canales_deseados"
            )
            .range(start, start + batch_size - 1)
            .execute()
        )

        rows = result.data or []
        all_clients.extend(rows)

        if len(rows) < batch_size:
            break

        start += batch_size

    rows = all_clients

    baseline = _tasa_cierre(rows)
    print(f"Tasa de cierre general: {baseline}%  (n={len(rows)})")
    print(f"(Se ignoran grupos con menos de {MIN_SAMPLE} casos, poco confiables)")

    _reporte_categorico("Volumen (bucket)", rows, _volumen_bucket, baseline)
    _reporte_categorico("Tamaño de empresa", rows, lambda r: r.get("tamano_empresa") or "no_inferible", baseline)
    _reporte_categorico("Tipo de canal", rows, lambda r: r.get("tipo_canal") or "no_mencionado", baseline)
    _reporte_categorico("Área de negocio", rows, lambda r: r.get("area_negocio_principal") or "no_inferible", baseline)
    _reporte_categorico("Urgencia", rows, lambda r: r.get("urgencia") or "no_inferible", baseline)
    _reporte_categorico("Complejidad técnica", rows, lambda r: r.get("complejidad_tecnica") or "no_inferible", baseline)

    _reporte_binario("Dolor explícito", rows, lambda r: bool(r.get("dolor_explicito")), baseline)
    _reporte_binario("Requiere regulación compleja", rows, lambda r: bool(r.get("requiere_regulacion_compleja")), baseline)
    _reporte_binario(
        "Requiere sistema de gestión completo", rows, lambda r: bool(r.get("requiere_sistema_gestion_completo")), baseline
    )
    _reporte_binario(
        "Pide algún canal soportado",
        rows,
        lambda r: any(normalize_text(c) in SUPPORTED_CHANNELS for c in (r.get("canales_deseados") or [])),
        baseline,
    )


if __name__ == "__main__":
    main()