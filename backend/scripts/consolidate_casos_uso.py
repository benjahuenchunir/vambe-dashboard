"""
Normaliza casos_uso_principales (corrige encoding, elimina duplicados, filtra inválidos)
y genera casos_uso_categorias (macro-categorías) para la tabla clients.

Uso:
    python -m scripts.consolidate_casos_uso --table clients --batch-size 500
    python -m scripts.consolidate_casos_uso --table clients --dry-run
"""

import argparse
import unicodedata
from typing import Dict, List, Optional, Set, Tuple

from data import db
from config import load_settings

# ── Categorías macro válidas ──
CATEGORIAS: Set[str] = {
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
    "Otro",
}

# ── Mapeo explícito: caso de uso normalizado → categoría macro ──
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
    "consulta de materiales y durabilidad": "Información y Consultas",

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
    "gestión de programa de lealtad": "Procesamiento de Ventas y Órdenes",

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
    Devuelve (caso_uso_limpio, categoria_macro).
    Si es inválido, devuelve (None, None).
    """
    if not valor or not isinstance(valor, str):
        return valor, None

    key = normalize(valor)

    # Invalidar entradas que no son casos de uso
    if key in ENTRADAS_INVALIDAS:
        return None, None

    # Mapeo explícito
    if key in MAPEO_CASOS:
        return valor.strip(), MAPEO_CASOS[key]

    # Heurísticas
    if "agendar" in key or "reserva" in key or "cita" in key or "visita" in key or "booking" in key:
        return valor.strip(), "Agendamiento y Reservas"
    if "cotiz" in key or "presupuesto" in key or "simulación" in key or "financiamiento" in key:
        return valor.strip(), "Cotización y Presupuestos"
    if any(w in key for w in ["orden", "pedido", "compra", "venta", "contratación", "depósito", "pago"]):
        return valor.strip(), "Procesamiento de Ventas y Órdenes"
    if any(w in key for w in ["reclamo", "queja", "soporte", "garantía", "falla", "error", "post-tratamiento", "mantenimiento"]):
        return valor.strip(), "Soporte Técnico y Reclamos"
    if any(w in key for w in ["track", "rastreo", "envío", "entrega", "despacho", "logística", "carga", "flete"]):
        return valor.strip(), "Seguimiento y Logística"
    if any(w in key for w in ["capacit", "educación", "onboarding", "guía", "tutorial", "tip", "explicar plataforma", "metodología", "entrenamiento"]):
        return valor.strip(), "Capacitación y Onboarding"
    if any(w in key for w in ["lead", "calificación", "captura", "prospecto", "evaluación de perfil", "calificar"]):
        return valor.strip(), "Calificación y Captura de Leads"
    if any(w in key for w in ["asesor", "recomend", "sugerir", "personaliz", "talla", "diseño", "material", "paquete"]):
        return valor.strip(), "Asesoría y Recomendación"
    if any(w in key for w in ["documento", "verificación", "validación", "identidad", "historia clínica", "postulación", "acceso"]):
        return valor.strip(), "Documentación y Verificación"
    if any(w in key for w in ["derivar", "escalar", "redireccionar", "humanos", "especialista", "tutor", "veterinario", "ingeniero", "ejecutivo", "farmaceútico"]):
        return valor.strip(), "Escalamiento y Derivación"
    if any(w in key for w in ["diagnóstico", "evaluación inicial", "prueba", "simulación", "madurez", "conocimiento previo"]):
        return valor.strip(), "Diagnóstico y Evaluación"
    if any(w in key for w in ["notificación", "alerta", "actualización", "comunicación de eventos", "llegada", "salida", "retraso"]):
        return valor.strip(), "Notificaciones y Alertas"
    if any(w in key for w in ["portafolio", "testimonio", "caso de éxito", "demostración", "avance", "proyecto anterior", "muestra", "presentación"]):
        return valor.strip(), "Presentación de Contenidos"
    if any(w in key for w in ["información", "consulta", "duda", "pregunta", "respuesta", "explicación", "ficha técnica", "especificación", "cobertura", "término", "procedimiento", "característica", "propiedad", "disponibilidad", "horario", "precio", "costo"]):
        return valor.strip(), "Información y Consultas"

    # Por defecto conservar el texto original pero categorizar como Otro
    return valor.strip(), "Otro"


def procesar_array(arr: Optional[List[str]]) -> Tuple[List[str], List[str], bool]:
    """
    Devuelve (casos_uso_limpios, categorias, cambió).
    Filtra inválidos, corrige encoding, deduplica.
    """
    if not isinstance(arr, list):
        return [], [], False

    casos_limpios = []
    categorias = []
    cambio = False
    vistos_casos = set()
    vistos_cat = set()

    for item in arr:
        if not isinstance(item, str):
            continue
        caso_limpio, categoria = categorizar(item)
        if caso_limpio is None:
            cambio = True
            continue
        if caso_limpio.lower() != item.lower() or fix_encoding(item) != item:
            cambio = True
        if caso_limpio not in vistos_casos:
            vistos_casos.add(caso_limpio)
            casos_limpios.append(caso_limpio)
        else:
            cambio = True
        if categoria and categoria not in vistos_cat:
            vistos_cat.add(categoria)
            categorias.append(categoria)

    return casos_limpios, categorias, cambio


def clean_jsonb(obj: dict, path_casos: str, path_cats: str) -> bool:
    keys = path_casos.split(".")
    for key in keys[:-1]:
        if not isinstance(obj, dict) or key not in obj:
            return False
        obj = obj[key]
    last = keys[-1]
    if last not in obj or not isinstance(obj[last], list):
        return False

    nuevo_casos, nuevo_cats, cambio = procesar_array(obj[last])
    if not cambio:
        return False

    obj[last] = nuevo_casos
    # Set categorías en el JSONB si existe el path
    cat_keys = path_cats.split(".")
    cat_target = obj
    for key in cat_keys[:-1]:
        if key not in cat_target:
            cat_target[key] = {}
        cat_target = cat_target[key]
    cat_target[cat_keys[-1]] = nuevo_cats
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normaliza casos_uso_principales y genera casos_uso_categorias"
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
    distribucion_casos: Dict[str, int] = {}
    distribucion_cats: Dict[str, int] = {}
    eliminados_invalidos = 0
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

            update_data = {}
            changed = False

            # ── 1. Columna plana: casos_uso_principales ──
            original_arr = reg.get("casos_uso_principales")
            if isinstance(original_arr, list):
                nuevo_casos, nuevo_cats, arr_cambio = procesar_array(original_arr)
                if arr_cambio:
                    update_data["casos_uso_principales"] = nuevo_casos
                    update_data["casos_uso_categorias"] = nuevo_cats
                    changed = True
                    eliminados_invalidos += len(original_arr) - len(nuevo_casos)
                    for c in nuevo_casos:
                        distribucion_casos[c] = distribucion_casos.get(c, 0) + 1
                    for c in nuevo_cats:
                        distribucion_cats[c] = distribucion_cats.get(c, 0) + 1
                else:
                    for item in original_arr:
                        caso, cat = categorizar(item)
                        if caso:
                            distribucion_casos[caso] = distribucion_casos.get(caso, 0) + 1
                        if cat:
                            distribucion_cats[cat] = distribucion_cats.get(cat, 0) + 1

            # ── 2. Columna plana: casos_uso_nuevos (también limpiar) ──
            original_nuevos = reg.get("casos_uso_nuevos")
            if isinstance(original_nuevos, list):
                nuevo_nuevos, _, nuevos_cambio = procesar_array(original_nuevos)
                if nuevos_cambio:
                    update_data["casos_uso_nuevos"] = nuevo_nuevos
                    changed = True

            # ── 3. JSONB raw_extraction ──
            raw = reg.get("raw_extraction")
            if isinstance(raw, dict):
                raw_changed = clean_jsonb(
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
    print(f"  ACTUALIZADOS : {actualizados}")
    print(f"  SIN CAMBIOS  : {limpios}")
    print(f"  FALLIDOS     : {fallidos}")
    print(f"  ELIMINADOS   : {eliminados_invalidos} (entradas inválidas)")
    print("═" * 50)
    print()
    print("  Top 20 casos de uso específicos:")
    for caso, cnt in sorted(distribucion_casos.items(), key=lambda x: -x[1])[:20]:
        print(f"    {caso:45s}: {cnt:5d}")
    print()
    print("  Distribución de categorías macro:")
    for cat, cnt in sorted(distribucion_cats.items(), key=lambda x: -x[1]):
        print(f"    {cat:35s}: {cnt:5d}")


if __name__ == "__main__":
    main()
