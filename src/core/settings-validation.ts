import { CRYPTO_LIST, FIAT_CODES, type CurrencyCode, type CryptoCurrency } from '../types/currency';

export type DollarCurrency = 'USD' | 'CLP' | 'CAD' | 'AUD';
export type UILanguage = 'auto' | 'es' | 'en';
export interface ButtonPosition { readonly x: number; readonly y: number }

export interface MonceviaSettings {
  enabled: boolean;
  disabledSites: string[];
  bareDollarSites: string[];
  dollarCurrencySites: Record<string, DollarCurrency>;
  allowedSites: string[];
  historySite: boolean;
  compareInline: boolean;
  usdClpManual: number;
  eurClpManual: number;
  prexExtra: number;
  santanderExtra: number;
  taxExtra: number;
  showCryptoInline: boolean;
  autoSyncSelection: boolean;
  feeBTC: number;
  feeETH: number;
  feeLTC: number;
  feeKnownBTC: boolean;
  feeKnownETH: boolean;
  feeKnownLTC: boolean;
  networkBTC: string;
  networkETH: string;
  networkLTC: string;
  spotFeePct: number;
  spotFeeKnown: boolean;
  usdtFundPct: number;
  usdtFundKnown: boolean;
  bufferPct: number;
  compactMode: boolean;
  visualPick: boolean;
  prexKnown: boolean;
  santanderKnown: boolean;
  exactPayEnabled: boolean;
  exactPayAmount: string;
  exactPayCurrency: CryptoCurrency;
  calcAmount: string;
  calcCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  language: UILanguage;
  fabPosition: ButtonPosition | null;
}
const rec = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const hostRE = /^[a-z0-9.-]{1,255}$/;
const boolKeys = [
  'enabled','historySite','compareInline','showCryptoInline','autoSyncSelection',
  'feeKnownBTC','feeKnownETH','feeKnownLTC','spotFeeKnown','usdtFundKnown',
  'compactMode','visualPick','prexKnown','santanderKnown','exactPayEnabled',
] as const;
const numberKeys = [
  'usdClpManual','eurClpManual','prexExtra','santanderExtra','taxExtra',
  'feeBTC','feeETH','feeLTC','spotFeePct','usdtFundPct','bufferPct',
] as const;
const dollarCodes: readonly string[] = ['USD','CLP','CAD','AUD'];
const currencies: readonly string[] = ['CLP',...FIAT_CODES,...CRYPTO_LIST];

function hosts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((host): host is string =>
    typeof host === 'string' && hostRE.test(host)))].slice(0,100);
}
function safeNumber(input: unknown, fallback: number): number {
  if ((typeof input !== 'number' && typeof input !== 'string') || String(input).trim() === '') return fallback;
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 && n <= 1e10 ? n : fallback;
}
function safeText(input: unknown, fallback: string, max = 80): string {
  return typeof input === 'string' && input.length <= max ? input : fallback;
}

/**
 * Treat persisted Userscripts preferences as untrusted. Only known keys are
 * retained; consented hosts never expand automatically. Compatible local keys
 * and legal stored values are preserved across earlier Moncevia versions.
 */
export function normalizeSettings(input: unknown, defaults: MonceviaSettings): MonceviaSettings {
  if (!rec(input)) return {
    ...defaults,
    allowedSites: [...defaults.allowedSites],
    disabledSites: [...defaults.disabledSites],
    bareDollarSites: [...defaults.bareDollarSites],
    dollarCurrencySites: { ...defaults.dollarCurrencySites },
    fabPosition: defaults.fabPosition && { ...defaults.fabPosition },
  };
  const result: MonceviaSettings = {
    ...defaults,
    allowedSites: [...defaults.allowedSites],
    disabledSites: [...defaults.disabledSites],
    bareDollarSites: [...defaults.bareDollarSites],
    dollarCurrencySites: { ...defaults.dollarCurrencySites },
  };

  for (const key of boolKeys) if (typeof input[key] === 'boolean') result[key] = input[key];
  for (const key of numberKeys) result[key] = safeNumber(input[key], defaults[key]);
  for (const key of ['allowedSites','disabledSites','bareDollarSites'] as const) {
    if (Object.prototype.hasOwnProperty.call(input,key)) result[key] = hosts(input[key]);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'dollarCurrencySites')) {
    const overrides: Record<string, DollarCurrency> = Object.create(null);
    if (rec(input.dollarCurrencySites)) {
      for (const [host, code] of Object.entries(input.dollarCurrencySites).slice(0,200)) {
        if (hostRE.test(host) && typeof code === 'string' && dollarCodes.includes(code)) {
          overrides[host] = code as DollarCurrency;
        }
        if (Object.keys(overrides).length >= 100) break;
      }
    }
    result.dollarCurrencySites = overrides;
  }

  const source = input.calcCurrency;
  if (typeof source === 'string' && currencies.includes(source)) result.calcCurrency = source as CurrencyCode;
  const target = input.targetCurrency;
  if (typeof target === 'string' && currencies.includes(target)) result.targetCurrency = target as CurrencyCode;
  if (result.calcCurrency === result.targetCurrency) {
    result.targetCurrency = result.calcCurrency === 'CLP' ? 'USD' : 'CLP';
  }
  if (input.language === 'auto' || input.language === 'es' || input.language === 'en')
    result.language = input.language;
  if (typeof input.exactPayCurrency === 'string' &&
      CRYPTO_LIST.some(code => code === input.exactPayCurrency)) {
    result.exactPayCurrency = input.exactPayCurrency as CryptoCurrency;
  }
  result.calcAmount = safeText(input.calcAmount, defaults.calcAmount, 80);
  result.exactPayAmount = safeText(input.exactPayAmount, defaults.exactPayAmount, 80);
  for (const key of ['networkBTC','networkETH','networkLTC'] as const) {
    result[key] = safeText(input[key], defaults[key], 80);
  }

  if (input.fabPosition === null) result.fabPosition = null;
  else if (rec(input.fabPosition)) {
    const {x,y} = input.fabPosition;
    result.fabPosition = typeof x === 'number' && typeof y === 'number' &&
      Number.isFinite(x) && Number.isFinite(y) &&
      x >= 0 && x <= 1 && y >= 0 && y <= 1 ? {x,y} : null;
  }
  return result;
}
