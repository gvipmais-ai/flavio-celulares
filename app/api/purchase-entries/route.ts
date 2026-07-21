import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { PurchaseEntrySchema } from '@/lib/validations';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'purchase-entries:create');

    const entries = await prisma.purchaseEntry.findMany({
      include: {
        supplier: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'purchase-entries:create');

    const body = await req.json();
    const data = PurchaseEntrySchema.parse(body);

    let totalAmount = new Decimal(0);
    const itemsData = data.items.map((i) => {
      const subtotal = new Decimal(i.unitCost).mul(i.quantity).minus(i.discount || 0);
      totalAmount = totalAmount.plus(subtotal);
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitCost: new Decimal(i.unitCost),
        discount: new Decimal(i.discount || 0),
        subtotal,
      };
    });

    const entry = await prisma.purchaseEntry.create({
      data: {
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        invoiceSeries: data.invoiceSeries,
        accessKey: data.accessKey,
        issueDate: new Date(data.issueDate),
        entryDate: new Date(data.entryDate),
        notes: data.notes,
        totalAmount,
        status: 'RASCUNHO',
        createdById: session!.sub,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
