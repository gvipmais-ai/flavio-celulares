'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, Save, X } from 'lucide-react';

interface RoleEditorProps {
  roleId: string | null;
  onClose: () => void;
}

export function RoleEditor({ roleId, onClose }: RoleEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [schema, setSchema] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Carrega o schema de permissões base
      const schemaRes = await fetch('/api/permissions/modules');
      const schemaData = await schemaRes.json();
      setSchema(schemaData.data);
      
      if (roleId) {
        // Modo edição
        const roleRes = await fetch(`/api/roles/${roleId}`);
        const roleData = await roleRes.json();
        
        if (roleData.data) {
          setName(roleData.data.name);
          setDescription(roleData.data.description || '');
          const permsJson = JSON.parse(roleData.data.permissions || '{"modulos":{}}');
          setPermissions(permsJson.modulos || {});
        }
      } else {
        // Modo criação
        setName('');
        setDescription('');
        // Inicializa as permissões com base no schema (tudo falso)
        setPermissions(JSON.parse(JSON.stringify(schemaData.data)));
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados do cargo');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = (moduleName: string, checked: boolean) => {
    setPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[moduleName]) newPerms[moduleName] = {};
      
      Object.keys(schema?.[moduleName] || {}).forEach((action) => {
        newPerms[moduleName]![action] = checked;
      });
      return newPerms;
    });
  };

  const handleToggleAction = (moduleName: string, actionName: string, checked: boolean) => {
    setPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[moduleName]) newPerms[moduleName] = {};
      newPerms[moduleName]![actionName] = checked;
      return newPerms;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = roleId ? 'PUT' : 'POST';
      const url = roleId ? `/api/roles/${roleId}` : '/api/roles';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Erro ao salvar cargo');
      
      toast.success(roleId ? 'Cargo atualizado com sucesso' : 'Cargo criado com sucesso');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Nomes amigáveis para exibir na UI
  const moduleNames: Record<string, string> = {
    caixa: 'Frente de Caixa (PDV)',
    estoque: 'Estoque e Produtos',
    checklist: 'Checklist e Orçamentos',
    ordensServico: 'Ordens de Serviço',
    relatorios: 'Relatórios',
    clientes: 'Clientes',
    fornecedores: 'Fornecedores',
    configuracoes: 'Configurações',
    gerenciamentoCargos: 'Cargos e Permissões',
    usuarios: 'Usuários'
  };

  const actionNames: Record<string, string> = {
    visualizar: 'Visualizar / Acessar',
    criarVenda: 'Criar Vendas',
    finalizarVenda: 'Finalizar Vendas',
    cancelarVenda: 'Cancelar Vendas',
    abrirFecharCaixa: 'Abrir/Fechar Caixa',
    sangriaSuprimento: 'Sangria/Suprimento',
    reimprimirRecibo: 'Reimprimir Recibos',
    editar: 'Editar / Modificar',
    cadastrarProduto: 'Cadastrar Produtos',
    excluirProduto: 'Excluir / Desativar Produtos',
    gerarEtiquetas: 'Gerar Etiquetas',
    ajustarEstoque: 'Ajuste Manual de Estoque',
    verCusto: 'Ver Preço de Custo',
    criar: 'Criar Novos',
    gerarOrcamento: 'Gerar Orçamentos',
    cadastrar: 'Cadastrar',
    exportar: 'Exportar Dados'
  };

  if (loading) {
    return <div className="text-slate-400 p-4 text-center">Carregando permissões...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          {roleId ? 'Editar Cargo' : 'Criar Novo Cargo'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Nome do Cargo *</label>
          <input
            required
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Vendedor Sênior"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Descrição</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que este cargo pode fazer?"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
          <Shield className="h-4 w-4 text-blue-400" />
          Permissões Granulares
        </h3>
        
        <div className="space-y-6">
          {Object.entries(schema).map(([modName, modActions]) => {
            const actions = Object.keys(modActions);
            const isAllChecked = actions.every((action) => permissions[modName]?.[action]);
            const isSomeChecked = actions.some((action) => permissions[modName]?.[action]);
            const modFriendlyName = moduleNames[modName] || modName;

            return (
              <div key={modName} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-3 flex items-center gap-3 border-b border-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                    checked={isAllChecked}
                    ref={(input) => {
                      if (input) input.indeterminate = !isAllChecked && isSomeChecked;
                    }}
                    onChange={(e) => handleToggleModule(modName, e.target.checked)}
                  />
                  <h4 className="font-medium text-white">{modFriendlyName}</h4>
                </div>
                
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {actions.map((action) => {
                    const actionFriendlyName = actionNames[action] || action;
                    const isChecked = permissions[modName]?.[action] || false;
                    return (
                      <label key={`${modName}-${action}`} className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 group-hover:border-blue-400 transition-colors"
                          checked={isChecked}
                          onChange={(e) => handleToggleAction(modName, action, e.target.checked)}
                        />
                        <span className={`text-sm ${isChecked ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-300'} transition-colors`}>
                          {actionFriendlyName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Cargo</>}
        </button>
      </div>
    </form>
  );
}
