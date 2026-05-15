"use client";

import Link from "next/link";
import Image from "next/image";
import { X, LayoutDashboard, Users, Calendar, FileText, Package, Factory, CheckSquare, DollarSign, Settings } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/clientes", icon: Users, label: "Clientes" },
    { href: "/agenda", icon: Calendar, label: "Agenda" },
    { href: "/orcamentos", icon: FileText, label: "Orçamentos" },
    { href: "/produtos", icon: Package, label: "Produtos e Custos" },
    { href: "/producao", icon: Factory, label: "Em Produção" },
    { href: "/finalizados", icon: CheckSquare, label: "Finalizados" },
    { href: "/financeiro", icon: DollarSign, label: "Financeiro" },
    { href: "/configuracoes", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className={`fixed inset-0 z-[999] md:hidden transition-all duration-500 ${isOpen ? "visible" : "invisible pointer-events-none"}`}>
      {/* Overlay com Blur */}
      <div 
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`} 
        onClick={onClose} 
      />
      
      {/* Menu Panel (Drawer) */}
      <div className={`absolute inset-y-0 left-0 w-[300px] bg-primary shadow-[20px_0_50px_rgba(0,0,0,0.3)] flex flex-col transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Header do Menu */}
        <div className="p-8 pb-10 flex items-center justify-between bg-slate-900/50">
          <div className="relative w-36 h-10">
            <Image src="/logo.png" alt="Bellatrix" fill className="object-contain object-left" />
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 hover:text-vibrant-cyan hover:bg-white/10 transition-all active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Itens de Navegação */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-vibrant-cyan transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-vibrant-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-heading font-bold uppercase text-[11px] tracking-[0.2em]">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer do Menu / User Profile */}
        <div className="p-8 bg-slate-900/80 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-vibrant-cyan shadow-[0_0_20px_rgba(30,242,242,0.3)] text-primary flex items-center justify-center font-bold text-xl">
              V
            </div>
            <div>
              <p className="text-xs font-heading font-bold text-white uppercase tracking-widest">Administrador</p>
              <p className="text-[10px] text-white/30 font-medium">bellatrix@suporte.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
