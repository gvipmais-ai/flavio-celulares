'use client';

import React, { useState, useEffect } from 'react';
import { usePDV } from './PDVContext';
import { formatCurrency } from '@/lib/formatters';
import { User, Wallet, Percent, ChevronRight, X, DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { toast } from 'sonner';

export function OrderSummary({ onCheckout }: { onCheckout: () => void }) {
  const { 
    cart, 
    customerName, setCustomerName, 
    customerCpf, setCustomerCpf,
    payments, addPayment, removePayment,
    grossTotal, totalDiscount, netTotal, totalPaid, change, remainingToPay,
    generalDiscount, setGeneralDiscount,
    registerShortcut
  } = usePDV();

  const [paymentMethodSelect, setPaymentMethodSelect] = useState('DINHEIRO');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  useEffect(() => {
    setPaymentAmountInput(remainingToPay.toFixed(2));
  }, [remainingToPay]);

  // Keyboard Shortcuts
  useEffect(() => {
    registerShortcut('F6', () => document.getElementById('customer-name-input')?.focus());
    registerShortcut('F8', () => document.getElementById('payment-method-select')?.focus());
    registerShortcut('F10', () => {
      if (cart.length > 0) onCheckout();
    });
  }, [registerShortcut, cart.length, onCheckout]);

  const handleApplyGeneralDiscount = () => {
    const parsed = parseFloat(discountInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed > grossTotal) {
        toast.error('Desconto não pode ser maior que o subtotal bruto.');
        return;
      }
      setGeneralDiscount(parsed);
      setShowDiscountInput(false);
      setDiscountInput('');
    } else {
      toast.error('Valor de desconto inválido.');
    }
  };

  const isReadyToCheckout = cart.length > 0 && remainingToPay === 0 && customerName.length > 2;

  const paymentButtons = [
    { method: 'DINHEIRO', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
    { method: 'PIX', label: 'Pix', icon: Smartphone, color: 'text-teal-500 bg-teal-50 hover:bg-teal-100 border-teal-200' },
    { method: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { method: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard, color: 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  ];

  return (
    <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20">
      
      {/* Customer Area */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-5 w-5 text-primary-500" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">Dados do Cliente</h2>
        </div>
        <div className="space-y-3">
          <input 
            id="customer-name-input"
            type="text" 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Nome (Obrigatório, F6)"
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500"
          />
          <input 
            type="text" 
            value={customerCpf}
            onChange={e => setCustomerCpf(e.target.value)}
            placeholder="CPF/CNPJ (Opcional)"
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Math Area */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">Subtotal Bruto</span>
          <span className="font-bold text-lg">{formatCurrency(grossTotal)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2 group">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-rose-500 font-bold">Descontos</span>
                <button 
                  onClick={() => setShowDiscountInput(!showDiscountInput)}
                  className="p-1 px-2 bg-rose-100 text-rose-600 rounded text-xs font-bold hover:bg-rose-200 transition-colors"
                >
                  Modificar
                </button>
              </div>
              <span className="font-bold text-rose-500">- {formatCurrency(totalDiscount)}</span>
            </div>

            {showDiscountInput && (
              <div className="flex gap-2 mt-2 p-2 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900">
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplyGeneralDiscount(); }}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700 rounded px-2 text-sm focus:ring-2 focus:ring-rose-500"
                />
                <button onClick={handleApplyGeneralDiscount} className="bg-rose-500 hover:bg-rose-600 text-white rounded px-3 text-xs font-bold">
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

        <div className="flex justify-between items-end">
          <span className="text-sm font-bold uppercase text-slate-500">Total a Pagar</span>
          <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">
            {formatCurrency(netTotal)}
          </span>
        </div>
      </div>

      {/* Payment Forms Area */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">Pagamentos</h2>
          </div>
        </div>

        {/* Quick Payment Area */}
        {remainingToPay > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Valor Recebido (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  id="payment-amount-input"
                  type="number"
                  step="0.01"
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-3 py-3 text-2xl font-black text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {paymentButtons.map(btn => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.method}
                    onClick={() => {
                      const val = parseFloat(paymentAmountInput.replace(',', '.'));
                      if (isNaN(val) || val <= 0) {
                        toast.error('Valor numérico inválido');
                        return;
                      }
                      if (btn.method !== 'DINHEIRO' && val > remainingToPay) {
                        toast.warning('Atenção: Troco apenas para dinheiro. Adicionado o valor restante exato.');
                        addPayment(btn.method, remainingToPay);
                      } else {
                        addPayment(btn.method, val);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border ${btn.color} opacity-80 hover:opacity-100 transition-all hover:scale-105 active:scale-95 shadow-sm`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold uppercase">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Payments List */}
        {payments.length > 0 && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{p.method.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(p.amount)}</span>
                  <button onClick={() => removePayment(i)} className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Payment Summary */}
            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Recebido:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(totalPaid)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between text-sm bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mt-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400">TROCO:</span>
                  <span className="font-black text-amber-700 dark:text-amber-400">{formatCurrency(change)}</span>
                </div>
              )}
              {remainingToPay > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="font-bold text-rose-500">Falta Receber:</span>
                  <span className="font-black text-rose-500">{formatCurrency(remainingToPay)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Button Footer */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button 
          onClick={() => {
            if (isReadyToCheckout) onCheckout();
            else toast.error('Conclua os pagamentos e identifique o cliente antes de finalizar.');
          }}
          disabled={!isReadyToCheckout}
          className={`w-full h-16 rounded-xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-lg
            ${isReadyToCheckout 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-95' 
              : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
        >
          {isReadyToCheckout ? 'FINALIZAR VENDA (F10)' : 'AGUARDANDO PAGAMENTO'}
          {isReadyToCheckout && <ChevronRight className="w-6 h-6" />}
        </button>
      </div>

    </div>
  );
}
