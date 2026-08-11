import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/errors';
import bcryptjs from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.scope !== 'master') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Acesso negado' } }, { status: 403 });
    }

    // Registrar inicio do processo de reset
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');
    const mestreId = session.sub !== 'env-token' ? session.sub : null;
    
    await prisma.auditoriaMestre.create({
      data: {
        acao: 'RESET_DB_INICIADO',
        ip,
        mestreId,
      }
    });

    // Ordem de deleção respeitando as restrições de chave estrangeira
    await prisma.$transaction([
      prisma.return.deleteMany(),
      prisma.saleItem.deleteMany(),
      prisma.salePayment.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.cashMovement.deleteMany(),
      prisma.cashSession.deleteMany(),
      prisma.quoteItem.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.stockReservation.deleteMany(),
      prisma.serviceOrderStatusHistory.deleteMany(),
      prisma.serviceChecklistItem.deleteMany(),
      prisma.serviceOrder.deleteMany(),
      prisma.purchaseEntryItem.deleteMany(),
      prisma.purchaseEntry.deleteMany(),
      prisma.inventoryMovement.deleteMany(),
      prisma.productCompatibility.deleteMany(),
      prisma.product.deleteMany(),
      prisma.deviceModel.deleteMany(),
      prisma.supplier.deleteMany(),
      prisma.brand.deleteMany(),
      prisma.category.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const defaultAdminHash = await bcryptjs.hash('admin123', 12);
    await prisma.user.create({
      data: {
        name: 'Admin Sistema',
        email: 'admin@flaviocelulares.com.br',
        passwordHash: defaultAdminHash,
        cargo: "SUPERADMIN",
        isActive: true,
        
      },
    });

    // Registrar sucesso
    await prisma.auditoriaMestre.create({
      data: {
        acao: 'RESET_DB_CONCLUIDO',
        ip,
        mestreId,
      }
    });

    return NextResponse.json({ success: true, message: 'Banco resetado com sucesso' }, { status: 200 });
  } catch (error) {
    // Registrar erro
    try {
      await prisma.auditoriaMestre.create({
        data: {
          acao: 'RESET_DB_FALHA',
          detalhes: { error: String(error) },
          ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
        }
      });
    } catch (e) {
      // ignora
    }
    return handleApiError(error);
  }
}
