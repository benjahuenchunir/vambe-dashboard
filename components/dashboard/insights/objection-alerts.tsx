import type { AlertaObjecion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const URGENCIA_TONE: Record<string, string> = {
  "Alta": "destructive",
  "Media": "default",
  "Baja": "muted",
  "no_inferible": "muted",
};

export function ObjectionAlerts({ data }: { data: AlertaObjecion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas: objeciones sin resolver en deals abiertos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.clienteId} className="flex flex-col gap-1 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.nombreCliente}</span>
              <Badge tone={URGENCIA_TONE[row.urgencia] ?? "default"}>{row.urgencia}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.objecion}</p>
            <span className="text-xs text-tertiary">Vendedor: {row.vendedor}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas activas para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
