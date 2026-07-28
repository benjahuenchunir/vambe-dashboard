"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CierrePorVertical } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CloseRateByVertical({ data }: { data: CierrePorVertical[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por vertical</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis type="category" dataKey="industria" width={90} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, _name, item) => [`${value}%`, `${item.payload.total} negocios`]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Bar dataKey="tasaCierre" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
