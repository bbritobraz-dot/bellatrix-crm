"use client";

import { TrendingUp } from "lucide-react";

interface TopProductsTableProps {
  products: any[];
  formatCurrency: (val: number) => string;
}

export function TopProductsTable({ products, formatCurrency }: TopProductsTableProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> Produtos Mais Vendidos
        </h3>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top 5 Período</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-responsive-stack">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-semibold text-slate-500 text-sm">Produto</th>
              <th className="pb-4 font-semibold text-slate-500 text-sm text-center">Pedidos</th>
              <th className="pb-4 font-semibold text-slate-500 text-sm text-right">Ticket Médio</th>
              <th className="pb-4 font-semibold text-slate-500 text-sm text-right">Margem Média</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products && products.length > 0 ? (
              products.map((product, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4" data-label="Produto">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center" data-label="Pedidos">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold text-xs">
                      {product.ordersCount} pedidos
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold text-success" data-label="Média">
                    {formatCurrency(product.averageValue)}
                  </td>
                  <td className="py-4 text-right" data-label="Margem">
                    <span className={`font-bold ${
                      product.averageMargin >= 50 ? 'text-emerald-600' : 
                      product.averageMargin >= 30 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {product.averageMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 italic">
                  Nenhum dado de vendas disponível para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
