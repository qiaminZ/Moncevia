import { readCachedCrypto, readCachedFX } from '../core/cache-validation';
import { normalizeSettings, type MonceviaSettings } from '../core/settings-validation';
import type { GMBridge } from './gm-bridge';

/** Existing keys are part of the on-device compatibility contract. Do not rename. */
export const MONCEVIA_STORAGE_KEYS = {
  settings: 'clplens_v1',
  fx: 'clplens_usd_rates_v1',
  crypto: 'clplens_crypto_rates_v2',
  history: 'clplens_history_v3',
} as const;

export interface StoredHistoryEntry extends Record<string, unknown> {
  at: number;
  code: string;
  amount: number | string;
  clp: number | string;
}

export interface StoredAppState {
  settings: MonceviaSettings;
  fx: ReturnType<typeof readCachedFX>;
  crypto: ReturnType<typeof readCachedCrypto>;
  history: StoredHistoryEntry[];
}

export interface PersistenceController {
  load(): Promise<StoredAppState>;
  saveSettings(settings: MonceviaSettings): Promise<boolean>;
  saveHistory(history: readonly StoredHistoryEntry[]): Promise<boolean>;
}

export interface PersistenceOptions {
  storage: Pick<GMBridge, 'getValue' | 'setValue'>;
  defaults: MonceviaSettings;
  onError?: (scope: string, error: unknown) => void;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositive(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/** Keep the pre-existing 30-item cap and historical fields; reject damaged records. */
export function readStoredHistory(value: unknown): StoredHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).filter((entry): entry is StoredHistoryEntry =>
    record(entry) &&
    typeof entry.at === 'number' &&
    Number.isFinite(entry.at) &&
    typeof entry.code === 'string' &&
    isPositive(entry.amount) &&
    isPositive(entry.clp),
  );
}

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Separates storage failures by key so corrupt FX/history do not suppress valid
 * site consent and settings. Serializes preference writes in the order the user
 * initiated them; snapshots are captured before the asynchronous queue starts.
 */
export function createPersistenceController({
  storage,
  defaults,
  onError = () => {},
}: PersistenceOptions): PersistenceController {
  let settingsQueue: Promise<void> = Promise.resolve();
  let historyQueue: Promise<void> = Promise.resolve();

  async function read(key: string, fallback: unknown): Promise<unknown> {
    try {
      return await storage.getValue(key, fallback);
    } catch (error) {
      onError(key, error);
      return fallback;
    }
  }

  function enqueue(
    key: string,
    value: unknown,
    queue: 'settings' | 'history',
  ): Promise<boolean> {
    let copied: unknown;
    try {
      copied = snapshot(value);
    } catch (error) {
      onError(key, error);
      return Promise.resolve(false);
    }
    const previous = queue === 'settings' ? settingsQueue : historyQueue;
    const result = previous
      .then(() => storage.setValue(key, copied))
      .then((saved) => {
        if (saved === false) throw new Error('The storage manager rejected the write');
        return true;
      })
      .catch((error: unknown) => {
        onError(key, error);
        return false;
      });
    const complete = result.then(() => undefined);
    if (queue === 'settings') settingsQueue = complete;
    else historyQueue = complete;
    return result;
  }

  return {
    async load(): Promise<StoredAppState> {
      const previous = await read(MONCEVIA_STORAGE_KEYS.settings, null);
      const settings = normalizeSettings(previous, defaults);
      const cachedFX = await read(MONCEVIA_STORAGE_KEYS.fx, null);
      const rawHistory = await read(MONCEVIA_STORAGE_KEYS.history, []);
      const cachedCrypto = await read(MONCEVIA_STORAGE_KEYS.crypto, null);
      return {
        settings,
        fx: readCachedFX(cachedFX),
        history: readStoredHistory(rawHistory),
        crypto: readCachedCrypto(cachedCrypto),
      };
    },
    saveSettings(settings: MonceviaSettings): Promise<boolean> {
      return enqueue(MONCEVIA_STORAGE_KEYS.settings, settings, 'settings');
    },
    saveHistory(history: readonly StoredHistoryEntry[]): Promise<boolean> {
      return enqueue(MONCEVIA_STORAGE_KEYS.history, history, 'history');
    },
  };
}
