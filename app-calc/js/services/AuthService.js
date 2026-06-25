import { API_BASE, AUTH_TOKEN_KEY } from '../config/constants.js';

class AuthService {
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.reload();
  }

  async login(username, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao fazer login.');
    }

    this.setToken(data.token);

    return data;
  }

  async me() {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    return response.json();
  }
}

export const authService = new AuthService();