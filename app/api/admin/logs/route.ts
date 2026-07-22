import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session?.role !== 'SUPERADMIN') throw new UnauthorizedError();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    
    const logs = await prisma.auditLog.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } },
      }
    });

    const total = await prisma.auditLog.count();

    return NextResponse.json({ data: logs, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
