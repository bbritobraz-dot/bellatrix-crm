"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OPEN_ORDER_STATUSES, dayKey, dayLabel, toBusinessTimestamp } from "@/lib/finance/helpers";

// ==========================================
// CONFIGURAÇÕES DE TAXAS DE CARTÃO
// ==========================================

export async function getCardFeeSettings() {
  const supabase = await createAuthedClient();
  const { data } = await supabase.from("card_fee_settings").select("*").order("installments");
  return data || [];
}

export async function updateCardFeeSetting(installments: number, fee_percent: number) {
  const supabase = await createAuthedClient();
  const { error } = await supabase
    .from("card_fee_settings")
    .update({ fee_percent, updated_at: new Date().toISOString() })
    .eq("installments", installments);
  
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// CONTAS BANCÁRIAS
// ==========================================

export async function getBankAccounts() {
  const supabase = await createAuthedClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("bank_name");
  return data || [];
}

export async function createBankAccount(payload: { bank_name: string; account_label?: string; balance: number }) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.from("bank_accounts").insert([{ ...payload, updated_at: new Date().toISOString() }]);
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

export async function updateBankAccount(id: string, balance: number) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.from("bank_accounts").update({ balance, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) {
    // Conta com lançamentos vinculados não pode ser apagada (chave estrangeira)
    return { success: false, error: "Esta conta tem pagamentos ou despesas vinculados e não pode ser excluída." };
  }
  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// TRANSFERÊNCIAS ENTRE CONTAS
// ==========================================

export async function transferFunds(fromBankId: string, toBankId: string, amount: number) {
  const supabase = await createAuthedClient();

  if (!(amount > 0)) return { success: false, error: "Valor deve ser maior que zero." };
  if (fromBankId === toBankId) return { success: false, error: "Escolha contas diferentes." };

  // Uma única transação no banco: ou as duas contas mudam, ou nenhuma.
  const { error } = await supabase.rpc("transfer_bank_funds", {
    p_from: fromBankId,
    p_to: toBankId,
    p_amount: amount,
  });

  if (error) return { success: false, error: "Erro ao processar transferência: " + error.message };

  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// DADOS DO DASHBOARD FILTRADOS
// ==========================================

type DayBucket = {
  date: string;
  entradas: number;
  saidas: number;
  prevEntradas: number;
  prevSaidas: number;
  isForecast: boolean;
};

export async function getCashFlowData(period: "day" | "week" | "month" | "year" = "month") {
  const supabase = await createAuthedClient();

  // Início do período no fuso da empresa (o servidor costuma rodar em UTC)
  const todayKey = dayKey(new Date());
  const [ty, tm, td] = todayKey.split("-").map(Number);
  let startKey: string;
  if (period === "day") startKey = todayKey;
  else if (period === "week") {
    const d = new Date(Date.UTC(ty, tm - 1, td - 7));
    startKey = d.toISOString().slice(0, 10);
  } else if (period === "month") startKey = `${ty}-${String(tm).padStart(2, "0")}-01`;
  else startKey = `${ty}-01-01`;
  const startIso = new Date(`${startKey}T00:00:00-03:00`).toISOString();

  const [{ data: payments }, { data: paidExpenses }] = await Promise.all([
    supabase.from("payments").select("amount, payment_date").gte("payment_date", startIso),
    // Só despesas efetivamente pagas contam como saída realizada.
    // (Antes, despesas em aberto entravam aqui E na previsão: contadas duas vezes.)
    supabase
      .from("expenses")
      .select("amount, paid_amount, date, paid_date")
      .eq("is_paid", true)
      .or(`paid_date.gte.${startIso},and(paid_date.is.null,date.gte.${startIso})`),
  ]);

  const map: Record<string, DayBucket> = {};
  const bucket = (key: string) => {
    if (!map[key]) map[key] = { date: dayLabel(key), entradas: 0, saidas: 0, prevEntradas: 0, prevSaidas: 0, isForecast: false };
    return map[key];
  };

  (payments || []).forEach(p => {
    bucket(dayKey(p.payment_date)).entradas += Number(p.amount);
  });
  (paidExpenses || []).forEach(e => {
    bucket(dayKey(e.paid_date || e.date)).saidas += Number(e.paid_amount ?? e.amount);
  });

  const [{ data: futureReceivables }, { data: futureExpenses }, { data: futureSupplier }] = await Promise.all([
    supabase.from("quotes").select("total_sale_price, total_paid, payment_due_date").in("status", OPEN_ORDER_STATUSES).not("payment_due_date", "is", null),
    supabase.from("expenses").select("amount, due_date").eq("is_paid", false).not("due_date", "is", null),
    supabase.from("quotes").select("supplier_cost_total, supplier_paid, supplier_payment_deadline").in("status", OPEN_ORDER_STATUSES).not("supplier_payment_deadline", "is", null),
  ]);

  (futureReceivables || []).forEach(r => {
    const pending = Math.max(Number(r.total_sale_price) - Number(r.total_paid || 0), 0);
    if (pending <= 0) return;
    const b = bucket(dayKey(r.payment_due_date));
    b.prevEntradas += pending;
    b.isForecast = true;
  });
  (futureExpenses || []).forEach(e => {
    const b = bucket(dayKey(e.due_date));
    b.prevSaidas += Number(e.amount);
    b.isForecast = true;
  });
  (futureSupplier || []).forEach(q => {
    const pending = Math.max(Number(q.supplier_cost_total) - Number(q.supplier_paid || 0), 0);
    if (pending <= 0) return;
    const b = bucket(dayKey(q.supplier_payment_deadline));
    b.prevSaidas += pending;
    b.isForecast = true;
  });

  const { data: accounts } = await supabase.from("bank_accounts").select("balance");
  const totalBankBalance = (accounts || []).reduce((acc, b) => acc + Number(b.balance), 0);

  // Chaves YYYY-MM-DD ordenam corretamente como texto.
  const sortedKeys = Object.keys(map).sort();

  // Saldo previsto ACUMULADO: parte do saldo atual dos bancos e vai somando
  // as previsões dia a dia (antes cada dia ignorava os dias anteriores).
  // Valores previstos já vencidos entram no primeiro dia (hoje), pois ainda estão em aberto.
  let running = totalBankBalance;
  const chartData = sortedKeys.map(key => {
    const d = map[key];
    const net = d.prevEntradas - d.prevSaidas;
    let saldoPrevisto: number | null = null;
    if (key >= todayKey) {
      running += net;
      saldoPrevisto = running;
    } else {
      running += net; // pendência vencida ainda afeta o caixa futuro
    }
    return { ...d, saldo: d.entradas - d.saidas, saldoPrevisto };
  });

  const totalEntradas = (payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
  const totalSaidas = (paidExpenses || []).reduce((acc, e) => acc + Number(e.paid_amount ?? e.amount), 0);

  return { chartData, totalEntradas, totalSaidas, totalBankBalance, saldo: totalEntradas - totalSaidas };
}

export async function getCashFlowForecast(targetDate: string) {
  const supabase = await createAuthedClient();
  const targetIso = new Date(`${targetDate}T23:59:59-03:00`).toISOString();

  // Itens sem data de vencimento são tratados como "já devidos" e entram na projeção.
  const [{ data: receivables }, { data: payables }, { data: supplierQuotes }, { data: accounts }] = await Promise.all([
    supabase
      .from("quotes")
      .select("total_sale_price, total_paid")
      .in("status", OPEN_ORDER_STATUSES)
      .or(`payment_due_date.lte.${targetIso},payment_due_date.is.null`),
    supabase
      .from("expenses")
      .select("amount")
      .eq("is_paid", false)
      .or(`due_date.lte.${targetIso},due_date.is.null`),
    supabase
      .from("quotes")
      .select("supplier_cost_total, supplier_paid")
      .in("status", OPEN_ORDER_STATUSES)
      .or(`supplier_payment_deadline.lte.${targetIso},supplier_payment_deadline.is.null`),
    supabase.from("bank_accounts").select("balance"),
  ]);

  const currentBalance = (accounts || []).reduce((acc, b) => acc + Number(b.balance), 0);

  const totalAReceber = (receivables || []).reduce((acc, r) => acc + Math.max(Number(r.total_sale_price) - Number(r.total_paid || 0), 0), 0);
  const totalAPagar = (payables || []).reduce((acc, e) => acc + Number(e.amount), 0);
  const totalFornecedor = (supplierQuotes || []).reduce((acc, q) => acc + Math.max(Number(q.supplier_cost_total) - Number(q.supplier_paid || 0), 0), 0);

  return {
    totalAReceber,
    totalAPagar: totalAPagar + totalFornecedor,
    saldoPrevisto: currentBalance + totalAReceber - (totalAPagar + totalFornecedor)
  };
}

// ==========================================
// CATEGORIAS DE DESPESAS
// ==========================================

export async function getExpenseCategories() {
  const supabase = await createAuthedClient();
  const { data } = await supabase.from("expense_categories").select("*").order("name");
  return data || [];
}

export async function createExpenseCategory(name: string) {
  const supabase = await createAuthedClient();
  const { data, error } = await supabase.from("expense_categories").insert([{ name, is_custom: true }]).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true, data };
}

// ==========================================
// DESPESAS
// ==========================================

export async function getExpenses() {
  const supabase = await createAuthedClient();
  const { data } = await supabase.from("expenses").select("*, category:expense_categories(name), bank_account:bank_accounts(bank_name)").order("date", { ascending: false });
  return data || [];
}

export async function createExpense(payload: any) {
  const supabase = await createAuthedClient();
  // Uma única transação no banco: grava a despesa e debita a conta juntas
  const { data, error } = await supabase.rpc("create_paid_expense", {
    p_category: payload.category_id,
    p_description: payload.description,
    p_amount: Number(payload.amount),
    p_bank: payload.bank_account_id,
    p_method: payload.payment_method ?? null,
    p_date: toBusinessTimestamp(payload.date) ?? null,
    p_due_date: toBusinessTimestamp(payload.due_date) ?? null,
    p_notes: payload.notes ?? null,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true, id: data as string };
}

export async function deleteExpense(id: string) {
  const supabase = await createAuthedClient();
  // Devolve o valor pago à conta e, se for pagamento à fábrica, ajusta o pedido
  const { error } = await supabase.rpc("delete_expense", { p_id: id });
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// PAGAMENTOS (ENTRADAS)
// ==========================================

export async function getPayments() {
  const supabase = await createAuthedClient();
  const { data } = await supabase
    .from("payments")
    .select("*, quote:quotes(client:clients(name)), client:clients(name), bank_account:bank_accounts(bank_name)")
    .order("payment_date", { ascending: false });
  return data || [];
}

export async function registerPayment(payload: {
  quote_id?: string;
  client_id?: string;
  amount: number;
  payment_method: string;
  notes?: string;
  is_manual?: boolean;
  manual_description?: string;
  bank_account_id: string;
  installments?: number;
  payment_date?: string;
}) {
  const supabase = await createAuthedClient();

  // Tudo numa transação no banco: pagamento, taxa do cartão, saldo da conta e
  // total pago do pedido. Também bloqueia valor acima do saldo devedor.
  const { error } = await supabase.rpc("register_payment", {
    p_amount: Number(payload.amount),
    p_method: payload.payment_method,
    p_bank: payload.bank_account_id || null,
    p_quote_id: payload.quote_id || null,
    p_client_id: payload.client_id || null,
    p_notes: payload.notes || null,
    p_installments: payload.installments ?? null,
    p_is_manual: payload.is_manual ?? false,
    p_manual_description: payload.manual_description || null,
    p_payment_date: toBusinessTimestamp(payload.payment_date) ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/orcamentos");
  revalidatePath("/producao");
  return { success: true };
}

// ==========================================
// A RECEBER
// ==========================================

export async function getReceivables() {
  const supabase = await createAuthedClient();
  const { data } = await supabase.from("quotes").select("id, client_id, status, total_sale_price, total_paid, created_at, client:clients(name, phone)").in("status", ["em_producao", "pronto_para_instalacao", "finalizado"]).order("created_at", { ascending: false });
  return (data || []).map(q => ({ ...q, pending_amount: Math.max(Number(q.total_sale_price) - Number(q.total_paid || 0), 0) })).filter(q => q.pending_amount > 0);
}

export async function registerClientPayment(payload: any) {
  return registerPayment(payload);
}

// ==========================================
// A PAGAR
// ==========================================

export async function getPayables() {
  const supabase = await createAuthedClient();
  const { data: expenses } = await supabase.from("expenses").select("*, category:expense_categories(name)").order("due_date");
  const { data: quotes } = await supabase.from("quotes").select("id, status, supplier_cost_total, supplier_paid, supplier_payment_deadline, client:clients(name)").in("status", ["em_producao", "pronto_para_instalacao", "finalizado"]).gt("supplier_cost_total", 0);

  const supplierPayables = (quotes || []).map(q => {
    const client = Array.isArray(q.client) ? q.client[0] : q.client;
    return { id: q.id, type: "fornecedor", description: `Custo Fábrica - ${client?.name || "Cliente"}`, amount: Math.max(Number(q.supplier_cost_total) - Number(q.supplier_paid || 0), 0), due_date: q.supplier_payment_deadline, category: { name: "Custo de Produtos" } };
  }).filter(q => q.amount > 0);
  return { expenses: (expenses || []).map(e => ({ ...e, type: "despesa" })), supplierPayables };
}

export async function liquidateExpense(id: string, payload: any) {
  const supabase = await createAuthedClient();
  // Pagamento parcial mantém o restante em aberto; quitar duas vezes é bloqueado
  const { data, error } = await supabase.rpc("liquidate_expense", {
    p_id: id,
    p_amount: Number(payload.paid_amount),
    p_method: payload.paid_method,
    p_bank: payload.bank_account_id || null,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true, remaining: Number(data || 0) };
}

export async function liquidateSupplierPayment(quoteId: string, payload: any) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.rpc("pay_supplier", {
    p_quote_id: quoteId,
    p_amount: Number(payload.amount),
    p_method: payload.payment_method,
    p_bank: payload.bank_account_id || null,
    p_description: `Liquidação Fornecedor - Pedido ${quoteId.split('-')[0].toUpperCase()}`,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}
