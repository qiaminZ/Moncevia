import { describe, expect, it, vi } from 'vitest';
import {
  createGMBridge,
  type GMCallbackRequestOptions,
  type GMOperations,
} from '../../src/platform/gm-bridge';

describe('userscript manager transport boundary', () => {
  it('rejects an incomplete transport without requesting permissions', () => {
    expect(createGMBridge({})).toBeNull();
    expect(createGMBridge({ modern: { getValue: () => null } })).toBeNull();
    expect(
      createGMBridge({
        modern: { getValue: () => null, setValue: () => undefined },
      }),
    ).toBeNull();
  });

  it('supports synchronous legacy GM_* storage and callback-based HTTP', async () => {
    const saved = new Map<string, unknown>();
    const legacy: GMOperations = {
      getValue: (key, fallback) => saved.get(key) ?? fallback,
      setValue: (key, value) => saved.set(key, value),
      xmlHttpRequest: (request) => {
        request.onload({ status: 200, responseText: '{"rates":{"USD":1}}' });
        return undefined;
      },
    };
    const bridge = createGMBridge({ legacy });
    expect(bridge).not.toBeNull();
    await bridge!.setValue('clplens_v1', { language: 'es' });
    expect(await bridge!.getValue('clplens_v1', null)).toEqual({ language: 'es' });
    expect(await bridge!.getValue('missing', 'default')).toBe('default');
    expect((await bridge!.xmlHttpRequest({ method: 'GET', url: 'https://example.test/data' })).status)
      .toBe(200);
  });

  it('prefers asynchronous modern operations, falling back per missing operation', async () => {
    const saved = new Map<string, unknown>();
    const modern: GMOperations = {
      getValue: async (key, fallback) => saved.get(key) ?? fallback,
      xmlHttpRequest: async () => ({ status: 200, responseText: '{}' }),
    };
    const legacySet = vi.fn((key: string, value: unknown) => saved.set(key, value));
    const legacy: GMOperations = {
      getValue: () => 'must-not-use-legacy-read',
      setValue: legacySet,
      xmlHttpRequest: () => {
        throw new Error('must-not-use-legacy-request');
      },
    };
    const bridge = createGMBridge({ modern, legacy })!;
    await bridge.setValue('clplens_history_v3', [{ at: 1 }]);
    expect(legacySet).toHaveBeenCalledOnce();
    expect(await bridge.getValue('clplens_history_v3', [])).toEqual([{ at: 1 }]);
    expect((await bridge.xmlHttpRequest({ method: 'GET', url: 'https://example.test/data' })).status)
      .toBe(200);
  });

  it('settles the same network request only once when callbacks and Promise both fire', async () => {
    const modern: GMOperations = {
      getValue: async (_key, fallback) => fallback,
      setValue: async () => true,
      xmlHttpRequest: (request) => {
        request.onload({ status: 200, responseText: 'first' });
        return Promise.resolve({ status: 500, responseText: 'second' });
      },
    };
    const bridge = createGMBridge({ modern })!;
    await expect(bridge.xmlHttpRequest({ method: 'GET', url: 'https://example.test' })).resolves.toEqual({
      status: 200,
      responseText: 'first',
    });
  });

  it.each(['onerror', 'ontimeout', 'onabort'] as const)(
    'rejects safely when a callback-only request signals %s',
    async (signal) => {
      const legacy: GMOperations = {
        getValue: (_key, fallback) => fallback,
        setValue: () => undefined,
        xmlHttpRequest: (request: GMCallbackRequestOptions) => {
          if (signal === 'onerror') request.onerror(new Error('offline'));
          if (signal === 'ontimeout') request.ontimeout();
          if (signal === 'onabort') request.onabort();
        },
      };
      const bridge = createGMBridge({ legacy })!;
      await expect(
        bridge.xmlHttpRequest({ method: 'GET', url: 'https://example.test' }),
      ).rejects.toThrow(signal === 'onerror' ? 'offline' : signal === 'ontimeout' ? 'timed out' : 'cancelled');
    },
  );

  it('converts synchronous transport failures into rejected Promises', async () => {
    const modern: GMOperations = {
      getValue: (_key, fallback) => fallback,
      setValue: () => undefined,
      xmlHttpRequest: () => {
        throw new Error('bridge failure');
      },
    };
    const bridge = createGMBridge({ modern })!;
    await expect(bridge.xmlHttpRequest({ method: 'GET', url: 'https://example.test' })).rejects.toThrow(
      'bridge failure',
    );
  });
});
