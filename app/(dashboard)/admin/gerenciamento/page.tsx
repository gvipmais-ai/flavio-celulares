'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Users, Database, FileText, Download, Upload,
  AlertTriangle, Save, Loader2, CheckCircle2, Search, Filter,
  UserCheck, UserX, Key, Activity, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'USERS' | 'MODULES' | 'AUDIT' | 'BACKUP';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('USERS');

  // States for Users
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // States for Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // States for Modules
  const [enabledModules, setEnabledModules] = useState<{ [key: string]: boolean }>({
    'PDV (Frente de Caixa)': true,
    'Estoque & Produtos': true,
    'Ordens de Serviço & Checklist': true,
    'Clientes & CRM': true,
    'Garantias & Devoluções': true,
    'Relatórios Financeiros': true,
    'Impressão de Etiquetas': true,
  });

  // States for Backup
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (activeTab === 'USERS') fetchUsers();
    if (activeTab === 'AUDIT') fetchLogs();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/roles')
      ]);
      const jsonUsers = await resUsers.json();
      const jsonRoles = await resRoles.json();
      if (resUsers.ok) setUsers(jsonUsers.data || []);
      if (resRoles.ok) setRoles(jsonRoles.data || []);
    } catch {
      toast.error('Erro ao carregar usuários e cargos');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs');
      const json = await res.json();
      if (res.ok) setLogs(json.data || []);
    } catch {
      toast.error('Erro ao carregar auditoria');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Erro desconhecido');
      toast.success('Usuário atualizado com sucesso');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar usuário');
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flavio_celulares_backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Backup exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleModule = (moduleName: string) => {
    setEnabledModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
    toast.success(`Visibilidade de "${moduleName}" atualizada`);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !userSearch.trim() ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = selectedRoleFilter === 'ALL' || u.roleId === selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearch, selectedRoleFilter]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (!logSearch.trim()) return true;
      const q = logSearch.toLowerCase();
      return (
        l.action?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.user?.name?.toLowerCase().includes(q)
      );
    });
  }, [logs, logSearch]);

  const activeUsersCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Painel de Gerenciamento & Administração
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Controle central de permissões, visibilidade de módulos e integridade de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Banco Operacional 100%
          </span>
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Backup Rápido</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI CARDS (RESUMO EM TEMPO REAL) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Usuários Ativos */}
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Usuários Cadastrados</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{users.length}</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{activeUsersCount} ativos no sistema</span>
          </div>
        </div>

        {/* Card 2: Cargos Disponíveis */}
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Cargos & Perfis</span>
            <Key className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{roles.length || 4}</div>
          <div className="text-xs text-slate-400">SuperADMIN, Gerente, Técnico, Vendedor</div>
        </div>

        {/* Card 3: Registros de Auditoria */}
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Auditoria & Logs</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{logs.length}</div>
          <div className="text-xs text-cyan-400">Atividades registradas</div>
        </div>

        {/* Card 4: Segurança do Sistema */}
        <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Segurança & Cópia</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">MySQL Cloud</div>
          <div className="text-xs text-slate-400">Flavio Celulares Oficial</div>
        </div>
      </div>

      {/* ── TAB NAVIGATION BUTTONS ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'USERS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Usuários e Permissões</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-white ml-1">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MODULES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'MODULES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Controle de Módulos</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AUDIT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Auditoria e Logs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-white ml-1">
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BACKUP'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Backup e Restauração</span>
        </button>
      </div>

      {/* ── TAB CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl min-h-[500px]">

        {/* ══════════ 1. USERS & ROLES TAB ══════════ */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Gerenciamento de Usuários do Sistema
                </h2>
                <p className="text-xs text-slate-400">
                  Defina cargos, controle bloqueios e acompanhe o status de acesso de cada operador.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou e-mail..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                  />
                </div>

                <select
                  value={selectedRoleFilter}
                  onChange={e => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Todos os Cargos</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400">Carregando usuários...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Users className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Nenhum usuário encontrado com os filtros atuais.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Colaborador / E-mail</th>
                      <th className="py-3.5 px-4">Cargo / Função</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações de Acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/30">
                    {filteredUsers.map(u => {
                      const initials = u.name ? u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 font-bold text-white flex items-center justify-center text-xs shrink-0 shadow-md">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={u.roleId || ''}
                              onChange={e => handleUpdateUser(u.id, { roleId: e.target.value })}
                              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                            >
                              <option value="" disabled>Selecione um cargo</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              {u.isActive ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                u.isActive
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/30'
                                  : 'text-emerald-400 hover:text-white hover:bg-emerald-600/20 border border-emerald-500/30'
                              }`}
                            >
                              {u.isActive ? 'Bloquear Acesso' : 'Desbloquear'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════ 2. MODULES CONTROL TAB ══════════ */}
        {activeTab === 'MODULES' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                Controle de Módulos e Visibilidade Lateral
              </h2>
              <p className="text-xs text-slate-400">
                Ative ou desative seções inteiras do menu lateral do sistema conforme as necessidades operacionais da loja.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(enabledModules).map(([modName, isEnabled]) => (
                <div
                  key={modName}
                  onClick={() => toggleModule(modName)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    isEnabled
                      ? 'border-indigo-500/50 bg-gradient-to-b from-slate-900 to-indigo-950/20 shadow-md'
                      : 'border-white/5 bg-slate-950/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{modName}</span>
                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                    }`}>
                      <div className="bg-white w-4 h-4 rounded-full shadow-md transition-transform" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {isEnabled ? 'Visível no menu de navegação' : 'Oculto para todos os operadores'}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>As alterações de visibilidade passam a valer instantaneamente em toda a aplicação.</span>
            </div>
          </div>
        )}

        {/* ══════════ 3. AUDIT & LOGS TAB ══════════ */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  Auditoria e Histórico de Logs
                </h2>
                <p className="text-xs text-slate-400">
                  Registro imutável de todas as ações sensíveis realizadas no sistema (criações, edições, vendas e alterações).
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar logs..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            {isLoadingLogs ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-400">Carregando logs de auditoria...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <FileText className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">Nenhum evento registrado até o momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Data / Horário</th>
                      <th className="py-3 px-4">Tipo de Ação</th>
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Descrição da Atividade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/30">
                    {filteredLogs.map(log => {
                      const actionColor =
                        log.action?.includes('CREATE') || log.action?.includes('CRIACAO')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : log.action?.includes('DELETE') || log.action?.includes('EXCLUSAO')
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : log.action?.includes('UPDATE') || log.action?.includes('EDICAO')
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30';

                      return (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${actionColor}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {log.user?.name || 'Sistema / Cron'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {log.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════ 4. BACKUP & DATABASE TAB ══════════ */}
        {activeTab === 'BACKUP' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" />
                Segurança, Backups & Manutenção de Dados
              </h2>
              <p className="text-xs text-slate-400">
                Gere cópias de segurança integrais de produtos, clientes, ordens de serviço e movimentações do caixa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Card */}
              <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 to-indigo-950/30 space-y-4 shadow-xl">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Download className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportação Completa (Backup Seguro)</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Baixe um arquivo JSON criptograficamente estruturado contendo todas as tabelas e dados operacionais da Flavio Celulares.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs text-slate-400">
                  <div><strong>Formato:</strong> JSON estruturado UTF-8</div>
                  <div><strong>Conteúdo:</strong> Produtos, Vendas, Clientes, Ordens de Serviço</div>
                </div>

                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="btn-shimmer w-full py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>{isExporting ? 'Gerando Cópia de Segurança...' : 'Baixar Backup Completo (.json)'}</span>
                </button>
              </div>

              {/* Recovery & Health Card */}
              <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Status & Integridade do Banco</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    O banco de dados da Flavio Celulares conta com migrações gerenciadas pelo Prisma ORM e integridade referencial ativa.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">Conexão do Banco:</span>
                    <strong className="text-emerald-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Ativa & Segura
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">Pool de Conexões:</span>
                    <strong className="text-slate-200">Hostinger Cloud MySQL</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Para restaurações de emergência de arquivos antigos, contate o administrador técnico do sistema.</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
