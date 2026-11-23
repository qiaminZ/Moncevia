/**
 * Transport boundary between Moncevia and userscript managers.
 *
 * Keep the same storage keys, callback and Promise compatibility, and public
 * HTTP request path. Modern GM methods take precedence per operation, with
 * legacy GM_* as a fallback. This module never accesses browser credentials,
 * merchant storage or the DOM.
 */
export interface GMTransportResponse {
  status?: number;
  responseText?: string;
  response?: unknown;
}

export interface GMRequestOptions {
  method: string;
  url: string;
  timeout?: number;
  responseType?: string;
  headers?: Record<string, string>;
}

export interface GMCallbackRequestOptions extends GMRequestOptions {
  onload: (data: GMTransportResponse) => void;
  onerror: (error: unknown) => void;
  ontimeout: () => void;
  onabort: () => void;
}

export interface GMOperations {
  getValue?: (key: string, fallback: unknown) => unknown;
  setValue?: (key: string, value: unknown) => unknown;
  xmlHttpRequest?: (options: GMCallbackRequestOptions) => unknown;
}

export interface GMBridgeOptions {
  readonly modern?: GMOperations | null;
  readonly legacy?: GMOperations | null;
}

export interface GMBridge {
  getValue<T>(key: string, fallback: T): Promise<T>;
  setValue(key: string, value: unknown): Promise<unknown>;
  xmlHttpRequest(options: GMRequestOptions): Promise<GMTransportResponse>;
}

/** Return null when any required operation has neither modern nor legacy support. */
export function createGMBridge({ modern = null, legacy = null }: GMBridgeOptions): GMBridge | null {
  const modernGet = typeof modern?.getValue === 'function';
  const modernSet = typeof modern?.setValue === 'function';
  const modernRequest = typeof modern?.xmlHttpRequest === 'function';
  const legacyGet = typeof legacy?.getValue === 'function';
  const legacySet = typeof legacy?.setValue === 'function';
  const legacyRequest = typeof legacy?.xmlHttpRequest === 'function';

  if (!(modernGet || legacyGet) || !(modernSet || legacySet) || !(modernRequest || legacyRequest))
    return null;

  return {
    async getValue<T>(key: string, fallback: T): Promise<T> {
      const value = modernGet
        ? await modern!.getValue!(key, fallback)
        : await legacy!.getValue!(key, fallback);
      return value as T;
    },
    async setValue(key: string, value: unknown): Promise<unknown> {
      return modernSet ? modern!.setValue!(key, value) : legacy!.setValue!(key, value);
    },
    xmlHttpRequest(options: GMRequestOptions): Promise<GMTransportResponse> {
      return new Promise((resolve, reject) => {
        let completed = false;
        const finish = (ok: boolean, value: unknown): void => {
          if (completed) return;
          completed = true;
          if (ok) resolve(value as GMTransportResponse);
          else reject(value);
        };
        const wrapped: GMCallbackRequestOptions = {
          ...options,
          onload: (data) => finish(true, data),
          onerror: (error) => finish(false, error || new Error('Network request failed')),
          ontimeout: () => finish(false, new Error('Network request timed out')),
          onabort: () => finish(false, new Error('Network request cancelled')),
        };
        try {
          const result = modernRequest
            ? modern!.xmlHttpRequest!(wrapped)
            : legacy!.xmlHttpRequest!(wrapped);
          // Modern implementations can return a Promise instead of invoking
          // callbacks; both mechanisms may fire, so settle only once.
          if (result && typeof (result as PromiseLike<GMTransportResponse>).then === 'function') {
            (result as PromiseLike<GMTransportResponse>).then(
              (data) => finish(true, data),
              (error) => finish(false, error),
            );
          }
        } catch (error) {
          finish(false, error);
        }
      });
    },
  };
}
