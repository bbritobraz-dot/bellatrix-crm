"use client";

import { useState } from "react";
import { Search, AlertCircle, Clock, CheckCircle, DollarSign, Factory, RotateCcw } from "lucide-react";
import { downloadFactoryOrderPdf } from "@/lib/quotes/pdfData";
import { ReopenQuoteDialog } from "@/components/quotes/ReopenQuoteDialog";
import { PaymentModal } from "./modals/PaymentModal";
import { FinishModal } from "./modals/FinishModal";
import { ScheduleModal } from "./modals/ScheduleModal";
import { timeOfDay } from "@/lib/dates";

export function ProductionClientView({
  initialQuotes, bankAccounts
}: {
  initialQuotes: any[];
  bankAccounts: any[];
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"producao" | "instalacao">("producao");

  // Modals state
  const [payQuote, setPayQuote] = useState<any | null>(null);
  const [finishQuote, setFinishQuote] = useState<any | null>(null);
  const [scheduleQuote, setScheduleQuote] = useState<any | null>(null);
  const [reopenQuoteTarget, setReopenQuoteTarget] = useState<any | null>(null);
  const [factoryLoadingId, setFactoryLoadingId] = useState<string | null>(null);

  const handleFactoryOrder = async (quote: any) => {
    setFactoryLoadingId(quote.id);
    try {
      await downloadFactoryOrderPdf(quote);
    } catch (e: any) {
      alert("Erro ao gerar pedido de fábrica: " + (e?.message || "tente novamente"));
    } finally {
      setFactoryLoadingId(null);
    }
  };

  const filteredQuotes = quotes.filter(q =>
    (q.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())) &&
    (activeTab === "producao" ? q.status === "em_producao" : q.status === "pronto_para_instalacao")
  );

  const handlePaymentSuccess = (quoteId: string, amount: number) => {
    setQuotes(prev => prev.map(q => q.id === quoteId
      ? { ...q, total_paid: (Number(q.total_paid) || 0) + amount }
      : q
    ));
  };

  const handleFinishSuccess = (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const handleScheduleSuccess = (quoteId: string, date: string, time: string) => {
    setQuotes(prev => prev.map(q => q.id === quoteId 
      ? { ...q, status: "pronto_para_instalacao", installation_date: `${date}T${time}:00-03:00` } 
      : q
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex bg-white p-1.5 rounded-2xl border border-border shadow-sm">
          <button
            onClick={() => setActiveTab("producao")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
              activeTab === "producao" 
                ? "bg-primary text-vibrant-cyan shadow-lg shadow-primary/20 scale-105" 
                : "text-slate-400 hover:text-primary hover:bg-slate-50"
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === "producao" ? "text-vibrant-cyan" : "text-primary"}`} />
            <span className="text-[11px] font-heading font-bold uppercase tracking-widest">Na Fábrica</span>
          </button>
          <button
            onClick={() => setActiveTab("instalacao")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${
              activeTab === "instalacao" 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                : "text-slate-400 hover:text-emerald-500 hover:bg-slate-50"
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${activeTab === "instalacao" ? "text-white" : "text-emerald-500"}`} />
            <span className="text-[11px] font-heading font-bold uppercase tracking-widest">Prontos para Instalar</span>
          </button>
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar por cliente ou código do pedido..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-sm shadow-sm placeholder:text-slate-300 text-slate-700"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-responsive-stack">
            <thead className="bg-slate-50/50 border-b border-border">
              <tr>
                <th className="px-8 py-6 font-heading font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500">Pedido / Cliente</th>
                <th className="px-8 py-6 font-heading font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500">{activeTab === "producao" ? "Início Produção" : "Data Instalação"}</th>
                <th className="px-8 py-6 font-heading font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500">Prazo Estimado</th>
                <th className="px-8 py-6 font-heading font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500">Pagamento</th>
                <th className="px-8 py-6 font-heading font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-medium">Nenhum pedido encontrado nesta etapa.</p>
                      <p className="text-[11px] text-slate-300 uppercase tracking-widest mt-1">Sua fábrica está em dia!</p>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.map(quote => {
                const now = new Date();
                const forecast = new Date(quote.delivery_forecast_date);
                const isDelayed = now > forecast;
                const total = Number(quote.total_sale_price) || 0;
                const paid = Number(quote.total_paid) || 0;
                const pending = Math.max(total - paid, 0);
                const isFullyPaid = paid >= total;
                const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

                return (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6" data-label="Cliente">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-base group-hover:text-primary transition-colors leading-tight">{quote.client?.name || "Cliente"}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: #{quote.id.split("-")[0].toUpperCase()}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{quote.quote_items?.length || 0} Itens</span>
                        </div>
                        <div className="mt-4 space-y-2 hidden md:block">
                          {quote.quote_items?.map((item: any) => (
                            <div key={item.id} className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                              <span className="text-slate-900 font-bold">{item.quantity}x</span> {item.product?.name}
                              {item.notes && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase border border-slate-200">{item.notes}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6" data-label={activeTab === "producao" ? "Início" : "Instalação"}>
                      <div className="flex items-center gap-2.5 text-slate-600 font-bold text-xs">
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        {activeTab === "producao" 
                          ? new Date(quote.production_start_date).toLocaleDateString("pt-BR")
                          : new Date(quote.installation_date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) + " " + timeOfDay(quote.installation_date)}
                      </div>
                    </td>
                    <td className="px-8 py-6" data-label="Prazo">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border ${isDelayed ? "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5" : "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/5"}`}>
                        {isDelayed ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {forecast.toLocaleDateString("pt-BR")}
                        {isDelayed && <span className="ml-1 border-l border-rose-200 pl-2">Atrasado</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6 min-w-[200px]" data-label="Pagamento">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden hidden md:block">
                        <div className={`h-full transition-all duration-1000 ${isFullyPaid ? "bg-emerald-500" : "bg-primary shadow-[0_0_8px_rgba(5,28,44,0.3)]"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.1em]">
                          <span className="text-emerald-600">Recebido R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-slate-300">{pct.toFixed(0)}%</span>
                        </div>
                        {pending > 0 && (
                          <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Pendente R$ {pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right" data-label="Ações">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleFactoryOrder(quote)}
                          disabled={factoryLoadingId === quote.id}
                          title="Baixar pedido de produção para a fábrica"
                          className="bg-white text-slate-600 border border-slate-200 hover:border-primary px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          <Factory className="w-3 h-3" /> {factoryLoadingId === quote.id ? "Gerando..." : "Pedido fábrica"}
                        </button>
                        <button
                          onClick={() => setReopenQuoteTarget(quote)}
                          title="Reabrir como rascunho"
                          className="bg-white text-slate-400 border border-slate-200 hover:text-primary hover:border-primary px-3 py-3 rounded-2xl transition-all active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        {!isFullyPaid && (
                          <button
                            onClick={() => setPayQuote(quote)}
                            className="bg-emerald-500 text-white hover:bg-emerald-600 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <DollarSign className="w-3 h-3" /> Pagar
                          </button>
                        )}
                        {activeTab === "producao" ? (
                          <button
                            onClick={() => setScheduleQuote(quote)}
                            className="bg-primary text-vibrant-cyan hover:bg-primary/90 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95"
                          >
                            Agendar
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setScheduleQuote(quote)}
                              className="bg-white text-primary border border-slate-200 hover:border-primary px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                            >
                              Reagendar
                            </button>
                            <button
                              onClick={() => setFinishQuote(quote)}
                              className="bg-primary text-vibrant-cyan hover:bg-primary/90 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                              Finalizar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Rendering */}
      {reopenQuoteTarget && (
        <ReopenQuoteDialog
          quote={reopenQuoteTarget}
          onClose={() => setReopenQuoteTarget(null)}
          onDone={(id) => setQuotes(quotes.filter(q => q.id !== id))}
        />
      )}
      {payQuote && (
        <PaymentModal 
          quote={payQuote} 
          bankAccounts={bankAccounts} 
          onClose={() => setPayQuote(null)} 
          onSuccess={handlePaymentSuccess}
        />
      )}

      {finishQuote && (
        <FinishModal 
          quote={finishQuote} 
          bankAccounts={bankAccounts} 
          onClose={() => setFinishQuote(null)} 
          onSuccess={handleFinishSuccess}
        />
      )}

      {scheduleQuote && (
        <ScheduleModal 
          quote={scheduleQuote} 
          onClose={() => setScheduleQuote(null)} 
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
}
