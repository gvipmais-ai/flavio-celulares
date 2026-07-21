import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { BrandSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';

// ─── GET /api/brands ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'products:read');

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const isActiveParam = searchParams.get('isActive');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      ...(isActiveParam !== null ? { isActive: isActiveParam === 'true' } : {}),
    };

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.brand.count({ where }),
    ]);

    return NextResponse.json({ data: brands, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST /api/brands ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'brands:manage');

    const body = await req.json();
    const data = BrandSchema.parse(body);

    const brand = await prisma.brand.create({ data });

    void createAuditLog({
      userId: session!.sub,
      action: 'BRAND_CREATED',
      entityType: 'Brand',
      entityId: brand.id,
      description: `Marca "${brand.name}" criada.`,
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
