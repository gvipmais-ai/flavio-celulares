'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, RefreshCcw, FileText, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDateTime, formatPaymentMethod } from '@/lib/formatters';
import { toast } from 'sonner';

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const [sale, setSale] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Return Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnType, setReturnType] = useState<'TROCA_GARANTIA' | 'DEVOLUCAO' | 'DEVOLUCAO_FORA_GARANTIA'>('TROCA_GARANTIA');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [returnDefect, setReturnDefect] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const loadSale = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (!res.ok) {
        toast.error('Venda não encontrada');
        router.push('/vendas');
        return;
      }
      const data = await res.json();
      setSale(data.sale);
    } catch {
      toast.error('Erro de conexão ao carregar detalhes da venda');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (saleId) loadSale();
  }, [saleId]);

  const openReturnModal = (item: any) => {
    setSelectedItem(item);
    setReturnQuantity(1);
    setReturnType('TROCA_GARANTIA');
    setReturnReason('');
    setReturnDefect('');
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const submitReturn = async () => {
    if (!returnReason || returnReason.length < 5) {
      toast.error('Informe um motivo válido (mínimo 5 caracteres)');
      return;
    }
    if (returnType === 'TROCA_GARANTIA' && !returnDefect) {
      toast.error('Informe a descrição do defeito para trocas em garantia');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        saleId: sale.id,
        saleItemId: selectedItem.id,
        quantity: returnQuantity,
        reason: returnReason,
        defectDescription: returnDefect || undefined,
        type: returnType,
        notes: returnNotes || undefined,
      };

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao processar devolução');
        return;
      }

      toast.success('Solicitação de devolução/troca registrada com sucesso!');
      setShowReturnModal(false);
      // Recarrega a venda para possivelmente atualizar o status dos itens
      loadSale();
    } catch {
      toast.error('Erro de conexão ao processar a devolução');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-icon">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Detalhes da Venda #{String(sale.sequentialNumber).padStart(6, '0')}</h1>
            <p className="text-xs text-slate-400">Data: {formatDateTime(sale.createdAt)}</p>
          </div>
        </div>
        <span className={`badge ${sale.status === 'CONCLUIDA' ? 'badge-success' : 'badge-danger'} text-sm px-3 py-1`}>
          {sale.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Informações
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-semibold text-slate-200">{sale.customerNameSnapshot}</span>
            </div>
            {sale.customerCpfSnapshot && (
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">CPF:</span>
                <span className="font-semibold text-slate-200">{sale.customerCpfSnapshot}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Operador:</span>
              <span className="font-semibold text-slate-200">{sale.operator?.name}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-400">ID da Transação:</span>
              <span className="font-mono text-xs text-slate-500">{sale.clientTransactionId}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-emerald-400" />
            Resumo Financeiro
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(sale.grossAmount)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Descontos:</span>
              <span className="font-semibold text-red-400">- {formatCurrency(sale.discountAmount)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Total Pago:</span>
              <span className="font-bold text-emerald-400 text-base">{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 block mb-2 font-semibold">Métodos de Pagamento:</span>
              {sale.payments?.map((p: any) => (
                <div key={p.id} className="flex justify-between text-xs bg-slate-800/50 p-2 rounded mb-1">
                  <span className="font-semibold text-slate-300">{formatPaymentMethod(p.paymentMethod)}</span>
                  <span className="text-slate-200">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h2 className="font-bold text-white">Itens da Venda</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Qtd</th>
                <th>Preço Unit.</th>
                <th>Subtotal</th>
                <th>Garantia</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item: any) => {
                const isWarrantyValid = new Date() <= new Date(new Date(sale.createdAt).getTime() + (item.warrantyMonthsSnapshot * 30 * 24 * 60 * 60 * 1000));
                return (
                  <tr key={item.id}>
                    <td className="font-semibold text-slate-200">{item.productNameSnapshot}</td>
                    <td className="font-mono text-xs">{item.productCodeSnapshot}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td className="font-bold text-emerald-400">{formatCurrency(item.subtotal)}</td>
                    <td>
                      {item.warrantyMonthsSnapshot > 0 ? (
                        isWarrantyValid ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-medium">
                            <ShieldCheck className="h-3 w-3" /> {item.warrantyMonthsSnapshot} meses
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full font-medium">
                            <AlertTriangle className="h-3 w-3" /> Expirada
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-500">Sem garantia</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openReturnModal(item)}
                        className="btn-secondary btn-sm"
                        disabled={sale.status !== 'CONCLUIDA'}
                        title="Registrar Troca ou Devolução deste item"
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                        Trocar / Devolver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return / Exchange Modal */}
      {showReturnModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-blue-400" />
                  Solicitar Troca / Devolução
                </h2>
                <p className="text-xs text-slate-400 mt-1">Produto: {selectedItem.productNameSnapshot}</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="label">Tipo de Solicitação</label>
                <select 
                  value={returnType} 
                  onChange={(e) => setReturnType(e.target.value as any)}
                  className="input"
                >
                  <option value="TROCA_GARANTIA">Troca em Garantia (Defeito)</option>
                  <option value="DEVOLUCAO">Devolução Padrão (Desistência)</option>
                  <option value="DEVOLUCAO_FORA_GARANTIA">Troca / Devolução Fora de Garantia</option>
                </select>
                {returnType === 'DEVOLUCAO_FORA_GARANTIA' && (
                  <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requer autorização de um Gerente ou SuperAdmin.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="label">Quantidade a devolver</label>
                <input 
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Number(e.target.value))}
                  className="input"
                />
                <p className="text-[10px] text-slate-500">Máximo disponível nesta venda: {selectedItem.quantity}</p>
              </div>

              <div className="space-y-1.5">
                <label className="label">Motivo (Obrigatório)</label>
                <input 
                  type="text"
                  placeholder="Ex: Cliente desistiu da compra"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="input"
                />
              </div>

              {returnType === 'TROCA_GARANTIA' && (
                <div className="space-y-1.5">
                  <label className="label text-amber-400">Descrição do Defeito (Obrigatório para Troca)</label>
                  <textarea 
                    placeholder="Descreva o problema relatado..."
                    value={returnDefect}
                    onChange={(e) => setReturnDefect(e.target.value)}
                    className="input min-h-[80px] resize-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="label">Observações Adicionais (Opcional)</label>
                <textarea 
                  placeholder="Detalhes extras sobre o estado do produto..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="input min-h-[60px] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button onClick={() => setShowReturnModal(false)} className="btn-ghost" disabled={isSubmitting}>
                Cancelar
              </button>
              <button onClick={submitReturn} disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
