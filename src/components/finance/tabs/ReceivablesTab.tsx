"use client";
import { useState } from "react";
import { TrendingUp, User, Printer } from "lucide-react";
import { registerClientPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";

function printReceipt(clientName: string, amount: number, method: string, quoteId: string, remainingBalance: number = 0) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  const date = new Date().toLocaleDateString("pt-BR");
  const time = new Date().toLocaleTimeString("pt-BR");
  const ref = quoteId.split("-")[0].toUpperCase();

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo Bellatrix - ${clientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #051C2C; max-width: 700px; margin: auto; line-height: 1.5; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .company-info { text-align: center; flex: 1; }
        .contacts { text-align: right; }
        .logo { width: 100px; height: auto; }
        .doc-info-bar { background: #051C2C; color: #ffffff; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 12px; }
        .doc-info-bar b { color: #0accef; }
        .client-info-bar { border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 35px; display: flex; align-items: center; gap: 15px; font-size: 12px; }
        .separator { color: #94a3b8; }
        .content { margin: 40px 0; text-align: center; }
        .receipt-title { font-size: 26px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
        .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; color: #15803d; padding: 30px; border-radius: 15px; display: inline-block; margin: 25px 0; min-width: 250px; }
        .amount-value { font-size: 38px; font-weight: 800; }
        
        .balance-section { margin-top: 25px; padding: 15px; border-radius: 10px; background: #fef2f2; border: 1px solid #fee2e2; display: inline-block; min-width: 300px; }
        .balance-label { font-size: 11px; text-transform: uppercase; color: #991b1b; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold; }
        .balance-value { font-size: 20px; font-weight: bold; color: #dc2626; }
        
        .success-section { margin-top: 25px; padding: 15px; border-radius: 10px; background: #ecfdf5; border: 1px solid #d1fae5; color: #065f46; font-weight: bold; display: inline-block; min-width: 300px; }

        .signature-section { margin-top: 60px; text-align: center; }
        .signature-img { width: 130px; margin-bottom: 5px; }
        .signature-line { width: 180px; border-top: 1px solid #e2e8f0; margin: 0 auto; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 60px; }
        @media print { .print-btn { display: none; } }
        .print-btn { display: block; margin: 40px auto; padding: 12px 35px; background: #0ea5e9; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="width: 25%"><img src="/logo.png" class="logo" /></div>
        <div class="company-info">
          <div style="font-weight: bold; font-size: 16px;">Persianas Bellatrix</div>
          <div style="font-size: 10px; color: #64748b;">CNPJ: 47.214.728/0001-80 | Foz do Iguaçu/PR</div>
        </div>
        <div class="contacts" style="width: 30%"><div style="font-size: 10px; color: #64748b;">+55 45 98808 9137</div></div>
      </div>
      
      <div class="doc-info-bar"><b>RECIBO DE PAGAMENTO</b><span class="separator">|</span><span>Ref: #${ref}</span><span class="separator">|</span><span>Data: ${date}</span></div>
      
      <div class="client-info-bar"><b>CLIENTE</b><span class="separator">|</span><span style="font-weight:bold">${clientName}</span><span class="separator">|</span><span style="text-transform:capitalize">Meio: ${method}</span></div>
      
      <div class="content">
        <div class="receipt-title">Comprovante de Recebimento</div>
        
        <div class="amount-box">
          <div style="font-size: 11px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Valor Recebido</div>
          <div class="amount-value">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <br/>

        ${remainingBalance > 0 ? `
          <div class="balance-section">
            <div class="balance-label">Saldo Devedor Restante</div>
            <div class="balance-value">R$ ${remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        ` : `
          <div class="success-section">
            ✅ PEDIDO TOTALMENTE QUITADO
          </div>
        `}
      </div>

      <div class="signature-section">
        <img src="/assignature.png" class="signature-img" />
        <div class="signature-line"></div>
        <div style="font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 500;">Responsável Bellatrix</div>
      </div>
      
      <div class="footer">Obrigado pela preferência! Persianas Bellatrix transforma sua casa com elegância.</div>
      
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir Recibo</button>
    </body>
    </html>
  `);
  win.document.close();
}

export function ReceivablesTab({ receivables, bankAccounts }: { receivables: any[]; bankAccounts: any[] }) {
  const [items, setItems] = useState(receivables);
  const [modal, setModal] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("pix");
  const [bankAccountId, setBankAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [payInstallments, setPayInstallments] = useState<number>(1);

  const total = items.reduce((acc, r) => acc + Number(r.pending_amount), 0);

  const statusLabel: Record<string, string> = {
    rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", em_producao: "Em Produção"
  };
  const statusColor: Record<string, string> = {
    rascunho: "bg-slate-100 text-slate-600", enviado: "bg-blue-100 text-blue-700",
    aprovado: "bg-emerald-100 text-emerald-700", em_producao: "bg-indigo-100 text-indigo-700"
  };

  const openModal = (receivable: any) => {
    setModal(receivable);
    setPayAmount("");
    setPayMethod("PIX");
    setBankAccountId("");
    setPayInstallments(1);
  };

  const handleRegisterPayment = async () => {
    if (!modal || !payAmount || Number(payAmount) <= 0 || !bankAccountId) return;
    setIsSaving(true);

    const res = await registerClientPayment({
      quote_id: modal.id,
      client_id: modal.client_id,
      amount: Number(payAmount),
      payment_method: payMethod,
      bank_account_id: bankAccountId,
      notes: `Pagamento parcial do cliente ${modal.client?.name}`,
      installments: payMethod === 'Cartão de Crédito' ? payInstallments : undefined,
    });

    if (res.success) {
      const currentPending = Number(modal.pending_amount || 0);
      const paidNow = Number(payAmount || 0);
      const newPending = Math.max(currentPending - paidNow, 0);

      // Imprimir recibo com o saldo ATUALIZADO
      printReceipt(
        modal.client?.name || "Cliente", 
        paidNow, 
        payMethod, 
        modal.id, 
        newPending
      );

      if (newPending <= 0) {
        setItems(items.filter(r => r.id !== modal.id));
      } else {
        setItems(items.map(r => r.id === modal.id ? { ...r, pending_amount: newPending, total_paid: (Number(r.total_paid) || 0) + paidNow } : r));
      }
      setModal(null);
    } else {
      alert("Erro ao registrar pagamento.");
    }
    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-4 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <p className="text-sm text-primary font-bold uppercase tracking-widest">Total a Receber dos Clientes</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Saldo pendente de todos os pedidos em aberto</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Total do Pedido</th>
                <th className="px-6 py-3 font-medium">Já Recebido</th>
                <th className="px-6 py-3 font-medium text-right text-blue-700">Saldo a Receber</th>
                <th className="px-6 py-3 font-medium text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">✅ Nenhum valor pendente com clientes.</td></tr>
              ) : items.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4" data-label="Cliente">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 hidden sm:block" />
                      <span className="font-medium text-slate-700">{r.client?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Status">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor[r.status] || "bg-slate-100 text-slate-600"}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4" data-label="Total">R$ {Number(r.total_sale_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium" data-label="Recebido">R$ {Number(r.total_paid || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-700" data-label="Pendente">R$ {Number(r.pending_amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center" data-label="Ação">
                    <button
                      onClick={() => openModal(r)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-1.5 rounded-lg w-full sm:w-auto"
                    >
                      + Registrar Pagamento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pagamento Parcial */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Registrar Recebimento</h2>
              <p className="text-blue-100 text-sm mt-1">{modal.client?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                  <p className="text-xs text-slate-500">Total do Pedido</p>
                  <p className="text-lg font-bold text-slate-700">R$ {Number(modal.total_sale_price).toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-xs text-blue-600">Saldo Pendente</p>
                  <p className="text-lg font-bold text-blue-700">R$ {Number(modal.pending_amount).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Recebido Agora (R$)</label>
                <input
                  type="number" step="0.01" min="0"
                  className="w-full border-slate-300 rounded-lg p-2.5 border text-emerald-700 font-bold focus:ring-emerald-500 focus:border-emerald-500"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value ? parseFloat(e.target.value) : "")}
                />
                <p className="text-xs text-slate-400 mt-1">Pode ser parcial. Recibo PDF gerado automaticamente.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              {/* Seletor de Parcelas (Apenas para Crédito) */}
              {payMethod === 'Cartão de Crédito' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-indigo-600 mb-1">Parcelamento (Sem Juros)</label>
                  <select
                    className="w-full border-indigo-200 bg-indigo-50/50 rounded-lg p-2.5 border text-sm font-bold text-indigo-700"
                    value={payInstallments}
                    onChange={(e) => setPayInstallments(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                    ))}
                  </select>
                </div>
              )}
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
              {payAmount !== "" && Number(payAmount) < Number(modal.pending_amount) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Saldo restante após: <strong>R$ {(Number(modal.pending_amount) - Number(payAmount)).toFixed(2)}</strong> — ficará em A Receber
                </div>
              )}
              {payAmount !== "" && Number(payAmount) >= Number(modal.pending_amount) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-semibold">
                  ✅ Pagamento completo — pedido será removido do A Receber
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <Printer className="w-4 h-4 text-slate-400" />
                Um recibo será aberto automaticamente para impressão / PDF
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleRegisterPayment} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold flex items-center gap-2" disabled={isSaving || !payAmount || !bankAccountId}>
                <Printer className="w-4 h-4" />
                {isSaving ? "Registrando..." : "Confirmar e Emitir Recibo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
