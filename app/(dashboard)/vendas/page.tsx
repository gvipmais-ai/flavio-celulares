'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Printer, XCircle, Eye } from 'lucide-react';
import { formatCurrency, formatDateTime, formatPaymentMethod } from '@/lib/formatters';
import { toast } from 'sonner';

export default function VendasPage() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);

  const loadVendas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setVendas(data.data || []);
    } catch {
      toast.error('Erro ao carregar vendas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendas();
  }, []);

  const handleCancelSale = async (id: string) => {
    const reason = prompt('Informe o motivo do cancelamento (mínimo 10 caracteres):');
    if (!reason || reason.length < 10) {
      toast.error('Motivo inválido ou muito curto');
      return;
    }

    try {
      const res = await fetch(`/api/sales/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao cancelar venda');
        return;
      }
      toast.success('Venda cancelada com sucesso!');
      loadVendas();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Histórico de Vendas</h1>
          <p className="text-xs text-slate-400">Consulte e gerencie as vendas realizadas</p>
        </div>
        <Link href="/caixa" className="btn-primary">
          <ShoppingCart className="h-4 w-4" /> Nova Venda
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nº Venda</th>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Operador</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Carregando vendas...
                  </td>
                </tr>
              ) : vendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                vendas.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-mono font-bold text-blue-400">
                      #{String(sale.sequentialNumber).padStart(6, '0')}
                    </td>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{sale.customerNameSnapshot}</td>
                    <td>{sale.operator?.name}</td>
                    <td className="font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</td>
                    <td>
                      <span
                        className={`badge ${
                          sale.status === 'CONCLUIDA' ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => setSelectedVenda(sale)}
                        className="btn-ghost btn-sm"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {sale.status === 'CONCLUIDA' && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          className="btn-ghost btn-sm text-red-400"
                          title="Cancelar Venda"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes */}
      {selectedVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              Venda #{String(selectedVenda.sequentialNumber).padStart(6, '0')}
            </h2>
            <div className="text-sm space-y-1 text-slate-300">
              <p>Cliente: {selectedVenda.customerNameSnapshot}</p>
              <p>Operador: {selectedVenda.operator?.name}</p>
              <p>Data: {formatDateTime(selectedVenda.createdAt)}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Itens</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedVenda.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm bg-slate-800/50 p-2 rounded">
                    <span>
                      {item.quantity}x {item.productNameSnapshot}
                    </span>
                    <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedVenda.payments && selectedVenda.payments.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Forma de Pagamento</h3>
                <div className="space-y-1 text-sm text-slate-300">
                  {selectedVenda.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="font-bold">{formatPaymentMethod(p.paymentMethod)}:</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-800">
              <span>Total:</span>
              <span className="text-emerald-400">{formatCurrency(selectedVenda.totalAmount)}</span>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setSelectedVenda(null)} className="btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
