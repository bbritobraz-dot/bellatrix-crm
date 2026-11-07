import { createAuthedClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/quotes/QuoteForm";

export const dynamic = 'force-dynamic';

export default async function NovoOrcamentoPage() {
  const supabase = await createAuthedClient();

  // Buscar produtos ativos
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

  // Buscar acessórios ativos
  const { data: accessories } = await supabase
    .from("accessories")
    .select("*")
    .eq("active", true)
    .order("name");

  // Buscar reformas ativas
  const { data: reforms } = await supabase
    .from("reforms")
    .select("*")
    .eq("active", true)
    .order("name");

  // Buscar clientes elegíveis (novo lead ou visita marcada/realizada)
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email, address, status")
    .in("status", ["novo_lead", "visita_agendada", "visita_realizada", "orcamento_enviado", "em_negociacao"])
    .order("name");

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Novo Orçamento</h2>
        <p className="text-slate-500 mt-2">Crie um orçamento preciso com cálculo automático de áreas, limites e bandôs.</p>
      </div>

      <QuoteForm 
        initialProducts={products || []}
        initialAccessories={accessories || []}
        initialReforms={reforms || []}
        initialClients={clients || []}
      />
    </div>
  );
}

