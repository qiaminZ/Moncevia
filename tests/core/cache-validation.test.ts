import { describe, expect, it } from 'vitest';
import { readCachedCrypto, readCachedFX } from '../../src/core/cache-validation';

describe('Untrusted browser cache boundaries', () => {
  it('preserves valid exchange rate records and removes malformed optional rates', () => {
    const fx = readCachedFX({
      fetchedAt: 1700000000000, updatedAt: '22/11/2026',
      rates: { CLP: 1000, EUR: 0.9, GBP: '0.75', JPY: -150, XYZ: 20 },
    });
    expect(fx?.rates).toEqual({ CLP: 1000, EUR: 0.9, GBP: 0.75 });
    expect(fx?.updatedAt).toBe('22/11/2026');
    expect(readCachedFX({ fetchedAt: 10, rates: { CLP: 1000 } })).toBeNull();
    expect(readCachedFX(['malicious'])).toBeNull();
  });
  it('allows a complete Binance snapshot but blocks invalid USDT parity', () => {
    const base = {
      fetchedAt: 1700000000000, quotedAt: 1700000000000,
      source: 'Binance Spot + CoinGecko USDT/USD',
      usd: { BTC: 60000, ETH: 3000, LTC: 100 },
      askUSDT: { BTC: 61000, ETH: 3100, LTC: 101 },
      bidUSDT: { BTC: 59000, ETH: 2900, LTC: 99 },
      usdtUsd: 0.99,
    };
    expect(readCachedCrypto(base)?.askUSDT?.BTC).toBe(61000);
    expect(readCachedCrypto({ ...base, usdtUsd: null })).toBeNull();
    expect(readCachedCrypto({ ...base, usd: { BTC: 60000, ETH: 3000 } })).toBeNull();
  });
  it('supports fallback quotes and filters malformed cached bid/ask data', () => {
    const crypto = readCachedCrypto({
      fetchedAt: 1700000000000, source: 'CoinGecko (USD, respaldo)',
      usd: { BTC: '60000', ETH: 3000, LTC: 100 },
      askUSDT: { BTC: 'not valid' }, bidUSDT: {},
    });
    expect(crypto?.usd?.BTC).toBe(60000);
    expect(crypto?.askUSDT).toBeUndefined();
    expect(readCachedCrypto({ fetchedAt: 1, usd: null })).toBeNull();
  });
});
