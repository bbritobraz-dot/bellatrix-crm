import { round2 } from "@/lib/money";

// Recibo único do sistema (mesmo modelo do recibo de entrada do pedido).
// Antes havia 4 versões diferentes espalhadas pelas telas.

export type ReceiptData = {
  clientName: string;
  amount: number;
  method: string;
  /** id do pedido (vira "#A1B2C3D4") ou um texto livre, ex.: descrição da entrada avulsa */
  reference?: string;
  /** "Comprovante de Entrada", "Comprovante de Pagamento", "Comprovante de Quitação"... */
  title?: string;
  /** saldo que ainda falta pagar; null/undefined = não mostrar o quadro de saldo */
  remainingBalance?: number | null;
  /** data do pagamento (padrão: hoje) */
  date?: string | Date;
};

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const brl = (n: number) => round2(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

export function printReceipt(data: ReceiptData): boolean {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return false; // pop-up bloqueado

  const origin = window.location.origin;
  const when = data.date ? new Date(data.date) : new Date();
  const dateStr = when.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const ref = data.reference
    ? UUID.test(data.reference) ? `#${data.reference.split("-")[0].toUpperCase()}` : data.reference
    : "";
  const title = data.title || "Comprovante de Pagamento";
  const remaining = data.remainingBalance == null ? null : round2(Math.max(data.remainingBalance, 0));

  const balanceBlock =
    remaining == null
      ? ""
      : remaining > 0
        ? `<div class="balance-section">
             <div class="balance-label">Saldo em Aberto</div>
             <div class="balance-value">R$ ${brl(remaining)}</div>
           </div>`
        : `<div class="success-section">Pedido Totalmente Quitado</div>`;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo Bellatrix - ${esc(data.clientName)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Comfortaa:wght@400;700&display=swap');
        body { font-family: 'Comfortaa', sans-serif; padding: 40px; color: #051C2C; max-width: 700px; margin: auto; line-height: 1.5; background: #ffffff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(128, 150, 170, 0.2); padding-bottom: 20px; margin-bottom: 20px; }
        .company-info { text-align: center; flex: 1; }
        .contacts { text-align: right; }
        .logo { width: 120px; height: auto; }
        .doc-info-bar { background: #051C2C; color: white; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 12px; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 1px; flex-wrap: wrap; }
        .doc-info-bar b { color: #0accef; }
        .client-info-bar { border-bottom: 1px solid rgba(128, 150, 170, 0.2); padding-bottom: 12px; margin-bottom: 35px; display: flex; align-items: center; gap: 15px; font-size: 12px; flex-wrap: wrap; }
        .separator { color: #8096aa; }
        .content { margin: 40px 0; text-align: center; }
        .receipt-title { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: bold; color: #09344a; margin-bottom: 15px; text-transform: uppercase; }
        .amount-box { background: #ffffff; border: 2px solid #0accef; color: #09344a; padding: 30px; border-radius: 15px; display: inline-block; margin: 25px 0; min-width: 250px; box-shadow: 0 10px 25px rgba(10, 204, 239, 0.1); }
        .amount-value { font-size: 42px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; }
        .balance-section { margin-top: 25px; padding: 15px; border-radius: 10px; background: rgba(75, 97, 115, 0.05); border: 1px solid rgba(75, 97, 115, 0.1); display: inline-block; min-width: 300px; }
        .balance-label { font-size: 11px; text-transform: uppercase; color: #4b6173; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold; }
        .balance-value { font-size: 20px; font-weight: bold; color: #09344a; font-family: 'Barlow Condensed', sans-serif; }
        .success-section { margin-top: 25px; padding: 15px; border-radius: 10px; background: #a3c4b0; color: white; font-weight: bold; display: inline-block; min-width: 300px; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 1px; }
        .signature-section { margin-top: 60px; text-align: center; }
        .signature-img { width: 140px; margin-bottom: 5px; }
        .signature-line { width: 200px; border-top: 1px solid #09344a; margin: 0 auto; opacity: 0.3; }
        .footer { text-align: center; font-size: 10px; color: #8096aa; margin-top: 60px; }
        @media print { .print-btn { display: none; } }
        .print-btn { display: block; margin: 40px auto; padding: 15px 45px; background: #0accef; color: #09344a; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; }
        .print-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(10, 204, 239, 0.3); }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="width: 25%"><img src="${origin}/logo.png" class="logo" /></div>
        <div class="company-info">
          <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: bold; font-size: 20px; text-transform: uppercase; color: #09344a;">Persianas Bellatrix</div>
          <div style="font-size: 10px; color: #4b6173;">CNPJ: 47.214.728/0001-80 | Foz do Iguaçu - PR</div>
        </div>
        <div class="contacts" style="width: 30%"><div style="font-size: 10px; color: #4b6173;">+55 45 98808-9137</div></div>
      </div>
      <div class="doc-info-bar"><b>RECIBO DE PAGAMENTO</b>${ref ? `<span class="separator">|</span><span>Ref: ${esc(ref)}</span>` : ""}<span class="separator">|</span><span>Data: ${dateStr}</span></div>
      <div class="client-info-bar"><b>CLIENTE</b><span class="separator">|</span><span style="font-weight:bold">${esc(data.clientName)}</span><span class="separator">|</span><span style="text-transform:capitalize">Meio: ${esc(data.method)}</span></div>
      <div class="content">
        <div class="receipt-title">${esc(title)}</div>
        <div class="amount-box">
          <div style="font-size: 11px; text-transform: uppercase; margin-bottom: 8px; color: #4b6173; font-weight: bold;">Valor Recebido</div>
          <div class="amount-value">R$ ${brl(data.amount)}</div>
        </div>
        <br/>
        ${balanceBlock}
      </div>
      <div class="signature-section">
        <img src="${origin}/assignature.png" class="signature-img" />
        <div class="signature-line"></div>
        <div style="font-size: 11px; color: #4b6173; margin-top: 8px; font-weight: bold; text-transform: uppercase;">Responsável Bellatrix</div>
      </div>
      <div class="footer">Este recibo confirma o recebimento do valor acima.</div>
      <button class="print-btn" onclick="window.print()">Imprimir Recibo</button>
    </body>
    </html>
  `);
  win.document.close();
  return true;
}
