import type { ObjecionFrecuente } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TopObjections({ data }: { data: ObjecionFrecuente[] }) {
  const max = Math.max(1, ...data.map((d) => d.frecuencia));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objeciones implícitas más frecuentes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.objecion} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{row.objecion}</span>
              <span className="tabular-nums text-muted-foreground">{row.frecuencia}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.frecuencia / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin objeciones detectadas para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
