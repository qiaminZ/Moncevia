// ==UserScript==
// @name         Moncevia — Currency & Crypto Companion
// @namespace    https://local.clplens.userscript/
// @version      3.2.0
// @description  Conversion de precios a CLP y cripto con Binance Spot, USDT/USD explicito, simulador, historial y activacion por sitio.
// @match        https://*/*
// @downloadURL  https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js
// @updateURL    https://raw.githubusercontent.com/qiaminZ/Moncevia/main/moncevia.user.js
// @noframes
// @run-at       document-idle
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      data-api.binance.vision
// @connect      api.binance.com
// @connect      open.er-api.com
// @connect      api.coingecko.com
// @connect      api.coinbase.com
// ==/UserScript==

(() => {
  'use strict';
  // No accede a cookies, formularios, credenciales, wallets ni API privadas.
  // Solo solicita cotizaciones publicas; nunca efectua compras o transferencias.
  if (window.top !== window.self || !document.body || typeof GM === 'undefined' ||
      typeof GM.getValue !== 'function' || typeof GM.xmlHttpRequest !== 'function') return;

  const HOST = location.hostname.toLowerCase();
  const matchHost = base => HOST === base || HOST.endsWith('.' + base);
  const restricted = [
    'prexcard.com','prexcard.cl','santander.cl','bancoestado.cl','bancochile.cl','bci.cl',
    'scotiabank.cl','itau.cl','bancofalabella.cl','paypal.com','stripe.com',
    'wise.com','revolut.com','binance.com','coinbase.com','kraken.com','crypto.com',
    'mercadopago.cl','mercadopago.com','webpay.cl','transbank.cl',
    'appleid.apple.com','accounts.google.com','login.microsoftonline.com'
  ];
  if (HOST.endsWith('.cl') || restricted.some(matchHost) ||
      /(?:^|[.-])(bank|banco|banking|santander|prex|binance|paypal|coinbase|mercadopago|webpay|transbank)(?:[.-]|$)/.test(HOST) ||
      /\/(login|sign[/-]?in|sign[/-]?up|checkout|payment|pay|billing|banking|wallet|transfer|auth|account|cart)(?:[/?#-]|$)/i.test(location.pathname)) return;
  if (document.getElementById('clplens-widget') || document.querySelector('input[type="password"]')) return;

  const SETTINGS_KEY = 'clplens_v1'; // Formato compatible; la migracion depende del almacenamiento de Userscripts.
  const FX_KEY = 'clplens_usd_rates_v1';
  const CRYPTO_KEY = 'clplens_crypto_rates_v2';
  const HISTORY_KEY = 'clplens_history_v3';
  const FX_TTL = 12 * 3600_000;
  const FX_STALE = 3 * 86400_000;
  const CRYPTO_TTL = 5 * 60_000;
  const CRYPTO_STALE = 45 * 60_000;
  const SCAN_LIMIT = 3500, BADGE_LIMIT = 100;
  const FIAT = ['USD','EUR','GBP','CAD','AUD','JPY','KRW','BRL','CNY'];
  const CRYPTOS = ['BTC','ETH','LTC'];
  const COIN_ID = { BTC:'bitcoin', ETH:'ethereum', LTC:'litecoin' };
  const DEFAULTS = {
    enabled:true, disabledSites:[], bareDollarSites:[], allowedSites:['shop.riftbot.org'], historySite:false, compareInline:false,
    usdClpManual:0, eurClpManual:0, prexExtra:0, santanderExtra:0, taxExtra:0,
    showCryptoInline:true, autoSyncSelection:true,
    feeBTC:0, feeETH:0, feeLTC:0,
    feeKnownBTC:false,feeKnownETH:false,feeKnownLTC:false,
    networkBTC:'Bitcoin',networkETH:'Ethereum',networkLTC:'Litecoin',
    spotFeePct:0,spotFeeKnown:false,usdtFundPct:0,usdtFundKnown:false,bufferPct:0,
    compactMode:false,visualPick:true,prexKnown:false,santanderKnown:false,
    exactPayEnabled:false,exactPayAmount:'',exactPayCurrency:'LTC',
    calcAmount:'24.99', calcCurrency:'EUR'
  };
  let settings = { ...DEFAULTS }, fx = null, crypto = null;
  let widget, fab, panel, stateLabel, sampleLabel, coinsLabel, calcOutput, calcInput, calcSelect, calcSource;
  let compactCard, compareOutput, transferOutput, historyOutput, history=[], pickBtn, exactAmountInput, exactCurrencySelect, exactToggle;
  let pickerActive=false, flashTarget=null, flashTimer=null, pendingTab='calculator';
  let observer, timer, selectionTimer, tab = 'calculator';
  const verifyBoxes = Object.create(null);
  let fxRequest = null, cryptoRequest = null;
  let manualOverride = false, pendingSelection = null, currentSelection = null;
  let lastAppliedSelection = '', clickSequence = 0;
  const formatCLP = v => Number.isFinite(v) ? new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(Math.round(v)) : '—';
  const formatDecimal = (v, digits = 2) => new Intl.NumberFormat('es-CL', { maximumFractionDigits:digits, minimumFractionDigits:0 }).format(v);
  const percent = v => Math.max(0, Math.min(30, Number(v) || 0));
  const validPositive = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const isAuthorized = () => settings.allowedSites.includes(HOST);
  const isActive = () => isAuthorized() && settings.enabled && !settings.disabledSites.includes(HOST);
  const inDate = (obj, time) => obj && Number.isFinite(obj.fetchedAt) && Date.now() - obj.fetchedAt >= 0 && Date.now() - obj.fetchedAt < time;
  const activeCrypto = () => inDate(crypto, CRYPTO_STALE) &&
    (!crypto.quotedAt || (Date.now() - crypto.quotedAt >= -300_000 && Date.now() - crypto.quotedAt < CRYPTO_STALE)) &&
    CRYPTOS.every(c => validPositive(crypto.usd?.[c])) && (!crypto.source?.startsWith('Binance') || validPositive(crypto.usdtUsd));
  const activeFX = () => inDate(fx, FX_STALE) && validPositive(fx.rates?.EUR) && validPositive(fx.rates?.CLP);

  // Evita confundir 1.234,56 con 1,234.56 y conserva 8 decimales en criptomonedas.
  function parseAmount(raw, code) {
    let s = String(raw).replace(/[\s\u00a0\u202f]/g, '');
    if (!/^\d[\d.,]*$/.test(s)) return NaN;
    const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    if (c !== -1 && d !== -1) {
      const dec = c > d ? ',' : '.';
      s = s.split(dec === ',' ? '.' : ',').join('').replace(dec, '.');
    } else {
      const sep = c !== -1 ? ',' : (d !== -1 ? '.' : '');
      if (sep) {
        const bits = s.split(sep);
        const cryptoCode = CRYPTOS.includes(code);
        if (!cryptoCode && bits.length === 2 && bits[1].length === 3 && bits[0].length <= 3) return NaN; // 1.234 puede significar 1,234 o 1234.
        if (bits.length > 2) s = bits.join('');
        else s = bits.join('.');
      }
    }
    const value = Number(s);
    return value > 0 && value < 1e12 && Number.isFinite(value) ? value : NaN;
  }

  const figure = String.raw`(?:\d{1,3}(?:[.,\s\u00a0\u202f]\d{3})+(?:[.,]\d{1,8})?|\d+(?:[.,]\d{1,8})?)`;
  const prefixRE = new RegExp(String.raw`(?<![\p{L}\d])(?:US\$|U\$S|USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC|R\$|€|£|¥|₿|Ξ|Ł|\$)\s*(${figure})(?![\p{L}\d])`, 'giu');
  const suffixRE = new RegExp(String.raw`(?<![\p{L}\d])(${figure})\s*(USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC)(?![\p{L}\d])`, 'giu');
  function prefixCurrency(prefix) {
    const s = prefix.toUpperCase();
    if (s === '€') return 'EUR';
    if (s === '£') return 'GBP';
    if (s === '₿') return 'BTC';
    if (s === 'Ξ') return 'ETH';
    if (s === 'Ł') return 'LTC';
    if (s === '¥') return HOST.endsWith('.jp') ? 'JPY' : (HOST.endsWith('.cn') ? 'CNY' : null);
    if (s === 'R$') return 'BRL';
    if (s === '$') return settings.bareDollarSites.includes(HOST) ? 'USD' : null;
    if (s === 'US$' || s === 'U$S') return 'USD';
    return FIAT.includes(s) || CRYPTOS.includes(s) ? s : null;
  }
  function detectMoney(text) {
    if (!text || text.length > 135) return null;
    for (const [rx, suffix] of [[prefixRE,false],[suffixRE,true]]) {
      rx.lastIndex = 0;
      let found;
      while ((found = rx.exec(text))) {
        const code = suffix ? found[2].toUpperCase() : prefixCurrency(found[0].slice(0,found[0].indexOf(found[1])).trim());
        if (!code) continue;
        const amount = parseAmount(found[1],code);
        if (Number.isFinite(amount) && amount >= (CRYPTOS.includes(code) ? 0.00000001 : 0.01)) return { code, amount };
      }
    }
    return null;
  }

  function fiatUsd(amount, code) {
    if (code === 'USD') return amount;
    if (code === 'EUR' && validPositive(settings.eurClpManual) && usdClp()) return amount * Number(settings.eurClpManual) / usdClp();
    if (CRYPTOS.includes(code)) return activeCrypto() ? amount * spotBid(code) : null;
    if (!activeFX() || !validPositive(fx.rates[code])) return null;
    return amount / fx.rates[code];
  }
  function usdClp() {
    if (validPositive(settings.usdClpManual)) return Number(settings.usdClpManual);
    return activeFX() ? fx.rates.CLP : null;
  }
  function eurClp() {
    if (validPositive(settings.eurClpManual)) return Number(settings.eurClpManual);
    if (!activeFX() || !usdClp()) return null;
    return usdClp() / fx.rates.EUR;
  }
  function toCLP(amount, code) {
    if (code === 'CLP') return amount;
    if (code === 'EUR' && validPositive(settings.eurClpManual)) return amount * Number(settings.eurClpManual);
    const usd = fiatUsd(amount, code), price = usdClp();
    return usd != null && price ? usd * price : null;
  }
  function toUnits(amount, fromCode, toCode) {
    if (fromCode === toCode) return amount;
    if (toCode === 'CLP') return toCLP(amount,fromCode);
    if (fromCode === 'CLP') {
      const rate = usdClp();
      if (!rate) return null;
      return toUnits(amount / rate, 'USD', toCode);
    }
    const usd = fiatUsd(amount,fromCode);
    if (usd == null) return null;
    if (toCode === 'USD') return usd;
    if (toCode === 'EUR' && validPositive(settings.eurClpManual) && usdClp()) return usd * usdClp() / Number(settings.eurClpManual);
    if (toCode === 'EUR' && activeFX()) return usd * fx.rates.EUR;
    if (CRYPTOS.includes(toCode) && activeCrypto()) return usd / spotAsk(toCode);
    return null;
  }
  function spotAsk(coin) {
    return activeCrypto() && validPositive(crypto?.askUSDT?.[coin]) ? Number(crypto.askUSDT[coin]) * crypto.usdtUsd :
      (activeCrypto() ? Number(crypto.usd[coin]) : null);
  }
  function spotBid(coin) {
    return activeCrypto() && validPositive(crypto?.bidUSDT?.[coin]) ? Number(crypto.bidUSDT[coin]) * crypto.usdtUsd :
      (activeCrypto() ? Number(crypto.usd[coin]) : null);
  }
  // Valores ingresados para retiro se suman como unidades enteras de 10^-8:
  // evita la suma flotante de cantidad exacta y comisión indicada por el usuario.
  function coinMinor(raw) {
    const initial=String(raw).trim().replace(',', '.');
    const s=/e/i.test(initial) && Number.isFinite(Number(initial)) ? Number(initial).toFixed(8) : initial;
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    const [integer,frac='']=s.split('.');
    if (integer.length>10 || frac.length>8) return null;
    return BigInt(integer)*100000000n+BigInt((frac+'00000000').slice(0,8));
  }
  function ceil8(v) {
    if (!Number.isFinite(v) || v<0 || v>1e10) return null;
    // String toFixed permite redondear hacia arriba cualquier residuo visible.
    const s=v.toFixed(12);
    const [integer,frac='']=s.split('.');
    let units=BigInt(integer)*100000000n+BigInt((frac+'00000000').slice(0,8));
    if (/[1-9]/.test(frac.slice(8))) units+=1n;
    return Number(units)/1e8;
  }
  const roundUp2 = v => Number.isFinite(v) ? Math.ceil((v-1e-10)*100)/100 : null;
  const safeLabel = s => String(s||'').replace(/[<>\r\n]/g,' ').slice(0,45);

  function formatCoin(value, code) {
    if (!Number.isFinite(value)) return '—';
    const digits = 8; // No truncar cotizaciones exactas de LTC como 0.53340448.
    if (value > 0 && value < Math.pow(10, -digits)) return `<${Math.pow(10,-digits).toFixed(digits)}`;
    return value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  }
  const withExtra = (value, kind) => value * (1 + (percent(settings[kind+'Extra']) + percent(settings.taxExtra))/100);
  const dateTime = time => new Date(time).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });

  // Solo agrega etiquetas: nunca modifica, oculta ni sustituye el precio real de la tienda.
  function badgeText(match) {
    const clp = toCLP(match.amount,match.code);
    if (clp == null || !Number.isFinite(clp)) return null;
    const lines = [`≈ ${formatCLP(clp)}`];
    if (settings.compareInline) lines[0] += ` · Prex ${formatCLP(withExtra(clp,'prex'))} · Santander ${formatCLP(withExtra(clp,'santander'))}`;
    if (settings.showCryptoInline && activeCrypto()) {
      const items = CRYPTOS.filter(c => c !== match.code)
        .map(code => `${code} ${formatCoin(toUnits(match.amount,match.code,code),code)}`);
      if (items.length) lines.push(items.join(' · '));
    }
    if (CRYPTOS.includes(match.code)) {
      const usd = toUnits(match.amount,match.code,'USD'), eur = toUnits(match.amount,match.code,'EUR');
      if (usd != null && eur != null) lines.push(`USD ${formatDecimal(usd)} · EUR ${formatDecimal(eur)}`);
    }
    return lines;
  }

  const node = (tag, className = '', text = '') => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  };
  const makeLink = (href, text) => {
    const a = node('a','',text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  };
  let storePromise = Promise.resolve();
  function persist() {
    const snapshot = JSON.parse(JSON.stringify(settings));
    storePromise = storePromise.then(() => GM.setValue(SETTINGS_KEY,snapshot)).catch(() => {});
  }
  function stylesheet() {
    const style = node('style');
    style.dataset.clplens = '2';
    style.textContent = `
      .clplens-badge { display:inline-flex!important; flex-direction:column!important; align-items:flex-start!important; gap:1px!important; vertical-align:middle!important; margin:3px 3px 3px 6px!important; padding:3px 6px!important; border-radius:7px!important; background:#ecfdf5!important; color:#064e3b!important; font:600 11px/1.35 -apple-system,BlinkMacSystemFont,Arial,sans-serif!important; text-align:left!important; white-space:normal!important; overflow-wrap:anywhere!important; max-width:min(97vw,380px)!important; border:1px solid #a7f3d0!important; text-transform:none!important; letter-spacing:normal!important; pointer-events:none!important; }
      .clplens-badge > span { display:block!important; font:inherit!important; color:inherit!important; }
      #clplens-widget { all:initial!important; position:fixed!important; bottom:max(12px,env(safe-area-inset-bottom))!important; right:10px!important; z-index:2147483646!important; font:14px/1.4 -apple-system,BlinkMacSystemFont,Arial,sans-serif!important; color:#f8fafc!important; direction:ltr!important; }
      #clplens-widget, #clplens-widget * { box-sizing:border-box!important; }
      #clplens-widget * { font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif!important; }
      #clplens-fab { display:flex!important; align-items:center!important; justify-content:center!important; min-height:42px!important; min-width:86px!important; padding:8px 13px!important; border:1px solid #475569!important; border-radius:26px!important; background:#0f172a!important; color:#fff!important; font-size:13px!important; font-weight:700!important; box-shadow:0 5px 20px #0007!important; }
      #clplens-panel { position:absolute!important; bottom:50px!important; right:0!important; width:min(375px,calc(100vw - 20px))!important; max-height:min(74dvh,640px)!important; overflow-y:auto!important; overflow-x:hidden!important; border:1px solid #475569!important; border-radius:15px!important; background:#0f172a!important; box-shadow:0 15px 40px #0009!important; padding:13px!important; color:#f8fafc!important; }
      #clplens-panel[hidden], #clplens-panel .clplens-hidden { display:none!important; }
      #clplens-panel h2 { margin:0 0 5px!important; color:#fff!important; font-size:19px!important; font-weight:750!important; }
      #clplens-panel p { margin:6px 0!important; color:#cbd5e1!important; font-size:12px!important; line-height:1.45!important; }
      #clplens-panel .clplens-strong { color:#5eead4!important; font-weight:650!important; }
      #clplens-panel .clplens-warning { color:#fcd34d!important; }
      #clplens-panel .clplens-tabs { display:flex!important; gap:6px!important; margin:11px 0!important; }
      #clplens-panel button { cursor:pointer!important; border:1px solid #64748b!important; border-radius:8px!important; background:#1e293b!important; color:#fff!important; min-height:36px!important; padding:7px 9px!important; font-size:13px!important; }
      #clplens-panel button[aria-selected='true'] { background:#164e63!important; border-color:#5eead4!important; }
      #clplens-panel .clplens-tabs button { flex:1!important; }
      #clplens-panel label { display:flex!important; justify-content:space-between!important; align-items:center!important; gap:10px!important; padding:7px 0!important; border-bottom:1px solid #1e293b!important; color:#f8fafc!important; font-size:13px!important; }
      #clplens-panel .clplens-field { display:flex!important; flex-direction:column!important; align-items:stretch!important; gap:5px!important; padding:5px 0!important; border:0!important; }
      #clplens-panel .clplens-inputrow { display:flex!important; gap:8px!important; }
      #clplens-panel input[type=number], #clplens-panel input[type=text], #clplens-panel select { min-height:37px!important; border:1px solid #64748b!important; border-radius:7px!important; background:#1e293b!important; color:#fff!important; padding:5px 7px!important; font-size:16px!important; width:96px!important; max-width:100%!important; }
      #clplens-panel .clplens-inputrow input { flex:1!important; min-width:0!important; width:auto!important; }
      #clplens-panel .clplens-inputrow select { width:98px!important; }
      #clplens-panel input[type=checkbox] { width:20px!important; height:20px!important; accent-color:#2dd4bf!important; flex-shrink:0!important; }
      #clplens-panel .clplens-results { padding:9px!important; border:1px solid #334155!important; border-radius:10px!important; margin-top:8px!important; background:#111e31!important; }
      #clplens-panel .clplens-results div { padding:3px 0!important; color:#d1fae5!important; font-size:14px!important; font-variant-numeric:tabular-nums!important; word-break:break-word!important; }
      #clplens-panel .clplens-actions { display:flex!important; gap:8px!important; position:sticky!important; bottom:-13px!important; background:#0f172a!important; padding:11px 0 2px!important; }
      #clplens-panel .clplens-actions button { flex:1!important; }
      #clplens-panel a { color:#67e8f9!important; text-decoration:underline!important; }
      #clplens-panel .clplens-payment { padding:8px!important; margin:8px 0!important; border:1px solid #475569!important; border-radius:8px!important; background:#15233a!important; }
      #clplens-panel .clplens-payment strong { display:block!important; color:#5eead4!important; padding-bottom:4px!important; }
      #clplens-panel .clplens-payment div { margin:3px 0!important; overflow-wrap:anywhere!important; }
      #clplens-panel .clplens-record { margin:8px 0!important; padding:9px!important; background:#15233a!important; border:1px solid #475569!important; border-radius:8px!important; }
      #clplens-panel .clplens-record div { margin:3px 0!important; }
      #clplens-panel .clplens-record button { margin-top:5px!important; }
      #clplens-panel .clplens-action-row { display:grid!important; grid-template-columns:repeat(2,minmax(0,1fr))!important; gap:7px!important; margin:8px 0!important; }
      #clplens-panel .clplens-action-row button { min-height:42px!important; }
      #clplens-widget #clplens-compact { position:absolute!important; right:0!important; bottom:52px!important; width:min(300px,calc(100vw - 24px))!important; padding:10px!important; border:1px solid #475569!important; border-radius:11px!important; background:#0f172a!important; box-shadow:0 5px 20px #0009!important; color:#f8fafc!important; font-size:12px!important; line-height:1.5!important; overflow-wrap:anywhere!important; }
      #clplens-widget #clplens-compact[hidden] {display:none!important;}
      #clplens-widget .clplens-mini-head {color:#5eead4!important;font-weight:600!important;}
      #clplens-widget .clplens-mini-big {color:#fff!important;font-size:20px!important;font-weight:700!important;}
      #clplens-widget .clplens-mini-note {color:#cbd5e1!important;font-size:10px!important;}
      .clplens-price-flash { outline:3px solid #2dd4bf!important;outline-offset:2px!important; }
      .clplens-picking * { cursor:crosshair!important; }
      @media (prefers-color-scheme: dark) { .clplens-badge { background:#064e3b!important; color:#ecfdf5!important; border-color:#047857!important; } }
    `;
    document.head.appendChild(style);
  }
  function checkbox(parent,label, getter, setter) {
    const row = node('label'); row.append(node('span','',label));
    const box = node('input'); box.type='checkbox'; box.checked = getter();
    box.addEventListener('change',() => { setter(box.checked); persist(); refresh(); reScan(true); });
    row.append(box); parent.append(row);
    return box;
  }
  function numberSetting(parent,label,key,max=30,step='0.01') {
    const row = node('label'); row.append(node('span','',label));
    const input = node('input'); input.type='number'; input.inputMode='decimal';
    input.min='0'; input.max=String(max); input.step=step;
    input.value=String(settings[key]);
    input.addEventListener('change',() => {
      const v=Number(input.value);
      const before = Number(settings[key]);
      settings[key]=Number.isFinite(v) ? Math.min(max,Math.max(0,v)) : 0;
      if (before !== settings[key]) {
        const dependent = /^fee(BTC|ETH|LTC)$/.test(key) ? 'feeKnown'+key.slice(3) :
          ({spotFeePct:'spotFeeKnown',usdtFundPct:'usdtFundKnown',prexExtra:'prexKnown',santanderExtra:'santanderKnown'})[key];
        if (dependent) {
          settings[dependent] = false;
          if (verifyBoxes[dependent]) verifyBoxes[dependent].checked = false;
        }
      }
      input.value=String(settings[key]); persist(); refresh(); reScan(true);
    });
    row.append(input); parent.append(row);
    return input;
  }
  function line(parent,text,cls='') { const p=node('p',cls,text); parent.append(p); return p; }
  function refresh() {
    if (!widget) return;
    fab.textContent = isActive() ? 'CLP · ₿' : 'CLP · OFF';
    const usd = usdClp(), euro = eurClp();
    const fxStatus = activeFX() ? `FX ${fx.updatedAt || dateTime(fx.fetchedAt)}` : 'FX sin datos recientes';
    const manual = [validPositive(settings.usdClpManual) ? 'USD manual' : '', validPositive(settings.eurClpManual) ? 'EUR manual' : ''].filter(Boolean).join(' · ');
    stateLabel.textContent = `${usd ? `USD ${formatCLP(usd)}` : 'USD —'} · ${euro ? `EUR ${formatCLP(euro)}` : 'EUR —'} · ${fxStatus}${manual ? ` · ${manual}` : ''}`;
    if (activeCrypto()) {
      const items = CRYPTOS.map(c => `1 ${c} ≈ ${toCLP(1,c) == null ? '—' : formatCLP(toCLP(1,c))}`);
      coinsLabel.textContent = items.join(' · ') + ` · ${crypto.source} ${dateTime(crypto.fetchedAt)}${validPositive(crypto.usdtUsd)?` · 1 USDT = ${formatDecimal(crypto.usdtUsd,5)} USD`:''}`;
      coinsLabel.classList.remove('clplens-warning');
    } else {
      coinsLabel.textContent = 'BTC/ETH/LTC: sin cotización reciente. Actualiza para mostrar cantidades.';
      coinsLabel.classList.add('clplens-warning');
    }
    renderCalc();
    renderCompact();
    renderHistory();
  }
  // v2.1: sincronizacion de la calculadora con opciones de compra seleccionadas.
  // La pagina permanece intacta; solo se lee el texto visible y nunca se inicia un pago.
  function originalText(element) {
    // Se omiten etiquetas de Moncevia al leer el precio original. De lo contrario,
    // las conversiones BTC/ETH/LTC inyectadas se confundirian con el precio.
    if (!element || (element.textContent||'').length>1600) return '';
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    const parts=[]; let text,count=0;
    while ((text=walker.nextNode()) && count++<120) {
      if (text.parentElement?.closest('#clplens-widget,.clplens-badge,[hidden],[aria-hidden="true"]')) continue;
      const str=(text.nodeValue||'').trim();
      if (str) parts.push(str);
    }
    return parts.join('\n').slice(0,650);
  }
  function matchesInText(rawText) {
    const text=String(rawText || '').replace(/[\u00a0\u202f]/g,' ').slice(0,650);
    const out=[];
    for (const [rx,isSuffix] of [[prefixRE,false],[suffixRE,true]]) {
      rx.lastIndex=0;
      let m;
      while ((m=rx.exec(text))) {
        const currency=isSuffix ? m[2].toUpperCase() : prefixCurrency(m[0].slice(0,m[0].indexOf(m[1])).trim());
        if (!currency) continue;
        const amount=parseAmount(m[1],currency);
        if (!Number.isFinite(amount) || amount < (CRYPTOS.includes(currency)?0.00000001:0.01)) continue;
        const before=text.slice(Math.max(0,m.index-18),m.index).toLowerCase();
        const after=text.slice(m.index+m[0].length,m.index+m[0].length+30).toLowerCase();
        const perUnit=/^\s*(?:per\s*(?:day|week|month|unit)|\/\s*(?:day|week|month)|por\s*(?:d[ií]a|semana|mes|unidad))\b/.test(after);
        const former=/(?:antes|original|was|regular|list price)\s*:?\s*$/.test(before);
        out.push({amount, code:currency, perUnit, former, index:m.index});
      }
    }
    // En tarjetas como RIFT hay un precio por dia y otro total. Preferir el total.
    return out.sort((a,b)=> a.index-b.index);
  }
  function bestVisiblePrice(element) {
    if (!element || element.nodeType!==1 || !element.isConnected) return null;
    if (element.closest('#clplens-widget, .clplens-badge, [data-clplens-ignore]')) return null;
    const raw=originalText(element);
    if (!raw || raw.length>650) return null;
    const matches=matchesInText(raw);
    if (!matches.length || matches.length>6 || matches.every(m=>m.perUnit || m.former)) return null;
    const chosen=[...matches].sort((a,b)=>{
      const score=m=>(m.perUnit?-100:0)+(m.former?-60:0)+(m.code==='BTC'||m.code==='ETH'||m.code==='LTC'?-5:0);
      return score(b)-score(a) || b.index-a.index; // preferir el precio vigente visible al final, no el mayor
    })[0];
    return chosen ? {amount:chosen.amount,code:chosen.code} : null;
  }
  function selectionLabel(text) {
    const lines=String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const idx=lines.findIndex(s=>/^selected\s+(?:access|option|plan|duration|item|product)\b/i.test(s) || /^opci[oó]n\s+seleccionada\b/i.test(s));
    if (idx>=0) {
      const next=lines.slice(idx+1).find(s=>!matchesInText(s).length && s.length<65);
      return next || 'Opcion seleccionada';
    }
    return 'Precio seleccionado';
  }
  function selectedSummaryPrice() {
    // Busca rótulos explicitos (como SELECTED ACCESS de RIFT), no precios arbitrarios.
    // Limitacion deliberada: si no hay una seleccion identificable se espera al toque del usuario.
    const tree=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let text, scanned=0;
    while ((text=tree.nextNode()) && scanned++<12000) {
      if (!/^\s*(?:selected\s+(?:access|option|plan|duration|item|product)|opci[oó]n\s+seleccionada)\s*:?\s*$/i.test(text.nodeValue||'')) continue;
      let el=text.parentElement;
      for (let depth=0; el && depth<6; depth++,el=el.parentElement) {
        if (el.closest('#clplens-widget, .clplens-badge')) break;
        const content=originalText(el);
        if (content.length>420) break;
        const price=bestVisiblePrice(el);
        if (price) return {...price, label:selectionLabel(content),source:'resumen'};
      }
    }
    return null;
  }
  function tappedPrice(target) {
    if (!target || target.nodeType!==1 || target.closest('#clplens-widget,.clplens-badge,[data-clplens-ignore],input,textarea,select,[contenteditable],form')) return null;
    // Buscar la tarjeta mas pequena que contenga el elemento tocado y un precio.
    // Así se puede pulsar el nombre del plan, no solo el numero en EUR.
    let el=target;
    for (let depth=0;el && depth<8;depth++,el=el.parentElement) {
      if (el===document.body) break;
      const price=bestVisiblePrice(el);
      if (price) {
        const parts=originalText(el).split(/\n/).map(s=>s.trim()).filter(Boolean);
        const label=parts.find(s=>/\b(?:key|plan|days?|weeks?|months?|lifetime|access)\b/i.test(s) && !matchesInText(s).length);
        return {...price,label:label||'Precio tocado',source:'toque'};
      }
    }
    return null;
  }
  function priceSignature(price) {
    return `${price.code}:${price.amount}:${price.label||''}`;
  }
  function updateSourceLabel() {
    if (!calcSource) return;
    if (!settings.autoSyncSelection) {
      calcSource.textContent='Sincronizacion desactivada · importe manual';
      return;
    }
    if (manualOverride) {
      calcSource.textContent='Importe manual · toca otra opcion de la pagina para retomar la sincronizacion';
      return;
    }
    if (currentSelection) {
      calcSource.textContent=`Automatico · ${currentSelection.label||'seleccion de la pagina'}`;
      return;
    }
    calcSource.textContent='Automatico activo · selecciona un precio de la pagina';
  }
  function applySelectedPrice(price) {
    if (!price || !settings.autoSyncSelection || manualOverride || !isActive()) return;
    if (!['EUR','USD','CLP','BTC','ETH','LTC'].includes(price.code) || !validPositive(price.amount)) return;
    const signature=priceSignature(price);
    if (lastAppliedSelection!==signature || String(settings.calcAmount)!==String(price.amount) || settings.calcCurrency!==price.code) {
      settings.calcAmount=String(price.amount);
      settings.calcCurrency=price.code;
      if (calcInput) calcInput.value=settings.calcAmount;
      if (calcSelect) calcSelect.value=price.code;
      lastAppliedSelection=signature;
      renderCalc();
      renderCompact();
    }
    currentSelection=price;
    updateSourceLabel();
    // Los importes autoseleccionados son locales a esta pagina; no se guardan
    // en las preferencias globales para evitar arrastrar precios de otro sitio.
  }
  function syncSelectedPrice() {
    if (!settings.autoSyncSelection || !isActive() || manualOverride) return;
    const selected=selectedSummaryPrice();
    if (pendingSelection) {
      const pending=pendingSelection;
      // Al pulsar la tarjeta, React puede tardar en actualizar el total.
      // Se conserva la seleccion tocada mientras cambia el resumen inferior.
      const same=Math.abs((selected?.amount||0)-pending.price.amount)<1e-9 && selected?.code===pending.price.code;
      const sameLabel=selected && pending.price.label!=='Precio tocado' && selected.label!=='Precio seleccionado' &&
        selected.label.toLowerCase().includes(pending.price.label.toLowerCase());
      if (same || sameLabel || Date.now()-pending.at>1100) {
        pendingSelection=null;
        applySelectedPrice(selected||pending.price);
      } else {
        applySelectedPrice(pending.price);
      }
      return;
    }
    if (selected) applySelectedPrice(selected);
  }
  function scheduleSelectionSync(delay=160) {
    if (!settings.autoSyncSelection || manualOverride) return;
    clearTimeout(selectionTimer);
    selectionTimer=setTimeout(syncSelectedPrice,delay);
  }
  function pageClickCapture(event) {
    if (pickerActive) {
      if (event.target?.closest?.('#clplens-widget')) {
        stopPicker();panel.hidden=false;refresh();return;
      }
      event.preventDefault(); event.stopImmediatePropagation();
      const price=tappedPrice(event.target);
      if (!price) return;
      pickerActive=false;
      document.body.classList.remove('clplens-picking');
      manualOverride=false; pendingSelection=null;
      if (settings.autoSyncSelection) applySelectedPrice(price);
      else {
        settings.calcAmount=String(price.amount);settings.calcCurrency=price.code;
        calcInput.value=settings.calcAmount;calcSelect.value=price.code;
        currentSelection=price;renderCalc();renderCompact();updateSourceLabel();
      }
      flashPrice(event.target);
      if (pickBtn) pickBtn.textContent='Elegir precio en pantalla';
      panel.hidden=false; tab='calculator'; activateTab('calculator');
      return;
    }
    if (!settings.autoSyncSelection || !isActive()) return;
    const price=tappedPrice(event.target);
    if (!price) {
      // Botones +/- de cantidad y selectores sin precio pueden alterar el total;
      // el resumen seleccionado se vuelve a leer al mutar la pagina.
      if (currentSelection) scheduleSelectionSync(240);
      return;
    }
    manualOverride=false;
    pendingSelection={price,at:Date.now(),seq:++clickSequence};
    applySelectedPrice(price);
    scheduleSelectionSync(130);
    setTimeout(()=>syncSelectedPrice(),450);
    setTimeout(()=>syncSelectedPrice(),1200);
  }
  function pageChangeCapture(event) {
    if (!settings.autoSyncSelection || !isActive() || event.target.closest?.('#clplens-widget')) return;
    manualOverride=false;
    pendingSelection=null;
    scheduleSelectionSync(180);
    setTimeout(()=>syncSelectedPrice(),500);
  }

  function flashPrice(target) {
    if (flashTarget) flashTarget.classList.remove('clplens-price-flash');
    clearTimeout(flashTimer);
    flashTarget=target?.closest?.('[role="option"],article,li,label,div') || target;
    flashTarget?.classList?.add('clplens-price-flash');
    flashTimer=setTimeout(()=>{
      flashTarget?.classList?.remove('clplens-price-flash');flashTarget=null;
    },1150);
  }
  function startPicker() {
    if (!settings.visualPick) return;
    pickerActive=true; panel.hidden=true;
    document.body.classList.add('clplens-picking');
    if (pickBtn) pickBtn.textContent='Cancelar selección visual';
  }
  function stopPicker() {
    pickerActive=false;
    document.body.classList.remove('clplens-picking');
    if (pickBtn) pickBtn.textContent='Elegir precio en pantalla';
  }
  function toFiatUnits(amount,code,fiat) {return toUnits(amount,code,fiat);}
  function getPaymentInfo(coin) {
    const exact=!!settings.exactPayEnabled && CRYPTOS.includes(settings.exactPayCurrency);
    if (exact && settings.exactPayCurrency!==coin) return null;
    const amount=exact ? Number(settings.exactPayAmount) : Number(settings.calcAmount);
    const currency=exact ? settings.exactPayCurrency : settings.calcCurrency;
    if (!validPositive(amount)) return null;
    const payable=toUnits(amount,currency,coin);
    const ask=activeCrypto() && crypto.source?.startsWith('Binance') ? Number(crypto.askUSDT?.[coin]) : null;
    const bid=activeCrypto() && crypto.source?.startsWith('Binance') ? Number(crypto.bidUSDT?.[coin]) : null;
    if (!validPositive(payable) || !validPositive(ask) || !validPositive(crypto.usdtUsd)) return null;
    const feeKnown=!!settings['feeKnown'+coin],
      withdrawFee=feeKnown ? Math.max(0,Number(settings['fee'+coin])||0) : 0;
    const exactUnits=exact ? coinMinor(settings.exactPayAmount) : null;
    const feeUnits=feeKnown ? coinMinor(String(settings['fee'+coin])) : 0n;
    if ((exact && exactUnits===null) || (feeKnown && feeUnits===null)) return null;
    const neededAtWallet= exact ? Number(exactUnits+feeUnits)/1e8 : ceil8(payable+withdrawFee);
    const spotKnown=!!settings.spotFeeKnown;
    const tradePct=spotKnown ? percent(settings.spotFeePct) : 0;
    const acquire=ceil8(neededAtWallet/(1-tradePct/100));
    const estimateUsdt=roundUp2(acquire*ask*(1+percent(settings.bufferPct)/100));
    const fundKnown=!!settings.usdtFundKnown;
    const usdToClp=usdClp();
    const clp=fundKnown && usdToClp && validPositive(crypto.usdtUsd) ? estimateUsdt*crypto.usdtUsd*usdToClp*(1+percent(settings.usdtFundPct)/100) : null;
    return {coin, currency,payable,ask,bid,feeKnown,withdrawFee,spotKnown,tradePct,fundKnown,
      neededAtWallet,acquire,estimateUsdt,clp,network:safeLabel(settings['network'+coin]||coin)};
  }
  function computePayment() {
    if (!transferOutput) return;
    transferOutput.replaceChildren();
    const exact=!!settings.exactPayEnabled;
    const coins=exact ? [settings.exactPayCurrency] : CRYPTOS;
    for (const coin of coins) {
      const v=getPaymentInfo(coin);
      if (!v) { transferOutput.append(node('div','clplens-warning',`${coin}: falta Binance Spot / USDT-USD vigente, o la cantidad tiene más de 8 decimales. No se estima retiro.`)); continue; }
      const block=node('div','clplens-payment');
      block.append(node('strong','',`${coin} · Red: ${v.network}`));
      block.append(node('div','',`Debe recibir: ${formatCoin(v.payable,coin)} ${coin}`));
      block.append(node('div','',`Retiro Binance: ${v.feeKnown?formatCoin(v.withdrawFee,coin)+' '+coin:'pendiente de verificar'}`));
      block.append(node('div','',`Saldo de cripto necesario: ${formatCoin(v.acquire,coin)} ${coin}${!v.feeKnown || !v.spotKnown?' (mínimo teórico, incompleto)':''}`));
      block.append(node('div','',`Compra Spot indicativa: ${formatDecimal(v.estimateUsdt)} USDT · mejor ask ${formatDecimal(v.ask,6)} USDT/${coin} (sin profundidad garantizada)`));
      if (!v.spotKnown) block.append(node('div','clplens-warning','Comisión Spot no verificada; configura el porcentaje real.'));
      if (!v.feeKnown) block.append(node('div','clplens-warning','Comisión/red de retiro no verificada; NO envíes esta cifra sin revisar Binance.'));
      if (v.fundKnown && v.clp!=null) block.append(node('div','',`Fondeo estimado: ${formatCLP(v.clp)} (USDT/USD ${formatDecimal(crypto.usdtUsd,5)}; sin cotización P2P real)`));
      else block.append(node('div','',`CLP del fondeo: no verificado (precio de compra USDT pendiente).`));
      transferOutput.append(block);
    }
    transferOutput.append(node('p','','Nunca transfieras usando solo esta simulación. Verifica importe recibido, red compatible, comisión final, disponibilidad y posible deslizamiento (slippage) en Binance.'));
  }
  function renderCompare() {
    if (!compareOutput) return;
    compareOutput.replaceChildren();
    const amount=Number(settings.calcAmount),code=settings.calcCurrency;
    const clp=toCLP(amount,code);
    if (!validPositive(clp)) {compareOutput.append(node('div','','Sin cambio válido para comparar.'));return;}
    const direct=[['Prex',withExtra(clp,'prex')],['Santander',withExtra(clp,'santander')]];
    for (const [name,value] of direct) compareOutput.append(node('div','',`${name}: ${formatCLP(value)} · margen configurado, no cargo real`));
    const verified=[];
    for (const [name,value] of direct) if (settings[name.toLowerCase()+'Known']) verified.push({name,cost:value});
    for (const coin of CRYPTOS) {
      const p=getPaymentInfo(coin);
      if (!p) continue;
      if (p.clp && p.feeKnown && p.spotKnown && p.fundKnown) verified.push({name:'Binance '+coin,cost:p.clp});
      compareOutput.append(node('div','',`Binance ${coin}: ${formatDecimal(p.estimateUsdt)} USDT ${p.feeKnown&&p.spotKnown?'estimados':'(faltan comisiones)'}${p.clp?' · '+formatCLP(p.clp):''}`));
    }
    if (verified.length>=2) {
      verified.sort((a,b)=>a.cost-b.cost);
      compareOutput.append(node('div','clplens-strong',`Menor estimación entre métodos marcados como verificados: ${verified[0].name} · ${formatCLP(verified[0].cost)}`));
    } else compareOutput.append(node('div','clplens-warning','Sin suficientes métodos verificados para identificar el menor costo estimado.'));
    compareOutput.append(node('p','clplens-warning','Compara solo importes cuyo costo real verificaste; se excluyen métodos incompletos. Nunca supone una cotización bancaria, P2P ni un retiro garantizado.'));
  }
  function renderCompact() {
    if (!compactCard) return;
    compactCard.hidden=!settings.compactMode || !isActive() || !panel.hidden;
    if (compactCard.hidden) return;
    compactCard.replaceChildren();
    const a=Number(settings.calcAmount), code=settings.calcCurrency;
    compactCard.append(node('div','clplens-mini-head',`${code} ${formatDecimal(a,8)} · ${activeCrypto()?crypto.source:'sin cripto reciente'}`));
    const clp=toCLP(a,code);
    compactCard.append(node('div','clplens-mini-big',clp!=null?formatCLP(clp):'Sin tasa CLP'));
    compactCard.append(node('div','',CRYPTOS.map(c=>`${c} ${formatCoin(toUnits(a,code,c),c)}`).join(' · ')));
    compactCard.append(node('div','clplens-mini-note',`Solo referencia · ${activeCrypto()?'cotización '+dateTime(crypto.fetchedAt):'cotización cripto caducada'}`));
  }
  function snapshotHistory() {
    const amount=Number(settings.calcAmount),code=settings.calcCurrency;
    if (!validPositive(amount) || !validPositive(toCLP(amount,code))) return;
    const entry={at:Date.now(),site:settings.historySite?HOST:'no guardado',amount,code,clp:toCLP(amount,code),
      cryptoSource:activeCrypto()?crypto.source:'no disponible',cryptoAt:crypto?.fetchedAt||null,
      fxAt:fx?.fetchedAt||null,units:Object.fromEntries(CRYPTOS.map(c=>[c,toUnits(amount,code,c)]))};
    history=[entry,...history].slice(0,30);
    void GM.setValue(HISTORY_KEY,history).catch(()=>{});
    renderHistory();
  }
  function renderHistory() {
    if (!historyOutput) return;
    historyOutput.replaceChildren();
    if (!history.length) {historyOutput.append(node('p','','Sin consultas guardadas. Solo se registra cuando pulsas Guardar; no se almacenan direcciones ni datos bancarios.'));return;}
    for (const record of history) {
      const row=node('div','clplens-record');
      const old=Number(record.clp),now=toCLP(Number(record.amount),record.code);
      const delta=old>0&&validPositive(now)?(now/old-1)*100:null;
      row.append(node('strong','',`${dateTime(record.at)} · ${safeLabel(record.site)} · ${record.amount} ${record.code}`));
      row.append(node('div','',`Entonces ${formatCLP(old)} · Ahora ${now!=null?formatCLP(now):'sin tasa'}`));
      row.append(node('div','',`Variación CLP ${delta!=null?(delta>=0?'+':'')+formatDecimal(delta,2)+' %':'no disponible'} · ${safeLabel(record.cryptoSource)}`));
      if (record.units && typeof record.units==='object') {
        const deltas=CRYPTOS.map(c=>{
          const oldUnits=Number(record.units[c]),current=toUnits(Number(record.amount),record.code,c);
          if (!validPositive(oldUnits)||!validPositive(current)) return `${c}: sin comparación`;
          const diff=100*(current/oldUnits-1);
          return `${c}: ${(diff>=0?'+':'')+formatDecimal(diff,2)} %`;
        });row.append(node('div','',`Variación en unidades cripto: ${deltas.join(' · ')}`));
      }
      const load=node('button','','Reutilizar');load.type='button';load.addEventListener('click',()=>{
        manualOverride=true;pendingSelection=null;settings.calcAmount=String(record.amount);settings.calcCurrency=record.code;
        calcInput.value=settings.calcAmount;calcSelect.value=record.code;persist();activateTab('calculator');refresh();updateSourceLabel();
      });row.append(load);historyOutput.append(row);
    }
  }
  function activateTab(next) {
    if (typeof window.clplensSelectTab==='function') window.clplensSelectTab(next);
  }

  function renderCalc() {
    if (!calcOutput) return;
    calcOutput.replaceChildren();
    const amount = Number(settings.calcAmount), code=settings.calcCurrency;
    if (!(Number.isFinite(amount) && amount > 0 && amount < 1e12)) {
      calcOutput.append(node('div','','Introduce un importe positivo.')); return;
    }
    const clp = toCLP(amount,code);
    if (clp != null) {
      calcOutput.append(node('div','',`CLP: ${formatCLP(clp)} (referencia)`));
      if (!CRYPTOS.includes(code)) {
        calcOutput.append(node('div','',`Prex: ${formatCLP(withExtra(clp,'prex'))} (estimación)`));
        calcOutput.append(node('div','',`Santander: ${formatCLP(withExtra(clp,'santander'))} (estimación)`));
      }
    } else calcOutput.append(node('div','','CLP: esperando cotización válida'));
    for (const coin of CRYPTOS) {
      const units = toUnits(amount,code,coin);
      if (units == null) { calcOutput.append(node('div','',`${coin}: sin cotización reciente`)); continue; }
      // Fee opcional en unidades de cripto. El comerciante puede imponer su propia tasa.
      const fee = Math.max(0,Math.min(1000,Number(settings['fee'+coin]) || 0));
      const total = units + fee;
      calcOutput.append(node('div','',`${coin}: ${formatCoin(units,coin)}${fee > 0 ? ` + red ${formatCoin(fee,coin)} = ${formatCoin(total,coin)}` : ''}`));
    }
    if (CRYPTOS.includes(code)) {
      const fee = Math.max(0,Number(settings['fee'+code]) || 0);
      if (clp != null && fee) calcOutput.append(node('div','',`Total ${code} + comisión configurada: ${formatCLP(toCLP(amount+fee,code))} CLP`));
    }
    if (clp != null) {
      const usd=toUnits(amount,code,'USD'), eur=toUnits(amount,code,'EUR');
      if (usd != null) calcOutput.append(node('div','',`USD: ${formatDecimal(usd)}`));
      if (eur != null) calcOutput.append(node('div','',`EUR: ${formatDecimal(eur)}`));
    }
    computePayment();renderCompare();renderCompact();
  }
  function createUI() {
    stylesheet();
    widget=node('div'); widget.id='clplens-widget';
    fab=node('button','','CLP · ₿'); fab.type='button'; fab.id='clplens-fab';
    fab.setAttribute('aria-label','Abrir Moncevia');
    panel=node('section'); panel.id='clplens-panel'; panel.hidden=true;
    panel.append(node('h2','','Moncevia · v3.2.0')); panel.setAttribute('aria-label','Calculadora de Moncevia');
    line(panel,'Conversiones orientativas, sin compras ni operaciones automáticas.');
    stateLabel=line(panel,'Consultando cambio…','clplens-strong');
    coinsLabel=line(panel,'Consultando criptomonedas…','clplens-strong');
    const sources=line(panel,'Fuentes: ');
    sources.append(makeLink('https://www.exchangerate-api.com','ExchangeRate-API'));
    sources.append(' · ');
    sources.append(makeLink('https://developers.binance.com/en/docs/binance-spot-api-docs/rest-api/market-data-endpoints','Binance Spot'));
    sources.append(' / ');
    sources.append(makeLink('https://www.coingecko.com/en/api','CoinGecko'));
    sources.append(' / ');
    sources.append(makeLink('https://www.coinbase.com','Coinbase'));

    const tabs=node('div','clplens-tabs');
    const buttonCalc=node('button','','Calculadora');
    const buttonSettings=node('button','','Ajustes');
    const buttonHistory=node('button','','Historial');
    buttonCalc.type=buttonSettings.type=buttonHistory.type='button';
    tabs.append(buttonCalc,buttonSettings,buttonHistory); panel.append(tabs);
    const pageCalc=node('div'),pageSettings=node('div'),pageHistory=node('div');
    const setTab = name => {
      tab=name;
      pageCalc.classList.toggle('clplens-hidden',name!=='calculator');
      pageSettings.classList.toggle('clplens-hidden',name!=='settings');
      pageHistory.classList.toggle('clplens-hidden',name!=='history');
      buttonCalc.setAttribute('aria-selected',String(name==='calculator'));
      buttonSettings.setAttribute('aria-selected',String(name==='settings'));
      buttonHistory.setAttribute('aria-selected',String(name==='history'));
      renderHistory();
    };
    buttonCalc.addEventListener('click',()=>setTab('calculator'));
    buttonSettings.addEventListener('click',()=>setTab('settings'));
    buttonHistory.addEventListener('click',()=>setTab('history'));
    window.clplensSelectTab=setTab;

    const field=node('label','clplens-field'); field.append(node('span','','Importe y moneda de origen'));
    const inputRow=node('div','clplens-inputrow');
    const amountInput=node('input'); calcInput=amountInput; amountInput.type='number'; amountInput.inputMode='decimal'; amountInput.step='any'; amountInput.min='0'; amountInput.value=String(settings.calcAmount);
    const select=node('select'); calcSelect=select;
    for (const code of ['EUR','USD','CLP','BTC','ETH','LTC']) {
      const option=node('option','',code); option.value=code; select.append(option);
    }
    select.value=settings.calcCurrency;
    amountInput.addEventListener('input',()=>{ manualOverride=true; pendingSelection=null; settings.calcAmount=amountInput.value; updateSourceLabel(); renderCalc(); });
    amountInput.addEventListener('change',()=>persist());
    select.addEventListener('change',()=>{ manualOverride=true; pendingSelection=null; settings.calcCurrency=select.value; updateSourceLabel(); persist(); renderCalc(); });
    inputRow.append(amountInput,select); field.append(inputRow); pageCalc.append(field);
    calcSource=line(pageCalc,'','clplens-strong');
    updateSourceLabel();
    const reselect=node('button','','Usar precio seleccionado'); reselect.type='button';
    reselect.addEventListener('click',()=>{
      manualOverride=false; pendingSelection=null;
      syncSelectedPrice(); updateSourceLabel();
    });
    const toolsRow=node('div','clplens-action-row');
    toolsRow.append(reselect);
    pickBtn=node('button','','Elegir precio en pantalla');pickBtn.type='button';
    pickBtn.addEventListener('click',()=>pickerActive?stopPicker():startPicker());toolsRow.append(pickBtn);
    const save=node('button','','Guardar consulta');save.type='button';save.addEventListener('click',snapshotHistory);toolsRow.append(save);
    const compactButton=node('button','','Modo compacto');compactButton.type='button';
    compactButton.addEventListener('click',()=>{settings.compactMode=!settings.compactMode;persist();panel.hidden=true;renderCompact();});
    toolsRow.append(compactButton);pageCalc.append(toolsRow);
    calcOutput=node('div','clplens-results'); calcOutput.setAttribute('aria-live','polite'); pageCalc.append(calcOutput);
    line(pageCalc,'Para un pago en criptomonedas: usa la cifra exacta exigida por el comercio si existe. Las tasas del sitio, spreads de compra, comisiones y redes pueden modificar el importe real.','clplens-warning');
    pageCalc.append(node('h2','','Simulador de pago con Binance'));
    exactToggle=checkbox(pageCalc,'Usar importe exacto solicitado en cripto',()=>settings.exactPayEnabled,v=>settings.exactPayEnabled=v);
    const exactField=node('label','clplens-field');exactField.append(node('span','','Cantidad que debe recibir el comercio'));
    const exactRow=node('div','clplens-inputrow');
    exactAmountInput=node('input');exactAmountInput.placeholder='Cantidad exacta del comercio';exactAmountInput.type='number';exactAmountInput.step='0.00000001';exactAmountInput.min='0';exactAmountInput.inputMode='decimal';exactAmountInput.value=String(settings.exactPayAmount);
    exactCurrencySelect=node('select');
    for (const c of CRYPTOS) {const o=node('option','',c);o.value=c;exactCurrencySelect.append(o);}exactCurrencySelect.value=settings.exactPayCurrency;
    exactAmountInput.addEventListener('input',()=>{settings.exactPayAmount=exactAmountInput.value;computePayment();renderCompare();});
    exactAmountInput.addEventListener('change',persist);
    exactCurrencySelect.addEventListener('change',()=>{settings.exactPayCurrency=exactCurrencySelect.value;persist();computePayment();renderCompare();});
    exactRow.append(exactAmountInput,exactCurrencySelect);exactField.append(exactRow);pageCalc.append(exactField);
    transferOutput=node('div','clplens-results');pageCalc.append(transferOutput);
    pageCalc.append(node('h2','','Comparación de pago'));
    compareOutput=node('div','clplens-results');pageCalc.append(compareOutput);
    line(pageCalc,'Las cifras con datos incompletos no son un monto seguro de transferencia. Binance solicita confirmar red, comisión y saldo recibido antes de autorizar un retiro.','clplens-warning');

    checkbox(pageSettings,'Conversión activada',()=>settings.enabled,v=>settings.enabled=v);
    checkbox(pageSettings,'Modo compacto al cerrar panel',()=>settings.compactMode,v=>settings.compactMode=v);
    checkbox(pageSettings,'Permitir selección visual de precios',()=>settings.visualPick,v=>settings.visualPick=v);
    checkbox(pageSettings,'Sincronizar importe con la opcion tocada',()=>settings.autoSyncSelection,v=>{
      settings.autoSyncSelection=v;
      if (v) { manualOverride=false; pendingSelection=null; scheduleSelectionSync(80); }
      updateSourceLabel();
    });
    checkbox(pageSettings,'Desactivar en este sitio',()=>settings.disabledSites.includes(HOST),v=>{
      settings.disabledSites=v ? [...new Set([...settings.disabledSites,HOST])] : settings.disabledSites.filter(x=>x!==HOST);
    });
    checkbox(pageSettings,'Guardar dominio en nuevas consultas de historial',()=>settings.historySite,v=>settings.historySite=v);
    checkbox(pageSettings,'Tratar $ como USD solo aquí',()=>settings.bareDollarSites.includes(HOST),v=>{
      settings.bareDollarSites=v ? [...new Set([...settings.bareDollarSites,HOST])] : settings.bareDollarSites.filter(x=>x!==HOST);
    });
    checkbox(pageSettings,'Mostrar BTC / ETH / LTC junto a precios',()=>settings.showCryptoInline,v=>settings.showCryptoInline=v);
    checkbox(pageSettings,'Comparar Prex / Santander en precios',()=>settings.compareInline,v=>settings.compareInline=v);
    verifyBoxes.prexKnown = checkbox(pageSettings,'Ajuste Prex verificado por ti',()=>settings.prexKnown,v=>settings.prexKnown=v);
    verifyBoxes.santanderKnown = checkbox(pageSettings,'Ajuste Santander verificado por ti',()=>settings.santanderKnown,v=>settings.santanderKnown=v);
    numberSetting(pageSettings,'1 USD en CLP (0 = automático)','usdClpManual',10000);
    numberSetting(pageSettings,'1 EUR en CLP (0 = automático)','eurClpManual',15000);
    numberSetting(pageSettings,'Ajuste Prex (%)','prexExtra',30);
    numberSetting(pageSettings,'Ajuste Santander (%)','santanderExtra',30);
    numberSetting(pageSettings,'Impuestos adicionales (%)','taxExtra',30);
    line(pageSettings,'Comisiones de retiro opcionales (cantidad de moneda, NO porcentaje). El valor depende de la red seleccionada y del exchange.');
    numberSetting(pageSettings,'Retiro BTC (BTC)','feeBTC',10,'0.00000001');
    numberSetting(pageSettings,'Retiro ETH (ETH)','feeETH',100,'0.00000001');
    numberSetting(pageSettings,'Retiro LTC (LTC)','feeLTC',100,'0.00000001');
    for (const c of CRYPTOS) {
      verifyBoxes['feeKnown'+c] = checkbox(pageSettings,`Comisión de retiro ${c} verificada`,()=>settings['feeKnown'+c],v=>settings['feeKnown'+c]=v);
      const nr=node('label');nr.append(node('span','',`Red de retiro ${c}`));
      const ni=node('input');ni.type='text';ni.maxLength=32;ni.value=settings['network'+c]||c;
      ni.addEventListener('change',()=>{
        const next = safeLabel(ni.value);
        if (settings['network'+c] !== next) {
          settings['feeKnown'+c] = false;
          if (verifyBoxes['feeKnown'+c]) verifyBoxes['feeKnown'+c].checked = false;
        }
        settings['network'+c] = next; persist(); refresh();
      });
      nr.append(ni);pageSettings.append(nr);
    }
    line(pageSettings,'Binance Spot: usamos el precio de venta (ask) para estimar cuánto cuesta comprar BTC/ETH/LTC con USDT. La comisión de trading depende de tu nivel y descuentos; no se presupone.');
    numberSetting(pageSettings,'Comisión de compra Spot (%)','spotFeePct',5,'0.001');
    verifyBoxes.spotFeeKnown = checkbox(pageSettings,'Comisión Spot verificada',()=>settings.spotFeeKnown,v=>settings.spotFeeKnown=v);
    numberSetting(pageSettings,'Recargo / coste de adquirir USDT (%)','usdtFundPct',30,'0.01');
    verifyBoxes.usdtFundKnown = checkbox(pageSettings,'Costo de fondeo USDT verificado',()=>settings.usdtFundKnown,v=>settings.usdtFundKnown=v);
    numberSetting(pageSettings,'Margen adicional de fluctuación (%)','bufferPct',20,'0.01');
    line(pageSettings,'Al cambiar una comisión, un margen bancario o una red se desmarca su verificación anterior. Confirma el dato nuevo directamente antes de marcarlo otra vez.');
    line(pageSettings,'El simulador NO puede obtener comisiones privadas de retiro de tu cuenta Binance sin autenticación. Nunca introduzcas API keys en este script. Comprueba red, comisión, mínimo, habilitación y monto recibido en Binance.');
    line(pageSettings,'La comparación de tarjetas aplica un porcentaje configurado sobre CLP. No constituye una cotización oficial de Prex o Santander. Las comisiones de retiro no se aplican automáticamente al texto de los precios.');
    line(pageSettings,'El importe se actualiza cuando tocas una opcion con precio o cuando cambia un resumen de seleccion reconocido (por ejemplo SELECTED ACCESS). Si escribes manualmente, se mantiene tu cifra hasta tocar otra opcion o pulsar Usar precio seleccionado.');
    line(pageSettings,'Activación por sitio: RIFT se permite inicialmente. En otras webs compatibles debes autorizar Moncevia expresamente. No se ejecuta el detector ni se consulta ninguna API antes de activar.');
    line(pageSettings,'Binance publica pares en USDT; el cambio de USDT a USD se obtiene por separado. Si falta, se deshabilita la conversión cruzada de Binance. Los retiros necesitan verificar red, mínimo y comisión en Binance.');
    line(pageSettings,'No actúa en dominios .cl, sitios financieros protegidos ni rutas de pago. $ sin prefijo solo se trata como USD cuando lo autorices para este sitio.');

    // La revocación borra la autorización para este dominio y vuelve a cargar
    // para desmontar observadores, estilos y conversiones actuales.
    const revokeSite = node('button','','Revocar acceso a este sitio');
    revokeSite.type = 'button';
    revokeSite.addEventListener('click',async()=>{
      if (!window.confirm('¿Revocar acceso de Moncevia a este dominio?')) return;
      settings.allowedSites=settings.allowedSites.filter(host=>host!==HOST);
      settings.disabledSites=settings.disabledSites.filter(host=>host!==HOST);
      try {await GM.setValue(SETTINGS_KEY,JSON.parse(JSON.stringify(settings)));}
      catch(e) { window.alert('No fue posible guardar la revocación.');return; }
      location.reload();
    });
    pageSettings.append(revokeSite);

    historyOutput=node('div');pageHistory.append(historyOutput);
    const clearHistory=node('button','','Borrar historial local');clearHistory.type='button';
    clearHistory.addEventListener('click',async()=>{
      if (!window.confirm('¿Borrar las consultas guardadas en Moncevia?')) return;
      history=[];try{await GM.setValue(HISTORY_KEY,[]);}catch(e){}renderHistory();
    });pageHistory.append(clearHistory);
    const exportHistory = node('button','','Exportar historial CSV');
    exportHistory.type='button';
    exportHistory.addEventListener('click',()=>{
      if (!history.length) {window.alert('No hay consultas guardadas.');return;}
      // Escapa fórmulas para que Excel/Sheets no interpreten datos del sitio como instrucciones.
      const cell = value => {
        let str=String(value ?? '').replace(/[\r\n]/g,' ');
        if (/^\s*[=+\-@]/.test(str)) str="'"+str;
        return '"'+str.replace(/"/g,'""')+'"';
      };
      const rows=[['fecha_utc','sitio','importe','moneda','clp_estimado','fuente_cripto','btc','eth','ltc']];
      for (const h of history) rows.push([
        new Date(h.at).toISOString(),h.site||'',h.amount,h.code,h.clp,h.cryptoSource||'',
        h.units?.BTC ?? '',h.units?.ETH ?? '',h.units?.LTC ?? ''
      ]);
      const csv='\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
      const a=node('a');a.href=url;a.download='moncevia_historial.csv';
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    });
    pageHistory.append(exportHistory);
    line(pageHistory,'Los datos se conservan localmente en Userscripts. No se envían tus consultas ni direcciones a servidores. Las tasas futuras se comparan solo al abrir el historial.');
    panel.append(pageCalc,pageSettings,pageHistory);
    setTab(tab);
    const actions=node('div','clplens-actions');
    const refreshBtn=node('button','','Actualizar tasas');
    const closeBtn=node('button','','Cerrar');
    refreshBtn.addEventListener('click',async()=>{
      refreshBtn.disabled=true; refreshBtn.textContent='Consultando…';
      try { await Promise.all([updateFX(true),updateCrypto(true)]); }
      finally { refreshBtn.disabled=false; refreshBtn.textContent='Actualizar tasas'; }
    });
    closeBtn.addEventListener('click',()=>{ panel.hidden=true;renderCompact(); });
    actions.append(refreshBtn,closeBtn); panel.append(actions);
    fab.addEventListener('click',()=>{ if (pickerActive) stopPicker();panel.hidden=!panel.hidden; refresh();renderCompact(); });
    compactCard=node('div');compactCard.id='clplens-compact';compactCard.hidden=true;
    compactCard.addEventListener('click',()=>{panel.hidden=false;refresh();renderCompact();});
    widget.append(panel,compactCard,fab); document.body.append(widget);
    refresh();
  }

  function skipText(textNode) {
    const parent=textNode.parentElement;
    if (!parent || !parent.isConnected || !textNode.nodeValue || textNode.nodeValue.length > 135) return true;
    if (!/[0-9]/.test(textNode.nodeValue) || !/[€$£¥₿ΞŁA-Za-z]/.test(textNode.nodeValue)) return true;
    if (parent.closest('#clplens-widget, .clplens-badge, [data-clplens-ignore], [contenteditable], [hidden], [aria-hidden="true"], form, [role="dialog"], [role="textbox"]')) return true;
    if (parent.closest('button, a, input, option, select, textarea, script, style, noscript, pre, code, svg, title')) return true;
    if (parent === document.body || parent === document.documentElement) return true;
    const style = window.getComputedStyle(parent);
    return style.display==='none' || style.visibility==='hidden' || !parent.getClientRects().length;
  }
  function createBadge(lines) {
    const badge=node('span','clplens-badge');
    badge.dataset.clplensBadge='2';
    badge.setAttribute('aria-label','Conversion aproximada de Moncevia');
    for (const line of lines) badge.append(node('span','',line));
    return badge;
  }
  function scan() {
    if (!isActive()) return;
    let checked=0,badges=0;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode=walker.nextNode()) && checked++ < SCAN_LIMIT && badges < BADGE_LIMIT) {
      if (skipText(textNode)) continue;
      const match=detectMoney(textNode.nodeValue);
      // Inyectar inmediatamente despues del nodo TEXT, no despues del contenedor:
      // funciona en precios anidados como la tarjeta €24.99 de RIFT.
      const adjacent=textNode.nextSibling;
      const existing = adjacent && adjacent.nodeType===1 && adjacent.classList.contains('clplens-badge') && adjacent.dataset.clplensBadge==='2' ? adjacent : null;
      const lines=match ? badgeText(match) : null;
      if (!lines) { if (existing) existing.remove(); continue; }
      if (existing) {
        const old=[...existing.children].map(x=>x.textContent);
        if (old.join('\n') !== lines.join('\n')) existing.replaceChildren(...lines.map(s=>node('span','',s)));
      } else {
        textNode.parentNode.insertBefore(createBadge(lines),textNode.nextSibling);
      }
      badges++;
    }
  }
  function reScan(force=false) {
    if (force) document.querySelectorAll('.clplens-badge[data-clplens-badge="2"]').forEach(n=>n.remove());
    clearTimeout(timer);
    timer=setTimeout(scan,force?70:550);
  }
  function ownMutation(change) {
    if (change.target?.nodeType===1 && change.target.closest('#clplens-widget,.clplens-badge')) return true;
    if (change.target?.parentElement?.closest?.('#clplens-widget,.clplens-badge')) return true;
    if (change.type==='childList') {
      const changed=[...change.addedNodes,...change.removedNodes];
      if (changed.length && changed.every(n=>n.nodeType===1 && (n.matches?.('#clplens-widget,.clplens-badge') || n.closest?.('#clplens-widget,.clplens-badge')))) return true;
    }
    return false;
  }
  async function requestJSON(url) {
    const result=await GM.xmlHttpRequest({ method:'GET',url, timeout:11000,responseType:'text',headers:{Accept:'application/json'} });
    if (!result || result.status!==200) throw Error('HTTP '+result?.status);
    return JSON.parse(result.responseText || result.response);
  }
  async function updateFXImpl(force=false) {
    if (!force && inDate(fx,FX_TTL)) return;
    try {
      const data=await requestJSON('https://open.er-api.com/v6/latest/USD');
      const providerTime = Number(data.time_last_update_unix) * 1000;
      if (data.result!=='success' || data.base_code!=='USD' || !validPositive(data.rates?.CLP) || !validPositive(data.rates?.EUR) ||
          !Number.isFinite(providerTime) || providerTime > Date.now()+3600_000 || Date.now()-providerTime > 7*86400_000)
        throw Error('FX invalida u obsoleta');
      const rates={};
      for (const c of [...FIAT,'CLP']) if (validPositive(data.rates[c])) rates[c]=Number(data.rates[c]);
      fx={ fetchedAt:Date.now(),updatedAt:dateTime(Number(data.time_last_update_unix)*1000 || Date.now()),rates };
      await GM.setValue(FX_KEY,fx);
    } catch(e) { console.info('[Moncevia] FX no disponible:',e?.message || e); }
    refresh(); reScan(true);
  }
  async function updateCryptoImpl(force=false) {
    if (!force && inDate(crypto,CRYPTO_TTL) && activeCrypto() && crypto.source?.startsWith('Binance')) return;
    // Binance Spot publica ask/bid de los pares USDT, sin credenciales.
    // USDT no es USD: sus precios se usan como aproximación al convertir a CLP.
    const binanceHosts=['https://data-api.binance.vision','https://api.binance.com'];
    try {
      let data=null;
      for (const host of binanceHosts) {
        try {
          data=await Promise.all(CRYPTOS.map(coin=>requestJSON(`${host}/api/v3/ticker/bookTicker?symbol=${coin}USDT`)));
          break;
        } catch(err) { console.info('[Moncevia] Fuente Spot no accesible:',host); }
      }
      if (!data || data.length!==3) throw Error('Binance no disponible');
      // El libro de Binance cotiza en USDT, no USD. Validar paridad desde fuente externa.
      const tether=await requestJSON('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd&include_last_updated_at=true');
      const usdtUsd=Number(tether?.tether?.usd), tetherTime=Number(tether?.tether?.last_updated_at)*1000;
      if (!validPositive(usdtUsd) || usdtUsd<0.8 || usdtUsd>1.2 ||
          !Number.isFinite(tetherTime) || Math.abs(Date.now()-tetherTime)>CRYPTO_STALE)
        throw Error('USDT/USD sin cotizacion verificable');
      const usd={},askUSDT={},bidUSDT={};
      CRYPTOS.forEach((coin,index)=>{
        const r=data[index];
        if (r.symbol!==`${coin}USDT` || !validPositive(r.askPrice) || !validPositive(r.bidPrice) ||
          Number(r.askPrice)<Number(r.bidPrice)) throw Error('Binance ticker no válido '+coin);
        const ask=Number(r.askPrice),bid=Number(r.bidPrice);
        if (ask/bid>1.15) throw Error('Spread extremo '+coin);
        askUSDT[coin]=ask;bidUSDT[coin]=bid;usd[coin]=(ask+bid)*0.5*usdtUsd;
      });
      crypto={fetchedAt:Date.now(),quotedAt:Date.now(),source:'Binance Spot + CoinGecko USDT/USD',usdtUsd,usd,askUSDT,bidUSDT};
      await GM.setValue(CRYPTO_KEY,crypto);
    } catch(err) {
      console.info('[Moncevia] Binance no disponible, intentando CoinGecko:',err?.message||err);
      try {
        const data=await requestJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Clitecoin&vs_currencies=usd&include_last_updated_at=true');
        const usd={};let quotedAt=Infinity;
        for (const coin of CRYPTOS) {
          const item=data[COIN_ID[coin]];
          if (!validPositive(item?.usd)) throw Error('Falta '+coin);
          const at=Number(item.last_updated_at)*1000;
          if (Math.abs(Date.now()-at)>CRYPTO_STALE) throw Error('Cotización obsoleta '+coin);
          usd[coin]=Number(item.usd);quotedAt=Math.min(quotedAt,at);
        }
        crypto={fetchedAt:Date.now(),quotedAt,source:'CoinGecko (USD, respaldo)',usd};
        await GM.setValue(CRYPTO_KEY,crypto);
      } catch (e) {
        console.info('[Moncevia] CoinGecko no disponible; intentando Coinbase:',e?.message||e);
        try {
          const result=await Promise.all(CRYPTOS.map(c=>requestJSON(`https://api.coinbase.com/v2/prices/${c}-USD/spot`)));
          const usd={};result.forEach((b,i)=>{
            const c=CRYPTOS[i];if (b?.data?.base!==c||b?.data?.currency!=='USD'||!validPositive(b.data.amount))throw Error('Coinbase no válido '+c);
            usd[c]=Number(b.data.amount);
          });
          crypto={fetchedAt:Date.now(),source:'Coinbase (USD, respaldo)',usd};
          await GM.setValue(CRYPTO_KEY,crypto);
        } catch(error) {console.info('[Moncevia] Cotización cripto no disponible:',error?.message||error);}
      }
    }
    refresh(); reScan(true);
  }
  async function updateFX(force=false) {
    if (!force && inDate(fx,FX_TTL)) return;
    if (fxRequest) return fxRequest;
    fxRequest = updateFXImpl(force);
    try {return await fxRequest;} finally {fxRequest = null;}
  }
  async function updateCrypto(force=false) {
    if (!force && inDate(crypto,CRYPTO_TTL) && activeCrypto() && crypto.source?.startsWith('Binance')) return;
    if (cryptoRequest) return cryptoRequest;
    cryptoRequest = updateCryptoImpl(force);
    try {return await cryptoRequest;} finally {cryptoRequest = null;}
  }
  async function boot() {
    try {
      const previous=await GM.getValue(SETTINGS_KEY,null);
      if (previous && typeof previous==='object' && !Array.isArray(previous)) settings={...DEFAULTS,...previous};
      for (const key of ['bareDollarSites','disabledSites','allowedSites']) if (!Array.isArray(settings[key])) settings[key]=[];
      settings.allowedSites=settings.allowedSites.filter(host=>typeof host==='string' && /^[a-z0-9.-]{1,255}$/.test(host)).slice(0,100);
      const oldFX=await GM.getValue(FX_KEY,null);
      if (oldFX && Number.isFinite(oldFX.fetchedAt) && validPositive(oldFX.rates?.CLP)) fx=oldFX;
      const hist=await GM.getValue(HISTORY_KEY,[]);history=Array.isArray(hist)?hist.slice(0,30).filter(e=>Number.isFinite(e.at)&&typeof e.code==='string'&&validPositive(e.amount)&&validPositive(e.clp)):[];
      const oldCrypto=await GM.getValue(CRYPTO_KEY,null);
      if (oldCrypto && Number.isFinite(oldCrypto.fetchedAt) && CRYPTOS.every(c=>validPositive(oldCrypto.usd?.[c])) &&
        (!oldCrypto.source?.startsWith('Binance') || validPositive(oldCrypto.usdtUsd))) crypto=oldCrypto;
    } catch(e) { console.info('[Moncevia] Almacenamiento no disponible:',e?.message||e); }
    // Solo el dominio explícitamente autorizado recibe escaneo, panel completo o peticiones de FX.
    if (!isAuthorized()) {
      const opt=node('button','','Moncevia · activar aquí');
      opt.id='moncevia-optin'; opt.type='button';
      opt.setAttribute('aria-label','Permitir Moncevia en este dominio');
      Object.assign(opt.style,{position:'fixed',bottom:'max(12px,env(safe-area-inset-bottom))',right:'10px',zIndex:'2147483645',font:'12px system-ui',color:'#e2e8f0',background:'#1e293b',padding:'9px 11px',border:'1px solid #64748b',borderRadius:'18px',opacity:'0.85'});
      opt.addEventListener('click',()=>{
        settings.allowedSites=[...new Set([...settings.allowedSites,HOST])];
        persist();opt.remove();startRuntime();
      });
      document.body.append(opt);
      return;
    }
    startRuntime();
  }
  function startRuntime() {
    if (document.getElementById('clplens-widget')) return;
    createUI(); scan();renderHistory();renderCompact();
    document.addEventListener('click',pageClickCapture,true);
    document.addEventListener('keydown',event=>{if(pickerActive && event.key==='Escape'){stopPicker();panel.hidden=false;refresh();}},true);
    document.addEventListener('change',pageChangeCapture,true);
    document.addEventListener('keydown',event=>{
      if (event.key==='Escape' && panel && !panel.hidden) {panel.hidden=true;fab.focus();renderCompact();}
    },true);
    window.addEventListener('scroll',()=>reScan(),{passive:true});
    scheduleSelectionSync(180);
    observer=new MutationObserver(changes=>{
      if (changes.every(ownMutation)) return;
      reScan();
      scheduleSelectionSync(160);
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    const syncRates = () => {
      if (document.visibilityState === 'visible' && isActive()) {
        void Promise.all([updateFX(false),updateCrypto(false)]);
        refresh(); reScan(true);
      }
    };
    window.addEventListener('pageshow',syncRates);
    document.addEventListener('visibilitychange',syncRates);
    window.setInterval(syncRates, 10 * 60_000);
    if (isActive()) void Promise.all([updateFX(false),updateCrypto(false)]);
  }
  boot();
})();