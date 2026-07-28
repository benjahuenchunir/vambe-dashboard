"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { VolumenVsCierrePoint } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Deterministic jitter from string so y position is stable across renders
function jitter(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return (Math.sin(hash) + 1) / 2; // 0..1
}

export function VolumeVsCloseRate({ data }: { data: VolumenVsCierrePoint[] }) {
  // Inject numeric y for Recharts
  const chartData = data.map((d) => ({
    ...d,
    y: jitter(d.clienteId),
  }));

  const cerrados = chartData.filter((d) => d.cerrado);
  const perdidos = chartData.filter((d) => !d.cerrado);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumen de mensajería vs. resultado</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 8, right: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="volumenMensual"
              name="Volumen mensual"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              label={{
                value: "Consultas/mes",
                position: "insideBottom",
                offset: -4,
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            {/* Y is now a real number. Keep hidden since it's just for vertical spread. */}
            <YAxis type="number" dataKey="y" domain={[0, 1]} hide />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, name: string) =>
                name === "volumenMensual"
                  ? `${value.toLocaleString("es-CL")} consultas/mes`
                  : value
              }
              labelFormatter={(_, payload) => payload?.[0]?.payload?.nombreCliente ?? ""}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Scatter name="Cerrados" data={cerrados} fill="var(--primary)" />
            <Scatter name="Perdidos" data={perdidos} fill="var(--destructive)" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Cerrados
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive/60" /> Perdidos
          </span>
        </div>
      </CardContent>
    </Card>
  );
}