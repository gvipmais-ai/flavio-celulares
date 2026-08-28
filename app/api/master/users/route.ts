import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
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

    const { id, name, email, cargo, isActive, permissoes } = await req.json();

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (cargo !== undefined) dataToUpdate.cargo = cargo;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;
    if (permissoes !== undefined) dataToUpdate.permissoes = permissoes;

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

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const { name, email, cargo, isActive, permissoes } = await req.json();

    // Import bcrypt dynamically or at the top. We'll require it here since it's a small script.
    const bcryptjs = require('bcryptjs');
    const hash = await bcryptjs.hash('123456', 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        cargo: cargo || 'OPERADOR',
        isActive: isActive !== undefined ? isActive : true,
        permissoes: permissoes || {},
        passwordHash: hash,
      },
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'USUARIO_CRIADO_FORCADO',
        detalhes: { userId: user.id, name: user.name },
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    return NextResponse.json({ user, temporaryPassword: '123456' });
  } catch (error) {
    return handleApiError(error);
  }
}
