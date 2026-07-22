import { type JWTPayload } from './jwt';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TECNICO' | 'OPERADOR_CAIXA';

export type Permission =
  | 'sales:create'
  | 'sales:read:own'
  | 'sales:read:all'
  | 'sales:cancel'
  | 'sales:receipt:reprint'
  | 'cash:open'
  | 'cash:close'
  | 'cash:supplement'
  | 'cash:withdrawal'
  | 'cash:read:own'
  | 'cash:read:all'
  | 'products:read'
  | 'products:create'
  | 'products:edit'
  | 'products:activate'
  | 'products:approve'
  | 'products:read:cost'
  | 'products:change:price'
  | 'stock:read'
  | 'stock:adjust'
  | 'categories:manage'
  | 'brands:manage'
  | 'suppliers:manage'
  | 'customers:read'
  | 'customers:create'
  | 'customers:edit'
  | 'purchase-entries:create'
  | 'purchase-entries:confirm'
  | 'purchase-entries:cancel'
  | 'service-orders:read'
  | 'service-orders:create'
  | 'service-orders:update'
  | 'checklist:fill'
  | 'quotes:create'
  | 'quotes:approve'
  | 'parts:reserve'
  | 'parts:consume'
  | 'labels:generate'
  | 'reports:view'
  | 'reports:financial'
  | 'reports:sales'
  | 'reports:inventory'
  | 'reports:maintenance'
  | 'reports:warranty'
  | 'returns:create'
  | 'returns:approve'
  | 'returns:read'
  | 'warranties:query'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view';

// ─── Mapa de permissões por cargo ─────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPERADMIN: [
    'sales:create',
    'sales:read:own',
    'sales:read:all',
    'sales:cancel',
    'sales:receipt:reprint',
    'cash:open',
    'cash:close',
    'cash:supplement',
    'cash:withdrawal',
    'cash:read:own',
    'cash:read:all',
    'products:read',
    'products:create',
    'products:edit',
    'products:activate',
    'products:approve',
    'products:read:cost',
    'products:change:price',
    'stock:read',
    'stock:adjust',
    'categories:manage',
    'brands:manage',
    'suppliers:manage',
    'customers:read',
    'customers:create',
    'customers:edit',
    'purchase-entries:create',
    'purchase-entries:confirm',
    'purchase-entries:cancel',
    'service-orders:read',
    'service-orders:create',
    'service-orders:update',
    'checklist:fill',
    'quotes:create',
    'quotes:approve',
    'parts:reserve',
    'parts:consume',
    'labels:generate',
    'reports:view',
    'reports:financial',
    'reports:sales',
    'reports:inventory',
    'reports:maintenance',
    'reports:warranty',
    'returns:create',
    'returns:approve',
    'returns:read',
    'warranties:query',
    'users:manage',
    'settings:manage',
    'audit:view',
  ],

  ADMIN: [
    'sales:create',
    'sales:read:own',
    'sales:read:all',
    'sales:cancel',
    'sales:receipt:reprint',
    'cash:open',
    'cash:close',
    'cash:supplement',
    'cash:withdrawal',
    'cash:read:own',
    'cash:read:all',
    'products:read',
    'products:create',
    'products:edit',
    'products:activate',
    'stock:read',
    'stock:adjust',
    'categories:manage',
    'brands:manage',
    'suppliers:manage',
    'customers:read',
    'customers:create',
    'customers:edit',
    'purchase-entries:create',
    'purchase-entries:confirm',
    'purchase-entries:cancel',
    'service-orders:read',
    'service-orders:create',
    'service-orders:update',
    'checklist:fill',
    'quotes:create',
    'quotes:approve',
    'parts:reserve',
    'parts:consume',
    'labels:generate',
    'reports:view',
    'reports:sales',
    'reports:inventory',
    'reports:maintenance',
    'reports:warranty',
    'returns:create',
    'returns:approve',
    'returns:read',
    'warranties:query',
  ],

  TECNICO: [
    'products:read',
    'products:create',
    'stock:read',
    'customers:read',
    'customers:create',
    'purchase-entries:create',
    'service-orders:read',
    'service-orders:create',
    'service-orders:update',
    'checklist:fill',
    'quotes:create',
    'quotes:approve',
    'parts:reserve',
    'parts:consume',
    'labels:generate',
    'reports:view',
    'reports:maintenance',
    'warranties:query',
  ],

  OPERADOR_CAIXA: [
    'sales:create',
    'sales:read:own',
    'sales:receipt:reprint',
    'cash:open',
    'cash:close',
    'cash:supplement',
    'cash:withdrawal',
    'cash:read:own',
    'products:read',
    'stock:read',
    'customers:read',
    'customers:create',
    'returns:create',
    'returns:read',
    'warranties:query',
  ],
};

// ─── Funções de verificação ───────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Guard para Server Components e Route Handlers.
 * Lança erro se o usuário não tiver a permissão solicitada.
 */
export function requirePermission(session: JWTPayload | null, permission: Permission): void {
  if (!session) {
    throw new ForbiddenError('Não autenticado');
  }
  if (!hasPermission(session.role, permission)) {
    throw new ForbiddenError(
      `Permissão insuficiente. Cargo "${session.role}" não pode realizar "${permission}".`
    );
  }
}

// ─── Erros de permissão ───────────────────────────────────────────────────────

export class ForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  public readonly statusCode = 401;
  constructor(message = 'Não autenticado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
