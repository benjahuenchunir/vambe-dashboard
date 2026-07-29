import type { CasoPorRecuperar } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const URGENCIA_TONE: Record<string, string> = {
  Alta: "destructive",
  Media: "default",
  Baja: "muted",
  no_inferible: "muted",
};

export function CasosPorRecuperar({ data }: { data: CasoPorRecuperar[] }) {
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
            {row.objecionPrincipal ? (
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">{row.objecionPrincipal}</p>
                {row.urgenciaObjecion && (
                  <Badge tone={URGENCIA_TONE[row.urgenciaObjecion] ?? "default"} className="shrink-0">
                    {row.urgenciaObjecion}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin objeción explícita registrada.</p>
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
