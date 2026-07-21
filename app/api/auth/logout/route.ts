import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, clearAuthCookie } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    if (session) {
      void createAuditLog({
        userId: session.sub,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: session.sub,
        description: `Logout realizado: ${session.email}`,
        metadata: { email: session.email, role: session.role },
        ipAddress,
        userAgent,
      });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    clearAuthCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
