/**
 * config/constants.js
 * Configurações globais do front da calculadora interna.
 */

const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const API_BASE = IS_LOCAL
  ? 'http://localhost:3000'
  : 'https://darkorchid-bison-969577.hostingersite.com';

export const AUTH_TOKEN_KEY = 'via_sovrana_internal_token';

// Cores semânticas usadas nos renders
export const COLOR = Object.freeze({
  green: '#4ade80',
  blue: '#60a5fa',
  orange: '#fb923c',
  red: '#f87171',
  yellow: '#facc15',
  accent: 'var(--accent)',
});