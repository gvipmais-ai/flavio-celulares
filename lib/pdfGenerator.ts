import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { formatCurrency, formatPaymentMethod } from './formatters';

interface SaleItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  warrantyMonths?: number;
}

interface SaleData {
  sequentialNumber: number;
  dateFormatted: string;
  customerNameSnapshot: string;
  customerCpfSnapshot?: string | null;
  grossTotal: number;
  discountAmount: number;
  totalAmount: number;
  cartItems: SaleItem[];
  payments: Array<{ paymentMethod: string; amount: number }>;
  change?: number;
}

interface StoreSettings {
  name?: string;
  tradeName?: string;
  address?: string;
  phone?: string;
  cnpj?: string;
}

const THERMAL_WIDTH = 226; // 80mm equivalent
const MARGIN = 10;

export async function generateThermalReceiptPDF(sale: SaleData, settings: StoreSettings): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Calculate dynamic height based on items
  const baseHeight = 300;
  const itemHeight = 35;
  const height = baseHeight + (sale.cartItems.length * itemHeight) + (sale.payments.length * 15);
  
  const page = pdfDoc.addPage([THERMAL_WIDTH, height]);
  let y = height - MARGIN - 20;

  const drawText = (text: string, size: number, isBold = false, align: 'left'|'center'|'right' = 'left', customY?: number) => {
    const activeFont = isBold ? fontBold : font;
    const textWidth = activeFont.widthOfTextAtSize(text, size);
    let x = MARGIN;
    if (align === 'center') x = (THERMAL_WIDTH - textWidth) / 2;
    if (align === 'right') x = THERMAL_WIDTH - MARGIN - textWidth;
    
    page.drawText(text, {
      x,
      y: customY ?? y,
      size,
      font: activeFont,
      color: rgb(0, 0, 0),
    });
    if (customY === undefined) y -= (size + 4);
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: THERMAL_WIDTH - MARGIN, y },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
      dashArray: [2, 2],
    });
    y -= 10;
  };

  // Header
  const storeName = settings?.tradeName || settings?.name || 'FLAVIO CELULARES';
  drawText(storeName, 12, true, 'center');
  y -= 2;
  const address = 'Rua Da Maconaria, 464 - Carinhanha/BA';
  drawText(address, 8, false, 'center');
  const phone = '(77) 99981-6265';
  const cnpj = '17.056.311/0001-75';
  drawText(`Tel: ${phone}  CNPJ: ${cnpj}`, 8, false, 'center');
  
  y -= 5;
  drawLine();

  // Receipt Info
  drawText('CUPOM DE VENDA', 10, true, 'center');
  drawText(`Nº ${sale.sequentialNumber}`, 10, true, 'center');
  y -= 5;
  drawText(`Data: ${sale.dateFormatted}`, 8);
  drawText(`Cliente: ${sale.customerNameSnapshot}`, 8);
  if (sale.customerCpfSnapshot) drawText(`CPF: ${sale.customerCpfSnapshot}`, 8);
  
  y -= 5;
  drawLine();

  // Items Header
  drawText('Qtd  x  Unid', 8, true);
  drawText('Total', 8, true, 'right', y + 12);
  
  y -= 5;

  // Items
  sale.cartItems.forEach(item => {
    const itemTotal = (item.quantity * item.unitPrice) - item.discount;
    drawText(`[${item.code}] ${item.name}`, 8, true);
    
    // Quantity line
    const qtdStr = `${item.quantity} un x ${formatCurrency(item.unitPrice)}`;
    page.drawText(qtdStr, { x: MARGIN, y, size: 8, font });
    
    // Total line
    const totalStr = formatCurrency(itemTotal);
    const totalWidth = fontBold.widthOfTextAtSize(totalStr, 8);
    page.drawText(totalStr, { x: THERMAL_WIDTH - MARGIN - totalWidth, y, size: 8, font: fontBold });
    
    y -= 12;
  });

  drawLine();

  // Totals
  const grossStr = formatCurrency(sale.grossTotal || sale.totalAmount);
  page.drawText('Subtotal:', { x: MARGIN, y, size: 9, font });
  page.drawText(grossStr, { x: THERMAL_WIDTH - MARGIN - font.widthOfTextAtSize(grossStr, 9), y, size: 9, font });
  y -= 12;

  if (sale.discountAmount > 0) {
    const discStr = `- ${formatCurrency(sale.discountAmount)}`;
    page.drawText('DESCONTO:', { x: MARGIN, y, size: 9, font: fontBold });
    page.drawText(discStr, { x: THERMAL_WIDTH - MARGIN - fontBold.widthOfTextAtSize(discStr, 9), y, size: 9, font: fontBold });
    y -= 12;
  }

  y -= 5;
  const totalStr = formatCurrency(sale.totalAmount);
  page.drawText('TOTAL PAGO:', { x: MARGIN, y, size: 11, font: fontBold });
  page.drawText(totalStr, { x: THERMAL_WIDTH - MARGIN - fontBold.widthOfTextAtSize(totalStr, 11), y, size: 11, font: fontBold });
  y -= 16;

  // Payments
  sale.payments.forEach(p => {
    const pStr = formatCurrency(p.amount);
    page.drawText(formatPaymentMethod(p.paymentMethod), { x: MARGIN, y, size: 8, font });
    page.drawText(pStr, { x: THERMAL_WIDTH - MARGIN - font.widthOfTextAtSize(pStr, 8), y, size: 8, font });
    y -= 12;
  });

  if (sale.change && sale.change > 0) {
    const changeStr = formatCurrency(sale.change);
    page.drawText('Troco:', { x: MARGIN, y, size: 9, font: fontBold });
    page.drawText(changeStr, { x: THERMAL_WIDTH - MARGIN - fontBold.widthOfTextAtSize(changeStr, 9), y, size: 9, font: fontBold });
    y -= 12;
  }

  y -= 5;
  drawLine();
  y -= 10;
  drawText('CARIMBO DA LOJA / ASSINATURA', 8, true, 'center');
  y -= 40; // Espaço para assinar
  drawLine();

  drawText('Obrigado pela preferência!', 8, true, 'center');

  const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
  return pdfBytes;
}

export async function generateWarrantyTermPDF(sale: SaleData, settings: StoreSettings): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Calculate dynamic height based on items
  const baseHeight = 450;
  const itemHeight = 25;
  const height = baseHeight + (sale.cartItems.length * itemHeight);
  
  const page = pdfDoc.addPage([THERMAL_WIDTH, height]);
  let y = height - MARGIN - 20;

  const drawText = (text: string, size: number, isBold = false, align: 'left'|'center'|'right' = 'left', customY?: number) => {
    const activeFont = isBold ? fontBold : font;
    const textWidth = activeFont.widthOfTextAtSize(text, size);
    let x = MARGIN;
    if (align === 'center') x = (THERMAL_WIDTH - textWidth) / 2;
    if (align === 'right') x = THERMAL_WIDTH - MARGIN - textWidth;
    
    page.drawText(text, {
      x,
      y: customY ?? y,
      size,
      font: activeFont,
      color: rgb(0, 0, 0),
    });
    if (customY === undefined) y -= (size + 4);
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: THERMAL_WIDTH - MARGIN, y },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
      dashArray: [2, 2],
    });
    y -= 10;
  };

  // Header
  const storeName = settings?.tradeName || settings?.name || 'FLAVIO CELULARES';
  drawText(storeName, 12, true, 'center');
  y -= 2;
  const address = 'Rua Da Maconaria, 464 - Carinhanha/BA';
  drawText(address, 8, false, 'center');
  const phone = '(77) 99981-6265';
  const cnpj = '17.056.311/0001-75';
  drawText(`Tel: ${phone}  CNPJ: ${cnpj}`, 8, false, 'center');
  
  y -= 5;
  drawLine();

  // Warranty Title
  drawText('TERMO DE GARANTIA', 10, true, 'center');
  drawText(`Venda Nº ${sale.sequentialNumber}`, 9, true, 'center');
  y -= 5;
  drawText(`Data: ${sale.dateFormatted}`, 8);
  drawText(`Cliente: ${sale.customerNameSnapshot}`, 8);
  if (sale.customerCpfSnapshot) drawText(`CPF: ${sale.customerCpfSnapshot}`, 8);
  
  y -= 5;
  drawLine();

  // Items
  drawText('ITENS E GARANTIA:', 8, true);
  y -= 5;

  sale.cartItems.forEach(item => {
    drawText(`[${item.code}] ${item.name}`, 8, true);
    if (item.warrantyMonths && item.warrantyMonths > 0) {
      page.drawText(`Garantia: ${item.warrantyMonths} meses`, { x: MARGIN, y, size: 8, font });
    } else {
      page.drawText(`Garantia: Sem garantia`, { x: MARGIN, y, size: 8, font });
    }
    y -= 12;
  });

  drawLine();

  // Warranty Conditions
  drawText('CONDIÇÕES DE GARANTIA E CUIDADOS:', 8, true);
  y -= 5;
  
  const conditions = [
    '1. A garantia legal cobre APENAS defeitos de',
    'fabricação da peça substituída.',
    '2. PRAZO: 90 dias a contar da data de entrega',
    'desta via, mediante apresentação da mesma.',
    '3. PERDA DA GARANTIA: Quedas, quebras,',
    'arranhões profundos, contato com líquidos ou',
    'umidade, uso de carregadores de má qualidade',
    'ou se o selo de garantia for rompido.',
    '4. TELA/DISPLAY: Listras, manchas ou tela',
    'apagada sem motivo aparente passarão por',
    'análise técnica para atestar que não houve',
    'pressão ou queda.',
    '5. LIMPEZA: Utilize apenas pano macio e seco.',
    '6. A PERDA DESTA VIA INVALIDA A GARANTIA.'
  ];

  conditions.forEach(c => {
    page.drawText(c, { x: MARGIN, y, size: 8, font });
    y -= 12;
  });

  y -= 15;
  
  // Signature Box
  drawLine();
  y -= 10;
  drawText('CARIMBO DA LOJA E ASSINATURA', 8, true, 'center');
  y -= 100; // Espaço GRANDE para carimbo e assinatura
  drawLine();
  drawText(`${settings?.tradeName || settings?.name || 'FLAVIO CELULARES'}`, 8, true, 'center');

  const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
  return pdfBytes;
}

export async function generateOsEntryReceiptPDF(os: any, settings: StoreSettings): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let extraHeight = 0;
  const latestQuote = os.quotes && os.quotes.length > 0 ? os.quotes[0] : null;
  if (latestQuote) {
    extraHeight += 80 + (latestQuote.items?.length || 0) * 15;
    if (latestQuote.laborAmount > 0) extraHeight += 15;
  }
  
  const height = 550 + extraHeight;
  const page = pdfDoc.addPage([THERMAL_WIDTH, height]);
  let y = height - MARGIN - 20;

  const drawText = (text: string, size: number, isBold = false, align: 'left'|'center'|'right' = 'left', customY?: number) => {
    const activeFont = isBold ? fontBold : font;
    const textWidth = activeFont.widthOfTextAtSize(text, size);
    let x = MARGIN;
    if (align === 'center') x = (THERMAL_WIDTH - textWidth) / 2;
    if (align === 'right') x = THERMAL_WIDTH - MARGIN - textWidth;
    
    page.drawText(text, {
      x,
      y: customY ?? y,
      size,
      font: activeFont,
      color: rgb(0, 0, 0),
    });
    if (customY === undefined) y -= (size + 4);
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: THERMAL_WIDTH - MARGIN, y },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
      dashArray: [2, 2],
    });
    y -= 10;
  };

  // Header
  const storeName = settings?.tradeName || settings?.name || 'FLAVIO CELULARES';
  drawText(storeName, 12, true, 'center');
  y -= 2;
  const address = 'Rua Da Maconaria, 464 - Carinhanha/BA';
  drawText(address, 8, false, 'center');
  const phone = '(77) 99981-6265';
  const cnpj = '17.056.311/0001-75';
  drawText(`Tel: ${phone}  CNPJ: ${cnpj}`, 8, false, 'center');
  
  y -= 5;
  drawLine();

  // Title
  drawText('ORDEM DE SERVIÇO', 11, true, 'center');
  drawText(`COMPROVANTE DE ENTRADA`, 9, true, 'center');
  drawText(`OS Nº ${os.sequentialNumber}`, 10, true, 'center');
  
  y -= 5;
  drawLine();

  // Customer & Device
  const dateStr = os.receivedAt ? new Date(os.receivedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  drawText(`Data: ${dateStr}`, 8);
  drawText(`Cliente: ${os.customer?.name || os.customerNameSnapshot}`, 8);
  if (os.customer?.phone) drawText(`Tel: ${os.customer.phone}`, 8);
  
  y -= 5;
  drawLine();
  drawText('DADOS DO APARELHO:', 8, true);
  y -= 2;
  drawText(`Modelo: ${os.deviceBrandSnapshot} ${os.deviceModelSnapshot}`, 8);
  if (os.imei) drawText(`IMEI: ${os.imei}`, 8);
  if (os.color) drawText(`Cor: ${os.color}`, 8);
  
  if (os.accessoriesReceived) {
    y -= 5;
    drawText('ACESSÓRIOS DEIXADOS:', 8, true);
    y -= 2;
    
    // Simple wrap for accessories text (max 40 chars per line for 80mm paper)
    const accText = os.accessoriesReceived;
    for (let i = 0; i < accText.length; i += 40) {
      drawText(accText.substring(i, i + 40), 8);
    }
  }

  y -= 5;
  drawLine();
  drawText('DEFEITO RELATADO:', 8, true);
  y -= 2;
  
  // Wrap defect text
  const defectText = os.reportedIssue;
  for (let i = 0; i < defectText.length; i += 40) {
    drawText(defectText.substring(i, i + 40), 8);
  }

  // Se houver orçamento/peças usadas
  if (latestQuote) {
    y -= 5;
    drawLine();
    drawText('ORÇAMENTO / SERVIÇO:', 8, true);
    y -= 2;
    latestQuote.items?.forEach((item: any) => {
      const line = `${item.quantity}x ${item.descriptionSnapshot}`;
      page.drawText(line, { x: MARGIN, y, size: 8, font });
      
      const priceStr = formatCurrency(item.quantity * item.unitPrice);
      page.drawText(priceStr, { x: THERMAL_WIDTH - MARGIN - font.widthOfTextAtSize(priceStr, 8), y, size: 8, font });
      y -= 12;
    });
    
    if (latestQuote.laborAmount > 0) {
      page.drawText('Mão de Obra', { x: MARGIN, y, size: 8, font });
      const laborStr = formatCurrency(latestQuote.laborAmount);
      page.drawText(laborStr, { x: THERMAL_WIDTH - MARGIN - font.widthOfTextAtSize(laborStr, 8), y, size: 8, font });
      y -= 12;
    }
    
    y -= 5;
    const totalStr = formatCurrency(latestQuote.totalAmount);
    page.drawText('TOTAL PREVISTO:', { x: MARGIN, y, size: 9, font: fontBold });
    page.drawText(totalStr, { x: THERMAL_WIDTH - MARGIN - fontBold.widthOfTextAtSize(totalStr, 9), y, size: 9, font: fontBold });
    y -= 5;
  }

  y -= 5;
  drawLine();
  drawText('TERMO DE RESPONSABILIDADE', 8, true, 'center');
  y -= 5;
  const terms = [
    '1. Autorizo a abertura e avaliação.',
    '2. Aparelhos não retirados em 90 dias',
    'serão vendidos p/ custear o serviço.',
    '3. A loja não se responsabiliza por',
    'dados (fotos, contatos). Faça backup!',
    '4. Garantia válida apenas para a peça',
    'trocada, não cobre quedas ou água.',
    '5. Sem este cupom, a retirada só será',
    'feita pelo titular com documento.'
  ];
  terms.forEach(t => {
    drawText(t, 7, false, 'center');
  });

  y -= 70; // Espaço GRANDE para assinatura
  drawLine();
  y -= 5;
  drawText('ASSINATURA DO CLIENTE', 8, true, 'center');

  y -= 15;
  drawText('Data: _____/_____/_______', 8, false, 'center');

  const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
  return pdfBytes;
}

