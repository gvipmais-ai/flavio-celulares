'use client';

import React, { useState, useEffect } from 'react';
import { PDVProvider, usePDV } from '@/components/pdv/PDVContext';
import { HeaderPDV } from '@/components/pdv/HeaderPDV';
import { ProductSearch } from '@/components/pdv/ProductSearch';
import { CartTable } from '@/components/pdv/CartTable';
import { OrderSummary } from '@/components/pdv/OrderSummary';
import { CheckoutModal } from '@/components/pdv/CheckoutModal';
import { CashDrawerModal } from '@/components/pdv/CashDrawerModal';
import { ShortcutsHelpModal } from '@/components/pdv/ShortcutsHelpModal';

// PDV Inner component wrapped in Provider
function PDVContent() {
  const { registerShortcut, clearCart, cashSession } = usePDV();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Global Shortcuts
  useEffect(() => {
    registerShortcut('F5', () => {
      if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
        clearCart();
      }
    });
    registerShortcut('F11', () => setShowDrawer(true));
    registerShortcut('F1', () => setShowHelp(true));
  }, [registerShortcut, clearCart]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-default)] overflow-hidden">
      <HeaderPDV 
        onOpenDrawerModal={() => setShowDrawer(true)} 
        onOpenHelp={() => setShowHelp(true)} 
      />

      {/* Block PDV if no cash session is open */}
      {!cashSession ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black mb-4 text-[var(--text-primary)]">Nenhum Caixa Aberto</h2>
            <p className="text-slate-500 mb-6">Para iniciar as vendas, você precisa abrir o seu caixa informando o valor de troco inicial.</p>
            <button 
              onClick={() => setShowDrawer(true)}
              className="btn-primary w-full py-4 text-lg font-bold shadow-md hover:scale-105 transition-transform"
            >
              Abrir Caixa Agora (F11)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Esquerda: 70% */}
          <div className="flex-1 flex flex-col p-4 bg-transparent relative z-10">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]">
              <img src="/images/logo-v6.png" alt="Flavio Celulares" className="w-[600px] grayscale" />
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <ProductSearch />
              <CartTable />
            </div>
          </div>

          {/* Direita: 30% */}
          <OrderSummary onCheckout={() => setShowCheckout(true)} />
        </div>
      )}

      {/* Modals */}
      <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} />
      <CashDrawerModal isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
      <ShortcutsHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default function CaixaPage() {
  return (
    <PDVProvider>
      <PDVContent />
    </PDVProvider>
  );
}
