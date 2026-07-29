import type { CalidadReunion } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DealQualityInsights({ data }: { data: CalidadReunion }) {
  const { impactoDolorExplicito } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calidad de la reunión</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Cierre por tamaño de negocio</p>
          <div className="flex flex-col gap-1">
            {data.porTamanoNegocio.map((row) => (
              <div key={row.tamano} className="flex items-center justify-between">
                <span className="text-foreground">{row.tamano}</span>
                <span className="tabular-nums text-primary">{row.tasaCierre}% ({row.total})</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Cierre por perfil del decisor</p>
          <div className="flex flex-col gap-1">
            {data.porPerfilDecisor.map((row) => (
              <div key={row.perfil} className="flex items-center justify-between">
                <span className="text-foreground">{row.perfil}</span>
                <span className="tabular-nums text-primary">{row.tasaCierre}% ({row.total})</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Impacto del dolor explícito</p>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Con dolor explícito ({impactoDolorExplicito.totalConDolor})</span>
            <span className="tabular-nums text-primary">{impactoDolorExplicito.tasaCierreConDolor}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Sin dolor explícito ({impactoDolorExplicito.totalSinDolor})</span>
            <span className="tabular-nums text-primary">{impactoDolorExplicito.tasaCierreSinDolor}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
