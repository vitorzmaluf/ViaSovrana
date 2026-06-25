/**
 * utils/format.js
 * Formatadores de valores para exibição.
 */

export const fmt = v =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export const fmtN = (v, d = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtPct = (v, d = 1) => fmtN(v * 100, d) + '%';

export const fmtKg = v => v + ' kg';

/**
 * Faz parse de número no formato pt-BR (vírgula como decimal).
 * Aceita "1.234,56" e "1234,56" e "1234.56".
 */
export function parsePtBR(val, fallback = 0) {
  const cleaned = String(val)
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function inputVal(val) {
  return Number.isFinite(val) ? String(val).replace('.', ',') : '';
}
