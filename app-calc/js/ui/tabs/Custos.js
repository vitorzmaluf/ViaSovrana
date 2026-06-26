/**
 * ui/tabs/Custos.js
 * Aba Custos — edição local em tempo real + salvar no MySQL.
 */
import { BaseTab } from '../BaseTab.js';
import { secHead, loadingSkeleton, errorBox } from '../components.js';
import { api } from '../../services/ApiService.js';
import { state } from '../../services/AppState.js';
import { fmt, fmtN, parsePtBR, inputVal } from '../../utils/format.js';
import { COLOR } from '../../config/constants.js';

const CAMPOS = [
  { id: 'kmDia', label: 'Km/dia', hint: 'rota diária' },
  { id: 'kmL', label: 'Km/L', hint: 'consumo' },
  { id: 'dieselL', label: 'Diesel R$/L', hint: 'preço litro' },
  { id: 'motorista', label: 'Motorista', hint: 'diária' },
  { id: 'seguroVeic', label: 'Seguro veículo', hint: 'dia' },
  { id: 'manutKmR', label: 'Manut. R$/km', hint: 'por km' },
  { id: 'parcelaVeic', label: 'Parcela veículo', hint: 'dia' },
  { id: 'pedagios', label: 'Pedágios', hint: 'dia' },
  { id: 'seguroCarga', label: 'Seguro carga', hint: 'dia' },
];

export default class Custos extends BaseTab {
  #defaults = {};
  #debounce = null;

  async init() {
    const { defaults } = await api.getCostDefaults();

    this.#defaults = defaults || {};

    const s = state.get('custos');

    if (!Object.keys(s.params || {}).length) {
      state.setSilent('custos', {
        params: { ...this.#defaults },
      });

      this.#syncCostsToApp(this.#defaults);
    }

    await this.#calculate();
  }

  template() {
    const s = state.get('custos');
    const r = s.result;
    const p = this.#currentParams();

    return `
      ${r ? this.#renderTotal(r, p) : ''}

      ${secHead('Custos operacionais')}

      <div class="sec-body">
        <div class="cost-grid-compact">
          ${CAMPOS.map((c) => this.#compactInput(c, p[c.id] ?? 0)).join('')}
        </div>

        <div class="cost-actions">
          <button type="button" class="calc-day-btn cost-save-btn" data-action="save-costs" ${s.saving ? 'disabled' : ''}>
            ${s.saving ? 'Salvando...' : 'Salvar custos no banco'}
          </button>

          <div class="cost-status">
            ${s.savedMessage ? s.savedMessage : 'Alterações aplicadas em tela. Salve para persistir no banco.'}
          </div>
        </div>
      </div>

      ${s.loading ? loadingSkeleton(4) : ''}
      ${s.error ? errorBox(s.error) : ''}
      ${r ? this.#renderDRE(r, p) : ''}
      ${r ? this.#renderBreakEven(r) : ''}

      <div class="formula-note">
        Alterar os campos recalcula a aba Custos e passa esses valores para simulações e propostas durante a sessão.
        Ao clicar em Salvar, os valores viram o padrão da rota no MySQL.
      </div>
    `;
  }

  #compactInput(campo, value) {
    return `
      <label class="cost-field">
        <span class="cost-label">${campo.label}</span>
        <input
          class="num-input cost-input"
          data-input-id="cs-${campo.id}"
          value="${inputVal(Number(value))}"
          inputmode="decimal"
        />
        ${campo.hint ? `<span class="cost-hint">${campo.hint}</span>` : ''}
      </label>
    `;
  }

  #currentParams() {
    const s = state.get('custos');

    return {
      ...this.#defaults,
      ...(s.params || {}),
    };
  }

  #syncCostsToApp(params) {
    state.setSilent('simularDia', {
      custos: { ...params },
      result: null,
    });

    state.setSilent('proposta', {
      result: null,
    });
  }

  #renderTotal(r, p) {
    const c = r.custos;
    const kmDia = Number(p.kmDia || 340);

    return `
      <div class="custo-total-card">
        <div class="custo-total-label">Custo total do dia</div>
        <div class="custo-total-val">${fmt(c.total)}</div>
        <div class="custo-total-sub">R$ ${fmtN(c.total / kmDia, 2)}/km · ${kmDia} km/dia</div>
      </div>
    `;
  }

  #renderDRE(r, p) {
    const c = r.custos;
    const kmDia = Number(p.kmDia || 340);
    const kmL = Number(p.kmL || 11);
    const dieselL = Number(p.dieselL || 0);
    const manutKmR = Number(p.manutKmR || 0);

    return `
      <div class="dre-card">
        <div class="dre-card-title">DRE do dia</div>

        ${[
        ['Combustível', c.diesel, `${kmDia} ÷ ${kmL} × R$ ${fmtN(dieselL, 2)}`],
        ['Motorista', c.motorista, ''],
        ['Seguro veículo', c.seguroVeic, ''],
        ['Manutenção', c.manutencao, `${kmDia} km × R$ ${fmtN(manutKmR, 2)}`],
        ['Parcela veículo', c.parcelaVeic, ''],
        ['Pedágios', c.pedagios, ''],
        ['Seguro carga', c.seguroCarga, 'RCTR-C + RC-DC'],
      ].map(([l, v, h]) => `
          <div class="dre-row">
            <div>
              <div class="dre-label">${l}</div>
              ${h ? `<div class="num-hint">${h}</div>` : ''}
            </div>
            <div class="dre-val">${fmt(v)}</div>
          </div>
        `).join('')}

        <div class="dre-row">
          <div class="dre-label">Custo total/dia</div>
          <div class="dre-val bold">${fmt(c.total)}</div>
        </div>
      </div>
    `;
  }

  #renderBreakEven(r) {
    const META_CONFIG = [
      { cor: COLOR.orange, hint: 'só cobre custo + tributos' },
      { cor: COLOR.yellow, hint: 'mínimo recomendado' },
      { cor: COLOR.green, hint: 'meta operacional' },
      { cor: COLOR.blue, hint: 'meta ideal' },
    ];

    return `
      <div class="dre-card">
        <div class="dre-card-title">Break-even diário</div>

        ${r.metas.map((m, i) => {
      const cfg = META_CONFIG[i] || META_CONFIG[0];

      return `
            <div class="dre-row">
              <div>
                <div class="dre-label">${m.metaLabel}</div>
                <div class="num-hint">${cfg.hint}</div>
              </div>
              <div class="dre-val bold" style="color:${cfg.cor}">${fmt(m.receitaNecessaria)}</div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  attachEvents(container, signal) {
    const inputIds = CAMPOS.map((c) => `cs-${c.id}`);
    const fieldMap = Object.fromEntries(CAMPOS.map((c) => [`cs-${c.id}`, c.id]));

    container.addEventListener('input', (e) => {
      const id = e.target.dataset.inputId;

      if (!inputIds.includes(id)) return;

      const s = state.get('custos');
      const nextParams = {
        ...(s.params || {}),
        [fieldMap[id]]: parsePtBR(e.target.value),
      };

      state.setSilent('custos', {
        params: nextParams,
        savedMessage: null,
      });

      this.#syncCostsToApp(nextParams);

      clearTimeout(this.#debounce);
      this.#debounce = setTimeout(() => this.#calculate(), 350);
    }, { signal });

    container.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="save-costs"]')) {
        this.#save();
      }
    }, { signal });
  }

  async #calculate() {
    const params = this.#currentParams();

    state.set('custos', {
      loading: true,
      error: null,
    });

    try {
      const result = await api.calculateCosts(params);

      state.set('custos', {
        loading: false,
        result,
      });
    } catch (err) {
      state.set('custos', {
        loading: false,
        error: err.message,
      });
    }

    this.render();
  }

  async #save() {
    const params = this.#currentParams();

    state.set('custos', {
      saving: true,
      error: null,
      savedMessage: null,
    });

    this.render();

    try {
      const response = await api.saveCostDefaults(params);
      const defaults = response.defaults || params;

      this.#defaults = defaults;

      state.setSilent('custos', {
        params: { ...defaults },
        saving: false,
        savedMessage: 'Custos salvos no banco com sucesso.',
      });

      this.#syncCostsToApp(defaults);

      await this.#calculate();
    } catch (err) {
      state.set('custos', {
        saving: false,
        error: err.message,
      });

      this.render();
    }
  }
}