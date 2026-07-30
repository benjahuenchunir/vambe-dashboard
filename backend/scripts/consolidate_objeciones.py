"""
Consolida objeciones_principales (text[] y JSONB) a categorías cerradas.

Uso:
    python -m scripts.consolidate_objeciones --table clients --batch-size 500
    python -m scripts.consolidate_objeciones --table clients --dry-run
"""

import argparse
from typing import Dict, List, Optional, Tuple

from data import db
from config import load_settings

# ── Mapeo case-insensitive: objeción detectada → categoría consolidada ──
MAPEO_OBJECIONES: Dict[str, str] = {
    # Precio / Presupuesto
    "precio / presupuesto": "Precio / Presupuesto",
    "presupuesto limitado": "Precio / Presupuesto",
    "valor de transacciones": "Precio / Presupuesto",
    "tranquilidad sobre costos y procesos": "Precio / Presupuesto",

    # Precisión y Confiabilidad de la IA
    "temor a alucinaciones de ia": "Precisión y Confiabilidad de la IA",
    "temor a alucinaciones de ia": "Precisión y Confiabilidad de la IA",
    "precisión de la ia": "Precisión y Confiabilidad de la IA",
    "precisión técnica de la ia": "Precisión y Confiabilidad de la IA",
    "temor a errores de la ia": "Precisión y Confiabilidad de la IA",
    "temor a errores de información": "Precisión y Confiabilidad de la IA",
    "temor a errores en cotizaciones": "Precisión y Confiabilidad de la IA",
    "temor a errores en datos técnicos y precios": "Precisión y Confiabilidad de la IA",
    "temor a errores en información técnica": "Precisión y Confiabilidad de la IA",
    "temor a imprecisión técnica": "Precisión y Confiabilidad de la IA",
    "temor a la calidad de la respuesta de la ia": "Precisión y Confiabilidad de la IA",
    "temor a la falta de precisión de la ia": "Precisión y Confiabilidad de la IA",
    "temor a la precisión de datos": "Precisión y Confiabilidad de la IA",
    "temor a la precisión de la información": "Precisión y Confiabilidad de la IA",
    "precisión de cálculos": "Precisión y Confiabilidad de la IA",
    "precisión de datos técnicos": "Precisión y Confiabilidad de la IA",
    "precisión de especificaciones técnicas": "Precisión y Confiabilidad de la IA",
    "precisión de información": "Precisión y Confiabilidad de la IA",
    "precisión de información de precios": "Precisión y Confiabilidad de la IA",
    "precisión de información fiscal": "Precisión y Confiabilidad de la IA",
    "precisión de información regulatoria": "Precisión y Confiabilidad de la IA",
    "precisión legal": "Precisión y Confiabilidad de la IA",
    "precisión médica crítica": "Precisión y Confiabilidad de la IA",
    "precisión regulatoria": "Precisión y Confiabilidad de la IA",
    "precisión técnica": "Precisión y Confiabilidad de la IA",
    "precisión técnica en la comunicación": "Precisión y Confiabilidad de la IA",
    "precisión en cálculos de fletes": "Precisión y Confiabilidad de la IA",
    "precisión en detalles de envío": "Precisión y Confiabilidad de la IA",
    "confiabilidad de datos": "Precisión y Confiabilidad de la IA",
    "confiabilidad de información técnica": "Precisión y Confiabilidad de la IA",
    "confiabilidad de la ia": "Precisión y Confiabilidad de la IA",
    "confiabilidad de la información": "Precisión y Confiabilidad de la IA",
    "confiabilidad y seguridad de datos": "Precisión y Confiabilidad de la IA",
    "fiabilidad de la información": "Precisión y Confiabilidad de la IA",
    "honestidad en estimaciones": "Precisión y Confiabilidad de la IA",
    "capacidad de precisión técnica": "Precisión y Confiabilidad de la IA",
    "capacidad de precisión y cero error": "Precisión y Confiabilidad de la IA",
    "capacidad de respuesta técnica": "Precisión y Confiabilidad de la IA",
    "exactitud de la información médica": "Precisión y Confiabilidad de la IA",

    # Privacidad / Seguridad de Datos
    "privacidad / seguridad de datos": "Privacidad / Seguridad de Datos",
    "seguridad de datos": "Privacidad / Seguridad de Datos",
    "confidencialidad de datos": "Privacidad / Seguridad de Datos",
    "confidencialidad de la información": "Privacidad / Seguridad de Datos",
    "sensibilidad sobre seguridad": "Privacidad / Seguridad de Datos",
    "seguridad de menores": "Privacidad / Seguridad de Datos",

    # Tiempo de Implementación
    "tiempo de implementación": "Tiempo de Implementación",
    "prueba piloto": "Tiempo de Implementación",
    "piloto pequeño primero": "Tiempo de Implementación",
    "capacidad de prueba previa": "Tiempo de Implementación",

    # Complejidad Técnica / Integración
    "complejidad de integración": "Complejidad Técnica / Integración",
    "complejidad de la plataforma": "Complejidad Técnica / Integración",
    "facilidad de mantenimiento técnico": "Complejidad Técnica / Integración",
    "facilidad de uso": "Complejidad Técnica / Integración",
    "facilidad de uso para clientes no digitales": "Complejidad Técnica / Integración",
    "facilidad de uso para el equipo": "Complejidad Técnica / Integración",
    "simplicidad de uso": "Complejidad Técnica / Integración",
    "capacidad de consulta en tiempo real": "Complejidad Técnica / Integración",
    "capacidad de escala y estabilidad": "Complejidad Técnica / Integración",
    "capacidad de escalabilidad": "Complejidad Técnica / Integración",
    "capacidad de mantenimiento": "Complejidad Técnica / Integración",
    "conexión de internet lenta": "Complejidad Técnica / Integración",
    "capacidad multiidioma": "Complejidad Técnica / Integración",
    "capacidad de multiidioma (quechua)": "Complejidad Técnica / Integración",
    "capacidad de manejo de tarifas dinámicas": "Complejidad Técnica / Integración",

    # Resistencia al Cambio del Equipo
    "resistencia al cambio del equipo": "Resistencia al Cambio del Equipo",
    "disponibilidad horaria de equipo comercial": "Resistencia al Cambio del Equipo",
    "temor a la automatización excesiva": "Resistencia al Cambio del Equipo",
    "capacidad de uso por adultos mayores": "Resistencia al Cambio del Equipo",

    # Capacidad de Personalización
    "capacidad de personalización": "Capacidad de Personalización",
    "capacidad de personalización técnica": "Capacidad de Personalización",
    "necesidad de solución personalizada": "Capacidad de Personalización",
    "dinámicas variables por proyecto": "Capacidad de Personalización",
    "adaptabilidad al público variado": "Capacidad de Personalización",

    # Cumplimiento Normativo
    "cumplimiento normativo": "Cumplimiento Normativo",
    "cumplimiento regulatorio": "Cumplimiento Normativo",
    "precisión regulatoria": "Cumplimiento Normativo",
    "precisión de información regulatoria": "Cumplimiento Normativo",
    "precisión legal": "Cumplimiento Normativo",
    "precisión médica crítica": "Cumplimiento Normativo",

    # Calidad de Interacción
    "calidad de la interacción": "Calidad de Interacción",
    "capacidad de análisis de sentimiento para clientes frustrados": "Calidad de Interacción",
    "capacidad de conversación natural": "Calidad de Interacción",
    "capacidad de respuesta": "Calidad de Interacción",
    "capacidad de respuesta técnica": "Calidad de Interacción",
    "consistencia de tono de marca": "Calidad de Interacción",
    "temor a la respuesta empática": "Calidad de Interacción",
    "temor a pérdida de calidez personal": "Calidad de Interacción",
    "tiempo de respuesta lento": "Calidad de Interacción",
    "capacidad de confiabilidad": "Calidad de Interacción",
}

CATEGORIAS_VALIDAS = set(MAPEO_OBJECIONES.values())


def consolidar_elemento(valor: Optional[str]) -> Optional[str]:
    if not valor or not isinstance(valor, str):
        return valor
    key = valor.strip().lower().rstrip(".")
    return MAPEO_OBJECIONES.get(key, "Otro")


def consolidar_array(arr: Optional[List[str]]) -> Tuple[List[str], bool]:
    if not isinstance(arr, list):
        return arr if arr is not None else [], False

    nuevo = []
    cambio = False
    for item in arr:
        if not isinstance(item, str):
            nuevo.append(item)
            continue
        consolidado = consolidar_elemento(item)
        if consolidado != item:
            cambio = True
        if consolidado:
            nuevo.append(consolidado)

    # Eliminar duplicados preservando orden
    vistos = set()
    dedup = []
    for item in nuevo:
        if item not in vistos:
            vistos.add(item)
            dedup.append(item)

    return dedup, cambio or len(dedup) != len(nuevo)


def clean_jsonb_array(obj: dict, path: str) -> bool:
    keys = path.split(".")
    for key in keys[:-1]:
        if not isinstance(obj, dict) or key not in obj:
            return False
        obj = obj[key]
    last = keys[-1]
    if last not in obj or not isinstance(obj[last], list):
        return False

    nuevo, cambio = consolidar_array(obj[last])
    if cambio:
        obj[last] = nuevo
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Consolida objeciones_principales a categorías cerradas"
    )
    parser.add_argument("--table", required=True, help="Nombre de la tabla")
    parser.add_argument(
        "--batch-size", type=int, default=500, help="Registros por página"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Solo cuenta, no escribe"
    )
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
            .select("id,objeciones_principales,raw_extraction")
            .order("id")
            .range(offset, offset + args.batch_size - 1)
        )

        response = query.execute()
        registros = getattr(response, "data", []) or []

        if not registros:
            break

        for reg in registros:
            reg_id = reg.get("id")
            if not reg_id:
                continue

            update_data = {}
            changed = False

            # ── 1. Columna plana: objeciones_principales ──
            original_arr = reg.get("objeciones_principales")
            if isinstance(original_arr, list):
                nuevo_arr, arr_cambio = consolidar_array(original_arr)
                if arr_cambio:
                    update_data["objeciones_principales"] = nuevo_arr
                    changed = True
                    for item in nuevo_arr:
                        distribucion[item] = distribucion.get(item, 0) + 1
                else:
                    for item in original_arr:
                        key = consolidar_elemento(item) or item
                        distribucion[key] = distribucion.get(key, 0) + 1

            # ── 2. JSONB raw_extraction ──
            raw = reg.get("raw_extraction")
            if isinstance(raw, dict):
                raw_changed = clean_jsonb_array(
                    raw, "intencion_compra.objeciones_principales"
                )
                if raw_changed:
                    update_data["raw_extraction"] = raw
                    changed = True

            if not changed:
                limpios += 1
                continue

            if args.dry_run:
                actualizados += 1
                continue

            try:
                result = (
                    supabase.table(args.table)
                    .update(update_data)
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
    print("  Distribución final de objeciones:")
    for cat, cnt in sorted(distribucion.items(), key=lambda x: -x[1]):
        print(f"    {cat:35s}: {cnt:5d}")


if __name__ == "__main__":
    main()
