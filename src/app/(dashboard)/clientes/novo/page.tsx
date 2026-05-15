"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveClient } from "@/app/actions/clients";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Tag } from "lucide-react";
import Link from "next/link";

export default function NovoClientePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    city: "",
    lead_source: "Instagram",
    status: "novo_lead",
    notes: ""
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Nome e telefone são obrigatórios.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await saveClient(formData);

    if (result.success) {
      router.push("/clientes");
    } else {
      setError(result.error || "Ocorreu um erro desconhecido.");
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-6">
          <Link 
            href="/clientes" 
            className="w-14 h-14 bg-white border border-border rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm active:scale-90 group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Novo Cliente</h1>
            <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Registro de Lead e Expansão de Carteira</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
        <div className="p-10 md:p-14 space-y-12">
          
          {/* SEÇÃO: DADOS PRINCIPAIS */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-widest">Dados de Identificação</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo / Razão Social *</label>
                <input 
                  type="text" name="name" required
                  placeholder="Ex: João Silva ou Empresa Ltda"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold uppercase text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.name} onChange={handleChange}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone *</label>
                <input 
                  type="tel" name="phone" required
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input 
                  type="email" name="email"
                  placeholder="exemplo@dominio.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.email} onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: LOCALIZAÇÃO */}
          <div className="space-y-8 pt-4">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-widest">Localização do Imóvel</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                <input 
                  type="text" name="address"
                  placeholder="Rua, número, complemento..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.address} onChange={handleChange}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                <input 
                  type="text" name="neighborhood"
                  placeholder="Ex: Centro"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.neighborhood} onChange={handleChange}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                <input 
                  type="text" name="city"
                  placeholder="Ex: São Paulo"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={formData.city} onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: CRM E FUNIL */}
          <div className="space-y-8 pt-4">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-widest">Funil Estratégico</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Status Inicial</label>
                <div className="relative">
                  <select 
                    name="status"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all appearance-none"
                    value={formData.status} onChange={handleChange}
                  >
                    <option value="novo_lead">Novo Lead (Contato inicial)</option>
                    <option value="visita_agendada">Visita Agendada</option>
                    <option value="orcamento_enviado">Orçamento Enviado</option>
                    <option value="em_negociacao">Em Negociação</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Origem do Lead</label>
                <div className="relative">
                  <select 
                    name="lead_source"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all appearance-none"
                    value={formData.lead_source} onChange={handleChange}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Indicacao">Indicação</option>
                    <option value="Whatsapp">WhatsApp Direto</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">Anotações Internas / Necessidades</label>
                <textarea 
                  name="notes" rows={4}
                  placeholder="Detalhes relevantes sobre o cliente, necessidades específicas de projeto..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-300"
                  value={formData.notes} onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-10 md:px-14 pb-10">
            <div className="bg-rose-50 border border-rose-100 text-rose-500 p-5 rounded-2xl font-heading font-bold text-[11px] uppercase tracking-widest text-center">
              {error}
            </div>
          </div>
        )}

        <div className="p-10 md:p-14 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
          <Link 
            href="/clientes"
            className="px-10 py-5 bg-white text-slate-400 hover:text-rose-500 font-heading font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-slate-200 active:scale-95"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-primary text-vibrant-cyan font-heading font-bold py-5 px-12 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 group"
          >
            <Save className="w-5 h-5 group-hover:scale-110 transition-transform"/>
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold">{isSaving ? "Salvando..." : "Salvar Cliente"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
