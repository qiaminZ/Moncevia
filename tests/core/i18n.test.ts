import { describe, expect, it } from 'vitest';
import { EN, EN_FRAGMENTS, resolveLanguage, translateUI } from '../../src/i18n/catalog';

describe('Moncevia Spanish-English UI dictionary', () => {
  it('selects explicit UI preferences before browser language', () => {
    expect(resolveLanguage('auto', 'es-CL')).toBe('es');
    expect(resolveLanguage('auto', 'en-US')).toBe('en');
    expect(resolveLanguage('auto', 'ja-JP')).toBe('en');
    expect(resolveLanguage('es', 'en-GB')).toBe('es');
    expect(resolveLanguage('en', 'es-CL')).toBe('en');
  });
  it('preserves source text when Spanish or translation is unknown', () => {
    expect(translateUI('Pagar', 'es')).toBe('Pagar');
    expect(translateUI('Pagar', 'en')).toBe('Pay');
    expect(translateUI('Unknown merchant description', 'en')).toBe('Unknown merchant description');
    expect(translateUI(null, 'en')).toBe('');
  });
  it('keeps key accessibility and financial warnings available in English', () => {
    const labels = [
      'Abrir Moncevia', 'Convertir', 'Pagar', 'Comparar', 'Historial',
      'Ajustes', 'Borrar historial local', 'Permitir Moncevia en este dominio',
      'Sin tasa disponible', 'La comparación de tarjetas aplica un porcentaje configurado sobre CLP. No constituye una cotización oficial de Prex o Santander. Las comisiones de retiro no se aplican automáticamente al texto de los precios.',
    ];
    for (const label of labels) {
      const translated = translateUI(label, 'en');
      expect(translated).not.toBe(label);
      expect(translated.length).toBeGreaterThan(0);
    }
  });
  it('supports dynamic status fragments with currencies and amounts unchanged', () => {
    expect(translateUI('Divisas al día', 'en')).toBe('Fiat rates current');
    expect(translateUI('Cripto al día', 'en')).toBe('Crypto rates current');
    expect(translateUI('Importe al comercio: BTC 0.001', 'en')).toBe('Merchant receives: BTC 0.001');
    expect(translateUI('Automático · EUR 25.00', 'en')).toBe('Automatic · EUR 25.00');
    expect(translateUI('Sin tasa disponible', 'en')).toBe('Rate unavailable');
    expect(translateUI('BTC/ETH/LTC: sin cotización reciente. Actualiza para mostrar cantidades.', 'en'))
      .toBe('BTC/ETH/LTC: rates unavailable. Refresh to display amounts.');
  });
  it('contains no duplicate exact keys and stores a substantial catalog', () => {
    const keys = Object.keys(EN);
    expect(keys.length).toBeGreaterThan(95);
    expect(new Set(keys).size).toBe(keys.length);
    expect(EN_FRAGMENTS.length).toBeGreaterThan(35);
    for (const [expression, translation] of EN_FRAGMENTS) {
      expect(expression).toBeInstanceOf(RegExp);
      expect(typeof translation).toBe('string');
    }
  });
});
