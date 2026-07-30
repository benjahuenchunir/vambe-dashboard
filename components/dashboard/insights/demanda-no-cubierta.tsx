import type { CasoUsoNuevoConDetalle, EtiquetaFrecuencia } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";

function ListaCasosUso({ items }: { items: CasoUsoNuevoConDetalle[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Casos de uso nuevos</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.nombre} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{item.nombre}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="muted">n={item.frecuencia}</Badge>
              <span className="w-14 text-right tabular-nums text-xs font-medium text-primary">{item.tasaCierre}% cierre</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">Nada nuevo para este filtro.</p>}
      </div>
    </div>
  );
}

function ListaSimple({ title, items }: { title: string; items: EtiquetaFrecuencia[] }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.nombre} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground">{item.nombre}</span>
            <Badge tone="muted">n={item.frecuencia}</Badge>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">Nada nuevo para este filtro.</p>}
      </div>
    </div>
  );
}

export function DemandaNoCubiertaCard({
  data,
}: {
  data: { casosUsoNuevos: CasoUsoNuevoConDetalle[]; integracionesNuevas: EtiquetaFrecuencia[] };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demanda no cubierta</CardTitle>
        <InfoTooltip
          description="Casos de uso e integraciones solicitadas por prospectos que caen fuera de las capacidades actuales de Vambe, identificadas a partir de la transcripción de las reuniones."
          note="Representa la brecha de producto (feature gaps) del pipeline. Es un indicador clave para guiar la evolución del producto con demanda real y validada directamente por el mercado."
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ListaCasosUso items={data.casosUsoNuevos} />
        <ListaSimple title="Integraciones nuevas" items={data.integracionesNuevas} />
      </CardContent>
    </Card>
  );
}