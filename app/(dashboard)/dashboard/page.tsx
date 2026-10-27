'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DollarSign, ShoppingCart, Wrench, AlertTriangle, FileText,
  TrendingUp, Package, Plus, Sparkles, Clock, ArrowRight,
  ShieldCheck, CheckCircle2
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── WELCOME BANNER WITH MODERN GRADIENT ──────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sistema Oficial Flavio Celulares</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bem-vindo(a), {user.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Painel operacional integrado — Nível de Acesso: <span className="font-bold text-indigo-400 uppercase tracking-wider">{user.cargo}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <Link
            href="/ordens/nova"
            className="btn-shimmer flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Ordem de Serviço</span>
          </Link>
          <Link
            href="/caixa"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 text-emerald-400" />
            <span>Frente de Caixa</span>
          </Link>
        </div>
      </div>

      {/* ── SUPERADMIN / GERAL DASHBOARD ────────────────────────────────────── */}
      {(user.cargo === "SUPERADMIN" || user.cargo === "GERENTE") && (
        <>
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Vendas Recentes</span>
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats?.recentSales?.length || 0}</div>
              <div className="text-xs text-emerald-400 font-medium">Movimentações do turno</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Estoque Crítico</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{stats?.lowStockCount || 0}</div>
              <div className="text-xs text-slate-400">Produtos no estoque mínimo</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Ordens de Serviço</span>
                <Wrench className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats?.recentOrders?.length || 0}</div>
              <div className="text-xs text-indigo-400 font-medium">Aparelhos na assistência</div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Operação do Caixa</span>
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-lg font-black text-cyan-400">Pronto p/ Operar</div>
              <div className="text-xs text-slate-400">Sessão ativa e segura</div>
            </div>
          </div>

          {/* 2 Detailed Activity Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales Card */}
            <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Últimas Vendas Realizadas</h2>
                </div>
                <Link href="/vendas" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <span>Ver todas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {stats?.recentSales?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Nenhuma venda registrada ainda no turno.</p>
                ) : (
                  stats?.recentSales?.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-white/5 p-3.5 text-xs hover:border-white/10 transition-colors">
                      <div>
                        <p className="font-bold text-white text-sm">Venda #{sale.sequentialNumber}</p>
                        <p className="text-[11px] text-slate-400">Operador: {sale.operator?.name || 'Caixa'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-400 text-sm">{formatCurrency(sale.totalAmount)}</p>
                        <span className="text-[10px] text-slate-500">Concluída</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Service Orders Card */}
            <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ordens de Serviço Recentes</h2>
                </div>
                <Link href="/ordens" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <span>Ver todas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {stats?.recentOrders?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Nenhuma ordem de serviço aberta recentemente.</p>
                ) : (
                  stats?.recentOrders?.map((os: any) => (
                    <div key={os.id} className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-white/5 p-3.5 text-xs hover:border-white/10 transition-colors">
                      <div>
                        <p className="font-bold text-white text-sm">OS #{os.sequentialNumber} — {os.deviceBrandSnapshot} {os.deviceModelSnapshot}</p>
                        <p className="text-[11px] text-slate-400">Cliente: {os.customer?.name || 'Consumidor'}</p>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {os.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── OPERADOR DE CAIXA DASHBOARD ─────────────────────────────────────── */}
      {user.cargo === "OPERADOR" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl border border-white/10 bg-slate-900/60 text-center space-y-4 shadow-xl">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Frente de Caixa</h3>
              <p className="text-xs text-slate-400 mt-1">Iniciar uma nova venda rápida no PDV</p>
            </div>
            <Link href="/caixa" className="btn-primary w-full py-3 text-xs font-bold block">
              Abrir Caixa / Vender
            </Link>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-slate-900/60 text-center space-y-4 shadow-xl">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600/20 text-emerald-400 mx-auto flex items-center justify-center">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Minhas Vendas</h3>
              <p className="text-xs text-slate-400 mt-1">Consultar histórico e cupons do seu turno</p>
            </div>
            <Link href="/vendas" className="btn-secondary w-full py-3 text-xs font-bold block">
              Ver Histórico
            </Link>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-slate-900/60 text-center space-y-4 shadow-xl">
            <div className="h-14 w-14 rounded-2xl bg-amber-600/20 text-amber-400 mx-auto flex items-center justify-center">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Consultar Estoque</h3>
              <p className="text-xs text-slate-400 mt-1">Verificar produtos, peças e preços</p>
            </div>
            <Link href="/produtos" className="btn-secondary w-full py-3 text-xs font-bold block">
              Consultar Produtos
            </Link>
          </div>
        </div>
      )}

      {/* ── TÉCNICO DASHBOARD ───────────────────────────────────────────────── */}
      {user.cargo === "TECNICO" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Bancada Técnica</h2>
            <Link href="/ordens/nova" className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4">
              <Plus className="h-4 w-4" /> Nova Ordem de Serviço
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-1">
              <span className="text-xs text-slate-400 font-semibold block">Ordens em Andamento</span>
              <span className="text-2xl font-black text-white">{stats?.recentOrders?.length || 0}</span>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/60 space-y-1">
              <span className="text-xs text-slate-400 font-semibold block">Estoque de Peças</span>
              <span className="text-lg font-bold text-indigo-400">Ativo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
