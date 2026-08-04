'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  _count: { users: number };
}

export function RoleList({ onEdit, onCreateNew }: { onEdit: (id: string) => void, onCreateNew: () => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Erro ao carregar cargos');
      setRoles(data.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cargo ${name}?`)) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Erro ao excluir cargo');
      toast.success('Cargo excluído com sucesso');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-4 text-center">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">Cargos Cadastrados</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Criar Novo Cargo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-slate-700/50 rounded-lg p-5 border border-slate-600 flex flex-col h-full hover:border-slate-500 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {role.isSystem && <span title="Cargo de Sistema"><ShieldAlert className="h-4 w-4 text-amber-500" /></span>}
                {role.name}
              </h3>
            </div>
            <p className="text-sm text-slate-400 mb-4 flex-1">
              {role.description || 'Sem descrição.'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-600/50 mt-auto">
              <div className="flex items-center text-xs text-slate-400">
                <Users className="h-4 w-4 mr-1" />
                {role._count.users} usuário(s)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(role.id)}
                  className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-600 rounded-md transition-colors"
                  title="Editar Cargo"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {!role.isSystem && role._count.users === 0 && (
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-600 rounded-md transition-colors"
                    title="Excluir Cargo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
