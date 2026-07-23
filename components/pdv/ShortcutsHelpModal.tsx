'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F2', desc: 'Focar na busca de produtos' },
    { key: 'F5', desc: 'Limpar carrinho (com confirmação)' },
    { key: 'F6', desc: 'Identificar cliente (Nome / CPF)' },
    { key: 'F7', desc: 'Aplicar desconto geral' },
    { key: 'F8', desc: 'Ir para Formas de Pagamento' },
    { key: 'F10', desc: 'Finalizar Venda' },
    { key: 'F11', desc: 'Abrir Opções de Caixa (Abertura/Fechamento)' },
    { key: 'ESC', desc: 'Fechar modais abertos' },
    { key: 'ENTER', desc: 'Confirmar ações' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Keyboard className="w-5 h-5 text-primary-500" /> Atalhos de Teclado
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left">
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-slate-700/50 last:border-0">
                  <td className="py-3 px-2 w-24">
                    <kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-[var(--text-primary)] shadow-sm">
                      {s.key}
                    </kbd>
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-300">
                    {s.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="w-full btn-secondary py-3 font-bold">
            Entendi
          </button>
        </div>

      </div>
    </div>
  );
}
