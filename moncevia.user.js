// ==UserScript==
// @name         Moncevia — Currency & Crypto Companion
// @namespace    https://local.clplens.userscript/
// @version      3.15.3
// @description  Conversor de monedas y criptomonedas para Safari, Firefox y navegadores Chromium compatibles (PC y Android).
// @match        https://*/*
// @downloadURL  https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js
// @updateURL    https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.meta.js
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
  "use strict";
  // src/styles/moncevia.css
  var moncevia_default = "\n      .clplens-badge { display:inline-flex!important; flex-direction:column!important; align-items:flex-start!important; gap:1px!important; vertical-align:middle!important; margin:3px 3px 3px 6px!important; padding:3px 6px!important; border-radius:7px!important; background:#ecfdf5!important; color:#064e3b!important; font:600 11px/1.35 -apple-system,BlinkMacSystemFont,Arial,sans-serif!important; text-align:left!important; white-space:normal!important; overflow-wrap:anywhere!important; max-width:min(97vw,380px)!important; border:1px solid #a7f3d0!important; text-transform:none!important; letter-spacing:normal!important; pointer-events:none!important; }\n      .clplens-badge > span { display:block!important; font:inherit!important; color:inherit!important; }\n      #clplens-widget { all:initial!important; position:fixed!important; bottom:max(12px,env(safe-area-inset-bottom))!important; right:10px!important; z-index:2147483646!important; font:14px/1.4 -apple-system,BlinkMacSystemFont,Arial,sans-serif!important; color:#f8fafc!important; direction:ltr!important; }\n      #clplens-widget, #clplens-widget * { box-sizing:border-box!important; }\n      #clplens-widget * { font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif!important; }\n      #clplens-fab { display:flex!important; align-items:center!important; justify-content:center!important; min-height:42px!important; min-width:86px!important; padding:8px 13px!important; border:1px solid #475569!important; border-radius:26px!important; background:#0f172a!important; color:#fff!important; font-size:13px!important; font-weight:700!important; box-shadow:0 5px 20px #0007!important; cursor:grab!important; touch-action:none!important; user-select:none!important; -webkit-user-select:none!important; }\n      #clplens-fab.mv-fab-moved { position:fixed!important; left:var(--mv-fab-left)!important; top:var(--mv-fab-top)!important; right:auto!important; bottom:auto!important; }\n      #clplens-fab.mv-fab-dragging { cursor:grabbing!important; opacity:.88!important; }\n      #clplens-panel {z-index:2!important;}\n      #clplens-panel { position:absolute!important; bottom:50px!important; right:0!important; width:min(375px,calc(100vw - 20px))!important; max-height:min(74dvh,640px)!important; overflow-y:auto!important; overflow-x:hidden!important; border:1px solid #475569!important; border-radius:15px!important; background:#0f172a!important; box-shadow:0 15px 40px #0009!important; padding:13px!important; color:#f8fafc!important; }\n      #clplens-panel[hidden], #clplens-panel .clplens-hidden { display:none!important; }\n      #clplens-panel h2 { margin:0 0 5px!important; color:#fff!important; font-size:19px!important; font-weight:750!important; }\n      #clplens-panel p { margin:6px 0!important; color:#cbd5e1!important; font-size:12px!important; line-height:1.45!important; }\n      #clplens-panel .clplens-strong { color:#5eead4!important; font-weight:650!important; }\n      #clplens-panel .clplens-warning { color:#fcd34d!important; }\n      #clplens-panel .clplens-tabs { display:flex!important; gap:6px!important; margin:11px 0!important; }\n      #clplens-panel button { cursor:pointer!important; border:1px solid #64748b!important; border-radius:8px!important; background:#1e293b!important; color:#fff!important; min-height:36px!important; padding:7px 9px!important; font-size:13px!important; }\n      #clplens-panel button[aria-selected='true'] { background:#164e63!important; border-color:#5eead4!important; }\n      #clplens-panel .clplens-tabs button { flex:1!important; }\n      #clplens-panel label { display:flex!important; justify-content:space-between!important; align-items:center!important; gap:10px!important; padding:7px 0!important; border-bottom:1px solid #1e293b!important; color:#f8fafc!important; font-size:13px!important; }\n      #clplens-panel .clplens-field { display:flex!important; flex-direction:column!important; align-items:stretch!important; gap:5px!important; padding:5px 0!important; border:0!important; }\n      #clplens-panel .clplens-inputrow { display:flex!important; gap:8px!important; }\n      #clplens-panel input[type=number], #clplens-panel input[type=text], #clplens-panel select { min-height:37px!important; border:1px solid #64748b!important; border-radius:7px!important; background:#1e293b!important; color:#fff!important; padding:5px 7px!important; font-size:16px!important; width:96px!important; max-width:100%!important; }\n      #clplens-panel .clplens-inputrow input { flex:1!important; min-width:0!important; width:auto!important; }\n      #clplens-panel .clplens-inputrow select { width:98px!important; }\n      #clplens-panel input[type=checkbox] { width:20px!important; height:20px!important; accent-color:#2dd4bf!important; flex-shrink:0!important; }\n      #clplens-panel .clplens-results { padding:9px!important; border:1px solid #334155!important; border-radius:10px!important; margin-top:8px!important; background:#111e31!important; }\n      #clplens-panel .clplens-results div { padding:3px 0!important; color:#d1fae5!important; font-size:14px!important; font-variant-numeric:tabular-nums!important; word-break:break-word!important; }\n      #clplens-panel .clplens-actions { display:flex!important; gap:8px!important; position:sticky!important; bottom:-13px!important; background:#0f172a!important; padding:11px 0 2px!important; }\n      #clplens-panel .clplens-actions button { flex:1!important; }\n      #clplens-panel a { color:#67e8f9!important; text-decoration:underline!important; }\n      #clplens-panel .clplens-payment { padding:8px!important; margin:8px 0!important; border:1px solid #475569!important; border-radius:8px!important; background:#15233a!important; }\n      #clplens-panel .clplens-payment strong { display:block!important; color:#5eead4!important; padding-bottom:4px!important; }\n      #clplens-panel .clplens-payment div { margin:3px 0!important; overflow-wrap:anywhere!important; }\n      #clplens-panel .clplens-record { margin:8px 0!important; padding:9px!important; background:#15233a!important; border:1px solid #475569!important; border-radius:8px!important; }\n      #clplens-panel .clplens-record div { margin:3px 0!important; }\n      #clplens-panel .clplens-record button { margin-top:5px!important; }\n      #clplens-panel .clplens-action-row { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; gap:7px!important; margin:8px 0!important; }\n      #clplens-panel .clplens-action-row button { min-height:42px!important; }\n      #clplens-widget #clplens-compact { position:absolute!important; right:0!important; bottom:52px!important; width:min(300px,calc(100vw - 24px))!important; padding:10px!important; border:1px solid #475569!important; border-radius:11px!important; background:#0f172a!important; box-shadow:0 5px 20px #0009!important; color:#f8fafc!important; font-size:12px!important; line-height:1.5!important; overflow-wrap:anywhere!important; }\n      #clplens-widget #clplens-compact[hidden] {display:none!important;}\n      #clplens-widget .clplens-mini-head {color:#5eead4!important;font-weight:600!important;}\n      #clplens-widget .clplens-mini-big {color:#fff!important;font-size:20px!important;font-weight:700!important;}\n      #clplens-widget .clplens-mini-note {color:#cbd5e1!important;font-size:10px!important;}\n      .clplens-price-flash { outline:3px solid #2dd4bf!important;outline-offset:2px!important; }\n      .clplens-picking * { cursor:crosshair!important; }\n\n      /* Moncevia 3.3: mini-app modular. All selectors scoped to the userscript. */\n      #clplens-panel {width:min(410px,calc(100vw - 20px))!important; max-height:min(80dvh,700px)!important; padding:0!important; border-radius:18px!important; background:#0b1424!important; scroll-padding-top:94px!important; overscroll-behavior:contain!important;}\n      #clplens-panel .mv-header {position:relative!important;z-index:1!important;background:#0b1424!important;padding:15px 15px 9px!important;border-bottom:1px solid #243449!important;}\n      #clplens-panel .mv-titlebar {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;}\n      #clplens-panel .mv-lang-toggle {min-height:28px!important;min-width:38px!important;padding:3px 7px!important;font-size:11px!important;border-radius:7px!important;font-weight:700!important;color:#99f6e4!important;}\n      #clplens-panel .mv-titlebar h2 {font-size:18px!important;margin:0!important;letter-spacing:-.35px!important;}\n      #clplens-panel .mv-version {font-size:10px!important;color:#91a3b8!important;border:1px solid #334155!important;border-radius:5px!important;padding:3px 5px!important;white-space:nowrap!important;}\n      #clplens-panel .mv-status {display:flex!important;align-items:center!important;gap:6px!important;margin:8px 0 0!important;color:#8da7b5!important;font-size:11px!important;line-height:1.35!important;}\n      #clplens-panel .mv-dot {width:7px!important;height:7px!important;flex:none!important;border-radius:50%!important;background:#2dd4bf!important;}\n      #clplens-panel .mv-dot.mv-stale {background:#f59e0b!important;}\n      #clplens-panel .mv-nav {display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2px!important;background:#101c2c!important;padding:5px!important;margin:0!important;border-bottom:1px solid #25344a!important;position:sticky!important;top:0!important;z-index:5!important;}\n      #clplens-panel .mv-nav button {min-width:0!important;min-height:43px!important;padding:5px 2px!important;border:0!important;border-radius:8px!important;background:transparent!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;font-size:10px!important;font-weight:600!important;color:#a7bbca!important;}\n      #clplens-panel .mv-nav button .mv-nav-icon {font-size:16px!important;line-height:1!important;font-weight:550!important;}\n      #clplens-panel .mv-nav button[aria-selected='true'] {background:#134e59!important;color:#ccfbf1!important;outline:1px solid #36b7ac!important;}\n      #clplens-panel .mv-page {padding:14px 15px 12px!important;min-height:160px!important;}\n      #clplens-panel .mv-page > h2 {margin:1px 0 10px!important;font-size:16px!important;}\n      #clplens-panel .mv-hint {font-size:11px!important;color:#97adbe!important;margin:5px 0 12px!important;line-height:1.4!important;}\n      #clplens-panel .mv-target-row {display:flex!important;gap:8px!important;align-items:stretch!important;margin-top:6px!important;}\n      #clplens-panel .mv-target-row select {flex:1!important;min-width:0!important;width:auto!important;}\n      #clplens-panel .mv-swap {flex:none!important;min-width:52px!important;min-height:41px!important;border:1px solid #2cc3b4!important;border-radius:9px!important;background:#123e4b!important;color:#ccfbf1!important;font-size:22px!important;cursor:pointer!important;}\n      #clplens-panel .mv-swap:focus-visible {outline:2px solid #5eead4!important;outline-offset:2px!important;}\n      #clplens-panel .mv-hero {border:1px solid #235462!important;background:linear-gradient(145deg,#143443,#112538)!important;border-radius:14px!important;padding:12px!important;margin:10px 0 13px!important;}\n      #clplens-panel .mv-hero .mv-kicker {font-size:10px!important;color:#b6d2d7!important;letter-spacing:.6px!important;text-transform:uppercase!important;}\n      #clplens-panel .mv-hero .mv-big {font-size:27px!important;line-height:1.25!important;font-weight:750!important;color:#e9fffa!important;overflow-wrap:anywhere!important;font-variant-numeric:tabular-nums!important;}\n      #clplens-panel .mv-hero .mv-sub {color:#91c9c6!important;font-size:11px!important;margin-top:5px!important;}\n      #clplens-panel .mv-disclosure.mv-rates-disclosure {margin:4px 0 0!important;border:0!important;background:transparent!important;}\n      #clplens-panel .mv-disclosure.mv-rates-disclosure > summary {font-size:11px!important;font-weight:500!important;color:#91aab9!important;padding:5px 0!important;}\n      #clplens-panel .mv-disclosure.mv-rates-disclosure .mv-details-content {border-top:0!important;padding:4px 0 7px!important;}\n      #clplens-panel .mv-rates {margin:0!important;color:#b2c6d2!important;font-size:12px!important;}\n      #clplens-panel .mv-rates b {color:#f8fafc!important;}\n      #clplens-panel .mv-grid {display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;}\n      #clplens-panel .mv-unit {display:flex!important;justify-content:space-between!important;align-items:center!important;gap:7px!important;border:1px solid #26394e!important;border-radius:10px!important;background:#142237!important;padding:10px 9px!important;min-width:0!important;}\n      #clplens-panel .mv-unit span {font-size:11px!important;color:#9db0bf!important;white-space:nowrap!important;}\n      #clplens-panel .mv-unit strong {font-size:12px!important;color:#dcfef6!important;font-variant-numeric:tabular-nums!important;overflow-wrap:anywhere!important;text-align:right!important;}\n      #clplens-panel .mv-unit.mv-full {grid-column:span 2!important;}\n      #clplens-panel .clplens-action-row {margin:12px 0 0!important;gap:7px!important;}\n      #clplens-panel .clplens-action-row button {min-height:39px!important;font-size:11px!important;padding:7px!important;}\n      #clplens-panel .mv-action-primary {background:#105362!important;border-color:#2cc3b4!important;}\n      #clplens-panel .mv-subtle {font-size:11px!important;color:#9dafbd!important;margin:8px 0 0!important;}\n      #clplens-panel .mv-fee-notice {font-size:11px!important;line-height:1.4!important;color:#fed88b!important;border-left:2px solid #f59e0b!important;padding:5px 9px!important;margin:10px 0!important;background:#2b241e!important;border-radius:4px!important;}\n      #clplens-panel .mv-disclosure {border:1px solid #2d4056!important;border-radius:10px!important;background:#101e30!important;margin:8px 0!important;overflow:hidden!important;}\n      #clplens-panel .mv-disclosure > summary {cursor:pointer!important;list-style:none!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:12px!important;color:#f1f5f9!important;font-size:13px!important;font-weight:650!important;}\n      #clplens-panel .mv-disclosure > summary::-webkit-details-marker {display:none!important;}\n      #clplens-panel .mv-disclosure > summary:after {content:'⌄'!important;color:#93aabb!important;font-size:16px!important;flex:none!important;}\n      #clplens-panel .mv-disclosure[open] > summary:after {content:'⌃'!important;}\n      #clplens-panel .mv-disclosure .mv-details-content {padding:0 12px 11px!important;border-top:1px solid #27374b!important;}\n      #clplens-panel .mv-details-content label {min-height:42px!important;}\n      #clplens-panel .mv-payment-amount {font-weight:750!important;color:#d9fff5!important;font-size:15px!important;}\n      #clplens-panel .mv-payment-card > summary {align-items:flex-start!important;flex-wrap:wrap!important;}\n      #clplens-panel .mv-payment-card .mv-payment-status {display:block!important;width:100%!important;line-height:1.2!important;}\n      #clplens-panel .mv-payment-summary {display:flex!important;flex-direction:column!important;min-width:0!important;gap:3px!important;}\n      #clplens-panel .mv-payment-summary small {font-size:11px!important;color:#9aafc0!important;font-weight:450!important;}\n      #clplens-panel .mv-payment-status {font-size:10px!important;color:#ffcb80!important;white-space:nowrap!important;}\n      #clplens-panel .mv-payment-status.ready {color:#5eead4!important;}\n      #clplens-panel .mv-payment-details > div {margin:8px 0!important;overflow-wrap:anywhere!important;color:#cfdee7!important;font-size:12px!important;}\n      #clplens-panel .mv-payment-details .clplens-warning {color:#facf83!important;}\n      #clplens-panel .mv-linklike {background:transparent!important;border:0!important;color:#5eead4!important;padding:5px!important;font-size:12px!important;text-align:left!important;}\n      #clplens-panel .clplens-actions {margin:0!important;position:sticky!important;bottom:0!important;z-index:5!important;background:#0b1424!important;border-top:1px solid #25344a!important;padding:9px 15px calc(9px + env(safe-area-inset-bottom,0px))!important;}\n      #clplens-panel .clplens-actions button {min-height:39px!important;font-size:12px!important;}\n      #clplens-panel .mv-settings-group {margin:9px 0!important;}\n      #clplens-panel .mv-settings-group > summary {font-size:13px!important;}\n      #clplens-panel .mv-help {font-size:11px!important;color:#a8b8c5!important;line-height:1.45!important;}\n      #clplens-panel .mv-settings-group input {font-variant-numeric:tabular-nums!important;}\n      #clplens-panel .mv-settings-group label span {line-height:1.3!important;}\n      #clplens-panel .mv-section-note {color:#a3b9c8!important;font-size:11px!important;margin:5px 0 11px!important;}\n      #clplens-panel .mv-record-summary {display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important;align-items:center!important;}\n      #clplens-panel .mv-record-summary small {font-size:11px!important;color:#a0b8c7!important;}\n      #clplens-panel .mv-record-summary strong {font-size:13px!important;color:#e4fbf7!important;}\n      #clplens-panel button:focus-visible,#clplens-panel summary:focus-visible {outline:2px solid #5eead4!important;outline-offset:2px!important;}\n      /* Escritório/PC: panel más ancho y controles legibles, sin alterar el layout móvil. */\n      @media (min-width:850px) {\n        #clplens-widget {right:20px!important;bottom:20px!important;font-size:15px!important;}\n        #clplens-panel {width:min(490px,calc(100vw - 48px))!important;max-height:min(83dvh,780px)!important;}\n        #clplens-panel .mv-page {padding:18px 20px 16px!important;}\n        #clplens-panel .mv-header {padding:17px 20px 12px!important;}\n        #clplens-panel .mv-nav button {font-size:12px!important;min-height:48px!important;}\n        #clplens-panel .mv-unit strong {font-size:13px!important;}\n        #clplens-panel .mv-hero .mv-big {font-size:30px!important;}\n      }\n      @media (max-width:350px) {#clplens-panel .mv-nav button {font-size:9px!important;}#clplens-panel .mv-nav button .mv-nav-icon {font-size:14px!important;}#clplens-panel .mv-hero .mv-big {font-size:23px!important;}}\n      @media (prefers-reduced-motion:reduce) {#clplens-panel *,#clplens-fab {animation:none!important;transition:none!important;}}\n      @media (prefers-color-scheme: dark) { .clplens-badge { background:#064e3b!important; color:#ecfdf5!important; border-color:#047857!important; } }\n    \n\n/* Phase 3: responsive behavior is scoped to Moncevia; merchants' layouts stay untouched. */\n#clplens-panel {\n  max-width: calc(100vw - 16px)!important;\n  overscroll-behavior: contain!important;\n  scrollbar-gutter: stable!important;\n}\n#clplens-panel .mv-page {\n  min-width: 0!important;\n  overflow-wrap: anywhere!important;\n}\n#clplens-panel .mv-nav {\n  max-width: 100%!important;\n}\n#clplens-panel .mv-nav button {\n  min-width: 0!important;\n  overflow-wrap: anywhere!important;\n}\n#clplens-panel .mv-grid > *,\n#clplens-panel .clplens-action-row > * {\n  min-width: 0!important;\n}\n#clplens-panel input:focus-visible,\n#clplens-panel select:focus-visible,\n#clplens-fab:focus-visible {\n  outline: 2px solid #5eead4!important;\n  outline-offset: 2px!important;\n}\n@media (max-width: 420px) {\n  #clplens-panel {\n    width: min(410px, calc(100vw - 16px))!important;\n    max-height: min(82dvh, 680px)!important;\n  }\n  #clplens-panel .mv-page {\n    padding-inline: 11px!important;\n  }\n  #clplens-panel .mv-header {\n    padding-inline: 11px!important;\n  }\n  #clplens-panel .mv-nav {\n    overflow-x: auto!important;\n    scroll-snap-type: x proximity!important;\n  }\n  #clplens-panel .mv-nav button {\n    scroll-snap-align: start!important;\n    flex: 1 1 0!important;\n  }\n  #clplens-panel .mv-target-row select {\n    min-width: 0!important;\n  }\n  #clplens-panel .mv-unit {\n    padding: 8px 7px!important;\n  }\n}\n@media (min-width: 421px) and (max-width: 849px) {\n  #clplens-panel {\n    width: min(510px, calc(100vw - 32px))!important;\n    max-height: min(86dvh, 780px)!important;\n  }\n  #clplens-panel .mv-page {\n    padding-inline: 16px!important;\n  }\n}\n@media (max-height: 500px) {\n  #clplens-panel {\n    position: fixed!important;\n    top: max(8px, env(safe-area-inset-top, 0px))!important;\n    right: max(8px, env(safe-area-inset-right, 0px))!important;\n    bottom: auto!important;\n    left: auto!important;\n    max-height: calc(100dvh - 16px)!important;\n    max-width: calc(100vw - 16px)!important;\n  }\n  #clplens-panel .mv-nav button {\n    min-height: 40px!important;\n  }\n}\n@media (max-width: 340px) {\n  #clplens-panel .mv-inputrow select,\n  #clplens-panel .clplens-inputrow select {\n    width: 78px!important;\n  }\n  #clplens-panel .mv-grid {\n    grid-template-columns: minmax(0, 1fr)!important;\n  }\n  #clplens-panel .mv-unit.mv-full {\n    grid-column: auto!important;\n  }\n}\n";

  // src/types/currency.ts
  var FIAT_CODES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "KRW", "BRL", "CNY"];
  var CRYPTO_LIST = ["BTC", "ETH", "LTC"];
  var CRYPTO_CODES = new Set(CRYPTO_LIST);

  // src/core/parse-amount.ts
  function parseAmount(raw, code) {
    let s = String(raw).replace(/[\s\u00a0\u202f]/g, "");
    if (!/^\d[\d.,]*$/.test(s)) return NaN;
    const c = s.lastIndexOf(","), d = s.lastIndexOf(".");
    if (c !== -1 && d !== -1) {
      const dec = c > d ? "," : ".";
      s = s.split(dec === "," ? "." : ",").join("").replace(dec, ".");
    } else {
      const sep = c !== -1 ? "," : d !== -1 ? "." : "";
      if (sep) {
        const bits = s.split(sep);
        const cryptoCode = CRYPTO_CODES.has(code);
        if (!cryptoCode && bits.length === 2 && (bits[1]?.length ?? 0) === 3 && (bits[0]?.length ?? 0) <= 3)
          return NaN;
        if (bits.length > 2) s = bits.join("");
        else s = bits.join(".");
      }
    }
    const value = Number(s);
    return value > 0 && value < 1e12 && Number.isFinite(value) ? value : NaN;
  }

  // src/core/conversion.ts
  var FX_STALE_MS = 3 * 864e5;
  var CRYPTO_STALE_MS = 45 * 6e4;
  var isPositive = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0;
  };
  var inDate = (value, now, ttl) => value !== null && Number.isFinite(value.fetchedAt) && now - value.fetchedAt >= 0 && now - value.fetchedAt < ttl;
  function createConversionEngine(context) {
    const { settings, fx, crypto, now } = context;
    const activeFX = () => inDate(fx, now, FX_STALE_MS) && isPositive(fx?.rates.EUR) && isPositive(fx?.rates.CLP);
    const activeCrypto = () => inDate(crypto, now, CRYPTO_STALE_MS) && (!crypto?.quotedAt || now - crypto.quotedAt >= -3e5 && now - crypto.quotedAt < CRYPTO_STALE_MS) && CRYPTO_LIST.every((code) => isPositive(crypto?.usd?.[code])) && (!crypto?.source?.startsWith("Binance") || isPositive(crypto.usdtUsd));
    const usdClp = () => {
      if (isPositive(settings.usdClpManual)) return Number(settings.usdClpManual);
      return activeFX() ? Number(fx?.rates.CLP) : null;
    };
    const eurClp = () => {
      if (isPositive(settings.eurClpManual)) return Number(settings.eurClpManual);
      const base = usdClp();
      return activeFX() && base !== null ? base / Number(fx?.rates.EUR) : null;
    };
    const spotAsk = (code) => {
      if (!activeCrypto()) return null;
      return isPositive(crypto?.askUSDT?.[code]) ? Number(crypto?.askUSDT?.[code]) * Number(crypto?.usdtUsd) : Number(crypto?.usd?.[code]);
    };
    const spotBid = (code) => {
      if (!activeCrypto()) return null;
      return isPositive(crypto?.bidUSDT?.[code]) ? Number(crypto?.bidUSDT?.[code]) * Number(crypto?.usdtUsd) : Number(crypto?.usd?.[code]);
    };
    const fiatUsd = (amount, code) => {
      if (code === "USD") return amount;
      const base = usdClp();
      if (code === "EUR" && isPositive(settings.eurClpManual) && base !== null) {
        return amount * Number(settings.eurClpManual) / base;
      }
      if (CRYPTO_LIST.some((coin) => coin === code)) {
        const bid = spotBid(code);
        return bid === null ? null : amount * bid;
      }
      if (!activeFX() || !isPositive(fx?.rates[code])) return null;
      return amount / Number(fx?.rates[code]);
    };
    const toCLP = (amount, code) => {
      if (code === "CLP") return amount;
      if (code === "EUR" && isPositive(settings.eurClpManual)) {
        return amount * Number(settings.eurClpManual);
      }
      const usd = fiatUsd(amount, code), rate = usdClp();
      return usd !== null && rate !== null ? usd * rate : null;
    };
    const toUnits = (amount, from, to) => {
      if (from === to) return amount;
      if (to === "CLP") return toCLP(amount, from);
      if (from === "CLP") {
        const rate2 = usdClp();
        if (rate2 === null) return null;
        return toUnits(amount / rate2, "USD", to);
      }
      const usd = fiatUsd(amount, from);
      if (usd === null) return null;
      if (to === "USD") return usd;
      const rate = usdClp();
      if (to === "EUR" && isPositive(settings.eurClpManual) && rate !== null) {
        return usd * rate / Number(settings.eurClpManual);
      }
      if (FIAT_CODES.some((fiat) => fiat === to) && activeFX() && isPositive(fx?.rates[to])) {
        return usd * Number(fx?.rates[to]);
      }
      if (CRYPTO_LIST.some((coin) => coin === to) && activeCrypto()) {
        const ask = spotAsk(to);
        return ask !== null && ask > 0 ? usd / ask : null;
      }
      return null;
    };
    return {
      activeFX,
      activeCrypto,
      fiatUsd,
      usdClp,
      eurClp,
      toCLP,
      toUnits,
      spotAsk,
      spotBid
    };
  }

  // src/core/crypto-units.ts
  function coinMinor(raw) {
    const initial = String(raw).trim().replace(",", ".");
    const s = /e/i.test(initial) && Number.isFinite(Number(initial)) ? Number(initial).toFixed(8) : initial;
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    const [integer, fraction = ""] = s.split(".");
    if (!integer || integer.length > 10 || fraction.length > 8) return null;
    return BigInt(integer) * 100000000n + BigInt((fraction + "00000000").slice(0, 8));
  }
  function ceil8(value) {
    if (!Number.isFinite(value) || value < 0 || value > 1e10) return null;
    const s = value.toFixed(12);
    const [integer, fraction = ""] = s.split(".");
    if (!integer) return null;
    let units = BigInt(integer) * 100000000n + BigInt((fraction + "00000000").slice(0, 8));
    if (/[1-9]/.test(fraction.slice(8))) units += 1n;
    return Number(units) / 1e8;
  }
  var roundUp2 = (value) => Number.isFinite(value) ? Math.ceil((value - 1e-10) * 100) / 100 : null;

  // src/core/fx-validation.ts
  var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  var positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
  function validateFXResponse(input, now) {
    if (!isRecord(input) || input.result !== "success" || input.base_code !== "USD" || !isRecord(input.rates))
      return null;
    const epoch = input.time_last_update_unix;
    if (!positive(epoch) || !Number.isFinite(now)) return null;
    const providerTime = epoch * 1e3;
    if (providerTime > now + 36e5 || now - providerTime > 7 * 864e5) return null;
    if (!positive(input.rates.CLP) || !positive(input.rates.EUR)) return null;
    const rates = {};
    for (const code of [...FIAT_CODES, "CLP"]) {
      const value = input.rates[code];
      if (positive(value)) rates[code] = value;
    }
    return { fetchedAt: now, providerTime, rates };
  }

  // src/core/provider-validation.ts
  var record = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  var positive2 = (v) => {
    if (typeof v !== "number" && typeof v !== "string") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  var fresh = (unixSeconds, now) => {
    const time = positive2(unixSeconds);
    if (time === null || !Number.isFinite(now)) return null;
    const timeMs = time * 1e3;
    return Math.abs(now - timeMs) <= CRYPTO_STALE_MS ? timeMs : null;
  };
  function validateUSDTParity(input, now) {
    if (!record(input) || !record(input.tether)) return null;
    const parity = positive2(input.tether.usd);
    const timestamp = fresh(input.tether.last_updated_at, now);
    return parity !== null && parity >= 0.8 && parity <= 1.2 && timestamp !== null ? parity : null;
  }
  function validateBinanceSnapshot(tickers, usdtUsd, now) {
    if (!Array.isArray(tickers) || tickers.length !== CRYPTO_LIST.length || !Number.isFinite(now) || !Number.isFinite(usdtUsd) || usdtUsd < 0.8 || usdtUsd > 1.2)
      return null;
    const usd = {};
    const askUSDT = {};
    const bidUSDT = {};
    for (let index = 0; index < CRYPTO_LIST.length; index++) {
      const coin = CRYPTO_LIST[index];
      const entry = tickers[index];
      if (!coin || !record(entry) || entry.symbol !== coin + "USDT") return null;
      const ask = positive2(entry.askPrice), bid = positive2(entry.bidPrice);
      if (ask === null || bid === null || ask < bid || ask / bid > 1.15) return null;
      const mid = (ask + bid) / 2 * usdtUsd;
      if (!Number.isFinite(mid) || mid <= 0) return null;
      askUSDT[coin] = ask;
      bidUSDT[coin] = bid;
      usd[coin] = mid;
    }
    return {
      fetchedAt: now,
      quotedAt: now,
      source: "Binance Spot + CoinGecko USDT/USD",
      usdtUsd,
      usd,
      askUSDT,
      bidUSDT
    };
  }
  function validateCoinGeckoSnapshot(input, now) {
    if (!record(input) || !Number.isFinite(now)) return null;
    const ids = {
      BTC: "bitcoin",
      ETH: "ethereum",
      LTC: "litecoin"
    };
    const usd = {};
    let quotedAt = Infinity;
    for (const coin of CRYPTO_LIST) {
      const item = input[ids[coin]];
      if (!record(item)) return null;
      const value = positive2(item.usd);
      const timestamp = fresh(item.last_updated_at, now);
      if (value === null || timestamp === null) return null;
      usd[coin] = value;
      quotedAt = Math.min(quotedAt, timestamp);
    }
    return { fetchedAt: now, quotedAt, source: "CoinGecko (USD, respaldo)", usd };
  }
  function validateCoinbaseSnapshot(input, now) {
    if (!Array.isArray(input) || input.length !== CRYPTO_LIST.length || !Number.isFinite(now))
      return null;
    const usd = {};
    for (let index = 0; index < CRYPTO_LIST.length; index++) {
      const coin = CRYPTO_LIST[index], response = input[index];
      if (!coin || !record(response) || !record(response.data) || response.data.base !== coin || response.data.currency !== "USD")
        return null;
      const amount = positive2(response.data.amount);
      if (amount === null) return null;
      usd[coin] = amount;
    }
    return { fetchedAt: now, source: "Coinbase (USD, respaldo)", usd };
  }

  // src/i18n/catalog.ts
  var EN = {
    "Moncevia — conversión y pagos": "Moncevia — currency and payments",
    "Abrir Moncevia": "Open Moncevia",
    "Arrastra para mover · toca para abrir": "Drag to move · tap to open",
    "Restablecer posición del botón": "Reset floating button position",
    "Sincronizando precio seleccionado…": "Syncing selected price…",
    "Secciones de Moncevia": "Moncevia sections",
    "Consultando tasas…": "Checking rates…",
    "Consultando criptomonedas…": "Checking crypto prices…",
    "Tasas y fuentes": "Rates & sources",
    "Fuentes: ": "Sources: ",
    Convertir: "Convert",
    Pagar: "Pay",
    Comparar: "Compare",
    Historial: "History",
    Ajustes: "Settings",
    "Pago con criptomonedas": "Crypto payment",
    "Calcula lo que necesitarías comprar para cubrir un importe solicitado por un comercio.": "Estimate how much crypto to buy so the merchant receives the required amount.",
    "Comparar métodos de pago": "Compare payment methods",
    "Costos orientativos configurados, no cargos confirmados.": "Configured estimates, not confirmed charges.",
    "Historial local": "Local history",
    Configuración: "Settings",
    "Importe y moneda de origen": "Amount and source currency",
    "Moneda de destino": "Target currency",
    "Invertir monedas": "Swap currencies",
    "Resultado en": "Result in",
    "Precio elegido": "Use selected price",
    "Seleccionar en web": "Pick price on page",
    "Elegir precio en pantalla": "Pick price on page",
    "Cancelar selección": "Cancel selection",
    Guardar: "Save",
    "Vista compacta": "Compact view",
    "Calcular pago con cripto →": "Calculate crypto payment →",
    "Usar importe exacto solicitado en cripto": "Use the exact crypto amount requested",
    "Cantidad que debe recibir el comercio": "Amount the merchant must receive",
    "Cantidad exacta del comercio": "Exact amount from merchant",
    "Antes de enviar fondos": "Before sending funds",
    "Comprueba importe exacto, red compatible, mínimo y comisión en tu cuenta Binance. Moncevia no realiza transferencias ni obtiene tarifas privadas.": "Check the exact amount, compatible network, withdrawal minimum and fee in Binance. Moncevia never sends funds or retrieves private fees.",
    "General y sitio actual": "General & current site",
    "Conversión activada": "Enable conversion",
    "Modo compacto al cerrar panel": "Compact mode when panel closes",
    "Permitir selección visual de precios": "Enable visual price selection",
    "Sincronizar importe con la opcion tocada": "Sync amount with selected option",
    "Desactivar en este sitio": "Disable on this website",
    "Guardar dominio en nuevas consultas de historial": "Save domain with future history entries",
    "Tratar $ como USD solo aquí": "Treat $ as USD on this website only",
    "Moneda de $ en este sitio": "Currency for $ on this site",
    "Sin definir (preguntar al tocar)": "Unset (ask when tapped)",
    "Selecciona la moneda de $": "Select the currency for $",
    "El símbolo $ no identifica una divisa única. Elige cómo interpretar los precios de este sitio.": "The $ symbol is ambiguous. Choose the currency used for prices on this website.",
    "Confirmar moneda": "Confirm currency",
    Cancelar: "Cancel",
    "Usar esta tarifa": "Use this price",
    "Mostrar BTC / ETH / LTC junto a precios": "Show BTC / ETH / LTC beside prices",
    "Comparar Prex / Santander en precios": "Show Prex / Santander beside prices",
    "Divisas y tarjetas": "Currencies & cards",
    "Ajuste Prex verificado por ti": "Prex markup verified by you",
    "Ajuste Santander verificado por ti": "Santander markup verified by you",
    "1 USD en CLP (0 = automático)": "1 USD in CLP (0 = automatic)",
    "1 EUR en CLP (0 = automático)": "1 EUR in CLP (0 = automatic)",
    "Ajuste Prex (%)": "Prex markup (%)",
    "Ajuste Santander (%)": "Santander markup (%)",
    "Impuestos adicionales (%)": "Additional taxes (%)",
    "Binance y redes de retiro": "Binance & withdrawal networks",
    "Comisiones de retiro opcionales (cantidad de moneda, NO porcentaje). El valor depende de la red seleccionada y del exchange.": "Optional withdrawal fees (coin units, NOT percentages). The amount depends on the selected network and exchange.",
    "Retiro BTC (BTC)": "BTC withdrawal fee (BTC)",
    "Retiro ETH (ETH)": "ETH withdrawal fee (ETH)",
    "Retiro LTC (LTC)": "LTC withdrawal fee (LTC)",
    "Comisión Spot verificada": "Spot fee verified",
    "Comisión de compra Spot (%)": "Spot buying fee (%)",
    "Recargo / coste de adquirir USDT (%)": "USDT funding markup (%)",
    "Costo de fondeo USDT verificado": "USDT funding cost verified",
    "Margen adicional de fluctuación (%)": "Additional price buffer (%)",
    "Ayuda, límites y privacidad": "Help, limitations & privacy",
    "Al cambiar una comisión, un margen bancario o una red se desmarca su verificación anterior. Confirma el dato nuevo directamente antes de marcarlo otra vez.": "Changing a fee, bank markup or network clears its prior verification. Confirm the new value directly before verifying it again.",
    "El simulador NO puede obtener comisiones privadas de retiro de tu cuenta Binance sin autenticación. Nunca introduzcas API keys en este script. Comprueba red, comisión, mínimo, habilitación y monto recibido en Binance.": "The simulator cannot retrieve private Binance withdrawal fees without authentication. Never enter API keys in this script. Verify the network, fee, minimum, availability and received amount in Binance.",
    "La comparación de tarjetas aplica un porcentaje configurado sobre CLP. No constituye una cotización oficial de Prex o Santander. Las comisiones de retiro no se aplican automáticamente al texto de los precios.": "Card comparisons apply your configured markup to CLP. These are not official Prex or Santander quotes. Withdrawal fees are not added to inline price labels.",
    "El importe se actualiza cuando tocas una opcion con precio o cuando cambia un resumen de seleccion reconocido (por ejemplo SELECTED ACCESS). Si escribes manualmente, se mantiene tu cifra hasta tocar otra opcion o pulsar Usar precio seleccionado.": "The amount updates when you tap a priced option or a recognized selection summary changes (such as SELECTED ACCESS). Manual amounts remain until you tap another option or select Use selected price.",
    "Activación por sitio: RIFT se permite inicialmente. En otras webs compatibles debes autorizar Moncevia expresamente. No se ejecuta el detector ni se consulta ninguna API antes de activar.": "Site permissions: RIFT is initially allowed. You must explicitly approve Moncevia on other supported sites. No price scanning or API requests occur before approval.",
    "Binance publica pares en USDT; el cambio de USDT a USD se obtiene por separado. Si falta, se deshabilita la conversión cruzada de Binance. Los retiros necesitan verificar red, mínimo y comisión en Binance.": "Binance quotes pairs in USDT; USDT/USD is sourced independently. Without it, Binance cross-currency conversion is disabled. Verify withdrawal network, minimum and fee in Binance.",
    "No actúa en sitios financieros protegidos ni rutas de pago. Los comercios .cl requieren autorización. $ sin prefijo requiere elegir su moneda para este sitio.": "Moncevia does not run on protected financial sites or payment paths. .cl shops require authorization. A bare $ requires choosing its currency for this site.",
    "Revocar acceso a este sitio": "Revoke access to this website",
    "¿Revocar acceso de Moncevia a este dominio?": "Revoke Moncevia access to this domain?",
    "No fue posible guardar la revocación.": "Could not save the revocation.",
    "Borrar historial local": "Clear local history",
    "Exportar historial CSV": "Export history as CSV",
    "¿Borrar las consultas guardadas en Moncevia?": "Delete saved Moncevia entries?",
    "No hay consultas guardadas.": "No saved entries.",
    "Los datos se conservan localmente en Userscripts. No se envían tus consultas ni direcciones a servidores. Las tasas futuras se comparan solo al abrir el historial.": "Your data stays in local Userscripts storage. Entries and website addresses are not sent to a Moncevia server. New rates are compared only when opening history.",
    "Actualizar tasas": "Refresh rates",
    Cerrar: "Close",
    "Consultando…": "Fetching…",
    "Equivalencia en pesos chilenos": "Equivalent in Chilean pesos",
    "Valor de referencia · no es el cobro final de tu banco": "Reference amount · not your final bank charge",
    "Sin tasa disponible": "Rate unavailable",
    "Sin tasa CLP": "No CLP rate",
    "Introduce un importe positivo.": "Enter a positive amount.",
    "Sin consultas guardadas. Solo se registra cuando pulsas Guardar; no se almacenan direcciones ni datos bancarios.": "No saved entries. Only records you explicitly save are stored; no addresses or banking data are recorded.",
    Reutilizar: "Reuse",
    "Sin cotización válida para comparar.": "No valid rate to compare.",
    "Sin suficientes métodos con costos marcados como verificados para elegir el más económico.": "Not enough payment methods have verified costs to identify the cheapest.",
    "Cómo interpretar la comparación": "Understanding the comparison",
    "* USDT indica costo Spot preliminar, sin fondeo final verificado. Las tarjetas usan porcentajes configurados; no son cotizaciones del banco. Los precios Spot no garantizan profundidad ni ejecución.": "* USDT is a preliminary Spot estimate without verified funding. Card estimates use configured markups, not bank quotes. Spot prices do not guarantee liquidity or execution.",
    "Faltan datos de costos": "Cost details missing",
    "Datos marcados como verificados": "Values marked as verified",
    "Configurar comisiones": "Configure fees",
    "Estimación, no importe definitivo. Revisa la red y el monto recibido en Binance antes de confirmar.": "Estimate only, not a final amount. Verify the network and amount received in Binance before confirming.",
    "Estimación incompleta. Comprueba la comisión, la red y el importe exacto en Binance antes de enviar.": "Incomplete estimate. Check the fee, network and exact amount in Binance before sending.",
    "Sincronizacion desactivada · importe manual": "Sync disabled · manual amount",
    "Importe manual · toca otra opcion de la pagina para retomar la sincronizacion": "Manual amount · tap another page option to resume syncing",
    "Automatico activo · selecciona un precio de la pagina": "Auto sync on · select a price on the page",
    "Opcion seleccionada": "Selected option",
    "Precio seleccionado": "Selected price",
    "Precio tocado": "Tapped price",
    "Comisión de retiro BTC verificada": "BTC withdrawal fee verified",
    "Comisión de retiro ETH verificada": "ETH withdrawal fee verified",
    "Comisión de retiro LTC verificada": "LTC withdrawal fee verified",
    "Red de retiro BTC": "BTC withdrawal network",
    "Red de retiro ETH": "ETH withdrawal network",
    "Red de retiro LTC": "LTC withdrawal network",
    "Binance Spot: usamos el precio de venta (ask) para estimar cuánto cuesta comprar BTC/ETH/LTC con USDT. La comisión de trading depende de tu nivel y descuentos; no se presupone.": "Binance Spot: the ask price estimates the cost of buying BTC/ETH/LTC with USDT. Trading fees depend on your tier and discounts; no fee is assumed.",
    "Conversión aproximada de Moncevia": "Approximate Moncevia conversion",
    "Moncevia · activar aquí": "Moncevia · enable here",
    "Permitir Moncevia en este dominio": "Allow Moncevia on this domain"
  };
  var EN_FRAGMENTS = [
    [/^Automatico · /, "Automatic · "],
    [/^Sin dato(s)? de /, "No $1 for "],
    [
      /^BTC\/ETH\/LTC: sin cotización reciente\. Actualiza para mostrar cantidades\.$/,
      "BTC/ETH/LTC: rates unavailable. Refresh to display amounts."
    ],
    [/^Recibe /, "Receives "],
    [/ · ([\d.,]+) USDT aprox\.$/, " · $1 USDT est."],
    [/^Importe al comercio: /, "Merchant receives: "],
    [/^Comisión de retiro: /, "Withdrawal fee: "],
    [/^Cantidad necesaria: /, "Amount required: "],
    [/^Compra Spot: /, "Spot purchase: "],
    [/^Fondeo CLP: /, "CLP funding: "],
    [/^Pendiente: /, "Missing: "],
    [/^Menor estimación entre métodos configurados: /, "Lowest configured estimate: "],
    [/^Sin consultas guardadas/, "No saved entries"],
    [/^Entonces /, "Then "],
    [/ · Ahora /, " · Now "],
    [/^Variación CLP /, "CLP change "],
    [/^Variación en unidades cripto: /, "Change in crypto units: "],
    [/^Comisión y red de retiro/i, "withdrawal fee and network"],
    [/^Comisión de compra Spot/i, "Spot buying fee"],
    [/^Costo de adquirir USDT/i, "USDT acquisition cost"],
    [/^Reti(ro|ra) /, "Withdraw "],
    [/^Divisas al día/, "Fiat rates current"],
    [/^Divisas sin actualizar/, "Fiat rates unavailable"],
    [/Cripto al día/g, "Crypto rates current"],
    [/Cripto pendiente/g, "Crypto rates unavailable"],
    [/cambio manual/g, "manual rate"],
    [/^FX sin datos recientes/, "FX data unavailable"],
    [/^Autom[aá]tico · /, "Automatic · "],
    [/^1 (BTC|ETH|LTC) ≈ /, "1 $1 ≈ "],
    [/cotización cripto caducada/g, "crypto rate expired"],
    [/cotización /g, "rate "],
    [/Solo referencia/g, "Reference only"],
    [/sin cripto reciente/g, "crypto rates unavailable"],
    [/· aprox\./g, "· est."],
    [/\(estimado\)/g, "(estimated)"],
    [/\(estimación\)/g, "(estimate)"],
    [/\(mínimo teórico incompleto\)/g, "(incomplete theoretical minimum)"],
    [/pendiente de verificar/g, "not verified"],
    [/sin costo de compra de USDT verificado/g, "USDT funding cost unverified"],
    [/comisión y red de retiro/g, "withdrawal fee and network"],
    [/comisión de compra Spot/g, "Spot buying fee"],
    [/costo de adquirir USDT/g, "USDT acquisition cost"],
    [
      /^Falta Binance Spot o USDT\/USD vigente, o el importe excede ocho decimales\.$/,
      "Current Binance Spot or USDT/USD rate is unavailable, or the amount exceeds eight decimals."
    ],
    [/ · sin cotización verificable$/, " · no verified rate"],
    [/ · sin tasa$/, " · rate unavailable"],
    [/^sin cotización /, "rate unavailable "],
    [/^no disponible$/, "unavailable"],
    [/^sin tasa$/, "rate unavailable"],
    [/^Sin cotización /, "No rate for "],
    [/^Compra Spot indicativa: /, "Indicative Spot purchase: "],
    [/Red: /g, "Network: "],
    [/^CLP del fondeo: /, "CLP funding: "],
    [/^Sin suficientes /, "Not enough "],
    [/^Tasas y fuentes$/, "Rates & sources"],
    [/^No hay consultas guardadas\.$/, "No saved entries."]
  ];
  function resolveLanguage(preference, browserLanguage) {
    return preference === "es" || preference === "en" ? preference : browserLanguage.toLowerCase().startsWith("es") ? "es" : "en";
  }
  function translateUI(raw, language) {
    const text = String(raw ?? "");
    if (language === "es") return text;
    const exact = EN[text];
    if (Object.prototype.hasOwnProperty.call(EN, text) && exact !== void 0) return exact;
    return EN_FRAGMENTS.reduce(
      (value, [pattern, translation]) => value.replace(pattern, translation),
      text
    );
  }

  // src/i18n/localizer.ts
  function createUILocalizer(options) {
    const textOrigins = /* @__PURE__ */ new WeakMap();
    const attributeOrigins = /* @__PURE__ */ new WeakMap();
    let observer = null;
    let frame = 0;
    let applying = false;
    function localize() {
      const root = options.root();
      if (!root || !root.isConnected) return;
      applying = true;
      try {
        const language = options.language();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let current;
        while (current = walker.nextNode()) {
          const node = current;
          if (node.parentElement?.closest("script,style")) continue;
          const before = textOrigins.get(node);
          const raw = before && before.translated === node.nodeValue ? before.raw : node.nodeValue || "";
          const translated = translateUI(raw, language);
          textOrigins.set(node, { raw, translated });
          if (node.nodeValue !== translated) node.nodeValue = translated;
        }
        for (const element of root.querySelectorAll("[placeholder],[aria-label],[title]")) {
          for (const attribute of ["placeholder", "aria-label", "title"]) {
            if (!element.hasAttribute(attribute)) continue;
            const saved = attributeOrigins.get(element) || {};
            const currentValue = element.getAttribute(attribute) || "";
            const previous = saved[attribute];
            const raw = previous && previous.translated === currentValue ? previous.raw : currentValue;
            const translated = translateUI(raw, language);
            saved[attribute] = { raw, translated };
            attributeOrigins.set(element, saved);
            if (currentValue !== translated) element.setAttribute(attribute, translated);
          }
        }
        const languageButton = options.languageButton();
        if (languageButton) {
          const label = language.toUpperCase();
          if (languageButton.textContent !== label) languageButton.textContent = label;
          const accessibleLabel = language === "es" ? "Cambiar a inglés" : "Switch to Spanish";
          if (languageButton.getAttribute("aria-label") !== accessibleLabel)
            languageButton.setAttribute("aria-label", accessibleLabel);
        }
        const languageSelect = options.languageSelect();
        if (languageSelect && languageSelect.value !== options.savedPreference()) {
          languageSelect.value = options.savedPreference();
        }
      } finally {
        applying = false;
      }
    }
    function watch() {
      stop();
      const root = options.root();
      if (!root) return;
      observer = new MutationObserver(() => {
        if (applying || frame !== 0) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (options.root()?.isConnected) localize();
        });
      });
      observer.observe(root, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["placeholder", "aria-label", "title"]
      });
      localize();
    }
    function stop() {
      observer?.disconnect();
      observer = null;
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
    }
    return { localize, watch, stop };
  }

  // src/detector/scan-controller.ts
  var isCandidateText = (text) => !!text && text.length <= 135 && /\d/.test(text) && /[€$£¥₿ΞŁA-Za-z]/.test(text);
  function createPriceScanner(options) {
    const { isActive, detectMoney, badgeText } = options;
    const maxNodes = Math.max(1, Math.min(5e3, options.scanLimit ?? 3500));
    const maxBadges = Math.max(1, Math.min(200, options.badgeLimit ?? 100));
    let timer;
    function skipText(textNode) {
      const parent = textNode.parentElement;
      if (!parent || !parent.isConnected || !isCandidateText(textNode.nodeValue)) return true;
      if (parent.closest(
        '#clplens-widget, .clplens-badge, [data-clplens-ignore], [contenteditable], [hidden], [aria-hidden="true"], form, [role="dialog"], [role="textbox"]'
      ))
        return true;
      if (parent.closest(
        "button, a, input, option, select, textarea, script, style, noscript, pre, code, svg, title"
      ))
        return true;
      if (parent === document.body || parent === document.documentElement) return true;
      const style = window.getComputedStyle(parent);
      return style.display === "none" || style.visibility === "hidden" || !parent.getClientRects().length;
    }
    function makeBadge(lines) {
      const badge = document.createElement("span");
      badge.className = "clplens-badge";
      badge.dataset.clplensBadge = "2";
      badge.setAttribute("aria-label", "Conversion aproximada de Moncevia");
      for (const line of lines) {
        const span = document.createElement("span");
        span.textContent = line;
        badge.append(span);
      }
      return badge;
    }
    function scan() {
      if (!isActive() || !document.body) return;
      let checked = 0;
      let badges = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let candidate;
      while ((candidate = walker.nextNode()) && checked++ < maxNodes && badges < maxBadges) {
        const textNode = candidate;
        if (skipText(textNode)) continue;
        const detected = detectMoney(textNode.nodeValue || "");
        const next = textNode.nextSibling;
        const existing = next instanceof Element && next.classList.contains("clplens-badge") && next.dataset.clplensBadge === "2" ? next : null;
        const lines = detected ? badgeText(detected) : null;
        if (!lines) {
          if (existing) existing.remove();
          continue;
        }
        if (existing) {
          const previous = [...existing.children].map((item) => item.textContent).join("\n");
          if (previous !== lines.join("\n")) {
            existing.replaceChildren(
              ...lines.map((line) => {
                const span = document.createElement("span");
                span.textContent = line;
                return span;
              })
            );
          }
        } else {
          textNode.parentNode?.insertBefore(makeBadge(lines), textNode.nextSibling);
        }
        badges++;
      }
    }
    function schedule(force = false) {
      if (force)
        document.querySelectorAll('.clplens-badge[data-clplens-badge="2"]').forEach((element) => element.remove());
      if (timer !== void 0) clearTimeout(timer);
      timer = setTimeout(
        () => {
          timer = void 0;
          scan();
        },
        force ? 70 : 550
      );
    }
    function isOwnMutation(change) {
      const target = change.target;
      if (target instanceof Element && target.closest("#clplens-widget,.clplens-badge")) return true;
      if (target.parentElement?.closest("#clplens-widget,.clplens-badge")) return true;
      if (change.type === "childList") {
        const changed = [...change.addedNodes, ...change.removedNodes];
        if (changed.length && changed.every(
          (item) => item instanceof Element && (item.matches("#clplens-widget,.clplens-badge") || !!item.closest("#clplens-widget,.clplens-badge"))
        ))
          return true;
      }
      return false;
    }
    function dispose() {
      if (timer !== void 0) clearTimeout(timer);
      timer = void 0;
    }
    return { scan, schedule, isOwnMutation, dispose };
  }

  // src/ui/tab-controller.ts
  var TAB_ORDER = [
    "calculator",
    "crypto",
    "compare",
    "history",
    "settings"
  ];
  function createTabController(options) {
    const { pages, buttons, panel, onActivate } = options;
    let current = "calculator";
    function activate(name) {
      if (!TAB_ORDER.includes(name)) return false;
      current = name;
      for (const key of TAB_ORDER) {
        pages[key].classList.toggle("clplens-hidden", key !== current);
        buttons[key].setAttribute("aria-selected", String(key === current));
        buttons[key].tabIndex = key === current ? 0 : -1;
      }
      onActivate(current);
      panel.scrollTop = 0;
      return true;
    }
    function onKeydown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.getAttribute("role") !== "tab") return;
      const index = TAB_ORDER.indexOf(current);
      const next = event.key === "ArrowRight" ? (index + 1) % TAB_ORDER.length : event.key === "ArrowLeft" ? (index - 1 + TAB_ORDER.length) % TAB_ORDER.length : event.key === "Home" ? 0 : event.key === "End" ? TAB_ORDER.length - 1 : -1;
      if (next < 0) return;
      const item = TAB_ORDER[next];
      if (!item) return;
      event.preventDefault();
      activate(item);
      buttons[item].focus();
    }
    return {
      activate,
      onKeydown,
      get current() {
        return current;
      }
    };
  }

  // src/ui/fab-controller.ts
  function fabBoundsForViewport(width, height, buttonWidth, buttonHeight) {
    const minX = 8;
    const minY = 12;
    return {
      minX,
      minY,
      maxX: Math.max(minX, width - buttonWidth - 8),
      maxY: Math.max(minY, height - buttonHeight - 16)
    };
  }
  function clampFab(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function normalizedFabPosition(left, top, bounds) {
    return {
      x: (clampFab(left, bounds.minX, bounds.maxX) - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX),
      y: (clampFab(top, bounds.minY, bounds.maxY) - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY)
    };
  }
  function createFabController(options) {
    let drag = null;
    let suppressClick = false;
    let resizeQueued = false;
    let installed = false;
    function bounds(button) {
      const rect = button.getBoundingClientRect();
      const width = window.innerWidth || document.documentElement.clientWidth || 375;
      const height = window.innerHeight || document.documentElement.clientHeight || 667;
      return fabBoundsForViewport(width, height, rect.width, rect.height);
    }
    function place(x, y) {
      const button = options.button();
      if (!button) return;
      const b = bounds(button);
      button.classList.add("mv-fab-moved");
      button.style.setProperty("--mv-fab-left", clampFab(x, b.minX, b.maxX) + "px");
      button.style.setProperty("--mv-fab-top", clampFab(y, b.minY, b.maxY) + "px");
    }
    function savePosition() {
      const button = options.button();
      if (!button) return;
      const b = bounds(button);
      const rect = button.getBoundingClientRect();
      options.onPosition(normalizedFabPosition(rect.left, rect.top, b));
      options.persist();
    }
    function restore() {
      const button = options.button();
      const position = options.position();
      if (!button || !position) return;
      const b = bounds(button);
      place(b.minX + position.x * (b.maxX - b.minX), b.minY + position.y * (b.maxY - b.minY));
    }
    function reset(save = true) {
      options.onPosition(null);
      const button = options.button();
      if (button) {
        button.classList.remove("mv-fab-moved", "mv-fab-dragging");
        button.style.removeProperty("--mv-fab-left");
        button.style.removeProperty("--mv-fab-top");
      }
      if (save) options.persist();
    }
    function enable() {
      const button = options.button();
      if (!button || installed) return;
      installed = true;
      button.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || event.pointerType === "mouse" && event.button !== 0) return;
        suppressClick = false;
        const rect = button.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          left: rect.left,
          top: rect.top,
          moved: false
        };
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
        }
      });
      button.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 8) return;
        drag.moved = true;
        button.classList.add("mv-fab-dragging");
        place(drag.left + dx, drag.top + dy);
        if (event.cancelable) event.preventDefault();
      });
      function finish(event, cancelled = false) {
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
        button?.classList.remove("mv-fab-dragging");
        drag = null;
      }
      button.addEventListener("pointerup", (event) => finish(event));
      button.addEventListener("pointercancel", (event) => finish(event, true));
      button.addEventListener(
        "click",
        (event) => {
          if (!suppressClick) return;
          suppressClick = false;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true
      );
      button.addEventListener("keydown", (event) => {
        const delta = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1]
        };
        const shift = delta[event.key];
        if (!shift || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const rect = button.getBoundingClientRect();
        const step = event.shiftKey ? 40 : 16;
        place(rect.left + shift[0] * step, rect.top + shift[1] * step);
        savePosition();
      });
      const onResize = () => {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(() => {
          resizeQueued = false;
          if (!drag) restore();
        });
      };
      window.addEventListener("resize", onResize, { passive: true });
      window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    }
    return { enable, restore, reset };
  }

  // src/ui/dom-factory.ts
  function createNode(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
  function createExternalLink(href, text) {
    const element = createNode("a", "", text);
    element.href = href;
    element.target = "_blank";
    element.rel = "noopener noreferrer";
    return element;
  }
  function appendLine(parent, text, className = "") {
    const paragraph = createNode("p", className, text);
    parent.append(paragraph);
    return paragraph;
  }
  function appendDisclosure(parent, title, expanded = false, extraClass = "") {
    const details = createNode("details", "mv-disclosure" + (extraClass ? " " + extraClass : ""));
    details.open = expanded;
    const summary = createNode("summary", "", title);
    const content = createNode("div", "mv-details-content");
    details.append(summary, content);
    parent.append(details);
    return { details, content };
  }
  function createCardRow(key, value, full = false) {
    const row = createNode("div", "mv-unit" + (full ? " mv-full" : ""));
    row.append(createNode("span", "", key), createNode("strong", "", value));
    return row;
  }
  function appendEmbeddedStyles(css) {
    const style = createNode("style");
    style.dataset.clplens = "2";
    style.textContent = css;
    document.head.append(style);
    return style;
  }

  // src/ui/panel-shell.ts
  function createPanelShell(options) {
    const widget = createNode("div");
    widget.id = "clplens-widget";
    const fab = createNode("button", "", "CLP · ₿");
    fab.type = "button";
    fab.id = "clplens-fab";
    fab.setAttribute("aria-label", "Abrir Moncevia");
    fab.setAttribute("aria-controls", "clplens-panel");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("title", "Arrastra para mover · toca para abrir");
    const panel = createNode("section");
    panel.id = "clplens-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Moncevia — conversión y pagos");
    const header = createNode("div", "mv-header");
    const titlebar = createNode("div", "mv-titlebar");
    titlebar.append(createNode("h2", "", "Moncevia"));
    const headerActions = createNode("div", "mv-header-actions");
    headerActions.style.cssText = "display:flex;align-items:center;gap:7px;";
    const languageButton = createNode("button", "mv-lang-toggle", "ES");
    languageButton.type = "button";
    languageButton.addEventListener("click", options.onLanguageToggle);
    headerActions.append(languageButton, createNode("span", "mv-version", "v" + options.version));
    titlebar.append(headerActions);
    header.append(titlebar);
    const status = createNode("div", "mv-status");
    status.append(createNode("span", "mv-dot"));
    const stateLabel = createNode("span", "", "Consultando tasas…");
    status.append(stateLabel);
    header.append(status);
    panel.append(header);
    const ratesInfo = appendDisclosure(header, "Tasas y fuentes", false);
    ratesInfo.details.classList.add("mv-rates-disclosure");
    const coinsLabel = appendLine(ratesInfo.content, "Consultando criptomonedas…", "clplens-strong");
    const sources = appendLine(ratesInfo.content, "Fuentes: ");
    sources.append(createExternalLink("https://www.exchangerate-api.com", "ExchangeRate-API"));
    sources.append(
      " · ",
      createExternalLink(
        "https://developers.binance.com/en/docs/binance-spot-api-docs/rest-api/market-data-endpoints",
        "Binance Spot"
      )
    );
    sources.append(" / ", createExternalLink("https://www.coingecko.com/en/api", "CoinGecko"));
    sources.append(" / ", createExternalLink("https://www.coinbase.com", "Coinbase"));
    return { widget, fab, panel, header, stateLabel, coinsLabel, languageButton };
  }

  // src/platform/page-lifecycle.ts
  function createPageLifecycle(options) {
    let started = false;
    let suspended = false;
    let scheduledFrame = null;
    let interval;
    const observer = new MutationObserver((changes) => {
      if (!started || suspended || changes.every(options.isOwnMutation) || scheduledFrame !== null)
        return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        if (started && !suspended) options.onMutation();
      });
    });
    function observe() {
      if (!options.root.isConnected) return;
      observer.observe(options.root, {
        childList: true,
        subtree: true,
        characterData: true,
        // Most storefront login dialogs open by toggling CSS classes or attributes
        // without adding nodes. Keep the sensitive-context guard in sync.
        attributes: true,
        attributeFilter: ["hidden", "style", "aria-hidden", "inert", "class", "open", "data-state"]
      });
    }
    function onScroll() {
      if (!suspended) options.onScroll();
    }
    function onRefresh() {
      if (!suspended) options.onRefresh();
    }
    function suspend() {
      if (!started || suspended) return;
      suspended = true;
      observer.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
      scheduledFrame = null;
      options.onSuspend();
    }
    function onPageShow() {
      if (!started) return;
      if (suspended) {
        suspended = false;
        observe();
        options.onResume();
      }
      options.onRefresh();
    }
    function start() {
      if (started) return;
      started = true;
      suspended = false;
      observe();
      document.addEventListener("click", options.onClick, true);
      document.addEventListener("change", options.onChange, true);
      document.addEventListener("keydown", options.onKeydown, true);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pageshow", onPageShow);
      window.addEventListener("pagehide", suspend);
      window.addEventListener("popstate", onRefresh);
      window.addEventListener("hashchange", onRefresh);
      document.addEventListener("visibilitychange", onRefresh);
      interval = setInterval(onRefresh, options.refreshIntervalMs ?? 10 * 6e4);
    }
    function stop() {
      if (!started) return;
      suspend();
      document.removeEventListener("click", options.onClick, true);
      document.removeEventListener("change", options.onChange, true);
      document.removeEventListener("keydown", options.onKeydown, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", suspend);
      window.removeEventListener("popstate", onRefresh);
      window.removeEventListener("hashchange", onRefresh);
      document.removeEventListener("visibilitychange", onRefresh);
      if (interval !== void 0) clearInterval(interval);
      interval = void 0;
      started = false;
    }
    return {
      start,
      stop,
      get active() {
        return started && !suspended;
      }
    };
  }

  // src/platform/gm-bridge.ts
  function createGMBridge({ modern = null, legacy = null }) {
    const modernGet = typeof modern?.getValue === "function";
    const modernSet = typeof modern?.setValue === "function";
    const modernRequest = typeof modern?.xmlHttpRequest === "function";
    const legacyGet = typeof legacy?.getValue === "function";
    const legacySet = typeof legacy?.setValue === "function";
    const legacyRequest = typeof legacy?.xmlHttpRequest === "function";
    if (!(modernGet || legacyGet) || !(modernSet || legacySet) || !(modernRequest || legacyRequest))
      return null;
    return {
      async getValue(key, fallback) {
        const value = modernGet ? await modern.getValue(key, fallback) : await legacy.getValue(key, fallback);
        return value;
      },
      async setValue(key, value) {
        return modernSet ? modern.setValue(key, value) : legacy.setValue(key, value);
      },
      xmlHttpRequest(options) {
        return new Promise((resolve, reject) => {
          let completed = false;
          const finish = (ok, value) => {
            if (completed) return;
            completed = true;
            clearTimeout(timer);
            if (ok) resolve(value);
            else reject(value);
          };
          const wrapped = {
            ...options,
            onload: (data) => finish(true, data),
            onerror: (error) => finish(false, error || new Error("Network request failed")),
            ontimeout: () => finish(false, new Error("Network request timed out")),
            onabort: () => finish(false, new Error("Network request cancelled"))
          };
          const timer = setTimeout(
            () => finish(false, new Error("Network request timed out")),
            options.timeout && options.timeout > 0 ? options.timeout : 3e4
          );
          try {
            const result = modernRequest ? modern.xmlHttpRequest(wrapped) : legacy.xmlHttpRequest(wrapped);
            if (result && typeof result.then === "function") {
              result.then(
                (data) => finish(true, data),
                (error) => finish(false, error)
              );
            }
          } catch (error) {
            finish(false, error);
          }
        });
      }
    };
  }

  // src/core/cache-validation.ts
  var record2 = (input) => typeof input === "object" && input !== null && !Array.isArray(input);
  var positiveNumber = (input) => {
    const value = typeof input === "number" || typeof input === "string" ? Number(input) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  function readCachedFX(input) {
    if (!record2(input) || !Number.isFinite(input.fetchedAt) || !record2(input.rates)) return null;
    const rates = {};
    for (const code of [...FIAT_CODES, "CLP"]) {
      const value = positiveNumber(input.rates[code]);
      if (value !== null) rates[code] = value;
    }
    if (!rates.CLP || !rates.EUR) return null;
    const updatedAt = typeof input.updatedAt === "string" ? input.updatedAt.slice(0, 80) : void 0;
    return updatedAt === void 0 ? { fetchedAt: input.fetchedAt, rates } : { fetchedAt: input.fetchedAt, rates, updatedAt };
  }
  function readCachedCrypto(input) {
    if (!record2(input) || !Number.isFinite(input.fetchedAt) || !record2(input.usd)) return null;
    const usd = {};
    for (const code of CRYPTO_LIST) {
      const value = positiveNumber(input.usd[code]);
      if (value === null) return null;
      usd[code] = value;
    }
    const source = typeof input.source === "string" ? input.source.slice(0, 100) : void 0;
    const parity = positiveNumber(input.usdtUsd);
    if (source?.startsWith("Binance") && parity === null) return null;
    const askUSDT = {};
    const bidUSDT = {};
    for (const code of CRYPTO_LIST) {
      const ask = record2(input.askUSDT) ? positiveNumber(input.askUSDT[code]) : null;
      const bid = record2(input.bidUSDT) ? positiveNumber(input.bidUSDT[code]) : null;
      if (ask !== null) askUSDT[code] = ask;
      if (bid !== null) bidUSDT[code] = bid;
    }
    const quotedAt = typeof input.quotedAt === "number" && Number.isFinite(input.quotedAt) ? input.quotedAt : void 0;
    return {
      fetchedAt: input.fetchedAt,
      usd,
      ...source === void 0 ? {} : { source },
      ...quotedAt === void 0 ? {} : { quotedAt },
      ...parity === null ? {} : { usdtUsd: parity },
      ...Object.keys(askUSDT).length ? { askUSDT } : {},
      ...Object.keys(bidUSDT).length ? { bidUSDT } : {}
    };
  }

  // src/core/settings-validation.ts
  var rec = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  var hostRE = /^[a-z0-9.-]{1,255}$/;
  var boolKeys = [
    "enabled",
    "historySite",
    "compareInline",
    "showCryptoInline",
    "autoSyncSelection",
    "feeKnownBTC",
    "feeKnownETH",
    "feeKnownLTC",
    "spotFeeKnown",
    "usdtFundKnown",
    "compactMode",
    "visualPick",
    "prexKnown",
    "santanderKnown",
    "exactPayEnabled"
  ];
  var numberKeys = [
    "usdClpManual",
    "eurClpManual",
    "prexExtra",
    "santanderExtra",
    "taxExtra",
    "feeBTC",
    "feeETH",
    "feeLTC",
    "spotFeePct",
    "usdtFundPct",
    "bufferPct"
  ];
  var dollarCodes = ["USD", "CLP", "CAD", "AUD"];
  var currencies = ["CLP", ...FIAT_CODES, ...CRYPTO_LIST];
  function hosts(input) {
    if (!Array.isArray(input)) return [];
    return [
      ...new Set(
        input.filter((host) => typeof host === "string" && hostRE.test(host))
      )
    ].slice(0, 100);
  }
  function safeNumber(input, fallback) {
    if (typeof input !== "number" && typeof input !== "string" || String(input).trim() === "")
      return fallback;
    const n = Number(input);
    return Number.isFinite(n) && n >= 0 && n <= 1e10 ? n : fallback;
  }
  function safeText(input, fallback, max = 80) {
    return typeof input === "string" && input.length <= max ? input : fallback;
  }
  function normalizeSettings(input, defaults) {
    if (!rec(input))
      return {
        ...defaults,
        allowedSites: [...defaults.allowedSites],
        disabledSites: [...defaults.disabledSites],
        bareDollarSites: [...defaults.bareDollarSites],
        dollarCurrencySites: { ...defaults.dollarCurrencySites },
        fabPosition: defaults.fabPosition && { ...defaults.fabPosition }
      };
    const result = {
      ...defaults,
      allowedSites: [...defaults.allowedSites],
      disabledSites: [...defaults.disabledSites],
      bareDollarSites: [...defaults.bareDollarSites],
      dollarCurrencySites: { ...defaults.dollarCurrencySites }
    };
    for (const key of boolKeys) if (typeof input[key] === "boolean") result[key] = input[key];
    for (const key of numberKeys) result[key] = safeNumber(input[key], defaults[key]);
    for (const key of ["allowedSites", "disabledSites", "bareDollarSites"]) {
      if (Object.prototype.hasOwnProperty.call(input, key)) result[key] = hosts(input[key]);
    }
    if (Object.prototype.hasOwnProperty.call(input, "dollarCurrencySites")) {
      const overrides = /* @__PURE__ */ Object.create(null);
      if (rec(input.dollarCurrencySites)) {
        for (const [host, code] of Object.entries(input.dollarCurrencySites).slice(0, 200)) {
          if (hostRE.test(host) && typeof code === "string" && dollarCodes.includes(code)) {
            overrides[host] = code;
          }
          if (Object.keys(overrides).length >= 100) break;
        }
      }
      result.dollarCurrencySites = overrides;
    }
    const source = input.calcCurrency;
    if (typeof source === "string" && currencies.includes(source))
      result.calcCurrency = source;
    const target = input.targetCurrency;
    if (typeof target === "string" && currencies.includes(target))
      result.targetCurrency = target;
    if (result.calcCurrency === result.targetCurrency) {
      result.targetCurrency = result.calcCurrency === "CLP" ? "USD" : "CLP";
    }
    if (input.language === "auto" || input.language === "es" || input.language === "en")
      result.language = input.language;
    if (typeof input.exactPayCurrency === "string" && CRYPTO_LIST.some((code) => code === input.exactPayCurrency)) {
      result.exactPayCurrency = input.exactPayCurrency;
    }
    result.calcAmount = safeText(input.calcAmount, defaults.calcAmount, 80);
    result.exactPayAmount = safeText(input.exactPayAmount, defaults.exactPayAmount, 80);
    for (const key of ["networkBTC", "networkETH", "networkLTC"]) {
      result[key] = safeText(input[key], defaults[key], 80);
    }
    if (input.fabPosition === null) result.fabPosition = null;
    else if (rec(input.fabPosition)) {
      const { x, y } = input.fabPosition;
      result.fabPosition = typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
    }
    return result;
  }

  // src/platform/persistence-controller.ts
  var MONCEVIA_STORAGE_KEYS = {
    settings: "clplens_v1",
    fx: "clplens_usd_rates_v1",
    crypto: "clplens_crypto_rates_v2",
    history: "clplens_history_v3"
  };
  function record3(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function isPositive2(value) {
    if (typeof value !== "number" && typeof value !== "string") return false;
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
  }
  function readStoredHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 30).filter(
      (entry) => record3(entry) && typeof entry.at === "number" && Number.isFinite(entry.at) && typeof entry.code === "string" && isPositive2(entry.amount) && isPositive2(entry.clp)
    );
  }
  function snapshot(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function createPersistenceController({
    storage,
    defaults,
    onError = () => {
    }
  }) {
    let settingsQueue = Promise.resolve();
    let historyQueue = Promise.resolve();
    async function read(key, fallback) {
      try {
        return await storage.getValue(key, fallback);
      } catch (error) {
        onError(key, error);
        if (key === MONCEVIA_STORAGE_KEYS.settings) throw error;
        return fallback;
      }
    }
    function enqueue(key, value, queue) {
      let copied;
      try {
        copied = snapshot(value);
      } catch (error) {
        onError(key, error);
        return Promise.resolve(false);
      }
      const previous = queue === "settings" ? settingsQueue : historyQueue;
      const result = previous.then(() => storage.setValue(key, copied)).then((saved) => {
        if (saved === false) throw new Error("The storage manager rejected the write");
        return true;
      }).catch((error) => {
        onError(key, error);
        return false;
      });
      const complete = result.then(() => void 0);
      if (queue === "settings") settingsQueue = complete;
      else historyQueue = complete;
      return result;
    }
    return {
      async load() {
        const previous = await read(MONCEVIA_STORAGE_KEYS.settings, null);
        const settings = normalizeSettings(previous, defaults);
        const cachedFX = await read(MONCEVIA_STORAGE_KEYS.fx, null);
        const rawHistory = await read(MONCEVIA_STORAGE_KEYS.history, []);
        const cachedCrypto = await read(MONCEVIA_STORAGE_KEYS.crypto, null);
        return {
          settings,
          fx: readCachedFX(cachedFX),
          history: readStoredHistory(rawHistory),
          crypto: readCachedCrypto(cachedCrypto)
        };
      },
      saveSettings(settings) {
        return enqueue(MONCEVIA_STORAGE_KEYS.settings, settings, "settings");
      },
      saveHistory(history) {
        return enqueue(MONCEVIA_STORAGE_KEYS.history, history, "history");
      }
    };
  }

  // src/detector/variant-detector.ts
  var isElement = (value) => typeof Element !== "undefined" && value instanceof Element;
  var forbiddenAction = /^(?:purchase|buy|checkout|cart|add to cart|help|faq|login|search|pay|submit|comprar|pagar|ayuda)\b/i;
  var variantWords = /\b(?:days?|weeks?|months?|years?|lifetime|license|licen[cs]e|tier|plan|size|color|colour|medium|large|small|basic|standard|premium)\b/i;
  function createVariantDetector(options) {
    const { parseAmount: parseAmount2, prefixCurrency, prefixRE, suffixRE, figure, cryptoCodes } = options;
    const dollarRE = new RegExp("(?<![\\p{L}\\d])\\$\\s*(" + figure + ")(?![\\p{L}\\d])", "gu");
    function originalText(element) {
      if (!element || (element.textContent || "").length > 1600) return "";
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const parts = [];
      let count = 0;
      let current;
      while ((current = walker.nextNode()) && count++ < 120) {
        const text = current;
        if (text.parentElement?.closest('#clplens-widget,.clplens-badge,[hidden],[aria-hidden="true"]'))
          continue;
        const content = (text.nodeValue || "").trim();
        if (content) parts.push(content);
      }
      return parts.join("\n").slice(0, 650);
    }
    function matchesInText(rawText) {
      const text = String(rawText || "").replace(/[\u00a0\u202f]/g, " ").slice(0, 650);
      const out = [];
      for (const [rx, isSuffix] of [
        [prefixRE, false],
        [suffixRE, true]
      ]) {
        rx.lastIndex = 0;
        let found;
        while (found = rx.exec(text)) {
          if (found[0].includes("\n")) continue;
          const rawAmount = found[1];
          if (!rawAmount) continue;
          const currency = isSuffix ? (found[2] || "").toUpperCase() : prefixCurrency(found[0].slice(0, found[0].indexOf(rawAmount)).trim());
          if (!currency) continue;
          const amount = parseAmount2(rawAmount, currency);
          if (!Number.isFinite(amount) || amount < (cryptoCodes.includes(currency) ? 1e-8 : 0.01))
            continue;
          const before = text.slice(Math.max(0, found.index - 18), found.index).toLowerCase();
          const after = text.slice(found.index + found[0].length, found.index + found[0].length + 30).toLowerCase();
          const perUnit = /^\s*(?:per\s*(?:day|week|month|unit)|\/\s*(?:day|week|month)|por\s*(?:d[ií]a|semana|mes|unidad))\b/.test(
            after
          );
          const former = /(?:antes|original|was|regular|list price)\s*:?\s*$/.test(before);
          out.push({ amount, code: currency, perUnit, former, index: found.index });
        }
      }
      return out.sort((a, b) => a.index - b.index);
    }
    function bestVisiblePrice(element) {
      if (!element || !element.isConnected) return null;
      if (element.closest("#clplens-widget, .clplens-badge, [data-clplens-ignore]")) return null;
      const raw = originalText(element);
      if (!raw || raw.length > 650) return null;
      const matches = matchesInText(raw);
      if (!matches.length || matches.length > 6 || matches.every((m) => m.perUnit || m.former))
        return null;
      const score = (match) => (match.perUnit ? -100 : 0) + (match.former ? -60 : 0) + (cryptoCodes.includes(match.code) ? -5 : 0);
      const chosen = [...matches].sort((a, b) => score(b) - score(a) || b.index - a.index)[0];
      return chosen ? { amount: chosen.amount, code: chosen.code } : null;
    }
    function selectionLabel(raw) {
      const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      const at = lines.findIndex(
        (line) => /^selected\s+(?:access|option|plan|duration|item|product)\b/i.test(line) || /^opci[oó]n\s+seleccionada\b/i.test(line)
      );
      if (at >= 0) {
        const next = lines.slice(at + 1).find((line) => !matchesInText(line).length && line.length < 65);
        return next || "Opcion seleccionada";
      }
      return "Precio seleccionado";
    }
    function selectedSummaryPrice() {
      if (!document.body) return null;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let text;
      let scanned = 0;
      while ((text = walker.nextNode()) && scanned++ < 12e3) {
        if (!/^\s*(?:selected\s+(?:access|option|plan|duration|item|product)|opci[oó]n\s+seleccionada)\s*:?\s*$/i.test(
          text.nodeValue || ""
        ))
          continue;
        let element = text.parentElement;
        for (let depth = 0; element && depth < 6; depth++, element = element.parentElement) {
          if (element.closest("#clplens-widget, .clplens-badge")) break;
          const content = originalText(element);
          if (content.length > 420) break;
          const price = bestVisiblePrice(element);
          if (price) return { ...price, label: selectionLabel(content), source: "resumen" };
        }
      }
      return null;
    }
    function productHeroPrice() {
      const headings = [
        ...document.querySelectorAll('main h1,article h1,[itemtype*="Product"] h1')
      ].filter((element) => element.isConnected && element.getClientRects().length);
      if (headings.length !== 1) return null;
      let root = headings[0]?.parentElement ?? null;
      for (let depth = 0; root && root !== document.body && depth < 5; depth++, root = root.parentElement) {
        if (!root.querySelector('[class*="variant"],[id*="variant"],[role="option"],[data-variant]'))
          continue;
        const raw = originalText(root);
        if (!raw) continue;
        const lines = raw.split("\n").map((line) => line.trim());
        const at = lines.findIndex(
          (line) => /^(?:variant|variants|option|options|choose variant|select variant)$/i.test(line)
        );
        if (at < 1) continue;
        const unique = new Map(
          matchesInText(lines.slice(0, at).join("\n")).filter((match) => !match.former && !match.perUnit).map((match) => [match.code + ":" + match.amount, match])
        );
        if (unique.size !== 1) continue;
        const price = [...unique.values()][0];
        return price ? {
          amount: price.amount,
          code: price.code,
          label: "Precio actual del producto",
          source: "precio principal"
        } : null;
      }
      return null;
    }
    function currentProductPrice() {
      const selectors = [
        '[data-testid="product-price"]',
        '[data-testid="current-price"]',
        "[data-price-current]",
        '[data-price-role="current"]',
        ".product__price",
        ".product-price",
        ".price--current",
        '[itemprop="price"]'
      ];
      const results = /* @__PURE__ */ new Map();
      let scanned = 0;
      for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
          if (++scanned > 90) break;
          if (!element.isConnected || element.closest(
            '#clplens-widget,.clplens-badge,[hidden],[aria-hidden="true"],del,s,strike,.price--old,.price--compare,.compare-at-price,[class*="variant"],[id*="variant"],[role="option"],[role="listbox"],form[action*="checkout"]'
          ))
            continue;
          if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden")
            continue;
          const live = element.querySelector(".price--current,ins,[data-price-current]") || element;
          const chosen = bestVisiblePrice(live);
          if (!chosen) continue;
          const key = chosen.code + ":" + chosen.amount;
          results.set(key, {
            ...chosen,
            label: "Precio actual del producto",
            source: "precio principal"
          });
        }
        if (scanned > 90) break;
      }
      if (results.size === 1) return [...results.values()][0] || null;
      if (results.size > 1) return null;
      return productHeroPrice();
    }
    function sameMonetaryPrice(a, b) {
      return !!a && !!b && a.code === b.code && Math.abs(a.amount - b.amount) < 1e-8;
    }
    function variantControl(target) {
      if (!isElement(target) || target.closest(
        '#clplens-widget,#moncevia-dollar-dialog,.clplens-badge,input,textarea,[contenteditable],a[href*="checkout"],form[action*="checkout"]'
      ))
        return null;
      const control = target.closest(
        '[data-variant],[data-product-option],[role="option"],[role="radio"],[aria-pressed],[aria-selected],[data-option-value],[class*="variant-card"],[class*="variant-option"],[class*="option-card"],button,label'
      );
      if (!control || control.matches('[disabled],[aria-disabled="true"]') || control.closest('header,nav,footer,[role="navigation"]'))
        return null;
      const name = (originalText(control) || control.getAttribute("aria-label") || "").trim();
      if (forbiddenAction.test(name)) return null;
      const hint = control.closest(
        '[data-variant],[data-product-option],[class*="variant"],[id*="variant"],[class*="product-option"],[role="listbox"]'
      );
      return hint || (variantWords.test(name) ? control : null);
    }
    function unlabeledDollarPrice(target) {
      if (options.dollarCurrencyForSite() || !isElement(target) || target.closest(
        "#clplens-widget, #moncevia-dollar-dialog, .clplens-badge, input, textarea, select, [contenteditable]"
      ))
        return null;
      if (target.closest("a,button,form") && !variantControl(target)) return null;
      let element = target;
      for (let depth = 0; element && depth < 7 && element !== document.body; depth++, element = element.parentElement) {
        const raw = originalText(element);
        if (!raw || raw.length > 520) continue;
        const matches = [...raw.matchAll(dollarRE)].filter(
          (match) => !!match[1] && Number.isFinite(parseAmount2(match[1], "USD"))
        );
        if (matches.length !== 1 || matchesInText(raw).length) continue;
        const priceText = matches[0]?.[1];
        if (!priceText) continue;
        const amount = parseAmount2(priceText, "USD");
        const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
        const label = lines.find(
          (line) => /\b(?:days?|weeks?|months?|lifetime|annual|year|plan|tier|license)\b/i.test(line) && !line.includes("$")
        );
        return {
          amount,
          code: null,
          label: label || "Precio seleccionado",
          source: "precio estático"
        };
      }
      return null;
    }
    function tappedPrice(target) {
      if (!isElement(target) || target.closest(
        "#clplens-widget,.clplens-badge,[data-clplens-ignore],input,textarea,select,[contenteditable],form"
      ))
        return null;
      const control = variantControl(target);
      const actionable = target.closest('button,a,[role="button"]');
      const actionLabel = actionable ? originalText(actionable).trim() : "";
      if (actionable && forbiddenAction.test(actionLabel)) return null;
      const boundedCard = actionable && !control ? actionable.closest(
        'article,li,[data-product-id],[class*="product-card"],[class*="item-card"]'
      ) : null;
      if (actionable && !control && !boundedCard && !matchesInText(originalText(actionable)).length)
        return null;
      let element = target;
      for (let depth = 0; element && depth < 8; depth++, element = element.parentElement) {
        if (element === document.body) break;
        if (boundedCard && !boundedCard.contains(element)) break;
        if (control && element !== control && element.contains(control)) {
          const otherOptions = element.querySelectorAll(
            '[data-variant],[role="option"],[role="radio"]'
          );
          if (otherOptions.length > 1 || element !== control.parentElement && !/\b(?:variant|option|tier|plan|card)\b/i.test(String(element.className)))
            continue;
        }
        const matches = matchesInText(originalText(element)).filter(
          (match) => !match.perUnit && !match.former
        );
        const distinct = new Set(matches.map((match) => match.code + ":" + match.amount));
        if (distinct.size > 1 && !control) continue;
        const price = bestVisiblePrice(element);
        if (price) {
          const parts = originalText(element).split(/\n/).map((line) => line.trim()).filter(Boolean);
          const label = parts.find(
            (line) => /\b(?:key|plan|days?|weeks?|months?|lifetime|access)\b/i.test(line) && !matchesInText(line).length
          );
          return { ...price, label: label || "Precio tocado", source: "toque" };
        }
      }
      return null;
    }
    return {
      originalText,
      matchesInText,
      bestVisiblePrice,
      selectedSummaryPrice,
      currentProductPrice,
      sameMonetaryPrice,
      variantControl,
      unlabeledDollarPrice,
      tappedPrice
    };
  }

  // src/detector/selection-scheduler.ts
  function createSelectionScheduler({ run, allowed }) {
    let debounceTimer;
    const retries = /* @__PURE__ */ new Set();
    function execute() {
      if (allowed()) run();
    }
    function debounce(delay = 160) {
      if (!allowed()) return;
      if (debounceTimer !== void 0) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(
        () => {
          debounceTimer = void 0;
          execute();
        },
        Math.max(0, delay)
      );
    }
    function replaceRetries(delays) {
      for (const timer of retries) clearTimeout(timer);
      retries.clear();
      if (!allowed()) return;
      for (const delay of new Set(delays)) {
        if (!Number.isFinite(delay) || delay < 0 || delay > 1e4) continue;
        const timer = setTimeout(() => {
          retries.delete(timer);
          execute();
        }, delay);
        retries.add(timer);
      }
    }
    function cancel() {
      if (debounceTimer !== void 0) clearTimeout(debounceTimer);
      debounceTimer = void 0;
      for (const timer of retries) clearTimeout(timer);
      retries.clear();
    }
    return { debounce, replaceRetries, cancel };
  }

  // src/legacy/runtime.js
  (() => {
    "use strict";
    const storage = createGMBridge({
      modern: typeof GM !== "undefined" && GM !== null ? GM : null,
      legacy: {
        getValue: typeof GM_getValue === "function" ? GM_getValue : void 0,
        setValue: typeof GM_setValue === "function" ? GM_setValue : void 0,
        xmlHttpRequest: typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : void 0
      }
    });
    if (window.top !== window.self || !storage) return;
    function initializeAfterBody() {
      if (!document.body) return;
      const HOST = location.hostname.toLowerCase();
      const matchHost = (base) => HOST === base || HOST.endsWith("." + base);
      const restricted = [
        "prexcard.com",
        "prexcard.cl",
        "santander.cl",
        "bancoestado.cl",
        "bancochile.cl",
        "bci.cl",
        "scotiabank.cl",
        "itau.cl",
        "bancofalabella.cl",
        "paypal.com",
        "stripe.com",
        "wise.com",
        "revolut.com",
        "binance.com",
        "coinbase.com",
        "kraken.com",
        "crypto.com",
        "mercadopago.cl",
        "mercadopago.com",
        "webpay.cl",
        "transbank.cl",
        "appleid.apple.com",
        "accounts.google.com",
        "login.microsoftonline.com",
        "machbank.cl",
        "tenpo.cl",
        "coopeuch.cl",
        "consorcio.cl",
        "security.cl",
        "bice.cl",
        "hsbc.cl",
        "bancoripley.cl",
        "tapp.cl",
        "servipag.com",
        "servipag.cl",
        "khipu.com",
        "khipu.cl",
        "flow.cl",
        "fintual.cl",
        "buda.com",
        "orionx.com",
        "cryptomkt.com"
      ];
      const isProtectedRoute = () => /\/(login|sign[/-]?in|sign[/-]?up|checkout|payment|pay|billing|banking|wallet|transfer|auth|account|cart|pago[s]?|pagar|carrito|cuenta|sesion|iniciar-sesion|autenticacion|transferencia[s]?|billetera|facturacion)(?:[/?#-]|$)/i.test(location.pathname);
      if (restricted.some(matchHost) || HOST.endsWith(".cl") && /(?:bank|banco|banking|santander|prex|webpay|transbank|mercadopago)/i.test(HOST) || /(?:^|[.-])(bank|banco|banking|santander|prex|binance|paypal|coinbase|mercadopago|webpay|transbank)(?:[.-]|$)/.test(HOST) || isProtectedRoute()) return;
      const hasVisiblePasswordInput = () => [...document.querySelectorAll('input[type="password"]')].some((input) => {
        if (!input.isConnected || !input.getClientRects().length) return false;
        const style = getComputedStyle(input);
        return style.visibility !== "hidden" && style.visibility !== "collapse" && style.display !== "none";
      });
      const isSensitiveContext = () => isProtectedRoute() || hasVisiblePasswordInput();
      const hasStartupUI = () => !!(document.getElementById("clplens-widget") || document.getElementById("moncevia-optin") || document.getElementById("moncevia-startup-error"));
      if (hasStartupUI() || isSensitiveContext()) return;
      const FX_KEY = MONCEVIA_STORAGE_KEYS.fx;
      const CRYPTO_KEY = MONCEVIA_STORAGE_KEYS.crypto;
      const FX_TTL = 12 * 36e5;
      const FX_STALE = 3 * 864e5;
      const CRYPTO_TTL = 5 * 6e4;
      const CRYPTO_STALE = 45 * 6e4;
      const SCAN_LIMIT = 3500, BADGE_LIMIT = 100;
      const FIAT = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "KRW", "BRL", "CNY"];
      const CRYPTOS = ["BTC", "ETH", "LTC"];
      const DEFAULTS = {
        enabled: true,
        disabledSites: [],
        bareDollarSites: [],
        dollarCurrencySites: {},
        allowedSites: ["shop.riftbot.org"],
        historySite: false,
        compareInline: false,
        usdClpManual: 0,
        eurClpManual: 0,
        prexExtra: 0,
        santanderExtra: 0,
        taxExtra: 0,
        showCryptoInline: true,
        autoSyncSelection: true,
        feeBTC: 0,
        feeETH: 0,
        feeLTC: 0,
        feeKnownBTC: false,
        feeKnownETH: false,
        feeKnownLTC: false,
        networkBTC: "Bitcoin",
        networkETH: "Ethereum",
        networkLTC: "Litecoin",
        spotFeePct: 0,
        spotFeeKnown: false,
        usdtFundPct: 0,
        usdtFundKnown: false,
        bufferPct: 0,
        compactMode: false,
        visualPick: true,
        prexKnown: false,
        santanderKnown: false,
        exactPayEnabled: false,
        exactPayAmount: "",
        exactPayCurrency: "LTC",
        calcAmount: "24.99",
        calcCurrency: "EUR",
        targetCurrency: "CLP",
        language: "auto",
        fabPosition: null
      };
      let settings = { ...DEFAULTS }, fx = null, crypto = null;
      let widget, fab, panel, stateLabel, sampleLabel, coinsLabel, calcOutput, calcInput, calcSelect, targetSelect, calcSource;
      let compactCard, compareOutput, transferOutput, historyOutput, history = [], pickBtn, exactAmountInput, exactCurrencySelect, exactToggle;
      let pickerActive = false, flashTarget = null, flashTimer = null, pendingTab = "calculator";
      let tab = "calculator";
      let panelOpenTicket = 0;
      let settingsBankGroup = null;
      const verifyBoxes = /* @__PURE__ */ Object.create(null);
      let fxRequest = null, cryptoRequest = null;
      let manualOverride = false, pendingSelection = null, pendingVariantChange = null, currentSelection = null;
      let lastAppliedSelection = "", clickSequence = 0;
      let languageButton = null, languageSelect = null;
      const uiLanguage = () => resolveLanguage(
        settings.language,
        navigator.languages?.[0] || navigator.language || "en"
      );
      const uiLocalizer = createUILocalizer({
        root: () => widget || null,
        language: uiLanguage,
        languageButton: () => languageButton,
        languageSelect: () => languageSelect,
        savedPreference: () => settings.language
      });
      const tr = (raw) => translateUI(raw, uiLanguage());
      const localizeUI = () => uiLocalizer.localize();
      function switchLanguage(next) {
        settings.language = ["auto", "es", "en"].includes(next) ? next : "auto";
        persist();
        localizeUI();
        refresh();
        localizeUI();
      }
      function watchLocalization() {
        uiLocalizer.watch();
      }
      const formatCLP = (v) => Number.isFinite(v) ? new Intl.NumberFormat(uiLanguage() === "en" ? "en-US" : "es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(v)) : "—";
      const formatDecimal = (v, digits = 2) => new Intl.NumberFormat(uiLanguage() === "en" ? "en-US" : "es-CL", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v);
      const SUPPORTED_CURRENCIES = ["CLP", ...FIAT, ...CRYPTOS];
      const targetFallback = (source) => source === "CLP" ? "USD" : "CLP";
      const formatConversion = (amount, code) => {
        if (!Number.isFinite(amount)) return "—";
        if (code === "CLP") return formatCLP(amount);
        if (CRYPTOS.includes(code)) return `${code} ${formatCoin(amount, code)}`;
        const digits = code === "JPY" || code === "KRW" ? 0 : 2;
        return `${code} ${new Intl.NumberFormat(uiLanguage() === "en" ? "en-US" : "es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount)}`;
      };
      const percent = (v) => Math.max(0, Math.min(30, Number(v) || 0));
      const validPositive = (n) => Number.isFinite(Number(n)) && Number(n) > 0;
      const isAuthorized = () => settings.allowedSites.includes(HOST);
      const isActive = () => isAuthorized() && settings.enabled && !settings.disabledSites.includes(HOST) && !isSensitiveContext();
      const inDate2 = (obj, time) => obj && Number.isFinite(obj.fetchedAt) && Date.now() - obj.fetchedAt >= 0 && Date.now() - obj.fetchedAt < time;
      const conversion = () => createConversionEngine({ settings, fx, crypto, now: Date.now() });
      const activeCrypto = () => conversion().activeCrypto();
      const activeFX = () => conversion().activeFX();
      const figure = String.raw`(?:\d{1,3}(?:[.,\s\u00a0\u202f]\d{3})+(?:[.,]\d{1,8})?|\d+(?:[.,]\d{1,8})?)`;
      const prefixRE = new RegExp(String.raw`(?<![\p{L}\d])(?:US\$|U\$S|USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC|R\$|€|£|¥|₿|Ξ|Ł|\$)\s*(${figure})(?![\p{L}\d])`, "giu");
      const suffixRE = new RegExp(String.raw`(?<![\p{L}\d])(${figure})\s*(USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC)(?![\p{L}\d])`, "giu");
      function dollarCurrencyForSite() {
        const choice = settings.dollarCurrencySites?.[HOST];
        return ["USD", "CLP", "CAD", "AUD"].includes(choice) ? choice : settings.bareDollarSites.includes(HOST) ? "USD" : null;
      }
      function prefixCurrency(prefix) {
        const s = prefix.toUpperCase();
        if (s === "€") return "EUR";
        if (s === "£") return "GBP";
        if (s === "₿") return "BTC";
        if (s === "Ξ") return "ETH";
        if (s === "Ł") return "LTC";
        if (s === "¥") return HOST.endsWith(".jp") ? "JPY" : HOST.endsWith(".cn") ? "CNY" : null;
        if (s === "R$") return "BRL";
        if (s === "$") return dollarCurrencyForSite();
        if (s === "US$" || s === "U$S") return "USD";
        return FIAT.includes(s) || CRYPTOS.includes(s) ? s : null;
      }
      function detectMoney(text) {
        if (!text || text.length > 135) return null;
        for (const [rx, suffix] of [[prefixRE, false], [suffixRE, true]]) {
          rx.lastIndex = 0;
          let found;
          while (found = rx.exec(text)) {
            const code = suffix ? found[2].toUpperCase() : prefixCurrency(found[0].slice(0, found[0].indexOf(found[1])).trim());
            if (!code) continue;
            const amount = parseAmount(found[1], code);
            if (Number.isFinite(amount) && amount >= (CRYPTOS.includes(code) ? 1e-8 : 0.01)) return { code, amount };
          }
        }
        return null;
      }
      const fiatUsd = (amount, code) => conversion().fiatUsd(amount, code);
      const usdClp = () => conversion().usdClp();
      const eurClp = () => conversion().eurClp();
      const toCLP = (amount, code) => conversion().toCLP(amount, code);
      const toUnits = (amount, fromCode, toCode) => conversion().toUnits(amount, fromCode, toCode);
      const spotAsk = (coin) => conversion().spotAsk(coin);
      const spotBid = (coin) => conversion().spotBid(coin);
      const safeLabel = (s) => String(s || "").replace(/[<>\r\n]/g, " ").slice(0, 45);
      function formatCoin(value, code) {
        if (!Number.isFinite(value)) return "—";
        const digits = 8;
        if (value > 0 && value < Math.pow(10, -digits)) return `<${Math.pow(10, -digits).toFixed(digits)}`;
        return value.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
      }
      const withExtra = (value, kind) => value * (1 + (percent(settings[kind + "Extra"]) + percent(settings.taxExtra)) / 100);
      const dateTime = (time) => new Date(time).toLocaleString(uiLanguage() === "en" ? "en-US" : "es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      function badgeText(match) {
        const clp = toCLP(match.amount, match.code);
        if (clp == null || !Number.isFinite(clp)) return null;
        const lines = [`≈ ${formatCLP(clp)}`];
        if (settings.compareInline) lines[0] += ` · Prex ${formatCLP(withExtra(clp, "prex"))} · Santander ${formatCLP(withExtra(clp, "santander"))}`;
        if (settings.showCryptoInline && activeCrypto()) {
          const items = CRYPTOS.filter((c) => c !== match.code).map((code) => `${code} ${formatCoin(toUnits(match.amount, match.code, code), code)}`);
          if (items.length) lines.push(items.join(" · "));
        }
        if (CRYPTOS.includes(match.code)) {
          const usd = toUnits(match.amount, match.code, "USD"), eur = toUnits(match.amount, match.code, "EUR");
          if (usd != null && eur != null) lines.push(`USD ${formatDecimal(usd)} · EUR ${formatDecimal(eur)}`);
        }
        return lines;
      }
      const node = createNode;
      const line = appendLine;
      const disclosure = appendDisclosure;
      const cardRow = createCardRow;
      const persistence = createPersistenceController({
        storage,
        defaults: DEFAULTS,
        onError: (key, error) => console.info("[Moncevia] Almacenamiento " + key + ":", error?.message || error)
      });
      const persist = () => persistence.saveSettings(settings);
      const fabController = createFabController({
        button: () => fab,
        position: () => settings.fabPosition,
        onPosition: (position) => {
          settings.fabPosition = position;
        },
        persist
      });
      const restoreFabPosition = () => fabController.restore();
      const resetFabPosition = (save = true) => fabController.reset(save);
      const enableFabDragging = () => fabController.enable();
      function stylesheet() {
        appendEmbeddedStyles(moncevia_default);
      }
      function checkbox(parent, label, getter, setter) {
        const row = node("label");
        row.append(node("span", "", label));
        const box = node("input");
        box.type = "checkbox";
        box.checked = getter();
        box.addEventListener("change", () => {
          setter(box.checked);
          persist();
          refresh();
          reScan(true);
        });
        row.append(box);
        parent.append(row);
        return box;
      }
      function numberSetting(parent, label, key, max = 30, step = "0.01") {
        const row = node("label");
        row.append(node("span", "", label));
        const input = node("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.min = "0";
        input.max = String(max);
        input.step = step;
        input.value = String(settings[key]);
        input.addEventListener("change", () => {
          const v = Number(input.value);
          const before = Number(settings[key]);
          settings[key] = Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0;
          if (before !== settings[key]) {
            const dependent = /^fee(BTC|ETH|LTC)$/.test(key) ? "feeKnown" + key.slice(3) : { spotFeePct: "spotFeeKnown", usdtFundPct: "usdtFundKnown", prexExtra: "prexKnown", santanderExtra: "santanderKnown" }[key];
            if (dependent) {
              settings[dependent] = false;
              if (verifyBoxes[dependent]) verifyBoxes[dependent].checked = false;
            }
          }
          input.value = String(settings[key]);
          persist();
          refresh();
          reScan(true);
        });
        row.append(input);
        parent.append(row);
        return input;
      }
      function refresh() {
        if (!widget) return;
        fab.textContent = isActive() ? "CLP · ₿" : "CLP · OFF";
        const usd = usdClp(), euro = eurClp();
        const fxStatus = activeFX() ? `FX ${fx.updatedAt || dateTime(fx.fetchedAt)}` : "FX sin datos recientes";
        const manual = [validPositive(settings.usdClpManual) ? "USD manual" : "", validPositive(settings.eurClpManual) ? "EUR manual" : ""].filter(Boolean).join(" · ");
        stateLabel.textContent = `${activeFX() ? "Divisas al día" : "Divisas sin actualizar"} · ${activeCrypto() ? "Cripto al día" : "Cripto pendiente"}${manual ? " · cambio manual" : ""}`;
        if (stateLabel.previousElementSibling?.classList?.contains("mv-dot")) stateLabel.previousElementSibling.classList.toggle("mv-stale", !activeFX() || !activeCrypto());
        if (activeCrypto()) {
          const items = CRYPTOS.map((c) => `1 ${c} ≈ ${toCLP(1, c) == null ? "—" : formatCLP(toCLP(1, c))}`);
          coinsLabel.textContent = items.join(" · ") + ` · ${crypto.source} ${dateTime(crypto.fetchedAt)}${validPositive(crypto.usdtUsd) ? ` · 1 USDT = ${formatDecimal(crypto.usdtUsd, 5)} USD` : ""}`;
          coinsLabel.classList.remove("clplens-warning");
        } else {
          coinsLabel.textContent = "BTC/ETH/LTC: sin cotización reciente. Actualiza para mostrar cantidades.";
          coinsLabel.classList.add("clplens-warning");
        }
        renderCalc();
        if (tab === "history") renderHistory();
      }
      const variantDetector = createVariantDetector({
        parseAmount,
        prefixCurrency,
        prefixRE,
        suffixRE,
        figure,
        cryptoCodes: CRYPTOS,
        dollarCurrencyForSite
      });
      const {
        originalText,
        matchesInText,
        bestVisiblePrice,
        selectedSummaryPrice,
        currentProductPrice,
        sameMonetaryPrice,
        variantControl,
        unlabeledDollarPrice,
        tappedPrice
      } = variantDetector;
      function selectPriceDirect(price) {
        if (!price || !SUPPORTED_CURRENCIES.includes(price.code)) return;
        manualOverride = false;
        pendingSelection = null;
        if (settings.autoSyncSelection) applySelectedPrice(price);
        else {
          settings.calcAmount = String(price.amount);
          settings.calcCurrency = price.code;
          if (settings.targetCurrency === price.code) settings.targetCurrency = targetFallback(price.code);
          if (targetSelect) targetSelect.value = settings.targetCurrency;
          if (calcInput) calcInput.value = settings.calcAmount;
          if (calcSelect) calcSelect.value = settings.calcCurrency;
          currentSelection = price;
          renderCalc();
          renderCompact();
          updateSourceLabel();
        }
        if (panel) {
          panel.hidden = false;
          activateTab("calculator");
        }
      }
      function setDollarCurrencyForSite(code) {
        if (!settings.dollarCurrencySites || typeof settings.dollarCurrencySites !== "object" || Array.isArray(settings.dollarCurrencySites))
          settings.dollarCurrencySites = {};
        if (["USD", "CLP", "CAD", "AUD"].includes(code)) settings.dollarCurrencySites[HOST] = code;
        else delete settings.dollarCurrencySites[HOST];
        settings.bareDollarSites = settings.bareDollarSites.filter((site) => site !== HOST);
        persist();
        refresh();
        reScan(true);
      }
      function showDollarCurrencyChooser(price) {
        if (!price || document.getElementById("moncevia-dollar-dialog")) return;
        const english = uiLanguage() === "en";
        const overlay = node("div");
        overlay.id = "moncevia-dollar-dialog";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", tr("Selecciona la moneda de $"));
        overlay.style.cssText = "position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(3,8,18,.75)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;";
        const card = node("div");
        card.style.cssText = "box-sizing:border-box!important;max-width:370px!important;width:100%!important;background:#101c2d!important;border:1px solid #4b647a!important;border-radius:16px!important;padding:20px!important;color:#f8fafc!important;font:15px/1.45 system-ui!important;box-shadow:0 16px 50px rgba(0,0,0,.4)!important;";
        const title = node("strong", "", tr("Selecciona la moneda de $"));
        title.style.cssText = "display:block!important;font-size:18px!important;margin-bottom:10px!important;";
        const explanation = node("p", "", tr("El símbolo $ no identifica una divisa única. Elige cómo interpretar los precios de este sitio."));
        explanation.style.cssText = "margin:0 0 12px!important;color:#cbd5e1!important;";
        const priceLabel = node("div", "", `$${price.amount} · ${price.label || HOST}`);
        priceLabel.style.cssText = "color:#5eead4!important;font-weight:650!important;margin-bottom:10px!important;";
        const choice = node("select");
        choice.setAttribute("aria-label", tr("Moneda de $ en este sitio"));
        choice.style.cssText = "display:block!important;width:100%!important;min-height:44px!important;background:#1e293b!important;color:white!important;border:1px solid #64748b!important;border-radius:8px!important;padding:8px!important;";
        for (const code of ["USD", "CLP", "CAD", "AUD"]) {
          const o = node("option", "", code);
          o.value = code;
          choice.append(o);
        }
        const actions = node("div");
        actions.style.cssText = "display:flex!important;gap:10px!important;margin-top:15px!important;";
        const confirm = node("button", "", tr("Confirmar moneda"));
        const cancel = node("button", "", tr("Cancelar"));
        for (const b of [confirm, cancel]) {
          b.type = "button";
          b.style.cssText = "flex:1!important;padding:10px!important;border-radius:9px!important;border:1px solid #64748b!important;background:#1e293b!important;color:white!important;font:600 14px system-ui!important;";
        }
        confirm.style.background = "#115e59";
        confirm.style.borderColor = "#2dd4bf";
        const close = () => {
          overlay.remove();
          if (panel) panel.hidden = false;
        };
        cancel.addEventListener("click", close);
        overlay.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        });
        confirm.addEventListener("click", () => {
          setDollarCurrencyForSite(choice.value);
          close();
          selectPriceDirect({ ...price, code: choice.value });
        });
        actions.append(confirm, cancel);
        card.append(title, explanation, priceLabel, choice, actions);
        overlay.append(card);
        document.body.append(overlay);
        choice.focus();
      }
      function priceSignature(price) {
        return `${price.code}:${price.amount}:${price.label || ""}`;
      }
      function updateSourceLabel() {
        if (!calcSource) return;
        if (!settings.autoSyncSelection) {
          calcSource.textContent = "Sincronizacion desactivada · importe manual";
          return;
        }
        if (manualOverride) {
          calcSource.textContent = "Importe manual · toca otra opcion de la pagina para retomar la sincronizacion";
          return;
        }
        if (pendingVariantChange) {
          calcSource.textContent = "Sincronizando precio seleccionado…";
          return;
        }
        if (currentSelection) {
          calcSource.textContent = `Automatico · ${currentSelection.label || "seleccion de la pagina"}`;
          return;
        }
        calcSource.textContent = "Automatico activo · selecciona un precio de la pagina";
      }
      function applySelectedPrice(price) {
        if (!price || !settings.autoSyncSelection || manualOverride || !isActive()) return;
        if (!SUPPORTED_CURRENCIES.includes(price.code) || !validPositive(price.amount)) return;
        const signature = priceSignature(price);
        if (lastAppliedSelection !== signature || String(settings.calcAmount) !== String(price.amount) || settings.calcCurrency !== price.code) {
          settings.calcAmount = String(price.amount);
          settings.calcCurrency = price.code;
          if (settings.targetCurrency === price.code) settings.targetCurrency = targetFallback(price.code);
          if (targetSelect) targetSelect.value = settings.targetCurrency;
          if (calcInput) calcInput.value = settings.calcAmount;
          if (calcSelect) calcSelect.value = price.code;
          lastAppliedSelection = signature;
          renderCalc();
          renderCompact();
        }
        currentSelection = price;
        updateSourceLabel();
      }
      function syncSelectedPrice() {
        if (!settings.autoSyncSelection || !isActive() || manualOverride) return;
        const selected = selectedSummaryPrice() || currentProductPrice();
        if (pendingVariantChange) {
          const transition = pendingVariantChange;
          if (selected && (!transition.before || !sameMonetaryPrice(selected, transition.before))) {
            pendingVariantChange = null;
            applySelectedPrice(selected);
          } else if (Date.now() - transition.at > 1600) {
            pendingVariantChange = null;
            if (selected) applySelectedPrice(selected);
            else updateSourceLabel();
          }
          return;
        }
        if (pendingSelection) {
          const pending = pendingSelection;
          const matchesClick = sameMonetaryPrice(selected, pending.price);
          const changedAfterClick = selected && pending.before && !sameMonetaryPrice(selected, pending.before);
          if (matchesClick || changedAfterClick) {
            pendingSelection = null;
            applySelectedPrice(selected);
          } else {
            if (Date.now() - pending.at > 2500) pendingSelection = null;
            applySelectedPrice(pending.price);
          }
          return;
        }
        if (selected) applySelectedPrice(selected);
      }
      const selectionScheduler = createSelectionScheduler({
        run: () => syncSelectedPrice(),
        allowed: () => settings.autoSyncSelection && isActive() && !manualOverride
      });
      function scheduleSelectionSync(delay = 160) {
        selectionScheduler.debounce(delay);
      }
      function pageClickCapture(event) {
        if (pickerActive) {
          if (event.target?.closest?.("#clplens-widget")) {
            stopPicker();
            panel.hidden = false;
            refresh();
            return;
          }
          event.preventDefault();
          event.stopImmediatePropagation();
          const price2 = tappedPrice(event.target);
          if (!price2) {
            const unknown = unlabeledDollarPrice(event.target);
            if (unknown) {
              stopPicker();
              showDollarCurrencyChooser(unknown);
            }
            return;
          }
          pickerActive = false;
          document.body.classList.remove("clplens-picking");
          manualOverride = false;
          pendingSelection = null;
          if (settings.autoSyncSelection) applySelectedPrice(price2);
          else {
            settings.calcAmount = String(price2.amount);
            settings.calcCurrency = price2.code;
            if (settings.targetCurrency === price2.code) settings.targetCurrency = targetFallback(price2.code);
            if (targetSelect) targetSelect.value = settings.targetCurrency;
            calcInput.value = settings.calcAmount;
            calcSelect.value = price2.code;
            currentSelection = price2;
            renderCalc();
            renderCompact();
            updateSourceLabel();
          }
          flashPrice(event.target);
          if (pickBtn) pickBtn.textContent = "Seleccionar en web";
          panel.hidden = false;
          tab = "calculator";
          activateTab("calculator");
          return;
        }
        if (!settings.autoSyncSelection || !isActive()) return;
        const price = tappedPrice(event.target);
        if (!price) {
          const unknown = unlabeledDollarPrice(event.target);
          if (unknown) {
            showDollarCurrencyChooser(unknown);
            return;
          }
          if (variantControl(event.target)) {
            const before2 = selectedSummaryPrice() || currentProductPrice();
            manualOverride = false;
            pendingSelection = null;
            pendingVariantChange = { before: before2, at: Date.now(), seq: ++clickSequence };
            updateSourceLabel();
            scheduleSelectionSync(100);
            selectionScheduler.replaceRetries([380, 800, 1500, 2600]);
            return;
          }
          const action = event.target.closest('button,[role="button"]');
          const quantityAction = action && (action.closest('.quantity,[data-quantity],[class*="quantity"]') || /^(?:plus|minus|increase|decrease|increment|decrement|qty)/i.test(action.id || "") || /^(?:\+|−|-)$/u.test((action.textContent || "").trim()));
          if (currentSelection || quantityAction) {
            scheduleSelectionSync(140);
            selectionScheduler.replaceRetries([460]);
          }
          return;
        }
        const before = selectedSummaryPrice() || currentProductPrice();
        manualOverride = false;
        pendingVariantChange = null;
        pendingSelection = { price, before, at: Date.now(), seq: ++clickSequence };
        applySelectedPrice(price);
        scheduleSelectionSync(130);
        selectionScheduler.replaceRetries([450, 1200, 2600]);
      }
      function pageChangeCapture(event) {
        if (!settings.autoSyncSelection || !isActive() || event.target.closest?.("#clplens-widget")) return;
        const target = event.target;
        const hint = [
          target.id,
          target.getAttribute("name"),
          target.getAttribute("aria-label"),
          target.className,
          target.parentElement?.className
        ].join(" ");
        const productInput = target.matches('select,[role="combobox"],input[type="radio"]') && /variant|option|size|colou?r|plan|tier|license|product|duration|sku/i.test(hint);
        if (!productInput && !variantControl(target)) {
          if (currentSelection && target.matches('select,input[type="number"]')) scheduleSelectionSync(240);
          return;
        }
        manualOverride = false;
        pendingSelection = null;
        pendingVariantChange = null;
        scheduleSelectionSync(180);
        selectionScheduler.replaceRetries([500]);
      }
      function flashPrice(target) {
        if (flashTarget) flashTarget.classList.remove("clplens-price-flash");
        clearTimeout(flashTimer);
        flashTarget = target?.closest?.('[role="option"],article,li,label,div') || target;
        flashTarget?.classList?.add("clplens-price-flash");
        flashTimer = setTimeout(() => {
          flashTarget?.classList?.remove("clplens-price-flash");
          flashTarget = null;
        }, 1150);
      }
      function startPicker() {
        if (!settings.visualPick) return;
        pickerActive = true;
        panel.hidden = true;
        document.body.classList.add("clplens-picking");
        if (pickBtn) pickBtn.textContent = "Cancelar selección";
      }
      function stopPicker() {
        pickerActive = false;
        document.body.classList.remove("clplens-picking");
        if (pickBtn) pickBtn.textContent = "Elegir precio en pantalla";
      }
      function toFiatUnits(amount, code, fiat) {
        return toUnits(amount, code, fiat);
      }
      function getPaymentInfo(coin) {
        const exact = !!settings.exactPayEnabled && CRYPTOS.includes(settings.exactPayCurrency);
        if (exact && settings.exactPayCurrency !== coin) return null;
        const amount = exact ? Number(settings.exactPayAmount) : Number(settings.calcAmount);
        const currency = exact ? settings.exactPayCurrency : settings.calcCurrency;
        if (!validPositive(amount)) return null;
        const payable = toUnits(amount, currency, coin);
        const ask = activeCrypto() && crypto.source?.startsWith("Binance") ? Number(crypto.askUSDT?.[coin]) : null;
        const bid = activeCrypto() && crypto.source?.startsWith("Binance") ? Number(crypto.bidUSDT?.[coin]) : null;
        if (!validPositive(payable) || !validPositive(ask) || !validPositive(crypto.usdtUsd)) return null;
        const feeKnown = !!settings["feeKnown" + coin], withdrawFee = feeKnown ? Math.max(0, Number(settings["fee" + coin]) || 0) : 0;
        const exactUnits = exact ? coinMinor(settings.exactPayAmount) : null;
        const feeUnits = feeKnown ? coinMinor(String(settings["fee" + coin])) : 0n;
        if (exact && exactUnits === null || feeKnown && feeUnits === null) return null;
        const neededAtWallet = exact ? Number(exactUnits + feeUnits) / 1e8 : ceil8(payable + withdrawFee);
        const spotKnown = !!settings.spotFeeKnown;
        const tradePct = spotKnown ? percent(settings.spotFeePct) : 0;
        const acquire = ceil8(neededAtWallet / (1 - tradePct / 100));
        const estimateUsdt = roundUp2(acquire * ask * (1 + percent(settings.bufferPct) / 100));
        const fundKnown = !!settings.usdtFundKnown;
        const usdToClp = usdClp();
        const clp = fundKnown && usdToClp && validPositive(crypto.usdtUsd) ? estimateUsdt * crypto.usdtUsd * usdToClp * (1 + percent(settings.usdtFundPct) / 100) : null;
        return {
          coin,
          currency,
          payable,
          ask,
          bid,
          feeKnown,
          withdrawFee,
          spotKnown,
          tradePct,
          fundKnown,
          neededAtWallet,
          acquire,
          estimateUsdt,
          clp,
          network: safeLabel(settings["network" + coin] || coin)
        };
      }
      function computePayment() {
        if (!transferOutput) return;
        const openCoins = new Set([...transferOutput.querySelectorAll("details[data-mv-coin][open]")].map((x) => x.dataset.mvCoin));
        transferOutput.replaceChildren();
        const exact = !!settings.exactPayEnabled;
        const coins = exact ? [settings.exactPayCurrency] : CRYPTOS;
        let allReady = true;
        for (const coin of coins) {
          const v = getPaymentInfo(coin);
          if (!v) {
            allReady = false;
            const item2 = disclosure(transferOutput, `${coin} · sin cotización verificable`, false, "mv-payment-card");
            item2.details.dataset.mvCoin = coin;
            item2.content.append(node("p", "clplens-warning", "Falta Binance Spot o USDT/USD vigente, o el importe excede ocho decimales."));
            continue;
          }
          const complete = v.feeKnown && v.spotKnown && v.fundKnown && v.clp != null;
          if (!complete) allReady = false;
          const item = disclosure(transferOutput, "", openCoins.has(coin), "mv-payment-card");
          item.details.dataset.mvCoin = coin;
          const label = node("div", "mv-payment-summary");
          label.append(node("strong", "", coin + " · " + v.network));
          label.append(node("small", "", `Recibe ${formatCoin(v.payable, coin)} ${coin} · ${formatDecimal(v.estimateUsdt)} USDT aprox.`));
          const status = node("span", "mv-payment-status" + (complete ? " ready" : ""), complete ? "Datos marcados como verificados" : "Faltan datos de costos");
          item.details.querySelector("summary").append(label, status);
          const body = node("div", "mv-payment-details");
          body.append(node("div", "", `Importe al comercio: ${formatCoin(v.payable, coin)} ${coin}`));
          body.append(node("div", "", `Comisión de retiro: ${v.feeKnown ? formatCoin(v.withdrawFee, coin) + " " + coin : "pendiente de verificar"}`));
          body.append(node("div", "", `Cantidad necesaria: ${formatCoin(v.acquire, coin)} ${coin} ${complete ? "(estimación)" : "(mínimo teórico incompleto)"}`));
          body.append(node("div", "", `Compra Spot: ${formatDecimal(v.estimateUsdt)} USDT · ask ${formatDecimal(v.ask, 6)} USDT/${coin}`));
          body.append(node("div", "", `Fondeo CLP: ${v.fundKnown && v.clp != null ? formatCLP(v.clp) + " (estimado)" : "sin costo de compra de USDT verificado"}`));
          if (!v.feeKnown || !v.spotKnown || !v.fundKnown) {
            const missing = [];
            if (!v.feeKnown) missing.push("comisión y red de retiro");
            if (!v.spotKnown) missing.push("comisión de compra Spot");
            if (!v.fundKnown) missing.push("costo de adquirir USDT");
            body.append(node("div", "clplens-warning", "Pendiente: " + missing.join(" · ")));
          }
          const go = node("button", "mv-linklike", "Configurar comisiones");
          go.type = "button";
          go.addEventListener("click", () => {
            activateTab("settings");
            if (settingsBankGroup) settingsBankGroup.open = true;
          });
          body.append(go);
          item.content.append(body);
        }
        const notice = node("div", "mv-fee-notice", allReady ? "Estimación, no importe definitivo. Revisa la red y el monto recibido en Binance antes de confirmar." : "Estimación incompleta. Comprueba la comisión, la red y el importe exacto en Binance antes de enviar.");
        transferOutput.prepend(notice);
      }
      function renderCompare() {
        if (!compareOutput) return;
        compareOutput.replaceChildren();
        const amount = Number(settings.calcAmount), code = settings.calcCurrency, clp = toCLP(amount, code);
        if (!validPositive(clp)) {
          compareOutput.append(node("p", "", "Sin cotización válida para comparar."));
          return;
        }
        const grid = node("div", "mv-grid");
        const valid = [];
        for (const name of ["Prex", "Santander"]) {
          const key = name.toLowerCase(), value = withExtra(clp, key), verified = !!settings[key + "Known"];
          grid.append(cardRow(name, `${formatCLP(value)}${verified ? " · ✓" : " · aprox."}`, true));
          if (verified) valid.push({ name, cost: value });
        }
        for (const coin of CRYPTOS) {
          const v = getPaymentInfo(coin);
          if (!v) continue;
          const complete = v.clp && v.feeKnown && v.spotKnown && v.fundKnown;
          grid.append(cardRow("Binance " + coin, complete ? formatCLP(v.clp) : `${formatDecimal(v.estimateUsdt)} USDT*`, true));
          if (complete) valid.push({ name: "Binance " + coin, cost: v.clp });
        }
        compareOutput.append(grid);
        if (valid.length >= 2) {
          valid.sort((a, b) => a.cost - b.cost);
          compareOutput.append(node("div", "mv-fee-notice", `Menor estimación entre métodos configurados: ${valid[0].name} · ${formatCLP(valid[0].cost)}`));
        } else compareOutput.append(node("div", "mv-fee-notice", "Sin suficientes métodos con costos marcados como verificados para elegir el más económico."));
        const info = disclosure(compareOutput, "Cómo interpretar la comparación");
        info.content.append(node("p", "", "* USDT indica costo Spot preliminar, sin fondeo final verificado. Las tarjetas usan porcentajes configurados; no son cotizaciones del banco. Los precios Spot no garantizan profundidad ni ejecución."));
      }
      function renderCompact() {
        if (!compactCard) return;
        compactCard.hidden = !settings.compactMode || !isActive() || !panel.hidden;
        if (compactCard.hidden) return;
        compactCard.replaceChildren();
        const a = Number(settings.calcAmount), code = settings.calcCurrency;
        compactCard.append(node("div", "clplens-mini-head", `${code} ${formatDecimal(a, 8)} · ${activeCrypto() ? crypto.source : "sin cripto reciente"}`));
        const clp = toCLP(a, code);
        compactCard.append(node("div", "clplens-mini-big", clp != null ? formatCLP(clp) : "Sin tasa CLP"));
        compactCard.append(node("div", "", CRYPTOS.map((c) => `${c} ${formatCoin(toUnits(a, code, c), c)}`).join(" · ")));
        compactCard.append(node("div", "clplens-mini-note", `Solo referencia · ${activeCrypto() ? "cotización " + dateTime(crypto.fetchedAt) : "cotización cripto caducada"}`));
      }
      function snapshotHistory() {
        const amount = Number(settings.calcAmount), code = settings.calcCurrency;
        if (!validPositive(amount) || !validPositive(toCLP(amount, code))) return;
        const entry = {
          at: Date.now(),
          site: settings.historySite ? HOST : "no guardado",
          amount,
          code,
          targetCurrency: settings.targetCurrency,
          targetAmount: toUnits(amount, code, settings.targetCurrency),
          clp: toCLP(amount, code),
          cryptoSource: activeCrypto() ? crypto.source : "no disponible",
          cryptoAt: crypto?.fetchedAt || null,
          fxAt: fx?.fetchedAt || null,
          units: Object.fromEntries(CRYPTOS.map((c) => [c, toUnits(amount, code, c)]))
        };
        history = [entry, ...history].slice(0, 30);
        void persistence.saveHistory(history);
        renderHistory();
      }
      function renderHistory() {
        if (!historyOutput) return;
        historyOutput.replaceChildren();
        if (!history.length) {
          historyOutput.append(node("p", "", "Sin consultas guardadas. Solo se registra cuando pulsas Guardar; no se almacenan direcciones ni datos bancarios."));
          return;
        }
        for (const record4 of history) {
          const row = node("div", "clplens-record");
          const old = Number(record4.clp), now = toCLP(Number(record4.amount), record4.code);
          const delta = old > 0 && validPositive(now) ? (now / old - 1) * 100 : null;
          row.append(node("strong", "", `${dateTime(record4.at)} · ${safeLabel(record4.site)} · ${record4.amount} ${record4.code}`));
          row.append(node("div", "", `Entonces ${formatCLP(old)} · Ahora ${now != null ? formatCLP(now) : "sin tasa"}`));
          row.append(node("div", "", `Variación CLP ${delta != null ? (delta >= 0 ? "+" : "") + formatDecimal(delta, 2) + " %" : "no disponible"} · ${safeLabel(record4.cryptoSource)}`));
          if (record4.units && typeof record4.units === "object") {
            const deltas = CRYPTOS.map((c) => {
              const oldUnits = Number(record4.units[c]), current = toUnits(Number(record4.amount), record4.code, c);
              if (!validPositive(oldUnits) || !validPositive(current)) return `${c}: sin comparación`;
              const diff = 100 * (current / oldUnits - 1);
              return `${c}: ${(diff >= 0 ? "+" : "") + formatDecimal(diff, 2)} %`;
            });
            row.append(node("div", "", `Variación en unidades cripto: ${deltas.join(" · ")}`));
          }
          const load = node("button", "", "Reutilizar");
          load.type = "button";
          load.addEventListener("click", () => {
            manualOverride = true;
            pendingSelection = null;
            settings.calcAmount = String(record4.amount);
            settings.calcCurrency = record4.code;
            if (SUPPORTED_CURRENCIES.includes(record4.targetCurrency)) settings.targetCurrency = record4.targetCurrency;
            else settings.targetCurrency = targetFallback(record4.code);
            calcInput.value = settings.calcAmount;
            calcSelect.value = record4.code;
            if (targetSelect) targetSelect.value = settings.targetCurrency;
            persist();
            activateTab("calculator");
            refresh();
            updateSourceLabel();
          });
          row.append(load);
          historyOutput.append(row);
        }
      }
      function activateTab(next) {
        if (typeof window.clplensSelectTab === "function") window.clplensSelectTab(next);
      }
      function renderCalc() {
        if (!calcOutput) return;
        calcOutput.replaceChildren();
        const amount = Number(settings.calcAmount), code = settings.calcCurrency;
        if (!(Number.isFinite(amount) && amount > 0 && amount < 1e12)) {
          calcOutput.append(node("div", "mv-fee-notice", "Introduce un importe positivo."));
          computePayment();
          renderCompare();
          renderCompact();
          return;
        }
        const destination = SUPPORTED_CURRENCIES.includes(settings.targetCurrency) ? settings.targetCurrency : "CLP";
        const result = toUnits(amount, code, destination);
        const hero = node("section", "mv-hero");
        hero.append(node("div", "mv-kicker", tr("Resultado en") + " " + destination));
        hero.append(node("div", "mv-big", result != null ? formatConversion(result, destination) : tr("Sin tasa disponible")));
        hero.append(node("div", "mv-sub", "Valor de referencia · no es el cobro final de tu banco"));
        calcOutput.append(hero);
        const grid = node("div", "mv-grid");
        for (const c of ["CLP", "USD", "EUR", ...CRYPTOS]) {
          if (c === destination) continue;
          const value = toUnits(amount, code, c);
          grid.append(cardRow(c, value != null ? c === "CLP" ? formatCLP(value) : CRYPTOS.includes(c) ? formatCoin(value, c) : formatDecimal(value) : "—"));
        }
        calcOutput.append(grid);
        computePayment();
        renderCompare();
        renderCompact();
      }
      function createUI() {
        stylesheet();
        const shell = createPanelShell({
          version: "3.15.3",
          onLanguageToggle: () => switchLanguage(uiLanguage() === "es" ? "en" : "es")
        });
        widget = shell.widget;
        fab = shell.fab;
        panel = shell.panel;
        stateLabel = shell.stateLabel;
        coinsLabel = shell.coinsLabel;
        languageButton = shell.languageButton;
        const nav = node("nav", "mv-nav");
        nav.setAttribute("role", "tablist");
        nav.setAttribute("aria-label", "Secciones de Moncevia");
        const pages = {};
        const navItems = [["calculator", "Convertir", "⇄"], ["crypto", "Pagar", "₿"], ["compare", "Comparar", "≋"], ["history", "Historial", "◷"], ["settings", "Ajustes", "⚙"]];
        const navButtons = {};
        const pageCalc = node("div", "mv-page");
        const pageCrypto = node("div", "mv-page");
        const pageCompare = node("div", "mv-page");
        const pageHistory = node("div", "mv-page");
        const pageSettingsRoot = node("div", "mv-page");
        let pageSettings = pageSettingsRoot;
        Object.assign(pages, { calculator: pageCalc, crypto: pageCrypto, compare: pageCompare, history: pageHistory, settings: pageSettingsRoot });
        const tabController = createTabController({
          pages,
          buttons: navButtons,
          panel,
          onActivate: (name) => {
            tab = name;
            if (name === "history") renderHistory();
          }
        });
        const setTab = (name) => tabController.activate(name);
        for (const [key, label, symbol] of navItems) {
          const button = node("button");
          button.type = "button";
          button.setAttribute("role", "tab");
          button.append(node("span", "mv-nav-icon", symbol), node("span", "", label));
          button.setAttribute("aria-label", label);
          button.id = "mv-tab-" + key;
          button.setAttribute("aria-controls", "mv-page-" + key);
          pages[key].id = "mv-page-" + key;
          pages[key].setAttribute("role", "tabpanel");
          pages[key].setAttribute("aria-labelledby", button.id);
          navButtons[key] = button;
          nav.append(button);
          button.addEventListener("click", () => setTab(key));
        }
        nav.addEventListener("keydown", (event) => tabController.onKeydown(event));
        panel.append(nav);
        window.clplensSelectTab = setTab;
        pageCrypto.append(node("h2", "", "Pago con criptomonedas"));
        line(pageCrypto, "Calcula lo que necesitarías comprar para cubrir un importe solicitado por un comercio.", "mv-section-note");
        pageCompare.append(node("h2", "", "Comparar métodos de pago"));
        line(pageCompare, "Costos orientativos configurados, no cargos confirmados.", "mv-section-note");
        pageHistory.append(node("h2", "", "Historial local"));
        pageSettingsRoot.append(node("h2", "", "Configuración"));
        const field = node("label", "clplens-field");
        field.append(node("span", "", "Importe y moneda de origen"));
        const inputRow = node("div", "clplens-inputrow");
        const amountInput = node("input");
        calcInput = amountInput;
        amountInput.type = "number";
        amountInput.inputMode = "decimal";
        amountInput.step = "any";
        amountInput.min = "0";
        amountInput.value = String(settings.calcAmount);
        const select = node("select");
        calcSelect = select;
        for (const code of SUPPORTED_CURRENCIES) {
          const option = node("option", "", code);
          option.value = code;
          select.append(option);
        }
        select.value = settings.calcCurrency;
        amountInput.addEventListener("focus", () => {
          manualOverride = true;
          pendingSelection = null;
          pendingVariantChange = null;
          selectionScheduler.cancel();
          updateSourceLabel();
        });
        amountInput.addEventListener("input", () => {
          manualOverride = true;
          pendingSelection = null;
          pendingVariantChange = null;
          selectionScheduler.cancel();
          settings.calcAmount = amountInput.value;
          updateSourceLabel();
          renderCalc();
        });
        amountInput.addEventListener("change", () => persist());
        select.addEventListener("change", () => {
          manualOverride = true;
          pendingSelection = null;
          settings.calcCurrency = select.value;
          if (settings.targetCurrency === settings.calcCurrency) settings.targetCurrency = targetFallback(settings.calcCurrency);
          if (targetSelect) targetSelect.value = settings.targetCurrency;
          updateSourceLabel();
          persist();
          renderCalc();
        });
        inputRow.append(amountInput, select);
        field.append(inputRow);
        pageCalc.append(field);
        const targetField = node("label", "clplens-field");
        targetField.append(node("span", "", "Moneda de destino"));
        const targetRow = node("div", "mv-target-row");
        targetSelect = node("select");
        targetSelect.setAttribute("aria-label", "Moneda de destino");
        for (const code of SUPPORTED_CURRENCIES) {
          const option = node("option", "", code);
          option.value = code;
          targetSelect.append(option);
        }
        targetSelect.value = settings.targetCurrency;
        targetSelect.addEventListener("change", () => {
          settings.targetCurrency = targetSelect.value;
          persist();
          renderCalc();
        });
        const swapButton = node("button", "mv-swap", "⇄");
        swapButton.type = "button";
        swapButton.setAttribute("aria-label", "Invertir monedas");
        swapButton.setAttribute("title", "Invertir monedas");
        swapButton.addEventListener("click", () => {
          const oldSource = settings.calcCurrency;
          settings.calcCurrency = settings.targetCurrency;
          settings.targetCurrency = oldSource;
          manualOverride = true;
          pendingSelection = null;
          select.value = settings.calcCurrency;
          targetSelect.value = settings.targetCurrency;
          updateSourceLabel();
          persist();
          renderCalc();
        });
        targetRow.append(targetSelect, swapButton);
        targetField.append(targetRow);
        pageCalc.append(targetField);
        calcSource = line(pageCalc, "", "clplens-strong");
        updateSourceLabel();
        const reselect = node("button", "", "Precio elegido");
        reselect.classList.add("mv-action-primary");
        reselect.type = "button";
        reselect.addEventListener("click", () => {
          manualOverride = false;
          pendingSelection = null;
          syncSelectedPrice();
          updateSourceLabel();
        });
        const toolsRow = node("div", "clplens-action-row");
        toolsRow.append(reselect);
        pickBtn = node("button", "", "Seleccionar en web");
        pickBtn.type = "button";
        pickBtn.addEventListener("click", () => pickerActive ? stopPicker() : startPicker());
        toolsRow.append(pickBtn);
        const save = node("button", "", "Guardar");
        save.type = "button";
        save.addEventListener("click", snapshotHistory);
        toolsRow.append(save);
        const compactButton = node("button", "", "Vista compacta");
        compactButton.type = "button";
        compactButton.addEventListener("click", () => {
          settings.compactMode = !settings.compactMode;
          persist();
          panel.hidden = true;
          renderCompact();
        });
        toolsRow.append(compactButton);
        calcOutput = node("div");
        calcOutput.setAttribute("aria-live", "polite");
        pageCalc.append(calcOutput, toolsRow);
        const toPayment = node("button", "mv-linklike", "Calcular pago con cripto →");
        toPayment.type = "button";
        toPayment.addEventListener("click", () => activateTab("crypto"));
        pageCalc.append(toPayment);
        exactToggle = checkbox(pageCrypto, "Usar importe exacto solicitado en cripto", () => settings.exactPayEnabled, (v) => {
          settings.exactPayEnabled = v;
          exactField.classList.toggle("clplens-hidden", !v);
        });
        const exactField = node("label", "clplens-field");
        exactField.append(node("span", "", "Cantidad que debe recibir el comercio"));
        const exactRow = node("div", "clplens-inputrow");
        exactAmountInput = node("input");
        exactAmountInput.placeholder = "Cantidad exacta del comercio";
        exactAmountInput.type = "number";
        exactAmountInput.step = "0.00000001";
        exactAmountInput.min = "0";
        exactAmountInput.inputMode = "decimal";
        exactAmountInput.value = String(settings.exactPayAmount);
        exactCurrencySelect = node("select");
        for (const c of CRYPTOS) {
          const o = node("option", "", c);
          o.value = c;
          exactCurrencySelect.append(o);
        }
        exactCurrencySelect.value = settings.exactPayCurrency;
        exactAmountInput.addEventListener("input", () => {
          settings.exactPayAmount = exactAmountInput.value;
          computePayment();
          renderCompare();
        });
        exactAmountInput.addEventListener("change", persist);
        exactCurrencySelect.addEventListener("change", () => {
          settings.exactPayCurrency = exactCurrencySelect.value;
          persist();
          computePayment();
          renderCompare();
        });
        exactRow.append(exactAmountInput, exactCurrencySelect);
        exactField.append(exactRow);
        pageCrypto.append(exactField);
        exactField.classList.toggle("clplens-hidden", !settings.exactPayEnabled);
        transferOutput = node("div");
        pageCrypto.append(transferOutput);
        const payHint = disclosure(pageCrypto, "Antes de enviar fondos");
        payHint.content.append(node("p", "", "Comprueba importe exacto, red compatible, mínimo y comisión en tu cuenta Binance. Moncevia no realiza transferencias ni obtiene tarifas privadas."));
        compareOutput = node("div");
        pageCompare.append(compareOutput);
        const generalSection = disclosure(pageSettingsRoot, "General y sitio actual", false, "mv-settings-group");
        pageSettings = generalSection.content;
        const langRow = node("label");
        langRow.append(node("span", "", "Idioma / Language"));
        languageSelect = node("select");
        languageSelect.setAttribute("aria-label", "Idioma / Language");
        for (const [value, label] of [["auto", "Automático / Auto"], ["es", "Español"], ["en", "English"]]) {
          const opt = node("option", "", label);
          opt.value = value;
          languageSelect.append(opt);
        }
        languageSelect.value = settings.language;
        languageSelect.addEventListener("change", () => switchLanguage(languageSelect.value));
        langRow.append(languageSelect);
        pageSettings.append(langRow);
        checkbox(pageSettings, "Conversión activada", () => settings.enabled, (v) => settings.enabled = v);
        checkbox(pageSettings, "Modo compacto al cerrar panel", () => settings.compactMode, (v) => settings.compactMode = v);
        const resetFabButton = node("button", "", "Restablecer posición del botón");
        resetFabButton.type = "button";
        resetFabButton.addEventListener("click", () => resetFabPosition());
        pageSettings.append(resetFabButton);
        checkbox(pageSettings, "Permitir selección visual de precios", () => settings.visualPick, (v) => settings.visualPick = v);
        checkbox(pageSettings, "Sincronizar importe con la opcion tocada", () => settings.autoSyncSelection, (v) => {
          settings.autoSyncSelection = v;
          if (v) {
            manualOverride = false;
            pendingSelection = null;
            scheduleSelectionSync(80);
          }
          updateSourceLabel();
        });
        checkbox(pageSettings, "Desactivar en este sitio", () => settings.disabledSites.includes(HOST), (v) => {
          settings.disabledSites = v ? [.../* @__PURE__ */ new Set([...settings.disabledSites, HOST])] : settings.disabledSites.filter((x) => x !== HOST);
        });
        checkbox(pageSettings, "Guardar dominio en nuevas consultas de historial", () => settings.historySite, (v) => settings.historySite = v);
        const dollarRow = node("label");
        dollarRow.append(node("span", "", "Moneda de $ en este sitio"));
        const dollarSelect = node("select");
        dollarSelect.setAttribute("aria-label", "Moneda de $ en este sitio");
        for (const [code, label] of [["", "Sin definir (preguntar al tocar)"], ["USD", "USD"], ["CLP", "CLP"], ["CAD", "CAD"], ["AUD", "AUD"]]) {
          const option = node("option", "", label);
          option.value = code;
          dollarSelect.append(option);
        }
        dollarSelect.value = dollarCurrencyForSite() || "";
        dollarSelect.addEventListener("change", () => setDollarCurrencyForSite(dollarSelect.value));
        dollarRow.append(dollarSelect);
        pageSettings.append(dollarRow);
        checkbox(pageSettings, "Mostrar BTC / ETH / LTC junto a precios", () => settings.showCryptoInline, (v) => settings.showCryptoInline = v);
        checkbox(pageSettings, "Comparar Prex / Santander en precios", () => settings.compareInline, (v) => settings.compareInline = v);
        const bankSection = disclosure(pageSettingsRoot, "Divisas y tarjetas", false, "mv-settings-group");
        pageSettings = bankSection.content;
        verifyBoxes.prexKnown = checkbox(pageSettings, "Ajuste Prex verificado por ti", () => settings.prexKnown, (v) => settings.prexKnown = v);
        verifyBoxes.santanderKnown = checkbox(pageSettings, "Ajuste Santander verificado por ti", () => settings.santanderKnown, (v) => settings.santanderKnown = v);
        numberSetting(pageSettings, "1 USD en CLP (0 = automático)", "usdClpManual", 1e4);
        numberSetting(pageSettings, "1 EUR en CLP (0 = automático)", "eurClpManual", 15e3);
        numberSetting(pageSettings, "Ajuste Prex (%)", "prexExtra", 30);
        numberSetting(pageSettings, "Ajuste Santander (%)", "santanderExtra", 30);
        numberSetting(pageSettings, "Impuestos adicionales (%)", "taxExtra", 30);
        const cryptoSection = disclosure(pageSettingsRoot, "Binance y redes de retiro", false, "mv-settings-group");
        settingsBankGroup = cryptoSection.details;
        pageSettings = cryptoSection.content;
        line(pageSettings, "Comisiones de retiro opcionales (cantidad de moneda, NO porcentaje). El valor depende de la red seleccionada y del exchange.");
        numberSetting(pageSettings, "Retiro BTC (BTC)", "feeBTC", 10, "0.00000001");
        numberSetting(pageSettings, "Retiro ETH (ETH)", "feeETH", 100, "0.00000001");
        numberSetting(pageSettings, "Retiro LTC (LTC)", "feeLTC", 100, "0.00000001");
        for (const c of CRYPTOS) {
          verifyBoxes["feeKnown" + c] = checkbox(pageSettings, `Comisión de retiro ${c} verificada`, () => settings["feeKnown" + c], (v) => settings["feeKnown" + c] = v);
          const nr = node("label");
          nr.append(node("span", "", `Red de retiro ${c}`));
          const ni = node("input");
          ni.type = "text";
          ni.maxLength = 32;
          ni.value = settings["network" + c] || c;
          ni.addEventListener("change", () => {
            const next = safeLabel(ni.value);
            if (settings["network" + c] !== next) {
              settings["feeKnown" + c] = false;
              if (verifyBoxes["feeKnown" + c]) verifyBoxes["feeKnown" + c].checked = false;
            }
            settings["network" + c] = next;
            persist();
            refresh();
          });
          nr.append(ni);
          pageSettings.append(nr);
        }
        line(pageSettings, "Binance Spot: usamos el precio de venta (ask) para estimar cuánto cuesta comprar BTC/ETH/LTC con USDT. La comisión de trading depende de tu nivel y descuentos; no se presupone.");
        numberSetting(pageSettings, "Comisión de compra Spot (%)", "spotFeePct", 5, "0.001");
        verifyBoxes.spotFeeKnown = checkbox(pageSettings, "Comisión Spot verificada", () => settings.spotFeeKnown, (v) => settings.spotFeeKnown = v);
        numberSetting(pageSettings, "Recargo / coste de adquirir USDT (%)", "usdtFundPct", 30, "0.01");
        verifyBoxes.usdtFundKnown = checkbox(pageSettings, "Costo de fondeo USDT verificado", () => settings.usdtFundKnown, (v) => settings.usdtFundKnown = v);
        numberSetting(pageSettings, "Margen adicional de fluctuación (%)", "bufferPct", 20, "0.01");
        const helpSection = disclosure(pageSettingsRoot, "Ayuda, límites y privacidad", false, "mv-settings-group");
        pageSettings = helpSection.content;
        line(pageSettings, "Al cambiar una comisión, un margen bancario o una red se desmarca su verificación anterior. Confirma el dato nuevo directamente antes de marcarlo otra vez.");
        line(pageSettings, "El simulador NO puede obtener comisiones privadas de retiro de tu cuenta Binance sin autenticación. Nunca introduzcas API keys en este script. Comprueba red, comisión, mínimo, habilitación y monto recibido en Binance.");
        line(pageSettings, "La comparación de tarjetas aplica un porcentaje configurado sobre CLP. No constituye una cotización oficial de Prex o Santander. Las comisiones de retiro no se aplican automáticamente al texto de los precios.");
        line(pageSettings, "El importe se actualiza cuando tocas una opcion con precio o cuando cambia un resumen de seleccion reconocido (por ejemplo SELECTED ACCESS). Si escribes manualmente, se mantiene tu cifra hasta tocar otra opcion o pulsar Usar precio seleccionado.");
        line(pageSettings, "Activación por sitio: RIFT se permite inicialmente. En otras webs compatibles debes autorizar Moncevia expresamente. No se ejecuta el detector ni se consulta ninguna API antes de activar.");
        line(pageSettings, "Binance publica pares en USDT; el cambio de USDT a USD se obtiene por separado. Si falta, se deshabilita la conversión cruzada de Binance. Los retiros necesitan verificar red, mínimo y comisión en Binance.");
        line(pageSettings, "No actúa en sitios financieros protegidos ni rutas de pago. Los comercios .cl requieren autorización. $ sin prefijo requiere elegir su moneda para este sitio.");
        const revokeSite = node("button", "", "Revocar acceso a este sitio");
        revokeSite.type = "button";
        revokeSite.addEventListener("click", async () => {
          if (!window.confirm("¿Revocar acceso de Moncevia a este dominio?")) return;
          const previousAllowed = settings.allowedSites, previousDisabled = settings.disabledSites;
          settings.allowedSites = settings.allowedSites.filter((host) => host !== HOST);
          settings.disabledSites = settings.disabledSites.filter((host) => host !== HOST);
          if (!await persist()) {
            settings.allowedSites = previousAllowed;
            settings.disabledSites = previousDisabled;
            window.alert("No fue posible guardar la revocación.");
            return;
          }
          location.reload();
        });
        pageSettings.append(revokeSite);
        historyOutput = node("div");
        pageHistory.append(historyOutput);
        const clearHistory = node("button", "", "Borrar historial local");
        clearHistory.type = "button";
        clearHistory.addEventListener("click", async () => {
          if (!window.confirm("¿Borrar las consultas guardadas en Moncevia?")) return;
          const previousHistory = history;
          history = [];
          renderHistory();
          if (!await persistence.saveHistory([])) {
            history = [...history, ...previousHistory].slice(0, 30);
            void persistence.saveHistory(history);
            renderHistory();
            window.alert("No fue posible borrar el historial local.");
          }
        });
        pageHistory.append(clearHistory);
        const exportHistory = node("button", "", "Exportar historial CSV");
        exportHistory.type = "button";
        exportHistory.addEventListener("click", () => {
          if (!history.length) {
            window.alert("No hay consultas guardadas.");
            return;
          }
          const cell = (value) => {
            let str = String(value ?? "").replace(/[\r\n]/g, " ");
            if (/^\s*[=+\-@]/.test(str)) str = "'" + str;
            return '"' + str.replace(/"/g, '""') + '"';
          };
          const rows = [["fecha_utc", "sitio", "importe", "moneda", "clp_estimado", "fuente_cripto", "btc", "eth", "ltc"]];
          for (const h of history) rows.push([
            new Date(h.at).toISOString(),
            h.site || "",
            h.amount,
            h.code,
            h.clp,
            h.cryptoSource || "",
            h.units?.BTC ?? "",
            h.units?.ETH ?? "",
            h.units?.LTC ?? ""
          ]);
          const csv = "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
          const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
          const a = node("a");
          a.href = url;
          a.download = "moncevia_historial.csv";
          document.body.append(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5e3);
        });
        pageHistory.append(exportHistory);
        line(pageHistory, "Los datos se conservan localmente en Userscripts. No se envían tus consultas ni direcciones a servidores. Las tasas futuras se comparan solo al abrir el historial.");
        panel.append(pageCalc, pageCrypto, pageCompare, pageHistory, pageSettingsRoot);
        setTab(tab);
        const actions = node("div", "clplens-actions");
        const refreshBtn = node("button", "", "Actualizar tasas");
        const closeBtn = node("button", "", "Cerrar");
        refreshBtn.addEventListener("click", async () => {
          refreshBtn.disabled = true;
          refreshBtn.textContent = "Consultando…";
          try {
            await Promise.all([updateFX(true), updateCrypto(true)]);
          } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = "Actualizar tasas";
          }
        });
        closeBtn.addEventListener("click", () => {
          panel.hidden = true;
          renderCompact();
        });
        actions.append(refreshBtn, closeBtn);
        panel.append(actions);
        function openPanelFast() {
          panel.hidden = false;
          const ticket = ++panelOpenTicket;
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (ticket !== panelOpenTicket || panel.hidden) return;
            refresh();
          }));
        }
        fab.addEventListener("click", () => {
          if (pickerActive) stopPicker();
          if (panel.hidden) openPanelFast();
          else {
            panel.hidden = true;
            ++panelOpenTicket;
            renderCompact();
          }
        });
        compactCard = node("div");
        compactCard.id = "clplens-compact";
        compactCard.hidden = true;
        compactCard.addEventListener("click", () => openPanelFast());
        widget.append(panel, compactCard, fab);
        document.body.append(widget);
        const panelStateObserver = new MutationObserver(() => {
          fab.setAttribute("aria-expanded", String(!panel.hidden));
        });
        panelStateObserver.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
        restoreFabPosition();
        enableFabDragging();
        refresh();
        watchLocalization();
      }
      const priceScanner = createPriceScanner({ isActive, detectMoney, badgeText, scanLimit: SCAN_LIMIT, badgeLimit: BADGE_LIMIT });
      const scan = () => priceScanner.scan();
      const reScan = (force = false) => priceScanner.schedule(force);
      const ownMutation = (change) => priceScanner.isOwnMutation(change);
      async function requestJSON(url) {
        if (!isActive()) throw Error("Inactive site");
        const result = await storage.xmlHttpRequest({ method: "GET", url, timeout: 11e3, responseType: "text", headers: { Accept: "application/json" } });
        if (!result || result.status !== 200) throw Error("HTTP " + result?.status);
        return JSON.parse(result.responseText || result.response);
      }
      async function updateFXImpl(force = false) {
        if (!force && inDate2(fx, FX_TTL)) return;
        try {
          const data = await requestJSON("https://open.er-api.com/v6/latest/USD");
          const validated = validateFXResponse(data, Date.now());
          if (!validated) throw Error("FX invalida u obsoleta");
          fx = { fetchedAt: validated.fetchedAt, updatedAt: dateTime(validated.providerTime), rates: validated.rates };
          await storage.setValue(FX_KEY, fx);
        } catch (e) {
          console.info("[Moncevia] FX no disponible:", e?.message || e);
        }
        refresh();
        reScan(true);
      }
      async function updateCryptoImpl(force = false) {
        if (!force && inDate2(crypto, CRYPTO_TTL) && activeCrypto() && crypto.source?.startsWith("Binance")) return;
        const binanceHosts = ["https://data-api.binance.vision", "https://api.binance.com"];
        try {
          let data = null;
          for (const host of binanceHosts) {
            try {
              data = await Promise.all(CRYPTOS.map((coin) => requestJSON(`${host}/api/v3/ticker/bookTicker?symbol=${coin}USDT`)));
              break;
            } catch (err) {
              console.info("[Moncevia] Fuente Spot no accesible:", host);
            }
          }
          if (!data || data.length !== 3) throw Error("Binance no disponible");
          const tether = await requestJSON("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_last_updated_at=true");
          const usdtUsd = validateUSDTParity(tether, Date.now());
          if (usdtUsd === null) throw Error("USDT/USD sin cotizacion verificable");
          const validated = validateBinanceSnapshot(data, usdtUsd, Date.now());
          if (!validated) throw Error("Binance ticker no válido");
          crypto = validated;
          await storage.setValue(CRYPTO_KEY, crypto);
        } catch (err) {
          console.info("[Moncevia] Binance no disponible, intentando CoinGecko:", err?.message || err);
          try {
            const data = await requestJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Clitecoin&vs_currencies=usd&include_last_updated_at=true");
            const validated = validateCoinGeckoSnapshot(data, Date.now());
            if (!validated) throw Error("CoinGecko sin cotizacion completa o reciente");
            crypto = validated;
            await storage.setValue(CRYPTO_KEY, crypto);
          } catch (e) {
            console.info("[Moncevia] CoinGecko no disponible; intentando Coinbase:", e?.message || e);
            try {
              const result = await Promise.all(CRYPTOS.map((c) => requestJSON(`https://api.coinbase.com/v2/prices/${c}-USD/spot`)));
              const validated = validateCoinbaseSnapshot(result, Date.now());
              if (!validated) throw Error("Coinbase no válido");
              crypto = validated;
              await storage.setValue(CRYPTO_KEY, crypto);
            } catch (error) {
              console.info("[Moncevia] Cotización cripto no disponible:", error?.message || error);
            }
          }
        }
        refresh();
        reScan(true);
      }
      async function updateFX(force = false) {
        if (!force && inDate2(fx, FX_TTL)) return;
        if (fxRequest) return fxRequest;
        fxRequest = updateFXImpl(force);
        try {
          return await fxRequest;
        } finally {
          fxRequest = null;
        }
      }
      async function updateCrypto(force = false) {
        if (!force && inDate2(crypto, CRYPTO_TTL) && activeCrypto() && crypto.source?.startsWith("Binance")) return;
        if (cryptoRequest) return cryptoRequest;
        cryptoRequest = updateCryptoImpl(force);
        try {
          return await cryptoRequest;
        } finally {
          cryptoRequest = null;
        }
      }
      async function restoreWithDeadline() {
        let timer;
        try {
          return await Promise.race([persistence.load(), new Promise((_, reject) => {
            timer = setTimeout(() => reject(Error("Startup storage timeout")), 5e3);
          })]);
        } finally {
          clearTimeout(timer);
        }
      }
      function showStartupError() {
        if (!document.body || hasStartupUI() || isSensitiveContext()) return;
        const notice = document.createElement("button");
        notice.id = "moncevia-startup-error";
        notice.type = "button";
        notice.textContent = tr("Moncevia: error de inicio · recargar");
        notice.style.cssText = "position:fixed!important;bottom:80px!important;right:12px!important;z-index:2147483645!important;background:#17243a!important;color:white!important;padding:12px!important;border-radius:10px!important;border:1px solid #f59e0b!important;";
        notice.addEventListener("click", () => {
          if (!isSensitiveContext()) location.reload();
        });
        document.body.append(notice);
      }
      async function boot() {
        const restored = await restoreWithDeadline();
        settings = restored.settings;
        fx = restored.fx;
        history = restored.history;
        crypto = restored.crypto;
        if (!document.body || hasStartupUI() || isSensitiveContext()) return;
        if (!isAuthorized()) {
          const opt = node("button", "", "Moncevia · activar aquí");
          opt.id = "moncevia-optin";
          opt.type = "button";
          opt.textContent = tr(opt.textContent);
          opt.setAttribute("aria-label", tr("Permitir Moncevia en este dominio"));
          Object.assign(opt.style, { position: "fixed", bottom: "max(12px,env(safe-area-inset-bottom))", right: "10px", zIndex: "2147483645", font: "12px system-ui", color: "#e2e8f0", background: "#1e293b", padding: "9px 11px", border: "1px solid #64748b", borderRadius: "18px", opacity: "0.85" });
          opt.addEventListener("click", async () => {
            if (opt.disabled) return;
            if (isSensitiveContext()) {
              opt.remove();
              return;
            }
            opt.disabled = true;
            const previousAllowed = settings.allowedSites;
            settings.allowedSites = [.../* @__PURE__ */ new Set([...settings.allowedSites, HOST])];
            if (!await persist()) {
              settings.allowedSites = previousAllowed;
              opt.disabled = false;
              window.alert("No fue posible guardar la autorización.");
              return;
            }
            opt.remove();
            startRuntime();
          });
          document.body.append(opt);
          return;
        }
        startRuntime();
      }
      let sensitivePaused = false;
      function syncSiteVisibility() {
        if (!widget || !document.body) return;
        if (!widget.isConnected) document.body.append(widget);
        const sensitive = isSensitiveContext();
        if (sensitive === sensitivePaused) return;
        sensitivePaused = sensitive;
        if (sensitive) widget.style.setProperty("display", "none", "important");
        else widget.style.removeProperty("display");
        if (sensitive) {
          if (pickerActive) stopPicker();
          panel.hidden = true;
          priceScanner.dispose();
          selectionScheduler.cancel();
          document.querySelectorAll('.clplens-badge[data-clplens-badge="2"]').forEach((badge) => badge.remove());
        } else if (isActive()) {
          refresh();
          reScan(true);
          scheduleSelectionSync(180);
        }
      }
      function startRuntime() {
        if (document.getElementById("clplens-widget") || isSensitiveContext()) return;
        createUI();
        scan();
        renderHistory();
        renderCompact();
        const lifecycle = createPageLifecycle({
          root: document.documentElement,
          isOwnMutation: ownMutation,
          onMutation: () => {
            syncSiteVisibility();
            if (isActive()) {
              reScan();
              scheduleSelectionSync(160);
            }
          },
          onClick: (event) => {
            pageClickCapture(event);
            queueMicrotask(syncSiteVisibility);
          },
          onChange: (event) => {
            pageChangeCapture(event);
            queueMicrotask(syncSiteVisibility);
          },
          onKeydown: (event) => {
            if (pickerActive && event.key === "Escape") {
              stopPicker();
              panel.hidden = false;
              refresh();
            }
            if (event.key === "Escape" && panel && !panel.hidden) {
              panel.hidden = true;
              fab.focus();
              renderCompact();
            }
          },
          onScroll: () => {
            syncSiteVisibility();
            if (isActive()) reScan();
          },
          onRefresh: () => {
            syncSiteVisibility();
            if (document.visibilityState === "visible" && isActive()) {
              void Promise.all([updateFX(false), updateCrypto(false)]);
              refresh();
              reScan(true);
            }
          },
          onSuspend: () => {
            selectionScheduler.cancel();
            priceScanner.dispose();
            uiLocalizer.stop();
          },
          onResume: () => {
            uiLocalizer.watch();
            syncSiteVisibility();
          }
        });
        lifecycle.start();
        scheduleSelectionSync(180);
        if (isActive()) void Promise.all([updateFX(false), updateCrypto(false)]);
      }
      boot().catch(showStartupError);
    }
    if (document.body) initializeAfterBody();
    else {
      const bodyObserver = new MutationObserver(() => {
        if (!document.body) return;
        bodyObserver.disconnect();
        initializeAfterBody();
      });
      bodyObserver.observe(document, { childList: true, subtree: true });
    }
  })();
})();
