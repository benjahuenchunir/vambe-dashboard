import type { KpiSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

function KpiCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
          <span className="text-xs text-tertiary">{sub}</span>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <iconify-icon icon={icon} width="18" height="18" />
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis }: { kpis: KpiSummary }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        label="Tasa de cierre general"
        value={`${kpis.tasaCierre}%`}
        sub={`${kpis.dealsGanados} de ${kpis.dealsTotales} negocios cerrados`}
        icon="lucide:target"
      />
      <KpiCard
        label="Volumen de pipeline promedio"
        value={`${kpis.volumenPromedioMensual.toLocaleString("es-CL")}`}
        sub="Consultas/mes por cliente"
        icon="lucide:trending-up"
      />
      <KpiCard
        label="Readiness Score promedio"
        value={`${kpis.readinessPromedio} / 100`}
        sub="Afinidad con capacidades de Vambe"
        icon="lucide:gauge"
      />
    </section>
  );
}
