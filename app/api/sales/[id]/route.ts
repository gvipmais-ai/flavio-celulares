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
    requirePermission(session, 'sales:read:own');

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        operator: { select: { name: true } },
        customer: { select: { name: true, cpf: true, phone: true } },
        items: { include: { product: { select: { code: true, name: true } } } },
        payments: true,
      },
    });

    if (!sale) throw new NotFoundError('Venda não encontrada');

    if (session?.role === 'OPERADOR_CAIXA' && sale.operatorId !== session.sub) {
      throw new NotFoundError('Venda não encontrada');
    }

    return NextResponse.json({ sale });
  } catch (error) {
    return handleApiError(error);
  }
}
