"""
Consolida integraciones_requeridas (text[] y JSONB) a categorías cerradas.
Elimina entradas inválidas (garbage, features, column leaks).

Uso:
    python -m scripts.consolidate_integraciones --table clients --batch-size 500
    python -m scripts.consolidate_integraciones --table clients --dry-run
"""

import argparse
from typing import Dict, List, Optional, Set, Tuple

from data import db
from config import load_settings

# ── Categorías válidas ──
CATEGORIAS_VALIDAS: Set[str] = {
    "CRM",
    "ERP",
    "Calendario / Agendamiento",
    "Pasarela de Pagos",
    "Ecommerce",
    "Sistema Académico / LMS",
    "Facturación / DTE",
    "Inventario / Stock",
    "Helpdesk / Atención al Cliente",
    "Marketing Automation",
    "API / Webhook",
    "GPS / Rastreo",
    "Logística / Envíos",
    "Email / Comunicación",
    "ATS / Reclutamiento",
    "Finanzas / Crédito",
    "Otro",
}

# ── Mapeo case-insensitive: valor detectado → categoría consolidada ──
# Solo incluimos entradas que NO son obviamente garbage/features
MAPEO_INTEGRACIONES: Dict[str, str] = {
    # CRM
    "crm": "CRM",
    "- crm": "CRM",
    "crm / base de clientes": "CRM",
    "crm / sales system": "CRM",
    "hubspot": "CRM",
    "base de datos de clientes": "CRM",

    # ERP
    "erp": "ERP",
    "erp / despacho": "ERP",
    "logística / erp": "ERP",

    # Calendario / Agendamiento
    "calendario / agendamiento": "Calendario / Agendamiento",

    # Pasarela de Pagos
    "finanzas / pagos": "Pasarela de Pagos",

    # Ecommerce
    "ecommerce": "Ecommerce",
    "delivery apps": "Ecommerce",
    "delivery platform": "Ecommerce",
    "delivery system": "Ecommerce",
    "app de pedidos": "Ecommerce",

    # Sistema Académico / LMS
    "lms": "Sistema Académico / LMS",

    # Facturación / DTE
    "facturación / dte": "Facturación / DTE",
    "billing / facturación": "Facturación / DTE",

    # Inventario / Stock
    "inventario / stock": "Inventario / Stock",
    "control de stock/inventario": "Inventario / Stock",

    # Helpdesk / Atención al Cliente
    "helpdesk / atención al cliente": "Helpdesk / Atención al Cliente",
    "atencion al cliente": "Helpdesk / Atención al Cliente",

    # Marketing Automation
    "marketing automation": "Marketing Automation",

    # API / Webhook
    "api / webhook": "API / Webhook",
    "api de tracking en tiempo real": "API / Webhook",
    "integración con sistema de cobranza": "API / Webhook",
    "integración de datos de pólizas": "API / Webhook",

    # GPS / Rastreo
    "gps": "GPS / Rastreo",
    "gps / plataforma de seguimiento": "GPS / Rastreo",
    "gps / rastreo": "GPS / Rastreo",
    "gps / rastreo de flota": "GPS / Rastreo",
    "gps / seguimiento": "GPS / Rastreo",
    "gps / seguimiento en tiempo real": "GPS / Rastreo",
    "gps / tracking": "GPS / Rastreo",
    "gps / tracking system": "GPS / Rastreo",
    "gps / vehículos": "GPS / Rastreo",
    "gps de flota": "GPS / Rastreo",
    "base de datos / tracking": "GPS / Rastreo",

    # Logística / Envíos
    "logística": "Logística / Envíos",
    "logística / despachos": "Logística / Envíos",
    "logística / entregas": "Logística / Envíos",
    "logística / envío": "Logística / Envíos",
    "logística / seguimiento de envíos": "Logística / Envíos",
    "logística / software de gestión": "Logística / Envíos",
    "logística / stock": "Logística / Envíos",
    "logística / tracking": "Logística / Envíos",
    "cotización de fletes": "Logística / Envíos",
    "distribución": "Logística / Envíos",

    # Email / Comunicación
    "email / comunicación": "Email / Comunicación",

    # ATS / Reclutamiento
    "ats": "ATS / Reclutamiento",
    "ats / reclutamiento": "ATS / Reclutamiento",
    "base de datos de candidatos": "ATS / Reclutamiento",

    # Finanzas / Crédito
    "financiamiento": "Finanzas / Crédito",
    "financiamiento / crédito": "Finanzas / Crédito",

    # Otro (sistemas válidos pero sin categoría propia)
    "cad": "Otro",
    "cadena de suministro": "Otro",
    "catálogo de contenidos": "Otro",
    "catálogo de diseños": "Otro",
    "catálogo de productos": "Otro",
    "catálogo en tiempo real": "Otro",
    "catálogo searchable": "Otro",
    "kitchen display system": "Otro",
    "mls": "Otro",
    "base de datos de inmuebles": "Otro",
    "base de datos de propiedades": "Otro",
    "base de datos de proyectos": "Otro",
    "base de datos de subsidios": "Otro",
    "base de inmuebles": "Otro",
    "base de datos": "Otro",
    "aplicaciones de fitness (myfitnesspal)": "Otro",
    "app de fitness": "Otro",
    "gestario de pedidos": "Otro",  # typo, but order management
    "gestión de flota": "Otro",
    "gestión de membresías": "Otro",
    "historial médico": "Otro",
    "historiales de pacientes": "Otro",
    "contratos digitales": "Otro",
    "control de acceso": "Otro",
    "maps de servicios": "Otro",
    "membresías": "Otro",
    "pacs": "Otro",
    "intranet": "Otro",
    "sistema de pesaje": "Otro",
    "certificación": "Otro",
}

# ── Entradas a eliminar (garbage, features, column leaks) ──
ENTRADAS_INVALIDAS: Set[str] = {
    "-",
    "-]",
    "}, {",
    "casos_uso_principales",
    "integraciones_requeridas",
    # Features / capacidades (no son nombres de sistemas)
    "cálculo de tarifas dinámicas",
    "confirmación de disponibilidad",
    "consulta de catálogo",
    "cotización / presupuestos",
    "formularios de donación",
    "gestión de espacios",
    "gestión de órdenes de trabajo",
    "gestión de prescripciones oftalmológicas",
    "gestión de recursos",
    "herramientas de diseño",
    "herramientas de radiación solar",
    "historial médico",
    "historiales de pacientes",
    "maps de servicios",
    "membresías",
    "simulador de ahorros",
}


def _normalize(val: str) -> str:
    return val.strip().lower().rstrip(".").replace("_", " ")


def consolidar_elemento(valor: Optional[str]) -> Tuple[Optional[str], bool]:
    """
    Devuelve (categoría, es_válido).
    Si es_válido es False, el elemento debe eliminarse del array.
    """
    if not valor or not isinstance(valor, str):
        return valor, True  # conservar tal cual (null, número, etc.)

    key = _normalize(valor)

    # Garbage / features a eliminar
    if key in ENTRADAS_INVALIDAS:
        return None, False

    # Mapeo conocido
    if key in MAPEO_INTEGRACIONES:
        return MAPEO_INTEGRACIONES[key], True

    # Heurísticas para casos no mapeados explícitamente
    if "crm" in key and key not in {"- crm"}:
        return "CRM", True
    if "erp" in key:
        return "ERP", True
    if "gps" in key or "rastreo" in key or "tracking" in key or "seguimiento" in key:
        return "GPS / Rastreo", True
    if "logística" in key or "envío" in key or "despacho" in key or "entrega" in key or "flete" in key:
        return "Logística / Envíos", True
    if "factur" in key or "dte" in key or "billing" in key:
        return "Facturación / DTE", True
    if "inventario" in key or "stock" in key:
        return "Inventario / Stock", True
    if "calendario" in key or "agenda" in key or "cita" in key:
        return "Calendario / Agendamiento", True
    if "pagos" in key or "pasarela" in key or "webpay" in key or "stripe" in key or "mercado pago" in key:
        return "Pasarela de Pagos", True
    if "ecommerce" in key or "shopify" in key or "woocommerce" in key or "vtex" in key:
        return "Ecommerce", True
    if "lms" in key or "académico" in key or "moodle" in key or "canvas" in key or "alumno" in key or "curso" in key:
        return "Sistema Académico / LMS", True
    if "helpdesk" in key or "atención" in key or "soporte" in key or "zendesk" in key or "freshdesk" in key:
        return "Helpdesk / Atención al Cliente", True
    if "marketing" in key and "automation" in key:
        return "Marketing Automation", True
    if "api" in key or "webhook" in key or "middleware" in key or "conector" in key:
        return "API / Webhook", True
    if "email" in key or "correo" in key or "smtp" in key:
        return "Email / Comunicación", True
    if "ats" in key or "reclutamiento" in key or "candidato" in key:
        return "ATS / Reclutamiento", True
    if "financiamiento" in key or "crédito" in key or "préstamo" in key or "leasing" in key:
        return "Finanzas / Crédito", True

    # Por defecto: Otro (conservar pero categorizar)
    return "Otro", True


def consolidar_array(arr: Optional[List[str]]) -> Tuple[List[str], bool]:
    if not isinstance(arr, list):
        return arr if arr is not None else [], False

    nuevo = []
    cambio = False
    for item in arr:
        if not isinstance(item, str):
            nuevo.append(item)
            continue
        consolidado, es_valido = consolidar_elemento(item)
        if not es_valido:
            cambio = True
            continue
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
        description="Consolida integraciones_requeridas a categorías cerradas y elimina inválidas"
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
    eliminados_por_invalido = 0
    offset = 0
    page = 1

    while True:
        query = (
            supabase.table(args.table)
            .select("id,integraciones_requeridas,raw_extraction")
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

            # ── 1. Columna plana: integraciones_requeridas ──
            original_arr = reg.get("integraciones_requeridas")
            if isinstance(original_arr, list):
                nuevo_arr, arr_cambio = consolidar_array(original_arr)
                if arr_cambio:
                    update_data["integraciones_requeridas"] = nuevo_arr
                    changed = True
                    eliminados_por_invalido += len(original_arr) - len(nuevo_arr)
                    for item in nuevo_arr:
                        distribucion[item] = distribucion.get(item, 0) + 1
                else:
                    for item in original_arr:
                        key, _ = consolidar_elemento(item)
                        if key:
                            distribucion[key] = distribucion.get(key, 0) + 1

            # ── 2. JSONB raw_extraction ──
            raw = reg.get("raw_extraction")
            if isinstance(raw, dict):
                raw_changed = clean_jsonb_array(
                    raw, "necesidades_y_casos_uso.integraciones_requeridas"
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
    print(f"  ELIMINADOS   : {eliminados_por_invalido} (entradas inválidas)")
    print("═" * 50)
    print()
    print("  Distribución final de integraciones:")
    for cat, cnt in sorted(distribucion.items(), key=lambda x: -x[1]):
        print(f"    {cat:35s}: {cnt:5d}")


if __name__ == "__main__":
    main()
