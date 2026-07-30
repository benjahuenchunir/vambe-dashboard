"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  /** Qué muestra la tarjeta — descripción objetiva del contenido/dato. */
  description: string;
  /** Tu comentario: por qué está en el dashboard, qué valor aporta o para qué sirve. */
  note: string;
  /** Alinea el popup respecto al botón — usa "left" si la tarjeta está pegada al borde derecho. */
  align?: "left" | "right";
}

/**
 * Ícono de "?" para poner en el CardHeader de cualquier tarjeta, junto al
 * CardTitle (CardHeader ya usa justify-between, así que basta con agregarlo
 * como hijo siguiente al título — no necesita wrapper extra).
 *
 * Uso:
 *   <CardHeader>
 *     <CardTitle>Tasa de cierre por vertical</CardTitle>
 *     <InfoTooltip
 *       description="Compara el % de negocios cerrados por industria."
 *       note="Le dice al equipo dónde enfocar esfuerzo comercial: qué verticales convierten mejor."
 *     />
 *   </CardHeader>
 *
 * Es a clic (no a hover) para que funcione igual en mobile y desktop, y para
 * que el contenido de varias líneas no se cierre solo al mover el mouse.
 */
export function InfoTooltip({ description, note, align = "right" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Información sobre esta tarjeta"
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
      >
        <iconify-icon icon="lucide:help-circle" width="16" height="16" />
      </button>

      {open && (
        <div
          role="dialog"
          className={`absolute top-full z-50 mt-2 w-72 rounded-[var(--radius-md)] border border-border bg-card p-3 shadow-theme ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex flex-col gap-2 text-xs">
            <div>
              <p className="mb-0.5 font-medium text-foreground">Qué muestra</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <div>
              <p className="mb-0.5 font-medium text-foreground">Por qué está acá</p>
              <p className="text-muted-foreground">{note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}