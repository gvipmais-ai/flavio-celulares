'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const PATH_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  caixa: 'Caixa',
  vendas: 'Vendas',
  produtos: 'Produtos',
  novo: 'Novo',
  estoque: 'Estoque',
  movimentacoes: 'Movimentações',
  entradas: 'Notas de Entrada',
  clientes: 'Clientes',
  ordens: 'Ordens de Serviço',
  nova: 'Nova Ordem',
  orcamentos: 'Orçamentos',
  etiquetas: 'Etiquetas',
  relatorios: 'Relatórios',
  usuarios: 'Usuários',
  configuracoes: 'Configurações',
  auditoria: 'Auditoria',
  fornecedores: 'Fornecedores',
  categorias: 'Categorias',
  marcas: 'Marcas',
  'alterar-senha': 'Alterar Senha',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-400">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((seg, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const label = PATH_MAP[seg] || seg;
        const isLast = idx === segments.length - 1;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-medium text-slate-200 truncate">{label}</span>
            ) : (
              <Link href={href} className="hover:text-slate-200 transition-colors truncate">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
