import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requireModulePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';

const UpdateRoleSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').optional(),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    await requireModulePermission(session, 'gerenciamentoCargos', 'visualizar');

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!role) throw new NotFoundError('Cargo não encontrado');

    return NextResponse.json({ data: role });
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
    await requireModulePermission(session, 'gerenciamentoCargos', 'editar');

    const body = await req.json();
    const data = UpdateRoleSchema.parse(body);

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new NotFoundError('Cargo não encontrado');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions) {
      updateData.permissions = JSON.stringify({ modulos: data.permissions });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'ROLE_UPDATED',
      entityType: 'Role',
      entityId: updatedRole.id,
      description: `Cargo ${updatedRole.name} atualizado`,
    });

    return NextResponse.json({ data: updatedRole });
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
    await requireModulePermission(session, 'gerenciamentoCargos', 'editar');

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });

    if (!role) throw new NotFoundError('Cargo não encontrado');

    if (role.isSystem) {
      throw new InvalidOperationError('Este é um cargo do sistema e não pode ser excluído.');
    }

    if (role._count.users > 0) {
      throw new InvalidOperationError(`Não é possível excluir. Existem ${role._count.users} usuários vinculados a este cargo.`);
    }

    await prisma.role.delete({ where: { id } });

    await createAuditLog({
      userId: session?.sub,
      action: 'ROLE_DELETED',
      entityType: 'Role',
      entityId: id,
      description: `Cargo ${role.name} excluído`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
