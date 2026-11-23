import { describe, expect, it } from 'vitest';
import { normalizeSettings, type MonceviaSettings } from '../../src/core/settings-validation';

const defaults: MonceviaSettings = {
  enabled:true, disabledSites:[], bareDollarSites:[],
  dollarCurrencySites:{}, allowedSites:['shop.riftbot.org'],
  historySite:false, compareInline:false, usdClpManual:0, eurClpManual:0,
  prexExtra:0, santanderExtra:0, taxExtra:0, showCryptoInline:true, autoSyncSelection:true,
  feeBTC:0, feeETH:0, feeLTC:0,
  feeKnownBTC:false, feeKnownETH:false, feeKnownLTC:false,
  networkBTC:'Bitcoin', networkETH:'Ethereum', networkLTC:'Litecoin',
  spotFeePct:0, spotFeeKnown:false, usdtFundPct:0, usdtFundKnown:false, bufferPct:0,
  compactMode:false, visualPick:true, prexKnown:false, santanderKnown:false,
  exactPayEnabled:false, exactPayAmount:'', exactPayCurrency:'LTC',
  calcAmount:'24.99', calcCurrency:'EUR', targetCurrency:'CLP',
  language:'auto', fabPosition:null,
};

describe('Persisted preferences: scoped consent and safe migration', () => {
  it('retains defaults with no stored record and creates independent arrays', () => {
    const s = normalizeSettings(null, defaults);
    expect(s.allowedSites).toEqual(['shop.riftbot.org']);
    expect(s.allowedSites).not.toBe(defaults.allowedSites);
    expect(s.fabPosition).toBeNull();
  });
  it('preserves previously consented domains and legitimate settings', () => {
    const s = normalizeSettings({
      allowedSites:['shop.riftbot.org','another.example'], disabledSites:['blocked.example'],
      bareDollarSites:['shop.riftbot.org'],
      dollarCurrencySites:{'shop.riftbot.org':'CAD'},
      language:'en', enabled:false, targetCurrency:'EUR', calcCurrency:'USD',
      exactPayAmount:'0.00000001', exactPayCurrency:'BTC',
      feeBTC:'0.00001', feeKnownBTC:true, networkBTC:'Lightning',
      usdClpManual:'1130.3', fabPosition:{x:0,y:1},
    }, defaults);
    expect(s.allowedSites).toEqual(['shop.riftbot.org','another.example']);
    expect(s.disabledSites).toEqual(['blocked.example']);
    expect(s.dollarCurrencySites['shop.riftbot.org']).toBe('CAD');
    expect(s.enabled).toBe(false);
    expect(s.calcCurrency).toBe('USD');
    expect(s.targetCurrency).toBe('EUR');
    expect(s.feeBTC).toBe(0.00001);
    expect(s.feeKnownBTC).toBe(true);
    expect(s.usdClpManual).toBe(1130.3);
    expect(s.exactPayAmount).toBe('0.00000001');
    expect(s.exactPayCurrency).toBe('BTC');
    expect(s.fabPosition).toEqual({x:0,y:1});
  });
  it('never promotes malformed domain consent or unknown keys', () => {
    const corrupt = normalizeSettings({
      allowedSites:['valid.example','valid.example','https://evil.example','',12,{}],
      disabledSites:'not-an-array',
      bareDollarSites:['okay.example','BAD EXAMPLE'],
      dollarCurrencySites:{'example.com':'USD','evil site':'AUD','other.com':'XMR'},
      unknownOption:'private data',
      enabled:'true',
    }, defaults);
    expect(corrupt.allowedSites).toEqual(['valid.example']);
    expect(corrupt.disabledSites).toEqual([]);
    expect(corrupt.bareDollarSites).toEqual(['okay.example']);
    expect(Object.entries(corrupt.dollarCurrencySites)).toEqual([['example.com','USD']]);
    expect((corrupt as unknown as Record<string, unknown>).unknownOption).toBeUndefined();
    expect(corrupt.enabled).toBe(true);
  });
  it('falls back from invalid currencies, language and button coordinates', () => {
    const s = normalizeSettings({
      calcCurrency:'ABC', targetCurrency:'BTC',language:'de',exactPayCurrency:'USD',
      fabPosition:{x:1.2,y:0.2},
    }, defaults);
    expect(s.calcCurrency).toBe('EUR');
    expect(s.targetCurrency).toBe('BTC');
    expect(s.language).toBe('auto');
    expect(s.exactPayCurrency).toBe('LTC');
    expect(s.fabPosition).toBeNull();
  });
  it('keeps two displayed currencies distinct and safely rejects invalid numeric inputs', () => {
    const s = normalizeSettings({
      calcCurrency:'USD',targetCurrency:'USD',feeETH:-4,
      usdClpManual:Infinity,prexExtra:'not a number',
    }, defaults);
    expect(s.targetCurrency).toBe('CLP');
    expect(s.feeETH).toBe(0);
    expect(s.usdClpManual).toBe(0);
    expect(s.prexExtra).toBe(0);
  });
  it('prevents unsafe inherited or magic keys from expanding the user permission scope', () => {
    const obj = JSON.parse('{"allowedSites":["safe.example"],"dollarCurrencySites":{"__proto__":"USD","good.example":"AUD"}}');
    const s = normalizeSettings(obj, defaults);
    expect(s.allowedSites).toEqual(['safe.example']);
    expect(s.dollarCurrencySites['good.example']).toBe('AUD');
    expect(Object.getPrototypeOf(s.dollarCurrencySites)).toBeNull();
  });
});
