'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Wrench, Plus, Bell, User as UserIcon, Search } from 'lucide-react';
import { Breadcrumb } from './breadcrumb';
import { GlobalSearch } from '../GlobalSearch';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  session: {
    name: string;
    email: string;
    roleName: string;
  };
}

export function Header({ session }: HeaderProps) {
  const normalizedUserRole = session.roleName?.toUpperCase() || '';

  const roleBadgeColor: Record<string, string> = {
    SUPERADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    TECNICO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'OPERADOR DE CAIXA': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    OPERADOR_CAIXA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    GERENTE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const roleName: Record<string, string> = {
    SUPERADMIN: 'Super Admin',
    TECNICO: 'Técnico',
    'OPERADOR DE CAIXA': 'Caixa',
    OPERADOR_CAIXA: 'Caixa',
    GERENTE: 'Gerente',
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-theme bg-card px-6">
      <div className="flex items-center gap-6">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <GlobalSearch />
        <ThemeToggle />

        {/* Quick action buttons based on role */}
        {(normalizedUserRole === 'OPERADOR DE CAIXA' || normalizedUserRole === 'OPERADOR_CAIXA') && (
          <Link href="/caixa" className="btn-primary btn-sm">
            <ShoppingCart className="h-4 w-4" />
            Ir para Caixa
          </Link>
        )}
        {normalizedUserRole === 'TECNICO' && (
          <Link href="/ordens/nova" className="btn-primary btn-sm">
            <Wrench className="h-4 w-4" />
            Nova OS
          </Link>
        )}
        {normalizedUserRole === 'SUPERADMIN' && (
          <div className="flex items-center gap-2">
            <Link href="/caixa" className="btn-primary btn-sm">
              <ShoppingCart className="h-4 w-4" />
              Caixa
            </Link>
            <Link href="/ordens/nova" className="btn-secondary btn-sm">
              <Wrench className="h-4 w-4" />
              Nova OS
            </Link>
          </div>
        )}

        <div className="h-5 w-px bg-slate-800" />

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-semibold text-sm">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium leading-none">{session.name}</span>
            <span className={`inline-flex whitespace-nowrap items-center justify-center rounded-full border px-2 py-0.5 text-[10px] leading-none font-semibold ${roleBadgeColor[normalizedUserRole] ?? ''}`}>
              {roleName[normalizedUserRole] ?? session.roleName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
