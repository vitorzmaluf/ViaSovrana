/**
 * services/ReferenceStore.js
 * Cache singleton das referências de domínio (cidades e zonas).
 * Carregadas uma vez da API e reutilizadas por todos os módulos.
 */

import { api } from './ApiService.js';

class ReferenceStore {
  #cidades = null;
  #zonas   = null;
  #promise = null;

  async load() {
    if (this.#cidades) return;                // já carregado
    if (this.#promise) return this.#promise;  // em andamento

    this.#promise = api.getReferences().then(data => {
      this.#cidades = data.cidades;
      this.#zonas   = data.zonas;
    });

    return this.#promise;
  }

  get cidades() { return this.#cidades ?? []; }
  get zonas()   { return this.#zonas   ?? []; }

  cidade(key) { return this.#cidades?.find(c => c.key === key); }
  zona(key)   { return this.#zonas?.find(z => z.key === key);   }
}

export const refs = new ReferenceStore();
