import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError, NotFoundError } from '@/lib/errors';
import { createAuditLogTx } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (session?.cargo !== 'SuperADMIN') throw new UnauthorizedError();

    const { id } = await params;
    const body = await req.json();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundError('Usuário não encontrado');

      const data: any = {};
      if (body.cargo !== undefined) {
        data.cargo = body.cargo;
      }
      if (body.isActive !== undefined) {
        data.isActive = body.isActive;
      }

      const updated = await tx.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          cargo: true,
          isActive: true,
        },
      });

      await createAuditLogTx(tx, {
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: id,
        description: `Usuário ${updated.name} atualizado (Cargo: ${updated.cargo}, Ativo: ${updated.isActive})`,
        userId: session.sub,
      });

      return updated;
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    return handleApiError(error);
  }
}
