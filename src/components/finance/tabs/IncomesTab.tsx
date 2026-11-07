"use client";
import { printReceipt } from "@/lib/utils/print";
import { notify, confirmDialog } from "@/lib/notify";
import { useState } from "react";
import { Plus, Calendar, Printer } from "lucide-react";
import { registerPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";


const toNoonDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00-03:00` : d);

export function IncomesTab({ payments, setPayments, bankAccounts }: {
  payments: any[]; setPayments: any; bankAccounts: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("pix");
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [bankAccountId, setBankAccountId] = useState("");
  const [installments, setInstallments] = useState<number>(1);

  const handleSave = async () => {
    if (!desc || !amount || !bankAccountId) { notify.warning("Preencha descrição, valor e selecione uma conta bancária."); return; }
    setIsSaving(true);
    const res = await registerPayment({
      amount: Number(amount), payment_method: method,
      is_manual: true, manual_description: desc,
      bank_account_id: bankAccountId,
      payment_date: date,
      installments: method === 'Cartão de Crédito' ? installments : undefined,
    });
    if (res.success) {
      const bankName = bankAccounts.find(b => b.id === bankAccountId)?.bank_name || "";
      const newPayment = { id: Math.random().toString(), amount: Number(amount), payment_method: method, payment_date: new Date(date).toISOString(), manual_description: desc, is_manual: true, bank_name: bankName, client: null };
      setPayments([newPayment, ...payments]);
      setIsOpen(false); setDesc(""); setAmount(""); setBankAccountId("");
      
      if (await confirmDialog({ title: "Pagamento registrado", message: "Deseja emitir o recibo agora?", confirmLabel: "Emitir recibo", cancelLabel: "Agora não" })) {
        printReceipt({ clientName: "Cliente Avulso", amount: Number(amount), method, reference: desc, date: toNoonDate(date), title: "Comprovante de Pagamento" });
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Histórico de Recebimentos</h2>
        <button onClick={() => setIsOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Entrada Manual
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Descrição / Cliente</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Forma</th>
              <th className="px-5 py-3 font-medium text-right">Valor</th>
              <th className="px-5 py-3 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Nenhum recebimento registrado.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 flex items-center gap-2" data-label="Data">
                  <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
                  {new Date(p.payment_date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-5 py-3 font-medium text-slate-700" data-label="Cliente">
                  {p.is_manual ? (p.manual_description || "Entrada Manual") : (p.client?.name || p.quote?.client?.name || "—")}
                </td>
                <td className="px-5 py-3" data-label="Tipo">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${p.is_manual ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {p.is_manual ? "Manual" : "Pedido"}
                  </span>
                </td>
                <td className="px-5 py-3 capitalize" data-label="Forma">{p.payment_method}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600" data-label="Valor">+ R$ {Number(p.amount).toFixed(2)}</td>
                <td className="px-5 py-3 text-center" data-label="Recibo">
                  <button 
                    onClick={() => printReceipt({
                      clientName: p.client?.name || p.quote?.client?.name || "Cliente Bellatrix",
                      amount: Number(p.amount),
                      method: p.payment_method,
                      reference: p.manual_description || p.quote_id || undefined,
                      date: p.payment_date,
                      title: "Comprovante de Pagamento",
                      // reimpressão: o saldo atual não é o saldo da época, então não é exibido
                      remainingBalance: null,
                    })}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
                    title="Imprimir Recibo"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-xl font-bold text-slate-800">Nova Entrada Manual</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Venda avulsa, serviço extra..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2.5 border text-emerald-700 font-semibold" value={amount} onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" className="w-full border-slate-300 rounded-lg p-2.5 border" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              {/* Seletor de Parcelas */}
              {method === 'Cartão de Crédito' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-indigo-600 mb-1">Parcelamento (Sem Juros)</label>
                  <select
                    className="w-full border-indigo-200 bg-indigo-50/50 rounded-lg p-2.5 border text-sm font-bold text-indigo-700"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                    ))}
                  </select>
                </div>
              )}
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
            </div>
            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg" disabled={isSaving || !desc || !amount || !bankAccountId}>{isSaving ? "Salvando..." : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
