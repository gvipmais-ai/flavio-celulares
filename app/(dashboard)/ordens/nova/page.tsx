'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Check, User, Smartphone,
  Plus, Search, X, Printer, Phone, FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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

// ─── Impressão do Checklist Manual ────────────────────────────────────────────
interface PrintData {
  osNumber: number | string;
  customerName: string;
  customerPhone?: string;
  customerCpf?: string;
  deviceModel: string;
  color?: string;
  accessories?: string[];
  reportedIssue: string;
  createdAt: Date;
}

function printManualChecklist(data: PrintData) {
  const dateStr = data.createdAt.toLocaleDateString('pt-BR');
  const timeStr = data.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isApple = isIphone(data.deviceModel);

  // Itens para preenchimento manual à caneta
  const iphoneGroups = [
    {
      cat: '1. ESTADO FÍSICO / CARCAÇA & TELA',
      isPhysical: true,
      items: [
        { name: 'Carcaça / Aro / Chassis', note: 'Riscos, amassados, cantos batidos ou empenamento' },
        { name: 'Tela / Visor Frontal', note: 'Trincas, riscos profundos, manchas ou linhas' },
        { name: 'Vidro Traseiro', note: 'Íntegro, trincado ou quebrado' },
        { name: 'Lente das Câmeras', note: 'Íntegra, riscada, trincada ou embaçada' },
      ],
    },
    {
      cat: '2. TESTES DE FUNCIONAMENTO (Se ligar)',
      isPhysical: false,
      items: [
        { name: 'Botões (Power / Volume / Mute)', note: 'Clique firme e resposta' },
        { name: 'Câmera Frontal e Traseira', note: 'Foco, zoom, flash e gravação' },
        { name: 'Microfone & Alto-falante', note: 'Chamadas normais, áudio e viva-voz' },
        { name: 'Conector Lightning / USB-C', note: 'Carrega firme sem folga' },
        { name: 'Biometria (Face ID / Touch ID)', note: 'Reconhecimento biométrico' },
        { name: 'True Tone & Sensor Proximidade', note: 'Apaga tela ao aproximar na chamada' },
        { name: 'Wi-Fi, Bluetooth e GPS', note: 'Busca redes e pareamento' },
        { name: 'Chip SIM / eSIM / Sinal Operadora', note: 'Rede móvel e chamadas' },
        { name: 'Saúde da Bateria: [ ______ % ]', note: 'Ajustes > Bateria > Saúde' },
        { name: 'Carregamento sem Fio (MagSafe)', note: 'Indução magnética' },
        { name: 'Versão do iOS: [ ____________ ]', note: 'Ajustes > Geral > Sobre' },
        { name: 'iCloud / Buscar Ativo?', note: '[  ] Desativado / Livre    [  ] Ativo (Exige senha)' },
      ],
    },
  ];

  const androidGroups = [
    {
      cat: '1. ESTADO FÍSICO / CARCAÇA & TELA',
      isPhysical: true,
      items: [
        { name: 'Carcaça / Tampa Traseira / Aro', note: 'Riscos, amassados, marcas de queda' },
        { name: 'Tela / Visor Frontal', note: 'Trincada, riscada, manchas ou touch falho' },
        { name: 'Lente das Câmeras', note: 'Íntegra, trincada ou riscada' },
      ],
    },
    {
      cat: '2. TESTES DE FUNCIONAMENTO (Se ligar)',
      isPhysical: false,
      items: [
        { name: 'Botões Power & Volume', note: 'Clique firme e resposta' },
        { name: 'Câmeras Frontal e Traseira', note: 'Foto, vídeo, zoom e flash' },
        { name: 'Microfone & Alto-falante', note: 'Som limpo, ligações e áudios' },
        { name: 'Conector USB / Carga / Fone P2', note: 'Carrega firme e transfere dados' },
        { name: 'Biometria (Digital / Facial)', note: 'Desbloqueio por digital/rosto' },
        { name: 'Wi-Fi, Bluetooth e GPS', note: 'Redes sem fio e pareamento' },
        { name: 'Sinal de Operadora / Chip', note: 'Leitura de SIM e chamadas' },
        { name: 'Bateria / Autonomia', note: 'Duração normal, não esquenta/incha' },
        { name: 'Versão do Android: [ _________ ]', note: 'Configurações > Sobre o telefone' },
        { name: 'Conta Google (FRP) Liberada?', note: '[  ] Desvinculada    [  ] Vinculada (Exige senha)' },
      ],
    },
  ];

  const selectedList = isApple ? iphoneGroups : androidGroups;

  const checklistRows = selectedList.map(group => `
    <tr class="group-header">
      <td colspan="2">${group.cat}</td>
    </tr>
    ${group.items.map(item => `
      <tr>
        <td class="check-boxes ${group.isPhysical ? 'physical-col' : 'func-col'}">
          ${group.isPhysical ? `
            <span class="box"></span> Íntegro &nbsp;
            <span class="box"></span> Avariado / Risco / Amasso
          ` : `
            <span class="box"></span> OK &nbsp;
            <span class="box"></span> Defeito &nbsp;
            <span class="box"></span> N/T
          `}
        </td>
        <td class="item-name">
          <strong>${item.name}</strong>
          ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
        </td>
      </tr>
    `).join('')}
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Checklist Manual OS #${data.osNumber} - Flavio Celulares</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9.5pt;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }
  @media print and (max-width: 90mm) {
    @page { size: 80mm auto; margin: 2mm; }
    body { font-size: 8pt; line-height: 1.25; }
    .page-wrapper { width: 75mm; padding: 1mm; }
    h1.os-title { font-size: 13pt; }
    .termo-box { font-size: 6.5pt; padding: 4px; }
  }
  @media print and (min-width: 91mm) {
    @page { size: A4; margin: 10mm 15mm; }
    body { font-size: 9.5pt; }
    .page-wrapper { max-width: 170mm; margin: 0 auto; padding: 8px; }
    h1.os-title { font-size: 16pt; }
    .termo-box { font-size: 8pt; padding: 8px; }
  }
  .page-wrapper {
    max-width: 400px;
    margin: 0 auto;
    padding: 8px;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 5px;
    margin-bottom: 6px;
  }
  .store-name {
    font-size: 13pt;
    font-weight: 900;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  h1.os-title {
    font-size: 15pt;
    font-weight: 900;
    margin: 2px 0;
  }
  .datetime {
    font-size: 8.5pt;
    color: #333;
  }
  .info-box {
    border: 1px solid #000;
    border-radius: 4px;
    padding: 5px 7px;
    margin-bottom: 6px;
    font-size: 8.5pt;
  }
  .info-row {
    display: flex;
    gap: 4px;
    margin-bottom: 2px;
  }
  .info-row:last-child { margin-bottom: 0; }
  .field-label {
    font-weight: bold;
    min-width: 65px;
  }
  .issue-box {
    border: 2px solid #000;
    border-radius: 4px;
    padding: 5px 7px;
    margin-bottom: 6px;
    font-size: 8.5pt;
  }
  .checklist-title {
    text-align: center;
    font-size: 9.5pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    padding: 3px 0;
    margin-bottom: 4px;
  }
  table.checklist {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }
  table.checklist tr.group-header td {
    background: #000;
    color: #fff;
    font-weight: bold;
    padding: 3px 5px;
    font-size: 7.5pt;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  table.checklist tr td {
    border-bottom: 1px solid #ccc;
    vertical-align: top;
    padding: 3px 2px;
  }
  .check-boxes {
    white-space: nowrap;
    font-size: 7pt;
    font-weight: bold;
  }
  .physical-col { width: 155px; }
  .func-col { width: 105px; }
  .box {
    display: inline-block;
    width: 11px;
    height: 11px;
    border: 1.5px solid #000;
    margin-right: 1px;
    vertical-align: middle;
  }
  .item-name strong { font-size: 8pt; }
  .item-note { font-size: 6.5pt; color: #444; }
  .obs-box {
    border: 1px dashed #000;
    border-radius: 4px;
    padding: 5px;
    margin-top: 6px;
    font-size: 7.5pt;
    min-height: 35px;
  }
  /* Termo de Ciência e Isenção */
  .termo-box {
    border: 1.5px solid #000;
    background: #fdfdfd;
    border-radius: 4px;
    margin-top: 8px;
    text-align: justify;
  }
  .termo-title {
    font-weight: 900;
    text-align: center;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
    margin-bottom: 4px;
    letter-spacing: 0.3px;
  }
  .termo-box p {
    margin-bottom: 3px;
  }
  .termo-box p:last-child { margin-bottom: 0; }
  .concordo-row {
    margin-top: 6px;
    padding: 4px 6px;
    border: 1px solid #000;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: bold;
  }
  .signature {
    margin-top: 10px;
    border-top: 1px dashed #000;
    padding-top: 5px;
  }
  .sig-line {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .sig-field {
    flex: 1;
    border-top: 1px solid #000;
    padding-top: 3px;
    font-size: 7pt;
    text-align: center;
    color: #111;
  }
  .footer {
    text-align: center;
    font-size: 6.5pt;
    color: #555;
    margin-top: 6px;
    border-top: 1px solid #ccc;
    padding-top: 2px;
  }
  .print-btn {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 12px 0;
  }
  .print-btn button {
    padding: 8px 18px;
    font-size: 10pt;
    font-weight: bold;
    cursor: pointer;
    border-radius: 6px;
    border: 1px solid #000;
    background: #000;
    color: #fff;
  }
  @media print { .print-btn { display: none !important; } }
</style>
</head>
<body>
<div class="print-btn">
  <button onclick="window.print()">🖨️ Imprimir Checklist Manual</button>
  <button onclick="window.close()" style="background:#fff;color:#000;">✕ Fechar</button>
</div>

<div class="page-wrapper">
  <div class="header">
    <div class="store-name">Flavio Celulares</div>
    <h1 class="os-title">OS #${data.osNumber}</h1>
    <div class="datetime">Entrada: ${dateStr} às ${timeStr}</div>
  </div>

  <div class="info-box">
    <div class="info-row">
      <span class="field-label">Cliente:</span>
      <span><strong>${data.customerName}</strong></span>
    </div>
    ${data.customerPhone ? `
    <div class="info-row">
      <span class="field-label">Telefone:</span>
      <span>${data.customerPhone}</span>
    </div>` : ''}
    <div class="info-row">
      <span class="field-label">Aparelho:</span>
      <span><strong>${data.deviceModel}</strong>${data.color ? ' (' + data.color + ')' : ''}</span>
    </div>
    ${data.accessories && data.accessories.length > 0 ? `
    <div class="info-row">
      <span class="field-label">Acessórios:</span>
      <span>${data.accessories.join(', ')}</span>
    </div>` : ''}
  </div>

  <div class="issue-box">
    <strong>⚠ DEFEITO RELATADO:</strong><br>
    ${data.reportedIssue}
  </div>

  <div class="checklist-title">
    📋 Checklist de Entrada (${isApple ? 'iPhone' : 'Android / Multimarcas'})
  </div>

  <table class="checklist">
    <tbody>
      ${checklistRows}
    </tbody>
  </table>

  <div class="obs-box">
    <strong>Anotações / Diagnóstico do Técnico:</strong>
  </div>

  <!-- Termo de Ciência e Isenção de Responsabilidade -->
  <div class="termo-box">
    <div class="termo-title">TERMO DE CIÊNCIA E DECLARAÇÃO DO CLIENTE</div>
    <p>
      Declaro estar ciente de que, caso o aparelho dê entrada <u>desligado</u>, <u>não ligando</u>, <u>descarregado</u>, <u>sem senha de desbloqueio informada</u> ou com a <u>tela quebrada/sem imagem/sem touch</u>, <strong>NÃO FOI POSSÍVEL REALIZAR O TESTE PRÉVIO</strong> de funções internas como: câmeras frontal/traseira, microfones, alto-falantes, Wi-Fi, Bluetooth, Face ID / biometria, sensores, sinal de operadora e placa.
    </p>
    <p>
      A assistência técnica <strong>NÃO SE RESPONSABILIZA POR VÍCIOS OCULTOS OU DEFEITOS PRÉ-EXISTENTES</strong> não passíveis de teste no momento da recepção. Autorizo a abertura e análise técnica do equipamento para diagnóstico e orçamento.
    </p>
  </div>

  <div class="concordo-row">
    [ &nbsp; ] <strong>CONCORDO E AUTORIZO AS CONDIÇÕES ACIMA</strong>
  </div>

  <div class="signature">
    <div class="sig-line">
      <div class="sig-field">Assinatura Atendente / Técnico</div>
      <div class="sig-field">Assinatura do Cliente</div>
    </div>
  </div>

  <div class="footer">
    Flavio Celulares · OS #${data.osNumber} · ${dateStr}
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=520,height=880');
  if (!win) { alert('Permita pop-ups no navegador para imprimir o checklist.'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
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
  const [lastCreated, setLastCreated]     = useState<PrintData | null>(null);

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

      const printInfo: PrintData = {
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

      // Dispara a impressão do checklist manual
      printManualChecklist(printInfo);

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

        {/* ── CARD INFORMATIVO: CHECKLIST MANUAL ────────────────────────── */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
            <Printer className="h-5 w-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-white text-sm mb-0.5">Checklist de Bancada Manual</p>
            Ao clicar no botão abaixo, a Ordem de Serviço será gerada e o sistema abrirá automaticamente a folha do checklist para imprimir (térmica ou A4). O técnico preenche à caneta na bancada ao avaliar o celular.
          </div>
        </div>

        {/* ── BOTÃO DE SUBMISSÃO ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/ordens" className="btn-secondary">
            Cancelar
          </Link>

          <div className="flex items-center gap-2">
            {lastCreated && (
              <button
                type="button"
                onClick={() => printManualChecklist(lastCreated)}
                className="btn-secondary flex items-center gap-1.5"
                title="Reimprimir folha manual"
              >
                <Printer className="h-4 w-4" />
                Reimprimir Folha
              </button>
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
                  Abrir OS e Imprimir Checklist
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
