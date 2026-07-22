import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { createAuditLogTx } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session?.role !== 'SUPERADMIN') throw new UnauthorizedError();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    return handleApiError(error);
  }
}
