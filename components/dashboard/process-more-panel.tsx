"use client";

import { useState } from "react";
import type { ProcessingStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProcessMorePanelProps {
  status: ProcessingStatus;
  onProcess: (batchSize: number) => Promise<unknown>;
}

const BATCH_SIZE = 25;

export function ProcessMorePanel({ status, onProcess }: ProcessMorePanelProps) {
  const [loading, setLoading] = useState(false);
  const progressPct = Math.round((status.totalProcesados / status.totalEnCsv) * 100);
  const isDone = status.totalPendientes === 0;

  async function handleClick() {
    setLoading(true);
    try {
      await onProcess(BATCH_SIZE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2 min-w-[240px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {status.totalProcesados.toLocaleString("es-CL")} de {status.totalEnCsv.toLocaleString("es-CL")} reuniones categorizadas
            </span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <Button onClick={handleClick} disabled={loading || isDone}>
          {loading ? (
            <>
              <iconify-icon icon="lucide:loader-2" width="16" height="16" className="animate-spin" />
              Procesando…
            </>
          ) : isDone ? (
            <>
              <iconify-icon icon="lucide:check" width="16" height="16" />
              Todo procesado
            </>
          ) : (
            <>
              <iconify-icon icon="lucide:sparkles" width="16" height="16" />
              Seguir procesando ({BATCH_SIZE} más)
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
