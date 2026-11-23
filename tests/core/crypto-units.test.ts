import { describe, expect, it } from 'vitest';
import { ceil8, coinMinor, roundUp2 } from '../../src/core/crypto-units';

describe('Exact eight-decimal crypto units', () => {
  it('parses exact satoshis without binary floating-point loss', () => {
    expect(coinMinor('0.00000001')).toBe(1n);
    expect(coinMinor('0.00046367')).toBe(46367n);
    expect(coinMinor('0,01526209')).toBe(1526209n);
    expect(coinMinor('1.10000001')).toBe(110000001n);
    expect(coinMinor('1e-8')).toBe(1n);
  });
  it('rejects negative, nonnumeric and too-precise transfers', () => {
    for (const value of ['-0.1', '0.123456789', 'not a number', '99999999999.00000001']) {
      expect(coinMinor(value)).toBeNull();
    }
  });
  it('always rounds residual fractional units up', () => {
    expect(ceil8(0.000000001)).toBe(0.00000001);
    expect(ceil8(0.123456780001)).toBe(0.12345679);
    expect(ceil8(1)).toBe(1);
    expect(ceil8(-1)).toBeNull();
    expect(ceil8(Number.POSITIVE_INFINITY)).toBeNull();
  });
  it('limits two-decimal estimates without affecting exact transfers', () => {
    expect(roundUp2(24.9901)).toBe(25);
    expect(roundUp2(24.99)).toBe(24.99);
    expect(roundUp2(Number.NaN)).toBeNull();
  });
});
