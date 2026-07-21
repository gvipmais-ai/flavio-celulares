import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import { createAuditLog } from '@/lib/audit';
import { ChangePasswordSchema } from '@/lib/validations';

const BCRYPT_ROUNDS = 12;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Sessão não encontrada. Faça login novamente.' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Busca o usuário com o hash da senha atual
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Usuário inativo ou não encontrado.' } },
        { status: 401 }
      );
    }

    // Verifica a senha atual
    const passwordMatch = await bcryptjs.compare(currentPassword, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Senha atual incorreta.' } },
        { status: 401 }
      );
    }

    // Garante que a nova senha é diferente da atual
    const samePassword = await bcryptjs.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'A nova senha deve ser diferente da senha atual.' } },
        { status: 400 }
      );
    }

    // Gera o hash da nova senha
    const newPasswordHash = await bcryptjs.hash(newPassword, BCRYPT_ROUNDS);

    // Atualiza a senha e libera o flag de troca obrigatória
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    void createAuditLog({
      userId: user.id,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      description: `Senha alterada com sucesso: ${user.email}`,
      metadata: { email: user.email },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Senha alterada com sucesso. Por segurança, faça login novamente.',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
