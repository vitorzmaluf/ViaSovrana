/**
 * App.js — Entry point da calculadora interna Via Sovrana.
 * Inicializa tema, router e estado global.
 */

import { router } from './ui/Router.js';
import { state }  from './services/AppState.js';
import { TABS }   from './config/tabs.js';

class App {
  init() {
    this.#buildTabs();
    this.#initTheme();

    const content = document.getElementById('content');
    const tabsEl  = document.getElementById('tabs');
    router.init(content, tabsEl);
  }

  #buildTabs() {
    const tabsEl = document.getElementById('tabs');
    tabsEl.innerHTML = TABS.map(t =>
      `<button class="tab-btn" data-tab="${t.id}">${t.label}</button>`
    ).join('');
  }

  #initTheme() {
    const btn = document.getElementById('themeBtn');
    const s   = state.get();

    document.body.className = s.dark ? 'dark' : 'lite';

    btn.addEventListener('click', () => {
      const dark = !state.get().dark;
      // dark não é um slice, atualiza direto
      state.set('_root', { dark }); // workaround — na prática pode usar um campo no body
      document.body.className = dark ? 'dark' : 'lite';
      btn.textContent = dark ? '☀ Claro' : '☾ Escuro';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new App().init());
