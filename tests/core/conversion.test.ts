import { describe, expect, it } from 'vitest';
import { createConversionEngine, type ConversionContext } from '../../src/core/conversion';

const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const data: ConversionContext = {
  now: NOW,
  settings: { usdClpManual: 0, eurClpManual: 0 },
  fx: { fetchedAt: NOW - 1000, rates: { USD: 1, EUR: 0.9, CLP: 1000, GBP: 0.8, JPY: 150 } },
  crypto: {
    fetchedAt: NOW - 1000, quotedAt: NOW - 1000, source: 'Binance Spot',
    usdtUsd: 0.99,
    usd: { BTC: 60000, ETH: 3000, LTC: 100 },
    askUSDT: { BTC: 61000, ETH: 3100, LTC: 101 },
    bidUSDT: { BTC: 59000, ETH: 2900, LTC: 99 },
  },
};
const create = (patch: Partial<ConversionContext> = {}) =>
  createConversionEngine({ ...data, ...patch });

describe('TypeScript currency conversion core', () => {
  it('preserves CLP / USD / EUR / GBP / JPY directionality', () => {
    const c = create();
    expect(c.toUnits(100, 'USD', 'CLP')).toBe(100000);
    expect(c.toUnits(100000, 'CLP', 'USD')).toBe(100);
    expect(c.toUnits(100, 'USD', 'EUR')).toBe(90);
    expect(c.toUnits(90, 'EUR', 'USD')).toBe(100);
    expect(c.toUnits(100, 'USD', 'GBP')).toBe(80);
    expect(c.toUnits(150, 'JPY', 'USD')).toBe(1);
    expect(c.toUnits(12345, 'CLP', 'CLP')).toBe(12345);
    expect(c.eurClp()).toBeCloseTo(1111.111111, 5);
  });
  it('keeps manual CLP and EUR override precedence', () => {
    const c = create({ settings: { usdClpManual: 1200, eurClpManual: 1500 } });
    expect(c.usdClp()).toBe(1200);
    expect(c.eurClp()).toBe(1500);
    expect(c.toUnits(10, 'EUR', 'CLP')).toBe(15000);
    expect(c.toUnits(15000, 'CLP', 'EUR')).toBe(10);
    expect(c.toUnits(10, 'EUR', 'USD')).toBe(12.5);
    expect(c.toUnits(12.5, 'USD', 'EUR')).toBe(10);
  });
  it('uses Binance bid when selling and ask when buying, factoring USDT/USD', () => {
    const c = create();
    expect(c.spotAsk('BTC')).toBeCloseTo(61000 * 0.99);
    expect(c.spotBid('BTC')).toBeCloseTo(59000 * 0.99);
    expect(c.toUnits(1, 'BTC', 'USD')).toBeCloseTo(59000 * 0.99);
    expect(c.toUnits(100, 'USD', 'BTC')).toBeCloseTo(100 / (61000 * 0.99), 12);
    expect(c.toUnits(1, 'BTC', 'CLP')).toBeCloseTo(59000 * 0.99 * 1000);
  });
  it('returns no rates for stale FX but allows a manual base rate', () => {
    const stale = { fetchedAt: NOW - 4 * 86_400_000, rates: { CLP: 1000, EUR: 0.9 } };
    const c = create({ fx: stale });
    expect(c.activeFX()).toBe(false);
    expect(c.toUnits(10, 'EUR', 'USD')).toBeNull();
    expect(c.toUnits(10, 'USD', 'CLP')).toBeNull();
    const manual = create({ fx: stale, settings: { usdClpManual: '1100', eurClpManual: '1250' } });
    expect(manual.toUnits(10, 'USD', 'CLP')).toBe(11000);
    expect(manual.toUnits(10, 'EUR', 'CLP')).toBe(12500);
  });
  it('rejects stale crypto, future quotes and incomplete Binance pricing', () => {
    expect(create({ crypto: { ...data.crypto!, fetchedAt: NOW - 46 * 60_000 } }).activeCrypto()).toBe(false);
    expect(create({ crypto: { ...data.crypto!, quotedAt: NOW + 310_000 } }).activeCrypto()).toBe(false);
    const missingParity = { ...data.crypto!, usdtUsd: 0 };
    expect(create({ crypto: missingParity }).activeCrypto()).toBe(false);
    expect(create({ crypto: missingParity }).toUnits(10, 'USD', 'ETH')).toBeNull();
  });
  it('supports non-Binance indicative quotes without fabricating a trading fee', () => {
    const snapshot = { ...data.crypto!, source: 'Coinbase public', askUSDT: {}, bidUSDT: {}, usdtUsd: 0 };
    const c = create({ crypto: snapshot });
    expect(c.activeCrypto()).toBe(true);
    expect(c.spotAsk('ETH')).toBe(3000);
    expect(c.spotBid('ETH')).toBe(3000);
  });
  it('returns null for currencies with no verifiable rate', () => {
    const c = create({ fx: null, crypto: null });
    expect(c.toUnits(10, 'USD', 'EUR')).toBeNull();
    expect(c.toUnits(10, 'USD', 'BTC')).toBeNull();
    expect(c.toUnits(10, 'USD', 'USD')).toBe(10);
  });
});
