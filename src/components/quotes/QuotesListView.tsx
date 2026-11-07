"use client";
import { round2 } from "@/lib/money";
import { printReceipt } from "@/lib/utils/print";
import { notify, confirmDialog } from "@/lib/notify";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Factory, ChevronRight, CheckCircle,
  CreditCard, Building2, AlertCircle, Pencil, RotateCcw, XCircle,
  Plus, FileText, Trash2, Download
} from "lucide-react";
import { BankAccountSelect } from "@/components/finance/BankAccountSelect";
import { moveToProduction, deleteQuote, updateQuoteStatus } from "@/app/actions/quotes";
import { ReopenQuoteDialog } from "@/components/quotes/ReopenQuoteDialog";
import { downloadQuotePdf } from "@/lib/quotes/pdfData";
import { registerPayment } from "@/app/actions/finance";


export function QuotesListView({ initialQuotes, bankAccounts }: { initialQuotes: any[], bankAccounts: any[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<any>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const [clientSignal, setClientSignal] = useState<number | "">("");
  const [clientMethod, setClientMethod] = useState("Dinheiro");

  const [supplierCost, setSupplierCost] = useState<number | "">("");
  const [supplierPaid, setSupplierPaid] = useState<number | "">("");
  const [supplierMethod, setSupplierMethod] = useState("pix");
  const [supplierBankId, setSupplierBankId] = useState("");
  const [clientBankId, setClientBankId] = useState("");
  const [clientInstallments, setClientInstallments] = useState<number>(1);

  const filteredQuotes = quotes.filter(q =>
    (q.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())
  );

  const openProductionModal = (quote: any) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
    setClientSignal("");
    setSupplierCost(quote.computed_supplier_cost > 0 ? quote.computed_supplier_cost : "");
    setSupplierPaid("");
    setSupplierBankId("");
    setClientBankId("");
  };

  const cashAccount = bankAccounts.find(b => b.bank_name === 'Caixa Físico (Dinheiro)');

  const supplierBalance = selectedQuote
    ? Math.max(Number(selectedQuote.computed_supplier_cost || 0) - Number(supplierPaid || 0), 0)
    : 0;

  const handleConfirmProduction = async () => {
    if (!selectedQuote) return;
    setIsProcessing(true);

    try {
      const autoSupplierCost = Number(selectedQuote.computed_supplier_cost || 0);
      const isSupplierDinheiro = supplierMethod === 'dinheiro';
      const isClientDinheiro = clientMethod === 'Dinheiro';

      const finalSupplierBankId = isSupplierDinheiro && cashAccount ? cashAccount.id : supplierBankId;
      const finalClientBankId = isClientDinheiro && cashAccount ? cashAccount.id : clientBankId;

      if ((autoSupplierCost > 0 && Number(supplierPaid) > 0 && !finalSupplierBankId) || 
          (Number(clientSignal) > 0 && !finalClientBankId)) {
        setIsProcessing(false);
        notify.warning("Selecione as contas bancárias correspondentes para os pagamentos.");
        return;
      }

      const productionResult = await moveToProduction(selectedQuote.id, autoSupplierCost > 0 ? {
        supplierCostTotal: autoSupplierCost,
        supplierPaid: Number(supplierPaid) || 0,
        paymentMethod: supplierMethod,
        bankAccountId: finalSupplierBankId || undefined,
      } : undefined);

      if (!productionResult.success) {
        setIsProcessing(false);
        notify.error("Erro ao enviar pedido para produção: " + productionResult.error);
        return;
      }

      if (clientSignal && Number(clientSignal) > 0) {
        const paymentResult = await registerPayment({
          quote_id: selectedQuote.id,
          client_id: selectedQuote.client_id,
          amount: Number(clientSignal),
          payment_method: clientMethod,
          bank_account_id: finalClientBankId,
          notes: "Sinal do Cliente na entrada para Produção",
          installments: clientMethod === 'Cartão de Crédito' ? clientInstallments : undefined,
        });

        if (!paymentResult.success) {
          setQuotes(quotes.filter(q => q.id !== selectedQuote.id));
          setIsModalOpen(false);
          setIsProcessing(false);
          notify.error("Pedido foi enviado para produção, mas o sinal do cliente não foi registrado: " + paymentResult.error);
          return;
        }

        const totalSale = Number(selectedQuote.total_sale_price || 0);
        const signalVal = Number(clientSignal || 0);
        const remaining = round2(Math.max(totalSale - signalVal, 0));

        if (!printReceipt({
          clientName: selectedQuote.client?.name || "Cliente",
          amount: signalVal,
          method: clientMethod,
          reference: selectedQuote.id,
          title: "Comprovante de Entrada",
          remainingBalance: remaining,
        })) notify.warning("O navegador bloqueou a janela do recibo. Permita pop-ups para este site.");
      }

      setQuotes(quotes.filter(q => q.id !== selectedQuote.id));
      setIsModalOpen(false);
      setIsProcessing(false);
      notify.success("Pedido enviado para produção!");
    } catch (error: any) {
      setIsProcessing(false);
      notify.error("Erro ao enviar pedido para produção: " + (error?.message || "tente novamente."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (quote: any) => {
    if (!(await confirmDialog({ danger: true, message: `Excluir o orçamento #${quote.id.split('-')[0].toUpperCase()} de ${quote.client?.name || "cliente"}?\n\nEssa ação não pode ser desfeita.` }))) return;
    const res = await deleteQuote(quote.id);
    if (res.success) {
      setQuotes(quotes.filter(q => q.id !== quote.id));
    } else {
      notify.error(res.error);
    }
  };

  const handleDownloadPdf = async (quote: any) => {
    setPdfLoadingId(quote.id);
    try {
      await downloadQuotePdf(quote);
    } catch (e: any) {
      notify.error("Erro ao gerar PDF: " + (e?.message || "tente novamente"));
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleStatusUpdate = async (quoteId: string, status: string) => {
    if (!(await confirmDialog({ message: `Alterar o status do orçamento para "${status}"?`, confirmLabel: "Alterar" }))) return;
    const res = await updateQuoteStatus(quoteId, status);
    if (res.success) {
      setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status } : q));
    } else {
      notify.error("Erro ao atualizar status: " + res.error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Orçamentos</h1>
          <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Propostas, Negociações e Fechamentos</p>
        </div>
        <button 
          onClick={() => router.push("/orcamentos/novo")}
          className="bg-primary text-vibrant-cyan hover:bg-primary/95 font-heading font-bold uppercase tracking-widest py-4 px-10 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-primary/10 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/>
          Novo Orçamento
        </button>
      </div>

      {/* CONTROLES E BUSCA */}
      <div className="relative group max-w-2xl">
        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar por cliente ou código..."
          className="w-full pl-14 pr-6 py-4.5 bg-white border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-sm shadow-sm placeholder:text-slate-300 text-slate-700 rounded-2xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredQuotes.map(quote => (
          <div key={quote.id} className="bg-white rounded-[2.5rem] border border-border p-8 flex flex-col justify-between group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-heading font-bold uppercase tracking-widest border shadow-sm
                  ${quote.status === 'aprovado' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    quote.status === 'enviado' ? 'bg-primary/5 border-primary/10 text-primary' :
                    quote.status === 'recusado' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                    quote.status === 'expirado' ? 'bg-slate-50 border-slate-100 text-slate-500' :
                    'bg-slate-50 border-slate-100 text-slate-500'}`}
                >
                  {quote.status}
                </span>
                <span className="text-[10px] text-slate-300 font-heading font-bold tracking-[0.2em] uppercase">
                  #{quote.id.split('-')[0].toUpperCase()}
                </span>
              </div>

              <h3 className="text-2xl font-heading font-bold text-slate-900 mb-1 uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                {quote.client?.name || "Cliente Desconhecido"}
              </h3>
              
              <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(quote.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="relative z-10 border-t border-slate-50 pt-8 mt-2">
              <div className="flex justify-between items-end mb-8">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-heading font-bold uppercase tracking-[0.2em] mb-2">Valor Total</span>
                  <span className="text-3xl font-heading font-bold text-slate-900 group-hover:text-primary transition-colors">
                    R$ {Number(quote.total_sale_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {(quote.status === 'rascunho' || quote.status === 'enviado' || quote.status === 'aprovado') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {quote.status === 'rascunho' && (
                        <button
                          onClick={() => router.push(`/orcamentos/${quote.id}/editar`)}
                          className="bg-slate-50 text-slate-600 hover:bg-slate-100 font-heading font-bold uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px]"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      )}
                      <button
                        onClick={() => openProductionModal(quote)}
                        className={`bg-primary text-vibrant-cyan hover:bg-primary/95 font-heading font-bold uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] shadow-lg shadow-primary/10 ${quote.status !== 'rascunho' ? 'col-span-2' : ''}`}
                      >
                        <Factory className="w-3.5 h-3.5" /> Produção
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleStatusUpdate(quote.id, 'enviado')}
                        className={`py-3 rounded-xl transition-all text-[9px] font-heading font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${quote.status === 'enviado' ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        Enviado
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(quote.id, 'aprovado')}
                        className={`py-3 rounded-xl transition-all text-[9px] font-heading font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${quote.status === 'aprovado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(quote.id, 'recusado')}
                        className="bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 py-3 rounded-xl transition-all text-[9px] font-heading font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3 h-3" /> Recusar
                      </button>
                    </div>
                  </>
                )}
                {(quote.status === 'recusado' || quote.status === 'expirado') && (
                  <button
                    onClick={() => setReopenTarget(quote)}
                    className="w-full bg-primary text-vibrant-cyan hover:bg-primary/95 font-heading font-bold uppercase tracking-widest py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px]"
                  >
                    <RotateCcw className="w-4 h-4" /> Reabrir Orçamento
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadPdf(quote)}
                    disabled={pdfLoadingId === quote.id}
                    className="bg-slate-50 text-slate-500 hover:bg-slate-100 py-3 rounded-xl transition-all text-[9px] font-heading font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" /> {pdfLoadingId === quote.id ? "Gerando..." : "PDF"}
                  </button>
                  <button
                    onClick={() => handleDelete(quote)}
                    className="bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 py-3 rounded-xl transition-all text-[9px] font-heading font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredQuotes.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-border border-dashed">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-200">
                <Search className="w-10 h-10" />
              </div>
              <p className="text-slate-400 font-heading font-bold uppercase tracking-widest text-sm">Nenhum orçamento encontrado</p>
              <p className="text-[11px] text-slate-300 uppercase tracking-widest mt-2">Tente ajustar seus termos de busca</p>
            </div>
          </div>
        )}
      </div>

      {reopenTarget && (
        <ReopenQuoteDialog
          quote={reopenTarget}
          onClose={() => setReopenTarget(null)}
          onDone={(id) => setQuotes(quotes.map(q => q.id === id ? { ...q, status: 'rascunho' } : q))}
        />
      )}

      {/* Modal de Produção Premium */}
      {isModalOpen && selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] w-full max-w-xl my-4 overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">

            <div className="p-10 bg-primary text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Factory className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-vibrant-cyan rounded-3xl flex items-center justify-center shadow-lg shadow-vibrant-cyan/20">
                  <Factory className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-bold uppercase tracking-tight">Produção</h2>
                  <p className="text-vibrant-cyan/80 font-heading font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">{selectedQuote.client?.name}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 relative z-10">
                <XCircle className="w-8 h-8"/>
              </button>
            </div>

            <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <h3 className="font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Procedimentos Automáticos
                </h3>
                <ul className="space-y-4 font-heading font-bold uppercase tracking-widest text-[10px]">
                  <li className="flex items-center gap-4 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-vibrant-cyan" />
                    <span>Mover para Kanban de Ativa</span>
                  </li>
                  <li className="flex items-center gap-4 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-vibrant-cyan" />
                    <span>Prazo: 10 dias úteis</span>
                  </li>
                  <li className="flex items-center gap-4 text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-vibrant-cyan" />
                    <span>Gerar Documentos de Fábrica</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-slate-900 uppercase tracking-widest text-xs flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" /> Custos da Fábrica
                  </h3>
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest">Previsão</span>
                </div>

                <div className="bg-primary p-10 rounded-[2rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-vibrant-cyan/20 opacity-50" />
                  <p className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-vibrant-cyan mb-4 relative z-10">Custo Total Calculado</p>
                  <p className="text-5xl font-heading font-bold relative z-10">R$ {Number(selectedQuote.computed_supplier_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Valor Pago Agora</label>
                    <input
                      type="number" step="0.01" min="0"
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                      value={supplierPaid}
                      onChange={(e) => setSupplierPaid(e.target.value ? parseFloat(e.target.value) : "")}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Meio de Saída</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all appearance-none"
                      value={supplierMethod}
                      onChange={(e) => setSupplierMethod(e.target.value)}
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência</option>
                      <option value="boleto">Boleto</option>
                    </select>
                  </div>
                </div>

                {supplierBalance > 0 && (
                  <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><AlertCircle className="w-6 h-6 text-rose-500" /></div>
                    <div>
                      <p className="text-[10px] text-rose-500 font-heading font-bold uppercase tracking-widest mb-1">Saldo Restante com Fábrica</p>
                      <p className="text-2xl font-heading font-bold text-rose-600">R$ {supplierBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <h3 className="font-heading font-bold text-slate-900 uppercase tracking-widest text-xs flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" /> Sinal do Cliente
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Valor Recebido</label>
                    <input
                      type="number" step="0.01" min="0"
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-emerald-600 focus:ring-4 focus:ring-emerald-500/5 focus:bg-white outline-none transition-all"
                      value={clientSignal}
                      onChange={(e) => setClientSignal(e.target.value ? parseFloat(e.target.value) : "")}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Meio de Recebto</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all appearance-none"
                      value={clientMethod}
                      onChange={(e) => setClientMethod(e.target.value)}
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Boleto">Boleto</option>
                    </select>
                  </div>
                </div>

                {clientMethod === 'Cartão de Crédito' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-3">
                    <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-primary ml-1">Número de Parcelas</label>
                    <select
                      className="w-full bg-primary text-vibrant-cyan border border-primary rounded-2xl p-5 font-heading font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                      value={clientInstallments}
                      onChange={(e) => setClientInstallments(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(Number(supplierPaid) > 0 || Number(clientSignal) > 0) && (
                <div className="space-y-8 pt-4">
                  <h3 className="font-heading font-bold text-slate-400 uppercase tracking-widest text-[10px]">Conciliação Bancária</h3>
                  
                  {Number(supplierPaid) > 0 && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Saída (Conta Fábrica)</label>
                      {supplierMethod === 'dinheiro' ? (
                        <div className="p-5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-heading font-bold uppercase tracking-widest border border-slate-200">
                          Fixado: Caixa Físico
                        </div>
                      ) : (
                        <BankAccountSelect accounts={bankAccounts} value={supplierBankId} onChange={setSupplierBankId} />
                      )}
                    </div>
                  )}
                  
                  {Number(clientSignal) > 0 && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400 ml-1">Entrada (Conta Cliente)</label>
                      {clientMethod === 'Dinheiro' ? (
                        <div className="p-5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-heading font-bold uppercase tracking-widest border border-slate-200">
                          Fixado: Caixa Físico
                        </div>
                      ) : (
                        <BankAccountSelect accounts={bankAccounts} value={clientBankId} onChange={setClientBankId} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-cancel px-10 py-5 !rounded-2xl"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmProduction}
                className="px-10 py-5 bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest hover:bg-primary/95 rounded-2xl transition-all shadow-[0_15px_30px_rgba(5,28,44,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                disabled={isProcessing || 
                  (Number(supplierPaid) > 0 && supplierMethod !== 'dinheiro' && !supplierBankId) || 
                  (Number(clientSignal) > 0 && clientMethod !== 'Dinheiro' && !clientBankId)
                }
              >
                {isProcessing ? "Enviando..." : "Iniciar Produção"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
