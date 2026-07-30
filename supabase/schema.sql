create extension if not exists "pgcrypto";

drop table if exists clients;

create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identidad de la fila de origen
  csv_row_id integer not null unique,

  -- Campos del CRM (columnas del CSV)
  nombre_cliente text not null,
  telefono text,
  email text,
  vendedor text not null,
  fecha_reunion date not null,
  cierre boolean not null,

  -- perfil_cliente
  industria text,
  sector_b2b_b2c text,
  tamano_empresa text,
  decisor_identificado text,
  volumen_consultas_mensual integer,
  canal_descubrimiento text,
  tipo_canal text,
  canales_no_soportados_solicitados text[] default '{}',

  -- necesidades_y_casos_uso
  area_negocio_principal text,
  area_negocio_detalle text,
  canales_deseados text[] not null default '{}',
  casos_uso_principales text[] not null default '{}',
  casos_uso_nuevos text[] not null default '{}',
  integraciones_requeridas text[] not null default '{}',
  integraciones_nuevas text[] not null default '{}',
  transcripcion text,

  -- intencion_compra
  dolor_explicito boolean,
  urgencia text,
  complejidad_tecnica text,
  objeciones_principales text[] not null default '{}',
  tono_deseado text,
  requiere_regulacion_compleja boolean,
  requiere_sistema_gestion_completo boolean,

  -- Derivado en Python (ver services/scoring.py)
  vambe_readiness_score smallint check (vambe_readiness_score >= 0 and vambe_readiness_score <= 100),

  -- Respuesta cruda del LLM
  raw_extraction jsonb not null
);

-- Índices
create index if not exists clients_csv_row_id_idx on clients (csv_row_id);
create index if not exists clients_industria_idx on clients (industria);
create index if not exists clients_vendedor_idx on clients (vendedor);

-- Seguridad a nivel de filas (RLS)
alter table clients enable row level security;