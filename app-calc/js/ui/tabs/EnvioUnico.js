/**
 * ui/tabs/EnvioUnico.js
 * Aba 1 — Calcula frete de um envio isolado.
 */

import { BaseTab }                              from '../BaseTab.js';
import { secHead, cityButtons, zoneButtons,
         numInput, dreRow, loadingSkeleton,
         errorBox }                             from '../components.js';
import { api }                                  from '../../services/ApiService.js';
import { state }                                from '../../services/AppState.js';
import { refs }                                 from '../../services/ReferenceStore.js';
import { fmt, fmtN, fmtPct, parsePtBR }        from '../../utils/format.js';
import { COLOR }                                from '../../config/constants.js';
import SimularDia                               from './SimularDia.js';

export default class EnvioUnico extends BaseTab {

  async init() {
    await refs.load();
  }

  template() {
    const s = state.get('envioUnico');
    return `
      <div class="grid2">
        <div>
          ${secHead('Origem')}
          <div class="sec-body">
            ${cityButtons(refs.cidades, s.cityKey, 'city-pick')}
          </div>

          ${secHead('Destino em SP')}
          <div class="sec-body">
            ${zoneButtons(refs.zonas, s.zoneKey, 'zone-pick')}
            ${(() => {
              const z = refs.zona(s.zoneKey);
              return z ? `<div class="zone-desc">${z.label}</div>` : '';
            })()}
          </div>

          ${secHead('Peso')}
          <div class="sec-body">
            ${numInput('eu-peso', 'Peso do envio (kg)', s.pesoKg)}
          </div>
        </div>

        <div id="eu-result">
          ${s.loading ? loadingSkeleton(6)   : ''}
          ${s.error   ? errorBox(s.error)    : ''}
          ${s.result  ? this.#renderResult(s) : this.#renderPlaceholder()}
        </div>
      </div>`;
  }

  #renderPlaceholder() {
    return `
      <div class="result-placeholder">
        <div class="placeholder-icon">→</div>
        <div class="placeholder-text">Preencha o peso para calcular</div>
      </div>`;
  }

  #renderResult(s) {
    const r   = s.result;
    const cor = r.freteliquido >= 0 ? COLOR.green : COLOR.red;

    return `
      <div class="result-box">
        <div class="result-label">Frete cobrado</div>
        <div class="result-price">${fmt(r.freteBruto)}</div>

        <div class="grid4" style="margin-top:12px;">
          <div class="stat-card">
            <div class="stat-label">R$/kg efetivo</div>
            <div class="stat-val" style="font-size:13px;color:var(--txM)">R$ ${fmtN(r.rKgEfetivo,2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Taxa fixa</div>
            <div class="stat-val" style="font-size:13px;color:var(--txM)">${fmt(r.composicao.taxaFixa)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Entrega</div>
            <div class="stat-val" style="font-size:13px;color:var(--txM)">${fmt(r.composicao.taxaZona)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Tributos</div>
            <div class="stat-val" style="font-size:13px;color:var(--txM)">15,53%</div>
          </div>
        </div>

        <button class="add-to-day-btn" data-action="add-to-day">
          + Adicionar ao Simular Dia
        </button>
      </div>

      <div class="dre-card">
        <div class="dre-card-title">Composição · Impacto tributário</div>
        ${dreRow('Taxa fixa cidade',                  fmt(r.composicao.taxaFixa), COLOR.muted)}
        ${dreRow(`Carga (${r.pesoKg} kg × R$ 1,54)`, fmt(r.composicao.carga),    COLOR.muted)}
        ${dreRow('Entrega zona',                      fmt(r.composicao.taxaZona), COLOR.muted)}
        ${dreRow('Frete cobrado',                     fmt(r.freteBruto),           COLOR.green)}
        ${dreRow('(−) ICMS 9,6% (crédito outorgado)', fmt(r.icms),               COLOR.orange)}
        ${dreRow('(−) LP 5,93%',                      fmt(r.lp),                  COLOR.orange)}
        ${dreRow('Receita líquida',                   fmt(r.freteliquido),         'var(--ac)', true)}
        ${dreRow('Margem bruta s/ tributos',          fmtPct(r.freteliquido / r.freteBruto), cor, true)}
      </div>`;
  }

  attachEvents(container, signal) {
    // Cidade
    container.addEventListener('click', e => {
      const key = e.target.closest('[data-city-pick]')?.dataset.cityPick;
      if (!key) return;
      state.set('envioUnico', { cityKey: key, result: null });
      this.render();
      this.#autoCalculate();
    }, { signal });

    // Zona
    container.addEventListener('click', e => {
      const key = e.target.closest('[data-zone-pick]')?.dataset.zonePick;
      if (!key) return;
      state.set('envioUnico', { zoneKey: key, result: null });
      this.render();
      this.#autoCalculate();
    }, { signal });

    // Peso com debounce
    let debounce;
    container.addEventListener('input', e => {
      const el = e.target.closest('[data-input-id="eu-peso"]');
      if (!el) return;
      state.setSilent('envioUnico', { pesoKg: parsePtBR(el.value) });
      clearTimeout(debounce);
      debounce = setTimeout(() => this.#autoCalculate(), 400);
    }, { signal });

    // Adicionar ao Simular Dia
    container.addEventListener('click', e => {
      if (!e.target.closest('[data-action="add-to-day"]')) return;
      const s   = state.get('envioUnico');
      const dia = state.get('simularDia');
      state.set('simularDia', {
        clientes: [...dia.clientes, {
          id:      dia.nextId,
          cityKey: s.cityKey,
          zoneKey: s.zoneKey,
          pesoKg:  s.pesoKg,
        }],
        nextId: dia.nextId + 1,
        result: null,
      });
      new SimularDia().calculateAndRender();
    }, { signal });
  }

  async #autoCalculate() {
    const s = state.get('envioUnico');
    if (!s.pesoKg || s.pesoKg <= 0) return;

    state.set('envioUnico', { loading: true, error: null });
    this.#updateResult();

    try {
      const result = await api.quoteFreight(s.cityKey, s.zoneKey, s.pesoKg);
      state.set('envioUnico', { loading: false, result });
    } catch (err) {
      state.set('envioUnico', { loading: false, error: err.message });
    }

    this.#updateResult();
  }

  #updateResult() {
    const el = this.$('#eu-result');
    if (!el) return;
    const s = state.get('envioUnico');
    if (s.loading) { el.innerHTML = loadingSkeleton(6);    return; }
    if (s.error)   { el.innerHTML = errorBox(s.error);     return; }
    if (s.result)  { el.innerHTML = this.#renderResult(s); return; }
    el.innerHTML = this.#renderPlaceholder();
  }
}
