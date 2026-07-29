"use client";

import { useMemo, useState } from "react";
import type { TopCasoUso } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const MIN_SAMPLE = 3;
const DEFAULT_VISIBLE = 5;

export function TopUseCasesTable({ data }: { data: TopCasoUso[] }) {
  const [showAll, setShowAll] = useState(false);
  const hasFrecuencia = data.every((d) => typeof d.frecuencia === "number");

  const { confiables, bajaMuestra } = useMemo(() => {
    if (!hasFrecuencia) return { confiables: data, bajaMuestra: [] as TopCasoUso[] };
    const sorted = [...data].sort((a, b) => b.tasaCierre - a.tasaCierre);
    return {
      confiables: sorted.filter((d) => (d.frecuencia ?? 0) >= MIN_SAMPLE),
      bajaMuestra: sorted.filter((d) => (d.frecuencia ?? 0) < MIN_SAMPLE),
    };
  }, [data, hasFrecuencia]);

  const visible = showAll ? [...confiables, ...bajaMuestra] : confiables.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = data.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top casos de uso</CardTitle>
        <InfoTooltip
          description="Casos de uso más mencionados por los clientes, con su tasa de cierre asociada (entre los mencionados al menos 3 veces, para que el % no lo defina un solo caso aislado)."
          note="Dice qué funcionalidad destacar en el discurso de ventas y demos — prioriza según lo que realmente convierte, no solo lo más pedido."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {visible.map((row) => (
          <div key={row.nombre} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{row.nombre}</span>
            <span className="tabular-nums font-medium text-primary">
              {row.tasaCierre}% cierre{typeof row.frecuencia === "number" ? ` (n=${row.frecuencia})` : ""}
            </span>
          </div>
        ))}
        {hasFrecuencia && (hiddenCount > 0 || showAll) && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            {showAll ? "Mostrar menos" : `Ver ${hiddenCount} más`}
          </button>
        )}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}