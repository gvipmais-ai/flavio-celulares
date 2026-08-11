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
  items: Array<{ productId?: string | null; productName?: string; unitPrice?: number; quantity: number; discount: number }>;
  payments: Array<{ paymentMethod: string; amount: number }>;
  operatorId: string;
  cashSessionId: string;
  type?: 'VENDA' | 'TROCA';
  originSaleId?: string;
  serviceOrderId?: string | null;
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
      const productIds = input.items.map((i) => i.productId).filter(id => id && id.length === 25) as string[];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true, approvalStatus: 'APROVADO' },
      });

      const settings = await tx.storeSettings.findUnique({ where: { id: 'singleton' } });

      let grossAmount = new Decimal(0);
      let totalDiscount = new Decimal(0);
      const saleItems = [];

      for (const item of input.items) {
        let unitPrice: Decimal;
        let productCode = 'OS-ITEM';
        let productName = item.productName || 'Item Personalizado';
        let costPrice = new Decimal(0);
        let warrantyMonths = 3;
        let finalProductId = item.productId || null;

        if (item.productId && item.productId.length === 25) { // É cuid
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            unitPrice = product.salePrice;
            productCode = product.code;
            productName = product.name;
            costPrice = product.costPrice;
            warrantyMonths = product.warrantyMonths;
          } else if (input.serviceOrderId) {
             // Aceita itens de OS mesmo se produto inativo (ex: apagado ou inativado)
             unitPrice = new Decimal(item.unitPrice || 0);
          } else {
            throw new NotFoundError(`Produto ID ${item.productId} não encontrado ou inativo.`);
          }
        } else {
          // Serviço ou peça customizada da OS
          finalProductId = null;
          unitPrice = new Decimal(item.unitPrice || 0);
          productCode = item.productName === 'Mão de Obra Técnica' ? 'SERVICO' : 'CUSTOM';
        }

        const itemGross = unitPrice.mul(item.quantity);
        const itemDiscount = new Decimal(item.discount || 0);

        if (itemDiscount.lt(0) || itemDiscount.gt(itemGross)) {
          throw new InvalidOperationError('O desconto do item não pode ser negativo nem maior que o subtotal.');
        }

        const subtotal = itemGross.minus(itemDiscount);
        grossAmount = grossAmount.plus(itemGross);
        totalDiscount = totalDiscount.plus(itemDiscount);

        saleItems.push({
          productId: finalProductId,
          productCodeSnapshot: productCode,
          productNameSnapshot: productName,
          quantity: item.quantity,
          costPriceSnapshot: costPrice,
          unitPrice,
          discount: itemDiscount,
          subtotal,
          warrantyMonthsSnapshot: warrantyMonths,
        });
      }

      const totalAmount = grossAmount.minus(totalDiscount);

      // Validar pagamentos
      const paymentsTotal = input.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmountNum = totalAmount.toNumber();
      
      let change = 0;
      if (paymentsTotal < totalAmountNum - 0.01) {
        throw new InvalidOperationError(
          `Soma dos pagamentos (R$ ${paymentsTotal.toFixed(2)}) é menor que o total da venda (R$ ${totalAmountNum.toFixed(2)}).`
        );
      } else if (paymentsTotal > totalAmountNum + 0.01) {
        const hasCash = input.payments.some(p => p.paymentMethod === 'DINHEIRO');
        if (!hasCash) {
          throw new InvalidOperationError(`Apenas pagamentos em dinheiro permitem troco. O valor excedeu o total.`);
        }
        change = paymentsTotal - totalAmountNum;
      }
      // Remover `dbPayments`, pois vamos salvar os pagamentos reais fornecidos pelo cliente na Venda.
      // O troco já foi calculado na variável `change`.
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
          serviceOrderId: input.serviceOrderId,
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
              amount: p.amount,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      // Baixar estoque (se não for OS)
      // Se for OS, as peças já foram baixadas durante o fluxo da OS (Iniciar Reparo).
      if (!input.serviceOrderId) {
        for (const item of input.items) {
          if (item.productId && item.productId.length === 25) {
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
        }
      }

      // Se for pagamento de OS, atualizar a OS para ENTREGUE
      if (input.serviceOrderId) {
        const os = await tx.serviceOrder.findUnique({ where: { id: input.serviceOrderId } });
        if (os) {
          await tx.serviceOrder.update({
            where: { id: input.serviceOrderId },
            data: {
              status: 'ENTREGUE',
              deliveredAt: new Date(),
              statusHistory: {
                create: {
                  previousStatus: os.status,
                  newStatus: 'ENTREGUE',
                  notes: `Pagamento recebido no caixa. Venda #${sequentialNumber}.`,
                  userId: input.operatorId,
                },
              },
            },
          });
        }
      }

      // Movimentação de caixa física (APENAS DINHEIRO LÍQUIDO)
      // Aqui descontamos o troco apenas para a Gaveta de Dinheiro.
      const cashPaymentsTotal = input.payments
        .filter((p) => p.paymentMethod === 'DINHEIRO')
        .reduce((sum, p) => sum + p.amount, 0);
        
      const cashNet = new Decimal(cashPaymentsTotal - change);

      if (cashNet.gt(0)) {
        await tx.cashMovement.create({
          data: {
            cashSessionId: input.cashSessionId,
            type: 'VENDA',
            amount: cashNet,
            sourceType: 'SALE',
            sourceId: sale.id,
            userId: input.operatorId,
          },
        });
      }

      // Auditoria
      await createAuditLogTx(tx, {
        userId: input.operatorId,
        action: 'SALE_CREATED',
        entityType: 'Sale',
        entityId: sale.id,
        description: `Venda #${sequentialNumber} finalizada. Total: R$ ${totalAmount.toFixed(2)}`,
        metadata: { sequentialNumber, totalAmount: totalAmount.toFixed(2) },
      });

      // Return sale with calculated change attached for PDF printing
      return { ...sale, change };
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
      if (item.productId) {
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
    }

    // Estorno no caixa (APENAS DINHEIRO LÍQUIDO DEVOLVIDO)
    const cashPayment = sale.payments.find(p => p.paymentMethod === 'DINHEIRO');
    if (cashPayment && cashPayment.amount.gt(0)) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: sale.cashSessionId,
          type: 'CANCELAMENTO',
          amount: cashPayment.amount,
          reason: `Estorno físico: ${reason}`,
          sourceType: 'SALE_CANCEL',
          sourceId: sale.id,
          userId: adminId,
        },
      });
    }

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
