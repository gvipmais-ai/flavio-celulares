import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session?.cargo !== 'SuperADMIN') throw new UnauthorizedError();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        cargo: true,
      },
      orderBy: { name: 'asc' },
    });

    const mappedUsers = users.map(u => ({
      ...u,
      cargo: u.cargo
    }));

    return NextResponse.json({ data: mappedUsers });
  } catch (error) {
    return handleApiError(error);
  }
}
