import type { PipelineStatus } from "./types";

function mapStatus(raw: any): PipelineStatus {
  return {
    running: raw.running,
    stopRequested: raw.stop_requested,
    totalGlobal: raw.total_global_processed,
    totalCsv: raw.total_csv,
    totalBatch: raw.total_lote,
    processed: raw.processed,
    succeeded: raw.succeeded,
    failed: raw.failed,
    error: raw.error,
  };
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  const res = await fetch("/api/pipeline/status", { cache: "no-store" });
  if (!res.ok) throw new Error(`Error leyendo estado del pipeline: ${res.status}`);
  return mapStatus(await res.json());
}

export async function startPipeline(limit: number, workers = 3): Promise<void> {
  const res = await fetch("/api/pipeline/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, workers }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Error iniciando el pipeline: ${res.status}`);
  }
}

export async function stopPipeline(): Promise<void> {
  const res = await fetch("/api/pipeline/stop", { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Error deteniendo el pipeline: ${res.status}`);
  }
}