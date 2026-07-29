"use client";

import { useEffect, useRef, useState } from "react";
import type { RoiFuente } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function CloseRateByDicoverSource({ data }: { data: RoiFuente[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openIndex]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por fuente de descubrimiento</CardTitle>
        <InfoTooltip
          description="Tasa de cierre y volumen de leads por fuente de descubrimiento (cómo llegó el cliente a Vambe), con ejemplos concretos de cada fuente."
          note="Ayuda a decidir dónde poner esfuerzo de marketing/prospección. Ojo: no es ROI en dólares — no tenemos costo por canal, esto es efectividad de conversión."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div ref={containerRef} className="contents">
          {data.map((row, idx) => {
            const sinDatos = row.fuente === null;
            return (
            <div key={row.fuente ?? "__sin_datos__"} className="relative flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className={sinDatos ? "text-muted-foreground italic" : "text-foreground"}>{sinDatos ? "Sin datos" : row.fuente}</span>
                <span className={`tabular-nums ${sinDatos ? "text-muted-foreground" : "text-primary"}`}>
                  {row.tasaCierre}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${sinDatos ? "bg-muted-foreground/40" : "bg-primary"}`} style={{ width: `${row.tasaCierre}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tertiary">{row.volumenLeads} leads</span>
                {row.ejemplos.length > 0 && (
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {openIndex === idx ? "Ocultar ejemplos" : "Ver ejemplos"}
                  </button>
                )}
              </div>

              {openIndex === idx && row.ejemplos.length > 0 && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card p-3 shadow-theme">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Ejemplos concretos:</p>
                  <div className="flex flex-wrap gap-1">
                    {row.ejemplos.map((ej) => (
                      <span key={ej} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {ej}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) 
          })}
        </div>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}