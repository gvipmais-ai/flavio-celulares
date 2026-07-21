// @ts-ignore
import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';

interface LabelItem {
  code: string;
  name: string;
  price: number;
  quantity: number;
}

export async function generateBarcodeBuffer(code: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text: code,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  });
}

export async function generateLabelsPdf(items: LabelItem[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 20 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      let x = 20;
      let y = 20;
      const labelWidth = 130;
      const labelHeight = 70;
      const cols = 4;

      let col = 0;

      for (const item of items) {
        const barcodeBuffer = await generateBarcodeBuffer(item.code);

        for (let i = 0; i < item.quantity; i++) {
          doc.rect(x, y, labelWidth, labelHeight).strokeColor('#ccc').stroke();

          doc.fontSize(8).font('Helvetica-Bold').text(item.name.substring(0, 20), x + 5, y + 5, { width: labelWidth - 10 });
          doc.fontSize(7).font('Helvetica').text(`R$ ${item.price.toFixed(2)}`, x + 5, y + 18);

          doc.image(barcodeBuffer, x + 10, y + 30, { width: labelWidth - 20, height: 30 });

          col++;
          if (col >= cols) {
            col = 0;
            x = 20;
            y += labelHeight + 10;
            if (y > 750) {
              doc.addPage();
              x = 20;
              y = 20;
            }
          } else {
            x += labelWidth + 10;
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
