export interface PrintChecklistData {
  osNumber: number | string;
  customerName: string;
  customerPhone?: string | null;
  customerCpf?: string | null;
  deviceModel: string;
  color?: string | null;
  accessories?: string[];
  reportedIssue: string;
  createdAt?: string | Date;
  technicianName?: string | null;
}

function isIphone(model: string): boolean {
  return /iphone|apple|ipad/i.test(model);
}

export function printManualChecklist(data: PrintChecklistData, initialFormat: 'a4' | 'thermal' = 'a4') {
  if (typeof window === 'undefined') return;

  const dateObj = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = dateObj.toLocaleDateString('pt-BR');
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isApple = isIphone(data.deviceModel);

  // Grupos específicos para preenchimento manual à caneta
  const iphonePhysicalItems = [
    { name: 'Carcaça / Aro / Chassis', note: 'Amassados, cantos batidos, empenamento ou riscos' },
    { name: 'Tela / Visor Frontal', note: 'Trincas, riscos profundos, manchas ou linhas' },
    { name: 'Vidro Traseiro', note: 'Íntegro, trincado ou quebrado' },
    { name: 'Lente das Câmeras', note: 'Íntegra, riscada, trincada ou embaçada' },
  ];

  const iphoneFunctionalItems = [
    { name: 'Botões (Power / Volume / Mute)', note: 'Clique firme e resposta física' },
    { name: 'Câmera Frontal e Traseira', note: 'Foco, zoom, flash e gravação' },
    { name: 'Microfones & Alto-falantes', note: 'Ligações normais, áudio WhatsApp e viva-voz' },
    { name: 'Conector Lightning / USB-C', note: 'Encaixe firme, carregamento normal' },
    { name: 'Biometria (Face ID / Touch ID)', note: 'Reconhecimento e cadastro facial/digital' },
    { name: 'True Tone & Sensor Proximidade', note: 'Apaga a tela ao aproximar na ligação' },
    { name: 'Wi-Fi, Bluetooth e GPS', note: 'Busca redes e realiza pareamento' },
    { name: 'Chip SIM / eSIM / Sinal Operadora', note: 'Reconhece chip e faz chamada' },
    { name: 'Saúde da Bateria: [ ______ % ]', note: 'Ajustes > Bateria > Saúde da Bateria' },
    { name: 'Carregamento Indução (MagSafe)', note: 'Carrega sem fio normalmente' },
    { name: 'Versão do iOS: [ ____________ ]', note: 'Ajustes > Geral > Sobre' },
    { name: 'iCloud / Buscar Ativo?', note: '[  ] Desativado / Livre    [  ] Ativo (Exige senha)' },
  ];

  const androidPhysicalItems = [
    { name: 'Carcaça / Aro Lateral', note: 'Amassados, cantos batidos, arranhões' },
    { name: 'Tampa Traseira', note: 'Íntegra, trincada, descolando ou quebrada' },
    { name: 'Tela / Visor Frontal', note: 'Trincas, manchas, linhas ou touch falho' },
    { name: 'Lente das Câmeras', note: 'Íntegra, riscada, trincada ou embaçada' },
  ];

  const androidFunctionalItems = [
    { name: 'Botões Físicos (Power / Vol +/-)', note: 'Clique e resposta normal' },
    { name: 'Câmeras Frontal e Traseira', note: 'Foto, gravação de vídeo e flash' },
    { name: 'Microfones & Alto-falantes', note: 'Som limpo, ligações e viva-voz' },
    { name: 'Conector USB / Tipo-C / V8', note: 'Carga normal e transferência de dados' },
    { name: 'Biometria (Digital / Facial)', note: 'Desbloqueio biométrico funcionando' },
    { name: 'Sensor de Proximidade & Giroscópio', note: 'Apaga tela na chamada' },
    { name: 'Wi-Fi, Bluetooth, GPS e NFC', note: 'Redes, periféricos e aproximação' },
    { name: 'Chip SIM 1 & 2 / Sinal Operadora', note: 'Faz e recebe ligações normalmente' },
    { name: 'Estado Bateria: [ ] OK  [ ] Ruim', note: 'Retém carga, esquenta ou está inchada' },
    { name: 'Conector de Fone (P2 / P3)', note: 'Encaixe de fone de ouvido' },
    { name: 'Versão do Android: [ _________ ]', note: 'Configurações > Sobre o Telefone' },
    { name: 'Conta Google / FRP:', note: '[  ] Desvinculada / Livre    [  ] Ativa' },
  ];

  const physicalItems = isApple ? iphonePhysicalItems : androidPhysicalItems;
  const functionalItems = isApple ? iphoneFunctionalItems : androidFunctionalItems;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Checklist OS #${data.osNumber} - Flavio Celulares</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #000;
    background: #eef2f6;
    padding: 12px;
  }

  /* Barra de controle no topo (oculta na impressão) */
  .control-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #1e293b;
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .control-label {
    font-size: 13px;
    font-weight: bold;
    color: #cbd5e1;
    margin-right: 4px;
  }
  .ctrl-btn {
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 6px;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ctrl-btn-toggle {
    background: #334155;
    color: #f1f5f9;
  }
  .ctrl-btn-toggle:hover {
    background: #475569;
  }
  .ctrl-btn-toggle.active {
    background: #2563eb;
    color: #fff;
    box-shadow: 0 0 0 2px #60a5fa;
  }
  .ctrl-btn-primary {
    background: #10b981;
    color: #fff;
  }
  .ctrl-btn-primary:hover {
    background: #059669;
  }
  .ctrl-btn-close {
    background: #475569;
    color: #fff;
  }
  .ctrl-btn-close:hover {
    background: #64748b;
  }

  /* Folha física na tela */
  .sheet {
    background: #fff;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: max-width 0.2s;
  }

  /* ══════════════════════════════════════════════════════════════════
     ESTILOS MODO A4
     ══════════════════════════════════════════════════════════════════ */
  .mode-a4 {
    max-width: 210mm;
    min-height: 297mm;
    padding: 10mm 12mm;
    font-size: 8.5pt;
    line-height: 1.25;
  }
  .mode-a4 .header-a4 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }
  .mode-a4 .store-title {
    font-size: 15pt;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .mode-a4 .store-subtitle {
    font-size: 8pt;
    color: #333;
    margin-top: 1px;
  }
  .mode-a4 .store-legal-info {
    font-size: 7.2pt;
    color: #222;
    margin-top: 3px;
    line-height: 1.25;
  }
  .mode-a4 .os-badge {
    text-align: right;
  }
  .mode-a4 .os-number {
    font-size: 18pt;
    font-weight: 900;
    letter-spacing: 0.5px;
  }
  .mode-a4 .os-date {
    font-size: 8pt;
    color: #333;
    font-weight: 600;
  }

  /* Tabela de dados A4 */
  .mode-a4 .info-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 6px;
    border: 1px solid #000;
    border-radius: 4px;
    padding: 6px 10px;
    margin-bottom: 6px;
    background: #fafafa;
    font-size: 8.5pt;
  }
  .mode-a4 .info-field {
    margin-bottom: 2px;
  }
  .mode-a4 .info-label {
    font-weight: bold;
    color: #111;
  }

  /* Defeito Relatado A4 */
  .mode-a4 .defect-banner {
    border: 1.5px solid #000;
    border-radius: 4px;
    padding: 6px 10px;
    margin-bottom: 8px;
    background: #fff;
    font-size: 8.5pt;
  }
  .mode-a4 .defect-title {
    font-weight: 900;
    color: #000;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Grid do Checklist A4 (2 Colunas) */
  .mode-a4 .checklist-container {
    display: grid;
    grid-template-columns: 0.95fr 1.05fr;
    gap: 10px;
    margin-bottom: 8px;
  }
  .mode-a4 .section-header {
    background: #000;
    color: #fff;
    font-weight: 900;
    font-size: 8pt;
    padding: 3px 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 3px;
    border-radius: 2px;
  }
  .mode-a4 table.check-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }
  .mode-a4 table.check-table tr td {
    border-bottom: 1px solid #ddd;
    padding: 3px 2px;
    vertical-align: middle;
  }
  .mode-a4 table.check-table tr:last-child td {
    border-bottom: none;
  }
  .mode-a4 .item-title {
    font-weight: bold;
    color: #000;
  }
  .mode-a4 .item-desc {
    font-size: 6.8pt;
    color: #555;
    line-height: 1.1;
  }
  .mode-a4 .check-col {
    white-space: nowrap;
    text-align: right;
    font-weight: bold;
    font-size: 7.2pt;
    padding-left: 4px;
  }
  .box-sq {
    display: inline-block;
    width: 11px;
    height: 11px;
    border: 1.5px solid #000;
    vertical-align: middle;
    margin-right: 2px;
    background: #fff;
  }

  /* Bloco de Anotações Técnicas A4 */
  .mode-a4 .notes-box {
    border: 1px dashed #000;
    border-radius: 4px;
    padding: 5px 8px;
    margin-top: 6px;
    background: #fff;
  }
  .mode-a4 .notes-title {
    font-size: 7.5pt;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .mode-a4 .notes-lines {
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding-top: 6px;
  }
  .mode-a4 .note-line {
    border-bottom: 1px dotted #888;
    height: 1px;
  }

  /* Termo de Ciência e Isenção A4 */
  .mode-a4 .termo-box {
    border: 1.5px solid #000;
    border-radius: 4px;
    padding: 6px 10px;
    margin-bottom: 8px;
    background: #fafafa;
    text-align: justify;
    font-size: 7pt;
    line-height: 1.25;
  }
  .mode-a4 .termo-title {
    font-weight: 900;
    font-size: 7.5pt;
    text-align: center;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }
  .mode-a4 .termo-agree {
    margin-top: 4px;
    font-weight: bold;
    font-size: 7.5pt;
    border-top: 1px dashed #666;
    padding-top: 3px;
  }

  /* ── CARIMBO E ASSINATURAS ESPAÇOSOS NO A4 ── */
  .mode-a4 .stamp-signatures-row {
    display: grid;
    grid-template-columns: 1fr 1.1fr 1.1fr;
    gap: 10px;
    align-items: stretch;
  }
  .mode-a4 .stamp-card {
    border: 1.5px dashed #444;
    border-radius: 6px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 85px;
    background: #fff;
    text-align: center;
  }
  .mode-a4 .card-label {
    font-size: 7pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #111;
  }
  .mode-a4 .stamp-free-space {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 7.5pt;
    font-style: italic;
    min-height: 55px;
  }
  .mode-a4 .sig-card {
    border: 1px solid #bbb;
    border-radius: 6px;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 85px;
    background: #fff;
    text-align: center;
  }
  .mode-a4 .sig-free-space {
    flex: 1;
    min-height: 50px;
  }
  .mode-a4 .sig-solid-line {
    border-top: 1.2px solid #000;
    margin-top: 2px;
    padding-top: 3px;
    font-size: 7pt;
    font-weight: bold;
    color: #000;
  }
  .mode-a4 .sig-role {
    font-size: 6.5pt;
    color: #444;
  }

  .mode-a4 .footer-note {
    text-align: center;
    font-size: 6.5pt;
    color: #666;
    margin-top: 6px;
    border-top: 1px solid #ddd;
    padding-top: 3px;
  }


  /* ══════════════════════════════════════════════════════════════════
     ESTILOS MODO TÉRMICA (80mm)
     ══════════════════════════════════════════════════════════════════ */
  .mode-thermal {
    max-width: 80mm;
    padding: 6px 4px;
    font-size: 7.5pt;
    line-height: 1.2;
  }
  .mode-thermal .header-thermal {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin-bottom: 5px;
  }
  .mode-thermal .store-title {
    font-size: 13pt;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .mode-thermal .store-legal-thermal {
    font-size: 6.2pt;
    color: #333;
    margin: 2px 0 3px 0;
    line-height: 1.2;
    text-align: center;
  }
  .mode-thermal .os-title {
    font-size: 15pt;
    font-weight: 900;
    margin: 2px 0;
  }
  .mode-thermal .datetime {
    font-size: 7.5pt;
    color: #333;
  }
  .mode-thermal .info-box {
    border: 1px solid #000;
    border-radius: 4px;
    padding: 4px 6px;
    margin-bottom: 5px;
    font-size: 7.5pt;
  }
  .mode-thermal .info-row {
    display: flex;
    gap: 4px;
    margin-bottom: 2px;
  }
  .mode-thermal .info-row:last-child { margin-bottom: 0; }
  .mode-thermal .field-label {
    font-weight: bold;
    min-width: 65px;
  }
  .mode-thermal .defect-box {
    border: 1.5px solid #000;
    border-radius: 4px;
    padding: 4px 6px;
    margin-bottom: 5px;
    font-size: 7.5pt;
  }
  .mode-thermal .checklist-header-thermal {
    text-align: center;
    font-size: 8.5pt;
    font-weight: 900;
    text-transform: uppercase;
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    padding: 3px 0;
    margin-bottom: 4px;
  }
  .mode-thermal .group-title-thermal {
    background: #000;
    color: #fff;
    font-weight: bold;
    font-size: 7pt;
    padding: 2px 4px;
    text-transform: uppercase;
    margin-top: 4px;
    margin-bottom: 2px;
  }
  .mode-thermal table.checklist-thermal {
    width: 100%;
    border-collapse: collapse;
    font-size: 7pt;
  }
  .mode-thermal table.checklist-thermal tr td {
    border-bottom: 1px solid #ccc;
    padding: 2.5px 1px;
    vertical-align: top;
  }
  .mode-thermal .check-boxes-thermal {
    white-space: nowrap;
    font-size: 6.8pt;
    font-weight: bold;
    text-align: right;
  }
  .mode-thermal .obs-box-thermal {
    border: 1px dashed #000;
    border-radius: 4px;
    padding: 4px 6px;
    margin-top: 5px;
    font-size: 7pt;
    min-height: 40px;
  }
  .mode-thermal .termo-box-thermal {
    border: 1.2px solid #000;
    border-radius: 4px;
    padding: 4px;
    margin-top: 6px;
    text-align: justify;
    font-size: 6pt;
    line-height: 1.15;
  }
  .mode-thermal .termo-title-thermal {
    font-weight: 900;
    text-align: center;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .mode-thermal .concordo-thermal {
    margin-top: 4px;
    padding: 3px 4px;
    border: 1px solid #000;
    border-radius: 3px;
    font-size: 6.8pt;
    font-weight: bold;
  }

  /* ── CARIMBO E ASSINATURAS ESPAÇOSOS NA TÉRMICA ── */
  .mode-thermal .stamp-box-thermal {
    border: 1.5px dashed #333;
    border-radius: 4px;
    margin-top: 8px;
    min-height: 65px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 4px;
    text-align: center;
  }
  .mode-thermal .sig-block-thermal {
    margin-top: 8px;
    text-align: center;
  }
  .mode-thermal .sig-space-thermal {
    height: 45px; /* Espaço livre real para assinar à caneta */
  }
  .mode-thermal .sig-line-thermal {
    border-top: 1px solid #000;
    padding-top: 2px;
    font-size: 6.8pt;
    font-weight: bold;
  }
  .mode-thermal .footer-thermal {
    text-align: center;
    font-size: 6pt;
    color: #555;
    margin-top: 6px;
    border-top: 1px solid #ccc;
    padding-top: 2px;
  }

  /* ══════════════════════════════════════════════════════════════════
     REGRAS DE IMPRESSÃO
     ══════════════════════════════════════════════════════════════════ */
  @media print {
    body {
      background: #fff !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-print {
      display: none !important;
    }
    .sheet {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  }
</style>
<style id="page-style">
  @page {
    size: ${initialFormat === 'a4' ? 'A4 portrait' : '80mm auto'};
    margin: ${initialFormat === 'a4' ? '8mm 10mm' : '2mm 3mm'};
  }
</style>
</head>
<body>

<!-- BARRA DE CONTROLE SUPERIOR (NÃO SAI NA IMPRESSÃO) -->
<div class="no-print control-bar">
  <div class="control-group">
    <span class="control-label">Visualizar / Imprimir em:</span>
    <button id="btn-a4" class="ctrl-btn ctrl-btn-toggle ${initialFormat === 'a4' ? 'active' : ''}" onclick="switchFormat('a4')">
      📄 Folha A4 Completa
    </button>
    <button id="btn-thermal" class="ctrl-btn ctrl-btn-toggle ${initialFormat === 'thermal' ? 'active' : ''}" onclick="switchFormat('thermal')">
      🧾 Cupom Térmico (80mm)
    </button>
  </div>
  <div class="control-group">
    <button class="ctrl-btn ctrl-btn-primary" onclick="window.print()">
      🖨️ Imprimir Agora
    </button>
    <button class="ctrl-btn ctrl-btn-close" onclick="window.close()">
      ✕ Fechar
    </button>
  </div>
</div>

<!-- ================================================================
     CONTEÚDO PRINCIPAL (ALTERNÁVEL VIA JAVASCRIPT)
     ================================================================ -->
<div id="print-sheet" class="sheet ${initialFormat === 'a4' ? 'mode-a4' : 'mode-thermal'}">

  <!-- ==================== LAYOUT A4 ==================== -->
  <div id="layout-a4" style="display: ${initialFormat === 'a4' ? 'block' : 'none'};">
    <div class="header-a4">
      <div>
        <div class="store-title">Flavio Celulares</div>
        <div class="store-subtitle">Assistência Técnica Especializada · Reparo de Smartphones & Tablets</div>
        <div class="store-legal-info">
          <strong>CNPJ:</strong> 17.056.311/0001-75 &nbsp;·&nbsp; <strong>Tel/WhatsApp:</strong> (77) 99981-6265<br>
          <strong>Endereço:</strong> Rua Da Maçonaria, 464 — Centro — Carinhanha/BA
        </div>
      </div>
      <div class="os-badge">
        <div class="os-number">OS #${data.osNumber}</div>
        <div class="os-date">Entrada: ${dateStr} às ${timeStr}</div>
      </div>
    </div>

    <!-- Dados do Cliente e Aparelho -->
    <div class="info-grid">
      <div>
        <div class="info-field"><span class="info-label">Cliente:</span> <strong>${data.customerName}</strong></div>
        ${data.customerPhone ? `<div class="info-field"><span class="info-label">Telefone / WhatsApp:</span> ${data.customerPhone}</div>` : ''}
        ${data.customerCpf ? `<div class="info-field"><span class="info-label">CPF:</span> ${data.customerCpf}</div>` : ''}
      </div>
      <div>
        <div class="info-field"><span class="info-label">Aparelho:</span> <strong>${data.deviceModel}</strong>${data.color ? ' (' + data.color + ')' : ''}</div>
        <div class="info-field"><span class="info-label">Acessórios Deixados:</span> ${data.accessories && data.accessories.length > 0 ? data.accessories.join(', ') : 'Nenhum acessório'}</div>
      </div>
    </div>

    <!-- Defeito Relatado -->
    <div class="defect-banner">
      <div class="defect-title">⚠ DEFEITO RECLAMADO PELO CLIENTE:</div>
      <div>${data.reportedIssue}</div>
    </div>

    <!-- Grid do Checklist em 2 Colunas -->
    <div class="checklist-container">
      <!-- Coluna 1: Estado Físico & Notas -->
      <div>
        <div class="section-header">1. ESTADO FÍSICO / CARCAÇA & TELA</div>
        <table class="check-table">
          <tbody>
            ${physicalItems.map(item => `
              <tr>
                <td>
                  <div class="item-title">${item.name}</div>
                  <div class="item-desc">${item.note}</div>
                </td>
                <td class="check-col">
                  <span class="box-sq"></span> Íntegro &nbsp;
                  <span class="box-sq"></span> Avariado
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Anotações do Técnico na Bancada -->
        <div class="notes-box">
          <div class="notes-title">Anotações / Laudo Preliminar do Técnico (Bancada):</div>
          <div class="notes-lines">
            <div class="note-line"></div>
            <div class="note-line"></div>
            <div class="note-line"></div>
            <div class="note-line"></div>
          </div>
        </div>
      </div>

      <!-- Coluna 2: Testes de Funcionamento -->
      <div>
        <div class="section-header">2. TESTES DE FUNCIONAMENTO (Se ligar)</div>
        <table class="check-table">
          <tbody>
            ${functionalItems.map(item => `
              <tr>
                <td>
                  <div class="item-title">${item.name}</div>
                  <div class="item-desc">${item.note}</div>
                </td>
                <td class="check-col">
                  <span class="box-sq"></span> OK &nbsp;
                  <span class="box-sq"></span> Def &nbsp;
                  <span class="box-sq"></span> N/T
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Termo de Ciência e Isenção de Responsabilidade A4 -->
    <div class="termo-box">
      <div class="termo-title">TERMO DE CIÊNCIA E DECLARAÇÃO DO CLIENTE</div>
      <p>
        Declaro estar ciente de que, caso o aparelho dê entrada <u>desligado</u>, <u>não ligando</u>, <u>descarregado</u>, <u>sem senha de desbloqueio informada</u> ou com a <u>tela quebrada/sem imagem/sem touch</u>, <strong>NÃO FOI POSSÍVEL REALIZAR O TESTE PRÉVIO</strong> de funções internas como: câmeras frontal/traseira, microfones, alto-falantes, Wi-Fi, Bluetooth, Face ID / biometria, sensores, sinal de operadora e placa.
      </p>
      <p style="margin-top: 3px;">
        A assistência técnica <strong>NÃO SE RESPONSABILIZA POR VÍCIOS OCULTOS OU DEFEITOS PRÉ-EXISTENTES</strong> não passíveis de teste no momento da recepção. Autorizo expressamente a abertura e análise técnica do equipamento para diagnóstico e orçamento.
      </p>
      <div class="termo-agree">
        <span class="box-sq"></span> <strong>CONCORDO COM OS TERMOS E AUTORIZO O DIAGNÓSTICO / ORÇAMENTO</strong>
      </div>
    </div>

    <!-- ÁREA DE CARIMBO E ASSINATURAS ESPAÇOSOS NO A4 -->
    <div class="stamp-signatures-row">
      <!-- 1. Carimbo da Loja / Técnico -->
      <div class="stamp-card">
        <div class="card-label">CARIMBO DA ASSISTÊNCIA / TÉCNICO</div>
        <div class="stamp-free-space">[ ESPAÇO PARA CARIMBO ]</div>
        <div style="font-size: 6pt; color: #444; border-top: 1px dashed #ccc; padding-top: 2px;">
          FLAVIO CELULARES · CNPJ: 17.056.311/0001-75
        </div>
      </div>

      <!-- 2. Assinatura do Técnico -->
      <div class="sig-card">
        <div class="card-label">TÉCNICO / ATENDENTE RESPONSÁVEL</div>
        <div class="sig-free-space"></div>
        <div class="sig-solid-line">Assinatura do Técnico</div>
        <div class="sig-role">Flavio Celulares</div>
      </div>

      <!-- 3. Assinatura do Cliente -->
      <div class="sig-card">
        <div class="card-label">ASSINATURA DO CLIENTE (DE ACORDO)</div>
        <div class="sig-free-space"></div>
        <div class="sig-solid-line">${data.customerName}</div>
        <div class="sig-role">${data.customerCpf ? 'CPF: ' + data.customerCpf : 'Cliente'}</div>
      </div>
    </div>

    <div class="footer-note">
      Flavio Celulares · CNPJ: 17.056.311/0001-75 · Rua Da Maçonaria, 464 - Centro, Carinhanha/BA · Tel: (77) 99981-6265 · OS #${data.osNumber}
    </div>
  </div>

  <!-- ==================== LAYOUT TÉRMICO (80mm) ==================== -->
  <div id="layout-thermal" style="display: ${initialFormat === 'thermal' ? 'block' : 'none'};">
    <div class="header-thermal">
      <div class="store-title">Flavio Celulares</div>
      <div class="store-legal-thermal">
        <strong>CNPJ:</strong> 17.056.311/0001-75<br>
        Rua Da Maçonaria, 464 - Carinhanha/BA<br>
        Tel: (77) 99981-6265
      </div>
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

    <div class="defect-box">
      <strong>⚠ DEFEITO RELATADO:</strong><br>
      ${data.reportedIssue}
    </div>

    <div class="checklist-header-thermal">
      📋 Checklist (${isApple ? 'iPhone' : 'Android / Geral'})
    </div>

    <!-- Grupo 1 Térmica -->
    <div class="group-title-thermal">1. ESTADO FÍSICO / CARCAÇA & TELA</div>
    <table class="checklist-thermal">
      <tbody>
        ${physicalItems.map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <span style="font-size:6pt;color:#555;">${item.note}</span>
            </td>
            <td class="check-boxes-thermal">
              [ ] Íntegro<br>[ ] Avariado
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Grupo 2 Térmica -->
    <div class="group-title-thermal">2. TESTES DE FUNCIONAMENTO (Se ligar)</div>
    <table class="checklist-thermal">
      <tbody>
        ${functionalItems.map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong><br>
              <span style="font-size:6pt;color:#555;">${item.note}</span>
            </td>
            <td class="check-boxes-thermal">
              [ ] OK<br>[ ] Def<br>[ ] N/T
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="obs-box-thermal">
      <strong>Anotações / Diagnóstico do Técnico:</strong>
    </div>

    <!-- Termo Térmica -->
    <div class="termo-box-thermal">
      <div class="termo-title-thermal">TERMO DE CIÊNCIA E DECLARAÇÃO</div>
      <p>
        Caso o aparelho dê entrada desligado, sem senha ou tela quebrada, <strong>NÃO FOI POSSÍVEL TESTAR</strong> funções internas (câmeras, som, Wi-Fi, Face ID/digital, placa). A loja <strong>NÃO SE RESPONSABILIZA POR DEFEITOS NÃO TESTADOS</strong>. Autorizo abertura para orçamento.
      </p>
    </div>

    <div class="concordo-thermal">
      [ &nbsp; ] CONCORDO E AUTORIZO O DIAGNÓSTICO
    </div>

    <!-- CARIMBO ESPAÇOSO NA TÉRMICA -->
    <div class="stamp-box-thermal">
      <span style="font-size:6.5pt;font-weight:bold;text-transform:uppercase;">CARIMBO DA LOJA / TÉCNICO</span>
      <span style="font-size:7pt;color:#999;font-style:italic;margin:15px 0;">[ ESPAÇO PARA CARIMBO ]</span>
    </div>

    <!-- ASSINATURAS ESPAÇOSAS NA TÉRMICA -->
    <div class="sig-block-thermal">
      <div class="sig-space-thermal"></div>
      <div class="sig-line-thermal">Assinatura Atendente / Técnico</div>
    </div>

    <div class="sig-block-thermal">
      <div class="sig-space-thermal"></div>
      <div class="sig-line-thermal">Assinatura do Cliente (${data.customerName})</div>
    </div>

    <div class="footer-thermal">
      Flavio Celulares · CNPJ: 17.056.311/0001-75<br>
      Rua Da Maçonaria, 464 - Carinhanha/BA · OS #${data.osNumber} · ${dateStr}
    </div>
  </div>

</div>

<script>
  function switchFormat(mode) {
    const sheet = document.getElementById('print-sheet');
    const layoutA4 = document.getElementById('layout-a4');
    const layoutThermal = document.getElementById('layout-thermal');
    const btnA4 = document.getElementById('btn-a4');
    const btnThermal = document.getElementById('btn-thermal');
    const pageStyle = document.getElementById('page-style');

    if (mode === 'a4') {
      sheet.className = 'sheet mode-a4';
      layoutA4.style.display = 'block';
      layoutThermal.style.display = 'none';
      btnA4.classList.add('active');
      btnThermal.classList.remove('active');
      pageStyle.innerHTML = '@page { size: A4 portrait; margin: 8mm 10mm; }';
    } else {
      sheet.className = 'sheet mode-thermal';
      layoutA4.style.display = 'none';
      layoutThermal.style.display = 'block';
      btnThermal.classList.add('active');
      btnA4.classList.remove('active');
      pageStyle.innerHTML = '@page { size: 80mm auto; margin: 2mm 3mm; }';
    }
  }
</script>
</body>
</html>`;

  const win = window.open('', '_blank', initialFormat === 'a4' ? 'width=880,height=980' : 'width=520,height=880');
  if (!win) {
    alert('Permita pop-ups no navegador para visualizar e imprimir o checklist.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Não dispara auto-print imediatamente no A4 para dar 500ms do browser renderizar e usuário ver a barra com toggle
  setTimeout(() => {
    try {
      win.print();
    } catch {}
  }, 700);
}
