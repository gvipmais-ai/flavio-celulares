import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { StockAdjustmentSchema } from '@/lib/validations';
import { adjustStock } from '@/services/inventory.service';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    requirePermission(session, 'stock:adjust');

    const body = await req.json();
    const data = StockAdjustmentSchema.parse(body);

    const movement = await adjustStock(
      data.productId,
      data.quantity,
      data.direction,
      data.reason,
      session!.sub
    );

    await createAuditLog({
      userId: session?.sub,
      action: 'STOCK_ADJUSTED',
      entityType: 'Product',
      entityId: data.productId,
      description: `Ajuste de estoque (${data.direction}): ${data.quantity} un. Motivo: ${data.reason}`,
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
