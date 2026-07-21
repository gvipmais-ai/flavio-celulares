import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { UpdateServiceOrderStatusSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:update');

    const body = await req.json();
    const data = UpdateServiceOrderStatusSchema.parse(body);

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!serviceOrder) throw new NotFoundError('Ordem de serviço não encontrada');

    const updated = await prisma.$transaction(async (tx) => {
      const isDelivered = data.status === 'ENTREGUE';

      const order = await tx.serviceOrder.update({
        where: { id },
        data: {
          status: data.status,
          ...(isDelivered ? { deliveredAt: new Date() } : {}),
          statusHistory: {
            create: {
              previousStatus: serviceOrder.status,
              newStatus: data.status,
              notes: data.notes,
              userId: session!.sub,
            },
          },
        },
      });

      return order;
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'SERVICE_ORDER_STATUS_CHANGED',
      entityType: 'ServiceOrder',
      entityId: serviceOrder.id,
      description: `OS #${serviceOrder.sequentialNumber}: status alterado de ${serviceOrder.status} para ${data.status}`,
    });

    return NextResponse.json({ serviceOrder: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
