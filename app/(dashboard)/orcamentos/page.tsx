'use client';

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const res = await fetch('/api/quotes');
        const data = await res.json();
        setQuotes(data.data || []);
      } catch {
        toast.error('Erro ao carregar orçamentos');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuotes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Orçamentos de Manutenção</h1>
        <p className="text-xs text-slate-400">Consulte orçamentos de assistência técnica</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Versão</th>
                <th>OS Nº</th>
                <th>Cliente</th>
                <th>Mão de Obra</th>
                <th>Total</th>
                <th>Status</th>
                <th>Criado por</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Carregando orçamentos...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="font-bold">v{q.version}</td>
                    <td className="font-mono text-blue-400">
                      #{String(q.serviceOrder?.sequentialNumber).padStart(6, '0')}
                    </td>
                    <td>{q.serviceOrder?.customer?.name}</td>
                    <td>{formatCurrency(q.laborAmount)}</td>
                    <td className="font-bold text-emerald-400">{formatCurrency(q.totalAmount)}</td>
                    <td>
                      <span className="badge badge-warning">{q.status}</span>
                    </td>
                    <td className="text-xs">{q.createdBy?.name}</td>
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
