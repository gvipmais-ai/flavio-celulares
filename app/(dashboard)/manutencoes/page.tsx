'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScrollText, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';

export default function ManutencoesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/service-orders?status=ENTREGUE,CANCELADA');
        const data = await res.json();
        setOrders(data.data || []);
      } catch {
        toast.error('Erro ao carregar histórico de manutenções');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ordens" className="btn-ghost btn-icon text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-amber-400" /> Histórico de Manutenções
          </h1>
          <p className="text-xs text-slate-400">Consulta de Ordens de Serviço finalizadas ou canceladas</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Data Entrada</th>
                <th>Data Finalização</th>
                <th>Cliente</th>
                <th>Aparelho</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando histórico...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhuma manutenção concluída encontrada.
                  </td>
                </tr>
              ) : (
                orders.map((os) => (
                  <tr key={os.id}>
                    <td className="font-mono font-bold text-amber-400">
                      #{String(os.sequentialNumber).padStart(6, '0')}
                    </td>
                    <td>{formatDateTime(os.receivedAt)}</td>
                    <td>{os.deliveredAt ? formatDateTime(os.deliveredAt) : '—'}</td>
                    <td className="font-medium text-slate-200">{os.customer?.name}</td>
                    <td>
                      {os.deviceBrandSnapshot} {os.deviceModelSnapshot}
                    </td>
                    <td>
                      <span className={`badge ${os.status === 'ENTREGUE' ? 'badge-success' : 'badge-error'}`}>
                        {os.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link href={`/ordens/${os.id}`} className="btn-ghost btn-sm">
                        <Eye className="h-4 w-4" /> Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
