import type { ClientAnalysis, ClientFilters } from "./types";

// Valores "vacíos" del LLM que necesitan una etiqueta amigable en vez del
// string crudo del enum, y que siempre deberían aparecer al final del
// dropdown en vez de mezclarse alfabéticamente con valores reales.
const FRIENDLY_LABELS: Record<string, string> = {
  no_inferible: "No especificado",
  no_mencionado: "No mencionado",
  Otro: "Otro",
};

export function friendlyLabel(value: string): string {
  return FRIENDLY_LABELS[value] ?? value;
}

function uniqueSorted(values: string[]): string[] {
  const set = [...new Set(values)];
  const normales = set.filter((v) => !(v in FRIENDLY_LABELS)).sort();
  const especiales = set.filter((v) => v in FRIENDLY_LABELS).sort();
  return [...normales, ...especiales];
}

export function applyFilters(clients: ClientAnalysis[], filters: ClientFilters): ClientAnalysis[] {
  return clients.filter((c) => {
    if (filters.industria && c.industria !== filters.industria) return false;
    if (filters.sectorB2bB2c && c.sectorB2bB2c !== filters.sectorB2bB2c) return false;
    if (filters.tamanoNegocio && c.tamanoNegocio !== filters.tamanoNegocio) return false;
    if (filters.complejidadTecnica && c.complejidadTecnica !== filters.complejidadTecnica) return false;
    if (filters.urgencia && c.urgencia !== filters.urgencia) return false;
    if (filters.vendedor && c.vendedor !== filters.vendedor) return false;
    if (filters.tipoCanal && c.tipoCanal !== filters.tipoCanal) return false;
    if (filters.areaNegocioPrincipal && c.areaNegocioPrincipal !== filters.areaNegocioPrincipal) return false;
    if (filters.dolorExplicito != null && c.dolorExplicito !== filters.dolorExplicito) return false;
    if (filters.cierre != null && c.cierre !== filters.cierre) return false;
    return true;
  });
}

export function searchClients(clients: ClientAnalysis[], query: string): ClientAnalysis[] {
  if (!query.trim()) return clients;
  const q = query.toLowerCase();
  return clients.filter(
    (c) =>
      c.casosUsoPrincipales.some((v) => v.toLowerCase().includes(q)) ||
      c.integracionesRequeridas.some((v) => v.toLowerCase().includes(q)) ||
      c.objecionesPrincipales.some((v) => v.toLowerCase().includes(q)) ||
      c.canalDescubrimiento.toLowerCase().includes(q) ||
      c.nombreCliente.toLowerCase().includes(q)
  );
}

export function getFilterOptions(clients: ClientAnalysis[]) {
  return {
    industrias: uniqueSorted(clients.map((c) => c.industria)),
    sectores: uniqueSorted(clients.map((c) => c.sectorB2bB2c)),
    tamanos: uniqueSorted(clients.map((c) => c.tamanoNegocio)),
    complejidades: uniqueSorted(clients.map((c) => c.complejidadTecnica)),
    urgencias: uniqueSorted(clients.map((c) => c.urgencia)),
    vendedores: uniqueSorted(clients.map((c) => c.vendedor)),
    tiposCanal: uniqueSorted(clients.map((c) => c.tipoCanal)),
    areas: uniqueSorted(clients.map((c) => c.areaNegocioPrincipal)),
  };
}