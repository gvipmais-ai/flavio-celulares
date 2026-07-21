'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, Sliders, History } from 'lucide-react';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustDirection, setAdjustDirection] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      toast.error('Erro ao carregar estoque');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    if (adjustReason.length < 10) {
      toast.error('Informe uma justificativa detalhada (mínimo 10 caracteres)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: adjustQty,
          direction: adjustDirection,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao ajustar estoque');
        return;
      }

      toast.success('Ajuste de estoque realizado com sucesso!');
      setSelectedProduct(null);
      setAdjustReason('');
      loadStock();
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Controle de Estoque</h1>
          <p className="text-xs text-slate-400">Estoque físico, reservas para OS e disponibilidade</p>
        </div>
        <Link href="/estoque/movimentacoes" className="btn-secondary">
          <History className="h-4 w-4" /> Histórico de Movimentações
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Estoque Físico</th>
                <th>Reservado (OS)</th>
                <th>Disponível</th>
                <th>Estoque Mínimo</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Carregando estoque...
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isBelow = prod.stockOnHand <= prod.minimumStock;
                  return (
                    <tr key={prod.id}>
                      <td className="font-mono font-bold text-blue-400">{prod.code}</td>
                      <td className="font-medium text-slate-200">{prod.name}</td>
                      <td className="font-bold text-slate-200">{prod.stockOnHand}</td>
                      <td className="text-amber-400 font-semibold">{prod.stockReserved}</td>
                      <td className={`font-bold ${isBelow ? 'text-red-400' : 'text-emerald-400'}`}>
                        {prod.stockAvailable}
                      </td>
                      <td>{prod.minimumStock}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedProduct(prod)}
                          className="btn-ghost btn-sm"
                          title="Ajustar Estoque"
                        >
                          <Sliders className="h-4 w-4" /> Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ajuste */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              Ajustar Estoque — {selectedProduct.name}
            </h2>
            <p className="text-xs text-slate-400">
              Estoque físico atual: <span className="font-bold text-white">{selectedProduct.stockOnHand}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="label">Tipo de Ajuste</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('IN')}
                    className={`btn py-2 text-xs font-bold ${
                      adjustDirection === 'IN' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('OUT')}
                    className={`btn py-2 text-xs font-bold ${
                      adjustDirection === 'OUT' ? 'btn-danger' : 'btn-secondary'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-red-400" /> Saída (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Justificativa Obrigatória (mínimo 10 caracteres)</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input h-20"
                  placeholder="Ex: Contagem física quinzenal identificou divergência..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedProduct(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={isSubmitting}
                className="btn-primary"
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
