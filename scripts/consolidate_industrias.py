"""
Script para agrupar y consolidar valores similares en la columna 'industria' de Supabase.

Flujo:
1. Conecta a Supabase y extrae todos los registros (id, industria).
2. Guarda un backup local (JSON) con los valores originales.
3. Aplica un mapeo basado en keywords para agrupar industrias similares.
4. Actualiza la columna 'industria' directamente en la base de datos.

Uso:
    python consolidate_industrias.py
"""

import json
import os
from datetime import datetime
from typing import Callable

from supabase import Client, create_client

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")
BACKUP_FILE = f"industria_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
BATCH_SIZE = 100


# ──────────────────────────────────────────────────────────────────────────────
# MAPEO: industria original → grupo consolidado
# ──────────────────────────────────────────────────────────────────────────────
# Orden importa: las reglas más específicas deben ir ANTES que las generales.

def get_industria_group(original: str) -> str:
    """Devuelve el grupo consolidado para una industria dada."""
    if not original:
        return "Otros"

    lower = original.lower()

    # ── 1. EDUCACIÓN Y FORMACIÓN ─────────────────────────────────────────────
    if any(k in lower for k in [
        "academia", "escuela", "edtech", "educación", "educacion", "colegio",
        "preparación universitaria", "preparacion universitaria",
        "plataforma de educación", "plataforma de educacion",
        "capacitación", "capacitacion", "biblioteca"
    ]):
        return "Educación y Formación"

    # ── 2. SALUD, BIENESTAR Y FITNESS ───────────────────────────────────────
    if any(k in lower for k in [
        "clínica", "clinica", "salud", "veterinaria", "gimnasio", "deporte",
        "bienestar", "fisioterapia", "dermatología", "dermatologia",
        "oftalmología", "oftalmologia", "psicología", "psicologia",
        "dental", "odontología", "odontologia", "medicina estética",
        "medicina estetica", "cirugía plástica", "cirugia plastica",
        "laboratorio", "óptica", "optica", "farmacia", "peluquería",
        "peluqueria", "cosmética", "cosmetica", "cosméticos", "cosmeticos",
        "yoga", "meditación", "meditacion", "telecare",
        "centro de entrenamiento", "centros deportivos",
        "escuela de deportes", "escuela de equitación", "escuela de equitacion",
        "escuela de surf", "artes marciales", "baile", "tenis",
        "equipamiento deportivo", "equipamiento médico", "equipamiento medico",
        "centro de diagnóstico", "centro de diagnostico", "diagnóstico", "diagnostico"
    ]):
        return "Salud, Bienestar y Fitness"

    # ── 3. TECNOLOGÍA, SOFTWARE E IT ─────────────────────────────────────────
    if any(k in lower for k in [
        "software", "tecnología", "tecnologia", "it managed", "telecomunicaciones",
        "ciberseguridad", "transformación digital", "transformacion digital",
        "reclutamiento it", "reclutamiento it",
        "servicios técnicos de computación", "servicios tecnicos de computacion",
        "servicio técnico de computación", "servicio tecnico de computacion",
        "reparación de computadoras", "reparacion de computadoras",
        "reparación de electrodomésticos", "reparacion de electrodomesticos",
        "sistemas de seguridad física", "sistemas de seguridad fisica",
        "señalética", "señaletica", "rotulación", "rotulacion",
        "imprenta digital", "startup de desarrollo de software",
        "plataforma de streaming", "plataforma de entretenimiento en línea",
        "plataforma de entretenimiento en linea",
        "plataforma de publicación", "plataforma de publicacion",
        "ong de tecnología", "ong de tecnologia"
    ]):
        return "Tecnología, Software e IT"

    # ── 4. FINANZAS, SEGUROS Y CONTABILIDAD ─────────────────────────────────
    if any(k in lower for k in [
        "seguro", "fintech", "financier", "aseguradora", "corredora de seguros",
        "crowdfunding", "casa de empeños", "casa de empenos",
        "asesoría contable", "asesoria contable",
        "consultoría tributaria", "consultoria tributaria",
        "consultoría contable", "consultoria contable",
        "outsourcing contable", "firma de contadores",
        "servicios de contabilidad", "consultoría financiera", "consultoria financiera"
    ]):
        return "Finanzas, Seguros y Contabilidad"

    # ── 5. RETAIL, COMERCIO Y E-COMMERCE ────────────────────────────────────
    if any(k in lower for k in [
        "retail", "tienda", "boutique", "ecommerce", "e-commerce", "marketplace",
        "librería", "libreria", "floristería", "floristeria", "farmacia",
        "supermercado", "centro comercial", "tienda departamental",
        "juguetería", "jugueteria", "calzado", "zapatería", "zapateria",
        "ropa infantil", "moda", "joyería", "joyeria",
        "distribuidora de electrónica", "distribuidora de electronica",
        "distribuidora de electrodomésticos", "distribuidora de electrodomesticos"
    ]):
        return "Retail, Comercio y E-commerce"

    # ── 6. ALIMENTOS, BEBIDAS Y GASTRONOMÍA ─────────────────────────────────
    if any(k in lower for k in [
        "alimento", "catering", "panadería", "panaderia", "pastelería", "pasteleria",
        "repostería", "reposteria", "comida", "gastronomía", "gastronomia",
        "restaurante", "bodega de vinos", "aguas de catering",
        "exportación de frutas", "exportacion de frutas",
        "exportación de vinos", "exportacion de vinos",
        "productos orgánicos", "productos organicos",
        "distribución de bebidas", "distribucion de bebidas",
        "almacén mayorista", "almacen mayorista",
        "distribuidora de alimentos"
    ]):
        return "Alimentos, Bebidas y Gastronomía"

    # ── 7. CONSTRUCCIÓN, INMOBILIARIA Y MANTENIMIENTO ───────────────────────
    if any(k in lower for k in [
        "construcción", "construccion", "constructora", "inmobiliaria",
        "instalación de piscinas", "instalacion de piscinas",
        "cantera", "productos de construcción", "productos de construccion",
        "mantenimiento de edificios", "mantenimiento de ascensores",
        "mantenimiento de aire acondicionado",
        "plomería", "plomeria", "electricidad",
        "jardinería", "jardineria", "paisajismo",
        "decoración de interiores", "decoracion de interiores",
        "servicios de jardinería", "servicios de jardineria",
        "estudio de arquitectura", "arquitectura",
        "distribuidora de productos de jardinería", "distribuidora de productos de jardineria",
        "distribuidora de productos de paisajismo"
    ]):
        return "Construcción, Inmobiliaria y Mantenimiento"

    # ── 8. INDUSTRIA, MANUFACTURA Y SUMINISTROS ──────────────────────────────
    if any(k in lower for k in [
        "manufactura", "manufacturera", "fabricación", "fabricacion",
        "suministros industriales", "reciclaje",
        "limpieza industrial", "mantención industrial", "mantencion industrial",
        "control de plagas", "repuestos industriales", "insumos de laboratorio",
        "componentes plásticos", "componentes plasticos",
        "piezas metálicas", "piezas metalicas",
        "productos de cuero", "manufactura textil", "dulces",
        "cosméticos naturales", "cosmeticos naturales",
        "distribuidora de productos de limpieza industrial",
        "distribuidora de repuestos industriales",
        "distribuidora de insumos de laboratorio"
    ]):
        return "Industria, Manufactura y Suministros"

    # ── 9. TRANSPORTE, LOGÍSTICA Y AUTOMOTRIZ ───────────────────────────────
    if any(k in lower for k in [
        "transporte", "logística", "logistica", "mudanzas",
        "concesionaria", "taller automotriz",
        "taller de mecánica", "taller de mecanica",
        "taller de reparación automotriz", "taller de reparacion automotriz",
        "recambios", "repuestos para automóviles", "repuestos para automoviles",
        "autopartes", "partes automotrices", "partes automotrices",
        "escuela de conducción", "escuela de conduccion",
        "agencia de arriendo de vehículos", "agencia de arriendo de vehiculos",
        "taller mecánico", "taller mecanico",
        "transporte de carga", "transporte de pasajeros",
        "transporte ejecutivo", "transporte privado", "transporte escolar",
        "transporte de taxis", "transporte y mudanzas"
    ]):
        return "Transporte, Logística y Automotriz"

    # ── 10. MARKETING, MEDIOS Y CREATIVIDAD ─────────────────────────────────
    if any(k in lower for k in [
        "marketing digital", "publicidad digital", "publicidad exterior",
        "diseño gráfico", "diseño grafico", "branding",
        "fotografía", "fotografia", "galería de arte", "galeria de arte",
        "estudio de fotografía", "estudio de fotografia",
        "fotografía matrimonial", "fotografia matrimonial",
        "estudio de cine", "producción audiovisual", "produccion audiovisual",
        "editorial", "editoriales",
        "eventos corporativos", "eventos y catering",
        "producción de eventos", "produccion de eventos",
        "productora de eventos deportivos", "productora audiovisual",
        "alquiler de equipos para eventos", "organización de eventos",
        "organizacion de eventos", "agencia de viajes",
        "plataforma de publicación", "plataforma de publicacion",
        "cine y artes", "cine y producción"
    ]):
        return "Marketing, Medios y Creatividad"

    # ── 11. SERVICIOS PROFESIONALES Y LEGALES ────────────────────────────────
    if any(k in lower for k in [
        "abogados", "asesoría legal", "asesoria legal", "asesoramiento legal",
        "despacho de abogados", "bufete de abogados",
        "estudio jurídico", "estudio juridico",
        "consultora de recursos humanos", "consultoría de recursos humanos",
        "consultoria de recursos humanos", "outsourcing de recursos humanos",
        "consultora de servicios profesionales",
        "consultoría de servicios profesionales",
        "consultoria de servicios profesionales",
        "investigación privada", "investigacion privada",
        "consultora de tributación", "consultoria de tributacion",
        "agencia de aduanas", "asesoría laboral", "asesoria laboral",
        "consultoría ambiental", "consultoria ambiental",
        "consultoría de sostenibilidad", "consultoria de sostenibilidad",
        "consultoría estratégica", "consultoria estrategica"
    ]):
        return "Servicios Profesionales y Legales"

    # ── 12. ENERGÍA Y UTILITIES ──────────────────────────────────────────────
    if any(k in lower for k in [
        "energía", "energia", "gas natural", "estación de servicio",
        "estacion de servicio", "energía solar", "energia solar",
        "energía renovable", "energia renovable"
    ]):
        return "Energía y Utilities"

    # ── 13. HOTELERÍA Y TURISMO ─────────────────────────────────────────────
    if any(k in lower for k in [
        "hotelería", "hoteleria", "hoteles", "turismo rural"
    ]):
        return "Hotelería y Turismo"

    # ── 14. ONG Y SECTOR SOCIAL ─────────────────────────────────────────────
    if any(k in lower for k in [
        "ong", "fundación", "fundacion", "residencia para adultos mayores"
    ]):
        return "ONG y Sector Social"

    # ── 15. SEGURIDAD Y VIGILANCIA ──────────────────────────────────────────
    if any(k in lower for k in [
        "seguridad integral", "seguridad privada"
    ]):
        return "Seguridad y Vigilancia"

    # ── 16. MUEBLES, DECORACIÓN Y HOGAR ─────────────────────────────────────
    if any(k in lower for k in [
        "muebles", "fabricación de muebles", "fabricacion de muebles",
        "muebles a medida", "muebles personalizados",
        "muebles y decoración", "muebles y decoracion",
        "muebles y equipos de oficina"
    ]):
        return "Muebles, Decoración y Hogar"

    # ── 17. AGRICULTURA ──────────────────────────────────────────────────────
    if any(k in lower for k in [
        "agricultura", "productos agrícolas", "productos agricolas",
        "exportación de frutas", "exportacion de frutas"
    ]):
        return "Agricultura"

    # ── 18. ARTE Y ENTRETENIMIENTO ─────────────────────────────────────────
    if any(k in lower for k in [
        "cines", "parque de diversiones", "streaming de entretenimiento",
        "plataforma de streaming", "plataforma de entretenimiento en línea",
        "plataforma de entretenimiento en linea"
    ]):
        return "Arte y Entretenimiento"

    # ── 19. TEXTIL, CONFECCIÓN Y MODA ─────────────────────────────────────
    if any(k in lower for k in [
        "confección", "confeccion", "costura", "uniformes",
        "taller de costura", "moda sostenible", "ropa sostenible",
        "confección de ropa", "confeccion de ropa",
        "confección de uniformes", "confeccion de uniformes"
    ]):
        return "Textil, Confección y Moda"

    # ── 20. NIÑOS Y EDUCACIÓN INFANTIL ──────────────────────────────────────
    if any(k in lower for k in [
        "guardería", "guarderia", "entretenimiento infantil",
        "ropa infantil", "moda infantil", "transporte escolar"
    ]):
        return "Niños y Educación Infantil"

    # ── 21. DISTRIBUCIÓN Y MAYORISTAS (fallback) ──────────────────────────
    if "distribuidora" in lower or "distribución" in lower or "distribucion" in lower:
        return "Distribución y Mayoristas"

    # ── 22. SERVICIOS GENERALES Y HOGAR ─────────────────────────────────────
    if any(k in lower for k in [
        "lavandería", "lavanderia", "tintorería", "tintoreria",
        "servicios de limpieza", "servicios generales"
    ]):
        return "Servicios Generales y Hogar"

    return "Otros"


# ──────────────────────────────────────────────────────────────────────────────
# FUNCIONES DE SUPABASE
# ──────────────────────────────────────────────────────────────────────────────

def get_client(url: str, service_role_key: str) -> Client:
    return create_client(url, service_role_key)


def fetch_all_clients(db: Client) -> list[dict]:
    """Obtiene TODOS los registros paginando en bloques de 1000."""
    all_rows = []
    batch_size = 1000
    start = 0
    
    while True:
        result = (
            db.table("clients")
            .select("id, industria")
            .range(start, start + batch_size - 1)
            .execute()
        )
        rows = result.data or []
        all_rows.extend(rows)
        
        if len(rows) < batch_size:
            break  # Último batch, no hay más
        
        start += batch_size
    
    return all_rows


def update_industria_batch(db: Client, updates: list[dict]) -> None:
    """
    Actualiza un batch de registros.
    Usa RPC si tienes una función en Supabase, o update individual.
    """
    for item in updates:
        db.table("clients").update(
            {"industria": item["new_industria"]}
        ).eq("id", item["id"]).execute()


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    print("🔌 Conectando a Supabase...")
    db = get_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("📥 Descargando registros actuales...")
    rows = fetch_all_clients(db)
    print(f"   → {len(rows)} registros encontrados")

    if not rows:
        print("⚠️  No hay registros para procesar.")
        return

    # ── 1. Backup ──────────────────────────────────────────────────────────
    backup = {
        "timestamp": datetime.now().isoformat(),
        "total_records": len(rows),
        "records": rows,
    }
    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(backup, f, ensure_ascii=False, indent=2)
    print(f"💾 Backup guardado en: {BACKUP_FILE}")

    # ── 2. Calcular nuevos grupos ────────────────────────────────────────────
    updates = []
    stats = {}
    for row in rows:
        original = row.get("industria") or ""
        new_group = get_industria_group(original)

        if original != new_group:
            updates.append({
                "id": row["id"],
                "original": original,
                "new_industria": new_group,
            })

        stats[new_group] = stats.get(new_group, 0) + 1

    print(f"📊 Resumen de grupos resultantes:")
    for group, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"   {group}: {count}")

    if not updates:
        print("✅ No hay cambios pendientes. Nada que actualizar.")
        return

    print(f"📝 {len(updates)} registros serán modificados.")
    confirm = input("¿Proceder con la actualización? [y/N]: ").strip().lower()
    if confirm not in ("y", "yes", "s", "si", "sí"):
        print("❌ Cancelado por el usuario.")
        return

    # ── 3. Aplicar updates por batches ───────────────────────────────────────
    print(f"🚀 Aplicando cambios en batches de {BATCH_SIZE}...")
    for i in range(0, len(updates), BATCH_SIZE):
        batch = updates[i : i + BATCH_SIZE]
        update_industria_batch(db, batch)
        print(f"   → Batch {i//BATCH_SIZE + 1}/{(len(updates)-1)//BATCH_SIZE + 1} ({len(batch)} registros)")

    # ── 4. Guardar log de cambios ────────────────────────────────────────────
    log_file = f"industria_changes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_updated": len(updates),
            "changes": updates,
        }, f, ensure_ascii=False, indent=2)
    print(f"📄 Log de cambios guardado en: {log_file}")
    print("✅ ¡Listo! Las industrias han sido consolidadas.")


if __name__ == "__main__":
    main()
