"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, Check, X, ArrowRightLeft } from "lucide-react";
import { createBankAccount, updateBankAccount, deleteBankAccount, transferFunds } from "@/app/actions/finance";

export function BankAccountsPanel({
  initialAccounts,
  onAccountsChange,
}: {
  initialAccounts: any[];
  onAccountsChange?: (accounts: any[]) => void;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isOpen, setIsOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [label, setLabel] = useState("");
  const [balance, setBalance] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number | "">("");

  // Transferência
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState<number | "">("");
  const [isTransferring, setIsTransferring] = useState(false);

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  const updateAccounts = (nextAccounts: any[]) => {
    setAccounts(nextAccounts);
    onAccountsChange?.(nextAccounts);
  };

  const handleCreate = async () => {
    if (!bankName || balance === "") return;
    setIsSaving(true);
    const res = await createBankAccount({ bank_name: bankName, account_label: label, balance: Number(balance) });
    if (res.success) {
      updateAccounts([...accounts, { id: Math.random().toString(), bank_name: bankName, account_label: label, balance }]);
      setIsOpen(false); setBankName(""); setLabel(""); setBalance("");
    }
    setIsSaving(false);
  };

  const handleUpdateBalance = async (id: string) => {
    if (editBalance === "") return;
    const res = await updateBankAccount(id, Number(editBalance));
    if (!res.success) { alert("Erro ao atualizar saldo: " + res.error); return; }
    updateAccounts(accounts.map(a => a.id === id ? { ...a, balance: editBalance } : a));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir conta bancária?")) return;
    const res = await deleteBankAccount(id);
    if (!res.success) { alert(res.error); return; }
    updateAccounts(accounts.filter(a => a.id !== id));
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount || Number(transferAmount) <= 0) return;
    if (transferFrom === transferTo) {
      alert("Selecione contas diferentes para transferência.");
      return;
    }
    setIsTransferring(true);
    const res = await transferFunds(transferFrom, transferTo, Number(transferAmount));
    if (res.success) {
      // Atualizar localmente
      updateAccounts(accounts.map(a => {
        if (a.id === transferFrom) return { ...a, balance: Number(a.balance) - Number(transferAmount) };
        if (a.id === transferTo) return { ...a, balance: Number(a.balance) + Number(transferAmount) };
        return a;
      }));
      setIsTransferModalOpen(false);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
    } else {
      alert(res.error);
    }
    setIsTransferring(false);
  };

  const bankColors = ["indigo", "blue", "emerald", "violet", "sky", "teal"];
  const getBankColor = (i: number) => bankColors[i % bankColors.length];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-md transition-all duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Contas Bancárias</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Consolidado:</span>
              <span className="text-xs font-bold text-primary">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsTransferModalOpen(true)} 
            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-100"
            disabled={accounts.length < 2}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transferência
          </button>
          <button 
            onClick={() => setIsOpen(true)} 
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-vibrant-cyan px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/10 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Conta
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-12 text-center bg-slate-50/50">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-300 mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-medium text-sm">Nenhuma conta bancária cadastrada.</p>
          <p className="text-[11px] text-slate-300 uppercase tracking-widest mt-1">Gerencie seu capital com facilidade</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account, i) => {
            const color = getBankColor(i);
            return (
              <div key={account.id} className={`group relative bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20 overflow-hidden`}>
                {/* Indicador de cor sutil */}
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-${color}-500 opacity-20`} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">{account.bank_name}</p>
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight line-clamp-1">{account.account_label || "Conta Principal"}</h4>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(account.id); setEditBalance(account.balance); }}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(account.id)} 
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 relative z-10">
                  {editingId === account.id ? (
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                      <input type="number" step="0.01" className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-sm font-bold text-primary"
                        value={editBalance} onChange={e => setEditBalance(e.target.value ? parseFloat(e.target.value) : "")} autoFocus />
                      <button onClick={() => handleUpdateBalance(account.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 active:scale-90 transition-all"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl active:scale-90 transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5">
                      <span className="text-sm font-medium text-slate-300 mb-1">R$</span>
                      <p className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">
                        {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Background Decor */}
                <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.03] bg-${color}-500`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Nova Conta */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-xl font-bold text-slate-800">Nova Conta Bancária</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Banco</label>
                <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="Ex: Nubank, Itaú, Bradesco..."
                  value={bankName} onChange={e => setBankName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="Ex: Conta Corrente PJ, Poupança..."
                  value={label} onChange={e => setLabel(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Atual (R$)</label>
                <input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2.5 border font-semibold text-indigo-600"
                  placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value ? parseFloat(e.target.value) : "")} />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium" disabled={isSaving || !bankName || balance === ""}>
                {isSaving ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferência */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b bg-emerald-50">
              <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" /> Transferência entre Contas
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta de Origem (Sai Dinheiro)</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border text-sm" value={transferFrom} onChange={e => setTransferFrom(e.target.value)}>
                  <option value="">Selecione...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} (R$ {Number(a.balance).toFixed(2)})</option>)}
                </select>
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                  <ArrowRightLeft className="w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta de Destino (Entra Dinheiro)</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border text-sm" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  <option value="">Selecione...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Transferência (R$)</label>
                <input type="number" step="0.01" min="0.01" className="w-full border-slate-300 rounded-lg p-2.5 border font-bold text-emerald-600"
                  placeholder="0.00" value={transferAmount} onChange={e => setTransferAmount(e.target.value ? parseFloat(e.target.value) : "")} />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsTransferModalOpen(false)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isTransferring}>Cancelar</button>
              <button onClick={handleTransfer} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold" disabled={isTransferring || !transferFrom || !transferTo || !transferAmount}>
                {isTransferring ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
