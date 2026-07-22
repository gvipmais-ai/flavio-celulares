import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError, NotFoundError } from '@/lib/errors';
import { createAuditLogTx } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (session?.role !== 'SUPERADMIN') throw new UnauthorizedError();

    const id = params.id;
    const body = await req.json();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundError('Usuário não encontrado');

      const updated = await tx.user.update({
        where: { id },
        data: {
          role: body.role ?? user.role,
          isActive: body.isActive ?? user.isActive,
          permissions: body.permissions !== undefined ? (body.permissions ? JSON.stringify(body.permissions) : null) : user.permissions,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          permissions: true,
        },
      });

      await createAuditLogTx(tx, {
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: id,
        description: `Usuário ${updated.name} atualizado (Cargo: ${updated.role}, Ativo: ${updated.isActive})`,
        userId: session.sub,
      });

      return updated;
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}
