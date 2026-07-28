"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { ClientAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReadinessVsCierreProps {
  clients: ClientAnalysis[];
}

export function ReadinessVsCierre({ clients }: ReadinessVsCierreProps) {
  const withScore = clients.filter((c) => c.vambeReadinessScore != null);
  const cerrados = withScore.filter((d) => d.cierre).map((c) => ({
    readiness: c.vambeReadinessScore,
    resultado: 1,
    nombre: c.nombreCliente,
  }));
  const perdidos = withScore.filter((d) => !d.cierre).map((c) => ({
    readiness: c.vambeReadinessScore,
    resultado: 0,
    nombre: c.nombreCliente,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Score vs resultado de cierre</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 8, right: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="readiness"
              name="Readiness Score"
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              label={{ value: "Readiness Score (0-100)", position: "insideBottom", offset: -4, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis type="number" dataKey="resultado" hide />
            <ZAxis range={[80, 80]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number, name: string, payload: any) => {
                if (name === "readiness") return [`${value}/100`, "Readiness Score"];
                return [value, name];
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.nombre ?? ""}
              contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontSize: 12 }}
            />
            <Scatter name="Cerrados" data={cerrados} fill="var(--primary)" />
            <Scatter name="Perdidos" data={perdidos} fill="var(--destructive)" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Cerrados
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive/60" /> Perdidos
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
