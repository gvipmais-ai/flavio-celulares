'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wrench, Plus, Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';

export default function OrdensPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/service-orders');
        const data = await res.json();
        setOrders(data.data || []);
      } catch {
        toast.error('Erro ao carregar ordens de serviço');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-xs text-slate-400">Acompanhamento da assistência técnica</p>
        </div>
        <Link href="/ordens/nova" className="btn-primary">
          <Plus className="h-4 w-4" /> Nova Ordem de Serviço
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Data Entrada</th>
                <th>Cliente</th>
                <th>Aparelho</th>
                <th>Defeito Relatado</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Carregando ordens...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              ) : (
                orders.map((os) => (
                  <tr key={os.id}>
                    <td className="font-mono font-bold text-blue-400">
                      #{String(os.sequentialNumber).padStart(6, '0')}
                    </td>
                    <td>{formatDateTime(os.receivedAt)}</td>
                    <td className="font-medium text-slate-200">{os.customer?.name}</td>
                    <td>
                      {os.deviceBrandSnapshot} {os.deviceModelSnapshot}
                    </td>
                    <td className="text-xs text-slate-400 max-w-xs truncate">
                      {os.reportedIssue}
                    </td>
                    <td>
                      <span className="badge badge-info">{os.status}</span>
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
