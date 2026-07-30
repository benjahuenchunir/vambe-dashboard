import type { ClientAnalysis, OportunidadRecuperacion } from "../types";
import { pct, round1 } from "./helpers";

export function computeVendedorPerformance(clients: ClientAnalysis[]) {
  const porVendedor = new Map<string, { total: number; cerrados: number; readinessSum: number }>();
  for (const c of clients) {
    const entry = porVendedor.get(c.vendedor) ?? { total: 0, cerrados: 0, readinessSum: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    entry.readinessSum += c.vambeReadinessScore ?? 0;
    porVendedor.set(c.vendedor, entry);
  }
  return [...porVendedor.entries()]
    .map(([vendedor, v]) => ({
      vendedor,
      tasaCierre: pct(v.cerrados, v.total),
      dealsTotales: v.total,
      readinessPromedio: v.total ? round1(v.readinessSum / v.total) : 0,
    }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre);
}

export function computeOportunidadesRecuperacion(
  clients: ClientAnalysis[],
): OportunidadRecuperacion[] {
  return clients
    .filter((c) => !c.cierre && (c.vambeReadinessScore ?? 60) > 60)
    .map((c) => {
      let motivo: string;

      if (c.dolorExplicito) {
        motivo =
          "Presenta dolor explícito y alta probabilidad de conversión. Conviene hacer seguimiento.";
      } else if (c.urgencia === "Alta") {
        motivo =
          "Manifestó una necesidad urgente y mantiene una alta probabilidad de conversión.";
      } else if (c.objecionesPrincipales?.length) {
        motivo =
          "Solo queda resolver su principal objeción para reactivar la oportunidad.";
      } else {
        motivo =
          "Alta probabilidad de conversión. Vale la pena volver a contactar al cliente.";
      }

      return {
        clienteId: c.id,
        nombreCliente: c.nombreCliente,
        telefono: c.telefono,
        correo: c.correo,
        vendedor: c.vendedor,
        readinessScore: c.vambeReadinessScore ?? 0,
        motivo,
        objecionPrincipal: c.objecionesPrincipales?.[0] ?? null,
        urgencia: c.urgencia,
      };
    })
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 8);
}