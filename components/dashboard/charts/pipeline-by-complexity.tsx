"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PipelinePorComplejidad } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const COLORS: Record<string, string> = {
  Baja: "#a3c9ff",
  Media: "#4a9dff",
  Alta: "#006bff",
  no_inferible: "#c7ccd1",
};

const LABELS: Record<string, string> = {
  Baja: "Baja",
  Media: "Media",
  Alta: "Alta",
  no_inferible: "Sin datos suficientes",
};

export function PipelineByComplexity({ data }: { data: PipelinePorComplejidad[] }) {
  const sinDatos = data.find((d) => d.complejidad === "no_inferible");
  const sinDatosPct = sinDatos?.porcentaje ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline por complejidad técnica</CardTitle>
        <InfoTooltip
          description="Distribución de negocios por complejidad técnica de implementación (Baja/Media/Alta), según lo que el LLM pudo inferir de la transcripción."
          note="Ayuda a estimar carga de trabajo de implementación antes de firmar contratos. Ojo: hoy una parte importante queda como 'sin datos suficientes' — es una limitación del prompt actual, no del cliente."
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
              label={({ complejidad, porcentaje }) => `${LABELS[complejidad] ?? complejidad} ${porcentaje}%`}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.complejidad} fill={COLORS[entry.complejidad] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _name, item) => [`${value} negocios`, LABELS[item.payload.complejidad] ?? item.payload.complejidad]}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}