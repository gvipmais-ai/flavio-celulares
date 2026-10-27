'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, ArrowRight, Check, User, Smartphone,
  ClipboardList, Plus, Search, X, ChevronRight, Battery, Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

// ─── Impressão de checklist ───────────────────────────────────────────────────
interface PrintData {
  osNumber: number | string;
  customerName: string;
  deviceModel: string;
  color: string;
  accessories: string[];
  reportedIssue: string;
  checklist: ChecklistItem[];
  createdAt: Date;
}

function printChecklist(data: PrintData) {
  const dateStr = data.createdAt.toLocaleDateString('pt-BR');
  const timeStr = data.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Grupos
  const GROUP_LABELS_PRINT: Record<string, string> = {
    visual: 'VISUAL',
    funcao: 'FUNÇÕES',
    biometria: 'BIOMETRIA',
    conectividade: 'CONECTIVIDADE',
    bateria: 'BATERIA & ENERGIA',
    software: 'SOFTWARE',
  };

  const groups = Object.keys(GROUP_LABELS_PRINT).filter(g =>
    data.checklist.some(i => i.group === g)
  );

  const checklistHTML = groups.map(group => {
    const items = data.checklist.filter(i => i.group === group);
    const rows = items.map(item => `
      <tr>
        <td class="check-cell">
          <span class="box"></span>
          <span class="box"></span>
          <span class="box"></span>
        </td>
        <td class="label-cell">
          <strong>${item.label}</strong>
          ${item.detail ? `<br><small>${item.detail}</small>` : ''}
          ${item.hasInput ? `<div class="input-line">_______________________</div>` : ''}
        </td>
      </tr>
    `).join('');
    return `
      <tr class="group-header">
        <td colspan="2">${GROUP_LABELS_PRINT[group]}</td>
      </tr>
      ${rows}
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Checklist OS #${data.osNumber}</title>
<style>
  /* ── Reset ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Corpo ── */
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11pt;
    color: #000;
    background: #fff;
  }

  /* ═══════════════════════════════════════════
     MODO IMPRESSORA TÉRMICA (padrão)
     Papel de 58mm a 80mm — detecção automática
     pelo browser. O usuário seleciona a impressora.
  ═══════════════════════════════════════════ */
  @media print and (max-width: 90mm) {
    @page { size: 80mm auto; margin: 3mm; }
    body { font-size: 9pt; }
    .page-wrapper { width: 72mm; }
    h1.os-title { font-size: 14pt; }
  }

  /* ═══════════════════════════════════════════
     MODO PAPEL A4
  ═══════════════════════════════════════════ */
  @media print and (min-width: 91mm) {
    @page { size: A4; margin: 15mm 20mm; }
    body { font-size: 11pt; }
    .page-wrapper { max-width: 170mm; margin: 0 auto; }
    h1.os-title { font-size: 18pt; }
  }

  /* ── Estilos gerais (tela + impressão) ── */
  .page-wrapper {
    padding: 8px;
    max-width: 300px;
    margin: 0 auto;
  }

  /* Cabeçalho */
  .header {
    text-align: center;
    border-bottom: 3px double #000;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .header .store-name {
    font-size: 13pt;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  h1.os-title {
    font-size: 16pt;
    font-weight: bold;
    margin: 4px 0 2px;
  }
  .datetime {
    font-size: 9pt;
    color: #444;
  }

  /* Info do cliente */
  .info-block {
    border: 1px solid #000;
    border-radius: 4px;
    padding: 7px 10px;
    margin-bottom: 8px;
  }
  .info-block .row {
    display: flex;
    gap: 4px;
    margin-bottom: 3px;
    font-size: 10pt;
    flex-wrap: wrap;
  }
  .info-block .row:last-child { margin-bottom: 0; }
  .info-block .field-label {
    font-weight: bold;
    white-space: nowrap;
    min-width: 60px;
  }
  .info-block .field-value {
    word-break: break-word;
  }

  /* Defeito relatado */
  .issue-block {
    border: 2px solid #000;
    border-radius: 4px;
    padding: 7px 10px;
    margin-bottom: 10px;
    font-size: 10pt;
  }
  .issue-block strong {
    display: block;
    text-transform: uppercase;
    font-size: 9pt;
    margin-bottom: 3px;
    letter-spacing: 0.5px;
  }

  /* Tabela de checklist */
  .checklist-title {
    text-align: center;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-top: 2px solid #000;
    border-bottom: 1px solid #000;
    padding: 5px 0;
    margin-bottom: 4px;
  }

  table.checklist {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  table.checklist tr.group-header td {
    background: #000;
    color: #fff;
    font-weight: bold;
    padding: 3px 6px;
    font-size: 8pt;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  table.checklist tr td {
    border-bottom: 1px solid #ddd;
    vertical-align: top;
    padding: 5px 4px;
  }
  table.checklist tr:last-child td { border-bottom: none; }

  .check-cell {
    width: 54px;
    white-space: nowrap;
    padding-top: 6px !important;
  }
  .box {
    display: inline-block;
    width: 13px;
    height: 13px;
    border: 1.5px solid #000;
    margin-right: 2px;
    border-radius: 2px;
    vertical-align: middle;
  }
  .label-cell strong { font-size: 9.5pt; }
  .label-cell small { font-size: 8pt; color: #555; display: block; margin-top: 1px; }
  .input-line { font-size: 9pt; color: #888; margin-top: 3px; letter-spacing: 2px; }

  /* Legenda das caixas */
  .legend {
    font-size: 8pt;
    border-top: 1px solid #000;
    padding-top: 5px;
    margin-top: 6px;
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .legend span { white-space: nowrap; }

  /* Assinatura */
  .signature {
    margin-top: 14px;
    border-top: 1px dashed #000;
    padding-top: 10px;
  }
  .sig-line {
    display: flex;
    gap: 10px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .sig-field {
    flex: 1;
    min-width: 100px;
    border-top: 1px solid #000;
    padding-top: 3px;
    font-size: 8pt;
    text-align: center;
    color: #555;
  }

  /* Rodapé */
  .footer {
    text-align: center;
    font-size: 8pt;
    color: #666;
    margin-top: 10px;
    border-top: 1px solid #000;
    padding-top: 6px;
  }

  /* Botão de impressão (só na tela) */
  .print-btn {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 16px 0;
  }
  .print-btn button {
    padding: 8px 20px;
    font-size: 11pt;
    cursor: pointer;
    border-radius: 6px;
    border: 1px solid #333;
    background: #111;
    color: #fff;
  }
  .print-btn button:hover { background: #333; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<div class="print-btn">
  <button onclick="window.print()">🖨️ Imprimir</button>
  <button onclick="window.close()">✕ Fechar</button>
</div>

<div class="page-wrapper">

  <!-- Cabeçalho -->
  <div class="header">
    <div class="store-name">Flavio Celulares</div>
    <h1 class="os-title">OS #${data.osNumber}</h1>
    <div class="datetime">Entrada: ${dateStr} às ${timeStr}</div>
  </div>

  <!-- Dados do cliente e aparelho -->
  <div class="info-block">
    <div class="row">
      <span class="field-label">Cliente:</span>
      <span class="field-value"><strong>${data.customerName}</strong></span>
    </div>
    <div class="row">
      <span class="field-label">Aparelho:</span>
      <span class="field-value">${data.deviceModel}${data.color ? ' · ' + data.color : ''}</span>
    </div>
    ${data.accessories.length > 0 ? `
    <div class="row">
      <span class="field-label">Acessórios:</span>
      <span class="field-value">${data.accessories.join(', ')}</span>
    </div>` : ''}
  </div>

  <!-- Defeito relatado -->
  <div class="issue-block">
    <strong>⚠ Defeito relatado:</strong>
    ${data.reportedIssue}
  </div>

  <!-- Checklist -->
  <div class="checklist-title">✓ Checklist de Recebimento</div>
  <p style="font-size:8pt;text-align:center;margin-bottom:6px;color:#555;">
    Marque cada item verificado na coluna OK / DEF / N/V
  </p>

  <table class="checklist">
    <thead>
      <tr style="background:#eee;">
        <td style="padding:3px 4px;font-size:8pt;font-weight:bold;text-align:center;">OK / DEF / N/V</td>
        <td style="padding:3px 4px;font-size:8pt;font-weight:bold;">Item</td>
      </tr>
    </thead>
    <tbody>
      ${checklistHTML}
    </tbody>
  </table>

  <!-- Legenda -->
  <div class="legend">
    <span>☐ = OK</span>
    <span>☐ = Defeito</span>
    <span>☐ = Não Verificado</span>
  </div>

  <!-- Assinaturas -->
  <div class="signature">
    <div class="sig-line">
      <div class="sig-field">Recebido por (técnico)</div>
      <div class="sig-field">Assinatura do cliente</div>
    </div>
  </div>

  <!-- Rodapé -->
  <div class="footer">
    OS #${data.osNumber} · ${dateStr} · Flavio Celulares
  </div>

</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=500,height=800');
  if (!win) { alert('Permita pop-ups para imprimir o checklist.'); return; }
  win.document.write(html);
  win.document.close();
  // Pequeno delay para garantir que imagens/estilos carregaram
  setTimeout(() => win.print(), 600);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CheckStatus = 'OK' | 'DEFEITO' | 'NAO_VERIFICADO';

interface ChecklistItem {
  id: string;
  label: string;
  group: string;
  status: CheckStatus;
  detail?: string; // texto extra (ex: porcentagem da bateria)
  hasInput?: boolean; // se true, exibe campo de texto adicional
  inputPlaceholder?: string;
  inputValue?: string;
}

// ─── Checklist iPhone ─────────────────────────────────────────────────────────
const IPHONE_CHECKLIST: Omit<ChecklistItem, 'status'>[] = [
  // Visual
  { id: 'tela',         label: 'Tela / Display',          group: 'visual',
    detail: 'Verificar manchas, pixels mortos, touch' },
  { id: 'carcaca',      label: 'Carcaça / Chassis',       group: 'visual',
    detail: 'Amassados, arranhões, cantos' },
  { id: 'vidro_traseiro',label: 'Vidro traseiro',         group: 'visual',
    detail: 'Trincado ou íntegro' },
  { id: 'camera_lente', label: 'Lente da câmera',         group: 'visual',
    detail: 'Vidro trincado ou embaçado' },
  // Funções
  { id: 'botao_lateral', label: 'Botão lateral (Sleep)',  group: 'funcao',
    detail: 'Liga, desliga, Siri' },
  { id: 'volume',        label: 'Botões de volume',       group: 'funcao',
    detail: 'VOL+ e VOL-' },
  { id: 'silencio',      label: 'Chave de silêncio',      group: 'funcao',
    detail: 'Ringer toggle' },
  { id: 'camera_frontal',label: 'Câmera frontal',         group: 'funcao',
    detail: 'Foto, vídeo, qualidade' },
  { id: 'camera_traseira',label: 'Câmera traseira',       group: 'funcao',
    detail: 'Foto, vídeo, zoom, flash' },
  { id: 'microfone',     label: 'Microfone',              group: 'funcao',
    detail: 'Ligações e gravação' },
  { id: 'alto_falante',  label: 'Alto-falante',           group: 'funcao',
    detail: 'Som, volume, distorção' },
  { id: 'fone_ouvido',   label: 'Entrada Lightning/USB-C',group: 'funcao',
    detail: 'Áudio e carregamento' },
  // Face ID / Touch ID
  { id: 'face_id',       label: 'Face ID / Touch ID',     group: 'biometria',
    detail: 'Desbloqueio biométrico' },
  { id: 'true_tone',     label: 'True Tone / Night Shift', group: 'biometria',
    detail: 'Calibração de tela' },
  // Conectividade
  { id: 'wifi',          label: 'Wi-Fi',                  group: 'conectividade',
    detail: '2.4GHz e 5GHz' },
  { id: 'bluetooth',     label: 'Bluetooth',              group: 'conectividade',
    detail: 'Pareamento de dispositivos' },
  { id: 'chip',          label: 'Chip / NanoSIM / eSIM',  group: 'conectividade',
    detail: 'Sinal de rede operadora' },
  { id: 'gps',           label: 'GPS / Localização',      group: 'conectividade',
    detail: 'Mapas e localização' },
  { id: 'nfc',           label: 'NFC / Apple Pay',        group: 'conectividade',
    detail: 'Pagamentos e NFC' },
  // Bateria e energia
  { id: 'bateria_saude', label: 'Saúde da Bateria',       group: 'bateria',
    detail: 'Configurações > Bateria > Integridade',
    hasInput: true, inputPlaceholder: 'Ex: 87%' },
  { id: 'carregamento',  label: 'Carregamento',           group: 'bateria',
    detail: 'Cabo Lightning ou USB-C' },
  { id: 'carregamento_sem_fio', label: 'MagSafe / Qi (sem fio)', group: 'bateria',
    detail: 'Carregamento wireless' },
  // Software
  { id: 'ios_versao',    label: 'Versão iOS',             group: 'software',
    hasInput: true, inputPlaceholder: 'Ex: iOS 17.4.1' },
  { id: 'icloud',        label: 'iCloud desbloqueado',    group: 'software',
    detail: 'Conta Apple sem restrição' },
  { id: 'bloqueio_ativacao', label: 'Bloqueio de ativação', group: 'software',
    detail: 'Livre de Find My iPhone' },
];

// ─── Checklist Padrão (Android / outros) ─────────────────────────────────────
const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'status'>[] = [
  // Visual
  { id: 'tela',         label: 'Tela / Display',          group: 'visual',
    detail: 'Touch, manchas, pixels mortos' },
  { id: 'carcaca',      label: 'Carcaça / Tampa',         group: 'visual',
    detail: 'Amassados, trincas, encaixe' },
  { id: 'camera_lente', label: 'Lente da câmera',         group: 'visual',
    detail: 'Vidro da lente' },
  // Funções
  { id: 'botao_power',  label: 'Botão Power',             group: 'funcao',
    detail: 'Liga e desliga' },
  { id: 'volume',       label: 'Botões de volume',        group: 'funcao',
    detail: 'VOL+ e VOL-' },
  { id: 'camera_frontal',label: 'Câmera frontal',         group: 'funcao',
    detail: 'Selfie, qualidade, flash' },
  { id: 'camera_traseira',label: 'Câmera traseira',       group: 'funcao',
    detail: 'Foto, vídeo, zoom, flash' },
  { id: 'microfone',    label: 'Microfone',               group: 'funcao',
    detail: 'Ligações e gravação' },
  { id: 'alto_falante', label: 'Alto-falante / Caixa',    group: 'funcao',
    detail: 'Volume e qualidade de som' },
  { id: 'entrada_fone', label: 'P2 / USB-C (fone)',       group: 'funcao',
    detail: 'Saída de áudio' },
  // Biometria
  { id: 'biometria',    label: 'Digital / Biometria',     group: 'biometria',
    detail: 'Leitor de impressão digital' },
  { id: 'reconhecimento_facial', label: 'Reconhecimento facial', group: 'biometria',
    detail: 'Desbloqueio por rosto' },
  // Conectividade
  { id: 'wifi',         label: 'Wi-Fi',                   group: 'conectividade',
    detail: '2.4GHz e 5GHz' },
  { id: 'bluetooth',    label: 'Bluetooth',               group: 'conectividade',
    detail: 'Pareamento' },
  { id: 'chip',         label: 'Sinal / Chip',            group: 'conectividade',
    detail: 'SIM e rede operadora' },
  { id: 'gps',          label: 'GPS / Localização',       group: 'conectividade',
    detail: 'Precisão de localização' },
  { id: 'nfc',          label: 'NFC',                     group: 'conectividade',
    detail: 'Pagamento aproximação' },
  { id: 'usb_dados',    label: 'USB (transferência)',      group: 'conectividade',
    detail: 'Reconhecimento no PC' },
  // Bateria
  { id: 'bateria',      label: 'Bateria',                 group: 'bateria',
    detail: 'Autonomia e saúde geral' },
  { id: 'carregamento', label: 'Carregamento',            group: 'bateria',
    detail: 'Cabo USB-C / Micro-USB' },
  { id: 'carregamento_sem_fio', label: 'Carregamento sem fio', group: 'bateria',
    detail: 'Qi wireless (se suportar)' },
  // Software
  { id: 'versao_android', label: 'Versão Android / SO',  group: 'software',
    hasInput: true, inputPlaceholder: 'Ex: Android 14' },
  { id: 'conta_google', label: 'Conta Google desbloqueada', group: 'software',
    detail: 'Sem FRP / Factory Reset Protection' },
];

const GROUP_LABELS: Record<string, string> = {
  visual:        '👁️ Visual',
  funcao:        '⚙️ Funções',
  biometria:     '🔐 Biometria',
  conectividade: '📶 Conectividade',
  bateria:       '🔋 Bateria & Energia',
  software:      '📱 Software',
};

// ─── Acessórios ───────────────────────────────────────────────────────────────
const ACCESSORY_OPTIONS = [
  'Capa protetora', 'Película', 'Carregador', 'Cabo USB',
  'Fone de ouvido', 'Chip', 'Caixa original', 'Nota fiscal',
  'Cartão de memória', 'Pen drive', 'Manual',
];

// ─── Etapas ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Cliente',   icon: User },
  { id: 2, label: 'Aparelho',  icon: Smartphone },
  { id: 3, label: 'Checklist', icon: ClipboardList },
];

// ─── Detecta se é iPhone ──────────────────────────────────────────────────────
function isIphone(model: string) {
  return /iphone/i.test(model);
}

function buildChecklist(model: string): ChecklistItem[] {
  const base = isIphone(model) ? IPHONE_CHECKLIST : DEFAULT_CHECKLIST;
  return base.map(i => ({ ...i, status: 'NAO_VERIFICADO' as CheckStatus, inputValue: '' }));
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NovaOrdemPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Etapa 1
  const [customers, setCustomers]         = useState<any[]>([]);
  const [search, setSearch]               = useState('');
  const [customerId, setCustomerId]       = useState('');
  const [customerName, setCustomerName]   = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName]             = useState('');
  const [newCpf, setNewCpf]              = useState('');
  const [newPhone, setNewPhone]           = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Etapa 2
  const [deviceModel, setDeviceModel]     = useState('');
  const [deviceBrand, setDeviceBrand]     = useState('');
  const [color, setColor]                 = useState('');
  const [accessories, setAccessories]     = useState<string[]>([]);
  const [reportedIssue, setReportedIssue] = useState('');

  // Etapa 3
  const [checklist, setChecklist]         = useState<ChecklistItem[]>([]);
  const [checklistType, setChecklistType] = useState<'iphone' | 'android'>('android');

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [createdOS, setCreatedOS]         = useState<{ id: string; number: number } | null>(null);

  // Carrega clientes
  useEffect(() => {
    fetch('/api/customers?pageSize=200')
      .then(r => r.json())
      .then(d => setCustomers(d.data || []))
      .catch(() => {});
  }, []);

  // Reconstrói checklist quando modelo muda
  useEffect(() => {
    if (!deviceModel) return;
    const tipo = isIphone(deviceModel) ? 'iphone' : 'android';
    setChecklistType(tipo);
    setChecklist(buildChecklist(deviceModel));
  }, [deviceModel]);

  // Inicializa checklist vazio na montagem
  useEffect(() => {
    setChecklist(buildChecklist(''));
  }, []);

  const filteredCustomers = customers.filter(c =>
    `${c.name} ${c.cpf ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  // Criar cliente rápido
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

  const toggleAccessory = (item: string) =>
    setAccessories(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );

  // Ciclo de status
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

  // Atualiza campo de input adicional
  const setItemInputValue = (id: string, value: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, inputValue: value } : item
    ));
  };

  // Muda tipo de checklist manualmente
  const switchChecklistType = (type: 'iphone' | 'android') => {
    setChecklistType(type);
    const fakeModel = type === 'iphone' ? 'iPhone' : 'Android';
    setChecklist(buildChecklist(fakeModel));
  };

  const statusColor: Record<CheckStatus, string> = {
    OK:             'bg-emerald-500/15 border-emerald-500/50 text-emerald-300',
    DEFEITO:        'bg-red-500/15 border-red-500/50 text-red-300',
    NAO_VERIFICADO: 'bg-slate-800/80 border-slate-700 text-slate-400',
  };

  const statusLabel: Record<CheckStatus, string> = {
    OK:             '✓ OK',
    DEFEITO:        '✗ Defeito',
    NAO_VERIFICADO: '— N/V',
  };

  const statusDot: Record<CheckStatus, string> = {
    OK:             'bg-emerald-400',
    DEFEITO:        'bg-red-400',
    NAO_VERIFICADO: 'bg-slate-600',
  };

  const canProceed = () => {
    if (step === 1) return !!customerId;
    if (step === 2) return !!deviceModel.trim() && !!reportedIssue.trim();
    return true;
  };

  // Enviar OS
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Monta itens do checklist incluindo inputs extras
      const checklistItems = checklist
        .filter(i => i.status !== 'NAO_VERIFICADO')
        .map(i => ({
          label: i.inputValue
            ? `${i.label}: ${i.inputValue}`
            : i.label,
          result: i.status,
        }));

      // Adiciona inputs preenchidos mesmo se N/V
      const extraInputItems = checklist
        .filter(i => i.hasInput && i.inputValue && i.status === 'NAO_VERIFICADO')
        .map(i => ({ label: `${i.label}: ${i.inputValue}`, result: 'OK' as const }));

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
          checklistItems: [...checklistItems, ...extraInputItems],
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error?.message || 'Erro ao criar OS'); return; }

      const osNum = data.serviceOrder?.sequentialNumber;
      const osId  = data.serviceOrder?.id;

      toast.success(`OS #${osNum} criada! Preparando impressão...`);
      setCreatedOS({ id: osId, number: osNum });

      // Imprime automaticamente
      printChecklist({
        osNumber:     osNum,
        customerName: customerName,
        deviceModel:  deviceModel,
        color:        color,
        accessories:  accessories,
        reportedIssue: reportedIssue,
        checklist:    checklist,
        createdAt:    new Date(),
      });

      // Aguarda 1.5s para o usuário ver o toast, depois redireciona
      setTimeout(() => router.push(`/ordens/${osId}`), 1500);
    } catch { toast.error('Erro de conexão'); }
    finally { setIsSubmitting(false); }
  };

  // Estatísticas do checklist
  const ckOk      = checklist.filter(i => i.status === 'OK').length;
  const ckDefeito = checklist.filter(i => i.status === 'DEFEITO').length;
  const ckNv      = checklist.filter(i => i.status === 'NAO_VERIFICADO').length;

  // Grupos com itens
  const groups = Object.entries(GROUP_LABELS).filter(([group]) =>
    checklist.some(i => i.group === group)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link href="/ordens" className="btn-ghost btn-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Nova Ordem de Serviço</h1>
          <p className="text-xs text-slate-400">Preencha as 3 etapas rapidamente</p>
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

      {/* ── ETAPA 1: CLIENTE ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            Quem é o cliente?
          </h2>

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

          {customerId && (
            <div className="flex items-center gap-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {customerName[0]?.toUpperCase()}
              </div>
              <span className="text-white font-medium">{customerName}</span>
              <Check className="h-4 w-4 text-emerald-400 ml-auto" />
            </div>
          )}

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

      {/* ── ETAPA 2: APARELHO ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-indigo-400" />
            Dados do aparelho
          </h2>

          <div>
            <label className="label">Modelo do aparelho *</label>
            <input
              autoFocus
              type="text"
              className="input"
              placeholder="Ex: iPhone 15 Pro, Galaxy S24, Moto G84..."
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
            />
            {deviceModel && (
              <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${isIphone(deviceModel) ? 'text-blue-400' : 'text-slate-400'}`}>
                {isIphone(deviceModel)
                  ? '🍎 Checklist completo para iPhone será aplicado automaticamente'
                  : '🤖 Checklist padrão para Android / outros será aplicado'}
              </p>
            )}
          </div>

          <div>
            <label className="label">Cor (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {['Preto', 'Branco', 'Azul', 'Dourado', 'Rosa', 'Roxo', 'Verde', 'Cinza'].map(c => (
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
                placeholder="Outra cor..."
                className="input text-xs py-1.5 w-24"
                value={['Preto', 'Branco', 'Azul', 'Dourado', 'Rosa', 'Roxo', 'Verde', 'Cinza'].includes(color) ? '' : color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
          </div>

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

          <div>
            <label className="label">Defeito relatado pelo cliente *</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Descreva o problema relatado. Ex: Tela quebrada após queda, não carrega mais, bateria dura pouco..."
              value={reportedIssue}
              onChange={e => setReportedIssue(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── ETAPA 3: CHECKLIST ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="card p-5 space-y-5">

          {/* Cabeçalho do checklist */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-400" />
                Checklist de recebimento
              </h2>
              {/* Toggle iPhone / Android */}
              <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                <button
                  onClick={() => switchChecklistType('iphone')}
                  className={`px-3 py-1.5 transition-colors ${checklistType === 'iphone' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  🍎 iPhone
                </button>
                <button
                  onClick={() => switchChecklistType('android')}
                  className={`px-3 py-1.5 transition-colors ${checklistType === 'android' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  🤖 Android
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Toque 1× <span className="text-emerald-400 mx-1 font-semibold">OK</span>
              · Toque 2× <span className="text-red-400 mx-1 font-semibold">Defeito</span>
              · Toque 3× <span className="text-slate-400 mx-1">N/V</span>
            </p>
          </div>

          {/* Resumo de progresso */}
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400 text-xs font-semibold">{ckOk} OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
              <span className="text-red-400 text-xs font-semibold">{ckDefeito} Defeito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600 inline-block" />
              <span className="text-slate-500 text-xs">{ckNv} N/V</span>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setChecklist(prev => prev.map(i => ({ ...i, status: 'OK' as CheckStatus })))}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Marcar tudo OK
              </button>
            </div>
          </div>

          {/* Grupos */}
          <div className="space-y-5">
            {groups.map(([group, groupLabel]) => {
              const items = checklist.filter(i => i.group === group);
              return (
                <div key={group}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    {groupLabel}
                  </p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className={`rounded-xl border transition-all ${statusColor[item.status]}`}>
                        <button
                          type="button"
                          onClick={() => cycleStatus(item.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          {/* Dot */}
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${statusDot[item.status]}`} />

                          {/* Texto */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{item.label}</p>
                            {item.detail && (
                              <p className="text-[11px] opacity-60 mt-0.5 leading-snug">{item.detail}</p>
                            )}
                          </div>

                          {/* Badge de status */}
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'OK'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : item.status === 'DEFEITO'
                                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                : 'bg-slate-700/50 border-slate-600 text-slate-500'
                          }`}>
                            {statusLabel[item.status]}
                          </span>
                        </button>

                        {/* Campo de input adicional (ex: % bateria, versão iOS) */}
                        {item.hasInput && (
                          <div className="px-4 pb-3">
                            <input
                              type="text"
                              placeholder={item.inputPlaceholder || 'Informe o valor...'}
                              className="input text-sm py-1.5"
                              value={item.inputValue || ''}
                              onClick={e => e.stopPropagation()}
                              onChange={e => setItemInputValue(item.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bateria iPhone — destaque especial */}
          {checklistType === 'iphone' && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex items-start gap-3">
              <Battery className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300 leading-relaxed">
                <span className="font-semibold block mb-0.5">Como verificar saúde da bateria no iPhone:</span>
                Ajustes → Bateria → Integridade e Carregamento da Bateria → veja a porcentagem de capacidade máxima.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegação */}
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
          <div className="flex items-center gap-2">
            {/* Botão reimprimir (aparece após criar OS) */}
            {createdOS && (
              <button
                onClick={() => printChecklist({
                  osNumber:     createdOS.number,
                  customerName: customerName,
                  deviceModel:  deviceModel,
                  color:        color,
                  accessories:  accessories,
                  reportedIssue: reportedIssue,
                  checklist:    checklist,
                  createdAt:    new Date(),
                })}
                className="btn-secondary flex items-center gap-1.5"
                title="Reimprimir checklist"
              >
                <Printer className="h-4 w-4" />
                Reimprimir
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Check className="h-4 w-4 mr-1" /> Abrir OS + Imprimir</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
