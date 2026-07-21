import PDFDocument from 'pdfkit';
import { formatDateTime } from '@/lib/formatters';

interface ServiceOrderReceiptData {
  store: {
    name: string;
    phone?: string | null;
    address?: string | null;
    serviceOrderTerms?: string | null;
  };
  serviceOrder: {
    sequentialNumber: number;
    createdAt: Date;
    customerName: string;
    customerPhone?: string | null;
    deviceBrandSnapshot: string;
    deviceModelSnapshot: string;
    imei?: string | null;
    color?: string | null;
    accessoriesReceived?: string | null;
    reportedIssue: string;
    visualCondition?: string | null;
    checklistItems: Array<{
      descriptionSnapshot: string;
      result: string;
    }>;
  };
}

export function generateServiceOrderReceiptPdf(data: ServiceOrderReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text(data.store.name, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('COMPROVANTE DE ENTRADA - ASSISTÊNCIA TÉCNICA', { align: 'center' });
    if (data.store.phone) doc.fontSize(8).text(`Telefone: ${data.store.phone}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text(`ORDEM DE SERVIÇO Nº ${String(data.serviceOrder.sequentialNumber).padStart(6, '0')}`);
    doc.fontSize(9).font('Helvetica').text(`Data de Entrada: ${formatDateTime(data.serviceOrder.createdAt)}`);

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('CLIENTE & APARELHO');
    doc.fontSize(9).font('Helvetica');
    doc.text(`Cliente: ${data.serviceOrder.customerName}`);
    if (data.serviceOrder.customerPhone) doc.text(`Telefone: ${data.serviceOrder.customerPhone}`);
    doc.text(`Aparelho: ${data.serviceOrder.deviceBrandSnapshot} ${data.serviceOrder.deviceModelSnapshot} (${data.serviceOrder.color || 'N/I'})`);
    if (data.serviceOrder.imei) doc.text(`IMEI: ${data.serviceOrder.imei}`);
    if (data.serviceOrder.accessoriesReceived) doc.text(`Acessórios: ${data.serviceOrder.accessoriesReceived}`);

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('DEFEITO RELATADO & ESTADO VISUAL');
    doc.fontSize(9).font('Helvetica');
    doc.text(`Defeito: ${data.serviceOrder.reportedIssue}`);
    if (data.serviceOrder.visualCondition) doc.text(`Condição Visual: ${data.serviceOrder.visualCondition}`);

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('CHECKLIST DE RECEBIMENTO');
    doc.fontSize(8).font('Helvetica');
    for (const item of data.serviceOrder.checklistItems) {
      doc.text(`- ${item.descriptionSnapshot}: [ ${item.result} ]`);
    }

    doc.moveDown(1.5);
    if (data.store.serviceOrderTerms) {
      doc.fontSize(7).text(data.store.serviceOrderTerms, { align: 'justify' });
    }

    doc.moveDown(2);
    doc.fontSize(9).text('_________________________________________________', { align: 'center' });
    doc.text('Assinatura do Cliente', { align: 'center' });

    doc.end();
  });
}
