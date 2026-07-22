'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Database, FileText, Download, Upload, AlertTriangle, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'USERS' | 'MODULES' | 'BACKUP' | 'AUDIT';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  
  // States for Users
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // States for Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // States for Backup
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (activeTab === 'USERS') fetchUsers();
    if (activeTab === 'AUDIT') fetchLogs();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (res.ok) setUsers(json.data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/logs');
      const json = await res.json();
      if (res.ok) setLogs(json.data);
    } catch {
      toast.error('Erro ao carregar auditoria');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/users/\${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      toast.success('Usuário atualizado com sucesso');
      fetchUsers();
    } catch {
      toast.error('Erro ao atualizar usuário');
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
      a.download = `flavio_celulares_backup_\${format(new Date(), 'yyyy-MM-dd')}.json`;
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Gerenciamento Geral (SuperADMIN)
        </h1>
        <p className="text-sm text-muted">Controle absoluto de acessos, configurações e dados do sistema.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors \${
              activeTab === 'USERS' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-card-hover hover:text-heading'
            }`}
          >
            <Users className="h-4 w-4" /> Usuários e Permissões
          </button>
          
          <button
            onClick={() => setActiveTab('MODULES')}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors \${
              activeTab === 'MODULES' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-card-hover hover:text-heading'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" /> Controle de Módulos
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors \${
              activeTab === 'AUDIT' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-card-hover hover:text-heading'
            }`}
          >
            <FileText className="h-4 w-4" /> Auditoria e Logs
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors \${
              activeTab === 'BACKUP' ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-card-hover hover:text-heading'
            }`}
          >
            <Database className="h-4 w-4" /> Backup e Restauração
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 card card-body min-h-[500px]">
          {activeTab === 'USERS' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-heading border-b border-theme pb-2">Usuários e Permissões</h2>
              
              {isLoadingUsers ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
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
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="font-medium">{u.name}</td>
                          <td className="text-muted">{u.email}</td>
                          <td>
                            <select 
                              className="input text-sm py-1 h-8 w-32"
                              value={u.role}
                              onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                            >
                              <option value="OPERADOR_CAIXA">Caixa</option>
                              <option value="TECNICO">Técnico</option>
                              <option value="SUPERADMIN">SuperAdmin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge \${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {u.isActive ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </td>
                          <td className="text-right">
                            <button 
                              onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                              className="btn-ghost text-xs"
                            >
                              {u.isActive ? 'Bloquear' : 'Desbloquear'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MODULES' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-heading border-b border-theme pb-2">Controle de Módulos (Visibilidade)</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {['PDV (Caixa)', 'Estoque', 'Ordens de Serviço', 'CRM Clientes', 'Devoluções e Garantia', 'Relatórios', 'Etiquetas'].map((mod) => (
                  <label key={mod} className="flex items-center gap-3 p-4 border border-theme rounded-lg hover:bg-card-hover cursor-pointer">
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <div>
                      <p className="font-medium text-heading">{mod}</p>
                      <p className="text-xs text-muted">Exibir este módulo no menu lateral</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn-primary"><Save className="h-4 w-4"/> Salvar Alterações</button>
              </div>
            </div>
          )}

          {activeTab === 'AUDIT' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-heading border-b border-theme pb-2">Auditoria e Logs de Sistema</h2>
              
              {isLoadingLogs ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Data/Hora</th>
                        <th>Ação</th>
                        <th>Usuário</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td className="whitespace-nowrap text-xs">
                            {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </td>
                          <td><span className="badge badge-neutral">{log.action}</span></td>
                          <td className="font-medium text-xs">{log.user?.name || 'Sistema'}</td>
                          <td className="text-xs text-muted">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'BACKUP' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-heading border-b border-theme pb-2">Backup e Restauração</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card p-5 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Download className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading">Exportar Dados (Backup)</h3>
                    <p className="text-sm text-muted mt-1">Baixe um arquivo JSON contendo todo o banco de dados (produtos, vendas, clientes, etc). Ideal para manter cópias de segurança.</p>
                  </div>
                  <button 
                    className="btn-primary w-full"
                    onClick={handleExportBackup}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {isExporting ? 'Exportando...' : 'Gerar Backup (.json)'}
                  </button>
                </div>

                <div className="card p-5 space-y-4 border-danger/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <Upload className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading">Restaurar Banco (Perigoso)</h3>
                    <p className="text-sm text-muted mt-1">
                      <AlertTriangle className="inline h-3 w-3 text-warning mr-1"/>
                      Esta ação apaga o banco atual e o substitui pelo arquivo enviado. Apenas para ambiente local ou emergência extrema.
                    </p>
                  </div>
                  <button className="btn-danger w-full" onClick={() => toast.info('Restauração via UI desabilitada por segurança na Vercel.')}>
                    <Upload className="h-4 w-4" /> Restaurar Backup
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
