"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { OPEN_ORDER_STATUSES, adjustBankBalance, dayKey, dayLabel, getOrCreateExpenseCategoryId, toBusinessTimestamp } from "@/lib/finance/helpers";

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
  await supabase.from("bank_accounts").delete().eq("id", id);
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
  const amount = Number(payload.amount);
  if (!(amount > 0)) return { success: false, error: "Valor deve ser maior que zero." };

  const date = toBusinessTimestamp(payload.date) || new Date().toISOString();
  const { error } = await supabase.from("expenses").insert([{
    ...payload,
    amount,
    date,
    due_date: toBusinessTimestamp(payload.due_date) ?? null,
    is_paid: true,
    paid_date: date,
    paid_amount: amount,
    paid_method: payload.payment_method,
  }]);
  if (error) return { success: false, error: error.message };

  const balanceError = await adjustBankBalance(supabase, payload.bank_account_id, -amount);
  if (balanceError) return { success: false, error: balanceError };

  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createAuthedClient();
  const { data: expense } = await supabase.from("expenses").select("amount, paid_amount, is_paid, bank_account_id").eq("id", id).single();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  if (expense?.is_paid && expense.bank_account_id) {
    // Devolve o que de fato saiu da conta (paid_amount), não o valor original da despesa
    const refund = Number(expense.paid_amount ?? expense.amount);
    const balanceError = await adjustBankBalance(supabase, expense.bank_account_id, refund);
    if (balanceError) return { success: false, error: balanceError };
  }
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
}) {
  const supabase = await createAuthedClient();
  const now = new Date().toISOString();

  let netAmount = Number(payload.amount);
  let cardFeeAmount = 0;
  let feePercent = 0;

  // 1. Buscar Taxa Dinâmica se for Cartão
  if ((payload.payment_method === 'Cartão de Crédito' && payload.installments) || payload.payment_method === 'Cartão de Débito') {
    const lookupInstallments = payload.payment_method === 'Cartão de Débito' ? 0 : payload.installments;
    
    const { data: feeSetting } = await supabase
      .from('card_fee_settings')
      .select('fee_percent')
      .eq('installments', lookupInstallments)
      .single();
    
    if (feeSetting) {
      feePercent = Number(feeSetting.fee_percent);
      cardFeeAmount = (Number(payload.amount) * feePercent) / 100;
      netAmount = Number(payload.amount) - cardFeeAmount;
    }
  }

  // 2. Inserir o pagamento
  const { error: paymentError } = await supabase
    .from("payments")
    .insert([{
      ...payload,
      notes: payload.payment_method === 'Cartão de Crédito' && payload.installments 
        ? `${payload.notes || ''} (Parcelado em ${payload.installments}x)`.trim() 
        : payload.notes
    }]);

  if (paymentError) return { success: false, error: paymentError.message };

  // 3. Registrar Taxa como Despesa
  if (cardFeeAmount > 0) {
    const { data: cat } = await supabase.from('expense_categories').select('id').eq('name', 'Taxas de Cartão').single();
    let categoryId = cat?.id;
    if (!categoryId) {
      const { data: newCat } = await supabase.from('expense_categories').insert({ name: 'Taxas de Cartão', is_custom: true }).select().single();
      categoryId = newCat?.id;
    }
    if (categoryId) {
      const isDebit = payload.payment_method === 'Cartão de Débito';
      await supabase.from('expenses').insert({
        category_id: categoryId,
        description: `Taxa de Cartão (${isDebit ? 'Débito' : 'Crédito'}) - Ref. ${payload.quote_id?.split('-')[0] || 'Manual'}`,
        amount: cardFeeAmount,
        date: now,
        is_paid: true,
        paid_date: now,
        paid_amount: cardFeeAmount,
        bank_account_id: payload.bank_account_id,
        notes: `Taxa de ${feePercent}% sobre R$ ${payload.amount} ${isDebit ? '(Débito)' : `(${payload.installments}x)`}`
      });
    }
  }

  // 4. Atualizar Saldo
  const balanceError = await adjustBankBalance(supabase, payload.bank_account_id, netAmount);
  if (balanceError) return { success: false, error: balanceError };

  // 5. Atualizar total_paid no orçamento
  if (payload.quote_id) {
    const { data: quote } = await supabase.from("quotes").select("total_paid").eq("id", payload.quote_id).single();
    if (quote) {
      await supabase.from("quotes").update({ total_paid: (Number(quote.total_paid) || 0) + Number(payload.amount) }).eq("id", payload.quote_id);
    }
  }

  revalidatePath("/financeiro");
  revalidatePath("/orcamentos");
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
  const paid = Number(payload.paid_amount);
  if (!(paid > 0)) return { success: false, error: "Valor deve ser maior que zero." };
  if (!payload.bank_account_id) return { success: false, error: "Selecione a conta bancária." };

  const { data: expense, error: fetchError } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (fetchError || !expense) return { success: false, error: "Despesa não encontrada." };
  // Evita debitar a conta duas vezes (ex.: duplo clique ou despesa já quitada)
  if (expense.is_paid) return { success: false, error: "Esta despesa já foi paga." };

  const now = new Date().toISOString();
  const total = Number(expense.amount);
  const remaining = Math.round((total - paid) * 100) / 100;

  if (remaining > 0) {
    // Pagamento parcial: registra a parte paga como uma despesa quitada
    // e mantém o restante em aberto no A Pagar (antes o restante sumia).
    const { error: partError } = await supabase.from("expenses").insert({
      category_id: expense.category_id,
      description: `${expense.description} (parcial)`,
      amount: paid,
      date: now,
      due_date: expense.due_date,
      payment_method: payload.paid_method,
      notes: expense.notes,
      is_paid: true,
      paid_date: now,
      paid_amount: paid,
      paid_method: payload.paid_method,
      bank_account_id: payload.bank_account_id,
    });
    if (partError) return { success: false, error: partError.message };

    const { error } = await supabase.from("expenses").update({ amount: remaining, updated_at: now }).eq("id", id).eq("is_paid", false);
    if (error) return { success: false, error: error.message };
  } else {
    const { data: updated, error } = await supabase
      .from("expenses")
      .update({ is_paid: true, paid_date: now, paid_amount: paid, paid_method: payload.paid_method, bank_account_id: payload.bank_account_id, updated_at: now })
      .eq("id", id)
      .eq("is_paid", false)
      .select("id");
    if (error) return { success: false, error: error.message };
    if (!updated || updated.length === 0) return { success: false, error: "Esta despesa já foi paga." };
  }

  const balanceError = await adjustBankBalance(supabase, payload.bank_account_id, -paid);
  if (balanceError) return { success: false, error: balanceError };

  revalidatePath("/financeiro");
  return { success: true, remaining: Math.max(remaining, 0) };
}

export async function liquidateSupplierPayment(quoteId: string, payload: any) {
  const supabase = await createAuthedClient();
  const { data: quote } = await supabase.from("quotes").select("supplier_paid, supplier_cost_total").eq("id", quoteId).single();
  if (!quote) return { success: false, error: "Pedido não encontrado" };
  const amount = Number(payload.amount);
  if (!(amount > 0)) return { success: false, error: "Valor deve ser maior que zero." };
  if (!payload.bank_account_id) return { success: false, error: "Selecione a conta bancária." };

  const { error } = await supabase.from("quotes").update({ supplier_paid: (Number(quote.supplier_paid) || 0) + amount }).eq("id", quoteId);
  if (error) return { success: false, error: error.message };

  const balanceError = await adjustBankBalance(supabase, payload.bank_account_id, -amount);
  if (balanceError) return { success: false, error: balanceError };

  // Registra a saída nas despesas (cria a categoria se não existir; antes o lançamento era perdido)
  const categoryId = await getOrCreateExpenseCategoryId(supabase, "Custo de Produtos");
  if (categoryId) {
    const now = new Date().toISOString();
    await supabase.from('expenses').insert({ category_id: categoryId, description: `Liquidação Fornecedor - Pedido ${quoteId.split('-')[0].toUpperCase()}`, amount, date: now, payment_method: payload.payment_method, is_paid: true, paid_date: now, paid_amount: amount, paid_method: payload.payment_method, bank_account_id: payload.bank_account_id });
  }
  revalidatePath("/financeiro");
  return { success: true };
}
