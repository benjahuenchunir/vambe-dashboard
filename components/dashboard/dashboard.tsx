"use client";

import { useCallback, useMemo, useState } from "react";
import type { ClientAnalysis, ClientFilters, ProcessingStatus } from "@/lib/types";
import { computeMetrics } from "@/lib/metrics";
import { applyFilters, searchClients } from "@/lib/filters";

import { KpiCards } from "./kpi-cards";
import { FiltersBar } from "./filters-bar";
import { ProcessMorePanel } from "./process-more-panel";
import { CloseRateByVertical } from "./charts/close-rate-by-vertical";
import { PipelineByComplexity } from "./charts/pipeline-by-complexity";
import { VolumeVsCloseRate } from "./charts/volume-vs-close-rate";
import { ReadinessDistribution } from "./charts/readiness-distribution";
import { AreaNegocioDistribution } from "./charts/area-negocio-distribution";
import { TopIntegrationsTable } from "./tables/top-integrations-table";
import { TopUseCasesTable } from "./tables/top-use-cases-table";
import { RoiAttribution } from "./insights/roi-attribution";
import { OportunidadesRecuperacion } from "./insights/oportunidades-recuperacion";
import { DealQualityInsights } from "./insights/deal-quality-insights";
import { TopObjections } from "./insights/top-objections";
import { VendorPerformanceTable } from "./tables/vendor-performance-table";
import { IndustriasNoExplotadas } from "./insights/industrias-no-explotadas";
import { ChannelDemandChart } from "./charts/channel-demand-chart";
import { TendenciaTemporalChart } from "./charts/tendencia-temporal-chart";
import { RiesgoImplementacionChart } from "./insights/riesgo-implementacion-chart";
import { DemandaNoCubiertaCard } from "./insights/demanda-no-cubierta";

interface DashboardProps {
  initialClients: ClientAnalysis[];
  initialStatus: ProcessingStatus;
}

export function Dashboard({ initialClients, initialStatus }: DashboardProps) {
  const [clients, setClients] = useState(initialClients);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [query, setQuery] = useState("");

  const filteredClients = useMemo(
    () => searchClients(applyFilters(clients, filters), query),
    [clients, filters, query]
  );

  const metrics = useMemo(() => computeMetrics(filteredClients), [filteredClients]);

  const refetchClients = useCallback(async () => {
    const res = await fetch("/api/clients", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setClients(data.clients ?? data);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Panel de Métricas de Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Categorización automática de reuniones de ventas y desempeño comercial de Vambe.
        </p>
      </header>

      <ProcessMorePanel onDataUpdated={refetchClients} />

      <FiltersBar
        clients={clients}
        filters={filters}
        onFiltersChange={setFilters}
        query={query}
        onQueryChange={setQuery}
      />

      <KpiCards kpis={metrics.kpis} />

      {/* Overview: tendencia primero, antes del breakdown por categoría */}
      <section className="grid grid-cols-1 gap-4">
        <TendenciaTemporalChart data={metrics.tendenciaTemporal} />
      </section>

      {/* Segmentación / salud del pipeline */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CloseRateByVertical data={metrics.cierrePorVertical} />
        <PipelineByComplexity data={metrics.pipelinePorComplejidad} />
        <VolumeVsCloseRate data={metrics.volumenBuckets} />
        <ReadinessDistribution data={metrics.readinessDistribucion} tasaCierreGeneral={metrics.kpis.tasaCierre} />
      </section>

      {/* Qué piden los clientes — necesidades ya conocidas */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AreaNegocioDistribution clients={filteredClients} />
        <TopIntegrationsTable data={metrics.topIntegraciones} />
        <TopUseCasesTable data={metrics.topCasosUso} />
      </section>

      {/* Qué piden los clientes — demanda no cubierta / estratégico */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChannelDemandChart data={metrics.canalesDemanda} />
        <DemandaNoCubiertaCard data={metrics.demandaNoCubierta} />
        <IndustriasNoExplotadas data={metrics.industriasNoExplotadas} />
      </section>

      {/* Acción de ventas — qué atender ahora */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OportunidadesRecuperacion data={metrics.oportunidadesRecuperacion} />
        <TopObjections data={metrics.objecionesFrecuentes} />
        <RiesgoImplementacionChart data={metrics.riesgoImplementacion} />
      </section>

      {/* Desempeño y atribución */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <VendorPerformanceTable data={metrics.vendedorPerformance} />
        <DealQualityInsights data={metrics.calidadReunion} />
        <RoiAttribution data={metrics.roiPorFuente} />
      </section>
    </div>
  );
}
