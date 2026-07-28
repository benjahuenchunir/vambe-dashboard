import type { TopIntegracion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopIntegrationsTable({ data }: { data: TopIntegracion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 integraciones solicitadas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.nombre} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-foreground">{row.nombre}</span>
              <span className="text-xs text-muted-foreground">Principal: {row.industriaPrincipal}</span>
            </div>
            <span className="tabular-nums font-medium text-primary">{row.porcentaje}%</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
