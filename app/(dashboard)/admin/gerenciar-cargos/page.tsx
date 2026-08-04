'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { RoleList } from '@/components/admin/roles/RoleList';
import { RoleEditor } from '@/components/admin/roles/RoleEditor';
import { Loader2, Shield, Users } from 'lucide-react';

export default function GerenciarCargosPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'lista' | 'editor'>('lista');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Redirecionamento de segurança
  useEffect(() => {
    if (user && user.roleName !== 'SuperADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.roleName !== 'SuperADMIN') {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Gerenciamento de Cargos e Permissões
          </h1>
          <p className="text-slate-400 mt-1">
            Crie cargos personalizados e defina os acessos de forma granular.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="flex border-b border-slate-700">
          <button
            className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'lista'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
            onClick={() => setActiveTab('lista')}
          >
            Lista de Cargos
          </button>
          <button
            className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
            onClick={() => setActiveTab('editor')}
          >
            Editor de Cargo
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'lista' && (
            <RoleList 
              onEdit={(id) => {
                setSelectedRoleId(id);
                setActiveTab('editor');
              }} 
              onCreateNew={() => {
                setSelectedRoleId(null);
                setActiveTab('editor');
              }}
            />
          )}
          
          {activeTab === 'editor' && (
            <RoleEditor 
              roleId={selectedRoleId} 
              onClose={() => setActiveTab('lista')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
