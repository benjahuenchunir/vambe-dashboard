import type { ClientAnalysis, ClientFilters } from "./types";

export interface FilterFieldOptions {
  values: string[];
  hasNulls: boolean;
}

function fieldOptions(values: (string | null)[]): FilterFieldOptions {
  const nonNull = values.filter((v): v is string => v !== null);
  return {
    values: [...new Set(nonNull)].sort(),
    hasNulls: values.some((v) => v === null),
  };
}

function matches<T>(filterValue: T | null | undefined, actualValue: T | null): boolean {
  if (filterValue === undefined) return true;
  return actualValue === filterValue;
}

export function applyFilters(clients: ClientAnalysis[], filters: ClientFilters): ClientAnalysis[] {
  return clients.filter((c) => {
    if (!matches(filters.industria, c.industria)) return false;
    if (!matches(filters.sectorB2bB2c, c.sectorB2bB2c)) return false;
    if (!matches(filters.tamanoNegocio, c.tamanoNegocio)) return false;
    if (!matches(filters.complejidadTecnica, c.complejidadTecnica)) return false;
    if (!matches(filters.urgencia, c.urgencia)) return false;
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
      (c.canalDescubrimiento ?? "").toLowerCase().includes(q) ||
      (c.nombreCliente ?? "").toLowerCase().includes(q)
  );
}

export function getFilterOptions(clients: ClientAnalysis[]) {
  return {
    industrias: fieldOptions(clients.map((c) => c.industria)),
    sectores: fieldOptions(clients.map((c) => c.sectorB2bB2c)),
    tamanos: fieldOptions(clients.map((c) => c.tamanoNegocio)),
    complejidades: fieldOptions(clients.map((c) => c.complejidadTecnica)),
    urgencias: fieldOptions(clients.map((c) => c.urgencia)),
    vendedores: [...new Set(clients.map((c) => c.vendedor))].sort(),
    tiposCanal: fieldOptions(clients.map((c) => c.tipoCanal)),
    areas: [...new Set(clients.map((c) => c.areaNegocioPrincipal))].sort(),
  };
}