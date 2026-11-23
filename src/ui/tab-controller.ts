/** Semantic, keyboard-accessible navigation independent from the finance engine. */
export type MonceviaTab = 'calculator' | 'crypto' | 'compare' | 'history' | 'settings';
export const TAB_ORDER: readonly MonceviaTab[] = [
  'calculator',
  'crypto',
  'compare',
  'history',
  'settings',
] as const;

export interface TabControllerOptions {
  readonly pages: Record<MonceviaTab, HTMLElement>;
  readonly buttons: Record<MonceviaTab, HTMLButtonElement>;
  readonly panel: HTMLElement;
  readonly onActivate: (tab: MonceviaTab) => void;
}

export function createTabController(options: TabControllerOptions) {
  const { pages, buttons, panel, onActivate } = options;
  let current: MonceviaTab = 'calculator';
  function activate(name: string): boolean {
    if (!TAB_ORDER.includes(name as MonceviaTab)) return false;
    current = name as MonceviaTab;
    for (const key of TAB_ORDER) {
      pages[key].classList.toggle('clplens-hidden', key !== current);
      buttons[key].setAttribute('aria-selected', String(key === current));
      buttons[key].tabIndex = key === current ? 0 : -1;
    }
    onActivate(current);
    panel.scrollTop = 0;
    return true;
  }
  function onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.getAttribute('role') !== 'tab') return;
    const index = TAB_ORDER.indexOf(current);
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % TAB_ORDER.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TAB_ORDER.length) % TAB_ORDER.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TAB_ORDER.length - 1
              : -1;
    if (next < 0) return;
    const item = TAB_ORDER[next];
    if (!item) return;
    event.preventDefault();
    activate(item);
    buttons[item].focus();
  }
  return {
    activate,
    onKeydown,
    get current() {
      return current;
    },
  };
}
