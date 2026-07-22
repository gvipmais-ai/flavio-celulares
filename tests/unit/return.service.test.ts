import { describe, it, expect, vi } from 'vitest';
import { processReturnOrExchange } from '@/services/return.service';
import { prisma } from '@/lib/prisma';

// Mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    saleItem: {
      findUnique: vi.fn(),
    },
    return: {
      create: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
    },
  },
}));

describe('Return Service', () => {
  it('should throw an error if sale item is not found', async () => {
    vi.mocked(prisma.saleItem.findUnique).mockResolvedValueOnce(null);

    await expect(
      processReturnOrExchange({
        saleId: 'sale-1',
        saleItemId: 'item-1',
        quantity: 1,
        reason: 'Defeito',
        type: 'DEVOLUCAO',
        createdById: 'user-1',
      })
    ).rejects.toThrow('Item da venda não encontrado');
  });
});
