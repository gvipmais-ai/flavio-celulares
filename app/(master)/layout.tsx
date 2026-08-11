'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Database, 
  Palette, 
  Users, 
  ScrollText,
  KeyRound,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/master-login');
      toast.info('Sessão mestre encerrada');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/master/dashboard', icon: LayoutDashboard },
    { name: 'Banco de Dados', path: '/master/database', icon: Database },
    { name: 'Layout & Configs', path: '/master/settings', icon: Palette },
    { name: 'Gestão de Usuários', path: '/master/users', icon: Users },
    { name: 'Logs de Auditoria', path: '/master/logs', icon: ScrollText },
    { name: 'Tokens Mestre', path: '/master/tokens', icon: KeyRound },
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar Restrita */}
      <aside className="w-64 bg-slate-950 border-r border-red-900/50 flex flex-col shadow-[4px_0_24px_rgba(220,38,38,0.05)] relative z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
        
        <div className="h-16 flex items-center gap-3 px-6 border-b border-red-900/30">
          <ShieldAlert className="h-6 w-6 text-red-500" />
          <span className="font-bold text-lg text-white tracking-wide uppercase">Mestre</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-red-950/50 text-red-400 border border-red-900/50 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-red-500' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-red-900/30 bg-red-950/10">
          <div className="flex flex-col gap-2">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 justify-center py-2 px-4 rounded bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Voltar ao App Normal
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 justify-center py-2 px-4 rounded text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair do Modo Mestre
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar leve */}
        <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-red-900/30 flex items-center justify-between px-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Zona de Administração Avançada
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-full">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-bold text-red-400">ACESSO TOTAL</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
