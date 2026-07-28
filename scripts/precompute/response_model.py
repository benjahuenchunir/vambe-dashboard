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
    canales_deseados: List[str] = Field(
        default_factory=list, 
        description="Lista de canales solicitados (ej. 'WhatsApp', 'Instagram'). Lista vacía si no hay."
    )
    casos_uso_principales: List[str] = Field(
        default_factory=list, 
        description="Casos de uso principales que busca resolver el cliente."
    )
    integraciones_requeridas: List[str] = Field(
        default_factory=list, 
        description=(
            "Lista de sistemas o software con los que el cliente necesita integrarse.\n"
            "REGLAS DE NORMALIZACIÓN:\n"
            "1. Si menciona un software comercial específico, usa el nombre propio (ej: 'Salesforce', 'HubSpot', 'Shopify', 'Webpay', 'Moodle').\n"
            "2. Si menciona un tipo de sistema sin marca explícita, mapealo a una categoría estándar:\n"
            "   - Software de citas / reservas / agenda -> 'Calendario / Agendamiento'\n"
            "   - LMS / plataforma de cursos / aula virtual -> 'Sistema Académico / LMS'\n"
            "   - Sistema de inventario / gestión -> 'ERP' o 'Inventario / Stock'\n"
            "   - Sistema de facturación / boletas -> 'Facturación / DTE'\n"
            "   - Pipeline de ventas / gestión de leads -> 'CRM'"
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
        description="Lista de dudas, fricciones, preocupaciones o barreras mencionadas por el cliente."
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