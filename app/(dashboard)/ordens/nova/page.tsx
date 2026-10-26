'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, ArrowRight, Check, User, Smartphone,
  ClipboardList, Plus, Search, X, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Checklist padrão ───────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  { id: 'tela',        label: 'Tela / Display',           group: 'visual' },
  { id: 'carcaca',     label: 'Carcaça / Corpo',          group: 'visual' },
  { id: 'botoes',      label: 'Botões físicos',            group: 'visual' },
  { id: 'camera',      label: 'Câmera',                   group: 'funcao' },
  { id: 'microfone',   label: 'Microfone',                group: 'funcao' },
  { id: 'alto_falante',label: 'Alto-falante / Caixa',     group: 'funcao' },
  { id: 'carregamento',label: 'Entrada de carregamento',  group: 'funcao' },
  { id: 'biometria',   label: 'Biometria / Face ID',      group: 'funcao' },
  { id: 'wifi',        label: 'Wi-Fi',                    group: 'conectividade' },
  { id: 'bluetooth',   label: 'Bluetooth',                group: 'conectividade' },
  { id: 'sinal',       label: 'Sinal / Chip',             group: 'conectividade' },
  { id: 'bateria',     label: 'Bateria',                  group: 'componentes' },
  { id: 'ligar',       label: 'Liga / Desliga',           group: 'componentes' },
];

const GROUP_LABELS: Record<string, string> = {
  visual: '👁️ Visual',
  funcao: '⚙️ Funções',
  conectividade: '📶 Conectividade',
  componentes: '🔋 Componentes',
};

type CheckStatus = 'OK' | 'DEFEITO' | 'NAO_VERIFICADO';

interface ChecklistItem {
  id: string;
  label: string;
  group: string;
  status: CheckStatus;
}

// ─── Acessórios pré-definidos ────────────────────────────────────────────────
const ACCESSORY_OPTIONS = [
  'Capa protetora', 'Película', 'Carregador', 'Cabo USB', 'Fone de ouvido',
  'Chip', 'Caixa original', 'Nota fiscal', 'Cartão de memória',
];

// ─── Etapas ──────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Cliente',   icon: User },
  { id: 2, label: 'Aparelho',  icon: Smartphone },
  { id: 3, label: 'Checklist', icon: ClipboardList },
];

export default function NovaOrdemPage() {
  const router = useRouter();

  // Navegação entre etapas
  const [step, setStep] = useState(1);

  // ── Etapa 1: Cliente ──
  const [customers, setCustomers]     = useState<any[]>([]);
  const [search, setSearch]           = useState('');
  const [customerId, setCustomerId]   = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName]         = useState('');
  const [newCpf, setNewCpf]           = useState('');
  const [newPhone, setNewPhone]       = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Etapa 2: Aparelho ──
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [color, setColor]             = useState('');
  const [accessories, setAccessories] = useState<string[]>([]);
  const [reportedIssue, setReportedIssue] = useState('');

  // ── Etapa 3: Checklist ──
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map(i => ({ ...i, status: 'NAO_VERIFICADO' as CheckStatus }))
  );

  // Submissão final
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Carregar clientes ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/customers?pageSize=200')
      .then(r => r.json())
      .then(d => setCustomers(d.data || []))
      .catch(() => {});
  }, []);

  const filteredCustomers = customers.filter(c =>
    `${c.name} ${c.cpf ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Criar cliente rápido ────────────────────────────────────────────────
  const handleCreateCustomer = async () => {
    if (!newName.trim()) { toast.error('Informe o nome'); return; }
    setIsCreatingCustomer(true);
    try {
      const res  = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, cpf: newCpf || undefined, phone: newPhone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message || 'Erro'); return; }
      toast.success('Cliente cadastrado!');
      const updated = [...customers, data.customer];
      setCustomers(updated);
      selectCustomer(data.customer);
      setShowNewCustomer(false);
      setNewName(''); setNewCpf(''); setNewPhone('');
    } catch { toast.error('Erro de conexão'); }
    finally { setIsCreatingCustomer(false); }
  };

  const selectCustomer = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setSearch(c.name);
  };

  // ─── Toggle acessório ────────────────────────────────────────────────────
  const toggleAccessory = (item: string) =>
    setAccessories(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );

  // ─── Status checklist ────────────────────────────────────────────────────
  const cycleStatus = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next: Record<CheckStatus, CheckStatus> = {
        NAO_VERIFICADO: 'OK',
        OK:             'DEFEITO',
        DEFEITO:        'NAO_VERIFICADO',
      };
      return { ...item, status: next[item.status] };
    }));
  };

  const statusColor: Record<CheckStatus, string> = {
    OK:             'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    DEFEITO:        'bg-red-500/20 border-red-500/50 text-red-400',
    NAO_VERIFICADO: 'bg-slate-800 border-slate-700 text-slate-500',
  };

  const statusLabel: Record<CheckStatus, string> = {
    OK:             '✓ OK',
    DEFEITO:        '✗ Defeito',
    NAO_VERIFICADO: '— N/V',
  };

  // ─── Validação por etapa ─────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return !!customerId;
    if (step === 2) return !!deviceModel.trim() && !!reportedIssue.trim();
    return true;
  };

  // ─── Enviar OS ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          deviceBrandSnapshot: deviceBrand || deviceModel.split(' ')[0],
          deviceModelSnapshot: deviceModel,
          color: color || undefined,
          accessoriesReceived: accessories.join(', ') || undefined,
          reportedIssue,
          checklistItems: checklist
            .filter(i => i.status !== 'NAO_VERIFICADO')
            .map(i => ({ label: i.label, result: i.status })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message || 'Erro ao criar OS'); return; }
      toast.success(`OS #${data.serviceOrder?.sequentialNumber} criada!`);
      router.push(`/ordens/${data.serviceOrder.id}`);
    } catch { toast.error('Erro de conexão'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link href="/ordens" className="btn-ghost btn-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nova Ordem de Serviço</h1>
          <p className="text-xs text-slate-400">Preencha as etapas abaixo rapidamente</p>
        </div>
      </div>

      {/* Indicador de etapas */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => {
          const Icon  = s.icon;
          const done  = step > s.id;
          const active = step === s.id;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border transition-all
                  ${active ? 'bg-indigo-600 border-indigo-500 text-white' :
                    done   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-pointer' :
                             'bg-slate-800 border-slate-700 text-slate-500 cursor-default'}`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {s.label}
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── ETAPA 1: CLIENTE ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            Quem é o cliente?
          </h2>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              ref={searchRef}
              autoFocus
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              className="input pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setCustomerId(''); setCustomerName(''); }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setCustomerId(''); setCustomerName(''); }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Cliente selecionado */}
          {customerId && (
            <div className="flex items-center gap-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {customerName[0]?.toUpperCase()}
              </div>
              <span className="text-white font-medium">{customerName}</span>
              <Check className="h-4 w-4 text-emerald-400 ml-auto" />
            </div>
          )}

          {/* Lista de resultados */}
          {!customerId && search.length > 0 && (
            <div className="rounded-lg border border-slate-800 overflow-hidden max-h-52 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">Nenhum cliente encontrado</p>
              ) : (
                filteredCustomers.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-800 last:border-0"
                  >
                    <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{c.name}</p>
                      {(c.cpf || c.phone) && (
                        <p className="text-xs text-slate-500">{c.cpf || ''}{c.cpf && c.phone ? ' · ' : ''}{c.phone || ''}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Cadastro rápido */}
          {!customerId && (
            !showNewCustomer ? (
              <button
                onClick={() => setShowNewCustomer(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo cliente
              </button>
            ) : (
              <div className="rounded-lg border border-slate-700 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Cadastro rápido</h3>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome completo *"
                  className="input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="CPF (opcional)" className="input"
                    value={newCpf} onChange={e => setNewCpf(e.target.value)} />
                  <input type="text" placeholder="Telefone (opcional)" className="input"
                    value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCustomer(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={handleCreateCustomer} disabled={isCreatingCustomer} className="btn-primary flex-1">
                    {isCreatingCustomer ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Salvar'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── ETAPA 2: APARELHO ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-indigo-400" />
            Dados do aparelho
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Modelo do aparelho *</label>
              <input
                autoFocus
                type="text"
                className="input"
                placeholder="Ex: iPhone 13, Galaxy A54"
                value={deviceModel}
                onChange={e => setDeviceModel(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Cor (opcional)</label>
              <div className="flex gap-2">
                {['Preto','Branco','Azul','Dourado','Rosa'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      color === c
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="Outra..."
                  className="input text-xs py-1 w-20"
                  value={['Preto','Branco','Azul','Dourado','Rosa'].includes(color) ? '' : color}
                  onChange={e => setColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Acessórios */}
          <div>
            <label className="label">Acessórios inclusos</label>
            <div className="flex flex-wrap gap-2">
              {ACCESSORY_OPTIONS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAccessory(item)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    accessories.includes(item)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {accessories.includes(item) && '✓ '}{item}
                </button>
              ))}
            </div>
          </div>

          {/* Defeito relatado */}
          <div>
            <label className="label">Defeito relatado pelo cliente *</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Ex: Tela quebrada após queda, não carrega mais..."
              value={reportedIssue}
              onChange={e => setReportedIssue(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── ETAPA 3: CHECKLIST ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-400" />
              Checklist de recebimento
            </h2>
            <span className="text-xs text-slate-500">Toque para marcar</span>
          </div>

          <p className="text-xs text-slate-400">
            Toque 1x = <span className="text-emerald-400">OK</span> · Toque 2x = <span className="text-red-400">Defeito</span> · Toque 3x = N/V
          </p>

          {Object.entries(GROUP_LABELS).map(([group, groupLabel]) => {
            const items = checklist.filter(i => i.group === group);
            return (
              <div key={group}>
                <p className="text-xs font-semibold text-slate-500 mb-2">{groupLabel}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => cycleStatus(item.id)}
                      className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all ${statusColor[item.status]}`}
                    >
                      <span className="text-xs font-medium leading-snug">{item.label}</span>
                      <span className="text-[10px] font-bold">{statusLabel[item.status]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Resumo */}
          <div className="rounded-lg bg-slate-800/60 px-4 py-3 flex items-center gap-4 text-xs">
            <span className="text-emerald-400">{checklist.filter(i=>i.status==='OK').length} OK</span>
            <span className="text-red-400">{checklist.filter(i=>i.status==='DEFEITO').length} Com defeito</span>
            <span className="text-slate-500">{checklist.filter(i=>i.status==='NAO_VERIFICADO').length} Não verificado</span>
          </div>
        </div>
      )}

      {/* ── Botões de navegação ───────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </button>
        ) : (
          <Link href="/ordens" className="btn-secondary">Cancelar</Link>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="btn-primary disabled:opacity-40"
          >
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Check className="h-4 w-4 mr-1" /> Abrir OS</>}
          </button>
        )}
      </div>
    </div>
  );
}
