// types.ts — Domain types aligned with the final SQL schema (clients table)

export type TamanoNegocio = "Pequeña" | "Mediana" | "Grande" | "no_inferible";
export type SectorB2B = "B2B" | "B2C" | "B2B2C" | "no_inferible";
export type ComplejidadTecnica = "Baja" | "Media" | "Alta" | "no_inferible";
export type NivelUrgencia = "Alta" | "Media" | "Baja" | "no_inferible";

/** Single client record as it lives in the dashboard / frontend. */
export interface ClientAnalysis {
  id: string;
  nombreCliente: string;
  vendedor: string;
  fechaReunion: string;
  cierre: boolean;

  // perfil_cliente
  industria: string;
  sectorB2bB2c: SectorB2B;
  tamanoNegocio: TamanoNegocio;
  decisorIdentificado: string;
  volumenConsultasMensual: number | null;
  canalDescubrimiento: string;
  tipoCanal: string;

  // necesidades_y_casos_uso
  areaNegocioPrincipal: string;
  areaNegocioDetalle: string | null;
  canalesDeseados: string[];
  casosUsoPrincipales: string[];
  integracionesRequeridas: string[];

  // intencion_compra
  dolorExplicito: boolean;
  urgencia: NivelUrgencia;
  complejidadTecnica: ComplejidadTecnica;
  objecionesPrincipales: string[];
  tonoDeseado: string | null;
  requiereRegulacionCompleja: boolean | null;
  requiereSistemaGestionCompleto: boolean | null;

  // Derivado en Python (scoring.py)
  vambeReadinessScore: number | null;
  canalesNoSoportados: string[];
  casosUsoNuevos: string[];
  integracionesNuevas: string[];
  canalNoSoportadoSolicitado: string[];

  // Raw LLM response for auditing / recalculation
  rawExtraction: unknown;
}

/** Filters applied from the dashboard segmentation bar. */
export interface ClientFilters {
  industria?: string;
  tamanoNegocio?: TamanoNegocio;
  complejidadTecnica?: ComplejidadTecnica;
  vendedor?: string;
  canalDescubrimiento?: string;
  areaNegocioPrincipal?: string;
  dolorExplicito?: boolean;
}

// ---------------------------------------------------------------------------
// Dashboard aggregate types
// ---------------------------------------------------------------------------

export interface KpiSummary {
  tasaCierre: number;
  dealsGanados: number;
  dealsTotales: number;
  volumenPromedioMensual: number;
  readinessPromedio: number;
}

export interface CierrePorVertical {
  industria: string;
  tasaCierre: number;
  total: number;
}

export interface IndustriaNoExplotada {
  industria: string;
  totalCasos: number;
  cerrados: number;
  tasaCierre: number;
  volumenPromedio: number;
  readinessPromedio: number;
  diagnostico: string;
}

export interface PipelinePorComplejidad {
  complejidad: ComplejidadTecnica;
  cantidad: number;
  porcentaje: number;
}

export interface VolumenVsCierrePoint {
  clienteId: string;
  nombreCliente: string;
  volumenMensual: number;
  cerrado: boolean;
}

export interface ReadinessBucket {
  rango: string;
  cerrados: number;
  perdidos: number;
}

export interface TopIntegracion {
  nombre: string;
  porcentaje: number;
  industriaPrincipal: string;
}

export interface TopCasoUso {
  nombre: string;
  tasaCierre: number;
}

export interface CanalPorIndustria {
  industria: string;
  canalPrincipal: string;
  porcentaje: number;
}

export interface AlertaObjecion {
  clienteId: string;
  nombreCliente: string;
  vendedor: string;
  objecion: string;
  urgencia: NivelUrgencia;
}

export interface RoiFuente {
  fuente: string; // tipo_canal (valores acotados)
  tasaCierre: number;
  volumenLeads: number;
  ejemplos: string[]; // ejemplos concretos de canal_descubrimiento
}

export interface OportunidadRecuperacion {
  clienteId: string;
  nombreCliente: string;
  readinessScore: number;
  motivo: string;
}

export interface VendedorPerformance {
  vendedor: string;
  tasaCierre: number;
  dealsTotales: number;
  readinessPromedio: number;
}

export interface CierrePorTamano {
  tamano: TamanoNegocio;
  tasaCierre: number;
  total: number;
}

export interface CierrePorDecisor {
  perfil: string;
  tasaCierre: number;
  total: number;
}

export interface ImpactoDolorExplicito {
  tasaCierreConDolor: number;
  tasaCierreSinDolor: number;
  totalConDolor: number;
  totalSinDolor: number;
}

export interface CalidadReunion {
  porTamanoNegocio: CierrePorTamano[];
  porPerfilDecisor: CierrePorDecisor[];
  impactoDolorExplicito: ImpactoDolorExplicito;
}

export interface ObjecionFrecuente {
  objecion: string;
  frecuencia: number;
}

/** Aggregate shape returned by /api/metrics and recomputed client-side on filter changes. */
export interface DashboardMetrics {
  kpis: KpiSummary;
  cierrePorVertical: CierrePorVertical[];
  industriasNoExplotadas: IndustriaNoExplotada[];
  pipelinePorComplejidad: PipelinePorComplejidad[];
  volumenVsCierre: VolumenVsCierrePoint[];
  readinessDistribucion: ReadinessBucket[];
  topIntegraciones: TopIntegracion[];
  topCasosUso: TopCasoUso[];
  canalesPorIndustria: CanalPorIndustria[];
  alertasObjeciones: AlertaObjecion[];
  roiPorFuente: RoiFuente[];
  oportunidadesRecuperacion: OportunidadRecuperacion[];
  vendedorPerformance: VendedorPerformance[];
  calidadReunion: CalidadReunion;
  objecionesFrecuentes: ObjecionFrecuente[];
}

export interface ProcessingStatus {
  totalEnCsv: number;
  totalProcesados: number;
  totalPendientes: number;
}
