import { describe, expect, it } from 'vitest';
import { clampFab, fabBoundsForViewport, normalizedFabPosition } from '../../src/ui/fab-controller';

describe('floating launcher positioning', () => {
  it('preserves the original viewport margins', () => {
    expect(fabBoundsForViewport(390, 844, 56, 56)).toEqual({
      minX: 8,
      minY: 12,
      maxX: 326,
      maxY: 772,
    });
    expect(fabBoundsForViewport(1366, 768, 56, 56)).toEqual({
      minX: 8,
      minY: 12,
      maxX: 1302,
      maxY: 696,
    });
  });

  it('keeps bounds nonnegative in extremely small viewports', () => {
    expect(fabBoundsForViewport(44, 44, 56, 56)).toEqual({
      minX: 8,
      minY: 12,
      maxX: 8,
      maxY: 12,
    });
  });

  it('clamps pointer movements and restores normalized positions', () => {
    const b = fabBoundsForViewport(390, 844, 56, 56);
    expect(clampFab(-20, b.minX, b.maxX)).toBe(8);
    expect(clampFab(9999, b.minX, b.maxX)).toBe(326);
    expect(normalizedFabPosition(-20, 9999, b)).toEqual({ x: 0, y: 1 });
    expect(normalizedFabPosition(8, 12, b)).toEqual({ x: 0, y: 0 });
    expect(normalizedFabPosition(326, 772, b)).toEqual({ x: 1, y: 1 });
  });

  it('avoids division by zero for degenerate viewport ranges', () => {
    const b = fabBoundsForViewport(20, 20, 100, 100);
    expect(normalizedFabPosition(9, 13, b)).toEqual({ x: 0, y: 0 });
  });
});
