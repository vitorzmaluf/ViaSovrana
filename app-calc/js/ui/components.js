/**
 * ui/components.js
 * Componentes de UI reutilizáveis entre todas as abas.
 * Retornam strings HTML — sem dependência de framework.
 */

import { fmt, fmtN, inputVal } from '../utils/format.js';
import { ZONE_COLOR }          from '../config/constants.js';

// ── Cabeçalho de seção ─────────────────────────────────────────────────────
export function secHead(title) {
  return `<div class="sec-head">
    <span class="sec-title">${title}</span>
    <div class="sec-line"></div>
  </div>`;
}

// ── Grid de botões de cidade ───────────────────────────────────────────────
/**
 * @param {object[]} cidades   array de { key, label, km, taxaFixa }
 * @param {string}   selected  key selecionado
 * @param {string}   evtAttr   data-attribute usado no event delegation (ex: 'city-pick')
 */
export function cityButtons(cidades, selected, evtAttr = 'city-pick') {
  return `<div class="grid2x2">
    ${cidades.map(c => `
      <button class="city-btn${selected === c.key ? ' active' : ''}"
        data-${evtAttr}="${c.key}">
        ${c.label}
        <div class="sub">${c.km} km · taxa ${fmt(c.taxaFixa)}</div>
      </button>`).join('')}
  </div>`;
}

// ── Grid de botões de zona ─────────────────────────────────────────────────
/**
 * @param {object[]} zonas     array de { key, label, taxa }
 * @param {string}   selected  key selecionado
 * @param {string}   evtAttr   data-attribute usado no event delegation
 */
export function zoneButtons(zonas, selected, evtAttr = 'zone-pick') {
  return `<div class="grid2x2">
    ${zonas.map(z => {
      const cor = ZONE_COLOR[z.key] || 'var(--ac)';
      const isActive = selected === z.key;
      const style = isActive
        ? `border-color:${cor};color:${cor};background:${cor}22`
        : '';
      return `
      <button class="city-btn${isActive ? ' active' : ''}"
        style="${style}"
        data-${evtAttr}="${z.key}">
        ${z.label} — ${fmt(z.taxa)}
        <div class="sub" style="color:${isActive ? cor : ''}">${z.dist ?? ''}</div>
      </button>`;
    }).join('')}
  </div>`;
}

// ── Input numérico ─────────────────────────────────────────────────────────
/**
 * @param {string}      id
 * @param {string}      label
 * @param {number}      val
 * @param {string|null} hint
 */
export function numInput(id, label, val, hint = null) {
  return `
    <div class="num-wrap">
      <div class="num-row">
        <div>
          <span class="num-label">${label}</span>
          ${hint ? `<span class="num-hint">${hint}</span>` : ''}
        </div>
      </div>
      <input class="num-input"
        type="text" inputmode="decimal"
        id="${id}"
        data-input-id="${id}"
        value="${inputVal(val)}"
        autocomplete="off">
    </div>`;
}

// ── Linha de DRE ───────────────────────────────────────────────────────────
/**
 * @param {string}  label
 * @param {string}  value   já formatado
 * @param {string}  color   CSS color
 * @param {boolean} bold
 */
export function dreRow(label, value, color = 'var(--txM)', bold = false) {
  return `
    <div class="dre-row">
      <span class="dre-label">${label}</span>
      <span class="dre-val${bold ? ' bold' : ''}" style="color:${color}">${value}</span>
    </div>`;
}

// ── Stat card ──────────────────────────────────────────────────────────────
export function statCard(label, value, color = 'var(--txM)', extraClass = '') {
  return `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-val ${extraClass}" style="color:${color}">${value}</div>
    </div>`;
}

// ── Loading skeleton ───────────────────────────────────────────────────────
export function loadingSkeleton(lines = 3) {
  return `<div class="skeleton-wrap">
    ${Array.from({ length: lines }, () => '<div class="skeleton-line"></div>').join('')}
  </div>`;
}

// ── Erro inline ───────────────────────────────────────────────────────────
export function errorBox(message) {
  return `<div class="error-box">⚠ ${message}</div>`;
}
