import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { createAuditLogTx } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['SuperADMIN', 'Gerente', 'Operador de Caixa'].includes(session.roleName)) {
      throw new UnauthorizedError();
    }

    // Exportar todas as tabelas
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.1',
      data: {
        storeSettings: await prisma.storeSettings.findMany(),
        users: (await prisma.user.findMany()).map(u => ({ ...u, passwordHash: undefined })),
        categories: await prisma.category.findMany(),
        brands: await prisma.brand.findMany(),
        suppliers: await prisma.supplier.findMany(),
        deviceModels: await prisma.deviceModel.findMany(),
        products: await prisma.product.findMany(),
        productCompatibilities: await prisma.productCompatibility.findMany(),
        inventoryMovements: await prisma.inventoryMovement.findMany(),
        customers: await prisma.customer.findMany(),
        purchaseEntries: await prisma.purchaseEntry.findMany(),
        purchaseEntryItems: await prisma.purchaseEntryItem.findMany(),
        cashSessions: await prisma.cashSession.findMany(),
        cashMovements: await prisma.cashMovement.findMany(),
        sales: await prisma.sale.findMany(),
        saleItems: await prisma.saleItem.findMany(),
        salePayments: await prisma.salePayment.findMany(),
        serviceOrders: await prisma.serviceOrder.findMany(),
        serviceChecklistItems: await prisma.serviceChecklistItem.findMany(),
        serviceOrderStatusHistory: await prisma.serviceOrderStatusHistory.findMany(),
        quotes: await prisma.quote.findMany(),
        quoteItems: await prisma.quoteItem.findMany(),
        stockReservations: await prisma.stockReservation.findMany(),
        auditLogs: await prisma.auditLog.findMany(),
        checklistTemplateItems: await prisma.checklistTemplateItem.findMany(),
        returns: await prisma.return.findMany(),
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
