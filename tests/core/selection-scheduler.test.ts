import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSelectionScheduler } from '../../src/detector/selection-scheduler';

describe('Cancellable storefront update retries', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
  it('coalesces repeated DOM mutation syncs into one read', () => {
    const run = vi.fn();
    const scheduler = createSelectionScheduler({ run, allowed: () => true });
    scheduler.debounce(100);
    vi.advanceTimersByTime(75);
    scheduler.debounce(100);
    vi.advanceTimersByTime(99);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('drops the previous variant retry series when a new variant is selected', () => {
    const run = vi.fn();
    const scheduler = createSelectionScheduler({ run, allowed: () => true });
    scheduler.replaceRetries([100, 500, 1200]);
    vi.advanceTimersByTime(100);
    expect(run).toHaveBeenCalledTimes(1);
    scheduler.replaceRetries([200, 600]);
    vi.advanceTimersByTime(650);
    expect(run).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(3000);
    expect(run).toHaveBeenCalledTimes(3);
  });
  it('never synchronizes after manual editing or site authorization is revoked', () => {
    const run = vi.fn();
    let allowed = true;
    const scheduler = createSelectionScheduler({ run, allowed: () => allowed });
    scheduler.replaceRetries([80, 100]);
    allowed = false;
    vi.advanceTimersByTime(200);
    expect(run).not.toHaveBeenCalled();
    allowed = true;
    scheduler.replaceRetries([50, 100]);
    scheduler.debounce(30);
    scheduler.cancel();
    vi.runAllTimers();
    expect(run).not.toHaveBeenCalled();
  });
  it('does not create invalid or duplicated timer slots', () => {
    const run = vi.fn();
    const scheduler = createSelectionScheduler({ run, allowed: () => true });
    scheduler.replaceRetries([0, 0, -1, Number.NaN, 20000, 100]);
    vi.runAllTimers();
    expect(run).toHaveBeenCalledTimes(2);
  });
});
