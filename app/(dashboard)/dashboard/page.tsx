'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DollarSign,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  Package,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stock');
        const stockData = await res.json();

        const resSales = await fetch('/api/sales?pageSize=5');
        const salesData = await resSales.json();

        const resOrders = await fetch('/api/service-orders?pageSize=5');
        const ordersData = await resOrders.json();

        setStats({
          lowStockCount: stockData.data?.filter((p: any) => p.stockOnHand <= p.minimumStock).length || 0,
          recentSales: salesData.data || [],
          recentOrders: ordersData.data || [],
        });
      } catch {
        // silent load
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bem-vindo(a), {user.name} 👋</h1>
        <p className="text-sm text-slate-400">
          Visão geral do sistema Flavio Celulares — Cargo: <span className="font-semibold text-blue-400">{user.role}</span>
        </p>
      </div>

      {/* SUPERADMIN DASHBOARD */}
      {user.role === 'SUPERADMIN' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <span className="stat-label">Vendas Recentes</span>
              <span className="stat-value">{stats?.recentSales?.length || 0}</span>
              <span className="stat-change-up">Atividade do dia</span>
            </div>
            <div className="stat-card">
              <span className="stat-label flex items-center justify-between">
                Estoque Mínimo
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </span>
              <span className="stat-value text-amber-400">{stats?.lowStockCount || 0}</span>
              <span className="text-xs text-slate-400">Produtos precisando de reposição</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Ordens de Serviço</span>
              <span className="stat-value">{stats?.recentOrders?.length || 0}</span>
              <span className="stat-change-up">Aparelhos na assistência</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Status do Caixa</span>
              <span className="stat-value text-emerald-400 text-lg">Pronto para operação</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Últimas Vendas</h2>
                <Link href="/vendas" className="btn-ghost btn-sm">Ver todas</Link>
              </div>
              <div className="space-y-3">
                {stats?.recentSales?.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-200">Venda #{sale.sequentialNumber}</p>
                      <p className="text-xs text-slate-400">Operador: {sale.operator?.name}</p>
                    </div>
                    <p className="font-bold text-emerald-400">{formatCurrency(sale.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Ordens de Serviço Recentes</h2>
                <Link href="/ordens" className="btn-ghost btn-sm">Ver todas</Link>
              </div>
              <div className="space-y-3">
                {stats?.recentOrders?.map((os: any) => (
                  <div key={os.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-200">OS #{os.sequentialNumber} - {os.deviceBrandSnapshot} {os.deviceModelSnapshot}</p>
                      <p className="text-xs text-slate-400">Cliente: {os.customer?.name}</p>
                    </div>
                    <span className="badge badge-info">{os.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* OPERADOR_CAIXA DASHBOARD */}
      {user.role === 'OPERADOR_CAIXA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-6 flex flex-col items-center justify-center text-center">
              <ShoppingCart className="h-10 w-10 text-blue-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Frente de Caixa</h3>
              <p className="text-xs text-slate-400 mb-4">Iniciar uma nova venda rapidamente</p>
              <Link href="/caixa" className="btn-primary w-full">Abrir Caixa / Vender</Link>
            </div>
            <div className="card p-6 flex flex-col items-center justify-center text-center">
              <FileText className="h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Minhas Vendas</h3>
              <p className="text-xs text-slate-400 mb-4">Consultar histórico do seu turno</p>
              <Link href="/vendas" className="btn-secondary w-full">Ver Histórico</Link>
            </div>
            <div className="card p-6 flex flex-col items-center justify-center text-center">
              <Package className="h-10 w-10 text-amber-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Consultar Estoque</h3>
              <p className="text-xs text-slate-400 mb-4">Verificar disponibilidade de produtos</p>
              <Link href="/produtos" className="btn-secondary w-full">Ver Produtos</Link>
            </div>
          </div>
        </div>
      )}

      {/* TECNICO DASHBOARD */}
      {user.role === 'TECNICO' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Painel Técnico</h2>
            <Link href="/ordens/nova" className="btn-primary">
              <Plus className="h-4 w-4" /> Nova Ordem de Serviço
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <span className="stat-label">Ordens de Serviço</span>
              <span className="stat-value">{stats?.recentOrders?.length || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Estoque de Peças</span>
              <span className="stat-value text-blue-400">Ativo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
