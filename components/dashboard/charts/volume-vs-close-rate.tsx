"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VolumenBucket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VolumeVsCloseRate({ data }: { data: VolumenBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumen mensual (por cuartil) vs. resultado</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="rango" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number, name: string, item) =>
                name === "cerrados" || name === "perdidos"
                  ? [`${value} negocios`, name === "cerrados" ? "Cerrados" : "Perdidos"]
                  : value
              }
              labelFormatter={(rango, payload) =>
                `${rango} · ${payload?.[0]?.payload?.tasaCierre ?? 0}% de cierre`
              }
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="cerrados" name="Cerrados" stackId="a" fill="var(--primary)" />
            <Bar dataKey="perdidos" name="Perdidos" stackId="a" fill="var(--destructive)" fillOpacity={0.6} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}