"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReadinessBucket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ReadinessDistributionProps {
  data: ReadinessBucket[];
  tasaCierreGeneral: number;
}

export function ReadinessDistribution({ data, tasaCierreGeneral }: ReadinessDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por rango de Readiness Score</CardTitle>
        <InfoTooltip
          description="Tasa de cierre real de cada rango de Readiness Score, comparada contra el promedio general de la cuenta (línea punteada)."
          note="Si las barras no suben claramente de izquierda a derecha por sobre el promedio, es señal de que el score no está discriminando bien y conviene revisar sus pesos (ver analyze_readiness_signals.py)."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="rango" tick={{ fill: "var(--tertiary)", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--tertiary)", fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, _name, item) => [`${value}%`, `${item.payload.total} negocios (${item.payload.cerrados} cerrados)`]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <ReferenceLine
              y={tasaCierreGeneral}
              stroke="var(--tertiary)"
              strokeDasharray="4 4"
              label={{
                value: `Promedio general (${tasaCierreGeneral}%)`,
                position: "insideTopLeft",
                fill: "var(--tertiary)",
                fontSize: 11,
              }}
            />
            <Bar dataKey="tasaCierre" fill="var(--primary)" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={(v: number) => `n=${v}`}
                style={{
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}