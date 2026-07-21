import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { consumeReservation } from '@/services/inventory.service';
import { createAuditLogTx } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'parts:consume');

    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id },
        include: { reservations: true, serviceOrder: true },
      });

      if (!quote) throw new NotFoundError('Orçamento não encontrado');

      const activeReservations = quote.reservations.filter((r) => r.status === 'ATIVA');

      for (const res of activeReservations) {
        await consumeReservation(tx, res.id, session!.sub);
      }

      await tx.serviceOrder.update({
        where: { id: quote.serviceOrderId },
        data: {
          status: 'EM_REPARO',
          statusHistory: {
            create: {
              previousStatus: quote.serviceOrder.status,
              newStatus: 'EM_REPARO',
              notes: 'Reparo iniciado. Peças consumidas do estoque físico.',
              userId: session!.sub,
            },
          },
        },
      });

      await createAuditLogTx(tx, {
        userId: session?.sub,
        action: 'RESERVATION_CONSUMED',
        entityType: 'Quote',
        entityId: quote.id,
        description: `Consumo de ${activeReservations.length} peças reservadas para a OS #${quote.serviceOrder.sequentialNumber}`,
      });

      return { consumedCount: activeReservations.length };
    });

    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
