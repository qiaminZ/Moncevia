import { appendDisclosure, appendLine, createExternalLink, createNode } from './dom-factory';

export interface PanelShellOptions {
  version: string;
  onLanguageToggle: () => void;
}

export interface PanelShell {
  widget: HTMLDivElement;
  fab: HTMLButtonElement;
  panel: HTMLElement;
  header: HTMLDivElement;
  stateLabel: HTMLSpanElement;
  coinsLabel: HTMLParagraphElement;
  languageButton: HTMLButtonElement;
}

/** Create only our own isolated UI. No store content, prices or payment forms are touched. */
export function createPanelShell(options: PanelShellOptions): PanelShell {
  const widget = createNode('div');
  widget.id = 'clplens-widget';

  const fab = createNode('button', '', 'CLP · ₿');
  fab.type = 'button';
  fab.id = 'clplens-fab';
  fab.setAttribute('aria-label', 'Abrir Moncevia');
  fab.setAttribute('aria-controls', 'clplens-panel');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('title', 'Arrastra para mover · toca para abrir');

  const panel = createNode('section');
  panel.id = 'clplens-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Moncevia — conversión y pagos');

  const header = createNode('div', 'mv-header');
  const titlebar = createNode('div', 'mv-titlebar');
  titlebar.append(createNode('h2', '', 'Moncevia'));

  const headerActions = createNode('div', 'mv-header-actions');
  headerActions.style.cssText = 'display:flex;align-items:center;gap:7px;';

  const languageButton = createNode('button', 'mv-lang-toggle', 'ES');
  languageButton.type = 'button';
  languageButton.addEventListener('click', options.onLanguageToggle);
  headerActions.append(languageButton, createNode('span', 'mv-version', 'v' + options.version));
  titlebar.append(headerActions);
  header.append(titlebar);

  const status = createNode('div', 'mv-status');
  status.append(createNode('span', 'mv-dot'));
  const stateLabel = createNode('span', '', 'Consultando tasas…');
  status.append(stateLabel);
  header.append(status);
  panel.append(header);

  const ratesInfo = appendDisclosure(header, 'Tasas y fuentes', false);
  ratesInfo.details.classList.add('mv-rates-disclosure');
  const coinsLabel = appendLine(ratesInfo.content, 'Consultando criptomonedas…', 'clplens-strong');
  const sources = appendLine(ratesInfo.content, 'Fuentes: ');
  sources.append(createExternalLink('https://www.exchangerate-api.com', 'ExchangeRate-API'));
  sources.append(
    ' · ',
    createExternalLink(
      'https://developers.binance.com/en/docs/binance-spot-api-docs/rest-api/market-data-endpoints',
      'Binance Spot',
    ),
  );
  sources.append(' / ', createExternalLink('https://www.coingecko.com/en/api', 'CoinGecko'));
  sources.append(' / ', createExternalLink('https://www.coinbase.com', 'Coinbase'));

  return { widget, fab, panel, header, stateLabel, coinsLabel, languageButton };
}
