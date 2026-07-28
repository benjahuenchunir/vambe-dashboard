export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function pct(part: number, total: number): number {
  return total === 0 ? 0 : round1((part / total) * 100);
}

export function avg(arr: number[]): number {
  return arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

/** Valor del percentil `p` (0-1) de un arreglo YA ordenado ascendentemente. */
export function quantileOf(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}