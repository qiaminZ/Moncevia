// ==UserScript==
// @name         Moncevia RIFT - Diagnostico de Safari (temporal)
// @namespace    https://github.com/qiaminZ/Moncevia/diagnostics
// @version      1.0.1
// @description  Verifica si Safari Userscripts inyecta un script en la tienda RIFT; sin acceso a datos.
// @match        https://shop.riftbot.org/*
// @match        https://shop.riftbots.org/*
// @match        https://riftbot.mysellauth.com/*
// @noframes
// @inject-into  content
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // This diagnostic does NOT read page input, storage, accounts or payment data;
  // it NEVER sends requests, tracks visitors or changes merchant controls.
  const path = location.pathname.toLowerCase();
  if (/(?:^|\/)(?:login|account|checkout|payment|pay|billing|wallet|auth)(?:\/|$)/.test(path))
    return;
  const show = () => {
    if (!document.body || document.getElementById('moncevia-rift-diagnostic')) return;
    const root = document.createElement('div');
    root.id = 'moncevia-rift-diagnostic';
    root.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'top:max(14px,env(safe-area-inset-top))',
      'right:12px', 'box-sizing:border-box', 'max-width:min(320px,calc(100vw - 24px))',
      'padding:12px', 'border:2px solid #60a5fa', 'border-radius:12px',
      'background:#0f172a', 'color:#fff', 'font:13px/1.45 system-ui,-apple-system,sans-serif',
      'box-shadow:0 8px 24px #0008'
    ].join(';');
    const title = document.createElement('strong');
    title.textContent = 'Moncevia — prueba de Safari';
    title.style.cssText = 'display:block;margin-right:28px';
    const status = document.createElement('p');
    status.textContent = 'La extensión Userscripts SÍ ejecutó este script.';
    status.style.cssText = 'margin:6px 0;color:#86efac';
    const domain = document.createElement('p');
    domain.style.cssText = 'margin:4px 0';
    domain.textContent = 'Dominio: ' + location.hostname;
    const help = document.createElement('p');
    help.textContent = 'Si Moncevia sigue ausente, envía una captura de esta tarjeta. Luego desactiva este diagnóstico.';
    help.style.cssText = 'margin:6px 0 0;font-size:11px;color:#cbd5e1';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Cerrar diagnóstico');
    close.style.cssText = [
      'position:absolute', 'top:5px', 'right:8px', 'border:0', 'background:transparent',
      'color:white', 'font-size:24px', 'padding:2px 6px'
    ].join(';');
    close.addEventListener('click', () => root.remove());
    root.append(title, status, domain, help, close);
    document.body.append(root);
  };
  if (document.body) show();
  else {
    const obs = new MutationObserver(() => {
      if (!document.body) return;
      obs.disconnect();
      show();
    });
    obs.observe(document, { childList: true, subtree: true });
  }
})();
