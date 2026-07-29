"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ClientAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface AreaNegocioDistributionProps {
  clients: ClientAnalysis[];
}

export function AreaNegocioDistribution({ clients }: AreaNegocioDistributionProps) {
  const counts = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    const area = c.areaNegocioPrincipal;
    const entry = counts.get(area) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    counts.set(area, entry);
  }

  const data = [...counts.entries()]
    .map(([area, v]) => ({
      area,
      total: v.total,
      cerrados: v.cerrados,
      tasa: v.total ? Math.round((v.cerrados / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por área de negocio</CardTitle>
        <InfoTooltip
          description="Cantidad total de negocios y cuántos se cerraron, agrupados por el área de negocio principal (Ecommerce, Agendamiento, Venta Consultiva, Atención al Cliente) que detectó el LLM."
          note="Muestra dónde se concentra el pipeline y qué área convierte mejor — ayuda a decidir en qué área de producto enfocar el roadmap y el discurso comercial."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis type="category" dataKey="area" width={120} tick={{ fill: "var(--foreground)", fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "tasa") return [`${value}%`, "Tasa de cierre"];
                return [value, name === "cerrados" ? "Cerrados" : "Total"];
              }}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="total" name="Total" fill="var(--tertiary)" radius={[0, 6, 6, 0]} />
            <Bar dataKey="cerrados" name="Cerrados" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}