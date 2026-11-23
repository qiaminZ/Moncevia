import { describe, expect, it } from 'vitest';
import { parseAmount } from '../../src/core/parse-amount';

// The parser is used by the browser runtime; these are behavioral parity tests.
describe('locale-aware amount parsing', () => {
  it('recognizes comma decimal and dot grouping', () => {
    expect(parseAmount('1.234,56', 'EUR')).toBe(1234.56);
    expect(parseAmount('1,234.56', 'USD')).toBe(1234.56);
    expect(parseAmount('50,75', 'CLP')).toBe(50.75);
  });
  it('rejects ambiguous thousands without guessing fiat currency', () => {
    expect(Number.isNaN(parseAmount('1.234', 'CLP'))).toBe(true);
    expect(Number.isNaN(parseAmount('1,234', 'USD'))).toBe(true);
  });
  it('accepts small crypto values to eight decimals', () => {
    expect(parseAmount('0.00046367', 'BTC')).toBe(0.00046367);
    expect(parseAmount('0,01526209', 'ETH')).toBe(0.01526209);
  });
  it('rejects invalid, nonpositive and enormous inputs', () => {
    for (const value of ['-5', '0', 'Infinity', 'NaN', 'abc', '1000000000000']) {
      expect(Number.isNaN(parseAmount(value, 'USD'))).toBe(true);
    }
  });
});
