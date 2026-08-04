import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    
    // Apenas SuperADMIN pode exportar o backup do sistema
    if (session?.roleName !== 'SuperADMIN') {
      throw new UnauthorizedError('Apenas o Administrador pode realizar o backup completo do sistema.');
    }

    // Coleta dados importantes (não exporta senhas)
    const [
      users,
      products,
      sales,
      customers,
      categories,
      brands
    ] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, isActive: true, role: true }
      }),
      prisma.product.findMany(),
      prisma.sale.findMany({
        include: { items: true, payments: true }
      }),
      prisma.customer.findMany(),
      prisma.category.findMany(),
      prisma.brand.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        products,
        sales,
        customers,
        categories,
        brands
      }
    };

    await createAuditLog({
      userId: session.sub,
      action: 'EXPORT_BACKUP',
      entityType: 'System',
      description: 'Backup completo (JSON) exportado.',
    });

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="flavio_celulares_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
