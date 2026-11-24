// ==UserScript==
// @name         Moncevia — Safari Runtime Probe
// @namespace    https://github.com/qiaminZ/Moncevia/diagnostics/runtime
// @version      1.0.0
// @description  Local startup probe; no network, no merchant input values.
// @match        https://shop.riftbots.org/*
// @noframes
// @run-at       document-idle
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      data-api.binance.vision
// @connect      api.binance.com
// @connect      open.er-api.com
// @connect      api.coingecko.com
// @connect      api.coinbase.com
// ==/UserScript==

(() => {
  'use strict';
  const protectedRoute = () => /\/(login|sign[/-]?in|sign[/-]?up|checkout|payment|pay|billing|banking|wallet|transfer|auth|account|cart)(?:[/?#-]|$)/i.test(location.pathname);
  if (window.top !== window.self || protectedRoute()) return;
  function start() {
    if (!document.body || document.getElementById('moncevia-runtime-probe')) return;
    const card = document.createElement('div');
    card.id = 'moncevia-runtime-probe';
    card.style.cssText = 'position:fixed!important;top:100px!important;left:12px!important;right:12px!important;z-index:2147483647!important;background:#111c32!important;color:white!important;border:2px solid #22d3ee!important;border-radius:12px!important;padding:12px!important;font:13px/1.45 system-ui!important;max-height:60vh!important;overflow:auto!important;white-space:pre-wrap!important;box-sizing:border-box!important;';
    const close = document.createElement('button');
    close.textContent = 'Cerrar ×';
    close.type = 'button';
    close.style.cssText = 'display:block;margin-bottom:8px;color:#111;background:#fff;padding:4px 10px;border-radius:6px;';
    let timer;
    close.onclick = () => { clearInterval(timer); card.remove(); };
    const output = document.createElement('div');
    card.append(close, output);
    document.body.append(card);
    let storageStatus = 'Pendiente';
    const modern = typeof GM !== 'undefined' && GM !== null ? GM : null;
    const get = typeof modern?.getValue === 'function';
    const set = typeof modern?.setValue === 'function';
    const xhr = typeof modern?.xmlHttpRequest === 'function';
    const legacyGet = typeof GM_getValue === 'function';
    const legacySet = typeof GM_setValue === 'function';
    const legacyXHR = typeof GM_xmlhttpRequest === 'function';
    const bridge = (get || legacyGet) && (set || legacySet) && (xhr || legacyXHR);
    const yes = b => b ? 'SI' : 'NO';
    let regex = false;
    try { regex = new RegExp('(?<![\\p{L}\\d])\\d+', 'gu').test(' 24'); } catch {}
    function render() {
      if (protectedRoute()) { clearInterval(timer); card.remove(); return; }
      // Inspect only the visibility of password elements; never read their values.
      const visiblePassword = Array.from(document.querySelectorAll('input[type="password"]')).some(input => {
        const style = getComputedStyle(input);
        return input.isConnected && input.getClientRects().length > 0 &&
          style.visibility !== 'hidden' && style.visibility !== 'collapse' && style.display !== 'none';
      });
      const opt = document.getElementById('moncevia-optin');
      const fab = document.getElementById('clplens-fab');
      const widget = document.getElementById('clplens-widget');
      const visibility = el => !el ? 'Ausente' : el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' ? 'Presente / visible' : 'Presente / oculto';
      output.textContent = [
        'MONCEVIA — DIAGNOSTICO 2',
        'Inyeccion con permisos: SI',
        'GM moderno get/set/xhr: '+[get,set,xhr].map(yes).join(' / '),
        'GM antiguo get/set/xhr: '+[legacyGet,legacySet,legacyXHR].map(yes).join(' / '),
        'Adaptador completo: '+yes(bridge),
        'Lectura clave de prueba: '+storageStatus,
        'Regex de Safari: '+yes(regex),
        'Password visible (sin leer datos): '+yes(visiblePassword),
        'Autorizacion: '+visibility(opt),
        'Boton: '+visibility(fab),
        'Widget: '+visibility(widget),
        'Sin consultas externas ni cambios de preferencias.'
      ].join('\n');
    }
    render();
    timer = setInterval(render, 1000);
    setTimeout(() => clearInterval(timer), 15000);
    if (get || legacyGet) {
      // Isolated diagnostic script key: never read Moncevia's actual preferences.
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      Promise.race([Promise.resolve().then(() => get ? modern.getValue('__moncevia_probe_unused__', 'probe-ok') : GM_getValue('__moncevia_probe_unused__', 'probe-ok')), timeout])
        .then(() => { storageStatus = 'OK'; render(); }, () => { storageStatus = 'ERROR / TIMEOUT'; render(); });
    } else { storageStatus = 'API ausente'; render(); }
  }
  if (document.body) start();
  else {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      observer.disconnect();
      start();
    });
    observer.observe(document, {childList:true, subtree:true});
  }
})();
