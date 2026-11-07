// Converte um orçamento salvo no banco (getQuotes) para o formato usado
// pelos PDFs (orçamento do cliente e pedido de fábrica).

export type PdfItem = {
  product: { name: string; line?: string; cost_unit?: string; supplier_cost?: number };
  width: number;
  height: number;
  quantity: number;
  color?: string;
  commandSide?: string;
  commandHeight?: number;
  ambient?: string;
  notes?: string;
  chargedArea?: number;
  salePriceTotal: number;
  supplierCostTotal: number;
  accessories: {
    accessory: { name: string; slug?: string; cost_unit?: string };
    quantity: number;
    sale_price_total?: number;
    supplier_cost_total?: number;
  }[];
};

export type PdfQuoteData = {
  quoteId?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: PdfItem[];
  totalDiscount: number;
  globalSalePrice: number;
  paymentMethod: string;
  installments: number;
  date?: string;
};

const first = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined);

export function dbQuoteToPdfData(quote: any): PdfQuoteData {
  const client = first(quote.client) as any;
  const items: PdfItem[] = (quote.quote_items || []).map((it: any) => ({
    product: first(it.product) || { name: "Produto" },
    width: Number(it.width_m || 0),
    height: Number(it.height_m || 0),
    quantity: Number(it.quantity || 1),
    color: it.color || undefined,
    commandSide: it.command_side || undefined,
    commandHeight: it.command_height_m != null ? Number(it.command_height_m) : undefined,
    ambient: it.ambient || undefined,
    notes: it.notes || undefined,
    chargedArea: Number(it.charged_area_m2 || 0) || undefined,
    salePriceTotal: Number(it.sale_price_total || 0),
    supplierCostTotal: Number(it.supplier_cost_total || 0),
    accessories: (it.quote_item_accessories || [])
      .map((acc: any) => ({
        accessory: first(acc.accessory),
        quantity: Number(acc.quantity || 1),
        sale_price_total: acc.sale_price_total != null ? Number(acc.sale_price_total) : undefined,
        supplier_cost_total: acc.supplier_cost_total != null ? Number(acc.supplier_cost_total) : undefined,
      }))
      .filter((acc: any) => acc.accessory),
  }));

  const subtotal = items.reduce((s, i) => s + i.salePriceTotal, 0);
  const total = Number(quote.total_sale_price || 0);
  const [method, inst] = String(quote.payment_conditions || "").split(" - ");

  return {
    quoteId: quote.id,
    clientName: client?.name || "Cliente",
    clientPhone: client?.phone || "",
    clientAddress: client?.address || "",
    items,
    totalDiscount: Math.max(subtotal - total, 0),
    globalSalePrice: total,
    paymentMethod: method || "vista",
    installments: Number(inst?.match(/(\d+)x/)?.[1] || 1),
    date: quote.created_at
      ? new Date(quote.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : undefined,
  };
}

const safeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_");

/** Gera e baixa o PDF do orçamento do cliente. */
export async function downloadQuotePdf(quote: any) {
  const [{ pdf }, { QuotePDF }, { saveAs }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/quotes/QuotePDF"),
    import("file-saver"),
    import("react"),
  ]);
  const data = dbQuoteToPdfData(quote);
  const blob = await pdf(React.createElement(QuotePDF, { data }) as any).toBlob();
  saveAs(blob, `Orcamento_${safeName(data.clientName)}.pdf`);
}

/** Gera e baixa o Pedido de Produção (para a fábrica). */
export async function downloadFactoryOrderPdf(quote: any) {
  const [{ pdf }, { FactoryOrderPDF }, { saveAs }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/quotes/FactoryOrderPDF"),
    import("file-saver"),
    import("react"),
  ]);
  const data = dbQuoteToPdfData(quote);
  const blob = await pdf(React.createElement(FactoryOrderPDF, { data }) as any).toBlob();
  saveAs(blob, `Pedido_Fabrica_${safeName(data.clientName)}.pdf`);
}
