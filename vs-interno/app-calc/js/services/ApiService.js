/**
 * services/ApiService.js
 * Camada de comunicação com o backend.
 * Todos os outros módulos importam daqui — nunca fazem fetch diretamente.
 */

import { API_BASE } from '../config/constants.js';

class ApiService {
  async #call(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res  = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `Erro ${res.status}`;
      throw new ApiError(msg, data?.error?.code, data?.error?.details, res.status);
    }

    return data;
  }

  // ── Referências ────────────────────────────────────────────────────────
  /** @returns {Promise<{cidades: object[], zonas: object[]}>} */
  getReferences() {
    return this.#call('GET', '/api/freight/references');
  }

  // ── Envio único ────────────────────────────────────────────────────────
  /**
   * @param {string} cityKey
   * @param {string} zoneKey
   * @param {number} pesoKg
   */
  quoteFreight(cityKey, zoneKey, pesoKg) {
    return this.#call('POST', '/api/freight/quote', { cityKey, zoneKey, pesoKg });
  }

  // ── Simular dia ────────────────────────────────────────────────────────
  /**
   * @param {Array<{id?, nome?, cityKey, zoneKey, pesoKg}>} clientes
   * @param {object|null} custos
   */
  simulateDay(clientes, custos = null) {
    return this.#call('POST', '/api/freight/simulate-day', { clientes, custos });
  }

  // ── Tabela ─────────────────────────────────────────────────────────────
  getPriceTable() {
    return this.#call('GET', '/api/freight/table');
  }

  // ── Proposta cliente ───────────────────────────────────────────────────
  analyzeProposal(cityKey, zoneKey, pesoKg, valorProposto, pesoTotalDia, custos = null) {
    return this.#call('POST', '/api/freight/proposal', {
      cityKey, zoneKey, pesoKg, valorProposto, pesoTotalDia, custos,
    });
  }

  // ── Custos ─────────────────────────────────────────────────────────────
  calculateCosts(params = {}) {
    return this.#call('POST', '/api/costs/calculate', params);
  }

  getCostDefaults() {
    return this.#call('GET', '/api/costs/defaults');
  }
}

export class ApiError extends Error {
  constructor(message, code, details = [], status = 500) {
    super(message);
    this.name    = 'ApiError';
    this.code    = code;
    this.details = details;
    this.status  = status;
  }
}

export const api = new ApiService();
