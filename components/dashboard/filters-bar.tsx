"use client";

import { useState, useEffect } from "react";
import type { ClientAnalysis, ClientFilters } from "@/lib/types";
import { getFilterOptions, type FilterFieldOptions } from "@/lib/filters";
import { Card } from "@/components/ui/card";

interface FiltersBarProps {
  clients: ClientAnalysis[];
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

const NULL_SENTINEL = "__null__";

function toSelectValue(v: string | null | undefined): string {
  if (v === undefined) return "";
  if (v === null) return NULL_SENTINEL;
  return v;
}

function fromSelectValue(v: string): string | null | undefined {
  if (v === "") return undefined;
  if (v === NULL_SENTINEL) return null;
  return v;
}

function NullableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  options: FilterFieldOptions;
  onChange: (value: string | null | undefined) => void;
}) {
  return (
    <div className="relative flex flex-col justify-center h-10 rounded-xl border border-border bg-card px-3 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <label className="text-[10px] font-semibold text-muted-foreground leading-none pt-1 -ml-1">
        {label}
      </label>
      <select
        value={toSelectValue(value)}
        onChange={(e) => onChange(fromSelectValue(e.target.value))}
        aria-label={label}
        className="bg-transparent focus:outline-none text-sm text-foreground cursor-pointer -ml-1 pb-1"
      >
        <option value="">Todos</option>
        {options.values.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        {options.hasNulls && <option value={NULL_SENTINEL}>Sin datos</option>}
      </select>
    </div>
  );
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
    <div className="relative flex flex-col justify-center h-10 rounded-xl border border-border bg-card px-3 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <label className="text-[10px] font-semibold text-muted-foreground leading-none pt-1 -ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="bg-transparent focus:outline-none text-sm text-foreground cursor-pointer -ml-1 pb-1"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
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
    <div className="relative flex flex-col justify-center h-10 rounded-xl border border-border bg-card px-3 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <label className="text-[10px] font-semibold text-muted-foreground leading-none pt-1 -ml-1">
        {label}
      </label>
      <select
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "true")}
        aria-label={label}
        className="bg-transparent focus:outline-none text-sm text-foreground cursor-pointer -ml-1 pb-1"
      >
        <option value="">Todos</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

export function FiltersBar({ clients, filters, onFiltersChange, query, onQueryChange }: FiltersBarProps) {
  const [showMore, setShowMore] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  const options = getFilterOptions(clients);

  // Sync internal search input if external query changes (e.g., cleared via reset button)
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Debounce query update by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        onQueryChange(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, query, onQueryChange]);

  function update<K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined) || localQuery.trim().length > 0;

  return (
    <Card>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input with Debounce */}
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <iconify-icon icon="lucide:search" width="16" height="16" />
            <input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Buscar en casos de uso, integraciones, objeciones, cliente…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => setLocalQuery("")}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <iconify-icon icon="lucide:x" width="14" height="14" />
              </button>
            )}
          </div>

          <Select
            label="Cierre"
            value={filters.cierre === undefined ? "" : String(filters.cierre)}
            options={["true", "false"]}
            onChange={(v) => update("cierre", (v === "" ? undefined : v === "true") as ClientFilters["cierre"])}
          />
          <NullableSelect label="Industria" value={filters.industria} options={options.industrias} onChange={(v) => update("industria", v)} />
          <Select label="Área de negocio" value={filters.areaNegocioPrincipal ?? ""} options={options.areas} onChange={(v) => update("areaNegocioPrincipal", v)} />

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <iconify-icon icon={showMore ? "lucide:chevron-up" : "lucide:sliders-horizontal"} width="14" height="14" />
            {showMore ? "Menos filtros" : "Más filtros"}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onFiltersChange({});
                setLocalQuery("");
                onQueryChange("");
              }}
              className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              <iconify-icon icon="lucide:x" width="14" height="14" />
              Limpiar filtros
            </button>
          )}
        </div>

        {showMore && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <NullableSelect label="Sector" value={filters.sectorB2bB2c} options={options.sectores} onChange={(v) => update("sectorB2bB2c", v as ClientFilters["sectorB2bB2c"])} />
            <NullableSelect label="Tamaño de empresa" value={filters.tamanoNegocio} options={options.tamanos} onChange={(v) => update("tamanoNegocio", v as ClientFilters["tamanoNegocio"])} />
            <NullableSelect label="Complejidad técnica" value={filters.complejidadTecnica} options={options.complejidades} onChange={(v) => update("complejidadTecnica", v as ClientFilters["complejidadTecnica"])} />
            <NullableSelect label="Urgencia" value={filters.urgencia} options={options.urgencias} onChange={(v) => update("urgencia", v as ClientFilters["urgencia"])} />
            <NullableSelect label="Tipo de canal" value={filters.tipoCanal} options={options.tiposCanal} onChange={(v) => update("tipoCanal", v as ClientFilters["tipoCanal"])} />
            <Select label="Vendedor" value={filters.vendedor ?? ""} options={options.vendedores} onChange={(v) => update("vendedor", v)} />
            <ToggleSelect label="Dolor explícito" value={filters.dolorExplicito} onChange={(v) => update("dolorExplicito", v as ClientFilters["dolorExplicito"])} />
          </div>
        )}
      </div>
    </Card>
  );
}