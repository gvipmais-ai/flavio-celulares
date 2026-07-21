import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { SupplierSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'suppliers:manage');

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: suppliers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'suppliers:manage');

    const body = await req.json();
    const data = SupplierSchema.parse(body);

    const supplier = await prisma.supplier.create({ data });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
