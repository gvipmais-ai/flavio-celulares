import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    await requirePermission(session, 'service-orders:update');

    const result = await prisma.$transaction(async (tx) => {
      const os = await tx.serviceOrder.findUnique({
        where: { id },
      });

      if (!os) throw new NotFoundError('Ordem de serviço não encontrada');

      const updatedOs = await tx.serviceOrder.update({
        where: { id },
        data: {
          status: 'PRONTO_PARA_ENTREGA',
          statusHistory: {
            create: {
              previousStatus: os.status,
              newStatus: 'PRONTO_PARA_ENTREGA',
              notes: 'Reparo finalizado. Aparelho pronto para entrega e pagamento.',
              userId: session!.sub,
            },
          },
        },
      });

      return updatedOs;
    });

    return NextResponse.json({ serviceOrder: result });
  } catch (error) {
    return handleApiError(error);
  }
}
