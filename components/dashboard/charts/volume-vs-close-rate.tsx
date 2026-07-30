"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VolumenBucket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function VolumeVsCloseRate({ data }: { data: VolumenBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por tramo de volumen</CardTitle>
        <InfoTooltip
          description="Distribución de negocios ganados y perdidos según el rango de consultas mensuales reportadas, con la tasa de conversión (%) por tramo."
          note="Si la tasa de cierre es similar entre tramos, el volumen no está siendo un factor determinante para el cierre. Sirve como indicador para ajustar el peso del volumen dentro del Readiness Score."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="rango" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "cerrados" || name === "perdidos"
                  ? [`${value} negocios`, name === "cerrados" ? "Cerrados" : "Perdidos"]
                  : value
              }
              labelFormatter={(rango, payload) => `${rango} · ${payload?.[0]?.payload?.tasaCierre ?? 0}% de cierre`}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="a" fill="var(--primary)" />
            <Bar dataKey="perdidos" name="Perdidos" stackId="a" fill="var(--destructive)" fillOpacity={0.6} radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="tasaCierre"
                position="top"
                formatter={(v: number) => `${v}%`}
                style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}