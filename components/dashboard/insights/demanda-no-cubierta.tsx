import type { DemandaNoCubierta } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Lista({ title, items }: { title: string; items: { nombre: string; frecuencia: number }[] }) {
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

export function DemandaNoCubiertaCard({ data }: { data: DemandaNoCubierta }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demanda no cubierta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Lista title="Casos de uso nuevos" items={data.casosUsoNuevos} />
        <Lista title="Integraciones nuevas" items={data.integracionesNuevas} />
      </CardContent>
    </Card>
  );
}
