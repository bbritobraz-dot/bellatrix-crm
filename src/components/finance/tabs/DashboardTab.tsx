"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Target, Loader2 } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { getCashFlowData, getCashFlowForecast } from "@/app/actions/finance";
import { BankAccountsPanel } from "../BankAccountsPanel";

type Period = "day" | "week" | "month" | "year";
type CashFlowData = {
  chartData: any[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  totalBankBalance?: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-semibold">R$ {Number(entry.value || 0).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardTab({
  initialData,
  initialBankAccounts,
}: {
  initialData: CashFlowData;
  initialBankAccounts: any[];
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState(initialData);
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastDate, setForecastDate] = useState("");
  const [forecast, setForecast] = useState<any>(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);

  const periodLabels: Record<Period, string> = { day: "Hoje", week: "7 Dias", month: "Mês Atual", year: "Ano" };

  const handlePeriodChange = async (p: Period) => {
    setPeriod(p);
    setIsLoading(true);
    const result = await getCashFlowData(p);
    setData(result);
    setIsLoading(false);
  };

  const handleForecast = async () => {
    if (!forecastDate) return;
    setIsForecastLoading(true);
    const result = await getCashFlowForecast(forecastDate);
    setForecast(result);
    setIsForecastLoading(false);
  };

  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + Number(b.balance), 0);

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="bg-white p-4 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 mr-2 whitespace-nowrap">Filtrar por:</span>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(["day","week","month","year"] as Period[]).map(p => (
              <button key={p} onClick={() => handlePeriodChange(p)}
                className={`px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                  period === p 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-slate-400 hover:text-primary"
                }`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-primary animate-pulse whitespace-nowrap">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Atualizando dados</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Resultado do Período", value: data.saldo, icon: Target, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
          { label: "Entradas Reais", value: data.totalEntradas, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Saídas Reais", value: data.totalSaidas, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
          { label: "Saldo Total em Contas", value: totalBankBalance, icon: Wallet, color: "text-vibrant-cyan", bg: "bg-slate-900", border: "border-slate-800", dark: true },
        ].map((card, idx) => (
          <div key={idx} className={`relative overflow-hidden p-5 rounded-[2rem] border ${card.border} ${card.dark ? "bg-slate-900 shadow-xl shadow-slate-900/20" : "bg-white shadow-sm"} transition-all duration-300 hover:shadow-md group`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-heading font-bold uppercase tracking-[0.15em] mb-1 ${card.dark ? "text-slate-300" : "text-slate-600"}`}>
                  {card.label}
                </p>
                <h3 className={`text-2xl font-bold tracking-tight whitespace-nowrap ${card.dark ? "text-white" : "text-slate-900"}`}>
                  <span className={`text-xs font-medium mr-1.5 opacity-60`}>R$</span>
                  {card.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.dark ? "text-vibrant-cyan" : card.color}`} />
              </div>
            </div>
            {/* Sutil detalhe de fundo */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] ${card.dark ? "bg-white" : "bg-primary"}`} />
          </div>
        ))}
      </div>

      {/* Combo Chart */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-500">
        <div className="p-8 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="max-w-md">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Fluxo de Caixa Acumulado</h3>
              <p className="text-[13px] text-slate-700 leading-relaxed">
                Análise comparativa de movimentações reais e projeções de saldo no período.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 bg-slate-50 p-3 px-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-widest text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span> 
                Entradas
              </div>
              <div className="flex items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-widest text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></span> 
                Saídas
              </div>
              <div className="flex items-center gap-2 text-[10px] font-heading font-bold uppercase tracking-widest text-slate-600">
                <span className="w-4 h-0.5 bg-primary rounded-full"></span> 
                Saldo
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full relative">
            {data.chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 m-2">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-300">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-medium text-sm">Sem movimentações no período selecionado.</p>
                <p className="text-[11px] text-slate-300 uppercase tracking-widest mt-1">Aguardando novos lançamentos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar 
                    dataKey="entradas" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                    barSize={period === 'year' ? 12 : 30}
                  />
                  <Bar 
                    dataKey="saidas" 
                    fill="#ef4444" 
                    radius={[6, 6, 0, 0]} 
                    barSize={period === 'year' ? 12 : 30}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#051C2C" 
                    strokeWidth={3} 
                    dot={{ fill: '#051C2C', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-slate-50/50 p-4 px-8 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relatório Consolidado</span>
          <div className="flex gap-4 text-xs font-bold text-primary">
             {/* Info adicional opcional */}
          </div>
        </div>
      </div>

      {/* Previsão de Caixa */}
      <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden p-8 group hover:shadow-md transition-all duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Inteligência Financeira</h3>
            <p className="text-xs text-slate-500 font-medium">Projeções de caixa e análise de risco futuro.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-stretch mb-8">
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Projetar saldo até:</label>
              <input type="date" className="w-full bg-transparent outline-none text-sm font-bold text-slate-700"
                value={forecastDate} onChange={e => setForecastDate(e.target.value)} />
            </div>
          </div>
          <button 
            onClick={handleForecast} 
            disabled={!forecastDate || isForecastLoading}
            className="bg-primary hover:bg-primary/90 text-vibrant-cyan px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-primary/20 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
          >
            {isForecastLoading ? "Processando..." : "Calcular Projeção"}
          </button>
        </div>

        {forecast && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Recebíveis</p>
                <p className="text-2xl font-bold text-emerald-700">
                  <span className="text-xs font-medium mr-1.5 opacity-60">R$</span>
                  {forecast.totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">Compromissos</p>
                <p className="text-2xl font-bold text-rose-700">
                  <span className="text-xs font-medium mr-1.5 opacity-60">R$</span>
                  {forecast.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className={`rounded-3xl p-6 flex items-center justify-between group border transition-colors ${forecast.saldoPrevisto >= 0 ? "bg-slate-900 border-slate-800" : "bg-amber-50 border-amber-200"}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${forecast.saldoPrevisto >= 0 ? "text-slate-400" : "text-amber-600"}`}>Resultado Projetado</p>
                <p className={`text-2xl font-bold ${forecast.saldoPrevisto >= 0 ? "text-vibrant-cyan" : "text-amber-700"}`}>
                  <span className="text-xs font-medium mr-1.5 opacity-60">R$</span>
                  {forecast.saldoPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${forecast.saldoPrevisto >= 0 ? "bg-slate-800 text-vibrant-cyan" : "bg-amber-100 text-amber-600"}`}>
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contas Bancárias */}
      <BankAccountsPanel initialAccounts={bankAccounts} onAccountsChange={setBankAccounts} />
    </div>
  );
}
