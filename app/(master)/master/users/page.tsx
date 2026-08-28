'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, Save, User as UserIcon, Shield, Search, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { id: 'caixa', label: 'Operar PDV / Caixa' },
  { id: 'fechamento_caixa', label: 'Gestão de Caixa (Abrir/Fechar)' },
  { id: 'historico_vendas', label: 'Histórico de Vendas' },
  { id: 'estoque_visualizar', label: 'Visualizar Estoque' },
  { id: 'ajuste_estoque', label: 'Ajuste de Estoque' },
  { id: 'produtos_cadastrar', label: 'Cadastrar Produtos' },
  { id: 'produtos_editar', label: 'Editar Produtos' },
  { id: 'produtos_excluir', label: 'Excluir Produtos' },
  { id: 'clientes_visualizar', label: 'Visualizar Clientes' },
  { id: 'clientes_cadastrar', label: 'Cadastrar/Editar Clientes' },
  { id: 'entrada_estoque', label: 'Entradas de Estoque' },
  { id: 'historico_manutencoes', label: 'Histórico de Manutenções' },
  { id: 'checklist', label: 'Ordens de Serviço (Checklist/Peças)' },
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'etiquetas_gerar', label: 'Gerar Etiquetas' },
  { id: 'relatorios_vendas', label: 'Relatórios Financeiros/Vendas' },
  { id: 'relatorios_estoque', label: 'Relatórios de Estoque' },
  { id: 'relatorios_manutencao', label: 'Relatórios de Manutenção' },
  { id: 'garantia_registrar', label: 'Registrar/Aprovar Garantias' },
  { id: 'garantia_consultar', label: 'Consultar Garantias' },
  { id: 'configuracoes_usuarios', label: 'Gerenciar Usuários (Convencionais)' },
  { id: 'configuracoes_loja', label: 'Configurações da Loja' },
  { id: 'painel_mestre', label: 'Acesso a Auditoria' },
];

export default function MasterUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cargoFilter, setCargoFilter] = useState('ALL');

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/master/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setTempPassword(null);
    if (user.isNew) {
      setEditForm({ name: '', email: '', cargo: 'OPERADOR', isActive: true });
      setEditPermissions({});
    } else {
      setEditForm({
        name: user.name,
        email: user.email,
        cargo: user.cargo,
        isActive: user.isActive,
      });
      setEditPermissions(user.permissoes ? { ...user.permissoes } : {});
    }
  };

  const togglePermission = (permId: string) => {
    setEditPermissions((prev) => ({
      ...prev,
      [permId]: !prev[permId]
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const payload = {
        id: selectedUser.id,
        name: editForm.name,
        email: editForm.email,
        cargo: editForm.cargo,
        isActive: editForm.isActive,
        permissoes: editPermissions,
      };

      const isNew = selectedUser.isNew;
      const res = await fetch('/api/master/users', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      
      const data = await res.json();

      toast.success(isNew ? 'Usuário criado com sucesso' : 'Usuário atualizado com sucesso');
      fetchData();
      
      if (isNew) {
        setTempPassword(data.temporaryPassword);
        setSelectedUser(data.user);
      } else {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...payload } : u));
        setSelectedUser({ ...selectedUser, ...payload });
      }

    } catch {
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!confirm(`Tem certeza que deseja resetar a senha de ${selectedUser.name}? Isso revogará o acesso atual imediatamente.`)) return;
    
    setIsResetting(true);
    setTempPassword(null);
    try {
      const res = await fetch(`/api/master/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setTempPassword(data.temporaryPassword);
      toast.success('Senha resetada com sucesso');
    } catch {
      toast.error('Erro ao resetar senha');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCargo = cargoFilter === 'ALL' || u.cargo === cargoFilter;
    return matchesSearch && matchesCargo;
  });

  if (isLoading) return <div className="p-8 text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Carregando...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row gap-6 p-4">
      {/* LEFT COLUMN: Lista de Usuários (25%) */}
      <div className="flex flex-col w-full lg:w-1/4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full">
        <div className="p-4 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Usuários
            </h2>
            <button 
              onClick={() => handleSelectUser({ isNew: true })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg transition-colors"
              title="Novo Usuário"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 text-xs">
            {['ALL', 'OPERADOR', 'TECNICO', 'SUPERADMIN'].map((c) => (
              <button
                key={c}
                onClick={() => setCargoFilter(c)}
                className={`px-3 py-1 rounded-full border transition-colors ${
                  cargoFilter === c 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' 
                    : 'border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {c === 'ALL' ? 'Todos' : c}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-500 text-sm p-4">Nenhum usuário encontrado</p>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                  selectedUser?.id === user.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    user.cargo === 'SUPERADMIN' ? 'bg-amber-500/20 text-amber-400' :
                    user.cargo === 'TECNICO' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {user.cargo}
                  </span>
                  {!user.isActive && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Inativo</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CENTER & RIGHT CONTENT */}
      {selectedUser ? (
        <div className="flex flex-1 gap-6 h-full">
          
          {/* CENTER COLUMN: Dados (50% do total, aprox 66% deste flex restante) */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              Dados do Usuário
            </h2>
            
            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cargo no Sistema</label>
                <select
                  value={editForm.cargo}
                  onChange={(e) => setEditForm({ ...editForm, cargo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="OPERADOR">OPERADOR (Acesso Restrito)</option>
                  <option value="TECNICO">TÉCNICO (Manutenções e Orçamentos)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Acesso Total)</option>
                </select>
                {editForm.cargo === 'SUPERADMIN' && (
                  <p className="mt-2 text-xs text-amber-400 bg-amber-400/10 p-2 rounded border border-amber-400/20">
                    O cargo SuperADMIN ignora as regras de permissões abaixo.
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-200">Status da Conta</div>
                    <div className="text-xs text-slate-500">Bloqueia ou libera o acesso ao sistema</div>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                {tempPassword && (
                  <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-xs text-emerald-400 font-medium mb-1">Nova senha temporária gerada:</p>
                    <p className="text-lg font-mono text-emerald-300 select-all">{tempPassword}</p>
                    <p className="text-xs text-slate-400 mt-2">Copie e envie ao usuário. Ele poderá acessar o sistema com esta senha.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Permissões (25% do total, aprox 33% deste flex restante) */}
          <div className="w-full lg:w-[320px] xl:w-[400px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Permissões (PBAC)
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configuração granular de acessos</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isOn = !!editPermissions[perm.id];
                const isDisabled = editForm.cargo === 'SUPERADMIN';
                
                return (
                  <button
                    key={perm.id}
                    onClick={() => !isDisabled && togglePermission(perm.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900' :
                      isOn ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={`text-sm ${isOn && !isDisabled ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {perm.label}
                    </span>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isOn ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800/50 rounded-xl border-dashed">
          <Users className="w-16 h-16 text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-400">Nenhum usuário selecionado</h3>
          <p className="text-sm text-slate-500">Selecione um usuário na lista ao lado para gerenciar.</p>
        </div>
      )}
    </div>
  );
}
