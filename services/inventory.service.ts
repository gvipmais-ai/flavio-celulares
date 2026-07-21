import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { InsufficientStockError, NotFoundError, InvalidOperationError } from '@/lib/errors';

export async function decrementStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  reason: string,
  sourceType: string,
  sourceId: string,
  userId: string,
  notes?: string
) {
  const product = await tx.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError(`Produto ID ${productId} não encontrado.`);
  }

  const available = product.stockOnHand - product.stockReserved;
  const settings = await tx.storeSettings.findUnique({ where: { id: 'singleton' } });

  if (available < quantity && !settings?.allowNegativeStock) {
    throw new InsufficientStockError(product.name, available, quantity);
  }

  const previousBalance = product.stockOnHand;
  const resultingBalance = previousBalance - quantity;

  await tx.product.update({
    where: { id: productId },
    data: { stockOnHand: resultingBalance },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      productId,
      quantity,
      direction: 'OUT',
      reason,
      previousBalance,
      resultingBalance,
      sourceType,
      sourceId,
      notes,
      userId,
    },
  });

  return movement;
}

export async function incrementStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  reason: string,
  sourceType: string,
  sourceId: string,
  userId: string,
  notes?: string,
  newCostPrice?: number
) {
  const product = await tx.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError(`Produto ID ${productId} não encontrado.`);
  }

  const previousBalance = product.stockOnHand;
  const resultingBalance = previousBalance + quantity;

  await tx.product.update({
    where: { id: productId },
    data: {
      stockOnHand: resultingBalance,
      ...(newCostPrice !== undefined ? { costPrice: newCostPrice } : {}),
    },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      productId,
      quantity,
      direction: 'IN',
      reason,
      previousBalance,
      resultingBalance,
      sourceType,
      sourceId,
      notes,
      userId,
    },
  });

  return movement;
}

export async function adjustStock(
  productId: string,
  quantity: number,
  direction: 'IN' | 'OUT',
  reasonText: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    if (direction === 'IN') {
      return incrementStock(
        tx,
        productId,
        quantity,
        'AJUSTE_ENTRADA',
        'MANUAL',
        'manual',
        userId,
        reasonText
      );
    } else {
      return decrementStock(
        tx,
        productId,
        quantity,
        'AJUSTE_SAIDA',
        'MANUAL',
        'manual',
        userId,
        reasonText
      );
    }
  });
}

export async function reserveStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  serviceOrderId: string,
  quoteId: string,
  userId: string
) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Produto não encontrado');

  const available = product.stockOnHand - product.stockReserved;
  if (available < quantity) {
    throw new InsufficientStockError(product.name, available, quantity);
  }

  await tx.product.update({
    where: { id: productId },
    data: { stockReserved: { increment: quantity } },
  });

  return tx.stockReservation.create({
    data: {
      serviceOrderId,
      quoteId,
      productId,
      quantity,
      status: 'ATIVA',
      createdById: userId,
    },
  });
}

export async function consumeReservation(
  tx: Prisma.TransactionClient,
  reservationId: string,
  userId: string
) {
  const reservation = await tx.stockReservation.findUnique({
    where: { id: reservationId },
    include: { product: true },
  });

  if (!reservation || reservation.status !== 'ATIVA') {
    throw new InvalidOperationError('Reserva não encontrada ou já processada');
  }

  await tx.stockReservation.update({
    where: { id: reservationId },
    data: { status: 'CONSUMIDA', consumedAt: new Date() },
  });

  const previousBalance = reservation.product.stockOnHand;
  const resultingBalance = previousBalance - reservation.quantity;

  await tx.product.update({
    where: { id: reservation.productId },
    data: {
      stockOnHand: resultingBalance,
      stockReserved: { decrement: reservation.quantity },
    },
  });

  return tx.inventoryMovement.create({
    data: {
      productId: reservation.productId,
      quantity: reservation.quantity,
      direction: 'OUT',
      reason: 'CONSUMO_ORDEM_SERVICO',
      previousBalance,
      resultingBalance,
      sourceType: 'SERVICE_ORDER',
      sourceId: reservation.serviceOrderId,
      notes: `Consumo de peça na OS ID ${reservation.serviceOrderId}`,
      userId,
    },
  });
}

export async function releaseReservation(
  tx: Prisma.TransactionClient,
  reservationId: string,
  userId: string
) {
  const reservation = await tx.stockReservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation || reservation.status !== 'ATIVA') {
    throw new InvalidOperationError('Reserva não encontrada ou já processada');
  }

  await tx.stockReservation.update({
    where: { id: reservationId },
    data: { status: 'LIBERADA', releasedAt: new Date() },
  });

  await tx.product.update({
    where: { id: reservation.productId },
    data: { stockReserved: { decrement: reservation.quantity } },
  });

  return reservation;
}
