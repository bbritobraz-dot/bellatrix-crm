"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { adjustBankBalance, getOrCreateExpenseCategoryId } from "@/lib/finance/helpers";

export async function saveQuote(data: any) {
  const supabase = await createAuthedClient();

  try {
    let clientId = data.clientId;
    
    if (!clientId) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('name', data.clientName)
        .limit(1)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.clientName,
            phone: data.clientPhone || '0000000000',
            address: data.clientAddress,
            status: 'novo_lead'
          })
          .select()
          .single();

        if (clientError) throw new Error("Erro ao criar cliente: " + clientError.message);
        clientId = newClient.id;
      }
    }

    // SEMPRE atualizar o status do cliente para 'orcamento_enviado' ao salvar um novo orçamento
    await supabase
      .from('clients')
      .update({ status: 'orcamento_enviado' })
      .eq('id', clientId);

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: clientId,
        status: 'rascunho',
        total_sale_price: data.globalSalePrice,
        discount_amount: data.discountType === 'value' ? data.discountValue : 0,
        discount_percent: data.discountType === 'percent' ? data.discountValue : 0,
        payment_conditions: `${data.paymentMethod} - ${data.installments}x`,
        commercial_notes: "Orçamento gerado pelo sistema"
      })
      .select()
      .single();

    if (quoteError) throw new Error("Erro ao criar orçamento: " + quoteError.message);

    for (const item of data.items) {
      const { data: quoteItem, error: itemError } = await supabase
        .from('quote_items')
        .insert({
          quote_id: quote.id,
          product_id: item.product.id,
          width_m: item.width,
          height_m: item.height,
          quantity: item.quantity,
          charged_area_m2: item.chargedArea,
          supplier_cost_total: item.supplierCostTotal,
          sale_price_total: item.salePriceTotal,
          margin_percent: item.marginPercent,
          notes: item.notes || ''
        })
        .select()
        .single();

      if (itemError) throw new Error("Erro ao inserir item: " + itemError.message);

      if (item.accessories && item.accessories.length > 0) {
        const accessoriesToInsert = item.accessories.map((acc: any) => ({
          quote_item_id: quoteItem.id,
          accessory_id: acc.accessory.id,
          quantity: acc.quantity,
          supplier_cost_total: acc.cost * acc.quantity
        }));

        const { error: accError } = await supabase
          .from('quote_item_accessories')
          .insert(accessoriesToInsert);

        if (accError) throw new Error("Erro ao inserir acessórios: " + accError.message);
      }
    }

    return { success: true, quoteId: quote.id };

  } catch (error: any) {
    console.error("Erro no saveQuote:", error);
    return { success: false, error: error.message };
  }
}

async function replaceQuoteItems(supabase: any, quoteId: string, items: any[]) {
  const { error: deleteError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId);

  if (deleteError) throw new Error("Erro ao limpar itens do orçamento: " + deleteError.message);

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
        supplier_cost_total: item.supplierCostTotal,
        sale_price_total: item.salePriceTotal,
        margin_percent: item.marginPercent,
        notes: item.notes || ''
      })
      .select()
      .single();

    if (itemError) throw new Error("Erro ao inserir item: " + itemError.message);

    if (item.accessories && item.accessories.length > 0) {
      const accessoriesToInsert = item.accessories.map((acc: any) => ({
        quote_item_id: quoteItem.id,
        accessory_id: acc.accessory.id,
        quantity: acc.quantity,
        supplier_cost_total: acc.cost * acc.quantity,
        sale_price_total: acc.salePrice ? acc.salePrice * acc.quantity : null
      }));

      const { error: accError } = await supabase
        .from('quote_item_accessories')
        .insert(accessoriesToInsert);

      if (accError) throw new Error("Erro ao inserir acessórios: " + accError.message);
    }
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
        status: 'orcamento_enviado'
      })
      .eq('id', currentQuote.client_id);

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'rascunho',
        total_sale_price: data.globalSalePrice,
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
      client:clients(name, phone, address),
      quote_items(
        id,
        product_id,
        product:products(name, line),
        width_m,
        height_m,
        quantity,
        charged_area_m2,
        supplier_cost_total,
        sale_price_total,
        notes
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
    return { ...q, computed_supplier_cost };
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

  const updatePayload: any = {
    status: 'em_producao',
    production_start_date: now.toISOString(),
    delivery_forecast_date: forecastDate.toISOString(),
    supplier_payment_deadline: supplierDeadline.toISOString(),
  };

  if (supplierData) {
    updatePayload.supplier_cost_total = supplierData.supplierCostTotal;
    updatePayload.supplier_paid = supplierData.supplierPaid;
  }

  const { data: quote, error } = await supabase
    .from('quotes')
    .update(updatePayload)
    .eq('id', id)
    .select('client_id')
    .single();

  if (error) return { success: false, error: error.message };

  // Atualizar status do cliente para 'fechado'
  if (quote?.client_id) {
    await supabase
      .from('clients')
      .update({ status: 'fechado' })
      .eq('id', quote.client_id);
  }

  // Registrar automaticamente apenas o que foi pago AGORA como despesa realizada
  if (supplierData && supplierData.supplierPaid > 0 && supplierData.bankAccountId) {
    const categoryId = await getOrCreateExpenseCategoryId(supabase, 'Custo de Produtos');

    if (categoryId) {
      await supabase.from('expenses').insert({
        category_id: categoryId,
        description: `Entrada/Sinal Fornecedor - Pedido ${id.split('-')[0].toUpperCase()}`,
        amount: supplierData.supplierPaid,
        date: now.toISOString(),
        payment_method: supplierData.paymentMethod || 'a definir',
        is_paid: true,
        paid_date: now.toISOString(),
        paid_amount: supplierData.supplierPaid,
        paid_method: supplierData.paymentMethod || 'a definir',
        bank_account_id: supplierData.bankAccountId,
        notes: `Pagamento inicial ao fornecedor referente ao pedido ${id}. Total do custo: R$ ${supplierData.supplierCostTotal.toFixed(2)}`
      });
    }

    // Descontar do saldo da conta (atômico), mesmo se a despesa não puder ser registrada
    const balanceError = await adjustBankBalance(supabase, supplierData.bankAccountId, -Number(supplierData.supplierPaid));
    if (balanceError) return { success: false, error: balanceError };
  }

  return { success: true };
}

export async function reopenQuote(quoteId: string) {
  const supabase = await createAuthedClient();
  const { error } = await supabase
    .from('quotes')
    .update({ status: 'rascunho' })
    .eq('id', quoteId);

  if (error) return { success: false, error: error.message };
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

  const { error } = await supabase
    .from('quotes')
    .update({ 
      status: 'pronto_para_instalacao',
      installation_date: `${date}T${time}:00`
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function finishOrder(id: string) {
  const supabase = await createAuthedClient();
  const now = new Date();
  const warrantyEndDate = new Date();
  warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1); // 1 ano de garantia

  const { data: quote, error } = await supabase
    .from('quotes')
    .update({ 
      status: 'finalizado',
      installation_date: now.toISOString(),
      warranty_end_date: warrantyEndDate.toISOString()
    })
    .eq('id', id)
    .select('client_id')
    .single();

  if (error) return { success: false, error: error.message };

  // Atualizar status do cliente para 'pos_venda' (sai do kanban principal)
  if (quote?.client_id) {
    await supabase
      .from('clients')
      .update({ status: 'pos_venda' })
      .eq('id', quote.client_id);
  }
  return { success: true };
}
