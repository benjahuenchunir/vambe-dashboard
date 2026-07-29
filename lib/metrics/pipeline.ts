import type { ClientAnalysis, ComplejidadTecnica, TendenciaMensual } from "../types";
import { pct, avg } from "./helpers";

const TOP_VERTICALS = 8;
const MIN_CASOS_INDUSTRIA = 3;
const MAX_TASA_CIERRE_NO_EXPLOTADA = 40;

export function computeKpis(clients: ClientAnalysis[]) {
  const total = clients.length;
  const cerrados = clients.filter((c) => c.cierre);

  const volumenPromedio = total
    ? Math.round(clients.reduce((sum, c) => sum + (c.volumenConsultasMensual ?? 0), 0) / total)
    : 0;
  const readinessPromedio = avg(clients.map((c) => c.vambeReadinessScore ?? 0));

  return {
    tasaCierre: pct(cerrados.length, total),
    dealsGanados: cerrados.length,
    dealsTotales: total,
    volumenPromedioMensual: volumenPromedio,
    readinessPromedio,
  };
}

export function computeCierrePorVertical(clients: ClientAnalysis[]) {
  const porIndustria = new Map<string, { total: number; cerrados: number }>();
  for (const c of clients) {
    const entry = porIndustria.get(c.industria) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porIndustria.set(c.industria, entry);
  }

  const industriasOrdenadas = [...porIndustria.entries()]
    .map(([industria, v]) => ({ industria, tasaCierre: pct(v.cerrados, v.total), total: v.total }))
    .sort((a, b) => b.total - a.total);

  const topIndustrias = industriasOrdenadas.slice(0, TOP_VERTICALS);
  const resto = industriasOrdenadas.slice(TOP_VERTICALS);
  const restoTotal = resto.reduce((s, r) => s + r.total, 0);
  const restoCerrados = resto.reduce((s, r) => s + Math.round((r.tasaCierre / 100) * r.total), 0);

  return [
    ...topIndustrias,
    ...(restoTotal > 0
      ? [{ industria: `Otros (${resto.length} más)`, tasaCierre: pct(restoCerrados, restoTotal), total: restoTotal }]
      : []),
  ];
}

export function computeIndustriasNoExplotadas(clients: ClientAnalysis[]) {
  const porIndustria = new Map<string, ClientAnalysis[]>();
  for (const c of clients) {
    const lista = porIndustria.get(c.industria) ?? [];
    lista.push(c);
    porIndustria.set(c.industria, lista);
  }

  return [...porIndustria.entries()]
    .map(([industria, casos]) => {
      const cerrados = casos.filter((c) => c.cierre).length;
      const tasaCierre = pct(cerrados, casos.length);
      const volumenPromedio = avg(casos.map((c) => c.volumenConsultasMensual ?? 0));
      const readinessPromedio = avg(casos.map((c) => c.vambeReadinessScore ?? 0));
      return {
        industria,
        totalCasos: casos.length,
        cerrados,
        tasaCierre,
        volumenPromedio: Math.round(volumenPromedio),
        readinessPromedio,
        diagnostico: _diagnosticoIndustria(casos, tasaCierre, readinessPromedio),
      };
    })
    .filter((i) => i.totalCasos >= MIN_CASOS_INDUSTRIA && i.tasaCierre <= MAX_TASA_CIERRE_NO_EXPLOTADA)
    .sort((a, b) => b.volumenPromedio - a.volumenPromedio)
    .slice(0, 5);
}

function _diagnosticoIndustria(casos: ClientAnalysis[], tasaCierre: number, readinessProm: number): string {
  const conDolor = casos.filter((c) => c.dolorExplicito).length;
  const conRegulacion = casos.filter((c) => c.requiereRegulacionCompleja).length;
  const conSistemaGestion = casos.filter((c) => c.requiereSistemaGestionCompleto).length;
  const readinessBajo = casos.filter((c) => (c.vambeReadinessScore ?? 0) < 40).length;

  if (conRegulacion >= casos.length * 0.5) return "Barreras regulatorias limitan el cierre. Evaluar certificaciones o partnerships.";
  if (conSistemaGestion >= casos.length * 0.5) return "Requieren sistemas de gestión completos. Fuera del scope actual de Vambe.";
  if (readinessBajo >= casos.length * 0.5) return "Bajo readiness: funcionalidades pedidas no están en el roadmap de Vambe.";
  if (conDolor === 0) return "Sin dolor explícito detectado: leads exploratorios, necesitan más nurturing.";
  if (tasaCierre < 20 && readinessProm > 50) return "Alto readiness pero bajo cierre: revisar precio, proceso de venta o competencia.";
  return "Revisar pitch y objection handling para esta vertical.";
}

export function computePipelinePorComplejidad(clients: ClientAnalysis[]) {
  const porComplejidad = new Map<ComplejidadTecnica, number>();
  for (const c of clients) {
    porComplejidad.set(c.complejidadTecnica, (porComplejidad.get(c.complejidadTecnica) ?? 0) + 1);
  }
  return (["Baja", "Media", "Alta", "no_inferible"] as ComplejidadTecnica[]).map((complejidad) => ({
    complejidad,
    cantidad: porComplejidad.get(complejidad) ?? 0,
    porcentaje: pct(porComplejidad.get(complejidad) ?? 0, clients.length),
  }));
}

export function computeRoiPorFuente(clients: ClientAnalysis[]) {
  const porTipoCanal = new Map<string, { total: number; cerrados: number; ejemplos: Set<string> }>();
  for (const c of clients) {
    const entry = porTipoCanal.get(c.tipoCanal) ?? { total: 0, cerrados: 0, ejemplos: new Set<string>() };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    entry.ejemplos.add(c.canalDescubrimiento);
    porTipoCanal.set(c.tipoCanal, entry);
  }
  return [...porTipoCanal.entries()]
    .map(([fuente, v]) => ({
      fuente,
      tasaCierre: pct(v.cerrados, v.total),
      volumenLeads: v.total,
      ejemplos: [...v.ejemplos].slice(0, 5),
    }))
    .sort((a, b) => b.tasaCierre - a.tasaCierre);
}

const MESES_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function computeTendenciaTemporal(clients: ClientAnalysis[]): TendenciaMensual[] {
  const porMes = new Map<string, { total: number; cerrados: number }>();

  for (const c of clients) {
    const fecha = new Date(c.fechaReunion);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const entry = porMes.get(key) ?? { total: 0, cerrados: 0 };
    entry.total += 1;
    if (c.cierre) entry.cerrados += 1;
    porMes.set(key, entry);
  }

  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, { total, cerrados }]) => {
      const [year, month] = mes.split("-");
      return {
        mes,
        mesLabel: `${MESES_ES[Number(month) - 1]} ${year}`,
        totalLeads: total,
        cerrados,
        tasaCierre: total ? Math.round((cerrados / total) * 1000) / 10 : 0,
      };
    });
}