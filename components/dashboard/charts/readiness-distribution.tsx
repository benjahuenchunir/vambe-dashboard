"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReadinessBucket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReadinessDistributionProps {
  data: ReadinessBucket[];
  tasaCierreGeneral: number;
}

export function ReadinessDistribution({ data, tasaCierreGeneral }: ReadinessDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por rango de Readiness Score</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="rango" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, _name, item) => [`${value}%`, `${item.payload.total} negocios (${item.payload.cerrados} cerrados)`]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <ReferenceLine
              y={tasaCierreGeneral}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `Promedio general (${tasaCierreGeneral}%)`,
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <Bar dataKey="tasaCierre" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}