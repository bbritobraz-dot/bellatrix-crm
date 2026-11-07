"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createExpense, deleteExpense } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";

export function ExpensesTab({ expenses, setExpenses, categories, bankAccounts }: {
  expenses: any[]; setExpenses: any; categories: any[]; bankAccounts: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [catId, setCatId] = useState("");
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [dueDate, setDueDate] = useState("");
  const [method, setMethod] = useState("pix");
  const [bankAccountId, setBankAccountId] = useState("");

  const reset = () => { setDesc(""); setAmount(""); setCatId(""); setDueDate(""); setBankAccountId(""); };

  const handleSave = async () => {
    if (!desc || !amount || !catId || !bankAccountId) { alert("Preencha descrição, valor, categoria e conta bancária."); return; }
    setIsSaving(true);
    const res = await createExpense({
      description: desc, amount: Number(amount), category_id: catId,
      date, // "YYYY-MM-DD": o servidor converte no fuso de São Paulo
      due_date: dueDate || undefined,
      payment_method: method,
      bank_account_id: bankAccountId,
    });
    if (res.success) {
      const catName = categories.find(c => c.id === catId)?.name || "";
      const bankName = bankAccounts.find(b => b.id === bankAccountId)?.bank_name || "";
      setExpenses([{ id: Math.random().toString(), description: desc, amount, date, due_date: dueDate, category: { name: catName }, payment_method: method, bank_name: bankName }, ...expenses]);
      setIsOpen(false); reset();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir despesa?")) return;
    setExpenses(expenses.filter(e => e.id !== id));
    await deleteExpense(id);
  };

  const now = new Date();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Despesas Operacionais</h2>
        <button onClick={() => setIsOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-medium">Conta</th>
              <th className="px-5 py-3 font-medium text-right">Valor</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Nenhuma despesa registrada.</td></tr>
            ) : expenses.map(e => {
              const due = e.due_date ? new Date(e.due_date) : null;
              const overdue = due && due < now;
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3" data-label="Data">{new Date(e.date || e.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-3 font-medium text-slate-700" data-label="Despesa">{e.description}</td>
                  <td className="px-5 py-3" data-label="Cat"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{e.category?.name}</span></td>
                  <td className="px-5 py-3" data-label="Venc">
                    {due ? (
                      <span className={`text-xs px-2 py-1 rounded font-medium ${overdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                        {overdue ? "⚠️ " : "📅 "}{due.toLocaleDateString("pt-BR")}
                      </span>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500" data-label="Conta">{e.bank_account?.bank_name || e.bank_name || "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-rose-600" data-label="Valor">- R$ {Number(e.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right" data-label="Ação">
                    <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-xl font-bold text-slate-800">Nova Despesa</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Gasolina, Manutenção..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2.5 border" value={amount} onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" className="w-full border-slate-300 rounded-lg p-2.5 border" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
                <input type="date" className="w-full border-amber-300 rounded-lg p-2.5 border focus:ring-amber-400" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={catId} onChange={e => setCatId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                  <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                    <option value="credito">Cartão de Crédito</option>
                  </select>
                </div>
              </div>
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
            </div>
            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => { setIsOpen(false); reset(); }} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium" disabled={isSaving || !desc || !amount || !catId || !bankAccountId}>{isSaving ? "Salvando..." : "Registrar Despesa"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
