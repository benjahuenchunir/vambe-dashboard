import type { ClientAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CasosUsoNuevosProps {
  clients: ClientAnalysis[];
}

export function CasosUsoNuevos({ clients }: CasosUsoNuevosProps) {
  const counts = new Map<string, { count: number; industrias: Set<string>; closed: number }>();
  for (const c of clients) {
    for (const caso of c.casosUsoNuevos) {
      const entry = counts.get(caso) ?? { count: 0, industrias: new Set<string>(), closed: 0 };
      entry.count += 1;
      entry.industrias.add(c.industria);
      if (c.cierre) entry.closed += 1;
      counts.set(caso, entry);
    }
  }

  const data = [...counts.entries()]
    .map(([caso, v]) => ({
      caso,
      count: v.count,
      industrias: [...v.industrias].join(", "),
      tasaCierre: v.count ? Math.round((v.closed / v.count) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Casos de uso emergentes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.caso} className="flex flex-col gap-1 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.caso}</span>
              <Badge tone="primary">{row.count} veces</Badge>
            </div>
            <span className="text-xs text-muted-foreground">Industrias: {row.industrias}</span>
            <span className="text-xs text-primary">{row.tasaCierre}% de cierre</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin casos de uso emergentes detectados.</p>}
      </CardContent>
    </Card>
  );
}
