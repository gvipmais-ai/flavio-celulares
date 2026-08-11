'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [forcePassword, setForcePassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/master/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
      if (data.roles) setRoles(data.roles);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const payload: any = {
        id: editingUser.id,
        roleId: editingUser.roleId,
        isActive: editingUser.isActive,
      };
      if (forcePassword) payload.forcePassword = forcePassword;

      const res = await fetch('/api/master/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success('Usuário forçado/editado com sucesso');
      setEditingUser(null);
      setForcePassword('');
      fetchData();
    } catch {
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-400">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-slate-400" />
          Gestão Absoluta de Usuários
        </h1>
        <p className="text-slate-400 mt-1">
          Altere cargos, ative/desative ou force senhas ignorando qualquer restrição.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">E-mail</th>
              <th className="px-6 py-3">Cargo Atual</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role?.name || 'Sem Cargo'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                  }`}>
                    {user.isActive ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-blue-400 hover:text-blue-300 font-bold"
                  >
                    FORÇAR EDIÇÃO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Editando: {editingUser.name}</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Forçar Cargo (Role)</label>
                <select
                  value={editingUser.roleId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                  className="input mt-1"
                >
                  <option value="">Sem cargo</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={editingUser.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'true' })}
                  className="input mt-1"
                >
                  <option value="true">Ativo / Desbloqueado</option>
                  <option value="false">Bloqueado / Inativo</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="label flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Forçar Nova Senha
                </label>
                <p className="text-xs text-slate-500 mb-2">Deixe em branco para manter a atual</p>
                <input
                  type="text"
                  value={forcePassword}
                  onChange={(e) => setForcePassword(e.target.value)}
                  placeholder="Nova senha (texto limpo)"
                  className="input font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" className="btn-secondary" onClick={() => { setEditingUser(null); setForcePassword(''); }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Aplicar Força Mestre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
