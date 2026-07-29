import type { ClientAnalysis, ProcessingStatus } from "./types";
import { supabase } from "./supabase";
import { rowToClient, type ClientRow } from "./db-mapper";

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