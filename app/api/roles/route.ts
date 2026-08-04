import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requireModulePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';

const CreateRoleSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.any()), // Objeto com modulos
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    await requireModulePermission(session, 'gerenciamentoCargos', 'visualizar');

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      }
    });

    return NextResponse.json({ data: roles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    await requireModulePermission(session, 'gerenciamentoCargos', 'editar');

    const body = await req.json();
    const data = CreateRoleSchema.parse(body);

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: JSON.stringify({ modulos: data.permissions }),
        isSystem: false,
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role.id,
      description: `Cargo ${role.name} criado`,
    });

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
