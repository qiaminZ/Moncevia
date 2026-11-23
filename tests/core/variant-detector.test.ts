import { describe, expect, it } from 'vitest';
import { createVariantDetector } from '../../src/detector/variant-detector';
import { parseAmount } from '../../src/core/parse-amount';

const figure = String.raw`(?:\d{1,3}(?:[.,\s\u00a0\u202f]\d{3})+(?:[.,]\d{1,8})?|\d+(?:[.,]\d{1,8})?)`;
const prefixRE = new RegExp(
  String.raw`(?<![\p{L}\d])(?:USD|EUR|BTC|US\$|€|\$)\s*(${figure})(?![\p{L}\d])`, 'giu',
);
const suffixRE = new RegExp(
  String.raw`(?<![\p{L}\d])(${figure})\s*(USD|EUR|BTC)(?![\p{L}\d])`, 'giu',
);
const create = (chosen: string | null = null) => createVariantDetector({
  parseAmount: (raw, code) => parseAmount(raw, code as Parameters<typeof parseAmount>[1]),
  prefixCurrency: (prefix) => {
    const s = prefix.trim().toUpperCase();
    return s === '€' ? 'EUR' : s === '$' ? chosen : s === 'US$' ? 'USD' :
      ['USD', 'EUR', 'BTC'].includes(s) ? s : null;
  },
  prefixRE, suffixRE, figure, cryptoCodes: ['BTC', 'ETH', 'LTC'],
  dollarCurrencyForSite: () => chosen,
});

describe('Advanced typed variant detector — monetary policy', () => {
  it('does not invent a currency for bare dollar symbols', () => {
    expect(create().matchesInText('$24.99')).toEqual([]);
    expect(create('CLP').matchesInText('$24.99')[0]?.code).toBe('CLP');
    expect(create('USD').matchesInText('US$24.99')[0]?.code).toBe('USD');
  });
  it('parses explicit fiat currencies with locale-aware grouping', () => {
    const matches = create().matchesInText('EUR 1.234,56\nUSD 1,234.56');
    expect(matches.map(m => [m.amount, m.code])).toEqual([[1234.56, 'EUR'], [1234.56, 'USD']]);
  });
  it('marks historic and per-period prices without selecting them as current', () => {
    const matches = create().matchesInText('Original: EUR 49.99\nEUR 19.99 per month');
    expect(matches[0]?.former).toBe(true);
    expect(matches[1]?.perUnit).toBe(true);
  });
  it('compares only equivalent amount AND currency', () => {
    const d = create();
    expect(d.sameMonetaryPrice({amount: 24.99, code:'EUR'},{amount:24.99,code:'USD'})).toBe(false);
    expect(d.sameMonetaryPrice({amount:24.99,code:'EUR'},{amount:24.99,code:'EUR'})).toBe(true);
    expect(d.sameMonetaryPrice(null,{amount:24.99,code:'EUR'})).toBe(false);
  });
  it('rejects invalid targets, checkout prompts and unapproved auto-currency', () => {
    const d = create();
    expect(d.variantControl(null)).toBeNull();
    expect(d.unlabeledDollarPrice(null)).toBeNull();
    expect(d.tappedPrice(undefined)).toBeNull();
  });
});
