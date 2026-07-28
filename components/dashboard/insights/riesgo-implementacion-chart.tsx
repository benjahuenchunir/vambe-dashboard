import type { RiesgoImplementacion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RiesgoImplementacionChart({ data }: { data: RiesgoImplementacion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riesgo de implementación vs. cierre real</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {data.map((row) => (
          <div key={row.factor} className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{row.factor}</p>

            <div className="flex items-center justify-between">
              <span className="text-foreground">Con el factor ({row.totalConRiesgo})</span>
              <span className="tabular-nums text-primary">{row.tasaCierreConRiesgo}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.tasaCierreConRiesgo}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-foreground">Sin el factor ({row.totalSinRiesgo})</span>
              <span className="tabular-nums text-primary">{row.tasaCierreSinRiesgo}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.tasaCierreSinRiesgo}%` }} />
            </div>
          </div>
        ))}
        {data.every((r) => r.totalConRiesgo + r.totalSinRiesgo === 0) && (
          <p className="text-sm text-muted-foreground">Sin datos suficientes para este filtro.</p>
        )}
      </CardContent>
    </Card>
  );
}
