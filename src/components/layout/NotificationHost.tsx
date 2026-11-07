"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { notificationStore, dismissToast, answerConfirm, type ToastKind } from "@/lib/notify";

const STYLE: Record<ToastKind, { box: string; icon: React.ReactNode }> = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> },
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" /> },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> },
  info: { box: "border-slate-200 bg-white text-slate-700", icon: <Info className="w-5 h-5 text-primary shrink-0" /> },
};

export function NotificationHost() {
  const { toasts, confirm } = useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getSnapshot,
    notificationStore.getSnapshot
  );
  const confirmBtn = useRef<HTMLButtonElement>(null);

  // Enter confirma, Esc cancela
  useEffect(() => {
    if (!confirm) return;
    confirmBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") answerConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm]);

  return (
    <>
      {/* Avisos: canto superior direito no computador, topo da tela no celular */}
      <div className="fixed top-4 left-4 right-4 md:left-auto md:w-96 z-[2200] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${STYLE[t.kind].box}`}
          >
            {STYLE[t.kind].icon}
            <p className="flex-1 whitespace-pre-line leading-snug">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="opacity-50 hover:opacity-100" aria-label="Fechar aviso">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmação no visual do CRM */}
      {confirm && (
        <div
          className="fixed inset-0 z-[2100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => answerConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-lg font-heading font-bold text-slate-900 uppercase tracking-wide">
                {confirm.title || (confirm.danger ? "Confirmar exclusão" : "Confirmar")}
              </h2>
              <p className="mt-3 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{confirm.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => answerConfirm(false)}
                className="py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-heading font-bold uppercase tracking-widest text-xs hover:bg-slate-100"
              >
                {confirm.cancelLabel || "Cancelar"}
              </button>
              <button
                ref={confirmBtn}
                onClick={() => answerConfirm(true)}
                className={`py-3 rounded-xl font-heading font-bold uppercase tracking-widest text-xs ${
                  confirm.danger ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-primary text-vibrant-cyan hover:bg-primary/90"
                }`}
              >
                {confirm.confirmLabel || (confirm.danger ? "Excluir" : "Confirmar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
