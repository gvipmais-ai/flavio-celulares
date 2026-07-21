import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CreateSaleSchema } from '@/lib/validations';
import { createSale } from '@/services/sale.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'sales:read:own');

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const status = searchParams.get('status');

    const where: any = {};
    if (session?.role === 'OPERADOR_CAIXA') {
      where.operatorId = session.sub;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          operator: { select: { name: true } },
          customer: { select: { name: true } },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'sales:create');

    const body = await req.json();
    const data = CreateSaleSchema.parse(body);

    const activeSession = await prisma.cashSession.findFirst({
      where: { operatorId: session!.sub, status: 'ABERTA' },
    });

    if (!activeSession) {
      return NextResponse.json(
        {
          error: {
            code: 'CASH_SESSION_REQUIRED',
            message: 'Nenhum caixa aberto. Abra o caixa antes de realizar uma venda.',
          },
        },
        { status: 422 }
      );
    }

    const sale = await createSale({
      ...data,
      operatorId: session!.sub,
      cashSessionId: activeSession.id,
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
