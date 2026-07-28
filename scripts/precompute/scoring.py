import unicodedata

"""
Todo lo que sea una función determinística de los campos que el LLM ya extrajo
se calcula aquí, no se le pide al modelo (ver la nota en el prompt v3 sobre
por qué se sacaron vambe_readiness_score, nivel_motivacion, *_nuevos, etc.).

Los dos factores de riesgo (regulación compleja, necesidad de ERP/sistema de
gestión completo) SÍ se le piden al LLM como booleans explícitos
(`requiere_regulacion_compleja`, `requiere_sistema_gestion_completo`) — no se
aproximan por palabras clave, porque requieren leer el contexto real de la
transcripción (ej. "clínica que solo agenda horas" no es lo mismo que
"clínica que necesita manejar información médica sensible").

SUPPORTED_CHANNELS refleja los "canales principales" que el FAQ de Vambe
confirma explícitamente (WhatsApp, Instagram, Facebook, TikTok, WeChat). El
sitio menciona "tu web" en otra sección pero no aparece en esa lista oficial
de canales soportados, así que se dejó fuera — ajústalo si el equipo de
Vambe confirma que Web sí cuenta.
"""

SUPPORTED_CHANNELS = {"whatsapp", "instagram", "facebook", "tiktok", "wechat", "otro"}

KNOWN_CASOS_USO = {
    "Agendamiento", "Catalogo De Productos", "Cotizacion", "Reservas", "Atencion Al Cliente",
    "Calificacion De Leads", "Seguimiento De Ventas", "Procesamiento De Pagos", "Llamadas Con Ia",
    "Crm Integracion", "Recomendaciones", "Recordatorios", "Objeciones", "Upsell", "Postventa",
    "Recompra", "Reactivacion De Clientes",
}

KNOWN_INTEGRACIONES = {
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
    normalized = unicodedata.normalize("NFD", text)
    without_accents = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    return without_accents.strip().lower()


def derive_new_labels(values: list[str], known: set[str]) -> list[str]:
    """Compara etiquetas ignorando tildes, mayúsculas y espacios."""
    known_norm = {normalize_text(k) for k in known}
    return [v for v in values if normalize_text(v) not in known_norm]


def compute_channels_not_supported(canales_deseados: list[str]) -> list[str]:
    return [c for c in canales_deseados if normalize_text(c) not in SUPPORTED_CHANNELS]


def compute_readiness_score(extraction: dict) -> int:
    perfil = extraction.get("perfil_cliente", {})
    necesidades = extraction.get("necesidades_y_casos_uso", {})
    intencion = extraction.get("intencion_compra", {})

    volumen = perfil.get("volumen_consultas_mensual") or 0
    tamano = perfil.get("tamano_empresa")
    tipo_canal = perfil.get("tipo_canal")

    area = necesidades.get("area_negocio_principal")
    casos_uso = necesidades.get("casos_uso_principales") or []
    canales_deseados = necesidades.get("canales_deseados") or []
    integraciones = necesidades.get("integraciones_requeridas") or []

    dolor_explicito = bool(intencion.get("dolor_explicito"))
    complejidad = intencion.get("complejidad_tecnica")
    requiere_regulacion = bool(intencion.get("requiere_regulacion_compleja"))
    requiere_sistema_completo = bool(intencion.get("requiere_sistema_gestion_completo"))

    casos_uso_text = " ".join(casos_uso).lower()
    known_integraciones_norm = {normalize_text(k) for k in KNOWN_INTEGRACIONES}

    score = 0
    if volumen > 200:
        score += 25
    if area in ("Agendamiento", "Ecommerce") or any(k in casos_uso_text for k in ("agendamiento", "reserva", "catalogo", "catálogo")):
        score += 20
    if area == "Venta Consultiva" or any(k in casos_uso_text for k in ("calificacion", "calificación", "seguimiento de ventas")):
        score += 15
    if tipo_canal in ("Offline/Evento", "Referido"):
        score += 10
    if dolor_explicito:
        score += 10
    if complejidad in ("Baja", "Media"):
        score += 10
    if any(normalize_text(c) in SUPPORTED_CHANNELS for c in canales_deseados):
        score += 10

    if requiere_regulacion:
        score -= 20
    if complejidad == "Alta" and any(normalize_text(i) not in known_integraciones_norm for i in integraciones):
        score -= 15
    if requiere_sistema_completo:
        score -= 10
    if volumen < 20 or tamano == "Pequeña":
        score -= 10

    return max(0, min(100, score))