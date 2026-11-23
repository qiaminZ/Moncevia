import { CRYPTO_LIST, FIAT_CODES, type CryptoCurrency, type FiatCurrency } from '../types/currency';
import type { CryptoRates, FxRates } from './conversion';

const record = (input: unknown): input is Record<string, unknown> =>
  typeof input === 'object' && input !== null && !Array.isArray(input);
const positiveNumber = (input: unknown): number | null => {
  const value = typeof input === 'number' || typeof input === 'string' ? Number(input) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
};

/** Parse the browser's own cached FX data instead of trusting a stored JSON object. */
export function readCachedFX(input: unknown): (FxRates & { readonly updatedAt?: string }) | null {
  if (!record(input) || !Number.isFinite(input.fetchedAt) || !record(input.rates)) return null;
  const rates: Partial<Record<FiatCurrency, number>> = {};
  for (const code of [...FIAT_CODES, 'CLP'] as const) {
    const value = positiveNumber(input.rates[code]);
    if (value !== null) rates[code] = value;
  }
  if (!rates.CLP || !rates.EUR) return null;
  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt.slice(0, 80) : undefined;
  return updatedAt === undefined
    ? { fetchedAt: input.fetchedAt as number, rates }
    : { fetchedAt: input.fetchedAt as number, rates, updatedAt };
}

/** Validate the untrusted local crypto cache without introducing new permissions. */
export function readCachedCrypto(input: unknown): CryptoRates | null {
  if (!record(input) || !Number.isFinite(input.fetchedAt) || !record(input.usd)) return null;
  const usd: Partial<Record<CryptoCurrency, number>> = {};
  for (const code of CRYPTO_LIST) {
    const value = positiveNumber(input.usd[code]);
    if (value === null) return null;
    usd[code] = value;
  }
  const source = typeof input.source === 'string' ? input.source.slice(0, 100) : undefined;
  const parity = positiveNumber(input.usdtUsd);
  if (source?.startsWith('Binance') && parity === null) return null;
  const askUSDT: Partial<Record<CryptoCurrency, number>> = {};
  const bidUSDT: Partial<Record<CryptoCurrency, number>> = {};
  for (const code of CRYPTO_LIST) {
    const ask = record(input.askUSDT) ? positiveNumber(input.askUSDT[code]) : null;
    const bid = record(input.bidUSDT) ? positiveNumber(input.bidUSDT[code]) : null;
    if (ask !== null) askUSDT[code] = ask;
    if (bid !== null) bidUSDT[code] = bid;
  }
  const quotedAt = typeof input.quotedAt === 'number' && Number.isFinite(input.quotedAt)
    ? input.quotedAt : undefined;
  return {
    fetchedAt: input.fetchedAt as number,
    usd,
    ...(source === undefined ? {} : { source }),
    ...(quotedAt === undefined ? {} : { quotedAt }),
    ...(parity === null ? {} : { usdtUsd: parity }),
    ...(Object.keys(askUSDT).length ? { askUSDT } : {}),
    ...(Object.keys(bidUSDT).length ? { bidUSDT } : {}),
  };
}
