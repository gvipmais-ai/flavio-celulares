import { prisma } from '@/lib/prisma';
import { moveToDefectiveStock, decrementStock } from './inventory.service';
import { createAuditLogTx } from '@/lib/audit';
import { NotFoundError, InvalidOperationError } from '@/lib/errors';
import { Prisma } from '@prisma/client';

export async function processReturnOrExchange(input: {
  saleId: string;
  saleItemId: string;
  quantity: number;
  reason: string;
  defectDescription?: string;
  type: 'TROCA_GARANTIA' | 'DEVOLUCAO' | 'DEVOLUCAO_FORA_GARANTIA';
  authorizedById?: string;
  createdById: string;
  cashSessionId?: string; // Required for TROCA to issue the replacement sale
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch the sale and item
    const sale = await tx.sale.findUnique({
      where: { id: input.saleId },
      include: { customer: true },
    });
    if (!sale) throw new NotFoundError('Venda original não encontrada');

    const saleItem = await tx.saleItem.findUnique({
      where: { id: input.saleItemId },
      include: { product: true },
    });
    if (!saleItem) throw new NotFoundError('Item da venda não encontrado');
    if (saleItem.saleId !== sale.id) throw new InvalidOperationError('O item não pertence à venda informada');

    // 2. Validate quantity
    const existingReturns = await tx.return.aggregate({
      where: { saleItemId: input.saleItemId, status: 'CONCLUIDA' },
      _sum: { quantity: true },
    });
    const alreadyReturned = existingReturns._sum.quantity || 0;
    const availableToReturn = saleItem.quantity - alreadyReturned;

    if (input.quantity > availableToReturn) {
      throw new InvalidOperationError(`Quantidade solicitada (${input.quantity}) excede o limite disponível para troca (${availableToReturn})`);
    }

    // 3. Handle authorization for out-of-warranty
    if (input.type === 'DEVOLUCAO_FORA_GARANTIA' && !input.authorizedById) {
      throw new InvalidOperationError('Devolução fora da garantia requer autorização');
    }

    // 4. Create the Return record
    const returnRecord = await tx.return.create({
      data: {
        saleId: sale.id,
        saleItemId: saleItem.id,
        productId: saleItem.productId,
        quantity: input.quantity,
        reason: input.reason,
        defectDescription: input.defectDescription,
        status: input.type === 'DEVOLUCAO_FORA_GARANTIA' && !input.authorizedById ? 'SOLICITADA' : 'CONCLUIDA',
        type: input.type,
        notes: input.notes,
        createdById: input.createdById,
        authorizedById: input.authorizedById,
      },
    });

    if (returnRecord.status !== 'CONCLUIDA') {
      // Pending authorization
      return { returnRecord, replacementSale: null };
    }

    // 5. Move returned items to defective stock
    const isDefective = input.type === 'TROCA_GARANTIA' || input.defectDescription;
    if (isDefective) {
      await moveToDefectiveStock(
        tx,
        saleItem.productId,
        input.quantity,
        input.reason,
        'RETURN',
        returnRecord.id,
        input.createdById,
        input.defectDescription
      );
    } else {
      // For a clean return, increment normal stock
      await tx.product.update({
        where: { id: saleItem.productId },
        data: { stockOnHand: { increment: input.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: saleItem.productId,
          quantity: input.quantity,
          direction: 'IN',
          reason: 'DEVOLUCAO',
          previousBalance: saleItem.product.stockOnHand,
          resultingBalance: saleItem.product.stockOnHand + input.quantity,
          sourceType: 'RETURN',
          sourceId: returnRecord.id,
          userId: input.createdById,
        },
      });
    }

    let replacementSale = null;

    // 6. If it's a direct exchange, issue the replacement sale
    if (input.type === 'TROCA_GARANTIA' && input.cashSessionId) {
      const clientTxId = `exchange_${returnRecord.id}_${Date.now()}`;
      
      const product = await tx.product.findUnique({ where: { id: saleItem.productId } });
      if (!product) throw new NotFoundError('Produto para substituição não encontrado');
      
      const availableStock = product.stockOnHand - product.stockReserved;
      if (availableStock < input.quantity) {
        throw new InvalidOperationError('Não há estoque suficiente do produto para realizar a substituição imediata');
      }

      const updatedSettings = await tx.storeSettings.update({
        where: { id: 'singleton' },
        data: { saleSequence: { increment: 1 } },
      });

      replacementSale = await tx.sale.create({
        data: {
          sequentialNumber: updatedSettings.saleSequence,
          clientTransactionId: clientTxId,
          type: 'TROCA',
          originSaleId: sale.id,
          customerId: sale.customerId,
          customerNameSnapshot: sale.customerNameSnapshot,
          customerCpfSnapshot: sale.customerCpfSnapshot,
          grossAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
          notes: `Substituição referente à Devolução #${returnRecord.id}`,
          operatorId: input.createdById,
          cashSessionId: input.cashSessionId,
          items: {
            create: [{
              productId: product.id,
              productCodeSnapshot: product.code,
              productNameSnapshot: product.name,
              quantity: input.quantity,
              costPriceSnapshot: product.costPrice,
              unitPrice: 0,
              discount: 0,
              subtotal: 0,
              warrantyMonthsSnapshot: product.warrantyMonths,
            }],
          },
        },
      });

      // Link return to replacement sale
      await tx.return.update({
        where: { id: returnRecord.id },
        data: { replacementSaleId: replacementSale.id },
      });

      // Decrement stock for replacement
      await decrementStock(
        tx,
        product.id,
        input.quantity,
        'TROCA_GARANTIA',
        'SALE',
        replacementSale.id,
        input.createdById,
        'Saída para substituição em garantia'
      );
    }

    // Audit
    await createAuditLogTx(tx, {
      userId: input.createdById,
      action: 'RETURN_CREATED',
      entityType: 'Return',
      entityId: returnRecord.id,
      description: `Devolução/Troca (${input.type}) registrada para a venda ${sale.sequentialNumber}`,
    });

    return { returnRecord, replacementSale };
  }, { timeout: 15000 });
}
