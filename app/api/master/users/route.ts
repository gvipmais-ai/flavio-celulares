import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';
import bcryptjs from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    const roles = await prisma.role.findMany();

    return NextResponse.json({ users, roles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const { id, roleId, forcePassword, isActive } = await req.json();

    const dataToUpdate: any = {};
    if (roleId !== undefined) dataToUpdate.roleId = roleId;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (forcePassword) {
      dataToUpdate.passwordHash = await bcryptjs.hash(forcePassword, 12);
      dataToUpdate.mustChangePassword = true;
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'USUARIO_EDITADO_FORCADO',
        detalhes: { userId: id, changedFields: Object.keys(dataToUpdate) },
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
