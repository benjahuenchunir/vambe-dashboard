import type { ClientAnalysis, DashboardMetrics } from "../types";
import {
  computeKpis,
  computeCierrePorVertical,
  computeIndustriasNoExplotadas,
  computePipelinePorComplejidad,
  computeRoiPorFuente,
  computeTendenciaTemporal,
} from "./pipeline";
import {
  computeReadinessDistribucion,
  computeVolumenBuckets,
  computeCalidadReunion,
  computeRiesgoImplementacion,
} from "./perfil-cliente";
import {
  computeTopIntegraciones,
  computeTopCasosUso,
  computeCanalesDemanda,
  computeObjecionesFrecuentes,
  computeDemandaNoCubierta,
} from "./producto";
import { computeVendedorPerformance, computeAlertasObjeciones, computeOportunidadesRecuperacion } from "./equipo";

export function computeMetrics(clients: ClientAnalysis[]): DashboardMetrics {
  return {
    kpis: computeKpis(clients),
    cierrePorVertical: computeCierrePorVertical(clients),
    industriasNoExplotadas: computeIndustriasNoExplotadas(clients),
    pipelinePorComplejidad: computePipelinePorComplejidad(clients),
    roiPorFuente: computeRoiPorFuente(clients),
    tendenciaTemporal: computeTendenciaTemporal(clients),

    readinessDistribucion: computeReadinessDistribucion(clients),
    volumenBuckets: computeVolumenBuckets(clients),
    calidadReunion: computeCalidadReunion(clients),
    riesgoImplementacion: computeRiesgoImplementacion(clients),

    topIntegraciones: computeTopIntegraciones(clients),
    topCasosUso: computeTopCasosUso(clients),
    canalesDemanda: computeCanalesDemanda(clients),
    objecionesFrecuentes: computeObjecionesFrecuentes(clients),
    demandaNoCubierta: computeDemandaNoCubierta(clients),

    vendedorPerformance: computeVendedorPerformance(clients),
    oportunidadesRecuperacion: computeOportunidadesRecuperacion(clients),
  };
}
export * from "./pipeline";
export * from "./perfil-cliente";
export * from "./producto";
export * from "./equipo";