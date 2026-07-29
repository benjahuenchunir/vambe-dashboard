import type { ClientAnalysis, ProcessingStatus } from "./types";
import { supabase } from "./supabase";
import { rowToClient, clientToInsertRow, type ClientRow } from "./db-mapper";
import { reconcileLabel, reconcileList, type ExistingTaxonomies } from "./taxonomy";

/**
 * Data-access layer backed by Supabase. This is the only file that knows
 * about the DB — swap it out (or point it at a different backend) without
 * touching API routes, metrics, or UI.
 */

const TOTAL_EN_CSV = 10_000;
const PAGE_SIZE = 1000;

export async function getClients(): Promise<ClientAnalysis[]> {
  const rows: ClientRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("fecha_reunion", { ascending: false })
      .order("id", { ascending: true }) // desempate estable — ver nota abajo
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Error leyendo clientes: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...(data as ClientRow[]));
    if (data.length < PAGE_SIZE) break; // llegamos a la última página
    from += PAGE_SIZE;
  }

  return rows.map(rowToClient);
}

export async function getProcessingStatus(): Promise<ProcessingStatus> {
  const { count, error } = await supabase.from("clients").select("*", { count: "exact", head: true });
  if (error) throw new Error(`Error leyendo estado de procesamiento: ${error.message}`);
  const totalProcesados = count ?? 0;
  return {
    totalEnCsv: TOTAL_EN_CSV,
    totalProcesados,
    totalPendientes: Math.max(0, TOTAL_EN_CSV - totalProcesados),
  };
}

/**
 * Pulls the current vocabulary for every open-ended dimension, used both to
 * ground the LLM prompt (see `lib/llm-prompt.ts`) and to reconcile near-
 * duplicate labels before insert (see `lib/taxonomy.ts`).
 *
 * Note: this scans the full `clients` table client-side to dedupe. Fine at
 * the volumes this demo runs at; if the categorized set grows into the tens
 * of thousands, replace with a Postgres view/RPC that returns DISTINCT
 * values server-side instead.
 */
async function getExistingTaxonomies(): Promise<ExistingTaxonomies> {
  const { data, error } = await supabase
    .from("clients")
    .select("industria, fuente_descubrimiento, canales, integraciones_criticas, casos_uso");
  if (error) throw new Error(`Error leyendo taxonomías: ${error.message}`);

  const uniq = (values: (string | null | undefined)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

  return {
    industria: uniq(data.map((r) => r.industria)),
    fuenteDescubrimiento: uniq(data.map((r) => r.fuente_descubrimiento)),
    canales: uniq(data.flatMap((r) => r.canales ?? [])),
    integracionesCriticas: uniq(data.flatMap((r) => r.integraciones_criticas ?? [])),
    casosUso: uniq(data.flatMap((r) => r.casos_uso ?? [])),
  };
}

/**
 * Simulates sending the next `batchSize` un-processed transcripts to the LLM
 * and persisting the categorized result.
 *
 * Replace the mock-generation step with a real call once a provider is
 * configured:
 *   1. Pull the next `batchSize` un-processed rows from the CSV/DB.
 *   2. taxonomies = await getExistingTaxonomies()
 *   3. For each transcript: prompt = buildCategorizationPrompt(transcript, taxonomies)
 *      -> call the LLM with JSON mode -> validate against ClientAnalysis.
 *   4. Still run the reconciliation pass below before insert — grounding
 *      reduces drift but doesn't guarantee zero near-duplicates.
 */
export async function processNextBatch(batchSize: number): Promise<ClientAnalysis[]> {
  const status = await getProcessingStatus();
  const actualSize = Math.min(batchSize, status.totalPendientes);
  if (actualSize <= 0) return [];

  // Simulated LLM API latency.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const taxonomies = await getExistingTaxonomies();
  const rawBatch = [] // TODO: replace with real LLM output

  // Reconcile every open-ended field against the vocabulary seen so far,
  // exactly as we would with real LLM output (see module docstring above).
  const reconciled = rawBatch.map((c) => {
    const industria = reconcileLabel(c.industria, taxonomies.industria);
    const fuenteDescubrimiento = reconcileLabel(c.fuenteDescubrimiento, taxonomies.fuenteDescubrimiento);
    const canales = reconcileList(c.canales, taxonomies.canales);
    const integracionesCriticas = reconcileList(c.integracionesCriticas, taxonomies.integracionesCriticas);
    const casosUso = reconcileList(c.casosUso, taxonomies.casosUso);

    // Feed reconciled values back in so labels stay consistent within the batch too.
    taxonomies.industria.push(industria);
    taxonomies.fuenteDescubrimiento.push(fuenteDescubrimiento);
    taxonomies.canales.push(...canales);
    taxonomies.integracionesCriticas.push(...integracionesCriticas);
    taxonomies.casosUso.push(...casosUso);

    return { ...c, industria, fuenteDescubrimiento, canales, integracionesCriticas, casosUso };
  });

  const rows = reconciled.map(({ id: _id, ...rest }) => clientToInsertRow(rest));
  const { data, error } = await supabase.from("clients").insert(rows).select("*");
  if (error) throw new Error(`Error guardando clientes categorizados: ${error.message}`);

  return (data as ClientRow[]).map(rowToClient);
}
