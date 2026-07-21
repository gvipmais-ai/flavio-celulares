import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { CloseCashSessionSchema } from '@/lib/validations';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'cash:close');

    const cashSession = await prisma.cashSession.findUnique({
      where: { id },
      include: { cashMovements: true },
    });

    if (!cashSession) throw new NotFoundError('Sessão de caixa não encontrada');
    if (cashSession.status === 'FECHADA') throw new InvalidOperationError('Caixa já está fechado.');

    if (session?.role !== 'SUPERADMIN' && cashSession.operatorId !== session?.sub) {
      throw new InvalidOperationError('Você só pode fechar o seu próprio caixa.');
    }

    const body = await req.json();
    const data = CloseCashSessionSchema.parse(body);

    let expectedAmount = cashSession.openingAmount;
    for (const mov of cashSession.cashMovements) {
      if (mov.type === 'SUPRIMENTO' || mov.type === 'VENDA') {
        expectedAmount = expectedAmount.plus(mov.amount);
      } else if (mov.type === 'SANGRIA' || mov.type === 'CANCELAMENTO') {
        expectedAmount = expectedAmount.minus(mov.amount);
      }
    }

    const informedAmount = new Decimal(data.informedAmount);
    const difference = informedAmount.minus(expectedAmount);

    const updatedSession = await prisma.cashSession.update({
      where: { id },
      data: {
        status: 'FECHADA',
        closedAt: new Date(),
        expectedAmount,
        informedAmount,
        difference,
        notes: data.notes,
        cashMovements: {
          create: {
            type: 'FECHAMENTO',
            amount: informedAmount,
            reason: `Fechamento de caixa. Esperado: R$ ${expectedAmount.toFixed(2)}, Informado: R$ ${informedAmount.toFixed(2)}, Dif: R$ ${difference.toFixed(2)}`,
            userId: session!.sub,
          },
        },
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'CASH_SESSION_CLOSED',
      entityType: 'CashSession',
      entityId: updatedSession.id,
      description: `Caixa fechado. Informado: R$ ${informedAmount.toFixed(2)}, Diferença: R$ ${difference.toFixed(2)}`,
    });

    return NextResponse.json({ cashSession: updatedSession });
  } catch (error) {
    return handleApiError(error);
  }
}
