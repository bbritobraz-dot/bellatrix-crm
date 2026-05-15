import { getQuotes } from "@/app/actions/quotes";
import { getBankAccounts } from "@/app/actions/finance";
import { ProductionClientView } from "@/components/production/ProductionClientView";

export const dynamic = "force-dynamic";

export default async function ProducaoPage() {
  const [quotes, bankAccounts] = await Promise.all([
    getQuotes(['em_producao', 'pronto_para_instalacao']),
    getBankAccounts(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Em Produção</h1>
        <p className="text-slate-500 mt-1">Acompanhe os pedidos na fábrica e os prazos de entrega</p>
      </div>

      <ProductionClientView initialQuotes={quotes || []} bankAccounts={bankAccounts || []} />
    </div>
  );
}
