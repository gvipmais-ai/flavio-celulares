'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  Users,
  Truck,
  FileText,
  Wrench,
  Tag,
  FolderOpen,
  Star,
  DollarSign,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  ScrollText,
  PlusCircle,
  ArrowUpDown,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../providers/auth-provider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  permissionKey?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  roles: string[];
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'PRINCIPAL',
    roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        exact: true,
      },
    ],
  },
  {
    title: 'VENDAS & CAIXA',
    roles: ['SUPERADMIN', 'OPERADOR'],
    items: [
      {
        href: '/caixa',
        label: 'Frente de Caixa (PDV)',
        icon: <ShoppingCart className="h-4 w-4 text-emerald-400" />,
        roles: ['SUPERADMIN', 'OPERADOR'],
        permissionKey: 'caixa',
      },
      {
        href: '/vendas',
        label: 'Histórico de Vendas',
        icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
        roles: ['SUPERADMIN', 'OPERADOR'],
        permissionKey: 'historico_vendas',
      },
      {
        href: '/devolucoes',
        label: 'Devoluções e Trocas',
        icon: <ArrowUpDown className="h-4 w-4 text-emerald-300" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'garantia_registrar',
      },
      {
        href: '/garantias',
        label: 'Consulta de Garantia',
        icon: <ClipboardList className="h-4 w-4 text-emerald-400" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        permissionKey: 'garantia_consultar',
      },
    ],
  },
  {
    title: 'ASSISTÊNCIA TÉCNICA',
    roles: ['SUPERADMIN', 'TECNICO'],
    items: [
      {
        href: '/ordens',
        label: 'Ordens de Serviço',
        icon: <Wrench className="h-4 w-4 text-amber-400" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'historico_manutencoes',
        exact: true,
      },
      {
        href: '/ordens/nova',
        label: 'Nova OS',
        icon: <PlusCircle className="h-4 w-4 text-amber-300" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'checklist',
      },
      {
        href: '/orcamentos',
        label: 'Orçamentos',
        icon: <FileText className="h-4 w-4 text-amber-400" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'orcamentos',
      },
      {
        href: '/manutencoes',
        label: 'Histórico de Manutenções',
        icon: <ScrollText className="h-4 w-4 text-amber-300" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'historico_manutencoes',
      },
    ],
  },
  {
    title: 'ESTOQUE & PRODUTOS',
    roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
    items: [
      {
        href: '/produtos',
        label: 'Produtos',
        icon: <Package className="h-4 w-4 text-blue-400" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        permissionKey: 'estoque_visualizar',
        exact: true,
      },
      {
        href: '/produtos/novo',
        label: 'Novo Produto',
        icon: <PlusCircle className="h-4 w-4 text-blue-300" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'produtos_cadastrar',
      },
      {
        href: '/estoque',
        label: 'Visão de Estoque',
        icon: <ClipboardList className="h-4 w-4 text-blue-400" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        permissionKey: 'estoque_visualizar',
        exact: true,
      },
      {
        href: '/estoque/movimentacoes',
        label: 'Movimentações',
        icon: <ArrowUpDown className="h-4 w-4 text-blue-400" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        permissionKey: 'estoque_visualizar',
      },
      {
        href: '/entradas',
        label: 'Notas de Entrada',
        icon: <Truck className="h-4 w-4 text-cyan-400" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'entrada_estoque',
      },
      {
        href: '/etiquetas',
        label: 'Etiquetas Code 128',
        icon: <Tag className="h-4 w-4 text-cyan-300" />,
        roles: ['SUPERADMIN', 'TECNICO'],
        permissionKey: 'etiquetas_gerar',
      },
    ],
  },
  {
    title: 'CADASTROS',
    roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
    items: [
      {
        href: '/clientes',
        label: 'CRM / Clientes',
        icon: <UserCheck className="h-4 w-4 text-indigo-400" />,
        roles: ['SUPERADMIN', 'TECNICO', 'OPERADOR'],
        permissionKey: 'clientes_visualizar',
      },
      {
        href: '/fornecedores',
        label: 'Fornecedores',
        icon: <Truck className="h-4 w-4 text-indigo-400" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'fornecedores_gerenciar',
      },
      {
        href: '/categorias',
        label: 'Categorias',
        icon: <FolderOpen className="h-4 w-4 text-indigo-300" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'produtos_editar',
      },
      {
        href: '/marcas',
        label: 'Marcas',
        icon: <Star className="h-4 w-4 text-indigo-300" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'produtos_editar',
      },
    ],
  },
  {
    title: 'ADMINISTRAÇÃO',
    roles: ['SUPERADMIN'],
    items: [
      {
        href: '/relatorios',
        label: 'Relatórios Gerenciais',
        icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'relatorios_vendas',
      },
      {
        href: '/usuarios',
        label: 'Usuários do Sistema',
        icon: <Users className="h-4 w-4 text-purple-400" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'configuracoes_usuarios',
      },
      {
        href: '/auditoria',
        label: 'Logs de Auditoria',
        icon: <ScrollText className="h-4 w-4 text-purple-300" />,
        roles: ['SUPERADMIN'],
      },
      {
        href: '/configuracoes',
        label: 'Configurações',
        icon: <Settings className="h-4 w-4 text-slate-400" />,
        roles: ['SUPERADMIN'],
        permissionKey: 'configuracoes_loja',
      },
      {
        href: '/admin/gerenciamento',
        label: 'Gerenciamento (SuperADMIN)',
        icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
        roles: ['SUPERADMIN'],
      },
    ],
  },
];

interface SidebarProps {
  lowStockCount?: number;
}

export function Sidebar({ lowStockCount = 0 }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const normalizedUserRole = user.cargo?.toUpperCase() || '';

  const roleLabel: Record<string, string> = {
    SUPERADMIN: 'Super Administrador',
    ADMIN: 'Gerente / Admin',
    GERENTE: 'Gerente / Admin',
    TECNICO: 'Técnico',
    'OPERADOR DE CAIXA': 'Operador de Caixa',
    OPERADOR_CAIXA: 'Operador de Caixa',
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur transition-all duration-300 select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header da Sidebar */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white tracking-tight">Flavio Celulares</p>
              <p className="truncate text-[10px] font-medium text-slate-400">Gestão & Assistência</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn-ghost btn-icon ml-auto shrink-0 text-slate-400 hover:text-white"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navegação por Seções Categorizadas */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {NAV_SECTIONS.map((section) => {
          const visibleSectionItems = section.items.filter((item) => {
            if (normalizedUserRole === 'SUPERADMIN') return true;
            if (item.permissionKey && user.permissoes?.[item.permissionKey] === true) return true;
            return item.roles.map(r => r.toUpperCase()).includes(normalizedUserRole);
          });

          if (visibleSectionItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </p>
              )}

              {visibleSectionItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const showBadge = item.href === '/estoque' && lowStockCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 relative group',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                      collapsed && 'justify-center px-2 py-2.5'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={cn('shrink-0 transition-transform group-hover:scale-110', isActive && 'text-blue-400')}>
                      {item.icon}
                    </span>

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && showBadge && (
                      <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-950 animate-pulse">
                        {lowStockCount > 99 ? '99+' : lowStockCount}
                      </span>
                    )}

                    {collapsed && showBadge && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Informações do Usuário & Sair */}
      <div className="border-t border-slate-800 p-3 shrink-0 bg-slate-950/40">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/30 text-blue-300 text-sm font-bold shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{roleLabel[normalizedUserRole] ?? user.cargo}</p>
            </div>
            <button
              onClick={() => logout()}
              className="btn-ghost btn-icon shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => logout()}
            className="btn-ghost btn-icon w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
