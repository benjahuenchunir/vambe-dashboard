"use client";

import { useMemo, useState } from "react";
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
import { ReadinessVsCierre } from "./charts/readiness-vs-cierre";
import { AreaNegocioDistribution } from "./charts/area-negocio-distribution";
import { TopIntegrationsTable } from "./tables/top-integrations-table";
import { TopUseCasesTable } from "./tables/top-use-cases-table";
import { ChannelsByIndustryTable } from "./tables/channels-by-industry-table";
import { ObjectionAlerts } from "./insights/objection-alerts";
import { RoiAttribution } from "./insights/roi-attribution";
import { OportunidadesRecuperacion } from "./insights/oportunidades-recuperacion";
import { DealQualityInsights } from "./insights/deal-quality-insights";
import { TopObjections } from "./insights/top-objections";
import { VendorPerformanceTable } from "./tables/vendor-performance-table";
import { CanalesNoSoportados } from "./insights/canales-no-soportados";
import { CasosUsoNuevos } from "./insights/casos-uso-nuevos";
import { IndustriasNoExplotadas } from "./insights/industrias-no-explotadas";

interface DashboardProps {
  initialClients: ClientAnalysis[];
  initialStatus: ProcessingStatus;
}

export function Dashboard({ initialClients, initialStatus }: DashboardProps) {
  const [clients, setClients] = useState(initialClients);
  const [status, setStatus] = useState(initialStatus);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [query, setQuery] = useState("");

  const filteredClients = useMemo(
    () => searchClients(applyFilters(clients, filters), query),
    [clients, filters, query]
  );

  const metrics = useMemo(() => computeMetrics(filteredClients), [filteredClients]);

  async function handleProcessMore(batchSize: number) {
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchSize }),
    });
    const data = await res.json();
    if (data.newClients?.length) {
      setClients((prev) => [...prev, ...data.newClients]);
    }
    if (data.status) {
      setStatus(data.status);
    }
    return data;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Panel de Métricas de Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Categorización automática de reuniones de ventas y desempeño comercial de Vambe.
        </p>
      </header>

      <ProcessMorePanel status={status} onProcess={handleProcessMore} />

      <FiltersBar
        clients={clients}
        filters={filters}
        onFiltersChange={setFilters}
        query={query}
        onQueryChange={setQuery}
      />

      <KpiCards kpis={metrics.kpis} />

      {/* Row 1: Core charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CloseRateByVertical data={metrics.cierrePorVertical} />
        <PipelineByComplexity data={metrics.pipelinePorComplejidad} />
        <VolumeVsCloseRate data={metrics.volumenVsCierre} />
        <ReadinessDistribution data={metrics.readinessDistribucion} />
      </section>

      {/* Row 2: Strategic insights */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IndustriasNoExplotadas data={metrics.industriasNoExplotadas} />
        <ReadinessVsCierre clients={filteredClients} />
      </section>

      {/* Row 3: Business area + tables */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AreaNegocioDistribution clients={filteredClients} />
        <TopIntegrationsTable data={metrics.topIntegraciones} />
        <TopUseCasesTable data={metrics.topCasosUso} />
      </section>

      {/* Row 4: Channels + alerts + recovery */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChannelsByIndustryTable data={metrics.canalesPorIndustria} />
        <ObjectionAlerts data={metrics.alertasObjeciones} />
        <OportunidadesRecuperacion data={metrics.oportunidadesRecuperacion} />
      </section>

      {/* Row 5: ROI + product intelligence */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RoiAttribution data={metrics.roiPorFuente} />
        <CanalesNoSoportados clients={filteredClients} />
        <CasosUsoNuevos clients={filteredClients} />
      </section>

      {/* Row 6: Performance + quality */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <VendorPerformanceTable data={metrics.vendedorPerformance} />
        <DealQualityInsights data={metrics.calidadReunion} />
        <TopObjections data={metrics.objecionesFrecuentes} />
      </section>
    </div>
  );
}
