import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true, returns: true }
        },
        serviceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { deviceModel: { include: { brand: true } } }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
