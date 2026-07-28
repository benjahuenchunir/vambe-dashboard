import type { ClientAnalysis, ReadinessBucket, RiesgoImplementacion, TamanoNegocio } from "../types";
import { pct, avg, quantileOf } from "./helpers";

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

export function computeCalidadReunion(clients: ClientAnalysis[]): CalidadReunion {
  const porTamano = new Map<TamanoNegocio, { total: number; cerrados: number }>();
  for (const c of clients) {
    const entry = porTamano.get(c.tamanoNegocio) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porTamano.set(c.tamanoNegocio, entry);
  }
  const porTamanoNegocio = [...porTamano.entries()].map(([tamano, v]) => ({
    tamano,
    tasaCierre: pct(v.cerrados, v.total),
    total: v.total,
  }));

  const porDecisor = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    const entry = porDecisor.get(c.decisorIdentificado) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porDecisor.set(c.decisorIdentificado, entry);
  }
  const porPerfilDecisor = [...porDecisor.entries()]
    .map(([perfil, v]) => ({ perfil, tasaCierre: pct(v.cerrados, v.total), total: v.total }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre);

  return {
    porTamanoNegocio,
    porPerfilDecisor,
    impactoDolorExplicito: computeImpactoDolorExplicito(clients),
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

function tasaCierre(clients: ClientAnalysis[]): number {
  if (!clients.length) return 0;
  const cerrados = clients.filter((c) => c.cierre).length;
  return Math.round((cerrados / clients.length) * 1000) / 10;
}

export function computeRiesgoImplementacion(clients: ClientAnalysis[]): RiesgoImplementacion[] {
  const factores: { factor: string; get: (c: ClientAnalysis) => boolean | null | undefined }[] = [
    { factor: "Regulación compleja", get: (c) => c.requiereRegulacionCompleja },
    { factor: "Sistema de gestión completo", get: (c) => c.requiereSistemaGestionCompleto },
  ];

  return factores.map(({ factor, get }) => {
    // Solo se consideran filas donde el LLM sí pudo determinar el flag
    const conDato = clients.filter((c) => get(c) !== null && get(c) !== undefined);
    const conRiesgo = conDato.filter((c) => get(c) === true);
    const sinRiesgo = conDato.filter((c) => get(c) === false);

    return {
      factor,
      tasaCierreConRiesgo: tasaCierre(conRiesgo),
      tasaCierreSinRiesgo: tasaCierre(sinRiesgo),
      totalConRiesgo: conRiesgo.length,
      totalSinRiesgo: sinRiesgo.length,
    };
  });
}