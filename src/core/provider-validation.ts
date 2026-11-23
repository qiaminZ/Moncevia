import { CRYPTO_LIST, type CryptoCurrency } from '../types/currency';
import { CRYPTO_STALE_MS, type CryptoRates } from './conversion';

type RecordObject = Record<string, unknown>;
const record = (v: unknown): v is RecordObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const positive = (v: unknown): number | null => {
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const fresh = (unixSeconds: unknown, now: number): number | null => {
  const time = positive(unixSeconds);
  if (time === null || !Number.isFinite(now)) return null;
  const timeMs = time * 1000;
  return Math.abs(now - timeMs) <= CRYPTO_STALE_MS ? timeMs : null;
};

/** Validate the separately sourced USDT/USD midpoint; USDT is not treated as USD. */
export function validateUSDTParity(input: unknown, now: number): number | null {
  if (!record(input) || !record(input.tether)) return null;
  const parity = positive(input.tether.usd);
  const timestamp = fresh(input.tether.last_updated_at, now);
  return parity !== null && parity >= 0.8 && parity <= 1.2 && timestamp !== null
    ? parity : null;
}

/** Binance bookTicker entries have no source timestamp: fetchedAt is a local receipt time. */
export function validateBinanceSnapshot(
  tickers: unknown, usdtUsd: number, now: number,
): CryptoRates | null {
  if (!Array.isArray(tickers) || tickers.length !== CRYPTO_LIST.length ||
      !Number.isFinite(now) || !Number.isFinite(usdtUsd) ||
      usdtUsd < 0.8 || usdtUsd > 1.2) return null;
  const usd: Partial<Record<CryptoCurrency, number>> = {};
  const askUSDT: Partial<Record<CryptoCurrency, number>> = {};
  const bidUSDT: Partial<Record<CryptoCurrency, number>> = {};
  for (let index = 0; index < CRYPTO_LIST.length; index++) {
    const coin = CRYPTO_LIST[index];
    const entry: unknown = tickers[index];
    if (!coin || !record(entry) || entry.symbol !== coin + 'USDT') return null;
    const ask = positive(entry.askPrice), bid = positive(entry.bidPrice);
    if (ask === null || bid === null || ask < bid || ask / bid > 1.15) return null;
    const mid = ((ask + bid) / 2) * usdtUsd;
    if (!Number.isFinite(mid) || mid <= 0) return null;
    askUSDT[coin] = ask;
    bidUSDT[coin] = bid;
    usd[coin] = mid;
  }
  return {
    fetchedAt: now,
    quotedAt: now,
    source: 'Binance Spot + CoinGecko USDT/USD',
    usdtUsd, usd, askUSDT, bidUSDT,
  };
}

/** CoinGecko fallback requires independently fresh USD quotes for all three coins. */
export function validateCoinGeckoSnapshot(input: unknown, now: number): CryptoRates | null {
  if (!record(input) || !Number.isFinite(now)) return null;
  const ids: Record<CryptoCurrency, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', LTC: 'litecoin',
  };
  const usd: Partial<Record<CryptoCurrency, number>> = {};
  let quotedAt = Infinity;
  for (const coin of CRYPTO_LIST) {
    const item = input[ids[coin]];
    if (!record(item)) return null;
    const value = positive(item.usd);
    const timestamp = fresh(item.last_updated_at, now);
    if (value === null || timestamp === null) return null;
    usd[coin] = value;
    quotedAt = Math.min(quotedAt, timestamp);
  }
  return { fetchedAt: now, quotedAt, source: 'CoinGecko (USD, respaldo)', usd };
}

/**
 * Coinbase spot endpoint has no quote timestamp. Disclose it as a fallback,
 * and let existing local receipt-time expiry rules control its lifetime.
 */
export function validateCoinbaseSnapshot(input: unknown, now: number): CryptoRates | null {
  if (!Array.isArray(input) || input.length !== CRYPTO_LIST.length || !Number.isFinite(now)) return null;
  const usd: Partial<Record<CryptoCurrency, number>> = {};
  for (let index = 0; index < CRYPTO_LIST.length; index++) {
    const coin = CRYPTO_LIST[index], response: unknown = input[index];
    if (!coin || !record(response) || !record(response.data) ||
        response.data.base !== coin || response.data.currency !== 'USD') return null;
    const amount = positive(response.data.amount);
    if (amount === null) return null;
    usd[coin] = amount;
  }
  return { fetchedAt: now, source: 'Coinbase (USD, respaldo)', usd };
}
