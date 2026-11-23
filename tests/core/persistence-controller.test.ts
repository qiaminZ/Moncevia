import { describe, expect, it, vi } from 'vitest';
import type { MonceviaSettings } from '../../src/core/settings-validation';
import type { GMBridge } from '../../src/platform/gm-bridge';
import {
  MONCEVIA_STORAGE_KEYS,
  createPersistenceController,
  readStoredHistory,
} from '../../src/platform/persistence-controller';

const defaults: MonceviaSettings = {
  enabled: true,
  disabledSites: [],
  bareDollarSites: [],
  dollarCurrencySites: {},
  allowedSites: ['shop.riftbot.org'],
  historySite: false,
  compareInline: false,
  usdClpManual: 0,
  eurClpManual: 0,
  prexExtra: 0,
  santanderExtra: 0,
  taxExtra: 0,
  showCryptoInline: true,
  autoSyncSelection: true,
  feeBTC: 0,
  feeETH: 0,
  feeLTC: 0,
  feeKnownBTC: false,
  feeKnownETH: false,
  feeKnownLTC: false,
  networkBTC: 'Bitcoin',
  networkETH: 'Ethereum',
  networkLTC: 'Litecoin',
  spotFeePct: 0,
  spotFeeKnown: false,
  usdtFundPct: 0,
  usdtFundKnown: false,
  bufferPct: 0,
  compactMode: false,
  visualPick: true,
  prexKnown: false,
  santanderKnown: false,
  exactPayEnabled: false,
  exactPayAmount: '',
  exactPayCurrency: 'LTC',
  calcAmount: '24.99',
  calcCurrency: 'EUR',
  targetCurrency: 'CLP',
  language: 'auto',
  fabPosition: null,
};

type Storage = Pick<GMBridge, 'getValue' | 'setValue'>;

describe('Phase 10 durable state lifecycle', () => {
  it('preserves the established on-device storage key names', () => {
    expect(MONCEVIA_STORAGE_KEYS).toEqual({
      settings: 'clplens_v1',
      fx: 'clplens_usd_rates_v1',
      crypto: 'clplens_crypto_rates_v2',
      history: 'clplens_history_v3',
    });
  });

  it('recovers valid consent, rates and history when an independent storage key fails', async () => {
    const seen: string[] = [];
    const storage: Storage = {
      async getValue<T>(key: string, fallback: T): Promise<T> {
        seen.push(key);
        if (key === MONCEVIA_STORAGE_KEYS.settings)
          return {
            language: 'en',
            allowedSites: ['shop.riftbot.org', 'allowed.example'],
          } as unknown as T;
        if (key === MONCEVIA_STORAGE_KEYS.fx) throw new Error('FX storage unavailable');
        if (key === MONCEVIA_STORAGE_KEYS.history)
          return [
            null,
            { at: 1720000000000, amount: '12.5', code: 'EUR', clp: 12600, site: 'no guardado' },
            { at: 'invalid', amount: 10, code: 'USD', clp: 10000 },
          ] as unknown as T;
        if (key === MONCEVIA_STORAGE_KEYS.crypto)
          return {
            fetchedAt: Date.now(),
            usd: { BTC: 79000, ETH: 2300, LTC: 60 },
            source: 'CoinGecko',
          } as unknown as T;
        return fallback;
      },
      async setValue() {
        return true;
      },
    };
    const onError = vi.fn();
    const state = await createPersistenceController({ storage, defaults, onError }).load();
    expect(state.settings.language).toBe('en');
    expect(state.settings.allowedSites).toEqual(['shop.riftbot.org', 'allowed.example']);
    expect(state.fx).toBeNull();
    expect(state.crypto?.usd.LTC).toBe(60);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].site).toBe('no guardado');
    expect(seen).toEqual([
      MONCEVIA_STORAGE_KEYS.settings,
      MONCEVIA_STORAGE_KEYS.fx,
      MONCEVIA_STORAGE_KEYS.history,
      MONCEVIA_STORAGE_KEYS.crypto,
    ]);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(MONCEVIA_STORAGE_KEYS.fx, expect.any(Error));
  });

  it('normalizes corrupt settings and never invents authorized domains', async () => {
    const storage: Storage = {
      async getValue<T>(key: string, fallback: T): Promise<T> {
        if (key === MONCEVIA_STORAGE_KEYS.settings)
          return {
            allowedSites: 'not an array',
            dollarCurrencySites: { 'invalid host': 'USD' },
            enabled: 'true',
          } as unknown as T;
        return fallback;
      },
      async setValue() {
        return true;
      },
    };
    const state = await createPersistenceController({ storage, defaults }).load();
    expect(state.settings.allowedSites).toEqual([]);
    expect(state.settings.dollarCurrencySites).toEqual({});
    expect(state.settings.enabled).toBe(true);
    expect(state.history).toEqual([]);
  });

  it('caps stored history at 30 entries and filters malformed or null entries', () => {
    const entries = Array.from({ length: 35 }, (_, index) => ({
      at: 1720000000000 + index,
      code: 'EUR',
      amount: index + 1,
      clp: 1000,
      units: { LTC: 0.01 },
    }));
    expect(readStoredHistory(entries)).toHaveLength(30);
    expect(readStoredHistory([null, {}, { at: NaN, code: 'USD', amount: 1, clp: 10 }])).toEqual([]);
    expect(readStoredHistory('invalid')).toEqual([]);
  });

  it('serializes captured setting snapshots despite delayed writes', async () => {
    const written: { language: string }[] = [];
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    let count = 0;
    const storage: Storage = {
      async getValue<T>(_key: string, fallback: T): Promise<T> {
        return fallback;
      },
      async setValue(_key, value) {
        if (++count === 1) {
          started();
          await held;
        }
        written.push(value as { language: string });
        return true;
      },
    };
    const controller = createPersistenceController({ storage, defaults });
    const current = { ...defaults, language: 'es' as const };
    const first = controller.saveSettings(current);
    await firstStarted;
    const second = controller.saveSettings({ ...current, language: 'en' });
    release();
    expect(await Promise.all([first, second])).toEqual([true, true]);
    expect(written.map((entry) => entry.language)).toEqual(['es', 'en']);
  });

  it('does not let rejected preference writes block later ones', async () => {
    let count = 0;
    const onError = vi.fn();
    const storage: Storage = {
      async getValue<T>(_key: string, fallback: T): Promise<T> {
        return fallback;
      },
      async setValue() {
        if (++count === 1) throw new Error('storage offline');
        return true;
      },
    };
    const controller = createPersistenceController({ storage, defaults, onError });
    expect(await controller.saveSettings(defaults)).toBe(false);
    expect(await controller.saveSettings({ ...defaults, language: 'en' })).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('treats an explicit false result as a failed consent write', async () => {
    const storage: Storage = {
      async getValue<T>(_key: string, fallback: T): Promise<T> {
        return fallback;
      },
      async setValue() {
        return false;
      },
    };
    const controller = createPersistenceController({ storage, defaults });
    await expect(controller.saveSettings(defaults)).resolves.toBe(false);
  });

  it('serializes history writes without conflating them with settings', async () => {
    const keys: string[] = [];
    const storage: Storage = {
      async getValue<T>(_key: string, fallback: T): Promise<T> {
        return fallback;
      },
      async setValue(key) {
        keys.push(key);
        return true;
      },
    };
    const controller = createPersistenceController({ storage, defaults });
    const history = [{ at: 1720000000000, code: 'USD', amount: 14, clp: 14000 }];
    expect(await controller.saveHistory(history)).toBe(true);
    history[0].amount = 30;
    expect(await controller.saveHistory([])).toBe(true);
    expect(keys).toEqual([MONCEVIA_STORAGE_KEYS.history, MONCEVIA_STORAGE_KEYS.history]);
  });
});
