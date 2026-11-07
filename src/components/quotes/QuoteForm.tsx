"use client";
import { notify } from "@/lib/notify";

import { useState } from "react";
import { Plus, Trash2, Calculator, Save, FileText, CheckCircle, Download, Settings2, Pencil, X } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import { saveQuote, updateQuote } from "@/app/actions/quotes";
import { 
  calculateArea, 
  applyMinimumArea, 
  calculateProductCost, 
  calculateAccessoryCost, 
  calculateMarginPercent, 
  ProductLine 
} from "@/lib/pricing";

type Product = any; // Em um cenário real, tipar corretamente
type Accessory = any;
type Reform = any;

interface QuoteItem {
  id: string;
  category: string;
  product: Product;
  width: number;
  height: number;
  quantity: number;
  color?: string;
  commandSide?: string;
  commandHeight?: number | "";
  ambient?: string;
  marginPercent: number;
  accessories: { accessory: Accessory, quantity: number, charged?: number, cost?: number, salePrice?: number }[];
  
  // Resultados do cálculo
  chargedArea: number;
  supplierCostTotal: number;
  salePriceTotal: number;
  profitTotal: number;
  errors: string[];
  notes?: string;
}

export function QuoteForm({ 
  initialProducts, 
  initialAccessories, 
  initialReforms,
  initialClients = [],
  initialQuote = null
}: { 
  initialProducts: any[], 
  initialAccessories: any[], 
  initialReforms: any[],
  initialClients?: any[],
  initialQuote?: any
}) {
  const initialItems: QuoteItem[] = (initialQuote?.quote_items || []).map((item: any) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    return {
      id: item.id || Math.random().toString(36).substring(7),
      category: product?.line || "vertical",
      product,
      width: Number(item.width_m || 0),
      height: Number(item.height_m || 0),
      quantity: Number(item.quantity || 1),
      color: item.color || "",
      commandSide: item.command_side || undefined,
      commandHeight: item.command_height_m != null ? Number(item.command_height_m) : undefined,
      ambient: item.ambient || "",
      marginPercent: Number(item.margin_percent || 0),
      accessories: (item.quote_item_accessories || []).map((acc: any) => {
        const accessory = Array.isArray(acc.accessory) ? acc.accessory[0] : acc.accessory;
        return {
          accessory,
          quantity: Number(acc.quantity || 1),
          charged: 0,
          cost: Number(acc.supplier_cost_total || 0) / (Math.max(Number(acc.quantity || 1), 1) * Math.max(Number(item.quantity || 1), 1)),
          salePrice: acc.sale_price_total ? Number(acc.sale_price_total) / (Math.max(Number(acc.quantity || 1), 1) * Math.max(Number(item.quantity || 1), 1)) : undefined
        };
      }).filter((acc: any) => acc.accessory),
      chargedArea: Number(item.charged_area_m2 || 0),
      supplierCostTotal: Number(item.supplier_cost_total || 0),
      salePriceTotal: Number(item.sale_price_total || 0),
      profitTotal: Number(item.sale_price_total || 0) - Number(item.supplier_cost_total || 0),
      errors: [],
      notes: item.notes || ""
    };
  }).filter((item: QuoteItem) => item.product);

  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialQuote?.client_id || "");
  const [clientName, setClientName] = useState(initialQuote?.client?.name || "");
  const [clientPhone, setClientPhone] = useState(initialQuote?.client?.phone || "");
  const [clientAddress, setClientAddress] = useState(initialQuote?.client?.address || "");
  
  // Estados de controle e salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Condições de Pagamento e Desconto
  const [discountType, setDiscountType] = useState<"percent" | "value">(
    Number(initialQuote?.discount_amount || 0) > 0 ? "value" : "percent"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    Number(initialQuote?.discount_amount || 0) > 0
      ? Number(initialQuote.discount_amount)
      : Number(initialQuote?.discount_percent || 0)
  );
  const [paymentMethod, setPaymentMethod] = useState(initialQuote?.payment_conditions?.split(" - ")[0] || "vista");
  const [installments, setInstallments] = useState(Number(initialQuote?.payment_conditions?.match(/(\d+)x/)?.[1] || 1));
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Estados para o formulário de NOVO ITEM
  const [selectedCategory, setSelectedCategory] = useState<string>("vertical");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  
  // Combobox customizado
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Lado e Altura do Comando
  const [commandSide, setCommandSide] = useState<string>("direito");
  const [commandHeight, setCommandHeight] = useState<number | "">("");

  // Acessórios selecionados no form de novo item
  const [selectedAccs, setSelectedAccs] = useState<{id: string, qty: number}[]>([]);

  // Observação do item
  const [itemNotes, setItemNotes] = useState("");
  const [itemAmbient, setItemAmbient] = useState("");

  // Filtros
  const productsInCategory = initialProducts.filter(p => p.line === selectedCategory);
  const accessoriesForCategory = initialAccessories.filter(a => a.line === selectedCategory || a.line === 'geral');

  const handleAddItem = () => {
    if (!selectedProductId || width === "" || height === "") {
      notify.warning("Preencha produto, largura e altura.");
      return;
    }

    const product = initialProducts.find(p => p.id.toString() === selectedProductId);
    if (!product) return;

    // 1. Calcular Custo e Preço do Produto
    const productCalc = calculateProductCost(
      selectedCategory as ProductLine,
      Number(width),
      Number(height),
      product.cost_unit,
      product.supplier_cost,
      product.sale_price || (product.supplier_cost * 1.6),
      product.max_width_m
    );

    let totalSupplierCost = productCalc.supplierCost * quantity;
    let totalSalePrice = productCalc.salePrice * quantity;
    let totalErrors = [...(productCalc.errors || [])];

    // 2. Calcular Custos de Acessórios
    const calculatedAccessories: any[] = [];
    selectedAccs.forEach(acc => {
      const accessoryObj = initialAccessories.find(a => a.id.toString() === acc.id);
      if (accessoryObj) {
        const accCalc = calculateAccessoryCost(
          accessoryObj.slug,
          Number(width),
          Number(height),
          accessoryObj.supplier_cost,
          accessoryObj.sale_price || (accessoryObj.supplier_cost * 1.6),
          accessoryObj.cost_unit
        );
        
        totalSupplierCost += (accCalc.supplierCost * quantity * acc.qty);
        totalSalePrice += (accCalc.salePrice * quantity * acc.qty);
        if (accCalc.errors) totalErrors.push(...accCalc.errors);
        
        calculatedAccessories.push({
          accessory: accessoryObj,
          quantity: acc.qty,
          charged: accCalc.chargedArea,
          cost: accCalc.supplierCost,
          salePrice: accCalc.salePrice
        });
      }
    });

    const itemMargin = calculateMarginPercent(totalSupplierCost, totalSalePrice);

    const newItem: QuoteItem = {
      id: editingItemId || Math.random().toString(36).substring(7),
      category: selectedCategory,
      product,
      width: Number(width),
      height: Number(height),
      quantity,
      color: selectedColor,
      commandSide,
      commandHeight: commandHeight !== "" ? Number(commandHeight) : undefined,
      marginPercent: itemMargin,
      accessories: calculatedAccessories,
      chargedArea: productCalc.chargedArea,
      supplierCostTotal: totalSupplierCost,
      salePriceTotal: totalSalePrice,
      profitTotal: totalSalePrice - totalSupplierCost,
      errors: totalErrors,
      notes: itemNotes,
      ambient: itemAmbient.trim() || undefined
    };

    if (editingItemId) {
      setItems(items.map(i => i.id === editingItemId ? newItem : i));
    } else {
      setItems([...items, newItem]);
    }
    
    // Resetar form parcial
    setEditingItemId(null);
    setSelectedProductId("");
    setProductSearch("");
    setWidth("");
    setHeight("");
    setSelectedColor("");
    setCommandSide("direito");
    setCommandHeight("");
    setSelectedAccs([]);
    setItemNotes("");
    setItemAmbient("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    if (editingItemId === id) resetItemForm();
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setSelectedProductId("");
    setProductSearch("");
    setWidth("");
    setHeight("");
    setQuantity(1);
    setSelectedColor("");
    setCommandSide("direito");
    setCommandHeight("");
    setSelectedAccs([]);
    setItemNotes("");
    setItemAmbient("");
  };

  const editItem = (item: QuoteItem) => {
    setEditingItemId(item.id);
    setSelectedCategory(item.category || item.product.line || "vertical");
    setSelectedProductId(item.product.id.toString());
    setProductSearch(`${item.product.name} - R$ ${item.product.sale_price || (item.product.supplier_cost * 1.6)}/${item.product.cost_unit}`);
    setWidth(item.width);
    setHeight(item.height);
    setQuantity(item.quantity);
    setSelectedColor(item.color || "");
    setCommandSide(item.commandSide || "direito");
    setCommandHeight(item.commandHeight || "");
    setSelectedAccs(item.accessories.map((acc: any) => ({
      id: acc.accessory.id.toString(),
      qty: Number(acc.quantity || 1)
    })));
    setItemNotes(item.notes || "");
    setItemAmbient(item.ambient || "");
  };

  const toggleAccessory = (accId: string) => {
    const exists = selectedAccs.find(a => a.id === accId);
    if (exists) {
      setSelectedAccs(selectedAccs.filter(a => a.id !== accId));
    } else {
      setSelectedAccs([...selectedAccs, { id: accId, qty: 1 }]);
    }
  };

  // Totais Globais
  const globalSupplierCost = items.reduce((acc, item) => acc + item.supplierCostTotal, 0);
  const rawGlobalSalePrice = items.reduce((acc, item) => acc + item.salePriceTotal, 0);
  const globalAreaM2 = items.reduce((acc, item) => {
    // Somar apenas a área física de m2 (exclui itens vendidos por unidade/metro linear puro)
    if (item.product.cost_unit === 'm2') {
      return acc + (item.width * item.height * item.quantity);
    }
    return acc;
  }, 0);

  // Aplicar desconto no global
  const totalDiscount = discountType === 'percent' 
    ? rawGlobalSalePrice * (discountValue / 100)
    : discountValue;
    
  const globalSalePrice = Math.max(rawGlobalSalePrice - totalDiscount, 0);
  const globalProfit = globalSalePrice - globalSupplierCost;

  const handleSaveQuote = async () => {
    if (!clientName || items.length === 0) return;
    setIsSaving(true);
    setSaveError(null);

    const payload = {
      clientId: selectedClientId || null,
      clientName,
      clientPhone,
      clientAddress,
      items,
      paymentMethod,
      installments,
      discountType,
      discountValue,
      totalDiscount,
      globalSalePrice
    };

    const result = initialQuote?.id
      ? await updateQuote(initialQuote.id, payload)
      : await saveQuote(payload);
    
    if (result.success) {
      setSavedQuoteId(result.quoteId);
    } else {
      setSaveError(result.error);
    }
    
    setIsSaving(false);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* COLUNA ESQUERDA: FORMULÁRIO */}
      <div className="lg:col-span-2 space-y-8">
        <div className="card-premium p-8">
          <h3 className="text-xl font-heading font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-vibrant-cyan rounded-full" />
            Dados do Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Selecionar Cliente Existente</label>
              <select 
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm mb-6"
                value={selectedClientId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedClientId(id);
                  const client = initialClients.find(c => c.id === id);
                  if (client) {
                    setClientName(client.name);
                    setClientPhone(client.phone || "");
                    setClientAddress(client.address || "");
                  } else {
                    setClientName("");
                    setClientPhone("");
                    setClientAddress("");
                  }
                }}
              >
                <option value="">-- Selecione um cliente (opcional) --</option>
                {initialClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status.replace('_', ' ')})
                  </option>
                ))}
              </select>

              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Nome do Cliente</label>
              <input 
                type="text" 
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                placeholder="Digite o nome do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                readOnly={!!selectedClientId}
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Telefone</label>
              <input 
                type="text" 
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                placeholder="(00) 00000-0000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                readOnly={!!selectedClientId}
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Endereço de Instalação</label>
              <input 
                type="text" 
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                placeholder="Rua, Número, Bairro, Cidade"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                readOnly={!!selectedClientId}
              />
            </div>
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-heading font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-3">
            <Plus className="w-6 h-6 text-vibrant-cyan"/>
            Adicionar Item
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
              <select 
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedProductId("");
                  setProductSearch("");
                  setSelectedAccs([]);
                }}
              >
                <option value="vertical">Persiana Vertical</option>
                <option value="ph">Persiana Horizontal (PH)</option>
                <option value="rolo">Rolô</option>
                <option value="romana">Romana</option>
                <option value="painel">Painel</option>
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Produto (Pesquisável)</label>
              
              <div className="relative">
                <input 
                  type="text"
                  className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsProductDropdownOpen(false), 200)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setIsProductDropdownOpen(true);
                    if (e.target.value === "") {
                      setSelectedProductId("");
                      setSelectedColor("");
                    }
                  }}
                />
                
                {isProductDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {productsInCategory.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 font-comfortaa">Nenhum produto encontrado.</div>
                    ) : (
                      productsInCategory
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map(p => (
                          <div 
                            key={p.id}
                            className={`p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-comfortaa ${selectedProductId === p.id.toString() ? 'bg-vibrant-cyan/10 text-primary font-bold' : 'text-slate-600'}`}
                            onMouseDown={() => {
                              setSelectedProductId(p.id.toString());
                              setProductSearch(`${p.name} - R$ ${p.sale_price}/${p.cost_unit}`);
                              setSelectedColor("");
                              setIsProductDropdownOpen(false);
                            }}
                          >
                            <span className="font-bold">{p.name}</span>
                            <div className="text-xs text-slate-500 mt-0.5">R$ {Number(p.sale_price).toFixed(2)}/{p.cost_unit}</div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Campo de Cor Dinâmico */}
            {selectedProductId && (() => {
              const prod = initialProducts.find(p => p.id.toString() === selectedProductId);
              if (prod && prod.colors) {
                const colorsArr = prod.colors.split(/[,\/]+/).map((c: string) => c.trim()).filter(Boolean);
                if (colorsArr.length > 0) {
                  return (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Cor da Persiana</label>
                      <select 
                        className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                      >
                        <option value="">Selecione uma cor (Opcional)</option>
                        {colorsArr.map((c: string) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
              }
              return null;
            })()}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Largura (m)</label>
              <input 
                type="number" step="0.01" min="0"
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                value={width}
                onChange={(e) => setWidth(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Altura (m)</label>
              <input 
                type="number" step="0.01" min="0"
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                value={height}
                onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>
            <div>
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Quantidade</label>
              <input 
                type="number" min="1"
                className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : 1)}
              />
            </div>
          </div>

          {width !== "" && height !== "" && (
            <div className="mb-6 bg-vibrant-cyan/5 border border-vibrant-cyan/20 p-4 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-vibrant-cyan rounded-full animate-pulse" />
                <span className="text-sm font-comfortaa text-vibrant-cyan">
                  Área Total: <span className="font-bold">{(Number(width) * Number(height) * quantity).toFixed(2)} m²</span>
                </span>
              </div>
              <span className="text-[10px] font-barlow-condensed font-bold text-vibrant-cyan/60 uppercase tracking-widest">
                ({(Number(width) * Number(height)).toFixed(2)} m² un. x {quantity})
              </span>
            </div>
          )}

          {/* Lado e Altura do Comando */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-6 bg-tertiary/10 border border-tertiary/20 rounded-xl">
            <div className="col-span-2 flex items-center gap-2 mb-2">
              <Settings2 className="w-5 h-5 text-tertiary" />
              <span className="text-sm font-barlow-condensed font-bold text-tertiary uppercase tracking-wider">Acionamento / Comando</span>
              <span className="text-[10px] text-tertiary/60 font-comfortaa ml-auto">(informação técnica)</span>
            </div>
            <div>
              <label className="block text-[10px] font-barlow-condensed font-bold text-tertiary/80 uppercase tracking-widest mb-2">Lado do Comando</label>
              <select
                className="w-full bg-white border border-border rounded-lg p-2.5 text-primary focus:ring-2 focus:ring-tertiary/20 transition-all outline-none font-comfortaa text-xs"
                value={commandSide}
                onChange={(e) => setCommandSide(e.target.value)}
              >
                <option value="direito">Direito</option>
                <option value="esquerdo">Esquerdo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-barlow-condensed font-bold text-tertiary/80 uppercase tracking-widest mb-2">Altura do Comando (m)</label>
              <input
                type="number" step="0.01" min="0"
                placeholder="Ex: 1.20"
                className="w-full bg-white border border-border rounded-lg p-2.5 text-primary focus:ring-2 focus:ring-tertiary/20 transition-all outline-none font-comfortaa text-xs"
                value={commandHeight}
                onChange={(e) => setCommandHeight(e.target.value ? parseFloat(e.target.value) : "")}
              />
            </div>
          </div>

          {/* Ambiente do Item (vai para o PDF e para o pedido de fábrica) */}
          <div className="mb-4">
            <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Ambiente</label>
            <input
              type="text"
              list="ambient-suggestions"
              className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
              placeholder="Ex: Sala, Quarto 01, Suíte, Escritório..."
              value={itemAmbient}
              onChange={(e) => setItemAmbient(e.target.value)}
            />
            <datalist id="ambient-suggestions">
              {["Sala", "Sala de Jantar", "Quarto 01", "Quarto 02", "Suíte", "Cozinha", "Escritório", "Varanda", "Banheiro", "Lavanderia", "Closet"].map(a => <option key={a} value={a} />)}
            </datalist>
          </div>

          {/* Observações do Item */}
          <div className="mb-6">
            <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-2">Observações</label>
            <textarea
              className="w-full bg-white border border-border rounded-lg p-3 text-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-comfortaa text-sm"
              rows={2}
              placeholder="Ex: janela com grade, instalar por fora do vão..."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
          </div>

          {/* Acessórios Opcionais */}
          {accessoriesForCategory.length > 0 && (
            <div className="mb-8">
              <label className="block text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-4">Acessórios Opcionais</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessoriesForCategory.map(acc => (
                  <label key={acc.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${selectedAccs.find(a => a.id === acc.id.toString()) ? 'bg-vibrant-cyan/5 border-vibrant-cyan shadow-sm' : 'bg-white border-border hover:border-slate-300'}`}>
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="peer opacity-0 absolute w-5 h-5 cursor-pointer"
                        checked={!!selectedAccs.find(a => a.id === acc.id.toString())}
                        onChange={() => toggleAccessory(acc.id.toString())}
                      />
                      <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-vibrant-cyan peer-checked:border-vibrant-cyan transition-all flex items-center justify-center">
                        <CheckCircle className={`w-3.5 h-3.5 text-white transition-opacity ${selectedAccs.find(a => a.id === acc.id.toString()) ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold font-heading truncate ${selectedAccs.find(a => a.id === acc.id.toString()) ? 'text-primary' : 'text-primary/80'}`}>
                        {acc.name}
                      </div>
                      <div className="text-[10px] font-barlow-condensed font-bold text-slate-500 uppercase tracking-widest">
                        R$ {Number(acc.sale_price).toFixed(2)}/{acc.cost_unit}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {editingItemId && (
              <button
                onClick={resetItemForm}
                className="px-6 py-3 border border-border text-slate-400 font-barlow-condensed font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5"/>
                Cancelar
              </button>
            )}
            <button 
              onClick={handleAddItem}
              className="flex-1 bg-vibrant-cyan text-slate-900 font-barlow-condensed font-bold uppercase tracking-widest py-3 px-6 rounded-lg hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5"/>
              {editingItemId ? "Atualizar Item" : "Adicionar Item"}
            </button>
          </div>

        </div>

        {/* PAGAMENTO E DESCONTO */}
        <div className="card-premium p-8">
          <h3 className="text-xl font-barlow-condensed font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-sage-green rounded-full" />
            Pagamento e Descontos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-barlow-condensed font-bold text-slate-400 uppercase tracking-widest mb-2">Forma de Pagamento</label>
              <select 
                className="w-full bg-slate-900/50 border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-vibrant-cyan/50 focus:border-vibrant-cyan transition-all outline-none font-comfortaa text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="vista" className="bg-slate-900">À Vista (Dinheiro/Pix)</option>
                <option value="credito" className="bg-slate-900">Cartão de Crédito</option>
                <option value="boleto" className="bg-slate-900">Boleto</option>
              </select>
            </div>
            {paymentMethod === 'credito' && (
              <div>
                <label className="block text-xs font-barlow-condensed font-bold text-slate-400 uppercase tracking-widest mb-2">Parcelamento</label>
                <select 
                  className="w-full bg-slate-900/50 border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-vibrant-cyan/50 focus:border-vibrant-cyan transition-all outline-none font-comfortaa text-sm"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n} className="bg-slate-900">{n}x sem juros</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="md:col-span-2 grid grid-cols-2 gap-6 mt-4 border-t border-white/5 pt-6">
              <div>
                <label className="block text-xs font-barlow-condensed font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Desconto</label>
                <select 
                  className="w-full bg-slate-900/50 border-border rounded-lg p-3 text-white focus:ring-2 focus:ring-vibrant-cyan/50 focus:border-vibrant-cyan transition-all outline-none font-comfortaa text-sm"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percent" | "value")}
                >
                  <option value="percent" className="bg-slate-900">Porcentagem (%)</option>
                  <option value="value" className="bg-slate-900">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-heading font-bold text-emerald-600 uppercase tracking-widest mb-2">
                  Desconto {discountType === 'percent' ? '(%)' : '(R$)'}
                </label>
                <input 
                  type="number" step={discountType === 'percent' ? '0.1' : '1.00'} min="0"
                  className="w-full bg-white border border-border rounded-lg p-3 text-emerald-600 font-bold focus:ring-2 focus:ring-emerald-600/20 transition-all outline-none font-comfortaa text-sm"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: RESUMO E CARRINHO */}
      <div className="space-y-8">
        <div className="card-premium p-8 sticky top-8">
          <h3 className="text-xl font-heading font-bold text-primary uppercase tracking-wider mb-8 flex items-center gap-3">
            <FileText className="w-6 h-6 text-vibrant-cyan"/>
            Resumo
          </h3>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-premium">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-comfortaa text-center">Inicie seu projeto adicionando o primeiro item.</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="bg-white border border-border p-6 rounded-[2rem] relative group hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-vibrant-cyan rounded-2xl flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">
                    {index + 1}
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 pr-8">
                      <p className="font-heading font-bold text-slate-900 uppercase tracking-tight text-base leading-tight">{item.product.name}</p>
                      <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-heading font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-200/50">
                        {item.category === 'rolo' ? 'Rolô' : item.category === 'vertical' ? 'Vertical' : item.category === 'ph' ? 'Horizontal (PH)' : item.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => editItem(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-primary hover:text-vibrant-cyan transition-all active:scale-90"
                        title="Editar item"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Dimensões</p>
                      <p className="text-xs font-comfortaa text-slate-700 font-bold">{item.width}m <span className="text-[10px] text-slate-300 mx-1">×</span> {item.height}m</p>
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Quantidade</p>
                      <p className="text-xs font-comfortaa text-slate-700 font-bold">{item.quantity} {item.quantity === 1 ? 'Unidade' : 'Unidades'}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {item.color && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <p className="text-[10px] font-comfortaa text-slate-500">Cor: <span className="text-slate-700 font-medium">{item.color}</span></p>
                      </div>
                    )}
                    
                    {item.commandSide && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                        <p className="text-[10px] font-comfortaa text-slate-500">
                          Comando: <span className="text-slate-700 font-medium">{item.commandSide} {item.commandHeight ? `(${item.commandHeight}m)` : ""}</span>
                        </p>
                      </div>
                    )}

                    {item.ambient && (
                      <p className="mt-2 text-[10px] font-heading font-bold text-primary uppercase tracking-widest">Ambiente: {item.ambient}</p>
                    )}

                    {item.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border-l-4 border-slate-200">
                        <p className="text-[10px] font-comfortaa text-slate-500 italic leading-relaxed">
                          "{item.notes}"
                        </p>
                      </div>
                    )}
                    
                    {item.accessories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-2">Acessórios</p>
                        <div className="flex flex-wrap gap-2">
                          {item.accessories.map((a: any, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1.5 bg-vibrant-cyan/5 text-primary text-[9px] font-medium px-2 py-1 rounded-lg border border-vibrant-cyan/10">
                              <Plus className="w-2.5 h-2.5 text-vibrant-cyan" />
                              {a.accessory.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {item.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-comfortaa text-rose-500 space-y-1">
                      {item.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-1">Preço Un.</span>
                      <span className="text-sm font-heading font-bold text-slate-500">
                        <span className="text-[10px] opacity-40 mr-1">R$</span>
                        {(item.salePriceTotal / item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[8px] font-heading font-bold text-primary uppercase tracking-widest mb-1">Total do Item</span>
                      <span className="text-2xl font-heading font-bold text-primary">
                        <span className="text-xs font-normal text-vibrant-cyan mr-1">R$</span>
                        {item.salePriceTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))

            )}
          </div>

          <div className="mt-8 pt-6 border-t border-border space-y-3">
            <div className="flex justify-between items-center text-xs font-comfortaa text-slate-500">
              <span>Área Total</span>
              <span className="text-primary font-bold">{globalAreaM2.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between items-center text-xs font-comfortaa text-slate-500">
              <span>Subtotal Bruto</span>
              <span className="text-primary font-bold">R$ {rawGlobalSalePrice.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between items-center text-xs font-comfortaa text-emerald-600 font-bold">
                <span className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-600" />
                  Desconto Aplicado
                </span>
                <span>- R$ {totalDiscount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em]">Indicadores Internos</h4>
                <span className="text-[9px] bg-white text-slate-300 px-2.5 py-1 rounded-lg border border-slate-100 italic">Oculto no PDF</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-comfortaa">
                  <span className="text-slate-500">Custo Total (Fábrica)</span>
                  <span className="text-slate-900 font-bold">R$ {globalSupplierCost.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-comfortaa">
                  <span className="text-slate-500">Lucro Bruto Estimado</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">R$ {globalProfit.toFixed(2)}</span>
                    <span className="text-[9px] font-heading font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100">
                      +{globalSupplierCost > 0 ? ((globalProfit / globalSupplierCost) * 100).toFixed(1) : 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-2 p-8 bg-primary rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-vibrant-cyan/20 opacity-50" />
              <span className="text-[10px] font-heading font-bold text-vibrant-cyan uppercase tracking-[0.3em] relative z-10">Investimento Total</span>
              <div className="text-5xl font-heading font-bold text-white flex items-baseline gap-2 relative z-10">
                <span className="text-xl font-normal text-vibrant-cyan">R$</span>
                {globalSalePrice.toFixed(2)}
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calculator className="w-32 h-32 text-white" />
              </div>
            </div>

            {paymentMethod === 'credito' && installments > 1 && (
              <p className="text-center text-[10px] font-comfortaa text-slate-500">
                ou <span className="text-white font-bold">{installments}x</span> de <span className="text-vibrant-cyan font-bold">R$ {(globalSalePrice / installments).toFixed(2)}</span> sem juros
              </p>
            )}

            <div className="pt-6 space-y-3">
              {savedQuoteId ? (
                <div className="space-y-4">
                  <div className="bg-sage-green/10 border border-sage-green/30 p-4 rounded-xl flex items-center justify-center gap-3 text-sage-green font-barlow-condensed font-bold uppercase tracking-widest text-sm">
                    <CheckCircle className="w-6 h-6"/>
                    {initialQuote?.id ? "Alterações Salvas" : "Orçamento Finalizado"}
                  </div>
                
                {/* O PDFDownloadLink re-renderiza o blob no client-side */}
                <PDFDownloadLink
                  document={
                    <QuotePDF data={{
                      quoteId: savedQuoteId,
                      clientName, clientPhone, clientAddress, 
                      items: items.map(i => ({
                        ...i,
                        commandSide: i.commandSide,
                        commandHeight: i.commandHeight
                      })),
                      totalDiscount, globalSalePrice, paymentMethod, installments
                    }} />
                  }
                  fileName={`Orcamento_${clientName.replace(/\s+/g, '_')}.pdf`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {({ loading }) => (
                    loading ? 'Gerando PDF...' : <><Download className="w-5 h-5"/> Baixar PDF do Orçamento</>
                  )}
                </PDFDownloadLink>

                <button 
                  onClick={() => setSavedQuoteId(null)}
                  className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
                >
                  Continuar Editando
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <button 
                  onClick={handleSaveQuote}
                  disabled={isSaving}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? "SALVANDO..." : (initialQuote?.id ? "ATUALIZAR PROJETO" : "FINALIZAR E SALVAR")}
                  <Save className="w-6 h-6"/>
                </button>
                {saveError && (
                  <div className="mt-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-xs font-comfortaa text-red-400">
                    Erro ao salvar: {saveError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
