# Arquitectura y decisiones de diseño — Vambe Dashboard

Este documento complementa el `README.md` (que cubre setup y comandos) explicando **por qué** el sistema está armado como está: la arquitectura completa, las decisiones clave y sus alternativas descartadas, el proceso seguido para llegar acá, y las limitaciones conocidas.

## 1. Arquitectura general

El sistema tiene tres piezas independientes que se comunican por contratos explícitos (HTTP + una tabla de Postgres), no por acoplamiento directo de código:

```
┌─────────────────────┐           ┌────────────────────────┐
│   CSV de reuniones   │────────▶ │  Backend (FastAPI)     │
│  (transcripciones)   │          │  backend/              │
└─────────────────────┘           │                        │
                                  │  1. Lee filas pendientes
                                  │  2. Arma prompt con    │
                                  │     grounding de       │
                                  │     taxonomías         │
                                  │  3. Llama al LLM       │
                                  │     (Gemini/Gemma)     │
                                  │  4. Valida con Pydantic│
                                  │  5. Reconcilia labels  │
                                  │  6. Calcula readiness  │
                                  │     score              │
                                  └──────────┬─────────────┘
                                             │ INSERT
                                             ▼
                                  ┌────────────────────────┐
                                  │  Supabase (Postgres)   │
                                  │  tabla `clients`       │
                                  └──────────┬─────────────┘
                                             │ SELECT (solo lectura)
                                             ▼
                                  ┌────────────────────────┐
                                  │  Frontend (Next.js)    │
                                  │  Dashboard de métricas │
                                  └────────────────────────┘
                                             │
                                             │ start / stop / status
                                             │ (proxy autenticado)
                                             ▼
                                  ┌──────────────────────┐
                                  │  Backend (FastAPI)   │
                                  │  /process/*          │
                                  └──────────────────────┘
```

**Los tres roles están separados a propósito:**

- **Backend (`backend/`)**: el único componente que le habla al LLM y que escribe en la base de datos. Corre standalone, se puede invocar como script de CLI (`scripts/precompute_rows.py`, para poblar la base sin levantar ningún servidor) o como servicio HTTP (`app/main.py`, para que el dashboard lo controle en vivo).
- **Base de datos (Supabase/Postgres)**: el contrato entre backend y frontend. Ninguno de los dos conoce detalles internos del otro. Si mañana se reemplaza el backend Python por otra cosa, el frontend no se entera mientras la tabla `clients` mantenga su forma.
- **Frontend (`/`)**: **de solo lectura** sobre Supabase. La única escritura que el frontend puede disparar es indirecta: pedirle al backend que arranque o detenga un job de categorización — nunca escribe filas de `clients` directamente.

### Por qué la categorización no vive dentro de las rutas de Vercel

La opción obvia hubiera sido meter las llamadas al LLM directo en una API route de Next.js. Se descartó por un límite técnico concreto: según lo que leí las funciones serverless de Vercel tienen un tope de ejecución (10–60s en Hobby, hasta 300s en Pro) y el pipeline, con reintentos ante rate limits, puede tardar minutos en una corrida completa. Hay backoffs de hasta 30s por reintento en un solo row. Ni el plan más generoso de Vercel alcanza para una corrida real sin trocear todo en llamadas de "una fila por invocación" con polling constante desde el frontend, lo cual termina siendo la misma arquitectura de un backend separado pero peor implementada.

Además, ya existía un pipeline Python maduro (manejo de errores de `RECITATION`, `MAX_TOKENS`, backoff de rate limits, reconciliación difusa de taxonomías) usado para la exploración inicial y poblar la base de datos, reescribirlo en TypeScript no daba ningún beneficio funcional, solo el riesgo de reintroducir los mismos bugs ya resueltos.

## 2. Decisiones clave

### 2.1 Categorías cerradas (`Literal`) vs. texto libre, según el campo

No todos los campos extraídos por el LLM se tratan igual:

- **Campos con vocabulario acotado y estable** (`industria`, `tipo_canal`, `canales_deseados`, `sector_b2b_b2c`, `area_negocio_principal`): se fuerzan a un `Literal` cerrado en el schema de Pydantic. El LLM no puede inventar una categoría nueva — si no calza en ninguna, tiene que usar `"Otro"`.
- **Campos genuinamente abiertos** (`casos_uso_nuevos`, `integraciones_nuevas`, ...): quedan como texto libre, con un mecanismo de *grounding* (se le muestra al modelo el vocabulario ya usado en filas anteriores) + *reconciliación por similitud de texto* (`reconcile_label`, que colapsa variantes cercanas después de que el modelo responde) para reducir duplicados sin perder la capacidad de detectar necesidades nuevas que no estaban previstas.

Este balance se definio por etapas, no al inicio (ver la sección de proceso más abajo.)

### 2.2 Readiness Score: fórmula aditiva calibrada con datos, no con intuición

La primera versión de la fórmula asignaba puntos por criterio de negocio (ej. "más volumen = más puntos"). Al graficar tasa de cierre real por rango de score, las barras salían prácticamente planas, es decir el score no predecía nada. Se reemplazó por un enfoque distinto: para cada señal candidata (volumen, tamaño de empresa, tipo de canal, complejidad técnica, urgencia, dolor explícito, regulación...) se midió la **tasa de cierre real de ese segmento menos la tasa de cierre general**, y esa diferencia (*lift*, en puntos porcentuales) es literalmente el peso que usa la fórmula. Cada número en `scoring.py` es trazable a un dato medido, no a una opinión. Esto incluye casos donde el dato contradijo la intuición original.

Sigue siendo una aproximación aditiva (asume señales independientes entre sí, no es un modelo entrenado), pero es una mejora sustancial y honesta sobre pesos inventados, y queda documentada la vía para volver a calibrarla (`scripts/analyze_readiness_signals.py`) a medida que crece el dataset.

### 2.3 Modelo de job (start/stop/status) en vez de procesar todo de una

El backend expone el pipeline como un job asíncrono con estado consultable, no como una llamada síncrona que procesa todo el backlog. Esto resuelve dos problemas a la vez: evita los límites de timeout de cualquier capa intermedia y le da al operador control real (poder frenar una corrida a mitad de camino sin matar el proceso a la fuerza).

### 2.4 Estilo visual: el mismo lenguaje de diseño de Vambe

El dashboard reutiliza la paleta, tipografía y lenguaje visual del sitio de Vambe en vez de un tema genérico de librería de componentes. La idea es que el primer día que el equipo de Vambe lo abra, se sienta como una herramienta propia, no como un dashboard de analítica genérico pegado con datos suyos.

### 2.6 Cada gráfico explica su propósito (`InfoTooltip`)

Todo componente del dashboard tiene un tooltip fijo con dos partes: qué muestra el gráfico, y por qué se decidió incluirlo (qué decisión de negocio ayuda a tomar). La razón es que así ven por qué yo creo que esa métrica es útil, y pueden cuestionarla o sugerir otra mejor sin tener que adivinar qué estaba pensando al desarrollarla.

### 2.7 Tabla de filas individuales, separada del dashboard de métricas

Además de las métricas agregadas, existe una vista tabular con cada reunión y su extracción completa. No es pensada como parte del dashboard final para el cliente — es una herramienta de auditoría, para que el equipo de Vambe (o quien evalúe este proyecto) pueda verificar directamente si el LLM está categorizando bien, sin tener que confiar ciegamente en los agregados.

## 3. Despliegue

- **Frontend**: Vercel. Next.js corre nativamente ahí, deploy por push a `main`, sin configuración adicional más allá de las variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PIPELINE_API_URL`, `PIPELINE_API_SECRET`, `ALLOWED_ORIGINS`).
- **Backend**: Render. Expone `/process/start`, `/process/stop`, `/process/status` y `/health`, protegidos con el header `x-pipeline-secret` (salvo `/health`, usado por el healthcheck de la plataforma).

  > **Nota operativa**: el plan gratuito de Render suspende el servicio tras ~15 min de inactividad y el primer request después de eso tarda 30–60s en responder (cold start). No debiera ser problema por el constante polling de status que hace el frontend.

- **Base de datos**: Supabase (Postgres gestionado), compartida por ambos servicios vía `service_role_key` — nunca expuesta al browser.

El frontend nunca le habla al backend directo desde el cliente: una API route de Next.js (`app/api/pipeline/[action]/route.ts`) actúa de proxy autenticado server-side, agregando el secreto compartido antes de reenviar la request. Así el secreto nunca llega al browser del usuario.

## 4. Cómo abordé el desafío

El proceso fue iterativo, no lineal — varias decisiones de diseño (categorías cerradas, campos que se sacaron o agregaron, la fórmula de readiness) se fueron ajustando a medida que aparecía evidencia de que el enfoque anterior no alcanzaba.

1. **Análisis exploratorio de los datos** (notebook en `backend/scripts/`), para familiarizarme con el contenido real de las transcripciones antes de definir qué categorías pedirle al LLM. En esta etapa encontré casos con el mismo correo pero que parecían negocios independientes (probablemente errores de carga, no seguimientos de una misma oportunidad) — los revisé puntualmente para descartar que fueran reuniones de seguimiento del mismo caso, que hubieran distorsionado las métricas de conteo por cliente.

2. **Investigación de métricas típicas de dashboards de ventas/producto**, contrastadas contra qué era realmente extraíble de transcripciones de reunión cortas. Varias métricas "estándar" de CRM (ciclo de venta completo, múltiples touchpoints, historial de interacciones) no aplican a este formato de dato — una sola transcripción por oportunidad no las puede sostener.

3. **Elección de stack** ya con las categorías más claras: Next.js + React + Tailwind para el frontend (ecosistema grande de librerías de gráficos y diseño, ampliamente soportado), Python + FastAPI para el backend (comodidad para trabajar con LLMs y el SDK de Gemini, tipado con Pydantic).

4. **Categorización inicial sin API**: definí los modelos de extracción, el prompt, y corrí el pipeline como scripts de CLI directo contra el CSV, para tener una base de datos grande sobre la cual iterar antes de construir ninguna capa de UI.

5. **Revisión periódica con queries directas** contra los datos ya categorizados — variabilidad de las categorías libres, métricas preliminares, casos raros. El prompt y los modelos de respuesta se fueron ajustando en base a lo que esas queries mostraban, no a priori.

6. **Consolidación de categorías** (`scripts/consolidate_*`): varios campos que arrancaron como texto completamente libre (industria, cargos, canales, integraciones, objeciones) se dejaron libres a propósito al inicio, para poder observar la variabilidad real que generaba el modelo antes de decidir el set final de categorías cerradas. Una vez con esa evidencia, se consolidaron a `Literal`s específicos — eliminando la deriva de taxonomía del modelo — y se agregaron campos complementarios de texto libre para que el modelo siga pudiendo señalar algo genuinamente nuevo que no encaje en ninguna categoría cerrada (ver 2.1).

7. **Diseño del dashboard**: gráficos y estructura, con la paleta y estilo visual de Vambe (ver 2.6), para que el cliente lo sienta familiar desde el primer uso.

8. **`InfoTooltip` en cada gráfico** (ver 2.7), explicando qué muestra y qué valor aporta — varias métricas no son autoexplicativas sin ese contexto.

9. **Tabla de filas individuales** (ver 2.8), pensada como herramienta de auditoría del propio pipeline más que como parte final del dashboard de cara al cliente.

10. **Calibración del Readiness Score** contra una muestra de los datos ya extraídos (ver 2.3) — es probablemente la métrica más útil de todo el dashboard porque intenta predecir, no solo describir, y por eso mismo es la que más se sometió a validación empírica antes de confiar en ella.

## 5. Limitaciones conocidas

1. **Ineficiencias de datos aceptadas conscientemente**: se refetchea la tabla completa de Supabase en varios puntos (incluso con >5000 filas), el estado del pipeline se consulta por polling en vez de con websockets/Supabase Realtime, y las métricas se recalculan client-side sobre el dataset completo en cada cambio de filtro en vez de agregarse en el servidor. Con el techo esperado de datos (~10.000 filas) y la cantidad de usuarios concurrentes del dashboard, el costo de estas ineficiencias es bajo — se priorizó tiempo de desarrollo sobre optimización prematura. Si el volumen de datos o de usuarios crece un orden de magnitud, esto sí pasaría a ser un problema real a resolver.

2. **Campos que faltó pedirle al LLM desde el diseño inicial**: durante el desarrollo surgió la necesidad de un campo tipo `features_especiales` (uso offline, soporte multilenguaje, etc.) — funcionalidades puntuales que, si se repiten en muchas reuniones, serían señal directa de qué construir. No se agregó porque la base de datos ya estaba construida sobre el schema anterior, y volver a correr la inferencia completa sobre miles de filas tenía un costo de tiempo que no se justificaba para esta entrega.

3. **Categorías fijas vs. embeddings + búsqueda semántica**: el enfoque de consolidar a `Literal`s cerrados (sección 2.1) resuelve la deriva de taxonomía, pero a costa de que el modelo quede limitado a esas categorías — cualquier matiz que no encaje exactamente se pierde dentro de la categoría más cercana. Con más tiempo, una alternativa más flexible hubiera sido dejar las categorías libres y resolver la deduplicación con embeddings + búsqueda semántica en vez de un set cerrado a mano, preservando más granularidad real sin reintroducir el problema de variabilidad descontrolada.

4. **El catálogo de "lo que Vambe ya soporta" se armó leyendo su sitio web**, no de una fuente interna — es razonablemente confiable pero no exhaustivo. Por ejemplo, la sección de canales del sitio no menciona llamadas, aunque Vambe sí las maneja según el contexto dado al LLM en el prompt — es posible que haya otras integraciones o capacidades reales que no quedaron reflejadas en `KNOWN_INTEGRACIONES`/`KNOWN_CASOS_USO` por la misma razón. Vale la pena que alguien de Vambe revise esas listas contra la realidad interna antes de confiar en las métricas de "funcionalidad nueva vs. ya cubierta" al 100%.

5. **Inestabilidad del Free Tier del LLM y manejo de errores de la API**: la inferencia se ejecutó utilizando las cuotas gratuitas (Free Tier). Aunque en general el comportamiento fue muy bueno, poco antes de la entrega el modelo Gemma comenzó a presentar fallas inconsistentes de origen interno y errores de parámetros no documentados. Para mitigar esto se migró el procesamiento a Gemini Flash, solucionando la estabilidad principal. Se implementó un manejo de errores general en el flujo, pero por restricciones de tiempo no se alcanzó a construir un mecanismo de fallback automático entre modelos para aislar al 100% este tipo de caídas esporádicas de la API del proveedor.
