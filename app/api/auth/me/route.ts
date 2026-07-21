import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sessão não encontrada. Faça login novamente.' } },
        { status: 401 }
      );
    }

    // Busca dados atualizados do banco para garantir que o usuário ainda está ativo
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Usuário inativo ou não encontrado. Faça login novamente.' } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
