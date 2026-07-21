import PDFDocument from 'pdfkit';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

interface ReceiptData {
  store: {
    name: string;
    address?: string | null;
    phone?: string | null;
    footerText?: string | null;
  };
  sale: {
    sequentialNumber: number;
    createdAt: Date;
    operatorName: string;
    customerName: string;
    customerCpf?: string | null;
    grossAmount: number;
    discountAmount: number;
    totalAmount: number;
    items: Array<{
      productCodeSnapshot: string;
      productNameSnapshot: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
      warrantyMonthsSnapshot: number;
    }>;
    payments: Array<{
      paymentMethod: string;
      amount: number;
    }>;
  };
}

export function generateReceiptPdf(data: ReceiptData, isThermal = true): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 80mm thermal receipt = ~226pt width
    const doc = new PDFDocument({
      size: isThermal ? [226, 600] : 'A4',
      margin: isThermal ? 10 : 36,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const width = isThermal ? 206 : 520;

    // Cabeçalho da Loja
    doc.fontSize(12).font('Helvetica-Bold').text(data.store.name, { align: 'center' });
    if (data.store.address) doc.fontSize(8).font('Helvetica').text(data.store.address, { align: 'center' });
    if (data.store.phone) doc.fontSize(8).text(`Tel: ${data.store.phone}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(8).text('------------------------------------------------', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('COMPROVANTE DE VENDA', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text('DOCUMENTO NÃO FISCAL', { align: 'center' });
    doc.text('------------------------------------------------', { align: 'center' });

    // Dados da Venda
    doc.moveDown(0.5);
    doc.fontSize(8);
    doc.text(`Venda Nº: ${data.sale.sequentialNumber}`);
    doc.text(`Data: ${formatDateTime(data.sale.createdAt)}`);
    doc.text(`Operador: ${data.sale.operatorName}`);
    doc.text(`Cliente: ${data.sale.customerName}`);
    if (data.sale.customerCpf) doc.text(`CPF: ${data.sale.customerCpf}`);

    doc.moveDown(0.5);
    doc.text('------------------------------------------------', { align: 'center' });
    doc.font('Helvetica-Bold').text('ITENS DA VENDA');
    doc.font('Helvetica');

    // Itens
    for (const item of data.sale.items) {
      doc.text(`${item.productCodeSnapshot} ${item.productNameSnapshot}`);
      doc.text(
        `  ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`
      );
      if (item.warrantyMonthsSnapshot > 0) {
        doc.text(`  Garantia: ${item.warrantyMonthsSnapshot} meses`, { characterSpacing: 0.5 });
      }
    }

    doc.text('------------------------------------------------', { align: 'center' });

    // Totais
    doc.text(`Subtotal: ${formatCurrency(data.sale.grossAmount)}`);
    if (data.sale.discountAmount > 0) {
      doc.text(`Desconto: -${formatCurrency(data.sale.discountAmount)}`);
    }
    doc.font('Helvetica-Bold').fontSize(10).text(`TOTAL: ${formatCurrency(data.sale.totalAmount)}`);
    doc.font('Helvetica').fontSize(8);

    doc.moveDown(0.5);
    doc.text('Formas de Pagamento:');
    for (const p of data.sale.payments) {
      doc.text(`  ${p.paymentMethod}: ${formatCurrency(p.amount)}`);
    }

    doc.moveDown(0.5);
    doc.text('------------------------------------------------', { align: 'center' });
    if (data.store.footerText) {
      doc.text(data.store.footerText, { align: 'center' });
    }
    doc.text('Obrigado pela preferência!', { align: 'center' });

    doc.end();
  });
}
