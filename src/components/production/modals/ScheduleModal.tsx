"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { scheduleInstallation } from "@/app/actions/quotes";

interface ScheduleModalProps {
  quote: any;
  onClose: () => void;
  onSuccess: (quoteId: string, date: string, time: string) => void;
}

export function ScheduleModal({ quote, onClose, onSuccess }: ScheduleModalProps) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (quote.installation_date) {
      const dt = new Date(quote.installation_date);
      setScheduleDate(dt.toISOString().split("T")[0]);
      setScheduleTime(dt.toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}));
    } else {
      setScheduleDate(new Date().toISOString().split("T")[0]);
      setScheduleTime("09:00");
    }
  }, [quote]);

  const handleScheduleInstallation = async () => {
    if (!scheduleDate || !scheduleTime) return;
    setIsScheduling(true);
    try {
      const res = await scheduleInstallation(quote.id, scheduleDate, scheduleTime);
      if (res.success) {
        onSuccess(quote.id, scheduleDate, scheduleTime);
        onClose();
        alert("Instalação agendada com sucesso!");
      } else { 
        alert("Erro ao agendar instalação: " + res.error); 
      }
    } catch { 
      alert("Erro ao agendar instalação."); 
    } finally { 
      setIsScheduling(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        <div className="p-8 border-b border-border bg-primary text-white">
          <h2 className="text-2xl font-heading font-bold uppercase tracking-widest text-white">Agendamento</h2>
          <p className="text-vibrant-cyan font-bold mt-1 uppercase tracking-widest text-xs">{quote.client?.name}</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mb-2">Data da Instalação</label>
              <input type="date" className="w-full bg-card border border-border rounded-xl p-4 font-medium outline-none focus:border-tertiary transition-all"
                value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase tracking-widest text-slate-500 mb-2">Horário Previsto</label>
              <input type="time" className="w-full bg-card border border-border rounded-xl p-4 font-medium outline-none focus:border-tertiary transition-all"
                value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="p-8 border-t border-border bg-muted/20 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-rose-600 text-white hover:bg-rose-700 font-heading font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-600/10"
            disabled={isScheduling}
          >
            Cancelar
          </button>
          <button onClick={handleScheduleInstallation}
            className="flex-[2] bg-primary text-white py-4 rounded-xl font-heading font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95" 
            disabled={isScheduling}>
            {isScheduling ? "Salvando..." : "Confirmar Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
