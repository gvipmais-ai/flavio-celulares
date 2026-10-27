'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Check, User, Smartphone,
  Plus, Search, X, Printer, Phone, FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { printManualChecklist, PrintChecklistData } from '@/lib/checklistPrinter';

// ─── Acessórios Rápidos ───────────────────────────────────────────────────────
const ACCESSORY_OPTIONS = [
  'Capa protetora', 'Película', 'Carregador', 'Cabo USB',
  'Fone de ouvido', 'Chip SIM', 'Caixa original', 'Cartão de memória',
];

// ─── Cores Comuns ─────────────────────────────────────────────────────────────
const COMMON_COLORS = [
  'Preto', 'Branco', 'Azul', 'Dourado', 'Rosa', 'Cinza', 'Verde', 'Roxo', 'Prata',
];

// ─── Detecta se é iPhone ──────────────────────────────────────────────────────
function isIphone(model: string) {
  return /iphone/i.test(model);
}

export default function NovaOrdemPage() {
  const router = useRouter();

  // Cliente
  const [customers, setCustomers]         = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [customerId, setCustomerId]       = useState('');
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf]     = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName]             = useState('');
  const [newCpf, setNewCpf]              = useState('');
  const [newPhone, setNewPhone]           = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Aparelho
  const [deviceModel, setDeviceModel]     = useState('');
  const [color, setColor]                 = useState('');
  const [accessories, setAccessories]     = useState<string[]>([]);
  const [reportedIssue, setReportedIssue] = useState('');

  // Envio & Impressão
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [printFormat, setPrintFormat]     = useState<'a4' | 'thermal'>('a4');
  const [lastCreated, setLastCreated]     = useState<PrintChecklistData | null>(null);

  // Carrega clientes existentes
  useEffect(() => {
    fetch('/api/customers?pageSize=200')
      .then(r => r.json())
      .then(d => setCustomers(d.data || []))
      .catch(() => {});
  }, []);

  const filteredCustomers = customers.filter(c =>
    `${c.name} ${c.cpf ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  // Cadastro rápido de cliente
  const handleCreateCustomer = async () => {
    if (!newName.trim()) { toast.error('Informe o nome do cliente'); return; }
    setIsCreatingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, cpf: newCpf || undefined, phone: newPhone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message || 'Erro ao cadastrar cliente'); return; }
      toast.success('Cliente cadastrado com sucesso!');
      const updated = [...customers, data.customer];
      setCustomers(updated);
      selectCustomer(data.customer);
      setShowNewCustomer(false);
      setNewName(''); setNewCpf(''); setNewPhone('');
    } catch { toast.error('Erro de conexão ao salvar cliente'); }
    finally { setIsCreatingCustomer(false); }
  };

  const selectCustomer = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerCpf(c.cpf || '');
    setSearch(c.name);
  };

  const clearCustomer = () => {
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCpf('');
    setSearch('');
  };

  const toggleAccessory = (item: string) =>
    setAccessories(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );

  const canSubmit = customerId && deviceModel.trim().length > 0 && reportedIssue.trim().length > 0;

  // Submissão da OS + Impressão do Checklist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!customerId) toast.error('Selecione ou cadastre o cliente');
      else if (!deviceModel.trim()) toast.error('Informe o modelo do celular');
      else if (!reportedIssue.trim()) toast.error('Descreva o defeito relatado');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          deviceBrandSnapshot: deviceModel.split(' ')[0] || 'Geral',
          deviceModelSnapshot: deviceModel.trim(),
          color: color.trim() || undefined,
          accessoriesReceived: accessories.join(', ') || undefined,
          reportedIssue: reportedIssue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Erro ao abrir Ordem de Serviço');
        return;
      }

      const osNum = data.serviceOrder?.sequentialNumber;
      const osId  = data.serviceOrder?.id;

      toast.success(`OS #${osNum} aberta com sucesso! Abrindo impressão do checklist...`);

      const printInfo: PrintChecklistData = {
        osNumber: osNum,
        customerName: customerName,
        customerPhone: customerPhone,
        customerCpf: customerCpf,
        deviceModel: deviceModel.trim(),
        color: color.trim(),
        accessories: accessories,
        reportedIssue: reportedIssue.trim(),
        createdAt: new Date(),
      };

      setLastCreated(printInfo);

      // Dispara a impressão do checklist manual com o formato selecionado (e botão para alternar)
      printManualChecklist(printInfo, printFormat);

      setTimeout(() => router.push(`/ordens/${osId}`), 1600);
    } catch {
      toast.error('Erro de conexão ao criar a Ordem de Serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="btn-ghost btn-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Nova Ordem de Serviço</h1>
            <p className="text-xs text-slate-400">
              Preencha os dados e imprima o checklist para verificação na bancada
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── CARD 1: CLIENTE ─────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
              <User className="h-4 w-4 text-indigo-400" />
              1. Cliente
            </h2>
            {customerId && (
              <button
                type="button"
                onClick={clearCustomer}
                className="text-xs text-slate-400 hover:text-white"
              >
                Trocar cliente
              </button>
            )}
          </div>

          {!customerId ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar por nome, telefone ou CPF..."
                  className="input pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Resultados da busca */}
              {search.trim().length > 0 && (
                <div className="rounded-lg border border-slate-800 overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-400 mb-2">Nenhum cliente encontrado com esse nome.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(search);
                          setShowNewCustomer(true);
                        }}
                        className="text-xs text-indigo-400 hover:underline font-medium"
                      >
                        + Cadastrar &quot;{search}&quot; agora
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.slice(0, 8).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/80 transition-colors text-left"
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {c.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{c.name}</p>
                          {(c.phone || c.cpf) && (
                            <p className="text-xs text-slate-400 truncate">
                              {c.phone ? `Tel: ${c.phone}` : ''}
                              {c.phone && c.cpf ? ' · ' : ''}
                              {c.cpf ? `CPF: ${c.cpf}` : ''}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Formulário de cadastro rápido */}
              {!showNewCustomer ? (
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar novo cliente
                </button>
              ) : (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                    Novo Cliente Rápido
                  </p>
                  <input
                    type="text"
                    placeholder="Nome completo *"
                    className="input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Telefone / WhatsApp"
                      className="input text-sm"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="CPF (opcional)"
                      className="input text-sm"
                      value={newCpf}
                      onChange={e => setNewCpf(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="btn-secondary text-xs py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer}
                      className="btn-primary text-xs py-1.5"
                    >
                      {isCreatingCustomer ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'Salvar Cliente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {customerName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{customerName}</p>
                {customerPhone && (
                  <p className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {customerPhone}
                  </p>
                )}
              </div>
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
            </div>
          )}
        </div>

        {/* ── CARD 2: APARELHO & DEFEITO ─────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
            <Smartphone className="h-4 w-4 text-indigo-400" />
            2. Celular & Defeito
          </h2>

          <div>
            <label className="label">Modelo do celular *</label>
            <input
              type="text"
              className="input font-medium"
              placeholder="Ex: iPhone 13 Pro, Galaxy S23, Moto G84..."
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
            />
            {deviceModel.trim().length > 0 && (
              <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${isIphone(deviceModel) ? 'text-blue-400' : 'text-slate-400'}`}>
                {isIphone(deviceModel)
                  ? '🍎 iPhone detectado — o checklist impresso terá Saúde da Bateria, Face ID e iCloud'
                  : '🤖 Android detectado — o checklist impresso terá FRP Conta Google, Biometria e Conector'}
              </p>
            )}
          </div>

          <div>
            <label className="label">Cor (opcional)</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    color === c
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                      : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {c}
                </button>
              ))}
              <input
                type="text"
                placeholder="Outra..."
                className="input text-xs py-1 px-2.5 w-24"
                value={COMMON_COLORS.includes(color) ? '' : color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Acessórios deixados pelo cliente</label>
            <div className="flex flex-wrap gap-1.5">
              {ACCESSORY_OPTIONS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAccessory(item)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    accessories.includes(item)
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                      : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {accessories.includes(item) && '✓ '}{item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Defeito relatado pelo cliente *</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Descreva o problema que o cliente relatou. Ex: Tela quebrou após queda, touch parou de responder, não carrega..."
              value={reportedIssue}
              onChange={e => setReportedIssue(e.target.value)}
            />
          </div>
        </div>

        {/* ── CARD INFORMATIVO: CHECKLIST MANUAL & FORMATO ─────────────── */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
              <Printer className="h-5 w-5" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-white text-sm mb-0.5">Checklist de Entrada Manual</p>
              Ao clicar no botão abaixo, a Ordem de Serviço será gerada e o sistema abrirá a folha com espaço generoso para carimbo da loja e assinaturas.
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300">Formato de Impressão:</span>
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  printFormat === 'a4'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Folha A4 (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  printFormat === 'thermal'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Printer className="h-3.5 w-3.5" />
                Cupom Térmico (80mm)
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTÃO DE SUBMISSÃO ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/ordens" className="btn-secondary">
            Cancelar
          </Link>

          <div className="flex items-center gap-2">
            {lastCreated && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => printManualChecklist(lastCreated, 'a4')}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-2"
                  title="Reimprimir em Folha A4"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Imprimir A4
                </button>
                <button
                  type="button"
                  onClick={() => printManualChecklist(lastCreated, 'thermal')}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-2"
                  title="Reimprimir em Cupom Térmico"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir Térmica
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abrindo OS...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Abrir OS e Imprimir ({printFormat === 'a4' ? 'Folha A4' : 'Cupom Térmico'})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
