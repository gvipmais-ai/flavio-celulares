'use client';

import React, { useState, useEffect } from 'react';
import { usePDV } from './PDVContext';
import { formatCurrency } from '@/lib/formatters';
import { User, Wallet, Percent, ChevronRight, X } from 'lucide-react';
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

  const handleAddPayment = () => {
    const val = parseFloat(paymentAmountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Valor de pagamento inválido');
      return;
    }
    
    // Warn if giving too much for non-cash (we can't give change for credit card)
    if (paymentMethodSelect !== 'DINHEIRO' && val > remainingToPay) {
      toast.warning('Atenção: Não é possível dar troco em métodos que não sejam dinheiro. Limitando ao restante.');
      addPayment(paymentMethodSelect, remainingToPay);
    } else {
      addPayment(paymentMethodSelect, val);
    }
  };

  const handleApplyGeneralDiscount = () => {
    const val = prompt('Informe o valor do desconto GERAL em R$:', generalDiscount.toString());
    if (val !== null) {
      const parsed = parseFloat(val.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0) {
        if (parsed > grossTotal) {
          toast.error('Desconto não pode ser maior que o subtotal bruto.');
          return;
        }
        setGeneralDiscount(parsed);
      }
    }
  };

  const isReadyToCheckout = cart.length > 0 && remainingToPay === 0 && customerName.length > 2;

  return (
    <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20">
      
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
          <span className="font-bold">{formatCurrency(grossTotal)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2 group">
          <div className="flex items-center gap-1">
            <span className="text-sm text-rose-500">Descontos</span>
            <button 
              onClick={handleApplyGeneralDiscount}
              className="opacity-0 group-hover:opacity-100 p-1 bg-rose-100 text-rose-600 rounded"
              title="Desconto Geral (F7)"
            >
              <Percent className="h-3 w-3" />
            </button>
          </div>
          <span className="font-bold text-rose-500">- {formatCurrency(totalDiscount)}</span>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

        <div className="flex justify-between items-end">
          <span className="text-sm font-bold uppercase text-slate-500">Total a Pagar</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
            {formatCurrency(netTotal)}
          </span>
        </div>
      </div>

      {/* Payment Forms Area */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-5 w-5 text-blue-500" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">Pagamentos (F8)</h2>
        </div>

        {/* Selected Payments List */}
        {payments.length > 0 && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{p.method.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(p.amount)}</span>
                  <button onClick={() => removePayment(i)} className="text-slate-400 hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Payment Summary */}
            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Recebido:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalPaid)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between text-xs bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded">
                  <span className="font-bold text-amber-700 dark:text-amber-400">TROCO A DEVOLVER:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(change)}</span>
                </div>
              )}
              {remainingToPay > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-rose-500">Falta Receber:</span>
                  <span className="font-bold text-rose-500">{formatCurrency(remainingToPay)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Payment Form */}
        {remainingToPay > 0 && (
          <div className="flex flex-col gap-2">
            <select 
              id="payment-method-select"
              value={paymentMethodSelect}
              onChange={e => setPaymentMethodSelect(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary-500"
            >
              <option value="DINHEIRO">Dinheiro (Permite Troco)</option>
              <option value="PIX">Pix</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="TRANSFERENCIA">Transferência / TED</option>
              <option value="OUTRO">Outro / Fiado</option>
            </select>
            
            <div className="flex gap-2">
              <input 
                type="number"
                step="0.01"
                value={paymentAmountInput}
                onChange={e => setPaymentAmountInput(e.target.value)}
                onFocus={e => e.target.select()}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddPayment();
                }}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-lg font-bold text-center focus:ring-2 focus:ring-primary-500"
              />
              <button 
                onClick={handleAddPayment}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 font-bold flex items-center justify-center transition-colors shadow-sm"
              >
                Incluir
              </button>
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
