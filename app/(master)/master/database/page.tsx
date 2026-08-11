'use client';

import { useState } from 'react';
import { Database, AlertTriangle, Download, Upload, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterDatabasePage() {
  const [resetConfirm, setResetConfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleReset = async () => {
    if (resetConfirm !== 'CONFIRMAR-RESET') {
      toast.error('Palavra-chave incorreta.');
      return;
    }

    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados do sistema permanentemente. Você tem certeza absoluta?')) return;

    setIsResetting(true);
    try {
      const res = await fetch('/api/master/database/reset', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao resetar banco');
        return;
      }

      toast.success('Banco de dados resetado com sucesso!');
      setResetConfirm('');
    } catch {
      toast.error('Erro de conexão ao resetar');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/master/database/backup');
      if (!res.ok) throw new Error('Falha no backup');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_flavio_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast.success('Backup gerado e baixado!');
    } catch {
      toast.error('Erro ao gerar backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-slate-400" />
          Gerenciamento de Banco de Dados
        </h1>
        <p className="text-slate-400 mt-1">
          Backups, limpezas estruturais e restaurações. Operações irreversíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-950 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Backup Manual (JSON)</h2>
              <p className="text-xs text-slate-400">Gera um dump parcial de dados críticos</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-6">
            Exporta produtos, categorias, marcas, usuários e notas de entrada para um arquivo JSON estruturado.
          </p>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="btn-primary w-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
          >
            {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Fazer Download do Backup
          </button>
        </div>

        {/* Restore Card (Visual only for now as requested by scope limits) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-emerald-950 rounded-full flex items-center justify-center">
              <Upload className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Restaurar Backup</h2>
              <p className="text-xs text-emerald-400">Em Breve / Futuro</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-6">
            Restaura o banco de dados a partir de um JSON gerado previamente.
          </p>
          <button disabled className="btn-secondary w-full cursor-not-allowed flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" /> Importar JSON
          </button>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="mt-12 bg-red-950/20 border border-red-900/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-xl font-bold">Zona de Perigo Extremo</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            A função de <strong>Reset Total</strong> apagará TODAS as tabelas do sistema (vendas, orçamentos, produtos, estoque, configurações),
            mantendo apenas os logs mestre e os tokens de acesso. Esta operação <strong>NÃO</strong> pode ser desfeita.
          </p>
          
          <div className="bg-slate-900/50 p-4 rounded-lg border border-red-900/30">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Para liberar o botão de reset, digite exatamente: <strong className="text-red-400 select-none">CONFIRMAR-RESET</strong>
            </label>
            <input
              type="text"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="Digite CONFIRMAR-RESET"
              className="input w-full md:w-1/2 border-red-900/50 focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting || resetConfirm !== 'CONFIRMAR-RESET'}
            className="btn-primary bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Resetar e Limpar Sistema Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}
