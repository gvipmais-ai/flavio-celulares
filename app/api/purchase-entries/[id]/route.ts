import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'purchase-entries:create');

    const entry = await prisma.purchaseEntry.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { name: true } },
        confirmedBy: { select: { name: true } },
        items: { include: { product: true } },
      },
    });

    if (!entry) throw new NotFoundError('Nota de entrada não encontrada');

    return NextResponse.json({ entry });
  } catch (error) {
    return handleApiError(error);
  }
}
