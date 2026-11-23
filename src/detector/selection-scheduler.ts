/**
 * Deterministic, cancellable retry scheduling for delayed storefront updates.
 * A newer product interaction cancels retries belonging to an older selection.
 */
export interface SelectionSchedulerOptions {
  readonly run: () => void;
  readonly allowed: () => boolean;
}
export function createSelectionScheduler({ run, allowed }: SelectionSchedulerOptions) {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const retries = new Set<ReturnType<typeof setTimeout>>();
  function execute(): void { if (allowed()) run(); }
  function debounce(delay = 160): void {
    if (!allowed()) return;
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { debounceTimer = undefined; execute(); }, Math.max(0, delay));
  }
  function replaceRetries(delays: readonly number[]): void {
    for (const timer of retries) clearTimeout(timer);
    retries.clear();
    if (!allowed()) return;
    for (const delay of new Set(delays)) {
      if (!Number.isFinite(delay) || delay < 0 || delay > 10000) continue;
      const timer = setTimeout(() => {
        retries.delete(timer);
        execute();
      }, delay);
      retries.add(timer);
    }
  }
  function cancel(): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = undefined;
    for (const timer of retries) clearTimeout(timer);
    retries.clear();
  }
  return { debounce, replaceRetries, cancel } as const;
}
