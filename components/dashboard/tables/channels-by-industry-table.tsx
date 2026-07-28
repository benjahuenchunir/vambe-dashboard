import type { CanalPorIndustria } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChannelsByIndustryTable({ data }: { data: CanalPorIndustria[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Canal preferido por industria</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.industria} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{row.industria}</span>
            <span className="text-muted-foreground">
              {row.canalPrincipal} <span className="font-medium text-primary">({row.porcentaje}%)</span>
            </span>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>}
      </CardContent>
    </Card>
  );
}
