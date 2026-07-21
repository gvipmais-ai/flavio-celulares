import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { StockAdjustmentSchema } from '@/lib/validations';
import { adjustStock } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'stock:read');

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const belowMin = searchParams.get('belowMin') === 'true';

    const where: any = { isActive: true, approvalStatus: 'APROVADO' };
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { name: 'asc' },
    });

    const data = products
      .map((p) => ({
        ...p,
        stockAvailable: p.stockOnHand - p.stockReserved,
      }))
      .filter((p) => !belowMin || p.stockOnHand <= p.minimumStock);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
