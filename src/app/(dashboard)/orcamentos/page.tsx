import { getQuotes } from "@/app/actions/quotes";
import { getBankAccounts } from "@/app/actions/finance";
import { QuotesListView } from "@/components/quotes/QuotesListView";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage() {
  // Busca apenas orçamentos (Rascunho, Enviado, Aprovado)
  const [quotes, bankAccounts] = await Promise.all([
    getQuotes(['rascunho', 'enviado', 'aprovado', 'recusado', 'expirado']),
    getBankAccounts()
  ]);

  return (
    <div className="p-8">
      <QuotesListView initialQuotes={quotes || []} bankAccounts={bankAccounts || []} />
    </div>
  );
}
