'use client';

import React from 'react';
import { usePDV } from './PDVContext';
import { Trash2, Minus, Plus, ShoppingCart, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export function CartTable() {
  const { cart, updateQuantity, removeFromCart, updateDiscount } = usePDV();

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center m-4 opacity-60">
        <p className="text-2xl font-black text-slate-300 dark:text-slate-600">CAIXA LIVRE</p>
        <p className="text-sm font-bold text-slate-400 mt-2">Bipe ou busque um produto para iniciar a venda.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 m-4 shadow-sm">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 w-16">Item</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Descrição</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center w-32">Qtd</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right w-28">Unitário</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right w-24">Desc.</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right w-28">Subtotal</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {cart.map((item, index) => {
              const subtotal = (item.quantity * item.unitPrice) - item.discount;
              
              return (
                <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-4 py-4 text-sm font-medium text-slate-400">
                    {String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-[var(--text-primary)]">{item.name}</div>
                    <div className="text-xs text-slate-500">Cód: {item.code}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-600 hover:text-rose-500 shadow-sm"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input 
                        type="number"
                        className="w-12 text-center bg-transparent border-none focus:ring-0 text-sm font-bold p-0"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) updateQuantity(item.productId, val);
                        }}
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-600 hover:text-emerald-500 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative group/desc inline-block">
                      {item.discount > 0 ? (
                        <span className="text-rose-500 font-bold text-sm cursor-pointer border-b border-dashed border-rose-500" onClick={() => {
                          const val = prompt('Informe o novo valor de desconto em R$ para este item:', item.discount.toString());
                          if (val !== null) updateDiscount(item.productId, parseFloat(val.replace(',','.')) || 0);
                        }}>
                          - {formatCurrency(item.discount)}
                        </span>
                      ) : (
                        <button 
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-opacity"
                          onClick={() => {
                            const val = prompt('Informe o valor de desconto em R$ para este item:');
                            if (val !== null) updateDiscount(item.productId, parseFloat(val.replace(',','.')) || 0);
                          }}
                          title="Aplicar desconto neste item"
                        >
                          <Percent className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-[var(--text-primary)] text-base">
                    {formatCurrency(subtotal)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          if (confirm(`Remover todos os ${item.quantity} itens?`)) {
                            removeFromCart(item.productId);
                          }
                        } else {
                          removeFromCart(item.productId);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Remover Item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center shrink-0">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Itens: <span className="text-primary-500 text-lg">{cart.length}</span></span>
        <button 
          onClick={() => {
            if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
              // clear via context is done directly on hook
            }
          }}
          className="text-xs text-rose-500 hover:underline font-bold"
        >
          Limpar Carrinho (F5)
        </button>
      </div>
    </div>
  );
}
