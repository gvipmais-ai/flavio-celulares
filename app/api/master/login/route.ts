import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { setAuthCookie } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Token não fornecido ou inválido.' } },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    let isValid = false;
    let masterId = 'env-token';

    // 1. Verifica contra o .env
    if (process.env.MASTER_TOKEN && process.env.MASTER_TOKEN === token) {
      isValid = true;
    } else {
      // 2. Se não bateu com .env, verifica no banco
      const activeTokens = await prisma.masterToken.findMany({
        where: { ativo: true },
      });

      for (const mt of activeTokens) {
        if (mt.expiraEm && mt.expiraEm < new Date()) {
          continue; // expirado
        }
        const matches = await bcryptjs.compare(token, mt.token);
        if (matches) {
          isValid = true;
          masterId = mt.id;
          break;
        }
      }
    }

    // 3. Se não há tokens no banco e não tem .env configurado, podemos gerar um de emergência e imprimir no log
    if (!isValid) {
      const activeCount = await prisma.masterToken.count({ where: { ativo: true } });
      if (activeCount === 0 && !process.env.MASTER_TOKEN) {
        const emergencyToken = crypto.randomUUID();
        const hash = await bcryptjs.hash(emergencyToken, 10);
        await prisma.masterToken.create({
          data: {
            token: hash,
            descricao: 'Token de Emergência Gerado Automaticamente',
            criadoPor: 'SISTEMA',
          },
        });
        console.error('\n=============================================================');
        console.error('🚨 NENHUM TOKEN MESTRE ENCONTRADO! GERANDO TOKEN DE EMERGÊNCIA:');
        console.error(`🔑 Token: ${emergencyToken}`);
        console.error('Guarde este token. Ele não será exibido novamente!');
        console.error('=============================================================\n');
      }
      
      // Sempre falhamos essa requisição específica (mesmo que tenha gerado o de emergência agora)
      await prisma.auditoriaMestre.create({
        data: {
          acao: 'LOGIN_FALHO',
          detalhes: { reason: 'invalid_token' },
          ip: ipAddress,
          userAgent,
        }
      });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token Mestre inválido.' } },
        { status: 401 }
      );
    }

    // Login bem-sucedido
    const jwtToken = await signToken({
      sub: masterId,
      email: 'master@system.local',
      name: 'Administrador Mestre',
      roleId: 'master',
      roleName: 'Mestre',
      scope: 'master',
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'LOGIN_SUCESSO',
        mestreId: masterId,
        ip: ipAddress,
        userAgent,
      }
    });

    const response = NextResponse.json({ success: true }, { status: 200 });
    setAuthCookie(response, jwtToken);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
