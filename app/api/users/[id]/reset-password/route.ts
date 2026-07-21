import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import bcryptjs from 'bcryptjs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'users:manage');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const tempPassword = 'Fc' + Math.random().toString(36).substring(2, 8) + '!';
    const passwordHash = await bcryptjs.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    await createAuditLog({
      userId: session?.sub,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      description: `Senha do usuário ${user.name} redefinida pelo administrador.`,
    });

    return NextResponse.json({
      message: 'Senha redefinida com sucesso.',
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
