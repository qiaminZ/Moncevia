import { translateUI, type UILanguage } from './catalog';

type ElementLabel = 'placeholder' | 'aria-label' | 'title';
interface LocalizedText {
  readonly raw: string;
  readonly translated: string;
}
export interface LocalizerOptions {
  readonly root: () => HTMLElement | null;
  readonly language: () => UILanguage;
  readonly languageButton: () => HTMLElement | null;
  readonly languageSelect: () => HTMLSelectElement | null;
  readonly savedPreference: () => string;
}

/**
 * Reversible, DOM-scoped localization: translated nodes retain the original
 * Spanish source so EN -> ES -> EN never translates an English value twice.
 * Only Moncevia-owned elements are visited; merchant pages stay untouched.
 */
export function createUILocalizer(options: LocalizerOptions) {
  const textOrigins = new WeakMap<Text, LocalizedText>();
  const attributeOrigins = new WeakMap<Element, Partial<Record<ElementLabel, LocalizedText>>>();
  let observer: MutationObserver | null = null;
  let frame = 0;
  let applying = false;

  function localize(): void {
    const root = options.root();
    if (!root || !root.isConnected) return;
    applying = true;
    try {
      const language = options.language();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const node = current as Text;
        if (node.parentElement?.closest('script,style')) continue;
        const before = textOrigins.get(node);
        const raw =
          before && before.translated === node.nodeValue ? before.raw : node.nodeValue || '';
        const translated = translateUI(raw, language);
        textOrigins.set(node, { raw, translated });
        if (node.nodeValue !== translated) node.nodeValue = translated;
      }
      for (const element of root.querySelectorAll('[placeholder],[aria-label],[title]')) {
        for (const attribute of ['placeholder', 'aria-label', 'title'] as const) {
          if (!element.hasAttribute(attribute)) continue;
          const saved = attributeOrigins.get(element) || {};
          const currentValue = element.getAttribute(attribute) || '';
          const previous = saved[attribute];
          const raw =
            previous && previous.translated === currentValue ? previous.raw : currentValue;
          const translated = translateUI(raw, language);
          saved[attribute] = { raw, translated };
          attributeOrigins.set(element, saved);
          if (currentValue !== translated) element.setAttribute(attribute, translated);
        }
      }
      const languageButton = options.languageButton();
      if (languageButton) {
        const label = language.toUpperCase();
        if (languageButton.textContent !== label) languageButton.textContent = label;
        const accessibleLabel = language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish';
        if (languageButton.getAttribute('aria-label') !== accessibleLabel)
          languageButton.setAttribute('aria-label', accessibleLabel);
      }
      const languageSelect = options.languageSelect();
      if (languageSelect && languageSelect.value !== options.savedPreference()) {
        languageSelect.value = options.savedPreference();
      }
    } finally {
      applying = false;
    }
  }

  function watch(): void {
    stop();
    const root = options.root();
    if (!root) return;
    observer = new MutationObserver(() => {
      if (applying || frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (options.root()?.isConnected) localize();
      });
    });
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['placeholder', 'aria-label', 'title'],
    });
    localize();
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
  }
  return { localize, watch, stop } as const;
}
