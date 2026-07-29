import type { VendedorPerformance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const MIN_SAMPLE = 3;

export function VendorPerformanceTable({ data }: { data: VendedorPerformance[] }) {
  const sorted = [...data].sort((a, b) => b.tasaCierre - a.tasaCierre);
  const hasLowSample = sorted.some((d) => d.dealsTotales < MIN_SAMPLE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempeño por vendedor</CardTitle>
        <InfoTooltip
          description="Tasa de cierre, cantidad de negocios y readiness promedio del pipeline de cada vendedor, ordenado de mayor a menor tasa de cierre."
          note="Base para 1:1s de coaching — quién convierte mejor y quién está trabajando leads de mayor potencial, no solo quién mueve más volumen."
        />
      </CardHeader>
      <CardContent>
        {sorted.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Vendedor</th>
                <th className="pb-2 text-right font-medium">Negocios</th>
                <th className="pb-2 text-right font-medium">Readiness prom.</th>
                <th className="pb-2 text-right font-medium">Tasa de cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row) => (
                <tr key={row.vendedor}>
                  <td className="py-2 text-foreground">
                    {row.vendedor}
                    {row.dealsTotales < MIN_SAMPLE && <span className="ml-1 text-muted-foreground">*</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{row.dealsTotales}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{row.readinessPromedio}/100</td>
                  <td className="py-2 text-right tabular-nums font-medium text-primary">{row.tasaCierre}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos para este filtro.</p>
        )}
        {hasLowSample && (
          <p className="mt-2 text-xs text-muted-foreground">
            * Muestra baja (menos de {MIN_SAMPLE} negocios) — tasa de cierre poco confiable.
          </p>
        )}
      </CardContent>
    </Card>
  );
}