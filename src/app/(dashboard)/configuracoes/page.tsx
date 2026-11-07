import { getCardFeeSettings, getExpenseCategories } from "@/app/actions/finance";
import { getCurrentUserEmail } from "@/app/actions/auth";
import { SettingsClientView } from "@/components/settings/SettingsClientView";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [cardFees, categories, email] = await Promise.all([
    getCardFeeSettings(),
    getExpenseCategories(),
    getCurrentUserEmail(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Configurações</h1>
        <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Conta, taxas de cartão e categorias</p>
      </div>
      <SettingsClientView email={email} cardFees={cardFees} categories={categories} />
    </div>
  );
}
