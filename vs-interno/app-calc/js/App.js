/**
 * App.js — Entry point da calculadora interna Via Sovrana.
 * Inicializa autenticação, tema, router e estado global.
 */

import { router } from './ui/Router.js';
import { state } from './services/AppState.js';
import { TABS } from './config/tabs.js';
import { API_BASE, AUTH_TOKEN_KEY } from './config/constants.js';

class App {
  async init() {
    this.#initTheme();

    const content = document.getElementById('content');

    if (content) {
      content.innerHTML = `
        <section style="padding: 32px; opacity: .75;">
          Validando acesso...
        </section>
      `;
    }

    const isAuthenticated = await this.#checkAuth();

    if (!isAuthenticated) {
      this.#clearSession();
      this.#renderLogin();
      return;
    }

    this.#startApp();
  }

  async #checkAuth() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json().catch(() => null);

      return Boolean(data?.ok);
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      return false;
    }
  }

  async #login(username, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || 'Usuário ou senha inválidos.');
    }

    if (!data?.token) {
      throw new Error('Login realizado, mas o servidor não retornou token.');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);

    return data;
  }

  #clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);

    // Limpeza de possíveis chaves antigas usadas em testes anteriores.
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('via_sovrana_token');
  }

  #logout() {
    this.#clearSession();
    location.reload();
  }

  #startApp() {
    this.#buildTabs();

    const content = document.getElementById('content');
    const tabsEl = document.getElementById('tabs');

    if (content) {
      content.innerHTML = '';
    }

    router.init(content, tabsEl);
  }

  #buildTabs() {
    const tabsEl = document.getElementById('tabs');

    if (!tabsEl) return;

    tabsEl.innerHTML = `
      ${TABS.map(t =>
        `<button class="tab-btn" data-tab="${t.id}">${t.label}</button>`
      ).join('')}

      <button
        type="button"
        id="logoutBtn"
        style="
          margin-left: auto;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px;
          padding: 10px 14px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-weight: 700;
        ">
        Sair
      </button>
    `;

    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.#logout();
      });
    }
  }

  #renderLogin() {
    const tabsEl = document.getElementById('tabs');
    const content = document.getElementById('content');

    if (tabsEl) {
      tabsEl.innerHTML = '';
    }

    if (!content) return;

    content.innerHTML = `
      <section
        style="
          max-width: 420px;
          margin: 48px auto;
          padding: 28px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
        ">
        <div style="margin-bottom: 22px;">
          <p style="margin: 0 0 8px; opacity: .65; font-size: .8rem; text-transform: uppercase; letter-spacing: .12em;">
            Via Sovrana
          </p>
          <h2 style="margin: 0 0 8px; font-size: 1.7rem;">
            Acesso interno
          </h2>
          <p style="margin: 0; opacity: .7;">
            Faça login para acessar a calculadora de frete.
          </p>
        </div>

        <form id="loginForm" style="display: grid; gap: 14px;">
          <label style="display: grid; gap: 6px; font-weight: 700;">
            Usuário
            <input
              type="text"
              name="username"
              autocomplete="username"
              required
              style="
                width: 100%;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.16);
                padding: 13px 14px;
                font: inherit;
              ">
          </label>

          <label style="display: grid; gap: 6px; font-weight: 700;">
            Senha
            <input
              type="password"
              name="password"
              autocomplete="current-password"
              required
              style="
                width: 100%;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.16);
                padding: 13px 14px;
                font: inherit;
              ">
          </label>

          <button
            type="submit"
            id="loginSubmitBtn"
            style="
              width: 100%;
              border: 0;
              border-radius: 12px;
              padding: 14px 16px;
              background: #f0c400;
              color: #111;
              font-weight: 900;
              cursor: pointer;
              margin-top: 4px;
            ">
            Entrar
          </button>

          <p id="loginMessage" style="margin: 0; min-height: 22px; color: #ff6b6b; font-weight: 700;"></p>
        </form>
      </section>
    `;

    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const username = String(formData.get('username') || '').trim();
      const password = String(formData.get('password') || '').trim();

      if (!username || !password) {
        loginMessage.textContent = 'Informe usuário e senha.';
        return;
      }

      try {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Entrando...';
        loginMessage.textContent = 'Validando acesso...';

        await this.#login(username, password);

        const isAuthenticated = await this.#checkAuth();

        if (!isAuthenticated) {
          throw new Error('Token salvo, mas a sessão não foi validada.');
        }

        loginMessage.textContent = '';
        this.#startApp();
      } catch (error) {
        console.error(error);
        this.#clearSession();
        loginMessage.textContent = error.message || 'Usuário ou senha inválidos.';
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Entrar';
      }
    });
  }

  #initTheme() {
    const btn = document.getElementById('themeBtn');
    const s = state.get();

    const initialDark = Boolean(s?.dark);
    document.body.className = initialDark ? 'dark' : 'lite';

    if (btn) {
      btn.textContent = initialDark ? '☀ Claro' : '☾ Escuro';

      btn.addEventListener('click', () => {
        const dark = document.body.className !== 'dark';

        document.body.className = dark ? 'dark' : 'lite';
        btn.textContent = dark ? '☀ Claro' : '☾ Escuro';

        try {
          state.set('_root', { dark });
        } catch {
          // Mantém o tema visual mesmo se o AppState não tiver slice próprio para tema.
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});