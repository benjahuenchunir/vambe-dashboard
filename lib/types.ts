export type TamanoNegocio = "Pequeña" | "Mediana" | "Grande" | "no_inferible";
export type SectorB2B = "B2B" | "B2C" | "B2B2C" | "B2G" | "no_inferible";
export type ComplejidadTecnica = "Baja" | "Media" | "Alta" | "no_inferible";
export type NivelUrgencia = "Alta" | "Media" | "Baja" | "no_inferible";

export type TipoCanal =
  | "Busqueda Organica"
  | "Organico Social"
  | "Marketing de Contenidos"
  | "Eventos y Webinars"
  | "Outbound / Contacto Directo"
  | "Referido"
  | "Publicidad Paga"
  | "Medios / Prensa"
  | "Otro"
  | "no_mencionado";

export type AreaNegocioPrincipal =
  | "Ecommerce"
  | "Agendamiento"
  | "Venta Consultiva"
  | "Atencion al Cliente"
  | "Otro"
  | "no_inferible";

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
  tipoCanal: TipoCanal;

  // necesidades_y_casos_uso
  areaNegocioPrincipal: AreaNegocioPrincipal;
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
  areaNegocioPrincipal?: AreaNegocioPrincipal;
  dolorExplicito?: boolean;
  cierre?: boolean
}

// ---------------------------------------------------------------------------
// Dashboard aggregate types — Panel 1: Pipeline y Conversión
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

export interface RoiFuente {
  fuente: string; // tipo_canal (valores acotados)
  tasaCierre: number;
  volumenLeads: number;
  ejemplos: string[]; // ejemplos concretos de canal_descubrimiento
}

// ---------------------------------------------------------------------------
// Panel 2: Perfil del Cliente Ideal
// ---------------------------------------------------------------------------

export interface ReadinessBucket {
  rango: string;
  cerrados: number;
  perdidos: number;
  total: number;
  tasaCierre: number;
}

export interface VolumenBucket {
  rango: string;
  cerrados: number;
  perdidos: number;
  total: number;
  tasaCierre: number;
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

// ---------------------------------------------------------------------------
// Panel 3 / 4: Intención, Producto y Funcionalidades
// ---------------------------------------------------------------------------

export interface TopIntegracion {
  nombre: string;
  porcentaje: number;
  industriaPrincipal: string;
}

export interface TopCasoUso {
  nombre: string;
  tasaCierre: number;
}

export interface CanalDemanda {
  canal: string;
  total: number;
  porcentaje: number;
  soportado: boolean;
}

export interface ObjecionFrecuente {
  objecion: string;
  frecuencia: number;
}

// ---------------------------------------------------------------------------
// Alertas y acciones de equipo
// ---------------------------------------------------------------------------

export interface AlertaObjecion {
  clienteId: string;
  nombreCliente: string;
  vendedor: string;
  objecion: string;
  urgencia: NivelUrgencia;
}

export interface OportunidadRecuperacion {
  clienteId: string;
  nombreCliente: string;
  vendedor: string;
  motivo: string;
  readinessScore: number;
  objecionPrincipal: string | null;
  urgencia: string | null;
}

export interface VendedorPerformance {
  vendedor: string;
  tasaCierre: number;
  dealsTotales: number;
  readinessPromedio: number;
}

/** Aggregate shape returned by /api/metrics and recomputed client-side on filter changes. */
export interface DashboardMetrics {
  kpis: KpiSummary;
  cierrePorVertical: CierrePorVertical[];
  industriasNoExplotadas: IndustriaNoExplotada[];
  pipelinePorComplejidad: PipelinePorComplejidad[];
  roiPorFuente: RoiFuente[];
  tendenciaTemporal: TendenciaMensual[];

  readinessDistribucion: ReadinessBucket[];
  volumenBuckets: VolumenBucket[];
  calidadReunion: CalidadReunion;
  riesgoImplementacion: RiesgoImplementacion[];

  topIntegraciones: TopIntegracion[];
  topCasosUso: TopCasoUso[];
  canalesDemanda: CanalDemanda[];
  objecionesFrecuentes: ObjecionFrecuente[];
  demandaNoCubierta: DemandaNoCubierta;

  oportunidadesRecuperacion: OportunidadRecuperacion[];
  vendedorPerformance: VendedorPerformance[];
}

export interface ProcessingStatus {
  totalEnCsv: number;
  totalProcesados: number;
  totalPendientes: number;
}

export interface TendenciaMensual {
  mes: string; // "2024-01"
  mesLabel: string; // "Ene 2024", para el eje del gráfico
  totalLeads: number;
  cerrados: number;
  tasaCierre: number;
}
 
export interface RiesgoImplementacion {
  factor: string; // "Regulación compleja" | "Sistema de gestión completo"
  tasaCierreConRiesgo: number;
  tasaCierreSinRiesgo: number;
  totalConRiesgo: number;
  totalSinRiesgo: number;
}
 
export interface EtiquetaFrecuencia {
  nombre: string;
  frecuencia: number;
}

export interface CasoUsoNuevoConDetalle extends EtiquetaFrecuencia {
  tasaCierre: number;
}
 
export interface DemandaNoCubierta {
  casosUsoNuevos: CasoUsoNuevoConDetalle[];
  integracionesNuevas: EtiquetaFrecuencia[];
}

export interface ClientFiltersAddition {
  cierre?: boolean;
}
