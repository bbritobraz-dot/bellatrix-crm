export { BUSINESS_TIME_ZONE, dayKey } from "@/lib/dates";

/** Pedidos que já viraram venda e ainda podem ter valores a receber/pagar. */
export const OPEN_ORDER_STATUSES = ["em_producao", "pronto_para_instalacao", "finalizado"];

/**
 * Converte uma data pura vinda de formulário ("2026-11-05") em timestamp ao meio-dia
 * de São Paulo, para não "voltar um dia" ao ser gravada como UTC.
 * Timestamps completos são mantidos como estão.
 */
export function toBusinessTimestamp(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00-03:00`;
  return value;
}

/** "2026-11-05" -> "05/11/2026" */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}
