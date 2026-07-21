import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  calcItemSubtotal,
  calcChange,
  isValidCpf,
  maskCpf,
} from '@/lib/formatters';

describe('Formatters Unit Tests', () => {
  it('should format currency correctly in BRL', () => {
    expect(formatCurrency(1234.56)).toContain('1.234,56');
    expect(formatCurrency(0)).toContain('0,00');
  });

  it('should calculate item subtotal accurately', () => {
    // 2 x 29.90 = 59.80 - 5.00 discount = 54.80
    expect(calcItemSubtotal(2, 29.9, 5)).toBe(54.8);
  });

  it('should calculate change correctly', () => {
    expect(calcChange(100, 85.5)).toBe(14.5);
    expect(calcChange(50, 50)).toBe(0);
    expect(calcChange(40, 50)).toBe(0);
  });

  it('should validate valid and invalid CPFs', () => {
    expect(isValidCpf('12345678901')).toBe(false); // todos sequenciais falham
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('should apply CPF mask', () => {
    expect(maskCpf('12345678901')).toBe('123.456.789-01');
  });
});
