from typing import Literal
from pydantic import BaseModel, Field


class PerfilCliente(BaseModel):
    industria: (
        Literal[
            "Educación y Formación",
            "Salud, Bienestar y Fitness",
            "Tecnología, Software e IT",
            "Finanzas, Seguros y Contabilidad",
            "Retail, Comercio y E-commerce",
            "Alimentos, Bebidas y Gastronomía",
            "Construcción, Inmobiliaria y Mantenimiento",
            "Industria, Manufactura y Suministros",
            "Transporte, Logística y Automotriz",
            "Marketing, Medios y Creatividad",
            "Servicios Profesionales y Legales",
            "Energía y Utilities",
            "Hotelería y Turismo",
            "ONG y Sector Social",
            "Seguridad y Vigilancia",
            "Muebles, Decoración y Hogar",
            "Agricultura",
            "Arte, Entretenimiento y Deportes",
            "Textil, Confección y Moda",
            "Niños y Educación Infantil",
            "Distribución y Mayoristas",
            "Servicios Generales y Hogar",
            "Mascotas y Servicios Veterinarios",
            "Belleza, Estética y Cuidado Personal",
            "Otros",
        ]
        | None
    ) = Field(
        default=None,
        description=(
            "Rubro o industria del cliente MAPEADO a una de las categorías generales predefinidas. "
            "Si el rubro no calza exactamente, elige la más cercana. "
            "Si es absolutamente imposible de clasificar, usa 'Otros'. "
            "Si no se menciona el rubro, usa null."
            "Ejemplos de mapeo:"
            "- 'pastelería', 'catering', 'restaurante', 'distribución de bebidas/alimentos' → 'Alimentos, Bebidas y Gastronomía'"
            "- 'gimnasio', 'clínica', 'veterinaria', 'fisioterapia', 'peluquería', 'yoga' → 'Salud, Bienestar y Fitness'"
            "- 'colegio', 'academia', 'escuela', 'centro de capacitación' → 'Educación y Formación'"
            "- 'agencia de viajes', 'hotel', 'hostal' → 'Hotelería y Turismo'"
            "- 'logística', 'transporte', 'automotriz', 'concesionaria' → 'Transporte, Logística y Automotriz'"
            "- 'inmobiliaria', 'constructora', 'alquiler de maquinaria pesada' → 'Construcción, Inmobiliaria y Mantenimiento'"
            "- 'tienda online', 'boutique', 'e-commerce', 'supermercado' → 'Retail, Comercio y E-commerce'"
            "- 'distribuidora', 'mayorista' → 'Distribución y Mayoristas'"
            "- 'software', 'plataforma tecnológica', 'ERP', 'app' → 'Tecnología, Software e IT'"
            "- 'marketing', 'agencia de publicidad', 'eventos' → 'Marketing, Medios y Creatividad'"
            "- 'consultora', 'asesoría', 'outsourcing', 'coaching' → 'Servicios Profesionales y Legales'"
            "- 'ONG', 'fundación', 'organización sin fines de lucro' → 'ONG y Sector Social'"
            "- 'fábrica', 'manufactura', 'producción industrial' → 'Industria, Manufactura y Suministros'"
            "- 'limpieza', 'seguridad', 'mantenimiento' → 'Servicios Generales y Hogar'"
            "- 'energía solar', 'reciclaje', 'estación de carga' → 'Energía y Utilities'"
            "- 'agricultura', 'cooperativa agrícola', 'exportación de frutas' → 'Agricultura'"
            "- 'banco', 'seguros', 'finanzas', 'crowdfunding', 'asesoría financiera' → 'Finanzas, Seguros y Contabilidad'"
            "- 'joyería', 'ropa', 'moda', 'textil' → 'Textil, Confección y Moda'"
            "- 'muebles', 'decoración', 'hogar' → 'Muebles, Decoración y Hogar'"
            "- 'arte', 'música', 'danza', 'fotografía', 'entretenimiento' → 'Arte y Entretenimiento'"
            "- 'seguridad electrónica', 'vigilancia' → 'Seguridad y Vigilancia'"
        ),
    )
    sector_b2b_b2c: Literal["B2B", "B2C", "B2B2C", "B2G"] | None = Field(
        default=None,
        description="Modelo de negocio. Null si no se puede determinar.",
    )
    tamano_empresa: Literal["Pequeña", "Mediana", "Grande"] | None = Field(default=None, description="Tamaño de la empresa. Null si no se puede determinar.")
    decisor_identificado: str | None = Field(
        default=None,
        description="Cargo general del responsable (ej. 'Gerente', 'Dueño', 'Administrador', 'Gestor'). Nunca incluir calificativos ni especializaciones como 'Gestor de clínica'. Null si no se puede determinar.",
    )
    volumen_consultas_mensual: int | None = Field(
        default=None,
        description="Número estimado de consultas mensuales (entero). Null si no es calculable.",
    )
    canal_descubrimiento: str | None = Field(
        default=None,
        description="Canal por el cual conoció a Vambe o null.",
    )
    tipo_canal: (
        Literal[
            "Busqueda Organica",
            "Organico Social",
            "Marketing de Contenidos",
            "Eventos y Webinars",
            "Outbound / Contacto Directo",
            "Referido",
            "Publicidad Paga",
            "Medios / Prensa",
            "Otro",
        ]
        | None
    ) = Field(
        default=None,
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
        ),
    )


class NecesidadesYCasosUso(BaseModel):
    area_negocio_principal: (
        Literal[
            "Ecommerce",
            "Agendamiento",
            "Venta Consultiva",
            "Atencion al Cliente",
            "Otro",
        ]
        | None
    ) = Field(default=None, description="Área de negocio principal que busca resolver el cliente. Null si no se puede determinar.")
    area_negocio_detalle: str | None = Field(
        default=None,
        description="Detalle específico del área de negocio si aplica, o null.",
    )
    canales_deseados: list[
        Literal["WhatsApp", "Instagram", "Facebook", "TikTok", "WeChat", "Otro"]
    ] = Field(
        default_factory=list,
        description="Canales solicitados por el cliente. Usa 'Otro' si pide un canal fuera de esta lista (ej. Telegram, Email, Llamadas)",
    )
    canales_no_soportados_solicitados: list[str] = Field(
        default_factory=list,
        description="Canales que el cliente pidió explícitamente pero que Vambe no soporta hoy (ej. 'Telegram', 'SMS', 'Email'). Lista vacía si no aplica o si todos los canales pedidos ya están soportados.",
    )
    casos_uso_principales: list[str] = Field(
        default_factory=list,
        description="Casos de uso principales que busca resolver el cliente.",
    )
    integraciones_requeridas: list[str] = Field(
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
        ),
    )


class IntencionCompra(BaseModel):
    dolor_explicito: bool | None = Field(
        default=None,
        description="True ÚNICAMENTE si hay lenguaje explícito de crisis o colapso ('caótico', 'no damos abasto'). False para cualquier otro problema común. Null si no se puede determinar.",
    )
    urgencia: Literal["Alta", "Media", "Baja"] | None = Field(default=None)
    complejidad_tecnica: Literal["Baja", "Media", "Alta"] | None = Field(default=None)
    objeciones_principales: list[str] = Field(
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
        ),
    )
    tono_deseado: str | None = Field(
        default=None,
        description="Únicamente un adjetivo general en su forma básica (ej. 'Profesional', 'Cercano', 'Formal'). Nunca una frase ni adjetivos específicos del rubro.",
    )
    requiere_regulacion_compleja: bool | None = Field(
        default=None,
        description="True solo si opera en sector regulado (salud, legal) Y el caso de uso toca esa regulación. Null si no aplica/inferible.",
    )
    requiere_sistema_gestion_completo: bool | None = Field(
        default=None,
        description="True si el cliente pide que el asistente reemplace o sea un ERP/sistema integral. False si solo busca integrarse con uno existente. Null si no se puede determinar.",
    )


class ExtraccionTranscript(BaseModel):
    perfil_cliente: PerfilCliente
    necesidades_y_casos_uso: NecesidadesYCasosUso
    intencion_compra: IntencionCompra
