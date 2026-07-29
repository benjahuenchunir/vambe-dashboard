import type { VendedorPerformance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VendorPerformanceTable({ data }: { data: VendedorPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempeño por vendedor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.vendedor} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-foreground">{row.vendedor}</span>
              <span className="text-xs text-muted-foreground">
                {row.dealsTotales} negocios · readiness prom. {row.readinessPromedio}/100
              </span>
            </div>
            <span className="tabular-nums font-medium text-primary">{row.tasaCierre}%</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
