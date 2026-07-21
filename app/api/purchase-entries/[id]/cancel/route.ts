import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CancelPurchaseEntrySchema } from '@/lib/validations';
import { decrementStock } from '@/services/inventory.service';
import { createAuditLogTx } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'purchase-entries:cancel');

    const body = await req.json();
    const data = CancelPurchaseEntrySchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.purchaseEntry.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!entry) throw new NotFoundError('Nota de entrada não encontrada');
      if (entry.status === 'CANCELADA') {
        throw new InvalidOperationError('Nota de entrada já está cancelada');
      }

      if (entry.status === 'CONFIRMADA') {
        // Verificar se reversão causaria estoque negativo
        for (const item of entry.items) {
          const resulting = item.product.stockOnHand - item.quantity;
          if (resulting < 0) {
            throw new InvalidOperationError(
              `Cancelamento bloqueado: o produto "${item.product.name}" ficaria com estoque negativo (${resulting}). Faça o ajuste administrativo antes.`
            );
          }
        }

        // Reverter estoque
        for (const item of entry.items) {
          await decrementStock(
            tx,
            item.productId,
            item.quantity,
            'CANCELAMENTO_ENTRADA' as any,
            'PURCHASE_ENTRY_CANCEL',
            entry.id,
            session!.sub,
            `Estorno de Nota #${entry.invoiceNumber}`
          );
        }
      }

      const canceledEntry = await tx.purchaseEntry.update({
        where: { id },
        data: {
          status: 'CANCELADA',
          canceledById: session!.sub,
          canceledAt: new Date(),
          cancellationReason: data.reason,
        },
      });

      await createAuditLogTx(tx, {
        userId: session?.sub,
        action: 'PURCHASE_ENTRY_CANCELED',
        entityType: 'PurchaseEntry',
        entityId: entry.id,
        description: `Nota #${entry.invoiceNumber} cancelada. Motivo: ${data.reason}`,
      });

      return canceledEntry;
    });

    return NextResponse.json({ entry: result });
  } catch (error) {
    return handleApiError(error);
  }
}
