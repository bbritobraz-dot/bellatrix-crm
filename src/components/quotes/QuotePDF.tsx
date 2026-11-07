/* eslint-disable jsx-a11y/alt-text -- <Image> do react-pdf não aceita alt */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Identidade Bellatrix
const NAVY = '#000B1A';
const CYAN = '#00D9E8';
const TEAL = '#0B7A85'; // ciano escuro: legível sobre fundo branco
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F8FAFC';

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 60, // espaço para o rodapé fixo
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: NAVY,
    lineHeight: 1.35,
    backgroundColor: '#FFFFFF'
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: CYAN
  },
  logo: { width: 120 },
  companyBlock: { alignItems: 'flex-end' },
  companyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  companyLine: { fontSize: 8, color: MUTED, marginTop: 1 },

  // Título
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: NAVY,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 4
  },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: CYAN, letterSpacing: 1.2 },
  titleMetaRow: { flexDirection: 'row' },
  titleMetaBlock: { marginLeft: 18, alignItems: 'flex-end' },
  titleMetaLabel: { fontSize: 6.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },
  titleMetaValue: { fontSize: 9, color: '#FFFFFF', fontFamily: 'Helvetica-Bold' },

  // Cliente
  clientBox: {
    flexDirection: 'row',
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    backgroundColor: SOFT
  },
  fieldLabel: { fontSize: 6.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 1 },
  fieldValue: { fontSize: 9.5 },

  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderLeftWidth: 3,
    borderLeftColor: CYAN,
    paddingLeft: 6,
    marginBottom: 6
  },

  // Tabela
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
    alignItems: 'flex-start'
  },
  accessoryRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: SOFT,
    alignItems: 'flex-start'
  },
  colNum: { width: '5%', color: MUTED },
  colDesc: { width: '38%', paddingRight: 6 },
  colAmb: { width: '12%', textAlign: 'center' },
  colDim: { width: '15%', textAlign: 'center' },
  colQtd: { width: '7%', textAlign: 'center' },
  colMed: { width: '10%', textAlign: 'center' },
  colTotal: { width: '13%', textAlign: 'right' },

  itemTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  itemSub: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  itemCommand: { fontSize: 7.5, color: TEAL, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  accessoryText: { fontSize: 8, color: '#475569' },
  cell: { fontSize: 8.5 },
  cellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableBottom: { borderTopWidth: 1, borderTopColor: LINE },

  // Totais + condições
  summary: { flexDirection: 'row', marginTop: 14, justifyContent: 'space-between' },
  infoBox: {
    width: '56%',
    padding: 10,
    backgroundColor: SOFT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: LINE
  },
  infoItem: { fontSize: 7.5, color: '#475569', marginBottom: 3 },
  totalsBox: { width: '40%', padding: 12, backgroundColor: NAVY, borderRadius: 4, alignSelf: 'flex-start' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 9, color: '#CBD5E1' },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 9, color: CYAN, fontFamily: 'Helvetica-Bold' },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    color: '#FFFFFF'
  },
  grandLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 },
  grandValue: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  installments: { fontSize: 7.5, color: CYAN, textAlign: 'right', marginTop: 4 },

  // Assinatura
  signature: { marginTop: 36, flexDirection: 'row', justifyContent: 'space-around' },
  signatureBlock: { width: 190, alignItems: 'center' },
  signatureLine: { width: '100%', borderTopWidth: 1, borderTopColor: NAVY, marginBottom: 4 },
  signatureLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  signatureSub: { fontSize: 7, color: MUTED, marginTop: 1 },

  // Rodapé fixo em todas as páginas
  footer: {
    position: 'absolute',
    top: 842 - 40, // A4 = 842pt de altura; posicionar pelo topo é mais confiável no react-pdf
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 7,
    color: '#94A3B8'
  }
});

interface QuotePDFProps {
  quoteId?: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: any[];
  totalDiscount: number;
  globalSalePrice: number;
  paymentMethod: string;
  installments: number;
  date?: string;
}

// ===== Formatação pt-BR =====
const num = (n: number, digits = 2) =>
  Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (n: number) => `R$ ${num(n)}`;

const LINE_LABELS: Record<string, string> = {
  vertical: 'Persiana Vertical',
  ph: 'Persiana Horizontal (PH)',
  rolo: 'Rolô',
  romana: 'Romana',
  painel: 'Painel',
};

const UNIT_LABELS: Record<string, string> = { m2: 'm²', linear_m: 'm', m: 'm', unit: 'un', unid: 'un' };

const AMBIENTS = ['Sala', 'Quarto', 'Suíte', 'Cozinha', 'Escritório', 'Banheiro', 'Varanda', 'Closet', 'Lavanderia', 'Área', 'Copa', 'Jantar', 'Estar'];
function guessAmbient(notes?: string): string {
  if (!notes) return '—';
  const found = AMBIENTS.find(a => notes.toLowerCase().includes(a.toLowerCase()));
  return found || '—';
}

const PAYMENT_LABELS: Record<string, string> = {
  vista: 'À vista',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Cartão de crédito',
  debito: 'Cartão de débito',
  boleto: 'Boleto',
};

type Row = {
  description: string;
  details: string[];
  command?: string;
  ambient: string;
  dims: string;
  quantity: number;
  measure: string;
  total: number;
  accessories: { description: string; quantity: number; measure: string; total: number }[];
};

export const QuotePDF = ({ data }: { data: QuotePDFProps }) => {
  const quoteDate = data.date || new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const quoteNumber = data.quoteId ? data.quoteId.split('-')[0].toUpperCase() : 'NOVO';

  const rows: Row[] = data.items.map((item) => {
    const itemQty = Math.max(Number(item.quantity) || 1, 1);
    const unit = item.product?.cost_unit || 'm2';

    // Mesmo cálculo do formulário: venda do acessório = preço x qtd do acessório x qtd de peças
    const accessories = (item.accessories || []).map((acc: any) => {
      const accQty = Math.max(Number(acc.quantity) || 1, 1) * itemQty;
      const total = acc.sale_price_total != null
        ? Number(acc.sale_price_total)
        : Number(acc.salePrice || 0) * accQty;
      const accUnit = UNIT_LABELS[acc.accessory?.cost_unit] || 'un';
      const charged = Number(acc.charged || 0);
      const measure = accUnit === 'un' ? `${accQty} un` : charged > 0 ? `${num(charged * accQty)} ${accUnit}` : '—';
      return { description: acc.accessory?.name || 'Acessório', quantity: accQty, measure, total };
    });

    const accessoriesTotal = accessories.reduce((s: number, a: { total: number }) => s + a.total, 0);

    // Medida cobrada (já com a metragem mínima), não só L x A
    const chargedPerPiece = Number(item.chargedArea) || (unit === 'm2' ? item.width * item.height : item.width);
    const measure = unit === 'unit' ? `${itemQty} un` : `${num(chargedPerPiece * itemQty)} ${UNIT_LABELS[unit] || 'm²'}`;

    const lineLabel = LINE_LABELS[item.product?.line] || (item.product?.line || '').toUpperCase();
    const side = item.commandSide ? String(item.commandSide).toLowerCase() : '';
    const command = side
      ? `Comando ${side}${item.commandHeight ? ` · altura ${num(Number(item.commandHeight))} m` : ''}`
      : undefined;

    const details: string[] = [];
    if (lineLabel) details.push(lineLabel);
    if (item.color) details.push(`Cor: ${item.color}`);

    return {
      description: item.product?.name || 'Produto',
      details,
      command,
      ambient: item.ambient ? String(item.ambient) : guessAmbient(item.notes),
      dims: unit === 'm2' ? `${num(item.width)} × ${num(item.height)} m` : `${num(item.width)} m`,
      quantity: itemQty,
      measure,
      total: Number(item.salePriceTotal || 0) - accessoriesTotal,
      accessories,
      notes: item.notes,
    } as Row & { notes?: string };
  });

  const subtotal = data.globalSalePrice + data.totalDiscount;
  const paymentLabel = PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod;

  return (
    <Document title={`Orçamento ${quoteNumber} - ${data.clientName}`} author="Persianas Bellatrix">
      <Page size="A4" style={styles.page}>
        {/* RODAPÉ */}
        <View style={styles.footer} fixed>
          <Text>Persianas Bellatrix · Orçamento #{quoteNumber} · {quoteDate}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>


        {/* CABEÇALHO */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>Persianas Bellatrix</Text>
            <Text style={styles.companyLine}>CNPJ 47.214.728/0001-80 · Foz do Iguaçu - PR</Text>
            <Text style={styles.companyLine}>+55 45 98808-9137 · bellatrixpersianas@gmail.com</Text>
          </View>
        </View>

        {/* TÍTULO */}
        <View style={styles.titleBar}>
          <Text style={styles.title}>ORÇAMENTO</Text>
          <View style={styles.titleMetaRow}>
            <View style={styles.titleMetaBlock}>
              <Text style={styles.titleMetaLabel}>Nº</Text>
              <Text style={styles.titleMetaValue}>#{quoteNumber}</Text>
            </View>
            <View style={styles.titleMetaBlock}>
              <Text style={styles.titleMetaLabel}>Emissão</Text>
              <Text style={styles.titleMetaValue}>{quoteDate}</Text>
            </View>
            <View style={styles.titleMetaBlock}>
              <Text style={styles.titleMetaLabel}>Validade</Text>
              <Text style={styles.titleMetaValue}>10 dias</Text>
            </View>
          </View>
        </View>

        {/* CLIENTE */}
        <View style={styles.clientBox}>
          <View style={{ width: '38%', paddingRight: 8 }}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Text style={[styles.fieldValue, { fontFamily: 'Helvetica-Bold' }]}>{data.clientName || '—'}</Text>
          </View>
          <View style={{ width: '20%', paddingRight: 8 }}>
            <Text style={styles.fieldLabel}>Telefone</Text>
            <Text style={styles.fieldValue}>{data.clientPhone || '—'}</Text>
          </View>
          <View style={{ width: '42%' }}>
            <Text style={styles.fieldLabel}>Endereço de instalação</Text>
            <Text style={styles.fieldValue}>{data.clientAddress || '—'}</Text>
          </View>
        </View>

        {/* TABELA */}
        <View style={{ marginTop: 14 }}>
          {/* Cabeçalho da tabela repete em cada página */}
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colNum}>#</Text>
            <Text style={styles.colDesc}>Produto</Text>
            <Text style={styles.colAmb}>Ambiente</Text>
            <Text style={styles.colDim}>Largura × Altura</Text>
            <Text style={styles.colQtd}>Qtd</Text>
            <Text style={styles.colMed}>Medida</Text>
            <Text style={styles.colTotal}>Valor</Text>
          </View>

          {rows.map((row, i) => (
            // wrap={false}: um item e seus acessórios nunca são cortados entre páginas
            <View key={i} wrap={false}>
              <View style={styles.productRow}>
                <Text style={[styles.colNum, styles.cell]}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{row.description}</Text>
                  {row.details.length > 0 && <Text style={styles.itemSub}>{row.details.join(' · ')}</Text>}
                  {row.command && <Text style={styles.itemCommand}>{row.command}</Text>}
                  {(row as any).notes ? <Text style={styles.itemSub}>Obs.: {(row as any).notes}</Text> : null}
                </View>
                <Text style={[styles.colAmb, styles.cell]}>{row.ambient}</Text>
                <Text style={[styles.colDim, styles.cell]}>{row.dims}</Text>
                <Text style={[styles.colQtd, styles.cell]}>{row.quantity}</Text>
                <Text style={[styles.colMed, styles.cell]}>{row.measure}</Text>
                <Text style={[styles.colTotal, styles.cellBold]}>{money(row.total)}</Text>
              </View>

              {row.accessories.map((acc, j) => (
                <View key={j} style={styles.accessoryRow}>
                  <Text style={styles.colNum}></Text>
                  <Text style={[styles.colDesc, styles.accessoryText]}>+ {acc.description}</Text>
                  <Text style={[styles.colAmb, styles.accessoryText]}></Text>
                  <Text style={[styles.colDim, styles.accessoryText]}></Text>
                  <Text style={[styles.colQtd, styles.accessoryText]}>{acc.quantity}</Text>
                  <Text style={[styles.colMed, styles.accessoryText]}>{acc.measure}</Text>
                  <Text style={[styles.colTotal, styles.accessoryText]}>{money(acc.total)}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.tableBottom} />
        </View>

        {/* CONDIÇÕES + TOTAIS */}
        <View style={styles.summary} wrap={false}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Condições</Text>
            <Text style={styles.infoItem}>• Pagamento escolhido: {paymentLabel}{data.paymentMethod === 'credito' && data.installments > 1 ? ` em ${data.installments}x` : ''}.</Text>
            <Text style={styles.infoItem}>• Aceitamos Pix, dinheiro e cartão: 50% de entrada e 50% na entrega, ou até 12x sem juros no cartão.</Text>
            <Text style={styles.infoItem}>• Metragem mínima cobrada por peça: 1,20 m² (1,50 m² nas persianas verticais).</Text>
            <Text style={styles.infoItem}>• Garantia de 12 meses contra defeitos de fabricação.</Text>
            <Text style={styles.infoItem}>• Prazo de entrega estimado: 15 a 20 dias úteis após a confirmação do pedido.</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{money(subtotal)}</Text>
            </View>
            {data.totalDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text>Desconto</Text>
                <Text>- {money(data.totalDiscount)}</Text>
              </View>
            )}
            <View style={styles.grandTotal}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{money(data.globalSalePrice)}</Text>
            </View>
            {data.paymentMethod === 'credito' && data.installments > 1 && (
              <Text style={styles.installments}>
                ou {data.installments}x de {money(data.globalSalePrice / data.installments)} sem juros
              </Text>
            )}
          </View>
        </View>

        {/* ASSINATURAS */}
        <View style={styles.signature} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>PERSIANAS BELLATRIX</Text>
            <Text style={styles.signatureSub}>Responsável</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{(data.clientName || 'CLIENTE').toUpperCase()}</Text>
            <Text style={styles.signatureSub}>De acordo</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
