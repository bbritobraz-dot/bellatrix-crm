import { getExpenses, getExpenseCategories, getPayments, getReceivables, getPayables, getCashFlowData, getBankAccounts, getCardFeeSettings } from "@/app/actions/finance";
import { FinanceClientView } from "@/components/finance/FinanceClientView";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const [expenses, categories, payments, receivables, payables, dashboardData, bankAccounts, cardFeeSettings] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getPayments(),
    getReceivables(),
    getPayables(),
    getCashFlowData("month"),
    getBankAccounts(),
    getCardFeeSettings(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Financeiro</h1>
        <p className="text-slate-500 mt-1">Fluxo de caixa, pagamentos, despesas e balanços</p>
      </div>

      <FinanceClientView
        initialExpenses={expenses || []}
        initialCategories={categories || []}
        initialPayments={payments || []}
        initialReceivables={receivables || []}
        initialPayables={payables || { expenses: [], supplierPayables: [] }}
        initialDashboardData={dashboardData || { chartData: [], totalEntradas: 0, totalSaidas: 0, saldo: 0 }}
        initialBankAccounts={bankAccounts || []}
        initialCardFeeSettings={cardFeeSettings || []}
      />
    </div>
  );
}
