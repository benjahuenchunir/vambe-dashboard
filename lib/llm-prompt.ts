import type { ExistingTaxonomies } from "./taxonomy";
import { buildGroundingBlock } from "./taxonomy";

/**
 * Reference prompt for the real LLM categorization call. Not invoked yet —
 * `lib/store.ts#processNextBatch` still returns mock data. Wire this into
 * `app/api/process/route.ts` once an LLM provider is configured (Gemma 4 via
 * Groq/Ollama, Gemini Flash, etc.), using JSON mode / structured output so
 * the response can be parsed directly against `ClientAnalysis`.
 */
export function buildCategorizationPrompt(transcript: string, taxonomies: ExistingTaxonomies): string {
  return `Analiza la siguiente transcripción de una reunión de ventas de Vambe (chatbot/IA conversacional) y extrae las dimensiones pedidas en formato JSON.

${buildGroundingBlock(taxonomies)}

Reglas de consistencia (importante):
- Para "industria", "fuente_descubrimiento", "canales", "integraciones_criticas" y "casos_uso": usa una etiqueta corta y genérica (Título Case), sin nombre de marca ni detalles específicos del cliente. Prioriza reutilizar una de las categorías ya existentes listadas arriba antes de crear una nueva.
- No inventes información que no esté en la transcripción. Si un dato no aparece, usa null (o [] para listas) en vez de adivinar.
- "objeciones_implicitas" son preocupaciones que el prospecto no verbalizó directamente pero que se infieren del tono o del contexto (ej. silencios sobre presupuesto, comparaciones veladas). No repitas ahí objeciones que el cliente ya planteó explícitamente.

Transcripción:
"""
${transcript}
"""

Devuelve JSON estricto (sin texto adicional) con esta forma exacta:
{
  "industria": "string — sector exacto del negocio",
  "tamano_negocio": "Micro | Pequeño | Mediano | Grande",
  "volumen_interacciones": { "nivel": "Bajo | Medio | Alto", "mensual_aprox": number | null },
  "canales": ["string"],
  "integraciones_criticas": ["string"],
  "casos_uso": ["string"],
  "complejidad_tecnica": "Baja | Media | Alta", # ??
  "fuente_descubrimiento": "string — cómo descubrió Vambe",
  "nivel_urgencia": { "nivel": "Crítico | Alto | Medio | Bajo", "cita": "string — cita textual breve que lo justifica" },
  "madurez_digital": "Incipiente | En transición | Avanzada",
  "perfil_decisor": "Dueño | Gerente | Administrador | Director",
  "objeciones_implicitas": ["string"],
  "alineacion_roadmap": "Alta | Media | Baja", ??
  "mencion_competencia": boolean,
  "potencial_expansion": "Alto | Medio | Bajo",
  "vambe_readiness_score": "number del 1 al 10 — fórmula: volumen(3pts) + urgencia(3pts) + alineación(2pts) + madurez(2pts)"
}`;
}
