"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { KpiGrid } from "./sections/KpiGrid";
import { OperationStatus } from "./sections/OperationStatus";
import { SalesEfficiency } from "./sections/SalesEfficiency";
import { TopProductsTable } from "./sections/TopProductsTable";

type DashboardStats = {
  vendasFechadas: number;
  recebidoPeriodo: number;
  aReceber: number;
  totalAPagar: number;
  resultadoReal: number;
  lucroProjetado: number;
  totalOrçamentos: number;
  emProducao: number;
  visitasHoje: number;
  installsHoje: number;
  pedidosEmAtraso: number;
  conversion: number;
  ticketMedio: number;
  margemMedia: number;
  topProducts: Array<{
    name: string;
    ordersCount: number;
    averageValue: number;
    averageMargin: number;
  }>;
};

export function DashboardClientView({ initialStats }: { initialStats: DashboardStats }) {
  const [stats, setStats] = useState(initialStats);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);

  const fetchStats = async (p: string) => {
    setLoading(true);
    let start = "";
    const end = new Date().toISOString();

    if (p === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString();
    } else if (p === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString();
    } else if (p === "year") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString();
    }

    const data = await getDashboardStats(start, end);
    if (data) setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (period !== "custom") {
      void Promise.resolve().then(() => fetchStats(period));
    }
  }, [period]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary uppercase tracking-tight whitespace-nowrap">Visão Geral</h2>
          <p className="text-sm text-slate-500 font-body">Métricas de desempenho da sua operação</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 text-xs font-bold font-heading uppercase tracking-widest rounded-lg transition-all ${period === p ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary"}`}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mês" : "Ano"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-cyan"></div>
        </div>
      )}

      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        <KpiGrid stats={stats} formatCurrency={formatCurrency} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OperationStatus stats={stats} />
          <div className="lg:col-span-2">
            <SalesEfficiency stats={stats} formatCurrency={formatCurrency} />
          </div>
        </div>

        <TopProductsTable products={stats.topProducts} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
}
