"use client";

import { ReactNode } from "react";
import { TrendingUp, Wallet, AlertCircle, DollarSign, FileText, Target } from "lucide-react";

interface KpiGridProps {
  stats: any;
  formatCurrency: (val: number) => string;
}

type CardColor = "emerald" | "indigo" | "orange" | "blue" | "amber" | "rose";

function KpiCard({ title, value, icon, color }: { title: string; value: string | number; icon: ReactNode; color: CardColor }) {
  const colors: Record<CardColor, string> = {
    emerald: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100",
    orange: "bg-orange-50 border-orange-100",
    blue: "bg-blue-50 border-blue-100",
    amber: "bg-amber-50 border-amber-100",
    rose: "bg-rose-50 border-rose-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-heading">{title}</h3>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-black ${color === 'emerald' || color === 'blue' ? 'text-success' : 'text-primary'}`}>{value}</p>
    </div>
  );
}

export function KpiGrid({ stats, formatCurrency }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <KpiCard
        title="Vendas Fechadas"
        value={formatCurrency(stats.vendasFechadas)}
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        color="emerald"
      />
      <KpiCard
        title="Recebido no Período"
        value={formatCurrency(stats.recebidoPeriodo)}
        icon={<Wallet className="w-5 h-5 text-blue-600" />}
        color="blue"
      />
      <KpiCard
        title="A Receber"
        value={formatCurrency(stats.aReceber)}
        icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
        color="amber"
      />
      <KpiCard
        title="A Pagar"
        value={formatCurrency(stats.totalAPagar ?? 0)}
        icon={<DollarSign className="w-5 h-5 text-rose-600" />}
        color="rose"
      />
      <KpiCard
        title="Resultado Real"
        value={formatCurrency(stats.resultadoReal)}
        icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
        color={stats.resultadoReal >= 0 ? "indigo" : "rose"}
      />
      <KpiCard
        title="Lucro Projetado"
        value={formatCurrency(stats.lucroProjetado)}
        icon={<Target className="w-5 h-5 text-indigo-600" />}
        color={stats.lucroProjetado >= 0 ? "indigo" : "rose"}
      />
      <KpiCard
        title="Orçamentos"
        value={stats.totalOrçamentos}
        icon={<FileText className="w-5 h-5 text-orange-600" />}
        color="orange"
      />
    </div>
  );
}
