import type { ClientAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CanalesNoSoportadosProps {
  clients: ClientAnalysis[];
}

export function CanalesNoSoportados({ clients }: CanalesNoSoportadosProps) {
  const counts = new Map<string, { count: number; industrias: Set<string> }>();
  for (const c of clients) {
    for (const canal of c.canalesNoSoportados) {
      const entry = counts.get(canal) ?? { count: 0, industrias: new Set<string>() };
      entry.count += 1;
      entry.industrias.add(c.industria);
      counts.set(canal, entry);
    }
  }

  const data = [...counts.entries()]
    .map(([canal, v]) => ({ canal, count: v.count, industrias: [...v.industrias].join(", ") }))
    .sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canales no soportados solicitados</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.canal} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-foreground">{row.canal}</span>
              <span className="text-xs text-muted-foreground">{row.industrias}</span>
            </div>
            <Badge tone="destructive">{row.count} solicitudes</Badge>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Todos los canales solicitados están soportados por Vambe.</p>}
      </CardContent>
    </Card>
  );
}
