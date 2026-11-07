import type { SupabaseClient } from "@supabase/supabase-js";

export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

/** Pedidos que já viraram venda e ainda podem ter valores a receber/pagar. */
export const OPEN_ORDER_STATUSES = ["em_producao", "pronto_para_instalacao", "finalizado"];

/**
 * Chave do dia (YYYY-MM-DD) no fuso da empresa.
 * Datas puras ("2026-11-05") são usadas como estão: `new Date("2026-11-05")`
 * vira meia-noite UTC e cairia no dia anterior em São Paulo.
 */
export function dayKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
  return parts; // en-CA já formata como YYYY-MM-DD
}

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

/** Soma (ou subtrai, com valor negativo) no saldo de forma atômica, direto no banco. */
export async function adjustBankBalance(
  supabase: SupabaseClient,
  accountId: string,
  delta: number
): Promise<string | null> {
  if (!accountId || !delta) return null;
  const { error } = await supabase.rpc("adjust_bank_balance", {
    p_account_id: accountId,
    p_delta: delta,
  });
  return error ? `Erro ao atualizar saldo: ${error.message}` : null;
}

/** Busca o id de uma categoria de despesa pelo nome, criando-a se ainda não existir. */
export async function getOrCreateExpenseCategoryId(
  supabase: SupabaseClient,
  name: string
): Promise<string | null> {
  const { data: existing } = await supabase.from("expense_categories").select("id").eq("name", name).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created } = await supabase
    .from("expense_categories")
    .insert({ name, is_custom: true })
    .select("id")
    .single();
  return created?.id ?? null;
}
