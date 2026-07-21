'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SUPERADMIN' | 'TECNICO' | 'OPERADOR_CAIXA'>('OPERADOR_CAIXA');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar usuário');
        return;
      }

      toast.success('Usuário criado com sucesso!');
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Deseja redefinir a senha deste usuário?')) return;
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Nova senha temporária gerada: ${data.temporaryPassword}`);
      }
    } catch {
      toast.error('Erro ao redefinir senha');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Gestão de Usuários</h1>
          <p className="text-xs text-slate-400">Gerencie operadores de caixa, técnicos e administradores</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo Usuário
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold text-slate-200">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-info">{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="btn-ghost btn-sm"
                      title="Redefinir Senha"
                    >
                      <KeyRound className="h-4 w-4" /> Senha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Novo Usuário</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Senha Inicial (mín. 8 caracteres)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Cargo</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="input"
                >
                  <option value="OPERADOR_CAIXA">Operador de Caixa</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="SUPERADMIN">SuperADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
