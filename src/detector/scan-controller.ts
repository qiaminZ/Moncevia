/**
 * DOM-only price annotations. Never edits the merchant's own price or controls.
 * The runtime injects the locale-aware parser and financial formatter.
 */
export interface DetectedPrice {
  readonly code: string;
  readonly amount: number;
}
export interface PriceScannerOptions {
  readonly isActive: () => boolean;
  readonly detectMoney: (text: string) => DetectedPrice | null;
  readonly badgeText: (value: DetectedPrice) => string[] | null;
  readonly scanLimit?: number;
  readonly badgeLimit?: number;
}

export const isCandidateText = (text: string | null): boolean =>
  !!text && text.length <= 135 && /\d/.test(text) && /[€$£¥₿ΞŁA-Za-z]/.test(text);

export function createPriceScanner(options: PriceScannerOptions) {
  const { isActive, detectMoney, badgeText } = options;
  const maxNodes = Math.max(1, Math.min(5000, options.scanLimit ?? 3500));
  const maxBadges = Math.max(1, Math.min(200, options.badgeLimit ?? 100));
  let timer: ReturnType<typeof setTimeout> | undefined;

  function skipText(textNode: Text): boolean {
    const parent = textNode.parentElement;
    if (!parent || !parent.isConnected || !isCandidateText(textNode.nodeValue)) return true;
    if (parent.closest(
      '#clplens-widget, .clplens-badge, [data-clplens-ignore], [contenteditable], ' +
      '[hidden], [aria-hidden="true"], form, [role="dialog"], [role="textbox"]',
    )) return true;
    if (parent.closest(
      'button, a, input, option, select, textarea, script, style, noscript, pre, code, svg, title',
    )) return true;
    if (parent === document.body || parent === document.documentElement) return true;
    const style = window.getComputedStyle(parent);
    return style.display === 'none' || style.visibility === 'hidden' || !parent.getClientRects().length;
  }

  function makeBadge(lines: readonly string[]): HTMLSpanElement {
    const badge = document.createElement('span');
    badge.className = 'clplens-badge';
    badge.dataset.clplensBadge = '2';
    badge.setAttribute('aria-label', 'Conversion aproximada de Moncevia');
    for (const line of lines) {
      const span = document.createElement('span');
      span.textContent = line;
      badge.append(span);
    }
    return badge;
  }

  function scan(): void {
    if (!isActive() || !document.body) return;
    let checked = 0;
    let badges = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let candidate: Node | null;
    while ((candidate = walker.nextNode()) && checked++ < maxNodes && badges < maxBadges) {
      const textNode = candidate as Text;
      if (skipText(textNode)) continue;
      const detected = detectMoney(textNode.nodeValue || '');
      const next = textNode.nextSibling;
      const existing = next instanceof Element && next.classList.contains('clplens-badge') &&
        (next as HTMLElement).dataset.clplensBadge === '2' ? next : null;
      const lines = detected ? badgeText(detected) : null;
      if (!lines) {
        if (existing) existing.remove();
        continue;
      }
      if (existing) {
        const previous = [...existing.children].map(item => item.textContent).join('\n');
        if (previous !== lines.join('\n')) {
          existing.replaceChildren(...lines.map(line => {
            const span = document.createElement('span');
            span.textContent = line;
            return span;
          }));
        }
      } else {
        textNode.parentNode?.insertBefore(makeBadge(lines), textNode.nextSibling);
      }
      badges++;
    }
  }

  function schedule(force = false): void {
    if (force) document.querySelectorAll('.clplens-badge[data-clplens-badge="2"]')
      .forEach(element => element.remove());
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => { timer = undefined; scan(); }, force ? 70 : 550);
  }

  function isOwnMutation(change: MutationRecord): boolean {
    const target = change.target;
    if (target instanceof Element && target.closest('#clplens-widget,.clplens-badge')) return true;
    if (target.parentElement?.closest('#clplens-widget,.clplens-badge')) return true;
    if (change.type === 'childList') {
      const changed = [...change.addedNodes, ...change.removedNodes];
      if (changed.length && changed.every(item =>
        item instanceof Element &&
        (item.matches('#clplens-widget,.clplens-badge') ||
          !!item.closest('#clplens-widget,.clplens-badge'))
      )) return true;
    }
    return false;
  }

  function dispose(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  return { scan, schedule, isOwnMutation, dispose } as const;
}
