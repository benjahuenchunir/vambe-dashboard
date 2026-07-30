"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PipelinePorComplejidad } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const COLORS: Record<string, string> = {
  Baja: "#a3c9ff",
  Media: "#4a9dff",
  Alta: "#006bff",
  null: "#c7ccd1",
};

const LABELS: Record<string, string> = {
  Baja: "Baja",
  Media: "Media",
  Alta: "Alta",
  null: "Sin datos",
};

export function PipelineByComplexity({ data }: { data: PipelinePorComplejidad[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline por complejidad técnica</CardTitle>
        <InfoTooltip
          description="Distribución de negocios por complejidad técnica de implementación (Baja/Media/Alta), según lo que el LLM pudo inferir de la transcripción."
          note="Ayuda a estimar carga de trabajo de implementación antes de firmar contratos. Hoy una parte importante queda como 'sin datos'. Es una limitación del prompt actual y de los datos disponibles en la transcripción."
        />
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
              label={({ payload }: any) => {
                const complejidad = payload?.complejidad;
                const porcentaje = payload?.porcentaje;
                return `${LABELS[complejidad] ?? complejidad} ${porcentaje ?? 0}%`;
              }}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.complejidad} fill={COLORS[entry.complejidad] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, _name, item: any) => [
                `${value ?? 0} negocios`,
                LABELS[item?.payload?.complejidad] ?? item?.payload?.complejidad,
              ]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}