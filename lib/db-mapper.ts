// db_mapper.ts — Maps Supabase rows (snake_case) <-> Domain model (camelCase)

import type { ClientAnalysis } from "./types";

/** Exact shape of the Supabase `clients` table (see schema.sql). */
export interface ClientRow {
  id: string;
  created_at: string;
  csv_row_id: number;
  nombre_cliente: string;
  vendedor: string;
  fecha_reunion: string;
  cierre: boolean;

  // perfil_cliente
  industria: string;
  sector_b2b_b2c: ClientAnalysis["sectorB2bB2c"];
  tamano_empresa: ClientAnalysis["tamanoNegocio"];
  decisor_identificado: string;
  volumen_consultas_mensual: number | null;
  canal_descubrimiento: string;
  tipo_canal: string;

  // necesidades_y_casos_uso
  area_negocio_principal: string;
  area_negocio_detalle: string | null;
  canales_deseados: string[];
  casos_uso_principales: string[];
  integraciones_requeridas: string[];

  // intencion_compra
  dolor_explicito: boolean;
  urgencia: ClientAnalysis["urgencia"];
  complejidad_tecnica: ClientAnalysis["complejidadTecnica"];
  objeciones_principales: string[];
  tono_deseado: string | null;
  requiere_regulacion_compleja: boolean | null;
  requiere_sistema_gestion_completo: boolean | null;

  // Derivado en Python
  vambe_readiness_score: number | null;
  canales_no_soportados: string[];
  casos_uso_nuevos: string[];
  integraciones_nuevas: string[];
  raw_extraction: unknown;

  // Extra column added via ALTER TABLE
  canal_no_soportado_solicitado: string[];
}

/** Converts a DB row into the domain model used by the dashboard. */
export function rowToClient(row: ClientRow): ClientAnalysis {
  return {
    id: row.id,
    nombreCliente: row.nombre_cliente,
    vendedor: row.vendedor,
    fechaReunion: row.fecha_reunion,
    cierre: row.cierre,
    industria: row.industria,
    sectorB2bB2c: row.sector_b2b_b2c,
    tamanoNegocio: row.tamano_empresa,
    decisorIdentificado: row.decisor_identificado,
    volumenConsultasMensual: row.volumen_consultas_mensual,
    canalDescubrimiento: row.canal_descubrimiento,
    tipoCanal: row.tipo_canal,
    areaNegocioPrincipal: row.area_negocio_principal,
    areaNegocioDetalle: row.area_negocio_detalle,
    canalesDeseados: row.canales_deseados ?? [],
    casosUsoPrincipales: row.casos_uso_principales ?? [],
    integracionesRequeridas: row.integraciones_requeridas ?? [],
    dolorExplicito: row.dolor_explicito,
    urgencia: row.urgencia,
    complejidadTecnica: row.complejidad_tecnica,
    objecionesPrincipales: row.objeciones_principales ?? [],
    tonoDeseado: row.tono_deseado,
    requiereRegulacionCompleja: row.requiere_regulacion_compleja,
    requiereSistemaGestionCompleto: row.requiere_sistema_gestion_completo,
    vambeReadinessScore: row.vambe_readiness_score,
    canalesNoSoportados: row.canales_no_soportados ?? [],
    casosUsoNuevos: row.casos_uso_nuevos ?? [],
    integracionesNuevas: row.integraciones_nuevas ?? [],
    rawExtraction: row.raw_extraction,
    canalNoSoportadoSolicitado: row.canal_no_soportado_solicitado ?? [],
  };
}

/** Converts a domain model (without DB-generated fields) into a DB insert row. */
export function clientToInsertRow(
  client: Omit<ClientAnalysis, "id"> & { csvRowId: number }
): Omit<ClientRow, "id" | "created_at"> {
  return {
    csv_row_id: client.csvRowId,
    nombre_cliente: client.nombreCliente,
    vendedor: client.vendedor,
    fecha_reunion: client.fechaReunion,
    cierre: client.cierre,
    industria: client.industria,
    sector_b2b_b2c: client.sectorB2bB2c,
    tamano_empresa: client.tamanoNegocio,
    decisor_identificado: client.decisorIdentificado,
    volumen_consultas_mensual: client.volumenConsultasMensual,
    canal_descubrimiento: client.canalDescubrimiento,
    tipo_canal: client.tipoCanal,
    area_negocio_principal: client.areaNegocioPrincipal,
    area_negocio_detalle: client.areaNegocioDetalle,
    canales_deseados: client.canalesDeseados,
    casos_uso_principales: client.casosUsoPrincipales,
    integraciones_requeridas: client.integracionesRequeridas,
    dolor_explicito: client.dolorExplicito,
    urgencia: client.urgencia,
    complejidad_tecnica: client.complejidadTecnica,
    objeciones_principales: client.objecionesPrincipales,
    tono_deseado: client.tonoDeseado,
    requiere_regulacion_compleja: client.requiereRegulacionCompleja,
    requiere_sistema_gestion_completo: client.requiereSistemaGestionCompleto,
    vambe_readiness_score: client.vambeReadinessScore,
    canales_no_soportados: client.canalesNoSoportados,
    casos_uso_nuevos: client.casosUsoNuevos,
    integraciones_nuevas: client.integracionesNuevas,
    raw_extraction: client.rawExtraction,
    canal_no_soportado_solicitado: client.canalNoSoportadoSolicitado,
  };
}
