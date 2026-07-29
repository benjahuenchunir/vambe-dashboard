import type { TopCasoUso } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopUseCasesTable({ data }: { data: TopCasoUso[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 casos de uso</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.nombre} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{row.nombre}</span>
            <span className="tabular-nums font-medium text-primary">{row.tasaCierre}% cierre</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
