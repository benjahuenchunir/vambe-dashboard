"""
Mismo problema que en el pipeline de TS (ver lib/taxonomy.ts del dashboard):
el LLM no tiene un enum fijo para industria/canales/casos de uso, así que sin
ayuda escribe el mismo concepto de formas distintas entre filas.

Dos capas:
  1. Grounding en el prompt (`build_grounding_block`): se le muestra al modelo
     el vocabulario ya usado antes de categorizar la fila siguiente.
  2. Red de seguridad por similitud de texto (`reconcile_label`): colapsa
     variantes cercanas de una etiqueta que el modelo ya produjo.
"""

import difflib
import unicodedata
from dataclasses import dataclass, field

MATCH_THRESHOLD = 0.82


def _fold(s: str) -> str:
    normalized = unicodedata.normalize("NFD", s)
    without_accents = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    return " ".join(without_accents.lower().split())


def _similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, _fold(a), _fold(b)).ratio()


def reconcile_label(raw_label: str, existing: list[str]) -> str:
    cleaned = " ".join(raw_label.split())
    if not cleaned:
        return cleaned

    best_label, best_score = None, 0.0
    for candidate in existing:
        score = _similarity(cleaned, candidate)
        if score >= MATCH_THRESHOLD and score > best_score:
            best_label, best_score = candidate, score
    if best_label:
        return best_label

    return cleaned.title()


def reconcile_list(raw_labels: list[str], existing: list[str]) -> list[str]:
    pool = list(existing)
    result: list[str] = []
    for raw in raw_labels:
        reconciled = reconcile_label(raw, pool)
        if reconciled not in pool:
            pool.append(reconciled)
        if reconciled not in result:
            result.append(reconciled)
    return result


@dataclass
class ExistingTaxonomies:
    industria: list[str] = field(default_factory=list)
    canales_deseados: list[str] = field(default_factory=list)
    integraciones_requeridas: list[str] = field(default_factory=list)
    casos_uso_principales: list[str] = field(default_factory=list)


def build_grounding_block(t: ExistingTaxonomies) -> str:
    def section(label: str, values: list[str]) -> str:
        return f"{label}: {', '.join(values[:40])}" if values else f"{label}: (ninguna todavía)"

    return "\n".join(
        [
            "Categorías ya utilizadas en registros previos — reutiliza una si la transcripción calza,",
            "o crea una nueva corta y genérica si no calza:",
            section("industria", t.industria),
            section("casos_uso_principales", t.casos_uso_principales),
        ]
    )
