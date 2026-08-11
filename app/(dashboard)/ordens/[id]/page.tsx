'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Wrench, CheckCircle, Clock, AlertTriangle, FileText, ArrowLeft, Printer, Search, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDateTime, formatCurrency } from '@/lib/formatters';

export default function DetalheOrdemPage() {
  const params = useParams();
  const id = params?.id as string;
  const [os, setOs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Orçamento State
  const [serviceType, setServiceType] = useState<'PECA' | 'MAO_DE_OBRA'>('PECA');
  const [laborAmount, setLaborAmount] = useState<number>(0);
  const [diagnosis, setDiagnosis] = useState('');
  
  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPart, setSelectedPart] = useState<any | null>(null);

  const loadOS = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}`);
      const data = await res.json();
      setOs(data.serviceOrder);
    } catch {
      toast.error('Erro ao carregar Ordem de Serviço');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadOS();
  }, [id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&pageSize=10`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateQuote = async () => {
    if (serviceType === 'PECA' && !selectedPart) {
      toast.error('Selecione uma peça para o orçamento');
      return;
    }
    
    try {
      const items = [];
      
      if (serviceType === 'PECA') {
        items.push({
          itemType: 'PECA',
          productId: selectedPart.id,
          descriptionSnapshot: selectedPart.name,
          quantity: 1,
          unitPrice: selectedPart.salePrice,
        });
      } else {
        items.push({
          itemType: 'SERVICO',
          descriptionSnapshot: 'Mão de obra técnica de reparo',
          quantity: 1,
          unitPrice: laborAmount,
        });
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceOrderId: id,
          diagnosis,
          laborAmount: serviceType === 'MAO_DE_OBRA' ? laborAmount : 0, // se for peça, mão de obra é 0
          discountAmount: 0,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao criar orçamento');
        return;
      }
      toast.success('Orçamento criado!');
      loadOS();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao aprovar orçamento');
        return;
      }
      toast.success('Orçamento aprovado e peças reservadas!');
      loadOS();
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleConsumeParts = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/consume-parts`, { method: 'POST' });
      if (res.ok) {
        toast.success('Reparo iniciado! Peças consumidas do estoque.');
        loadOS();
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleMarkAsReady = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}/ready`, { method: 'POST' });
      if (res.ok) {
        toast.success('Aparelho marcado como pronto!');
        loadOS();
      } else {
        toast.error('Erro ao marcar como pronto');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handlePrintEntryReceipt = async () => {
    try {
      const { generateOsEntryReceiptPDF } = await import('@/lib/pdfGenerator');
      
      const resSettings = await fetch('/api/settings');
      let settings = {};
      if (resSettings.ok) {
        const data = await resSettings.json();
        settings = data.settings || {};
      }
      
      const pdfBase64 = await generateOsEntryReceiptPDF(os, settings);
      
      const win = window.open();
      if (win) {
        win.document.write(`
          <iframe src="${pdfBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>
        `);
        win.document.title = `Entrada OS ${os.sequentialNumber}`;
      }
    } catch (e) {
      toast.error('Erro ao gerar PDF da OS.');
      console.error(e);
    }
  };

  if (isLoading || !os) {
    return <div className="p-8 text-center text-slate-500">Carregando Ordem de Serviço...</div>;
  }

  const latestQuote = os.quotes?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="btn-ghost btn-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              OS #{String(os.sequentialNumber).padStart(6, '0')} — {os.deviceBrandSnapshot}{' '}
              {os.deviceModelSnapshot}
            </h1>
            <p className="text-xs text-slate-400">Entrada: {formatDateTime(os.receivedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handlePrintEntryReceipt} className="btn-secondary flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimir Entrada
          </button>
          <span className="badge badge-info text-sm py-1 px-3">{os.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Detalhes do Cliente */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Dados do Cliente & Aparelho
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-semibold text-white">{os.customer?.name}</p>
                <p className="text-xs text-slate-400">{os.customer?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Aparelho</p>
                <p className="font-semibold text-white">
                  {os.deviceBrandSnapshot} {os.deviceModelSnapshot}
                </p>
                <p className="text-xs text-slate-400">IMEI: {os.imei || 'Não informado'}</p>
                <p className="text-xs text-slate-400">Cor: {os.color || 'Não informada'}</p>
              </div>
            </div>
            {os.accessoriesReceived && (
              <div className="pt-2 border-t border-slate-800 text-sm">
                <p className="text-xs text-slate-500">Acessórios Deixados</p>
                <p className="text-slate-200">{os.accessoriesReceived}</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 text-sm">
              <p className="text-xs text-slate-500">Defeito Relatado</p>
              <p className="text-slate-200 font-medium">{os.reportedIssue}</p>
            </div>
          </div>
        </div>

        {/* Coluna 3: Orçamentos & Ações */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Orçamento & Diagnóstico
            </h2>

            {latestQuote ? (
              <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Versão {latestQuote.version}</span>
                  <span className="badge badge-warning">{latestQuote.status}</span>
                </div>

                <div className="space-y-2 text-sm border-b border-slate-700 pb-2">
                  {latestQuote.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-slate-300">
                        {item.quantity}x {item.descriptionSnapshot}
                      </span>
                      <span className="font-mono text-slate-400">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  
                  {latestQuote.laborAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Mão de Obra</span>
                      <span className="font-mono text-slate-400">
                        {formatCurrency(latestQuote.laborAmount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-lg font-black text-emerald-400 pt-2 flex justify-between">
                  <span>Total:</span>
                  <span>{formatCurrency(latestQuote.totalAmount)}</span>
                </div>

                {latestQuote.status === 'RASCUNHO' && (
                  <button
                    onClick={() => handleApproveQuote(latestQuote.id)}
                    className="btn-primary w-full mt-2"
                  >
                    Aprovar Orçamento
                  </button>
                )}

                {latestQuote.status === 'APROVADO' && os.status !== 'EM_REPARO' && os.status !== 'PRONTO_PARA_ENTREGA' && os.status !== 'ENTREGUE' && (
                  <button
                    onClick={() => handleConsumeParts(latestQuote.id)}
                    className="btn-primary w-full mt-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    Iniciar Reparo
                  </button>
                )}

                {os.status === 'EM_REPARO' && (
                  <button
                    onClick={handleMarkAsReady}
                    className="btn-primary w-full mt-2 bg-blue-600 hover:bg-blue-500"
                  >
                    Marcar como Pronto
                  </button>
                )}

                {os.status === 'PRONTO_PARA_ENTREGA' && (
                  <Link
                    href={`/caixa?osId=${os.id}`}
                    className="btn-primary w-full mt-2 bg-purple-600 hover:bg-purple-500 flex items-center justify-center"
                  >
                    Receber no Caixa
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label text-xs">Diagnóstico Técnico</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="input h-20 text-xs"
                    placeholder="Descreva o diagnóstico e a solução..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="label text-xs">Tipo de Serviço</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceType('PECA')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        serviceType === 'PECA' 
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Troca de Peça
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceType('MAO_DE_OBRA')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        serviceType === 'MAO_DE_OBRA' 
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Apenas Mão de Obra
                    </button>
                  </div>
                </div>

                {serviceType === 'PECA' ? (
                  <div className="space-y-2 relative">
                    <label className="label text-xs">Buscar Peça no Estoque</label>
                    {selectedPart ? (
                      <div className="flex items-center justify-between bg-slate-800 border border-primary-500/30 p-3 rounded-lg">
                        <div>
                          <p className="text-sm font-bold text-white">{selectedPart.name}</p>
                          <p className="text-xs text-emerald-400 font-mono">{formatCurrency(selectedPart.salePrice)}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedPart(null)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nome ou código da peça..."
                            className="input pl-9 text-sm"
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {searchResults.length > 0 && searchQuery && (
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {searchResults.map(p => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedPart(p);
                                  setSearchQuery('');
                                  setSearchResults([]);
                                }}
                                className="p-3 border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer last:border-0"
                              >
                                <p className="text-sm font-semibold text-white">{p.name}</p>
                                <p className="text-xs text-emerald-400 font-mono">{formatCurrency(p.salePrice)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="label text-xs">Valor da Mão de Obra (R$)</label>
                    <input
                      type="number"
                      value={laborAmount}
                      onChange={(e) => setLaborAmount(Number(e.target.value))}
                      className="input font-bold"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <button onClick={handleCreateQuote} className="btn-primary w-full mt-4">
                  Gerar Orçamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
