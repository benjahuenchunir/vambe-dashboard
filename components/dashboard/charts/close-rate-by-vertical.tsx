"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CierrePorVertical } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const MIN_SAMPLE = 3; // debajo de esto, el % de cierre es poco confiable para rankear
const DEFAULT_VISIBLE = 6;
const BAR_HEIGHT = 32;

function truncate(label: string, max = 14) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function CloseRateByVertical({ data }: { data: CierrePorVertical[] }) {
  const [showAll, setShowAll] = useState(false);

  const { confiables, bajaMuestra } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.tasaCierre - a.tasaCierre);
    return {
      confiables: sorted.filter((d) => d.total >= MIN_SAMPLE),
      bajaMuestra: sorted.filter((d) => d.total < MIN_SAMPLE),
    };
  }, [data]);

  const visible = showAll ? [...confiables, ...bajaMuestra] : confiables.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = data.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasa de cierre por vertical</CardTitle>
        <InfoTooltip
          description="Porcentaje de negocios cerrados por industria."
          note="Le dice al equipo en qué verticales enfocar prospección y contenido de ventas. No solo cuál convierte más, sino cuál conviene perseguir."
        />
      </CardHeader>
      <CardContent style={{ height: Math.max(220, visible.length * BAR_HEIGHT + 75) }} className="pt-0">
        <ResponsiveContainer width="100%" height="95%">
          <BarChart data={visible} layout="vertical" margin={{ left: 8, right: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="industria"
              width={110}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              tickFormatter={(v: string) => truncate(v)}
            />
            <Tooltip
              formatter={(value: number, _name, item) => [`${value}%`, `${item.payload.total} negocios`]}
              labelFormatter={(label) => label}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Bar dataKey="tasaCierre" fill="var(--primary)" radius={[0, 6, 6, 0]}>
              <LabelList
                dataKey="total"
                position="right"
                formatter={(v: number) => `n=${v}`}
                style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {(hiddenCount > 0 || showAll) && (
          <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-medium text-primary hover:underline">
            {showAll ? "Mostrar menos" : `Ver ${hiddenCount} más`}
          </button>
        )}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}