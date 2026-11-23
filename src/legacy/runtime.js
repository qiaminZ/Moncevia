import MONCEVIA_CSS from '../styles/moncevia.css';
import { parseAmount } from '../core/parse-amount';
import { createConversionEngine } from '../core/conversion';
import { coinMinor, ceil8, roundUp2 } from '../core/crypto-units';
import { validateFXResponse } from '../core/fx-validation';
import { validateUSDTParity, validateBinanceSnapshot, validateCoinGeckoSnapshot, validateCoinbaseSnapshot } from '../core/provider-validation';
import { resolveLanguage, translateUI } from '../i18n/catalog';
import { createUILocalizer } from '../i18n/localizer';
import { createPriceScanner } from '../detector/scan-controller';
import { createTabController } from '../ui/tab-controller';
import { createFabController } from '../ui/fab-controller';
import { createNode, createExternalLink, appendLine, appendDisclosure, createCardRow, appendEmbeddedStyles } from '../ui/dom-factory';
import { createPanelShell } from '../ui/panel-shell';
import { createPageLifecycle } from '../platform/page-lifecycle';
import { createGMBridge } from '../platform/gm-bridge';
import { createPersistenceController, MONCEVIA_STORAGE_KEYS } from '../platform/persistence-controller';
import { createVariantDetector } from '../detector/variant-detector';
import { createSelectionScheduler } from '../detector/selection-scheduler';
(() => {
  'use strict';
  // No accede a cookies, formularios, credenciales, wallets ni API privadas.
  // Solo solicita cotizaciones publicas; nunca efectua compras o transferencias.
  // Typed, per-operation adapter supports modern Promise-based GM and legacy GM_* callbacks.
  const storage = createGMBridge({
    modern: typeof GM !== 'undefined' && GM !== null ? GM : null,
    legacy: {
      getValue: typeof GM_getValue === 'function' ? GM_getValue : undefined,
      setValue: typeof GM_setValue === 'function' ? GM_setValue : undefined,
      xmlHttpRequest: typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : undefined
    }
  });
  if (window.top !== window.self || !storage) return;

  // Safari Userscripts may execute before <body> exists despite document-idle.
  // Wait without using page storage or issuing network requests prematurely.
  function initializeAfterBody() {
    if (!document.body) return;

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

  const FX_KEY = MONCEVIA_STORAGE_KEYS.fx;
  const CRYPTO_KEY = MONCEVIA_STORAGE_KEYS.crypto;
  const FX_TTL = 12 * 3600_000;
  const FX_STALE = 3 * 86400_000;
  const CRYPTO_TTL = 5 * 60_000;
  const CRYPTO_STALE = 45 * 60_000;
  const SCAN_LIMIT = 3500, BADGE_LIMIT = 100;
  const FIAT = ['USD','EUR','GBP','CAD','AUD','JPY','KRW','BRL','CNY'];
  const CRYPTOS = ['BTC','ETH','LTC'];
  const DEFAULTS = {
    enabled:true, disabledSites:[], bareDollarSites:[], dollarCurrencySites:{}, allowedSites:['shop.riftbot.org'], historySite:false, compareInline:false,
    usdClpManual:0, eurClpManual:0, prexExtra:0, santanderExtra:0, taxExtra:0,
    showCryptoInline:true, autoSyncSelection:true,
    feeBTC:0, feeETH:0, feeLTC:0,
    feeKnownBTC:false,feeKnownETH:false,feeKnownLTC:false,
    networkBTC:'Bitcoin',networkETH:'Ethereum',networkLTC:'Litecoin',
    spotFeePct:0,spotFeeKnown:false,usdtFundPct:0,usdtFundKnown:false,bufferPct:0,
    compactMode:false,visualPick:true,prexKnown:false,santanderKnown:false,
    exactPayEnabled:false,exactPayAmount:'',exactPayCurrency:'LTC',
    calcAmount:'24.99', calcCurrency:'EUR', targetCurrency:'CLP', language:'auto', fabPosition:null
  };
  let settings = { ...DEFAULTS }, fx = null, crypto = null;
  let widget, fab, panel, stateLabel, sampleLabel, coinsLabel, calcOutput, calcInput, calcSelect, targetSelect, calcSource;
  let compactCard, compareOutput, transferOutput, historyOutput, history=[], pickBtn, exactAmountInput, exactCurrencySelect, exactToggle;
  let pickerActive=false, flashTarget=null, flashTimer=null, pendingTab='calculator';
  let tab = 'calculator';
  let panelOpenTicket = 0;
  let settingsBankGroup = null;
  const verifyBoxes = Object.create(null);
  let fxRequest = null, cryptoRequest = null;
  let manualOverride = false, pendingSelection = null, pendingVariantChange = null, currentSelection = null;
  let lastAppliedSelection = '', clickSequence = 0;
  // UI language is kept separately from price parsing, which remains locale-independent.
  // 'auto' follows Safari's preferred language, defaulting to English outside Spanish locales.
  let languageButton = null, languageSelect = null;
  // UI localization is independent of product price parsing and persists ES originals.
  const uiLanguage = () => resolveLanguage(
    settings.language, navigator.languages?.[0] || navigator.language || 'en'
  );
  const uiLocalizer=createUILocalizer({
    root:()=>widget || null,
    language:uiLanguage,
    languageButton:()=>languageButton,
    languageSelect:()=>languageSelect,
    savedPreference:()=>settings.language
  });
  const tr=raw=>translateUI(raw,uiLanguage());
  const localizeUI=()=>uiLocalizer.localize();
  function switchLanguage(next) {
    settings.language = ['auto','es','en'].includes(next) ? next : 'auto';
    persist();
    localizeUI();
    refresh();
    localizeUI();
  }
  function watchLocalization() { uiLocalizer.watch(); }
  const formatCLP = v => Number.isFinite(v) ? new Intl.NumberFormat(uiLanguage()==='en'?'en-US':'es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(Math.round(v)) : '—';
  const formatDecimal = (v, digits = 2) => new Intl.NumberFormat(uiLanguage()==='en'?'en-US':'es-CL', { maximumFractionDigits:digits, minimumFractionDigits:0 }).format(v);
  const SUPPORTED_CURRENCIES = ['CLP',...FIAT,...CRYPTOS];
  const targetFallback = source => source === 'CLP' ? 'USD' : 'CLP';
  const formatConversion = (amount, code) => {
    if (!Number.isFinite(amount)) return '—';
    if (code === 'CLP') return formatCLP(amount);
    if (CRYPTOS.includes(code)) return `${code} ${formatCoin(amount,code)}`;
    const digits = (code === 'JPY' || code === 'KRW') ? 0 : 2;
    return `${code} ${new Intl.NumberFormat(uiLanguage()==='en'?'en-US':'es-CL', {minimumFractionDigits:digits, maximumFractionDigits:digits}).format(amount)}`;
  };
  const percent = v => Math.max(0, Math.min(30, Number(v) || 0));
  const validPositive = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const isAuthorized = () => settings.allowedSites.includes(HOST);
  const isActive = () => isAuthorized() && settings.enabled && !settings.disabledSites.includes(HOST);
  const inDate = (obj, time) => obj && Number.isFinite(obj.fetchedAt) && Date.now() - obj.fetchedAt >= 0 && Date.now() - obj.fetchedAt < time;
  // Rate calculations are pure, typed and receive a fresh immutable state snapshot.
  const conversion = () => createConversionEngine({ settings, fx, crypto, now: Date.now() });
  const activeCrypto = () => conversion().activeCrypto();
  const activeFX = () => conversion().activeFX();

  // Evita confundir 1.234,56 con 1,234.56 y conserva 8 decimales en criptomonedas.
  // Currency parser lives in src/core/parse-amount.ts (strictly typed).
  const figure = String.raw`(?:\d{1,3}(?:[.,\s\u00a0\u202f]\d{3})+(?:[.,]\d{1,8})?|\d+(?:[.,]\d{1,8})?)`;
  const prefixRE = new RegExp(String.raw`(?<![\p{L}\d])(?:US\$|U\$S|USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC|R\$|€|£|¥|₿|Ξ|Ł|\$)\s*(${figure})(?![\p{L}\d])`, 'giu');
  const suffixRE = new RegExp(String.raw`(?<![\p{L}\d])(${figure})\s*(USD|EUR|GBP|CAD|AUD|JPY|KRW|BRL|CNY|BTC|ETH|LTC)(?![\p{L}\d])`, 'giu');
  function dollarCurrencyForSite() {
    const choice=settings.dollarCurrencySites?.[HOST];
    return ['USD','CLP','CAD','AUD'].includes(choice)?choice:
      (settings.bareDollarSites.includes(HOST)?'USD':null); // backwards compatible
  }
  function prefixCurrency(prefix) {
    const s = prefix.toUpperCase();
    if (s === '€') return 'EUR';
    if (s === '£') return 'GBP';
    if (s === '₿') return 'BTC';
    if (s === 'Ξ') return 'ETH';
    if (s === 'Ł') return 'LTC';
    if (s === '¥') return HOST.endsWith('.jp') ? 'JPY' : (HOST.endsWith('.cn') ? 'CNY' : null);
    if (s === 'R$') return 'BRL';
    if (s === '$') return dollarCurrencyForSite();
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

  // Legacy UI/API integration delegates to the same typed conversion engine.
  const fiatUsd = (amount, code) => conversion().fiatUsd(amount, code);
  const usdClp = () => conversion().usdClp();
  const eurClp = () => conversion().eurClp();
  const toCLP = (amount, code) => conversion().toCLP(amount, code);
  const toUnits = (amount, fromCode, toCode) => conversion().toUnits(amount, fromCode, toCode);
  const spotAsk = coin => conversion().spotAsk(coin);
  const spotBid = coin => conversion().spotBid(coin);

  // Valores ingresados para retiro se suman como unidades enteras de 10^-8:
  // evita la suma flotante de cantidad exacta y comisión indicada por el usuario.
  // Crypto unit arithmetic and 2-decimal estimates are typed in core/crypto-units.ts.
  const safeLabel = s => String(s||'').replace(/[<>\r\n]/g,' ').slice(0,45);

  function formatCoin(value, code) {
    if (!Number.isFinite(value)) return '—';
    const digits = 8; // No truncar cotizaciones exactas de LTC como 0.53340448.
    if (value > 0 && value < Math.pow(10, -digits)) return `<${Math.pow(10,-digits).toFixed(digits)}`;
    return value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  }
  const withExtra = (value, kind) => value * (1 + (percent(settings[kind+'Extra']) + percent(settings.taxExtra))/100);
  const dateTime = time => new Date(time).toLocaleString(uiLanguage()==='en'?'en-US':'es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });

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

  // UI DOM primitives now live in independently typed, browser-scoped components.
  const node=createNode;
  const line=appendLine;
  const disclosure=appendDisclosure;
  const cardRow=createCardRow;
  // Durable preferences and history are serialized by the typed persistence controller.
  const persistence=createPersistenceController({
    storage,defaults:DEFAULTS,
    onError:(key,error)=>console.info('[Moncevia] Almacenamiento '+key+':',error?.message||error)
  });
  const persist=()=>persistence.saveSettings(settings);
  // The launcher now uses a strictly typed controller. Settings and storage keys stay unchanged.
  const fabController=createFabController({
    button:()=>fab,
    position:()=>settings.fabPosition,
    onPosition:position=>{settings.fabPosition=position;},
    persist
  });
  const restoreFabPosition=()=>fabController.restore();
  const resetFabPosition=(save=true)=>fabController.reset(save);
  const enableFabDragging=()=>fabController.enable();
  function stylesheet() { appendEmbeddedStyles(MONCEVIA_CSS); }
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
  function refresh() {
    if (!widget) return;
    fab.textContent = isActive() ? 'CLP · ₿' : 'CLP · OFF';
    const usd = usdClp(), euro = eurClp();
    const fxStatus = activeFX() ? `FX ${fx.updatedAt || dateTime(fx.fetchedAt)}` : 'FX sin datos recientes';
    const manual = [validPositive(settings.usdClpManual) ? 'USD manual' : '', validPositive(settings.eurClpManual) ? 'EUR manual' : ''].filter(Boolean).join(' · ');
    stateLabel.textContent = `${activeFX() ? 'Divisas al día' : 'Divisas sin actualizar'} · ${activeCrypto() ? 'Cripto al día' : 'Cripto pendiente'}${manual ? ' · cambio manual' : ''}`;
    if (stateLabel.previousElementSibling?.classList?.contains('mv-dot')) stateLabel.previousElementSibling.classList.toggle('mv-stale',!activeFX() || !activeCrypto());
    if (activeCrypto()) {
      const items = CRYPTOS.map(c => `1 ${c} ≈ ${toCLP(1,c) == null ? '—' : formatCLP(toCLP(1,c))}`);
      coinsLabel.textContent = items.join(' · ') + ` · ${crypto.source} ${dateTime(crypto.fetchedAt)}${validPositive(crypto.usdtUsd)?` · 1 USDT = ${formatDecimal(crypto.usdtUsd,5)} USD`:''}`;
      coinsLabel.classList.remove('clplens-warning');
    } else {
      coinsLabel.textContent = 'BTC/ETH/LTC: sin cotización reciente. Actualiza para mostrar cantidades.';
      coinsLabel.classList.add('clplens-warning');
    }
    renderCalc();
    if (tab === 'history') renderHistory();
  }
  // v2.1: sincronizacion de la calculadora con opciones de compra seleccionadas.
  // La pagina permanece intacta; solo se lee el texto visible y nunca se inicia un pago.
  // Advanced storefront price interpretation is read-only and strictly typed.
  const variantDetector=createVariantDetector({
    parseAmount,prefixCurrency,prefixRE,suffixRE,figure,cryptoCodes:CRYPTOS,dollarCurrencyForSite
  });
  const {
    originalText,matchesInText,bestVisiblePrice,selectedSummaryPrice,
    currentProductPrice,sameMonetaryPrice,variantControl,unlabeledDollarPrice,tappedPrice
  }=variantDetector;

  function selectPriceDirect(price) {
    if (!price || !SUPPORTED_CURRENCIES.includes(price.code)) return;
    manualOverride=false;pendingSelection=null;
    if (settings.autoSyncSelection) applySelectedPrice(price);
    else {
      settings.calcAmount=String(price.amount);settings.calcCurrency=price.code;
      if (settings.targetCurrency===price.code) settings.targetCurrency=targetFallback(price.code);
      if(targetSelect) targetSelect.value=settings.targetCurrency;
      if(calcInput) calcInput.value=settings.calcAmount;
      if(calcSelect) calcSelect.value=settings.calcCurrency;
      currentSelection=price;renderCalc();renderCompact();updateSourceLabel();
    }
    if(panel) {panel.hidden=false;activateTab('calculator');}
  }
  function setDollarCurrencyForSite(code) {
    if (!settings.dollarCurrencySites || typeof settings.dollarCurrencySites!=='object' || Array.isArray(settings.dollarCurrencySites))
      settings.dollarCurrencySites={};
    if (['USD','CLP','CAD','AUD'].includes(code)) settings.dollarCurrencySites[HOST]=code;
    else delete settings.dollarCurrencySites[HOST];
    // Legacy checkbox setting cannot override an explicit CLP/CAD/AUD selection.
    settings.bareDollarSites=settings.bareDollarSites.filter(site=>site!==HOST);
    persist();refresh();reScan(true);
  }
  function showDollarCurrencyChooser(price) {
    if (!price || document.getElementById('moncevia-dollar-dialog')) return;
    const english=uiLanguage()==='en';
    const overlay=node('div');overlay.id='moncevia-dollar-dialog';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',tr('Selecciona la moneda de $'));
    overlay.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(3,8,18,.75)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;';
    const card=node('div');
    card.style.cssText='box-sizing:border-box!important;max-width:370px!important;width:100%!important;background:#101c2d!important;border:1px solid #4b647a!important;border-radius:16px!important;padding:20px!important;color:#f8fafc!important;font:15px/1.45 system-ui!important;box-shadow:0 16px 50px rgba(0,0,0,.4)!important;';
    const title=node('strong','',tr('Selecciona la moneda de $'));title.style.cssText='display:block!important;font-size:18px!important;margin-bottom:10px!important;';
    const explanation=node('p','',tr('El símbolo $ no identifica una divisa única. Elige cómo interpretar los precios de este sitio.'));
    explanation.style.cssText='margin:0 0 12px!important;color:#cbd5e1!important;';
    const priceLabel=node('div','',`$${price.amount} · ${price.label||HOST}`);priceLabel.style.cssText='color:#5eead4!important;font-weight:650!important;margin-bottom:10px!important;';
    const choice=node('select');choice.setAttribute('aria-label',tr('Moneda de $ en este sitio'));
    choice.style.cssText='display:block!important;width:100%!important;min-height:44px!important;background:#1e293b!important;color:white!important;border:1px solid #64748b!important;border-radius:8px!important;padding:8px!important;';
    for (const code of ['USD','CLP','CAD','AUD']) {const o=node('option','',code);o.value=code;choice.append(o);}
    const actions=node('div');actions.style.cssText='display:flex!important;gap:10px!important;margin-top:15px!important;';
    const confirm=node('button','',tr('Confirmar moneda'));
    const cancel=node('button','',tr('Cancelar'));
    for(const b of [confirm,cancel]) {b.type='button';b.style.cssText='flex:1!important;padding:10px!important;border-radius:9px!important;border:1px solid #64748b!important;background:#1e293b!important;color:white!important;font:600 14px system-ui!important;';}
    confirm.style.background='#115e59';confirm.style.borderColor='#2dd4bf';
    const close=()=>{overlay.remove();if(panel)panel.hidden=false;};
    cancel.addEventListener('click',close);
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
    confirm.addEventListener('click',()=>{
      setDollarCurrencyForSite(choice.value);
      close();
      selectPriceDirect({...price,code:choice.value});
    });
    actions.append(confirm,cancel);card.append(title,explanation,priceLabel,choice,actions);overlay.append(card);document.body.append(overlay);
    choice.focus();
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
    if (pendingVariantChange) {
      calcSource.textContent='Sincronizando precio seleccionado…';
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
    if (!SUPPORTED_CURRENCIES.includes(price.code) || !validPositive(price.amount)) return;
    const signature=priceSignature(price);
    if (lastAppliedSelection!==signature || String(settings.calcAmount)!==String(price.amount) || settings.calcCurrency!==price.code) {
      settings.calcAmount=String(price.amount);
      settings.calcCurrency=price.code;
      if (settings.targetCurrency===price.code) settings.targetCurrency=targetFallback(price.code);
      if (targetSelect) targetSelect.value=settings.targetCurrency;
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
    const selected=selectedSummaryPrice() || currentProductPrice();
    if (pendingVariantChange) {
      const transition=pendingVariantChange;
      // A click often precedes the React/Shopify price update.
      // Never overwrite the current user choice with the pre-click amount.
      if (selected && (!transition.before || !sameMonetaryPrice(selected,transition.before))) {
        pendingVariantChange=null;
        applySelectedPrice(selected);
      } else if (Date.now()-transition.at>1600) {
        // A selection may leave the displayed price unchanged (e.g. a default
        // variant). Reuse only an unambiguous live product price after settling.
        pendingVariantChange=null;
        if(selected) applySelectedPrice(selected);
        else updateSourceLabel();
      }
      return;
    }
    if (pendingSelection) {
      const pending=pendingSelection;
      const matchesClick=sameMonetaryPrice(selected,pending.price);
      const changedAfterClick=selected && pending.before &&
        !sameMonetaryPrice(selected,pending.before);
      if (matchesClick || changedAfterClick) {
        pendingSelection=null;
        applySelectedPrice(selected);
      } else {
        // Hold the freshly touched card instead of reverting to a stale summary.
        if (Date.now()-pending.at>2500) pendingSelection=null;
        applySelectedPrice(pending.price);
      }
      return;
    }
    if (selected) applySelectedPrice(selected);
  }
  const selectionScheduler=createSelectionScheduler({
    run:()=>syncSelectedPrice(),
    allowed:()=>settings.autoSyncSelection && isActive() && !manualOverride
  });
  function scheduleSelectionSync(delay=160) {
    selectionScheduler.debounce(delay);
  }
  function pageClickCapture(event) {
    if (pickerActive) {
      if (event.target?.closest?.('#clplens-widget')) {
        stopPicker();panel.hidden=false;refresh();return;
      }
      event.preventDefault(); event.stopImmediatePropagation();
      const price=tappedPrice(event.target);
      if (!price) {
        const unknown=unlabeledDollarPrice(event.target);
        if (unknown) {
          stopPicker();
          showDollarCurrencyChooser(unknown);
        }
        return;
      }
      pickerActive=false;
      document.body.classList.remove('clplens-picking');
      manualOverride=false; pendingSelection=null;
      if (settings.autoSyncSelection) applySelectedPrice(price);
      else {
        settings.calcAmount=String(price.amount);settings.calcCurrency=price.code;
        if (settings.targetCurrency===price.code) settings.targetCurrency=targetFallback(price.code);
        if (targetSelect) targetSelect.value=settings.targetCurrency;
        calcInput.value=settings.calcAmount;calcSelect.value=price.code;
        currentSelection=price;renderCalc();renderCompact();updateSourceLabel();
      }
      flashPrice(event.target);
      if (pickBtn) pickBtn.textContent='Seleccionar en web';
      panel.hidden=false; tab='calculator'; activateTab('calculator');
      return;
    }
    if (!settings.autoSyncSelection || !isActive()) return;
    const price=tappedPrice(event.target);
    if (!price) {
      // Bare $ is ambiguous: choose a per-site currency before any calculations.
      const unknown=unlabeledDollarPrice(event.target);
      if (unknown) {showDollarCurrencyChooser(unknown);return;}
      if (variantControl(event.target)) {
        const before=selectedSummaryPrice() || currentProductPrice();
        manualOverride=false;pendingSelection=null;
        pendingVariantChange={before,at:Date.now(),seq:++clickSequence};
        updateSourceLabel();
        scheduleSelectionSync(100);
        selectionScheduler.replaceRetries([380,800,1500,2600]);
        return;
      }
      // Quantity steppers may update the product total asynchronously; monitor
      // them even if the initial automatic price has not yet been discovered.
      const action=event.target.closest('button,[role="button"]');
      const quantityAction=action &&
        (action.closest('.quantity,[data-quantity],[class*="quantity"]') ||
         /^(?:plus|minus|increase|decrease|increment|decrement|qty)/i.test(action.id||'') ||
         /^(?:\+|−|-)$/u.test((action.textContent||'').trim()));
      if (currentSelection || quantityAction) {
        scheduleSelectionSync(140);
        selectionScheduler.replaceRetries([460]);
      }
      return;
    }
    const before=selectedSummaryPrice() || currentProductPrice();
    manualOverride=false;
    pendingVariantChange=null;
    pendingSelection={price,before,at:Date.now(),seq:++clickSequence};
    applySelectedPrice(price);
    scheduleSelectionSync(130);
    selectionScheduler.replaceRetries([450,1200,2600]);
  }
  function pageChangeCapture(event) {
    if (!settings.autoSyncSelection || !isActive() || event.target.closest?.('#clplens-widget')) return;
    // Changing a newsletter/filters checkbox must not cancel a manually entered price.
    const target=event.target;
    const hint=[target.id,target.getAttribute('name'),target.getAttribute('aria-label'),
      target.className,target.parentElement?.className].join(' ');
    const productInput=target.matches('select,[role="combobox"],input[type="radio"]') &&
      /variant|option|size|colou?r|plan|tier|license|product|duration|sku/i.test(hint);
    if(!productInput && !variantControl(target)) {
      if(currentSelection && target.matches('select,input[type="number"]')) scheduleSelectionSync(240);
      return;
    }
    manualOverride=false;
    pendingSelection=null;
    pendingVariantChange=null;
    scheduleSelectionSync(180);
    selectionScheduler.replaceRetries([500]);
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
    if (pickBtn) pickBtn.textContent='Cancelar selección';
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
    const openCoins=new Set([...transferOutput.querySelectorAll('details[data-mv-coin][open]')].map(x=>x.dataset.mvCoin));
    transferOutput.replaceChildren();
    const exact=!!settings.exactPayEnabled;
    const coins=exact?[settings.exactPayCurrency]:CRYPTOS;
    let allReady=true;
    for (const coin of coins) {
      const v=getPaymentInfo(coin);
      if (!v) {
        allReady=false;
        const item=disclosure(transferOutput,`${coin} · sin cotización verificable`,false,'mv-payment-card');
        item.details.dataset.mvCoin=coin;
        item.content.append(node('p','clplens-warning','Falta Binance Spot o USDT/USD vigente, o el importe excede ocho decimales.'));
        continue;
      }
      const complete=v.feeKnown&&v.spotKnown&&v.fundKnown&&v.clp!=null;
      if (!complete) allReady=false;
      const item=disclosure(transferOutput,'',openCoins.has(coin),'mv-payment-card');
      item.details.dataset.mvCoin=coin;
      const label=node('div','mv-payment-summary');
      label.append(node('strong','',coin+' · '+v.network));
      label.append(node('small','',`Recibe ${formatCoin(v.payable,coin)} ${coin} · ${formatDecimal(v.estimateUsdt)} USDT aprox.`));
      const status=node('span','mv-payment-status'+(complete?' ready':''),complete?'Datos marcados como verificados':'Faltan datos de costos');
      item.details.querySelector('summary').append(label,status);
      const body=node('div','mv-payment-details');
      body.append(node('div','',`Importe al comercio: ${formatCoin(v.payable,coin)} ${coin}`));
      body.append(node('div','',`Comisión de retiro: ${v.feeKnown?formatCoin(v.withdrawFee,coin)+' '+coin:'pendiente de verificar'}`));
      body.append(node('div','',`Cantidad necesaria: ${formatCoin(v.acquire,coin)} ${coin} ${complete?'(estimación)':'(mínimo teórico incompleto)'}`));
      body.append(node('div','',`Compra Spot: ${formatDecimal(v.estimateUsdt)} USDT · ask ${formatDecimal(v.ask,6)} USDT/${coin}`));
      body.append(node('div','',`Fondeo CLP: ${v.fundKnown&&v.clp!=null?formatCLP(v.clp)+' (estimado)':'sin costo de compra de USDT verificado'}`));
      if (!v.feeKnown || !v.spotKnown || !v.fundKnown) {
        const missing=[];if(!v.feeKnown)missing.push('comisión y red de retiro');
        if(!v.spotKnown)missing.push('comisión de compra Spot');
        if(!v.fundKnown)missing.push('costo de adquirir USDT');
        body.append(node('div','clplens-warning','Pendiente: '+missing.join(' · ')));
      }
      const go=node('button','mv-linklike','Configurar comisiones');go.type='button';go.addEventListener('click',()=>{
        activateTab('settings');if(settingsBankGroup)settingsBankGroup.open=true;
      });body.append(go);
      item.content.append(body);
    }
    const notice=node('div','mv-fee-notice', allReady?
      'Estimación, no importe definitivo. Revisa la red y el monto recibido en Binance antes de confirmar.':
      'Estimación incompleta. Comprueba la comisión, la red y el importe exacto en Binance antes de enviar.');
    transferOutput.prepend(notice);
  }
  function renderCompare() {
    if (!compareOutput) return;
    compareOutput.replaceChildren();
    const amount=Number(settings.calcAmount),code=settings.calcCurrency,clp=toCLP(amount,code);
    if (!validPositive(clp)) {compareOutput.append(node('p','','Sin cotización válida para comparar.'));return;}
    const grid=node('div','mv-grid');const valid=[];
    for (const name of ['Prex','Santander']) {
      const key=name.toLowerCase(), value=withExtra(clp,key), verified=!!settings[key+'Known'];
      grid.append(cardRow(name,`${formatCLP(value)}${verified?' · ✓':' · aprox.'}`,true));
      if(verified)valid.push({name,cost:value});
    }
    for(const coin of CRYPTOS){
      const v=getPaymentInfo(coin);if(!v)continue;
      const complete=v.clp&&v.feeKnown&&v.spotKnown&&v.fundKnown;
      grid.append(cardRow('Binance '+coin,complete?formatCLP(v.clp):`${formatDecimal(v.estimateUsdt)} USDT*`,true));
      if(complete)valid.push({name:'Binance '+coin,cost:v.clp});
    }
    compareOutput.append(grid);
    if(valid.length>=2){valid.sort((a,b)=>a.cost-b.cost);
      compareOutput.append(node('div','mv-fee-notice',`Menor estimación entre métodos configurados: ${valid[0].name} · ${formatCLP(valid[0].cost)}`));
    }else compareOutput.append(node('div','mv-fee-notice','Sin suficientes métodos con costos marcados como verificados para elegir el más económico.'));
    const info=disclosure(compareOutput,'Cómo interpretar la comparación');
    info.content.append(node('p','','* USDT indica costo Spot preliminar, sin fondeo final verificado. Las tarjetas usan porcentajes configurados; no son cotizaciones del banco. Los precios Spot no garantizan profundidad ni ejecución.'));
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
    const entry={at:Date.now(),site:settings.historySite?HOST:'no guardado',amount,code,
      targetCurrency:settings.targetCurrency,targetAmount:toUnits(amount,code,settings.targetCurrency),clp:toCLP(amount,code),
      cryptoSource:activeCrypto()?crypto.source:'no disponible',cryptoAt:crypto?.fetchedAt||null,
      fxAt:fx?.fetchedAt||null,units:Object.fromEntries(CRYPTOS.map(c=>[c,toUnits(amount,code,c)]))};
    history=[entry,...history].slice(0,30);
    void persistence.saveHistory(history);
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
        if (SUPPORTED_CURRENCIES.includes(record.targetCurrency)) settings.targetCurrency=record.targetCurrency;
        else settings.targetCurrency=targetFallback(record.code);
        calcInput.value=settings.calcAmount;calcSelect.value=record.code;
        if (targetSelect) targetSelect.value=settings.targetCurrency;
        persist();activateTab('calculator');refresh();updateSourceLabel();
      });row.append(load);historyOutput.append(row);
    }
  }
  function activateTab(next) {
    if (typeof window.clplensSelectTab==='function') window.clplensSelectTab(next);
  }

  function renderCalc() {
    if (!calcOutput) return;
    calcOutput.replaceChildren();
    const amount=Number(settings.calcAmount),code=settings.calcCurrency;
    if (!(Number.isFinite(amount) && amount>0 && amount<1e12)) {
      calcOutput.append(node('div','mv-fee-notice','Introduce un importe positivo.'));
      computePayment();renderCompare();renderCompact();return;
    }
    const destination=SUPPORTED_CURRENCIES.includes(settings.targetCurrency)?settings.targetCurrency:'CLP';
    const result=toUnits(amount,code,destination);
    const hero=node('section','mv-hero');
    hero.append(node('div','mv-kicker',tr('Resultado en')+' '+destination));
    hero.append(node('div','mv-big',result!=null?formatConversion(result,destination):tr('Sin tasa disponible')));
    hero.append(node('div','mv-sub','Valor de referencia · no es el cobro final de tu banco'));
    calcOutput.append(hero);
    const grid=node('div','mv-grid');
    for (const c of ['CLP','USD','EUR',...CRYPTOS]) {
      if (c===destination) continue;
      const value=toUnits(amount,code,c);
      grid.append(cardRow(c,value!=null?(c==='CLP'?formatCLP(value):CRYPTOS.includes(c)?formatCoin(value,c):formatDecimal(value)):'—'));
    }
    calcOutput.append(grid);
    computePayment();renderCompare();renderCompact();
  }
  function createUI() {
    stylesheet();
    const shell=createPanelShell({
      version:'3.15.1',
      onLanguageToggle:()=>switchLanguage(uiLanguage()==='es'?'en':'es')
    });
    widget=shell.widget;fab=shell.fab;panel=shell.panel;
    stateLabel=shell.stateLabel;coinsLabel=shell.coinsLabel;languageButton=shell.languageButton;
    const nav=node('nav','mv-nav');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Secciones de Moncevia');
    const pages={};
    const navItems=[['calculator','Convertir','⇄'],['crypto','Pagar','₿'],['compare','Comparar','≋'],['history','Historial','◷'],['settings','Ajustes','⚙']];
    const navButtons={};
    const pageCalc=node('div','mv-page');const pageCrypto=node('div','mv-page');
    const pageCompare=node('div','mv-page');const pageHistory=node('div','mv-page');
    const pageSettingsRoot=node('div','mv-page');let pageSettings=pageSettingsRoot;
    Object.assign(pages,{calculator:pageCalc,crypto:pageCrypto,compare:pageCompare,history:pageHistory,settings:pageSettingsRoot});
    // Accessible tab selection lives in the strictly typed UI controller.
    const tabController=createTabController({
      pages,buttons:navButtons,panel,
      onActivate:name=>{tab=name;if(name==='history')renderHistory();}
    });
    const setTab=name=>tabController.activate(name);
    for(const [key,label,symbol] of navItems){
      const button=node('button');button.type='button';button.setAttribute('role','tab');
      button.append(node('span','mv-nav-icon',symbol),node('span','',label));
      button.setAttribute('aria-label',label);button.id='mv-tab-'+key;button.setAttribute('aria-controls','mv-page-'+key);
      pages[key].id='mv-page-'+key;pages[key].setAttribute('role','tabpanel');pages[key].setAttribute('aria-labelledby',button.id);
      navButtons[key]=button;nav.append(button);
      button.addEventListener('click',()=>setTab(key));
    }
    nav.addEventListener('keydown',event=>tabController.onKeydown(event));
    panel.append(nav);window.clplensSelectTab=setTab;
    pageCrypto.append(node('h2','','Pago con criptomonedas'));
    line(pageCrypto,'Calcula lo que necesitarías comprar para cubrir un importe solicitado por un comercio.','mv-section-note');
    pageCompare.append(node('h2','','Comparar métodos de pago'));
    line(pageCompare,'Costos orientativos configurados, no cargos confirmados.','mv-section-note');
    pageHistory.append(node('h2','','Historial local'));
    pageSettingsRoot.append(node('h2','','Configuración'));
    const field=node('label','clplens-field'); field.append(node('span','','Importe y moneda de origen'));
    const inputRow=node('div','clplens-inputrow');
    const amountInput=node('input'); calcInput=amountInput; amountInput.type='number'; amountInput.inputMode='decimal'; amountInput.step='any'; amountInput.min='0'; amountInput.value=String(settings.calcAmount);
    const select=node('select'); calcSelect=select;
    for (const code of SUPPORTED_CURRENCIES) {
      const option=node('option','',code); option.value=code; select.append(option);
    }
    select.value=settings.calcCurrency;
    // Lock manual editing as soon as the user focuses this field, before an
    // asynchronous price sync can write into the input while they are typing.
    amountInput.addEventListener('focus',()=>{
      manualOverride=true;pendingSelection=null;pendingVariantChange=null;
      selectionScheduler.cancel();updateSourceLabel();
    });
    amountInput.addEventListener('input',()=>{ manualOverride=true; pendingSelection=null;pendingVariantChange=null;
      selectionScheduler.cancel();settings.calcAmount=amountInput.value; updateSourceLabel(); renderCalc(); });
    amountInput.addEventListener('change',()=>persist());
    select.addEventListener('change',()=>{
      manualOverride=true; pendingSelection=null;settings.calcCurrency=select.value;
      if (settings.targetCurrency===settings.calcCurrency) settings.targetCurrency=targetFallback(settings.calcCurrency);
      if (targetSelect) targetSelect.value=settings.targetCurrency;
      updateSourceLabel();persist();renderCalc();
    });
    inputRow.append(amountInput,select); field.append(inputRow); pageCalc.append(field);
    const targetField=node('label','clplens-field');targetField.append(node('span','','Moneda de destino'));
    const targetRow=node('div','mv-target-row');
    targetSelect=node('select');targetSelect.setAttribute('aria-label','Moneda de destino');
    for(const code of SUPPORTED_CURRENCIES){const option=node('option','',code);option.value=code;targetSelect.append(option);}
    targetSelect.value=settings.targetCurrency;
    targetSelect.addEventListener('change',()=>{settings.targetCurrency=targetSelect.value;persist();renderCalc();});
    const swapButton=node('button','mv-swap','⇄');swapButton.type='button';swapButton.setAttribute('aria-label','Invertir monedas');
    swapButton.setAttribute('title','Invertir monedas');
    swapButton.addEventListener('click',()=>{
      const oldSource=settings.calcCurrency;
      settings.calcCurrency=settings.targetCurrency;settings.targetCurrency=oldSource;
      manualOverride=true;pendingSelection=null;
      select.value=settings.calcCurrency;targetSelect.value=settings.targetCurrency;
      updateSourceLabel();persist();renderCalc();
    });
    targetRow.append(targetSelect,swapButton);targetField.append(targetRow);pageCalc.append(targetField);
    calcSource=line(pageCalc,'','clplens-strong');
    updateSourceLabel();
    const reselect=node('button','','Precio elegido');reselect.classList.add('mv-action-primary'); reselect.type='button';
    reselect.addEventListener('click',()=>{
      manualOverride=false; pendingSelection=null;
      syncSelectedPrice(); updateSourceLabel();
    });
    const toolsRow=node('div','clplens-action-row');
    toolsRow.append(reselect);
    pickBtn=node('button','','Seleccionar en web');pickBtn.type='button';
    pickBtn.addEventListener('click',()=>pickerActive?stopPicker():startPicker());toolsRow.append(pickBtn);
    const save=node('button','','Guardar');save.type='button';save.addEventListener('click',snapshotHistory);toolsRow.append(save);
    const compactButton=node('button','','Vista compacta');compactButton.type='button';
    compactButton.addEventListener('click',()=>{settings.compactMode=!settings.compactMode;persist();panel.hidden=true;renderCompact();});
    toolsRow.append(compactButton);
    calcOutput=node('div');calcOutput.setAttribute('aria-live','polite');pageCalc.append(calcOutput,toolsRow);
    const toPayment=node('button','mv-linklike','Calcular pago con cripto →');toPayment.type='button';
    toPayment.addEventListener('click',()=>activateTab('crypto'));pageCalc.append(toPayment);
    exactToggle=checkbox(pageCrypto,'Usar importe exacto solicitado en cripto',()=>settings.exactPayEnabled,v=>{
      settings.exactPayEnabled=v;exactField.classList.toggle('clplens-hidden',!v);
    });
    const exactField=node('label','clplens-field');exactField.append(node('span','','Cantidad que debe recibir el comercio'));
    const exactRow=node('div','clplens-inputrow');
    exactAmountInput=node('input');exactAmountInput.placeholder='Cantidad exacta del comercio';exactAmountInput.type='number';exactAmountInput.step='0.00000001';exactAmountInput.min='0';exactAmountInput.inputMode='decimal';exactAmountInput.value=String(settings.exactPayAmount);
    exactCurrencySelect=node('select');
    for (const c of CRYPTOS) {const o=node('option','',c);o.value=c;exactCurrencySelect.append(o);}exactCurrencySelect.value=settings.exactPayCurrency;
    exactAmountInput.addEventListener('input',()=>{settings.exactPayAmount=exactAmountInput.value;computePayment();renderCompare();});
    exactAmountInput.addEventListener('change',persist);
    exactCurrencySelect.addEventListener('change',()=>{settings.exactPayCurrency=exactCurrencySelect.value;persist();computePayment();renderCompare();});
    exactRow.append(exactAmountInput,exactCurrencySelect);exactField.append(exactRow);pageCrypto.append(exactField);
    exactField.classList.toggle('clplens-hidden',!settings.exactPayEnabled);
    transferOutput=node('div');pageCrypto.append(transferOutput);
    const payHint=disclosure(pageCrypto,'Antes de enviar fondos');
    payHint.content.append(node('p','','Comprueba importe exacto, red compatible, mínimo y comisión en tu cuenta Binance. Moncevia no realiza transferencias ni obtiene tarifas privadas.'));
    compareOutput=node('div');pageCompare.append(compareOutput);

    const generalSection=disclosure(pageSettingsRoot,'General y sitio actual',false,'mv-settings-group');
    pageSettings=generalSection.content;
    const langRow=node('label');langRow.append(node('span','','Idioma / Language'));
    languageSelect=node('select');languageSelect.setAttribute('aria-label','Idioma / Language');
    for(const [value,label] of [['auto','Automático / Auto'],['es','Español'],['en','English']]){
      const opt=node('option','',label);opt.value=value;languageSelect.append(opt);
    }
    languageSelect.value=settings.language;
    languageSelect.addEventListener('change',()=>switchLanguage(languageSelect.value));
    langRow.append(languageSelect);pageSettings.append(langRow);
    checkbox(pageSettings,'Conversión activada',()=>settings.enabled,v=>settings.enabled=v);
    checkbox(pageSettings,'Modo compacto al cerrar panel',()=>settings.compactMode,v=>settings.compactMode=v);
    const resetFabButton=node('button','','Restablecer posición del botón');resetFabButton.type='button';
    resetFabButton.addEventListener('click',()=>resetFabPosition());pageSettings.append(resetFabButton);
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
    const dollarRow=node('label');dollarRow.append(node('span','','Moneda de $ en este sitio'));
    const dollarSelect=node('select');dollarSelect.setAttribute('aria-label','Moneda de $ en este sitio');
    for(const [code,label] of [['','Sin definir (preguntar al tocar)'],['USD','USD'],['CLP','CLP'],['CAD','CAD'],['AUD','AUD']]) {
      const option=node('option','',label);option.value=code;dollarSelect.append(option);
    }
    dollarSelect.value=dollarCurrencyForSite()||'';
    dollarSelect.addEventListener('change',()=>setDollarCurrencyForSite(dollarSelect.value));
    dollarRow.append(dollarSelect);pageSettings.append(dollarRow);
    checkbox(pageSettings,'Mostrar BTC / ETH / LTC junto a precios',()=>settings.showCryptoInline,v=>settings.showCryptoInline=v);
    checkbox(pageSettings,'Comparar Prex / Santander en precios',()=>settings.compareInline,v=>settings.compareInline=v);
    const bankSection=disclosure(pageSettingsRoot,'Divisas y tarjetas',false,'mv-settings-group');
    pageSettings=bankSection.content;
    verifyBoxes.prexKnown = checkbox(pageSettings,'Ajuste Prex verificado por ti',()=>settings.prexKnown,v=>settings.prexKnown=v);
    verifyBoxes.santanderKnown = checkbox(pageSettings,'Ajuste Santander verificado por ti',()=>settings.santanderKnown,v=>settings.santanderKnown=v);
    numberSetting(pageSettings,'1 USD en CLP (0 = automático)','usdClpManual',10000);
    numberSetting(pageSettings,'1 EUR en CLP (0 = automático)','eurClpManual',15000);
    numberSetting(pageSettings,'Ajuste Prex (%)','prexExtra',30);
    numberSetting(pageSettings,'Ajuste Santander (%)','santanderExtra',30);
    numberSetting(pageSettings,'Impuestos adicionales (%)','taxExtra',30);
    const cryptoSection=disclosure(pageSettingsRoot,'Binance y redes de retiro',false,'mv-settings-group');
    settingsBankGroup=cryptoSection.details;pageSettings=cryptoSection.content;
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
    const helpSection=disclosure(pageSettingsRoot,'Ayuda, límites y privacidad',false,'mv-settings-group');
    pageSettings=helpSection.content;
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
      const previousAllowed=settings.allowedSites,previousDisabled=settings.disabledSites;
      settings.allowedSites=settings.allowedSites.filter(host=>host!==HOST);
      settings.disabledSites=settings.disabledSites.filter(host=>host!==HOST);
      if (!await persist()) {
        settings.allowedSites=previousAllowed;
        settings.disabledSites=previousDisabled;
        window.alert('No fue posible guardar la revocación.');return;
      }
      location.reload();
    });
    pageSettings.append(revokeSite);

    historyOutput=node('div');pageHistory.append(historyOutput);
    const clearHistory=node('button','','Borrar historial local');clearHistory.type='button';
    clearHistory.addEventListener('click',async()=>{
      if (!window.confirm('¿Borrar las consultas guardadas en Moncevia?')) return;
      // Optimistically clear the in-memory history before queuing the write.
      // A new Guardar action during the write will persist only new entries,
      // never a stale snapshot containing records the user just deleted.
      const previousHistory=history;
      history=[];renderHistory();
      if (!await persistence.saveHistory([])) {
        // Restore previous records without discarding entries added during
        // the pending clear. The final queued write wins over earlier saves.
        history=[...history,...previousHistory].slice(0,30);
        void persistence.saveHistory(history);
        renderHistory();
        window.alert('No fue posible borrar el historial local.');
      }
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
    panel.append(pageCalc,pageCrypto,pageCompare,pageHistory,pageSettingsRoot);
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
    // Open immediately; defer expensive calculations until the initial paint.
    function openPanelFast() {
      panel.hidden = false;
      const ticket = ++panelOpenTicket;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (ticket !== panelOpenTicket || panel.hidden) return;
        refresh();
      }));
    }
    fab.addEventListener('click',()=>{
      if (pickerActive) stopPicker();
      if (panel.hidden) openPanelFast();
      else { panel.hidden=true; ++panelOpenTicket; renderCompact(); }
    });
    compactCard=node('div');compactCard.id='clplens-compact';compactCard.hidden=true;
    compactCard.addEventListener('click',()=>openPanelFast());
    widget.append(panel,compactCard,fab); document.body.append(widget);
    // A real aria-expanded value follows ALL close paths, including Escape/picker.
    const panelStateObserver=new MutationObserver(()=>{
      fab.setAttribute('aria-expanded',String(!panel.hidden));
    });
    panelStateObserver.observe(panel,{attributes:true,attributeFilter:['hidden']});
    restoreFabPosition();
    enableFabDragging();
    refresh();
    watchLocalization();
  }

  // DOM price annotations are isolated from the legacy UI and finance engine.
  const priceScanner=createPriceScanner({isActive,detectMoney,badgeText,scanLimit:SCAN_LIMIT,badgeLimit:BADGE_LIMIT});
  const scan=()=>priceScanner.scan();
  const reScan=(force=false)=>priceScanner.schedule(force);
  const ownMutation=change=>priceScanner.isOwnMutation(change);

  async function requestJSON(url) {
    const result=await storage.xmlHttpRequest({ method:'GET',url, timeout:11000,responseType:'text',headers:{Accept:'application/json'} });
    if (!result || result.status!==200) throw Error('HTTP '+result?.status);
    return JSON.parse(result.responseText || result.response);
  }
  async function updateFXImpl(force=false) {
    if (!force && inDate(fx,FX_TTL)) return;
    try {
      const data=await requestJSON('https://open.er-api.com/v6/latest/USD');
      const validated=validateFXResponse(data,Date.now());
      if (!validated) throw Error('FX invalida u obsoleta');
      fx={ fetchedAt:validated.fetchedAt,updatedAt:dateTime(validated.providerTime),rates:validated.rates };
      await storage.setValue(FX_KEY,fx);
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
      const usdtUsd=validateUSDTParity(tether,Date.now());
      if (usdtUsd===null) throw Error('USDT/USD sin cotizacion verificable');
      const validated=validateBinanceSnapshot(data,usdtUsd,Date.now());
      if (!validated) throw Error('Binance ticker no válido');
      crypto=validated;
      await storage.setValue(CRYPTO_KEY,crypto);
    } catch(err) {
      console.info('[Moncevia] Binance no disponible, intentando CoinGecko:',err?.message||err);
      try {
        const data=await requestJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Clitecoin&vs_currencies=usd&include_last_updated_at=true');
        const validated=validateCoinGeckoSnapshot(data,Date.now());
        if (!validated) throw Error('CoinGecko sin cotizacion completa o reciente');
        crypto=validated;
        await storage.setValue(CRYPTO_KEY,crypto);
      } catch (e) {
        console.info('[Moncevia] CoinGecko no disponible; intentando Coinbase:',e?.message||e);
        try {
          const result=await Promise.all(CRYPTOS.map(c=>requestJSON(`https://api.coinbase.com/v2/prices/${c}-USD/spot`)));
          const validated=validateCoinbaseSnapshot(result,Date.now());
          if (!validated) throw Error('Coinbase no válido');
          crypto=validated;
          await storage.setValue(CRYPTO_KEY,crypto);
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
    const restored=await persistence.load();
    settings=restored.settings;fx=restored.fx;history=restored.history;crypto=restored.crypto;
    // Solo el dominio explícitamente autorizado recibe escaneo, panel completo o peticiones de FX.
    if (!isAuthorized()) {
      const opt=node('button','','Moncevia · activar aquí');
      opt.id='moncevia-optin'; opt.type='button';
      opt.textContent=tr(opt.textContent);
      opt.setAttribute('aria-label',tr('Permitir Moncevia en este dominio'));
      Object.assign(opt.style,{position:'fixed',bottom:'max(12px,env(safe-area-inset-bottom))',right:'10px',zIndex:'2147483645',font:'12px system-ui',color:'#e2e8f0',background:'#1e293b',padding:'9px 11px',border:'1px solid #64748b',borderRadius:'18px',opacity:'0.85'});
      opt.addEventListener('click',async()=>{
        if (opt.disabled) return;
        opt.disabled=true;
        const previousAllowed=settings.allowedSites;
        settings.allowedSites=[...new Set([...settings.allowedSites,HOST])];
        // Never scan the merchant site or call public rate providers until
        // its explicit authorization has actually been stored.
        if (!await persist()) {
          settings.allowedSites=previousAllowed;
          opt.disabled=false;
          window.alert('No fue posible guardar la autorización.');return;
        }
        opt.remove();startRuntime();
      });
      document.body.append(opt);
      return;
    }
    startRuntime();
  }
  function startRuntime() {
    if (document.getElementById('clplens-widget')) return;
    createUI(); scan();renderHistory();renderCompact();
    const lifecycle=createPageLifecycle({
      root:document.body,
      isOwnMutation:ownMutation,
      onMutation:()=>{reScan();scheduleSelectionSync(160);},
      onClick:pageClickCapture,
      onChange:pageChangeCapture,
      onKeydown:event=>{
        if(pickerActive && event.key==='Escape'){
          stopPicker();panel.hidden=false;refresh();
        }
        if(event.key==='Escape' && panel && !panel.hidden){
          panel.hidden=true;fab.focus();renderCompact();
        }
      },
      onScroll:()=>reScan(),
      onRefresh:()=>{
        if(document.visibilityState==='visible' && isActive()){
          void Promise.all([updateFX(false),updateCrypto(false)]);
          refresh();reScan(true);
        }
      },
      onSuspend:()=>{selectionScheduler.cancel();priceScanner.dispose();uiLocalizer.stop();},
      onResume:()=>uiLocalizer.watch()
    });
    lifecycle.start();
    scheduleSelectionSync(180);
    if (isActive()) void Promise.all([updateFX(false),updateCrypto(false)]);
  }
  boot();
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
