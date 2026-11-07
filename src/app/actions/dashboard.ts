"use server";

import { createAuthedClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/dates";

const SALES_STATUSES = ['aprovado', 'em_producao', 'pronto_para_instalacao', 'finalizado'];

export async function getDashboardStats(startDate?: string, endDate?: string) {
  const supabase = await createAuthedClient();
  // "Hoje" no fuso de São Paulo (o servidor roda em UTC; após as 21h virava o dia seguinte)
  const today = todayKey();

  let quotesQuery = supabase.from('quotes').select(`
    *,
    quote_items (
      *,
      product:products(name, line_info:product_lines(label))
    )
  `);
  let visitsQuery = supabase.from('visits').select('*');
  let expensesQuery = supabase.from('expenses').select('*, category:expense_categories(name)');
  let paymentsQuery = supabase.from('payments').select('*');

  if (startDate) {
    quotesQuery = quotesQuery.gte('created_at', startDate);
    visitsQuery = visitsQuery.gte('date', startDate);
    expensesQuery = expensesQuery.gte('date', startDate);
    paymentsQuery = paymentsQuery.gte('payment_date', startDate);
  }
  if (endDate) {
    quotesQuery = quotesQuery.lte('created_at', endDate);
    visitsQuery = visitsQuery.lte('date', endDate);
    expensesQuery = expensesQuery.lte('date', endDate);
    paymentsQuery = paymentsQuery.lte('payment_date', endDate);
  }

  const [quotesRes, expensesRes, paymentsRes] = await Promise.all([
    quotesQuery,
    expensesQuery,
    paymentsQuery
  ]);

  if (quotesRes.error) {
    console.error("Erro ao buscar orçamentos:", quotesRes.error);
  }

  const quotes = quotesRes.data || [];
  const expenses = expensesRes.data || [];
  const payments = paymentsRes.data || [];

  const salesQuotes = (quotes || []).filter(q => SALES_STATUSES.includes(q.status));
  
  // Cálculo de Ranking de Produtos
  const productStats: Record<string, { name: string, count: number, totalVal: number, totalMargin: number }> = {};
  
  salesQuotes.forEach(q => {
    (q.quote_items || []).forEach((item: any) => {
      const pName = item.product?.name || "Produto Desconhecido";
      const pLine = item.product?.line_info?.label || "";
      const fullName = pLine ? `${pLine} - ${pName}` : pName;
      
      if (!productStats[fullName]) {
        productStats[fullName] = { name: fullName, count: 0, totalVal: 0, totalMargin: 0 };
      }
      productStats[fullName].count += 1;
      productStats[fullName].totalVal += Number(item.sale_price_total || 0);
      productStats[fullName].totalMargin += Number(item.margin_percent || 0);
    });
  });

  const topProducts = Object.values(productStats)
    .map(p => ({
      name: p.name,
      ordersCount: p.count,
      averageValue: p.totalVal / p.count,
      averageMargin: p.totalMargin / p.count
    }))
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 5); // Top 5 produtos

  const vendasFechadas = salesQuotes.reduce((acc, q) => acc + Number(q.total_sale_price || 0), 0);
  const recebidoPeriodo = (payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const aReceber = salesQuotes.reduce((acc, q) => {
    const totalVenda = Number(q.total_sale_price || 0);
    const totalRecebido = Number(q.total_paid || 0);
    return acc + Math.max(totalVenda - totalRecebido, 0);
  }, 0);

  // Custo do pedido: o informado ao ir para produção ou, se não houver, a soma dos itens.
  // (Antes caía numa coluna inexistente e contava custo 0 → lucro inflado.)
  const custoProjetado = salesQuotes.reduce((acc, q) => {
    const informado = Number(q.supplier_cost_total || 0);
    const somaItens = (q.quote_items || []).reduce((s: number, it: any) => s + Number(it.supplier_cost_total || 0), 0);
    return acc + (informado > 0 ? informado : somaItens);
  }, 0);

  const despesasPagasPeriodo = (expenses || []).filter(exp => {
    return exp.is_paid === true;
  }).reduce((acc, exp) => acc + Number(exp.paid_amount ?? exp.amount ?? 0), 0);

  // Pagamentos à fábrica de um pedido também viram despesa ("Custo de Produtos").
  // No caixa (resultadoReal) eles contam, mas no lucro projetado o custo do pedido
  // já entra em custoProjetado — somar de novo descontava a fábrica duas vezes.
  const isPagamentoFabricaDePedido = (exp: any) =>
    exp.category?.name === 'Custo de Produtos' &&
    (exp.quote_id != null || /Fornecedor - Pedido/i.test(exp.description || ''));

  const despesasOperacionaisPeriodo = (expenses || [])
    .filter(exp => exp.is_paid === true && !isPagamentoFabricaDePedido(exp))
    .reduce((acc, exp) => acc + Number(exp.paid_amount ?? exp.amount ?? 0), 0);

  const resultadoReal = recebidoPeriodo - despesasPagasPeriodo;
  const lucroProjetado = vendasFechadas - custoProjetado - despesasOperacionaisPeriodo;

  const totalOrçamentos = quotes.length;
  const emProducao = quotes.filter(q => q.status === 'em_producao').length;

  const { data: visitsToday } = await supabase.from('visits').select('id').eq('date', today);
  const { data: installsToday } = await supabase.from('quotes')
    .select('id')
    .gte('installation_date', `${today}T00:00:00-03:00`)
    .lte('installation_date', `${today}T23:59:59-03:00`);

  const pedidosEmAtraso = quotes.filter(q =>
    ['em_producao', 'pronto_para_instalacao'].includes(q.status) &&
    q.delivery_forecast_date &&
    new Date(q.delivery_forecast_date) < new Date()
  ).length;

  // A Pagar Consolidado (fornecedores em produção com saldo + despesas não pagas)
  const { data: unpaidExpenses } = await supabase.from('expenses').select('amount').eq('is_paid', false);
  const { data: productionQuotes } = await supabase.from('quotes')
    .select('supplier_cost_total, supplier_paid')
    .in('status', ['em_producao', 'pronto_para_instalacao', 'finalizado']);

  const aPagarFornecedores = (productionQuotes || []).reduce((acc, q) => {
    return acc + Math.max(Number(q.supplier_cost_total || 0) - Number(q.supplier_paid || 0), 0);
  }, 0);
  const aPagarDespesas = (unpaidExpenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalAPagar = aPagarFornecedores + aPagarDespesas;

  const conversion = totalOrçamentos > 0 ? (salesQuotes.length / totalOrçamentos) * 100 : 0;
  const ticketMedio = salesQuotes.length > 0 ? vendasFechadas / salesQuotes.length : 0;
  const margemMedia = vendasFechadas > 0 ? (lucroProjetado / vendasFechadas) * 100 : 0;

  return {
    vendasFechadas,
    recebidoPeriodo,
    aReceber,
    totalAPagar,
    despesasPagasPeriodo,
    resultadoReal,
    custoProjetado,
    lucroProjetado,
    faturamento: recebidoPeriodo,
    lucro: resultadoReal,
    totalOrçamentos,
    emProducao,
    visitasHoje: visitsToday?.length || 0,
    installsHoje: installsToday?.length || 0,
    pedidosEmAtraso,
    conversion,
    ticketMedio,
    margemMedia,
    topProducts
  };
}
