// Datas no fuso da empresa. O servidor (Vercel) roda em UTC e o navegador
// pode estar em outro fuso; sem isso eventos à noite "pulam" de dia.
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

/** Dia no formato YYYY-MM-DD no fuso de São Paulo. Datas puras são mantidas. */
export function dayKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

/** Hora HH:MM no fuso de São Paulo. */
export function timeOfDay(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

/** Hoje (YYYY-MM-DD) em São Paulo. */
export function todayKey(): string {
  return dayKey(new Date());
}
