import { type JWTPayload } from './jwt';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MODULES_SCHEMA } from './default-permissions';

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

// ─── Mapa de Transição (Legado -> Novo JSON) ──────────────────────────────────
// Mapeia as antigas permissões baseadas em strings para os caminhos do novo JSON
const PERMISSION_MAPPING: Record<Permission, { module: keyof typeof DEFAULT_MODULES_SCHEMA; action: string }> = {
  'sales:create': { module: 'caixa', action: 'criarVenda' },
  'sales:read:own': { module: 'caixa', action: 'visualizar' },
  'sales:read:all': { module: 'caixa', action: 'visualizar' },
  'sales:cancel': { module: 'caixa', action: 'cancelarVenda' },
  'sales:receipt:reprint': { module: 'caixa', action: 'reimprimirRecibo' },
  'cash:open': { module: 'caixa', action: 'abrirFecharCaixa' },
  'cash:close': { module: 'caixa', action: 'abrirFecharCaixa' },
  'cash:supplement': { module: 'caixa', action: 'sangriaSuprimento' },
  'cash:withdrawal': { module: 'caixa', action: 'sangriaSuprimento' },
  'cash:read:own': { module: 'caixa', action: 'visualizar' },
  'cash:read:all': { module: 'caixa', action: 'visualizar' },
  'products:read': { module: 'estoque', action: 'visualizar' },
  'products:create': { module: 'estoque', action: 'cadastrarProduto' },
  'products:edit': { module: 'estoque', action: 'editar' },
  'products:activate': { module: 'estoque', action: 'excluirProduto' },
  'products:approve': { module: 'estoque', action: 'editar' },
  'products:read:cost': { module: 'estoque', action: 'verCusto' },
  'products:change:price': { module: 'estoque', action: 'editar' },
  'stock:read': { module: 'estoque', action: 'visualizar' },
  'stock:adjust': { module: 'estoque', action: 'ajustarEstoque' },
  'categories:manage': { module: 'estoque', action: 'editar' },
  'brands:manage': { module: 'estoque', action: 'editar' },
  'suppliers:manage': { module: 'fornecedores', action: 'editar' },
  'customers:read': { module: 'clientes', action: 'visualizar' },
  'customers:create': { module: 'clientes', action: 'cadastrar' },
  'customers:edit': { module: 'clientes', action: 'editar' },
  'purchase-entries:create': { module: 'estoque', action: 'cadastrarProduto' },
  'purchase-entries:confirm': { module: 'estoque', action: 'cadastrarProduto' },
  'purchase-entries:cancel': { module: 'estoque', action: 'cadastrarProduto' },
  'service-orders:read': { module: 'ordensServico', action: 'visualizar' },
  'service-orders:create': { module: 'ordensServico', action: 'criar' },
  'service-orders:update': { module: 'ordensServico', action: 'editar' },
  'checklist:fill': { module: 'checklist', action: 'criar' },
  'quotes:create': { module: 'checklist', action: 'gerarOrcamento' },
  'quotes:approve': { module: 'checklist', action: 'gerarOrcamento' },
  'parts:reserve': { module: 'ordensServico', action: 'editar' },
  'parts:consume': { module: 'ordensServico', action: 'editar' },
  'labels:generate': { module: 'estoque', action: 'gerarEtiquetas' },
  'reports:view': { module: 'relatorios', action: 'visualizar' },
  'reports:financial': { module: 'relatorios', action: 'visualizar' },
  'reports:sales': { module: 'relatorios', action: 'visualizar' },
  'reports:inventory': { module: 'relatorios', action: 'visualizar' },
  'reports:maintenance': { module: 'relatorios', action: 'visualizar' },
  'reports:warranty': { module: 'relatorios', action: 'visualizar' },
  'returns:create': { module: 'caixa', action: 'criarVenda' },
  'returns:approve': { module: 'caixa', action: 'cancelarVenda' },
  'returns:read': { module: 'caixa', action: 'visualizar' },
  'warranties:query': { module: 'caixa', action: 'visualizar' },
  'users:manage': { module: 'usuarios', action: 'editar' },
  'settings:manage': { module: 'configuracoes', action: 'editar' },
  'audit:view': { module: 'relatorios', action: 'visualizar' },
};

// ─── Funções Principais de Validação ──────────────────────────────────────────

/**
 * Guard para Server Components e Route Handlers.
 * Lança erro se o usuário não tiver a permissão solicitada.
 * Busca as permissões direto do banco para garantir tempo real.
 */
export async function requirePermission(session: JWTPayload | null, legacyPermission: Permission): Promise<void> {
  if (!session || !session.roleId) {
    throw new UnauthorizedError('Não autenticado ou cargo inválido');
  }

  const role = await prisma.role.findUnique({
    where: { id: session.roleId },
    select: { permissions: true, name: true },
  });

  if (!role) {
    throw new ForbiddenError('Cargo associado não encontrado.');
  }

  const mapped = PERMISSION_MAPPING[legacyPermission];
  if (!mapped) {
    // Fallback: se não estiver mapeado, negar por segurança
    throw new ForbiddenError(`Permissão "${legacyPermission}" não mapeada.`);
  }

  try {
    const permsJson = JSON.parse(role.permissions);
    const hasAccess = permsJson.modulos?.[mapped.module]?.[mapped.action] === true;

    if (!hasAccess) {
      throw new ForbiddenError(`Cargo "${role.name}" não pode realizar a ação "${mapped.action}" no módulo "${mapped.module}".`);
    }
  } catch (e) {
    if (e instanceof ForbiddenError) throw e;
    throw new ForbiddenError('Erro ao ler as permissões do cargo.');
  }
}

/**
 * Valida a permissão baseada no novo JSON dinamicamente
 */
export async function requireModulePermission(session: JWTPayload | null, module: keyof typeof DEFAULT_MODULES_SCHEMA, action: string): Promise<void> {
  if (!session || !session.roleId) {
    throw new UnauthorizedError('Não autenticado');
  }

  const role = await prisma.role.findUnique({
    where: { id: session.roleId },
    select: { permissions: true, name: true },
  });

  if (!role) {
    throw new ForbiddenError('Cargo associado não encontrado.');
  }

  try {
    const permsJson = JSON.parse(role.permissions);
    const hasAccess = permsJson.modulos?.[module]?.[action] === true;

    if (!hasAccess) {
      throw new ForbiddenError(`Permissão insuficiente para ação "${action}" no módulo "${module}".`);
    }
  } catch (e) {
    if (e instanceof ForbiddenError) throw e;
    throw new ForbiddenError('Erro ao ler as permissões do cargo.');
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
