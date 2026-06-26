/**
 * ui/tabs/Proposta.js
 * Aba 4 — Análise de proposta de preço recebida de um cliente.
 */

import { BaseTab } from '../BaseTab.js';
import {
  secHead, cityButtons, zoneButtons,
  numInput, dreRow, loadingSkeleton,
  errorBox
} from '../components.js';
import { api } from '../../services/ApiService.js';
import { state } from '../../services/AppState.js';
import { refs } from '../../services/ReferenceStore.js';
import { fmt, fmtN, fmtPct, parsePtBR } from '../../utils/format.js';
import { COLOR } from '../../config/constants.js';

const VERDICT_CONFIG = {
  accept: { cor: COLOR.green, icon: '✓', label: 'Aceite — valor acima da tabela' },
  viable: { cor: COLOR.yellow, icon: '~', label: 'Viável — dentro da margem mínima' },
  negotiate: { cor: COLOR.orange, icon: '!', label: 'Negocie — abaixo do recomendado' },
  refuse: { cor: COLOR.red, icon: '✗', label: 'Recuse — não cobre custos operacionais' },
};

export default class Proposta extends BaseTab {

  async init() {
    await refs.load();
  }

  template() {
    const s = state.get('proposta');

    return `
      <div class="grid2">
        <div>
          ${secHead('Dados do envio')}
          <div class="sec-body">
            <div style="margin-bottom:14px;">
              <div class="field-label" style="margin-bottom:8px;">Cidade de coleta</div>
              ${cityButtons(refs.cidades, s.cityKey, 'city-pick')}
            </div>
            <div style="margin-bottom:14px;">
              <div class="field-label" style="margin-bottom:8px;">Zona de entrega</div>
              ${zoneButtons(refs.zonas, s.zoneKey, 'zone-pick')}
            </div>
            ${numInput('pr-peso', 'Peso do envio (kg)', s.pesoKg)}
          </div>

          ${secHead('Proposta do cliente')}
          <div class="sec-body">
            ${numInput('pr-proposta', 'Valor proposto pelo cliente (R$)', s.valorProposto)}
          </div>

          ${secHead('Base de rateio')}
          <div class="sec-body">
            ${numInput('pr-pesoDia', 'Peso total estimado do dia (kg)', s.pesoTotalDia, 'para ratear o custo operacional')}
          </div>

          <button class="calc-day-btn" data-action="analisar" style="margin-top:8px;">
            Analisar proposta
          </button>
        </div>

        <div id="pr-result">
          ${s.loading ? loadingSkeleton(8) : ''}
          ${s.error ? errorBox(s.error) : ''}
          ${s.result ? this.#renderResult(s) : this.#renderPlaceholder()}
        </div>
      </div>`;
  }

  #renderPlaceholder() {
    return `
      <div class="result-placeholder">
        <div class="placeholder-icon">?</div>
        <div class="placeholder-text">Preencha os dados e clique em Analisar</div>
      </div>`;
  }

  #renderResult(s) {
    const r = s.result;
    const vc = VERDICT_CONFIG[r.verdito] ?? VERDICT_CONFIG.refuse;

    const desconto = r.frete.bruto - r.valorProposto;
    const descontoPct = r.frete.bruto > 0 ? desconto / r.frete.bruto : 0;

    return `
      <div class="verdict-box" style="background:${vc.cor}11;border:1px solid ${vc.cor}66;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div class="verdict-icon" style="background:${vc.cor}22;border:2px solid ${vc.cor};color:${vc.cor}">
            ${vc.icon}
          </div>
          <div style="font-size:13px;font-weight:700;color:${vc.cor}">${vc.label}</div>
        </div>

        <div class="grid2x2">
          ${[
        ['Proposta', fmt(r.valorProposto), COLOR.muted],
        ['Nossa tabela', fmt(r.frete.bruto), COLOR.blue],
        ['Diferença', (desconto >= 0 ? '−' : '+') + fmt(Math.abs(desconto)), desconto > 0 ? COLOR.red : COLOR.green],
        ['Desconto', fmtPct(descontoPct), desconto > 0 ? COLOR.red : COLOR.green],
      ].map(([l, v, c]) => `
            <div style="background:var(--bgI);border-radius:6px;padding:10px 12px;">
              <div style="font-size:10px;color:var(--txG);text-transform:uppercase;margin-bottom:3px">${l}</div>
              <div style="font-family:monospace;font-size:15px;font-weight:700;color:${c}">${v}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="dre-card" style="margin-bottom:14px;">
        <div class="dre-card-title">Se aceitar esta proposta</div>
        ${dreRow('Proposta recebida', fmt(r.valorProposto), COLOR.green)}
        ${dreRow('(−) ICMS 9,6% (crédito outorgado)', fmt(r.frete.tributos * (0.096 / 0.1553)), COLOR.orange)}
        ${dreRow('(−) LP 5,93%', fmt(r.frete.tributos * (0.0593 / 0.1553)), COLOR.orange)}
        ${dreRow('(−) Custo rateado', fmt(r.custoRateado), COLOR.red)}
        ${dreRow('Lucro', fmt(r.lucroSeProposta), r.lucroSeProposta >= 0 ? 'var(--ac)' : COLOR.red, true)}
        ${dreRow('Margem', fmtPct(r.margemSeProposta), r.margemSeProposta >= 0.2 ? COLOR.green : r.margemSeProposta >= 0 ? COLOR.orange : COLOR.red, true)}
      </div>

      <div class="dre-card">
        <div class="dre-card-title">Referências</div>
        ${[
        ['Nossa tabela', fmt(r.frete.bruto), 'margem máxima', COLOR.blue],
        ['Mínimo absoluto', fmt(r.minimoAbs), 'só cobre custo + impostos', COLOR.orange],
        ['Mínimo recomendado +15%', fmt(r.minimoRec), 'margem mínima aceitável', 'var(--ac)'],
      ].map(([l, v, h, c]) => `
          <div class="ref-row">
            <div>
              <div class="ref-row-label">${l}</div>
              <div class="ref-row-hint">${h}</div>
            </div>
            <span style="font-family:monospace;font-size:14px;font-weight:700;color:${c}">${v}</span>
          </div>`).join('')}

        <div class="contra-box">
          <div class="contra-label">Contraproposta sugerida</div>
          <div class="contra-val">${fmt(r.contraproposta)}</div>
          <div style="font-size:11px;color:var(--txF);margin-top:4px">
            Valor da tabela cheia para ${r.frete.cidade}
          </div>
        </div>
      </div>`;
  }

  attachEvents(container, signal) {
    container.addEventListener('click', e => {
      const cityKey = e.target.closest('[data-city-pick]')?.dataset.cityPick;
      if (cityKey) {
        state.set('proposta', { cityKey, result: null });
        this.render();
        return;
      }

      const zoneKey = e.target.closest('[data-zone-pick]')?.dataset.zonePick;
      if (zoneKey) {
        state.set('proposta', { zoneKey, result: null });
        this.render();
        return;
      }

      if (e.target.closest('[data-action="analisar"]')) {
        this.#analyze();
        return;
      }
    }, { signal });

    const inputMap = {
      'pr-peso': 'pesoKg',
      'pr-proposta': 'valorProposto',
      'pr-pesoDia': 'pesoTotalDia',
    };
    container.addEventListener('input', e => {
      const id = e.target.dataset.inputId;
      if (!inputMap[id]) return;
      state.setSilent('proposta', { [inputMap[id]]: parsePtBR(e.target.value), result: null });
    }, { signal });
  }

  async #analyze() {
    const s = state.get('proposta');
    state.set('proposta', { loading: true, error: null });
    this.#updateResult();

    try {
      const costState = state.get('custos');
      const custos =
        costState.params && Object.keys(costState.params).length
          ? costState.params
          : null;

      const result = await api.analyzeProposal(
        s.cityKey,
        s.zoneKey,
        s.pesoKg,
        s.valorProposto,
        s.pesoTotalDia,
        custos
      );
      state.set('proposta', { loading: false, result });
    } catch (err) {
      state.set('proposta', { loading: false, error: err.message });
    }

    this.#updateResult();
  }

  #updateResult() {
    const el = this.$('#pr-result');
    if (!el) return;
    const s = state.get('proposta');
    if (s.loading) { el.innerHTML = loadingSkeleton(8); return; }
    if (s.error) { el.innerHTML = errorBox(s.error); return; }
    if (s.result) { el.innerHTML = this.#renderResult(s); return; }
    el.innerHTML = this.#renderPlaceholder();
  }
}
