import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:read');

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { checklistItems: true },
    });

    if (!serviceOrder) throw new NotFoundError('Ordem de serviço não encontrada');

    const defectiveItems = serviceOrder.checklistItems.filter(
      (item) => item.result === 'COM_DEFEITO' && item.suggestedPartType
    );

    const partTypes = Array.from(
      new Set(defectiveItems.map((i) => i.suggestedPartType!).filter(Boolean))
    );

    const products = await prisma.product.findMany({
      where: {
        productType: 'PECA_MANUTENCAO',
        partType: { in: partTypes as any[] },
        isActive: true,
        approvalStatus: 'APROVADO',
      },
      include: { category: true, brand: true },
    });

    const suggestions = defectiveItems.map((item) => {
      const matching = products.filter((p) => p.partType === item.suggestedPartType);
      return {
        checklistItem: item.descriptionSnapshot,
        suggestedPartType: item.suggestedPartType,
        products: matching.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          salePrice: p.salePrice,
          stockOnHand: p.stockOnHand,
          stockAvailable: p.stockOnHand - p.stockReserved,
        })),
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}
