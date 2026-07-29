create extension if not exists "pgcrypto";

drop table if exists clients;

create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identidad de la fila de origen, para poder resumir el procesamiento.
  csv_row_id integer not null unique,

  -- Campos del CRM (columnas del CSV)
  nombre_cliente text not null,
  telefono text,
  email text,
  vendedor text not null,
  fecha_reunion date not null,
  cierre boolean not null,

  -- perfil_cliente
  industria text not null,
  sector_b2b_b2c text not null check (sector_b2b_b2c in ('B2B', 'B2C', 'B2B2C', 'B2G', 'no_inferible')),
  tamano_empresa text not null check (tamano_empresa in ('Pequeña', 'Mediana', 'Grande', 'no_inferible')),
  decisor_identificado text not null,
  volumen_consultas_mensual integer,
  canal_descubrimiento text not null,
  tipo_canal text not null,

  -- necesidades_y_casos_uso
  area_negocio_principal text not null,
  area_negocio_detalle text,
  canales_deseados text[] not null default '{}',
  casos_uso_principales text[] not null default '{}',
  integraciones_requeridas text[] not null default '{}',
  transcripcion text,

  -- intencion_compra
  dolor_explicito boolean not null,
  urgencia text not null check (urgencia in ('Alta', 'Media', 'Baja', 'no_inferible')),
  complejidad_tecnica text not null check (complejidad_tecnica in ('Baja', 'Media', 'Alta', 'no_inferible')),
  objeciones_principales text[] not null default '{}',
  tono_deseado text,
  requiere_regulacion_compleja boolean,
  requiere_sistema_gestion_completo boolean,

  -- Derivado en Python (ver vambe_pipeline/scoring.py), no pedido al LLM
  vambe_readiness_score smallint check (vambe_readiness_score between 0 and 100),
  canales_no_soportados_solicitados text[] not null default '{}',
  casos_uso_nuevos text[] not null default '{}',
  integraciones_nuevas text[] not null default '{}',

  -- Respuesta cruda del LLM, para auditar o recalcular sin volver a llamarlo.
  raw_extraction jsonb not null
);

create index clients_csv_row_id_idx on clients (csv_row_id);
create index clients_industria_idx on clients (industria);
create index clients_vendedor_idx on clients (vendedor);

alter table clients enable row level security;
-- Sin políticas: el pipeline y la app usan la service role key (server-side),
-- que bypassa RLS. Agrega políticas si más adelante lees desde el browser con la anon key.