import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { CashMovementSchema } from '@/lib/validations';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'cash:read:own');

    const movements = await prisma.cashMovement.findMany({
      where: { cashSessionId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: movements });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'cash:supplement');

    const cashSession = await prisma.cashSession.findUnique({
      where: { id },
    });

    if (!cashSession || cashSession.status !== 'ABERTA') {
      throw new InvalidOperationError('Caixa não está aberto');
    }

    const body = await req.json();
    const data = CashMovementSchema.parse(body);

    const movement = await prisma.cashMovement.create({
      data: {
        cashSessionId: id,
        type: data.type,
        amount: new Decimal(data.amount),
        reason: data.reason,
        userId: session!.sub,
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: data.type === 'SUPRIMENTO' ? 'CASH_SUPPLEMENT' : 'CASH_WITHDRAWAL',
      entityType: 'CashMovement',
      entityId: movement.id,
      description: `${data.type}: R$ ${data.amount.toFixed(2)}. Motivo: ${data.reason}`,
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
