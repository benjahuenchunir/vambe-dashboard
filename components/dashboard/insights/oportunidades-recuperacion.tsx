import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { OportunidadRecuperacion } from "@/lib/types";

export function OportunidadesRecuperacion({ data }: { data: OportunidadRecuperacion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Oportunidades de recuperación</CardTitle>
        <InfoTooltip
          description="Negocios abiertos con readiness score alto (>60), ordenados de mayor a menor, con la objeción principal que los está frenando."
          note="Es la lista de a quién contactar hoy — junta 'vale la pena perseguirlo' con 'esto es lo que hay que resolverle', para que ventas no cruce dos reportes distintos."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.clienteId} className="flex flex-col gap-1 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{row.nombreCliente}</span>
              <Badge tone={row.readinessScore >= 80 ? "primary" : "default"}>{row.readinessScore}/100</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{row.motivo}</p>
            {row.objecionPrincipal && (
              <p className="rounded-lg bg-muted px-2 py-1 text-xs text-foreground">{row.objecionPrincipal}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-tertiary">Vendedor: {row.vendedor}</span>
              {(row.correo || row.telefono) && (
                <div className="flex items-center gap-2">
                  {row.correo && (
                    <a
                      href={`mailto:${row.correo}`}
                      title={row.correo}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <iconify-icon icon="lucide:mail" width="14" height="14" />
                    </a>
                  )}
                  {row.telefono && (
                    <a
                      href={`tel:${row.telefono}`}
                      title={row.telefono}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <iconify-icon icon="lucide:phone" width="14" height="14" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin casos por recuperar para este filtro.</p>
        )}
      </CardContent>
    </Card>
  );
}