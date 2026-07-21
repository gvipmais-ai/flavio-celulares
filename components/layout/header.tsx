'use client';

import React from 'react';
import Link from 'next/link';
import { UserRole } from '@/lib/permissions';
import { ShoppingCart, Wrench, Plus, Bell, User as UserIcon } from 'lucide-react';
import { Breadcrumb } from './breadcrumb';

interface HeaderProps {
  session: {
    name: string;
    email: string;
    role: UserRole;
  };
}

export function Header({ session }: HeaderProps) {
  const roleBadgeColor: Record<string, string> = {
    SUPERADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    TECNICO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    OPERADOR_CAIXA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const roleName: Record<string, string> = {
    SUPERADMIN: 'Super Admin',
    TECNICO: 'Técnico',
    OPERADOR_CAIXA: 'Caixa',
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 backdrop-blur-md">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        {/* Quick action buttons based on role */}
        {session.role === 'OPERADOR_CAIXA' && (
          <Link href="/caixa" className="btn-primary btn-sm">
            <ShoppingCart className="h-4 w-4" />
            Ir para Caixa
          </Link>
        )}

        {session.role === 'TECNICO' && (
          <Link href="/ordens/nova" className="btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Nova OS
          </Link>
        )}

        {session.role === 'SUPERADMIN' && (
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
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-200">{session.name}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${roleBadgeColor[session.role] ?? ''}`}>
              {roleName[session.role] ?? session.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
