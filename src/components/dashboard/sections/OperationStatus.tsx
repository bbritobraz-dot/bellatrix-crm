"use client";

import { ReactNode } from "react";
import { Clock, BarChart3, Calendar, CheckCircle, AlertCircle } from "lucide-react";

interface OperationStatusProps {
  stats: any;
}

function OperationItem({ label, value, icon, bgColor, valueColor }: { label: string; value: number; icon: ReactNode; bgColor: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className={`text-lg font-bold ${valueColor || "text-slate-800"}`}>{value}</span>
    </div>
  );
}

export function OperationStatus({ stats }: OperationStatusProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-400" /> Status da Operação
      </h3>
      <div className="space-y-4">
        <OperationItem
          label="Em Produção"
          value={stats.emProducao}
          icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <OperationItem
          label="Visitas Hoje"
          value={stats.visitasHoje}
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <OperationItem
          label="Instalações Hoje"
          value={stats.installsHoje}
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          bgColor="bg-emerald-50"
        />
        <OperationItem
          label="Pedidos em Atraso"
          value={stats.pedidosEmAtraso}
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
          bgColor="bg-rose-50"
          valueColor="text-rose-600"
        />
      </div>
    </div>
  );
}
