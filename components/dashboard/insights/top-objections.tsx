import type { ObjecionFrecuente } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function TopObjections({ data }: { data: ObjecionFrecuente[] }) {
  const max = Math.max(1, ...data.map((d) => d.frecuencia));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objeciones implícitas más frecuentes</CardTitle>
        <InfoTooltip
          description="Ranking de las objeciones implícitas más frecuentes detectadas por el LLM, contando tanto negocios cerrados como abiertos."
          note="Dice qué objeción atacar primero en el guion de ventas o en el producto — muestra el patrón general, no solo lo que apareció en un deal puntual."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.objecion} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground" title={row.objecion}>
                {row.objecion}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{row.frecuencia}</span>
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