import { prisma } from './prisma';

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_LOGIN_FAILED'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_DEACTIVATED'
  | 'STOCK_ADJUSTED'
  | 'PURCHASE_ENTRY_CREATED'
  | 'PURCHASE_ENTRY_CONFIRMED'
  | 'PURCHASE_ENTRY_CANCELED'
  | 'CASH_SESSION_OPENED'
  | 'CASH_SESSION_CLOSED'
  | 'CASH_SUPPLEMENT'
  | 'CASH_WITHDRAWAL'
  | 'SALE_CREATED'
  | 'SALE_CANCELED'
  | 'SALE_RECEIPT_REPRINTED'
  | 'SERVICE_ORDER_CREATED'
  | 'SERVICE_ORDER_STATUS_CHANGED'
  | 'QUOTE_CREATED'
  | 'QUOTE_APPROVED'
  | 'QUOTE_REJECTED'
  | 'QUOTE_CANCELED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONSUMED'
  | 'RESERVATION_RELEASED'
  | 'SETTINGS_UPDATED'
  | 'CHECKLIST_TEMPLATE_UPDATED'
  | 'CUSTOMER_CREATED'
  | 'CATEGORY_CREATED'
  | 'BRAND_CREATED'
  | 'SUPPLIER_CREATED';

interface AuditParams {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma entrada de auditoria.
 * Fire-and-forget: não bloqueia a operação principal se falhar.
 */
export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Não propaga o erro para não interromper a operação principal
    console.error('[AuditLog] Falha ao registrar auditoria:', err);
  }
}

/**
 * Registra dentro de uma transação Prisma existente.
 */
export function createAuditLogTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: AuditParams
) {
  return tx.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
