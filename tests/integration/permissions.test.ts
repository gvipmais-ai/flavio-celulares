import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/permissions';

describe('RBAC Permissions Integration Tests', () => {
  it('OPERADOR_CAIXA should be able to create sales but not cancel sales or manage users', () => {
    expect(hasPermission('OPERADOR_CAIXA', 'sales:create')).toBe(true);
    expect(hasPermission('OPERADOR_CAIXA', 'sales:cancel')).toBe(false);
    expect(hasPermission('OPERADOR_CAIXA', 'users:manage')).toBe(false);
  });

  it('TECNICO should be able to manage service orders and reserve parts', () => {
    expect(hasPermission('TECNICO', 'service-orders:create')).toBe(true);
    expect(hasPermission('TECNICO', 'parts:reserve')).toBe(true);
    expect(hasPermission('TECNICO', 'sales:cancel')).toBe(false);
    expect(hasPermission('TECNICO', 'users:manage')).toBe(false);
  });

  it('SUPERADMIN should have all permissions', () => {
    expect(hasPermission('SUPERADMIN', 'sales:create')).toBe(true);
    expect(hasPermission('SUPERADMIN', 'sales:cancel')).toBe(true);
    expect(hasPermission('SUPERADMIN', 'users:manage')).toBe(true);
    expect(hasPermission('SUPERADMIN', 'stock:adjust')).toBe(true);
  });
});
