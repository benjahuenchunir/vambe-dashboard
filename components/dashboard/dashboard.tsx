"use client";

import { useCallback, useMemo, useState } from "react";
import type { ClientAnalysis, ClientFilters } from "@/lib/types";
import { computeMetrics } from "@/lib/metrics";
import { applyFilters, searchClients } from "@/lib/filters";

import { KpiCards } from "./kpi-cards";
import { FiltersBar } from "./filters-bar";
import { ProcessMorePanel } from "./process-more-panel";
import { ClientsTable } from "./clients-table";
import { CloseRateByVertical } from "./charts/close-rate-by-vertical";
import { PipelineByComplexity } from "./charts/pipeline-by-complexity";
import { VolumeVsCloseRate } from "./charts/volume-vs-close-rate";
import { ReadinessDistribution } from "./charts/readiness-distribution";
import { AreaNegocioDistribution } from "./charts/area-negocio-distribution";
import { TopIntegrationsTable } from "./tables/top-integrations-table";
import { TopUseCasesTable } from "./tables/top-use-cases-table";
import { CloseRateByDicoverSource } from "./insights/roi-attribution";
import { OportunidadesRecuperacion } from "./insights/oportunidades-recuperacion";
import { DealQualityInsights } from "./insights/deal-quality-insights";
import { TopObjections } from "./insights/top-objections";
import { VendorPerformanceTable } from "./tables/vendor-performance-table";
import { IndustriasNoExplotadas } from "./insights/industrias-no-explotadas";
import { ChannelDemandChart } from "./charts/channel-demand-chart";
import { TendenciaTemporalChart } from "./charts/tendencia-temporal-chart";
import { DemandaNoCubiertaCard } from "./insights/demanda-no-cubierta";

interface DashboardProps {
  initialClients: ClientAnalysis[];
}

export function Dashboard({ initialClients }: DashboardProps) {
  const [clients, setClients] = useState(initialClients);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"dashboard" | "table">("dashboard");

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

  const handleResetFilters = () => {
    setFilters({});
    setQuery("");
  };

  const hasResults = filteredClients.length > 0;

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

      {/* Toggle de vistas */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setView("dashboard")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              view === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              view === "table"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
              <path d="M8 6v12" />
              <path d="M16 6v12" />
            </svg>
            Tabla de clientes
          </button>
        </div>

        {view === "table" && (
          <span className="text-sm text-muted-foreground">
            {filteredClients.length} {filteredClients.length === 1 ? "registro" : "registros"} filtrados
          </span>
        )}
      </div>

      {!hasResults ? (
        <EmptyStateOnNoResults onReset={handleResetFilters} />
      ) : view === "table" ? (
        <ClientsTable clients={filteredClients} />
      ) : (
        <>
          <KpiCards kpis={metrics.kpis} />

          <section className="grid grid-cols-1 gap-4">
            <TendenciaTemporalChart data={metrics.tendenciaTemporal} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CloseRateByVertical data={metrics.cierrePorVertical} />
            <PipelineByComplexity data={metrics.pipelinePorComplejidad} />
            <VolumeVsCloseRate data={metrics.volumenBuckets} />
            <ReadinessDistribution data={metrics.readinessDistribucion} tasaCierreGeneral={metrics.kpis.tasaCierre} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AreaNegocioDistribution clients={filteredClients} />
            <TopIntegrationsTable data={metrics.topIntegraciones} />
            <TopUseCasesTable data={metrics.topCasosUso} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChannelDemandChart data={metrics.canalesDemanda} />
            <DemandaNoCubiertaCard data={metrics.demandaNoCubierta} />
            <IndustriasNoExplotadas data={metrics.industriasNoExplotadas} tasaCierreGeneral={metrics.kpis.tasaCierre} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <OportunidadesRecuperacion data={metrics.oportunidadesRecuperacion} />
            <TopObjections data={metrics.objecionesFrecuentes} />
            <VendorPerformanceTable data={metrics.vendedorPerformance} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DealQualityInsights data={metrics.calidadReunion} />
            <CloseRateByDicoverSource data={metrics.roiPorFuente} />
          </section>
        </>
      )}
    </div>
  );
}

function EmptyStateOnNoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-theme transition-all">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 13.6a3 3 0 1 0 3 3" />
          <path d="M22 22l-4.35-4.35" />
          <path d="M10 18H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.09" />
          <path d="M7 8h10" />
          <path d="M7 12h4" />
        </svg>
      </div>

      <h3 className="mt-5 text-xl font-semibold text-foreground">
        No hay datos que hagan match con esos filtros
      </h3>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No encontramos ningún cliente ni métrica disponible con el criterio o término buscado.
      </p>

      <button
        onClick={onReset}
        className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-98 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Limpiar filtros
      </button>
    </div>
  );
}