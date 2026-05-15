"use client";

import { Target } from "lucide-react";

interface SalesEfficiencyProps {
  stats: any;
  formatCurrency: (val: number) => string;
}

function MetricItem({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-black mb-1 ${label === 'Ticket Médio' ? 'text-success' : 'text-primary'}`}>{value}</p>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{subtext}</p>
    </div>
  );
}

export function SalesEfficiency({ stats, formatCurrency }: SalesEfficiencyProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-slate-400" /> Eficiência de Vendas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricItem
          label="Conversão"
          value={`${stats.conversion.toFixed(1)}%`}
          subtext="Orçamentos → Pedidos"
        />
        <MetricItem
          label="Ticket Médio"
          value={formatCurrency(stats.ticketMedio)}
          subtext="Valor por venda"
        />
        <MetricItem
          label="Margem Projetada"
          value={`${stats.margemMedia.toFixed(1)}%`}
          subtext="Lucratividade prevista"
        />
      </div>
    </div>
  );
}
