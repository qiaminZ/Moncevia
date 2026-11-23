/** Exact 10^-8 unit conversions for estimating crypto withdrawal balances. */
export function coinMinor(raw: string | number): bigint | null {
  const initial = String(raw).trim().replace(',', '.');
  const s =
    /e/i.test(initial) && Number.isFinite(Number(initial)) ? Number(initial).toFixed(8) : initial;
  if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
  const [integer, fraction = ''] = s.split('.');
  if (!integer || integer.length > 10 || fraction.length > 8) return null;
  return BigInt(integer) * 100_000_000n + BigInt((fraction + '00000000').slice(0, 8));
}

/** Always rounds up the remaining fractional satoshi, without silently truncating fees. */
export function ceil8(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > 1e10) return null;
  const s = value.toFixed(12);
  const [integer, fraction = ''] = s.split('.');
  if (!integer) return null;
  let units = BigInt(integer) * 100_000_000n + BigInt((fraction + '00000000').slice(0, 8));
  if (/[1-9]/.test(fraction.slice(8))) units += 1n;
  return Number(units) / 1e8;
}

/** Two decimal estimate only; never use this to round an exact crypto withdrawal. */
export const roundUp2 = (value: number): number | null =>
  Number.isFinite(value) ? Math.ceil((value - 1e-10) * 100) / 100 : null;
