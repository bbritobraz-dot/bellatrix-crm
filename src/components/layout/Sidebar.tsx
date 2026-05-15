import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  FileText,
  Settings,
  Menu,
  Factory,
  CheckSquare,
  DollarSign,
  LogIn
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-primary text-white min-h-screen flex flex-col transition-all duration-300 hidden md:flex border-r border-primary/20">
      <div className="p-6 border-b border-white/10 flex flex-col items-center">
        <div className="relative w-full h-16 mb-2">
          <Image 
            src="/logo.png" 
            alt="Bellatrix Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <LayoutDashboard className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Dashboard</span>
        </Link>
        <Link
          href="/clientes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <Users className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Clientes</span>
        </Link>
        <Link
          href="/agenda"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <Calendar className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Agenda</span>
        </Link>
        <Link
          href="/orcamentos"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <FileText className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Orçamentos</span>
        </Link>
        <Link
          href="/orcamentos/novo"
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-vibrant-cyan text-primary font-bold hover:bg-vibrant-cyan/90 transition-colors mt-4"
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-heading uppercase tracking-wider">Novo Orçamento</span>
        </Link>
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-heading font-semibold text-white/30 uppercase tracking-widest">Produção</p>
        </div>

        <Link
          href="/produtos"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <Package className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Produtos e Custos</span>
        </Link>
        <Link
          href="/producao"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <Factory className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Em Produção</span>
        </Link>
        <Link
          href="/finalizados"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <CheckSquare className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Finalizados</span>
        </Link>
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-heading font-semibold text-white/30 uppercase tracking-widest">Gestão</p>
        </div>

        <Link
          href="/financeiro"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <DollarSign className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Financeiro</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-vibrant-cyan/10 transition-colors text-white/80 hover:text-white group"
        >
          <Settings className="w-5 h-5 group-hover:text-vibrant-cyan transition-colors" />
          <span className="font-medium text-sm">Configurações</span>
        </Link>
        <button
          onClick={() => {
            import("@/app/actions/auth").then(mod => mod.logout().then(() => window.location.href = "/login"));
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors text-white/80 hover:text-rose-400 group mt-1"
        >
          <LogIn className="w-5 h-5 rotate-180 group-hover:text-rose-500 transition-colors" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
