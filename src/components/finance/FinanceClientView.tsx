"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Tag, 
  Settings,
  Loader2
} from "lucide-react";
import { DashboardTab } from "./tabs/DashboardTab";
import { ExpensesTab } from "./tabs/ExpensesTab";
import { IncomesTab } from "./tabs/IncomesTab";
import { ReceivablesTab } from "./tabs/ReceivablesTab";
import { PayablesTab } from "./tabs/PayablesTab";
import { CategoriesTab } from "./tabs/CategoriesTab";
import { getReceivables, getPayables, getCardFeeSettings } from "@/app/actions/finance";
import { SettingsTab } from "./tabs/SettingsTab";

type Tab = "dashboard" | "entradas" | "saidas" | "areceber" | "apagar" | "categorias" | "configuracoes";

export function FinanceClientView({
  initialExpenses, initialCategories, initialPayments,
  initialReceivables, initialPayables, initialDashboardData, initialBankAccounts,
  initialCardFeeSettings
}: {
  initialExpenses: any[];
  initialCategories: any[];
  initialPayments: any[];
  initialReceivables: any[];
  initialPayables: { expenses: any[]; supplierPayables: any[] };
  initialDashboardData: { chartData: any[]; totalEntradas: number; totalSaidas: number; saldo: number };
  initialBankAccounts: any[];
  initialCardFeeSettings: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [expenses, setExpenses] = useState(initialExpenses);
  const [payments, setPayments] = useState(initialPayments);
  const [receivables, setReceivables] = useState(initialReceivables);
  const [payables, setPayables] = useState(initialPayables);
  const [cardFeeSettings, setCardFeeSettings] = useState(initialCardFeeSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    // Recarrega dados frescos ao entrar nas abas dinâmicas
    if (tab === "areceber") {
      setIsLoading(true);
      const data = await getReceivables();
      setReceivables(data || []);
      setIsLoading(false);
    }
    if (tab === "apagar") {
      setIsLoading(true);
      const data = await getPayables();
      setPayables(data || { expenses: [], supplierPayables: [] });
      setIsLoading(false);
    }
    if (tab === "configuracoes") {
      setIsLoading(true);
      const data = await getCardFeeSettings();
      setCardFeeSettings(data || []);
      setIsLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard, color: "text-primary" },
    { id: "entradas", label: "Entradas", icon: TrendingUp, color: "text-emerald-500" },
    { id: "saidas", label: "Saídas", icon: TrendingDown, color: "text-rose-500" },
    { id: "areceber", label: "A Receber", icon: ArrowDownCircle, color: "text-vibrant-cyan" },
    { id: "apagar", label: "A Pagar", icon: ArrowUpCircle, color: "text-amber-500" },
    { id: "categorias", label: "Categorias", icon: Tag, color: "text-slate-400" },
    { id: "configuracoes", label: "Configurações", icon: Settings, color: "text-slate-400" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex bg-white p-1.5 rounded-2xl border border-border shadow-sm">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button 
                key={t.id} 
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
                  isActive 
                    ? "bg-primary text-vibrant-cyan shadow-lg shadow-primary/20 scale-105" 
                    : "text-slate-400 hover:text-primary hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-vibrant-cyan" : t.color}`} />
                <span className="text-[11px] font-heading font-bold uppercase tracking-widest">{t.label}</span>
              </button>
            );
          })}
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 px-4 text-primary animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sincronizando</span>
          </div>
        )}
      </div>

      {activeTab === "dashboard" && (
        <DashboardTab initialData={initialDashboardData} initialBankAccounts={initialBankAccounts} />
      )}
      {activeTab === "entradas" && (
        <IncomesTab payments={payments} setPayments={setPayments} bankAccounts={initialBankAccounts} />
      )}
      {activeTab === "saidas" && (
        <ExpensesTab expenses={expenses} setExpenses={setExpenses} categories={initialCategories} bankAccounts={initialBankAccounts} />
      )}
      {activeTab === "areceber" && (
        <ReceivablesTab receivables={receivables} bankAccounts={initialBankAccounts} />
      )}
      {activeTab === "apagar" && (
        <PayablesTab payables={payables} bankAccounts={initialBankAccounts} />
      )}
      {activeTab === "categorias" && (
        <CategoriesTab categories={initialCategories} setCategories={() => {}} />
      )}
      {activeTab === "configuracoes" && (
        <SettingsTab initialSettings={cardFeeSettings} />
      )}
    </div>
  );
}
