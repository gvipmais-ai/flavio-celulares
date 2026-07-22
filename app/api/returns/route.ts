import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import { processReturnOrExchange } from '@/services/return.service';
import z from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const returns = await prisma.return.findMany({
      include: {
        sale: true,
        product: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ returns });
  } catch (error) {
    return handleApiError(error);
  }
}

const CreateReturnSchema = z.object({
  saleId: z.string(),
  saleItemId: z.string(),
  quantity: z.number().int().min(1),
  reason: z.string().min(5).max(200),
  defectDescription: z.string().optional().nullable(),
  type: z.enum(['TROCA_GARANTIA', 'DEVOLUCAO', 'DEVOLUCAO_FORA_GARANTIA']),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const data = CreateReturnSchema.parse(body);

    // Get an open cash session for this user if it's a TROCA
    let cashSessionId = undefined;
    if (data.type === 'TROCA_GARANTIA') {
      const openSession = await prisma.cashSession.findFirst({
        where: { operatorId: session.sub, status: 'ABERTA' },
      });
      if (!openSession && session.role !== 'SUPERADMIN' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Você precisa de um caixa aberto para realizar uma troca direta.' } }, { status: 400 });
      }
      cashSessionId = openSession?.id;
    }

    const isOutOfWarranty = data.type === 'DEVOLUCAO_FORA_GARANTIA';
    const isManager = session.role === 'SUPERADMIN' || session.role === 'ADMIN';

    const result = await processReturnOrExchange({
      saleId: data.saleId,
      saleItemId: data.saleItemId,
      quantity: data.quantity,
      reason: data.reason,
      defectDescription: data.defectDescription || undefined,
      type: data.type,
      createdById: session.sub,
      authorizedById: (isOutOfWarranty && isManager) ? session.sub : undefined,
      cashSessionId,
      notes: data.notes || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
