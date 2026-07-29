import type { CasoUsoNuevoConDetalle, EtiquetaFrecuencia } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function ListaCasosUso({ items }: { items: CasoUsoNuevoConDetalle[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">Casos de uso nuevos</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.nombre} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{item.nombre}</span>
            <div className="flex items-center gap-2">
              <Badge tone="default">{item.frecuencia}</Badge>
              <span className="tabular-nums text-xs text-primary">{item.tasaCierre}% cierre</span>
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
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.nombre} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{item.nombre}</span>
            <span className="tabular-nums text-primary">{item.frecuencia}</span>
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ListaCasosUso items={data.casosUsoNuevos} />
        <ListaSimple title="Integraciones nuevas" items={data.integracionesNuevas} />
      </CardContent>
    </Card>
  );
}
