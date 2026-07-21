import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CreateQuoteSchema } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'service-orders:read');

    const searchParams = req.nextUrl.searchParams;
    const serviceOrderId = searchParams.get('serviceOrderId');

    const where = serviceOrderId ? { serviceOrderId } : {};

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        items: { include: { product: true } },
        serviceOrder: { select: { sequentialNumber: true, customer: { select: { name: true } } } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: quotes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'quotes:create');

    const body = await req.json();
    const data = CreateQuoteSchema.parse(body);

    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: data.serviceOrderId },
    });
    if (!serviceOrder) throw new NotFoundError('Ordem de serviço não encontrada');

    const existingCount = await prisma.quote.count({
      where: { serviceOrderId: data.serviceOrderId },
    });

    let partsAmount = new Decimal(0);
    const itemsData = data.items.map((item) => {
      const subtotal = new Decimal(item.unitPrice).mul(item.quantity);
      if (item.itemType === 'PECA') {
        partsAmount = partsAmount.plus(subtotal);
      }
      return {
        itemType: item.itemType,
        productId: item.productId,
        descriptionSnapshot: item.descriptionSnapshot,
        quantity: item.quantity,
        unitPrice: new Decimal(item.unitPrice),
        subtotal,
      };
    });

    const laborAmount = new Decimal(data.laborAmount || 0);
    const discountAmount = new Decimal(data.discountAmount || 0);
    const totalAmount = partsAmount.plus(laborAmount).minus(discountAmount);

    const quote = await prisma.quote.create({
      data: {
        serviceOrderId: data.serviceOrderId,
        version: existingCount + 1,
        diagnosis: data.diagnosis,
        laborAmount,
        discountAmount,
        partsAmount,
        totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        estimatedDays: data.estimatedDays,
        notes: data.notes,
        status: 'RASCUNHO',
        createdById: session!.sub,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'QUOTE_CREATED',
      entityType: 'Quote',
      entityId: quote.id,
      description: `Orçamento v${quote.version} criado para OS #${serviceOrder.sequentialNumber}. Total: R$ ${totalAmount.toFixed(2)}`,
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
