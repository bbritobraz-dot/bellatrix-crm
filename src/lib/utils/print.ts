export function printReceipt(clientName: string, amount: number, method: string, quoteId: string, remainingBalance: number = 0) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const ref = quoteId.split("-")[0].toUpperCase();

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Recibo Bellatrix - ${clientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=Comfortaa:wght@400;700&display=swap');
        body { font-family: 'Comfortaa', sans-serif; padding: 40px; color: #051C2C; max-width: 700px; margin: auto; line-height: 1.5; background: #ffffff; }
        .receipt-card { background: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(5, 28, 44, 0.1); border: 1px solid rgba(5, 28, 44, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F4F7FA; padding-bottom: 25px; margin-bottom: 25px; }
        .company-info { text-align: left; }
        .company-name { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: bold; color: #051C2C; text-transform: uppercase; letter-spacing: 2px; }
        .logo { width: 120px; height: auto; }
        .doc-info-bar { background: #051C2C; color: white; padding: 12px 20px; border-radius: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; font-family: 'Barlow Condensed', sans-serif; font-size: 14px; letter-spacing: 1px; }
        .doc-info-bar b { color: #0accef; }
        .client-info-bar { border-bottom: 2px solid #F4F7FA; padding-bottom: 15px; margin-bottom: 40px; font-size: 13px; }
        .content { margin: 40px 0; text-align: center; }
        .receipt-title { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: bold; color: #051C2C; margin-bottom: 10px; text-transform: uppercase; }
        .amount-box { background: #F4F7FA; border: 2px solid #051C2C; color: #051C2C; padding: 40px; border-radius: 20px; display: inline-block; margin: 30px 0; min-width: 300px; position: relative; }
        .amount-value { font-family: 'Barlow Condensed', sans-serif; font-size: 52px; font-weight: 800; }
        .balance-section { margin-top: 30px; padding: 20px; border-radius: 15px; background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.2); display: inline-block; min-width: 320px; }
        .balance-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; text-transform: uppercase; color: #f43f5e; letter-spacing: 2px; margin-bottom: 5px; font-weight: bold; }
        .balance-value { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: bold; color: #f43f5e; }
        .success-section { margin-top: 30px; padding: 20px; border-radius: 15px; background: #a3c4b0; color: #051C2C; font-weight: bold; display: inline-block; min-width: 320px; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 1px; text-transform: uppercase; }
        .signature-section { margin-top: 80px; text-align: center; }
        .signature-line { width: 220px; border-top: 2px solid #051C2C; margin: 0 auto; padding-top: 10px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #051C2C; text-transform: uppercase; letter-spacing: 1px; }
        .footer { text-align: center; font-size: 11px; color: #8096aa; margin-top: 80px; font-weight: 500; }
        @media print { .print-btn { display: none; } body { background: white; padding: 0; } .receipt-card { box-shadow: none; border: none; } }
        .print-btn { display: block; margin: 40px auto; padding: 15px 40px; background: #051C2C; color: #fff; border: none; border-radius: 12px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s; }
        .print-btn:hover { background: #0accef; transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="company-info">
            <div class="company-name">Bellatrix Persianas</div>
            <div style="font-size: 11px; color: #8096aa; margin-top: 4px;">Arquitetura em Proteção Solar</div>
          </div>
          <div style="text-align: right">
            <div style="font-size: 11px; font-weight: bold; color: #09344a;">CNPJ: 47.214.728/0001-80</div>
            <div style="font-size: 11px; color: #8096aa;">Foz do Iguaçu - PR</div>
          </div>
        </div>
        <div class="doc-info-bar">
          <span>RECIBO DE PAGAMENTO</span>
          <span>REF: <b>#${ref}</b></span>
          <span>DATA: <b>${dateStr}</b></span>
        </div>
        <div class="client-info-bar">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 10px; font-weight: bold; color: #8096aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Cliente</div>
              <div style="font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: bold; color: #09344a; text-transform: uppercase;">${clientName}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: bold; color: #8096aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Meio de Pagamento</div>
              <div style="font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: bold; color: #0accef; text-transform: uppercase;">${method}</div>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="receipt-title">Comprovante</div>
          <div class="amount-box">
            <div style="font-family: 'Barlow Condensed', sans-serif; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px;">Valor Recebido</div>
            <div class="amount-value">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <br/>
          ${remainingBalance > 0 ? `
            <div class="balance-section">
              <div class="balance-label">Saldo em Aberto</div>
              <div class="balance-value">R$ ${remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          ` : `
            <div class="success-section">✅ PEDIDO TOTALMENTE QUITADO</div>
          `}
        </div>
        <div class="signature-section">
          <div class="signature-line">Responsável Bellatrix</div>
        </div>
        <div class="footer">Obrigado por escolher a excelência Bellatrix.</div>
      </div>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir Recibo Premium</button>
    </body>
    </html>
  `);
  win.document.close();
}
