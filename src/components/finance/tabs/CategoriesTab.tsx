"use client";
import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { createExpenseCategory } from "@/app/actions/finance";

export function CategoriesTab({ categories, setCategories }: { categories: any[]; setCategories: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const res = await createExpenseCategory(name);
    if (res.success && res.data) {
      setCategories([...categories, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsOpen(false); setName("");
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Categorias de Despesa</h2>
        <button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="border border-slate-200 rounded-lg p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${c.is_custom ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-700">{c.name}</span>
            {!c.is_custom && <span className="text-xs text-slate-400 ml-auto">Padrão</span>}
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-xl font-bold text-slate-800">Nova Categoria</h2></div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" placeholder="Ex: Aluguel" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
