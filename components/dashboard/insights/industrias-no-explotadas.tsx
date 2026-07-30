import type { IndustriaNoExplotada } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface IndustriasNoExplotadasProps {
  data: IndustriaNoExplotada[];
  tasaCierreGeneral: number;
}

export function IndustriasNoExplotadas({ data, tasaCierreGeneral }: IndustriasNoExplotadasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industrias con menor conversión</CardTitle>
        <InfoTooltip
          description="Sectores donde la tasa de conversión real es significativamente inferior a la media general del pipeline, excluyendo muestras pequeñas para garantizar significancia estadística."
          note="Una baja conversión sostenida sugiere desalineación en precio, producto o pitch comercial. Conviene analizar los motivos de pérdida antes de priorizar inversión en estas verticales."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Tasa de cierre ≥ 10 puntos bajo el promedio ({tasaCierreGeneral}%), en sectores con muestra representativa
        </p>
        {data.map((row) => (
          <div key={row.industria} className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.industria}</span>
              <div className="flex items-center gap-2">
                <Badge tone="destructive">{row.tasaCierre}% cierre</Badge>
                <Badge tone="default">{row.totalCasos} casos</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="text-destructive">{row.lift}pp vs. promedio</span>
              <span>Vol. promedio: {row.volumenPromedio.toLocaleString("es-CL")}/mes</span>
              <span>Readiness: {row.readinessPromedio}/100</span>
            </div>
            <p className="text-xs text-tertiary">{row.diagnostico}</p>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ninguna industria está significativamente por debajo del promedio general ({tasaCierreGeneral}%) en este filtro — buena señal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}