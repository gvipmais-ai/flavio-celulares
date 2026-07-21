import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { CustomerSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'customers:read');

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { cpf: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'customers:create');

    const body = await req.json();
    const data = CustomerSchema.parse(body);

    if (data.cpf) {
      const existing = await prisma.customer.findUnique({ where: { cpf: data.cpf } });
      if (existing) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: `CPF ${data.cpf} já cadastrado para ${existing.name}.` } },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
