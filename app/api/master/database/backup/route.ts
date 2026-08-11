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

    // Fetches all essential data for a backup
    const [
      users,
      categories,
      brands,
      suppliers,
      products,
      customers,
      storeSettings
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.supplier.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.storeSettings.findFirst(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        storeSettings,
        users,
        categories,
        brands,
        suppliers,
        customers,
        products,
      }
    };

    // Log this action
    await prisma.auditoriaMestre.create({
      data: {
        acao: 'BACKUP_DB',
        detalhes: { tables: ['users', 'products', 'categories', 'brands', 'suppliers', 'customers'] },
        mestreId: session.sub !== 'env-token' ? session.sub : null,
      }
    });

    const response = new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
