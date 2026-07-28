from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class PerfilCliente(BaseModel):
    industria: str = Field(
        description="Rubro o industria del cliente normalizado. 'no_inferible' si no se menciona."
    )
    sector_b2b_b2c: Literal["B2B", "B2C", "B2B2C", "no_inferible"]
    tamano_empresa: Literal["Pequeña", "Mediana", "Grande", "no_inferible"]
    decisor_identificado: str = Field(
        default="no_mencionado",
        description="Cargo general del responsable (ej. 'Gerente', 'Dueño', 'Administrador', 'Gestor'). Nunca incluir calificativos ni especializaciones como 'Gestor de clínica'."
    )
    volumen_consultas_mensual: Optional[int] = Field(
        default=None, 
        description="Número estimado de consultas mensuales (entero). Null si no es calculable."
    )
    canal_descubrimiento: str = Field(
        default="no_mencionado",
        description="Canal por el cual conoció a Vambe o 'no_mencionado'."
    )
    tipo_canal: Literal[
        "Busqueda Organica",
        "Organico Social",
        "Marketing de Contenidos",
        "Eventos y Webinars",
        "Outbound / Contacto Directo",
        "Referido",
        "Publicidad Paga",
        "Medios / Prensa",
        "Otro",
        "no_mencionado",
    ] = Field(
        default="no_mencionado",
        description=(
            "Clasificación macro del canal de adquisición:\n"
            "- 'Busqueda Organica': Google, SEO.\n"
            "- 'Organico Social': Publicaciones orgánicas en Instagram, LinkedIn, TikTok, YouTube, etc.\n"
            "- 'Marketing de Contenidos': Podcasts, blogs, artículos especializados, newsletters, e-books.\n"
            "- 'Eventos y Webinars': Conferencias, ferias, charlas, webinars online o eventos presenciales.\n"
            "- 'Outbound / Contacto Directo': Mails promocionales, llamadas en frío, prospección activa por LinkedIn/WhatsApp.\n"
            "- 'Referido': Recomendación de un cliente, socio, amigo o conocido.\n"
            "- 'Publicidad Paga': Anuncios pagados en Google Ads, Meta Ads, LinkedIn Ads, etc.\n"
            "- 'Medios / Prensa': Menciones en diarios, revistas de negocios, televisión o radio.\n"
            "- 'Otro': Solo si genuinamente no calza en ninguna anterior."
        )
    )


class NecesidadesYCasosUso(BaseModel):
    area_negocio_principal: Literal[
        "Ecommerce",
        "Agendamiento",
        "Venta Consultiva",
        "Atencion al Cliente",
        "Otro",
        "no_inferible",
    ]
    area_negocio_detalle: Optional[str] = Field(
        default=None, 
        description="Detalle específico del área de negocio si aplica, o null."
    )
    canales_deseados: List[Literal[
        "WhatsApp", "Instagram", "Facebook", "TikTok", "WeChat", "Otro"
    ]] = Field(
        default_factory=list,
        description="Canales solicitados por el cliente, normalizados al set soportado. Usa 'Otro' si pide un canal fuera de esta lista (ej. Telegram, Email, Llamadas)"
    )
    canal_no_soportado_solicitado: Optional[str] = Field(
        default=None,
        description="Si el cliente pide explícitamente un canal que Vambe no soporta hoy (ej. 'Telegram', 'SMS'), regístralo aquí. Null si no aplica."
    )
    casos_uso_principales: List[str] = Field(
        default_factory=list, 
        description="Casos de uso principales que busca resolver el cliente."
    )
    integraciones_requeridas: List[str] = Field(
        default_factory=list, 
        description=(
            "Lista de categorías GENERALES de sistemas que requiere integrar el cliente.\n"
            "NUNCA uses nombres de marcas o software específicos. Mapea todo a su categoría macro:\n"
            "- Salesforce, HubSpot, Zoho, Pipedrive -> 'CRM'\n"
            "- Softland, Defontana, SAP -> 'ERP'\n"
            "- Software de citas/reservas, Google Calendar -> 'Calendario / Agendamiento'\n"
            "- Webpay, Stripe, Mercado Pago -> 'Pasarela de Pagos'\n"
            "- Shopify, WooCommerce, Vtex -> 'Ecommerce'\n"
            "- Moodle, Canvas, sistema de alumnos/cursos -> 'Sistema Académico / LMS'\n"
            "- Boletas, facturas, DTE -> 'Facturación / DTE'\n"
            "- Control de stock/inventario -> 'Inventario / Stock'\n"
            "- 'Helpdesk / Atención al Cliente'\n"
            "- 'Marketing Automation'\n"
            "- 'API / Webhook'\n"
        )
    )
    
class IntencionCompra(BaseModel):
    dolor_explicito: bool = Field(
        description="True ÚNICAMENTE si hay lenguaje explícito de crisis o colapso ('caótico', 'no damos abasto'). False para cualquier otro problema común."
    )
    urgencia: Literal["Alta", "Media", "Baja", "no_inferible"]
    complejidad_tecnica: Literal["Baja", "Media", "Alta", "no_inferible"]
    objeciones_principales: List[str] = Field(
        default_factory=list, 
        description=(
            "Lista de dudas, preocupaciones o barreras expresadas por el cliente.\n"
            "REGLA DE FORMATO: Resume y sintetiza cada punto en una CATEGORÍA GENERAL breve (2 a 4 palabras).\n"
            "Ejemplos de categorías generales:\n"
            "- 'Precio / Presupuesto'\n"
            "- 'Temor a Alucinaciones de IA'\n"
            "- 'Tiempo de Implementación'\n"
            "- 'Privacidad / Seguridad de Datos'\n"
            "- 'Falta de Canal / Integración'\n"
            "- 'Resistencia al Cambio del Equipo'\n"
            "- 'Complejidad de Integración'\n"
            "- 'Capacidad de personalización'\n"
        )
    )
    tono_deseado: str = Field(
        default="no_mencionado",
        description="Únicamente un adjetivo general en su forma básica (ej. 'Profesional', 'Cercano', 'Formal'). Nunca una frase ni adjetivos específicos del rubro."
    )
    requiere_regulacion_compleja: Optional[bool] = Field(
        default=None,
        description="True solo si opera en sector regulado (salud, legal) Y el caso de uso toca esa regulación. Null si no aplica/inferible."
    )
    requiere_sistema_gestion_completo: Optional[bool] = Field(
        default=None,
        description="True si el cliente pide que el asistente reemplace o sea un ERP/sistema integral. False si solo busca integrarse con uno existente."
    )


class ExtraccionTranscript(BaseModel):
    perfil_cliente: PerfilCliente
    necesidades_y_casos_uso: NecesidadesYCasosUso
    intencion_compra: IntencionCompra