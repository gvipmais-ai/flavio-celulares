import { type JWTPayload } from './jwt';
import { prisma } from '@/lib/prisma';

// ─── Tipos ────────────────────────────────────────────────────────────────────

// The old Permission type is kept temporarily to ensure the refactored APIs compile.
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

// Mapeia permissões antigas para as novas chaves
const PERMISSION_MAPPING: Record<Permission, string> = {
  'sales:create': 'caixa',
  'sales:read:own': 'historico_vendas',
  'sales:read:all': 'historico_vendas',
  'sales:cancel': 'historico_vendas',
  'sales:receipt:reprint': 'historico_vendas',
  'cash:open': 'fechamento_caixa',
  'cash:close': 'fechamento_caixa',
  'cash:supplement': 'fechamento_caixa',
  'cash:withdrawal': 'fechamento_caixa',
  'cash:read:own': 'fechamento_caixa',
  'cash:read:all': 'fechamento_caixa',
  'products:read': 'estoque_visualizar',
  'products:create': 'produtos_cadastrar',
  'products:edit': 'produtos_editar',
  'products:activate': 'produtos_excluir',
  'products:approve': 'produtos_editar',
  'products:read:cost': 'estoque_visualizar',
  'products:change:price': 'produtos_editar',
  'stock:read': 'estoque_visualizar',
  'stock:adjust': 'ajuste_estoque',
  'categories:manage': 'produtos_editar',
  'brands:manage': 'produtos_editar',
  'suppliers:manage': 'produtos_editar',
  'customers:read': 'clientes_visualizar',
  'customers:create': 'clientes_cadastrar',
  'customers:edit': 'clientes_cadastrar', // Simplificado
  'purchase-entries:create': 'entrada_estoque',
  'purchase-entries:confirm': 'entrada_estoque',
  'purchase-entries:cancel': 'entrada_estoque',
  'service-orders:read': 'historico_manutencoes',
  'service-orders:create': 'checklist',
  'service-orders:update': 'checklist',
  'checklist:fill': 'checklist',
  'quotes:create': 'orcamentos',
  'quotes:approve': 'orcamentos',
  'parts:reserve': 'checklist',
  'parts:consume': 'checklist',
  'labels:generate': 'etiquetas_gerar',
  'reports:view': 'relatorios_vendas',
  'reports:financial': 'relatorios_vendas',
  'reports:sales': 'relatorios_vendas',
  'reports:inventory': 'relatorios_estoque',
  'reports:maintenance': 'relatorios_manutencao',
  'reports:warranty': 'relatorios_vendas',
  'returns:create': 'garantia_registrar',
  'returns:approve': 'garantia_registrar',
  'returns:read': 'garantia_consultar',
  'warranties:query': 'garantia_consultar',
  'users:manage': 'configuracoes_usuarios',
  'settings:manage': 'configuracoes_loja',
  'audit:view': 'painel_mestre',
};

// ─── Funções Principais de Validação ──────────────────────────────────────────

export async function requirePermission(session: JWTPayload | null, legacyPermission: Permission): Promise<void> {
  if (!session || !session.sub) {
    throw new UnauthorizedError('Não autenticado');
  }

  // Master Token (bypass total)
  if (session.scope === 'master') return;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { cargo: true, permissoes: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new ForbiddenError('Usuário bloqueado ou não encontrado.');
  }

  // SuperADMIN tem passe livre
  if (user.cargo === 'SUPERADMIN') return;

  const mappedKey = PERMISSION_MAPPING[legacyPermission];
  if (!mappedKey) {
    throw new ForbiddenError(`Permissão legado "${legacyPermission}" não mapeada.`);
  }

  try {
    const permsJson = user.permissoes ? (user.permissoes as Record<string, boolean>) : {};
    const hasAccess = permsJson[mappedKey] === true;

    if (!hasAccess) {
      throw new ForbiddenError(`Você não tem permissão para a ação "${mappedKey}".`);
    }
  } catch (e) {
    if (e instanceof ForbiddenError) throw e;
    throw new ForbiddenError('Erro ao ler as permissões do usuário.');
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
