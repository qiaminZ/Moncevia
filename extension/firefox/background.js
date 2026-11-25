/* Moncevia: public-rate-only broker. Never fetch arbitrary requested URLs. */
(() => {
  'use strict';
  const api = typeof globalThis.browser !== 'undefined' ? globalThis.browser : globalThis.chrome;
  const COINS = new Set(['BTCUSDT','ETHUSDT','LTCUSDT']);
  const RESTRICTED = ['prexcard.com','prexcard.cl','santander.cl','bancoestado.cl','bancochile.cl','bci.cl','scotiabank.cl','itau.cl','bancofalabella.cl','paypal.com','stripe.com','wise.com','revolut.com','binance.com','coinbase.com','kraken.com','crypto.com','mercadopago.cl','mercadopago.com','webpay.cl','transbank.cl','appleid.apple.com','accounts.google.com','login.microsoftonline.com','machbank.cl','tenpo.cl','coopeuch.cl','consorcio.cl','security.cl','bice.cl','hsbc.cl','bancoripley.cl','tapp.cl','servipag.com','servipag.cl','khipu.com','khipu.cl','flow.cl','fintual.cl','buda.com','orionx.com','cryptomkt.com'];
  const EXCLUDED = /(?:^|[.-])(bank|banco|banking|binance|paypal|coinbase|webpay|transbank|mercadopago)(?:[.-]|$)/i;
  const RISKY_PATH = /\/(login|sign[/-]?in|sign[/-]?up|checkout|payment|pay|billing|banking|wallet|transfer|auth|account|cart|pago[s]?|pagar|carrito|cuenta|sesion|iniciar-sesion|autenticacion|transferencia[s]?|billetera|facturacion)(?:[/?#-]|$)/i;
  const PROVIDERS = new Set(['data-api.binance.vision','api.binance.com','open.er-api.com','api.coingecko.com','api.coinbase.com']);
  function allowedRateUrl(raw) {
    if (typeof raw !== 'string' || raw.length > 500) return false;
    let uri;
    try { uri = new URL(raw); } catch (_) { return false; }
    if (uri.protocol !== 'https:' || uri.username || uri.password || uri.port || uri.hash || !PROVIDERS.has(uri.hostname)) return false;
    if (uri.hostname === 'data-api.binance.vision' || uri.hostname === 'api.binance.com') {
      return uri.pathname === '/api/v3/ticker/bookTicker' &&
        [...uri.searchParams.keys()].every(key => key === 'symbol') &&
        uri.searchParams.size === 1 && COINS.has(uri.searchParams.get('symbol'));
    }
    if (uri.hostname === 'open.er-api.com') return uri.pathname === '/v6/latest/USD' && !uri.search;
    if (uri.hostname === 'api.coinbase.com') return /^\/v2\/prices\/(BTC|ETH|LTC)-USD\/spot$/.test(uri.pathname) && !uri.search;
    if (uri.hostname === 'api.coingecko.com') {
      if (uri.pathname !== '/api/v3/simple/price' || uri.searchParams.size !== 3 ||
          [...uri.searchParams.keys()].some(k => !['ids','vs_currencies','include_last_updated_at'].includes(k))) return false;
      return (uri.searchParams.get('ids') === 'tether' || uri.searchParams.get('ids') === 'bitcoin,ethereum,litecoin') &&
        uri.searchParams.get('vs_currencies') === 'usd' && uri.searchParams.get('include_last_updated_at') === 'true';
    }
    return false;
  }
  function safeSender(sender) {
    try {
      if (sender?.tab?.id == null || !sender.url) return false;
      const uri = new URL(sender.url);
      return uri.protocol === 'https:' && !RESTRICTED.some(base => uri.hostname === base || uri.hostname.endsWith('.' + base)) && !(uri.hostname.endsWith('.cl') && /(?:bank|banco|banking|santander|prex|webpay|transbank|mercadopago)/i.test(uri.hostname)) && !EXCLUDED.test(uri.hostname) && !RISKY_PATH.test(uri.pathname);
    } catch (_) { return false; }
  }
  async function fetchRate(url) {
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), 11000);
    try {
      const response = await fetch(url, {method:'GET',credentials:'omit',redirect:'error',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Provider HTTP ' + response.status);
      const length = Number(response.headers.get('content-length'));
      if (length > 250000) throw new Error('Response too large');
      const body = await response.text();
      if (body.length > 250000) throw new Error('Response too large');
      JSON.parse(body);
      return {ok:true,status:200,body};
    } finally { clearTimeout(abort); }
  }
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.kind !== 'moncevia:rate') return false;
    if (!safeSender(sender) || !allowedRateUrl(message.url)) {
      sendResponse({ok:false,error:'Request not permitted'});
      return false;
    }
    fetchRate(message.url).then(sendResponse,error=>sendResponse({ok:false,error:error?.message || 'Rate unavailable'}));
    return true;
  });
})();
