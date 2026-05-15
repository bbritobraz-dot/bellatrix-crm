"use client";

import { useState } from "react";
import { Save, Settings, X } from "lucide-react";
import { createCatalogItem } from "@/app/actions/catalog";

interface CatalogItemModalProps {
  activeTab: 'products' | 'accessories' | 'reforms';
  onClose: () => void;
  onSuccess: () => void;
}

export function CatalogItemModal({ activeTab, onClose, onSuccess }: CatalogItemModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    line: "vertical",
    cost_unit: "m2",
    supplier_cost: 0,
    sale_price: 0,
    colors: ""
  });

  const handleCreateNew = async () => {
    if (!newItem.name) { alert("Nome é obrigatório"); return; }
    setIsProcessing(true);
    
    const payload: any = {
      name: newItem.name,
      supplier_cost: newItem.supplier_cost,
      sale_price: newItem.sale_price,
      cost_unit: newItem.cost_unit
    };

    if (activeTab === 'products') {
      payload.line = newItem.line;
      payload.colors = newItem.colors;
    } else if (activeTab === 'accessories') {
      payload.slug = newItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^-|-$)+/g, '');
      payload.line = newItem.line;
    }

    const r = await createCatalogItem(activeTab, payload);
    if (r.success) {
      onSuccess();
      onClose();
    } else {
      alert("Erro ao criar: " + r.error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">
        {/* HEADER */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 bg-slate-50/50">
          <div>
            <h3 className="font-heading font-bold text-2xl text-slate-900 uppercase tracking-tighter">
              Novo Item
            </h3>
            <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Adicionar ao {activeTab === 'products' ? 'Persianas' : activeTab === 'accessories' ? 'Acessórios' : 'Reformas'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100"
          >
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        {/* CONTENT */}
        <div className="p-10 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
          <div className="space-y-3">
            <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Item</label>
            <input 
              type="text" 
              value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300"
              placeholder="Ex: Persiana Rolô Blackout"
            />
          </div>

          {(activeTab === 'products' || activeTab === 'accessories') && (
            <div className="space-y-3">
              <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Linha Vinculada</label>
              <div className="relative group">
                <select 
                  value={newItem.line} onChange={e => setNewItem({...newItem, line: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-heading font-bold uppercase text-[10px] tracking-widest text-slate-600 appearance-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                >
                  <option value="vertical">Vertical</option>
                  <option value="ph">Horizontal (PH)</option>
                  <option value="rolo">Rolô</option>
                  <option value="romana">Romana</option>
                  <option value="painel">Painel</option>
                  {activeTab === 'accessories' && <option value="geral">Geral (Todas as linhas)</option>}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <Settings className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Custo Fornecedor</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">R$</span>
                <input 
                  type="number" step="0.01" min="0"
                  value={newItem.supplier_cost} onChange={e => setNewItem({...newItem, supplier_cost: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 font-heading font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Preço Venda</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-vibrant-cyan/50 uppercase tracking-widest">R$</span>
                <input 
                  type="number" step="0.01" min="0"
                  value={newItem.sale_price} onChange={e => setNewItem({...newItem, sale_price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 font-heading font-bold text-sm text-vibrant-cyan focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Unidade de Cobrança</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'm2', label: 'm²' },
                { id: 'linear_m', label: 'Linear' },
                { id: 'unit', label: 'Unidade' }
              ].map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setNewItem({...newItem, cost_unit: unit.id})}
                  className={`py-4 px-4 rounded-2xl border-2 transition-all font-heading font-bold uppercase text-[10px] tracking-widest ${newItem.cost_unit === unit.id ? 'border-primary bg-primary text-vibrant-cyan shadow-lg shadow-primary/10' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'products' && (
            <div className="space-y-3">
              <label className="block font-heading font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] ml-1">Cores Disponíveis <span className="lowercase font-normal opacity-50">(separadas por vírgula)</span></label>
              <textarea 
                rows={3}
                value={newItem.colors} onChange={e => setNewItem({...newItem, colors: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all resize-none placeholder:text-slate-300"
                placeholder="Branco, Preto, Bege, Cinza..."
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row justify-end gap-4">
          <button 
            onClick={onClose} 
            className="btn-cancel px-10 py-4 !rounded-2xl"
          >
            Cancelar
          </button>
          <button 
            onClick={handleCreateNew}
            disabled={isProcessing || !newItem.name}
            className="px-10 py-4 bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest text-[10px] hover:bg-primary/95 rounded-2xl transition-all shadow-xl shadow-primary/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? 'Processando...' : <><Save className="w-4 h-4"/> Salvar Item</>}
          </button>
        </div>
      </div>
    </div>
  );
}
