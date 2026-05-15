"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Calendar, RotateCcw } from "lucide-react";
import { reopenQuote } from "@/app/actions/quotes";

export function FinishedClientView({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");

  const filteredQuotes = quotes.filter(q => 
    q.client?.name.toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleReopen = async (quoteId: string) => {
    if (!confirm("Deseja reabrir este pedido finalizado? Ele voltará para orçamentos como Rascunho.")) return;
    const res = await reopenQuote(quoteId);
    if (res.success) {
      setQuotes(quotes.filter(q => q.id !== quoteId));
      alert("✅ Pedido reaberto com sucesso! Agora ele está em Orçamentos.");
    } else {
      alert("Erro ao reabrir: " + res.error);
    }
  };

  return (
    <div>
      <div className="mb-6 relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="Buscar por cliente ou código..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.map(quote => {
          const now = new Date();
          const warrantyEnd = new Date(quote.warranty_end_date);
          const isWarrantyActive = now <= warrantyEnd;
          
          // Calcula quantos dias faltam para a garantia expirar
          const diffTime = warrantyEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const isExpiringSoon = isWarrantyActive && diffDays <= 30;

          return (
            <div key={quote.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1
                    ${isWarrantyActive ? (isExpiringSoon ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') : 'bg-rose-100 text-rose-700'}`}
                  >
                    {isWarrantyActive ? (isExpiringSoon ? <ShieldAlert className="w-3 h-3"/> : <ShieldCheck className="w-3 h-3"/>) : <ShieldAlert className="w-3 h-3"/>}
                    {isWarrantyActive ? (isExpiringSoon ? 'Garantia Perto do Fim' : 'Garantia Ativa') : 'Garantia Expirada'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono" title={quote.id}>
                    #{quote.id.split('-')[0]}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{quote.client?.name || "Cliente Desconhecido"}</h3>
                
                <div className="space-y-1 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400"/>
                    <span>Instalado: <span className="text-slate-700 font-medium">{new Date(quote.installation_date).toLocaleDateString('pt-BR')}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-slate-400"/>
                    <span>Vence em: <span className="text-slate-700 font-medium">{warrantyEnd.toLocaleDateString('pt-BR')}</span></span>
                  </div>
                </div>

                {quote.quote_items && quote.quote_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Produtos Instalados</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {quote.quote_items.map((item: any) => (
                        <li key={item.id} className="flex flex-col mb-1.5">
                          <div className="flex justify-between items-start">
                            <span className="truncate pr-2 font-medium">• {item.product?.name || "Produto genérico"}</span>
                            <span className="text-slate-500 text-xs shrink-0">{item.quantity} un</span>
                          </div>
                          {item.product?.line && (
                            <span className="text-xs text-slate-500 pl-3">
                              Linha: {item.product.line}
                              {item.notes && <span className="ml-1 text-indigo-600 font-medium">({item.notes})</span>}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Recebido</span>
                  <span className="text-sm font-bold text-emerald-600">
                    R$ {Number(quote.total_paid || quote.total_sale_price).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleReopen(quote.id)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Reabrir Orçamento"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                </button>
              </div>
            </div>
          );
        })}
        {filteredQuotes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            Nenhum pedido finalizado encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
