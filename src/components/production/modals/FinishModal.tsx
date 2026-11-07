"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { finishOrder } from "@/app/actions/quotes";
import { BankAccountSelect } from "@/components/finance/BankAccountSelect";
import { printReceipt } from "@/lib/utils/print";

interface FinishModalProps {
  quote: any;
  bankAccounts: any[];
  onClose: () => void;
  onSuccess: (quoteId: string) => void;
}

export function FinishModal({ quote, bankAccounts, onClose, onSuccess }: FinishModalProps) {
  const [finishAmount, setFinishAmount] = useState<number | "">("");
  const [finishMethod, setFinishMethod] = useState("Dinheiro");
  const [finishBankId, setFinishBankId] = useState("");
  const [finishInstallments, setFinishInstallments] = useState<number>(1);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const saldo = Math.max(Number(quote.total_sale_price) - Number(quote.total_paid || 0), 0);
    setFinishAmount(saldo > 0 ? saldo : "");
  }, [quote]);

  const handleFinish = async () => {
    if (finishAmount && Number(finishAmount) > 0 && !finishBankId) {
      alert("Por favor, selecione a conta bancária para receber o saldo.");
      return;
    }
    setIsFinishing(true);
    try {
      // Recebimento + finalização numa única transação: ou tudo, ou nada
      const amount = Number(finishAmount || 0);
      const finishRes = await finishOrder(quote.id, amount > 0 ? {
        amount,
        method: finishMethod,
        bankAccountId: finishBankId,
        installments: finishMethod === 'Cartão de Crédito' ? finishInstallments : undefined,
      } : undefined);
      if (!finishRes.success) {
        alert("Não foi possível finalizar: " + finishRes.error + "\nNada foi registrado.");
        return;
      }
      if (amount > 0) {
        const remaining = Math.max(Number(quote.total_sale_price) - Number(quote.total_paid || 0) - amount, 0);
        printReceipt(quote.client?.name || "Cliente", amount, finishMethod, quote.id, remaining);
      }
      onSuccess(quote.id);
      onClose();
      alert("Instalação concluída e Garantia ativada!");
    } catch { 
      alert("Erro ao finalizar o pedido."); 
    } finally { 
      setIsFinishing(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
        <div className="p-8 border-b border-border bg-primary text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tertiary/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-tertiary" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold uppercase tracking-widest">Finalizar Obra</h2>
            <p className="text-white/60 font-medium text-sm">Ativação de Garantia e Quitação</p>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-muted/40 p-5 rounded-2xl border border-border">
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-primary mb-3">Protocolo de Encerramento:</h3>
            <ul className="space-y-2">
              <li className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Pedido movido para o histórico de finalizados
              </li>
              <li className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Certificado de garantia de 1 ano gerado
              </li>
              {finishAmount && Number(finishAmount) > 0 && (
                <li className="text-xs font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Liquidação de saldo remanescente
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">Liquidação de Saldo (Se houver)</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.01" min="0" placeholder="0,00"
                className="bg-card border border-border rounded-xl p-3 font-heading font-bold text-lg text-success outline-none focus:border-success transition-all"
                value={finishAmount} onChange={e => setFinishAmount(e.target.value ? parseFloat(e.target.value) : "")} />
              
              <select className="bg-card border border-border rounded-xl p-3 font-medium text-sm outline-none focus:border-primary" 
                value={finishMethod} onChange={e => setFinishMethod(e.target.value)}>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
              </select>
            </div>
            
            {finishMethod === 'Cartão de Crédito' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <select
                  className="w-full border-2 border-tertiary/20 bg-tertiary/5 rounded-xl p-3 text-sm font-bold text-primary"
                  value={finishInstallments}
                  onChange={(e) => setFinishInstallments(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                  ))}
                </select>
              </div>
            )}
            
            <BankAccountSelect accounts={bankAccounts} value={finishBankId} onChange={setFinishBankId} />
          </div>
        </div>
        <div className="p-8 border-t border-border bg-white flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-rose-600 text-white hover:bg-rose-700 font-heading font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all" disabled={isFinishing}>Voltar</button>
          <button onClick={handleFinish}
            className="px-8 py-4 bg-success text-primary hover:bg-success/90 rounded-xl font-heading font-bold uppercase tracking-widest shadow-lg shadow-success/20 transition-all active:scale-95 flex items-center gap-2"
            disabled={isFinishing || (Number(finishAmount) > 0 && !finishBankId)}>
            {isFinishing ? "Processando..." : "Concluir e Liberar Recibo"}
          </button>
        </div>
      </div>
    </div>
  );
}
