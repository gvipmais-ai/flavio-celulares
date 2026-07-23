import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { formatCurrency, formatPaymentMethod } from './formatters';

interface SaleItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
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
  storeName: string;
  address: string;
  phone: string;
  cnpj: string;
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
  drawText(settings.storeName || 'LOJA', 12, true, 'center');
  y -= 2;
  drawText(settings.address || 'Endereço não cadastrado', 8, false, 'center');
  drawText(`${settings.phone ? 'Tel: '+settings.phone : ''} ${settings.cnpj ? ' CNPJ: '+settings.cnpj : ''}`, 8, false, 'center');
  
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

  drawText('Obrigado pela preferência!', 8, true, 'center');

  const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
  return pdfBytes;
}
