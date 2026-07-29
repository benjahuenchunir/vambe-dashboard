"use client";

import type { ClientAnalysis, ClientFilters } from "@/lib/types";
import { getFilterOptions } from "@/lib/filters";
import { Card } from "@/components/ui/card";

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

function ToggleSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  return (
    <select
      value={value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "true")}
      aria-label={label}
      className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">{label}</option>
      <option value="true">Sí</option>
      <option value="false">No</option>
    </select>
  );
}

export function FiltersBar({ clients, filters, onFiltersChange, query, onQueryChange }: FiltersBarProps) {
  const options = getFilterOptions(clients);

  function update<K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) {
    onFiltersChange({ ...filters, [key]: value || undefined });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined) || query.trim().length > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm">
          <iconify-icon icon="lucide:search" width="16" height="16" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar en casos de uso, integraciones u objeciones…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <Select
          label="Cierre"
          value={filters.cierre === undefined ? "" : String(filters.cierre)}
          options={["true", "false"]}
          onChange={(v) => update("cierre", (v === "" ? undefined : v === "true") as ClientFilters["cierre"])}
        />
        <Select label="Industria" value={filters.industria ?? ""} options={options.industrias} onChange={(v) => update("industria", v)} />
        <Select label="Área de negocio" value={filters.areaNegocioPrincipal ?? ""} options={options.areas} onChange={(v) => update("areaNegocioPrincipal", v)} />
        <Select label="Tamaño de empresa" value={filters.tamanoNegocio ?? ""} options={options.tamanos} onChange={(v) => update("tamanoNegocio", v)} />
        <Select label="Complejidad técnica" value={filters.complejidadTecnica ?? ""} options={options.complejidades} onChange={(v) => update("complejidadTecnica", v)} />
        <Select label="Vendedor" value={filters.vendedor ?? ""} options={options.vendedores} onChange={(v) => update("vendedor", v)} />
        <Select label="Canal de descubrimiento" value={filters.canalDescubrimiento ?? ""} options={options.fuentes} onChange={(v) => update("canalDescubrimiento", v)} />
        <ToggleSelect label="Dolor explícito" value={filters.dolorExplicito} onChange={(v) => update("dolorExplicito", v as ClientFilters["dolorExplicito"])} />

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
