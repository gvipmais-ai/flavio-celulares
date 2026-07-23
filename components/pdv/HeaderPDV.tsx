'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { usePDV } from './PDVContext';
import { Lock, LockOpen, LayoutDashboard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export function HeaderPDV({ onOpenDrawerModal, onOpenHelp }: { onOpenDrawerModal: () => void, onOpenHelp: () => void }) {
  const { cashSession } = usePDV();

  return (
    <header className="flex h-16 items-center justify-between bg-slate-900 px-4 shrink-0 border-b border-slate-800">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-bold">Painel</span>
        </Link>
        <div className="flex items-center">
          <span className="font-black text-xl text-primary-500 tracking-tight">FLAVIO<span className="text-white">CELULARES</span></span>
        </div>
        <div className="flex flex-col border-l border-slate-700 pl-4">
          <span className="text-slate-100 font-bold text-sm">Frente de Caixa</span>
          <span className="text-slate-400 text-xs">Atendente: {cashSession?.operatorName || '...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {cashSession ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md">
            <LockOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">Caixa Aberto (Sessão #{cashSession.id.slice(-5)})</span>
            <span className="text-xs text-slate-300 ml-2">Fundo: {formatCurrency(cashSession.openingAmount)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-md">
            <Lock className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-rose-400">Caixa Fechado</span>
          </div>
        )}

        <button 
          onClick={onOpenDrawerModal}
          className="btn-secondary text-xs h-8 px-3"
        >
          Opções do Caixa (F11)
        </button>
        
        <button 
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors text-sm font-bold"
          title="Atalhos (F1)"
        >
          ?
        </button>

        <div className="border-l border-slate-700 h-8 mx-2" />
        <ThemeToggle />
      </div>
    </header>
  );
}
