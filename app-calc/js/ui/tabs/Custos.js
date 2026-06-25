/**
 * ui/tabs/Custos.js
 * Aba 5 — Custos operacionais editáveis + DRE do dia + break-even.
 */

import { BaseTab }                        from '../BaseTab.js';
import { secHead, numInput, dreRow,
         loadingSkeleton, errorBox }      from '../components.js';
import { api }                            from '../../services/ApiService.js';
import { state }                          from '../../services/AppState.js';
import { fmt, fmtN, parsePtBR }          from '../../utils/format.js';
import { COLOR }                          from '../../config/constants.js';

const CAMPOS = [
  { id: 'diesel',      label: 'Preço do diesel (R$/L)',    hint: null },
  { id: 'motorista',   label: 'Diária do motorista',       hint: null },
  { id: 'seguroVeic',  label: 'Seguro veículo/dia',        hint: '~R$ 400/mês ÷ 20 dias' },
  { id: 'manutKmR',    label: 'Manutenção por km (R$/km)', hint: '340 km × R$ 0,12' },
  { id: 'parcelaVeic', label: 'Parcela veículo/dia',       hint: 'parcela mensal ÷ 20 dias' },
  { id: 'pedagios',    label: 'Pedágios/dia',              hint: 'Corredor Castelo Branco' },
  { id: 'seguroCarga', label: 'Seguro de carga/dia',       hint: 'RCTR-C + RC-DC · obrigatório ANTT' },
];

export default class Custos extends BaseTab {

  #defaults = {};

  async init() {
    const { defaults } = await api.getCostDefaults();
    this.#defaults = defaults;
    const s = state.get('custos');
    if (!Object.keys(s.params).length) {
      state.setSilent('custos', { params: { ...defaults } });
    }
    await this.#calculate();
  }

  template() {
    const s = state.get('custos');
    const r = s.result;
    const p = { ...this.#defaults, ...s.params };

    return `
      ${r ? this.#renderTotal(r) : ''}

      ${secHead('Custos Operacionais · 340 km/dia')}
      <div class="sec-body">
        ${CAMPOS.map(c => numInput(`cs-${c.id}`, c.label, p[c.id] ?? 0, c.hint)).join('')}
      </div>

      ${s.loading ? loadingSkeleton(4) : ''}
      ${s.error   ? errorBox(s.error)  : ''}

      ${r ? this.#renderDRE(r, p) : ''}
      ${r ? this.#renderBreakEven(r) : ''}

      <div class="formula-note">
        Fórmula: Frete = taxa fixa cidade + (peso × R$ 1,54/kg) + entrega zona
        · LP 5,93% + ICMS 9,6% (crédito outorgado 20% · Decreto SP 70.292/2025 · válido até 31/12/2026).
      </div>`;
  }

  #renderTotal(r) {
    const c = r.custos;
    return `
      <div class="custo-total-card">
        <div class="custo-total-label">Custo total do dia</div>
        <div class="custo-total-val">${fmt(c.total)}</div>
        <div class="custo-total-sub">R$ ${fmtN(c.total / 340, 2)}/km</div>
      </div>`;
  }

  #renderDRE(r, p) {
    const c = r.custos;
    return `
      <div class="dre-card" style="margin-bottom:16px;">
        <div class="dre-card-title">DRE do Dia</div>
        ${[
          ['Combustível',     c.diesel,      `340 ÷ 11 × R$ ${fmtN(p.dieselL ?? p.diesel ?? 6.20, 2)}`],
          ['Motorista',       c.motorista,   ''],
          ['Seguro veículo',  c.seguroVeic,  ''],
          ['Manutenção',      c.manutencao,  '340 km × R$ 0,12'],
          ['Parcela veículo', c.parcelaVeic, ''],
          ['Pedágios',        c.pedagios,    ''],
          ['Seguro carga',    c.seguroCarga, 'RCTR-C + RC-DC'],
        ].map(([l, v, h]) => `
          <div class="dre-row">
            <div>
              <span style="color:var(--txS);font-size:12px">${l}</span>
              ${h ? `<span style="color:var(--txT);font-size:10px;margin-left:8px">${h}</span>` : ''}
            </div>
            <span style="font-family:monospace;color:${COLOR.red};font-size:12px">${fmt(v)}</span>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:10px 0 4px;">
          <span style="color:var(--ac);font-weight:700">Custo total/dia</span>
          <span style="font-family:monospace;color:var(--ac);font-weight:700;font-size:16px">${fmt(c.total)}</span>
        </div>
      </div>`;
  }

  #renderBreakEven(r) {
    const META_CONFIG = [
      { cor: COLOR.orange, hint: 'só cobre custo + tributos' },
      { cor: COLOR.yellow, hint: 'mínimo recomendado'        },
      { cor: COLOR.green,  hint: 'meta operacional'          },
      { cor: COLOR.blue,   hint: 'meta ideal'                },
    ];

    return `
      <div class="dre-card">
        <div class="dre-card-title">Break-even diário</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
          ${r.metas.map((m, i) => {
            const cfg = META_CONFIG[i] || META_CONFIG[0];
            return `
              <div style="background:var(--bgI);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;">
                <div style="font-size:10px;color:var(--txG);text-transform:uppercase;margin-bottom:2px">${m.metaLabel}</div>
                <div style="font-family:monospace;font-size:16px;font-weight:700;color:${cfg.cor}">${fmt(m.receitaNecessaria)}</div>
                <div style="font-size:10px;color:var(--txT);margin-top:2px">${cfg.hint}</div>
              </div>`;
          }).join('')}
        </div>
        <div class="formula-note" style="margin:0;">
          Receita mínima/dia para cobrir custo operacional + ICMS 9,6% + LP 5,93%.
          Para meta de 25%, com frete médio de R$ 250/envio, você precisa de
          <strong style="color:var(--ac)">
            ${Math.ceil(r.metas[2]?.receitaNecessaria / 250)} envios/dia
          </strong>.
        </div>
      </div>`;
  }

  attachEvents(container, signal) {
    const inputIds = CAMPOS.map(c => `cs-${c.id}`);
    const fieldMap = Object.fromEntries(CAMPOS.map(c => [`cs-${c.id}`, c.id]));
    let debounce;

    container.addEventListener('input', e => {
      const id = e.target.dataset.inputId;
      if (!inputIds.includes(id)) return;
      const s = state.get('custos');
      state.setSilent('custos', { params: { ...s.params, [fieldMap[id]]: parsePtBR(e.target.value) } });
      clearTimeout(debounce);
      debounce = setTimeout(() => this.#calculate(), 500);
    }, { signal });
  }

  async #calculate() {
    const s = state.get('custos');
    state.set('custos', { loading: true, error: null });

    try {
      const result = await api.calculateCosts(s.params);
      state.set('custos', { loading: false, result });
    } catch (err) {
      state.set('custos', { loading: false, error: err.message });
    }

    this.render();
  }
}
