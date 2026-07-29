import type { IndustriaNoExplotada } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IndustriasNoExplotadas({ data }: { data: IndustriaNoExplotada[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industrias no explotadas</CardTitle>
        <p className="text-xs text-muted-foreground">
          Alto volumen de casos pero baja tasa de cierre (&le;40%)
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.industria} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.industria}</span>
              <div className="flex items-center gap-2">
                <Badge tone="destructive">{row.tasaCierre}% cierre</Badge>
                <Badge tone="default">{row.totalCasos} casos</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Vol. promedio: {row.volumenPromedio.toLocaleString("es-CL")}/mes</span>
              <span>Readiness: {row.readinessPromedio}/100</span>
            </div>
            <p className="text-xs text-tertiary">{row.diagnostico}</p>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay industrias con volumen suficiente y baja tasa de cierre en este filtro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
