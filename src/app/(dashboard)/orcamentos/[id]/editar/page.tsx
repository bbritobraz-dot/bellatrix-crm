import { notFound } from "next/navigation";
import { createAuthedClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/quotes/QuoteForm";

export const dynamic = "force-dynamic";

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAuthedClient();

  const [
    { data: quote },
    { data: products },
    { data: accessories },
    { data: reforms },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select(`
        *,
        client:clients(id, name, phone, email, address, status),
        quote_items(
          id,
          product_id,
          product:products(*),
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
            id,
            accessory_id,
            quantity,
            supplier_cost_total,
            sale_price_total,
            accessory:accessories(*)
          )
        )
      `)
      .eq("id", id)
      .single(),
    supabase.from("products").select("*").eq("active", true).order("name"),
    supabase.from("accessories").select("*").eq("active", true).order("name"),
    supabase.from("reforms").select("*").eq("active", true).order("name"),
    supabase
      .from("clients")
      .select("id, name, phone, email, address, status")
      .order("name"),
  ]);

  if (!quote) notFound();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Editar Orçamento</h2>
        <p className="text-slate-500 mt-2">
          Reabra, ajuste itens, adicione novas peças e salve uma nova versão do orçamento.
        </p>
      </div>

      {quote.status !== "rascunho" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este orçamento ainda não está em rascunho. Reabra antes de salvar alterações.
        </div>
      )}

      <QuoteForm
        initialProducts={products || []}
        initialAccessories={accessories || []}
        initialReforms={reforms || []}
        initialClients={clients || []}
        initialQuote={quote}
      />
    </div>
  );
}
