/** Typed controller for the floating launcher. Never operates on merchant DOM. */
export interface FabRelativePosition {
  x: number;
  y: number;
}

export interface FabBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FabControllerOptions {
  button: () => HTMLButtonElement | null;
  position: () => FabRelativePosition | null;
  onPosition: (position: FabRelativePosition | null) => void;
  persist: () => void;
}

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  left: number;
  top: number;
  moved: boolean;
}

/** Keep exactly the original launcher margins, including tiny viewports. */
export function fabBoundsForViewport(
  width: number,
  height: number,
  buttonWidth: number,
  buttonHeight: number,
): FabBounds {
  const minX = 8;
  const minY = 12;
  return {
    minX,
    minY,
    maxX: Math.max(minX, width - buttonWidth - 8),
    maxY: Math.max(minY, height - buttonHeight - 16),
  };
}

export function clampFab(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizedFabPosition(
  left: number,
  top: number,
  bounds: FabBounds,
): FabRelativePosition {
  return {
    x: (clampFab(left, bounds.minX, bounds.maxX) - bounds.minX) /
      Math.max(1, bounds.maxX - bounds.minX),
    y: (clampFab(top, bounds.minY, bounds.maxY) - bounds.minY) /
      Math.max(1, bounds.maxY - bounds.minY),
  };
}

/** Maintains legacy mouse, touch, keyboard and storage semantics. */
export function createFabController(options: FabControllerOptions) {
  let drag: DragSession | null = null;
  let suppressClick = false;
  let resizeQueued = false;
  let installed = false;

  function bounds(button: HTMLButtonElement): FabBounds {
    const rect = button.getBoundingClientRect();
    const width = window.innerWidth || document.documentElement.clientWidth || 375;
    const height = window.innerHeight || document.documentElement.clientHeight || 667;
    return fabBoundsForViewport(width, height, rect.width, rect.height);
  }

  function place(x: number, y: number): void {
    const button = options.button();
    if (!button) return;
    const b = bounds(button);
    button.classList.add('mv-fab-moved');
    button.style.setProperty('--mv-fab-left', clampFab(x, b.minX, b.maxX) + 'px');
    button.style.setProperty('--mv-fab-top', clampFab(y, b.minY, b.maxY) + 'px');
  }

  function savePosition(): void {
    const button = options.button();
    if (!button) return;
    const b = bounds(button);
    const rect = button.getBoundingClientRect();
    options.onPosition(normalizedFabPosition(rect.left, rect.top, b));
    options.persist();
  }

  function restore(): void {
    const button = options.button();
    const position = options.position();
    if (!button || !position) return;
    const b = bounds(button);
    place(b.minX + position.x * (b.maxX - b.minX), b.minY + position.y * (b.maxY - b.minY));
  }

  function reset(save = true): void {
    options.onPosition(null);
    const button = options.button();
    if (button) {
      button.classList.remove('mv-fab-moved', 'mv-fab-dragging');
      button.style.removeProperty('--mv-fab-left');
      button.style.removeProperty('--mv-fab-top');
    }
    if (save) options.persist();
  }

  function enable(): void {
    const button = options.button();
    if (!button || installed) return;
    installed = true;

    button.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      suppressClick = false;
      const rect = button.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };
      try {
        button.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Some touch engines do not implement capture on synthetic pointers.
      }
    });

    button.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      drag.moved = true;
      button.classList.add('mv-fab-dragging');
      place(drag.left + dx, drag.top + dy);
      if (event.cancelable) event.preventDefault();
    });

    function finish(event: PointerEvent, cancelled = false): void {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) {
        suppressClick = true;
        if (cancelled) {
          if (options.position()) restore();
          else reset(false);
        } else {
          savePosition();
        }
      }
      button.classList.remove('mv-fab-dragging');
      drag = null;
    }
    button.addEventListener('pointerup', (event) => finish(event));
    button.addEventListener('pointercancel', (event) => finish(event, true));
    button.addEventListener(
      'click',
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true,
    );

    button.addEventListener('keydown', (event) => {
      const delta: Record<string, readonly [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const shift = delta[event.key];
      if (!shift || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const rect = button.getBoundingClientRect();
      const step = event.shiftKey ? 40 : 16;
      place(rect.left + shift[0] * step, rect.top + shift[1] * step);
      savePosition();
    });

    const onResize = (): void => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        if (!drag) restore();
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  }

  return { enable, restore, reset } as const;
}
