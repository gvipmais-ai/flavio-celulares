import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:read');

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        checklistItems: { orderBy: { displayOrder: 'asc' } },
        statusHistory: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        quotes: {
          include: { items: true, reservations: { include: { product: true } } },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!serviceOrder) throw new NotFoundError('Ordem de serviço não encontrada');

    return NextResponse.json({ serviceOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
