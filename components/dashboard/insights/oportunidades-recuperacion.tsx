import type { OportunidadRecuperacion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OportunidadesRecuperacion({ data }: { data: OportunidadRecuperacion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Casos por recuperar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.clienteId} className="flex flex-col gap-1 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.nombreCliente}</span>
              <Badge tone={row.readinessScore >= 80 ? "primary" : "default"}>{row.readinessScore}/100</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.motivo}</p>
            {row.objecionPrincipal && (
              <p className="rounded-lg bg-muted px-2 py-1 text-xs text-foreground">{row.objecionPrincipal}</p>
            )}
            <span className="text-xs text-tertiary">Vendedor: {row.vendedor}</span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin casos por recuperar para este filtro.</p>
        )}
      </CardContent>
    </Card>
  );
}