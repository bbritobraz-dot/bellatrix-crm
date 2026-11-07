"use client";
import { notify } from "@/lib/notify";

import { useState } from "react";
import { DollarSign, Printer, X } from "lucide-react";
import { registerClientPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "@/components/finance/BankAccountSelect";
import { printReceipt } from "@/lib/utils/print";

interface PaymentModalProps {
  quote: any;
  bankAccounts: any[];
  onClose: () => void;
  onSuccess: (quoteId: string, amount: number) => void;
}

export function PaymentModal({ quote, bankAccounts, onClose, onSuccess }: PaymentModalProps) {
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("PIX");
  const [bankAccountId, setBankAccountId] = useState("");
  const [payInstallments, setPayInstallments] = useState<number>(1);
  const [isPaying, setIsPaying] = useState(false);

  const handleRegisterPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0 || !bankAccountId) {
      notify.warning("Por favor, preencha o valor e selecione a conta bancária.");
      return;
    }
    setIsPaying(true);
    try {
      const res = await registerClientPayment({
        quote_id: quote.id,
        client_id: quote.client_id,
        amount: Number(payAmount),
        payment_method: payMethod,
        bank_account_id: bankAccountId,
        installments: payMethod === 'Cartão de Crédito' ? payInstallments : undefined,
        notes: `Pagamento parcial em produção`,
      });

      if (res.success) {
        const total = Number(quote.total_sale_price || 0);
        const paidBefore = Number(quote.total_paid || 0);
        const paidNow = Number(payAmount || 0);
        const newPending = Math.max(total - (paidBefore + paidNow), 0);

        printReceipt(quote.client?.name || "Cliente", paidNow, payMethod, quote.id, newPending);
        onSuccess(quote.id, paidNow);
        onClose();
      } else {
        notify.error("Erro ao registrar pagamento.");
      }
    } catch { 
      notify.error("Erro ao registrar pagamento."); 
    } finally { 
      setIsPaying(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        <div className="p-8 border-b border-border bg-success text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign className="w-16 h-16" /></div>
          <h2 className="text-2xl font-heading font-bold uppercase tracking-widest">Recebimento</h2>
          <p className="text-white/80 font-medium mt-1">{quote.client?.name}</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
              <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mb-1">Total</p>
              <p className="text-xl font-heading font-bold text-success">R$ {Number(quote.total_sale_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/20">
              <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-rose-500 mb-1">Pendente</p>
              <p className="text-xl font-heading font-bold text-rose-600">
                R$ {Math.max(Number(quote.total_sale_price) - Number(quote.total_paid || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mb-2">Valor do Pagamento</label>
              <input type="number" step="0.01" min="0" autoFocus
                className="w-full bg-card border-2 border-success/30 rounded-xl p-4 text-2xl font-heading font-bold text-success focus:ring-4 focus:ring-success/10 focus:border-success outline-none transition-all"
                value={payAmount} onChange={e => setPayAmount(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mb-2">Método</label>
                <select className="w-full bg-card border border-border rounded-xl p-3 font-medium text-sm outline-none focus:border-primary transition-all" 
                  value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                </select>
              </div>
              
              {payMethod === 'Cartão de Crédito' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-tertiary mb-2">Parcelamento</label>
                  <select
                    className="w-full border-2 border-tertiary/20 bg-tertiary/5 rounded-xl p-3 text-sm font-bold text-primary outline-none"
                    value={payInstallments}
                    onChange={(e) => setPayInstallments(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
            </div>
          </div>
        </div>
        <div className="p-8 border-t border-border bg-muted/20 flex justify-between gap-4">
          <button onClick={onClose} className="flex-1 px-6 py-3 text-slate-500 hover:text-primary font-heading font-bold uppercase tracking-widest transition-colors" disabled={isPaying}>Cancelar</button>
          <button onClick={handleRegisterPayment}
            className="flex-[2] px-6 py-4 bg-primary text-white hover:bg-primary/90 rounded-xl font-heading font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95"
            disabled={isPaying || !payAmount || !bankAccountId}>
            <Printer className="w-5 h-5 text-tertiary" />
            {isPaying ? "Processando..." : "Emitir Recibo"}
          </button>
        </div>
      </div>
    </div>
  );
}
