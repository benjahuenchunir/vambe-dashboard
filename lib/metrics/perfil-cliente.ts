import type { ClientAnalysis, ReadinessBucket, ImpactoBinario } from "../types";
import { pct, quantileOf } from "./helpers";

const READINESS_BUCKETS = ["0-20", "21-40", "41-60", "61-80", "81-100"] as const;

function bucketFor(score: number): (typeof READINESS_BUCKETS)[number] {
  if (score <= 20) return "0-20";
  if (score <= 40) return "21-40";
  if (score <= 60) return "41-60";
  if (score <= 80) return "61-80";
  return "81-100";
}

export function computeReadinessDistribucion(clients: ClientAnalysis[]): ReadinessBucket[] {
  const buckets = new Map<string, { cerrados: number; perdidos: number }>();
  for (const rango of READINESS_BUCKETS) buckets.set(rango, { cerrados: 0, perdidos: 0 });

  for (const c of clients) {
    if (c.vambeReadinessScore == null) continue;
    const entry = buckets.get(bucketFor(c.vambeReadinessScore))!;
    if (c.cierre) entry.cerrados += 1;
    else entry.perdidos += 1;
  }

  return READINESS_BUCKETS.map((rango) => {
    const { cerrados, perdidos } = buckets.get(rango)!;
    const total = cerrados + perdidos;
    return { rango, cerrados, perdidos, total, tasaCierre: pct(cerrados, total) };
  });
}

/**
 * Cuartiles calculados sobre el propio dataset (no rangos fijos), porque el
 * volumen está muy concentrado en valores bajos con un par de outliers altos.
 */
export function computeVolumenBuckets(clients: ClientAnalysis[]) {
  const volumenes = clients
    .map((c) => c.volumenConsultasMensual)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);

  if (volumenes.length === 0) return [];

  const cortes = [volumenes[0], quantileOf(volumenes, 0.25), quantileOf(volumenes, 0.5), quantileOf(volumenes, 0.75), volumenes[volumenes.length - 1]];

  const buckets = [0, 1, 2, 3].map((i) => ({
    rango: `${cortes[i].toLocaleString("es-CL")}–${cortes[i + 1].toLocaleString("es-CL")}`,
    desde: cortes[i],
    cerrados: 0,
    perdidos: 0,
  }));

  for (const c of clients) {
    if (c.volumenConsultasMensual == null) continue;
    const bucket = [...buckets].reverse().find((b) => c.volumenConsultasMensual! >= b.desde) ?? buckets[0];
    if (c.cierre) bucket.cerrados += 1;
    else bucket.perdidos += 1;
  }

  return buckets.map(({ rango, cerrados, perdidos }) => ({
    rango,
    cerrados,
    perdidos,
    total: cerrados + perdidos,
    tasaCierre: pct(cerrados, cerrados + perdidos),
  }));
}

import type { CalidadReunion } from "../types";

type GroupRow<T> = { key: T; tasaCierre: number; total: number };

/**
 * Agrupa y calcula tasa de cierre por una key que puede venir null
 * (campo no determinado por el LLM). Ordena las categorías conocidas por
 * tasa de cierre desc; el bucket null ("sin datos") siempre va al final,
 * fuera del ranking — su % no es una señal comparable con una categoría real.
 */
function groupAndRank<T extends string | null>(
  clients: ClientAnalysis[],
  getKey: (c: ClientAnalysis) => T
): GroupRow<T>[] {
  const map = new Map<T, { total: number; cerrados: number }>();
  for (const c of clients) {
    const key = getKey(c);
    const entry = map.get(key) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    map.set(key, entry);
  }

  const known: GroupRow<T>[] = [];
  let sinDatos: GroupRow<T> | null = null;
  for (const [key, v] of map.entries()) {
    const row: GroupRow<T> = { key, tasaCierre: pct(v.cerrados, v.total), total: v.total };
    if (key === null) sinDatos = row;
    else known.push(row);
  }
  known.sort((a, b) => b.tasaCierre - a.tasaCierre);
  return sinDatos ? [...known, sinDatos] : known;
}

function computeImpactoBinario(clients: ClientAnalysis[], predicate: (c: ClientAnalysis) => boolean | null): ImpactoBinario {
  const con = clients.filter(predicate);
  const sin = clients.filter((c) => !predicate(c));
  return {
    tasaCierreCon: pct(con.filter((c) => c.cierre).length, con.length),
    tasaCierreSin: pct(sin.filter((c) => c.cierre).length, sin.length),
    totalCon: con.length,
    totalSin: sin.length,
  };
}

export function computeCalidadReunion(clients: ClientAnalysis[]): CalidadReunion {
  const porTamanoNegocio = groupAndRank(clients, (c) => c.tamanoNegocio).map((r) => ({
    tamano: r.key,
    tasaCierre: r.tasaCierre,
    total: r.total,
  }));

  const porPerfilDecisor = groupAndRank(clients, (c) => c.decisorIdentificado).map((r) => ({
    perfil: r.key,
    tasaCierre: r.tasaCierre,
    total: r.total,
  }));

  const porTipoComprador = groupAndRank(clients, (c) => c.sectorB2bB2c).map((r) => ({
    tipo: r.key,
    tasaCierre: r.tasaCierre,
    total: r.total,
  }));

  return {
    porTamanoNegocio,
    porPerfilDecisor,
    porTipoComprador,
    impactoDolorExplicito: computeImpactoBinario(clients, (c) => c.dolorExplicito),
    impactoRegulacionCompleja: computeImpactoBinario(clients, (c) => c.requiereRegulacionCompleja === true),
    impactoSistemaCompleto: computeImpactoBinario(clients, (c) => c.requiereSistemaGestionCompleto === true),
  };
}

export function computeImpactoDolorExplicito(clients: ClientAnalysis[]) {
  const conDolor = clients.filter((c) => c.dolorExplicito);
  const sinDolor = clients.filter((c) => !c.dolorExplicito);
  return {
    tasaCierreConDolor: pct(conDolor.filter((c) => c.cierre).length, conDolor.length),
    tasaCierreSinDolor: pct(sinDolor.filter((c) => c.cierre).length, sinDolor.length),
    totalConDolor: conDolor.length,
    totalSinDolor: sinDolor.length,
  };
}