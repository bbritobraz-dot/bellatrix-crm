"use client";
import { round2 } from "@/lib/money";
import { printReceipt } from "@/lib/utils/print";
import { notify } from "@/lib/notify";
import { useState } from "react";
import { TrendingUp, User, Printer } from "lucide-react";
import { registerClientPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";


export function ReceivablesTab({ receivables, bankAccounts }: { receivables: any[]; bankAccounts: any[] }) {
  const [items, setItems] = useState(receivables);
  const [modal, setModal] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("pix");
  const [bankAccountId, setBankAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [payInstallments, setPayInstallments] = useState<number>(1);

  const total = items.reduce((acc, r) => acc + Number(r.pending_amount), 0);

  const statusLabel: Record<string, string> = {
    rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", em_producao: "Em Produção"
  };
  const statusColor: Record<string, string> = {
    rascunho: "bg-slate-100 text-slate-600", enviado: "bg-blue-100 text-blue-700",
    aprovado: "bg-emerald-100 text-emerald-700", em_producao: "bg-indigo-100 text-indigo-700"
  };

  const openModal = (receivable: any) => {
    setModal(receivable);
    setPayAmount("");
    setPayMethod("PIX");
    setBankAccountId("");
    setPayInstallments(1);
  };

  const handleRegisterPayment = async () => {
    if (!modal || !payAmount || Number(payAmount) <= 0 || !bankAccountId) return;
    setIsSaving(true);

    const res = await registerClientPayment({
      quote_id: modal.id,
      client_id: modal.client_id,
      amount: Number(payAmount),
      payment_method: payMethod,
      bank_account_id: bankAccountId,
      notes: `Pagamento parcial do cliente ${modal.client?.name}`,
      installments: payMethod === 'Cartão de Crédito' ? payInstallments : undefined,
    });

    if (res.success) {
      const currentPending = Number(modal.pending_amount || 0);
      const paidNow = Number(payAmount || 0);
      const newPending = round2(Math.max(currentPending - paidNow, 0));

      // Imprimir recibo com o saldo ATUALIZADO
      if (!printReceipt({
        clientName: modal.client?.name || "Cliente",
        amount: paidNow,
        method: payMethod,
        reference: modal.id,
        title: newPending > 0 ? "Comprovante de Pagamento" : "Comprovante de Quitação",
        remainingBalance: newPending,
      })) notify.warning("O navegador bloqueou a janela do recibo. Permita pop-ups para este site.");

      if (newPending <= 0) {
        setItems(items.filter(r => r.id !== modal.id));
      } else {
        setItems(items.map(r => r.id === modal.id ? { ...r, pending_amount: newPending, total_paid: (Number(r.total_paid) || 0) + paidNow } : r));
      }
      setModal(null);
    } else {
      notify.error(res.error || "Erro ao registrar pagamento.");
    }
    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-4 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm text-primary font-bold uppercase tracking-widest">Total a Receber dos Clientes</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Saldo pendente de todos os pedidos em aberto</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total do Pedido</th>
                <th className="px-6 py-3 font-medium">Já Recebido</th>
                <th className="px-6 py-3 font-medium text-right text-blue-700">Saldo a Receber</th>
                <th className="px-6 py-3 font-medium text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">✅ Nenhum valor pendente com clientes.</td></tr>
              ) : items.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4" data-label="Cliente">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 hidden sm:block" />
                      <span className="font-medium text-slate-700">{r.client?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Status">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor[r.status] || "bg-slate-100 text-slate-600"}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" data-label="Total">R$ {Number(r.total_sale_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium" data-label="Recebido">R$ {Number(r.total_paid || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-700" data-label="Pendente">R$ {Number(r.pending_amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center" data-label="Ação">
                    <button
                      onClick={() => openModal(r)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-1.5 rounded-lg w-full sm:w-auto"
                    >
                      + Registrar Pagamento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento Parcial */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Registrar Recebimento</h2>
              <p className="text-blue-100 text-sm mt-1">{modal.client?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-500">Total do Pedido</p>
                  <p className="text-lg font-bold text-slate-700">R$ {Number(modal.total_sale_price).toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-xs text-blue-600">Saldo Pendente</p>
                  <p className="text-lg font-bold text-blue-700">R$ {Number(modal.pending_amount).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Recebido Agora (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  className="w-full border-slate-300 rounded-lg p-2.5 border text-emerald-700 font-bold focus:ring-emerald-500 focus:border-emerald-500"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value ? parseFloat(e.target.value) : "")}
                />
                <p className="text-xs text-slate-400 mt-1">Pode ser parcial. Recibo PDF gerado automaticamente.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              {/* Seletor de Parcelas (Apenas para Crédito) */}
              {payMethod === 'Cartão de Crédito' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-indigo-600 mb-1">Parcelamento (Sem Juros)</label>
                  <select
                    className="w-full border-indigo-200 bg-indigo-50/50 rounded-lg p-2.5 border text-sm font-bold text-indigo-700"
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
              {payAmount !== "" && Number(payAmount) < Number(modal.pending_amount) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Saldo restante após: <strong>R$ {(Number(modal.pending_amount) - Number(payAmount)).toFixed(2)}</strong> — ficará em A Receber
                </div>
              )}
              {payAmount !== "" && Number(payAmount) >= Number(modal.pending_amount) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-semibold">
                  ✅ Pagamento completo — pedido será removido do A Receber
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <Printer className="w-4 h-4 text-slate-400" />
                Um recibo será aberto automaticamente para impressão / PDF
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleRegisterPayment} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2" disabled={isSaving || !payAmount || !bankAccountId}>
                <Printer className="w-4 h-4" />
                {isSaving ? "Registrando..." : "Confirmar e Emitir Recibo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
