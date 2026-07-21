import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { BrandSchema } from '@/lib/validations';

// ─── GET /api/brands/[id] ─────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:read');

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundError('Marca não encontrada');

    return NextResponse.json({ brand });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'brands:manage');

    const body = await req.json();
    const data = BrandSchema.parse(body);

    const brand = await prisma.brand.update({
      where: { id },
      data,
    });

    return NextResponse.json({ brand });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'brands:manage');

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Marca não encontrada.');
    }

    // Check for active products linked to this brand
    const activeProductCount = await prisma.product.count({
      where: { brandId: id, isActive: true },
    });
    if (activeProductCount > 0) {
      throw new ConflictError(
        `Não é possível desativar a marca "${existing.name}" pois ela possui ${activeProductCount} produto(s) ativo(s).`
      );
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(brand);
  } catch (error) {
    return handleApiError(error);
  }
}
