import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';

export async function GET() {
  const session = await getSession();
  if (!session || session.cargo !== 'SuperADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete all transactional data
    await prisma.salePayment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    
    await prisma.cashMovement.deleteMany();
    await prisma.cashSession.deleteMany();
    
    await prisma.inventoryMovement.deleteMany();
    await prisma.productCompatibility.deleteMany();
    await prisma.product.deleteMany();
    
    await prisma.quoteItem.deleteMany();
    await prisma.quote.deleteMany();
    
    await prisma.serviceOrderStatusHistory.deleteMany();
    await prisma.serviceChecklistItem.deleteMany();
    await prisma.serviceOrder.deleteMany();

    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    
    // Kept: Users, Categories, Brands, DeviceModels, ChecklistTemplates, StoreSettings

    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados de produção limpo com sucesso! Produtos, vendas, caixa e clientes apagados.' 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to clean database' }, { status: 500 });
  }
}
