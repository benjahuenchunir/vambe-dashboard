# Vambe Dashboard

Dashboard de análisis de reuniones de ventas para Vambe AI. Extrae información estructurada de transcripciones de reuniones, calcula un readiness score y expone métricas de pipeline, perfil del cliente ideal, intención de compra y oportunidades de recuperación.

Para más detalles sobre decisiones ver DOCS.md

## Arquitectura

El repositorio es un monorepo con:

- **Frontend** (`/`): Next.js + Tailwind CSS. Corre en `localhost:3000`.
- **Backend** (`backend/`): FastAPI + Supabase (PostgREST) + Extracción con LLM (Gemini). API en `localhost:8000`.
- **Scripts** (`backend/scripts/`): Utilidades de exploración, backfill, consolidación de taxonomías y precomputo que se usaron al momento de construir este pipeline. Pueden ser útiles para mantenimiento y exploración de datos.

```
├── app/                    # Frontend Next.js
├── components/
├── lib/
├── hooks/
├── public/                 # Assets públicos (favicon, robots.txt, etc)
├── supabase/                # Contiene schema.sql
├── backend/
│   ├── app/                # FastAPI (main.py, routers, middleware)
│   ├── ai/                 # Lógica de extracción LLM y modelos Pydantic
│   ├── services/            # Scoring, taxonomías, utilidades, pipeline
│   ├── scripts/            # Scripts de utilidad (backfill, consolidate, precompute)
│   └── data/               # Cliente Supabase, CSV helpers
└── README.md
└── DOCS.md
```

## Requisitos previos

- **Node.js** + `pnpm`
- **Python** + `uv` (gestor de dependencias y entornos)
- **Cuenta Supabase** (proyecto nuevo)
- **Clave de API de Gemini** (Google AI Studio)

## Setup inicial

### 1. Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
3. Copia la **URL** del proyecto y la **service role key** (Settings → API).

### 2. Variables de entorno

Copiar `.env.example` a `.env` en la raíz del repo y `backend/.env.example` a `backend/.env`. Completar con tus credenciales de Supabase y Gemini.

#### Frontend (`/.env`)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opcionales
GEMMA_MODEL=gemma-4-26b-a4b-it
CSV_PATH=data/vambe_clients_10k.csv

# API
ALLOWED_ORIGINS=http://localhost:3000,other-allowed-origin.com
PIPELINE_API_SECRET=your-pipeline-api-secret
```

#### Backend (`backend/.env`)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opcionales
GEMMA_MODEL=gemma-4-26b-a4b-it
CSV_PATH=data/vambe_clients_10k.csv

# API
ALLOWED_ORIGINS=http://localhost:3000,other-allowed-origin.com
PIPELINE_API_SECRET=your-pipeline-api-secret
```

## Correr localmente

### Frontend

```bash
# Desde la raíz del repo
pnpm install
pnpm run dev
```

Abre `http://localhost:3000`.

### Backend (API)

```bash
# Desde backend/
uv sync
uvicorn app.main:app --reload --port 8000
```

La API estará en `http://localhost:8000`.

### Pipeline de extracción (solo transcripciones)

Si quieres procesar transcripciones con el LLM **sin levantar la API**:

```bash
# Desde backend/
uv run -m scripts.precompute_rows.py
```

## Scripts de utilidad

Los scripts en `backend/scripts/` son herramientas de exploración y mantenimiento. Se ejecutan como módulos:

```bash
# Desde backend/
# Ajuste de readiness
uv run -m scripts.analyze_readiness_signals.py.py --table clients
uv run -m scripts.backfill_readiness_score.py --table clients

# Utilidades de relleno, cambios a db durante el proceso de creación
uv run -m scripts.backfill_from_csv.py --table clients
uv run -m scripts.backfill_nulls --table clients

# Herramientas para unir valores de taxonomías sueltas en categorías consistentes durante el proceso de creación
uv run -m scripts.consolidate_casos_uso --table clients
uv run -m scripts.consolidate_cargos --table clients
uv run -m scripts.consolidate_canales --table clients
uv run -m scripts.consolidate_industrias --table clients
uv run -m scripts.consolidate_integraciones --table clients
uv run -m scripts.consolidate_objeciones --table clients
```

Usados para:
- Limpiar valores legacy (`no_inferible`, `no_mencionado`) → `backfill_nulls`
- Consolidar taxonomías sueltas (cargos, canales, objeciones, integraciones, casos de uso) → `consolidate_*`
- Precomputar métricas sin pasar por la API
- Ajustar pesos del readiness score contra datos reales
- También contiene un jupyter notebook usado para la exploración inicial

> **Recomendación:** Siempre corré con `--dry-run` primero para ver el impacto antes de escribir a la base de datos.

## Notas adicionales

- **Taxonomías:** El pipeline usa un sistema de grounding (vocabulario acumulado de filas previas) + reconciliación por similitud de texto para colapsar variantes del LLM (`reconcile_label`). Las categorías macro de casos de uso (`casos_uso_categorias`) se computan en Python, no se piden al LLM.
- **Readiness Score:** Es una fórmula aditiva basada en lifts de tasa de cierre medidos por segmento (ver `scoring.py`). No es un modelo entrenado; cada peso es trazable a una tasa de cierre real.
- **Seguridad:** El backend usa `PIPELINE_API_SECRET` para proteger endpoints internos. Configuralo en ambos lados (frontend y backend) si llamas al pipeline desde la UI.
- **CSV:** El formato esperado del CSV debe incluir al menos `nombre_cliente`, `telefono`, `email`, `vendedor`, `fecha_reunion`, `cierre` y `transcripcion`. Ajusta `CsvRow` en `backend/vambe_pipeline/models.py` si tu schema difiere.
