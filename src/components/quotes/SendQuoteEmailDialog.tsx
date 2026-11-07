"use client";

import { useState } from "react";
import { Mail, Send, XCircle } from "lucide-react";
import { sendQuoteEmail } from "@/app/actions/email";
import { notify } from "@/lib/notify";

/** Janela para enviar o orçamento (PDF anexo) por e-mail ao cliente. */
export function SendQuoteEmailDialog({
  quoteId,
  clientName,
  defaultEmail,
  onClose,
  onSent,
}: {
  quoteId: string;
  clientName: string;
  defaultEmail?: string | null;
  onClose: () => void;
  onSent?: (info: { email: string; newStatus?: string }) => void;
}) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const res = await sendQuoteEmail(quoteId, email, message);
    setSending(false);
    if (!res.success) { notify.error(res.error); return; }
    notify.success(`Orçamento enviado para ${email.trim()}`);
    onSent?.({ email: email.trim(), newStatus: res.newStatus });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <form onSubmit={handleSend} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-vibrant-cyan" />
            <div>
              <h2 className="text-xl font-heading font-bold uppercase tracking-widest">Enviar por e-mail</h2>
              <p className="text-vibrant-cyan/80 text-xs font-bold uppercase tracking-widest">{clientName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white" aria-label="Fechar"><XCircle className="w-7 h-7" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail do cliente</label>
            <input
              type="email"
              required
              autoFocus={!defaultEmail}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!defaultEmail && <p className="text-[11px] text-slate-500 mt-1">O e-mail será salvo no cadastro do cliente.</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mensagem (opcional)</label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="Ex.: Conforme combinado na visita, segue o orçamento das persianas da sala."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            O PDF do orçamento vai anexado. O cliente pode responder o e-mail, e a resposta chega no e-mail da empresa.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-t border-slate-100">
          <button type="button" onClick={onClose} className="py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-heading font-bold uppercase tracking-widest text-xs">Cancelar</button>
          <button type="submit" disabled={sending} className="py-3 rounded-xl bg-blue-600 text-white font-heading font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-60">
            <Send className="w-4 h-4" /> {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
