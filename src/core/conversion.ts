import { CRYPTO_LIST, FIAT_CODES, type CryptoCurrency, type CurrencyCode, type FiatCurrency } from '../types/currency';

export const FX_STALE_MS = 3 * 86_400_000;
export const CRYPTO_STALE_MS = 45 * 60_000;

export interface FxRates {
  readonly fetchedAt: number;
  readonly rates: Partial<Record<FiatCurrency, number>>;
}
export interface CryptoRates {
  readonly fetchedAt: number;
  readonly quotedAt?: number;
  readonly source?: string;
  readonly usd?: Partial<Record<CryptoCurrency, number>>;
  readonly askUSDT?: Partial<Record<CryptoCurrency, number>>;
  readonly bidUSDT?: Partial<Record<CryptoCurrency, number>>;
  readonly usdtUsd?: number;
}
export interface RateOverrides {
  readonly usdClpManual: number | string;
  readonly eurClpManual: number | string;
}
export interface ConversionContext {
  readonly now: number;
  readonly settings: RateOverrides;
  readonly fx: FxRates | null;
  readonly crypto: CryptoRates | null;
}

const isPositive = (value: unknown): boolean => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};
const inDate = (value: { readonly fetchedAt: number } | null, now: number, ttl: number) =>
  value !== null && Number.isFinite(value.fetchedAt) &&
  now - value.fetchedAt >= 0 && now - value.fetchedAt < ttl;

/** Pure rate and conversion calculator. This does not fetch or mutate application state. */
export function createConversionEngine(context: ConversionContext) {
  const { settings, fx, crypto, now } = context;
  const activeFX = () => inDate(fx, now, FX_STALE_MS) &&
    isPositive(fx?.rates.EUR) && isPositive(fx?.rates.CLP);
  const activeCrypto = () => inDate(crypto, now, CRYPTO_STALE_MS) &&
    (!crypto?.quotedAt || (now - crypto.quotedAt >= -300_000 && now - crypto.quotedAt < CRYPTO_STALE_MS)) &&
    CRYPTO_LIST.every(code => isPositive(crypto?.usd?.[code])) &&
    (!crypto?.source?.startsWith('Binance') || isPositive(crypto.usdtUsd));

  const usdClp = (): number | null => {
    if (isPositive(settings.usdClpManual)) return Number(settings.usdClpManual);
    return activeFX() ? Number(fx?.rates.CLP) : null;
  };
  const eurClp = (): number | null => {
    if (isPositive(settings.eurClpManual)) return Number(settings.eurClpManual);
    const base = usdClp();
    return activeFX() && base !== null ? base / Number(fx?.rates.EUR) : null;
  };
  const spotAsk = (code: CryptoCurrency): number | null => {
    if (!activeCrypto()) return null;
    return isPositive(crypto?.askUSDT?.[code])
      ? Number(crypto?.askUSDT?.[code]) * Number(crypto?.usdtUsd)
      : Number(crypto?.usd?.[code]);
  };
  const spotBid = (code: CryptoCurrency): number | null => {
    if (!activeCrypto()) return null;
    return isPositive(crypto?.bidUSDT?.[code])
      ? Number(crypto?.bidUSDT?.[code]) * Number(crypto?.usdtUsd)
      : Number(crypto?.usd?.[code]);
  };
  const fiatUsd = (amount: number, code: CurrencyCode): number | null => {
    if (code === 'USD') return amount;
    const base = usdClp();
    if (code === 'EUR' && isPositive(settings.eurClpManual) && base !== null) {
      return amount * Number(settings.eurClpManual) / base;
    }
    if (CRYPTO_LIST.some(coin => coin === code)) {
      const bid = spotBid(code as CryptoCurrency);
      return bid === null ? null : amount * bid;
    }
    if (!activeFX() || !isPositive(fx?.rates[code as FiatCurrency])) return null;
    return amount / Number(fx?.rates[code as FiatCurrency]);
  };
  const toCLP = (amount: number, code: CurrencyCode): number | null => {
    if (code === 'CLP') return amount;
    if (code === 'EUR' && isPositive(settings.eurClpManual)) {
      return amount * Number(settings.eurClpManual);
    }
    const usd = fiatUsd(amount, code), rate = usdClp();
    return usd !== null && rate !== null ? usd * rate : null;
  };
  const toUnits = (amount: number, from: CurrencyCode, to: CurrencyCode): number | null => {
    if (from === to) return amount;
    if (to === 'CLP') return toCLP(amount, from);
    if (from === 'CLP') {
      const rate = usdClp();
      if (rate === null) return null;
      return toUnits(amount / rate, 'USD', to);
    }
    const usd = fiatUsd(amount, from);
    if (usd === null) return null;
    if (to === 'USD') return usd;
    const rate = usdClp();
    if (to === 'EUR' && isPositive(settings.eurClpManual) && rate !== null) {
      return usd * rate / Number(settings.eurClpManual);
    }
    if (FIAT_CODES.some(fiat => fiat === to) && activeFX() &&
        isPositive(fx?.rates[to as FiatCurrency])) {
      return usd * Number(fx?.rates[to as FiatCurrency]);
    }
    if (CRYPTO_LIST.some(coin => coin === to) && activeCrypto()) {
      const ask = spotAsk(to as CryptoCurrency);
      return ask !== null && ask > 0 ? usd / ask : null;
    }
    return null;
  };
  return { activeFX, activeCrypto, fiatUsd, usdClp, eurClp, toCLP, toUnits, spotAsk, spotBid } as const;
}
