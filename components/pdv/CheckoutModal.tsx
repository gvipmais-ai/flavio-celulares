'use client';

import React, { useState, useEffect } from 'react';
import { usePDV } from './PDVContext';
import { CheckCircle2, Loader2, Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { 
    cart, 
    customerName, customerCpf, 
    payments, 
    grossTotal, totalDiscount, netTotal, totalPaid, change,
    clearCart, registerShortcut, settings
  } = usePDV();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Esc / Enter shortcuts
  useEffect(() => {
    if (isOpen) {
      registerShortcut('Escape', () => {
        if (!successData && !isSubmitting) onClose();
      });
      registerShortcut('Enter', () => {
        if (!successData && !isSubmitting) handleConfirm();
        if (successData && !isSubmitting) handleNewSale();
      });
    }
  }, [isOpen, successData, isSubmitting, registerShortcut, onClose]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const clientTransactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      // Re-distribute general discount over items to match API structure
      const itemsPayload = cart.map(item => {
        const itemGross = item.quantity * item.unitPrice;
        let finalItemDiscount = item.discount;
        
        // Se houver desconto geral, distribui proporcionalmente ao subtotal
        const generalDiscount = totalDiscount - cart.reduce((acc, i) => acc + i.discount, 0);
        if (generalDiscount > 0 && grossTotal > 0) {
          const prop = itemGross / grossTotal;
          finalItemDiscount += (generalDiscount * prop);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          discount: Number(finalItemDiscount.toFixed(2)),
        };
      });

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTransactionId,
          customerNameSnapshot: customerName,
          customerCpfSnapshot: customerCpf || null,
          items: itemsPayload,
          payments: payments.map(p => ({ paymentMethod: p.method, amount: p.amount })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao finalizar venda');
      }

      toast.success('Venda registrada com sucesso!');
      
      const completedSale = {
        ...data.sale,
        cartItems: [...cart],
        grossTotal,
        discountAmount: totalDiscount,
        totalAmount: netTotal,
        payments: [...payments],
        change,
        dateFormatted: new Date().toLocaleString('pt-BR'),
      };
      
      setSuccessData(completedSale);
      clearCart(); // Limpa o estado global
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async (saleData: any, type: 'RECEIPT' | 'WARRANTY') => {
    try {
      // Lazy load to avoid bundle size issues
      const { generateThermalReceiptPDF, generateWarrantyTermPDF } = await import('@/lib/pdfGenerator');
      
      const pdfBase64 = type === 'RECEIPT' 
        ? await generateThermalReceiptPDF(saleData, settings)
        : await generateWarrantyTermPDF(saleData, settings);
      
      // Open in new tab or iframe to print
      const win = window.open();
      if (win) {
        win.document.write(`
          <iframe src="${pdfBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>
        `);
        win.document.title = type === 'RECEIPT' ? `Cupom ${saleData.sequentialNumber}` : `Garantia ${saleData.sequentialNumber}`;
      }
    } catch (e) {
      toast.error('Erro ao gerar PDF. Tente imprimir pelo histórico.');
      console.error(e);
    }
  };

  const handleNewSale = () => {
    setSuccessData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {successData ? (
          // Success Screen
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Venda Concluída!</h2>
            <p className="text-slate-500 mb-8">Pedido #{successData.sequentialNumber}</p>
            
            {successData.change > 0 && (
              <div className="bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-500 rounded-xl p-6 w-full mb-8">
                <span className="block text-amber-700 dark:text-amber-400 font-bold mb-2">TROCO A DEVOLVER:</span>
                <span className="block text-5xl font-black text-amber-600 dark:text-amber-500">
                  {formatCurrency(successData.change)}
                </span>
              </div>
            )}

            <div className="flex gap-4 w-full mb-4">
              <button 
                onClick={() => handlePrint(successData, 'RECEIPT')}
                className="flex-1 btn-secondary py-4 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Comprovante
              </button>
              <button 
                onClick={() => handlePrint(successData, 'WARRANTY')}
                className="flex-1 btn-secondary py-4 text-sm font-bold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Garantia
              </button>
            </div>
            <div className="flex w-full">
              <button 
                onClick={handleNewSale}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 text-lg font-bold transition-all shadow-md"
              >
                Nova Venda (Enter)
              </button>
            </div>
          </div>
        ) : (
          // Confirmation Screen
          <div className="p-6">
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6 text-center">Confirmar Venda?</h2>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4 mb-6 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-[var(--text-primary)]">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qtd de Itens:</span>
                <span className="font-bold text-[var(--text-primary)]">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total a Pagar:</span>
                <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">{formatCurrency(netTotal)}</span>
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <span className="text-sm font-bold text-slate-400 block mb-2">Pagamentos:</span>
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm mb-1">
                    <span className="uppercase">{p.method.replace('_', ' ')}</span>
                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
              
              {change > 0 && (
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg flex justify-between items-center mt-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400">Troco:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 text-xl">{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 btn-secondary py-4 font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Voltar (Esc)
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Confirmar (Enter)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
