'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, ArrowRight, Check, User, Smartphone,
  ClipboardList, Plus, Search, X, ChevronRight, Battery, Info, Printer
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CheckStatus = 'OK' | 'DEFEITO' | 'NAO_VERIFICADO';

interface ChecklistItem {
  id: string;
  label: string;
  group: string;
  status: CheckStatus;
  okLabel: string;
  defeitoLabel: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
}

// ─── Checklist iPhone ─────────────────────────────────────────────────────────
const IPHONE_CHECKLIST: Omit<ChecklistItem, 'status'>[] = [
  // Visual
  {
    id: 'carcaca',
    label: 'Carcaça / Chassis',
    group: 'visual',
    okLabel: 'Carcaça OK (sem riscos ou amassados)',
    defeitoLabel: 'Carcaça avariada com risco e amassado',
  },
  {
    id: 'tela',
    label: 'Tela / Display',
    group: 'visual',
    okLabel: 'Tela OK (touch 100%, sem manchas ou riscos)',
    defeitoLabel: 'Tela avariada (trincada, com manchas ou falha no touch)',
  },
  {
    id: 'vidro_traseiro',
    label: 'Vidro traseiro',
    group: 'visual',
    okLabel: 'Vidro traseiro OK (íntegro, sem trincas)',
    defeitoLabel: 'Vidro traseiro quebrado / trincado',
  },
  {
    id: 'camera_lente',
    label: 'Lente da câmera',
    group: 'visual',
    okLabel: 'Lente da câmera OK (sem trinca ou risco)',
    defeitoLabel: 'Lente trincada, riscada ou embaçada',
  },
  // Funções
  {
    id: 'botao_lateral',
    label: 'Botão lateral (Sleep / Siri)',
    group: 'funcao',
    okLabel: 'Botão lateral OK (clique normal)',
    defeitoLabel: 'Botão lateral preso / duro / sem resposta',
  },
  {
    id: 'volume',
    label: 'Botões de volume',
    group: 'funcao',
    okLabel: 'Botões de volume OK (VOL+ e VOL- normais)',
    defeitoLabel: 'Botão de volume emperrado / sem resposta',
  },
  {
    id: 'silencio',
    label: 'Chave de silêncio (Mute)',
    group: 'funcao',
    okLabel: 'Chave de silêncio OK (vibra normalmente)',
    defeitoLabel: 'Chave de silêncio frouxa / com falha',
  },
  {
    id: 'camera_frontal',
    label: 'Câmera frontal',
    group: 'funcao',
    okLabel: 'Câmera frontal OK (imagem nítida)',
    defeitoLabel: 'Câmera frontal com defeito (embaçada ou tela preta)',
  },
  {
    id: 'camera_traseira',
    label: 'Câmera traseira',
    group: 'funcao',
    okLabel: 'Câmera traseira OK (foco, zoom e flash 100%)',
    defeitoLabel: 'Câmera traseira com defeito (sem foco, manchas ou tela preta)',
  },
  {
    id: 'microfone',
    label: 'Microfone',
    group: 'funcao',
    okLabel: 'Microfone OK (áudio nítido nas ligações e áudios)',
    defeitoLabel: 'Microfone com defeito (baixo, chiado ou mudo)',
  },
  {
    id: 'alto_falante',
    label: 'Alto-falante / Auricular',
    group: 'funcao',
    okLabel: 'Alto-falantes OK (som limpo e potente)',
    defeitoLabel: 'Alto-falante com som rouco, chiando ou mudo',
  },
  {
    id: 'fone_ouvido',
    label: 'Conector Lightning / USB-C',
    group: 'funcao',
    okLabel: 'Conector OK (carrega firme e transfere dados)',
    defeitoLabel: 'Conector com mau contato / folga / não carrega',
  },
  // Biometria
  {
    id: 'face_id',
    label: 'Face ID / Touch ID',
    group: 'biometria',
    okLabel: 'Biometria OK (cadastra e desbloqueia perfeitamente)',
    defeitoLabel: 'Face ID desativado / Touch ID com falha',
  },
  {
    id: 'true_tone',
    label: 'True Tone / Sensor de Presença',
    group: 'biometria',
    okLabel: 'True Tone e sensor de proximidade OK',
    defeitoLabel: 'Sem True Tone / sensor não apaga a tela na chamada',
  },
  // Conectividade
  {
    id: 'wifi',
    label: 'Wi-Fi',
    group: 'conectividade',
    okLabel: 'Wi-Fi OK (conecta e navega com velocidade)',
    defeitoLabel: 'Wi-Fi fraco, desconectando ou não ativa',
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    group: 'conectividade',
    okLabel: 'Bluetooth OK (localiza e conecta acessórios)',
    defeitoLabel: 'Bluetooth com falha / não localiza dispositivos',
  },
  {
    id: 'chip',
    label: 'Chip / eSIM / Sinal de Rede',
    group: 'conectividade',
    okLabel: 'Sinal de operadora OK (faz e recebe chamadas)',
    defeitoLabel: 'Sem serviço / buscando sinal / não lê chip',
  },
  {
    id: 'gps',
    label: 'GPS / Localização',
    group: 'conectividade',
    okLabel: 'GPS OK (localização exata no mapa)',
    defeitoLabel: 'GPS impreciso ou sem sinal',
  },
  {
    id: 'nfc',
    label: 'NFC / Apple Pay',
    group: 'conectividade',
    okLabel: 'NFC OK (pagamento por aproximação funciona)',
    defeitoLabel: 'NFC com falha / aproximação não responde',
  },
  // Bateria
  {
    id: 'bateria_saude',
    label: 'Saúde da Bateria',
    group: 'bateria',
    okLabel: 'Saúde da bateria boa (acima de 80%)',
    defeitoLabel: 'Bateria degradada / manutenção recomendada (< 80%)',
    hasInput: true,
    inputPlaceholder: 'Informe a % da saúde (ex: 87%)',
  },
  {
    id: 'carregamento',
    label: 'Carregamento por cabo',
    group: 'bateria',
    okLabel: 'Carregando por cabo normalmente',
    defeitoLabel: 'Não carrega no cabo / carga intermitente',
  },
  {
    id: 'carregamento_sem_fio',
    label: 'MagSafe / Qi (sem fio)',
    group: 'bateria',
    okLabel: 'Carregamento sem fio OK',
    defeitoLabel: 'Carregamento sem fio não detectado',
  },
  // Software
  {
    id: 'ios_versao',
    label: 'Versão do iOS',
    group: 'software',
    okLabel: 'Sistema iOS OK e estável',
    defeitoLabel: 'iOS travando / reiniciando em loop / com erros',
    hasInput: true,
    inputPlaceholder: 'Ex: iOS 17.4.1',
  },
  {
    id: 'icloud',
    label: 'iCloud / Conta Apple',
    group: 'software',
    okLabel: 'iCloud liberado / livre de restrições',
    defeitoLabel: 'iCloud bloqueado / Find My ativo (necessário desativar)',
  },
  {
    id: 'bloqueio_ativacao',
    label: 'Bloqueio de Ativação',
    group: 'software',
    okLabel: 'Sem tela de bloqueio de ativação',
    defeitoLabel: 'Aparelho bloqueado na tela de ativação',
  },
];

// ─── Checklist Padrão (Android / outros) ─────────────────────────────────────
const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'status'>[] = [
  // Visual
  {
    id: 'carcaca',
    label: 'Carcaça / Tampa Traseira',
    group: 'visual',
    okLabel: 'Carcaça OK (sem riscos ou amassados)',
    defeitoLabel: 'Carcaça avariada com risco e amassado',
  },
  {
    id: 'tela',
    label: 'Tela / Display',
    group: 'visual',
    okLabel: 'Tela OK (touch 100%, sem manchas ou riscos)',
    defeitoLabel: 'Tela avariada (trincada, com manchas ou falha no touch)',
  },
  {
    id: 'camera_lente',
    label: 'Lente da câmera',
    group: 'visual',
    okLabel: 'Lente da câmera OK (sem trinca ou risco)',
    defeitoLabel: 'Lente trincada, riscada ou embaçada',
  },
  // Funções
  {
    id: 'botao_power',
    label: 'Botão Power',
    group: 'funcao',
    okLabel: 'Botão Power OK (clique normal)',
    defeitoLabel: 'Botão Power emperrado / sem resposta',
  },
  {
    id: 'volume',
    label: 'Botões de volume',
    group: 'funcao',
    okLabel: 'Botões de volume OK (VOL+ e VOL- normais)',
    defeitoLabel: 'Botão de volume travado / duro / sem resposta',
  },
  {
    id: 'camera_frontal',
    label: 'Câmera frontal',
    group: 'funcao',
    okLabel: 'Câmera frontal OK (imagem nítida)',
    defeitoLabel: 'Câmera frontal com defeito (embaçada ou tela preta)',
  },
  {
    id: 'camera_traseira',
    label: 'Câmera traseira',
    group: 'funcao',
    okLabel: 'Câmera traseira OK (foco, zoom e flash 100%)',
    defeitoLabel: 'Câmera traseira com defeito (sem foco, manchas ou tela preta)',
  },
  {
    id: 'microfone',
    label: 'Microfone',
    group: 'funcao',
    okLabel: 'Microfone OK (áudio nítido nas ligações e gravações)',
    defeitoLabel: 'Microfone com defeito (baixo, chiado ou mudo)',
  },
  {
    id: 'alto_falante',
    label: 'Alto-falante / Auricular',
    group: 'funcao',
    okLabel: 'Alto-falantes OK (som limpo e potente)',
    defeitoLabel: 'Alto-falante com som rouco, chiando ou mudo',
  },
  {
    id: 'entrada_fone',
    label: 'Entrada P2 / Fone',
    group: 'funcao',
    okLabel: 'Entrada de fone OK',
    defeitoLabel: 'Entrada de fone com defeito / chiado / sem áudio',
  },
  // Biometria
  {
    id: 'biometria',
    label: 'Digital / Biometria',
    group: 'biometria',
    okLabel: 'Leitor de digital OK (reconhece e desbloqueia)',
    defeitoLabel: 'Leitor de digital com falha / não reconhece',
  },
  {
    id: 'reconhecimento_facial',
    label: 'Reconhecimento Facial',
    group: 'biometria',
    okLabel: 'Reconhecimento facial OK',
    defeitoLabel: 'Reconhecimento facial com falha',
  },
  // Conectividade
  {
    id: 'wifi',
    label: 'Wi-Fi',
    group: 'conectividade',
    okLabel: 'Wi-Fi OK (conecta e navega normal)',
    defeitoLabel: 'Wi-Fi fraco, desconectando ou não ativa',
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    group: 'conectividade',
    okLabel: 'Bluetooth OK (localiza e conecta dispositivos)',
    defeitoLabel: 'Bluetooth com falha / não localiza dispositivos',
  },
  {
    id: 'chip',
    label: 'Sinal de Rede / Chip SIM',
    group: 'conectividade',
    okLabel: 'Sinal de operadora OK (faz e recebe chamadas)',
    defeitoLabel: 'Sem serviço / buscando sinal / não lê chip',
  },
  {
    id: 'gps',
    label: 'GPS / Localização',
    group: 'conectividade',
    okLabel: 'GPS OK (localização exata no mapa)',
    defeitoLabel: 'GPS impreciso ou sem sinal',
  },
  {
    id: 'nfc',
    label: 'NFC',
    group: 'conectividade',
    okLabel: 'NFC OK (pagamento por aproximação funciona)',
    defeitoLabel: 'NFC com falha / leitura não responde',
  },
  {
    id: 'usb_dados',
    label: 'Conector USB / Carga',
    group: 'conectividade',
    okLabel: 'Conector OK (carrega firme e transfere dados)',
    defeitoLabel: 'Conector com mau contato / folga / não carrega',
  },
  // Bateria
  {
    id: 'bateria',
    label: 'Bateria',
    group: 'bateria',
    okLabel: 'Bateria saudável (boa autonomia)',
    defeitoLabel: 'Bateria descarregando rápido / esquentando / inchada',
  },
  {
    id: 'carregamento_sem_fio',
    label: 'Carregamento sem fio',
    group: 'bateria',
    okLabel: 'Carregamento sem fio OK',
    defeitoLabel: 'Carregamento sem fio não detectado',
  },
  // Software
  {
    id: 'versao_android',
    label: 'Versão do Android',
    group: 'software',
    okLabel: 'Sistema Android OK e estável',
    defeitoLabel: 'Android travando / reiniciando / com erros',
    hasInput: true,
    inputPlaceholder: 'Ex: Android 14',
  },
  {
    id: 'conta_google',
    label: 'Conta Google (FRP)',
    group: 'software',
    okLabel: 'Conta Google liberada (sem bloqueio FRP)',
    defeitoLabel: 'Bloqueio FRP ativo — requer senha da conta Google',
  },
];

const GROUP_LABELS: Record<string, string> = {
  visual:        '👁️ Visual & Carcaça',
  funcao:        '⚙️ Funções & Áudio',
  biometria:     '🔐 Biometria & Sensores',
  conectividade: '📶 Conectividade & Redes',
  bateria:       '🔋 Bateria & Carga',
  software:      '📱 Software & Contas',
};

// ─── Acessórios ───────────────────────────────────────────────────────────────
const ACCESSORY_OPTIONS = [
  'Capa protetora', 'Película', 'Carregador', 'Cabo USB',
  'Fone de ouvido', 'Chip', 'Caixa original', 'Nota fiscal',
  'Cartão de memória', 'Pen drive',
];

// ─── Etapas ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Cliente',   icon: User },
  { id: 2, label: 'Aparelho',  icon: Smartphone },
  { id: 3, label: 'Checklist', icon: ClipboardList },
];

function isIphone(model: string) {
  return /iphone/i.test(model);
}

function buildChecklist(model: string): ChecklistItem[] {
  const base = isIphone(model) ? IPHONE_CHECKLIST : DEFAULT_CHECKLIST;
  return base.map(i => ({ ...i, status: 'NAO_VERIFICADO' as CheckStatus, inputValue: '' }));
}

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

  const GROUP_LABELS_PRINT: Record<string, string> = {
    visual: 'VISUAL & CARCAÇA',
    funcao: 'FUNÇÕES & ÁUDIO',
    biometria: 'BIOMETRIA & SENSORES',
    conectividade: 'CONECTIVIDADE & REDES',
    bateria: 'BATERIA & CARGA',
    software: 'SOFTWARE & CONTAS',
  };

  const groups = Object.keys(GROUP_LABELS_PRINT).filter(g =>
    data.checklist.some(i => i.group === g)
  );

  const checklistHTML = groups.map(group => {
    const items = data.checklist.filter(i => i.group === group);
    const rows = items.map(item => {
      let statusHtml = '';
      if (item.status === 'OK') {
        statusHtml = `<span style="display:inline-block;padding:2px 5px;background:#dcfce7;color:#166534;font-weight:bold;border-radius:3px;font-size:8pt;">✓ OK</span>`;
      } else if (item.status === 'DEFEITO') {
        statusHtml = `<span style="display:inline-block;padding:2px 5px;background:#fee2e2;color:#991b1b;font-weight:bold;border-radius:3px;font-size:8pt;">✗ AVARIADO</span>`;
      } else {
        statusHtml = `<span style="display:inline-block;border:1px solid #444;width:12px;height:12px;margin-right:2px;vertical-align:middle;"></span> OK &nbsp; <span style="display:inline-block;border:1px solid #444;width:12px;height:12px;margin-right:2px;vertical-align:middle;"></span> Def &nbsp; <span style="display:inline-block;border:1px solid #444;width:12px;height:12px;margin-right:2px;vertical-align:middle;"></span> N/V`;
      }

      const activeText = item.status === 'OK' 
        ? `<div style="font-size:8pt;color:#15803d;font-weight:600;margin-top:2px;">${item.okLabel}</div>`
        : item.status === 'DEFEITO'
        ? `<div style="font-size:8pt;color:#b91c1c;font-weight:bold;margin-top:2px;">⚠️ ${item.defeitoLabel}</div>`
        : `<div style="font-size:7.5pt;color:#666;margin-top:2px;">OK: ${item.okLabel} | Def: ${item.defeitoLabel}</div>`;

      const extraInput = item.inputValue 
        ? `<div style="font-size:8pt;color:#1e3a8a;margin-top:2px;font-weight:600;">Valor anotado: ${item.inputValue}</div>`
        : (item.hasInput && item.status === 'NAO_VERIFICADO')
        ? `<div style="font-size:8pt;color:#888;margin-top:3px;">${item.inputPlaceholder || 'Obs'}: ___________________</div>`
        : '';

      return `
        <tr>
          <td style="width:75px;vertical-align:top;padding:5px 4px;border-bottom:1px solid #e5e7eb;">
            ${statusHtml}
          </td>
          <td style="vertical-align:top;padding:5px 4px;border-bottom:1px solid #e5e7eb;">
            <strong style="font-size:9pt;color:#111;">${item.label}</strong>
            ${activeText}
            ${extraInput}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <tr style="background:#1e293b;">
        <td colspan="2" style="color:#fff;font-weight:bold;padding:4px 6px;font-size:8pt;letter-spacing:0.5px;text-transform:uppercase;">
          ${GROUP_LABELS_PRINT[group]}
        </td>
      </tr>
      ${rows}
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Checklist OS #${data.osNumber} - Flavio Celulares</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
    color: #000;
    background: #fff;
  }
  @media print and (max-width: 90mm) {
    @page { size: 80mm auto; margin: 3mm; }
    body { font-size: 8.5pt; }
    .page-wrapper { width: 72mm; padding: 2mm; }
    h1.os-title { font-size: 13pt; }
  }
  @media print and (min-width: 91mm) {
    @page { size: A4; margin: 12mm 15mm; }
    body { font-size: 10pt; }
    .page-wrapper { max-width: 170mm; margin: 0 auto; padding: 8px; }
    h1.os-title { font-size: 17pt; }
  }
  .page-wrapper {
    max-width: 380px;
    margin: 0 auto;
    padding: 10px;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .header .store-name {
    font-size: 12pt;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  h1.os-title {
    font-size: 15pt;
    font-weight: 900;
    margin: 3px 0;
  }
  .datetime {
    font-size: 8.5pt;
    color: #444;
  }
  .info-block {
    border: 1px solid #000;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 8px;
    font-size: 9pt;
  }
  .info-block .row {
    display: flex;
    gap: 4px;
    margin-bottom: 2px;
  }
  .info-block .row:last-child { margin-bottom: 0; }
  .info-block .field-label {
    font-weight: bold;
    min-width: 65px;
  }
  .issue-block {
    border: 2px solid #000;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 8px;
    font-size: 9pt;
  }
  .checklist-title {
    text-align: center;
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    padding: 4px 0;
    margin-bottom: 6px;
  }
  table.checklist {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  .signature {
    margin-top: 14px;
    border-top: 1px dashed #000;
    padding-top: 8px;
  }
  .sig-line {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .sig-field {
    flex: 1;
    border-top: 1px solid #000;
    padding-top: 3px;
    font-size: 7.5pt;
    text-align: center;
    color: #333;
  }
  .footer {
    text-align: center;
    font-size: 7.5pt;
    color: #666;
    margin-top: 8px;
    border-top: 1px solid #ccc;
    padding-top: 4px;
  }
  .print-btn {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 14px 0;
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
  <button onclick="window.print()">🖨️ Imprimir Checklist</button>
  <button onclick="window.close()" style="background:#fff;color:#000;">✕ Fechar</button>
</div>

<div class="page-wrapper">
  <div class="header">
    <div class="store-name">Flavio Celulares</div>
    <h1 class="os-title">OS #${data.osNumber}</h1>
    <div class="datetime">Entrada: ${dateStr} às ${timeStr}</div>
  </div>

  <div class="info-block">
    <div class="row">
      <span class="field-label">Cliente:</span>
      <span><strong>${data.customerName}</strong></span>
    </div>
    <div class="row">
      <span class="field-label">Aparelho:</span>
      <span>${data.deviceModel}${data.color ? ' · ' + data.color : ''}</span>
    </div>
    ${data.accessories.length > 0 ? `
    <div class="row">
      <span class="field-label">Acessórios:</span>
      <span>${data.accessories.join(', ')}</span>
    </div>` : ''}
  </div>

  <div class="issue-block">
    <strong>⚠ DEFEITO RELATADO:</strong><br>
    ${data.reportedIssue}
  </div>

  <div class="checklist-title">✓ Checklist Detalhado de Recebimento</div>

  <table class="checklist">
    <tbody>
      ${checklistHTML}
    </tbody>
  </table>

  <div class="signature">
    <div class="sig-line">
      <div class="sig-field">Recebido por (Técnico)</div>
      <div class="sig-field">Assinatura do Cliente</div>
    </div>
  </div>

  <div class="footer">
    Flavio Celulares · OS #${data.osNumber} · ${dateStr}
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=520,height=820');
  if (!win) { alert('Permita pop-ups no navegador para imprimir o checklist.'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function NovaOrdemPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Etapa 1: Cliente
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

  // Etapa 2: Aparelho
  const [deviceModel, setDeviceModel]     = useState('');
  const [deviceBrand, setDeviceBrand]     = useState('');
  const [color, setColor]                 = useState('');
  const [accessories, setAccessories]     = useState<string[]>([]);
  const [reportedIssue, setReportedIssue] = useState('');

  // Etapa 3: Checklist
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

  // Atualiza status do item diretamente
  const setItemStatus = (id: string, status: CheckStatus) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  // Ciclo de status ao clicar no card
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
    OK:             'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    DEFEITO:        'bg-red-500/10 border-red-500/40 text-red-300',
    NAO_VERIFICADO: 'bg-slate-800/80 border-slate-700/80 text-slate-300',
  };

  const statusDot: Record<CheckStatus, string> = {
    OK:             'bg-emerald-400 ring-2 ring-emerald-400/20',
    DEFEITO:        'bg-red-400 ring-2 ring-red-400/20',
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
      // Monta itens do checklist com descrição rica e contextual
      const checklistItems = checklist
        .filter(i => i.status !== 'NAO_VERIFICADO')
        .map(i => {
          const statusDesc = i.status === 'OK' ? i.okLabel : i.defeitoLabel;
          const fullLabel = i.inputValue
            ? `${i.label} - ${statusDesc} (${i.inputValue})`
            : `${i.label} - ${statusDesc}`;
          return {
            label: fullLabel,
            result: i.status,
            notes: statusDesc,
          };
        });

      // Adiciona inputs preenchidos mesmo se N/V
      const extraInputItems = checklist
        .filter(i => i.hasInput && i.inputValue && i.status === 'NAO_VERIFICADO')
        .map(i => ({
          label: `${i.label} (${i.inputValue})`,
          result: 'OK' as const,
          notes: i.inputValue,
        }));

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

      toast.success(`OS #${osNum} aberta com sucesso!`);
      setCreatedOS({ id: osId, number: osNum });

      // Imprime automaticamente o checklist
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

      setTimeout(() => router.push(`/ordens/${osId}`), 1500);
    } catch { toast.error('Erro de conexão ao salvar OS'); }
    finally { setIsSubmitting(false); }
  };

  const ckOk      = checklist.filter(i => i.status === 'OK').length;
  const ckDefeito = checklist.filter(i => i.status === 'DEFEITO').length;
  const ckNv      = checklist.filter(i => i.status === 'NAO_VERIFICADO').length;

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
          <p className="text-xs text-slate-400">Preencha as 3 etapas para registrar o aparelho</p>
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
                  ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' :
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
              placeholder="Ex: iPhone 13 Pro, Galaxy S23, Moto G84..."
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
            />
            {deviceModel && (
              <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${isIphone(deviceModel) ? 'text-blue-400' : 'text-slate-400'}`}>
                {isIphone(deviceModel)
                  ? '🍎 Checklist completo para iPhone selecionado automaticamente'
                  : '🤖 Checklist completo para Android selecionado automaticamente'}
              </p>
            )}
          </div>

          <div>
            <label className="label">Cor (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {['Preto', 'Branco', 'Azul', 'Dourado', 'Rosa', 'Roxo', 'Verde', 'Cinza', 'Prata'].map(c => (
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
                value={['Preto', 'Branco', 'Azul', 'Dourado', 'Rosa', 'Roxo', 'Verde', 'Cinza', 'Prata'].includes(color) ? '' : color}
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
              placeholder="Descreva com clareza o problema relatado. Ex: Tela quebrou após queda, touch não responde, não carrega mais..."
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
                Checklist de Entrada
              </h2>
              {/* Alternador manual de checklist */}
              <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
                <button
                  onClick={() => switchChecklistType('iphone')}
                  className={`px-3 py-1.5 transition-colors ${checklistType === 'iphone' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  🍎 iPhone
                </button>
                <button
                  onClick={() => switchChecklistType('android')}
                  className={`px-3 py-1.5 transition-colors ${checklistType === 'android' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                >
                  🤖 Android
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Clique nos botões de cada item ou toque no card para alternar: <strong>OK</strong> ou <strong>Avariado</strong>.</span>
            </p>
          </div>

          {/* Resumo de contagem */}
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-emerald-400 text-xs font-semibold">{ckOk} OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />
              <span className="text-red-400 text-xs font-semibold">{ckDefeito} Avariados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block" />
              <span className="text-slate-400 text-xs">{ckNv} Pendentes</span>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setChecklist(prev => prev.map(i => ({ ...i, status: 'OK' as CheckStatus })))}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Marcar todos como OK
              </button>
            </div>
          </div>

          {/* Grupos de itens */}
          <div className="space-y-5">
            {groups.map(([group, groupLabel]) => {
              const items = checklist.filter(i => i.group === group);
              return (
                <div key={group} className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {groupLabel}
                  </p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition-all ${statusColor[item.status]}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Item e Descrição contextual */}
                          <div
                            onClick={() => cycleStatus(item.id)}
                            className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 transition-colors ${statusDot[item.status]}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white leading-tight">
                                {item.label}
                              </p>

                              {/* Estado detalhado */}
                              {item.status === 'OK' && (
                                <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                  ✓ {item.okLabel}
                                </p>
                              )}
                              {item.status === 'DEFEITO' && (
                                <p className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1">
                                  ✗ {item.defeitoLabel}
                                </p>
                              )}
                              {item.status === 'NAO_VERIFICADO' && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Clique para definir se está OK ou Avariado
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Botões rápidos */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setItemStatus(item.id, 'OK'); }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                item.status === 'OK'
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                              }`}
                            >
                              ✓ OK
                            </button>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setItemStatus(item.id, 'DEFEITO'); }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                item.status === 'DEFEITO'
                                  ? 'bg-red-600 border-red-500 text-white shadow-sm'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400'
                              }`}
                            >
                              ✗ Avariado
                            </button>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setItemStatus(item.id, 'NAO_VERIFICADO'); }}
                              className={`px-2 py-1 text-xs font-medium rounded-lg border transition-all ${
                                item.status === 'NAO_VERIFICADO'
                                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                              title="Não verificado"
                            >
                              N/V
                            </button>
                          </div>
                        </div>

                        {/* Input extra se houver */}
                        {item.hasInput && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                            <input
                              type="text"
                              placeholder={item.inputPlaceholder || 'Informe o valor...'}
                              className="input text-xs py-1.5 w-full"
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

          {/* Dica para iPhone */}
          {checklistType === 'iphone' && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex items-start gap-3">
              <Battery className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300 leading-relaxed">
                <span className="font-semibold block mb-0.5">Dica para conferir bateria no iPhone:</span>
                Vá em Ajustes → Bateria → Saúde e Carregamento da Bateria → informe a capacidade máxima observada.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Botões de Navegação ────────────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-2">
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
            {createdOS && (
              <button
                type="button"
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
