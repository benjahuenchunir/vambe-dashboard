"""
Normaliza casos_uso_principales a categorías macro de Vambe (Literal)
y deja casos_uso_nuevos como categorías generales no soportadas (str libre).

Uso:
    python -m scripts.consolidate_casos_uso --table clients --batch-size 500
    python -m scripts.consolidate_casos_uso --table clients --dry-run
"""

import argparse
from typing import Dict, List, Optional, Set, Tuple

from data import db
from config import load_settings

# ── Categorías macro Vambe (casos_uso_principales) ──
CATEGORIAS_VAMBE: Set[str] = {
    "Información y Consultas",
    "Agendamiento y Reservas",
    "Cotización y Presupuestos",
    "Procesamiento de Ventas y Órdenes",
    "Soporte Técnico y Reclamos",
    "Seguimiento y Logística",
    "Capacitación y Onboarding",
    "Calificación y Captura de Leads",
    "Asesoría y Recomendación",
    "Documentación y Verificación",
    "Escalamiento y Derivación",
    "Diagnóstico y Evaluación",
    "Notificaciones y Alertas",
    "Presentación de Contenidos",
    "Postventa",
    "Fidelización",
    "Recompra",
    "Upsell",
    "Otro",
}

# ── Mapeo explícito: caso de uso normalizado → categoría Vambe ──
MAPEO_CASOS: Dict[str, str] = {
    # Información y Consultas
    "proporcionar especificaciones técnicas": "Información y Consultas",
    "aclaración de dudas sobre propiedades de la miel": "Información y Consultas",
    "consultas sobre programas y horarios": "Información y Consultas",
    "proporcionar información sobre programas y aranceles": "Información y Consultas",
    "respuesta de preguntas técnicas": "Información y Consultas",
    "consulta de materiales y durabilidad": "Información y Consultas",
    "solicitar información de instalaciones": "Información y Consultas",
    "información de procesos de conexión": "Información y Consultas",
    "aclaración de requisitos de preparación": "Información y Consultas",
    "aclaración de dudas sobre disponibilidad de fechas y horarios": "Información y Consultas",
    "automatizar preguntas básicas sobre servicios": "Información y Consultas",
    "consulta de tiempos de entrega": "Información y Consultas",
    "respuesta sobre tratamientos": "Información y Consultas",
    "consulta de disponibilidad de productos": "Información y Consultas",
    "aclaración de dudas sobre visitaciones": "Información y Consultas",
    "consulta de nutrición animal": "Información y Consultas",
    "aclaración de dudas sobre especialidades, modalidades, aranceles y disponibilidad de citas": "Información y Consultas",
    "información de productos utilizados": "Información y Consultas",
    "aclaración de dudas sobre membresías, costos y horarios": "Información y Consultas",
    "aclaración de dudas sobre capacidades de la plataforma": "Información y Consultas",
    "aclaración de dudas sobre servicios, experiencia y honorarios": "Información y Consultas",
    "respuesta sobre servicios disponibles": "Información y Consultas",
    "aclaración de dudas sobre cursos, instructores, horarios, precios y niveles": "Información y Consultas",
    "aclaración de dudas sobre vacunas infantiles": "Información y Consultas",
    "responder sobre colecciones nuevas": "Información y Consultas",
    "consulta de información de garantía": "Información y Consultas",
    "explicación de capacidades técnicas": "Información y Consultas",
    "consulta de cobertura geográfica": "Información y Consultas",
    "consulta de estados de pólizas": "Información y Consultas",
    "dirección de clientes a sucursales cercanas": "Información y Consultas",
    "información de medicamentos y cuidados": "Información y Consultas",
    "aclaración de precios y volúmenes": "Información y Consultas",
    "muestra de proyectos anteriores": "Información y Consultas",
    "aclaración de dudas sobre beneficios de ley de renovables": "Información y Consultas",
    "responder información de la clínica": "Información y Consultas",
    "explicación de términos comerciales": "Información y Consultas",
    "aclaración de dudas sobre procedimientos, precios, tiempos de recuperación y disponibilidad": "Información y Consultas",
    "búsqueda de repuestos por código o descripción": "Información y Consultas",
    "información sobre talleres": "Información y Consultas",
    "aclaración de ingredientes y procesos artesanales": "Información y Consultas",
    "aclaración de dudas sobre programas, requisitos y becas": "Información y Consultas",
    "consulta de términos de contrato": "Información y Consultas",
    "consulta de cartelera y horarios": "Información y Consultas",
    "envío de información pre-viaje": "Información y Consultas",
    "resolución de dudas sobre paquetes y seguros": "Información y Consultas",
    "aclaración de dudas sobre costos, metodología, horarios y evaluaciones": "Información y Consultas",
    "consulta de características y planos": "Información y Consultas",
    "informar sobre derechos de los clientes": "Información y Consultas",
    "consulta de servicios y estilos": "Información y Consultas",
    "consulta de medicamentos": "Información y Consultas",
    "aclaración de dudas sobre plazos de entrega": "Información y Consultas",
    "información de logística": "Información y Consultas",
    "consulta de propiedades": "Información y Consultas",
    "aclaración de dudas sobre funcionalidades, integraciones y soporte técnico": "Información y Consultas",
    "describir cursos por nivel": "Información y Consultas",
    "proporcionar información de metodologías": "Información y Consultas",
    "acceso a fichas técnicas": "Información y Consultas",
    "acceso a información de la procedencia de ingredientes y maridajes": "Información y Consultas",
    "proporcionar información de especialidad": "Información y Consultas",
    "establecimiento de expectativas de timeline": "Información y Consultas",
    "responder sobre salidas laborales": "Información y Consultas",
    "informar sobre oportunidades de voluntariado": "Información y Consultas",
    "información sobre bolsa de empleos": "Información y Consultas",
    "explicar indicaciones generales": "Información y Consultas",

    # Agendamiento y Reservas
    "agendamiento de capacitaciones para docentes": "Agendamiento y Reservas",
    "agendar visitas técnicas": "Agendamiento y Reservas",
    "toma de reservas automáticamente": "Agendamiento y Reservas",
    "coordinación de visitas al refugio": "Agendamiento y Reservas",
    "cierre de reservaciones automáticamente": "Agendamiento y Reservas",
    "coordinación de citas con ajustadores": "Agendamiento y Reservas",
    "agendar clases de demostración": "Agendamiento y Reservas",
    "gestión de citas y disponibilidad": "Agendamiento y Reservas",
    "gestión de reservas": "Agendamiento y Reservas",
    "reserva de recogidas a domicilio": "Agendamiento y Reservas",
    "agendamiento de discovery calls": "Agendamiento y Reservas",
    "agendar visitas de evaluadores": "Agendamiento y Reservas",
    "reserva de evaluaciones": "Agendamiento y Reservas",
    "agendar consultas con contadores": "Agendamiento y Reservas",
    "programación de demostraciones": "Agendamiento y Reservas",
    "manejar cambios de calendarios": "Agendamiento y Reservas",

    # Cotización y Presupuestos
    "cotización de servicios de disposición": "Cotización y Presupuestos",
    "solicitud de datos para cotizaciones iniciales": "Cotización y Presupuestos",
    "aclaración de dudas sobre costos, subsidios, rentabilidad y financiamiento": "Cotización y Presupuestos",
    "simulación de crédito automotriz": "Cotización y Presupuestos",
    "realizar cotizaciones parametrizadas": "Cotización y Presupuestos",
    "manejo de información de presupuestos": "Cotización y Presupuestos",
    "manejar opciones de financiamiento inmobiliario": "Cotización y Presupuestos",
    "cotización de pedidos": "Cotización y Presupuestos",
    "cotización de trabajos personalizados": "Cotización y Presupuestos",
    "cotización de piezas especiales": "Cotización y Presupuestos",
    "cotización de insumos": "Cotización y Presupuestos",
    "simulaciones de ahorro energético": "Cotización y Presupuestos",
    "simulación de ahorros y beneficios": "Cotización y Presupuestos",
    "recomendar paquetes según presupuesto": "Cotización y Presupuestos",
    "aclaración de dudas sobre promociones por cantidad de personas": "Cotización y Presupuestos",
    "aplicación de descuentos para cierre de venta": "Cotización y Presupuestos",
    "envío de propuestas personalizadas": "Cotización y Presupuestos",
    "información de financiamiento": "Cotización y Presupuestos",

    # Procesamiento de Ventas y Órdenes
    "procesamiento de órdenes simples": "Procesamiento de Ventas y Órdenes",
    "procesamiento de órdenes automáticas": "Procesamiento de Ventas y Órdenes",
    "gestión de pedidos recurrentes": "Procesamiento de Ventas y Órdenes",
    "procesamiento de contratación inicial": "Procesamiento de Ventas y Órdenes",
    "procesamiento de compras online": "Procesamiento de Ventas y Órdenes",
    "gestión de cambios en órdenes": "Procesamiento de Ventas y Órdenes",
    "gestión de pedidos en volumen": "Procesamiento de Ventas y Órdenes",
    "gestión preliminar de órdenes de compra": "Procesamiento de Ventas y Órdenes",
    "procesar depósitos iniciales": "Procesamiento de Ventas y Órdenes",
    "gestión de cambios de compras pequeñas": "Procesamiento de Ventas y Órdenes",
    "crear compromiso con el cliente": "Procesamiento de Ventas y Órdenes",
    "ofrecer alternativas de stock": "Procesamiento de Ventas y Órdenes",
    "automatización de consultas sobre catálogos y condiciones de pedido": "Procesamiento de Ventas y Órdenes",

    # Soporte Técnico y Reclamos
    "manejo de consultas sobre reclamos con derivación": "Soporte Técnico y Reclamos",
    "manejo de inicios de reclamos": "Soporte Técnico y Reclamos",
    "manejo de dudas post-tratamiento": "Soporte Técnico y Reclamos",
    "soporte técnico de estudiantes": "Soporte Técnico y Reclamos",
    "manejo de mensajería post-tratamiento": "Soporte Técnico y Reclamos",
    "guía de proceso de reclamo": "Soporte Técnico y Reclamos",
    "manejo de errores en direcciones": "Soporte Técnico y Reclamos",
    "mantenimiento preventivo": "Soporte Técnico y Reclamos",
    "clasificar tipo de falla": "Soporte Técnico y Reclamos",
    "manejo de alertas de urgencia": "Soporte Técnico y Reclamos",
    "alerte sobre emergencias inmediatas": "Soporte Técnico y Reclamos",

    # Seguimiento y Logística
    "tracking de carga en tiempo real": "Seguimiento y Logística",
    "proporcionar tracking de cargas": "Seguimiento y Logística",
    "rastreo de envíos en tiempo real": "Seguimiento y Logística",
    "coordinación de entregas a centros de acopio": "Seguimiento y Logística",
    "coordinación de despachos": "Seguimiento y Logística",
    "aceleración de procesos de entrega": "Seguimiento y Logística",
    "notificaciones de salidas y llegadas": "Seguimiento y Logística",
    "enviar actualizaciones de llegada de técnico": "Seguimiento y Logística",
    "proporcionar actualizaciones de avance constructivo": "Seguimiento y Logística",

    # Capacitación y Onboarding
    "evaluación inicial de objetivos fitness": "Capacitación y Onboarding",
    "guía de usuarios nuevos": "Capacitación y Onboarding",
    "evaluación de conocimientos previos": "Capacitación y Onboarding",
    "educación sobre regulaciones ambientales": "Capacitación y Onboarding",
    "proporcionar guías de instalación": "Capacitación y Onboarding",
    "explicar procesos de reciclaje": "Capacitación y Onboarding",
    "motivación de estudiantes": "Capacitación y Onboarding",
    "explicación de la plataforma": "Capacitación y Onboarding",
    "proporcionar tips de cuidado de prendas": "Capacitación y Onboarding",

    # Calificación y Captura de Leads
    "calificación de leads por perfil económico": "Calificación y Captura de Leads",
    "recopilación de información de la consulta": "Calificación y Captura de Leads",
    "captura de datos de contacto para seguimiento de asesores": "Calificación y Captura de Leads",
    "calificación de empresas por sector e industria": "Calificación y Captura de Leads",
    "seguimiento de leads de eventos": "Calificación y Captura de Leads",
    "captura de leads de colegios": "Calificación y Captura de Leads",
    "diagnóstico de necesidades de clientes": "Calificación y Captura de Leads",

    # Asesoría y Recomendación
    "asesorar combinaciones de rutinas": "Asesoría y Recomendación",
    "ayuda en búsqueda inicial de destinos": "Asesoría y Recomendación",
    "asesoramiento personalizado": "Asesoría y Recomendación",
    "personalización de experiencias": "Asesoría y Recomendación",
    "asesoría de diseños personalizados": "Asesoría y Recomendación",
    "asesoría sobre customización": "Asesoría y Recomendación",
    "sugerir ingredientes": "Asesoría y Recomendación",
    "sugerir productos por tipo de piel": "Asesoría y Recomendación",
    "recomendar servicios preventivos": "Asesoría y Recomendación",
    "asesoría de tallas": "Asesoría y Recomendación",
    "recomendación técnica de materiales": "Asesoría y Recomendación",
    "manejo de relaciones vip": "Asesoría y Recomendación",

    # Documentación y Verificación
    "validación de identidad": "Documentación y Verificación",
    "gestión de postulaciones a becas": "Documentación y Verificación",
    "procesamiento de contratación inicial": "Documentación y Verificación",
    "verificación de repuestos": "Documentación y Verificación",
    "manejo de historias clínicas": "Documentación y Verificación",
    "gestión de documentos": "Documentación y Verificación",
    "verificación de acceso de usuarios": "Documentación y Verificación",
    "calificación de madurez digital": "Documentación y Verificación",

    # Escalamiento y Derivación
    "derivación a recepcionista": "Escalamiento y Derivación",
    "derivación a equipo de atención": "Escalamiento y Derivación",
    "escalado a sales engineer": "Escalamiento y Derivación",
    "escalado de consultas a ingenieros": "Escalamiento y Derivación",
    "escalamiento de consultas": "Escalamiento y Derivación",
    "derivación automática a ejecutivo": "Escalamiento y Derivación",
    "derivación a humanos para negocios grandes": "Escalamiento y Derivación",
    "redirección a ingeniería para consultas complejas": "Escalamiento y Derivación",
    "derivar consultas técnicas": "Escalamiento y Derivación",
    "escalar consultas a veterinarios": "Escalamiento y Derivación",
    "escalado a tutores": "Escalamiento y Derivación",
    "conectar con farmacéuticos": "Escalamiento y Derivación",

    # Diagnóstico y Evaluación
    "facilitar proceso de prueba diagnóstica": "Diagnóstico y Evaluación",
    "evaluación inicial de objetivos fitness": "Diagnóstico y Evaluación",
    "evaluación de conocimientos previos": "Diagnóstico y Evaluación",
    "diagnóstico de necesidades de clientes": "Diagnóstico y Evaluación",
    "clasificar tipo de falla": "Diagnóstico y Evaluación",
    "calificación de madurez digital": "Diagnóstico y Evaluación",

    # Notificaciones y Alertas
    "notificaciones de salidas y llegadas": "Notificaciones y Alertas",
    "alerte sobre emergencias inmediatas": "Notificaciones y Alertas",
    "notificación de llegada de medicamentos especiales": "Notificaciones y Alertas",
    "enviar actualizaciones de llegada de técnico": "Notificaciones y Alertas",
    "comunicación de recitales y presentaciones": "Notificaciones y Alertas",
    "proporcionar actualizaciones de avance constructivo": "Notificaciones y Alertas",
    "notificar sobre retrasos": "Notificaciones y Alertas",

    # Presentación de Contenidos
    "muestra de testimonios": "Presentación de Contenidos",
    "descripción de obras con contexto artístico": "Presentación de Contenidos",
    "consulta de casos de éxito": "Presentación de Contenidos",
    "proporcionar demostraciones de casos de uso": "Presentación de Contenidos",
    "muestra de proyectos anteriores": "Presentación de Contenidos",
    "acceso a portafolio": "Presentación de Contenidos",
    "compartir testimonios": "Presentación de Contenidos",
    "mostrar avances de estudiantes": "Presentación de Contenidos",
    "presentación de propiedades": "Presentación de Contenidos",
    "capacidad de mostrar imágenes de personalización": "Presentación de Contenidos",

    # Postventa
    "seguimiento post-compra": "Postventa",
    "seguimiento post-venta": "Postventa",
    "encuesta de satisfacción": "Postventa",
    "garantía post-venta": "Postventa",
    "feedback post-servicio": "Postventa",
    "seguimiento de satisfacción": "Postventa",
    "encuesta nps": "Postventa",
    "revisión post-implementación": "Postventa",

    # Fidelización
    "gestión de programa de lealtad": "Fidelización",
    "programa de lealtad": "Fidelización",
    "manejo de relaciones vip": "Fidelización",
    "retención de clientes": "Fidelización",
    "beneficios para clientes frecuentes": "Fidelización",
    "puntos de recompensa": "Fidelización",
    "programa de fidelidad": "Fidelización",
    "club de beneficios": "Fidelización",
    "tarjeta de fidelización": "Fidelización",

    # Recompra
    "compra recurrente": "Recompra",
    "reordenar productos": "Recompra",
    "suscripción automática": "Recompra",
    "renovación de servicios": "Recompra",
    "pedido recurrente": "Recompra",
    "compra periódica": "Recompra",
    "reordenación automática": "Recompra",
    "recordatorio de recompra": "Recompra",

    # Upsell
    "ofrecer upgrade": "Upsell",
    "venta cruzada": "Upsell",
    "cross-sell": "Upsell",
    "ampliación de servicio": "Upsell",
    "aumento de ticket": "Upsell",
    "paquete superior": "Upsell",
    "upgrade de plan": "Upsell",
    "cross sell": "Upsell",
    "ampliar cobertura": "Upsell",
}

# ── Entradas que NO son casos de uso (integraciones, capabilities, garbage) ──
ENTRADAS_INVALIDAS: Set[str] = {
    "integración con logística regional",
    "integración con historiales médicos",
    "soporte multilingüe",
    "multilingüismo para clientes internacionales",
    "atención en horarios extendidos",
    "capacidad de mostrar imágenes de personalización",
    "capacidad de consulta en tiempo real",
    "capacidad de conversación natural",
    "capacidad de escala y estabilidad",
    "capacidad de escalabilidad",
    "capacidad de escalar a consultores",
    "capacidad de manejo de tarifas dinámicas",
    "capacidad de mantenimiento",
    "capacidad de multiidioma (quechua)",
    "capacidad de personalización",
    "capacidad de personalización técnica",
    "capacidad de precisión técnica",
    "capacidad de precisión y cero error",
    "capacidad de prueba previa",
    "capacidad de respuesta",
    "capacidad de respuesta técnica",
    "capacidad de uso por adultos mayores",
    "capacidad multiidioma",
}


def fix_encoding(val: str) -> str:
    """Corrige mojibake típico UTF-8 interpretado como Latin-1."""
    if not isinstance(val, str):
        return val
    try:
        return val.encode("latin-1").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return val


def normalize(val: str) -> str:
    """Limpia tildes, case, espacios."""
    val = fix_encoding(val)
    val = val.strip().lower().rstrip(".")
    val = " ".join(val.split())  # collapse spaces
    return val


def categorizar(valor: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Devuelve (caso_uso_limpio, categoria_vambe).
    Si es inválido, devuelve (None, None).
    """
    if not valor or not isinstance(valor, str):
        return valor, None

    key = normalize(valor)

    # Invalidar entradas que no son casos de uso
    if key in ENTRADAS_INVALIDAS:
        return None, None

    # Si ya es una categoría Vambe literal, devolver tal cual
    if valor.strip() in CATEGORIAS_VAMBE:
        return valor.strip(), valor.strip()

    # Mapeo explícito
    if key in MAPEO_CASOS:
        return valor.strip(), MAPEO_CASOS[key]

    # Heurísticas por bloque de negocio
    if any(w in key for w in ["agendar", "reserva", "cita", "visita", "booking", "calendario"]):
        return valor.strip(), "Agendamiento y Reservas"
    if any(w in key for w in ["cotiz", "presupuesto", "simulación", "financiamiento", "crédito"]):
        return valor.strip(), "Cotización y Presupuestos"
    if any(w in key for w in ["orden", "pedido", "compra", "venta", "contratación", "depósito", "pago", "checkout"]):
        return valor.strip(), "Procesamiento de Ventas y Órdenes"
    if any(w in key for w in ["reclamo", "queja", "soporte", "garantía", "falla", "error", "post-tratamiento", "mantenimiento", "técnico"]):
        return valor.strip(), "Soporte Técnico y Reclamos"
    if any(w in key for w in ["track", "rastreo", "envío", "entrega", "despacho", "logística", "carga", "flete", "transporte"]):
        return valor.strip(), "Seguimiento y Logística"
    if any(w in key for w in ["capacit", "educación", "onboarding", "guía", "tutorial", "tip", "explicar plataforma", "metodología", "entrenamiento", "formación"]):
        return valor.strip(), "Capacitación y Onboarding"
    if any(w in key for w in ["lead", "calificación", "captura", "prospecto", "evaluación de perfil", "calificar", "prospección"]):
        return valor.strip(), "Calificación y Captura de Leads"
    if any(w in key for w in ["asesor", "recomend", "sugerir", "personaliz", "talla", "diseño", "material", "paquete"]):
        return valor.strip(), "Asesoría y Recomendación"
    if any(w in key for w in ["documento", "verificación", "validación", "identidad", "historia clínica", "postulación", "acceso", "kyc"]):
        return valor.strip(), "Documentación y Verificación"
    if any(w in key for w in ["derivar", "escalar", "redireccionar", "humanos", "especialista", "tutor", "veterinario", "ingeniero", "ejecutivo", "farmaceútico", "supervisor"]):
        return valor.strip(), "Escalamiento y Derivación"
    if any(w in key for w in ["diagnóstico", "evaluación inicial", "prueba", "simulación", "madurez", "conocimiento previo", "assessment"]):
        return valor.strip(), "Diagnóstico y Evaluación"
    if any(w in key for w in ["notificación", "alerta", "actualización", "comunicación de eventos", "llegada", "salida", "retraso", "recordatorio"]):
        return valor.strip(), "Notificaciones y Alertas"
    if any(w in key for w in ["portafolio", "testimonio", "caso de éxito", "demostración", "avance", "proyecto anterior", "muestra", "presentación", "showcase"]):
        return valor.strip(), "Presentación de Contenidos"
    if any(w in key for w in ["postventa", "post-compra", "post-venta", "post-tratamiento", "post-servicio", "garantía extendida", "satisfacción post", "feedback post", "encuesta post"]):
        return valor.strip(), "Postventa"
    if any(w in key for w in ["fidelización", "lealtad", "puntos", "recompensa", "membresía", "retención", "vip", "frecuente", "programa de fidelidad", "club de beneficios", "tarjeta de fidelización"]):
        return valor.strip(), "Fidelización"
    if any(w in key for w in ["recompra", "recurrente", "reordenar", "suscripción", "renovación automática", "pedido recurrente", "compra periódica", "reordenación automática", "recordatorio de recompra"]):
        return valor.strip(), "Recompra"
    if any(w in key for w in ["upsell", "cross-sell", "cross sell", "venta cruzada", "upgrade", "ampliar", "paquete superior", "aumentar ticket", "upgrade de plan", "ampliar cobertura", "cross sell"]):
        return valor.strip(), "Upsell"
    if any(w in key for w in ["información", "consulta", "duda", "pregunta", "respuesta", "explicación", "ficha técnica", "especificación", "cobertura", "término", "procedimiento", "característica", "propiedad", "disponibilidad", "horario", "precio", "costo", "tarifa", "especificación"]):
        return valor.strip(), "Información y Consultas"

    # Por defecto conservar el texto original pero categorizar como Otro
    return valor.strip(), "Otro"


def procesar_principales(arr: Optional[List[str]]) -> Tuple[List[str], bool]:
    """
    Normaliza casos_uso_principales a categorías Vambe.
    Devuelve (categorias_vambe_deduped, cambió).
    """
    if not isinstance(arr, list):
        return [], False

    cats: List[str] = []
    cambio = False
    vistos: Set[str] = set()

    for item in arr:
        if not isinstance(item, str):
            cambio = True
            continue

        caso_limpio, categoria = categorizar(item)
        if caso_limpio is None or categoria is None:
            cambio = True
            continue

        # Detectar si el texto original era diferente a la categoría final
        if normalize(item) != normalize(categoria):
            cambio = True

        if categoria not in vistos:
            vistos.add(categoria)
            cats.append(categoria)
        else:
            cambio = True  # duplicado eliminado

    return cats, cambio


def procesar_nuevos(arr: Optional[List[str]]) -> Tuple[List[str], List[str], bool]:
    """
    Limpia casos_uso_nuevos (str libre) y detecta overlaps con Vambe.
    Devuelve (nuevos_limpios, para_mover_a_principales, cambió).
    """
    if not isinstance(arr, list):
        return [], [], False

    nuevos: List[str] = []
    mover: List[str] = []
    cambio = False
    vistos: Set[str] = set()
    vistos_lower: Set[str] = set()

    for item in arr:
        if not isinstance(item, str):
            cambio = True
            continue

        limpio = fix_encoding(item).strip()
        if not limpio:
            cambio = True
            continue

        # Si ya es una categoría Vambe literal, mover a principales
        if limpio in CATEGORIAS_VAMBE:
            if limpio not in vistos:
                vistos.add(limpio)
                mover.append(limpio)
            cambio = True
            continue

        # Si categoriza a Vambe (y no es Otro), mover a principales
        _, categoria = categorizar(item)
        if categoria and categoria != "Otro" and categoria in CATEGORIAS_VAMBE:
            if categoria not in vistos:
                vistos.add(categoria)
                mover.append(categoria)
            cambio = True
            continue

        # Si es inválido (capability/integration), eliminar
        if normalize(item) in ENTRADAS_INVALIDAS:
            cambio = True
            continue

        # Conservar como nuevo (deduplicado case-insensitive)
        key_lower = limpio.lower()
        if key_lower not in vistos_lower:
            vistos_lower.add(key_lower)
            nuevos.append(limpio)
        else:
            cambio = True

    return nuevos, mover, cambio


def clean_jsonb_principales(obj: dict, path_casos: str, path_cats: str) -> bool:
    """Limpia casos_uso_principales dentro de un JSONB anidado."""
    keys = path_casos.split(".")
    target = obj
    for key in keys[:-1]:
        if not isinstance(target, dict) or key not in target:
            return False
        target = target[key]
    last = keys[-1]
    if last not in target or not isinstance(target[last], list):
        return False

    nuevo_casos, cambio = procesar_principales(target[last])
    if not cambio:
        # Verificar si el contenido realmente cambió (puede que no haya duplicados pero sí reorden)
        if list(nuevo_casos) == list(target[last]):
            return False

    target[last] = nuevo_casos

    # Sincronizar casos_uso_categorias (ahora redundante, pero mantenemos consistencia)
    cat_keys = path_cats.split(".")
    cat_target = obj
    for key in cat_keys[:-1]:
        if key not in cat_target:
            cat_target[key] = {}
        cat_target = cat_target[key]
    cat_target[cat_keys[-1]] = nuevo_casos
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normaliza casos_uso_principales a categorías Vambe y limpia casos_uso_nuevos"
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
    distribucion_cats: Dict[str, int] = {}
    nuevos_stats: Dict[str, int] = {}
    eliminados_invalidos = 0
    movidos_a_principales = 0
    offset = 0
    page = 1

    while True:
        query = (
            supabase.table(args.table)
            .select("id,casos_uso_principales,casos_uso_nuevos,raw_extraction")
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

            update_data: Dict[str, any] = {}
            changed = False
            principales_actuales: Set[str] = set()

            # ── 1. Columna plana: casos_uso_principales ──
            original_arr = reg.get("casos_uso_principales")
            if isinstance(original_arr, list):
                nuevo_cats, arr_cambio = procesar_principales(original_arr)
                # Contar eliminados
                eliminados_invalidos += len([x for x in original_arr if isinstance(x, str) and normalize(x) in ENTRADAS_INVALIDAS])
                if arr_cambio or set(nuevo_cats) != set(original_arr):
                    update_data["casos_uso_principales"] = nuevo_cats
                    changed = True
                    for c in nuevo_cats:
                        distribucion_cats[c] = distribucion_cats.get(c, 0) + 1
                    principales_actuales.update(nuevo_cats)
                else:
                    principales_actuales.update(original_arr)
                    for c in original_arr:
                        if isinstance(c, str):
                            _, cat = categorizar(c)
                            if cat:
                                distribucion_cats[cat] = distribucion_cats.get(cat, 0) + 1
            else:
                # Si no es lista, limpiar a lista vacía
                if original_arr is not None:
                    update_data["casos_uso_principales"] = []
                    changed = True

            # ── 2. Columna plana: casos_uso_nuevos ──
            original_nuevos = reg.get("casos_uso_nuevos")
            if isinstance(original_nuevos, list):
                nuevo_nuevos, mover_nuevos, nuevos_cambio = procesar_nuevos(original_nuevos)

                # Mover los que calzan con Vambe a principales
                if mover_nuevos:
                    principales_finales = list(principales_actuales | set(mover_nuevos))
                    update_data["casos_uso_principales"] = principales_finales
                    changed = True
                    movidos_a_principales += len(mover_nuevos)

                if nuevos_cambio or len(nuevo_nuevos) != len(original_nuevos):
                    update_data["casos_uso_nuevos"] = nuevo_nuevos
                    changed = True

                for item in nuevo_nuevos:
                    nuevos_stats[item] = nuevos_stats.get(item, 0) + 1
            else:
                if original_nuevos is not None:
                    update_data["casos_uso_nuevos"] = []
                    changed = True

            # ── 3. JSONB raw_extraction ──
            raw = reg.get("raw_extraction")
            if isinstance(raw, dict):
                raw_changed = clean_jsonb_principales(
                    raw,
                    "necesidades_y_casos_uso.casos_uso_principales",
                    "necesidades_y_casos_uso.casos_uso_categorias",
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
    print(f"  ACTUALIZADOS          : {actualizados}")
    print(f"  SIN CAMBIOS           : {limpios}")
    print(f"  FALLIDOS              : {fallidos}")
    print(f"  MOVIDOS A PRINCIPALES : {movidos_a_principales}")
    print(f"  INVÁLIDOS ELIMINADOS  : {eliminados_invalidos}")
    print("═" * 50)
    print()
    print("  Distribución de categorías Vambe (casos_uso_principales):")
    for cat, cnt in sorted(distribucion_cats.items(), key=lambda x: -x[1]):
        print(f"    {cat:40s}: {cnt:5d}")
    if nuevos_stats:
        print()
        print("  Top 20 casos de uso no soportados (casos_uso_nuevos):")
        for caso, cnt in sorted(nuevos_stats.items(), key=lambda x: -x[1])[:20]:
            print(f"    {caso:45s}: {cnt:5d}")


if __name__ == "__main__":
    main()
