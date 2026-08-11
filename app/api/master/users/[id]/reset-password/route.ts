import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/errors';
import bcryptjs from 'bcryptjs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const tempPassword = 'Ms' + Math.random().toString(36).substring(2, 8) + '@';
    const passwordHash = await bcryptjs.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'SENHA_RESETADA',
        detalhes: { userId: id },
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    return NextResponse.json({
      message: 'Senha resetada com sucesso.',
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
