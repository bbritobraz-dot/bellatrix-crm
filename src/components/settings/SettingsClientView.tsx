"use client";

import { useState } from "react";
import { KeyRound, LogOut, UserCircle } from "lucide-react";
import { changePassword, logout } from "@/app/actions/auth";
import { SettingsTab } from "@/components/finance/tabs/SettingsTab";
import { CategoriesTab } from "@/components/finance/tabs/CategoriesTab";
import { notify, confirmDialog } from "@/lib/notify";

export function SettingsClientView({
  email,
  cardFees,
  categories: initialCategories,
}: {
  email: string | null;
  cardFees: any[];
  categories: any[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { notify.warning("A confirmação não confere com a nova senha."); return; }
    setSaving(true);
    const res = await changePassword(current, next);
    setSaving(false);
    if (!res.success) { notify.error(res.error); return; }
    setCurrent(""); setNext(""); setConfirm("");
    notify.success("Senha alterada com sucesso.");
  };

  const handleLogout = async () => {
    if (!(await confirmDialog({ title: "Sair", message: "Deseja sair do CRM neste aparelho?", confirmLabel: "Sair" }))) return;
    await logout();
    window.location.href = "/login";
  };

  const input = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5";

  return (
    <div className="space-y-8">
      {/* MINHA CONTA */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg"><UserCircle className="w-6 h-6 text-sky-700" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Minha conta</h2>
              <p className="text-sm text-slate-600">Conectado como <b>{email || "—"}</b></p>
            </div>
          </div>
          <button onClick={handleLogout} className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-600 hover:text-white text-sm font-bold transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Senha atual</label>
            <input type="password" autoComplete="current-password" required className={input} value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nova senha</label>
            <input type="password" autoComplete="new-password" required minLength={8} className={input} value={next} onChange={e => setNext(e.target.value)} placeholder="mín. 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmar nova senha</label>
            <input type="password" autoComplete="new-password" required minLength={8} className={input} value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl disabled:opacity-50">
            <KeyRound className="w-4 h-4" /> {saving ? "Salvando..." : "Trocar senha"}
          </button>
        </form>
      </section>

      {/* TAXAS DE CARTÃO */}
      <SettingsTab initialSettings={cardFees} />

      {/* CATEGORIAS */}
      <CategoriesTab categories={categories} setCategories={setCategories} />
    </div>
  );
}
