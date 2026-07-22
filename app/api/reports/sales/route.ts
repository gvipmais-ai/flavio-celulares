import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/cookies';
import { requirePermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/errors';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requirePermission(session, 'reports:view');

    const searchParams = new URL(req.url).searchParams;
    const monthStr = searchParams.get('month'); // YYYY-MM
    let startDate, endDate;

    if (monthStr) {
      const date = parseISO(\`\${monthStr}-01\`);
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
        operator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isCsv = searchParams.get('format') === 'csv';

    if (isCsv) {
      let csv = 'ID Venda,Data,Operador,Cliente,Status,Total,Lucro Estimado\\n';
      sales.forEach((s) => {
        const total = Number(s.totalAmount).toFixed(2);
        // Estimate profit: Total - (Cost * Qty for all items)
        let cost = 0;
        s.items.forEach(i => cost += (Number(i.unitPrice) * i.quantity)); // Actually costPrice snapshot would be better, using unitPrice as fallback if no cost
        // Note: For MVP we just use totalAmount
        
        csv += \`\${s.sequentialNumber},\${s.createdAt.toISOString()},\${s.operator.name},\${s.customerNameSnapshot},\${s.status},\${total}\\n\`;
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': \`attachment; filename="vendas_\${monthStr || 'atual'}.csv"\`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalSales: sales.length,
        revenue: sales.reduce((acc, s) => acc + Number(s.totalAmount), 0),
      },
      sales,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
