'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Package, Gift } from 'lucide-react';
import { formatCurrency, formatPaymentMethod } from '@/lib/formatters';

export default function RelatoriosPage() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data.data || []);
    }
    loadData();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  // Agrupamento por forma de pagamento
  const paymentTotals: Record<string, number> = {};
  sales.forEach((s) => {
    if (s.payments && s.payments.length > 0) {
      s.payments.forEach((p: any) => {
        const method = p.paymentMethod;
        paymentTotals[method] = (paymentTotals[method] || 0) + Number(p.amount);
      });
    }
  });

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Numero,Data,Cliente,FormaPagamento,Total\n' +
      sales
        .map(
          (s) =>
            `${s.sequentialNumber},${s.createdAt},"${s.customerNameSnapshot}",${
              s.payments?.[0]?.paymentMethod || 'DINHEIRO'
            },${s.totalAmount}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'relatorio_vendas.csv');
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Relatórios Gerenciais
          </h1>
          <p className="text-xs text-slate-400 mt-1">Análise financeira, totais por meio de pagamento e descontos</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="stat-label">Receita Total</span>
          <span className="stat-value text-emerald-400">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total de Vendas Realizadas</span>
          <span className="stat-value">{sales.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ticket Médio</span>
          <span className="stat-value">
            {sales.length > 0 ? formatCurrency(totalRevenue / sales.length) : 'R$ 0,00'}
          </span>
        </div>
      </div>

      {/* Resumo por Forma de Pagamento */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Faturamento por Meio de Pagamento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'BRINDE'].map((methodKey) => {
            const amount = paymentTotals[methodKey] || 0;
            return (
              <div
                key={methodKey}
                className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between"
              >
                <span className="text-xs text-slate-400 font-medium">
                  {formatPaymentMethod(methodKey)}
                </span>
                <span className="text-base font-bold text-white mt-2">
                  {formatCurrency(amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
