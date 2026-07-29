"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VolumenBucket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function VolumeVsCloseRate({ data }: { data: VolumenBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumen mensual (por cuartil) vs. resultado</CardTitle>
        <InfoTooltip
          description="Negocios cerrados vs. perdidos agrupados por rango de volumen mensual reportado, con la tasa de cierre de cada rango marcada arriba de la barra."
          note="Si las tasas de cierre salen parecidas entre rangos, es una señal real: el volumen por sí solo no está discriminando tanto el cierre como se asume en el Readiness Score — vale la pena revisar el peso que le da la fórmula."
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