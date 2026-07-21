import { Decimal } from '@prisma/client/runtime/library';

// ─── Moeda ────────────────────────────────────────────────────────────────────

/**
 * Formata número como moeda BRL: R$ 1.234,56
 */
export function formatCurrency(value: number | Decimal | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Converte string formatada como moeda BRL para número.
 * Ex: "R$ 1.234,56" → 1234.56
 */
export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

// ─── Datas ────────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';

/**
 * Formata Date para DD/MM/AAAA no fuso de São Paulo
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { timeZone: TZ });
}

/**
 * Formata Date para DD/MM/AAAA HH:mm no fuso de São Paulo
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata Date para HH:mm no fuso de São Paulo
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

// ─── CPF ──────────────────────────────────────────────────────────────────────

/**
 * Aplica máscara de CPF: 123.456.789-00
 */
export function maskCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Mascara parcialmente: 123.***.***-00
 */
export function maskCpfPartial(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.***.***-${clean.slice(9)}`;
}

/**
 * Remove máscara do CPF
 */
export function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida CPF (algoritmo oficial)
 */
export function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // todos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]!) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean[9]!)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]!) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(clean[10]!);
}

// ─── Telefone ─────────────────────────────────────────────────────────────────

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// ─── IMEI ─────────────────────────────────────────────────────────────────────

/**
 * Valida IMEI pelo algoritmo Luhn
 */
export function isValidImei(imei: string): boolean {
  const clean = imei.replace(/\D/g, '');
  if (clean.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(clean[i]!);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// ─── Números sequenciais ──────────────────────────────────────────────────────

export function formatSequentialNumber(num: number, prefix = '', padLength = 6): string {
  return `${prefix}${String(num).padStart(padLength, '0')}`;
}

// ─── Cálculos financeiros ─────────────────────────────────────────────────────

/**
 * Calcula o total de um item (quantidade × preço − desconto)
 * Todos os cálculos são feitos com Decimal para evitar erros de ponto flutuante
 */
export function calcItemSubtotal(
  quantity: number,
  unitPrice: number,
  discountAmount: number
): number {
  return Math.round((quantity * unitPrice - discountAmount) * 100) / 100;
}

export function calcGrossAmount(
  items: Array<{ quantity: number; unitPrice: number }>
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calcChange(received: number, total: number): number {
  const change = received - total;
  return change > 0 ? Math.round(change * 100) / 100 : 0;
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export function calcAvailableStock(stockOnHand: number, stockReserved: number): number {
  return Math.max(0, stockOnHand - stockReserved);
}

// ─── Strings ─────────────────────────────────────────────────────────────────

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return '—';
  const MAP: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_DEBITO: 'Débito',
    CARTAO_CREDITO: 'Crédito à Vista',
    TRANSFERENCIA: 'Transferência',
    BRINDE: 'Brinde',
    OUTRO: 'Outros',
  };
  return MAP[method] || method;
}
