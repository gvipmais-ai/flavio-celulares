import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError, InvalidOperationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { UpdateUserSchema } from '@/lib/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    await requirePermission(session, 'users:manage');

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        cargo: true,
        permissoes: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError('Usuário não encontrado');

    return NextResponse.json({ user });
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
    await requirePermission(session, 'users:manage');

    const body = await req.json();
    const data = UpdateUserSchema.parse(body);

    if (id === session?.sub && data.cargo) {
      throw new InvalidOperationError('Você não pode alterar seu próprio cargo.');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.cargo) updateData.cargo = data.cargo;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        cargo: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: updatedUser.id,
      description: `Usuário ${updatedUser.name} atualizado.`,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Usuários não podem ser excluídos. Desative o usuário em vez disso.',
      },
    },
    { status: 405 }
  );
}
