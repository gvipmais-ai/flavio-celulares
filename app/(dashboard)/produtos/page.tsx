'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export default function ProdutosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        toast.success('Produto aprovado com sucesso!');
        loadProducts();
      }
    } catch {
      toast.error('Erro ao aprovar produto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Catálogo de Produtos</h1>
          <p className="text-xs text-slate-400">Acessórios, peças de manutenção e ferramentas</p>
        </div>
        <Link href="/produtos/novo" className="btn-primary">
          <Plus className="h-4 w-4" /> Novo Produto
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (ex: 0287), nome ou código de barras..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Estoque Físico</th>
                <th>Disponível</th>
                <th>Preço Venda</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Carregando catálogo...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLow = prod.stockOnHand <= prod.minimumStock;
                  return (
                    <tr key={prod.id}>
                      <td className="font-mono font-bold text-blue-400">{prod.code}</td>
                      <td>
                        <div className="font-medium text-slate-200">{prod.name}</div>
                        <div className="text-xs text-slate-500">
                          {prod.category?.name} • {prod.brand?.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral text-xs">{prod.productType}</span>
                      </td>
                      <td>
                        <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                          {prod.stockOnHand}
                        </span>
                        {isLow && <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-amber-400" />}
                      </td>
                      <td className="font-bold text-emerald-400">{prod.stockAvailable}</td>
                      <td className="font-bold text-slate-200">{formatCurrency(prod.salePrice)}</td>
                      <td>
                        <span
                          className={`badge ${
                            prod.approvalStatus === 'APROVADO'
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {prod.approvalStatus}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        {prod.approvalStatus === 'PENDENTE_REVISAO' && (
                          <button
                            onClick={() => handleApprove(prod.id)}
                            className="btn-primary btn-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
