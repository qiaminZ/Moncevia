import { describe, expect, it } from 'vitest';
import {
  validateUSDTParity, validateBinanceSnapshot,
  validateCoinGeckoSnapshot, validateCoinbaseSnapshot,
} from '../../src/core/provider-validation';

const NOW = Date.UTC(2026, 10, 23, 12, 0, 0);
const second = (NOW - 5 * 60_000) / 1000;
const ticks = [
  { symbol: 'BTCUSDT', bidPrice: '59000.00', askPrice: '61000.00' },
  { symbol: 'ETHUSDT', bidPrice: '2995.00', askPrice: '3005.00' },
  { symbol: 'LTCUSDT', bidPrice: '99.00', askPrice: '101.00' },
];
const gecko = {
  bitcoin: { usd: 60000, last_updated_at: second },
  ethereum: { usd: 3000, last_updated_at: second },
  litecoin: { usd: 100, last_updated_at: second },
};
const coinbase = [
  { data: { base: 'BTC', currency: 'USD', amount: '60000' } },
  { data: { base: 'ETH', currency: 'USD', amount: '3000' } },
  { data: { base: 'LTC', currency: 'USD', amount: '100' } },
];

describe('Public crypto quote boundary', () => {
  it('requires a fresh independently sourced USDT/USD parity', () => {
    const parity = (usd: unknown, at = second) => ({ tether: { usd, last_updated_at: at } });
    expect(validateUSDTParity(parity(0.998), NOW)).toBe(0.998);
    expect(validateUSDTParity(parity(0.79), NOW)).toBeNull();
    expect(validateUSDTParity(parity(1.21), NOW)).toBeNull();
    expect(validateUSDTParity(parity(1, (NOW - 46 * 60_000) / 1000), NOW)).toBeNull();
    expect(validateUSDTParity(parity(1, (NOW + 46 * 60_000) / 1000), NOW)).toBeNull();
    expect(validateUSDTParity(null, NOW)).toBeNull();
  });
  it('enforces ordered Binance symbols, valid bid/ask and spread safety', () => {
    const valid = validateBinanceSnapshot(ticks, 0.998, NOW);
    expect(valid?.source).toBe('Binance Spot + CoinGecko USDT/USD');
    expect(valid?.bidUSDT?.BTC).toBe(59000);
    expect(valid?.askUSDT?.BTC).toBe(61000);
    expect(valid?.usd?.BTC).toBeCloseTo(60000 * 0.998);
    expect(valid?.quotedAt).toBe(NOW);
    expect(validateBinanceSnapshot([...ticks].reverse(), 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot([...ticks.slice(0,2)], 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot([{...ticks[0], askPrice:'0'}, ...ticks.slice(1)], 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot([{...ticks[0], askPrice:'58000'}, ...ticks.slice(1)], 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot([{...ticks[0], askPrice:'90000'}, ...ticks.slice(1)], 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot([{...ticks[0], askPrice:'Infinity'}, ...ticks.slice(1)], 1, NOW)).toBeNull();
    expect(validateBinanceSnapshot(ticks, 0.75, NOW)).toBeNull();
  });
  it('rejects missing, obsolete and future CoinGecko source timestamps', () => {
    const valid = validateCoinGeckoSnapshot(gecko, NOW);
    expect(valid?.usd?.ETH).toBe(3000);
    expect(valid?.quotedAt).toBe(NOW - 5 * 60_000);
    expect(validateCoinGeckoSnapshot({...gecko, litecoin: null}, NOW)).toBeNull();
    expect(validateCoinGeckoSnapshot({...gecko, ethereum: {...gecko.ethereum, usd: -3}}, NOW)).toBeNull();
    expect(validateCoinGeckoSnapshot({...gecko, bitcoin: {...gecko.bitcoin, last_updated_at: (NOW - 50 * 60_000) / 1000}}, NOW)).toBeNull();
    expect(validateCoinGeckoSnapshot({...gecko, bitcoin: {...gecko.bitcoin, last_updated_at: (NOW + 50 * 60_000) / 1000}}, NOW)).toBeNull();
  });
  it('requires Coinbase currency and matching coin on every spot response', () => {
    const snapshot = validateCoinbaseSnapshot(coinbase, NOW);
    expect(snapshot?.usd?.LTC).toBe(100);
    expect(snapshot?.source).toBe('Coinbase (USD, respaldo)');
    expect(snapshot?.quotedAt).toBeUndefined();
    expect(validateCoinbaseSnapshot([...coinbase].reverse(), NOW)).toBeNull();
    expect(validateCoinbaseSnapshot(coinbase.slice(1), NOW)).toBeNull();
    expect(validateCoinbaseSnapshot([{ data: {base:'BTC',currency:'EUR',amount:'60000'} },...coinbase.slice(1)], NOW)).toBeNull();
    expect(validateCoinbaseSnapshot([{ data: {base:'BTC',currency:'USD',amount:'0'} },...coinbase.slice(1)], NOW)).toBeNull();
    expect(validateCoinbaseSnapshot({}, NOW)).toBeNull();
  });
});
