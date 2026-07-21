import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/permissions';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { setAuthCookie } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import { createAuditLog } from '@/lib/audit';
import { LoginSchema } from '@/lib/validations';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Busca o usuário pelo email — mensagem genérica para não revelar se existe ou não
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      // Registra tentativa falha sem revelar se o usuário existe
      void createAuditLog({
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        description: `Tentativa de login falha para e-mail: ${email}`,
        metadata: { email, reason: user ? 'inactive' : 'not_found' },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'E-mail ou senha incorretos.' } },
        { status: 401 }
      );
    }

    // Verifica bloqueio por tentativas excessivas
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );

      void createAuditLog({
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        description: `Login bloqueado para ${email} — conta temporariamente bloqueada`,
        metadata: { email, reason: 'account_locked', lockedUntil: user.lockedUntil },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: `Conta bloqueada temporariamente por excesso de tentativas. Tente novamente em ${minutesLeft} minuto(s).`,
          },
        },
        { status: 401 }
      );
    }

    // Verifica a senha
    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);

    if (!passwordMatch) {
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          ...(shouldLock && { lockedUntil }),
        },
      });

      void createAuditLog({
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        description: `Senha incorreta para ${email} (tentativa ${newAttempts}/${MAX_LOGIN_ATTEMPTS})`,
        metadata: { email, attempts: newAttempts, locked: shouldLock },
        ipAddress,
        userAgent,
      });

      const message = shouldLock
        ? `Conta bloqueada temporariamente por ${LOCKOUT_DURATION_MINUTES} minutos após excesso de tentativas.`
        : 'E-mail ou senha incorretos.';

      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message } },
        { status: 401 }
      );
    }

    // Login bem-sucedido — reseta tentativas e atualiza último acesso
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Gera o JWT
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    // Monta a resposta
    const responseBody: {
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        mustChangePassword: boolean;
      };
      mustChangePassword?: boolean;
    } = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };

    if (user.mustChangePassword) {
      responseBody.mustChangePassword = true;
    }

    const response = NextResponse.json(responseBody, { status: 200 });
    setAuthCookie(response, token);

    void createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `Login realizado com sucesso: ${user.email}`,
      metadata: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
