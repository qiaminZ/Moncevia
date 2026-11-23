import { describe, expect, it } from 'vitest';
import { isCandidateText } from '../../src/detector/scan-controller';
import { TAB_ORDER } from '../../src/ui/tab-controller';

describe('DOM scanner guardrails', () => {
  it('requires short text containing digits and a plausible currency character', () => {
    expect(isCandidateText('€24.99')).toBe(true);
    expect(isCandidateText('USD 125')).toBe(true);
    expect(isCandidateText('0.001 BTC')).toBe(true);
    expect(isCandidateText('12345')).toBe(false);
    expect(isCandidateText('click here')).toBe(false);
    expect(isCandidateText('€' + '9'.repeat(140))).toBe(false);
    expect(isCandidateText(null)).toBe(false);
  });
  it('keeps five stable, unique semantic tab identifiers', () => {
    expect(new Set(TAB_ORDER).size).toBe(TAB_ORDER.length);
    expect(TAB_ORDER).toEqual(['calculator', 'crypto', 'compare', 'history', 'settings']);
  });
});
