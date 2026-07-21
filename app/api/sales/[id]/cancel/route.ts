import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { CancelSaleSchema } from '@/lib/validations';
import { cancelSale } from '@/services/sale.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'sales:cancel');

    const body = await req.json();
    const data = CancelSaleSchema.parse(body);

    const sale = await cancelSale(id, data.reason, session!.sub);

    return NextResponse.json({ sale });
  } catch (error) {
    return handleApiError(error);
  }
}
