import { describe, expect, it } from 'vitest';
import { validateFXResponse } from '../../src/core/fx-validation';

const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const good = {
  result: 'success', base_code: 'USD',
  time_last_update_unix: (NOW - 3600_000) / 1000,
  rates: { USD: 1, CLP: 1000, EUR: 0.9, GBP: 0.8, JPY: 150, CAD: 'garbage' },
};

describe('Public FX response boundary', () => {
  it('accepts fresh USD-base quotes and ignores invalid optional currencies', () => {
    const parsed = validateFXResponse(good, NOW);
    expect(parsed?.rates.CLP).toBe(1000);
    expect(parsed?.rates.EUR).toBe(0.9);
    expect(parsed?.rates.CAD).toBeUndefined();
    expect(parsed?.providerTime).toBe(NOW - 3600_000);
  });
  it('rejects stale or impossible future provider timestamps', () => {
    expect(validateFXResponse({ ...good, time_last_update_unix: (NOW - 8 * 86_400_000) / 1000 }, NOW)).toBeNull();
    expect(validateFXResponse({ ...good, time_last_update_unix: (NOW + 2 * 3600_000) / 1000 }, NOW)).toBeNull();
  });
  it('rejects non-USD base, invalid types, negative rates and partial results', () => {
    expect(validateFXResponse({ ...good, base_code: 'EUR' }, NOW)).toBeNull();
    expect(validateFXResponse({ ...good, rates: { CLP: -2, EUR: 0.9 } }, NOW)).toBeNull();
    expect(validateFXResponse({ ...good, rates: { CLP: 1000 } }, NOW)).toBeNull();
    expect(validateFXResponse({}, NOW)).toBeNull();
    expect(validateFXResponse(null, NOW)).toBeNull();
    expect(validateFXResponse({ ...good, result: 'error' }, NOW)).toBeNull();
  });
});
