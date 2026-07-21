import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CategorySchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';

// ─── GET /api/categories ──────────────────────────────────────────────────────

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

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({ data: categories, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST /api/categories ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'categories:manage');

    const body = await req.json();
    const data = CategorySchema.parse(body);

    const category = await prisma.category.create({ data });

    void createAuditLog({
      userId: session!.sub,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category.id,
      description: `Categoria "${category.name}" criada.`,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
