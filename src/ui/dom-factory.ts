/** DOM primitives used exclusively inside Moncevia-owned components. */
export function createNode<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function createExternalLink(href: string, text: string): HTMLAnchorElement {
  const element = createNode('a', '', text);
  element.href = href;
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  return element;
}

export function appendLine(
  parent: HTMLElement,
  text: string,
  className = '',
): HTMLParagraphElement {
  const paragraph = createNode('p', className, text);
  parent.append(paragraph);
  return paragraph;
}

export function appendDisclosure(
  parent: HTMLElement,
  title: string,
  expanded = false,
  extraClass = '',
): { details: HTMLDetailsElement; content: HTMLDivElement } {
  const details = createNode('details', 'mv-disclosure' + (extraClass ? ' ' + extraClass : ''));
  details.open = expanded;
  const summary = createNode('summary', '', title);
  const content = createNode('div', 'mv-details-content');
  details.append(summary, content);
  parent.append(details);
  return { details, content };
}

export function createCardRow(key: string, value: string, full = false): HTMLDivElement {
  const row = createNode('div', 'mv-unit' + (full ? ' mv-full' : ''));
  row.append(createNode('span', '', key), createNode('strong', '', value));
  return row;
}

export function appendEmbeddedStyles(css: string): HTMLStyleElement {
  const style = createNode('style');
  style.dataset.clplens = '2';
  style.textContent = css;
  document.head.append(style);
  return style;
}
