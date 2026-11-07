"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { round2 } from "@/lib/money";

const onlyDigits = (value?: string) => (value || "").replace(/\D/g, "");

/**
 * Encontra o cliente pelo telefone (só dígitos) ou cria um novo.
 * Antes a busca era pelo NOME: dois clientes chamados "Maria Silva" viravam a mesma pessoa.
 */
async function findOrCreateClient(supabase: any, data: any): Promise<string> {
  const phoneDigits = onlyDigits(data.clientPhone);

  if (phoneDigits.length >= 8) {
    const { data: candidates } = await supabase
      .from('clients')
      .select('id, phone')
      .ilike('phone', `%${phoneDigits.slice(-4)}%`);
    const match = (candidates || []).find((c: any) => onlyDigits(c.phone) === phoneDigits);
    if (match) return match.id;
  }

  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      name: data.clientName,
      phone: data.clientPhone || '0000000000',
      email: data.clientEmail?.trim() || null,
      address: data.clientAddress,
      status: 'novo_lead'
    })
    .select('id')
    .single();

  if (clientError) throw new Error("Erro ao criar cliente: " + clientError.message);
  return newClient.id;
}

/**
 * Insere os itens (e acessórios) de um orçamento. Se algo falhar no meio,
 * apaga o que já tinha inserido (acessórios saem junto por ON DELETE CASCADE)
 * e lança o erro, para não deixar um orçamento pela metade.
 */
async function insertQuoteItems(supabase: any, quoteId: string, items: any[]): Promise<string[]> {
  const insertedIds: string[] = [];
  try {
    for (const item of items) {
      const { data: quoteItem, error: itemError } = await supabase
        .from('quote_items')
        .insert({
          quote_id: quoteId,
          product_id: item.product.id,
          width_m: item.width,
          height_m: item.height,
          quantity: item.quantity,
          charged_area_m2: item.chargedArea,
          supplier_cost_total: round2(item.supplierCostTotal),
          sale_price_total: round2(item.salePriceTotal),
          margin_percent: item.marginPercent,
          notes: item.notes || '',
          color: item.color || null,
          command_side: item.commandSide || null,
          command_height_m: item.commandHeight !== undefined && item.commandHeight !== '' ? Number(item.commandHeight) : null,
          ambient: item.ambient?.trim() || null
        })
        .select('id')
        .single();

      if (itemError) throw new Error("Erro ao inserir item: " + itemError.message);
      insertedIds.push(quoteItem.id);

      if (item.accessories && item.accessories.length > 0) {
        const itemQty = Math.max(Number(item.quantity) || 1, 1);
        const accessoriesToInsert = item.accessories.map((acc: any) => ({
          quote_item_id: quoteItem.id,
          accessory_id: acc.accessory.id,
          quantity: acc.quantity,
          // acc.cost / acc.salePrice são por unidade de acessório em UMA peça do produto;
          // o total precisa multiplicar também pela quantidade de peças (antes faltava isso).
          supplier_cost_total: round2(Number(acc.cost || 0) * acc.quantity * itemQty),
          sale_price_total: acc.salePrice != null ? round2(Number(acc.salePrice) * acc.quantity * itemQty) : null
        }));

        const { error: accError } = await supabase
          .from('quote_item_accessories')
          .insert(accessoriesToInsert);

        if (accError) throw new Error("Erro ao inserir acessórios: " + accError.message);
      }
    }
    return insertedIds;
  } catch (error) {
    if (insertedIds.length > 0) {
      await supabase.from('quote_items').delete().in('id', insertedIds);
    }
    throw error;
  }
}

export async function saveQuote(data: any) {
  const supabase = await createAuthedClient();

  try {
    if (!data.clientName || !data.items || data.items.length === 0) {
      throw new Error("Informe o cliente e pelo menos um item.");
    }

    const clientId = data.clientId || await findOrCreateClient(supabase, data);
    if (data.clientId && data.clientEmail?.trim()) {
      await supabase.from('clients').update({ email: data.clientEmail.trim() }).eq('id', clientId);
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: clientId,
        status: 'rascunho',
        total_sale_price: round2(data.globalSalePrice),
        discount_amount: data.discountType === 'value' ? data.discountValue : 0,
        discount_percent: data.discountType === 'percent' ? data.discountValue : 0,
        payment_conditions: `${data.paymentMethod} - ${data.installments}x`,
        commercial_notes: "Orçamento gerado pelo sistema"
      })
      .select('id')
      .single();

    if (quoteError) throw new Error("Erro ao criar orçamento: " + quoteError.message);

    try {
      await insertQuoteItems(supabase, quote.id, data.items);
    } catch (itemsError) {
      // Não deixa um orçamento vazio/incompleto para trás
      await supabase.from('quotes').delete().eq('id', quote.id);
      throw itemsError;
    }

    // Só marca o cliente como "orçamento enviado" depois que tudo deu certo
    await supabase
      .from('clients')
      .update({ status: 'orcamento_enviado' })
      .eq('id', clientId);

    return { success: true, quoteId: quote.id };

  } catch (error: any) {
    console.error("Erro no saveQuote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Troca os itens de um orçamento com segurança: insere os novos primeiro e só
 * apaga os antigos se tudo deu certo. Antes apagava tudo e depois inseria —
 * uma falha no meio deixava o orçamento sem itens.
 */
async function replaceQuoteItems(supabase: any, quoteId: string, items: any[]) {
  const { data: oldItems, error: oldError } = await supabase
    .from('quote_items')
    .select('id')
    .eq('quote_id', quoteId);

  if (oldError) throw new Error("Erro ao ler itens do orçamento: " + oldError.message);

  await insertQuoteItems(supabase, quoteId, items);

  const oldIds = (oldItems || []).map((i: any) => i.id);
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from('quote_items').delete().in('id', oldIds);
    if (deleteError) throw new Error("Erro ao limpar itens antigos do orçamento: " + deleteError.message);
  }
}

export async function updateQuote(quoteId: string, data: any) {
  const supabase = await createAuthedClient();

  try {
    if (!quoteId) throw new Error("Orçamento inválido.");
    if (!data.clientName || !data.items || data.items.length === 0) {
      throw new Error("Informe o cliente e pelo menos um item.");
    }

    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('status, client_id')
      .eq('id', quoteId)
      .single();

    if (fetchError || !currentQuote) {
      throw new Error("Orçamento não encontrado.");
    }

    if (currentQuote.status !== 'rascunho') {
      throw new Error("Somente orçamentos em rascunho podem ser editados. Reabra o orçamento antes de alterar itens.");
    }

    await supabase
      .from('clients')
      .update({
        name: data.clientName,
        phone: data.clientPhone || '0000000000',
        address: data.clientAddress,
        ...(data.clientEmail?.trim() ? { email: data.clientEmail.trim() } : {}),
        status: 'orcamento_enviado'
      })
      .eq('id', currentQuote.client_id);

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'rascunho',
        total_sale_price: round2(data.globalSalePrice),
        discount_amount: data.discountType === 'value' ? data.discountValue : 0,
        discount_percent: data.discountType === 'percent' ? data.discountValue : 0,
        supplier_cost_total: 0,
        payment_conditions: `${data.paymentMethod} - ${data.installments}x`,
        commercial_notes: "Orçamento editado pelo sistema",
        production_start_date: null,
        delivery_forecast_date: null,
        supplier_payment_deadline: null,
        installation_date: null,
        warranty_end_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (quoteError) throw new Error("Erro ao atualizar orçamento: " + quoteError.message);

    await replaceQuoteItems(supabase, quoteId, data.items);

    return { success: true, quoteId };
  } catch (error: any) {
    console.error("Erro no updateQuote:", error);
    return { success: false, error: error.message };
  }
}

export async function getQuotes(statusFilters?: string[]) {
  const supabase = await createAuthedClient();
  let query = supabase
    .from('quotes')
    .select(`
      *,
      client:clients(id, name, phone, email, address),
      quote_items(
        id,
        product_id,
        product:products(name, line, cost_unit, supplier_cost),
        width_m,
        height_m,
        quantity,
        charged_area_m2,
        supplier_cost_total,
        sale_price_total,
        margin_percent,
        notes,
        color,
        command_side,
        command_height_m,
        ambient,
        quote_item_accessories(
          quantity,
          supplier_cost_total,
          sale_price_total,
          accessory:accessories(name, slug, cost_unit)
        )
      )
    `);

  if (statusFilters && statusFilters.length > 0) {
    query = query.in('status', statusFilters);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error("Erro ao buscar quotes:", error);
    return [];
  }

  // Calcular o custo total real a partir dos itens do orçamento
  // (supplier_cost_total na tabela quotes só é preenchido ao mover para produção;
  //  antes disso, precisamos somar os supplier_cost_total de cada quote_item)
  return (data || []).map(q => {
    const itemsCostSum = (q.quote_items || []).reduce(
      (acc: number, item: any) => acc + Number(item.supplier_cost_total || 0), 0
    );
    const computed_supplier_cost = Number(q.supplier_cost_total) > 0
      ? Number(q.supplier_cost_total)
      : itemsCostSum;
    return { ...q, computed_supplier_cost: round2(computed_supplier_cost) };
  });
}

function addBusinessDays(date: Date, days: number): Date {
  let count = 0;
  let currentDate = new Date(date);
  while (count < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return currentDate;
}

export async function moveToProduction(id: string, supplierData?: {
  supplierCostTotal: number;
  supplierPaid: number;
  paymentMethod: string;
  bankAccountId?: string;
}) {
  const supabase = await createAuthedClient();
  const now = new Date();
  const forecastDate = addBusinessDays(now, 10); // 10 dias úteis para entrega
  const supplierDeadline = addBusinessDays(now, 10); // prazo de pagamento ao fornecedor

  // Uma transação: status do pedido, cliente "fechado" e adiantamento à fábrica.
  // O vencimento do saldo do cliente passa a ser a previsão de entrega.
  const { error } = await supabase.rpc('move_to_production', {
    p_quote_id: id,
    p_forecast: forecastDate.toISOString(),
    p_supplier_deadline: supplierDeadline.toISOString(),
    p_supplier_cost: supplierData ? supplierData.supplierCostTotal : null,
    p_supplier_paid: supplierData ? Number(supplierData.supplierPaid || 0) : 0,
    p_method: supplierData?.paymentMethod || null,
    p_bank: supplierData?.bankAccountId || null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/orcamentos');
  revalidatePath('/producao');
  return { success: true };
}

/**
 * Reabre um pedido como rascunho.
 * reversePayments = true estorna recebimentos do cliente e pagamentos à fábrica
 * (devolve os valores às contas); false mantém tudo que já foi pago.
 */
export async function reopenQuote(quoteId: string, reversePayments = false) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.rpc('reopen_quote', {
    p_quote_id: quoteId,
    p_reverse_payments: reversePayments,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/orcamentos');
  revalidatePath('/finalizados');
  revalidatePath('/financeiro');
  return { success: true };
}

/** Exclui um orçamento. Bloqueado se houver pagamentos (estorne reabrindo antes). */
export async function deleteQuote(quoteId: string) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.rpc('delete_quote', { p_quote_id: quoteId });
  if (error) return { success: false, error: error.message };
  revalidatePath('/orcamentos');
  return { success: true };
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const supabase = await createAuthedClient();
  const { error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('id', quoteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function scheduleInstallation(id: string, date: string, time: string) {
  const supabase = await createAuthedClient();
  // Horário digitado é de São Paulo; sem o fuso o banco gravava como UTC (3h de diferença)
  const installationDate = `${date}T${time}:00-03:00`;

  const { error } = await supabase
    .from('quotes')
    .update({
      status: 'pronto_para_instalacao',
      installation_date: installationDate,
      // O saldo do cliente vence no dia da instalação
      payment_due_date: installationDate
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Finaliza a obra: registra o recebimento do saldo (opcional), ativa a garantia
 * de 1 ano e move o cliente para pós-venda — tudo numa transação.
 */
export async function finishOrder(id: string, payment?: {
  amount: number;
  method: string;
  bankAccountId: string;
  installments?: number;
}) {
  const supabase = await createAuthedClient();
  const { error } = await supabase.rpc('finish_order', {
    p_quote_id: id,
    p_amount: payment ? Number(payment.amount) : 0,
    p_method: payment?.method || null,
    p_bank: payment?.bankAccountId || null,
    p_installments: payment?.installments ?? null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/producao');
  revalidatePath('/finalizados');
  revalidatePath('/financeiro');
  return { success: true };
}
