/**
 * Read-only variant and storefront price detector.
 * Never modifies merchant controls, submits forms or guesses the meaning of '$'.
 *
 * A dependency boundary keeps the existing currency parser and policies in one
 * place while the DOM detector migrates from legacy JavaScript to strict TS.
 */
export interface TextPriceMatch {
  readonly amount: number;
  readonly code: string;
  readonly perUnit: boolean;
  readonly former: boolean;
  readonly index: number;
}
export interface PriceLike {
  readonly amount: number;
  readonly code: string | null;
}
export interface PriceCandidate extends PriceLike {
  readonly code: string;
  readonly label?: string;
  readonly source?: string;
}
export interface AmbiguousPrice extends PriceLike {
  readonly code: null;
  readonly label: string;
  readonly source: string;
}
export interface VariantDetectorOptions {
  readonly parseAmount: (text: string, currency: string) => number;
  readonly prefixCurrency: (prefix: string) => string | null;
  readonly prefixRE: RegExp;
  readonly suffixRE: RegExp;
  readonly figure: string;
  readonly dollarCurrencyForSite: () => string | null;
  readonly cryptoCodes: readonly string[];
}
const isElement = (value: unknown): value is Element => value instanceof Element;
const forbiddenAction = /^(?:purchase|buy|checkout|cart|add to cart|help|faq|login|search|pay|submit|comprar|pagar|ayuda)\b/i;
const variantWords = /\b(?:days?|weeks?|months?|years?|lifetime|license|licen[cs]e|tier|plan|size|color|colour|medium|large|small|basic|standard|premium)\b/i;

export function createVariantDetector(options: VariantDetectorOptions) {
  const { parseAmount, prefixCurrency, prefixRE, suffixRE, figure, cryptoCodes } = options;
  const dollarRE = new RegExp('(?<![\\p{L}\\d])\\$\\s*(' + figure + ')(?![\\p{L}\\d])', 'gu');

  function originalText(element: Element | null): string {
    if (!element || (element.textContent || '').length > 1600) return '';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const parts: string[] = [];
    let count = 0;
    let current: Node | null;
    while ((current = walker.nextNode()) && count++ < 120) {
      const text = current as Text;
      if (text.parentElement?.closest('#clplens-widget,.clplens-badge,[hidden],[aria-hidden="true"]')) continue;
      const content = (text.nodeValue || '').trim();
      if (content) parts.push(content);
    }
    return parts.join('\n').slice(0, 650);
  }

  function matchesInText(rawText: string): TextPriceMatch[] {
    const text = String(rawText || '').replace(/[\u00a0\u202f]/g, ' ').slice(0, 650);
    const out: TextPriceMatch[] = [];
    for (const [rx, isSuffix] of [[prefixRE, false], [suffixRE, true]] as const) {
      rx.lastIndex = 0;
      let found: RegExpExecArray | null;
      while ((found = rx.exec(text))) {
        const rawAmount = found[1];
        if (!rawAmount) continue;
        const currency = isSuffix
          ? (found[2] || '').toUpperCase()
          : prefixCurrency(found[0].slice(0, found[0].indexOf(rawAmount)).trim());
        if (!currency) continue;
        const amount = parseAmount(rawAmount, currency);
        if (!Number.isFinite(amount) ||
            amount < (cryptoCodes.includes(currency) ? 0.00000001 : 0.01)) continue;
        const before = text.slice(Math.max(0, found.index - 18), found.index).toLowerCase();
        const after = text.slice(found.index + found[0].length, found.index + found[0].length + 30).toLowerCase();
        const perUnit = /^\s*(?:per\s*(?:day|week|month|unit)|\/\s*(?:day|week|month)|por\s*(?:d[ií]a|semana|mes|unidad))\b/.test(after);
        const former = /(?:antes|original|was|regular|list price)\s*:?\s*$/.test(before);
        out.push({ amount, code: currency, perUnit, former, index: found.index });
      }
    }
    return out.sort((a, b) => a.index - b.index);
  }

  function bestVisiblePrice(element: Element | null): PriceCandidate | null {
    if (!element || !element.isConnected) return null;
    if (element.closest('#clplens-widget, .clplens-badge, [data-clplens-ignore]')) return null;
    const raw = originalText(element);
    if (!raw || raw.length > 650) return null;
    const matches = matchesInText(raw);
    if (!matches.length || matches.length > 6 || matches.every(m => m.perUnit || m.former)) return null;
    const score = (match: TextPriceMatch): number =>
      (match.perUnit ? -100 : 0) + (match.former ? -60 : 0) + (cryptoCodes.includes(match.code) ? -5 : 0);
    const chosen = [...matches].sort((a, b) => score(b) - score(a) || b.index - a.index)[0];
    return chosen ? { amount: chosen.amount, code: chosen.code } : null;
  }

  function selectionLabel(raw: string): string {
    const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const at = lines.findIndex(line =>
      /^selected\s+(?:access|option|plan|duration|item|product)\b/i.test(line) ||
      /^opci[oó]n\s+seleccionada\b/i.test(line));
    if (at >= 0) {
      const next = lines.slice(at + 1).find(line => !matchesInText(line).length && line.length < 65);
      return next || 'Opcion seleccionada';
    }
    return 'Precio seleccionado';
  }

  function selectedSummaryPrice(): PriceCandidate | null {
    if (!document.body) return null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    let scanned = 0;
    while ((text = walker.nextNode()) && scanned++ < 12000) {
      if (!/^\s*(?:selected\s+(?:access|option|plan|duration|item|product)|opci[oó]n\s+seleccionada)\s*:?\s*$/i.test(text.nodeValue || '')) continue;
      let element: Element | null = text.parentElement;
      for (let depth = 0; element && depth < 6; depth++, element = element.parentElement) {
        if (element.closest('#clplens-widget, .clplens-badge')) break;
        const content = originalText(element);
        if (content.length > 420) break;
        const price = bestVisiblePrice(element);
        if (price) return { ...price, label: selectionLabel(content), source: 'resumen' };
      }
    }
    return null;
  }

  function productHeroPrice(): PriceCandidate | null {
    const headings = [...document.querySelectorAll('main h1,article h1,[itemtype*="Product"] h1')]
      .filter(element => element.isConnected && element.getClientRects().length);
    if (headings.length !== 1) return null;
    let root = headings[0]?.parentElement ?? null;
    for (let depth = 0; root && root !== document.body && depth < 5; depth++, root = root.parentElement) {
      if (!root.querySelector('[class*="variant"],[id*="variant"],[role="option"],[data-variant]')) continue;
      const raw = originalText(root);
      if (!raw) continue;
      const lines = raw.split('\n').map(line => line.trim());
      const at = lines.findIndex(line =>
        /^(?:variant|variants|option|options|choose variant|select variant)$/i.test(line));
      if (at < 1) continue;
      const unique = new Map(matchesInText(lines.slice(0, at).join('\n'))
        .filter(match => !match.former && !match.perUnit)
        .map(match => [match.code + ':' + match.amount, match]));
      if (unique.size !== 1) continue;
      const price = [...unique.values()][0];
      return price
        ? { amount: price.amount, code: price.code, label: 'Precio actual del producto', source: 'precio principal' }
        : null;
    }
    return null;
  }

  function currentProductPrice(): PriceCandidate | null {
    const selectors = [
      '[data-testid="product-price"]', '[data-testid="current-price"]',
      '[data-price-current]', '[data-price-role="current"]',
      '.product__price', '.product-price', '.price--current', '[itemprop="price"]',
    ];
    const results = new Map<string, PriceCandidate>();
    let scanned = 0;
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (++scanned > 90) break;
        if (!element.isConnected || element.closest(
          '#clplens-widget,.clplens-badge,[hidden],[aria-hidden="true"],' +
          'del,s,strike,.price--old,.price--compare,.compare-at-price,' +
          '[class*="variant"],[id*="variant"],[role="option"],[role="listbox"],' +
          'form[action*="checkout"]')) continue;
        if (!element.getClientRects().length || getComputedStyle(element).visibility === 'hidden') continue;
        const live = element.querySelector('.price--current,ins,[data-price-current]') || element;
        const chosen = bestVisiblePrice(live);
        if (!chosen) continue;
        const key = chosen.code + ':' + chosen.amount;
        results.set(key, { ...chosen, label: 'Precio actual del producto', source: 'precio principal' });
      }
      if (scanned > 90) break;
    }
    if (results.size === 1) return [...results.values()][0] || null;
    if (results.size > 1) return null;
    return productHeroPrice();
  }

  function sameMonetaryPrice(a: PriceLike | null | undefined, b: PriceLike | null | undefined): boolean {
    return !!a && !!b && a.code === b.code && Math.abs(a.amount - b.amount) < 1e-8;
  }

  function variantControl(target: unknown): Element | null {
    if (!isElement(target) || target.closest(
      '#clplens-widget,#moncevia-dollar-dialog,.clplens-badge,' +
      'input,textarea,[contenteditable],a[href*="checkout"],form[action*="checkout"]')) return null;
    const control = target.closest(
      '[data-variant],[data-product-option],[role="option"],[role="radio"],' +
      '[aria-pressed],[aria-selected],[data-option-value],' +
      '[class*="variant-card"],[class*="variant-option"],[class*="option-card"],button,label');
    if (!control || control.matches('[disabled],[aria-disabled="true"]') ||
        control.closest('header,nav,footer,[role="navigation"]')) return null;
    const name = (originalText(control) || control.getAttribute('aria-label') || '').trim();
    if (forbiddenAction.test(name)) return null;
    const hint = control.closest(
      '[data-variant],[data-product-option],[class*="variant"],[id*="variant"],' +
      '[class*="product-option"],[role="listbox"]');
    return hint || (variantWords.test(name) ? control : null);
  }

  function unlabeledDollarPrice(target: unknown): AmbiguousPrice | null {
    if (options.dollarCurrencyForSite() || !isElement(target) ||
        target.closest('#clplens-widget, #moncevia-dollar-dialog, .clplens-badge, input, textarea, select, [contenteditable]')) return null;
    if (target.closest('a,button,form') && !variantControl(target)) return null;
    let element: Element | null = target;
    for (let depth = 0; element && depth < 7 && element !== document.body; depth++, element = element.parentElement) {
      const raw = originalText(element);
      if (!raw || raw.length > 520) continue;
      const matches = [...raw.matchAll(dollarRE)].filter(match =>
        !!match[1] && Number.isFinite(parseAmount(match[1], 'USD')));
      if (matches.length !== 1 || matchesInText(raw).length) continue;
      const priceText = matches[0]?.[1];
      if (!priceText) continue;
      const amount = parseAmount(priceText, 'USD');
      const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
      const label = lines.find(line =>
        /\b(?:days?|weeks?|months?|lifetime|annual|year|plan|tier|license)\b/i.test(line) && !line.includes('$'));
      return { amount, code: null, label: label || 'Precio seleccionado', source: 'precio estático' };
    }
    return null;
  }

  function tappedPrice(target: unknown): PriceCandidate | null {
    if (!isElement(target) || target.closest(
      '#clplens-widget,.clplens-badge,[data-clplens-ignore],input,textarea,select,[contenteditable],form')) return null;
    const control = variantControl(target);
    const actionable = target.closest('button,a,[role="button"]');
    const actionLabel = actionable ? originalText(actionable).trim() : '';
    if (actionable && forbiddenAction.test(actionLabel)) return null;
    const boundedCard = actionable && !control
      ? actionable.closest('article,li,[data-product-id],[class*="product-card"],[class*="item-card"]')
      : null;
    if (actionable && !control && !boundedCard && !matchesInText(originalText(actionable)).length) return null;
    let element: Element | null = target;
    for (let depth = 0; element && depth < 8; depth++, element = element.parentElement) {
      if (element === document.body) break;
      if (boundedCard && !boundedCard.contains(element)) break;
      if (control && element !== control && element.contains(control)) {
        const otherOptions = element.querySelectorAll('[data-variant],[role="option"],[role="radio"]');
        if (otherOptions.length > 1 || (element !== control.parentElement &&
            !/\b(?:variant|option|tier|plan|card)\b/i.test(String(element.className)))) continue;
      }
      const matches = matchesInText(originalText(element)).filter(match => !match.perUnit && !match.former);
      const distinct = new Set(matches.map(match => match.code + ':' + match.amount));
      if (distinct.size > 1 && !control) continue;
      const price = bestVisiblePrice(element);
      if (price) {
        const parts = originalText(element).split(/\n/).map(line => line.trim()).filter(Boolean);
        const label = parts.find(line =>
          /\b(?:key|plan|days?|weeks?|months?|lifetime|access)\b/i.test(line) && !matchesInText(line).length);
        return { ...price, label: label || 'Precio tocado', source: 'toque' };
      }
    }
    return null;
  }

  return {
    originalText,
    matchesInText,
    bestVisiblePrice,
    selectedSummaryPrice,
    currentProductPrice,
    sameMonetaryPrice,
    variantControl,
    unlabeledDollarPrice,
    tappedPrice,
  } as const;
}
