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

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.auditoriaMestre.findMany({
        orderBy: { data: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditoriaMestre.count(),
    ]);

    return NextResponse.json({ logs, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
