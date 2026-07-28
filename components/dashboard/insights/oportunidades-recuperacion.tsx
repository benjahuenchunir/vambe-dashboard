import type { OportunidadRecuperacion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OportunidadesRecuperacion({ data }: { data: OportunidadRecuperacion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Oportunidades de recuperación</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.clienteId} className="flex flex-col gap-1 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.nombreCliente}</span>
              <Badge tone={row.readinessScore >= 80 ? "primary" : "default"}>{row.readinessScore}/100</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.motivo}</p>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin oportunidades de recuperación para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
