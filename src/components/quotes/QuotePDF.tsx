import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Estilos baseados no modelo Bellatrix
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000B1A',
    lineHeight: 1.5,
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#00F2FF',
    paddingBottom: 20
  },
  logo: {
    width: 120,
    height: 'auto'
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
    color: '#64748b'
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000B1A',
    marginBottom: 2,
    letterSpacing: 1
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#000B1A',
    padding: 12,
    borderRadius: 4
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00F2FF',
    letterSpacing: 1
  },
  quoteMeta: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.8
  },
  clientBox: {
    marginBottom: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC'
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000B1A',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#00F2FF',
    paddingLeft: 8
  },
  table: {
    marginTop: 15,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#000B1A',
    padding: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 8,
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 10,
    alignItems: 'center',
    minHeight: 40
  },
  colProd: { width: '30%' },
  colAmb: { width: '12%', textAlign: 'center' },
  colDim: { width: '12%', textAlign: 'center' },
  colQtd: { width: '6%', textAlign: 'center' },
  colMed: { width: '15%', textAlign: 'center' },
  colUnit: { width: '8%', textAlign: 'center' },
  colTotal: { width: '17%', textAlign: 'right' },
  
  itemTitle: { fontWeight: 'bold', color: '#000B1A', fontSize: 9, marginBottom: 2 },
  itemSub: { fontSize: 7, color: '#64748b', marginTop: 1 },
  itemCommand: { fontSize: 7, color: '#00F2FF', fontWeight: 'bold', marginTop: 1 },
  
  totalsContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  totalsBox: {
    width: '40%',
    padding: 15,
    backgroundColor: '#000B1A',
    borderRadius: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
    color: '#E2E8F0'
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
    color: '#00F2FF',
    fontWeight: 'bold'
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  obsSection: {
    marginTop: 35,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  obsItem: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 5,
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15
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

export const QuotePDF = ({ data }: { data: QuotePDFProps }) => {
  const quoteDate = data.date || new Date().toLocaleDateString('pt-BR');
  const quoteNumber = data.quoteId ? data.quoteId.split('-')[0].toUpperCase() : 'NOVO';

  // Achatar itens e acessórios em uma única lista para a tabela
  const flattenedRows: any[] = [];
  data.items.forEach((item) => {
    const unit = item.product?.cost_unit || 'm2';
    const totalMeasure = unit === 'm2' 
      ? (item.width * item.height * item.quantity) 
      : (item.width * item.quantity);

    const accessoriesTotal = item.accessories?.reduce((acc: number, curr: any) => {
      const price = curr.sale_price_total || (Number(curr.salePrice || 0) * Number(curr.quantity || 1));
      return acc + price;
    }, 0) || 0;
    
    const productOnlyTotal = item.salePriceTotal - accessoriesTotal;

    // Linha do Produto Principal (Persiana pura)
    flattenedRows.push({
      type: 'product',
      description: `${item.product.line?.toUpperCase() || ''} ${item.product.name}`,
      color: item.color,
      // CAPTURANDO OS DADOS DE COMANDO DIRETAMENTE DO ITEM
      command: item.commandSide ? `${item.commandSide.toUpperCase()} (${item.commandHeight ? item.commandHeight + 'm' : '-'})` : 'N/A',
      ambient: item.notes?.includes('Sala') ? 'SALA' : item.notes?.includes('Quarto') ? 'QUARTO' : 'GERAL',
      width: item.width,
      height: unit === 'm2' ? item.height : null,
      quantity: item.quantity,
      totalMeasure: totalMeasure,
      unit: unit,
      total: productOnlyTotal,
      notes: item.notes
    });

    // Linhas para Acessórios
    if (item.accessories && item.accessories.length > 0) {
      item.accessories.forEach((acc: any) => {
        const accUnitRaw = acc.accessory.cost_unit || 'unid';
        const accQty = acc.quantity || item.quantity;
        const accPriceTotal = acc.sale_price_total || (Number(acc.salePrice || 0) * Number(acc.quantity || 1));
        
        // Padronização da unidade para exibição
        const displayUnit = accUnitRaw === 'linear_m' || accUnitRaw === 'm' ? 'm' : accUnitRaw === 'm2' ? 'm2' : 'unid';
        
        // Cálculo da medida real do acessório para exibição (Prioridade para largura se for linear)
        let accMeasure = acc.charged || 0;
        if (displayUnit === 'm') {
          accMeasure = item.width * accQty;
        } else if (!acc.charged) {
          if (displayUnit === 'm2') accMeasure = item.width * item.height * accQty;
          else accMeasure = accQty;
        }

        flattenedRows.push({
          type: 'accessory',
          description: `ACESSÓRIO: ${acc.accessory.name}`,
          color: null,
          command: null,
          ambient: '-',
          width: displayUnit === 'm' || displayUnit === 'm2' ? item.width : null,
          height: displayUnit === 'm2' ? item.height : null,
          quantity: accQty,
          totalMeasure: accMeasure,
          unit: displayUnit,
          total: accPriceTotal
        });
      });
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO TRIPARTIDO */}
        <View style={styles.header}>
          <View style={{ width: '30%' }}>
            <Image src="/logo.png" style={styles.logo} />
          </View>
          <View style={{ width: '40%', textAlign: 'center' }}>
            <Text style={styles.companyName}>Persianas Bellatrix</Text>
            <Text style={{ fontSize: 8, color: '#64748b' }}>CNPJ: 47.214.728/0001-80</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>Foz do Iguaçu - PR</Text>
          </View>
          <View style={{ width: '30%', textAlign: 'right' }}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>bellatrixpersianas@gmail.com</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>+55 45 98808 9137</Text>
          </View>
        </View>

        {/* FAIXA TITULO UNIFICADA */}
        <View style={styles.titleSection}>
          <Text style={styles.quoteTitle}>ORÇAMENTO DE PROJETO</Text>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.quoteMeta}>Referência: #{quoteNumber}</Text>
            <Text style={[styles.quoteMeta, { marginTop: 2 }]}>Emitido em: {quoteDate}</Text>
          </View>
        </View>

        {/* CLIENTE */}
        <View style={styles.clientBox}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
            <View style={{ width: '50%', marginBottom: 5 }}>
              <Text style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase' }}>Nome</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000B1A' }}>{data.clientName}</Text>
            </View>
            <View style={{ width: '50%', marginBottom: 5 }}>
              <Text style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase' }}>Telefone</Text>
              <Text style={{ fontSize: 10, color: '#000B1A' }}>{data.clientPhone || '-'}</Text>
            </View>
            <View style={{ width: '100%' }}>
              <Text style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase' }}>Endereço de Instalação</Text>
              <Text style={{ fontSize: 10, color: '#000B1A' }}>{data.clientAddress || '-'}</Text>
            </View>
          </View>
        </View>

        {/* TABELA */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProd}>Descrição do Produto</Text>
            <Text style={styles.colAmb}>Ambiente</Text>
            <Text style={styles.colDim}>Dimensões (L x A)</Text>
            <Text style={styles.colQtd}>Qtd</Text>
            <Text style={styles.colMed}>Medida Total</Text>
            <Text style={styles.colUnit}>Unid</Text>
            <Text style={styles.colTotal}>Investimento</Text>
          </View>

          {flattenedRows.map((row, i) => (
            <View style={[styles.tableRow, row.type === 'accessory' ? { backgroundColor: '#F8FAFC' } : {}]} key={i}>
              <View style={styles.colProd}>
                <Text style={[styles.itemTitle, row.type === 'accessory' ? { color: '#64748b', fontSize: 8 } : {}]}>{row.description}</Text>
                {row.color && <Text style={styles.itemSub}>Cor: {row.color}</Text>}
                {row.command && row.command !== 'N/A' && <Text style={styles.itemCommand}>Comando: {row.command}</Text>}
                {row.notes && <Text style={styles.itemSub}>Obs: {row.notes}</Text>}
              </View>
              <View style={styles.colAmb}><Text style={{ fontSize: 8 }}>{row.ambient}</Text></View>
              <View style={styles.colDim}>
                <Text style={{ fontSize: 8 }}>
                  {row.width ? row.width.toFixed(2) + 'm' : '-'} 
                  {row.height ? ' x ' + row.height.toFixed(2) + 'm' : ''}
                </Text>
              </View>
              <View style={styles.colQtd}><Text>{row.quantity}</Text></View>
              <View style={styles.colMed}><Text style={{ fontWeight: 'bold' }}>{row.totalMeasure.toFixed(3)}</Text></View>
              <View style={styles.colUnit}><Text>{row.unit}</Text></View>
              <View style={styles.colTotal}><Text style={{ fontWeight: 'bold' }}>R$ {row.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text></View>
            </View>
          ))}
        </View>

        {/* TOTAIS */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>R$ {(data.globalSalePrice + data.totalDiscount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            {data.totalDiscount > 0 && (
              <View style={styles.discountRow}>
                <Text>Desconto Especial:</Text>
                <Text>- R$ {data.totalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            <View style={styles.grandTotal}>
              <Text>TOTAL FINAL:</Text>
              <Text>R$ {data.globalSalePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            {data.paymentMethod === 'credito' && data.installments > 1 && (
              <Text style={{ fontSize: 7, color: '#00F2FF', textAlign: 'right', marginTop: 5, opacity: 0.8 }}>
                Parcelado em {data.installments}x de R$ {(data.globalSalePrice / data.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
              </Text>
            )}
          </View>
        </View>

        {/* INFORMAÇÕES GERAIS */}
        <View style={styles.obsSection}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <Text style={styles.obsItem}>• Formas de Pagamento: Cartão de Crédito, Dinheiro, Pix.</Text>
          <Text style={styles.obsItem}>• Condições: 50% entrada e 50% na entrega ou parcelamento em até 12x sem juros.</Text>
          <Text style={styles.obsItem}>• Regras Comerciais: Cobrado metragem quadrada mínima de 1.20 m² por peça.</Text>
          <Text style={styles.obsItem}>• Garantia: 12 meses contra defeitos de fabricação.</Text>
          <Text style={styles.obsItem}>• Prazo de Entrega Estimado: 15 a 20 dias úteis após confirmação do pedido.</Text>
        </View>

        {/* ASSINATURA */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <View style={{ width: 180, borderTopWidth: 1, borderTopColor: '#000B1A', marginTop: 2, marginBottom: 5 }} />
          <Text style={{ fontSize: 8, color: '#000B1A', fontWeight: 'bold' }}>RESPONSÁVEL BELLATRIX</Text>
          <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Este documento tem validade de 10 dias.</Text>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold', color: '#000B1A' }}>Bellatrix Persianas - Excelência em Design e Conforto</Text>
          <Text style={{ marginTop: 4 }}>{data.clientName} | {quoteDate} | Foz do Iguaçu - PR</Text>
        </View>

      </Page>
    </Document>
  );
};
