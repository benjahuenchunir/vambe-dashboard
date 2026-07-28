import type { ClientAnalysis, ClientFilters } from "./types";

export function applyFilters(clients: ClientAnalysis[], filters: ClientFilters): ClientAnalysis[] {
  return clients.filter((c) => {
    if (filters.industria && c.industria !== filters.industria) return false;
    if (filters.tamanoNegocio && c.tamanoNegocio !== filters.tamanoNegocio) return false;
    if (filters.complejidadTecnica && c.complejidadTecnica !== filters.complejidadTecnica) return false;
    if (filters.vendedor && c.vendedor !== filters.vendedor) return false;
    if (filters.canalDescubrimiento && c.canalDescubrimiento !== filters.canalDescubrimiento) return false;
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
      c.objecionesPrincipales.some((v) => v.toLowerCase().includes(q))
  );
}

export function getFilterOptions(clients: ClientAnalysis[]) {
  const unique = <T>(arr: T[]) => [...new Set(arr)].sort();
  return {
    industrias: unique(clients.map((c) => c.industria)),
    tamanos: unique(clients.map((c) => c.tamanoNegocio)),
    complejidades: unique(clients.map((c) => c.complejidadTecnica)),
    vendedores: unique(clients.map((c) => c.vendedor)),
    fuentes: unique(clients.map((c) => c.canalDescubrimiento)),
    areas: unique(clients.map((c) => c.areaNegocioPrincipal)),
  };
}
