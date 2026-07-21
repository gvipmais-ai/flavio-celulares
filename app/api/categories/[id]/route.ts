import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CategorySchema } from '@/lib/validations';

// ─── GET /api/categories/[id] ─────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:read');

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Categoria não encontrada');

    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PUT /api/categories/[id] ─────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'categories:manage');

    const body = await req.json();
    const data = CategorySchema.parse(body);

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return NextResponse.json({ category });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── DELETE /api/categories/[id] ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'categories:manage');

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Categoria não encontrada.');
    }

    // Check for active products in this category
    const activeProductCount = await prisma.product.count({
      where: { categoryId: id, isActive: true },
    });
    if (activeProductCount > 0) {
      throw new ConflictError(
        `Não é possível desativar a categoria "${existing.name}" pois ela possui ${activeProductCount} produto(s) ativo(s).`
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}
