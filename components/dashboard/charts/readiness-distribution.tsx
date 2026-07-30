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
          description="Tasa de cierre real en cada tramo de puntaje, comparada contra el promedio de conversión general del pipeline (línea punteada)."
          note="Valida la capacidad predictiva del algoritmo. En un modelo bien calibrado, las barras deben mostrar una tendencia ascendente clara. Si la curva es plana, indica que los pesos de la fórmula deben recalibrarse."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="rango" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip
              formatter={(value: any, _name, item: any) => [
                `${value ?? 0}%`,
                `${item?.payload?.total ?? 0} negocios (${item?.payload?.cerrados ?? 0} cerrados)`,
              ]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            
            {/* Línea de promedio destacada */}
            <ReferenceLine
              y={tasaCierreGeneral}
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="6 4"
              label={{
                value: `Promedio general (${tasaCierreGeneral}%)`,
                position: "insideTopLeft",
                fill: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
              }}
            />

            <Bar dataKey="tasaCierre" fill="var(--primary)" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={(v: any) => `n=${v ?? 0}`}
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