/* eslint-disable jsx-a11y/alt-text -- <Image> do react-pdf não aceita alt */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { PdfQuoteData } from '@/lib/quotes/pdfData';

// Pedido de Produção para a fábrica — mesmas colunas do modelo em papel
// (Produto, Quant., Largura, Altura, Cor, Lado comando, Alt. comando,
//  Modelo de sanefa, M², R$/M², R$ total), com valores de CUSTO da fábrica.

// Não quebrar palavras com hífen (ex.: "ESQUER-DO")
Font.registerHyphenationCallback((word) => [word]);

const NAVY = '#000B1A';
const CYAN = '#00D9E8';
const MUTED = '#64748B';
const LINE = '#CBD5E1';
const SOFT = '#F1F5F9';

const s = StyleSheet.create({
  page: { paddingTop: 26, paddingBottom: 50, paddingHorizontal: 28, fontFamily: 'Helvetica', fontSize: 8.5, color: NAVY, lineHeight: 1.3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: CYAN, paddingBottom: 8 },
  logo: { width: 95 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  meta: { alignItems: 'flex-end' },
  metaLine: { fontSize: 8, color: MUTED },
  metaStrong: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  infoRow: { flexDirection: 'row', marginTop: 8, borderWidth: 1, borderColor: LINE, borderRadius: 3 },
  infoCell: { paddingVertical: 5, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: LINE },
  label: { fontSize: 6.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  th: { flexDirection: 'row', backgroundColor: NAVY, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 6.8, textTransform: 'uppercase', paddingVertical: 5, marginTop: 10 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 5, alignItems: 'flex-start' },
  acc: { flexDirection: 'row', backgroundColor: SOFT, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: LINE },
  c: { paddingHorizontal: 4 },
  cAmb: { width: '9%' },
  cProd: { width: '19.5%' },
  cQtd: { width: '5%', textAlign: 'center' },
  cLarg: { width: '6.5%', textAlign: 'center' },
  cAlt: { width: '6.5%', textAlign: 'center' },
  cCor: { width: '10%' },
  cLado: { width: '8.5%', textAlign: 'center' },
  cAltCmd: { width: '7%', textAlign: 'center' },
  cSanefa: { width: '10%' },
  cM2: { width: '6%', textAlign: 'center' },
  cUnit: { width: '6%', textAlign: 'right' },
  cTotal: { width: '6%', textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 7, color: MUTED },

  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  totalBox: { flexDirection: 'row', backgroundColor: NAVY, color: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 3 },
  obs: { marginTop: 10, fontSize: 7.5, color: '#475569' },
  sign: { marginTop: 28, flexDirection: 'row', justifyContent: 'space-around' },
  signBlock: { width: 230, alignItems: 'center' },
  signLine: { width: '100%', borderTopWidth: 1, borderTopColor: NAVY, marginBottom: 3 },
  footer: { position: 'absolute', top: 595 - 34, left: 28, right: 28, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94A3B8', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 5 },
});

const num = (n: number, d = 2) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n: number) => `R$ ${num(n)}`;
const LINES: Record<string, string> = { vertical: 'Vertical', ph: 'Horizontal (PH)', rolo: 'Rolô', romana: 'Romana', painel: 'Painel' };
const isValance = (name = '', slug = '') => /band[oô]|sanefa|caixa/i.test(name) || /bando|sanefa|caixa/i.test(slug);

export const FactoryOrderPDF = ({ data }: { data: PdfQuoteData }) => {
  const orderNumber = data.quoteId ? data.quoteId.split('-')[0].toUpperCase() : 'NOVO';
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const rows = data.items.map((item) => {
    const qty = Math.max(item.quantity || 1, 1);
    const unit = item.product.cost_unit || 'm2';
    const accCost = item.accessories.reduce((sum, a) => sum + Number(a.supplier_cost_total || 0), 0);
    const productCost = Math.max(item.supplierCostTotal - accCost, 0);
    const charged = (item.chargedArea || (unit === 'm2' ? item.width * item.height : item.width)) * qty;
    const unitCost = Number(item.product.supplier_cost || 0) || (charged > 0 ? productCost / charged : 0);
    const valance = item.accessories.find((a) => isValance(a.accessory.name, a.accessory.slug));
    const others = item.accessories.filter((a) => a !== valance);
    return { item, qty, unit, productCost, charged, unitCost, valance, others };
  });

  const total = data.items.reduce((sum, i) => sum + i.supplierCostTotal, 0);

  return (
    <Document title={`Pedido de Produção ${orderNumber} - ${data.clientName}`} author="Persianas Bellatrix">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.footer} fixed>
          <Text>Persianas Bellatrix · Pedido de Produção #{orderNumber}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

        <View style={s.header}>
          <Image src="/logo.png" style={s.logo} />
          <Text style={s.title}>PEDIDO DE PRODUÇÃO</Text>
          <View style={s.meta}>
            <Text style={s.metaStrong}>Pedido #{orderNumber}</Text>
            <Text style={s.metaLine}>Emitido em {today}</Text>
            <Text style={s.metaLine}>CNPJ 47.214.728/0001-80</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <View style={[s.infoCell, { width: '30%' }]}>
            <Text style={s.label}>Revendedor</Text>
            <Text style={s.value}>BELLATRIX PERSIANAS</Text>
          </View>
          <View style={[s.infoCell, { width: '40%' }]}>
            <Text style={s.label}>Cliente final</Text>
            <Text style={s.value}>{data.clientName}</Text>
          </View>
          <View style={[s.infoCell, { width: '30%', borderRightWidth: 0 }]}>
            <Text style={s.label}>Contato</Text>
            <Text style={s.value}>+55 45 98808-9137</Text>
          </View>
        </View>

        <View style={s.th} fixed>
          <Text style={[s.c, s.cAmb]}>Ambiente</Text>
          <Text style={[s.c, s.cProd]}>Produto</Text>
          <Text style={[s.c, s.cQtd]}>Qtd</Text>
          <Text style={[s.c, s.cLarg]}>Larg. (m)</Text>
          <Text style={[s.c, s.cAlt]}>Alt. (m)</Text>
          <Text style={[s.c, s.cCor]}>Cor</Text>
          <Text style={[s.c, s.cLado]}>Lado cmd.</Text>
          <Text style={[s.c, s.cAltCmd]}>Alt. cmd.</Text>
          <Text style={[s.c, s.cSanefa]}>Sanefa / bandô</Text>
          <Text style={[s.c, s.cM2]}>{'M²'}</Text>
          <Text style={[s.c, s.cUnit]}>R$/M²</Text>
          <Text style={[s.c, s.cTotal]}>R$ total</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} wrap={false}>
            <View style={s.tr}>
              <Text style={[s.c, s.cAmb]}>{r.item.ambient || '—'}</Text>
              <View style={[s.c, s.cProd]}>
                <Text style={s.bold}>{r.item.product.name}</Text>
                <Text style={s.small}>{LINES[r.item.product.line || ''] || ''}{r.item.notes ? ` · ${r.item.notes}` : ''}</Text>
              </View>
              <Text style={[s.c, s.cQtd, s.bold]}>{r.qty}</Text>
              <Text style={[s.c, s.cLarg]}>{num(r.item.width, 3)}</Text>
              <Text style={[s.c, s.cAlt]}>{r.unit === 'm2' ? num(r.item.height, 3) : '—'}</Text>
              <Text style={[s.c, s.cCor]}>{r.item.color || '—'}</Text>
              <Text style={[s.c, s.cLado]}>{r.item.commandSide ? r.item.commandSide.toUpperCase() : '—'}</Text>
              <Text style={[s.c, s.cAltCmd]}>{r.item.commandHeight ? `${num(r.item.commandHeight)} m` : '—'}</Text>
              <Text style={[s.c, s.cSanefa]}>{r.valance ? r.valance.accessory.name : '—'}</Text>
              <Text style={[s.c, s.cM2]}>{r.unit === 'unit' ? `${r.qty} un` : num(r.charged)}</Text>
              <Text style={[s.c, s.cUnit]}>{num(r.unitCost)}</Text>
              <Text style={[s.c, s.cTotal, s.bold]}>{num(r.productCost)}</Text>
            </View>
            {[...(r.valance ? [r.valance] : []), ...r.others].map((a, j) => (
              <View key={j} style={s.acc}>
                <Text style={[s.c, s.cAmb]}></Text>
                <Text style={[s.c, { width: '79%' }, s.small]}>+ {a.accessory.name} ({a.quantity} por peça)</Text>
                <Text style={[s.c, { width: '12%', textAlign: 'right' }, s.small]}>{num(Number(a.supplier_cost_total || 0))}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.totalRow} wrap={false}>
          <View style={s.totalBox}>
            <Text style={[s.bold, { marginRight: 16 }]}>TOTAL DO PEDIDO</Text>
            <Text style={s.bold}>{money(total)}</Text>
          </View>
        </View>

        <View wrap={false}>
          <Text style={s.obs}>
            Obs.: Favor conferir todas as colunas antes da produção; em caso de dúvida, entrar em contato. Para Persianas Horizontais de Alumínio DUPLEX, utilizar abertura DX (produzida com aberturas E.E e D.D).
          </Text>
          <Text style={s.obs}>
            Autorizo a execução do pedido acima, ciente de que são persianas sob medida, não podendo alterar qualquer dos campos preenchidos, bem como cancelar o pedido.
          </Text>
          <View style={s.sign}>
            <View style={s.signBlock}>
              <View style={s.signLine} />
              <Text style={s.small}>Bellatrix Persianas — nome por extenso</Text>
            </View>
            <View style={s.signBlock}>
              <View style={s.signLine} />
              <Text style={s.small}>Data</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
