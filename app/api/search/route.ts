import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = [];
    const searchTerms = query.trim();

    // Busca Produtos
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerms } },
          { code: { contains: searchTerms } },
          { barcode: { contains: searchTerms } },
        ],
        isActive: true,
      },
      take: 5,
    });
    
    for (const p of products) {
      results.push({
        id: p.id,
        type: 'PRODUCT',
        title: p.name,
        subtitle: `Cód: \${p.code} | Estoque: \${p.stockOnHand - p.stockReserved}`,
        link: `/produtos/\${p.id}`,
      });
    }

    // Busca Clientes
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerms } },
          { cpf: { contains: searchTerms } },
          { phone: { contains: searchTerms } },
        ],
      },
      take: 3,
    });

    for (const c of customers) {
      results.push({
        id: c.id,
        type: 'CUSTOMER',
        title: c.name,
        subtitle: `CPF: \${c.cpf || 'Não informado'} | Tel: \${c.phone || 'Não informado'}`,
        link: `/clientes/\${c.id}`,
      });
    }

    // Busca Vendas
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { clientTransactionId: { contains: searchTerms } },
          { customerNameSnapshot: { contains: searchTerms } },
        ],
      },
      take: 3,
    });

    for (const s of sales) {
      results.push({
        id: s.id,
        type: 'SALE',
        title: `Venda #\${s.sequentialNumber}`,
        subtitle: `Cliente: \${s.customerNameSnapshot} | R$ \${Number(s.totalAmount).toFixed(2)}`,
        link: `/vendas/\${s.id}`,
      });
    }

    // Busca Ordens de Serviço
    const os = await prisma.serviceOrder.findMany({
      where: {
        OR: [
          { customer: { name: { contains: searchTerms } } },
          { deviceModel: { name: { contains: searchTerms } } },
        ],
      },
      include: { customer: true, deviceModel: true },
      take: 3,
    });

    for (const order of os) {
      results.push({
        id: order.id,
        type: 'OS',
        title: `OS #\${order.sequentialNumber}`,
        subtitle: `Cliente: \${order.customer.name} | Aparelho: \${order.deviceModel.name}`,
        link: `/ordens/\${order.id}`,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
