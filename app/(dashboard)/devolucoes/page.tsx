'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCcw, Loader2, Search, ArrowRight, Package, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function DevolucoesPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/returns');
      if (res.ok) {
        const data = await res.json();
        setReturns(data.returns || []);
      } else {
        toast.error('Erro ao carregar devoluções');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TROCA_GARANTIA': return { label: 'Troca em Garantia', color: 'bg-emerald-500/10 text-emerald-400' };
      case 'DEVOLUCAO': return { label: 'Devolução Padrão', color: 'bg-blue-500/10 text-blue-400' };
      case 'DEVOLUCAO_FORA_GARANTIA': return { label: 'Dev. Fora da Garantia', color: 'bg-amber-500/10 text-amber-400' };
      default: return { label: type, color: 'bg-slate-500/10 text-slate-400' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONCLUIDA': return { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
      case 'SOLICITADA': return { label: 'Aguardando Autorização', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' };
      case 'RECUSADA': return { label: 'Recusada', color: 'bg-red-500/20 text-red-300 border border-red-500/30' };
      default: return { label: status, color: 'bg-slate-500/20 text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-emerald-400" />
            Devoluções e Trocas
          </h1>
          <p className="text-sm text-slate-400">Histórico de trocas e devoluções realizadas no sistema</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            Carregando devoluções...
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma devolução ou troca registrada até o momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Motivo / Defeito</th>
                  <th className="px-4 py-3">Venda Origem</th>
                  <th className="px-4 py-3">Venda Troca</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {returns.map((ret) => {
                  const type = getTypeLabel(ret.type);
                  const status = getStatusLabel(ret.status);

                  return (
                    <tr key={ret.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(ret.createdAt), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{ret.product.name}</div>
                        <div className="text-xs text-slate-500">Qtd: {ret.quantity}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${type.color}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="truncate font-medium">{ret.reason}</div>
                        {ret.defectDescription && (
                          <div className="truncate text-xs text-red-400 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> {ret.defectDescription}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`/vendas/${ret.saleId}`} className="text-blue-400 hover:underline">
                          Ver Venda
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ret.replacementSaleId ? (
                          <a href={`/vendas/${ret.replacementSaleId}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" /> Nova Venda
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
