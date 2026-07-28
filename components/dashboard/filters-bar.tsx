"use client";

import type { ClientAnalysis, ClientFilters } from "@/lib/types";
import { getFilterOptions } from "@/lib/filters";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiSummary } from "@/lib/types";

interface FiltersBarProps {
  clients: ClientAnalysis[];
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export function FiltersBar({ clients, filters, onFiltersChange, query, onQueryChange }: FiltersBarProps) {
  const options = getFilterOptions(clients);

  function update<K extends keyof ClientFilters>(key: K, value: string) {
    onFiltersChange({ ...filters, [key]: value || undefined });
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || query.trim().length > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm">
          <iconify-icon icon="lucide:search" width="16" height="16" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar cliente o vendedor…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <Select label="Industria" value={filters.industria ?? ""} options={options.industrias} onChange={(v) => update("industria", v)} />
        <Select label="Tamaño de empresa" value={filters.tamanoNegocio ?? ""} options={options.tamanos} onChange={(v) => update("tamanoNegocio", v)} />
        <Select label="Complejidad técnica" value={filters.complejidadTecnica ?? ""} options={options.complejidades} onChange={(v) => update("complejidadTecnica", v)} />
        <Select label="Vendedor" value={filters.vendedor ?? ""} options={options.vendedores} onChange={(v) => update("vendedor", v)} />
        <Select label="Fuente de descubrimiento" value={filters.fuenteDescubrimiento ?? ""} options={options.fuentes} onChange={(v) => update("fuenteDescubrimiento", v)} />

        {hasActiveFilters && (
          <button
            onClick={() => {
              onFiltersChange({});
              onQueryChange("");
            }}
            className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm text-muted-foreground hover:text-destructive"
          >
            <iconify-icon icon="lucide:x" width="14" height="14" />
            Limpiar filtros
          </button>
        )}
      </div>
    </Card>
  );
}

function KpiCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
          <span className="text-xs text-tertiary">{sub}</span>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <iconify-icon icon={icon} width="18" height="18" />
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis }: { kpis: KpiSummary }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        label="Tasa de cierre general"
        value={`${kpis.tasaCierre}%`}
        sub={`${kpis.dealsGanados} de ${kpis.dealsTotales} negocios cerrados`}
        icon="lucide:target"
      />
      <KpiCard
        label="Volumen de pipeline promedio"
        value={`${kpis.volumenPromedioMensual.toLocaleString("es-CL")}`}
        sub="Consultas/mes por cliente"
        icon="lucide:trending-up"
      />
      <KpiCard
        label="Readiness Score promedio"
        value={`${kpis.readinessPromedio} / 100`}
        sub="Afinidad con capacidades de Vambe"
        icon="lucide:gauge"
      />
    </section>
  );
}
