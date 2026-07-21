import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission, ForbiddenError } from '@/lib/permissions';
import { handleApiError, NotFoundError, ConflictError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ProductSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';


// ─── GET /api/products/[id] ───────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:read');

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, tradeName: true } },
        compatibilities: {
          include: {
            deviceModel: {
              include: { brand: { select: { id: true, name: true } } },
            },
          },
        },
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Produto não encontrado.');
    }

    // Determine cost visibility
    let showCost = session!.role !== 'OPERADOR_CAIXA';
    if (session!.role === 'OPERADOR_CAIXA') {
      const settings = await prisma.storeSettings.findUnique({
        where: { id: 'singleton' },
        select: { showCostToOperator: true },
      });
      showCost = settings?.showCostToOperator ?? false;
    }

    const { costPrice, ...productWithoutCost } = product;

    return NextResponse.json({
      ...(showCost ? product : productWithoutCost),
      stockAvailable: product.stockOnHand - product.stockReserved,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PUT /api/products/[id] ───────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:edit');

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Produto não encontrado.');
    }

    const body = await req.json();
    const parsed = ProductSchema.parse(body);

    // TECNICO cannot change salePrice
    if (session!.role === 'TECNICO') {
      // Compare as strings to avoid float precision issues (salePrice is Decimal in DB)
      const existingPrice = Number(existing.salePrice);
      const requestedPrice = Number(parsed.salePrice);
      if (Math.abs(existingPrice - requestedPrice) > 0.001) {
        throw new ForbiddenError('Técnicos não podem alterar o preço de venda de um produto.');
      }
    }

    const { compatibleDeviceModelIds, ...productData } = parsed;

    type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

    const product = await prisma.$transaction(async (tx: PrismaTx) => {
      // Replace compatibilities if provided
      if (compatibleDeviceModelIds !== undefined) {
        await tx.productCompatibility.deleteMany({ where: { productId: id } });
        if (compatibleDeviceModelIds.length > 0) {
          await tx.productCompatibility.createMany({
            data: compatibleDeviceModelIds.map((deviceModelId) => ({
              productId: id,
              deviceModelId,
            })),
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          compatibilities: { include: { deviceModel: true } },
        },
      });
    });

    void createAuditLog({
      userId: session!.sub,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: id,
      description: `Produto "${product.name}" (${product.code}) atualizado.`,
    });

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── DELETE /api/products/[id] ────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'products:activate');

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Produto não encontrado.');
    }

    // Check for open sales containing this product
    const openSaleItemCount = await prisma.saleItem.count({
      where: {
        productId: id,
        sale: { status: 'CONCLUIDA' },
      },
    });
    if (openSaleItemCount > 0) {
      throw new ConflictError(
        `Não é possível desativar o produto "${existing.name}" pois ele está vinculado a vendas concluídas.`
      );
    }

    // Check for active reservations
    const activeReservationCount = await prisma.stockReservation.count({
      where: { productId: id, status: 'ATIVA' },
    });
    if (activeReservationCount > 0) {
      throw new ConflictError(
        `Não é possível desativar o produto "${existing.name}" pois ele possui ${activeReservationCount} reserva(s) ativa(s) de estoque.`
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    void createAuditLog({
      userId: session!.sub,
      action: 'PRODUCT_DEACTIVATED',
      entityType: 'Product',
      entityId: id,
      description: `Produto "${existing.name}" (${existing.code}) desativado.`,
    });

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}
