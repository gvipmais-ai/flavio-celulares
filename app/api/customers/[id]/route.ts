import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CustomerSchema } from '@/lib/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'customers:read');

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          select: { id: true, sequentialNumber: true, totalAmount: true, status: true, createdAt: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        serviceOrders: {
          select: { id: true, sequentialNumber: true, status: true, deviceBrandSnapshot: true, deviceModelSnapshot: true, createdAt: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundError('Cliente não encontrado');

    return NextResponse.json({ customer });
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
    requirePermission(session, 'customers:edit');

    const body = await req.json();
    const data = CustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      },
    });

    return NextResponse.json({ customer });
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
    requirePermission(session, 'customers:edit');

    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
