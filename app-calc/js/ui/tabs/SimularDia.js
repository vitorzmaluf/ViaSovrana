/**
 * ui/tabs/SimularDia.js
 * Aba 2 — Simula múltiplos clientes num mesmo dia.
 */

import { BaseTab } from '../BaseTab.js';
import {
  secHead, loadingSkeleton,
  errorBox, statCard
} from '../components.js';
import { api } from '../../services/ApiService.js';
import { state } from '../../services/AppState.js';
import { refs } from '../../services/ReferenceStore.js';
import {
  fmt, fmtN, fmtPct, parsePtBR,
  inputVal
} from '../../utils/format.js';
import { COLOR } from '../../config/constants.js';

export default class SimularDia extends BaseTab {

  async init() {
    await refs.load();
  }

  template() {
    const s = state.get('simularDia');
    const r = s.result;

    return `
      ${this.#renderSummary(r)}
      ${s.loading ? loadingSkeleton(2) : ''}
      ${s.error ? errorBox(s.error) : ''}

      <div id="sd-clientes">
        ${s.clientes.map(c => this.#renderClienteRow(c, r)).join('')}
      </div>

      <button class="add-btn" data-action="add-cliente">+ Adicionar cliente</button>

      ${s.clientes.length > 0 && !s.loading ? `
        <button class="calc-day-btn" data-action="calcular-dia">
          ↻ Calcular dia
        </button>` : ''}

      ${r && r.resumo.pesoTotal < 250 ? `
        <div class="warn">⚠ Peso total abaixo de 250 kg — margem reduzida.</div>` : ''}`;
  }

  #renderSummary(r) {
    if (!r) {
      return `<div class="grid5 summary-cards" style="margin-bottom:20px;">
        ${statCard('Peso total', '—', COLOR.blue, 'sd-peso')}
        ${statCard('Receita', '—', COLOR.green, 'sd-receita')}
        ${statCard('Tributos', '—', COLOR.orange, 'sd-tributos')}
        ${statCard('Lucro', '—', COLOR.muted, 'sd-lucro')}
        ${statCard('Margem', '—', COLOR.muted, 'sd-margem')}
      </div>`;
    }
    const rs = r.resumo;
    return `<div class="grid5 summary-cards" style="margin-bottom:20px;">
      ${statCard('Peso total', rs.pesoTotal + ' kg', COLOR.blue, 'sd-peso')}
      ${statCard('Receita', fmt(rs.receitaTotal), COLOR.green, 'sd-receita')}
      ${statCard('Tributos', fmt(rs.tributosTotal), COLOR.orange, 'sd-tributos')}
      ${statCard('Lucro', fmt(rs.lucroTotal), rs.lucroTotal >= 0 ? 'var(--ac)' : COLOR.red, 'sd-lucro')}
      ${statCard('Margem', fmtPct(rs.margemDia), rs.margemDia >= 0.25 ? COLOR.green : COLOR.red, 'sd-margem')}
    </div>`;
  }


  #renderClienteRow(c, result) {
    const clientResult = result?.clientes?.find(r => r.id === c.id);

    return `
      <div class="cliente-row" data-cliente-id="${c.id}">
        <div class="cliente-grid">
          <div>
            <div class="field-label">Origem</div>
            <select data-cliente-field="cityKey" data-cliente-id="${c.id}">
              ${refs.cidades.map(cidade => `
                <option value="${cidade.key}" ${c.cityKey === cidade.key ? 'selected' : ''}>
                  ${cidade.label}
                </option>`).join('')}
            </select>
          </div>
          <div>
            <div class="field-label">Entrega SP</div>
            <select data-cliente-field="zoneKey" data-cliente-id="${c.id}">
              ${refs.zonas.map(zona => `
                <option value="${zona.key}" ${c.zoneKey === zona.key ? 'selected' : ''}>
                  ${zona.label} — ${fmt(zona.taxa)}
                </option>`).join('')}
            </select>
          </div>
          <div>
            <div class="field-label">Peso (kg)</div>
            <input type="text" inputmode="decimal"
              value="${inputVal(c.pesoKg)}"
              data-cliente-field="pesoKg"
              data-cliente-id="${c.id}"
              autocomplete="off">
          </div>
          <button class="rem-btn" data-action="remover-cliente" data-cliente-id="${c.id}">✕</button>
        </div>

        ${clientResult ? `
          <div class="cliente-footer">
            <span style="font-family:monospace;font-size:16px;font-weight:700;color:var(--ac)">
              ${fmt(clientResult.freteBruto)}
            </span>
            <span style="font-size:11px;color:var(--txG)">
              R$ ${fmtN(clientResult.rKgEfetivo, 2)}/kg
            </span>
            <span style="font-size:11px;color:var(--txG)">
              Margem:
              <span style="color:${clientResult.margem >= 0.25 ? COLOR.green : COLOR.red}">
                ${fmtPct(clientResult.margem)}
              </span>
            </span>
            <span style="font-size:11px;color:var(--txG)">
              Lucro: <span style="color:var(--txS)">${fmt(clientResult.lucro)}</span>
            </span>
          </div>` : ''}
      </div>`;
  }

  attachEvents(container, signal) {
    container.addEventListener('click', e => {
      // Adicionar cliente
      if (e.target.closest('[data-action="add-cliente"]')) {
        const s = state.get('simularDia');
        state.set('simularDia', {
          clientes: [...s.clientes, { id: s.nextId, cityKey: 'sorocaba', zoneKey: 'z1', pesoKg: 80 }],
          nextId: s.nextId + 1,
          result: null,
        });
        this.calculateAndRender();
        return;
      }

      // Remover cliente
      const remBtn = e.target.closest('[data-action="remover-cliente"]');
      if (remBtn) {
        const id = Number(remBtn.dataset.clienteId);
        const s = state.get('simularDia');
        state.set('simularDia', {
          clientes: s.clientes.filter(c => c.id !== id),
          result: null,
        });
        this.calculateAndRender();
        return;
      }

      // Calcular dia
      if (e.target.closest('[data-action="calcular-dia"]')) {
        this.#calculate();
        return;
      }
    }, { signal });

    container.addEventListener('change', e => {
      const el = e.target;
      const field = el.dataset.clienteField;
      const id = Number(el.dataset.clienteId);
      if (!field || !id) return;

      const s = state.get('simularDia');
      const val = field === 'pesoKg'
        ? Math.max(1, parsePtBR(el.value, 1))
        : el.value;

      state.set('simularDia', {
        clientes: s.clientes.map(c => c.id === id ? { ...c, [field]: val } : c),
        result: null,
      });
      this.render();
    }, { signal });
  }

  async #calculate() {
    const s = state.get('simularDia');
    if (!s.clientes.length) return;

    state.set('simularDia', { loading: true, error: null });
    this.render();

    try {
      const result = await api.simulateDay(s.clientes, s.custos);
      state.set('simularDia', { loading: false, result });
    } catch (err) {
      state.set('simularDia', { loading: false, error: err.message });
    }

    this.render();
  }

  async calculateAndRender() {
    this.render();
    await this.#calculate();
  }
}
