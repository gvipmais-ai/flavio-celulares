import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { reserveStock } from '@/services/inventory.service';
import { createAuditLogTx } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'quotes:approve');

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id },
        include: { items: true, serviceOrder: true },
      });

      if (!quote) throw new NotFoundError('Orçamento não encontrado');
      if (quote.status === 'APROVADO') {
        throw new InvalidOperationError('Orçamento já está aprovado');
      }

      // Reservar peças do estoque
      for (const item of quote.items) {
        if (item.itemType === 'PECA' && item.productId) {
          await reserveStock(
            tx,
            item.productId,
            item.quantity,
            quote.serviceOrderId,
            quote.id,
            session!.sub
          );
        }
      }

      // Atualizar status do orçamento e da ordem de serviço
      const updatedQuote = await tx.quote.update({
        where: { id },
        data: {
          status: 'APROVADO',
          approvedAt: new Date(),
        },
      });

      await tx.serviceOrder.update({
        where: { id: quote.serviceOrderId },
        data: {
          status: 'APROVADO',
          statusHistory: {
            create: {
              previousStatus: quote.serviceOrder.status,
              newStatus: 'APROVADO',
              notes: `Orçamento v${quote.version} aprovado pelo cliente`,
              userId: session!.sub,
            },
          },
        },
      });

      await createAuditLogTx(tx, {
        userId: session?.sub,
        action: 'QUOTE_APPROVED',
        entityType: 'Quote',
        entityId: quote.id,
        description: `Orçamento v${quote.version} aprovado para OS #${quote.serviceOrder.sequentialNumber}. Peças reservadas.`,
      });

      return updatedQuote;
    });

    return NextResponse.json({ quote: result });
  } catch (error) {
    return handleApiError(error);
  }
}
