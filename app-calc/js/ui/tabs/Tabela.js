/**
 * ui/tabs/Tabela.js
 * Aba 3 — Tabela completa de preços por cidade × zona × peso.
 */

import { BaseTab } from '../BaseTab.js';
import { loadingSkeleton, errorBox } from '../components.js';
import { api } from '../../services/ApiService.js';
import { state } from '../../services/AppState.js';
import { refs } from '../../services/ReferenceStore.js';
import { fmt, fmtN } from '../../utils/format.js';
import { ZONE_COLOR } from '../../config/constants.js';

export default class Tabela extends BaseTab {

  async init() {
    await refs.load();
    if (!state.get('tabela').result) {
      await this.#load();
    }
  }

  template() {
    const s = state.get('tabela');

    if (s.loading) return loadingSkeleton(8);
    if (s.error) return errorBox(s.error);
    if (!s.result) return '';

    const { pesos, rows } = s.result;

    const config = state.get('calculatorConfig');
    const pricePerKg = Number(config.parameters?.pricePerKg || 0);
    const pricePerKgLabel = pricePerKg > 0
      ? `R$ ${fmtN(pricePerKg, 2)}/kg`
      : 'R$/kg configurado';

    const byCity = {};
    for (const row of rows) {
      if (!byCity[row.cityKey]) byCity[row.cityKey] = { ...row, zonas: [] };
      byCity[row.cityKey].zonas.push(row);
    }

    return `
      <div class="tabela-formula">
        Fórmula: taxa fixa + peso × ${pricePerKgLabel} + entrega zona · Calibrado com dados reais de mercado
      </div>

      ${Object.values(byCity).map(cidade => `
        <div class="tabela-cidade">
          <div class="tabela-cidade-head">
            <span class="tabela-cidade-label">${cidade.cidade}</span>
            <span class="tabela-cidade-km">${cidade.km} km de SP</span>
            <span class="tabela-cidade-taxa">taxa fixa: ${fmt(refs.cidade(cidade.cityKey)?.taxaFixa ?? 0)}</span>
          </div>

          <div class="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entrega</th>
                  ${pesos.map(p => `<th>${p}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${cidade.zonas.map(zona => {
      const cor = ZONE_COLOR[zona.zoneKey] || 'var(--ac)';
      return `
                    <tr>
                      <td>
                        <span style="color:${cor};font-weight:700">
                          ${refs.zona(zona.zoneKey)?.label?.split('—')[0]?.trim() ?? zona.zoneKey.toUpperCase()}
                        </span>
                        <span class="tabela-zona-taxa">+${fmt(refs.zona(zona.zoneKey)?.taxa ?? 0)}</span>
                      </td>
                      ${pesos.map(p => `<td>${fmt(zona.precos[p])}</td>`).join('')}
                    </tr>`;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>`).join('')}`;
  }

  async #load() {
    state.set('tabela', { loading: true, error: null });
    this.render();
    try {
      const result = await api.getPriceTable();
      state.set('tabela', { loading: false, result });
    } catch (err) {
      state.set('tabela', { loading: false, error: err.message });
    }
    this.render();
  }

  attachEvents(container, signal) {
    // Tabela é somente leitura
  }
}
