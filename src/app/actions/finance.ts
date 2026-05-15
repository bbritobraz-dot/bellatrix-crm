"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// CONFIGURAÇÕES DE TAXAS DE CARTÃO
// ==========================================

export async function getCardFeeSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("card_fee_settings").select("*").order("installments");
  return data || [];
}

export async function updateCardFeeSetting(installments: number, fee_percent: number) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("bank_name");
  return data || [];
}

export async function createBankAccount(payload: { bank_name: string; account_label?: string; balance: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert([{ ...payload, updated_at: new Date().toISOString() }]);
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

export async function updateBankAccount(id: string, balance: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").update({ balance, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient();
  await supabase.from("bank_accounts").delete().eq("id", id);
  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// TRANSFERÊNCIAS ENTRE CONTAS
// ==========================================

export async function transferFunds(fromBankId: string, toBankId: string, amount: number) {
  const supabase = await createClient();

  if (amount <= 0) return { success: false, error: "Valor deve ser maior que zero." };

  const { data: accounts } = await supabase.from("bank_accounts").select("*").in("id", [fromBankId, toBankId]);
  if (!accounts || accounts.length !== 2) return { success: false, error: "Contas não encontradas." };

  const fromAccount = accounts.find(a => a.id === fromBankId);
  const toAccount = accounts.find(a => a.id === toBankId);
  if (!fromAccount || !toAccount) return { success: false, error: "Contas nao encontradas." };

  const { error: err1 } = await supabase.from("bank_accounts").update({ balance: Number(fromAccount.balance) - amount }).eq("id", fromBankId);
  const { error: err2 } = await supabase.from("bank_accounts").update({ balance: Number(toAccount.balance) + amount }).eq("id", toBankId);

  if (err1 || err2) return { success: false, error: "Erro ao processar transferência." };

  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// DADOS DO DASHBOARD FILTRADOS
// ==========================================

export async function getCashFlowData(period: "day" | "week" | "month" | "year" = "month") {
  const supabase = await createClient();
  const now = new Date();
  let startDate: Date;

  if (period === "day") startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === "week") { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
  else if (period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else startDate = new Date(now.getFullYear(), 0, 1);

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount, payment_date").gte("payment_date", startDate.toISOString()),
    supabase.from("expenses").select("amount, date, category_id").gte("date", startDate.toISOString()),
  ]);

  const map: Record<string, { date: string; entradas: number; saidas: number; prevEntradas: number; prevSaidas: number; isForecast: boolean }> = {};

  const addDay = (d: string) => {
    if (!map[d]) map[d] = { date: d, entradas: 0, saidas: 0, prevEntradas: 0, prevSaidas: 0, isForecast: false };
  };

  (payments || []).forEach(p => {
    const d = new Date(p.payment_date).toLocaleDateString("pt-BR");
    addDay(d); map[d].entradas += Number(p.amount);
  });
  (expenses || []).forEach(e => {
    const d = new Date(e.date || new Date()).toLocaleDateString("pt-BR");
    addDay(d); map[d].saidas += Number(e.amount);
  });

  const [{ data: futureReceivables }, { data: futureExpenses }, { data: futureSupplier }] = await Promise.all([
    supabase.from("quotes").select("total_sale_price, total_paid, payment_due_date").in("status", ["em_producao", "finalizado"]).not("payment_due_date", "is", null),
    supabase.from("expenses").select("amount, due_date").eq("is_paid", false).not("due_date", "is", null),
    supabase.from("quotes").select("supplier_cost_total, supplier_paid, supplier_payment_deadline").in("status", ["em_producao", "finalizado"]).not("supplier_payment_deadline", "is", null),
  ]);

  (futureReceivables || []).forEach(r => {
    const d = new Date(r.payment_due_date).toLocaleDateString("pt-BR");
    addDay(d);
    map[d].prevEntradas += Math.max(Number(r.total_sale_price) - Number(r.total_paid || 0), 0);
    map[d].isForecast = true;
  });
  (futureExpenses || []).forEach(e => {
    const d = new Date(e.due_date).toLocaleDateString("pt-BR");
    addDay(d);
    map[d].prevSaidas += Number(e.amount);
    map[d].isForecast = true;
  });
  (futureSupplier || []).forEach(q => {
    const d = new Date(q.supplier_payment_deadline).toLocaleDateString("pt-BR");
    addDay(d);
    map[d].prevSaidas += Math.max(Number(q.supplier_cost_total) - Number(q.supplier_paid || 0), 0);
    map[d].isForecast = true;
  });

  const { data: accounts } = await supabase.from("bank_accounts").select("balance");
  const totalBankBalance = (accounts || []).reduce((acc, b) => acc + Number(b.balance), 0);

  const sortedDates = Object.keys(map).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
  });

  const chartData = sortedDates.map(date => {
    const d = map[date];
    return {
      ...d,
      saldo: d.entradas - d.saidas,
      saldoPrevisto: totalBankBalance + d.prevEntradas - d.prevSaidas 
    };
  });

  const totalEntradas = (payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
  const totalSaidas = (expenses || []).reduce((acc, e) => acc + Number(e.amount), 0);

  return { chartData, totalEntradas, totalSaidas, totalBankBalance, saldo: totalEntradas - totalSaidas };
}

export async function getCashFlowForecast(targetDate: string) {
  const supabase = await createClient();
  const target = new Date(targetDate + "T23:59:59");

  const [{ data: receivables }, { data: payables }, { data: supplierQuotes }, { data: accounts }] = await Promise.all([
    supabase.from("quotes").select("total_sale_price, total_paid, status").in("status", ["em_producao", "finalizado"]),
    supabase.from("expenses").select("amount, due_date").eq("is_paid", false).lte("due_date", target.toISOString()),
    supabase.from("quotes").select("supplier_cost_total, supplier_paid, supplier_payment_deadline").in("status", ["em_producao", "finalizado"]).lte("supplier_payment_deadline", target.toISOString()),
    supabase.from("bank_accounts").select("balance")
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
  const supabase = await createClient();
  const { data } = await supabase.from("expense_categories").select("*").order("name");
  return data || [];
}

export async function createExpenseCategory(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expense_categories").insert([{ name, is_custom: true }]).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/financeiro");
  return { success: true, data };
}

// ==========================================
// DESPESAS
// ==========================================

export async function getExpenses() {
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select("*, category:expense_categories(name), bank_account:bank_accounts(bank_name)").order("date", { ascending: false });
  return data || [];
}

export async function createExpense(payload: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert([{ ...payload, is_paid: true, paid_date: payload.date || new Date().toISOString(), paid_amount: payload.amount, paid_method: payload.payment_method }]);
  if (error) return { success: false, error: error.message };

  const { data: bank } = await supabase.from("bank_accounts").select("balance").eq("id", payload.bank_account_id).single();
  if (bank) {
    await supabase.from("bank_accounts").update({ balance: Number(bank.balance) - Number(payload.amount), updated_at: new Date().toISOString() }).eq("id", payload.bank_account_id);
  }
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { data: expense } = await supabase.from("expenses").select("amount, is_paid, bank_account_id").eq("id", id).single();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  if (expense?.is_paid && expense.bank_account_id) {
    const { data: bank } = await supabase.from("bank_accounts").select("balance").eq("id", expense.bank_account_id).single();
    if (bank) { await supabase.from("bank_accounts").update({ balance: Number(bank.balance) + Number(expense.amount) }).eq("id", expense.bank_account_id); }
  }
  revalidatePath("/financeiro");
  return { success: true };
}

// ==========================================
// PAGAMENTOS (ENTRADAS)
// ==========================================

export async function getPayments() {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const { data: bank } = await supabase.from("bank_accounts").select("balance").eq("id", payload.bank_account_id).single();
  if (bank) {
    await supabase.from("bank_accounts").update({ balance: Number(bank.balance) + netAmount, updated_at: now }).eq("id", payload.bank_account_id);
  }

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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: expenses } = await supabase.from("expenses").select("*, category:expense_categories(name)").order("due_date");
  const { data: quotes } = await supabase.from("quotes").select("id, status, supplier_cost_total, supplier_paid, supplier_payment_deadline, client:clients(name)").in("status", ["em_producao", "pronto_para_instalacao", "finalizado"]).gt("supplier_cost_total", 0);

  const supplierPayables = (quotes || []).map(q => {
    const client = Array.isArray(q.client) ? q.client[0] : q.client;
    return { id: q.id, type: "fornecedor", description: `Custo Fábrica - ${client?.name || "Cliente"}`, amount: Math.max(Number(q.supplier_cost_total) - Number(q.supplier_paid || 0), 0), due_date: q.supplier_payment_deadline, category: { name: "Custo de Produtos" } };
  }).filter(q => q.amount > 0);
  return { expenses: (expenses || []).map(e => ({ ...e, type: "despesa" })), supplierPayables };
}

export async function liquidateExpense(id: string, payload: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update({ is_paid: true, paid_date: new Date().toISOString(), paid_amount: payload.paid_amount, paid_method: payload.paid_method, bank_account_id: payload.bank_account_id }).eq("id", id);
  if (error) return { success: false, error: error.message };
  const { data: bank } = await supabase.from("bank_accounts").select("balance").eq("id", payload.bank_account_id).single();
  if (bank) { await supabase.from("bank_accounts").update({ balance: Number(bank.balance) - Number(payload.paid_amount) }).eq("id", payload.bank_account_id); }
  revalidatePath("/financeiro");
  return { success: true };
}

export async function liquidateSupplierPayment(quoteId: string, payload: any) {
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("supplier_paid, supplier_cost_total").eq("id", quoteId).single();
  if (!quote) return { success: false, error: "Pedido não encontrado" };
  const { error } = await supabase.from("quotes").update({ supplier_paid: (Number(quote.supplier_paid) || 0) + payload.amount }).eq("id", quoteId);
  if (error) return { success: false, error: error.message };

  const { data: bank } = await supabase.from("bank_accounts").select("balance").eq("id", payload.bank_account_id).single();
  if (bank) { await supabase.from("bank_accounts").update({ balance: Number(bank.balance) - Number(payload.amount) }).eq("id", payload.bank_account_id); }

  const { data: category } = await supabase.from('expense_categories').select('id').eq('name', 'Custo de Produtos').single();
  if (category) {
    await supabase.from('expenses').insert({ category_id: category.id, description: `Liquidação Fornecedor - Pedido ${quoteId.split('-')[0].toUpperCase()}`, amount: payload.amount, date: new Date().toISOString(), payment_method: payload.payment_method, is_paid: true, paid_date: new Date().toISOString(), paid_amount: payload.amount, paid_method: payload.payment_method, bank_account_id: payload.bank_account_id });
  }
  revalidatePath("/financeiro");
  return { success: true };
}
