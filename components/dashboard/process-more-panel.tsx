"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startPipeline, stopPipeline } from "@/lib/pipeline";
import { usePipelineStatus } from "@/hooks/use-pipeline-status";

interface ProcessMorePanelProps {
  onDataUpdated: () => void;
}

const BATCH_OPTIONS = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Sin límite", value: 0 },
] as const;

export function ProcessMorePanel({ onDataUpdated }: ProcessMorePanelProps) {
  const { status, refresh } = usePipelineStatus(onDataUpdated);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  async function handleStart() {
    setStarting(true);
    try {
      await startPipeline(batchSize, 3);
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      await stopPipeline();
      await refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setStopping(false);
    }
  }

  const isNoLimit = batchSize === 0;
  const isComplete = status.totalCsv > 0 && status.totalGlobal >= status.totalCsv;

  // Progreso global: todas las tandas acumuladas
  const globalPct =
    status.totalCsv > 0
      ? Math.round((status.totalGlobal / status.totalCsv) * 100)
      : 0;

  // Progreso del lote actual (solo si esta corriendo)
  const lotePct =
    status.running && status.totalBatch > 0
      ? Math.round((status.processed / status.totalBatch) * 100)
      : 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2 min-w-[280px]">
          {/* Linea 1: Estado principal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {status.running
                ? isNoLimit
                  ? `Procesando sin límite: ${status.processed}/${status.totalBatch} en esta tanda · ${status.succeeded} ok · ${status.failed} fallidas`
                  : `Procesando lote: ${status.processed}/${status.totalBatch} · ${status.succeeded} ok · ${status.failed} fallidas`
                : status.error
                  ? `Último intento falló: ${status.error}`
                  : isComplete
                    ? "Todas las reuniones han sido categorizadas"
                    : `${status.totalGlobal.toLocaleString("es-CL")} de ${status.totalCsv.toLocaleString("es-CL")} reuniones categorizadas`}
            </span>
            <span className="text-muted-foreground">{globalPct}% total</span>
          </div>

          {/* Barra de progreso global */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${globalPct}%` }}
            />
          </div>

          {/* Linea 2: Detalle del lote (solo si corre) */}
          {status.running && (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Progreso global: {status.totalGlobal.toLocaleString("es-CL")} de{" "}
                  {status.totalCsv.toLocaleString("es-CL")} ·{" "}
                  {(status.totalBatch - status.processed).toLocaleString("es-CL")} pendientes
                </span>
                {status.totalBatch > 0 && (
                  <span>Tanda actual: {lotePct}%</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground/70 italic">
                Las métricas se actualizarán automáticamente cada cierto tiempo.
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Batch size selector */}
          {!status.running && (
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={starting}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Tamaño del lote"
            >
              {BATCH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {status.running ? (
            <Button
              onClick={handleStop}
              disabled={stopping || status.stopRequested}
              variant="secondary"
            >
              {status.stopRequested ? (
                <>
                  <iconify-icon
                    icon="lucide:loader-2"
                    width="16"
                    height="16"
                    className="animate-spin"
                  />
                  Deteniendo…
                </>
              ) : (
                <>
                  <iconify-icon icon="lucide:square" width="16" height="16" />
                  Detener
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={starting || isComplete}
            >
              {starting ? (
                <>
                  <iconify-icon
                    icon="lucide:loader-2"
                    width="16"
                    height="16"
                    className="animate-spin"
                  />
                  Iniciando…
                </>
              ) : (
                <>
                  <iconify-icon icon="lucide:sparkles" width="16" height="16" />
                  {isComplete ? "Completado" : isNoLimit ? "Procesar todo" : `Procesar ${batchSize}`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}