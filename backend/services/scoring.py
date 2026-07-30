import unicodedata
from typing import Any

KNOWN_CASOS_USO: set[str] = {
    "Agendamiento",
    "Catalogo De Productos",
    "Cotizacion",
    "Reservas",
    "Atencion Al Cliente",
    "Calificacion De Leads",
    "Seguimiento De Ventas",
    "Procesamiento De Pagos",
    "Llamadas Con Ia",
    "Crm Integracion",
    "Recomendaciones",
    "Recordatorios",
    "Objeciones",
    "Upsell",
    "Postventa",
    "Recompra",
    "Reactivacion De Clientes",
}

KNOWN_INTEGRACIONES: set[str] = {
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
}

def normalize_text(text: str) -> str:
    """Elimina tildes, diacríticos, espacios extra y convierte a minúsculas."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", str(text))
    without_accents = "".join(
        c for c in normalized if unicodedata.category(c) != "Mn"
    )
    return without_accents.strip().lower()


def derive_new_labels(values: list[str], known: set[str]) -> list[str]:
    """Compara etiquetas ignorando tildes, mayúsculas y espacios."""
    known_norm = {normalize_text(k) for k in known}
    return [v for v in values if normalize_text(v) not in known_norm]


# ---------------------------------------------------------------------------
# Vambe Readiness Score — recalibrado con datos reales
#
# Los pesos de abajo NO son intuición de negocio: son la tasa de cierre
# medida por segmento (ver precompute/analyze_readiness_signals.py) menos la
# tasa de cierre general (69.4% sobre n=1939 a la fecha de este commit),
# redondeada al entero más cercano. El score final es:
#
#   score = tasa_cierre_general + suma(lift de cada señal aplicable al cliente)
#
# clippeado a [0, 100]. Es una aproximación aditiva (asume señales
# independientes entre sí, no es un modelo entrenado) — pero cada número acá
# es trazable a un lift medido y a un tamaño de muestra real, a diferencia de
# la versión anterior.
#
# Con una tasa de cierre general tan alta (~69%), es ESPERABLE que el score
# recalibrado se concentre en la mitad alta del rango (aprox. 20-100) en vez
# de repartirse parejo en 0-100 — así luce honestamente un negocio donde la
# mayoría de los leads que llegan a reunión terminan cerrando. Un score bajo
# (<40) sigue siendo una alerta real, solo que acá "bajo" significa
# "significativamente peor que el resto", no "casi nunca cierra".
#
# Volver a correr analyze_readiness_signals.py cada cierto tiempo (más datos
# = lifts más confiables) y actualizar estos números — en especial los
# marcados como muestra chica o sin datos todavía.
# ---------------------------------------------------------------------------

BASELINE_TASA_CIERRE = 69  # 69.3% medido en n=5033

VOLUMEN_WEIGHTS: dict[str, int] = {
    "0-49": -12,       # n=161,  tasa 57.1% (lift -12.2pp)
    "50-199": -7,      # n=904,  tasa 62.6% (lift -6.7pp)
    "500-1999": 0,     # n=1294, tasa 68.9% (lift -0.4pp ~ baseline)
    "200-499": 2,      # n=1354, tasa 70.8% (lift +1.5pp)
    "2000-9999": 3,    # n=871,  tasa 72.4% (lift +3.1pp)
    "10000+": 9,       # n=449,  tasa 78.2% (lift +8.9pp)
}

TAMANO_EMPRESA_WEIGHTS = {
    "Grande": 7,       # n=301,  tasa 76.4% (lift +7.1pp)
    "Mediana": 4,      # n=730,  tasa 73.7% (lift +4.4pp)
    None: 0,           # n=3342, tasa 69.1% (lift -0.2pp ~ baseline)
    "Pequeña": -7,     # n=660,  tasa 62.7% (lift -6.6pp)
}

TIPO_CANAL_WEIGHTS: dict[str, int] = {
    "Referido": 7,                     # n=1148, tasa 76.0% (lift +6.7pp)
    "Outbound / Contacto Directo": 3,   # n=163,  tasa 71.8% (lift +2.5pp)
    "Eventos y Webinars": 1,           # n=1164, tasa 70.7% (lift +1.4pp)
    "Organico Social": 0,              # n=750,  tasa 69.2% (lift -0.1pp)
    "Busqueda Organica": -2,           # n=521,  tasa 67.6% (lift -1.7pp)
    "Marketing de Contenidos": -5,     # n=740,  tasa 64.6% (lift -4.7pp)
    "Medios / Prensa": -8,             # n=266,  tasa 61.7% (lift -7.6pp)
    "Publicidad Paga": -10,            # n=174,  tasa 59.8% (lift -9.5pp)
    "Otro": -15,                       # n=94,   tasa 52.1% (lift -17.2pp)
}

AREA_NEGOCIO_WEIGHTS: dict[str, int] = {
    "Agendamiento": 1,       # n=1360, tasa 70.3% (lift +1.0pp)
    "Ecommerce": 1,          # n=578,  tasa 70.2% (lift +0.9pp)
    "Atencion al Cliente": 0, # n=1443, tasa 69.1% (lift -0.2pp)
    "Venta Consultiva": -1,  # n=1650, tasa 68.4% (lift -0.9pp)
}

URGENCIA_WEIGHTS: dict[str, int] = {
    "Alta": 13,   # n=162, tasa 82.1% (lift +12.8pp) — señal muy fuerte
    "Media": 5,   # n=218, tasa 74.3% (lift +5.0pp)
    None: 0,      # n=4649, ~92% del dataset, actúa como baseline
}

COMPLEJIDAD_WEIGHTS = {
    None: 1,      # n=3724, tasa 70.2% (lift +0.9pp)
    "Media": -2,  # n=658,  tasa 67.5% (lift -1.8pp)
    "Baja": -2,   # n=527,  tasa 67.4% (lift -1.9pp)
    "Alta": -6,   # n=124,  tasa 62.9% (lift -6.4pp)
}

DOLOR_EXPLICITO_LIFT = 9         # Con: n=299, tasa 78.6% (lift +9.3pp)
REGULACION_COMPLEJA_LIFT = 3     # Con: n=619, tasa 72.4% (lift +3.1pp)
SISTEMA_COMPLETO_PENALTY = -10   # Sin casos aún en el dataset (n=0). Se mantiene supuesto.
CANAL_SOPORTADO_LIFT = 0         # Con: n=4507, tasa 69.6% (lift +0.3pp ~ baseline)
CANAL_NO_SOPORTADO_PENALTY = -2  # Sin: n=526,  tasa 67.1% (lift -2.2pp)


def _volumen_bucket(volumen: int) -> str:
    if volumen >= 10_000:
        return "10000+"
    if volumen >= 2_000:
        return "2000-9999"
    if volumen >= 500:
        return "500-1999"
    if volumen >= 200:
        return "200-499"
    if volumen >= 50:
        return "50-199"
    return "0-49"


def compute_readiness_score(extraction: dict[str, Any]) -> int:
    """Calcula el Vambe Readiness Score (0-100).

    A diferencia de la versión anterior, cada peso de abajo es la tasa de
    cierre medida por segmento (ver analyze_readiness_signals.py) menos la
    tasa de cierre general — no una asignación por intuición de negocio.
    """
    perfil = extraction.get("perfil_cliente", {})
    necesidades = extraction.get("necesidades_y_casos_uso", {})
    intencion = extraction.get("intencion_compra", {})

    volumen = perfil.get("volumen_consultas_mensual") or 0
    tamano = perfil.get("tamano_empresa")
    tipo_canal = perfil.get("tipo_canal")

    area = necesidades.get("area_negocio_principal")
    canales_deseados = necesidades.get("canales_deseados") or []
    canales_no_soportados_solicitados = necesidades.get("canales_no_soportados_solicitados") or []

    dolor_explicito = bool(intencion.get("dolor_explicito"))
    urgencia = intencion.get("urgencia")
    complejidad = intencion.get("complejidad_tecnica")
    requiere_regulacion = bool(intencion.get("requiere_regulacion_compleja"))
    requiere_sistema_completo = bool(intencion.get("requiere_sistema_gestion_completo"))

    score = BASELINE_TASA_CIERRE

    score += VOLUMEN_WEIGHTS.get(_volumen_bucket(volumen), 0)
    score += TAMANO_EMPRESA_WEIGHTS.get(tamano, 0)
    score += TIPO_CANAL_WEIGHTS.get(tipo_canal, 0)
    score += AREA_NEGOCIO_WEIGHTS.get(area, 0)
    score += URGENCIA_WEIGHTS.get(urgencia, 0)
    score += COMPLEJIDAD_WEIGHTS.get(complejidad, 0)

    if dolor_explicito:
        score += DOLOR_EXPLICITO_LIFT
    if requiere_regulacion:
        score += REGULACION_COMPLEJA_LIFT
    if requiere_sistema_completo:
        score += SISTEMA_COMPLETO_PENALTY

    if canales_deseados:
        score += CANAL_SOPORTADO_LIFT
    elif canales_no_soportados_solicitados:
        score += CANAL_NO_SOPORTADO_PENALTY

    return max(0, min(100, round(score)))