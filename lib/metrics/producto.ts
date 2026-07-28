import type { ClientAnalysis, CanalDemanda, EtiquetaFrecuencia, DemandaNoCubierta } from "../types";
import { pct } from "./helpers";

export function computeTopIntegraciones(clients: ClientAnalysis[]) {
  const integracionCount = new Map<string, { count: number; industrias: Map<string, number> }>();
  for (const c of clients) {
    for (const integ of c.integracionesRequeridas) {
      const entry = integracionCount.get(integ) ?? { count: 0, industrias: new Map() };
      entry.count += 1;
      entry.industrias.set(c.industria, (entry.industrias.get(c.industria) ?? 0) + 1);
      integracionCount.set(integ, entry);
    }
  }
  return [...integracionCount.entries()]
    .map(([nombre, v]) => ({
      nombre,
      porcentaje: pct(v.count, clients.length),
      industriaPrincipal: [...v.industrias.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 5);
}

export function computeTopCasosUso(clients: ClientAnalysis[]) {
  const casoUsoStats = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    for (const caso of c.casosUsoPrincipales) {
      const entry = casoUsoStats.get(caso) ?? { total: 0, cerrados: 0 };
      entry.total += 1;
      if (c.cierre) entry.cerrados += 1;
      casoUsoStats.set(caso, entry);
    }
  }
  return [...casoUsoStats.entries()]
    .map(([nombre, v]) => ({ nombre, tasaCierre: pct(v.cerrados, v.total) }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre)
    .slice(0, 5);
}

/** Combina demanda de canales soportados (canales_deseados, sin el catch-all "Otro")
 *  con pedidos de canales fuera de catálogo (canal_no_soportado_solicitado). */
export function computeCanalesDemanda(clients: ClientAnalysis[]): CanalDemanda[] {
  const counts = new Map<string, { count: number; soportado: boolean }>();

  for (const c of clients) {
    for (const canal of c.canalesDeseados) {
      if (canal === "Otro") continue;
      const entry = counts.get(canal) ?? { count: 0, soportado: true };
      entry.count += 1;
      counts.set(canal, entry);
    }
    for (const canal of c.canalNoSoportadoSolicitado) {
      const entry = counts.get(canal) ?? { count: 0, soportado: false };
      entry.count += 1;
      counts.set(canal, entry);
    }
  }

  return [...counts.entries()]
    .map(([canal, v]) => ({ canal, total: v.count, porcentaje: pct(v.count, clients.length), soportado: v.soportado }))
    .sort((a, b) => b.total - a.total);
}

export function computeObjecionesFrecuentes(clients: ClientAnalysis[]) {
  const objecionCount = new Map<string, number>();
  for (const c of clients) {
    for (const obj of c.objecionesPrincipales) {
      objecionCount.set(obj, (objecionCount.get(obj) ?? 0) + 1);
    }
  }
  return [...objecionCount.entries()]
    .map(([objecion, frecuencia]) => ({ objecion, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 5);
}

function topFrecuencias(values: string[], limit = 5): EtiquetaFrecuencia[] {
  const count = new Map<string, number>();
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1);
  return [...count.entries()]
    .map(([nombre, frecuencia]) => ({ nombre, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, limit);
}

function topCasosUsoNuevosConCierre(clients: ClientAnalysis[], limit = 5) {
  const stats = new Map<string, { frecuencia: number; cerrados: number }>();
  for (const c of clients) {
    for (const caso of c.casosUsoNuevos ?? []) {
      const entry = stats.get(caso) ?? { frecuencia: 0, cerrados: 0 };
      entry.frecuencia += 1;
      if (c.cierre) entry.cerrados += 1;
      stats.set(caso, entry);
    }
  }
  return [...stats.entries()]
    .map(([nombre, v]) => ({
      nombre,
      frecuencia: v.frecuencia,
      tasaCierre: v.frecuencia ? Math.round((v.cerrados / v.frecuencia) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, limit);
}

export function computeDemandaNoCubierta(clients: ClientAnalysis[]): DemandaNoCubierta {
  return {
    casosUsoNuevos: topCasosUsoNuevosConCierre(clients),
    integracionesNuevas: topFrecuencias(clients.flatMap((c) => c.integracionesNuevas ?? [])),
  };
}
