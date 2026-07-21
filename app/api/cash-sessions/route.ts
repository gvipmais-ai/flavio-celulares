import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { OpenCashSessionSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'cash:read:own');

    const where = session?.role === 'SUPERADMIN' ? {} : { operatorId: session?.sub };

    const sessions = await prisma.cashSession.findMany({
      where,
      include: { operator: { select: { name: true } } },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ data: sessions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'cash:open');

    const activeSession = await prisma.cashSession.findFirst({
      where: { operatorId: session?.sub, status: 'ABERTA' },
    });

    if (activeSession) {
      throw new ConflictError('Você já possui uma sessão de caixa aberta.');
    }

    const body = await req.json();
    const data = OpenCashSessionSchema.parse(body);

    const cashSession = await prisma.cashSession.create({
      data: {
        operatorId: session!.sub,
        openingAmount: data.openingAmount,
        status: 'ABERTA',
        cashMovements: {
          create: {
            type: 'ABERTURA',
            amount: data.openingAmount,
            reason: 'Abertura de caixa',
            userId: session!.sub,
          },
        },
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'CASH_SESSION_OPENED',
      entityType: 'CashSession',
      entityId: cashSession.id,
      description: `Caixa aberto com R$ ${data.openingAmount.toFixed(2)}`,
    });

    return NextResponse.json({ cashSession }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
