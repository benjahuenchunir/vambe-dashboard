// ---------------------------------------------------------------------------
// Tipos base normalizados
// ---------------------------------------------------------------------------

export type TamanoNegocio = "Pequeña" | "Mediana" | "Grande";

export type SectorB2B = "B2B" | "B2C" | "B2B2C" | "B2G";

export type ComplejidadTecnica = "Baja" | "Media" | "Alta";

export type NivelUrgencia = "Alta" | "Media" | "Baja";

export type TipoCanal =
  | "Busqueda Organica"
  | "Organico Social"
  | "Marketing de Contenidos"
  | "Eventos y Webinars"
  | "Outbound / Contacto Directo"
  | "Referido"
  | "Publicidad Paga"
  | "Medios / Prensa"
  | "Otro";

export type AreaNegocioPrincipal =
  | "Ecommerce"
  | "Agendamiento"
  | "Venta Consultiva"
  | "Atencion al Cliente"
  | "Otro";

// ---------------------------------------------------------------------------
// Entidad principal
// ---------------------------------------------------------------------------

export interface ClientAnalysis {
  id: string;
  nombreCliente: string;
  telefono: string;
  correo: string;
  vendedor: string;
  fechaReunion: string;
  cierre: boolean;

  // perfil_cliente
  industria: string | null;
  sectorB2bB2c: SectorB2B | null;
  tamanoNegocio: TamanoNegocio | null;
  decisorIdentificado: string | null;
  volumenConsultasMensual: number | null;
  canalDescubrimiento: string | null;
  tipoCanal: TipoCanal | null;

  // necesidades_y_casos_uso
  areaNegocioPrincipal: AreaNegocioPrincipal | null;
  areaNegocioDetalle: string | null;
  canalesDeseados: string[];
  casosUsoPrincipales: string[];
  integracionesRequeridas: string[];

  // intencion_compra
  dolorExplicito: boolean | null;
  urgencia: NivelUrgencia | null;
  complejidadTecnica: ComplejidadTecnica | null;
  objecionesPrincipales: string[];
  tonoDeseado: string | null;
  requiereRegulacionCompleja: boolean | null;
  requiereSistemaGestionCompleto: boolean | null;

  // Derivado en Python (scoring.py)
  vambeReadinessScore: number | null;
  canalesNoSoportados: string[];
  casosUsoNuevos: string[];
  integracionesNuevas: string[];

  // Raw LLM response for auditing / recalculation
  rawExtraction: unknown;
}

/** Filters applied from the dashboard segmentation bar. */
export interface ClientFilters {
  industria?: string | null;
  sectorB2bB2c?: SectorB2B | null;
  tamanoNegocio?: TamanoNegocio | null;
  complejidadTecnica?: ComplejidadTecnica | null;
  urgencia?: NivelUrgencia | null;
  vendedor?: string;
  tipoCanal?: TipoCanal | null;
  areaNegocioPrincipal?: AreaNegocioPrincipal;
  dolorExplicito?: boolean | null;
  cierre?: boolean;
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
  fuente: string | null;
  tasaCierre: number;
  volumenLeads: number;
  ejemplos: string[];
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
  tamano: TamanoNegocio | null;
  tasaCierre: number;
  total: number;
}

export interface CierrePorDecisor {
  perfil: string | null;
  tasaCierre: number;
  total: number;
}

export interface ImpactoBinario {
  tasaCierreCon: number;
  tasaCierreSin: number;
  totalCon: number;
  totalSin: number;
}

export interface CalidadReunion {
  porTamanoNegocio: CierrePorTamano[];
  porPerfilDecisor: CierrePorDecisor[];
  porTipoComprador: { tipo: string | null; tasaCierre: number; total: number }[];
  impactoDolorExplicito: ImpactoBinario;
  impactoRegulacionCompleja: ImpactoBinario;
  impactoSistemaCompleto: ImpactoBinario;
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
  frecuencia: number;
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
  urgencia: NivelUrgencia | null;
}

export interface OportunidadRecuperacion {
  clienteId: string;
  nombreCliente: string;
  telefono: string;
  correo: string;
  vendedor: string;
  motivo: string;
  readinessScore: number;
  objecionPrincipal: string | null;
  urgencia: NivelUrgencia | null;
}

export interface VendedorPerformance {
  vendedor: string;
  tasaCierre: number;
  dealsTotales: number;
  readinessPromedio: number;
}

export interface IndustriaNoExplotada {
  industria: string;
  totalCasos: number;
  cerrados: number;
  tasaCierre: number;
  lift: number; // pp respecto al promedio general — negativo = por debajo
  volumenPromedio: number;
  readinessPromedio: number;
  diagnostico: string;
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

  topIntegraciones: TopIntegracion[];
  topCasosUso: TopCasoUso[];
  canalesDemanda: CanalDemanda[];
  objecionesFrecuentes: ObjecionFrecuente[];
  demandaNoCubierta: DemandaNoCubierta;

  oportunidadesRecuperacion: OportunidadRecuperacion[];
  vendedorPerformance: VendedorPerformance[];
}

export interface PipelineStatus {
  running: boolean;
  stopRequested: boolean;
  totalGlobal: number;
  totalCsv: number;
  totalBatch: number;
  processed: number;
  succeeded: number;
  failed: number;
  error: string | null;
}

export interface TendenciaMensual {
  mes: string; // "2024-01"
  mesLabel: string; // "Ene 2024", para el eje del gráfico
  totalLeads: number;
  cerrados: number;
  tasaCierre: number;
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
