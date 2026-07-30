"use client";

import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TendenciaMensual } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function TendenciaTemporalChart({ data }: { data: TendenciaMensual[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia mensual: volumen y tasa de cierre</CardTitle>
        <InfoTooltip
          description="Evolución mensual del número de leads categorizados (barras) y la tasa de cierre (línea), según la fecha de la reunión de ventas."
          note="Responde si el pipeline crece o se achica en el tiempo, y si la conversión mejora o empeora mes a mes — la primera pregunta que hace cualquier gerente de ventas."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mesLabel" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis yAxisId="volumen" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
            <YAxis
              yAxisId="tasa"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: any, name: any) => 
                name === "tasaCierre" ? [`${value ?? 0}%`, "Tasa de cierre"] : [value ?? 0, "Leads"]
              }
              labelFormatter={(label) => label}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Bar yAxisId="volumen" dataKey="totalLeads" name="Leads" fill="var(--tertiary)" radius={[6, 6, 0, 0]} />
            <Line
              yAxisId="tasa"
              type="monotone"
              dataKey="tasaCierre"
              name="tasaCierre"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4 border-t border-border pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-tertiary" /> Leads
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Tasa de cierre
          </span>
        </div>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}