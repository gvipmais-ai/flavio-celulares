'use client';

import { ShieldCheck, Activity, Users, FileStack } from 'lucide-react';
import Link from 'next/link';

export default function MasterDashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-red-500" />
          Painel de Controle Mestre
        </h1>
        <p className="text-slate-400 mt-1">
          Acesso irrestrito a configurações de infraestrutura e dados do sistema. Use com extrema cautela.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link href="/master/database" className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-red-900/50 hover:bg-slate-900/80 transition-colors group">
          <div className="h-10 w-10 bg-red-950/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Activity className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="font-bold text-slate-200">Banco de Dados</h3>
          <p className="text-xs text-slate-500 mt-1">Resetar, backup JSON e restores</p>
        </Link>

        <Link href="/master/users" className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-red-900/50 hover:bg-slate-900/80 transition-colors group">
          <div className="h-10 w-10 bg-blue-950/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-slate-200">Gestão de Usuários</h3>
          <p className="text-xs text-slate-500 mt-1">Ver todos, forçar senhas e cargos</p>
        </Link>

        <Link href="/master/logs" className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-red-900/50 hover:bg-slate-900/80 transition-colors group">
          <div className="h-10 w-10 bg-amber-950/50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileStack className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="font-bold text-slate-200">Auditoria Mestre</h3>
          <p className="text-xs text-slate-500 mt-1">Logs imutáveis de ações do sistema</p>
        </Link>

      </div>

      <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6 mt-8">
        <h2 className="text-red-400 font-bold mb-2">Atenção, Mestre!</h2>
        <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
          <li>As ações realizadas neste painel sobrepõem qualquer permissão normal (SuperADMIN).</li>
          <li>Operações de banco de dados (Reset) <strong>apagarão todos os dados</strong> de clientes, vendas e produtos.</li>
          <li>Não compartilhe o Token Mestre com ninguém. Revogue-o se suspeitar de vazamento.</li>
        </ul>
      </div>
    </div>
  );
}
