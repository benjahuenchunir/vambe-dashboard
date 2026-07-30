import type { ClientAnalysis } from "./types";
import { supabase } from "./supabase";
import { rowToClient, type ClientRow } from "./db-mapper";

const PAGE_SIZE = 1000;

export async function getClients(): Promise<ClientAnalysis[]> {
  const rows: ClientRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        created_at,
        csv_row_id,
        nombre_cliente,
        vendedor,
        fecha_reunion,
        cierre,
        industria,
        sector_b2b_b2c,
        tamano_empresa,
        decisor_identificado,
        volumen_consultas_mensual,
        canal_descubrimiento,
        tipo_canal,
        area_negocio_principal,
        area_negocio_detalle,
        canales_deseados,
        casos_uso_principales,
        integraciones_requeridas,
        dolor_explicito,
        urgencia,
        complejidad_tecnica,
        objeciones_principales,
        tono_deseado,
        requiere_regulacion_compleja,
        requiere_sistema_gestion_completo,
        vambe_readiness_score,
        casos_uso_nuevos,
        integraciones_nuevas,
        canales_no_soportados_solicitados,
        telefono,
        email
      `)
      .order("fecha_reunion", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Error leyendo clientes: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...(data as ClientRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows.map(rowToClient);
}
