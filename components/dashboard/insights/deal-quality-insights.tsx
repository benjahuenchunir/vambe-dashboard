import type { CalidadReunion, ImpactoBinario } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const MIN_SAMPLE = 3;

function Seccion({ title, rows }: { title: string; rows: { label: string | null; tasaCierre: number; total: number }[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const sinDatos = row.label === null;
          return (
            <div key={row.label ?? "__sin_datos__"} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className={sinDatos ? "text-muted-foreground italic" : "text-foreground"}>
                  {sinDatos ? "Sin datos" : row.label}
                  {!sinDatos && row.total < MIN_SAMPLE && <span className="ml-1 text-muted-foreground">*</span>}
                </span>
                <span className={`tabular-nums ${sinDatos ? "text-muted-foreground" : "text-primary"}`}>
                  {row.tasaCierre}% ({row.total})
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${sinDatos ? "bg-muted-foreground/40" : "bg-primary"}`}
                  style={{ width: `${row.tasaCierre}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function impactoRows(labelCon: string, labelSin: string, impacto: ImpactoBinario) {
  return [
    { label: labelCon, tasaCierre: impacto.tasaCierreCon, total: impacto.totalCon },
    { label: labelSin, tasaCierre: impacto.tasaCierreSin, total: impacto.totalSin },
  ];
}

export function DealQualityInsights({ data }: { data: CalidadReunion }) {
  const { impactoDolorExplicito, impactoRegulacionCompleja, impactoSistemaCompleto } = data;
  const hasLowSample = [...data.porTamanoNegocio, ...data.porPerfilDecisor, ...(data.porTipoComprador ?? [])].some(
    (r) => r.total < MIN_SAMPLE && r.tamano !== null && r.perfil !== null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calidad de la reunión</CardTitle>
        <InfoTooltip
          description="Cruza tasa de cierre con tamaño de negocio, perfil del decisor, tipo de comprador, dolor explícito y los dos factores de riesgo de implementación (regulación compleja, sistema de gestión completo)."
          note="Ayuda a calificar reuniones antes de invertir tiempo de seguimiento: qué características predicen mejor un cierre, más allá del readiness score general."
        />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <Seccion
          title="Cierre por tamaño de negocio"
          rows={data.porTamanoNegocio.map((r) => ({ label: r.tamano, tasaCierre: r.tasaCierre, total: r.total }))}
        />
        <Seccion
          title="Cierre por perfil del decisor"
          rows={data.porPerfilDecisor.map((r) => ({ label: r.perfil, tasaCierre: r.tasaCierre, total: r.total }))}
        />
        {data.porTipoComprador && (
          <Seccion
            title="Cierre por tipo de comprador"
            rows={data.porTipoComprador.map((r) => ({ label: r.tipo, tasaCierre: r.tasaCierre, total: r.total }))}
          />
        )}
        <Seccion
          title="Impacto del dolor explícito"
          rows={impactoRows("Con dolor explícito", "Sin dolor explícito", impactoDolorExplicito)}
        />
        <Seccion
          title="Impacto de regulación compleja"
          rows={impactoRows("Requiere regulación", "No requiere regulación", impactoRegulacionCompleja)}
        />
        {impactoSistemaCompleto.totalCon >= MIN_SAMPLE ? (
          <Seccion
            title="Impacto de sistema de gestión completo"
            rows={impactoRows("Requiere sistema completo", "No lo requiere", impactoSistemaCompleto)}
          />
        ) : (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Impacto de sistema de gestión completo</p>
            <p className="text-xs italic text-muted-foreground">
              Sin datos aún — ningún cliente fue marcado con este requerimiento (
              {impactoSistemaCompleto.totalCon + impactoSistemaCompleto.totalSin} negocios evaluados).
            </p>
          </div>
        )}
        {hasLowSample && (
          <p className="col-span-full text-xs text-muted-foreground">
            * Muestra baja (menos de {MIN_SAMPLE} negocios) — % poco confiable.
          </p>
        )}
      </CardContent>
    </Card>
  );
}