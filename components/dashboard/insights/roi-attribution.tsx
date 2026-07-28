"use client";

import { useState } from "react";
import type { RoiFuente } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoiAttribution({ data }: { data: RoiFuente[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ROI por tipo de canal de descubrimiento</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row, idx) => (
          <div
            key={row.fuente}
            className="relative flex flex-col gap-1"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{row.fuente}</span>
              <span className="tabular-nums font-medium text-primary">{row.tasaCierre}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.tasaCierre}%` }} />
            </div>
            <span className="text-xs text-tertiary">{row.volumenLeads} leads</span>

            {/* Popup with concrete examples */}
            {hoveredIndex === idx && row.ejemplos.length > 0 && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-border bg-card p-3 shadow-lg">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Ejemplos concretos:</p>
                <div className="flex flex-wrap gap-1">
                  {row.ejemplos.map((ej) => (
                    <span
                      key={ej}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {ej}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
