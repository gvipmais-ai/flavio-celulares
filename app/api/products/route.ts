import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/cookies';
import { requirePermission, ForbiddenError } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ProductSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';

// ─── GET /api/products ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'products:read');

    const { searchParams } = req.nextUrl;

    const search = searchParams.get('search') ?? undefined;
    const categoryId = searchParams.get('categoryId') ?? undefined;
    const brandId = searchParams.get('brandId') ?? undefined;
    const productTypeParam = searchParams.get('productType') ?? undefined;
    const approvalStatusParam = searchParams.get('approvalStatus') ?? undefined;
    const isActiveParam = searchParams.get('isActive');
    const belowMinStock = searchParams.get('belowMinStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

    const allowedSortFields = [
      'name', 'code', 'salePrice', 'costPrice', 'stockOnHand', 'createdAt', 'updatedAt',
    ];
    const resolvedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Build base where — belowMinStock handled post-query (Prisma can't compare two columns natively)
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (productTypeParam) where.productType = productTypeParam;
    if (approvalStatusParam) where.approvalStatus = approvalStatusParam;
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true';
    if (outOfStock) where.stockOnHand = { lte: 0 };

    const [rawProducts, dbTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          barcode: true,
          name: true,
          description: true,
          productType: true,
          partType: true,
          costPrice: true,
          salePrice: true,
          stockOnHand: true,
          stockReserved: true,
          minimumStock: true,
          warrantyMonths: true,
          unit: true,
          location: true,
          color: true,
          model: true,
          imageUrl: true,
          notes: true,
          approvalStatus: true,
          isActive: true,
          categoryId: true,
          brandId: true,
          supplierId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { [resolvedSortBy]: sortOrder },
        // When belowMinStock is set, fetch all matching base filters then slice in JS
        skip: belowMinStock ? 0 : (page - 1) * pageSize,
        take: belowMinStock ? undefined : pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    // Post-query filter for belowMinStock (cross-column comparison: stockOnHand < minimumStock)
    let products = rawProducts;
    if (belowMinStock) {
      products = products.filter(
        (p: { stockOnHand: number; minimumStock: number }) => p.stockOnHand < p.minimumStock
      ) as typeof rawProducts;
    }

    // Apply pagination to the in-memory filtered set when belowMinStock is active
    const total = belowMinStock ? products.length : dbTotal;
    const pagedProducts = belowMinStock
      ? products.slice((page - 1) * pageSize, page * pageSize)
      : products;

    // Determine cost price visibility
    let showCost = session?.role === 'SUPERADMIN' || session?.role === 'TECNICO';
    if (session!.role === 'OPERADOR_CAIXA') {
      const settings = await prisma.storeSettings.findUnique({
        where: { id: 'singleton' },
        select: { showCostToOperator: true },
      });
      showCost = settings?.showCostToOperator ?? false;
    }

    const data = pagedProducts.map(
      (p: typeof rawProducts[number]) => {
        const { costPrice, ...rest } = p;
        return {
          ...rest,
          ...(showCost ? { costPrice } : {}),
          stockAvailable: p.stockOnHand - p.stockReserved,
        };
      }
    );

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'products:read');

    if (session!.role === 'OPERADOR_CAIXA') {
      throw new ForbiddenError('Operadores de caixa não podem cadastrar produtos.');
    }

    const body = await req.json();
    const parsed = ProductSchema.parse(body);

    // Auto-generate code when not supplied
    const code = parsed.code?.trim() ? parsed.code.trim() : `P${Date.now()}`;

    // SUPERADMIN → APROVADO; TECNICO → PENDENTE_REVISAO
    const approvalStatus = session!.role === 'SUPERADMIN' ? 'APROVADO' : 'PENDENTE_REVISAO';

    const { compatibleDeviceModelIds, ...productData } = parsed;

    const product = await prisma.product.create({
      data: {
        ...productData,
        code,
        approvalStatus,
        stockOnHand: 0, // Always starts at 0; stock added via purchase entries
        createdById: session!.sub,
        ...(compatibleDeviceModelIds && compatibleDeviceModelIds.length > 0
          ? {
              compatibilities: {
                create: compatibleDeviceModelIds.map((deviceModelId) => ({ deviceModelId })),
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        compatibilities: { include: { deviceModel: true } },
      },
    });

    void createAuditLog({
      userId: session!.sub,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      description: `Produto "${product.name}" (${code}) criado com status "${approvalStatus}".`,
      metadata: { approvalStatus, role: session!.role },
    });

    return NextResponse.json({ ...product, product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
