"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuthedClient } from "@/lib/supabase/server";
import { dbQuoteToPdfData } from "@/lib/quotes/pdfData";

// Envio do orçamento por e-mail (Resend, https://resend.com).
// Configuração na Vercel (Settings → Environment Variables):
//   RESEND_API_KEY   chave da API do Resend (obrigatória)
//   EMAIL_FROM       remetente, ex.: "Persianas Bellatrix <orcamentos@persianasfoz.com.br>"
//   EMAIL_REPLY_TO   para onde vão as respostas do cliente

const DEFAULT_FROM = "Persianas Bellatrix <orcamentos@persianasfoz.com.br>";
const DEFAULT_REPLY_TO = "bellatrixpersianas@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const brl = (n: number) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_");

async function loadLogo(): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", "logo.png"));
  } catch {
    // Na Vercel os arquivos de /public podem não estar no servidor: busca pelo próprio site
    try {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host");
      if (!host) return null;
      const proto = h.get("x-forwarded-proto") || "https";
      const res = await fetch(`${proto}://${host}/logo.png`);
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }
}

function emailHtml(opts: { clientName: string; code: string; total: number; message?: string }) {
  const first = opts.clientName.trim().split(/\s+/)[0] || "";
  const msg = opts.message?.trim()
    ? `<p style="margin:0 0 16px">${esc(opts.message.trim()).replace(/\n/g, "<br>")}</p>`
    : "";
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;color:#051C2C">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#000B1A;padding:20px 28px;color:#00D9E8;font-weight:bold;letter-spacing:2px;font-size:14px">PERSIANAS BELLATRIX</td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 16px;font-size:16px">Olá${first ? ", " + esc(first) : ""}!</p>
        <p style="margin:0 0 16px">Segue em anexo o seu orçamento <b>#${esc(opts.code)}</b>, no valor de <b>R$ ${brl(opts.total)}</b>.</p>
        ${msg}
        <p style="margin:0 0 16px">O orçamento é válido por 10 dias. Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp <b>+55 45 98808-9137</b>.</p>
        <p style="margin:24px 0 0">Obrigado pela preferência!<br><b>Persianas Bellatrix</b><br><span style="color:#64748B;font-size:12px">Foz do Iguaçu - PR</span></p>
      </td></tr>
      <tr><td style="background:#F8FAFC;padding:14px 28px;color:#94A3B8;font-size:11px">CNPJ 47.214.728/0001-80 · bellatrixpersianas@gmail.com</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Gera o PDF do orçamento e envia por e-mail ao cliente.
 * Em caso de sucesso: guarda o e-mail no cadastro (se faltava), marca o orçamento
 * como "enviado" (se estava em rascunho), o cliente como "orçamento enviado"
 * e registra o envio no histórico do orçamento.
 */
export async function sendQuoteEmail(quoteId: string, to: string, message?: string) {
  const supabase = await createAuthedClient();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "O envio por e-mail ainda não foi configurado (falta a chave do Resend na Vercel)." };
  }

  const email = (to || "").trim();
  if (!EMAIL_RE.test(email)) return { success: false, error: "Informe um e-mail válido." };

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(`
      *,
      client:clients(id, name, phone, email, address, status),
      quote_items(
        id, product:products(name, line, cost_unit, supplier_cost),
        width_m, height_m, quantity, charged_area_m2, supplier_cost_total, sale_price_total,
        margin_percent, notes, color, command_side, command_height_m, ambient,
        quote_item_accessories(quantity, supplier_cost_total, sale_price_total, accessory:accessories(name, slug, cost_unit))
      )
    `)
    .eq("id", quoteId)
    .single();

  if (error || !quote) return { success: false, error: "Orçamento não encontrado." };

  const data = dbQuoteToPdfData(quote);
  const code = quoteId.split("-")[0].toUpperCase();

  // PDF gerado no servidor (mesmo layout do botão "Baixar PDF")
  let pdfBase64: string;
  try {
    const [{ renderToBuffer }, { QuotePDF }, React, logo] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/quotes/QuotePDF"),
      import("react"),
      loadLogo(),
    ]);
    const element = React.createElement(QuotePDF, {
      data,
      logoSrc: logo ? { data: logo, format: "png" } : undefined,
    });
    const buffer = await renderToBuffer(element as any);
    pdfBase64 = Buffer.from(buffer).toString("base64");
  } catch (e: any) {
    console.error("Erro ao gerar PDF para e-mail:", e);
    return { success: false, error: "Não foi possível gerar o PDF do orçamento." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [email],
      reply_to: process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
      subject: `Orçamento #${code} - Persianas Bellatrix`,
      html: emailHtml({ clientName: data.clientName, code, total: data.globalSalePrice, message }),
      attachments: [{ filename: `Orcamento_${code}_${safeName(data.clientName)}.pdf`, content: pdfBase64 }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("Resend recusou o envio:", res.status, body);
    const reason = body?.message || `erro ${res.status}`;
    return { success: false, error: `O serviço de e-mail recusou o envio: ${reason}` };
  }

  // Pós-envio (não desfaz o envio se algo aqui falhar)
  const client = Array.isArray(quote.client) ? quote.client[0] : quote.client;
  if (client?.id) {
    const patch: Record<string, string> = {};
    if (!client.email) patch.email = email;
    if (["novo_lead", "visita_agendada", "visita_realizada"].includes(client.status)) patch.status = "orcamento_enviado";
    if (Object.keys(patch).length) await supabase.from("clients").update(patch).eq("id", client.id);
  }
  if (quote.status === "rascunho") {
    await supabase.from("quotes").update({ status: "enviado", updated_at: new Date().toISOString() }).eq("id", quoteId);
  }
  await supabase.from("quote_status_history").insert({
    quote_id: quoteId,
    status: quote.status === "rascunho" ? "enviado" : quote.status,
    reason: `Orçamento enviado por e-mail para ${email}`,
  });

  revalidatePath("/orcamentos");
  return { success: true, newStatus: quote.status === "rascunho" ? "enviado" : quote.status };
}
