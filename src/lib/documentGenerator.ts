import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

export const generateWordDocument = async (quoteData: any) => {
  try {
    // Carrega o arquivo modelo da pasta public
    const response = await fetch('/Pedido_fabrica.docx');
    
    if (!response.ok) {
      throw new Error('Modelo Pedido_fabrica.docx não encontrado na pasta public');
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const zip = new PizZip(arrayBuffer);
    
    // Inicia o Docxtemplater com o conteúdo do arquivo
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Mapeamento dos dados do pedido para as tags do Word
    const flatItems = quoteData.items.map((item: any, index: number) => ({
      item_num: index + 1,
      produto: item.product.name,
      cor: item.color || "Padrão",
      largura: item.width,
      altura: item.height,
      qtd: item.quantity,
      m2: (item.width * item.height * item.quantity).toFixed(2)
    }));

    // Preenche as tags (ex: {nome_cliente}, {telefone}, {#items} ... {/items})
    doc.render({
      nome_cliente: quoteData.clientName,
      telefone: quoteData.clientPhone || "",
      endereco: quoteData.clientAddress || "",
      data_pedido: new Date().toLocaleDateString('pt-BR'),
      total: quoteData.globalSalePrice.toFixed(2),
      pagamento: quoteData.paymentMethod,
      items: flatItems,
    });

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    saveAs(out, `Pedido_${quoteData.clientName.replace(/\s+/g, '_')}.docx`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao gerar Word:', error);
    return { success: false, error: error.message };
  }
};

export const generateExcelDocument = async (quoteData: any) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Tenta ler o arquivo modelo (precisa ser xlsx para o exceljs ler via ArrayBuffer)
    const response = await fetch('/Pedido_fabrica.xlsx');
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
    } else {
      // Se não encontrar o modelo, cria um básico em branco para garantir que funcione
      console.warn('Modelo Pedido_fabrica.xlsx não encontrado, gerando layout em branco');
      const sheet = workbook.addWorksheet('Pedido');
      sheet.addRow(['PEDIDO DE FÁBRICA']);
      sheet.addRow(['Cliente:', quoteData.clientName]);
      sheet.addRow(['Data:', new Date().toLocaleDateString('pt-BR')]);
      sheet.addRow([]);
      sheet.addRow(['Item', 'Produto', 'Cor', 'Largura', 'Altura', 'Qtd', 'M2']);
      
      quoteData.items.forEach((item: any, index: number) => {
        sheet.addRow([
          index + 1,
          item.product.name,
          item.color || "-",
          item.width,
          item.height,
          item.quantity,
          (item.width * item.height * item.quantity).toFixed(2)
        ]);
      });
    }

    // Exporta o arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Pedido_${quoteData.clientName.replace(/\s+/g, '_')}.xlsx`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao gerar Excel:', error);
    return { success: false, error: error.message };
  }
};
