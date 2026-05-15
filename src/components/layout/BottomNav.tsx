"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Plus, DollarSign } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/clientes", icon: Users, label: "Clientes" },
    { href: "/orcamentos/novo", icon: Plus, label: "Novo", primary: true },
    { href: "/agenda", icon: Calendar, label: "Agenda" },
    { href: "/financeiro", icon: DollarSign, label: "Financeiro" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-border px-4 py-2 z-50 flex items-center justify-between safe-area-bottom">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.primary) {
          return (
            <Link key={item.href} href={item.href} className="relative -top-6">
              <div className="w-14 h-14 bg-primary text-vibrant-cyan rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform">
                <Icon className="w-7 h-7" />
              </div>
            </Link>
          );
        }

        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[64px]">
            <div className={`p-1 rounded-lg transition-colors ${isActive ? "text-primary" : "text-slate-400"}`}>
              <Icon className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? "text-primary" : "text-slate-400"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
