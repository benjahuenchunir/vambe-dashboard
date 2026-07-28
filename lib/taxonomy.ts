/**
 * The LLM has no fixed enum for open-ended dimensions like `industria` or
 * `canales` — we don't have that taxonomy ourselves, it has to emerge from
 * the data. Left alone, the same concept gets written differently across
 * calls ("Retail", "cadena de retail", "tienda retail"), which silently
 * breaks every chart that groups by that field.
 *
 * The fix has two layers:
 *  1. Prompt-level grounding (see `buildGroundingBlock`): before extracting a
 *     new batch, we tell the model which labels are already in use per
 *     dimension and ask it to reuse one if it fits, or mint a new short,
 *     generic one if it doesn't. This is the primary defense — cheap (no
 *     extra model calls) and it's what keeps the vocabulary small over time.
 *  2. A string-similarity safety net (this file): even a well-grounded model
 *     will occasionally vary casing/wording, so before inserting we compare
 *     the new label against the existing vocabulary and snap to an existing
 *     one if they're close enough. This never invents a taxonomy — it only
 *     collapses near-duplicates of labels the model itself already produced.
 */

function foldForCompare(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents for comparison only
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein-based similarity in [0, 1]. */
function similarity(a: string, b: string): number {
  const x = foldForCompare(a);
  const y = foldForCompare(b);
  if (x === y) return 1;
  if (!x.length || !y.length) return 0;

  const dp: number[][] = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = 0; i <= x.length; i++) dp[i][0] = i;
  for (let j = 0; j <= y.length; j++) dp[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      dp[i][j] =
        x[i - 1] === y[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const distance = dp[x.length][y.length];
  return 1 - distance / Math.max(x.length, y.length);
}

const MATCH_THRESHOLD = 0.82;

/**
 * Given a freshly-extracted label and the vocabulary already used for that
 * dimension, returns the existing label if it's a close match, otherwise a
 * lightly normalized version of the new label (trimmed, single-spaced,
 * Title Case) so it can seed a new entry.
 */
export function reconcileLabel(rawLabel: string, existing: string[]): string {
  const cleaned = rawLabel.trim().replace(/\s+/g, " ");
  if (!cleaned) return cleaned;

  let best: { label: string; score: number } | null = null;
  for (const candidate of existing) {
    const score = similarity(cleaned, candidate);
    if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { label: candidate, score };
    }
  }
  if (best) return best.label;

  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function reconcileList(rawLabels: string[], existing: string[]): string[] {
  const result: string[] = [];
  const pool = [...existing];
  for (const raw of rawLabels) {
    const reconciled = reconcileLabel(raw, pool);
    if (!pool.includes(reconciled)) pool.push(reconciled);
    if (!result.includes(reconciled)) result.push(reconciled);
  }
  return result;
}

export interface ExistingTaxonomies {
  industria: string[];
  fuenteDescubrimiento: string[];
  canales: string[];
  integracionesCriticas: string[];
  casosUso: string[];
}

/**
 * Builds the "categorías ya existentes" block injected into the LLM prompt
 * so the model grounds new output in the vocabulary it has already produced,
 * instead of inventing fresh wording every time.
 */
export function buildGroundingBlock(taxonomies: ExistingTaxonomies): string {
  const section = (label: string, values: string[]) =>
    values.length ? `${label}: ${values.slice(0, 40).join(", ")}` : `${label}: (ninguna todavía)`;

  return [
    "Categorías ya utilizadas en registros previos — reutiliza una si la transcripción calza,",
    "o crea una nueva corta y genérica (sin nombre de marca, sin detalles de la transcripción) si no calza:",
    section("industria", taxonomies.industria),
    section("fuente_descubrimiento", taxonomies.fuenteDescubrimiento),
    section("canales", taxonomies.canales),
    section("integraciones_criticas", taxonomies.integracionesCriticas),
    section("casos_uso", taxonomies.casosUso),
  ].join("\n");
}
