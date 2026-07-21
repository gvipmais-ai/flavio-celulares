import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'stock:read');

    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;

    const where = productId ? { productId } : {};

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { code: true, name: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
