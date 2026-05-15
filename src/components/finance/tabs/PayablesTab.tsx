"use client";
import { useState } from "react";
import { AlertCircle, Building2, FileText, CheckCircle } from "lucide-react";
import { liquidateExpense, liquidateSupplierPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";

type Payables = { expenses: any[]; supplierPayables: any[] };

export function PayablesTab({ payables, bankAccounts }: { payables: Payables; bankAccounts: any[] }) {
  const now = new Date();
  const [items, setItems] = useState(payables);
  const [modal, setModal] = useState<{ type: "expense" | "supplier"; item: any } | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("pix");
  const [bankAccountId, setBankAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const allItems = [
    ...items.supplierPayables.map(s => ({ ...s, type: "fornecedor" })),
    ...items.expenses.filter(e => !e.is_paid).map(e => ({ ...e, type: "despesa" })),
  ].sort((a, b) => {
    const da = new Date(a.due_date || 0);
    const db = new Date(b.due_date || 0);
    return da.getTime() - db.getTime();
  });

  const total = allItems.reduce((acc, i) => acc + Number(i.amount), 0);

  const openModal = (type: "expense" | "supplier", item: any) => {
    setModal({ type, item });
    setPayAmount(Number(item.amount));
    setPayMethod("pix");
    setBankAccountId("");
  };

  const handleLiquidate = async () => {
    if (!modal || !payAmount || !bankAccountId) {
      alert("Por favor, selecione a conta bancária.");
      return;
    }
    setIsSaving(true);
    let res;
    if (modal.type === "expense") {
      res = await liquidateExpense(modal.item.id, { paid_amount: Number(payAmount), paid_method: payMethod, bank_account_id: bankAccountId });
      if (res.success) {
        setItems(prev => ({
          ...prev,
          expenses: prev.expenses.map(e => e.id === modal.item.id ? { ...e, is_paid: true } : e)
        }));
      }
    } else {
      res = await liquidateSupplierPayment(modal.item.id, { amount: Number(payAmount), payment_method: payMethod, bank_account_id: bankAccountId });
      if (res?.success) {
        const newBalance = Math.max(Number(modal.item.amount) - Number(payAmount), 0);
        setItems(prev => ({
          ...prev,
          supplierPayables: newBalance <= 0
            ? prev.supplierPayables.filter(s => s.id !== modal.item.id)
            : prev.supplierPayables.map(s => s.id === modal.item.id ? { ...s, amount: newBalance } : s)
        }));
      }
    }
    if (res?.success) { setModal(null); }
    else { alert("Erro ao registrar pagamento."); }
    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <div>
            <p className="text-sm text-amber-700 font-medium">Total a Pagar</p>
            <p className="text-xs text-amber-500">Fornecedores + Despesas com vencimento pendente</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-amber-700">R$ {total.toFixed(2)}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium">Vencimento</th>
                <th className="px-6 py-3 font-medium text-right">Valor Pendente</th>
                <th className="px-6 py-3 font-medium text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allItems.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">✅ Nenhuma conta a pagar pendente.</td></tr>
              ) : allItems.map((item, i) => {
                const dueDate = item.due_date ? new Date(item.due_date) : null;
                const isOverdue = dueDate && dueDate < now;
                const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : null;
                return (
                  <tr key={i} className={`hover:bg-slate-50 ${isOverdue ? "bg-rose-50/40" : ""}`}>
                    <td className="px-6 py-4" data-label="Tipo">
                      {item.type === "fornecedor" ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium w-fit">
                          <Building2 className="w-3 h-3" /> Fornecedor
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium w-fit">
                          <FileText className="w-3 h-3" /> Despesa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate" data-label="Descrição">{item.description}</td>
                    <td className="px-6 py-4 text-xs" data-label="Cat">{item.category?.name || "—"}</td>
                    <td className="px-6 py-4" data-label="Venc">
                      {dueDate ? (
                        <span className={`text-xs px-2 py-1 rounded font-medium ${isOverdue ? "bg-rose-100 text-rose-700" : daysLeft !== null && daysLeft <= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {isOverdue ? `⚠️ Venceu ${Math.abs(daysLeft!)}d atrás` : daysLeft === 0 ? "⏰ Hoje" : `📅 ${dueDate.toLocaleDateString("pt-BR")} (${daysLeft}d)`}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-700" data-label="Pendente">R$ {Number(item.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center" data-label="Ação">
                      <button
                        onClick={() => openModal(item.type === "fornecedor" ? "supplier" : "expense", item)}
                        className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 w-full sm:w-auto sm:mx-auto"
                      >
                        <CheckCircle className="w-3 h-3" /> Liquidar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Liquidação */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-emerald-600 text-white">
              <h2 className="text-xl font-bold">Registrar Pagamento</h2>
              <p className="text-emerald-100 text-sm mt-1 truncate">{modal.item.description}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                Saldo pendente: <strong>R$ {Number(modal.item.amount).toFixed(2)}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Pago Agora (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  className="w-full border-slate-300 rounded-lg p-2.5 border text-emerald-700 font-bold focus:ring-emerald-500 focus:border-emerald-500"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value ? parseFloat(e.target.value) : "")}
                />
                <p className="text-xs text-slate-400 mt-1">Pode ser parcial — o saldo restante continuará no A Pagar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="credito">Cartão de Crédito</option>
                </select>
              </div>
              {payMethod === 'dinheiro' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm font-medium text-amber-800">
                  ⚠️ Por favor, selecione a conta "Caixa Físico" ou altere a forma de pagamento.
                </div>
              ) : null}
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
              {payAmount !== "" && Number(payAmount) < Number(modal.item.amount) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  Saldo restante após este pagamento: <strong>R$ {(Number(modal.item.amount) - Number(payAmount)).toFixed(2)}</strong>
                </div>
              )}
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleLiquidate} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold" disabled={isSaving || !payAmount || !bankAccountId}>
                {isSaving ? "Salvando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
