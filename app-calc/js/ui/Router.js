/**
 * ui/Router.js
 * Gerencia qual aba está ativa, faz lazy load dos módulos
 * e conecta o estado global ao re-render.
 */

import { TABS, DEFAULT_TAB } from '../config/tabs.js';
import { state }             from '../services/AppState.js';
import { $, $$ }             from '../utils/dom.js';

class Router {
  #activeTab   = null;
  #activeId    = null;
  #content     = null;
  #tabsEl      = null;
  #moduleCache = new Map();  // evita re-importar o mesmo módulo

  init(contentEl, tabsEl) {
    this.#content = contentEl;
    this.#tabsEl  = tabsEl;

    // Escuta cliques nos botões de aba
    tabsEl.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      this.navigate(btn.dataset.tab);
    });

    // Navega para a aba padrão
    this.navigate(DEFAULT_TAB);
  }

  async navigate(tabId) {
    if (tabId === this.#activeId) return;

    const tab = TABS.find(t => t.id === tabId);
    if (!tab) { console.warn(`Aba "${tabId}" não encontrada`); return; }

    // Desmonta aba atual
    this.#activeTab?.unmount();

    // Atualiza botões
    $$('.tab-btn', this.#tabsEl).forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabId)
    );

    // Lazy load do módulo
    let TabClass;
    if (this.#moduleCache.has(tabId)) {
      TabClass = this.#moduleCache.get(tabId);
    } else {
      const mod = await tab.module();
      TabClass  = mod.default;
      this.#moduleCache.set(tabId, TabClass);
    }

    // Monta nova aba
    this.#activeId  = tabId;
    this.#activeTab = new TabClass();
    await this.#activeTab.mount(this.#content);

    // Re-render quando o estado da aba muda
    const stateKey = tabId.replace('-', '');  // 'envio-unico' → 'enviounico' (não usado diretamente)
    // O subscriber é gerenciado pela própria aba via BaseTab
  }
}

export const router = new Router();
