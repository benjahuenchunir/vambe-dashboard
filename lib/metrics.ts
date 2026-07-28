// metrics.ts — Computes dashboard aggregates from a flat list of categorized clients.

import type {
  ClientAnalysis,
  DashboardMetrics,
  ComplejidadTecnica,
  TamanoNegocio,
} from "./types";

const READINESS_BUCKETS = ["0-20", "21-40", "41-60", "61-80", "81-100"] as const;
const TOP_VERTICALS = 8;
const MIN_CASOS_INDUSTRIA = 3;
const MAX_TASA_CIERRE_NO_EXPLOTADA = 40;

function bucketFor(score: number): (typeof READINESS_BUCKETS)[number] {
  if (score <= 20) return "0-20";
  if (score <= 40) return "21-40";
  if (score <= 60) return "41-60";
  if (score <= 80) return "61-80";
  return "81-100";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : round1((part / total) * 100);
}

function avg(arr: number[]): number {
  return arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

/**
 * Computes every dashboard aggregate from a flat list of categorized clients.
 */
export function computeMetrics(clients: ClientAnalysis[]): DashboardMetrics {
  const total = clients.length;
  const cerrados = clients.filter((c) => c.cierre);

  // --- KPIs -------------------------------------------------------------
  const volumenPromedio = total
    ? Math.round(
        clients.reduce((sum, c) => sum + (c.volumenConsultasMensual ?? 0), 0) / total
      )
    : 0;

  const readinessPromedio = total
    ? round1(
        clients.reduce((sum, c) => sum + (c.vambeReadinessScore ?? 0), 0) / total
      )
    : 0;

  const kpis = {
    tasaCierre: pct(cerrados.length, total),
    dealsGanados: cerrados.length,
    dealsTotales: total,
    volumenPromedioMensual: volumenPromedio,
    readinessPromedio,
  };

  // --- Close rate by vertical (TOP N + Otros) --------------------------
  const porIndustria = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    const entry = porIndustria.get(c.industria) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porIndustria.set(c.industria, entry);
  }

  const industriasOrdenadas = [...porIndustria.entries()]
    .map(([industria, v]) => ({
      industria,
      tasaCierre: pct(v.cerrados, v.total),
      total: v.total,
    }))
    .sort((a, b) => b.total - a.total); // por volumen de casos

  const topIndustrias = industriasOrdenadas.slice(0, TOP_VERTICALS);
  const resto = industriasOrdenadas.slice(TOP_VERTICALS);
  const restoTotal = resto.reduce((s, r) => s + r.total, 0);
  const restoCerrados = resto.reduce((s, r) => s + Math.round((r.tasaCierre / 100) * r.total), 0);

  const cierrePorVertical = [
    ...topIndustrias,
    ...(restoTotal > 0
      ? [{
          industria: `Otros (${resto.length} más)`,
          tasaCierre: pct(restoCerrados, restoTotal),
          total: restoTotal,
        }]
      : []),
  ];

  // --- Industrias no explotadas (alto volumen, bajo cierre) -------------
  const industriasNoExplotadas = [...porIndustria.entries()]
    .map(([industria, v]) => {
      const casos = clients.filter((c) => c.industria === industria);
      const tasa = pct(v.cerrados, v.total);
      const volPromedio = avg(casos.map((c) => c.volumenConsultasMensual ?? 0));
      const readinessProm = avg(casos.map((c) => c.vambeReadinessScore ?? 0));
      return {
        industria,
        totalCasos: v.total,
        cerrados: v.cerrados,
        tasaCierre: tasa,
        volumenPromedio: Math.round(volPromedio),
        readinessPromedio: readinessProm,
        diagnostico: _diagnosticoIndustria(casos, tasa, readinessProm),
      };
    })
    .filter(
      (i) =>
        i.totalCasos >= MIN_CASOS_INDUSTRIA &&
        i.tasaCierre <= MAX_TASA_CIERRE_NO_EXPLOTADA
    )
    .sort((a, b) => b.volumenPromedio - a.volumenPromedio)
    .slice(0, 5);

  // --- Pipeline by complexity ---------------------------------------------
  const porComplejidad = new Map<ComplejidadTecnica, number>();
  for (const c of clients) {
    porComplejidad.set(
      c.complejidadTecnica,
      (porComplejidad.get(c.complejidadTecnica) ?? 0) + 1
    );
  }
  const pipelinePorComplejidad = (
    ["Baja", "Media", "Alta", "no_inferible"] as ComplejidadTecnica[]
  ).map((complejidad) => ({
    complejidad,
    cantidad: porComplejidad.get(complejidad) ?? 0,
    porcentaje: pct(porComplejidad.get(complejidad) ?? 0, total),
  }));

  // --- Volume vs close rate (scatter) -----------------------------------
  const volumenVsCierre = clients.map((c) => ({
    clienteId: c.id,
    nombreCliente: c.nombreCliente,
    volumenMensual: c.volumenConsultasMensual ?? 0,
    cerrado: c.cierre,
  }));

  // --- Readiness distribution -------------------------------------------
  const buckets = new Map<string, { cerrados: number; perdidos: number }>();
  for (const rango of READINESS_BUCKETS) buckets.set(rango, { cerrados: 0, perdidos: 0 });

  for (const c of clients) {
    if (c.vambeReadinessScore == null) continue;
    const entry = buckets.get(bucketFor(c.vambeReadinessScore))!;
    if (c.cierre) entry.cerrados += 1;
    else entry.perdidos += 1;
  }
  const readinessDistribucion = READINESS_BUCKETS.map((rango) => ({
    rango,
    ...buckets.get(rango)!,
  }));

  // --- Top integrations ---------------------------------------------------
  const integracionCount = new Map<string, { count: number; industrias: Map<string, number> }>();
  for (const c of clients) {
    for (const integ of c.integracionesRequeridas) {
      const entry = integracionCount.get(integ) ?? { count: 0, industrias: new Map() };
      entry.count += 1;
      entry.industrias.set(c.industria, (entry.industrias.get(c.industria) ?? 0) + 1);
      integracionCount.set(integ, entry);
    }
  }
  const topIntegraciones = [...integracionCount.entries()]
    .map(([nombre, v]) => ({
      nombre,
      porcentaje: pct(v.count, total),
      industriaPrincipal: [...v.industrias.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 5);

  // --- Top use cases (paired with win rate) -------------------------------
  const casoUsoStats = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    for (const caso of c.casosUsoPrincipales) {
      const entry = casoUsoStats.get(caso) ?? { total: 0, cerrados: 0 };
      entry.total += 1;
      if (c.cierre) entry.cerrados += 1;
      casoUsoStats.set(caso, entry);
    }
  }
  const topCasosUso = [...casoUsoStats.entries()]
    .map(([nombre, v]) => ({ nombre, tasaCierre: pct(v.cerrados, v.total) }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre)
    .slice(0, 5);

  // --- Most requested channel per industry --------------------------------
  const canalPorIndustriaMap = new Map<string, Map<string, number>>();
  for (const c of clients) {
    const canales = canalPorIndustriaMap.get(c.industria) ?? new Map<string, number>();
    for (const canal of c.canalesDeseados) canales.set(canal, (canales.get(canal) ?? 0) + 1);
    canalPorIndustriaMap.set(c.industria, canales);
  }
  const canalesPorIndustria = [...canalPorIndustriaMap.entries()]
    .map(([industria, canales]) => {
      const [canalPrincipal, count] = [...canales.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];
      const totalIndustria = porIndustria.get(industria)?.total ?? 0;
      return { industria, canalPrincipal, porcentaje: pct(count, totalIndustria) };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);

  // --- Alerts: unresolved objections on open deals ------------------------
  const alertasObjeciones = clients
    .filter((c) => !c.cierre && c.objecionesPrincipales.length > 0)
    .map((c) => ({
      clienteId: c.id,
      nombreCliente: c.nombreCliente,
      vendedor: c.vendedor,
      objecion: c.objecionesPrincipales[0],
      urgencia: c.urgencia,
    }))
    .slice(0, 8);

  // --- ROI attribution by discovery source (tipo_canal) -------------------
  const porTipoCanal = new Map<string, { total: number; cerrados: number; ejemplos: Set<string> }>();
  for (const c of clients) {
    const tipo = c.tipoCanal;
    const entry = porTipoCanal.get(tipo) ?? { total: 0, cerrados: 0, ejemplos: new Set<string>() };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    entry.ejemplos.add(c.canalDescubrimiento);
    porTipoCanal.set(tipo, entry);
  }
  const roiPorFuente = [...porTipoCanal.entries()]
    .map(([fuente, v]) => ({
      fuente,
      tasaCierre: pct(v.cerrados, v.total),
      volumenLeads: v.total,
      ejemplos: [...v.ejemplos].slice(0, 5), // max 5 ejemplos concretos
    }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre);

  // --- Recovery opportunities: high-readiness leads that did NOT close ------
  const oportunidadesRecuperacion = clients
    .filter((c) => !c.cierre && (c.vambeReadinessScore ?? 0) > 60)
    .map((c) => ({
      clienteId: c.id,
      nombreCliente: c.nombreCliente,
      readinessScore: c.vambeReadinessScore ?? 0,
      motivo: c.dolorExplicito
        ? "Alto readiness + dolor explícito: requiere seguimiento urgente"
        : c.urgencia === "Alta"
          ? "Alto readiness + urgencia alta: oportunidad caliente"
          : "Alto readiness: potencial de recuperación con nurturing",
    }))
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 8);

  // --- Vendor (sales rep) performance ------------------------------------
  const porVendedor = new Map<string, { total: number; cerrados: number; readinessSum: number }>();
  for (const c of clients) {
    const entry = porVendedor.get(c.vendedor) ?? { total: 0, cerrados: 0, readinessSum: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    entry.readinessSum += c.vambeReadinessScore ?? 0;
    porVendedor.set(c.vendedor, entry);
  }
  const vendedorPerformance = [...porVendedor.entries()]
    .map(([vendedor, v]) => ({
      vendedor,
      tasaCierre: pct(v.cerrados, v.total),
      dealsTotales: v.total,
      readinessPromedio: v.total ? round1(v.readinessSum / v.total) : 0,
    }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre);

  // --- Meeting-quality signals -------------------------------------------
  const porTamano = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    const entry = porTamano.get(c.tamanoNegocio) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porTamano.set(c.tamanoNegocio, entry);
  }
  const porTamanoNegocio = [...porTamano.entries()].map(([tamano, v]) => ({
    tamano: tamano as TamanoNegocio,
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

  const conDolor = clients.filter((c) => c.dolorExplicito);
  const sinDolor = clients.filter((c) => !c.dolorExplicito);
  const impactoDolorExplicito = {
    tasaCierreConDolor: pct(conDolor.filter((c) => c.cierre).length, conDolor.length),
    tasaCierreSinDolor: pct(sinDolor.filter((c) => c.cierre).length, sinDolor.length),
    totalConDolor: conDolor.length,
    totalSinDolor: sinDolor.length,
  };

  // --- Objection frequency --------------------------------------------------
  const objecionCount = new Map<string, number>();
  for (const c of clients) {
    for (const obj of c.objecionesPrincipales) {
      objecionCount.set(obj, (objecionCount.get(obj) ?? 0) + 1);
    }
  }
  const objecionesFrecuentes = [...objecionCount.entries()]
    .map(([objecion, frecuencia]) => ({ objecion, frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 5);

  return {
    kpis,
    cierrePorVertical,
    industriasNoExplotadas,
    pipelinePorComplejidad,
    volumenVsCierre,
    readinessDistribucion,
    topIntegraciones,
    topCasosUso,
    canalesPorIndustria,
    alertasObjeciones,
    roiPorFuente,
    oportunidadesRecuperacion,
    vendedorPerformance,
    calidadReunion: { porTamanoNegocio, porPerfilDecisor, impactoDolorExplicito },
    objecionesFrecuentes,
  };
}

// Helper: genera un diagnóstico textual para industrias no explotadas
function _diagnosticoIndustria(
  casos: ClientAnalysis[],
  tasaCierre: number,
  readinessProm: number
): string {
  const conDolor = casos.filter((c) => c.dolorExplicito).length;
  const conRegulacion = casos.filter((c) => c.requiereRegulacionCompleja).length;
  const conSistemaGestion = casos.filter((c) => c.requiereSistemaGestionCompleto).length;
  const readinessBajo = casos.filter((c) => (c.vambeReadinessScore ?? 0) < 40).length;

  if (conRegulacion >= casos.length * 0.5) {
    return "Barreras regulatorias limitan el cierre. Evaluar certificaciones o partnerships.";
  }
  if (conSistemaGestion >= casos.length * 0.5) {
    return "Requieren sistemas de gestión completos. Fuera del scope actual de Vambe.";
  }
  if (readinessBajo >= casos.length * 0.5) {
    return "Bajo readiness: funcionalidades pedidas no están en el roadmap de Vambe.";
  }
  if (conDolor === 0) {
    return "Sin dolor explícito detectado: leads exploratorios, necesitan más nurturing.";
  }
  if (tasaCierre < 20 && readinessProm > 50) {
    return "Alto readiness pero bajo cierre: revisar precio, proceso de venta o competencia.";
  }
  return "Revisar pitch y objection handling para esta vertical.";
}
