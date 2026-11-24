/** Browser lifecycle and high-frequency storefront mutation batching. */
export interface PageLifecycleOptions {
  readonly root: HTMLElement;
  readonly isOwnMutation: (change: MutationRecord) => boolean;
  readonly onMutation: () => void;
  readonly onClick: (event: MouseEvent) => void;
  readonly onChange: (event: Event) => void;
  readonly onKeydown: (event: KeyboardEvent) => void;
  readonly onScroll: () => void;
  readonly onRefresh: () => void;
  readonly onSuspend: () => void;
  readonly onResume: () => void;
  readonly refreshIntervalMs?: number;
}

/**
 * One observer, one scroll listener and one keydown handler per runtime.
 * Mutation bursts are grouped into a single animation frame, rather than
 * rescheduling expensive scans for every DOM mutation. Pagehide suspends
 * observers/timers and pageshow reconnects them for bfcache restorations.
 */
export function createPageLifecycle(options: PageLifecycleOptions) {
  let started = false;
  let suspended = false;
  let scheduledFrame: number | null = null;
  let interval: ReturnType<typeof setInterval> | undefined;

  const observer = new MutationObserver((changes) => {
    if (!started || suspended || changes.every(options.isOwnMutation) || scheduledFrame !== null)
      return;
    scheduledFrame = requestAnimationFrame(() => {
      scheduledFrame = null;
      if (started && !suspended) options.onMutation();
    });
  });

  function observe(): void {
    if (!options.root.isConnected) return;
    observer.observe(options.root, { childList: true, subtree: true, characterData: true });
  }

  function onScroll(): void {
    if (!suspended) options.onScroll();
  }

  function onRefresh(): void {
    if (!suspended) options.onRefresh();
  }

  function suspend(): void {
    if (!started || suspended) return;
    suspended = true;
    observer.disconnect();
    if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = null;
    options.onSuspend();
  }

  function onPageShow(): void {
    if (!started) return;
    if (suspended) {
      suspended = false;
      observe();
      options.onResume();
    }
    options.onRefresh();
  }

  function start(): void {
    if (started) return;
    started = true;
    suspended = false;
    observe();
    document.addEventListener('click', options.onClick, true);
    document.addEventListener('change', options.onChange, true);
    document.addEventListener('keydown', options.onKeydown, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', suspend);
    // Browser history navigation does not always mutate the document.
    window.addEventListener('popstate', onRefresh);
    window.addEventListener('hashchange', onRefresh);
    document.addEventListener('visibilitychange', onRefresh);
    interval = setInterval(onRefresh, options.refreshIntervalMs ?? 10 * 60_000);
  }

  function stop(): void {
    if (!started) return;
    suspend();
    document.removeEventListener('click', options.onClick, true);
    document.removeEventListener('change', options.onChange, true);
    document.removeEventListener('keydown', options.onKeydown, true);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('pagehide', suspend);
    window.removeEventListener('popstate', onRefresh);
    window.removeEventListener('hashchange', onRefresh);
    document.removeEventListener('visibilitychange', onRefresh);
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
    started = false;
  }

  return {
    start,
    stop,
    get active() {
      return started && !suspended;
    },
  } as const;
}
