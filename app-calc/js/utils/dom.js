/**
 * utils/dom.js
 * Helpers para manipulação de DOM.
 */

/** Atalho para querySelector */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);

/** Atalho para querySelectorAll */
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Renderiza HTML no container e devolve o elemento.
 * @param {HTMLElement} el
 * @param {string} html
 */
export function setHTML(el, html) {
  el.innerHTML = html;
  return el;
}

/**
 * Cria um elemento com atributos e filhos.
 * Uso: el('div', { class: 'foo' }, 'texto')
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') node.insertAdjacentHTML('beforeend', child);
    else if (child instanceof Node) node.appendChild(child);
  }
  return node;
}
