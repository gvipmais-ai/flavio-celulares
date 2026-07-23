'use client';

import React, { useState } from 'react';
import { usePDV } from './PDVContext';
import { Lock, LockOpen, ArrowRight, ArrowDown, ArrowUp, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashDrawerModal({ isOpen, onClose }: CashDrawerModalProps) {
  const { cashSession, reloadSession, clearCart } = usePDV();
  const [activeTab, setActiveTab] = useState<'ABERTURA' | 'FECHAMENTO' | 'SANGRIA' | 'SUPRIMENTO'>('FECHAMENTO');
  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closureReport, setClosureReport] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (overrideTab?: 'ABERTURA' | 'FECHAMENTO' | 'SANGRIA' | 'SUPRIMENTO') => {
    const tabToSubmit = overrideTab || activeTab;
    const amount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      if (tabToSubmit !== 'FECHAMENTO' || isNaN(amount)) {
         toast.error('Informe um valor válido.');
         return;
      }
    }

    setIsSubmitting(true);
    try {
      if (tabToSubmit === 'ABERTURA') {
        const res = await fetch('/api/cash-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openingAmount: amount }),
        });
        if (!res.ok) throw new Error((await res.json()).error?.message);
        toast.success('Caixa aberto!');
        await reloadSession();
        onClose();
        
      } else if (tabToSubmit === 'SANGRIA' || tabToSubmit === 'SUPRIMENTO') {
        if (!reasonInput || reasonInput.length < 5) throw new Error('Justificativa é obrigatória (mín. 5 char).');
        const res = await fetch(`/api/cash-sessions/${cashSession.id}/movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: tabToSubmit, amount, reason: reasonInput }),
        });
        if (!res.ok) throw new Error((await res.json()).error?.message);
        toast.success(`${tabToSubmit} realizada com sucesso.`);
        await reloadSession();
        setAmountInput('');
        setReasonInput('');
        
      } else if (tabToSubmit === 'FECHAMENTO') {
        const res = await fetch(`/api/cash-sessions/${cashSession.id}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ informedAmount: amount, notes: reasonInput }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message);
        toast.success('Caixa fechado!');
        setClosureReport(data.cashSession);
        clearCart();
        await reloadSession();
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printClosure = () => {
    // Basic thermal print for closure
    const win = window.open();
    if (win) {
      win.document.write(`
        <pre style="font-family: monospace; font-size: 12px;">
          FECHAMENTO DE CAIXA
          Sessão: ${closureReport.id}
          Fechado em: ${new Date(closureReport.closedAt).toLocaleString()}
          --------------------------------
          Abertura: ${formatCurrency(Number(closureReport.openingAmount))}
          Dinheiro Informado: ${formatCurrency(Number(closureReport.informedAmount))}
          Diferença: ${formatCurrency(Number(closureReport.difference))}
          --------------------------------
          Assinatura: ___________________
        </pre>
      `);
      win.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Lock className="w-5 h-5 text-slate-500" /> Operações de Caixa
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {closureReport ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-[var(--text-primary)]">Turno Encerrado</h3>
            <p className="text-slate-500 mb-6">Sua sessão de caixa foi fechada.</p>
            
            <div className="flex gap-4">
              <button onClick={printClosure} className="flex-1 btn-secondary py-3 font-bold">Imprimir Resumo</button>
              <button onClick={onClose} className="flex-1 btn-primary py-3 font-bold">Sair</button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {!cashSession ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Abrir Caixa</h3>
                <p className="text-slate-500 text-sm mb-6">Informe o valor inicial de troco para começar a vender.</p>
                
                <div className="text-left mb-6">
                  <label className="label">Valor em Caixa (R$)</label>
                  <input 
                    type="number" step="0.01" 
                    value={amountInput} onChange={e => setAmountInput(e.target.value)}
                    className="input text-lg font-bold" placeholder="0.00"
                  />
                </div>
                
                <button onClick={() => { setActiveTab('ABERTURA'); handleSubmit('ABERTURA'); }} disabled={isSubmitting} className="w-full btn-primary py-3 font-bold flex justify-center items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LockOpen className="w-5 h-5" />} Abrir Caixa
                </button>
              </div>
            ) : (
              <div>
                <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                  {['FECHAMENTO', 'SANGRIA', 'SUPRIMENTO'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors
                        ${activeTab === tab ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">
                      {activeTab === 'FECHAMENTO' ? 'Valor Contado em Gaveta (Dinheiro R$)' : `Valor da ${activeTab} (R$)`}
                    </label>
                    <input 
                      type="number" step="0.01" 
                      value={amountInput} onChange={e => setAmountInput(e.target.value)}
                      className="input text-lg font-bold" placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="label">
                      {activeTab === 'FECHAMENTO' ? 'Observações de Fechamento (Opcional)' : 'Justificativa (Obrigatório)'}
                    </label>
                    <textarea 
                      value={reasonInput} onChange={e => setReasonInput(e.target.value)}
                      className="input min-h-[80px] resize-none" 
                      placeholder={activeTab === 'FECHAMENTO' ? 'Anotações...' : 'Por que este valor está sendo movimentado?'}
                    />
                  </div>

                  <button 
                    onClick={() => handleSubmit()} 
                    disabled={isSubmitting} 
                    className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-white shadow-md transition-all
                      ${activeTab === 'FECHAMENTO' ? 'bg-rose-500 hover:bg-rose-600' : 
                        activeTab === 'SANGRIA' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}
                    `}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                      activeTab === 'FECHAMENTO' ? <Lock className="w-5 h-5" /> : 
                      activeTab === 'SANGRIA' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />
                    }
                    Confirmar {activeTab}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
