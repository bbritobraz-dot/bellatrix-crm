"use client";
import { notify, confirmDialog } from "@/lib/notify";

import { useState } from "react";
import { Search, Package, Wrench, Settings, Edit3, X, Check, Trash2, Plus } from "lucide-react";
import { updateCatalogItem, deleteCatalogItem } from "@/app/actions/catalog";
import { CatalogItemModal } from "./modals/CatalogItemModal";

type Tab = 'products' | 'accessories' | 'reforms';

export function CatalogView({ 
  initialProducts, 
  initialAccessories, 
  initialReforms 
}: { 
  initialProducts: any[], 
  initialAccessories: any[], 
  initialReforms: any[] 
}) {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [searchTerm, setSearchTerm] = useState("");
  const [lineFilter, setLineFilter] = useState("");
  
  // Estados para edição in-line
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSupplierCost, setEditSupplierCost] = useState<number>(0);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editColors, setEditColors] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditSupplierCost(item.supplier_cost || 0);
    setEditSalePrice(item.sale_price || 0);
    setEditColors(item.colors || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (table: Tab) => {
    if (!editingId) return;
    setIsProcessing(true);
    
    const payload: any = {
      supplier_cost: editSupplierCost,
      sale_price: editSalePrice,
    };

    if (table === 'products') {
      payload.colors = editColors;
    }

    const r = await updateCatalogItem(table, editingId, payload);
    
    if (!r.success) {
      notify.error("Erro ao salvar: " + r.error);
    }
    
    setIsProcessing(false);
    setEditingId(null);
  };

  const handleDelete = async (table: Tab, id: string) => {
    if (!(await confirmDialog({ message: "Tem certeza que deseja excluir este item do catálogo?", danger: true }))) return;
    setIsProcessing(true);
    const r = await deleteCatalogItem(table, id);
    if (!r.success) notify.error("Erro ao excluir: " + r.error);
    setIsProcessing(false);
  };

  const getFilteredItems = (items: any[]) => {
    return items.filter(i => {
      const matchName = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLine = lineFilter && activeTab === 'products' ? i.line === lineFilter : true;
      return matchName && matchLine;
    });
  };

  const renderCards = (items: any[], table: Tab) => {
    const filtered = getFilteredItems(items);

    return (
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-border p-12 text-center">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400">Nenhum item encontrado</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isEditing = editingId === item.id;
            const cost = isEditing ? editSupplierCost : (item.supplier_cost || 0);
            const price = isEditing ? editSalePrice : (item.sale_price || 0);
            const marginPercent = cost > 0 ? ((price - cost) / cost) * 100 : 100;

            return (
              <div key={item.id} className="bg-white border border-border p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-slate-900 text-base uppercase tracking-tight leading-tight">{item.name}</h3>
                    {table === 'products' && (
                      <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-heading font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-200/50">
                        {item.line}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <button 
                          onClick={() => startEditing(item)} 
                          className="w-9 h-9 bg-slate-50 text-slate-400 hover:bg-primary hover:text-vibrant-cyan rounded-xl transition-all flex items-center justify-center active:scale-90"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(table, item.id)} 
                          className="w-9 h-9 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Unidade</p>
                    <p className="text-[10px] font-comfortaa text-slate-700 font-bold">
                      {item.cost_unit === 'm2' ? 'Metro Quadrado' : item.cost_unit === 'linear_m' ? 'Metro Linear' : 'Unidade'}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Margem</p>
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-heading font-bold border ${marginPercent >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {marginPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {table === 'products' && (
                  <div className="mb-6">
                    <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-2">Cores Disponíveis</p>
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-[11px] font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                        value={editColors}
                        onChange={(e) => setEditColors(e.target.value)}
                      />
                    ) : (
                      <p className="text-[10px] font-comfortaa text-slate-500">{item.colors || 'Nenhuma cor especificada'}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Custo Fornec.</span>
                      {isEditing ? (
                        <input 
                          type="number" step="0.01"
                          className="w-28 bg-white border border-border rounded-xl px-3 py-2 text-right font-heading font-bold text-primary text-xs outline-none"
                          value={editSupplierCost}
                          onChange={(e) => setEditSupplierCost(parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        <p className="text-sm font-heading font-bold text-slate-500">
                          <span className="text-[10px] opacity-40 mr-1">R$</span>
                          {Number(item.supplier_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-heading font-bold text-primary uppercase tracking-widest mb-1">Preço Venda</span>
                      {isEditing ? (
                        <input 
                          type="number" step="0.01"
                          className="w-28 bg-white border border-primary/20 rounded-xl px-3 py-2 text-right font-heading font-bold text-primary text-xs outline-none"
                          value={editSalePrice}
                          onChange={(e) => setEditSalePrice(parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        <p className="text-xl font-heading font-bold text-vibrant-cyan">
                          <span className="text-xs font-normal opacity-60 mr-1">R$</span>
                          {Number(item.sale_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => saveEditing(table)} 
                        disabled={isProcessing}
                        className="flex-1 bg-emerald-500 text-white font-heading font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5" /> Salvar Alterações
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        disabled={isProcessing}
                        className="btn-cancel px-4 !rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    );
  };

  const renderTable = (items: any[], table: Tab) => {
    const filtered = getFilteredItems(items);

    return (
      <div className="hidden md:block bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Produto / Serviço</th>
                {table === 'products' && <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Linha</th>}
                {table === 'products' && <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Cores</th>}
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Und</th>
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Custo Fornec.</th>
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">Preço Venda</th>
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] text-center">Margem</th>
                <th className="px-8 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={table === 'products' ? 8 : 6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                        <Package className="w-8 h-8" />
                      </div>
                      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400">Nenhum item encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isEditing = editingId === item.id;
                  const cost = isEditing ? editSupplierCost : (item.supplier_cost || 0);
                  const price = isEditing ? editSalePrice : (item.sale_price || 0);
                  const marginPercent = cost > 0 ? ((price - cost) / cost) * 100 : 100;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-heading font-bold text-slate-900 text-[13px] uppercase tracking-tight group-hover:text-primary transition-colors max-w-[220px] truncate" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      
                      {table === 'products' && (
                        <td className="px-8 py-6">
                          <span className="text-[9px] font-heading font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                            {item.line}
                          </span>
                        </td>
                      )}
                      
                      {table === 'products' && (
                        <td className="px-8 py-6">
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-[11px] font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                              placeholder="Cores..."
                              value={editColors}
                              onChange={(e) => setEditColors(e.target.value)}
                            />
                          ) : (
                            <span className="text-slate-400 text-[10px] font-medium truncate max-w-[150px] inline-block" title={item.colors}>
                              {item.colors || '-'}
                            </span>
                          )}
                        </td>
                      )}

                      <td className="px-8 py-6">
                        <span className="text-slate-400 font-heading font-bold uppercase text-[10px] tracking-tighter">
                          {item.cost_unit === 'm2' ? 'm²' : item.cost_unit === 'linear_m' ? 'Linear' : 'Und'}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right">
                        {isEditing ? (
                          <div className="flex justify-end">
                            <input 
                              type="number" step="0.01" min="0"
                              className="w-32 bg-white border border-border rounded-xl px-4 py-2.5 text-right font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                              value={editSupplierCost}
                              onChange={(e) => setEditSupplierCost(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ) : (
                          <span className="text-slate-400 font-heading font-bold text-sm">
                            <span className="text-[10px] opacity-40 mr-1">R$</span>
                            {Number(item.supplier_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-6 text-right">
                        {isEditing ? (
                          <div className="flex justify-end">
                            <input 
                              type="number" step="0.01" min="0"
                              className="w-32 bg-white border border-primary/20 rounded-xl px-4 py-2.5 text-right font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                              value={editSalePrice}
                              onChange={(e) => setEditSalePrice(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ) : (
                          <span className="text-vibrant-cyan font-heading font-bold text-sm">
                            <span className="text-[10px] opacity-40 mr-1">R$</span>
                            {Number(item.sale_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-heading font-bold uppercase tracking-wider border ${marginPercent >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                          {marginPercent.toFixed(0)}%
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => saveEditing(table)} 
                                disabled={isProcessing} 
                                className="w-10 h-10 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-90 disabled:opacity-50 flex items-center justify-center"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={cancelEditing} 
                                disabled={isProcessing} 
                                className="btn-cancel w-10 h-10 !rounded-xl flex items-center justify-center p-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEditing(item)} 
                                className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-primary hover:text-vibrant-cyan rounded-xl transition-all flex items-center justify-center border border-transparent hover:shadow-lg hover:shadow-primary/10 active:scale-90"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(table, item.id)} 
                                disabled={isProcessing} 
                                className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center border border-transparent hover:shadow-lg hover:shadow-rose-500/10 active:scale-90 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Catálogo</h1>
          <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Gestão de Produtos, Acessórios e Serviços</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-vibrant-cyan hover:bg-primary/95 font-heading font-bold uppercase tracking-widest py-4 px-10 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-primary/10 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/>
          Novo Item
        </button>
      </div>

      {/* NAVEGAÇÃO E FILTROS LUMINA */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 shadow-inner w-full xl:w-auto overflow-x-auto scrollbar-hide">
          {[
            { id: 'products', label: 'Persianas', icon: Package },
            { id: 'accessories', label: 'Acessórios', icon: Settings },
            { id: 'reforms', label: 'Reformas', icon: Wrench }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as Tab); cancelEditing(); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] transition-all font-heading font-bold uppercase text-[10px] tracking-widest whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-primary'}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-slate-300'}`} /> 
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {activeTab === 'products' && (
            <div className="relative w-full md:w-64 group">
              <select 
                value={lineFilter}
                onChange={e => setLineFilter(e.target.value)}
                className="w-full bg-white border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary rounded-2xl px-6 py-4 outline-none transition-all font-heading font-bold uppercase text-[10px] tracking-widest text-slate-600 appearance-none shadow-sm cursor-pointer"
              >
                <option value="">Todas as Linhas</option>
                <option value="vertical">Vertical</option>
                <option value="ph">Horizontal (PH)</option>
                <option value="rolo">Rolô</option>
                <option value="romana">Romana</option>
                <option value="painel">Painel</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <Settings className="w-4 h-4" />
              </div>
            </div>
          )}
          
          <div className="relative flex-1 md:flex-none md:w-80 group w-full">
            <Search className="w-5 h-5 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar no catálogo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary rounded-2xl outline-none transition-all font-medium text-sm shadow-sm placeholder:text-slate-300 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="mt-8">
        {activeTab === 'products' && (
          <>
            {renderTable(initialProducts, 'products')}
            {renderCards(initialProducts, 'products')}
          </>
        )}
        {activeTab === 'accessories' && (
          <>
            {renderTable(initialAccessories, 'accessories')}
            {renderCards(initialAccessories, 'accessories')}
          </>
        )}
        {activeTab === 'reforms' && (
          <>
            {renderTable(initialReforms, 'reforms')}
            {renderCards(initialReforms, 'reforms')}
          </>
        )}
      </div>

      {/* MODAL DE NOVO ITEM */}
      {isModalOpen && (
        <CatalogItemModal 
          activeTab={activeTab} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {}} 
        />
      )}
    </div>
  );
}
