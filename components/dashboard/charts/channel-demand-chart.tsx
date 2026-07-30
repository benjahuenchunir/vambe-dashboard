"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CanalDemanda } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function ChannelDemandChart({ data }: { data: CanalDemanda[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demanda de canales de comunicación</CardTitle>
        <InfoTooltip
          description="Ranking de los canales más solicitados en las reuniones, diferenciando las soluciones soportadas nativamente de las solicitudes fuera del catálogo actual (ej. Telegram, SMS)."
          note="Los canales no soportados representan la demanda insatisfecha directa. Priorizar los de mayor volumen en el roadmap permite reducir la fricción en ventas y capturar negocios que hoy se pierden por falta de cobertura."
        />
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="canal" width={90} tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <Tooltip
              formatter={(value, _name, item) => {
                const num = Number(value);

                return [
                  `${num} clientes (${item.payload.porcentaje}%)`,
                  item.payload.soportado
                    ? "Soportado hoy"
                    : "No soportado — señal de producto",
                ];
              }}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell key={entry.canal} fill={entry.soportado ? "var(--primary)" : "var(--destructive)"} fillOpacity={entry.soportado ? 1 : 0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Soportado hoy
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive/70" /> No soportado
          </span>
        </div>
        {data.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}