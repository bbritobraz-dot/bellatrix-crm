import { getQuotes } from "@/app/actions/quotes";
import { FinishedClientView } from "@/components/production/FinishedClientView";

export const dynamic = "force-dynamic";

export default async function FinalizadosPage() {
  const quotes = await getQuotes(['finalizado']);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Finalizados & Garantias</h1>
        <p className="text-slate-500 mt-1">Histórico de instalações e controle de prazos de garantia</p>
      </div>

      <FinishedClientView initialQuotes={quotes || []} />
    </div>
  );
}
