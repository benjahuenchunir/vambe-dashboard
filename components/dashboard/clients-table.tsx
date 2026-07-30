"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { ClientAnalysis } from "@/lib/types";

const PAGE_SIZE = 25;

type ColumnDef = {
  key: keyof ClientAnalysis;
  label: string;
  width?: string;
  defaultVisible: boolean;
  important: boolean;
  format?: (value: unknown) => string;
};

const COLUMNS: ColumnDef[] = [
  { key: "nombreCliente", label: "Cliente", width: "min-w-[180px]", defaultVisible: true, important: true },
  { key: "correo", label: "Correo", width: "min-w-[220px]", defaultVisible: true, important: true },
  { key: "vendedor", label: "Vendedor", width: "min-w-[140px]", defaultVisible: true, important: true },
  { key: "fechaReunion", label: "Fecha reunión", width: "min-w-[140px]", defaultVisible: true, important: true, format: (v) => v ? new Date(v as string).toLocaleDateString("es-CL") : "—" },
  { key: "cierre", label: "Cierre", width: "w-[100px]", defaultVisible: true, important: true, format: (v) => v ? "Cerrado" : "Abierto" },
  { key: "industria", label: "Industria", width: "min-w-[150px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "sectorB2bB2c", label: "Sector", width: "w-[120px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "tamanoNegocio", label: "Tamaño", width: "w-[130px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "volumenConsultasMensual", label: "Vol. consultas/mes", width: "w-[150px]", defaultVisible: true, important: true, format: (v) => v == null ? "—" : String(v) },
  { key: "canalDescubrimiento", label: "Canal descubrimiento", width: "min-w-[170px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "tipoCanal", label: "Tipo canal", width: "min-w-[130px]", defaultVisible: false, important: false, format: (v) => (v as string) || "—" },
  { key: "areaNegocioPrincipal", label: "Área negocio", width: "min-w-[160px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "areaNegocioDetalle", label: "Detalle área", width: "min-w-[200px]", defaultVisible: false, important: false, format: (v) => (v as string) || "—" },
  { key: "canalesDeseados", label: "Canales deseados", width: "min-w-[220px]", defaultVisible: true, important: true, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "casosUsoPrincipales", label: "Casos de uso", width: "min-w-[220px]", defaultVisible: true, important: true, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "integracionesRequeridas", label: "Integraciones", width: "min-w-[220px]", defaultVisible: true, important: true, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "dolorExplicito", label: "Dolor explícito", width: "w-[130px]", defaultVisible: false, important: false, format: (v) => v == null ? "—" : v ? "Sí" : "No" },
  { key: "urgencia", label: "Urgencia", width: "w-[110px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "complejidadTecnica", label: "Complejidad", width: "w-[130px]", defaultVisible: true, important: true, format: (v) => (v as string) || "—" },
  { key: "objecionesPrincipales", label: "Objeciones", width: "min-w-[220px]", defaultVisible: false, important: false, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "tonoDeseado", label: "Tono", width: "min-w-[120px]", defaultVisible: false, important: false, format: (v) => (v as string) || "—" },
  { key: "requiereRegulacionCompleja", label: "Regulación compleja", width: "w-[160px]", defaultVisible: false, important: false, format: (v) => v == null ? "—" : v ? "Sí" : "No" },
  { key: "requiereSistemaGestionCompleto", label: "Sistema gestión completo", width: "w-[180px]", defaultVisible: false, important: false, format: (v) => v == null ? "—" : v ? "Sí" : "No" },
  { key: "vambeReadinessScore", label: "Readiness", width: "w-[110px]", defaultVisible: true, important: true, format: (v) => v == null ? "—" : String(v) },
  { key: "canalesNoSoportados", label: "Canales no soportados", width: "min-w-[220px]", defaultVisible: false, important: false, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "casosUsoNuevos", label: "Casos uso nuevos", width: "min-w-[200px]", defaultVisible: false, important: false, format: (v) => (v as string[])?.join(", ") || "—" },
  { key: "integracionesNuevas", label: "Integraciones nuevas", width: "min-w-[200px]", defaultVisible: false, important: false, format: (v) => (v as string[])?.join(", ") || "—" },
];

export function ClientsTable({ clients }: { clients: ClientAnalysis[] }) {
  const [page, setPage] = useState(1);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  );
  const [sortKey, setSortKey] = useState<keyof ClientAnalysis | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    if (!sortKey) return clients;
    return [...clients].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else if (typeof av === "boolean" && typeof bv === "boolean") cmp = Number(av) - Number(bv);
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clients, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleCols = COLUMNS.filter((c) => visibleKeys.has(c.key));

  const toggleSort = (key: keyof ClientAnalysis) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const exportCSV = () => {
    const headers = visibleCols.map((c) => c.label).join(",");
    const rows = sorted.map((row) =>
      visibleCols
        .map((c) => {
          const txt = c.format ? c.format(row[c.key]) : String(row[c.key] ?? "");
          return `"${txt.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-vambe-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{sorted.length}</span> registros
          {sorted.length !== clients.length && (
            <> <span className="text-muted-foreground">(filtrados de {clients.length})</span></>
          )}
        </p>
        <div className="flex items-center gap-2">
          <ColumnSelector visibleKeys={visibleKeys} onChange={setVisibleKeys} />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Table — sticky header + scrollable body */}
      <div className="overflow-auto rounded-xl border border-border bg-card shadow-sm max-h-[calc(100vh-240px)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className={`${col.width ?? ""} sticky top-0 z-10 bg-muted px-4 py-3 font-medium text-foreground whitespace-nowrap border-b border-border`}
                >
                  <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 cursor-pointer hover:text-primary">
                    {col.label}
                    {sortKey === col.key && <span className="text-primary">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="px-4 py-12 text-center text-muted-foreground">
                  No hay resultados para mostrar.
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
                  {visibleCols.map((col) => (
                    <td key={col.key} className={`${col.width ?? ""} px-4 py-2.5 text-foreground ${col.key === "nombreCliente" ? "font-medium" : ""}`}>
                      {col.format ? col.format(row[col.key]) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página <span className="font-medium text-foreground">{page}</span> de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function ColumnSelector({ visibleKeys, onChange }: { visibleKeys: Set<string>; onChange: (s: Set<string>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (key: string) => {
    const next = new Set(visibleKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const important = COLUMNS.filter((c) => c.important);
  const rest = COLUMNS.filter((c) => !c.important);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Columnas ({visibleKeys.size})
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Principales</div>
          <div className="mb-3 flex flex-col gap-1">
            {important.map((col) => (
              <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                <input type="checkbox" checked={visibleKeys.has(col.key)} onChange={() => toggle(col.key)} className="h-4 w-4 rounded border-border text-primary" />
                {col.label}
              </label>
            ))}
          </div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Adicionales</div>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {rest.map((col) => (
              <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                <input type="checkbox" checked={visibleKeys.has(col.key)} onChange={() => toggle(col.key)} className="h-4 w-4 rounded border-border text-primary" />
                {col.label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-border pt-2">
            <button onClick={() => onChange(new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)))} className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer">Restablecer</button>
            <button onClick={() => onChange(new Set(COLUMNS.map((c) => c.key)))} className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer">Todas</button>
          </div>
        </div>
      )}
    </div>
  );
}