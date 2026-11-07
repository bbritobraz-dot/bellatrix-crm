/** Arredonda para centavos. Evita valores como 223,20000000000005 (erro de ponto flutuante). */
export function round2(value: number | string | null | undefined): number {
  const n = Number(value || 0);
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
