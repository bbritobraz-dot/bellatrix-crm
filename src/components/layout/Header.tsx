"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, Bell } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="bg-[#F0F4F8]/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMenu}
          className="md:hidden text-muted-foreground hover:text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex md:hidden relative w-32 h-8">
          <Image 
            src="/logo.png" 
            alt="Bellatrix Logo" 
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-primary relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary rounded-full border-2 border-background"></span>
        </button>
        <div className="flex items-center gap-3 border-l pl-4 border-border">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold font-heading">
            V
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-heading font-bold text-primary uppercase tracking-tight">Administrador</p>
            <p className="text-[10px] text-slate-500 font-medium">bellatrix@suporte.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
