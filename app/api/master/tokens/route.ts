import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    const tokens = await prisma.masterToken.findMany({
      select: {
        id: true,
        descricao: true,
        criadoEm: true,
        expiraEm: true,
        ativo: true,
        criadoPor: true,
        // NÃO retornamos a hash
      },
      orderBy: { criadoEm: 'desc' },
    });

    return NextResponse.json({ tokens });
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

    const body = await req.json();
    const { descricao, diasValidade } = body;

    const rawToken = crypto.randomUUID();
    const hash = await bcryptjs.hash(rawToken, 10);
    
    let expiraEm = null;
    if (diasValidade && diasValidade > 0) {
      expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + diasValidade);
    }

    const masterToken = await prisma.masterToken.create({
      data: {
        token: hash,
        descricao: descricao || 'Token gerado via painel',
        expiraEm,
        criadoPor: session.sub !== 'env-token' ? session.sub : 'env-token',
      },
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'TOKEN_GERADO',
        detalhes: { id: masterToken.id, descricao },
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    // É a única vez que retornamos o token cru!
    return NextResponse.json({ 
      token: rawToken, 
      id: masterToken.id,
      expiraEm: masterToken.expiraEm 
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
