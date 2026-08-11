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

    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
    });

    return NextResponse.json({ settings });
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

    const body = await req.json();
    
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        fontFamily: body.fontFamily,
        logoUrl: body.logoUrl,
      },
      create: {
        id: 'singleton',
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        fontFamily: body.fontFamily,
        logoUrl: body.logoUrl,
      },
    });

    await prisma.auditoriaMestre.create({
      data: {
        acao: 'LAYOUT_ALTERADO',
        detalhes: { fields: Object.keys(body) },
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
