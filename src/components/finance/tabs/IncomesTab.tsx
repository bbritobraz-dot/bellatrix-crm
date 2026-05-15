"use client";
import { useState } from "react";
import { Plus, Calendar, Printer } from "lucide-react";
import { registerPayment } from "@/app/actions/finance";
import { BankAccountSelect } from "../BankAccountSelect";

function printReceipt(clientName: string, amount: number, method: string, description: string, remainingBalance: number = 0) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  const dateStr = new Date().toLocaleDateString("pt-BR");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo Bellatrix - ${clientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: auto; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .company-info { text-align: center; flex: 1; }
        .contacts { text-align: right; }
        .logo { width: 100px; height: auto; }
        .doc-info-bar { background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 11px; }
        .doc-info-bar b { color: #0ea5e9; }
        .client-info-bar { border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; font-size: 11px; }
        .separator { color: #94a3b8; }
        .content { margin: 40px 0; text-align: center; }
        .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; color: #15803d; padding: 25px; border-radius: 12px; display: inline-block; margin: 20px 0; }
        .amount-value { font-size: 32px; font-weight: 800; }
        .balance-info { margin-top: 10px; font-size: 13px; color: #64748b; font-weight: 500; }
        .signature-section { margin-top: 50px; text-align: center; }
        .signature-img { width: 120px; margin-bottom: 5px; }
        .signature-line { width: 160px; border-top: 1px solid #e2e8f0; margin: 0 auto; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 60px; }
        @media print { .print-btn { display: none; } }
        .print-btn { display: block; margin: 40px auto; padding: 12px 30px; background: #0ea5e9; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="width: 25%"><img src="/logo.png" class="logo" /></div>
        <div class="company-info">
          <div style="font-weight: bold; font-size: 14px; color: #1e293b;">Persianas Bellatrix</div>
          <div style="font-size: 9px; color: #64748b;">CNPJ: 47.214.728/0001-80 | Foz do Iguaçu/PR</div>
        </div>
        <div class="contacts" style="width: 30%">
          <div style="font-size: 9px; color: #64748b;">+55 45 98808 9137</div>
        </div>
      </div>
      <div class="doc-info-bar"><b>RECIBO DE PAGAMENTO</b><span class="separator">|</span><span>Data: ${dateStr}</span></div>
      <div class="client-info-bar"><b>CLIENTE</b><span class="separator">|</span><span style="font-weight:bold">${clientName}</span><span class="separator">|</span><span style="text-transform:capitalize">Meio: ${method}</span></div>
      <div class="content">
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Comprovante de Recebimento</div>
        <div style="font-size: 13px; color: #475569;">Referente a: ${description}</div>
        <div class="amount-box">
          <div style="font-size: 10px; text-transform: uppercase; margin-bottom: 5px;">Valor Recebido</div>
          <div class="amount-value">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        ${remainingBalance > 0 ? `
          <div class="balance-info">Saldo devedor restante: <span style="color: #ef4444;">R$ ${remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        ` : description.includes('Pedido') ? `
          <div class="balance-info" style="color: #10b981;">✅ Pagamento Total Realizado</div>
        ` : ''}
      </div>
      <div class="signature-section">
        <img src="/assignature.png" class="signature-img" />
        <div class="signature-line"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 5px;">Responsável Bellatrix</div>
      </div>
      <div class="footer">Persianas Bellatrix - Transformando ambientes com elegância e sofisticação.</div>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir Recibo</button>
    </body>
    </html>
  `);
  win.document.close();
}

export function IncomesTab({ payments, setPayments, bankAccounts }: {
  payments: any[]; setPayments: any; bankAccounts: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("pix");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [installments, setInstallments] = useState<number>(1);

  const handleSave = async () => {
    if (!desc || !amount || !bankAccountId) { alert("Preencha descrição, valor e selecione uma conta bancária."); return; }
    setIsSaving(true);
    const res = await registerPayment({
      amount: Number(amount), payment_method: method,
      is_manual: true, manual_description: desc,
      bank_account_id: bankAccountId,
      installments: method === 'Cartão de Crédito' ? installments : undefined,
    });
    if (res.success) {
      const bankName = bankAccounts.find(b => b.id === bankAccountId)?.bank_name || "";
      const newPayment = { id: Math.random().toString(), amount: Number(amount), payment_method: method, payment_date: new Date(date).toISOString(), manual_description: desc, is_manual: true, bank_name: bankName, client: null };
      setPayments([newPayment, ...payments]);
      setIsOpen(false); setDesc(""); setAmount(""); setBankAccountId("");
      
      if (confirm("Pagamento registrado! Deseja emitir o recibo agora?")) {
        printReceipt("Cliente Avulso", Number(amount), method, desc);
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Histórico de Recebimentos</h2>
        <button onClick={() => setIsOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Entrada Manual
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 table-responsive-stack">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Descrição / Cliente</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Forma</th>
              <th className="px-5 py-3 font-medium text-right">Valor</th>
              <th className="px-5 py-3 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Nenhum recebimento registrado.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 flex items-center gap-2" data-label="Data">
                  <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
                  {new Date(p.payment_date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-5 py-3 font-medium text-slate-700" data-label="Cliente">
                  {p.is_manual ? (p.manual_description || "Entrada Manual") : (p.client?.name || p.quote?.client?.name || "—")}
                </td>
                <td className="px-5 py-3" data-label="Tipo">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${p.is_manual ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {p.is_manual ? "Manual" : "Pedido"}
                  </span>
                </td>
                <td className="px-5 py-3 capitalize" data-label="Forma">{p.payment_method}</td>
                <td className="px-5 py-3 text-right font-semibold text-emerald-600" data-label="Valor">+ R$ {Number(p.amount).toFixed(2)}</td>
                <td className="px-5 py-3 text-center" data-label="Recibo">
                  <button 
                    onClick={() => printReceipt(
                      p.client?.name || p.quote?.client?.name || "Cliente Bellatrix", 
                      Number(p.amount), 
                      p.payment_method, 
                      p.manual_description || `Pagamento Ref. Pedido #${p.quote_id?.split("-")[0].toUpperCase() || '—'}`,
                      p.quote?.pending_amount || 0
                    )}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
                    title="Imprimir Recibo"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b"><h2 className="text-xl font-bold text-slate-800">Nova Entrada Manual</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input type="text" className="w-full border-slate-300 rounded-lg p-2.5 border" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Venda avulsa, serviço extra..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" className="w-full border-slate-300 rounded-lg p-2.5 border text-emerald-700 font-semibold" value={amount} onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : "")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" className="w-full border-slate-300 rounded-lg p-2.5 border" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select className="w-full border-slate-300 rounded-lg p-2.5 border" value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>

              {/* Seletor de Parcelas */}
              {method === 'Cartão de Crédito' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-indigo-600 mb-1">Parcelamento (Sem Juros)</label>
                  <select
                    className="w-full border-indigo-200 bg-indigo-50/50 rounded-lg p-2.5 border text-sm font-bold text-indigo-700"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}x {n === 1 ? '(À vista)' : 'sem juros'}</option>
                    ))}
                  </select>
                </div>
              )}
              <BankAccountSelect accounts={bankAccounts} value={bankAccountId} onChange={setBankAccountId} />
            </div>
            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="btn-cancel px-4 py-2 !rounded-lg" disabled={isSaving}>Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg" disabled={isSaving || !desc || !amount || !bankAccountId}>{isSaving ? "Salvando..." : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
