"""
Script para consolidar casos_de_uso en la tabla clients de Supabase.
Mapea cada string en el array a una categoría macro, deduplica y actualiza.

Uso:
    python consolidate_casos_uso.py
"""

import json
import os
from datetime import datetime

from supabase import Client, create_client

from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ──────────────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "your-key")

BACKUP_FILE = f"casos_uso_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
BATCH_SIZE = 100


# ──────────────────────────────────────────────────────────────────────────────
# MAPEO: caso de uso específico → categoría macro
# ──────────────────────────────────────────────────────────────────────────────

def get_caso_uso_group(original: str) -> str:
    if not original or original == ',':
        return "Otros"

    lower = original.lower().strip()
    # Fix common encoding typo
    lower = lower.replace("gestiónión", "gestión")

    # 1. ACLARACIÓN DE DUDAS Y FAQ
    if any(k in lower for k in [
        "aclaración de dudas", "aclarar dudas", "aclaración de ", "aclarar ",
        "resolución de dudas", "resolver dudas",
        "resolución de preguntas frecuentes", "resolución de ",
        "responder dudas", "responder preguntas", "responder sobre",
        "respuesta de preguntas", "respuesta de ",
    ]):
        return "Aclaración de Dudas y FAQ"

    # 2. ESCALAMIENTO A HUMANOS (checked early to avoid "gestión de reclamos" conflicts)
    if any(k in lower for k in [
        "derivación", "derivar ", "derivar", "escalamiento", "escalar ", "escalar",
        "escalación", "escalado ", "escalado",
        "traspaso a humano", "derivación a ", "casos complejos a agentes", "agentes humanos"
    ]):
        return "Escalamiento a Humanos"

    # 3. ACELERACIÓN DE VENTAS Y CONVERSIÓN
    if any(k in lower for k in [
        "acelerar procesos de ", "acelerar ", "acelerar proceso", "acelerar compra",
        "captación de ", "captar ", "promoción de ", "promover ",
        "aumento de ", "aumentar ", "ofrecer ", "disminución de carga",
        "volatilidad de "
    ]):
        return "Aceleración de Ventas y Conversión"

    # 4. AGENDAMIENTO Y CITAS
    if any(k in lower for k in [
        "agendamiento de ", "agendar ", "agendamiento automático",
        "programar visitas", "programar citas", "programar ",
        "realizar reservas", "realizar reserva", "toma de reservas",
        "reservas en tiempo real", "reserva online", "check-in anticipado"
    ]):
        return "Agendamiento y Citas"

    # 5. CONSULTAS Y DISPONIBILIDAD
    if any(k in lower for k in [
        "consulta de ", "consultar ", "consultas sobre ", "consulta sobre ",
        "búsqueda de ", "buscar "
    ]):
        return "Consultas y Disponibilidad"

    # 6. INFORMACIÓN Y ORIENTACIÓN
    if any(k in lower for k in [
        "información de ", "información sobre ", "informar sobre ", "informar ",
        "explicación de ", "explicar ", "presentación de ", "presentar ",
        "educación sobre ", "educar sobre ", "educación financiera",
        "describir ", "proporcionar "
    ]):
        # Guard: don't catch "educación corporativa" as info
        if "educación" in lower and not any(k in lower for k in ["educación sobre", "educación financiera", "educar sobre"]):
            pass  # fall through
        else:
            return "Información y Orientación"

    # 7. GESTIÓN DE PEDIDOS Y OPERACIONES
    if any(k in lower for k in [
        "gestión de ", "gest de ", "manejo de ", "procesamiento de ",
        "procesar ", "gestionar ", "manejar ",
        "cambios y devoluciones", "devoluciones", "reembolsos",
        "reclamos", "órdenes", "ordenes", "pre-órdenes", "pre-ordenes",
        "solicitudes especiales", "solicitud de",
        "generación de ", "generar ", "recibir ", "captura de ",
        "toma de datos", "recopilación de datos", "integración con "
    ]):
        return "Gestión de Pedidos y Operaciones"

    # 8. COMUNICACIÓN Y NOTIFICACIONES
    if any(k in lower for k in [
        "envío de ", "enviar ", "enviando ", "comunicación de ", "comunicar ",
        "notificación de ", "notificar ", "recordatorio", "recordatorios",
        "alertas", "alerta de", "confirmación de ", "confirmar ",
        "actualizaciones de estado", "actualización de estado"
    ]):
        return "Comunicación y Notificaciones"

    # 9. COTIZACIÓN Y PRESUPUESTOS
    if any(k in lower for k in [
        "cotización de ", "cotizar ", "cotización dinámica", "cotización ",
        "presupuestos", "presupuestación", "presupuesto",
        "estimación de costos", "cálculo de ", "calcular "
    ]):
        return "Cotización y Presupuestos"

    # 10. CALIFICACIÓN DE LEADS Y PROSPECTOS
    if any(k in lower for k in [
        "calificación de ", "calificar ", "pre-calificación", "pre calificación",
        "calificación de leads", "calificación de prospectos",
        "calificación de inversores", "calificación de empresas",
        "calificación de pedidos"
    ]):
        return "Calificación de Leads y Prospectos"

    # 11. PAGOS Y TRANSACCIONES
    if any(k in lower for k in [
        "pago", "pagos", "financiamiento", "transacciones",
        "procesar pagos", "procesar donaciones",
        "suscripciones", "suscripción", "membresías", "membresias",
        "cambios de plan", "cambio de plan"
    ]):
        return "Pagos y Transacciones"

    # 12. SEGUIMIENTO Y TRACKING
    if any(k in lower for k in [
        "seguimiento de ", "tracking", "rastreo",
        "seguimiento de envíos", "seguimiento de paquetes",
        "avance de reparaciones", "consultar avance"
    ]):
        return "Seguimiento y Tracking"

    # 13. ACCESO A CONTENIDO Y CATÁLOGOS
    if any(k in lower for k in [
        "acceso a ", "acceso al ", "mostrar ", "visualización de ", "visualizar "
    ]):
        return "Acceso a Contenido y Catálogos"

    # 14. AUTOMATIZACIÓN DE PROCESOS
    if any(k in lower for k in [
        "automatización de ", "automatizar ", "automatización de consultas",
        "automatización de respuestas", "automatización de citas",
        "automatización de reservas", "automatización de inscripción",
        "automatización de agendamiento"
    ]):
        return "Automatización de Procesos"

    # 15. RECOMENDACIONES Y SUGERENCIAS
    if any(k in lower for k in [
        "recomendación de ", "recomendar ", "sugerencia de ", "sugerir ",
        "recomendaciones de ", "recomendaciones ", "recomendaciones por ",
        "recomendaciones turísticas", "asesorar "
    ]):
        return "Recomendaciones y Sugerencias"

    # 16. COORDINACIÓN Y LOGÍSTICA
    if any(k in lower for k in [
        "coordinación de ", "coordinar ", "facilitación de ", "facilitar ",
        "coordinación de pruebas", "coordinación de visitas",
        "coordinación de reuniones", "coordinación de entregas"
    ]):
        return "Coordinación y Logística"

    # 17. DEMOSTRACIONES Y PRUEBAS
    if any(k in lower for k in [
        "demostración", "demostraciones", "demo ", "demos ",
        "prueba de ", "pruebas de ", "pruebas de selección",
        "pruebas de nivel", "prueba gratuita", "pruebas gratuitas",
        "clases de prueba", "sesiones de prueba"
    ]):
        return "Demostraciones y Pruebas"

    # 18. INSCRIPCIÓN Y REGISTRO
    if any(k in lower for k in [
        "inscripción", "inscripcion", "matrícula", "matricula",
        "registro de ", "registrar ", "inscribir ", "inscribirse"
    ]):
        return "Inscripción y Registro"

    # 19. DIAGNÓSTICO Y EVALUACIÓN
    if any(k in lower for k in [
        "diagnóstico de ", "diagnóstico ", "evaluación de ", "evaluar ",
        "evaluación de aptitudes", "evaluación de nivel",
        "identificación de ", "identificar ",
        "identificación de casos", "identificación de urgencias",
        "detección de problemas", "triaje", "triaje básico",
        "diferenciación de ", "diferenciar "
    ]):
        return "Diagnóstico y Evaluación"

    # 20. ATENCIÓN Y SOPORTE
    if any(k in lower for k in [
        "atención de ", "atención en ", "atención de consultas",
        "atención de problemas", "atencion de ", "atencion en ",
        "soporte técnico", "soporte tecnico", "soporte inicial",
        "atención 24/7", "atención básica", "atencion 24/7", "atencion básica"
    ]):
        return "Atención y Soporte"

    # 21. VALIDACIÓN Y VERIFICACIÓN
    if any(k in lower for k in [
        "validación de ", "validar ", "verificación de ", "verificar ",
        "verificación de stock", "verificación de requisitos",
        "verificación de cliente", "validación de disponibilidad",
        "compatibilidad de ", "compatibilidad "
    ]):
        return "Validación y Verificación"

    # 22. PERSONALIZACIÓN
    if any(k in lower for k in ["personalización", "personalizar", "personalizacion"]):
        return "Personalización"

    return "Otros"


# ──────────────────────────────────────────────────────────────────────────────
# SUPABASE FUNCTIONS
# ──────────────────────────────────────────────────────────────────────────────

def get_client(url: str, service_role_key: str) -> Client:
    return create_client(url, service_role_key)


def fetch_all_clients(db: Client) -> list[dict]:
    """Obtiene todos los registros con id y casos_uso. Paginado para >1000 rows."""
    all_rows = []
    batch_size = 1000
    start = 0

    while True:
        result = (
            db.table("clients")
            .select("id, casos_uso")
            .order("id")
            .range(start, start + batch_size - 1)
            .execute()
        )
        rows = result.data or []
        all_rows.extend(rows)
        if len(rows) < batch_size:
            break
        start += batch_size

    return all_rows


def update_casos_uso_batch(db: Client, updates: list[dict]) -> None:
    for item in updates:
        db.table("clients").update(
            {"casos_uso": item["new_casos_uso"]}
        ).eq("id", item["id"]).execute()


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    print("🔌 Conectando a Supabase...")
    db = get_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("📥 Descargando registros...")
    rows = fetch_all_clients(db)
    print(f"   → {len(rows)} registros encontrados")

    if not rows:
        print("⚠️  No hay registros para procesar.")
        return

    # 1. Backup
    backup = {
        "timestamp": datetime.now().isoformat(),
        "total_records": len(rows),
        "records": rows,
    }
    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(backup, f, ensure_ascii=False, indent=2)
    print(f"💾 Backup guardado en: {BACKUP_FILE}")

    # 2. Calcular nuevos grupos
    updates = []
    stats = Counter()
    changed_count = 0

    for row in rows:
        original_list = row.get("casos_uso") or []
        if not original_list:
            continue

        # Map each element individually, then deduplicate
        mapped = []
        for caso in original_list:
            group = get_caso_uso_group(caso)
            mapped.append(group)
            stats[group] += 1

        # Deduplicate while preserving order
        seen = set()
        new_list = []
        for g in mapped:
            if g not in seen:
                seen.add(g)
                new_list.append(g)

        if new_list != original_list:
            updates.append({
                "id": row["id"],
                "original": original_list,
                "new_casos_uso": new_list,
            })
            changed_count += 1

    print(f"\n📊 Resumen de grupos resultantes:")
    for group, count in stats.most_common():
        print(f"   {group}: {count}")

    if not updates:
        print("\n✅ No hay cambios pendientes.")
        return

    print(f"\n📝 {changed_count} registros serán modificados.")
    confirm = input("¿Proceder con la actualización? [y/N]: ").strip().lower()
    if confirm not in ("y", "yes", "s", "si", "sí"):
        print("❌ Cancelado por el usuario.")
        return

    # 3. Aplicar updates por batches
    print(f"\n🚀 Aplicando cambios en batches de {BATCH_SIZE}...")
    for i in range(0, len(updates), BATCH_SIZE):
        batch = updates[i : i + BATCH_SIZE]
        update_casos_uso_batch(db, batch)
        print(f"   → Batch {i//BATCH_SIZE + 1}/{(len(updates)-1)//BATCH_SIZE + 1}")

    # 4. Log
    log_file = f"casos_uso_changes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_updated": len(updates),
            "changes": updates,
        }, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Log guardado en: {log_file}")
    print("✅ ¡Listo! Los casos de uso han sido consolidados.")


if __name__ == "__main__":
    main()