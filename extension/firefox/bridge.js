/* Moncevia native bridge: isolated content script, not injected into page JS. */
(() => {
  'use strict';
  const isFirefox = typeof globalThis.browser !== 'undefined';
  const api = isFirefox ? globalThis.browser : globalThis.chrome;
  if (!api?.runtime?.sendMessage || !api?.storage?.local) return;
  function callChrome(fn, ...args) {
    return new Promise((resolve, reject) => {
      try {
        fn(...args, result => {
          const error = globalThis.chrome?.runtime?.lastError;
          if (error) reject(new Error(error.message || 'Extension API unavailable'));
          else resolve(result);
        });
      } catch (error) { reject(error); }
    });
  }
  const get = key => isFirefox ? api.storage.local.get(key) : callChrome(api.storage.local.get.bind(api.storage.local), key);
  const set = object => isFirefox ? api.storage.local.set(object) : callChrome(api.storage.local.set.bind(api.storage.local), object);
  const send = payload => isFirefox ? api.runtime.sendMessage(payload) : callChrome(api.runtime.sendMessage.bind(api.runtime), payload);
  globalThis.GM = {
    async getValue(key, fallback) {
      if (typeof key !== 'string' || key.length > 120) throw new Error('Invalid storage key');
      const entry = await get('moncevia:' + key);
      return Object.prototype.hasOwnProperty.call(entry, 'moncevia:' + key) ? entry['moncevia:' + key] : fallback;
    },
    async setValue(key, value) {
      if (typeof key !== 'string' || key.length > 120) throw new Error('Invalid storage key');
      await set({['moncevia:' + key]: value});
    },
    async xmlHttpRequest(options) {
      if (!options || options.method !== 'GET' || typeof options.url !== 'string') throw new Error('Only rate GET requests allowed');
      const response = await send({kind: 'moncevia:rate', url: options.url});
      if (!response || !response.ok) throw new Error(response?.error || 'Rate service unavailable');
      return {status: response.status, responseText: response.body};
    }
  };
})();
