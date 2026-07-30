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
    decisor_identificado: Literal[
        "Dueño",
        "Director",
        "Gerente",
        "Administrador",
        "Coordinador",
        "Consultor",
        "Vendedor",
        "Responsable",
        "Especialista",
        "Otro",
    ] | None = Field(
        default=None,
        description=(
            "Cargo general del responsable MAPEADO a una de las categorías del enum. "
            "NUNCA devuelvas el cargo literal de la transcripción (ej. 'Gestor de clínica'). "
            "Aplica las reglas de consolidación del prompt. "
            "Si no se menciona ningún cargo, usa null. "
            "Si el cargo no calza en ninguna categoría, usa 'Otro'."
        ),
    )
    volumen_consultas_mensual: int | None = Field(
        default=None,
        description="Número estimado de consultas mensuales (entero). 'X diarias'→×30, 'X semanales'→×4, rango→promedio. Null si no es calculable.",
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
        description="Canales que el cliente pidió explícitamente pero que Vambe no soporta hoy (ej. 'Telegram', 'SMS', 'Email'). Lista vacía si no aplica o si todos los canales pedidos ya están soportados. Usa valores de la lista de <categorias_existentes> si aplica. Solo crea una nueva etiqueta si el canal no calza con ninguna existente.",
    )
    casos_uso_principales: list[Literal[
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
    ]] = Field(
        default_factory=list,
        description=(
            "Categorías macro de casos de uso que el cliente busca resolver con Vambe. "
            "Clasifica SIEMPRE en una de estas categorías literales. NUNCA inventes valores fuera de esta lista. "
            "Si el caso de uso no calza exactamente con ninguna categoría, usa 'Otro'."
        ),
    )
    casos_uso_nuevos: list[str] = Field(
        default_factory=list,
        description=(
            "Categorías generales de casos de uso que el cliente mencionó explícitamente pero que Vambe NO soporta hoy. "
            "Usa lenguaje natural pero a nivel de categoría general (ej: 'Gestión de Nómina', 'Contabilidad Avanzada', 'Análisis Predictivo de Inventario'). "
            "NUNCA uses valores que calcen con las categorías de casos_uso_principales. "
            "Lista vacía si no aplica o si todos los casos de uso mencionados ya están cubiertos por Vambe."
        ),
    )
    integraciones_requeridas: list[
        Literal[
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
            "GPS / Rastreo",
            "Logística / Envíos",
            "Email / Comunicación",
            "ATS / Reclutamiento",
            "Finanzas / Crédito",
            "Otro",
        ]
    ] = Field(
        default_factory=list,
        description=(
            "Lista de categorías GENERALES de sistemas que requiere integrar el cliente. "
            "NUNCA uses nombres de marcas o software específicos. Mapea todo a su categoría macro "
            "usando las reglas de consolidación del prompt. Elimina duplicados."
        ),
    )
    integraciones_nuevas: list[str] = Field(
        default_factory=list,
        description=(
            "Lista de integraciones que el cliente pidió explícitamente pero que Vambe no soporta hoy. "
            "Conserva el lenguaje natural de la transcripción. "
            "Lista vacía si no aplica o si todas las integraciones pedidas ya están soportadas en alguna de las categorías generales de integraciones_requeridas"
            "SOLO crea una nueva etiqueta si la integración no calza con ninguna existente. "
        ),
    )


class IntencionCompra(BaseModel):
    dolor_explicito: bool | None = Field(
        default=None,
        description="True ÚNICAMENTE si hay lenguaje explícito de crisis o colapso ('caótico', 'no damos abasto', 'colapsados', etc.). False para cualquier otro problema común. Null si no se puede determinar.",
    )
    urgencia: Literal["Alta", "Media", "Baja"] | None = Field(default=None)
    complejidad_tecnica: Literal["Baja", "Media", "Alta"] | None = Field(default=None)
    objeciones_principales: list[
        Literal[
            "Precio / Presupuesto",
            "Precisión y Confiabilidad de la IA",
            "Privacidad / Seguridad de Datos",
            "Tiempo de Implementación",
            "Complejidad Técnica / Integración",
            "Resistencia al Cambio del Equipo",
            "Capacidad de Personalización",
            "Cumplimiento Normativo",
            "Calidad de Interacción",
            "Otro",
        ]
    ] = Field(
        default_factory=list,
        description=(
            "Lista de objeciones expresadas por el cliente, MAPEADAS a las categorías del enum. "
            "NUNCA inventes una categoría nueva. Si la objeción no calza exactamente, elige la más cercana. "
            "Si no hay objeciones, devuelve []."
        ),
    )
    tono_deseado: str | None = Field(
        default=None,
        description="Únicamente un adjetivo general en su forma básica (ej. 'Profesional', 'Cercano', 'Formal'). Nunca una frase ni adjetivos específicos del rubro. Si no se menciona, null.",
    )
    requiere_regulacion_compleja: bool | None = Field(
        default=None,
        description="True solo si opera en sector regulado (salud, legal) Y el caso de uso toca esa regulación (Ej.: agendar citas en una clínica es false). Null si no aplica/inferible.",
    )
    requiere_sistema_gestion_completo: bool | None = Field(
        default=None,
        description="True si el cliente pide que el asistente reemplace o sea un ERP/sistema integral. False si solo busca integrarse con uno existente. Null si no se puede determinar.",
    )


class ExtraccionTranscript(BaseModel):
    perfil_cliente: PerfilCliente
    necesidades_y_casos_uso: NecesidadesYCasosUso
    intencion_compra: IntencionCompra
