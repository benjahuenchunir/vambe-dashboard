import type { KpiSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

function KpiCard({
  label,
  value,
  sub,
  icon,
  info,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  info: { description: string; note: string };
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <InfoTooltip align="left" description={info.description} note={info.note} />
          </div>
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
        info={{
          description:
            "Porcentaje de reuniones categorizadas que terminaron en venta cerrada, sobre el total del pipeline actual.",
          note: "Es el número que resume si el pipeline está convirtiendo bien — el primer dato que cualquier líder de ventas mira.",
        }}
      />
      <KpiCard
        label="Volumen de pipeline promedio"
        value={`${kpis.volumenPromedioMensual.toLocaleString("es-CL")}`}
        sub="Consultas/mes por cliente"
        icon="lucide:trending-up"
        info={{
          description:
            "Promedio de consultas mensuales que cada cliente reportó en su reunión, estimado por el LLM a partir de la transcripción.",
          note: "Calibra si el pipeline tiene volumen suficiente para justificar Vambe. Ojo: es un promedio sobre datos con mucha dispersión, úsalo como referencia general, no como cifra exacta por cliente.",
        }}
      />
      <KpiCard
        label="Readiness Score promedio"
        value={`${kpis.readinessPromedio} / 100`}
        sub="Afinidad con capacidades de Vambe"
        icon="lucide:gauge"
        info={{
          description:
            "Promedio del puntaje de afinidad con Vambe (0-100) de todos los clientes filtrados, combinando volumen, urgencia, complejidad técnica y riesgos de implementación.",
          note: "Foto rápida de qué tan calificado está el pipeline en su conjunto — si baja, puede ser señal de que están entrando leads de menor calidad.",
        }}
      />
    </section>
  );
}