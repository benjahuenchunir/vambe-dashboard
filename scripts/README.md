# Vambe · Pipeline de categorización (Gemma 4)

Lee `vambe_clients_10k.csv`, categoriza cada transcripción con Gemma 4 vía la
librería oficial de Gemini, y guarda el resultado en Supabase. Retomable:
usa `csv_row_id` (la posición de la fila en el CSV) para saltarse lo que ya
está en la tabla.

## Setup

```bash
# 1. Aplica el schema (reemplaza la tabla `clients` anterior — ver el
#    comentario al inicio de schema_v3.sql sobre por qué cambió).
#    Corre schema_v3.sql en el SQL editor de Supabase.

# 2. Instala dependencias con uv
uv sync

# 3. Configura credenciales
cp .env.example .env
# completa GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 4. Corre
uv run vambe-categorize --csv vambe_clients_10k.csv
```

## Uso

```bash
# Procesa todo lo pendiente
uv run vambe-categorize

# Prueba con una muestra chica primero (recomendado antes de correr las 10k)
uv run vambe-categorize --limit 20

# Si se corta a medias (Ctrl+C, error de red, etc.), simplemente vuelve a correrlo:
# las filas ya insertadas se saltan automáticamente.
uv run vambe-categorize
```

## Cómo retoma el progreso

Al iniciar, el script:
1. Lee el CSV completo y asigna `csv_row_id` = posición de la fila (0-based).
2. Consulta `select csv_row_id from clients` en Supabase.
3. Procesa solo las filas cuyo `csv_row_id` no esté ya en la tabla.

No hay archivo de checkpoint separado — la tabla es la fuente de verdad. Si
interrumpes el proceso, lo insertado hasta ese punto queda guardado y la
próxima corrida sigue justo donde quedó.

## Notas

- `GEMMA_MODEL` por defecto es `gemma-4-26b-a4b-it` (el MoE de 26B — buen
  balance costo/calidad). Para lotes grandes y más baratos, `gemma-4-4b-it`;
  para mejor razonamiento, `gemma-4-31b-it`.
- El vocabulario de industria/canales/casos de uso se recarga una sola vez al
  inicio de la corrida y se actualiza en memoria fila a fila (no hace un
  round-trip a la DB por cada fila) — ver `taxonomy.py`.
- `vambe_readiness_score` y los `*_nuevos`/`*_no_soportados` se calculan en
  Python (`scoring.py`), no se le piden al LLM — ver el comentario al inicio
  de ese archivo sobre las dos heurísticas aproximadas (regulación compleja,
  sistema de gestión completo) y cómo reemplazarlas por campos explícitos si
  necesitas más precisión.
