import { prisma } from '@/lib/prisma';
import { decrementStock, incrementStock } from './inventory.service';
import { createAuditLogTx } from '@/lib/audit';
import {
  DuplicateTransactionError,
  CashSessionRequiredError,
  NotFoundError,
  InvalidOperationError,
} from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateSaleInput {
  clientTransactionId: string;
  customerId?: string | null;
  customerNameSnapshot: string;
  customerCpfSnapshot?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; discount: number }>;
  payments: Array<{ paymentMethod: string; amount: number }>;
  operatorId: string;
  cashSessionId: string;
  type?: 'VENDA' | 'TROCA';
  originSaleId?: string;
}

export async function createSale(input: CreateSaleInput) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Verificar idempotência
      const existing = await tx.sale.findUnique({
        where: { clientTransactionId: input.clientTransactionId },
      });
      if (existing) throw new DuplicateTransactionError();

      // 2. Verificar caixa aberto
      const cashSession = await tx.cashSession.findFirst({
        where: { id: input.cashSessionId, operatorId: input.operatorId, status: 'ABERTA' },
      });
      if (!cashSession) throw new CashSessionRequiredError();

      // 3. Buscar produtos
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true, approvalStatus: 'APROVADO' },
      });

      const settings = await tx.storeSettings.findUnique({ where: { id: 'singleton' } });

      let grossAmount = new Decimal(0);
      let totalDiscount = new Decimal(0);
      const saleItems = [];

      for (const item of input.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new NotFoundError(`Produto ID ${item.productId} não encontrado ou inativo.`);

        const unitPrice = product.salePrice;
        const itemGross = unitPrice.mul(item.quantity);
        const itemDiscount = new Decimal(item.discount || 0);

        if (itemDiscount.lt(0) || itemDiscount.gt(itemGross)) {
          throw new InvalidOperationError('O desconto do item não pode ser negativo nem maior que o subtotal.');
        }

        const subtotal = itemGross.minus(itemDiscount);
        grossAmount = grossAmount.plus(itemGross);
        totalDiscount = totalDiscount.plus(itemDiscount);

        saleItems.push({
          productId: product.id,
          productCodeSnapshot: product.code,
          productNameSnapshot: product.name,
          quantity: item.quantity,
          costPriceSnapshot: product.costPrice,
          unitPrice,
          discount: itemDiscount,
          subtotal,
          warrantyMonthsSnapshot: product.warrantyMonths,
        });
      }

      const totalAmount = grossAmount.minus(totalDiscount);

      // Validar pagamentos
      const paymentsTotal = input.payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(paymentsTotal - totalAmount.toNumber()) > 0.01) {
        throw new InvalidOperationError(
          `Soma dos pagamentos (R$ ${paymentsTotal.toFixed(2)}) difere do total da venda (R$ ${totalAmount.toFixed(2)}).`
        );
      }

      // Sequencial
      const updatedSettings = await tx.storeSettings.update({
        where: { id: 'singleton' },
        data: { saleSequence: { increment: 1 } },
      });
      const sequentialNumber = updatedSettings.saleSequence;

      // Criar Venda
      const sale = await tx.sale.create({
        data: {
          sequentialNumber,
          clientTransactionId: input.clientTransactionId,
          type: input.type || 'VENDA',
          originSaleId: input.originSaleId,
          customerId: input.customerId,
          customerNameSnapshot: input.customerNameSnapshot,
          customerCpfSnapshot: input.customerCpfSnapshot,
          grossAmount,
          discountAmount: totalDiscount,
          totalAmount,
          notes: input.notes,
          operatorId: input.operatorId,
          cashSessionId: input.cashSessionId,
          items: { create: saleItems },
          payments: {
            create: input.payments.map((p) => ({
              paymentMethod: p.paymentMethod as any,
              amount: new Decimal(p.amount),
            })),
          },
        },
        include: { items: true, payments: true },
      });

      // Baixar estoque
      for (const item of input.items) {
        await decrementStock(
          tx,
          item.productId,
          item.quantity,
          'VENDA' as any,
          'SALE',
          sale.id,
          input.operatorId
        );
      }

      // Movimentação de caixa
      await tx.cashMovement.create({
        data: {
          cashSessionId: input.cashSessionId,
          type: 'VENDA',
          amount: totalAmount,
          sourceType: 'SALE',
          sourceId: sale.id,
          userId: input.operatorId,
        },
      });

      // Auditoria
      await createAuditLogTx(tx, {
        userId: input.operatorId,
        action: 'SALE_CREATED',
        entityType: 'Sale',
        entityId: sale.id,
        description: `Venda #${sequentialNumber} finalizada. Total: R$ ${totalAmount.toFixed(2)}`,
        metadata: { sequentialNumber, totalAmount: totalAmount.toFixed(2) },
      });

      return sale;
    },
    {
      timeout: 10000,
    }
  );
}

export async function cancelSale(saleId: string, reason: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true, payments: true },
    });

    if (!sale) throw new NotFoundError('Venda não encontrada');
    if (sale.status === 'CANCELADA') throw new InvalidOperationError('Venda já está cancelada');

    // Devolver itens ao estoque
    for (const item of sale.items) {
      await incrementStock(
        tx,
        item.productId,
        item.quantity,
        'CANCELAMENTO_VENDA' as any,
        'SALE_CANCEL',
        sale.id,
        adminId,
        `Estorno de venda #${sale.sequentialNumber}`
      );
    }

    // Estorno no caixa
    await tx.cashMovement.create({
      data: {
        cashSessionId: sale.cashSessionId,
        type: 'CANCELAMENTO',
        amount: sale.totalAmount,
        reason,
        sourceType: 'SALE_CANCEL',
        sourceId: sale.id,
        userId: adminId,
      },
    });

    const updatedSale = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: 'CANCELADA',
        canceledAt: new Date(),
        canceledById: adminId,
        cancellationReason: reason,
      },
    });

    await createAuditLogTx(tx, {
      userId: adminId,
      action: 'SALE_CANCELED',
      entityType: 'Sale',
      entityId: sale.id,
      description: `Venda #${sale.sequentialNumber} cancelada. Motivo: ${reason}`,
    });

    return updatedSale;
  });
}
