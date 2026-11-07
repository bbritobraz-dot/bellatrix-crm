"use client";

import { useState } from "react";
import { RotateCcw, XCircle } from "lucide-react";
import { reopenQuote } from "@/app/actions/quotes";

const money = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

/**
 * Reabrir pedido como rascunho. Se houver valores já recebidos do cliente ou
 * pagos à fábrica, pergunta se devem ser mantidos ou estornados.
 */
export function ReopenQuoteDialog({
  quote,
  onClose,
  onDone,
}: {
  quote: any;
  onClose: () => void;
  onDone: (quoteId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const received = Number(quote.total_paid || 0);
  const supplierPaid = Number(quote.supplier_paid || 0);
  const hasPayments = received > 0 || supplierPaid > 0;

  const run = async (reverse: boolean) => {
    if (reverse && !confirm(
      `Estornar ${received > 0 ? `${money(received)} recebidos do cliente` : ""}` +
      `${received > 0 && supplierPaid > 0 ? " e " : ""}` +
      `${supplierPaid > 0 ? `${money(supplierPaid)} pagos à fábrica` : ""}?\n\n` +
      "Os valores voltam para as contas bancárias de origem e os lançamentos são apagados. Não dá para desfazer."
    )) return;
    setBusy(true);
    const res = await reopenQuote(quote.id, reverse);
    setBusy(false);
    if (!res.success) { alert("Erro ao reabrir: " + res.error); return; }
    onDone(quote.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-vibrant-cyan" />
            <div>
              <h2 className="text-xl font-heading font-bold uppercase tracking-widest">Reabrir pedido</h2>
              <p className="text-vibrant-cyan/80 text-xs font-bold uppercase tracking-widest">{quote.client?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><XCircle className="w-7 h-7" /></button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600">
            O pedido volta para <b>Orçamentos</b> como rascunho, e as datas de produção, instalação e garantia são limpas.
          </p>

          {hasPayments ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
                <p className="font-bold">Este pedido já tem valores registrados:</p>
                {received > 0 && <p>• Recebido do cliente: <b>{money(received)}</b></p>}
                {supplierPaid > 0 && <p>• Pago à fábrica: <b>{money(supplierPaid)}</b></p>}
              </div>
              <div className="grid gap-3">
                <button disabled={busy} onClick={() => run(false)}
                  className="w-full bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest py-4 rounded-2xl text-xs disabled:opacity-50">
                  Manter pagamentos
                  <span className="block text-[10px] text-white/60 normal-case tracking-normal font-medium mt-1">Os valores continuam valendo quando o pedido voltar para produção</span>
                </button>
                <button disabled={busy} onClick={() => run(true)}
                  className="w-full bg-rose-50 text-rose-700 border border-rose-200 font-heading font-bold uppercase tracking-widest py-4 rounded-2xl text-xs disabled:opacity-50">
                  Estornar pagamentos
                  <span className="block text-[10px] text-rose-500 normal-case tracking-normal font-medium mt-1">Devolve os valores às contas e apaga os lançamentos</span>
                </button>
              </div>
            </>
          ) : (
            <button disabled={busy} onClick={() => run(false)}
              className="w-full bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest py-4 rounded-2xl text-xs disabled:opacity-50">
              {busy ? "Reabrindo..." : "Reabrir como rascunho"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
