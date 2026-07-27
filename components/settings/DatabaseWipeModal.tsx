'use client';

import React, { useState } from 'react';
import { ShieldAlert, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DatabaseWipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseWipeModal({ isOpen, onClose }: DatabaseWipeModalProps) {
  const [password, setPassword] = useState('');
  const [wipeSales, setWipeSales] = useState(false);
  const [wipeOS, setWipeOS] = useState(false);
  const [wipeCustomers, setWipeCustomers] = useState(false);
  const [wipeProducts, setWipeProducts] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleWipe = async () => {
    if (password !== '23349137') {
      toast.error('Senha incorreta! Acesso negado.');
      return;
    }

    if (!wipeSales && !wipeOS && !wipeCustomers && !wipeProducts) {
      toast.warning('Selecione pelo menos uma categoria de dados para limpar.');
      return;
    }

    if (!confirm('ATENÇÃO: Você está prestes a excluir dados permanentemente. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/system/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          wipeSales,
          wipeOS,
          wipeCustomers,
          wipeProducts
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao executar limpeza.');
      }

      toast.success('Limpeza de dados concluída com sucesso!');
      onClose();
      // Reload page to clear any cached data
      window.location.reload();
      
    } catch (err: any) {
      toast.error(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-danger/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-danger text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldAlert className="w-5 h-5" />
            Zona de Perigo: Limpeza do Sistema
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-danger/10 border border-danger/20 p-4 rounded-lg flex gap-3 text-danger">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>Atenção:</strong> Esta é uma ferramenta avançada para zerar o banco de dados antes da produção. A exclusão é irreversível!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">O que você deseja apagar?</h3>
            
            <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <input type="checkbox" className="mt-1 w-4 h-4" checked={wipeSales} onChange={(e) => setWipeSales(e.target.checked)} />
              <div>
                <div className="font-medium">Apagar Vendas e Movimentos de Caixa</div>
                <div className="text-xs text-slate-500">Exclui todo o histórico financeiro de vendas e caixas.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <input type="checkbox" className="mt-1 w-4 h-4" checked={wipeOS} onChange={(e) => setWipeOS(e.target.checked)} />
              <div>
                <div className="font-medium">Apagar Ordens de Serviço e Orçamentos</div>
                <div className="text-xs text-slate-500">Exclui todo o histórico de assistência técnica.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <input type="checkbox" className="mt-1 w-4 h-4" checked={wipeCustomers} onChange={(e) => {
                setWipeCustomers(e.target.checked);
                if (e.target.checked) {
                  setWipeSales(true);
                  setWipeOS(true);
                }
              }} />
              <div>
                <div className="font-medium">Apagar Todos os Clientes</div>
                <div className="text-xs text-danger font-medium mt-1">Isso também forçará a exclusão de TODAS as Vendas e OS!</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <input type="checkbox" className="mt-1 w-4 h-4" checked={wipeProducts} onChange={(e) => {
                setWipeProducts(e.target.checked);
                if (e.target.checked) {
                  setWipeSales(true);
                  setWipeOS(true);
                }
              }} />
              <div>
                <div className="font-medium">Apagar Todos os Produtos e Categorias</div>
                <div className="text-xs text-danger font-medium mt-1">Isso também forçará a exclusão de TODAS as Vendas e OS!</div>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha de Autorização</label>
            <input
              type="password"
              placeholder="Digite a senha de limpeza..."
              className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-danger"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleWipe}
            disabled={isSubmitting || password.length === 0}
            className="px-4 py-2 font-bold text-white bg-danger hover:bg-danger-hover rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                EXECUTAR LIMPEZA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
