'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { User, ShoppingCart, Wrench, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { maskCpf, maskPhone } from '@/lib/formatters';
import { toast } from 'sonner';

export default function CustomerHistoryPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const res = await fetch(\`/api/customers/\${id}/history\`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
        } else {
          toast.error('Erro ao carregar histórico do cliente');
        }
      } catch {
        toast.error('Erro de conexão');
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  if (!customer) {
    return <div className="p-12 text-center text-slate-400">Cliente não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes" className="btn-ghost btn-icon text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            {customer.name}
          </h1>
          <p className="text-sm text-slate-400">
            {customer.cpf ? maskCpf(customer.cpf) : 'Sem CPF'} • {customer.phone ? maskPhone(customer.phone) : 'Sem telefone'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico de Vendas */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-400" /> Últimas Vendas
          </h2>
          {customer.sales.length === 0 ? (
            <div className="card p-6 text-center text-slate-500 text-sm">Nenhuma venda registrada.</div>
          ) : (
            <div className="space-y-3">
              {customer.sales.map((sale: any) => (
                <div key={sale.id} className="card p-4 hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-200">Venda #{sale.sequentialNumber}</h3>
                      <p className="text-xs text-slate-400">{format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">R$ {Number(sale.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800">
                    <span>{sale.items.length} itens</span>
                    <Link href={`/vendas/${sale.id}`} className="text-blue-400 hover:underline flex items-center gap-1">
                      Detalhes <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de OS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-400" /> Últimas Ordens de Serviço
          </h2>
          {customer.serviceOrders.length === 0 ? (
            <div className="card p-6 text-center text-slate-500 text-sm">Nenhuma ordem de serviço registrada.</div>
          ) : (
            <div className="space-y-3">
              {customer.serviceOrders.map((os: any) => (
                <div key={os.id} className="card p-4 hover:border-amber-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-200">OS #{os.sequentialNumber}</h3>
                      <p className="text-xs text-slate-400">{os.deviceModel.brand.name} {os.deviceModel.name}</p>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">{os.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between items-center pt-2 border-t border-slate-800 mt-2">
                    <span className="truncate max-w-[200px]">{os.reportedIssue}</span>
                    <Link href={`/ordens/${os.id}`} className="text-blue-400 hover:underline flex items-center gap-1">
                      Detalhes <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
