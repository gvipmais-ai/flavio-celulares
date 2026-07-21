import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { incrementStock } from '@/services/inventory.service';
import { createAuditLogTx } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'purchase-entries:confirm');

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.purchaseEntry.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!entry) throw new NotFoundError('Nota de entrada não encontrada');
      if (entry.status !== 'RASCUNHO') {
        throw new InvalidOperationError('Apenas notas em rascunho podem ser confirmadas');
      }

      // Check duplicidade
      const duplicate = await tx.purchaseEntry.findFirst({
        where: {
          supplierId: entry.supplierId,
          invoiceNumber: entry.invoiceNumber,
          invoiceSeries: entry.invoiceSeries,
          status: 'CONFIRMADA',
          id: { not: entry.id },
        },
      });

      if (duplicate) {
        throw new ConflictError('Já existe uma nota confirmada com este mesmo número e série para o fornecedor.');
      }

      for (const item of entry.items) {
        await incrementStock(
          tx,
          item.productId,
          item.quantity,
          'ENTRADA_MERCADORIA' as any,
          'PURCHASE_ENTRY',
          entry.id,
          session!.sub,
          `Entrada por Nota Fiscal #${entry.invoiceNumber}`,
          item.unitCost.toNumber()
        );
      }

      const confirmedEntry = await tx.purchaseEntry.update({
        where: { id },
        data: {
          status: 'CONFIRMADA',
          confirmedById: session!.sub,
          confirmedAt: new Date(),
        },
      });

      await createAuditLogTx(tx, {
        userId: session?.sub,
        action: 'PURCHASE_ENTRY_CONFIRMED',
        entityType: 'PurchaseEntry',
        entityId: entry.id,
        description: `Nota de entrada #${entry.invoiceNumber} confirmada. Total: R$ ${entry.totalAmount.toFixed(2)}`,
      });

      return confirmedEntry;
    });

    return NextResponse.json({ entry: result });
  } catch (error) {
    return handleApiError(error);
  }
}
