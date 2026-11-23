import { CRYPTO_CODES, type CurrencyCode } from '../types/currency';

/** Strictly typed locale-aware amount parser. Returns NaN on ambiguity. */
export function parseAmount(raw: string | number, code: CurrencyCode): number {
  let s = String(raw).replace(/[\s\u00a0\u202f]/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return NaN;
  const c = s.lastIndexOf(','),
    d = s.lastIndexOf('.');
  if (c !== -1 && d !== -1) {
    const dec = c > d ? ',' : '.';
    s = s
      .split(dec === ',' ? '.' : ',')
      .join('')
      .replace(dec, '.');
  } else {
    const sep = c !== -1 ? ',' : d !== -1 ? '.' : '';
    if (sep) {
      const bits = s.split(sep);
      const cryptoCode = CRYPTO_CODES.has(code);
      if (
        !cryptoCode &&
        bits.length === 2 &&
        (bits[1]?.length ?? 0) === 3 &&
        (bits[0]?.length ?? 0) <= 3
      )
        return NaN; // 1.234 puede significar 1,234 o 1234.
      if (bits.length > 2) s = bits.join('');
      else s = bits.join('.');
    }
  }
  const value = Number(s);
  return value > 0 && value < 1e12 && Number.isFinite(value) ? value : NaN;
}
