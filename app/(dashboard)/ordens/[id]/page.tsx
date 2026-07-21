'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Wrench, CheckCircle, Clock, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDateTime, formatCurrency } from '@/lib/formatters';

export default function DetalheOrdemPage() {
  const params = useParams();
  const id = params?.id as string;
  const [os, setOs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Orçamento State
  const [laborAmount, setLaborAmount] = useState<number>(100);
  const [diagnosis, setDiagnosis] = useState('');
  const [parts, setParts] = useState<any[]>([]);

  const loadOS = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}`);
      const data = await res.json();
      setOs(data.serviceOrder);
    } catch {
      toast.error('Erro ao carregar Ordem de Serviço');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOS();
  }, [id]);

  const handleUpdateChecklist = async (itemId: string, result: string) => {
    try {
      const updatedItems = os.checklistItems.map((i: any) =>
        i.id === itemId ? { ...i, result } : { id: i.id, result: i.result }
      );
      const res = await fetch(`/api/service-orders/${id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (res.ok) {
        toast.success('Checklist atualizado!');
        loadOS();
      }
    } catch {
      toast.error('Erro ao atualizar checklist');
    }
  };

  const handleCreateQuote = async () => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOrderId: id,
          diagnosis,
          laborAmount,
          discountAmount: 0,
          items: [
            {
              itemType: 'SERVICO',
              descriptionSnapshot: 'Mão de obra técnica de reparo',
              quantity: 1,
              unitPrice: laborAmount,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar orçamento');
        return;
      }
      toast.success('Orçamento criado!');
      loadOS();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao aprovar orçamento');
        return;
      }
      toast.success('Orçamento aprovado e peças reservadas!');
      loadOS();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleConsumeParts = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/consume-parts`, { method: 'POST' });
      if (res.ok) {
        toast.success('Reparo iniciado! Peças consumidas do estoque.');
        loadOS();
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  if (isLoading || !os) {
    return <div className="p-8 text-center text-slate-500">Carregando Ordem de Serviço...</div>;
  }

  const latestQuote = os.quotes?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="btn-ghost btn-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              OS #{String(os.sequentialNumber).padStart(6, '0')} — {os.deviceBrandSnapshot}{' '}
              {os.deviceModelSnapshot}
            </h1>
            <p className="text-xs text-slate-400">Entrada: {formatDateTime(os.receivedAt)}</p>
          </div>
        </div>
        <span className="badge badge-info text-sm py-1 px-3">{os.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Detalhes e Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Dados do Cliente & Aparelho
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-semibold text-white">{os.customer?.name}</p>
                <p className="text-xs text-slate-400">{os.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Aparelho</p>
                <p className="font-semibold text-white">
                  {os.deviceBrandSnapshot} {os.deviceModelSnapshot}
                </p>
                <p className="text-xs text-slate-400">IMEI: {os.imei || 'Não informado'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-sm">
              <p className="text-xs text-slate-500">Defeito Relatado</p>
              <p className="text-slate-200">{os.reportedIssue}</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Checklist de Recebimento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {os.checklistItems?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded bg-slate-800/40 text-xs"
                >
                  <span className="text-slate-300 font-medium">{item.descriptionSnapshot}</span>
                  <select
                    value={item.result}
                    onChange={(e) => handleUpdateChecklist(item.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="OK">OK</option>
                    <option value="COM_DEFEITO">COM DEFEITO</option>
                    <option value="NAO_TESTADO">NÃO TESTADO</option>
                    <option value="NAO_SE_APLICA">N/A</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 3: Orçamentos & Ações */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Orçamento & Diagnóstico
            </h2>

            {latestQuote ? (
              <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Versão {latestQuote.version}</span>
                  <span className="badge badge-warning">{latestQuote.status}</span>
                </div>

                <div className="text-sm">
                  <p className="text-xs text-slate-500">Mão de obra</p>
                  <p className="font-bold">{formatCurrency(latestQuote.laborAmount)}</p>
                </div>

                <div className="text-lg font-black text-emerald-400 pt-2 border-t border-slate-700 flex justify-between">
                  <span>Total:</span>
                  <span>{formatCurrency(latestQuote.totalAmount)}</span>
                </div>

                {latestQuote.status === 'RASCUNHO' && (
                  <button
                    onClick={() => handleApproveQuote(latestQuote.id)}
                    className="btn-primary w-full mt-2"
                  >
                    Aprovar Orçamento (Reservar Peças)
                  </button>
                )}

                {latestQuote.status === 'APROVADO' && os.status !== 'EM_REPARO' && (
                  <button
                    onClick={() => handleConsumeParts(latestQuote.id)}
                    className="btn-primary w-full mt-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    Iniciar Reparo (Consumir Peças)
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Diagnóstico Técnico</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="input h-20 text-xs"
                    placeholder="Descreva o diagnóstico e a solução..."
                  />
                </div>

                <div>
                  <label className="label text-xs">Valor da Mão de Obra (R$)</label>
                  <input
                    type="number"
                    value={laborAmount}
                    onChange={(e) => setLaborAmount(Number(e.target.value))}
                    className="input font-bold"
                  />
                </div>

                <button onClick={handleCreateQuote} className="btn-primary w-full">
                  Gerar Orçamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
