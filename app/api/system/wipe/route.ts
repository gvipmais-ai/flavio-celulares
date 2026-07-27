import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas SUPERADMIN pode executar esta ação.' }, { status: 403 });
    }

    const body = await req.json();
    const { password, wipeSales, wipeOS, wipeCustomers, wipeProducts } = body;

    if (password !== '23349137') {
      return NextResponse.json({ error: 'Senha de autorização incorreta.' }, { status: 401 });
    }

    // Because of foreign keys in SQLite, we must delete child records before parents.
    // If wipeProducts or wipeCustomers is true, the frontend already forces wipeSales and wipeOS to be true.
    // We double-check here to ensure data integrity.
    
    const shouldWipeSales = wipeSales || wipeProducts || wipeCustomers;
    const shouldWipeOS = wipeOS || wipeProducts || wipeCustomers;

    const operations = [];

    // 1. Wipe Sales and Cash Sessions
    if (shouldWipeSales) {
      operations.push(prisma.return.deleteMany());
      operations.push(prisma.salePayment.deleteMany());
      operations.push(prisma.saleItem.deleteMany());
      operations.push(prisma.sale.deleteMany());
      operations.push(prisma.cashMovement.deleteMany());
      operations.push(prisma.cashSession.deleteMany());
    }

    // 2. Wipe Service Orders and Quotes
    if (shouldWipeOS) {
      operations.push(prisma.stockReservation.deleteMany());
      operations.push(prisma.quoteItem.deleteMany());
      operations.push(prisma.quote.deleteMany());
      operations.push(prisma.serviceOrderStatusHistory.deleteMany());
      operations.push(prisma.serviceChecklistItem.deleteMany());
      operations.push(prisma.serviceOrder.deleteMany());
    }

    // 3. Wipe Customers
    if (wipeCustomers) {
      operations.push(prisma.customer.deleteMany());
    }

    // 4. Wipe Products and Inventory
    if (wipeProducts) {
      operations.push(prisma.inventoryMovement.deleteMany());
      operations.push(prisma.productCompatibility.deleteMany());
      operations.push(prisma.purchaseEntryItem.deleteMany());
      operations.push(prisma.purchaseEntry.deleteMany());
      operations.push(prisma.product.deleteMany());
      operations.push(prisma.category.deleteMany());
      // Brand and Supplier are kept as they are useful dictionaries, but could be cleared if requested.
    }

    if (operations.length > 0) {
      // Execute all deletes in a single transaction to ensure atomicity
      await prisma.$transaction(operations);
      
      // Log the wipe
      await prisma.auditLog.create({
        data: {
          userId: session.sub,
          action: 'DATABASE_WIPE',
          entityType: 'SYSTEM',
          description: `Database wiped. Sales: ${shouldWipeSales}, OS: ${shouldWipeOS}, Customers: ${wipeCustomers}, Products: ${wipeProducts}`,
          metadata: JSON.stringify({ wipeSales, wipeOS, wipeCustomers, wipeProducts })
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Limpeza executada com sucesso.' });
  } catch (error: any) {
    console.error('Wipe error:', error);
    return NextResponse.json(
      { error: 'Falha ao executar limpeza no banco de dados.', details: error.message },
      { status: 500 }
    );
  }
}
