import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { createAuditLogTx } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session?.role !== 'SUPERADMIN') throw new UnauthorizedError();

    // Exportar tabelas principais
    const products = await prisma.product.findMany();
    const categories = await prisma.category.findMany();
    const brands = await prisma.brand.findMany();
    const customers = await prisma.customer.findMany();
    const users = await prisma.user.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        products,
        categories,
        brands,
        customers,
        users: users.map(u => ({ ...u, passwordHash: undefined })), // Omitir senhas
      }
    };

    // Criar log de auditoria
    await prisma.$transaction(async (tx) => {
      await createAuditLogTx(tx, {
        action: 'EXPORT_BACKUP',
        entityType: 'System',
        description: 'Backup do sistema exportado',
        userId: session.sub,
      });
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
