'use client';

import React, { useState } from 'react';
import { Search, Loader2, ShieldCheck, ShieldAlert, Clock, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function GarantiasPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);

    try {
      const res = await fetch(`/api/warranties?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.sales);
      } else {
        toast.error('Erro na consulta');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Consulta de Garantia
        </h1>
        <p className="text-sm text-slate-400">Verifique a validade da garantia de produtos vendidos</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Digite o código da venda, nome do cliente ou código do produto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-10"
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Consultar'}
          </button>
        </form>
      </div>

      {results && results.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-slate-600" />
          Nenhum registro encontrado para essa consulta.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((sale) => (
            <div key={sale.id} className="card p-5 space-y-4 hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-200">Venda #{sale.sequentialNumber}</h3>
                  <p className="text-xs text-slate-400">{format(new Date(sale.createdAt), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 uppercase">
                  {sale.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-300"><span className="font-semibold text-slate-400">Cliente:</span> {sale.customerNameSnapshot}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400">ITENS DA VENDA</p>
                {sale.items.map((item: any) => {
                  const isWarrantyValid = new Date() <= new Date(new Date(sale.createdAt).getTime() + (item.warrantyMonthsSnapshot * 30 * 24 * 60 * 60 * 1000));
                  
                  return (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span className="truncate max-w-[150px]">{item.productNameSnapshot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.warrantyMonthsSnapshot > 0 ? (
                          isWarrantyValid ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck className="h-3 w-3" /> No Prazo ({item.warrantyMonthsSnapshot}m)</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400"><ShieldAlert className="h-3 w-3" /> Expirada</span>
                          )
                        ) : (
                          <span className="text-xs text-slate-500">Sem garantia</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href={`/vendas/${sale.id}`} className="btn-secondary w-full justify-center mt-4">
                Ver Detalhes e Trocas <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
