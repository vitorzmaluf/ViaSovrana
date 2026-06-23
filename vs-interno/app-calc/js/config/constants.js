/**
 * config/constants.js
 * Única fonte de verdade do frontend.
 * Dados de domínio (tarifas) vêm da API — aqui ficam só referências de UI.
 */

export const API_BASE = 'http://localhost:3000'; // API_BASE para rodar local
// export const API_BASE = 'https://darkorchid-bison-969577.hostingersite.com'; // API_BASE para rodar no servidor hostinger

// Cores semânticas usadas nos renders
export const COLOR = Object.freeze({
  green:  '#4ade80',
  blue:   '#60a5fa',
  orange: '#fb923c',
  red:    '#f87171',
  yellow: '#eab308',
  accent: 'var(--ac)',
  muted:  'var(--txM)',
  faint:  'var(--txF)',
});

// Cor por zona (usada nos botões de zona)
export const ZONE_COLOR = Object.freeze({
  z1: COLOR.green,
  z2: COLOR.blue,
  z3: COLOR.orange,
  z4: COLOR.red,
});

// Pesos de referência para a tabela de preços
export const TABLE_WEIGHTS = [30, 80, 150, 300, 500];
