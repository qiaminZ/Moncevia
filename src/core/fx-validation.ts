import { FIAT_CODES, type FiatCurrency } from '../types/currency';
import type { FxRates } from './conversion';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Untrusted ExchangeRate-API response validator. Invalid or outdated market
 * data must never enter the local cache used for financial estimates.
 */
export function validateFXResponse(
  input: unknown,
  now: number,
): (FxRates & { providerTime: number }) | null {
  if (
    !isRecord(input) ||
    input.result !== 'success' ||
    input.base_code !== 'USD' ||
    !isRecord(input.rates)
  )
    return null;
  const epoch = input.time_last_update_unix;
  if (!positive(epoch) || !Number.isFinite(now)) return null;
  const providerTime = epoch * 1000;
  if (providerTime > now + 3_600_000 || now - providerTime > 7 * 86_400_000) return null;
  if (!positive(input.rates.CLP) || !positive(input.rates.EUR)) return null;
  const rates: Partial<Record<FiatCurrency, number>> = {};
  for (const code of [...FIAT_CODES, 'CLP'] as const) {
    const value = input.rates[code];
    if (positive(value)) rates[code] = value;
  }
  return { fetchedAt: now, providerTime, rates };
}
