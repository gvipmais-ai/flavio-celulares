'use client';

import React, { useEffect, useState } from 'react';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export default function MovimentacoesPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMovements() {
      try {
        const res = await fetch('/api/stock/movements');
        const data = await res.json();
        setMovements(data.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    loadMovements();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Histórico de Movimentações</h1>
        <p className="text-xs text-slate-400">Rastreabilidade completa de entradas e saídas de estoque</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Código</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Saldo Ant.</th>
                <th>Saldo Result.</th>
                <th>Motivo</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    Carregando movimentações...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id}>
                    <td>{formatDateTime(mov.createdAt)}</td>
                    <td className="font-mono font-bold text-blue-400">{mov.product?.code}</td>
                    <td className="font-medium text-slate-200">{mov.product?.name}</td>
                    <td>
                      {mov.direction === 'IN' ? (
                        <span className="badge badge-success flex items-center gap-1 w-fit">
                          <ArrowDownLeft className="h-3 w-3" /> Entrada
                        </span>
                      ) : (
                        <span className="badge badge-danger flex items-center gap-1 w-fit">
                          <ArrowUpRight className="h-3 w-3" /> Saída
                        </span>
                      )}
                    </td>
                    <td className="font-bold">{mov.quantity}</td>
                    <td>{mov.previousBalance}</td>
                    <td className="font-bold text-slate-200">{mov.resultingBalance}</td>
                    <td className="text-xs text-slate-400">{mov.reason}</td>
                    <td className="text-xs">{mov.user?.name}</td>
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
