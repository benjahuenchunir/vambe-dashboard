"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PipelinePorComplejidad } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  Baja: "#a3c9ff",
  Media: "#4a9dff",
  Alta: "#006bff",
  no_inferible: "#94a3b8",
};

export function PipelineByComplexity({ data }: { data: PipelinePorComplejidad[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline por complejidad técnica</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="cantidad"
              nameKey="complejidad"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              label={({ complejidad, porcentaje }) => `${complejidad} ${porcentaje}%`}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.complejidad} fill={COLORS[entry.complejidad] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => [`${value} negocios`, item.payload.complejidad]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
