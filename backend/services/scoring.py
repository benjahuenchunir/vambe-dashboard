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

BASELINE_TASA_CIERRE = 69  # tasa de cierre general medida (redondeada)

VOLUMEN_WEIGHTS: dict[str, int] = {
    "0-49": -10,      # n=44,  tasa 59.1%
    "50-199": -9,     # n=320, tasa 60.6%
    "500-1999": -3,   # n=559, tasa 66.5%
    "200-499": 5,     # n=515, tasa 74.6%
    "2000-9999": 4,   # n=333, tasa 73.6%
    "10000+": 5,      # n=168, tasa 74.4%
}

TAMANO_EMPRESA_WEIGHTS: dict[str, int] = {
    "Grande": 6,          # n=156,  tasa 75.0%
    "Mediana": 2,         # n=314,  tasa 71.7%
    "no_inferible": -1,   # n=1241, tasa 68.5%
    "Pequeña": -2,        # n=228,  tasa 67.5%
}

TIPO_CANAL_WEIGHTS: dict[str, int] = {
    "Outbound / Contacto Directo": 5,  # n=67,  tasa 74.6%
    "Referido": 5,                     # n=434, tasa 74.0%
    "Eventos y Webinars": 2,           # n=446, tasa 70.9%
    "Organico Social": 1,              # n=287, tasa 70.7%
    "Busqueda Organica": -2,           # n=208, tasa 67.3%
    "Marketing de Contenidos": -3,     # n=277, tasa 66.1%
    "Medios / Prensa": -7,             # n=95,  tasa 62.1%
    "Publicidad Paga": -8,             # n=67,  tasa 61.2%
    "Otro": -15,                       # n=46,  tasa 50.0% (lift real -19.4pp;
                                        # se amortigua un poco por ser el
                                        # segmento más chico entre los medidos)
}

AREA_NEGOCIO_WEIGHTS: dict[str, int] = {
    "Agendamiento": 3,          # n=522, tasa 72.0%
    "Atencion al Cliente": 0,   # n=577, tasa 69.7% (~ igual al promedio)
    "Ecommerce": -1,            # n=210, tasa 68.1%
    "Venta Consultiva": -2,     # n=629, tasa 67.4%
}

URGENCIA_WEIGHTS: dict[str, int] = {
    "Alta": 6,   # n=49, tasa 75.5%
    "Media": 2,  # n=70, tasa 71.4%
    # "Baja" y "no_inferible" no se les asigna puntaje: no_inferible es ~94%
    # del dataset (el LLM rara vez logra inferir urgencia con confianza), así
    # que casi no aporta señal real todavía.
}

COMPLEJIDAD_WEIGHTS: dict[str, int] = {
    "no_inferible": 1,  # n=1445, tasa 70.6%
    "Baja": 1,          # n=191,  tasa 70.2%
    "Alta": -4,         # n=63,   tasa 65.1%
    "Media": -6,        # n=240,  tasa 62.9% — la fórmula anterior le daba
                         # +10 a "Baja o Media" combinados; los datos
                         # muestran que Media es en realidad la peor banda.
}

DOLOR_EXPLICITO_LIFT = 8         # Con: n=118, tasa 77.1% (vs. Sin: 68.9%)
REGULACION_COMPLEJA_LIFT = 3     # Con: n=220, tasa 72.3% — la fórmula
                                  # anterior penalizaba esto con -10; los
                                  # datos muestran lo contrario (probable
                                  # pre-calificación de leads regulados que
                                  # llegan hasta esta etapa).
SISTEMA_COMPLETO_PENALTY = -10   # Sin datos aún: n=0 con este flag en true
                                  # en todo el dataset. Se mantiene como
                                  # supuesto de negocio, NO como hallazgo
                                  # medido — revisar en cuanto haya casos.
CANAL_SOPORTADO_LIFT = 1         # Con: n=1520, tasa 70.1%
CANAL_NO_SOPORTADO_PENALTY = -3  # Sin: n=419,  tasa 66.8%


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