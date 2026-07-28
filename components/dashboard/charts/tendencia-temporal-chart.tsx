"use client";

import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TendenciaMensual } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TendenciaTemporalChart({ data }: { data: TendenciaMensual[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia mensual: volumen y tasa de cierre</CardTitle>
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
              formatter={(value: number, name) => (name === "tasaCierre" ? [`${value}%`, "Tasa de cierre"] : [value, "Leads"])}
              labelFormatter={(label) => label}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Bar yAxisId="volumen" dataKey="totalLeads" name="Leads" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
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
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-secondary" /> Leads (izq.)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Tasa de cierre (der.)
          </span>
        </div>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
