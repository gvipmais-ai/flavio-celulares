import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const cashSession = await prisma.cashSession.findFirst({
      where: { operatorId: session.sub, status: 'ABERTA' },
      include: {
        cashMovements: { orderBy: { createdAt: 'desc' } },
        sales: {
          where: { status: 'CONCLUIDA' },
          select: { id: true, totalAmount: true, payments: true },
        },
      },
    });

    if (!cashSession) {
      return NextResponse.json({ session: null });
    }

    // Totais por forma de pagamento
    const totalsByPaymentMethod: Record<string, number> = {};
    let totalSales = 0;

    for (const sale of cashSession.sales) {
      totalSales += sale.totalAmount.toNumber();
      for (const p of sale.payments) {
        const method = p.paymentMethod;
        totalsByPaymentMethod[method] = (totalsByPaymentMethod[method] || 0) + p.amount.toNumber();
      }
    }

    return NextResponse.json({
      session: {
        id: cashSession.id,
        openedAt: cashSession.openedAt,
        openingAmount: cashSession.openingAmount,
        totalSales,
        totalsByPaymentMethod,
        salesCount: cashSession.sales.length,
        movements: cashSession.cashMovements,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
