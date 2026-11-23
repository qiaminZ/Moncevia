/** Canonical ISO-like currency identifiers used by Moncevia. */
export const FIAT_CODES = ['USD','EUR','GBP','CAD','AUD','JPY','KRW','BRL','CNY'] as const;
export const CRYPTO_LIST = ['BTC','ETH','LTC'] as const;
export const CRYPTO_CODES: ReadonlySet<string> = new Set(CRYPTO_LIST);
export type FiatCurrency = (typeof FIAT_CODES)[number] | 'CLP';
export type CryptoCurrency = (typeof CRYPTO_LIST)[number];
export type CurrencyCode = FiatCurrency | CryptoCurrency;

export interface MoneyAmount {
  readonly amount: number;
  readonly code: CurrencyCode;
}

export interface ExchangeSnapshot {
  readonly fetchedAt: number;
  readonly rates: Partial<Record<FiatCurrency, number>>;
}
