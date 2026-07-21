import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// ─── POST /api/products/[id]/approve ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:approve');

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError('Produto não encontrado.');
    }

    if (product.approvalStatus === 'APROVADO') {
      throw new ConflictError(`O produto "${product.name}" já está aprovado.`);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { approvalStatus: 'APROVADO' },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    void createAuditLog({
      userId: session!.sub,
      action: 'PRODUCT_APPROVED',
      entityType: 'Product',
      entityId: id,
      description: `Produto "${product.name}" (${product.code}) aprovado por "${session!.name}".`,
      metadata: {
        previousStatus: product.approvalStatus,
        newStatus: 'APROVADO',
        approvedBy: session!.sub,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
