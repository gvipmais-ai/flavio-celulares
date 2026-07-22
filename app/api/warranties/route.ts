import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ sales: [] });
    }

    // A simple heuristic for searching sales for warranty:
    // Try to match sequential number (if it's a number), or clientTransactionId, or customer name
    
    let sequentialNumberQuery = undefined;
    if (!isNaN(Number(query))) {
      sequentialNumberQuery = Number(query);
    }

    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          sequentialNumberQuery ? { sequentialNumber: sequentialNumberQuery } : {},
          { clientTransactionId: { contains: query } },
          { customerNameSnapshot: { contains: query } },
          { customerCpfSnapshot: { contains: query } },
          { items: { some: { productCodeSnapshot: { contains: query } } } }
        ]
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ sales });
  } catch (error) {
    return handleApiError(error);
  }
}
